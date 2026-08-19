import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { evaluateDecadeRule } from '../../src/rule/decade-evaluator.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput, DaiVan } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

/**
 * Rule TEST-ONLY, khong thuoc knowledge-base.ts — dung de chung minh
 * decade-evaluator.ts hoat dong dung tren du lieu Pham Duy that, vi khong co Rule
 * san xuat nao trong Entry mau muc 9 dung scope decade.
 * Da xac minh: cung Hoi (Menh) co Thien Dong; cung Suu (Phuc Duc, tuoi 22-31, gom
 * tuoi hien tai 29) khong co Thien Dong (co Thai Duong + Thai Am).
 */
const TEST_ONLY_RULE_DECADE: Rule = {
  rule_id: 'TEST_ONLY_DECADE_THIEN_DONG',
  conflict_group_id: null,
  scope: 'decade',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Hoi', effect: 'test only', weight: 0.5 },
  ],
  exceptions: [
    { conditions: [{ field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true }], effect: 'test only' },
  ],
  conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, khong phai Rule san xuat',
};

const WRONG_SCOPE_RULE: Rule = {
  ...TEST_ONLY_RULE_DECADE,
  rule_id: 'TEST_ONLY_WRONG_SCOPE',
  scope: 'star_palace',
};

describe('evaluateDecadeRule', () => {
  it('throw khi rule.scope khac "decade"', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!;
    expect(() => evaluateDecadeRule(chart, daiVanTaiHoi, WRONG_SCOPE_RULE)).toThrow(/scope "decade"/);
  });

  it('throw khi daiVan khong khop entry nao trong chart.luck_cycles.dai_van', () => {
    const chart = buildChart(PHAM_DUY);
    const fakeDaiVan: DaiVan = { age_from: 999, age_to: 1008, branch: 'Hoi', stem: 'Giáp', palace_name: 'Mệnh' };
    expect(() => evaluateDecadeRule(chart, fakeDaiVan, TEST_ONLY_RULE_DECADE)).toThrow(/khong khop/);
  });

  it('matched true khi Dai Van tro vao cung Hoi (co Thien Dong)', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!;
    const result = evaluateDecadeRule(chart, daiVanTaiHoi, TEST_ONLY_RULE_DECADE);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('TEST_ONLY_DECADE_THIEN_DONG');
    expect(result.matched_modifiers).toHaveLength(1);
  });

  it('matched false khi Dai Van tro vao cung Suu (khong co Thien Dong)', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiSuu = chart.luck_cycles.dai_van.find((d) => d.branch === 'Suu')!;
    const result = evaluateDecadeRule(chart, daiVanTaiSuu, TEST_ONLY_RULE_DECADE);
    expect(result.matched).toBe(false);
    expect(result.matched_modifiers).toHaveLength(0);
  });

  it('triggered_exceptions danh gia dung tren cung dich, khong phai cung goc', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!;
    const result = evaluateDecadeRule(chart, daiVanTaiHoi, TEST_ONLY_RULE_DECADE);
    // Cung Hoi co DIA_KHONG trong minor_stars (da xac minh o cac plan truoc — case Pham Duy)
    expect(result.triggered_exceptions).toHaveLength(1);
  });
});
