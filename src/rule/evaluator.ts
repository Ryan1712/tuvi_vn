import { palaceOfBranch } from '../chart/queries.js';
import type { Branch, Chart, ChartPalace } from '../chart/types.js';
import type { ChartField, Condition, Exception, Modifier, Rule } from './types.js';

/** Doc 1 ChartField tu 1 ChartPalace thanh set gia tri de so sanh. */
export function resolveField(palace: ChartPalace, field: ChartField): Set<string> {
  if (field === 'major_stars') return new Set(palace.major_stars.map((s) => s.star_id));
  if (field === 'minor_stars') return new Set(palace.minor_stars.map((s) => s.star_id));
  if (field === 'adjective_stars') return new Set(palace.adjective_stars.map((s) => s.star_id));
  if (field === 'all_stars') {
    return new Set([
      ...palace.major_stars.map((s) => s.star_id),
      ...palace.minor_stars.map((s) => s.star_id),
      ...palace.adjective_stars.map((s) => s.star_id),
    ]);
  }
  // field === 'sihua_type'
  return new Set(palace.sihua.map((s) => s.type));
}

export function evalOperator(values: Set<string>, operator: Condition['operator'] | Modifier['operator'], value: string): boolean {
  if (operator === 'contains') return values.has(value);
  if (operator === 'not_contains') return !values.has(value);
  if (operator === 'equals') return values.size === 1 && values.has(value);
  if (operator === 'in') return value.split(',').some((v) => values.has(v));
  if (operator === 'not_in') return !value.split(',').some((v) => values.has(v));
  if (operator === 'is_empty') return values.size === 0;
  // operator === 'is_not_empty'
  return values.size > 0;
}

export function evalCondition(palace: ChartPalace, condition: Condition): boolean {
  const values = resolveField(palace, condition.field);
  return evalOperator(values, condition.operator, condition.value);
}

/**
 * Modifier co field 'branch' ngoai ChartField — kiem tra truc tiep dia chi cua cung,
 * KHONG qua resolveField (branch khong phai 1 tap hop sao).
 */
export function evalModifier(palace: ChartPalace, modifier: Modifier): boolean {
  if (modifier.field === 'branch') {
    return evalOperator(new Set([palace.branch]), modifier.operator, modifier.value);
  }
  const values = resolveField(palace, modifier.field);
  return evalOperator(values, modifier.operator, modifier.value);
}

export function evalExceptionConditions(palace: ChartPalace, exception: Exception): boolean {
  return exception.conditions.every((c) => evalCondition(palace, c));
}

export interface RuleEvalResult {
  rule_id: string;
  /** Ket qua CUA conditions. KHONG bi modifier/exception doi — 3 khai niem tach rieng. */
  matched: boolean;
  matched_modifiers: Modifier[];
  triggered_exceptions: Exception[];
}

const SUPPORTED_DIRECT_SCOPES = new Set(['star_palace', 'star_combination', 'four_transform']);

export function evaluateRule(chart: Chart, branch: Branch, rule: Rule): RuleEvalResult {
  if (rule.scope === 'palace_relationship') {
    throw new Error(
      `scope "palace_relationship" chua co evaluator trong evaluator.ts — dung relation-evaluator.ts`,
    );
  }
  if (!SUPPORTED_DIRECT_SCOPES.has(rule.scope)) {
    throw new Error(
      `scope "${rule.scope}" chua co evaluator. Rule "${rule.rule_id}" khong the danh gia o ban nay.`,
    );
  }

  const palace = palaceOfBranch(chart, branch);
  const matched = rule.conditions.every((c) => evalCondition(palace, c));
  const matched_modifiers = rule.modifiers.filter((m) => evalModifier(palace, m));
  const triggered_exceptions = rule.exceptions.filter((e) => evalExceptionConditions(palace, e));

  return { rule_id: rule.rule_id, matched, matched_modifiers, triggered_exceptions };
}

export function matchRules(chart: Chart, branch: Branch, rules: Rule[]): RuleEvalResult[] {
  return rules.map((rule) => evaluateRule(chart, branch, rule));
}
