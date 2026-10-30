import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('SLA Monitoring, Notifications & Audit Trail (Checkpoint 25)', () => {
  let adminCookie: string;
  let studentCookie: string;
  let testNotifId: string;

  beforeAll(async () => {
    // 1. Login System Admin (campus029 - Mr Rajesh K)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus029', password: 'password123', requestedRole: 'SYSTEM_ADMIN' });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.headers['set-cookie'][0];

    // 2. Login Student (campus001) for RBAC negative checks
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: 'password123', requestedRole: 'STUDENT' });
    expect(studentLogin.status).toBe(200);
    studentCookie = studentLogin.headers['set-cookie'][0];

    // Seed a test notification for the student
    const notif = await prisma.notification.create({
      data: {
        id: `NOT-TEST-${Date.now()}`,
        recipientId: 'USR001',
        eventType: 'TEST_ALERT',
        title: 'Welcome to CampusOps',
        body: 'Your incident report has been received and scheduled for inspection.',
        readAt: null,
      },
    });
    testNotifId = notif.id;
  });

  afterAll(async () => {
    if (testNotifId) {
      await prisma.notification.deleteMany({ where: { id: testNotifId } });
    }
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------
  // SLA METRICS & POLICIES
  // -------------------------------------------------------------

  it('1. should return configured SLA priority policies with response and resolution minutes', async () => {
    const res = await request(app)
      .get('/api/sla/policies')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const criticalPolicy = res.body.data.find((p: any) => p.priority === 'CRITICAL');
    expect(criticalPolicy).toBeDefined();
    expect(criticalPolicy.responseMinutes).toBeLessThanOrEqual(60);
  });

  it('2. should evaluate SLA compliance across incidents and return compliance metrics', async () => {
    const res = await request(app)
      .get('/api/sla/metrics')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalAssessed).toBe('number');
    expect(typeof res.body.data.complianceRatePercent).toBe('number');
    expect(Array.isArray(res.body.data.incidents)).toBe(true);
    expect(res.body.data.incidents.length).toBeGreaterThan(0);

    const firstInc = res.body.data.incidents[0];
    expect(firstInc).toHaveProperty('incidentId');
    expect(firstInc).toHaveProperty('responseDueAt');
    expect(firstInc).toHaveProperty('resolutionDueAt');
    expect(firstInc).toHaveProperty('isResolutionBreached');
  });

  // -------------------------------------------------------------
  // IN-APP NOTIFICATIONS
  // -------------------------------------------------------------

  it('3. should list user notifications and count unread messages', async () => {
    const res = await request(app)
      .get('/api/sla/user/all')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    const found = res.body.data.notifications.find((n: any) => n.id === testNotifId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Welcome to CampusOps');
    expect(found.readAt).toBeNull();
  });

  it('4. should mark a single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/sla/user/${testNotifId}/read`)
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.readAt).not.toBeNull();
  });

  it('5. should mark all remaining unread notifications as read', async () => {
    const res = await request(app)
      .patch('/api/sla/user/read-all')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify unread count is now 0
    const checkRes = await request(app)
      .get('/api/sla/user/all')
      .set('Cookie', studentCookie);
    expect(checkRes.body.data.unreadCount).toBe(0);
  });

  // -------------------------------------------------------------
  // SIMULATED OUTBOX DISPATCH
  // -------------------------------------------------------------

  it('6. should view outbox events and simulate dispatching pending events', async () => {
    // Create a pending outbox event
    const timestamp = Date.now();
    await prisma.outboxEvent.create({
      data: {
        id: `EVT-TEST-${timestamp}`,
        eventKey: `KEY-TEST-${timestamp}`,
        eventType: 'SMS_ALERT',
        payload: JSON.stringify({ to: '+919876543210', msg: 'Exam room relocated' }),
        status: 'PENDING',
      },
    });

    const getRes = await request(app)
      .get('/api/sla/outbox')
      .set('Cookie', adminCookie);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);

    const procRes = await request(app)
      .post('/api/sla/outbox/process')
      .set('Cookie', adminCookie);
    expect(procRes.status).toBe(200);
    expect(procRes.body.success).toBe(true);
    expect(procRes.body.data.processedCount).toBeGreaterThanOrEqual(1);

    // Clean up
    await prisma.outboxEvent.deleteMany({ where: { eventKey: `KEY-TEST-${timestamp}` } });
  });

  // -------------------------------------------------------------
  // ADMINISTRATION, AUDIT & SYSTEM HEALTH
  // -------------------------------------------------------------

  it('7. should reject unauthorized non-admin user from admin endpoints (403)', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('8. should return operational overview metrics for System Admin', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('incidents');
    expect(res.body.data).toHaveProperty('workOrders');
    expect(res.body.data).toHaveProperty('inventory');
    expect(Array.isArray(res.body.data.recentAudits)).toBe(true);
  });

  it('9. should query audit log trail with actor details and entity filter', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?limit=10')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    if (res.body.data.logs.length > 0) {
      const firstLog = res.body.data.logs[0];
      expect(firstLog).toHaveProperty('action');
      expect(firstLog).toHaveProperty('entityType');
      expect(firstLog).toHaveProperty('actor');
    }
  });

  it('10. should report system health with SQLite DB file status and table counts', async () => {
    const res = await request(app)
      .get('/api/admin/system-health')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
    expect(res.body.data.database.type).toBe('SQLite');
    expect(res.body.data.tableRecordCounts.users).toBeGreaterThan(0);
    expect(res.body.data.tableRecordCounts.incidents).toBeGreaterThan(0);
    expect(res.body.data.tableRecordCounts.auditLogs).toBeGreaterThan(0);
  });
});
