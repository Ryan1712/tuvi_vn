import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.js';

vi.mock('../../src/llm/anthropic-client.js', () => ({
  callAnthropic: vi.fn().mockResolvedValue('Day la bai Tong quan gia lap cho test.'),
}));

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

describe('POST /charts/overview', () => {
  it('tra ve 200, chart dung, overview_text tu (mock) LLM', async () => {
    const res = await request(app).post('/charts/overview').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);
    expect(res.body.chart.menh_than.menh_branch).toBe('Hoi');
    expect(res.body.overview_text).toBe('Day la bai Tong quan gia lap cho test.');
  });

  it('tra ve 400 khi input khong hop le (khong goi LLM)', async () => {
    const res = await request(app)
      .post('/charts/overview')
      .send({ calendar_type: 'khong_hop_le', date: '1998-12-17', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
  });
});

describe('POST /charts/query', () => {
  it('tra ve 200, chart dung, domain dung, overview_text tu (mock) LLM', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ ...PHAM_DUY_INPUT, domain: 'quan_loc' });
    expect(res.status).toBe(200);
    expect(res.body.chart.menh_than.menh_branch).toBe('Hoi');
    expect(res.body.domain).toBe('quan_loc');
    expect(res.body.overview_text).toBe('Day la bai Tong quan gia lap cho test.');
  });

  it('tra ve 400 khi domain khong hop le', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ ...PHAM_DUY_INPUT, domain: 'khong_ton_tai' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('tra ve 400 khi input chart khong hop le (khong goi LLM)', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ calendar_type: 'khong_hop_le', date: '1998-12-17', time_index: 12, gender: 'nam', domain: 'quan_loc' });
    expect(res.status).toBe(400);
  });

  it('domain mo ho (phu_mau) tra ve 2 cung trong chart.palaces filtered — kiem tra qua chart day du, khong qua QueryEvidencePack (khong nam trong response)', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ ...PHAM_DUY_INPUT, domain: 'phu_mau' });
    expect(res.status).toBe(200);
    // chart tra ve la FULL Chart (12 cung), khong bi cat theo domain — chi
    // QueryEvidencePack (input cho LLM) moi bi thu hep, va no khong nam trong response.
    expect(res.body.chart.palaces).toHaveLength(12);
  });
});
