import { describe, it, expect } from 'vitest';
import { evalRelationCondition, evaluateRelationRule } from '../../src/rule/relation-evaluator.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

/**
 * Rule TEST-ONLY, khong thuoc knowledge-base.ts — dung de chung minh
 * relation-evaluator.ts hoat dong dung tren du lieu Pham Duy that, vi khong co Rule
 * san xuat nao trong Entry mau muc 9 dung scope palace_relationship.
 * Da xac minh: relatedPalaces(input, 'Hoi').wealth === 'Mui' (Tai Bach), va cung Tai
 * Bach cua Pham Duy vo chinh dieu (khong co major_stars) nhung co Thien Viet trong minor_stars.
 */
const TEST_ONLY_RULE_RELATION: Rule = {
  rule_id: 'TEST_ONLY_RELATION_WEALTH_THIEN_VIET',
  conflict_group_id: null,
  scope: 'palace_relationship',
  subject: { type: 'palace', id: 'Menh' },
  conditions: [
    { field: 'minor_stars', operator: 'contains', value: 'THIEN_VIET', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, khong phai Rule san xuat',
};

describe('evalRelationCondition', () => {
  it('cung wealth cua Menh@Hoi la Tai Bach@Mui, co Thien Viet', () => {
    const result = evalRelationCondition(PHAM_DUY, 'Hoi', 'wealth', {
      field: 'minor_stars', operator: 'contains', value: 'THIEN_VIET', required: true,
    });
    expect(result).toBe(true);
  });

  it('cung opposite cua Menh@Hoi la Thien Di@Ty (Ty2), KHONG co Thien Viet', () => {
    const result = evalRelationCondition(PHAM_DUY, 'Hoi', 'opposite', {
      field: 'minor_stars', operator: 'contains', value: 'THIEN_VIET', required: true,
    });
    expect(result).toBe(false);
  });
});

describe('evaluateRelationRule', () => {
  it('rule test-only match dung tren cung wealth cua Menh', () => {
    const result = evaluateRelationRule(PHAM_DUY, 'Hoi', 'wealth', TEST_ONLY_RULE_RELATION);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('TEST_ONLY_RELATION_WEALTH_THIEN_VIET');
  });
});
