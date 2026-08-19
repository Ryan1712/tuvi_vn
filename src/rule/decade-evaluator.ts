import { palaceOfBranch } from '../chart/queries.js';
import type { Chart, DaiVan } from '../chart/types.js';
import { evalCondition, evalModifier, evalExceptionConditions, type RuleEvalResult } from './evaluator.js';
import type { Rule } from './types.js';

/**
 * Evaluator rieng cho scope decade, theo dung mau relation-evaluator.ts: khong sua
 * ChartField/Rule Schema, chi tro evalCondition/evalModifier (da co) vao 1 ChartPalace
 * khac — cung ma Dai Van dang xet roi vao (daiVan.branch), thay vi cung duoc truyen
 * truc tiep. Xem design doc 2026-08-19-rule-engine-v02-decade-design.md.
 *
 * Ham THUAN TUY: khong tu suy luan "Dai Van nao" — nhan DaiVan da xac dinh san tu
 * phia goi. "Dai Van hien tai" hay "Dai Van duoc hoi" la quyet dinh cua caller.
 */
export function evaluateDecadeRule(chart: Chart, daiVan: DaiVan, rule: Rule): RuleEvalResult {
  if (rule.scope !== 'decade') {
    throw new Error(
      `evaluateDecadeRule chi xu ly scope "decade", nhan duoc "${rule.scope}"`,
    );
  }

  // Fail loud neu daiVan khong khop bat ky entry nao trong chinh chart.luck_cycles.dai_van
  // cua chart nay — tranh evaluate im lang tren du lieu treo lo lung (VD mot caller tuong
  // lai lo truyen nham DaiVan cua 1 chart khac). So theo branch + age_from + age_to.
  const belongsToChart = chart.luck_cycles.dai_van.some(
    (d) => d.branch === daiVan.branch && d.age_from === daiVan.age_from && d.age_to === daiVan.age_to,
  );
  if (!belongsToChart) {
    throw new Error(
      `evaluateDecadeRule: daiVan (branch=${daiVan.branch}, age_from=${daiVan.age_from}, ` +
      `age_to=${daiVan.age_to}) khong khop entry nao trong chart.luck_cycles.dai_van cua chart ` +
      `nay — co the dang truyen nham DaiVan cua 1 chart khac.`,
    );
  }

  const targetPalace = palaceOfBranch(chart, daiVan.branch);
  const matched = rule.conditions.every((c) => evalCondition(targetPalace, c));
  const matched_modifiers = rule.modifiers.filter((m) => evalModifier(targetPalace, m));
  const triggered_exceptions = rule.exceptions.filter((e) => evalExceptionConditions(targetPalace, e));

  return { rule_id: rule.rule_id, matched, matched_modifiers, triggered_exceptions };
}
