import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('Scenario 2: Shared Wi-Fi Outage and Procurement Shortage (Checkpoint 28)', () => {
  let studentCookie: string;
  let adminCookie: string;
  let techCookie: string;
  let procCookie: string;
  let incidentId: string;
  let workOrderId: string;
  let purchaseRequestId: string;

  beforeAll(async () => {
    // 1. Student (campus001)
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: 'password123', requestedRole: 'STUDENT' });
    expect(studentRes.status).toBe(200);
    studentCookie = studentRes.headers['set-cookie'][0];

    // 2. Facilities Admin (campus028 - Dr Priya R)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus028', password: 'password123', requestedRole: 'FACILITIES_ADMIN' });
    expect(adminRes.status).toBe(200);
    adminCookie = adminRes.headers['set-cookie'][0];

    // 3. Technician (campus033 - Anandha Kumar, Networking Level 4)
    const techRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus033', password: 'password123', requestedRole: 'TECHNICIAN' });
    expect(techRes.status).toBe(200);
    techCookie = techRes.headers['set-cookie'][0];

    // 4. Procurement Manager (campus030 - Mr Dinesh I)
    const procRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus030', password: 'password123', requestedRole: 'PROCUREMENT_MANAGER' });
    expect(procRes.status).toBe(200);
    procCookie = procRes.headers['set-cookie'][0];

    // Ensure ITM002 has original seed quantity (2)
    await prisma.stockReservation.deleteMany({ where: { itemId: 'ITM002' } });
    await prisma.inventoryItem.update({
      where: { id: 'ITM002' },
      data: { quantityOnHand: 2 },
    });
  });

  afterAll(async () => {
    if (purchaseRequestId) {
      await prisma.stockReceipt.deleteMany({ where: { purchaseRequestId } });
      await prisma.approvalDecision.deleteMany({ where: { requestId: purchaseRequestId } });
      await prisma.purchaseRequestLine.deleteMany({ where: { requestId: purchaseRequestId } });
      await prisma.purchaseRequest.deleteMany({ where: { id: purchaseRequestId } });
    }
    if (workOrderId) {
      await prisma.stockReservation.deleteMany({ where: { workOrderId } });
      await prisma.maintenanceHistory.deleteMany({ where: { workOrderId } });
      await prisma.workOrderEvent.deleteMany({ where: { workOrderId } });
      await prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (incidentId) {
      await prisma.stockReservation.deleteMany({ where: { workOrder: { incidentId } } });
      await prisma.maintenanceHistory.deleteMany({ where: { workOrder: { incidentId } } });
      await prisma.workOrderEvent.deleteMany({ where: { workOrder: { incidentId } } });
      await prisma.workOrder.deleteMany({ where: { incidentId } });
      await prisma.roomOutage.deleteMany({ where: { incidentId } });
      await prisma.incidentLink.deleteMany({
        where: { OR: [{ sourceIncidentId: incidentId }, { targetIncidentId: incidentId }] },
      });
      await prisma.incidentImpact.deleteMany({ where: { incidentId } });
      await prisma.incidentReport.deleteMany({ where: { incidentId } });
      await prisma.incident.deleteMany({ where: { id: incidentId } });
    }
    // Restore ITM002 to original seed quantity
    await prisma.stockReservation.deleteMany({ where: { itemId: 'ITM002' } });
    await prisma.inventoryItem.update({
      where: { id: 'ITM002' },
      data: { quantityOnHand: 2 },
    });
    await prisma.$disconnect();
  });

  it('Step 1: Student reports shared Wi-Fi outage in Building C RM-C-201', async () => {
    const res = await request(app)
      .post('/api/intake/submit')
      .set('Cookie', studentCookie)
      .send({
        message: 'Shared Wi-Fi router in Building C room 201 has failed. All students disconnected during lab practical.',
        buildingId: 'BLD-C',
        roomId: 'RM-C-201',
        assetId: 'AST-NW-C-201',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    incidentId = res.body.data.incident.id;
    expect(res.body.data.triage.category).toBe('NETWORK');
    expect(res.body.data.priority || res.body.data.triage.suggestedPriority).toBe('HIGH');
  });

  it('Step 2: Facilities Admin assigns Networking Technician Anandha Kumar (USR033)', async () => {
    const createWoRes = await request(app)
      .post('/api/work-orders')
      .set('Cookie', adminCookie)
      .send({
        incidentId,
        requiredSkillId: 'SK02', // Networking
      });

    expect(createWoRes.status).toBe(201);
    workOrderId = createWoRes.body.data.id;

    const assignRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/assign`)
      .set('Cookie', adminCookie)
      .send({ technicianId: 'USR033' });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.status).toBe('ASSIGNED');
    expect(assignRes.body.data.assignedTo).toBe('USR033');
  });

  it('Step 3: Technician starts work and initiates Purchase Request due to spare parts shortage', async () => {
    // 3a. Start work
    const startRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/transition`)
      .set('Cookie', techCookie)
      .send({ action: 'START' });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('IN_PROGRESS');

    // 3b. Create Purchase Request for 2 Wi-Fi transceivers (ITM002)
    const prRes = await request(app)
      .post('/api/procurement/requests')
      .set('Cookie', techCookie)
      .send({
        workOrderId,
        reason: 'Wi-Fi transceiver unit burned out; replacement required to restore connectivity',
        lines: [
          {
            itemId: 'ITM002', // Wi-Fi Network Transceiver
            quantity: 2,
            estimatedUnitCost: 1200,
          },
        ],
      });

    expect(prRes.status).toBe(201);
    expect(prRes.body.success).toBe(true);
    purchaseRequestId = prRes.body.data.id;
    expect(prRes.body.data.status).toBe('PENDING_APPROVAL');

    // Verify Work Order was transitioned to BLOCKED with reason
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    expect(wo?.status).toBe('BLOCKED');
    expect(wo?.blockedReason).toContain('Awaiting spare parts from Purchase Request');
  });

  it('Step 4: Anti-Self-Approval Rule prevents requester from approving own request', async () => {
    const selfApproveRes = await request(app)
      .post(`/api/procurement/requests/${purchaseRequestId}/decide`)
      .set('Cookie', techCookie)
      .send({
        decision: 'APPROVE',
        comment: 'I need this part right now',
      });

    // Technician is rejected with 403 Forbidden
    expect(selfApproveRes.status).toBe(403);
  });

  it('Step 5: Independent Procurement Manager approves request (Stock remains unchanged)', async () => {
    const preItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM002' } });
    const preOnHand = preItem?.quantityOnHand;

    const approveRes = await request(app)
      .post(`/api/procurement/requests/${purchaseRequestId}/decide`)
      .set('Cookie', procCookie)
      .send({
        decision: 'APPROVE',
        comment: 'Network equipment purchase approved under emergency maintenance quota.',
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.pr.status).toBe('APPROVED');

    // INVARIANT: Physical stock must NOT change upon approval
    const postItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM002' } });
    expect(postItem?.quantityOnHand).toBe(preOnHand);
  });

  it('Step 6: Physical stock received; system increments stock and automatically resumes blocked work', async () => {
    const preItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM002' } });
    const preOnHand = preItem?.quantityOnHand || 0;

    const receiptRes = await request(app)
      .post('/api/procurement/receipts')
      .set('Cookie', procCookie)
      .send({
        purchaseRequestId,
        itemId: 'ITM002',
        quantityReceived: 2,
        condition: 'ACCEPTED',
      });

    expect(receiptRes.status).toBe(201);
    expect(receiptRes.body.success).toBe(true);
    expect(receiptRes.body.data.workOrderResumed).toBe(true);

    // 6a. Verify physical stock on hand increased
    const postItem = await prisma.inventoryItem.findUnique({ where: { id: 'ITM002' } });
    expect(postItem?.quantityOnHand).toBe(preOnHand + 2);

    // 6b. Verify work order was automatically unblocked and resumed
    const resumedWo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { stockReservations: true },
    });
    expect(resumedWo?.status).toBe('IN_PROGRESS');
    expect(resumedWo?.blockedReason).toBeNull();

    // 6c. Verify part was automatically reserved for work order
    const autoRes = resumedWo?.stockReservations.find((r) => r.itemId === 'ITM002');
    expect(autoRes).toBeDefined();
    expect(autoRes?.status).toBe('ACTIVE');
  });

  it('Step 7: Technician replaces transceiver and completes repair', async () => {
    const completeRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/transition`)
      .set('Cookie', techCookie)
      .send({
        action: 'COMPLETE',
        resolution: 'Access point transceiver replaced and Wi-Fi signal strength verified OK across Building C.',
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    // Incident is RESOLVED
    const inc = await prisma.incident.findUnique({ where: { id: incidentId } });
    expect(inc?.status).toBe('RESOLVED');

    // Maintenance History recorded
    const mnt = await prisma.maintenanceHistory.findFirst({
      where: { workOrderId, resolution: { contains: 'transceiver replaced' } },
    });
    expect(mnt).toBeDefined();
  });
});
