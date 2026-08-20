# Rule Engine v0.4 (`chart_id` for `DaiVan`/`LuuNien`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close a Known Issue logged in both Rule Engine v0.2 and v0.3: `evaluateDecadeRule`'s
chart-mismatch guard was proven bypassable (two different charts sharing the same Cục produce
identical `DaiVan` entries), and `evaluateAnnualRule` had no guard at all (no viable signal
existed at the value level for `LuuNien`). Add `chart_id` to both `DaiVan` and `LuuNien`, copied
from the already-computed `Chart.chart_id`, and upgrade both evaluators' guards to use it.

**Architecture:** `Chart.chart_id` already exists (computed in `adaptFromIztro` as
`` `${astrolabe.solarDate}_t${input.time_index}_${input.gender}` ``) — this plan does not invent
a new identifier, it threads the existing one through to two places that need it.
`adaptFromIztro` is refactored to compute `chart_id` before calling `adaptDaiVan`/
`adaptLuuNien`, passing it as a parameter to both, so there remains exactly one place in the
codebase that knows the `chart_id` formula. `evaluateDecadeRule`'s guard becomes TWO checks in
sequence (not a replacement) — `chart_id` match catches cross-chart mixups, then the existing
field-match check (now scoped to a single chart's real entries) catches hand-constructed/
miscalculated `DaiVan` objects with a correct `chart_id` but wrong `age_from`/`age_to`/`branch`.
`evaluateAnnualRule` gets a brand-new single-step `chart_id` guard (structurally cannot need a
second step — `LuuNien` is one object per chart+year, not an array of entries to cross-check
against).

**Tech Stack:** TypeScript ESM, Vitest — unchanged, extends existing `src/chart/` and
`src/rule/`.

## Global Constraints

- `chart_id` on `DaiVan`/`LuuNien` MUST be copied from the same `chart_id` value computed for
  the enclosing `Chart` — NEVER recompute the `solarDate+time_index+gender` formula a second
  time in `adaptDaiVan`/`adaptLuuNien`. There must remain exactly one place in the codebase that
  knows this formula.
- Do NOT add `chart_id` to `LuuNienPalace` or `TieuVan` — neither is ever received directly by
  an evaluator that needs to cross-check chart identity (unlike `DaiVan`, which
  `evaluateDecadeRule` receives directly as a parameter).
- `evaluateDecadeRule`'s upgraded guard is TWO sequential checks, not a replacement of the old
  one with a new one: (1) `daiVan.chart_id !== chart.chart_id` → throw (catches cross-chart
  mixups); (2) after that passes, the EXISTING field-match check against
  `chart.luck_cycles.dai_van` (branch+age_from+age_to) still runs, now scoped to a single
  chart's 12 real entries (catches a hand-constructed/miscalculated `DaiVan` that has the
  correct `chart_id` but wrong field values). Do NOT drop the field-match check — it protects
  against a different failure mode than the `chart_id` check, not a weaker version of it.
- `evaluateAnnualRule`'s new guard is a SINGLE step (`chart_id` match only) — do NOT add a
  second field-match step analogous to `decade`'s. `LuuNien` is one object per (chart, year)
  pair, not an array of entries like `chart.luck_cycles.dai_van`, so there is no second "real
  entry list" to check against. This asymmetry is intentional (see design doc mục 3), not an
  oversight to "fix" by inventing a parallel check.
- Do NOT touch `resolveQuery`, domain-mapping, or any Tầng 2 code — explicitly out of scope,
  see design doc mục 5.
- Do NOT change `adaptTieuVan`'s signature — it doesn't need `chart_id` (see Global Constraints
  above).
- All 125 existing tests must continue passing unmodified except where this plan's tasks
  explicitly call out a required change (the two test files listed in Task 2/3's File
  Structure). No other test file should need edits.

## Context already verified before writing this plan

- Read the actual current `src/chart/adapter.ts` in full — confirmed it matches the design
  doc's description exactly: `chart_id` is computed inline inside the `adaptFromIztro` return
  object (line 153), AFTER `adaptDaiVan(astrolabe)`/`adaptLuuNien(astrolabe, viewYear)` have
  already been called (lines 175, 184) — neither receives `chart_id`. This confirms the
  refactor (compute `chart_id` first, thread it down) is required exactly as designed, not
  already partially done.
- Read the actual current `src/rule/decade-evaluator.ts` and `src/rule/annual-evaluator.ts` in
  full. `annual-evaluator.ts` currently has an unused `chart` parameter with an
  `eslint-disable-next-line @typescript-eslint/no-unused-vars` comment (added during Rule
  Engine v0.3's final review to resolve an open design question) and a comment block explicitly
  stating "KHONG co guard chart-mismatch" — BOTH of these become stale/wrong once this plan adds
  the `chart_id` guard (the parameter becomes genuinely used; the comment becomes factually
  incorrect). Task 3 below must remove the eslint-disable comment (parameter is no longer
  unused) and replace the stale "no guard" comment, not leave either behind.
- Read the actual current `test/rule/decade-evaluator.test.ts` in full. The existing "throw khi
  daiVan khong khop" test (line 53-57) constructs `fakeDaiVan: DaiVan = { age_from: 999,
  age_to: 1008, branch: 'Hoi', stem: 'Giáp', palace_name: 'Mệnh' }` — this object literal will
  FAIL TO COMPILE once `chart_id` becomes a required field on `DaiVan` (Task 1), before any
  test even runs. This plan's task ordering accounts for this: Task 1 (type change) happens
  before Task 2 (evaluator + test changes), and Task 2 must fix this specific literal or the
  whole test suite fails to typecheck, not just this one test.
- Read the actual current `test/rule/annual-evaluator.test.ts` in full. Every existing call to
  `evaluateAnnualRule` passes `chart.luu_nien!` directly (real data from `buildChart`), which
  will automatically carry the new `chart_id` once Task 1 lands — these calls need NO changes.
  The one exception: the "khong tim thay cung" test (line 106-112) builds `brokenLuuNien = {
  ...chart.luu_nien!, palaces: [] }` — the spread preserves `chart_id` correctly, so this test
  also needs no change (the new guard passes, then the existing "cung not found" error still
  fires as before). A NEW test is needed for the mismatch case specifically (Task 3).
- Read the actual current `test/chart/adapter.test.ts` in full. Found the exact test to extend
  with a `chart_id` assertion: `describe('adaptFromIztro — Luu Nien (view_year)', ...)` (line
  152-175) already builds a chart with `view_year: '2026-01-01'` and asserts on
  `chart.luu_nien`. The existing `dai_van` test (`'map dai van — 12 moc, moc dau tai cung
  Menh'`, line 105-112) only asserts individual fields (`.age_from`, `.age_to`, `.branch`), not
  `toEqual` on the whole object — confirmed adding `chart_id` will not break this test via
  strict-equality mismatch.
- Existing exports this plan consumes (confirmed by reading the actual source files):
  - `src/chart/types.ts`: `DaiVan`, `LuuNien` (both modified by Task 1).
  - `src/chart/adapter.ts`: `adaptDaiVan`, `adaptLuuNien`, `adaptFromIztro` (all modified by
    Task 1) — all three are either private (`adaptDaiVan`/`adaptLuuNien`, not exported) or the
    public entry point (`adaptFromIztro`, exported, signature unchanged).
  - `src/rule/decade-evaluator.ts`: `evaluateDecadeRule` (modified by Task 2).
  - `src/rule/annual-evaluator.ts`: `evaluateAnnualRule` (modified by Task 3).
- The verified Phạm Duy test input (same as used throughout the project): `{ calendar_type:
  'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap: true }`, with
  `view_year: '2026-01-01'` added for `LuuNien`-related tests.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/chart/types.ts` | Modify: add `chart_id: string` to `DaiVan` and `LuuNien` |
| `src/chart/adapter.ts` | Modify: refactor `adaptFromIztro` to compute `chart_id` first, thread it through `adaptDaiVan`/`adaptLuuNien` |
| `test/chart/adapter.test.ts` | Modify: add `chart_id` assertions to existing `dai_van` and `luu_nien` tests |
| `src/rule/decade-evaluator.ts` | Modify: two-step guard (`chart_id` match, then existing field-match, scoped) |
| `test/rule/decade-evaluator.test.ts` | Modify: fix `fakeDaiVan` literal (needs `chart_id`), add new test for the field-match step |
| `src/rule/annual-evaluator.ts` | Modify: add new single-step `chart_id` guard, remove stale "no guard" comment and unused-param eslint-disable |
| `test/rule/annual-evaluator.test.ts` | Modify: add new test for the `chart_id` mismatch guard |

---

### Task 1: Add `chart_id` to `DaiVan`/`LuuNien`, refactor `adaptFromIztro`

**Files:**
- Modify: `src/chart/types.ts`
- Modify: `src/chart/adapter.ts`
- Test: `test/chart/adapter.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `DaiVan.chart_id: string`, `LuuNien.chart_id: string` (both new required fields).
  `adaptFromIztro`'s public signature is UNCHANGED (still `(astrolabe, input) => Chart`) — only
  its internal implementation changes.

This task lands the type change and the adapter refactor together, since the type change alone
would make `adaptDaiVan`/`adaptLuuNien`'s current return statements fail to typecheck (missing
required field) — they must be fixed in the same commit to keep the codebase compiling at every
commit boundary.

- [ ] **Step 1: Extend `DaiVan` and `LuuNien` in `src/chart/types.ts`**

Find:

```ts
export interface DaiVan {
  age_from: number;
  age_to: number;
  branch: Branch;
  stem: string;
  palace_name: string;
}
```

Replace with:

```ts
export interface DaiVan {
  /** De doi chieu voi Chart.chart_id — xac minh DaiVan nay thuoc dung la so nao. */
  chart_id: string;
  age_from: number;
  age_to: number;
  branch: Branch;
  stem: string;
  palace_name: string;
}
```

Find:

```ts
export interface LuuNien {
  year: number;
  heavenly_stem: string;
  earthly_branch: string;
  mutagen: string[];
  palaces: LuuNienPalace[];
}
```

Replace with:

```ts
export interface LuuNien {
  /** De doi chieu voi Chart.chart_id — xac minh LuuNien nay thuoc dung la so nao. */
  chart_id: string;
  year: number;
  heavenly_stem: string;
  earthly_branch: string;
  mutagen: string[];
  palaces: LuuNienPalace[];
}
```

Do NOT modify `LuuNienPalace` or `TieuVan` — neither gains a `chart_id` field (see Global
Constraints).

- [ ] **Step 2: Run typecheck to confirm the expected breakage**

Run: `npm run typecheck`
Expected: FAIL — `src/chart/adapter.ts`'s `adaptDaiVan`/`adaptLuuNien` return statements are now
missing the required `chart_id` property (2 errors expected, both in `adapter.ts`). This
confirms the type change took effect; Step 3 fixes it.

- [ ] **Step 3: Refactor `src/chart/adapter.ts`**

Find:

```ts
function adaptDaiVan(astrolabe: IFunctionalAstrolabe): DaiVan[] {
  return astrolabe.decadalList().map((d) => ({
    age_from: d.ageRange[0],
    age_to: d.ageRange[1],
    branch: branchFromVi(d.earthlyBranch),
    stem: d.heavenlyStem,
    palace_name: d.palaceName,
  }));
}
```

Replace with:

```ts
function adaptDaiVan(astrolabe: IFunctionalAstrolabe, chartId: string): DaiVan[] {
  return astrolabe.decadalList().map((d) => ({
    chart_id: chartId,
    age_from: d.ageRange[0],
    age_to: d.ageRange[1],
    branch: branchFromVi(d.earthlyBranch),
    stem: d.heavenlyStem,
    palace_name: d.palaceName,
  }));
}
```

Find:

```ts
function adaptLuuNien(astrolabe: IFunctionalAstrolabe, viewYear: string): LuuNien {
  const horoscope = astrolabe.horoscope(viewYear, 0);
  const yearly = horoscope.yearly;
  const year = Number.parseInt(viewYear.split('-')[0] ?? '', 10);
  const palaces: LuuNienPalace[] = astrolabe.palaces.map((p, i) => ({
    branch: branchFromVi(p.earthlyBranch),
    palace_name: yearly.palaceNames[i] ?? '',
    stars: (yearly.stars?.[i] ?? []).map((s) => ({ star_id: starIdFromVi(s.name) })),
  }));
  return {
    year,
    heavenly_stem: yearly.heavenlyStem,
    earthly_branch: yearly.earthlyBranch,
    mutagen: [...yearly.mutagen],
    palaces,
  };
}
```

Replace with:

```ts
function adaptLuuNien(astrolabe: IFunctionalAstrolabe, viewYear: string, chartId: string): LuuNien {
  const horoscope = astrolabe.horoscope(viewYear, 0);
  const yearly = horoscope.yearly;
  const year = Number.parseInt(viewYear.split('-')[0] ?? '', 10);
  const palaces: LuuNienPalace[] = astrolabe.palaces.map((p, i) => ({
    branch: branchFromVi(p.earthlyBranch),
    palace_name: yearly.palaceNames[i] ?? '',
    stars: (yearly.stars?.[i] ?? []).map((s) => ({ star_id: starIdFromVi(s.name) })),
  }));
  return {
    chart_id: chartId,
    year,
    heavenly_stem: yearly.heavenlyStem,
    earthly_branch: yearly.earthlyBranch,
    mutagen: [...yearly.mutagen],
    palaces,
  };
}
```

Find (inside `adaptFromIztro`):

```ts
export function adaptFromIztro(
  astrolabe: IFunctionalAstrolabe,
  input: BuildChartInput,
): Chart {
  const menhBranch = branchFromVi(astrolabe.earthlyBranchOfSoulPalace);
  const thanBranch = branchFromVi(astrolabe.earthlyBranchOfBodyPalace);
  const napAm = napAmFromSolarDate(astrolabe.solarDate);
  const yearCanChi = astrolabe.chineseDate.split(' - ')[0] ?? '';

  const notes: string[] = [
```

Replace with:

```ts
export function adaptFromIztro(
  astrolabe: IFunctionalAstrolabe,
  input: BuildChartInput,
): Chart {
  const menhBranch = branchFromVi(astrolabe.earthlyBranchOfSoulPalace);
  const thanBranch = branchFromVi(astrolabe.earthlyBranchOfBodyPalace);
  const napAm = napAmFromSolarDate(astrolabe.solarDate);
  const yearCanChi = astrolabe.chineseDate.split(' - ')[0] ?? '';
  const chartId = `${astrolabe.solarDate}_t${input.time_index}_${input.gender}`;

  const notes: string[] = [
```

Find (the return statement's relevant lines):

```ts
  return {
    chart_id: `${astrolabe.solarDate}_t${input.time_index}_${input.gender}`,
    metadata: {
```

Replace with:

```ts
  return {
    chart_id: chartId,
    metadata: {
```

Find:

```ts
    luck_cycles: {
      dai_van: adaptDaiVan(astrolabe),
      tieu_van: adaptTieuVan(astrolabe),
    },
```

Replace with:

```ts
    luck_cycles: {
      dai_van: adaptDaiVan(astrolabe, chartId),
      tieu_van: adaptTieuVan(astrolabe),
    },
```

Find:

```ts
    luu_nien: input.view_year !== undefined ? adaptLuuNien(astrolabe, input.view_year) : undefined,
```

Replace with:

```ts
    luu_nien: input.view_year !== undefined ? adaptLuuNien(astrolabe, input.view_year, chartId) : undefined,
```

`adaptTieuVan`'s call site and signature are UNCHANGED (no `chart_id` parameter — see Global
Constraints).

- [ ] **Step 4: Run typecheck to confirm the fix**

Run: `npm run typecheck`
Expected: clean, no errors.

- [ ] **Step 5: Extend `test/chart/adapter.test.ts` with `chart_id` assertions**

Find the existing test:

```ts
  it('map dai van — 12 moc, moc dau tai cung Menh', () => {
    const chart = buildPhamDuy();
    expect(chart.luck_cycles.dai_van).toHaveLength(12);
    const first = chart.luck_cycles.dai_van[0]!;
    expect(first.age_from).toBe(2);
    expect(first.age_to).toBe(11);
    expect(first.branch).toBe('Hoi');
  });
```

Replace with:

```ts
  it('map dai van — 12 moc, moc dau tai cung Menh', () => {
    const chart = buildPhamDuy();
    expect(chart.luck_cycles.dai_van).toHaveLength(12);
    const first = chart.luck_cycles.dai_van[0]!;
    expect(first.age_from).toBe(2);
    expect(first.age_to).toBe(11);
    expect(first.branch).toBe('Hoi');
    expect(first.chart_id).toBe(chart.chart_id);
  });
```

Find the existing test:

```ts
describe('adaptFromIztro — Luu Nien (view_year)', () => {
  it('dien Chart.luu_nien dung khi co view_year, index khop astrolabe.palaces', () => {
    const chart = adaptFromIztro(
      astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN'),
      {
        calendar_type: 'duong_lich',
        date: '1998-12-17',
        time_index: 12,
        gender: 'nam',
        fix_leap: true,
        view_year: '2026-01-01',
      },
    );
    expect(chart.luu_nien).toBeDefined();
    expect(chart.luu_nien!.year).toBe(2026);
    expect(chart.luu_nien!.palaces).toHaveLength(12);
```

Replace with:

```ts
describe('adaptFromIztro — Luu Nien (view_year)', () => {
  it('dien Chart.luu_nien dung khi co view_year, index khop astrolabe.palaces', () => {
    const chart = adaptFromIztro(
      astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN'),
      {
        calendar_type: 'duong_lich',
        date: '1998-12-17',
        time_index: 12,
        gender: 'nam',
        fix_leap: true,
        view_year: '2026-01-01',
      },
    );
    expect(chart.luu_nien).toBeDefined();
    expect(chart.luu_nien!.chart_id).toBe(chart.chart_id);
    expect(chart.luu_nien!.year).toBe(2026);
    expect(chart.luu_nien!.palaces).toHaveLength(12);
```

(Everything after this point in both tests — the `hoiLuuNien` assertion, the closing braces —
is UNCHANGED.)

- [ ] **Step 6: Run the extended tests + full suite**

Run: `npm test -- chart/adapter`
Expected: all tests in this file PASS (existing + 2 new assertions inline in existing tests, no
new `it()` blocks needed for this task).

Run: `npm test && npm run typecheck`
Expected: all 125 existing tests still pass, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/chart/types.ts src/chart/adapter.ts test/chart/adapter.test.ts
git commit -m "feat: add chart_id to DaiVan/LuuNien, threaded from Chart.chart_id in adaptFromIztro"
```

---

### Task 2: Two-step guard in `evaluateDecadeRule`

**Files:**
- Modify: `src/rule/decade-evaluator.ts`
- Modify: `test/rule/decade-evaluator.test.ts`

**Interfaces:**
- Consumes: `DaiVan.chart_id` (Task 1)
- Produces: `evaluateDecadeRule`'s signature is UNCHANGED (`(chart, daiVan, rule) =>
  RuleEvalResult`) — only its internal guard logic changes.

This task depends on Task 1 (needs `DaiVan.chart_id` to exist). Follow TDD: fix the now-broken
existing test literal first (it won't even compile without `chart_id`), then add the new test
for the second guard step, verify it fails for the right reason, implement, verify all pass.

- [ ] **Step 1: Fix the existing `fakeDaiVan` literal + add the new test**

In `test/rule/decade-evaluator.test.ts`, find:

```ts
  it('throw khi daiVan khong khop entry nao trong chart.luck_cycles.dai_van', () => {
    const chart = buildChart(PHAM_DUY);
    const fakeDaiVan: DaiVan = { age_from: 999, age_to: 1008, branch: 'Hoi', stem: 'Giáp', palace_name: 'Mệnh' };
    expect(() => evaluateDecadeRule(chart, fakeDaiVan, TEST_ONLY_RULE_DECADE)).toThrow(/khong khop/);
  });
```

Replace with:

```ts
  it('throw khi daiVan.chart_id khong khop chart.chart_id (buoc 1: cross-chart)', () => {
    const chart = buildChart(PHAM_DUY);
    const fakeDaiVan: DaiVan = {
      chart_id: 'khong-thuoc-chart-nao',
      age_from: 999, age_to: 1008, branch: 'Hoi', stem: 'Giáp', palace_name: 'Mệnh',
    };
    expect(() => evaluateDecadeRule(chart, fakeDaiVan, TEST_ONLY_RULE_DECADE)).toThrow(/chart_id/);
  });

  it('throw khi chart_id dung nhung khong khop entry THAT nao (buoc 2: entry tu dung sai)', () => {
    const chart = buildChart(PHAM_DUY);
    const wrongFieldsDaiVan: DaiVan = {
      chart_id: chart.chart_id, // DUNG — buoc 1 phai pass
      age_from: 999, age_to: 1008, branch: 'Hoi', stem: 'Giáp', palace_name: 'Mệnh', // SAI — khong khop entry that nao
    };
    expect(() => evaluateDecadeRule(chart, wrongFieldsDaiVan, TEST_ONLY_RULE_DECADE)).toThrow(/entry THAT/);
  });
```

(This replaces 1 test with 2 — one per guard step — since the plan's Global Constraints require
both steps to be independently verified, not just that "some" throw happens.)

- [ ] **Step 2: Run test to verify the new second test fails for the right reason**

Run: `npm test -- rule/decade-evaluator`
Expected: FAIL — the first new test ("buoc 1") should actually PASS already (current single-step
guard still throws on chart_id mismatch, just with a different message not matching `/chart_id/`
— check the actual failure: if it fails because the thrown message doesn't match `/chart_id/`,
that confirms Step 1's test correctly targets the NEW message text arriving in Step 3). The
second new test ("buoc 2") should FAIL because the current guard has no second step — a
`DaiVan` with `chart_id` a real chart wouldn't have (since `chart_id` isn't a field on `DaiVan`
yet in the OLD guard's logic — wait, after Task 1 the field exists, so this test's `wrongFieldsDaiVan.chart_id: chart.chart_id` is set correctly, but the CURRENT (pre-Task-2)
guard in `decade-evaluator.ts` still does the OLD single field-match check, which this
literal is deliberately built to fail — so it should already throw, but with the OLD message.
Confirm both tests fail only on MESSAGE CONTENT mismatch at this point, not on unexpected
pass/fail — Step 3's implementation makes both messages match.

- [ ] **Step 3: Implement the two-step guard in `src/rule/decade-evaluator.ts`**

Find:

```ts
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
```

Replace with:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/decade-evaluator`
Expected: all tests in this file PASS (existing matched:true/false/exceptions tests + the 2
guard tests from Step 1, now 6 tests total instead of the prior 5 — net +1 since 1 test was
split into 2).

- [ ] **Step 5: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/rule/decade-evaluator.ts test/rule/decade-evaluator.test.ts
git commit -m "fix: two-step chart_id + field-match guard in evaluateDecadeRule (closes v0.2 Known Issue)"
```

---

### Task 3: New single-step guard in `evaluateAnnualRule`

**Files:**
- Modify: `src/rule/annual-evaluator.ts`
- Modify: `test/rule/annual-evaluator.test.ts`

**Interfaces:**
- Consumes: `LuuNien.chart_id` (Task 1)
- Produces: `evaluateAnnualRule`'s signature is UNCHANGED (`(chart, luuNien, branch, rule) =>
  RuleEvalResult`) — only its internal guard logic changes (a guard is ADDED where none existed
  before).

This task depends on Task 1 (needs `LuuNien.chart_id` to exist). Unlike Task 2, this is a purely
additive change — no existing behavior is being replaced, since `annual` never had a guard.
Also removes two now-stale artifacts: the `eslint-disable-next-line` comment on the previously-
unused `chart` parameter (it's genuinely used now) and the comment block explicitly stating "no
guard exists" (now false).

- [ ] **Step 1: Write the failing test**

In `test/rule/annual-evaluator.test.ts`, add a new test to the `describe('evaluateAnnualRule',
...)` block (place it near the other guard-related test, e.g. after "khong tim thay cung trong
LuuNien.palaces thi throw ro rang"):

```ts
  it('throw khi luuNien.chart_id khong khop chart.chart_id', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const wrongChartLuuNien = { ...chart.luu_nien!, chart_id: 'khong-thuoc-chart-nao' };
    expect(() =>
      evaluateAnnualRule(chart, wrongChartLuuNien, 'Hoi', TEST_ONLY_RULE_ANNUAL),
    ).toThrow(/chart_id/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/annual-evaluator`
Expected: FAIL — no guard currently exists, so `evaluateAnnualRule` proceeds normally instead of
throwing (the test's `expect(...).toThrow(...)` assertion fails because no error was thrown).

- [ ] **Step 3: Implement the guard in `src/rule/annual-evaluator.ts`**

Find:

```ts
export function evaluateAnnualRule(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // `chart` khong duoc dung truc tiep trong than ham nay (branch da la tham so rieng, khong
  // can palaceOfBranch(chart, ...) nhu decade). Giu lai trong chu ky ham CO Y THUC — nhat
  // quan voi evaluateRule/evaluateDecadeRule/evaluateRelationRule (deu nhan Chart dau tien),
  // giup cac ham nay hoan doi cho nhau de trong 1 dispatcher chung sau nay (VD Tang 2's
  // resolveQuery se can goi dung 1 trong 4 evaluator theo scope, chu ky dong nhat giam nguy co
  // goi sai tham so). Da can nhac bo tham so nay (design doc muc 4 de ngo) — quyet dinh giu,
  // khong bo, ghi ro tai day de dong lai cau hoi con mo do.

  // KHONG co guard chart-mismatch — xem design doc muc 3. Khong co tieu chi that o tang du
  // lieu nay de phan biet LuuNien thuoc la so nao (year/heavenly_stem/earthly_branch chi phu
  // thuoc nam duong lich, branch ordering la hang so cau truc). Trach nhiem dam bao Chart+
  // LuuNien khop nhau thuoc ve phia goi (build ca 2 tu CUNG 1 input trong CUNG 1 request).
```

Replace with:

```ts
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

  // Fail loud neu luuNien.chart_id khong khop chart.chart_id — bat loi CROSS-CHART (luuNien
  // den tu 1 la so khac). Truoc day (Rule Engine v0.3) KHONG the viet guard nao cho annual —
  // khong co tieu chi that o tang gia tri (year/heavenly_stem/earthly_branch giong het moi
  // la so cung nam; branch ordering la hang so cau truc). Voi chart_id (Rule Engine v0.4),
  // gio co the — CHI 1 buoc, khac decade's 2 buoc: LuuNien la 1 object DUY NHAT cho 1 cap
  // (chart, nam), khong phai mang nhieu entry nhu chart.luck_cycles.dai_van, nen khong co
  // "danh sach entry that" nao de doi chieu them — xem design doc muc 3.
  if (luuNien.chart_id !== chart.chart_id) {
    throw new Error(
      `evaluateAnnualRule: luuNien.chart_id ("${luuNien.chart_id}") khong khop chart.chart_id ` +
      `("${chart.chart_id}") — dang truyen nham LuuNien cua 1 chart khac.`,
    );
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/annual-evaluator`
Expected: all tests in this file PASS (existing 8 + 1 new guard test = 9 total).

- [ ] **Step 5: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass (125 baseline + Task 2's +1 + Task 3's +1 = 127 total), typecheck
clean. Confirm the removed `eslint-disable-next-line` comment doesn't cause any lint/typecheck
regression (the project has no eslint config actually wired into `npm test`/`npm run typecheck`,
so this is a documentation-only removal, not a build-breaking one — verify by confirming
`npm run typecheck`'s command is just `tsc --noEmit`, unaffected by eslint comments either way).

- [ ] **Step 6: Commit**

```bash
git add src/rule/annual-evaluator.ts test/rule/annual-evaluator.test.ts
git commit -m "feat: add chart_id guard to evaluateAnnualRule (closes v0.3 Known Issue, previously unwritable)"
```

---

## After completing this plan

Stop and report to the project owner, including:
1. Verbatim `npm test` output from the project root (pass/fail counts — expect 127) and
   `npm run typecheck` output.
2. Confirm both Known Issues (logged in Rule Engine v0.2 and v0.3 design docs) are now closed:
   `decade`'s guard is no longer bypassable by same-Cục cross-chart mixups, and `annual` now has
   a real guard where none was previously possible.

Per build spec mục 13 / CLAUDE.md mục 7: this plan implements ONLY the `chart_id` propagation
and guard upgrades. Do NOT start `resolveQuery`, domain-mapping, or any Tầng 2 code as part of
this plan — with this phase done, Tầng 2 is unblocked but not started; report this explicitly so
the project owner can decide when to begin it.
