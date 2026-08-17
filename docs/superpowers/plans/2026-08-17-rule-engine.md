# Rule Engine (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encode Rule Schema v0.1 + Source entity in TypeScript, build an evaluator for the 4
scopes already proven feasible by the Python prototype, encode exactly one seed Entry (two
conflicting Rules about "Thiên Đồng ngộ Không/Kiếp"), and a Conflict Resolver v0 that groups
matched conflicting Rules without picking a winner — all running against the real `Chart` object
produced by the already-completed Chart Engine (Phase 2).

**Architecture:** `src/rule/` is a new sibling to `src/chart/`. It never recomputes astrology —
it only reads the `Chart` object `buildChart()` already produces. Two evaluators: one for the
3 scopes that resolve directly on a single `ChartPalace` plus `four_transform`, one for
`palace_relationship` (which needs `relatedPalaces()` from Chart Engine's `queries.ts`, since
that data isn't stored on `Chart` itself). A Conflict Resolver groups by `conflict_group_id`
only — never ranks or picks.

**Tech Stack:** TypeScript (ESM), Vitest — same stack as Chart Engine, no new dependencies.

## Global Constraints

- The 3 concepts `condition` / `modifier` / `exception` are never collapsed into one `weight`
  number — `weight` exists only on `Modifier`, never on `Condition`.
- `Source.reliability_tier` and `Rule.consensus` are independent axes — never derive one from
  the other.
- Conflict Resolver only groups by `conflict_group_id` — it never decides which Rule in a group
  is "more correct." That judgment belongs to the reader/LLM at a later phase, out of scope here.
- Rule Engine never recomputes astrology or relationship tables itself — it only reads the
  `Chart` object and calls Chart Engine's existing `relatedPalaces()` for palace relationships.
- **Fail loud, never guess**: an unsupported `RuleScope` throws a descriptive `Error` — it never
  silently returns `false` or skips the Rule.
- Do not write UI, CSS, component, or layout code.
- Do not add npm dependencies.
- Do not build LLM integration, a persisted `Case` table, or a database — Rule/Source data lives
  as TypeScript object literals in `knowledge-base.ts`.
- Do not add Rules beyond the one seed Entry (RULE_A, RULE_B) specified in this plan.

---

## Context already verified before writing this plan (not assumptions)

- Chart Engine (Phase 2) is complete, reviewed clean, and pushed to GitHub. `buildChart(input):
  Chart` is the entrypoint (`src/chart/index.ts`).
- The verified input for the Phạm Duy test case is:
  ```ts
  { calendar_type: 'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap: true }
  ```
  This produces Mệnh/Thân at branch `'Hoi'`, with `major_stars` containing `THIEN_DONG` and
  `minor_stars` containing `DIA_KHONG` and `DIA_KIEP`.
- `relatedPalaces(input, 'Hoi')` was run against the real `iztro` library during design and
  returns `{ opposite: 'Ty2', wealth: 'Mui', career: 'Mao' }` — Mệnh's wealth palace (Tài Bạch)
  is at branch `Mui`. This is the fixture used in Task 4's relation-evaluator test.
- `Chart.palaces[i].sihua` already contains the birth-chart four-transformations, derived by
  Chart Engine from `iztro` (e.g. for the Phạm Duy chart: `THAM_LANG:Loc`, `THIEN_CO:Ky`,
  `THAI_AM:Quyen`, `HUU_BAT:Khoa`) — the `four_transform` evaluator reads this field directly,
  it does not compute sihua itself.
- Relevant existing exports Rule Engine will import:
  - `src/chart/types.ts`: `Chart`, `ChartPalace`, `Branch`, `BuildChartInput`, `SihuaType`
  - `src/chart/index.ts`: `buildChart(input: BuildChartInput): Chart`
  - `src/chart/queries.ts`: `palaceOfBranch(chart, branch): ChartPalace`,
    `relatedPalaces(input, branch): { opposite: Branch; wealth: Branch; career: Branch }`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/rule/types.ts` | Rule Schema v0.1 + Source entity (types only) |
| `src/rule/evaluator.ts` | `evaluateRule`, `matchRules` for `star_palace`/`star_combination`/`four_transform` (+ delegates `palace_relationship`) |
| `src/rule/relation-evaluator.ts` | Evaluator for `palace_relationship` scope, calls Chart Engine's `relatedPalaces` |
| `src/rule/conflict-resolver.ts` | `resolveConflicts` — groups matched Rules by `conflict_group_id` |
| `src/rule/knowledge-base.ts` | The one seed Entry: RULE_A, RULE_B, SRC_001, SRC_002 |
| `test/rule/*.test.ts` | One test file per source file above |

---

### Task 1: Rule Schema v0.1 + Source types

**Files:**
- Create: `src/rule/types.ts`
- Test: `test/rule/types.test.ts`

**Interfaces:**
- Consumes: nothing from `src/rule/` (first task); no imports from `src/chart/` either — this
  file is pure type declarations independent of Chart Engine.
- Produces: `RuleScope`, `ConditionOperator`, `ChartField`, `Condition`, `Modifier`, `Exception`,
  `Valence`, `Magnitude`, `Consensus`, `Conclusion`, `Rule`, `SourceType`, `ReliabilityTier`,
  `Source` — all exported types/interfaces. Five later tasks import from this file.

- [ ] **Step 1: Write the failing test**

Create `test/rule/types.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/types`
Expected: FAIL — `Failed to resolve import "../../src/rule/types.js"`

- [ ] **Step 3: Write `src/rule/types.ts`**

```ts
/**
 * Rule Schema v0.1 + Source entity.
 * Port cua build spec muc 4 (Rule) va muc 5 (Source) sang TypeScript.
 * Chi dinh nghia type, khong chua logic (giong types.ts cua Chart Engine).
 */

/**
 * 9 gia tri theo build spec muc 4. Chi 4 trong so nay co evaluator that o v0.1
 * (star_palace, star_combination, four_transform, palace_relationship) — cac scope
 * con lai khai du trong enum de viet Rule dung type ngay tu dau, nhung evaluateRule()
 * se throw Error ro rang neu gap, KHONG am tham bo qua Rule (xem evaluator.ts).
 */
export type RuleScope =
  | 'star_palace'
  | 'star_pair'
  | 'star_combination'
  | 'palace_relationship'
  | 'four_transform'
  | 'pattern'
  | 'decade'
  | 'annual'
  | 'spouse_matching';

export type ConditionOperator = 'contains' | 'not_contains' | 'equals' | 'in' | 'not_in';

/**
 * Field doc duoc tren 1 ChartPalace, thu hep so voi build spec (field: string tu do).
 * Sao la se bi TypeScript chan luc viet Rule thay vi loi runtime. Mo rong enum nay
 * neu can field khac tren Chart — khong dung field: string tu do.
 */
export type ChartField = 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type';

export interface Condition {
  field: ChartField;
  operator: ConditionOperator;
  value: string;
  required: true; // v0.1: moi condition deu bat buoc — khong co optional condition
}

export interface Modifier {
  field: ChartField | 'branch';
  operator: ConditionOperator;
  value: string;
  effect: string; // mo ta dinh tinh, KHONG phai diem so
  weight: number; // 0..1, CHI dung trong Modifier — khong co tren Condition
}

export interface Exception {
  conditions: Condition[];
  effect: string;
}

export type Valence = 'cat' | 'hung' | 'trung_tinh';
export type Magnitude = 'nhe' | 'vua' | 'manh';
export type Consensus = 'cao' | 'trung_binh' | 'tranh_cai';

export interface Conclusion {
  text: string;
  valence: Valence;
  magnitude: Magnitude;
}

export interface Rule {
  rule_id: string;
  conflict_group_id: string | null;
  scope: RuleScope;
  subject: { type: 'star' | 'palace' | 'pattern'; id: string };
  conditions: Condition[];
  modifiers: Modifier[];
  exceptions: Exception[];
  conclusion: Conclusion;
  school: string;
  sources: string[]; // ref(Source.source_id), many-to-many voi Source
  consensus: Consensus; // DOC LAP voi Source.reliability_tier
  notes: string;
}

export type SourceType = 'co_van_nguyen_ban' | 'sach_in_co_tac_gia' | 'dien_dan_web';
export type ReliabilityTier = '1_cao_nhat' | '2_trung' | '3_thap';

export interface Source {
  source_id: string;
  type: SourceType;
  title: string;
  author: string | null;
  school: string | null;
  reliability_tier: ReliabilityTier;
  excerpt_or_link: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/types`
Expected: 4 tests PASS

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/rule/types.ts test/rule/types.test.ts
git commit -m "feat: add Rule Schema v0.1 + Source entity types"
```

---

### Task 2: Evaluator for star_palace / star_combination / four_transform

**Files:**
- Create: `src/rule/evaluator.ts`
- Test: `test/rule/evaluator.test.ts`

**Interfaces:**
- Consumes:
  - From `src/rule/types.ts` (Task 1): `Rule`, `Condition`, `Modifier`, `Exception`, `ChartField`
  - From `src/chart/types.ts` (existing): `Chart`, `ChartPalace`, `Branch`
  - From `src/chart/index.ts` (existing): `buildChart(input: BuildChartInput): Chart`
  - From `src/chart/queries.ts` (existing): `palaceOfBranch(chart: Chart, branch: Branch): ChartPalace`
- Produces:
  - `resolveField(palace: ChartPalace, field: ChartField): Set<string>`
  - `evalCondition(palace: ChartPalace, condition: Condition): boolean`
  - `evalModifier(palace: ChartPalace, modifier: Modifier): boolean`
  - `interface RuleEvalResult { rule_id: string; matched: boolean; matched_modifiers: Modifier[]; triggered_exceptions: Exception[] }`
  - `evaluateRule(chart: Chart, branch: Branch, rule: Rule): RuleEvalResult`
  - `matchRules(chart: Chart, branch: Branch, rules: Rule[]): RuleEvalResult[]`

This task handles the 3 scopes that resolve directly on one `ChartPalace`
(`star_palace`, `star_combination`, `four_transform`) plus throws for every scope that
doesn't have an evaluator yet, EXCEPT `palace_relationship`, which Task 3 wires in as a
one-line delegation (this task's `evaluateRule` starts by throwing for `palace_relationship`
too — Task 3 changes that one line).

- [ ] **Step 1: Write the failing test**

Create `test/rule/evaluator.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/evaluator`
Expected: FAIL — `Failed to resolve import "../../src/rule/evaluator.js"`

- [ ] **Step 3: Write `src/rule/evaluator.ts`**

```ts
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

function evalOperator(values: Set<string>, operator: Condition['operator'] | Modifier['operator'], value: string): boolean {
  if (operator === 'contains') return values.has(value);
  if (operator === 'not_contains') return !values.has(value);
  if (operator === 'equals') return values.size === 1 && values.has(value);
  if (operator === 'in') return value.split(',').some((v) => values.has(v));
  // operator === 'not_in'
  return !value.split(',').some((v) => values.has(v));
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

function evalExceptionConditions(palace: ChartPalace, exception: Exception): boolean {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/evaluator`
Expected: 10 tests PASS

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/rule/evaluator.ts test/rule/evaluator.test.ts
git commit -m "feat: add evaluator for star_palace/star_combination/four_transform scopes"
```

---

### Task 3: Relation evaluator for palace_relationship scope

**Files:**
- Create: `src/rule/relation-evaluator.ts`
- Modify: `src/rule/evaluator.ts:56-58` (the `palace_relationship` throw becomes a delegation)
- Test: `test/rule/relation-evaluator.test.ts`
- Test: `test/rule/evaluator.test.ts` (add one delegation test)

**Interfaces:**
- Consumes:
  - From `src/rule/types.ts`: `Condition`
  - From `src/chart/types.ts`: `Branch`, `BuildChartInput`
  - From `src/chart/queries.ts`: `relatedPalaces(input: BuildChartInput, branch: Branch): { opposite: Branch; wealth: Branch; career: Branch }`
  - From `src/chart/index.ts`: `buildChart`
  - From `src/rule/evaluator.ts` (Task 2): `evalCondition`, `RuleEvalResult`
- Produces:
  - `type RelationTarget = 'opposite' | 'wealth' | 'career'`
  - `evalRelationCondition(input: BuildChartInput, branch: Branch, relation: RelationTarget, condition: Condition): boolean`
  - `evaluateRelationRule(input: BuildChartInput, branch: Branch, relation: RelationTarget, rule: Rule): RuleEvalResult` (only handles `scope: 'palace_relationship'` Rules)

There is no production Rule using `palace_relationship` in this plan's seed Entry — the seed
Entry only needs `star_combination`. This task is tested with a **test-only fixture Rule**,
clearly marked as such (not part of `knowledge-base.ts`), per the design doc's explicit choice
to build this evaluator ahead of having a real Rule that needs it.

- [ ] **Step 1: Write the failing test**

Create `test/rule/relation-evaluator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evalRelationCondition, evaluateRelationRule } from '../../src/rule/relation-evaluator.js';
import type { Rule } from '../../src/rule/types.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

/**
 * Rule TEST-ONLY, khong thuoc knowledge-base.ts — dung de chung minh
 * relation-evaluator.ts hoat dong dung tren du lieu Pham Duy that, vi khong co Rule
 * san xuat nao trong Entry mau muc 9 dung scope palace_relationship.
 * Da xac minh: relatedPalaces(input, 'Hoi').wealth === 'Mui' (Tai Bach), va cung Tai
 * Bach cua Pham Duy vo chinh dieu (khong co major_stars) nhung co Thien Viet trong minor_stars.
 */
const TEST_ONLY_RULE_RELATION: Rule = {
  rule_id: 'TEST_ONLY_RELATION_WEALTH_THIEN_VIET',
  conflict_group_id: null,
  scope: 'palace_relationship',
  subject: { type: 'palace', id: 'Menh' },
  conditions: [
    { field: 'minor_stars', operator: 'contains', value: 'THIEN_VIET', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: { text: 'test fixture', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test', sources: [], consensus: 'cao', notes: 'TEST-ONLY, khong phai Rule san xuat',
};

describe('evalRelationCondition', () => {
  it('cung wealth cua Menh@Hoi la Tai Bach@Mui, co Thien Viet', () => {
    const result = evalRelationCondition(PHAM_DUY, 'Hoi', 'wealth', {
      field: 'minor_stars', operator: 'contains', value: 'THIEN_VIET', required: true,
    });
    expect(result).toBe(true);
  });

  it('cung opposite cua Menh@Hoi la Thien Di@Ty (Ty2), KHONG co Thien Viet', () => {
    const result = evalRelationCondition(PHAM_DUY, 'Hoi', 'opposite', {
      field: 'minor_stars', operator: 'contains', value: 'THIEN_VIET', required: true,
    });
    expect(result).toBe(false);
  });
});

describe('evaluateRelationRule', () => {
  it('rule test-only match dung tren cung wealth cua Menh', () => {
    const result = evaluateRelationRule(PHAM_DUY, 'Hoi', 'wealth', TEST_ONLY_RULE_RELATION);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('TEST_ONLY_RELATION_WEALTH_THIEN_VIET');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/relation-evaluator`
Expected: FAIL — `Failed to resolve import "../../src/rule/relation-evaluator.js"`

- [ ] **Step 3: Write `src/rule/relation-evaluator.ts`**

`relation-evaluator.ts` needs to read `major_stars`/`minor_stars` on the related palace as
normalized `star_id`s (so it can reuse `evalCondition` from `evaluator.ts`, which takes an
already-mapped `ChartPalace`). Getting there via `callIztro` alone would mean re-deriving
`star_id`s from raw Vietnamese star names a second time — instead, build the **whole `Chart`**
via `buildChart(input)` once resolving the relation target, then fetch its `ChartPalace` at
`targetBranch` with `palaceOfBranch` and reuse Task 2's `evalCondition` directly:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/relation-evaluator`
Expected: 3 tests PASS

- [ ] **Step 5: Wire the delegation into `evaluator.ts`**

`evaluateRule` in `src/rule/evaluator.ts` currently throws for `palace_relationship`. Since
`evaluateRule`'s signature takes a `Chart` (not `BuildChartInput`) and `palace_relationship`
needs `BuildChartInput` to call `relatedPalaces`, keep `evaluateRule` throwing for this scope
— it genuinely cannot serve it with the inputs it has. Do NOT change `evaluateRule`'s
signature; that would break Task 2's tests. Instead, add a test to `test/rule/evaluator.test.ts`
documenting this boundary explicitly (append to the existing `describe('evaluateRule — scope
chua co evaluator', ...)` block):

```ts
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
```

Run: `npm test -- rule/evaluator`
Expected: 11 tests PASS (10 from Task 2 + 1 new)

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/rule/relation-evaluator.ts test/rule/relation-evaluator.test.ts test/rule/evaluator.test.ts
git commit -m "feat: add relation-evaluator for palace_relationship scope"
```

---

### Task 4: Conflict Resolver v0

**Files:**
- Create: `src/rule/conflict-resolver.ts`
- Test: `test/rule/conflict-resolver.test.ts`

**Interfaces:**
- Consumes: `Rule` from `src/rule/types.ts`
- Produces:
  - `interface ConflictGroup { conflict_group_id: string; rules: Rule[] }`
  - `resolveConflicts(matchedRules: Rule[]): ConflictGroup[]`

This function takes plain `Rule[]` (the caller has already filtered `RuleEvalResult[]` down to
matched rules and looked up the corresponding `Rule` objects) — it does not call the evaluator
itself, keeping it a pure grouping function with no `Chart` dependency, easy to unit test in
isolation.

- [ ] **Step 1: Write the failing test**

Create `test/rule/conflict-resolver.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveConflicts } from '../../src/rule/conflict-resolver.js';
import type { Rule } from '../../src/rule/types.js';

function makeRule(id: string, conflictGroupId: string | null): Rule {
  return {
    rule_id: id,
    conflict_group_id: conflictGroupId,
    scope: 'star_palace',
    subject: { type: 'star', id: 'X' },
    conditions: [],
    modifiers: [],
    exceptions: [],
    conclusion: { text: 't', valence: 'trung_tinh', magnitude: 'nhe' },
    school: 't',
    sources: [],
    consensus: 'tranh_cai',
    notes: '',
  };
}

describe('resolveConflicts', () => {
  it('gom 2 rule cung conflict_group_id thanh 1 nhom', () => {
    const ruleA = makeRule('RULE_A', 'CG_001');
    const ruleB = makeRule('RULE_B', 'CG_001');
    const groups = resolveConflicts([ruleA, ruleB]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.conflict_group_id).toBe('CG_001');
    expect(groups[0]?.rules).toHaveLength(2);
    expect(groups[0]?.rules.map((r) => r.rule_id).sort()).toEqual(['RULE_A', 'RULE_B']);
  });

  it('khong sap xep hay loc rule theo "dang tin hon" — giu nguyen ca 2 ben', () => {
    const ruleA = makeRule('RULE_A', 'CG_001');
    const ruleB = makeRule('RULE_B', 'CG_001');
    const groups = resolveConflicts([ruleA, ruleB]);
    expect(groups[0]?.rules).toContainEqual(ruleA);
    expect(groups[0]?.rules).toContainEqual(ruleB);
  });

  it('rule khong co conflict_group_id (doc lap) khong xuat hien trong ket qua', () => {
    const independentRule = makeRule('RULE_SOLO', null);
    const groups = resolveConflicts([independentRule]);
    expect(groups).toHaveLength(0);
  });

  it('nhieu nhom conflict khac nhau duoc tach rieng', () => {
    const a1 = makeRule('A1', 'CG_001');
    const a2 = makeRule('A2', 'CG_001');
    const b1 = makeRule('B1', 'CG_002');
    const b2 = makeRule('B2', 'CG_002');
    const groups = resolveConflicts([a1, a2, b1, b2]);
    expect(groups).toHaveLength(2);
    const ids = groups.map((g) => g.conflict_group_id).sort();
    expect(ids).toEqual(['CG_001', 'CG_002']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/conflict-resolver`
Expected: FAIL — `Failed to resolve import "../../src/rule/conflict-resolver.js"`

- [ ] **Step 3: Write `src/rule/conflict-resolver.ts`**

```ts
import type { Rule } from './types.js';

export interface ConflictGroup {
  conflict_group_id: string;
  /** Nguyen ven ca 2 (hay nhieu) ben, KHONG sap thu tu theo "dung hon". */
  rules: Rule[];
}

/**
 * Chi gom cac rule co conflict_group_id !== null theo dung nhom. Rule khong co
 * conflict_group_id (doc lap, khong tranh cai) khong xuat hien trong ket qua — day
 * la ham gom conflict, khong phai ham liet ke toan bo rule matched.
 *
 * KHONG co logic "chon rule dang tin hon" — build spec muc 10 cam ro rang. Viec chon
 * phe thuoc ve nguoi doc cuoi / LLM o giai doan sau, ngoai pham vi v0.
 */
export function resolveConflicts(matchedRules: Rule[]): ConflictGroup[] {
  const groups = new Map<string, Rule[]>();
  for (const rule of matchedRules) {
    if (rule.conflict_group_id === null) continue;
    const existing = groups.get(rule.conflict_group_id);
    if (existing) {
      existing.push(rule);
    } else {
      groups.set(rule.conflict_group_id, [rule]);
    }
  }
  return Array.from(groups.entries()).map(([conflict_group_id, rules]) => ({
    conflict_group_id,
    rules,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/conflict-resolver`
Expected: 4 tests PASS

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/rule/conflict-resolver.ts test/rule/conflict-resolver.test.ts
git commit -m "feat: add Conflict Resolver v0 — groups by conflict_group_id, never ranks"
```

---

### Task 5: Knowledge base — the seed Entry (RULE_A, RULE_B, SRC_001, SRC_002)

**Files:**
- Create: `src/rule/knowledge-base.ts`
- Test: `test/rule/knowledge-base.test.ts`
- Test: `test/rule/integration.test.ts` (end-to-end: build real Chart → match rules → resolve conflicts)

**Interfaces:**
- Consumes:
  - From `src/rule/types.ts`: `Rule`, `Source`
- Produces:
  - `RULE_A: Rule` (rule_id `'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT'`)
  - `RULE_B: Rule` (rule_id `'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI'`)
  - `SRC_001: Source`, `SRC_002: Source`
  - `KNOWLEDGE_BASE: Rule[]` (= `[RULE_A, RULE_B]`)
  - `SOURCES: Source[]` (= `[SRC_001, SRC_002]`)

This is the final task. It also writes the integration test that proves the whole system works
end-to-end against the real Chart Engine — this is the test that matters most for validating
the design doc's central worked example (build spec section 9).

- [ ] **Step 1: Write the failing test for the knowledge base contents**

Create `test/rule/knowledge-base.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { RULE_A, RULE_B, SRC_001, SRC_002, KNOWLEDGE_BASE, SOURCES } from '../../src/rule/knowledge-base.js';

describe('knowledge base — Entry mau muc 9', () => {
  it('RULE_A va RULE_B cung conflict_group_id', () => {
    expect(RULE_A.conflict_group_id).toBe('CG_001');
    expect(RULE_B.conflict_group_id).toBe('CG_001');
  });

  it('RULE_A yeu cau Thien Dong + Khong + Kiep dong cung', () => {
    const values = RULE_A.conditions.map((c) => c.value);
    expect(values).toEqual(expect.arrayContaining(['THIEN_DONG', 'DIA_KHONG', 'DIA_KIEP']));
  });

  it('RULE_B KHONG yeu cau Thien Dong trong conditions — chi Khong+Kiep dong cung', () => {
    const values = RULE_B.conditions.map((c) => c.value);
    expect(values).toEqual(expect.arrayContaining(['DIA_KHONG', 'DIA_KIEP']));
    expect(values).not.toContain('THIEN_DONG');
  });

  it('RULE_B co modifier branch Ty2,Hoi voi weight 0.7', () => {
    expect(RULE_B.modifiers).toHaveLength(1);
    expect(RULE_B.modifiers[0]).toMatchObject({ field: 'branch', value: 'Ty2,Hoi', weight: 0.7 });
  });

  it('ca 2 rule co consensus tranh_cai — CHUA CHOT ket luan', () => {
    expect(RULE_A.consensus).toBe('tranh_cai');
    expect(RULE_B.consensus).toBe('tranh_cai');
  });

  it('ca 2 source o reliability_tier 3_thap theo dung build spec muc 9', () => {
    expect(SRC_001.reliability_tier).toBe('3_thap');
    expect(SRC_002.reliability_tier).toBe('3_thap');
  });

  it('KNOWLEDGE_BASE va SOURCES gom dung 2 phan tu moi', () => {
    expect(KNOWLEDGE_BASE).toEqual([RULE_A, RULE_B]);
    expect(SOURCES).toEqual([SRC_001, SRC_002]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rule/knowledge-base`
Expected: FAIL — `Failed to resolve import "../../src/rule/knowledge-base.js"`

- [ ] **Step 3: Write `src/rule/knowledge-base.ts`**

```ts
import type { Rule, Source } from './types.js';

/**
 * Entry mau duy nhat cua Rule Engine v0.1 (build spec muc 9):
 * "Thien Dong ngo Khong/Kiep" — 2 quan diem trai chieu, dung de chung minh
 * conflict_group_id hoat dong dung. KHONG viet them Rule ngoai Entry nay (build spec muc 13).
 */

export const SRC_001: Source = {
  source_id: 'SRC_001',
  type: 'dien_dan_web',
  title: 'Tong hop dien dan — Thien Dong ngo Khong Kiep bat cat',
  author: null,
  school: null,
  reliability_tier: '3_thap',
  excerpt_or_link: 'chua truy nguyen ban goc/chu Han — xem build spec muc 9',
};

export const SRC_002: Source = {
  source_id: 'SRC_002',
  type: 'dien_dan_web',
  title: 'Tong hop dien dan — Khong Kiep Ty Hoi phan vi giai luan',
  author: null,
  school: null,
  reliability_tier: '3_thap',
  excerpt_or_link: 'chua truy nguyen ban goc/chu Han — xem build spec muc 9',
};

/**
 * Quan diem A (bat cat): "de hoang mang, thieu nhat quan, thay doi that thuong".
 * Yeu cau ca Thien Dong + Dia Khong + Dia Kiep dong cung.
 */
export const RULE_A: Rule = {
  rule_id: 'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
  conflict_group_id: 'CG_001',
  scope: 'star_combination',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: {
    text: 'Thien Dong ngo Khong Kiep — de hoang mang, thieu nhat quan, thay doi that thuong.',
    valence: 'hung',
    magnitude: 'vua',
  },
  school: 'tong_hop_dien_dan',
  sources: ['SRC_001'],
  consensus: 'tranh_cai',
  notes: 'Xem RULE_B cung conflict_group_id CG_001 — quan diem trai chieu.',
};

/**
 * Quan diem B (phan vi giai): luan ve VI TRI Ty/Hoi cua Khong-Kiep, KHONG dong nghia
 * truc tiep "Thien Dong + Khong Kiep = tot" — vi vay conditions KHONG doi hoi Thien Dong,
 * chi doi hoi Khong+Kiep dong cung. Vi tri Ty2/Hoi la modifier (yeu to gia giam mem),
 * KHONG dua vao conditions.
 */
export const RULE_B: Rule = {
  rule_id: 'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
  conflict_group_id: 'CG_001',
  scope: 'star_combination',
  subject: { type: 'star', id: 'DIA_KHONG_DIA_KIEP' },
  conditions: [
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'tang_xu_huong_tot', weight: 0.7 },
  ],
  exceptions: [],
  conclusion: {
    text: 'Khong Kiep dong cung — tai Ty/Hoi co xu huong phan vi giai (tot hon vi tri khac), tuy chinh tinh di kem.',
    valence: 'cat',
    magnitude: 'nhe',
  },
  school: 'tong_hop_dien_dan',
  sources: ['SRC_002'],
  consensus: 'tranh_cai',
  notes: 'Luan ve vi tri Ty/Hoi, KHONG dong nghia truc tiep "Thien Dong + Khong Kiep = tot".',
};

export const KNOWLEDGE_BASE: Rule[] = [RULE_A, RULE_B];
export const SOURCES: Source[] = [SRC_001, SRC_002];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rule/knowledge-base`
Expected: 7 tests PASS

- [ ] **Step 5: Write the end-to-end integration test**

Create `test/rule/integration.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { matchRules } from '../../src/rule/evaluator.js';
import { resolveConflicts } from '../../src/rule/conflict-resolver.js';
import { KNOWLEDGE_BASE, RULE_A, RULE_B } from '../../src/rule/knowledge-base.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('End-to-end: Chart Pham Duy thuc qua Rule Engine', () => {
  it('ca RULE_A va RULE_B deu match tren Menh@Hoi', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.rule_id === RULE_A.rule_id)?.matched).toBe(true);
    expect(results.find((r) => r.rule_id === RULE_B.rule_id)?.matched).toBe(true);
  });

  it('RULE_B co modifier vi tri Hoi ap dung (Menh Pham Duy tai Hoi)', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    const ruleBResult = results.find((r) => r.rule_id === RULE_B.rule_id);
    expect(ruleBResult?.matched_modifiers).toHaveLength(1);
    expect(ruleBResult?.matched_modifiers[0]?.effect).toBe('tang_xu_huong_tot');
  });

  it('resolveConflicts gom RULE_A + RULE_B thanh 1 nhom CG_001, giu nguyen ca 2 ben', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    const matchedRuleIds = new Set(results.filter((r) => r.matched).map((r) => r.rule_id));
    const matchedRules = KNOWLEDGE_BASE.filter((r) => matchedRuleIds.has(r.rule_id));

    const groups = resolveConflicts(matchedRules);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.conflict_group_id).toBe('CG_001');
    expect(groups[0]?.rules.map((r) => r.rule_id).sort()).toEqual([
      RULE_A.rule_id, RULE_B.rule_id,
    ]);
  });

  it('ca 2 rule trong nhom giu nguyen consensus va sources — khong bi sap xep theo "dang tin hon"', () => {
    const chart = buildChart(PHAM_DUY);
    const results = matchRules(chart, 'Hoi', KNOWLEDGE_BASE);
    const matchedRules = KNOWLEDGE_BASE.filter((r) =>
      results.find((res) => res.rule_id === r.rule_id)?.matched,
    );
    const groups = resolveConflicts(matchedRules);
    for (const rule of groups[0]?.rules ?? []) {
      expect(rule.consensus).toBe('tranh_cai');
      expect(rule.sources.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- rule/integration`
Expected: 4 tests PASS

- [ ] **Step 7: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass (Chart Engine's 48 + Rule Engine's new tests), no type errors

- [ ] **Step 8: Commit**

```bash
git add src/rule/knowledge-base.ts test/rule/knowledge-base.test.ts test/rule/integration.test.ts
git commit -m "feat: encode seed Entry (Thien Dong ngo Khong/Kiep) + end-to-end integration test"
```

---

## After completing this plan

Stop and report to the project owner (per build spec section 13's "don't self-expand scope"
rule), including:
1. Verbatim `npm test` output (pass/fail counts).
2. Confirmation that `RULE_A` and `RULE_B` both match on the real Phạm Duy chart and get grouped
   into one `ConflictGroup` by `resolveConflicts`, with neither rule dropped or reordered.
3. Any Known Issues discovered during implementation, logged into
   `docs/superpowers/specs/2026-08-17-rule-engine-design.md`'s "Known issues" section.

**Do not proceed to LLM integration, additional Rules, a Case persistence layer, or UI work**
after this plan completes — those are explicitly out of scope (see design doc section 7).
