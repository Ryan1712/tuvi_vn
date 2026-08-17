import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { evalCondition, evalModifier, evaluateRule, matchRules } from '../../src/rule/evaluator.js';
import { palaceOfBranch } from '../../src/chart/queries.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

const RULE_STAR_PALACE: Rule = {
  rule_id: 'T_STAR_PALACE',
  conflict_group_id: null,
  scope: 'star_palace',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: { text: 't', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 't', sources: [], consensus: 'cao', notes: '',
};

const RULE_STAR_COMBINATION: Rule = {
  rule_id: 'T_STAR_COMBINATION',
  conflict_group_id: null,
  scope: 'star_combination',
  subject: { type: 'star', id: 'DIA_KHONG_DIA_KIEP' },
  conditions: [
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'tot_hon', weight: 0.7 },
  ],
  exceptions: [],
  conclusion: { text: 't', valence: 'cat', magnitude: 'nhe' },
  school: 't', sources: [], consensus: 'tranh_cai', notes: '',
};

const RULE_FOUR_TRANSFORM: Rule = {
  rule_id: 'T_FOUR_TRANSFORM',
  conflict_group_id: null,
  scope: 'four_transform',
  subject: { type: 'star', id: 'THAM_LANG' },
  conditions: [
    { field: 'sihua_type', operator: 'contains', value: 'Loc', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: { text: 't', valence: 'cat', magnitude: 'vua' },
  school: 't', sources: [], consensus: 'cao', notes: '',
};

const RULE_UNSUPPORTED_SCOPE: Rule = {
  rule_id: 'T_UNSUPPORTED',
  conflict_group_id: null,
  scope: 'decade',
  subject: { type: 'palace', id: 'Menh' },
  conditions: [],
  modifiers: [],
  exceptions: [],
  conclusion: { text: 't', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 't', sources: [], consensus: 'cao', notes: '',
};

describe('evalCondition', () => {
  it('contains tren major_stars tra ve true khi co sao', () => {
    const chart = buildChart(PHAM_DUY);
    const menh = palaceOfBranch(chart, 'Hoi');
    expect(evalCondition(menh, { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true })).toBe(true);
  });

  it('contains tra ve false khi khong co sao', () => {
    const chart = buildChart(PHAM_DUY);
    const menh = palaceOfBranch(chart, 'Hoi');
    expect(evalCondition(menh, { field: 'major_stars', operator: 'contains', value: 'THAT_SAT', required: true })).toBe(false);
  });

  it('not_contains dao nguoc contains', () => {
    const chart = buildChart(PHAM_DUY);
    const menh = palaceOfBranch(chart, 'Hoi');
    expect(evalCondition(menh, { field: 'major_stars', operator: 'not_contains', value: 'THAT_SAT', required: true })).toBe(true);
  });
});

describe('evalModifier', () => {
  it('field branch + operator in kiem tra dung branch cua cung', () => {
    const chart = buildChart(PHAM_DUY);
    const menh = palaceOfBranch(chart, 'Hoi'); // Hoi la Ty2,Hoi trong modifier
    expect(evalModifier(menh, { field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'x', weight: 0.5 })).toBe(true);
  });

  it('field branch + operator in tra ve false khi branch khong trong danh sach', () => {
    const chart = buildChart(PHAM_DUY);
    const dan = palaceOfBranch(chart, 'Dan');
    expect(evalModifier(dan, { field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'x', weight: 0.5 })).toBe(false);
  });
});

describe('evaluateRule — scope star_palace', () => {
  it('Menh Pham Duy match Thien Dong', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Hoi', RULE_STAR_PALACE);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('T_STAR_PALACE');
  });
});

describe('evaluateRule — scope star_combination + modifier khong tu doi matched', () => {
  it('match dung, modifier duoc ghi nhan rieng khong anh huong matched', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Hoi', RULE_STAR_COMBINATION);
    expect(result.matched).toBe(true);
    expect(result.matched_modifiers).toHaveLength(1);
    expect(result.matched_modifiers[0]?.effect).toBe('tot_hon');
  });
});

describe('evaluateRule — scope four_transform doc tu sihua co san tren Chart', () => {
  it('Menh Pham Duy KHONG co Tham Lang hoa Loc (Tham Lang o cung Dien Trach)', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Hoi', RULE_FOUR_TRANSFORM);
    expect(result.matched).toBe(false);
  });

  it('cung Dien Trach (Dan) co Tham Lang hoa Loc — dung bang Can Mau', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Dan', RULE_FOUR_TRANSFORM);
    expect(result.matched).toBe(true);
  });
});

describe('evaluateRule — scope chua co evaluator', () => {
  it('throw Error ro rang, khong am tham bo qua', () => {
    const chart = buildChart(PHAM_DUY);
    expect(() => evaluateRule(chart, 'Hoi', RULE_UNSUPPORTED_SCOPE)).toThrowError(/scope.*decade.*chua co evaluator/i);
  });

  it('scope palace_relationship van throw trong evaluateRule (dung evaluateRelationRule thay the)', () => {
    const chart = buildChart(PHAM_DUY);
    const relationRule: Rule = {
      rule_id: 'T_RELATION_VIA_WRONG_FN',
      conflict_group_id: null,
      scope: 'palace_relationship',
      subject: { type: 'palace', id: 'Menh' },
      conditions: [],
      modifiers: [], exceptions: [],
      conclusion: { text: 't', valence: 'trung_tinh', magnitude: 'nhe' },
      school: 't', sources: [], consensus: 'cao', notes: '',
    };
    expect(() => evaluateRule(chart, 'Hoi', relationRule)).toThrowError(/relation-evaluator/i);
  });
});

describe('matchRules', () => {
  it('chay toan bo rule, tra ve ca matched va khong matched', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', [RULE_STAR_PALACE, RULE_FOUR_TRANSFORM]);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.rule_id === 'T_STAR_PALACE')?.matched).toBe(true);
    expect(results.find((r) => r.rule_id === 'T_FOUR_TRANSFORM')?.matched).toBe(false);
  });
});
