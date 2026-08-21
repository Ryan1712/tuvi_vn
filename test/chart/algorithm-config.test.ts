import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

const OTHER_CASE: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1990-06-15',
  time_index: 6,
  gender: 'nu',
  fix_leap: true,
};

describe('algorithm: zhongzhou — global config nhat quan qua nhieu lan build', () => {
  it('build xen ke 2 case khac nhau nhieu lan, moi lan deu ra dung gia tri zhongzhou da biet truoc', () => {
    // Ca 2 gia tri ky vong DA duoc xac dinh truoc (chay astro.config({algorithm:'zhongzhou'})
    // + astro.bySolar() that luc viet design doc 2026-08-21-algorithm-zhongzhou-design.md,
    // KHONG suy ra tu ket qua cua chinh test nay) — day la diem lam guard nay THAT SU co y
    // nghia: neu global state vo tinh chay theo algorithm 'default', ca 4 assert duoi day se
    // FAIL ngay (Cu Mon != Loc Ton), khong co cach nao "tu trung khop" gia.
    const PHAM_DUY_SOUL = 'Lộc Tồn';
    const OTHER_CASE_SOUL = 'Phá Quân';

    const chart1 = buildChart(PHAM_DUY);
    expect(chart1.menh_than.soul_star).toBe(PHAM_DUY_SOUL);

    const chart2 = buildChart(OTHER_CASE);
    expect(chart2.menh_than.soul_star).toBe(OTHER_CASE_SOUL);

    // Build lai CA 2 case LAN NUA, dao thu tu — xac nhan ket qua GIONG HET lan dau, khong
    // bi "troi" theo thu tu goi hay so lan build truoc do (bat loi tich luy qua nhieu lan
    // goi, khac voi loi chi xuat hien o 1 lan build dau tien).
    const chart2Again = buildChart(OTHER_CASE);
    expect(chart2Again.menh_than.soul_star).toBe(OTHER_CASE_SOUL);
    const chart1Again = buildChart(PHAM_DUY);
    expect(chart1Again.menh_than.soul_star).toBe(PHAM_DUY_SOUL);
  });

  it('engine_meta.notes ghi ro dang dung algorithm zhongzhou', () => {
    const chart = buildChart(PHAM_DUY);
    expect(chart.engine_meta.notes.some((n) => n.includes('zhongzhou'))).toBe(true);
  });
});
