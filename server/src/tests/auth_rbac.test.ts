import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('CampusOps Authentication & RBAC System', () => {
  const validPassword = process.env.DEMO_PASSWORD || 'password123';

  it('1. should reject login with invalid password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: 'wrong_password_999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('2. should reject login with unauthorized requested role (403)', async () => {
    // campus001 is a STUDENT, requesting SYSTEM_ADMIN must fail
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: 'campus001',
        password: validPassword,
        requestedRole: 'SYSTEM_ADMIN',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROLE_NOT_AUTHORIZED');
  });

  it('3. should successfully log in student with valid demo credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: 'campus001',
        password: validPassword,
        requestedRole: 'STUDENT',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Aarav Raman');
    expect(res.body.data.user.activeRole).toBe('STUDENT');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('4. should enforce RBAC: allow student to student-only, forbid student from admin-only', async () => {
    // Log in as student first
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: validPassword });

    const cookie = loginRes.headers['set-cookie'];
    expect(cookie).toBeDefined();

    // Student access to student-only route -> 200
    const studentRouteRes = await request(app)
      .get('/api/test/student-only')
      .set('Cookie', cookie);
    expect(studentRouteRes.status).toBe(200);
    expect(studentRouteRes.body.success).toBe(true);

    // Student access to admin-only route -> 403 Forbidden!
    const adminRouteRes = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', cookie);
    expect(adminRouteRes.status).toBe(403);
    expect(adminRouteRes.body.success).toBe(false);
    expect(adminRouteRes.body.error.code).toBe('FORBIDDEN');
  });

  it('5. should allow admin access to admin-only route', async () => {
    // Log in as System Admin (campus029)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: 'campus029',
        password: validPassword,
        requestedRole: 'SYSTEM_ADMIN',
      });

    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers['set-cookie'];

    const adminRouteRes = await request(app)
      .get('/api/test/admin-only')
      .set('Cookie', cookie);

    expect(adminRouteRes.status).toBe(200);
    expect(adminRouteRes.body.success).toBe(true);
    expect(adminRouteRes.body.user).toBe('Ms Aisha Rahman');
  });

  it('6. should return user session profile at /api/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: validPassword });

    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.loginId).toBe('campus001');
    expect(meRes.body.data.activeRole).toBe('STUDENT');
    expect(meRes.body.data.roles.length).toBeGreaterThan(0);
  });

  it('7. should clear session cookie upon logout', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password: validPassword });

    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });
});
