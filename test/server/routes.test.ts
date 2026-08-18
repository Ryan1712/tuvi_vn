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

describe('POST /charts/rules', () => {
  it('tra ve 200, ca RULE_A va RULE_B match tren cung Hoi, gom vao 1 conflict group', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);

    expect(res.body.chart.menh_than.menh_branch).toBe('Hoi');

    const hoiResult = res.body.rules_by_palace.Hoi;
    const matchedIds = hoiResult.matched
      .filter((r: { matched: boolean }) => r.matched)
      .map((r: { rule_id: string }) => r.rule_id)
      .sort();
    expect(matchedIds).toEqual([
      'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
      'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
    ]);

    expect(hoiResult.conflicts).toHaveLength(1);
    expect(hoiResult.conflicts[0].conflict_group_id).toBe('CG_001');
    expect(hoiResult.conflicts[0].rules.map((r: { rule_id: string }) => r.rule_id).sort()).toEqual([
      'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
      'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
    ]);
  });

  it('co ket qua cho ca 12 cung, kho ng chi cung Hoi', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);
    const branches = Object.keys(res.body.rules_by_palace).sort();
    expect(branches).toEqual(
      ['Dan', 'Dau', 'Hoi', 'Mao', 'Mui', 'Ngo', 'Suu', 'Than', 'Thin', 'Tuat', 'Ty', 'Ty2'].sort(),
    );
  });

  it('cung khong match rule nao van co matched voi toan bo ket qua false, conflicts rong', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    // Cung Dan (Dien Trach) khong co Thien Dong/Khong/Kiep -> khong rule nao match
    const danResult = res.body.rules_by_palace.Dan;
    expect(danResult.matched).toHaveLength(2); // ca RULE_A, RULE_B deu duoc danh gia
    expect(danResult.matched.every((r: { matched: boolean }) => r.matched === false)).toBe(true);
    expect(danResult.conflicts).toHaveLength(0);
  });

  it('tra ve 400 khi input sai', async () => {
    const res = await request(app)
      .post('/charts/rules')
      .send({ calendar_type: 'duong_lich', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('tra ve luu_nien khi request co view_year', async () => {
    const res = await request(app)
      .post('/charts/rules')
      .send({ ...PHAM_DUY_INPUT, view_year: '2026-01-01' });
    expect(res.status).toBe(200);
    expect(res.body.chart.luu_nien).toBeDefined();
    expect(res.body.chart.luu_nien.year).toBe(2026);
    expect(res.body.chart.luu_nien.palaces).toHaveLength(12);
  });

  it('luu_nien la undefined (khong co key trong JSON) khi khong co view_year', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);
    expect(res.body.chart.luu_nien).toBeUndefined();
  });
});
