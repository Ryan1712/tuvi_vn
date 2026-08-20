import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { resolveQuery, daiVanAtBranch } from '../../src/rule/query-resolver.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('resolveQuery', () => {
  it('domain ro rang (quan_loc) tra ve mang 1 branch, dung branch cua cung Quan Loc', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'quan_loc');
    expect(branches).toEqual(['Mao']);
  });

  it('domain mo ho (phu_mau) tra ve nhieu branch, DUNG THU TU Phu Mau truoc Huynh De', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'phu_mau');
    expect(branches).toEqual(['Ty', 'Tuat']);
  });

  it('domain mo ho (phu_the) tra ve nhieu branch, DUNG THU TU Phu The truoc Tu Nu', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'phu_the');
    expect(branches).toEqual(['Dau', 'Than']);
  });

  it('domain menh tra ve branch Menh, khop chart.menh_than.menh_branch', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'menh');
    expect(branches).toEqual([chart.menh_than.menh_branch]);
  });

  it('throw ro rang khi domain khong ton tai trong DOMAIN_PALACE_MAP', () => {
    const chart = buildChart(PHAM_DUY);
    // @ts-expect-error - deliberately invalid domain for runtime guard test
    expect(() => resolveQuery(chart, 'khong_ton_tai')).toThrow(/khong tim thay domain/);
  });
});

describe('daiVanAtBranch', () => {
  it('tim dung DaiVan co branch khop cung Quan Loc (Mao), KHAC Dai Van hien tai', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVan = daiVanAtBranch(chart, 'Mao');
    expect(daiVan.branch).toBe('Mao');
    expect(daiVan.age_from).toBe(42);
    expect(daiVan.age_to).toBe(51);
    expect(daiVan.chart_id).toBe(chart.chart_id);
  });

  it('tim dung DaiVan tai cung Menh (Hoi), gia tri tuoi dau doi', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVan = daiVanAtBranch(chart, 'Hoi');
    expect(daiVan.age_from).toBe(2);
    expect(daiVan.age_to).toBe(11);
  });

  it('throw ro rang neu khong tim thay branch nao khop (khong nen xay ra voi Branch hop le)', () => {
    const chart = buildChart(PHAM_DUY);
    // @ts-expect-error - deliberately invalid branch for runtime guard test
    expect(() => daiVanAtBranch(chart, 'KhongTonTai')).toThrow(/khong tim thay Dai Van/);
  });
});
