import type { Branch, Chart, LuuNien } from '../chart/types.js';
import { evalOperator, type RuleEvalResult } from './evaluator.js';
import type { ChartField, ConditionOperator, Exception, Rule } from './types.js';

function resolveLuuNienStars(luuNien: LuuNien, branch: Branch): Set<string> {
  const palace = luuNien.palaces.find((p) => p.branch === branch);
  if (palace === undefined) {
    throw new Error(`evaluateAnnualRule: khong tim thay cung "${branch}" trong LuuNien.palaces.`);
  }
  return new Set(palace.stars.map((s) => s.star_id));
}

/**
 * Nhan field/operator/value roi le — KHONG nhan nguyen object Condition hay Modifier — vi
 * 2 type nay khong du field chung de dung 1 kieu tham so duy nhat (Modifier thieu `required`
 * ma Condition doi hoi — ep cast `m as Condition` se la loi TypeScript that: TS2352,
 * "insufficient overlap". Phat hien luc verify plan nay, cung dang loi da gap o LLM Overview
 * plan truoc — tranh lap lai).
 */
function evalAnnualField(
  luuNien: LuuNien,
  branch: Branch,
  field: ChartField,
  operator: ConditionOperator,
  value: string,
): boolean {
  if (field !== 'luu_nien_stars') {
    throw new Error(
      `evaluateAnnualRule: field phai la "luu_nien_stars" cho scope "annual", nhan duoc "${field}".`,
    );
  }
  const values = resolveLuuNienStars(luuNien, branch);
  return evalOperator(values, operator, value);
}

/**
 * Evaluator rieng cho scope annual. KHONG tai dung evalCondition/evalModifier nguyen ven
 * (khac decade) — LuuNienPalace khong co cau truc major_stars/minor_stars/adjective_stars
 * nhu ChartPalace (dung ban chat tri thuc: chinh tinh khong "luu" theo nam). Xem design doc
 * 2026-08-19-rule-engine-v03-annual-design.md muc 1.
 *
 * Ham THUAN TUY: nhan CA LuuNien LAN branch da xac dinh san tu phia goi, khong tu suy luan
 * "nam nao"/"cung nao" ben trong — dung nguyen tac da giu nhat quan o decade (khong tu chon
 * Dai Van). "Cung nao" la quyet dinh cua phia goi (VD Tang 2 sau nay: domain "suc khoe" ->
 * tra cung Tat Ach). Y nghia cua `branch` (co dinh theo la so goc, hay xoay theo Luu Nien)
 * CO Y THUC de mo — xem design doc muc 5 Known Issues, chua du nguon de chot 1 cach doc.
 */
export function evaluateAnnualRule(
  chart: Chart,
  luuNien: LuuNien,
  branch: Branch,
  rule: Rule,
): RuleEvalResult {
  if (rule.scope !== 'annual') {
    throw new Error(
      `evaluateAnnualRule chi xu ly scope "annual", nhan duoc "${rule.scope}"`,
    );
  }

  // KHONG co guard chart-mismatch — xem design doc muc 3. Khong co tieu chi that o tang du
  // lieu nay de phan biet LuuNien thuoc la so nao (year/heavenly_stem/earthly_branch chi phu
  // thuoc nam duong lich, branch ordering la hang so cau truc). Trach nhiem dam bao Chart+
  // LuuNien khop nhau thuoc ve phia goi (build ca 2 tu CUNG 1 input trong CUNG 1 request).

  const matched = rule.conditions.every((c) =>
    evalAnnualField(luuNien, branch, c.field, c.operator, c.value),
  );
  const matched_modifiers = rule.modifiers.filter((m) => {
    if (m.field === 'branch') {
      return branch === m.value || m.value.split(',').includes(branch);
    }
    return evalAnnualField(luuNien, branch, m.field, m.operator, m.value);
  });
  const triggered_exceptions = rule.exceptions.filter((e: Exception) =>
    e.conditions.every((c) => evalAnnualField(luuNien, branch, c.field, c.operator, c.value)),
  );

  return { rule_id: rule.rule_id, matched, matched_modifiers, triggered_exceptions };
}
