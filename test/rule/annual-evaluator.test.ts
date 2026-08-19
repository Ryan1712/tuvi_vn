import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { evaluateAnnualRule } from '../../src/rule/annual-evaluator.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY_2026: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
  view_year: '2026-01-01',
};

/**
 * Rule TEST-ONLY, khong thuoc knowledge-base.ts — dung de chung minh
 * annual-evaluator.ts hoat dong dung tren du lieu Pham Duy that (nam xem 2026), vi
 * khong co Rule san xuat nao trong Entry mau muc 9 dung scope annual.
 * Da xac minh: cung Hoi (= Menh GOC, chart.menh_than.menh_branch) co LUU_THIEN_MA;
 * cung Ty (Tat Ach) co LUU_THIEN_KHOI; cung Suu (Tai Bach) khong co sao nao.
 * Dung branch='Hoi' (co dinh, Menh goc) CHI vi don gian de test ky thuat — KHONG phai
 * khang dinh day la cach doc Tu Vi "dung" (xem design doc muc 5, ranh gioi branch con
 * mo — Trung Chau/Tam Hop Phai co the nghieng ve cung xoay theo Luu Nien thay vi co dinh).
 */
const TEST_ONLY_RULE_ANNUAL: Rule = {
  rule_id: 'TEST_ONLY_ANNUAL_LUU_THIEN_MA',
  conflict_group_id: null,
  scope: 'annual',
  subject: { type: 'star', id: 'LUU_THIEN_MA' },
  conditions: [
    { field: 'luu_nien_stars', operator: 'contains', value: 'LUU_THIEN_MA', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Hoi', effect: 'test only', weight: 0.5 },
  ],
  exceptions: [
    { conditions: [{ field: 'luu_nien_stars', operator: 'not_contains', value: 'LUU_KHONG_TON_TAI', required: true }], effect: 'test only' },
  ],
  conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, khong phai Rule san xuat',
};

const TEST_ONLY_RULE_WRONG_FIELD: Rule = {
  ...TEST_ONLY_RULE_ANNUAL,
  rule_id: 'TEST_ONLY_ANNUAL_WRONG_FIELD',
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'LUU_THIEN_MA', required: true },
  ],
};

const WRONG_SCOPE_RULE: Rule = {
  ...TEST_ONLY_RULE_ANNUAL,
  rule_id: 'TEST_ONLY_WRONG_SCOPE',
  scope: 'star_palace',
};

describe('evaluateAnnualRule', () => {
  it('throw khi rule.scope khac "annual"', () => {
    const chart = buildChart(PHAM_DUY_2026);
    expect(() =>
      evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', WRONG_SCOPE_RULE),
    ).toThrow(/scope "annual"/);
  });

  it('throw khi Condition.field khac "luu_nien_stars" cho scope annual', () => {
    const chart = buildChart(PHAM_DUY_2026);
    expect(() =>
      evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', TEST_ONLY_RULE_WRONG_FIELD),
    ).toThrow(/luu_nien_stars/);
  });

  it('matched true khi tra tai Hoi (co LUU_THIEN_MA)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const result = evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', TEST_ONLY_RULE_ANNUAL);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('TEST_ONLY_ANNUAL_LUU_THIEN_MA');
    expect(result.matched_modifiers).toHaveLength(1);
    expect(result.triggered_exceptions).toHaveLength(1);
  });

  it('matched false khi tra tai Suu (khong co sao nao)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const result = evaluateAnnualRule(chart, chart.luu_nien!, 'Suu', TEST_ONLY_RULE_ANNUAL);
    expect(result.matched).toBe(false);
    expect(result.matched_modifiers).toHaveLength(0);
  });

  it('branch la tham so hoat dong that: cung 1 luuNien, 2 branch khac nhau ra ket qua khac nhau', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const ruleFindsKhoi: Rule = {
      ...TEST_ONLY_RULE_ANNUAL,
      rule_id: 'TEST_ONLY_ANNUAL_LUU_THIEN_KHOI',
      conditions: [
        { field: 'luu_nien_stars', operator: 'contains', value: 'LUU_THIEN_KHOI', required: true },
      ],
      modifiers: [],
      exceptions: [],
    };
    const atHoi = evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', ruleFindsKhoi);
    const atTy = evaluateAnnualRule(chart, chart.luu_nien!, 'Ty', ruleFindsKhoi);
    expect(atHoi.matched).toBe(false); // Hoi khong co LUU_THIEN_KHOI
    expect(atTy.matched).toBe(true); // Ty co LUU_THIEN_KHOI
  });

  it('khong tim thay cung trong LuuNien.palaces thi throw ro rang', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const brokenLuuNien = { ...chart.luu_nien!, palaces: [] };
    expect(() =>
      evaluateAnnualRule(chart, brokenLuuNien, 'Hoi', TEST_ONLY_RULE_ANNUAL),
    ).toThrow(/khong tim thay cung/);
  });

  it('modifier operator "not_in" hoat dong dung — branch NOT in excluded list thi khop', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const ruleWithNotIn: Rule = {
      rule_id: 'TEST_ONLY_ANNUAL_BRANCH_NOT_IN',
      conflict_group_id: null,
      scope: 'annual',
      subject: { type: 'star', id: 'LUU_THIEN_MA' },
      conditions: [
        { field: 'luu_nien_stars', operator: 'contains', value: 'LUU_THIEN_MA', required: true },
      ],
      modifiers: [
        { field: 'branch', operator: 'not_in', value: 'Suu', effect: 'test only', weight: 0.5 },
      ],
      exceptions: [],
      conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
      school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, branch not_in test',
    };

    const chart_ = buildChart(PHAM_DUY_2026);
    // Hoi is NOT in excluded list 'Suu' — modifier should match
    const resultHoi = evaluateAnnualRule(chart_, chart_.luu_nien!, 'Hoi', ruleWithNotIn);
    expect(resultHoi.matched_modifiers).toHaveLength(1);
    expect(resultHoi.matched_modifiers.at(0)?.field).toBe('branch');

    // Suu is in excluded list 'Suu' — modifier should NOT match
    const resultSuu = evaluateAnnualRule(chart_, chart_.luu_nien!, 'Suu', ruleWithNotIn);
    expect(resultSuu.matched_modifiers).toHaveLength(0);
  });

  it('modifier operator "equals" for branch hoat dong dung — chi khop chi chinh xac khi chi 1 gia tri', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const ruleWithEquals: Rule = {
      rule_id: 'TEST_ONLY_ANNUAL_BRANCH_EQUALS',
      conflict_group_id: null,
      scope: 'annual',
      subject: { type: 'star', id: 'LUU_THIEN_MA' },
      conditions: [
        { field: 'luu_nien_stars', operator: 'contains', value: 'LUU_THIEN_MA', required: true },
      ],
      modifiers: [
        { field: 'branch', operator: 'equals', value: 'Hoi', effect: 'test only', weight: 0.5 },
      ],
      exceptions: [],
      conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
      school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, branch equals test',
    };

    const chart_ = buildChart(PHAM_DUY_2026);
    // Hoi matches exactly
    const resultHoi = evaluateAnnualRule(chart_, chart_.luu_nien!, 'Hoi', ruleWithEquals);
    expect(resultHoi.matched_modifiers).toHaveLength(1);

    // Ty does not match
    const resultTy = evaluateAnnualRule(chart_, chart_.luu_nien!, 'Ty', ruleWithEquals);
    expect(resultTy.matched_modifiers).toHaveLength(0);
  });
});
