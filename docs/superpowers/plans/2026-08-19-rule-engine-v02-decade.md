# Rule Engine v0.2 (Decade Scope) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working evaluator for `RuleScope: 'decade'` (Đại Vận) — currently declared in
the enum since Phase 3 but throws immediately if any Rule uses it, since no evaluator exists.

**Architecture:** One new file, `src/rule/decade-evaluator.ts`, following the exact pattern
already proven by `src/rule/relation-evaluator.ts` — point the existing `evalCondition`/
`evalModifier` (no changes to them) at a different `ChartPalace` than the one implied by the
directly-passed branch, this time the palace the current Đại Vận falls into. No Rule Schema or
`ChartField` changes. A fail-loud guard confirms the `DaiVan` passed in actually belongs to the
`Chart` passed in, preventing a silent-wrong-answer bug if a future caller (Tầng 2's
`resolveQuery`, not part of this plan) ever mismatches the two.

**Tech Stack:** TypeScript ESM, Vitest — unchanged, extends existing `src/rule/`.

## Global Constraints

- No Rule Schema changes. `Condition`/`Modifier` still only use the 5 existing `ChartField`
  values (`major_stars`, `minor_stars`, `adjective_stars`, `all_stars`, `sihua_type`).
- `evaluateDecadeRule` is a pure function: it does NOT decide which Đại Vận to evaluate — it
  receives an already-determined `DaiVan` as a parameter. Whether that's "the currently-running
  decade" or "a decade the user asked about" is entirely the caller's decision, not this
  function's.
- Fail loud: `evaluateDecadeRule` MUST throw if `daiVan` does not match any entry in
  `chart.luck_cycles.dai_van` (compared by `branch` + `age_from` + `age_to`) — never silently
  evaluate against a mismatched decade. This is a required test case, not optional hardening.
- Do NOT write any production Rule using scope `decade` into `src/rule/knowledge-base.ts` as
  part of this plan (build spec mục 13 — no new Rules outside the approved seed entries without
  separate authorization). The sample Rule used to prove the evaluator works is TEST-ONLY, lives
  in the test file, follows the exact `TEST_ONLY_RULE_RELATION` convention already established
  in `test/rule/relation-evaluator.test.ts`.
- Do NOT implement scope `annual` (Lưu Niên), domain-mapping, `resolveQuery`, or "sao vận" star
  data (Vận Đà/Vận Lộc/...) — all explicitly out of scope, see design doc mục 5.
- Reuse `evalCondition`/`evalModifier` from `evaluator.ts` unmodified — do not re-implement star
  reading logic a second time.

## Context already verified before writing this plan

- Read `src/rule/relation-evaluator.ts` in full — confirmed the exact pattern this plan reuses:
  a scope-specific evaluator that re-points `evalCondition`/`evalModifier` at a resolved target
  `ChartPalace`, guards on `rule.scope !== <expected>` throwing a clear error, and returns the
  same `RuleEvalResult` shape as `evaluateRule`.
- Read `src/chart/types.ts`: `DaiVan { age_from: number; age_to: number; branch: Branch; stem:
  string; palace_name: string }`, confirmed as static per-chart data (`chart.luck_cycles
  .dai_van: DaiVan[]`) — unlike `LuuNien`, which is deliberately NOT part of `Chart` (see the
  comment at that file's lines ~120-133), so `decade` can use `Chart` alone as input with no
  extra parameter, while `annual` (out of scope here) would need one.
- Verified for real (ran a script against the actual Phạm Duy case, `astro.bySolar('1998-12-17',
  12, 'male', true, 'vi-VN')` via `buildChart`): `chart.palaces` entry for branch `Hoi` (Mệnh)
  has `major_stars: [{ star_id: 'THIEN_DONG', strength: 'mieu' }]`. `chart.luck_cycles.dai_van`
  has an entry `{ age_from: 2, age_to: 11, branch: 'Hoi', stem: 'Quý', palace_name: 'Mệnh' }`
  and another `{ age_from: 22, age_to: 31, branch: 'Suu', stem: 'Ất', palace_name: 'Phúc Đức' }`
  (this second one contains the currently-running decade at nominal age 29, per the LLM Overview
  plan's own verification). The `Suu` (Phúc Đức) palace's `major_stars` are `THAI_DUONG`/
  `THAI_AM` — no `THIEN_DONG`. These exact values are used as test assertions below.
- `evalExceptionConditions` in `src/rule/evaluator.ts` (line 47) is currently a private,
  non-exported function (`exception.conditions.every((c) => evalCondition(palace, c))`).
  Decision (design doc left this open, resolved here): export it from `evaluator.ts` and reuse
  it in `decade-evaluator.ts`, rather than duplicating the one-line logic. This keeps
  `decade-evaluator.ts` fully DRY against `evaluator.ts`, consistent with this plan's
  no-reimplementation constraint. `evaluator.ts` is an internal module (not a published package
  surface), so widening its exports carries no compatibility risk.
- Existing exports this plan consumes (confirmed by reading the actual source files):
  - `src/chart/queries.ts`: `palaceOfBranch(chart: Chart, branch: Branch): ChartPalace` (throws
    if branch not found — existing fail-loud behavior, reused as-is).
  - `src/chart/types.ts`: `Chart`, `DaiVan`, `Branch`.
  - `src/rule/evaluator.ts`: `evalCondition`, `evalModifier`, `RuleEvalResult` (already
    exported); `evalExceptionConditions` (currently private, exported by Task 1 below).
  - `src/rule/types.ts`: `Rule`.
- The verified Phạm Duy test input (same as used throughout the project): `{ calendar_type:
  'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap: true }`.
- Read `test/rule/relation-evaluator.test.ts` for the exact TEST-ONLY Rule fixture convention:
  a `Rule` constant prefixed `TEST_ONLY_*`, with a comment stating it's not a production Rule,
  `school: 'test'`, `sources: []`, placed in the test file only, never added to
  `src/rule/knowledge-base.ts` or `KNOWLEDGE_BASE`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/rule/evaluator.ts` | Modify: export `evalExceptionConditions` (was private) |
| `src/rule/decade-evaluator.ts` | Create: `evaluateDecadeRule(chart, daiVan, rule): RuleEvalResult` |
| `test/rule/decade-evaluator.test.ts` | Create: tests for the guard, matched:true/false cases, modifiers/exceptions |

---

### Task 1: Export `evalExceptionConditions` from `evaluator.ts`

**Files:**
- Modify: `src/rule/evaluator.ts`
- Test: existing `test/rule/evaluator.test.ts` (verify no regression, no new test needed for
  this task alone — the export itself has no new behavior, only visibility changes)

**Interfaces:**
- Consumes: nothing new
- Produces: `evalExceptionConditions(palace: ChartPalace, exception: Exception): boolean` now
  exported (was previously an unexported `function evalExceptionConditions(...)`), used by Task
  2's `decade-evaluator.ts`.

This is a minimal, mechanical visibility change — the function's body does not change at all,
only its `export` keyword.

- [ ] **Step 1: Change the function declaration**

In `src/rule/evaluator.ts`, find:

```ts
function evalExceptionConditions(palace: ChartPalace, exception: Exception): boolean {
  return exception.conditions.every((c) => evalCondition(palace, c));
}
```

Change to:

```ts
export function evalExceptionConditions(palace: ChartPalace, exception: Exception): boolean {
  return exception.conditions.every((c) => evalCondition(palace, c));
}
```

(Only the `export` keyword is added — no other change to this file.)

- [ ] **Step 2: Run the existing test suite to confirm no regression**

Run: `npm test -- rule/evaluator`
Expected: all existing tests in `test/rule/evaluator.test.ts` still PASS unchanged (this file
export-only change cannot break existing behavior, since `evaluateRule` in the same file already
called this function internally and continues to do so identically).

- [ ] **Step 3: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass, typecheck clean.

- [ ] **Step 4: Commit**

```bash
git add src/rule/evaluator.ts
git commit -m "refactor: export evalExceptionConditions for reuse in decade-evaluator.ts"
```

---

### Task 2: `decade-evaluator.ts` — the evaluator + fail-loud guard

**Files:**
- Create: `src/rule/decade-evaluator.ts`
- Test: `test/rule/decade-evaluator.test.ts`

**Interfaces:**
- Consumes: `palaceOfBranch` from `src/chart/queries.ts`; `Chart`, `DaiVan` from
  `src/chart/types.ts`; `evalCondition`, `evalModifier`, `evalExceptionConditions` (Task 1),
  `RuleEvalResult` from `src/rule/evaluator.ts`; `Rule` from `src/rule/types.ts`.
- Produces: `evaluateDecadeRule(chart: Chart, daiVan: DaiVan, rule: Rule): RuleEvalResult`

This is the core of the plan. Follow TDD: write the failing tests first (all 5 cases below),
verify they fail for the right reason (module doesn't exist yet), implement, verify they pass.

- [ ] **Step 1: Write the failing test file**

Create `test/rule/decade-evaluator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { evaluateDecadeRule } from '../../src/rule/decade-evaluator.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput, DaiVan } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

/**
 * Rule TEST-ONLY, khong thuoc knowledge-base.ts — dung de chung minh
 * decade-evaluator.ts hoat dong dung tren du lieu Pham Duy that, vi khong co Rule
 * san xuat nao trong Entry mau muc 9 dung scope decade.
 * Da xac minh: cung Hoi (Menh) co Thien Dong; cung Suu (Phuc Duc, tuoi 22-31, gom
 * tuoi hien tai 29) khong co Thien Dong (co Thai Duong + Thai Am).
 */
const TEST_ONLY_RULE_DECADE: Rule = {
  rule_id: 'TEST_ONLY_DECADE_THIEN_DONG',
  conflict_group_id: null,
  scope: 'decade',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Hoi', effect: 'test only', weight: 0.5 },
  ],
  exceptions: [
    { conditions: [{ field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true }], effect: 'test only' },
  ],
  conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, khong phai Rule san xuat',
};

const WRONG_SCOPE_RULE: Rule = {
  ...TEST_ONLY_RULE_DECADE,
  rule_id: 'TEST_ONLY_WRONG_SCOPE',
  scope: 'star_palace',
};

describe('evaluateDecadeRule', () => {
  it('throw khi rule.scope khac "decade"', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!;
    expect(() => evaluateDecadeRule(chart, daiVanTaiHoi, WRONG_SCOPE_RULE)).toThrow(/scope "decade"/);
  });

  it('throw khi daiVan khong khop entry nao trong chart.luck_cycles.dai_van', () => {
    const chart = buildChart(PHAM_DUY);
    const fakeDaiVan: DaiVan = { age_from: 999, age_to: 1008, branch: 'Hoi', stem: 'Giáp', palace_name: 'Mệnh' };
    expect(() => evaluateDecadeRule(chart, fakeDaiVan, TEST_ONLY_RULE_DECADE)).toThrow(/khong khop/);
  });

  it('matched true khi Dai Van tro vao cung Hoi (co Thien Dong)', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!;
    const result = evaluateDecadeRule(chart, daiVanTaiHoi, TEST_ONLY_RULE_DECADE);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('TEST_ONLY_DECADE_THIEN_DONG');
    expect(result.matched_modifiers).toHaveLength(1);
  });

  it('matched false khi Dai Van tro vao cung Suu (khong co Thien Dong)', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiSuu = chart.luck_cycles.dai_van.find((d) => d.branch === 'Suu')!;
    const result = evaluateDecadeRule(chart, daiVanTaiSuu, TEST_ONLY_RULE_DECADE);
    expect(result.matched).toBe(false);
    expect(result.matched_modifiers).toHaveLength(0);
  });

  it('triggered_exceptions danh gia dung tren cung dich, khong phai cung goc', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!;
    const result = evaluateDecadeRule(chart, daiVanTaiHoi, TEST_ONLY_RULE_DECADE);
    // Cung Hoi co DIA_KHONG trong minor_stars (da xac minh o cac plan truoc — case Pham Duy)
    expect(result.triggered_exceptions).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/decade-evaluator`
Expected: FAIL — `Cannot find module '../../src/rule/decade-evaluator.js'`

- [ ] **Step 3: Write `src/rule/decade-evaluator.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/decade-evaluator`
Expected: 5 tests PASS

- [ ] **Step 5: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass (existing suite + 5 new), typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/rule/decade-evaluator.ts test/rule/decade-evaluator.test.ts
git commit -m "feat: add evaluateDecadeRule — scope decade evaluator with fail-loud DaiVan guard"
```

---

## After completing this plan

Stop and report to the project owner, including:
1. Verbatim `npm test` output from the project root (pass/fail counts) and `npm run typecheck`
   output.
2. Confirm no Rule using scope `decade` was added to `src/rule/knowledge-base.ts` — the sample
   Rule used to prove the evaluator works must remain TEST-ONLY in the test file.

Per build spec mục 13 / CLAUDE.md mục 7: this plan implements ONLY the `decade` evaluator. Do
NOT start `annual` (Lưu Niên), Tầng 2's domain-mapping/`resolveQuery`, "sao vận" star data, or
any new production Rule as part of this plan — those are separate, not-yet-brainstormed or
explicitly-deferred phases (see design doc mục 5, Known Issues).
