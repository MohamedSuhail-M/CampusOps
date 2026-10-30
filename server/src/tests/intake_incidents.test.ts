import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';
import { runOfflineTriage } from '../services/triage.service';

describe('Intake, Triage & Incident Lifecycle Module', () => {
  let studentCookie: string;
  let adminCookie: string;
  const password = process.env.DEMO_PASSWORD || 'password123';

  beforeAll(async () => {
    // Log in as student
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password });
    studentCookie = studentLogin.headers['set-cookie'];

    // Log in as Facilities Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus028', password, requestedRole: 'FACILITIES_ADMIN' });
    adminCookie = adminLogin.headers['set-cookie'];

    // Clean up previous test-generated artifacts for RM-A-101
    await prisma.incidentReport.deleteMany({
      where: { incident: { roomId: 'RM-A-101' } },
    });
    await prisma.incident.deleteMany({
      where: { roomId: 'RM-A-101' },
    });
    await prisma.intakeMessage.deleteMany({
      where: { originalText: { contains: 'RM-A-101' } },
    });
  });

  it('1. should perform accurate offline deterministic triage', () => {
    // Electrical sparking hazard
    const electricalTriage = runOfflineTriage('Sparking electrical socket in B-204 exam hall creating dangerous smoke');
    expect(electricalTriage.category).toBe('ELECTRICAL');
    expect(electricalTriage.suggestedPriority).toBe('CRITICAL');
    expect(electricalTriage.extractedRoomCode).toBe('B-204');
    expect(electricalTriage.extractedBuildingCode).toBe('B');

    // Wi-Fi network disruption
    const wifiTriage = runOfflineTriage('The wifi internet connection is completely down in C-201');
    expect(wifiTriage.category).toBe('NETWORK');
    expect(wifiTriage.suggestedPriority).toBe('HIGH');
    expect(wifiTriage.extractedRoomCode).toBe('C-201');

    // Leaking pipe
    const plumbingTriage = runOfflineTriage('Water tap leak in the 2nd floor sink');
    expect(plumbingTriage.category).toBe('PLUMBING');
    expect(plumbingTriage.missingInformation.length).toBeGreaterThan(0);
  });

  it('2. should provide real-time triage preview without persisting records', async () => {
    const initialCount = await prisma.intakeMessage.count();

    const res = await request(app)
      .post('/api/intake/triage-preview')
      .set('Cookie', studentCookie)
      .send({
        originalText: 'Sparking socket in Room B-204',
        buildingId: 'BLD02',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.triage.category).toBe('ELECTRICAL');
    expect(res.body.data.triage.suggestedPriority).toBe('CRITICAL');

    // DB count must NOT have changed
    const afterCount = await prisma.intakeMessage.count();
    expect(afterCount).toBe(initialCount);
  });

  let createdIncidentId: string;
  let firstMessageId: string;

  it('3. should submit new complaint, create persistent IntakeMessage, and generate new Incident', async () => {
    const res = await request(app)
      .post('/api/intake')
      .set('Cookie', studentCookie)
      .send({
        originalText: 'Severe AC water leak flooding room RM-A-101 lab',
        channel: 'WEB',
        buildingId: 'BLD-A',
        roomId: 'RM-A-101',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDuplicate).toBe(false);
    expect(res.body.data.category).toBe('HVAC');
    expect(res.body.data.status).toBe('NEW');
    expect(res.body.data.incidentReference).toMatch(/^INC-2026-/);

    createdIncidentId = res.body.data.incidentId;
    firstMessageId = res.body.data.intakeMessageId;

    // Verify record in DB
    const dbMsg = await prisma.intakeMessage.findUnique({ where: { id: firstMessageId } });
    expect(dbMsg).toBeDefined();
    expect(dbMsg?.originalText).toContain('Severe AC water leak');
  });

  it('4. should auto-correlate duplicate complaint to existing incident without creating duplicates', async () => {
    // Another student reports the exact same HVAC leak in RM-A-101
    const res = await request(app)
      .post('/api/intake')
      .set('Cookie', studentCookie)
      .send({
        originalText: 'The air conditioner in RM-A-101 is still leaking water all over the floor',
        channel: 'QR',
        buildingId: 'BLD-A',
        roomId: 'RM-A-101',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDuplicate).toBe(true);
    expect(res.body.data.incidentId).toBe(createdIncidentId);

    // Verify that the second message is stored as RELATED report on the existing incident
    const reports = await prisma.incidentReport.findMany({
      where: { incidentId: createdIncidentId },
    });
    expect(reports.length).toBe(2);
    expect(reports.some((r) => r.relationshipType === 'PRIMARY')).toBe(true);
    expect(reports.some((r) => r.relationshipType === 'RELATED')).toBe(true);
  });

  it('5. should fetch authenticated user complaints at /api/intake/my-complaints', async () => {
    const res = await request(app)
      .get('/api/intake/my-complaints')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const myFirstMsg = res.body.data.find((m: any) => m.id === firstMessageId);
    expect(myFirstMsg).toBeDefined();
    expect(myFirstMsg.incident.id).toBe(createdIncidentId);
  });

  it('6. should fetch full incident dossier with SLA calculation', async () => {
    const res = await request(app)
      .get(`/api/incidents/${createdIncidentId}`)
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdIncidentId);
    expect(res.body.data.incidentReports.length).toBe(2);
    expect(res.body.data.sla).toBeDefined();
    expect(res.body.data.sla.resolutionDeadline).toBeDefined();
  });

  it('7. should enforce valid state transitions on incidents (reject invalid transitions)', async () => {
    // Current status is 'NEW'
    // Attempting invalid transition: 'NEW' -> 'CLOSED' must be rejected with 400
    const invalidRes = await request(app)
      .patch(`/api/incidents/${createdIncidentId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'CLOSED' });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.error.code).toBe('INVALID_TRANSITION');

    // Valid transition: 'NEW' -> 'TRIAGED' must succeed with 200
    const validRes = await request(app)
      .patch(`/api/incidents/${createdIncidentId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'TRIAGED' });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.status).toBe('TRIAGED');
  });

  it('8. should verify audit log recorded the state changes', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { entityId: createdIncidentId },
      orderBy: { createdAt: 'desc' },
    });

    expect(logs.length).toBeGreaterThan(0);
    const statusUpdateLog = logs.find((l) => l.action === 'UPDATE_STATUS');
    expect(statusUpdateLog).toBeDefined();
    expect(statusUpdateLog?.afterJson).toContain('TRIAGED');
  });
});
