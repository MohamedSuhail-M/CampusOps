import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import {
  getInventoryLedger,
  getItemAvailability,
  reserveStock,
  consumeStockReservation,
  releaseStockReservation,
} from '../../services/inventory.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/inventory or /api/inventory/items
 * Returns inventory ledger with live computed availability and low stock alerts.
 */
router.get(['/', '/items'], async (req: Request, res: Response) => {
  try {
    const items = await getInventoryLedger();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/inventory/movements
 * Returns stock movement history.
 */
router.get('/movements', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.query;
    const movements = await prisma.stockMovement.findMany({
      where: itemId ? { itemId: String(itemId) } : undefined,
      include: {
        item: {
          select: { id: true, sku: true, name: true, unit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: movements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/inventory/:id
 * Returns single item details, active reservations, and movement history.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const availability = await getItemAvailability(id);

    if (!availability) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Item '${id}' not found.` } });
      return;
    }

    const reservations = await prisma.stockReservation.findMany({
      where: { itemId: id },
      include: {
        workOrder: {
          select: { id: true, status: true, incidentId: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    const recentMovements = await prisma.stockMovement.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: {
        ...availability,
        reservations,
        recentMovements,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

const reserveSchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
  workOrderId: z.string().min(1, 'workOrderId is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

/**
 * POST /api/inventory/reserve
 * Transactionally reserves stock for a work order.
 * Accessible by TECHNICIAN, FACILITIES_ADMIN, PROCUREMENT_MANAGER, SYSTEM_ADMIN.
 */
router.post(
  '/reserve',
  requireRole(['TECHNICIAN', 'FACILITIES_ADMIN', 'PROCUREMENT_MANAGER', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const parsed = reserveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
        return;
      }

      const reservation = await reserveStock({
        itemId: parsed.data.itemId,
        workOrderId: parsed.data.workOrderId,
        quantity: parsed.data.quantity,
        actorId: (req as any).user?.id,
      });

      res.status(201).json({
        success: true,
        message: 'Stock reservation created successfully.',
        data: reservation,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'RESERVATION_FAILED', message: err.message },
      });
    }
  }
);

/**
 * POST /api/inventory/reservations/:id/consume
 * Consumes reserved stock for a work order and decrements physical quantity_on_hand.
 */
router.post(
  '/reservations/:id/consume',
  requireRole(['TECHNICIAN', 'FACILITIES_ADMIN', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await consumeStockReservation(id, (req as any).user?.id);

      res.json({
        success: true,
        message: 'Stock reservation consumed. Physical inventory updated.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CONSUMPTION_FAILED', message: err.message },
      });
    }
  }
);

/**
 * POST /api/inventory/reservations/:id/release
 * Cancels/releases an active stock reservation.
 */
router.post(
  '/reservations/:id/release',
  requireRole(['TECHNICIAN', 'FACILITIES_ADMIN', 'PROCUREMENT_MANAGER', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await releaseStockReservation(id, (req as any).user?.id);

      res.json({
        success: true,
        message: 'Stock reservation released.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'RELEASE_FAILED', message: err.message },
      });
    }
  }
);

export default router;
