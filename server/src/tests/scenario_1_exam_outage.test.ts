import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('Scenario 1: Electrical Failure Before Semester Examination (Checkpoint 27)', () => {
  let studentCookie: string;
  let deptMgrCookie: string;
  let adminCookie: string;
  let techCookie: string;
  let incidentId: string;
  let workOrderId: string;
  let reservationId: string;

  beforeAll(async () => {
    // 1. Student (campus001)
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: 'password123', requestedRole: 'STUDENT' });
    expect(studentRes.status).toBe(200);
    studentCookie = studentRes.headers['set-cookie'][0];

    // 2. Department Manager (campus024 - Dr. Suresh Balan)
    const deptMgrRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus024', password: 'password123', requestedRole: 'DEPARTMENT_MANAGER' });
    expect(deptMgrRes.status).toBe(200);
    deptMgrCookie = deptMgrRes.headers['set-cookie'][0];

    // 3. Facilities Admin (campus028 - Dr Priya R)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus028', password: 'password123', requestedRole: 'FACILITIES_ADMIN' });
    expect(adminRes.status).toBe(200);
    adminCookie = adminRes.headers['set-cookie'][0];

    // 4. Technician (campus031 - Manoj Kumar)
    const techRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus031', password: 'password123', requestedRole: 'TECHNICIAN' });
    expect(techRes.status).toBe(200);
    techCookie = techRes.headers['set-cookie'][0];

    // Ensure BKG-EXAM starts at RM-B-204
    await prisma.roomBooking.update({
      where: { id: 'BKG-EXAM' },
      data: { roomId: 'RM-B-204' },
    });
  });

  afterAll(async () => {
    // Reset room booking back to original room RM-B-204 for seed cleanliness
    await prisma.roomBooking.update({
      where: { id: 'BKG-EXAM' },
      data: { roomId: 'RM-B-204' },
    });
    if (reservationId) {
      await prisma.stockReservation.deleteMany({ where: { id: reservationId } });
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
    await prisma.$disconnect();
  });

  it('Step 1: Student submits electrical hazard complaint with QR lookup in RM-B-204', async () => {
    // Lookup QR
    const qrRes = await request(app)
      .get('/api/directory/assets/lookup?qr=AST-EL-B-204')
      .set('Cookie', studentCookie);
    expect(qrRes.status).toBe(200);
    expect(qrRes.body.data.assetTag).toBe('EL-B-204-01');
    expect(qrRes.body.data.roomId).toBe('RM-B-204');

    // Submit complaint
    const submitRes = await request(app)
      .post('/api/intake/submit')
      .set('Cookie', studentCookie)
      .send({
        message: 'Severe electrical sparking and smoke from power socket in Room RM-B-204. CSAI examination starting soon!',
        buildingId: 'BLD-B',
        roomId: 'RM-B-204',
        assetId: 'AST-EL-B-204',
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    incidentId = submitRes.body.data.incident.id;

    // Verify AI triage assigned CRITICAL priority and ELECTRICAL category
    expect(submitRes.body.data.triage.category).toBe('ELECTRICAL');
    expect(submitRes.body.data.priority || submitRes.body.data.triage.suggestedPriority).toBe('CRITICAL');
  });

  it('Step 2: Detect exam timetable conflict in disrupted room RM-B-204', async () => {
    const conflictRes = await request(app)
      .get('/api/rooms/conflicts?roomId=RM-B-204&targetDate=2026-11-03')
      .set('Cookie', studentCookie);

    expect(conflictRes.status).toBe(200);
    expect(conflictRes.body.success).toBe(true);
    const exam = conflictRes.body.data.impactedBookings.find((b: any) => b.id === 'BKG-EXAM');
    expect(exam).toBeDefined();
    expect(exam.purpose).toContain('CSAI Semester Examination');
  });

  it('Step 3: Recommend alternative examination hall matching 80 capacity and projector equipment', async () => {
    const altRes = await request(app)
      .get('/api/rooms/alternatives?bookingId=BKG-EXAM')
      .set('Cookie', deptMgrCookie);

    expect(altRes.status).toBe(200);
    expect(altRes.body.success).toBe(true);
    const topPick = altRes.body.data.alternatives?.[0] || altRes.body.data.recommendations?.[0];
    expect(topPick.roomId || topPick.id).toBe('RM-B-206');
    expect(topPick.capacity).toBeGreaterThanOrEqual(80);
  });

  it('Step 4: Department Manager authorizes exam relocation to RM-B-206 with faculty notification', async () => {
    const relocateRes = await request(app)
      .post('/api/rooms/relocate')
      .set('Cookie', deptMgrCookie)
      .send({
        bookingId: 'BKG-EXAM',
        newRoomId: 'RM-B-206',
        justification: 'Emergency electrical hazard in Room B-204. Relocated to RM-B-206.',
      });

    expect(relocateRes.status).toBe(200);
    expect(relocateRes.body.success).toBe(true);
    expect(relocateRes.body.data.booking.roomId).toBe('RM-B-206');

    // Verify Faculty Dr. Kavitha Menon received in-app notification
    const facultyNotif = await prisma.notification.findFirst({
      where: { recipientId: 'USR017', eventType: 'RELOCATION_REQUEST' },
      orderBy: { createdAt: 'desc' },
    });
    expect(facultyNotif).toBeDefined();
    expect(facultyNotif?.body).toContain('B-206');
  });

  it('Step 5: Facilities Admin validates technician eligibility (Selvam excluded on leave, Manoj assigned)', async () => {
    // Create work order for incident with dueAt on Nov 3 (day of exam)
    const createWoRes = await request(app)
      .post('/api/work-orders')
      .set('Cookie', adminCookie)
      .send({
        incidentId,
        requiredSkillId: 'SK01', // Electrical
        dueAt: '2026-11-03T10:00:00.000Z',
      });

    expect(createWoRes.status).toBe(201);
    workOrderId = createWoRes.body.data.id;

    // Verify attempting to assign Selvam (USR032) fails because of approved leave LEV001
    const assignSelvamRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/assign`)
      .set('Cookie', adminCookie)
      .send({ technicianId: 'USR032' });

    expect(assignSelvamRes.status).toBe(400);
    expect(assignSelvamRes.body.error.code).toBe('TECHNICIAN_NOT_ELIGIBLE');

    // Assign Manoj (USR031) who is available and on shift
    const assignManojRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/assign`)
      .set('Cookie', adminCookie)
      .send({ technicianId: 'USR031' });

    expect(assignManojRes.status).toBe(200);
    expect(assignManojRes.body.data.status).toBe('ASSIGNED');
    expect(assignManojRes.body.data.assignedTo).toBe('USR031');
  });

  it('Step 6: Technician starts work, reserves replacement socket, and completes repair', async () => {
    // 6a. Technician starts work
    const startRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/transition`)
      .set('Cookie', techCookie)
      .send({ action: 'START' });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('IN_PROGRESS');

    // 6b. Technician reserves replacement 16A socket (ITM001)
    const reserveRes = await request(app)
      .post('/api/inventory/reserve')
      .set('Cookie', techCookie)
      .send({
        itemId: 'ITM001',
        workOrderId,
        quantity: 1,
      });
    expect(reserveRes.status).toBe(201);
    reservationId = reserveRes.body.data.id;

    // 6c. Technician consumes reservation
    const consumeRes = await request(app)
      .post(`/api/inventory/reservations/${reservationId}/consume`)
      .set('Cookie', techCookie);
    expect(consumeRes.status).toBe(200);

    // 6d. Technician completes work order
    const completeRes = await request(app)
      .post(`/api/work-orders/${workOrderId}/transition`)
      .set('Cookie', techCookie)
      .send({
        action: 'COMPLETE',
        resolution: 'Socket safely replaced and circuit tested OK. Room verified safe.',
      });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    // Verify Incident status is now RESOLVED
    const inc = await prisma.incident.findUnique({ where: { id: incidentId } });
    expect(inc?.status).toBe('RESOLVED');

    // Verify maintenance history is recorded
    const mnt = await prisma.maintenanceHistory.findFirst({
      where: { workOrderId, resolution: { contains: 'circuit tested OK' } },
    });
    expect(mnt).toBeDefined();
  });
});
