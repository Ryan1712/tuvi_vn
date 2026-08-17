import { describe, it, expect } from 'vitest';
import type { Rule, Source, RuleScope, Condition, Modifier } from '../../src/rule/types.js';

describe('Rule Schema v0.1 types', () => {
  it('Rule co du cac field bat buoc theo build spec muc 4', () => {
    const rule: Rule = {
      rule_id: 'TEST_RULE',
      conflict_group_id: null,
      scope: 'star_palace',
      subject: { type: 'star', id: 'THIEN_DONG' },
      conditions: [
        { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
      ],
      modifiers: [],
      exceptions: [],
      conclusion: { text: 'test', valence: 'trung_tinh', magnitude: 'nhe' },
      school: 'test_school',
      sources: ['SRC_TEST'],
      consensus: 'cao',
      notes: '',
    };
    expect(rule.rule_id).toBe('TEST_RULE');
    expect(rule.conditions).toHaveLength(1);
  });

  it('Source co du field theo build spec muc 5', () => {
    const source: Source = {
      source_id: 'SRC_TEST',
      type: 'dien_dan_web',
      title: 'Test Source',
      author: null,
      school: null,
      reliability_tier: '3_thap',
      excerpt_or_link: 'https://example.invalid',
    };
    expect(source.reliability_tier).toBe('3_thap');
  });

  it('scope co du 9 gia tri theo build spec muc 4', () => {
    const scopes: RuleScope[] = [
      'star_palace', 'star_pair', 'star_combination', 'palace_relationship',
      'four_transform', 'pattern', 'decade', 'annual', 'spouse_matching',
    ];
    expect(scopes).toHaveLength(9);
  });

  it('Modifier co weight nhung Condition khong co — khong gop 3 khai niem thanh 1 con so', () => {
    const modifier: Modifier = {
      field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'test', weight: 0.5,
    };
    const condition: Condition = {
      field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true,
    };
    expect(modifier.weight).toBe(0.5);
    expect('weight' in condition).toBe(false);
  });
});
