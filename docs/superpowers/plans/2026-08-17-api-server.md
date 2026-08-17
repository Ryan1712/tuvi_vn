# API Server (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the completed Chart Engine and Rule Engine over HTTP via two stateless Express
endpoints, so a frontend can build a chart and get Rule Engine results for all 12 palaces in a
single request. Also fixes a real input-validation gap in Chart Engine's `callIztro()` that this
plan's own verification pass discovered — see Task 0.

**Architecture:** A thin `src/server/` layer with zero state — every request is self-contained,
rebuilding the `Chart` from `BuildChartInput` each time (no persistence, no session, no `id`
lookup). Route handlers call the existing `buildChart`, `matchRules`, `resolveConflicts`
functions directly; Express 5's built-in async error forwarding sends any thrown `Error` to one
central error middleware that maps it to a `400` JSON response.

**Tech Stack:** Express 5.2.1, supertest 7.2.2 (dev only, for HTTP-level testing), Vitest — same
stack conventions as Chart Engine / Rule Engine (TypeScript ESM, `.js` import extensions).

## Global Constraints

- No state, no Chart persistence, no `id`-based lookup — every endpoint takes a full
  `BuildChartInput` body and is self-contained.
- No separate validation library (Zod/Joi/etc.) — rely on `buildChart()`'s existing "fail loud"
  error throwing; route handlers do not pre-validate the body.
- Route handlers do not wrap calls in `try/catch` — Express 5 auto-forwards thrown errors
  (including from `async` handlers) to the error middleware. Verified empirically before writing
  this plan: `express@5.2.1` forwards both sync and async thrown errors to `app.use((err, req,
  res, next) => ...)` with no `next(err)` call needed.
- One central error middleware in `app.ts` maps any caught `Error` to HTTP `400` with body
  `{ "error": string }` — no per-route error handling, no 500 vs 400 distinction at this stage.
- Do not add authentication, rate limiting, CORS configuration, logging middleware, or Docker
  config — out of scope per the design doc.
- Do not modify anything under `src/chart/` or `src/rule/` **except Task 0's specific, narrow
  fix** (a real bug this plan's verification pass found — see below). Tasks 1 and 2 only add a
  new `src/server/` layer that imports from `src/chart/`/`src/rule/`; they must not touch either
  directory.
- `app.ts` exports the Express `app` without calling `.listen()` — only `server.ts` calls
  `.listen()`, so tests can exercise `app` via `supertest` without opening a real network port.

## Context already verified before writing this plan

- Real dependency versions checked via `npm view` at plan-writing time: `express@5.2.1`,
  `supertest@7.2.2`, `@types/express@5.0.6`, `@types/supertest@7.2.1`.
- Express 5's auto-forwarding of thrown errors (sync AND async, no manual `try/catch`/`next(err)`
  needed) was verified by installing real `express@5.2.1` + `supertest@7.2.2` in a scratch
  project and running two routes — one with a sync throw, one with an async throw — against a
  single trailing error-handling `app.use((err, req, res, next) => ...)`. Both were caught and
  produced the expected `400` response. This is a genuine Express 5 behavior change from Express
  4 (where async handler throws require explicit `next(err)`), so the plan below relies on it.
- Existing exports this plan consumes (confirmed by reading the actual source files):
  - `src/chart/types.ts`: `BuildChartInput`, `Chart`, `Branch`, `BRANCHES` (the 12-branch const
    array, e.g. `['Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Ty2', 'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi']`).
  - `src/chart/index.ts`: `buildChart(input: BuildChartInput): Chart`.
  - `src/rule/evaluator.ts`: `matchRules(chart: Chart, branch: Branch, rules: Rule[]):
    RuleEvalResult[]`, and the `RuleEvalResult` interface (`{ rule_id: string; matched: boolean;
    matched_modifiers: Modifier[]; triggered_exceptions: Exception[] }`).
  - `src/rule/conflict-resolver.ts`: `resolveConflicts(matchedRules: Rule[]): ConflictGroup[]`,
    and the `ConflictGroup` interface (`{ conflict_group_id: string; rules: Rule[] }`).
  - `src/rule/knowledge-base.ts`: `KNOWLEDGE_BASE: Rule[]` (currently `[RULE_A, RULE_B]`).
  - `src/rule/types.ts`: `Rule` (has `rule_id: string` field, used to map `RuleEvalResult` back
    to its source `Rule` object).
- The verified Phạm Duy test input (used throughout Chart Engine and Rule Engine tests):
  `{ calendar_type: 'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap:
  true }`. This produces a chart where Mệnh is at branch `'Hoi'`, and both `RULE_A` and `RULE_B`
  from `KNOWLEDGE_BASE` match on that palace, sharing `conflict_group_id: 'CG_001'`.
- **A real bug was found while verifying this plan, before handing it to an implementer.**
  `src/chart/iztro-client.ts`'s `callIztro()` only checks `if (input.calendar_type ===
  'duong_lich')`; anything else — including a garbage string that isn't `'am_lich'` either —
  falls through to the `else` branch and is silently treated as lunar-calendar input, calling
  `astro.byLunar(...)` with data that was never meant to be a lunar date. Reproduced directly:
  calling `callIztro({ calendar_type: 'khong_hop_le', date: '1998-12-17', time_index: 12,
  gender: 'nam' })` returns a real astrolabe (`solarDate: '1999-2-2'`) instead of throwing. This
  was never caught in Chart Engine's or Rule Engine's own test suites because every existing
  caller is TypeScript code where `BuildChartInput`'s discriminated union already rules out
  invalid `calendar_type` values at compile time — nothing sends a bad value through at runtime.
  An HTTP API accepting raw JSON removes that compile-time guarantee, so this is the first
  caller that can actually trigger the gap. This violates the "fail loud, never guess" convention
  established throughout both engines. Task 0 fixes it at the source (`iztro-client.ts`), not
  with request-level validation in `src/server/`, so every current and future caller is
  protected, not just the HTTP layer.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/chart/iztro-client.ts` | (Task 0 fix only) `callIztro()` gains an explicit `am_lich` branch and throws on any other `calendar_type` |
| `src/server/app.ts` | Express app: JSON body parser, mounts routes, central error middleware. Exports `app`, does not call `.listen()`. |
| `src/server/routes.ts` | The 2 route handlers: `POST /charts`, `POST /charts/rules` |
| `src/server/server.ts` | Entrypoint: imports `app`, calls `app.listen(PORT)` |
| `test/server/routes.test.ts` | supertest-based HTTP tests against `app`, no mocks |

---

### Task 0: Fix `callIztro()` silently treating an invalid `calendar_type` as `am_lich`

**Files:**
- Modify: `src/chart/iztro-client.ts`
- Modify: `test/chart/queries.test.ts`

**Interfaces:**
- Consumes: nothing new — this is a bug fix inside an existing function.
- Produces: no interface change. `callIztro(input: BuildChartInput): IFunctionalAstrolabe` keeps
  its exact signature; its behavior changes only for inputs that were never valid
  `BuildChartInput` values to begin with (i.e. only reachable when the compile-time type
  guarantee is bypassed, such as by an HTTP request body cast to `BuildChartInput`).

**Why this task exists and must run before Task 1:** confirmed by direct testing during plan
verification (see "Context already verified" above) that `callIztro()` treats any
`calendar_type` other than exactly `'duong_lich'` as lunar-calendar input, with no check that it
actually equals `'am_lich'`. This means Task 1/2's `POST /charts` and `POST /charts/rules`
endpoints would silently produce a wrong chart for malformed input instead of returning `400` —
undermining this whole plan's "fail loud" error-handling design (Global Constraints). Fixing it
here, in Chart Engine itself, protects every caller (not just the new HTTP routes).

- [ ] **Step 1: Write the failing test**

Open `test/chart/queries.test.ts`. It already has a `describe('buildChart', () => { ... })`
block with a `PHAM_DUY` fixture. Add this test as the last item inside that `describe` block
(keep every existing test in the file untouched):

```ts
  it('throw khi calendar_type khong phai duong_lich hay am_lich', () => {
    const badInput = { ...PHAM_DUY, calendar_type: 'khong_hop_le' } as unknown as BuildChartInput;
    expect(() => buildChart(badInput)).toThrowError(/calendar_type.*khong hop le/i);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chart/queries`
Expected: FAIL — `buildChart` does not throw; the test's `expect(...).toThrowError(...)` assertion fails because no error was raised.

- [ ] **Step 3: Fix `src/chart/iztro-client.ts`**

Replace the body of `callIztro` (the function currently has an `if (input.calendar_type ===
'duong_lich') { ... } return astro.byLunar(...)` shape — replace the whole function body with
this):

```ts
export function callIztro(input: BuildChartInput): IFunctionalAstrolabe {
  const gender = toIztroGender(input.gender);
  if (input.calendar_type === 'duong_lich') {
    return astro.bySolar(input.date, input.time_index, gender, input.fix_leap ?? true, 'vi-VN');
  }
  if (input.calendar_type === 'am_lich') {
    return astro.byLunar(
      input.date,
      input.time_index,
      gender,
      input.is_leap_month ?? false,
      input.fix_leap ?? true,
      'vi-VN',
    );
  }
  throw new Error(
    `calendar_type "${(input as { calendar_type: unknown }).calendar_type}" khong hop le. Chi chap nhan "duong_lich" hoac "am_lich".`,
  );
}
```

Do not change anything else in the file (the `toIztroGender` helper and the file's doc comment
above `callIztro` stay as they are).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- chart/queries`
Expected: all tests in that file PASS, including the new one

- [ ] **Step 5: Run full suite + typecheck to confirm no regression**

Run: `npm test && npm run typecheck`
Expected: all 83 tests pass (82 pre-existing + 1 new), no type errors. This confirms the fix
doesn't break any existing caller — every current caller already only ever passes
`'duong_lich'` or `'am_lich'`, so the new `throw` branch is unreachable from any existing code
path and only activates for genuinely invalid input.

- [ ] **Step 6: Commit**

```bash
git add src/chart/iztro-client.ts test/chart/queries.test.ts
git commit -m "fix: reject malformed calendar_type in callIztro instead of silently treating it as am_lich"
```

---

### Task 1: Express app scaffold + `POST /charts`

**Files:**
- Create: `src/server/app.ts`, `src/server/routes.ts`, `src/server/server.ts`
- Test: `test/server/routes.test.ts`

**Interfaces:**
- Consumes:
  - `src/chart/index.ts`: `buildChart(input: BuildChartInput): Chart`
  - `src/chart/types.ts`: `BuildChartInput`
- Produces:
  - `app: express.Express` (exported from `src/server/app.ts`, no `.listen()` called)
  - `router: express.Router` (exported from `src/server/routes.ts`, mounted at `/` in `app.ts`)
  - `POST /charts` endpoint, live on `app`

This task installs the new dependencies, scaffolds the whole `src/server/` module, and
implements the simpler of the two endpoints end-to-end (including the shared error middleware
both endpoints will use). Task 2 adds the second endpoint on top of this scaffold.

- [ ] **Step 1: Install dependencies**

```bash
cd "d:/8. AI/tuvi_AI"
npm install express@5.2.1
npm install -D supertest@7.2.2 @types/express@5.0.6 @types/supertest@7.2.1
```

- [ ] **Step 2: Write the failing test**

Create `test/server/routes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.js';

const PHAM_DUY_INPUT = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('POST /charts', () => {
  it('tra ve 200 va Chart dung cho input Pham Duy da xac minh', async () => {
    const res = await request(app).post('/charts').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);
    expect(res.body.menh_than.menh_branch).toBe('Hoi');
    expect(res.body.menh_than.same_palace).toBe(true);
  });

  it('tra ve 400 khi thieu field bat buoc (date)', async () => {
    const res = await request(app)
      .post('/charts')
      .send({ calendar_type: 'duong_lich', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  it('tra ve 400 khi calendar_type khong hop le', async () => {
    const res = await request(app)
      .post('/charts')
      .send({ calendar_type: 'khong_hop_le', date: '1998-12-17', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- server/routes`
Expected: FAIL — `Failed to resolve import "../../src/server/app.js"`

- [ ] **Step 4: Write `src/server/routes.ts`**

```ts
import { Router } from 'express';
import { buildChart } from '../chart/index.js';
import type { BuildChartInput } from '../chart/types.js';

export const router = Router();

router.post('/charts', (req, res) => {
  const chart = buildChart(req.body as BuildChartInput);
  res.status(200).json(chart);
});
```

- [ ] **Step 5: Write `src/server/app.ts`**

```ts
import express from 'express';
import { router } from './routes.js';

export const app = express();

app.use(express.json());
app.use(router);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(400).json({ error: message });
});
```

- [ ] **Step 6: Write `src/server/server.ts`**

```ts
import { app } from './app.js';

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
  console.log(`tuvi-chart-engine API listening on port ${PORT}`);
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- server/routes`
Expected: 3 tests PASS

- [ ] **Step 8: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 9: Add `start` script to `package.json`**

```bash
npm pkg set scripts.start="node --experimental-strip-types src/server/server.ts"
```

Verify the script value was set correctly:

Run: `npm pkg get scripts.start`
Expected: `"node --experimental-strip-types src/server/server.ts"`

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/server/app.ts src/server/routes.ts src/server/server.ts test/server/routes.test.ts
git commit -m "feat: add Express app scaffold + POST /charts endpoint"
```

---

### Task 2: `POST /charts/rules` — build + Rule Engine for all 12 palaces

**Files:**
- Modify: `src/server/routes.ts`
- Modify: `test/server/routes.test.ts`

**Interfaces:**
- Consumes:
  - `src/chart/index.ts`: `buildChart`
  - `src/chart/types.ts`: `BuildChartInput`, `Branch`, `BRANCHES`
  - `src/rule/evaluator.ts`: `matchRules`, `RuleEvalResult`
  - `src/rule/conflict-resolver.ts`: `resolveConflicts`, `ConflictGroup`
  - `src/rule/knowledge-base.ts`: `KNOWLEDGE_BASE`
  - `src/rule/types.ts`: `Rule`
- Produces: `POST /charts/rules` endpoint, live on `app`, response shape:
  ```ts
  {
    chart: Chart,
    rules_by_palace: Record<Branch, {
      matched: RuleEvalResult[];
      conflicts: ConflictGroup[];
    }>
  }
  ```

- [ ] **Step 1: Write the failing test**

Add to `test/server/routes.test.ts` (append after the existing `describe('POST /charts', ...)`
block, keep the existing `PHAM_DUY_INPUT` constant and import at the top of the file):

```ts
describe('POST /charts/rules', () => {
  it('tra ve 200, ca RULE_A va RULE_B match tren cung Hoi, gom vao 1 conflict group', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);

    expect(res.body.chart.menh_than.menh_branch).toBe('Hoi');

    const hoiResult = res.body.rules_by_palace.Hoi;
    const matchedIds = hoiResult.matched
      .filter((r: { matched: boolean }) => r.matched)
      .map((r: { rule_id: string }) => r.rule_id)
      .sort();
    expect(matchedIds).toEqual([
      'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
      'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
    ]);

    expect(hoiResult.conflicts).toHaveLength(1);
    expect(hoiResult.conflicts[0].conflict_group_id).toBe('CG_001');
    expect(hoiResult.conflicts[0].rules.map((r: { rule_id: string }) => r.rule_id).sort()).toEqual([
      'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
      'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
    ]);
  });

  it('co ket qua cho ca 12 cung, kho ng chi cung Hoi', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    expect(res.status).toBe(200);
    const branches = Object.keys(res.body.rules_by_palace).sort();
    expect(branches).toEqual(
      ['Dan', 'Dau', 'Hoi', 'Mao', 'Mui', 'Ngo', 'Suu', 'Than', 'Thin', 'Tuat', 'Ty', 'Ty2'].sort(),
    );
  });

  it('cung khong match rule nao van co matched voi toan bo ket qua false, conflicts rong', async () => {
    const res = await request(app).post('/charts/rules').send(PHAM_DUY_INPUT);
    // Cung Dan (Dien Trach) khong co Thien Dong/Khong/Kiep -> khong rule nao match
    const danResult = res.body.rules_by_palace.Dan;
    expect(danResult.matched).toHaveLength(2); // ca RULE_A, RULE_B deu duoc danh gia
    expect(danResult.matched.every((r: { matched: boolean }) => r.matched === false)).toBe(true);
    expect(danResult.conflicts).toHaveLength(0);
  });

  it('tra ve 400 khi input sai', async () => {
    const res = await request(app)
      .post('/charts/rules')
      .send({ calendar_type: 'duong_lich', time_index: 12, gender: 'nam' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/routes`
Expected: the 4 new tests FAIL — `Cannot POST /charts/rules` (404, since the route doesn't
exist yet), while the 3 existing `POST /charts` tests still PASS.

- [ ] **Step 3: Implement the route in `src/server/routes.ts`**

Add to `src/server/routes.ts` (keep the existing imports and the `POST /charts` route above
this addition):

```ts
import { matchRules } from '../rule/evaluator.js';
import { resolveConflicts } from '../rule/conflict-resolver.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import { BRANCHES } from '../chart/types.js';
import type { Rule } from '../rule/types.js';

router.post('/charts/rules', (req, res) => {
  const chart = buildChart(req.body as BuildChartInput);

  const rulesByRuleId = new Map<string, Rule>(KNOWLEDGE_BASE.map((r) => [r.rule_id, r]));

  const rules_by_palace = Object.fromEntries(
    BRANCHES.map((branch) => {
      const matched = matchRules(chart, branch, KNOWLEDGE_BASE);
      const matchedRules = matched
        .filter((r) => r.matched)
        .map((r) => rulesByRuleId.get(r.rule_id))
        .filter((r): r is Rule => r !== undefined);
      const conflicts = resolveConflicts(matchedRules);
      return [branch, { matched, conflicts }];
    }),
  );

  res.status(200).json({ chart, rules_by_palace });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- server/routes`
Expected: all 7 tests PASS (3 from Task 1 + 4 new)

- [ ] **Step 5: Run full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass (Chart Engine's 48 + Task 0's 1 new + Rule Engine's 34 + Server's 7 = 90
total), no type errors

- [ ] **Step 6: Commit**

```bash
git add src/server/routes.ts test/server/routes.test.ts
git commit -m "feat: add POST /charts/rules — Rule Engine results for all 12 palaces"
```

---

## After completing this plan

Stop and report to the project owner, including:
1. Verbatim `npm test` output (pass/fail counts).
2. Confirmation both endpoints work end-to-end against the real Phạm Duy case, including that
   `POST /charts/rules` correctly surfaces both conflicting Rules (A and B) grouped under
   `CG_001` without either being dropped or ranked.
3. How to actually run the server locally (`npm start`, then `curl -X POST http://localhost:3000/charts -H "Content-Type: application/json" -d '{...}'`), so the project owner can try it themselves before deciding what's next.

**Do not proceed to UI, LLM integration, authentication, CORS, or deployment configuration**
after this plan completes — those are explicitly out of scope (see design doc section 7).
