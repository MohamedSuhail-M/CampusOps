import prisma from '../prisma';

export interface InventoryItemWithAvailability {
  id: string;
  sku: string;
  name: string;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  activeReservedQuantity: number;
  availableQuantity: number;
  isLowStock: boolean;
}

/**
 * Calculates current available inventory accounting for active reservations.
 * Available = quantityOnHand - sum(active reservations)
 */
export async function getInventoryLedger(): Promise<InventoryItemWithAvailability[]> {
  const items = await prisma.inventoryItem.findMany({
    include: {
      stockReservations: {
        where: { status: 'ACTIVE' },
      },
    },
    orderBy: { sku: 'asc' },
  });

  return items.map((item) => {
    const activeReservedQuantity = item.stockReservations.reduce((sum, res) => sum + res.quantity, 0);
    const availableQuantity = Math.max(0, item.quantityOnHand - activeReservedQuantity);
    const isLowStock = item.quantityOnHand <= item.reorderLevel;

    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
      activeReservedQuantity,
      availableQuantity,
      isLowStock,
    };
  });
}

/**
 * Gets real-time availability for a single item.
 */
export async function getItemAvailability(itemId: string): Promise<InventoryItemWithAvailability | null> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      stockReservations: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!item) return null;

  const activeReservedQuantity = item.stockReservations.reduce((sum, res) => sum + res.quantity, 0);
  const availableQuantity = Math.max(0, item.quantityOnHand - activeReservedQuantity);
  const isLowStock = item.quantityOnHand <= item.reorderLevel;

  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    unit: item.unit,
    quantityOnHand: item.quantityOnHand,
    reorderLevel: item.reorderLevel,
    activeReservedQuantity,
    availableQuantity,
    isLowStock,
  };
}

/**
 * Transactionally reserves stock for a work order.
 * Prevents over-reservation and guarantees stock cannot become negative.
 */
export async function reserveStock(params: {
  itemId: string;
  workOrderId: string;
  quantity: number;
  actorId?: string;
}) {
  const { itemId, workOrderId, quantity, actorId } = params;

  if (quantity <= 0) {
    throw new Error('Reservation quantity must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        stockReservations: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!item) {
      throw new Error(`Inventory item '${itemId}' not found.`);
    }

    const currentReserved = item.stockReservations.reduce((sum, res) => sum + res.quantity, 0);
    const available = item.quantityOnHand - currentReserved;

    if (available < quantity) {
      throw new Error(
        `Insufficient available stock for '${item.name}' (${item.sku}). Requested: ${quantity}, Available: ${available} (On hand: ${item.quantityOnHand}, Active reservations: ${currentReserved})`
      );
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const reservationId = `RSV-${timestamp}-${randomSuffix}`;

    const reservation = await tx.stockReservation.create({
      data: {
        id: reservationId,
        itemId,
        workOrderId,
        quantity,
        status: 'ACTIVE',
      },
    });

    // Record audit log
    if (actorId) {
      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId,
          entityType: 'stock_reservations',
          entityId: reservationId,
          action: 'RESERVE',
          beforeJson: null,
          afterJson: JSON.stringify({ itemId, workOrderId, quantity, status: 'ACTIVE' }),
          createdAt: new Date(),
        },
      });
    }

    return reservation;
  });
}

/**
 * Consumes an active stock reservation when technician uses the part.
 * Transactionally decrements physical quantity_on_hand and creates a stock movement.
 */
export async function consumeStockReservation(reservationId: string, actorId?: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.findUnique({
      where: { id: reservationId },
      include: { item: true, workOrder: true },
    });

    if (!reservation) {
      throw new Error(`Stock reservation '${reservationId}' not found.`);
    }

    if (reservation.status !== 'ACTIVE') {
      throw new Error(`Reservation is already '${reservation.status}' and cannot be consumed.`);
    }

    // Decrement physical stock on hand
    const updatedItem = await tx.inventoryItem.update({
      where: { id: reservation.itemId },
      data: {
        quantityOnHand: {
          decrement: reservation.quantity,
        },
      },
    });

    if (updatedItem.quantityOnHand < 0) {
      throw new Error(`Integrity violation: Stock on hand for ${updatedItem.sku} cannot be negative.`);
    }

    // Mark reservation as CONSUMED
    const updatedReservation = await tx.stockReservation.update({
      where: { id: reservationId },
      data: { status: 'CONSUMED' },
    });

    // Record stock movement ledger
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    await tx.stockMovement.create({
      data: {
        id: `MVT-${timestamp}-${randomSuffix}`,
        itemId: reservation.itemId,
        quantityDelta: -reservation.quantity,
        reason: 'WORK_ORDER_CONSUMPTION',
        referenceId: reservation.workOrderId,
        createdAt: new Date(),
      },
    });

    // Audit log
    if (actorId) {
      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId,
          entityType: 'stock_reservations',
          entityId: reservationId,
          action: 'CONSUME',
          beforeJson: JSON.stringify({ status: 'ACTIVE' }),
          afterJson: JSON.stringify({ status: 'CONSUMED', consumedQuantity: reservation.quantity }),
          createdAt: new Date(),
        },
      });
    }

    return { reservation: updatedReservation, remainingOnHand: updatedItem.quantityOnHand };
  });
}

/**
 * Releases/cancels an active reservation without changing physical stock.
 */
export async function releaseStockReservation(reservationId: string, actorId?: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error(`Stock reservation '${reservationId}' not found.`);
    }

    if (reservation.status !== 'ACTIVE') {
      throw new Error(`Reservation is in '${reservation.status}' status and cannot be released.`);
    }

    const updated = await tx.stockReservation.update({
      where: { id: reservationId },
      data: { status: 'RELEASED' },
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    if (actorId) {
      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId,
          entityType: 'stock_reservations',
          entityId: reservationId,
          action: 'RELEASE',
          beforeJson: JSON.stringify({ status: 'ACTIVE' }),
          afterJson: JSON.stringify({ status: 'RELEASED' }),
          createdAt: new Date(),
        },
      });
    }

    return updated;
  });
}
