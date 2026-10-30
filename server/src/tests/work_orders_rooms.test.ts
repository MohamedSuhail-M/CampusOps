import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';
import { findEligibleTechnicians } from '../services/technician_matcher.service';

describe('Technician Assignment & Room Relocation Workflows', () => {
  let studentCookie: string;
  let adminCookie: string;
  let deptManagerCookie: string;
  const password = process.env.DEMO_PASSWORD || 'password123';

  beforeAll(async () => {
    // Student
    const sLogin = await request(app).post('/api/auth/login').send({ loginId: 'campus001', password });
    studentCookie = sLogin.headers['set-cookie'];

    // Facilities Admin (Joseph Thomas)
    const aLogin = await request(app).post('/api/auth/login').send({ loginId: 'campus028', password, requestedRole: 'FACILITIES_ADMIN' });
    adminCookie = aLogin.headers['set-cookie'];

    // Department Manager (Dr. Suresh Balan)
    const dmLogin = await request(app).post('/api/auth/login').send({ loginId: 'campus024', password, requestedRole: 'DEPARTMENT_MANAGER' });
    deptManagerCookie = dmLogin.headers['set-cookie'];

    // Ensure BKG-EXAM is in RM-B-204 for the test
    await prisma.roomBooking.update({
      where: { id: 'BKG-EXAM' },
      data: { roomId: 'RM-B-204' },
    });
    // Ensure WO001 is in ASSIGNED status with USR031
    await prisma.workOrder.update({
      where: { id: 'WO001' },
      data: { status: 'ASSIGNED', assignedTo: 'USR031' },
    });
  });

  it('1. should exclude technician on approved leave and recommend available technician (Scenario 1 rule)', async () => {
    // Electrical skill SK01 on Nov 3, 2026
    const targetDate = new Date('2026-11-03T09:00:00');
    const { eligible, excluded } = await findEligibleTechnicians('SK01', targetDate);

    // Selvam (USR032, Skill level 5) is on approved leave LEV001 -> must be EXCLUDED
    const selvam = excluded.find((c) => c.userId === 'USR032');
    expect(selvam).toBeDefined();
    expect(selvam?.isEligible).toBe(false);
    expect(selvam?.reason).toContain('On approved leave');

    // Manoj (USR031, Skill level 4) is AVAILABLE -> must be ELIGIBLE
    const manoj = eligible.find((c) => c.userId === 'USR031');
    expect(manoj).toBeDefined();
    expect(manoj?.isEligible).toBe(true);
    expect(manoj?.status).toBe('AVAILABLE');
  });

  let testWorkOrderId: string;

  it('2. should reject assigning technician on approved leave (400)', async () => {
    // Fetch work order WO001
    const wo = await prisma.workOrder.findUnique({ where: { id: 'WO001' } });
    expect(wo).toBeDefined();
    testWorkOrderId = 'WO001';

    // Attempt to assign Selvam (USR032, on leave)
    const res = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/assign`)
      .set('Cookie', adminCookie)
      .send({ technicianId: 'USR032' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TECHNICIAN_NOT_ELIGIBLE');
    expect(res.body.error.message).toContain('leave');
  });

  it('3. should successfully assign eligible technician (USR031 Manoj) and update audit trail', async () => {
    const res = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/assign`)
      .set('Cookie', adminCookie)
      .send({ technicianId: 'USR031' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedTo).toBe('USR031');
    expect(res.body.data.status).toBe('ASSIGNED');

    // Verify event created
    const events = await prisma.workOrderEvent.findMany({
      where: { workOrderId: testWorkOrderId, eventType: 'ASSIGNED' },
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('4. should enforce work order lifecycle transitions: START -> BLOCK -> RESUME -> COMPLETE', async () => {
    // 4a. START (ASSIGNED -> IN_PROGRESS)
    const startRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Cookie', adminCookie)
      .send({ action: 'START' });
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('IN_PROGRESS');

    // 4b. Invalid transition directly to COMPLETED when blocked, or invalid action
    const invalidRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Cookie', adminCookie)
      .send({ action: 'RESUME' }); // Cannot resume while in progress
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('INVALID_TRANSITION');

    // 4c. BLOCK (IN_PROGRESS -> BLOCKED, requires blockedReason)
    const blockRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Cookie', adminCookie)
      .send({ action: 'BLOCK', blockedReason: 'Awaiting replacement 16A socket' });
    expect(blockRes.status).toBe(200);
    expect(blockRes.body.data.status).toBe('BLOCKED');
    expect(blockRes.body.data.blockedReason).toContain('socket');

    // 4d. RESUME (BLOCKED -> IN_PROGRESS)
    const resumeRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Cookie', adminCookie)
      .send({ action: 'RESUME' });
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.status).toBe('IN_PROGRESS');

    // 4e. COMPLETE (IN_PROGRESS -> COMPLETED, requires resolution)
    const completeRes = await request(app)
      .post(`/api/work-orders/${testWorkOrderId}/transition`)
      .set('Cookie', adminCookie)
      .send({ action: 'COMPLETE', resolution: 'Socket safely replaced and circuit tested OK' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    // Verify Maintenance History recorded
    const mnt = await prisma.maintenanceHistory.findFirst({
      where: { 
        workOrderId: testWorkOrderId,
        resolution: { contains: 'circuit tested OK' } 
      },
    });
    expect(mnt).toBeDefined();
    expect(mnt?.resolution).toContain('circuit tested OK');
  });

  it('5. should detect room booking conflict in disrupted room RM-B-204', async () => {
    const res = await request(app)
      .get('/api/rooms/conflicts?roomId=RM-B-204&targetDate=2026-11-03')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const examBooking = res.body.data.impactedBookings.find((b: any) => b.id === 'BKG-EXAM');
    expect(examBooking).toBeDefined();
    expect(examBooking.purpose).toContain('CSAI Semester Examination');
  });

  it('6. should recommend alternative classrooms matching capacity and equipment', async () => {
    const res = await request(app)
      .get('/api/rooms/alternatives?bookingId=BKG-EXAM')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);

    // RM-B-206 must be recommended
    const b206 = res.body.data.recommendations.find((r: any) => r.roomCode === 'B-206');
    expect(b206).toBeDefined();
    expect(b206.isAvailable).toBe(true);
    expect(b206.capacity).toBe(80); // capacity 80 >= 40
  });

  it('7. should reject unauthorized user (Student) from executing room relocation (403)', async () => {
    const res = await request(app)
      .post('/api/rooms/relocate')
      .set('Cookie', studentCookie)
      .send({
        bookingId: 'BKG-EXAM',
        newRoomId: 'RM-B-206',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('8. should allow Department Manager to authorise relocation, update booking, and alert faculty', async () => {
    const res = await request(app)
      .post('/api/rooms/relocate')
      .set('Cookie', deptManagerCookie)
      .send({
        bookingId: 'BKG-EXAM',
        newRoomId: 'RM-B-206',
        reason: 'Electrical socket hazard relocation approved for examination',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fromRoomId).toBe('RM-B-204');
    expect(res.body.data.toRoomId).toBe('RM-B-206');

    // Verify booking room updated in DB
    const updatedBooking = await prisma.roomBooking.findUnique({ where: { id: 'BKG-EXAM' } });
    expect(updatedBooking?.roomId).toBe('RM-B-206');

    // Verify notification sent to faculty (Dr. Kavitha Menon USR017)
    const notif = await prisma.notification.findFirst({
      where: { recipientId: 'USR017', eventType: 'RELOCATION_REQUEST' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).toBeDefined();
    expect(notif?.body).toContain('relocated from B-B-204 to B-B-206');

    // Verify Audit Log entry created (matching AUD003 in seed workbook)
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CONFIRM_RELOCATION', entityId: 'BKG-EXAM' },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    expect(audit?.afterJson).toContain('RM-B-206');
  });

  afterAll(async () => {
    await prisma.roomBooking.update({
      where: { id: 'BKG-EXAM' },
      data: { roomId: 'RM-B-204' },
    });
    await prisma.$disconnect();
  });
});
