# Rule Engine v0.3 (Annual Scope) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working evaluator for `RuleScope: 'annual'` (Lưu Niên) — declared in the enum
since Phase 3 but throws immediately if any Rule uses it, since no evaluator exists. Completes
the pair started by Rule Engine v0.2 (`decade` scope, already done).

**Architecture:** One new file, `src/rule/annual-evaluator.ts`, with its own condition-evaluation
logic — NOT a direct reuse of `evalCondition`/`evalModifier` the way `decade-evaluator.ts` reuses
them, because `LuuNienPalace` (unlike `ChartPalace`) has no `major_stars`/`minor_stars`/
`adjective_stars` structure to resolve a `ChartField` against — only a flat `stars: { star_id:
string }[]` array. This reflects real Tử Vi knowledge (the 14 major stars are fixed for life by
Cục, never "annual"), not a data-modeling shortcut. One additive `ChartField` value
(`'luu_nien_stars'`) is added so Rules using scope `annual` can declare this explicitly, with a
fail-loud check rejecting any other field value for that scope. `evaluateAnnualRule` takes both
`luuNien: LuuNien` and `branch: Branch` as explicit parameters — it is a pure function that does
not decide which year or which palace to evaluate; the caller supplies both.

**Tech Stack:** TypeScript ESM, Vitest — unchanged, extends existing `src/rule/`.

## Global Constraints

- `ChartField` gains exactly one new value: `'luu_nien_stars'`. No other Rule Schema change.
- `evaluateAnnualRule(chart: Chart, luuNien: LuuNien, branch: Branch, rule: Rule):
  RuleEvalResult` — pure function, does NOT decide which `LuuNien` or which `branch` to use.
  Both come from the caller. This mirrors the same discipline already applied to `decade`
  (caller supplies `DaiVan`) and is required specifically because the design process caught and
  fixed a self-contradiction where an earlier draft hard-coded `chart.menh_than.menh_branch`
  internally — see design doc mục 2, "Quyết định 2".
- Fail loud: any `Condition`/`Modifier` (other than the `field: 'branch'` case, which behaves
  like it does in `evalModifier`) with `field !== 'luu_nien_stars'` under scope `annual` MUST
  throw a clear error — never silently ignore the field or misread it.
- No chart-mismatch guard for `LuuNien` (unlike `decade`'s `DaiVan` guard) — this is a
  deliberate, documented absence, not an oversight. `LuuNien`'s own fields (`year`,
  `heavenly_stem`, `earthly_branch`) are pure functions of the calendar year, identical across
  every chart for the same year, and `Chart.palaces[].branch` ordering is a fixed structural
  constant independent of which chart it is — there is no real signal in this data to compare
  against. Do NOT add a guard that only looks like it works (see design doc mục 3 for the
  concrete counter-example already worked out: any branch-by-index comparison always passes).
- The `branch` parameter's semantics ("fixed natal branch" vs. "the branch the annual cycle
  currently labels with that palace name") is explicitly left open at the type level — do not
  bake in one interpretation. The sample test Rule uses `Hoi` (fixed natal Mệnh) purely as a
  simple, deterministic technical choice, NOT a Tử Vi claim about which reading is correct — see
  design doc mục 5's Known Issues entry for the sourcing findings so far.
- Do NOT write any production Rule using scope `annual` into `src/rule/knowledge-base.ts` as
  part of this plan (build spec mục 13). The sample Rule is TEST-ONLY, lives in the test file,
  follows the exact `TEST_ONLY_*` convention already established in
  `test/rule/relation-evaluator.test.ts` and `test/rule/decade-evaluator.test.ts`.
- Do NOT implement domain-mapping, `resolveQuery`, `chart_id`, or deeper `luu_nien_stars`
  classification (VD "lưu tinh chính" vs. others) — all explicitly out of scope, see design doc
  mục 5.
- Export `evalOperator` from `evaluator.ts` (currently private) and reuse it in
  `annual-evaluator.ts` — do not re-implement the 5-branch operator logic
  (`contains`/`not_contains`/`equals`/`in`/`not_in`) a second time.
- The internal helper that checks `field`/reads Lưu Niên stars must take `field`, `operator`,
  and `value` as separate parameters — NOT a single `Condition` (or a `Modifier` cast to
  `Condition`). `Modifier` lacks the `required` field `Condition` has, so `m as Condition` fails
  real `tsc` typecheck (TS2352, insufficient overlap) even though Vitest's esbuild-based test
  runner doesn't catch it (esbuild strips types without structural checking) — this was caught
  during this plan's own scratch verification, not assumed. Task 2's code below already reflects
  the fix.

## Context already verified before writing this plan

- Read `src/rule/decade-evaluator.ts` and `src/rule/relation-evaluator.ts` in full — confirmed
  neither pattern transfers directly: `decade` reuses `evalCondition` unmodified because
  `DaiVan.branch` still points at a real `ChartPalace`; `annual` cannot, because
  `LuuNienPalace` has a structurally different shape (flat `stars[]`, no field categories).
- Read `src/chart/types.ts`: `LuuNienPalace { branch: Branch; palace_name: string; stars: {
  star_id: string }[] }`, `LuuNien { year: number; heavenly_stem: string; earthly_branch:
  string; mutagen: string[]; palaces: LuuNienPalace[] }`. Confirmed `LuuNien` is NOT part of
  `Chart` (deliberately — see the comment on `LuckCycles` at that file's lines ~120-133) and is
  only produced by `adaptLuuNien` in `src/chart/adapter.ts` when `BuildChartInput.view_year` is
  set.
- Ran a script against the real Phạm Duy case (`buildChart` with `view_year: '2026-01-01'`) to
  get real `LuuNien` data — confirmed `chart.luu_nien.year === 2026` and the full
  `luu_nien.palaces` contents (12 entries). Key values used as test fixtures below:
  ```
  Dan (Tử Nữ):    LUU_DA_LA
  Mao (Phu Thê):   LUU_LOC_TON
  Thin (Huynh Đệ): LUU_KINH_DUONG, LUU_THIEN_HY
  Ty2 (Mệnh — theo Lưu Niên): NIEN_GIAI
  Ngo (Phụ Mẫu):   LUU_VAN_XUONG
  Mui (Phúc Đức):  (không có sao)
  Than (Điền Trạch): LUU_THIEN_VIET, LUU_VAN_KHUC
  Dau (Quan Lộc):  (không có sao)
  Tuat (Nô Bộc):   LUU_HONG_LOAN
  Hoi (Thiên Di — theo Lưu Niên; = Mệnh GỐC): LUU_THIEN_MA
  Ty (Tật Ách):    LUU_THIEN_KHOI
  Suu (Tài Bạch):  (không có sao)
  ```
  `chart.menh_than.menh_branch === 'Hoi'` (unchanged from every prior verified case).
- Discovered during this verification, not before: the natal Mệnh branch (`Hoi`) and the branch
  the Lưu Niên cycle currently labels `palace_name: 'Mệnh'` (`Ty2`) are DIFFERENT branches — the
  Lưu Niên cycle rotates palace names by year, a fact already documented in the
  `LuuNienPalace.palace_name` field comment but not something this plan's author had previously
  traced through with real numbers. This is why `branch`'s semantics are deliberately left open
  at the type level (see Global Constraints) rather than assumed.
- Read `src/rule/evaluator.ts` in full: `evalOperator` (line 21, private,
  `(values: Set<string>, operator, value: string): boolean`) implements exactly the 5-branch
  `contains`/`not_contains`/`equals`/`in`/`not_in` logic this plan's `annual-evaluator.ts` needs
  to reuse. `evalExceptionConditions` was exported in Rule Engine v0.2's Task 1 (already done,
  committed) — this plan's Task 1 does the analogous export for `evalOperator`.
- Existing exports this plan consumes (confirmed by reading the actual source files):
  - `src/chart/types.ts`: `Chart`, `LuuNien`, `LuuNienPalace`, `Branch`.
  - `src/rule/evaluator.ts`: `RuleEvalResult` (already exported); `evalOperator` (currently
    private, exported by Task 1).
  - `src/rule/types.ts`: `Rule`, `Condition`, `Modifier`, `Exception`, `ChartField` (extended by
    Task 1).
- The verified Phạm Duy test input (same as used throughout the project): `{ calendar_type:
  'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap: true, view_year:
  '2026-01-01' }`.
- Read `test/rule/decade-evaluator.test.ts` and `test/rule/relation-evaluator.test.ts` for the
  exact TEST-ONLY Rule fixture convention: a `Rule` constant prefixed `TEST_ONLY_*`, comment
  stating it's not a production Rule, `school: 'test'`, `sources: []`, placed in the test file
  only.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/rule/evaluator.ts` | Modify: export `evalOperator` (was private) |
| `src/rule/types.ts` | Modify: add `'luu_nien_stars'` to `ChartField` |
| `src/rule/annual-evaluator.ts` | Create: `evaluateAnnualRule(chart, luuNien, branch, rule): RuleEvalResult` |
| `test/rule/annual-evaluator.test.ts` | Create: tests for field-guard, matched:true/false, branch-as-real-parameter, modifiers/exceptions |

---

### Task 1: Export `evalOperator` + extend `ChartField` with `'luu_nien_stars'`

**Files:**
- Modify: `src/rule/evaluator.ts`
- Modify: `src/rule/types.ts`
- Test: existing `test/rule/evaluator.test.ts` (verify no regression)

**Interfaces:**
- Consumes: nothing new
- Produces: `evalOperator(values: Set<string>, operator: Condition['operator'] |
  Modifier['operator'], value: string): boolean` now exported; `ChartField` gains
  `'luu_nien_stars'` as a new member, used by Task 2.

Both changes are additive and mechanical — `evalOperator`'s body does not change, and adding one
member to a union type does not affect any existing code that only reads the previously-existing
5 values.

- [ ] **Step 1: Export `evalOperator`**

In `src/rule/evaluator.ts`, find:

```ts
function evalOperator(values: Set<string>, operator: Condition['operator'] | Modifier['operator'], value: string): boolean {
```

Change to:

```ts
export function evalOperator(values: Set<string>, operator: Condition['operator'] | Modifier['operator'], value: string): boolean {
```

(Only the `export` keyword is added — no other change to this file.)

- [ ] **Step 2: Extend `ChartField`**

In `src/rule/types.ts`, find:

```ts
export type ChartField = 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type';
```

Change to:

```ts
/**
 * 'luu_nien_stars' doc LuuNienPalace.stars (mang phang, khong phan loai chinh/phu/tap —
 * dung ban chat Tu Vi: chinh tinh khong "luu" theo nam, chi phu tinh/tap dieu moi luu.
 * CHI hop le cho Rule.scope === 'annual' — evaluateAnnualRule throw neu dung field khac.
 */
export type ChartField =
  | 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type'
  | 'luu_nien_stars';
```

- [ ] **Step 3: Run the existing test suite to confirm no regression**

Run: `npm test -- rule/evaluator`
Expected: all existing tests in `test/rule/evaluator.test.ts` still PASS unchanged.

- [ ] **Step 4: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/rule/evaluator.ts src/rule/types.ts
git commit -m "refactor: export evalOperator, extend ChartField with luu_nien_stars for annual scope"
```

---

### Task 2: `annual-evaluator.ts` — the evaluator + field-guard, no chart-mismatch guard

**Files:**
- Create: `src/rule/annual-evaluator.ts`
- Test: `test/rule/annual-evaluator.test.ts`

**Interfaces:**
- Consumes: `Chart`, `LuuNien`, `Branch` from `src/chart/types.ts`; `evalOperator` (Task 1),
  `RuleEvalResult` from `src/rule/evaluator.ts`; `Rule`, `Condition`, `Modifier`, `Exception`
  from `src/rule/types.ts`.
- Produces: `evaluateAnnualRule(chart: Chart, luuNien: LuuNien, branch: Branch, rule: Rule):
  RuleEvalResult`

This is the core of the plan. Follow TDD: write the failing tests first (all 7 cases below),
verify they fail for the right reason (module doesn't exist yet), implement, verify they pass.

- [ ] **Step 1: Write the failing test file**

Create `test/rule/annual-evaluator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { evaluateAnnualRule } from '../../src/rule/annual-evaluator.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY_2026: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
  view_year: '2026-01-01',
};

/**
 * Rule TEST-ONLY, khong thuoc knowledge-base.ts — dung de chung minh
 * annual-evaluator.ts hoat dong dung tren du lieu Pham Duy that (nam xem 2026), vi
 * khong co Rule san xuat nao trong Entry mau muc 9 dung scope annual.
 * Da xac minh: cung Hoi (= Menh GOC, chart.menh_than.menh_branch) co LUU_THIEN_MA;
 * cung Ty (Tat Ach) co LUU_THIEN_KHOI; cung Suu (Tai Bach) khong co sao nao.
 * Dung branch='Hoi' (co dinh, Menh goc) CHI vi don gian de test ky thuat — KHONG phai
 * khang dinh day la cach doc Tu Vi "dung" (xem design doc muc 5, ranh gioi branch con
 * mo — Trung Chau/Tam Hop Phai co the nghieng ve cung xoay theo Luu Nien thay vi co dinh).
 */
const TEST_ONLY_RULE_ANNUAL: Rule = {
  rule_id: 'TEST_ONLY_ANNUAL_LUU_THIEN_MA',
  conflict_group_id: null,
  scope: 'annual',
  subject: { type: 'star', id: 'LUU_THIEN_MA' },
  conditions: [
    { field: 'luu_nien_stars', operator: 'contains', value: 'LUU_THIEN_MA', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Hoi', effect: 'test only', weight: 0.5 },
  ],
  exceptions: [
    { conditions: [{ field: 'luu_nien_stars', operator: 'not_contains', value: 'LUU_KHONG_TON_TAI', required: true }], effect: 'test only' },
  ],
  conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, khong phai Rule san xuat',
};

const TEST_ONLY_RULE_WRONG_FIELD: Rule = {
  ...TEST_ONLY_RULE_ANNUAL,
  rule_id: 'TEST_ONLY_ANNUAL_WRONG_FIELD',
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'LUU_THIEN_MA', required: true },
  ],
};

const WRONG_SCOPE_RULE: Rule = {
  ...TEST_ONLY_RULE_ANNUAL,
  rule_id: 'TEST_ONLY_WRONG_SCOPE',
  scope: 'star_palace',
};

describe('evaluateAnnualRule', () => {
  it('throw khi rule.scope khac "annual"', () => {
    const chart = buildChart(PHAM_DUY_2026);
    expect(() =>
      evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', WRONG_SCOPE_RULE),
    ).toThrow(/scope "annual"/);
  });

  it('throw khi Condition.field khac "luu_nien_stars" cho scope annual', () => {
    const chart = buildChart(PHAM_DUY_2026);
    expect(() =>
      evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', TEST_ONLY_RULE_WRONG_FIELD),
    ).toThrow(/luu_nien_stars/);
  });

  it('matched true khi tra tai Hoi (co LUU_THIEN_MA)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const result = evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', TEST_ONLY_RULE_ANNUAL);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('TEST_ONLY_ANNUAL_LUU_THIEN_MA');
    expect(result.matched_modifiers).toHaveLength(1);
    expect(result.triggered_exceptions).toHaveLength(1);
  });

  it('matched false khi tra tai Suu (khong co sao nao)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const result = evaluateAnnualRule(chart, chart.luu_nien!, 'Suu', TEST_ONLY_RULE_ANNUAL);
    expect(result.matched).toBe(false);
    expect(result.matched_modifiers).toHaveLength(0);
  });

  it('branch la tham so hoat dong that: cung 1 luuNien, 2 branch khac nhau ra ket qua khac nhau', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const ruleFindsKhoi: Rule = {
      ...TEST_ONLY_RULE_ANNUAL,
      rule_id: 'TEST_ONLY_ANNUAL_LUU_THIEN_KHOI',
      conditions: [
        { field: 'luu_nien_stars', operator: 'contains', value: 'LUU_THIEN_KHOI', required: true },
      ],
      modifiers: [],
      exceptions: [],
    };
    const atHoi = evaluateAnnualRule(chart, chart.luu_nien!, 'Hoi', ruleFindsKhoi);
    const atTy = evaluateAnnualRule(chart, chart.luu_nien!, 'Ty', ruleFindsKhoi);
    expect(atHoi.matched).toBe(false); // Hoi khong co LUU_THIEN_KHOI
    expect(atTy.matched).toBe(true); // Ty co LUU_THIEN_KHOI
  });

  it('khong tim thay cung trong LuuNien.palaces thi throw ro rang', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const brokenLuuNien = { ...chart.luu_nien!, palaces: [] };
    expect(() =>
      evaluateAnnualRule(chart, brokenLuuNien, 'Hoi', TEST_ONLY_RULE_ANNUAL),
    ).toThrow(/khong tim thay cung/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/annual-evaluator`
Expected: FAIL — `Cannot find module '../../src/rule/annual-evaluator.js'`

- [ ] **Step 3: Write `src/rule/annual-evaluator.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/annual-evaluator`
Expected: 6 tests PASS

- [ ] **Step 5: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass (existing suite + 6 new), typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/rule/annual-evaluator.ts test/rule/annual-evaluator.test.ts
git commit -m "feat: add evaluateAnnualRule — scope annual evaluator with luu_nien_stars field guard"
```

---

## After completing this plan

Stop and report to the project owner, including:
1. Verbatim `npm test` output from the project root (pass/fail counts) and `npm run typecheck`
   output.
2. Confirm no Rule using scope `annual` was added to `src/rule/knowledge-base.ts` — the sample
   Rule used to prove the evaluator works must remain TEST-ONLY in the test file.

Per build spec mục 13 / CLAUDE.md mục 7: this plan implements ONLY the `annual` evaluator. Do
NOT start Tầng 2's domain-mapping/`resolveQuery`, `chart_id` (Chart Data Shape extension), any
new production Rule, or resolving the `branch` semantics ambiguity (design doc mục 5) as part of
this plan — those are separate, not-yet-brainstormed or explicitly-deferred phases. With `decade`
and `annual` both done, Rule Engine now has both evaluators Tầng 2 depends on — report this
milestone explicitly so the project owner can decide the next phase.
