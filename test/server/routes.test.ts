import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.js';

const PHAM_DUY_INPUT = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('POST /charts', () => {
  it('tra ve 200 va Chart dung cho input Pham Duy da xac minh', async () => {
    const res = await request(app).post('/charts').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);
    expect(res.body.menh_than.menh_branch).toBe('Hoi');
    expect(res.body.menh_than.same_palace).toBe(true);
  });

  it('tra ve 400 khi thieu field bat buoc (date)', async () => {
    const res = await request(app)
      .post('/charts')
      .send({ calendar_type: 'duong_lich', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  it('tra ve 400 khi calendar_type khong hop le', async () => {
    const res = await request(app)
      .post('/charts')
      .send({ calendar_type: 'khong_hop_le', date: '1998-12-17', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
  });
});
