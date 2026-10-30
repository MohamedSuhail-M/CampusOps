import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('Inventory & Procurement Workflows (Checkpoints 22, 23, 24)', () => {
  let techCookie: string;
  let procCookie: string;
  let studentCookie: string;
  let testWorkOrderId: string;
  let testPrId: string;
  let testReservationId: string;

  beforeAll(async () => {
    // 1. Login Technician (campus031 - Manoj, Electrical Level 4)
    const techLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus031', password: 'password123', requestedRole: 'TECHNICIAN' });
    expect(techLogin.status).toBe(200);
    techCookie = techLogin.headers['set-cookie'][0];

    // 2. Login Procurement Manager (campus030 - Mr Dinesh I)
    const procLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus030', password: 'password123', requestedRole: 'PROCUREMENT_MANAGER' });
    expect(procLogin.status).toBe(200);
    procCookie = procLogin.headers['set-cookie'][0];

    // 3. Login Student (campus001) for RBAC negative checks
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: 'password123', requestedRole: 'STUDENT' });
    expect(studentLogin.status).toBe(200);
    studentCookie = studentLogin.headers['set-cookie'][0];

    // Reset seed inventory items to original seed quantities for idempotent test isolation
    await prisma.stockReservation.deleteMany({
      where: { itemId: { in: ['ITM001', 'ITM002'] } },
    });
    await prisma.inventoryItem.update({
      where: { id: 'ITM001' },
      data: { quantityOnHand: 14 },
    });
    await prisma.inventoryItem.update({
      where: { id: 'ITM002' },
      data: { quantityOnHand: 2 },
    });

    // Create a dedicated test work order for parts management
    const timestamp = Date.now();
    const wo = await prisma.workOrder.create({
      data: {
        id: `WO-TEST-${timestamp}`,
        incidentId: 'INC001',
        assignedTo: 'USR031',
        status: 'IN_PROGRESS',
        requiredSkillId: 'SK01',
      },
    });
    testWorkOrderId = wo.id;
  });

  afterAll(async () => {
    // Clean up test records
    if (testPrId) {
      await prisma.stockReceipt.deleteMany({ where: { purchaseRequestId: testPrId } });
      await prisma.approvalDecision.deleteMany({ where: { requestId: testPrId } });
      await prisma.purchaseRequestLine.deleteMany({ where: { requestId: testPrId } });
      await prisma.purchaseRequest.deleteMany({ where: { id: testPrId } });
    }
    if (testReservationId) {
      await prisma.stockReservation.deleteMany({ where: { id: testReservationId } });
    }
    if (testWorkOrderId) {
      await prisma.stockReservation.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrderEvent.deleteMany({ where: { workOrderId: testWorkOrderId } });
      await prisma.workOrder.deleteMany({ where: { id: testWorkOrderId } });
    }
    // Restore inventory quantities to seed values
    await prisma.stockReservation.deleteMany({
      where: { itemId: { in: ['ITM001', 'ITM002'] } },
    });
    await prisma.inventoryItem.update({
      where: { id: 'ITM001' },
      data: { quantityOnHand: 14 },
    });
    await prisma.inventoryItem.update({
      where: { id: 'ITM002' },
      data: { quantityOnHand: 2 },
    });
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------
  // CHECKPOINT 22: INVENTORY LEDGER & TRANSACTIONAL RESERVATIONS
  // -------------------------------------------------------------

  it('1. should return inventory ledger with live computed availability and low-stock flag', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Cookie', techCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);

    // Verify ITM001 structure
    const item1 = res.body.data.find((i: any) => i.id === 'ITM001');
    expect(item1).toBeDefined();
    expect(item1.sku).toBe('ELEC-SOCKET-16A');
    expect(typeof item1.quantityOnHand).toBe('number');
    expect(typeof item1.availableQuantity).toBe('number');
    expect(item1.availableQuantity).toBeLessThanOrEqual(item1.quantityOnHand);

    // Verify ITM002 (quantityOnHand: 2, reorderLevel: 3) has isLowStock === true
    const item2 = res.body.data.find((i: any) => i.id === 'ITM002');
    expect(item2).toBeDefined();
    expect(item2.isLowStock).toBe(true);
  });

  it('2. should reject over-reservation when requested quantity exceeds available stock (400)', async () => {
    // ITM002 has only 2 units on hand
    const res = await request(app)
      .post('/api/inventory/reserve')
      .set('Cookie', techCookie)
      .send({
        itemId: 'ITM002',
        workOrderId: testWorkOrderId,
        quantity: 9999, // Exceeds available stock
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESERVATION_FAILED');
    expect(res.body.error.message).toContain('Insufficient available stock');
  });

  it('3. should successfully reserve stock within available quantity and decrease available quantity', async () => {
    // Get pre-reservation state for ITM001
    const preRes = await request(app).get('/api/inventory/ITM001').set('Cookie', techCookie);
    const initialAvailable = preRes.body.data.availableQuantity;
    const initialOnHand = preRes.body.data.quantityOnHand;

    // Reserve 2 units of ITM001
    const res = await request(app)
      .post('/api/inventory/reserve')
      .set('Cookie', techCookie)
      .send({
        itemId: 'ITM001',
        workOrderId: testWorkOrderId,
        quantity: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testReservationId = res.body.data.id;
    expect(res.body.data.status).toBe('ACTIVE');

    // Verify post-reservation availability
    const postRes = await request(app).get('/api/inventory/ITM001').set('Cookie', techCookie);
    expect(postRes.body.data.availableQuantity).toBe(initialAvailable - 2);
    // Crucial check: physical on hand must NOT change upon reservation
    expect(postRes.body.data.quantityOnHand).toBe(initialOnHand);
  });

  it('4. should consume stock reservation, decrement quantity_on_hand, and record movement', async () => {
    const preRes = await request(app).get('/api/inventory/ITM001').set('Cookie', techCookie);
    const initialOnHand = preRes.body.data.quantityOnHand;

    const res = await request(app)
      .post(`/api/inventory/reservations/${testReservationId}/consume`)
      .set('Cookie', techCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reservation.status).toBe('CONSUMED');
    expect(res.body.data.remainingOnHand).toBe(initialOnHand - 2);

    // Verify StockMovement recorded
    const movementsRes = await request(app)
      .get('/api/inventory/movements?itemId=ITM001')
      .set('Cookie', techCookie);
    expect(movementsRes.status).toBe(200);
    const targetMvt = movementsRes.body.data.find((m: any) => m.referenceId === testWorkOrderId);
    expect(targetMvt).toBeDefined();
    expect(targetMvt.quantityDelta).toBe(-2);
    expect(targetMvt.reason).toBe('WORK_ORDER_CONSUMPTION');
  });

  // -------------------------------------------------------------
  // CHECKPOINT 23: PURCHASE REQUESTS & INDEPENDENT APPROVAL
  // -------------------------------------------------------------

  it('5. should allow technician to create purchase request and transition work order to BLOCKED', async () => {
    const res = await request(app)
      .post('/api/procurement/requests')
      .set('Cookie', techCookie)
      .send({
        workOrderId: testWorkOrderId,
        reason: 'Replacement 8-Port Switch required for floor network rack',
        lines: [
          {
            itemId: 'ITM008', // 8 Port Network Switch
            quantity: 3,
            estimatedUnitCost: 1500,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testPrId = res.body.data.id;
    expect(res.body.data.status).toBe('PENDING_APPROVAL');
    expect(res.body.data.estimatedTotal).toBe(4500);

    // Verify work order is now BLOCKED
    const wo = await prisma.workOrder.findUnique({ where: { id: testWorkOrderId } });
    expect(wo?.status).toBe('BLOCKED');
    expect(wo?.blockedReason).toContain('Awaiting spare parts from Purchase Request');
  });

  it('6. should reject self-approval of purchase request (Separation of Requester and Approver)', async () => {
    // Technician Manoj (campus031) created testPrId -> Manoj cannot approve it
    const res = await request(app)
      .post(`/api/procurement/requests/${testPrId}/decide`)
      .set('Cookie', techCookie)
      .send({
        decision: 'APPROVE',
        comment: 'I approve my own request',
      });

    // Manoj is TECHNICIAN so 403 Forbidden
    expect(res.status).toBe(403);
  });

  it('7. should allow independent Procurement Manager to approve request without altering physical stock', async () => {
    const preItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM008' } });
    const preOnHand = preItem?.quantityOnHand;

    const res = await request(app)
      .post(`/api/procurement/requests/${testPrId}/decide`)
      .set('Cookie', procCookie)
      .send({
        decision: 'APPROVE',
        comment: 'Spares purchase verified against annual facilities budget.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pr.status).toBe('APPROVED');
    expect(res.body.data.decision.decision).toBe('APPROVE');

    // CRITICAL INVARIANT: Approval must NOT increase physical stock
    const postItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM008' } });
    expect(postItem?.quantityOnHand).toBe(preOnHand);
  });

  // -------------------------------------------------------------
  // CHECKPOINT 24: STOCK RECEIPT & BLOCKED-WORK RESUMPTION
  // -------------------------------------------------------------

  it('8. should receive physical stock, increment on-hand, record movement, and resume blocked work order', async () => {
    const preItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM008' } });
    const preOnHand = preItem?.quantityOnHand || 0;

    // Receive the 3 switches
    const res = await request(app)
      .post('/api/procurement/receipts')
      .set('Cookie', procCookie)
      .send({
        purchaseRequestId: testPrId,
        itemId: 'ITM008',
        quantityReceived: 3,
        condition: 'ACCEPTED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workOrderResumed).toBe(true);

    // 1. Verify physical quantityOnHand incremented by 3
    const postItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM008' } });
    expect(postItem?.quantityOnHand).toBe(preOnHand + 3);

    // 2. Verify StockMovement ledger entry recorded
    const mvt = await prisma.stockMovement.findFirst({
      where: { itemId: 'ITM008', referenceId: testPrId },
    });
    expect(mvt).toBeDefined();
    expect(mvt?.quantityDelta).toBe(3);
    expect(mvt?.reason).toBe('PURCHASE_RECEIPT');

    // 3. Verify Purchase Request marked as RECEIVED
    const updatedPr = await prisma.purchaseRequest.findUnique({ where: { id: testPrId } });
    expect(updatedPr?.status).toBe('RECEIVED');

    // 4. Verify blocked work order was automatically unblocked, resumed, and reserved
    const resumedWo = await prisma.workOrder.findUnique({
      where: { id: testWorkOrderId },
      include: { stockReservations: true },
    });
    expect(resumedWo?.status).toBe('IN_PROGRESS');
    expect(resumedWo?.blockedReason).toBeNull();
    const activeRes = resumedWo?.stockReservations.find((r) => r.itemId === 'ITM008');
    expect(activeRes).toBeDefined();
    expect(activeRes?.quantity).toBe(3);
    expect(activeRes?.status).toBe('ACTIVE');
  });
});
