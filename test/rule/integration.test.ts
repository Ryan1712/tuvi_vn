import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { matchRules } from '../../src/rule/evaluator.js';
import { resolveConflicts } from '../../src/rule/conflict-resolver.js';
import { KNOWLEDGE_BASE, RULE_A, RULE_B } from '../../src/rule/knowledge-base.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('End-to-end: Chart Pham Duy thuc qua Rule Engine', () => {
  it('ca RULE_A va RULE_B deu match tren Menh@Hoi', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    // So luong ket qua = so luong KNOWLEDGE_BASE (khong hardcode — KB co the mo rong sau nay).
    expect(results).toHaveLength(KNOWLEDGE_BASE.length);
    expect(results.find((r) => r.rule_id === RULE_A.rule_id)?.matched).toBe(true);
    expect(results.find((r) => r.rule_id === RULE_B.rule_id)?.matched).toBe(true);
  });

  it('RULE_B co modifier vi tri Hoi ap dung (Menh Pham Duy tai Hoi)', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    const ruleBResult = results.find((r) => r.rule_id === RULE_B.rule_id);
    expect(ruleBResult?.matched_modifiers).toHaveLength(1);
    expect(ruleBResult?.matched_modifiers[0]?.effect).toBe('tang_xu_huong_tot');
  });

  it('resolveConflicts gom RULE_A + RULE_B thanh 1 nhom CG_001, giu nguyen ca 2 ben', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    const matchedRuleIds = new Set(results.filter((r) => r.matched).map((r) => r.rule_id));
    const matchedRules = KNOWLEDGE_BASE.filter((r) => matchedRuleIds.has(r.rule_id));

    const groups = resolveConflicts(matchedRules);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.conflict_group_id).toBe('CG_001');
    expect(groups[0]?.rules.map((r) => r.rule_id).sort()).toEqual([
      RULE_A.rule_id, RULE_B.rule_id,
    ]);
  });

  it('ca 2 rule trong nhom giu nguyen consensus va sources — khong bi sap xep theo "dang tin hon"', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    const matchedRules = KNOWLEDGE_BASE.filter((r) =>
      results.find((res) => res.rule_id === r.rule_id)?.matched,
    );
    const groups = resolveConflicts(matchedRules);
    for (const rule of groups[0]?.rules ?? []) {
      expect(rule.consensus).toBe('tranh_cai');
      expect(rule.sources.length).toBeGreaterThan(0);
    }
  });
});
