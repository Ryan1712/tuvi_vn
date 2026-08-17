import { buildChart } from '../chart/index.js';
import { palaceOfBranch, relatedPalaces } from '../chart/queries.js';
import type { Branch, BuildChartInput } from '../chart/types.js';
import { evalCondition, type RuleEvalResult } from './evaluator.js';
import type { Condition, Rule } from './types.js';

export type RelationTarget = 'opposite' | 'wealth' | 'career';

/**
 * Evaluator rieng cho scope palace_relationship, vi field khong resolve truc tiep tren
 * 1 ChartPalace — can quan he giua cung (bai hoc Test 3 prototype Python).
 *
 * Nhan BuildChartInput (khong phai Chart xay san) vi phai goi relatedPalaces(input, branch)
 * tu queries.ts, ke thua dung danh doi da ghi trong queries.ts (tinh lai toan bo la so moi
 * lan goi — chap nhan duoc o v0.1, Rule Engine ngoai pham vi toi uu hieu nang).
 *
 * Ben trong, sau khi biet targetBranch, ham nay goi lai buildChart(input) de lay Chart day
 * du (voi star_id da chuan hoa) roi tai dung evalCondition tu evaluator.ts — tranh viet lai
 * logic doc sao tu astrolabe tho lan thu 2.
 */
export function evalRelationCondition(
  input: BuildChartInput,
  branch: Branch,
  relation: RelationTarget,
  condition: Condition,
): boolean {
  const related = relatedPalaces(input, branch);
  const targetBranch = related[relation];
  const chart = buildChart(input);
  const targetPalace = palaceOfBranch(chart, targetBranch);
  return evalCondition(targetPalace, condition);
}

export function evaluateRelationRule(
  input: BuildChartInput,
  branch: Branch,
  relation: RelationTarget,
  rule: Rule,
): RuleEvalResult {
  if (rule.scope !== 'palace_relationship') {
    throw new Error(
      `evaluateRelationRule chi xu ly scope "palace_relationship", nhan duoc "${rule.scope}"`,
    );
  }
  const matched = rule.conditions.every((c) => evalRelationCondition(input, branch, relation, c));
  return { rule_id: rule.rule_id, matched, matched_modifiers: [], triggered_exceptions: [] };
}
