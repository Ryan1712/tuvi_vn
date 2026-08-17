import { describe, it, expect } from 'vitest';
import { resolveConflicts } from '../../src/rule/conflict-resolver.js';
import type { Rule } from '../../src/rule/types.js';

function makeRule(id: string, conflictGroupId: string | null): Rule {
  return {
    rule_id: id,
    conflict_group_id: conflictGroupId,
    scope: 'star_palace',
    subject: { type: 'star', id: 'X' },
    conditions: [],
    modifiers: [],
    exceptions: [],
    conclusion: { text: 't', valence: 'trung_tinh', magnitude: 'nhe' },
    school: 't',
    sources: [],
    consensus: 'tranh_cai',
    notes: '',
  };
}

describe('resolveConflicts', () => {
  it('gom 2 rule cung conflict_group_id thanh 1 nhom', () => {
    const ruleA = makeRule('RULE_A', 'CG_001');
    const ruleB = makeRule('RULE_B', 'CG_001');
    const groups = resolveConflicts([ruleA, ruleB]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.conflict_group_id).toBe('CG_001');
    expect(groups[0]?.rules).toHaveLength(2);
    expect(groups[0]?.rules.map((r) => r.rule_id).sort()).toEqual(['RULE_A', 'RULE_B']);
  });

  it('khong sap xep hay loc rule theo "dang tin hon" — giu nguyen ca 2 ben', () => {
    const ruleA = makeRule('RULE_A', 'CG_001');
    const ruleB = makeRule('RULE_B', 'CG_001');
    const groups = resolveConflicts([ruleA, ruleB]);
    expect(groups[0]?.rules).toContainEqual(ruleA);
    expect(groups[0]?.rules).toContainEqual(ruleB);
  });

  it('rule khong co conflict_group_id (doc lap) khong xuat hien trong ket qua', () => {
    const independentRule = makeRule('RULE_SOLO', null);
    const groups = resolveConflicts([independentRule]);
    expect(groups).toHaveLength(0);
  });

  it('nhieu nhom conflict khac nhau duoc tach rieng', () => {
    const a1 = makeRule('A1', 'CG_001');
    const a2 = makeRule('A2', 'CG_001');
    const b1 = makeRule('B1', 'CG_002');
    const b2 = makeRule('B2', 'CG_002');
    const groups = resolveConflicts([a1, a2, b1, b2]);
    expect(groups).toHaveLength(2);
    const ids = groups.map((g) => g.conflict_group_id).sort();
    expect(ids).toEqual(['CG_001', 'CG_002']);
  });
});
