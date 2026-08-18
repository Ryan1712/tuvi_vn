# Chart Engine — Progress Ledger

Plan: docs/superpowers/plans/2026-08-16-chart-engine.md
Started: 2026-08-16

Task 1: complete (commits 86a25f4..4c3013d, review clean)
  Minor (deferred to final review): package.json has npm-init boilerplate ("main": "index.js", "directories.doc") that points at nonexistent paths.
Task 2: complete (commits 4c3013d..81b58ff, review clean)
  Minor (deferred): SihuaSource allows "luu_nien" though LuckCycles has no luu_nien field — intentional forward-compat, but nothing type-level prevents an orphan sihua entry.
Task 3: complete (commits 81b58ff..03a156b, review clean after 1 fix round)
  Fixed: added throw-path tests for brightnessFromVi/sihuaTypeFromVi/branchFromVi.
  Controller-verified: all 66 star names in the table exist in iztro vi-VN locale (resolves reviewer warning).
  Note: task-3-report.md miscounts entries as 48; actual is 66. Code is correct; report text is wrong.
Task 4: complete (commits 03a156b..95358ec, review clean after 1 fix round)
  Fixed: NaN month/day silently produced wrong nap am (Solar.fromYmd does not throw on NaN); now validated per-field + segment count.
  Minor (deferred): task-4-report.md fix section claimed by implementer but not actually present in file — traceability gap only, code/tests verified correct directly.
Task 5: complete (commits 95358ec..57f3c77, review clean)
  Note: implementer was interrupted by a session spend-limit error after finishing code/tests/typecheck but before committing; controller independently re-verified (npm test, npm run typecheck) before committing on its behalf.
  Minor (deferred): extractSihua only scans major/minor stars, not adjectiveStars -- correct for iztro 2.6.0 today (verified empirically) but unguarded/uncommented assumption about library internals.
  Minor (deferred): yearCanChi fallback `?? ''` is dead code in practice (chineseDate split never yields undefined at index 0), harmless.
Task 6: complete (commits 57f3c77..bfc9a70, review clean)
  Verified: three-file no-cycle shape (iztro-client/queries/index) confirmed via import grep, no cycles anywhere in src/chart.
Task 7: complete (commits bfc9a70..cf4e526, review clean)
  Controller-verified: algorithm=zhongzhou toggle reproduces Loc Ton for soul, body/cuc unchanged (matches report).
  0 bucket-1 (bug), 12 bucket-2 (school diff: 10 brightness + palace naming + chu menh), 0 bucket-3.
  Minor (deferred): only 1 of 10 brightness mismatches has a regression-locking test assertion (matches brief template, not implementer deviation).
  All 7 tasks complete. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW: complete (range 86a25f4..cf4e526, 9 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 0 Important, 5 Minor (all previously triaged, none escalated).
  All 5 Minor items left for backlog per reviewer recommendation: package.json boilerplate, SihuaSource orphan value, extractSihua adjectiveStars assumption, dead-code fallback in yearCanChi, asymmetric brightness regression coverage.

ALL 7 TASKS + FINAL REVIEW COMPLETE.

=== PHASE 3: RULE ENGINE (plan: docs/superpowers/plans/2026-08-17-rule-engine.md) ===
Started: 2026-08-17
Task 1 (Rule Engine): complete (commits 3f9bf91..67d7a3a, review clean)
  Minor (deferred): Condition.required is literal-true type, carries no info in v0.1 but documented as forward-compat groundwork; Rule.subject uses inline anon type instead of named type.
Task 2 (Rule Engine): complete (commits 67d7a3a..bf8816e, review clean)
  Verified: matched field derives ONLY from conditions, structurally independent of modifiers/exceptions. equals/in/not_in operators correct.
Task 3 (Rule Engine): complete (commits bf8816e..f5de7a6, review clean)
  Verified: relation-evaluator delegates fully to relatedPalaces()+evalCondition, no reimplemented relationship logic. evaluator.ts untouched.
  Minor (deferred, accepted tradeoff per plan): rebuilds full Chart per condition — perf out of scope for v0.1.
Task 4 (Rule Engine): complete (commits f5de7a6..931ba31, review clean)
  Verified line-by-line: no ranking/sorting logic, null conflict_group_id correctly excluded via continue before Map ops (no "null"-string coercion bug), zero Chart dependency.
Task 5 (Rule Engine, FINAL): complete (commit 56e855f)
  Seed Entry (RULE_A + RULE_B, SRC_001 + SRC_002) encoded verbatim per build spec muc 9. End-to-end
  integration test confirms: RULE_A and RULE_B both match on the real Pham Duy chart (Menh@Hoi,
  built via buildChart() -- no mocks), RULE_B's Ty2/Hoi modifier fires, and resolveConflicts groups
  both into exactly one CG_001 group with neither rule dropped/reordered and consensus/sources intact.
  Full suite: 82/82 passing (71 prior + 11 new). typecheck clean. No discrepancies vs brief's
  pre-verified values -- chart data matched on first run.
  ALL 5 TASKS COMPLETE. Rule Engine (Phase 3) done -- stopping per build spec muc 13 (no LLM
  integration, no additional Rules, no Case persistence, no UI).
Task 5 (Rule Engine): complete (commits 931ba31..56e855f, review clean)
  Domain-accuracy verified explicitly: Rule A requires all 3 stars, Rule B requires only Khong+Kiep (no Thien Dong), branch check in modifiers not conditions, both CG_001, both 3_thap/tranh_cai, no 3rd Rule anywhere.
  Integration test confirmed: both rules match real Pham Duy chart, grouped into 1 ConflictGroup, neither dropped/ranked.

ALL 5 RULE ENGINE TASKS COMPLETE. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW (Rule Engine): complete (range 3f9bf91..56e855f, 5 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 0 Important, 6 Minor (all previously triaged, none escalated).
  Both safety-critical guarantees verified by direct code reading: matched independent of modifiers/exceptions, Conflict Resolver never ranks.
  Domain accuracy of RULE_A/RULE_B re-verified independently against build spec.

ALL 5 RULE ENGINE TASKS + FINAL REVIEW COMPLETE.

=== PHASE 4: API SERVER (plan: docs/superpowers/plans/2026-08-17-api-server.md) ===
Started: 2026-08-17
Task 0 (API Server): complete (commits ed1df86..c11e529, review clean)
  Bug closed: callIztro now explicitly validates calendar_type is am_lich, throws for anything else (fixes plan-verification-discovered issue).
  Reviewer note (to check at Task 1/2 review): confirm the new Error is correctly mapped to HTTP 400 by the error middleware.
Task 1 (API Server): complete (commits c11e529..0019b2d, review clean)
  Verified by tracing code: Error thrown from callIztro -> buildChart -> route handler -> Express 5 auto-forward -> error middleware -> 400 {error}. Real path, not just test-trusted.
  app.ts exports app without .listen(); only server.ts calls it (confirmed via grep).
Task 2 (API Server): complete (commits 0019b2d..6e1b5d4, review clean)
  Verified: matched array is unfiltered RuleEvalResult[] (traceability preserved), conflicts computed from separate matched-only subset.
  Domain correctness confirmed: RULE_A+RULE_B both match at Hoi grouped into 1 CG_001, both matched:false at Dan with empty conflicts.

ALL 3 API SERVER TASKS COMPLETE. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW (API Server): complete (range ed1df86..6e1b5d4, 3 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 0 Important, 1 new Minor (missing design-rationale comments) + 4 previously-deferred Minor (all still correctly non-blocking).
  Reviewer went beyond plan: independently verified malformed-JSON-body case also reaches error middleware correctly.

Post-review fix (API Server): complete (commit 427d193)
  Added design-rationale comments to app.ts (Express 5 auto-forward) and routes.ts (unfiltered matched for traceability). Comment-only, 90/90 tests unchanged.

ALL 3 API SERVER TASKS + FINAL REVIEW + POST-REVIEW FIX COMPLETE.

=== PHASE 5: UI (plan: docs/superpowers/plans/2026-08-18-ui.md) ===
Started: 2026-08-18
Task 0 (UI): complete (commits 4cc9fa3..f70c73d, review clean)
  Fixed pre-existing broken npm start script (--experimental-strip-types -> tsx). Verified: server starts, curl /charts returns valid Chart JSON.
Task 1 (UI): complete (commits f70c73d..89a7426, review clean)
  branch-element.ts static lookup. Reviewer independently verified all 12 mappings against node_modules/iztro/lib/data/earthlyBranches.js source. 91/91 tests, typecheck clean.
Task 2 (UI): complete (commits 89a7426..ee49d7d, review clean)
  types.ts extended: MinorStar.type, ChartPalace 5 new fields (4 as raw string, not starIdFromVi), LuuNienPalace/LuuNien, Chart.luu_nien optional, BuildChartInput.view_year optional. Reviewer independently re-ran typecheck: exactly 2 expected errors in adapter.ts (fixed by Task 3), zero elsewhere.
Task 3 (UI): complete (commits ee49d7d..515557c, review clean)
  adapter.ts wired: minor_stars type passthrough, 4 new ChartPalace fields as raw strings (not starIdFromVi), adaptLuuNien with position-based indexing (astrolabe.palaces[i], not branch lookup). 10 luu-tinh entries added to star-id-map.ts, cross-checked by reviewer against iztro's actual locale source file. Fail-loud convention verified maintained (all star names still throw via starIdFromVi on mismatch). 95/95 tests, typecheck clean.
Task 4 (UI): complete (commits 515557c..38fa386, review clean)
  routes.test.ts: 2 new integration tests for view_year -> luu_nien through real HTTP layer, no production code changes. 97/97 tests, typecheck clean.

BACKEND HALF (Tasks 0-4) COMPLETE. Proceeding to frontend (Tasks 5-9, web/ Vite React app).
Task 5 (UI): complete (commits 38fa386..3205aec, review clean)
  web/ scaffolded via real Vite create (React+TS), vite.config.ts proxies /api -> localhost:3000 stripping prefix. Confirmed genuinely separate npm package (no workspace linkage, no backend imports). Manual proxy check performed for real (curl comparing direct vs proxied validation-error responses). tsc -b + vite build clean.
Task 6 (UI): complete (commits 3205aec..e080230, review clean after 1 fix round)
  web/src/types.ts + api.ts. Review found Critical: hand-copied Chart type missing engine_meta/EngineMeta field (real gap in plan text since Phase 2, not just implementer error) — fixed (commit e080230), plan doc also corrected. Two other reviewer observations (LuckCycles inlined vs named, ChartRulesResponse vs stale RulesByPalaceResponse label) confirmed non-issues on re-review. tsc -b + vite build clean.
Task 7 (UI): complete (commits 4a564ab..c2246bd, review clean)
  ChartForm.tsx: controlled form (calendar type, date, time index, gender, conditional leap-month, optional view_year, display-only name). No backend imports, no CSS framework. tsc -b + vite build clean.
Task 8 (UI): complete (commits c2246bd..4194c87, review clean)
  PalaceCell.tsx + RuleResults.tsx. Reviewer confirmed structural walkthrough: 2-column cat/hung split applied ONLY to minor_stars (type==='soft'), NOT to adjective_stars or the 3 twelve-position cycles (flat lines, per global constraint). DaiVan/LuuNien palace-name labels (fix applied during plan verification) present and correctly conditional. tsc -b + vite build clean.
Task 9 (UI, FINAL): complete (commit 27f564a)
  PalaceGrid.tsx (12-palace CSS grid + center info block, Dai Van/Luu Nien palace_name lookup by branch) + App.tsx (top-level state, fetchChartWithRules submit handler, loading/error) + index.css grid layout rules, written verbatim per task-9-brief.md. tsc -b + vite build clean, no errors.
  Manual end-to-end verification performed for real: started actual Express server (port 3000) + actual Vite dev server (port 5173, /api proxy), POSTed to the proxied /api/charts/rules endpoint via curl. Base Pham Duy case: 12 palaces, Hoi = Menh with THIEN_DONG (mieu) major star, both RULE_A/RULE_B matched + 1 conflict group (CG_001), no luu_nien. Same case + view_year=2026-01-01: luu_nien present (year 2026, At Ty, 12 luu-nien palaces). Both servers stopped cleanly after verification. Backend suite: 97/97 passing.

ALL 10 UI TASKS (0-9) COMPLETE. Phase 5 (UI) plan finished — stopping per plan's explicit scope boundary (no LLM integration, no additional Rules, no CSS polish/animation, no deployment config, no automated frontend tests).
