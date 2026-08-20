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

  // Fail loud, 2 buoc doc lap — KHONG phai 1 buoc thay the buoc kia (xem design doc
  // 2026-08-19-rule-engine-v04-chart-id-design.md muc 3):
  //
  // Buoc 1: chart_id phai khop — bat loi CROSS-CHART (daiVan den tu 1 la so khac). Day la
  // loi guard field-theo-field cu (chi co buoc 2 duoi day) da bi chung minh bo lot khi 2 la
  // so khac nhau CUNG Cuc cho DaiVan giong het ca 3 field (final review Rule Engine v0.2).
  if (daiVan.chart_id !== chart.chart_id) {
    throw new Error(
      `evaluateDecadeRule: daiVan.chart_id ("${daiVan.chart_id}") khong khop chart.chart_id ` +
      `("${chart.chart_id}") — dang truyen nham DaiVan cua 1 chart khac.`,
    );
  }

  // Buoc 2: sau khi chart_id da khop, xac nhan daiVan la 1 entry THAT trong 12 Dai Van cua
  // CHINH chart nay — bat loi ENTRY TU DUNG SAI (VD 1 caller tuong lai tu tao DaiVan bang
  // tay, copy dung chart_id nhung tinh sai age_from/age_to/branch). Khong con rui ro trung
  // giua 2 la so khac nhau nhu buoc nay khi con dung doc lap (buoc 1 da loc dung 1 chart).
  const matchesRealEntry = chart.luck_cycles.dai_van.some(
    (d) => d.branch === daiVan.branch && d.age_from === daiVan.age_from && d.age_to === daiVan.age_to,
  );
  if (!matchesRealEntry) {
    throw new Error(
      `evaluateDecadeRule: daiVan (branch=${daiVan.branch}, age_from=${daiVan.age_from}, ` +
      `age_to=${daiVan.age_to}) co chart_id dung nhung khong khop entry THAT nao trong ` +
      `chart.luck_cycles.dai_van — co the dang truyen 1 DaiVan tu dung sai (age_from/age_to/` +
      `branch khong dung voi du lieu that cua chart nay).`,
    );
  }

  const targetPalace = palaceOfBranch(chart, daiVan.branch);
  const matched = rule.conditions.every((c) => evalCondition(targetPalace, c));
  const matched_modifiers = rule.modifiers.filter((m) => evalModifier(targetPalace, m));
  const triggered_exceptions = rule.exceptions.filter((e) => evalExceptionConditions(targetPalace, e));

  return { rule_id: rule.rule_id, matched, matched_modifiers, triggered_exceptions };
}
