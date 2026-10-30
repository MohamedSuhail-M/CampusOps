import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Campus Directory & Asset Lookup Module', () => {
  let authCookie: string;
  const password = process.env.DEMO_PASSWORD || 'password123';

  beforeAll(async () => {
    // Log in as student to get a valid session cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password });
    authCookie = loginRes.headers['set-cookie'];
  });

  it('1. should reject unauthenticated directory requests (401)', async () => {
    const res = await request(app).get('/api/directory/departments');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. should fetch 5 departments with manager details', async () => {
    const res = await request(app)
      .get('/api/directory/departments')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(5);
    expect(res.body.data[0].manager).toBeDefined();
    expect(res.body.data[0].manager.name).toBeDefined();
  });

  it('3. should fetch all 4 campus buildings (A, B, C, D)', async () => {
    const res = await request(app)
      .get('/api/directory/buildings')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(4);
    const codes = res.body.data.map((b: any) => b.code);
    expect(codes).toEqual(['A', 'B', 'C', 'D']);
  });

  it('4. should fetch rooms filtered by building', async () => {
    // Get building B id
    const bldRes = await request(app)
      .get('/api/directory/buildings')
      .set('Cookie', authCookie);
    const bldB = bldRes.body.data.find((b: any) => b.code === 'B');
    expect(bldB).toBeDefined();

    const roomsRes = await request(app)
      .get(`/api/directory/rooms?buildingId=${bldB.id}`)
      .set('Cookie', authCookie);

    expect(roomsRes.status).toBe(200);
    expect(roomsRes.body.success).toBe(true);
    expect(roomsRes.body.data.length).toBeGreaterThan(0);
    expect(roomsRes.body.data.every((r: any) => r.buildingId === bldB.id)).toBe(true);
  });

  it('5. should fetch single room details by ID', async () => {
    const roomRes = await request(app)
      .get('/api/directory/rooms/RM-B-204')
      .set('Cookie', authCookie);

    expect(roomRes.status).toBe(200);
    expect(roomRes.body.success).toBe(true);
    expect(roomRes.body.data.code).toBe('B-204');
    expect(roomRes.body.data.building).toBeDefined();
    expect(roomRes.body.data.assets.length).toBeGreaterThan(0);
  });

  it('6. should lookup asset by QR code tag', async () => {
    // Search for first asset tag
    const assetsRes = await request(app)
      .get('/api/directory/assets?roomId=RM-B-204')
      .set('Cookie', authCookie);

    expect(assetsRes.status).toBe(200);
    const targetAsset = assetsRes.body.data[0];
    expect(targetAsset).toBeDefined();

    const lookupRes = await request(app)
      .get(`/api/directory/assets/lookup?qr=${targetAsset.assetTag}`)
      .set('Cookie', authCookie);

    expect(lookupRes.status).toBe(200);
    expect(lookupRes.body.success).toBe(true);
    expect(lookupRes.body.data.id).toBe(targetAsset.id);
    expect(lookupRes.body.data.assetTag).toBe(targetAsset.assetTag);
    expect(lookupRes.body.data.room.code).toBe('B-204');
  });

  it('7. should return 404 for invalid QR code tag', async () => {
    const lookupRes = await request(app)
      .get('/api/directory/assets/lookup?qr=NON_EXISTENT_QR_TAG')
      .set('Cookie', authCookie);

    expect(lookupRes.status).toBe(404);
    expect(lookupRes.body.success).toBe(false);
    expect(lookupRes.body.error.code).toBe('NOT_FOUND');
  });

  it('8. should list users filtered by role with skills', async () => {
    const techRes = await request(app)
      .get('/api/directory/users?roleCode=TECHNICIAN')
      .set('Cookie', authCookie);

    expect(techRes.status).toBe(200);
    expect(techRes.body.success).toBe(true);
    expect(techRes.body.data.length).toBe(8); // USR031 through USR038
    const manoj = techRes.body.data.find((u: any) => u.loginId === 'campus031');
    expect(manoj).toBeDefined();
    expect(manoj.skills.length).toBeGreaterThan(0);
    expect(manoj.skills[0].skill).toBe('Electrical');
  });
});
