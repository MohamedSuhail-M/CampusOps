import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/health', () => {
  it('should return 200 with status online and metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('CampusOps Core API is online');
    expect(res.body.environment).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });
});
