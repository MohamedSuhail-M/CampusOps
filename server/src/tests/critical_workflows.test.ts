import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('Critical Workflow Fixes End-to-End Validation', () => {
  let adminCookie: string;
  let deptMgrCookie: string;
  let techManojCookie: string;
  let techBalaCookie: string;
  let studentCookie: string;

  const password = process.env.DEMO_PASSWORD || 'password123';
  let testWorkOrderId: string;
  let testIncidentId: string;

  beforeAll(async () => {
    // 1. Facilities Admin (campus028 - Mr Joseph Thomas)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus028', password, requestedRole: 'FACILITIES_ADMIN' });
    expect(adminRes.status).toBe(200);
    adminCookie = adminRes.headers['set-cookie'][0];

    // 2. Department Manager (campus024 - Dr Suresh Balan)
    const dmRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus024', password, requestedRole: 'DEPARTMENT_MANAGER' });
    expect(dmRes.status).toBe(200);
    deptMgrCookie = dmRes.headers['set-cookie'][0];

    // 3. Technician Manoj (campus031 - USR031, Electrical)
    const manojRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus031', password, requestedRole: 'TECHNICIAN' });
    expect(manojRes.status).toBe(200);
    techManojCookie = manojRes.headers['set-cookie'][0];

    // 4. Technician Bala (campus035 - USR035, HVAC)
    const balaRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus035', password, requestedRole: 'TECHNICIAN' });
    expect(balaRes.status).toBe(200);
    techBalaCookie = balaRes.headers['set-cookie'][0];

    // 5. Student (campus001)
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password, requestedRole: 'STUDENT' });
    expect(studentRes.status).toBe(200);
    studentCookie = studentRes.headers['set-cookie'][0];

    // Create a standalone test incident and work order for clean test isolation
    const timestamp = Date.now();
    testIncidentId = `INC-TEST-${timestamp}`;
    await prisma.incident.create({
      data: {
        id: testIncidentId,
        reference: `TEST-REF-${timestamp.toString().slice(-4)}`,
        title: 'Broken electrical fixture in B-201',
        category: 'ELECTRICAL',
        priority: 'HIGH',
        status: 'NEW',
        roomId: 'RM-B-201',
        buildingId: 'BLD-B',
      },
    });

    testWorkOrderId = `WO-TEST-${timestamp}`;
    await prisma.workOrder.create({
      data: {
        id: testWorkOrderId,
        incidentId: testIncidentId,
        status: 'OPEN',
        requiredSkillId: 'SK01', // Electrical
        dueAt: new Date('2026-11-03T10:00:00.000Z'),
      },
    });
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.workOrderEvent.deleteMany({ where: { workOrderId: testWorkOrderId } });
    await prisma.auditLog.deleteMany({ where: { entityId: testWorkOrderId } });
    await prisma.workOrder.deleteMany({ where: { id: testWorkOrderId } });
    await prisma.incident.deleteMany({ where: { id: testIncidentId } });
    await prisma.$disconnect();
  });

  // =========================================================================
  // WORKFLOW 1: Facilities Manager Work Order Dispatch & Technician Scoping
  // =========================================================================
  describe('Workflow 1: Work Order Dispatch & Technician Execution', () => {
    it('1.1 should reject unauthorized user (Student) from dispatching work order (403)', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/assign`)
        .set('Cookie', studentCookie)
        .send({ technicianId: 'USR031' });

      expect(res.status).toBe(403);
    });

    it('1.2 should reject dispatch with missing or invalid technicianId (400)', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/assign`)
        .set('Cookie', adminCookie)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('1.3 should reject assigning technician on approved medical leave (Selvam USR032 on LEV001)', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/assign`)
        .set('Cookie', adminCookie)
        .send({ technicianId: 'USR032' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TECHNICIAN_NOT_ELIGIBLE');
      expect(res.body.error.message).toContain('leave');
    });

    it('1.4 should successfully dispatch work order to available technician Manoj (USR031)', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/assign`)
        .set('Cookie', adminCookie)
        .send({ technicianId: 'USR031' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedTo).toBe('USR031');
      expect(res.body.data.status).toBe('ASSIGNED');

      // Verify DB persistence
      const inDb = await prisma.workOrder.findUnique({ where: { id: testWorkOrderId } });
      expect(inDb?.assignedTo).toBe('USR031');
      expect(inDb?.status).toBe('ASSIGNED');

      // Verify WorkOrderEvent logged
      const event = await prisma.workOrderEvent.findFirst({
        where: { workOrderId: testWorkOrderId, eventType: 'ASSIGNED' },
      });
      expect(event).toBeDefined();
    });

    it('1.5 should scope work orders by technician so Manoj sees his assignment but Bala does not', async () => {
      // Manoj checks his dashboard
      const manojRes = await request(app)
        .get('/api/work-orders')
        .set('Cookie', techManojCookie);

      expect(manojRes.status).toBe(200);
      const manojWos = manojRes.body.data;
      const foundInManoj = manojWos.some((w: any) => w.id === testWorkOrderId);
      expect(foundInManoj).toBe(true);

      // Bala checks his dashboard -> should NOT see Manoj's test work order
      const balaRes = await request(app)
        .get('/api/work-orders')
        .set('Cookie', techBalaCookie);

      expect(balaRes.status).toBe(200);
      const balaWos = balaRes.body.data;
      const foundInBala = balaWos.some((w: any) => w.id === testWorkOrderId);
      expect(foundInBala).toBe(false);
    });

    it('1.6 should allow technician to transition status: IN_PROGRESS -> BLOCKED -> COMPLETED', async () => {
      // Start work
      const startRes = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/status`)
        .set('Cookie', techManojCookie)
        .send({ status: 'IN_PROGRESS' });

      expect(startRes.status).toBe(200);
      expect(startRes.body.data.status).toBe('IN_PROGRESS');

      // Block for parts
      const blockRes = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/status`)
        .set('Cookie', techManojCookie)
        .send({ status: 'BLOCKED', blockedReason: 'Awaiting replacement 16A circuit breaker' });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.data.status).toBe('BLOCKED');

      // Resume work
      const resumeRes = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/status`)
        .set('Cookie', techManojCookie)
        .send({ status: 'IN_PROGRESS' });

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe('IN_PROGRESS');

      // Complete work
      const completeRes = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/status`)
        .set('Cookie', techManojCookie)
        .send({ status: 'COMPLETED', resolution: 'Modular circuit breaker replaced and load-tested.' });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');

      // Verify incident is now RESOLVED
      const inc = await prisma.incident.findUnique({ where: { id: testIncidentId } });
      expect(inc?.status).toBe('RESOLVED');
    });

    it('1.7 should reject repeated dispatch for already completed work order (400)', async () => {
      const res = await request(app)
        .post(`/api/work-orders/${testWorkOrderId}/assign`)
        .set('Cookie', adminCookie)
        .send({ technicianId: 'USR031' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });
  });

  // =========================================================================
  // WORKFLOW 2: Room Timetables Retrieval & Filtering
  // =========================================================================
  describe('Workflow 2: Room Timetable Retrieval & Integrity', () => {
    it('2.1 should retrieve real campus room timetables from database', async () => {
      const res = await request(app)
        .get('/api/rooms/timetable')
        .set('Cookie', deptMgrCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(100);
      expect(Array.isArray(res.body.data)).toBe(true);

      const first = res.body.data[0];
      expect(first).toHaveProperty('roomCode');
      expect(first).toHaveProperty('dayOfWeek');
      expect(first).toHaveProperty('timeSlot');
      expect(first).toHaveProperty('purpose');
      expect(first).toHaveProperty('facultyName');
      expect(first).toHaveProperty('capacity');
    });

    it('2.2 should filter timetable records by roomCode', async () => {
      const res = await request(app)
        .get('/api/rooms/timetable?roomId=A-201')
        .set('Cookie', deptMgrCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((item: any) => item.roomCode === 'A-201')).toBe(true);
    });

    it('2.3 should filter timetable records by dayOfWeek', async () => {
      const res = await request(app)
        .get('/api/rooms/timetable?dayOfWeek=Monday')
        .set('Cookie', deptMgrCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((item: any) => item.dayOfWeek === 'Monday')).toBe(true);
    });

    it('2.4 should retrieve direct room timetable via /api/rooms/:roomId/timetable', async () => {
      const res = await request(app)
        .get('/api/rooms/RM-B-204/timetable')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.room.code).toBe('B-204');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('2.5 should return 404 for nonexistent room timetable query', async () => {
      const res = await request(app)
        .get('/api/rooms/RM-NONEXISTENT/timetable')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // =========================================================================
  // WORKFLOW 3: Department Manager Relocation Approval & Ticket Synchronization
  // =========================================================================
  describe('Workflow 3: Room Relocation Approval & Ticket Lifecycle', () => {
    let testBookingId: string;
    let testOutageId: string;
    let relocationIncidentId: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      relocationIncidentId = `INC-RELOC-${timestamp}`;

      // Create an active hazard incident in Room B-202
      await prisma.incident.create({
        data: {
          id: relocationIncidentId,
          reference: `REL-REF-${timestamp.toString().slice(-4)}`,
          title: 'AC unit coolant leak & ceiling drip in B-202',
          category: 'HVAC',
          priority: 'CRITICAL',
          status: 'NEW',
          roomId: 'RM-B-202',
          buildingId: 'BLD-B',
        },
      });

      // Declare active room outage
      testOutageId = `OUT-TEST-${timestamp}`;
      await prisma.roomOutage.create({
        data: {
          id: testOutageId,
          roomId: 'RM-B-202',
          incidentId: relocationIncidentId,
          startsAt: new Date(),
          status: 'ACTIVE',
        },
      });

      // Create a booking in disrupted room B-202
      testBookingId = `BKG-TEST-${timestamp}`;
      await prisma.roomBooking.create({
        data: {
          id: testBookingId,
          roomId: 'RM-B-202',
          departmentId: 'DEP01', // CSE Department
          facultyId: 'USR017', // Dr Kavitha Menon
          startsAt: new Date(Date.now() + 3600000),
          endsAt: new Date(Date.now() + 7200000),
          purpose: 'Operating Systems Midterm Exam',
          status: 'CONFIRMED',
          requirements: {
            create: [
              { requirementType: 'CAPACITY', value: '30' },
              { requirementType: 'PROJECTOR', value: 'YES' },
            ],
          },
        },
      });

      // Link booking impact
      await prisma.incidentImpact.create({
        data: {
          id: `IMP-TEST-${timestamp}`,
          incidentId: relocationIncidentId,
          targetType: 'BOOKING',
          targetId: testBookingId,
          impactType: 'EXAM_AT_RISK',
          status: 'ACTIVE',
        },
      });
    });

    afterAll(async () => {
      await prisma.notification.deleteMany({ where: { recipientId: 'USR017', title: { contains: 'Operating Systems' } } });
      await prisma.auditLog.deleteMany({ where: { entityId: testBookingId } });
      await prisma.outboxEvent.deleteMany({ where: { payload: { contains: testBookingId } } });
      await prisma.incidentImpact.deleteMany({ where: { targetId: testBookingId } });
      await prisma.roomRequirement.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.roomBooking.deleteMany({ where: { id: testBookingId } });
      await prisma.roomOutage.deleteMany({ where: { id: testOutageId } });
      await prisma.incident.deleteMany({ where: { id: relocationIncidentId } });
    });

    it('3.1 should list the pending disrupted booking in GET /api/rooms/relocations', async () => {
      const res = await request(app)
        .get('/api/rooms/relocations')
        .set('Cookie', deptMgrCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const pending = res.body.data.pending;
      const found = pending.find((p: any) => p.booking.id === testBookingId);
      expect(found).toBeDefined();
      expect(found.booking.purpose).toBe('Operating Systems Midterm Exam');
      expect(found.recommendations.length).toBeGreaterThan(0);
    });

    it('3.2 should reject unauthorized user (Student) from approving relocation (403)', async () => {
      const res = await request(app)
        .post('/api/rooms/relocate')
        .set('Cookie', studentCookie)
        .send({
          bookingId: testBookingId,
          newRoomId: 'RM-B-206',
          decision: 'APPROVE',
        });

      expect(res.status).toBe(403);
    });

    it('3.3 should successfully approve relocation, update booking, and transition associated ticket to RESOLVED', async () => {
      const res = await request(app)
        .post('/api/rooms/relocate')
        .set('Cookie', deptMgrCookie)
        .send({
          bookingId: testBookingId,
          newRoomId: 'RM-B-206',
          decision: 'APPROVE',
          justification: 'Emergency HVAC leak in B-202. Relocated to B-206 to safeguard examination.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.roomId).toBe('RM-B-206');
      expect(res.body.data.toRoomId).toBe('RM-B-206');

      // Verify booking persisted in new room
      const bkg = await prisma.roomBooking.findUnique({ where: { id: testBookingId } });
      expect(bkg?.roomId).toBe('RM-B-206');

      // Verify associated incident ticket transitioned to RESOLVED
      const inc = await prisma.incident.findUnique({ where: { id: relocationIncidentId } });
      expect(inc?.status).toBe('RESOLVED');

      // Verify faculty received in-app notification
      const notif = await prisma.notification.findFirst({
        where: { recipientId: 'USR017', eventType: 'RELOCATION_REQUEST' },
        orderBy: { createdAt: 'desc' },
      });
      expect(notif).toBeDefined();
      expect(notif?.body).toContain('B-206');
    });

    it('3.4 should verify the processed booking is REMOVED from pending queue', async () => {
      const res = await request(app)
        .get('/api/rooms/relocations')
        .set('Cookie', deptMgrCookie);

      expect(res.status).toBe(200);
      const pending = res.body.data.pending;
      const found = pending.find((p: any) => p.booking.id === testBookingId);
      // Must be removed from pending list!
      expect(found).toBeUndefined();

      // Must appear in the decision history
      const history = res.body.data.history;
      const foundHistory = history.find((h: any) => h.bookingId === testBookingId);
      expect(foundHistory).toBeDefined();
      expect(foundHistory.action).toBe('CONFIRM_RELOCATION');
    });

    it('3.5 should reject duplicate relocation attempt with 400', async () => {
      const res = await request(app)
        .post('/api/rooms/relocate')
        .set('Cookie', deptMgrCookie)
        .send({
          bookingId: testBookingId,
          newRoomId: 'RM-B-206',
          decision: 'APPROVE',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ALREADY_RELOCATED');
    });
  });
});
