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
Task 9 (UI) review: clean, approved. Reviewer independently cross-checked Hoi/Menh/THIEN_DONG brightness (mieu, correctly differs from tuvi.vn image's dac per already-documented Phase 2 cross-check finding, not a new bug) and both rule IDs against src/rule/knowledge-base.ts. Carried forward to final review: Th.1 unexplained field + Thien Khoi divergence (both already logged open in design doc known-issues), frontend has zero automated tests (accepted scoped gap per plan), web/src/types.ts is hand-maintained drift risk (documented, out of scope).

ALL 10 UI TASKS (0-9) REVIEWED CLEAN. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW (UI): complete (range 4cc9fa3..84e0898, 13 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 1 Important (sihua/Tu Hoa never rendered in PalaceCell despite being in the data model), 2 Minor (harmless .gitignore duplication, unrelated pending .gitignore/.superpowers working-tree state noted but not in scope).
  Reviewer independently ran full backend suite (97/97), typecheck, frontend tsc -b + vite build + oxlint, all clean. Confirmed no other type drift between backend types.ts and web/src/types.ts beyond the already-fixed engine_meta gap. Confirmed no XSS/injection surface introduced.
  Post-review fix (commit a00445c): added Tu Hoa markers to PalaceCell (matched by star_id, both major and minor stars), legend line added to App.tsx. Verified against real Pham Duy data: all 4 sihua types correctly matched to their stars. Design doc Known Issues updated to log this as resolved. 97/97 tests, tsc -b + vite build clean after fix.

ALL 10 UI TASKS + FINAL REVIEW + POST-REVIEW FIX COMPLETE. Phase 5 (UI) done.

=== LLM OVERVIEW / TANG 1 (plan: docs/superpowers/plans/2026-08-19-llm-overview.md) ===
Started: 2026-08-19
Task 0 (LLM Overview): complete (commits a507350..ac364fd, review clean)
  Fixed pre-existing bug: error middleware returned 400 for ALL thrown errors. Added LlmApiError class (src/llm/errors.ts), middleware now checks instanceof to route 500 vs 400. Verified: existing 400 tests unchanged, 99/99 tests, typecheck clean.
Task 1 (LLM Overview): complete (commits ac364fd..44ac518, review clean)
  Installed @anthropic-ai/sdk@^0.117.1. anthropic-client.ts: callAnthropic() wrapper, throws LlmApiError on missing key/network/auth/bad response shape. Test covers deterministic missing-key path only (no real API call per Global Constraints). 100/100 tests, typecheck clean.
Task 2 (LLM Overview): complete (commits 44ac518..2fb97f5, review clean)
  evidence-pack.ts: buildEvidencePack() splits Facts (all 12 palaces, unrestricted) from Interpretation (matched:true Rules only, no leakage). currentDaiVan() confirmed using the CORRECTED decadalList()+ageRange approach (matches already-tested adapter.ts pattern), not the wrong horoscope().decadal.palaceNames[index] approach. nominalAge (tuoi mu) used, never manual calendar age. Boundary-age test cross-checks against chart.luck_cycles.dai_van for internal consistency. Type casts use real RuleEvalResult/ConflictGroup (structural widening, not narrowed subset). 106/106 tests, typecheck clean.
Task 3 (LLM Overview): DONE_WITH_CONCERNS (commit 77c9cbc)
  overview-prompt.ts: OVERVIEW_SYSTEM_PROMPT (6 rules) + buildUserMessage(). Rule 6 enforces consensus-based hedging INDEPENDENTLY of conflict_group_id (design-review-caught gap: a single tranh_cai interpretation with no conflict partner must still be hedged). overview.ts: generateOverview() orchestrates buildChart -> matchRules/resolveConflicts per branch -> buildEvidencePack -> callAnthropic. Object.fromEntries(...) cast to Record<Branch, {matched: RuleEvalResult[]; conflicts: ConflictGroup[]}> using the REAL types (not a narrowed subset) to avoid TS2352. 110/110 tests, typecheck clean.
  Step 7 (manual verification against real Anthropic API) SKIPPED: ANTHROPIC_API_KEY not set in this environment (checked process.env and .env — neither present). Steps 1-6 are fully self-contained and verified; Step 7 requires a human/session with real API credentials to run the npx tsx command in the brief and manually check the output against the Facts/Interpretation checklist. Status recorded as DONE_WITH_CONCERNS rather than DONE for this reason — not a code defect.
Task 3 (LLM Overview): complete (commits 2fb97f5..77c9cbc, review clean; Step 7 manual real-API verification skipped, no ANTHROPIC_API_KEY in this environment)
  overview-prompt.ts: OVERVIEW_SYSTEM_PROMPT with all 6 rules verbatim, reviewer confirmed rule 6 (consensus-independence, the key fix) correctly framed as independent of rule 3. overview.ts: generateOverview() orchestrates buildChart+matchRules+resolveConflicts+buildEvidencePack+callAnthropic, matches routes.ts's existing pattern. Type cast uses real RuleEvalResult/ConflictGroup. 110/110 tests, typecheck clean. FOLLOW-UP (not blocking): whoever has a real ANTHROPIC_API_KEY should run Task 3 Step 7's manual check before considering the feature production-validated.
Task 4 (LLM Overview): complete (commits 77c9cbc..9a1bd52, review clean)
  POST /charts/overview route added, routes.ts otherwise unchanged. First mock in codebase (vi.mock on callAnthropic only), reviewer confirmed no leakage into anthropic-client.test.ts/evidence-pack.test.ts and real pipeline (buildChart/matchRules/resolveConflicts/buildEvidencePack) still exercised unmocked. 112/112 tests, typecheck clean.

BACKEND (Tasks 0-4) COMPLETE. Proceeding to frontend (Task 5).
Task 5 (LLM Overview, FINAL): DONE_WITH_CONCERNS (commit 6e70016)
  ChartOverviewResponse type + fetchChartOverview (shares postChart<T> helper with
  fetchChartWithRules, DRY refactor, same error-handling behavior) + OverviewSection component
  + App.tsx wiring: two independent fetches per submit, /charts/rules still gates the palace
  grid unchanged, /charts/overview updates its own loading/error state without blocking the
  grid. tsc -b + vite build clean. Backend suite 112/112 (unaffected, no backend files touched).
  Step 7 manual verification: ANTHROPIC_API_KEY NOT set in this environment (same gap as Task
  3). Performed everything not requiring a real LLM call: started real Express + Vite servers,
  confirmed pre-existing /api/charts/rules still proxies correctly (200, valid
  ChartRulesResponse, Menh@Hoi Pham Duy case) — frontend build/wiring not broken by this task.
  Also probed /api/charts/overview through the proxy: reaches the real route handler and fails
  fast with the expected 500 "ANTHROPIC_API_KEY khong duoc set" error (correct behavior per
  Task 1's LlmApiError, not a bug) — confirms the new endpoint is wired through the proxy, but
  the actual overview_text/Facts-Interpretation checklist could not be exercised. Both servers
  stopped cleanly after verification.
  Gap confirmed for reporting: no project-root README.md exists, and ANTHROPIC_API_KEY is not
  documented anywhere in CLAUDE.md or any README (same gap noted, not silently fixed, per
  brief's after-completion instructions).
  FOLLOW-UP (not blocking, carried over from Task 3): whoever has a real ANTHROPIC_API_KEY
  should run Task 3 Step 7 AND Task 5 Step 7's manual checks before considering the LLM
  Overview feature production-validated.

ALL 6 LLM OVERVIEW TASKS (0-5) COMPLETE (code). Step 7 LLM-dependent manual verification for
Tasks 3 and 5 both deferred — no ANTHROPIC_API_KEY available in this environment. Not starting
final whole-branch review here; that decision belongs to whoever picks this up next, per the
brief's own scope note (Tang 1 only, no Tang 2/salience/Knowledge Base expansion).
Task 5 (LLM Overview, FINAL): complete (commits 9a1bd52..6e70016, review clean; LLM-dependent portion of Step 7 skipped, no ANTHROPIC_API_KEY in this environment)
  ChartOverviewResponse type, fetchChartOverview (api.ts refactored to share postChart<T> helper, fetchChartWithRules behavior byte-for-byte preserved), OverviewSection.tsx, App.tsx wired with 2 independent fetches (rules gates grid unchanged, overview never blocks grid, early-return confirmed on rules failure). No new deps, plain CSS. tsc -b + vite build clean. Manually verified through real running servers: pre-existing /api/charts/rules proxy still works, new /api/charts/overview proxy reaches generateOverview and correctly surfaces 500 LlmApiError end-to-end (proves Task 0's middleware fix works through the full stack even without a real API key). FOLLOW-UP (not blocking, carried from Task 3): run the real-LLM Facts/Interpretation checklist with a real ANTHROPIC_API_KEY. Also noted: ANTHROPIC_API_KEY undocumented, no project-root README exists.

ALL 6 LLM OVERVIEW TASKS (0-5) REVIEWED CLEAN. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW (LLM Overview): complete (range a507350..6e70016, 6 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 0 Important, 2 Minor (unreachable-in-practice missing runtime guard in evidence-pack.ts, unrelated pre-existing .gitignore working-tree state).
  Reviewer traced buildEvidencePack()'s Facts/Interpretation split end-to-end in the actual code (not just comments) and confirmed no leak path. Confirmed one-directional src/llm/ -> src/chart/+src/rule/ architecture (grep verified). Confirmed mocked route test doesn't leak (real callAnthropic test still passes same run). 112/112 tests, typecheck + frontend build clean, independently re-run.
  Post-review fix: added README.md documenting ANTHROPIC_API_KEY requirement and setup/run/test commands (project had no README at all before this) — the one actionable recommendation from the final review.

ALL 6 LLM OVERVIEW TASKS + FINAL REVIEW + POST-REVIEW FIX COMPLETE. Tang 1 (Overview) done.
  Standing follow-up (not blocking, carried across Tasks 3/5/final review): run the real-LLM manual verification (Facts/Interpretation checklist) once ANTHROPIC_API_KEY is available.

REAL-LLM MANUAL VERIFICATION (Tasks 3/5 follow-up): complete, closed
  Ran POST /charts/overview for real against a live Anthropic API key (user-provided), Pham Duy case. Cross-checked overview_text against real chart/rules data:
  - Both CG_001 viewpoints (RULE_A + RULE_B) presented together, neither favored, both marked "chua duoc dong thuan rong rai" -- rule 6 (consensus hedging, the key fix) confirmed working on real output.
  - Spot-checked 4 of the 11 non-matched palaces (Tuat, Ty, Suu, Mao) against real chart.palaces star/brightness data -- 100% match, zero hallucinated facts, zero interpretive language attached to unmatched-Rule content.
  - current_dai_van correctly surfaced ("Dai van Phuc Duc, tuoi 29").
  Standing gap from Tasks 3/5/final review is now closed. .env file (gitignored) added for local API key storage going forward.

=== RULE ENGINE v0.2 - DECADE SCOPE (plan: docs/superpowers/plans/2026-08-19-rule-engine-v02-decade.md) ===
Started: 2026-08-19
Task 1 (Rule Engine v0.2): complete (commits 9597509..92390e8, review clean)
  Exported evalExceptionConditions (was private) in src/rule/evaluator.ts, pure visibility change, zero behavior change. 112/112 tests, typecheck clean.
Task 2 (Rule Engine v0.2, final): complete (commit 1654bdb)
  Added evaluateDecadeRule(chart, daiVan, rule) in new src/rule/decade-evaluator.ts, following the
  relation-evaluator.ts pattern (points evalCondition/evalModifier/evalExceptionConditions at the
  palace the given DaiVan's branch falls into, rather than changing the Rule Schema). Fail-loud
  guard: throws if the daiVan argument doesn't match any real entry in chart.luck_cycles.dai_van
  (branch + age_from + age_to) -- prevents silent-wrong-answer bug from a caller passing a DaiVan
  from an unrelated chart. TDD: 5 tests written first in test/rule/decade-evaluator.test.ts, watched
  fail (Cannot find module), then implemented verbatim per task-2-brief.md; all 5 passed on first
  implementation. Full suite: 117/117 tests (112 existing + 5 new), typecheck clean. No Rule using
  scope 'decade' added to src/rule/knowledge-base.ts -- TEST_ONLY_RULE_DECADE stays test-file-only
  per build spec muc 13 (no new Rules without separate authorization).
ALL RULE ENGINE v0.2 TASKS COMPLETE. Scope 'decade' (Dai Van) now has a working evaluator; the other
  5 unused RuleScope enum values (star_pair, pattern, annual, spouse_matching, plus palace_relationship
  which already has relation-evaluator.ts) remain out of scope per plan boundary (build spec muc 13 /
  CLAUDE.md muc 7) -- annual/Luu Nien, Tang 2 domain-mapping/resolveQuery, and "sao van" star data are
  explicitly deferred, not started.
Task 2 (Rule Engine v0.2, FINAL): complete (commits 92390e8..1654bdb, review clean)
  evaluateDecadeRule(chart, daiVan, rule) in new decade-evaluator.ts. Follows relation-evaluator.ts pattern exactly (points evalCondition/evalModifier/evalExceptionConditions at DaiVan.branch's palace). Fail-loud guard verified real by reviewer (checked all 3 fields branch+age_from+age_to against a genuinely-mismatched fixture, not an accidentally-valid one). No Rule Schema changes, no production Rule added to knowledge-base.ts (TEST_ONLY fixture only, matches relation-evaluator.test.ts convention). 117/117 tests, typecheck clean.

ALL 2 RULE ENGINE v0.2 TASKS REVIEWED CLEAN. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW (Rule Engine v0.2): complete (range 9597509..1654bdb, 2 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 0 Important, 2 Minor (guard's branch+age_from+age_to comparison is same-Cuc-blind, not chart-unique -- reviewer constructed a real 2-different-people-same-Cuc counter-example; test fixture note, no action).
  Reviewer independently re-ran full suite (117/117) and typecheck, both clean. Confirmed decade-evaluator.ts faithfully mirrors relation-evaluator.ts's pattern side-by-side, confirmed zero diff in rule/types.ts and rule/knowledge-base.ts.
  Post-review fix: logged the same-Cuc guard limitation in design doc Known Issues -- guard still correct for its stated purpose (2 args mutually consistent), but future Tang 2 resolveQuery caller should thread chart_id explicitly rather than relying on this guard alone to prevent cross-chart mixups.

ALL 2 RULE ENGINE v0.2 TASKS + FINAL REVIEW + POST-REVIEW DOC FIX COMPLETE.

=== RULE ENGINE v0.3 - ANNUAL SCOPE (plan: docs/superpowers/plans/2026-08-19-rule-engine-v03-annual.md) ===
Started: 2026-08-19
Task 1 (Rule Engine v0.3): complete (commits f8eb858..727180e, review clean)
  Exported evalOperator (was private) in evaluator.ts. Added 'luu_nien_stars' to ChartField (additive, existing 5 members unchanged). 117/117 tests, typecheck clean.
Task 2 (Rule Engine v0.3, FINAL): complete (commits 727180e..2d80a33, review clean after 1 fix round)
  evaluateAnnualRule(chart, luuNien, branch, rule) in new annual-evaluator.ts. Own condition-checking logic (evalAnnualField), not reusing evalCondition (LuuNienPalace has no major/minor/adjective structure -- correct per real Tu Vi knowledge). Reviewer confirmed both historical bug classes absent: branch flows through as real parameter (proven by 2-different-branches test), no bad Modifier-as-Condition cast (separate field/operator/value params instead). Field guard throws for both conditions and modifiers. Review found Minor real bug: modifier field='branch' ignored modifier.operator (hardcoded 'in' behavior) -- fixed to delegate to evalOperator matching evaluator.ts's evalModifier pattern, 2 new tests (not_in, equals) added and independently re-verified correct by reviewer. No production Rule added to knowledge-base.ts. 125/125 tests, typecheck clean.

ALL 2 RULE ENGINE v0.3 TASKS REVIEWED CLEAN. Proceeding to final whole-branch review.

FINAL WHOLE-BRANCH REVIEW (Rule Engine v0.3): complete (range f8eb858..2d80a33, 3 commits)
  Verdict: Ready to merge = Yes. 0 Critical, 0 Important, 2 Minor (unused chart param silently kept without resolving design doc's open question; wrong-field guard test only covers conditions path, not modifiers/exceptions -- low priority, shared implementation).
  Reviewer independently verified LuuNienPalace's flat-stars shape justifies the architectural divergence from decade-evaluator.ts (not carelessness), confirmed no hard-coded palace, no unsafe casts, modifier-operator fix matches evaluator.ts's evalModifier pattern exactly. 125/125 tests, typecheck clean, both re-run independently.
  Post-review fix: added comment resolving the "keep or drop chart param" open question from design doc muc 4 -- decided to keep for signature consistency across all 4 evaluators (evaluateRule/evaluateDecadeRule/evaluateRelationRule/evaluateAnnualRule), useful for a future uniform dispatcher. Comment-only, no behavior change.

ALL 2 RULE ENGINE v0.3 TASKS + FINAL REVIEW + POST-REVIEW FIX COMPLETE. Rule Engine now has both decade and annual evaluators -- the two blocks Tang 2 (LLM domain+time deep-dive) depends on.

=== RULE ENGINE v0.4 - CHART_ID (plan: docs/superpowers/plans/2026-08-19-rule-engine-v04-chart-id.md) ===
Started: 2026-08-19
Task 1 (Rule Engine v0.4): complete (commits cdddae8..ce86a7c, review clean)
  Added chart_id to DaiVan/LuuNien (not LuuNienPalace/TieuVan). adaptFromIztro computes chartId once, threads through adaptDaiVan/adaptLuuNien -- reviewer confirmed via grep exactly 1 place in src/ computes the formula. adaptTieuVan untouched. 15/15 chart/adapter tests, typecheck shows exactly 1 expected remaining error (test/rule/decade-evaluator.test.ts, Task 2's responsibility) -- correctly left untouched.
Task 2 (Rule Engine v0.4): complete (commits ce86a7c..2584b27, review clean)
  evaluateDecadeRule guard upgraded to 2 sequential steps (chart_id match, then existing field-match check now scoped to one chart's entries) -- step 2's logic confirmed byte-identical to pre-task version, only reordered/renamed. Reviewer empirically confirmed step 2 test is non-dead-code via mutation testing (deleted step 2, confirmed only that test failed). 126/126 tests (125 baseline + net +1 from splitting 1 test into 2), typecheck fully clean (resolves the 1 error Task 1 deliberately left).
Task 3 (Rule Engine v0.4): complete (commit a06de18, base 2584b27, review clean)
  Added single-step chart_id guard to evaluateAnnualRule (chart.chart_id vs luuNien.chart_id, throws on mismatch) -- deliberately simpler than decade's 2-step guard since LuuNien is 1 object per (chart,year), not an array. Removed stale eslint-disable comment (param now used) and the old "no guard possible" comment block. Closes v0.3 Known Issue. 127/127 tests (126 baseline + 1 new guard test), typecheck clean. All 3 tasks of v0.4 plan now complete.
Rule Engine v0.4 (chart_id): PLAN COMPLETE (all 3 tasks, commits cdddae8..a06de18)
  Final whole-branch review: Approved, 0 Critical, 0 Important, 1 pre-existing Minor (v0.3's open branch-semantics question, correctly left untouched per design doc scoping). All 5 cross-task integration checks confirmed independently by reviewer (single chart_id computation site, decade's 2-guard order, annual's deliberate 1-guard asymmetry, no rule-matching regression, type scoping to DaiVan/LuuNien only). 127/127 tests, clean typecheck. Closes v0.2 and v0.3 Known Issues. Ready for finishing-a-development-branch.

=== TANG 2 - DOMAIN QUERY (plan: docs/superpowers/plans/2026-08-20-llm-query-tang2.md) ===
Started: 2026-08-20
Task 1 (Tang 2): complete (commit 247ab41, base 6eb3ee5, review clean)
  Added DomainKey (12 values) + DomainPalaceEntry type to types.ts, DOMAIN_PALACE_MAP (12 entries) to knowledge-base.ts. Reviewer independently re-ran the iztro verification command to confirm "Tu Nu" (not "Tu Tuc") for domain tu_tuc -- the transcription bug caught during doc-writing (commit a34eeba) did not regress into implementation. 4/4 tests, typecheck clean. Correctly kept outside Rule matching pipeline (not wired into matchRules/resolveConflicts) -- wiring is Task 2's job.
Task 2 (Tang 2): complete (commit 59f27be, base 247ab41, review clean)
  Added src/rule/query-resolver.ts: resolveQuery(chart, domain) [pure, preserves palace_names order via .map()], daiVanAtBranch(chart, branch) [pure, KHAC currentDaiVan() -- reviewer confirmed via reading both functions' source that daiVanAtBranch has zero references to age/date/nominalAge, only branch matching]. Reviewer independently wrote a script to build a real chart and print dai_van entries, confirming age ranges (Mao: 42-51, Hoi: 2-11) are not circular self-consistent test values. 8/8 tests, typecheck clean, full suite 139/139.
Task 3 (Tang 2): complete (commit 86a888b, base 59f27be, review clean)
  Added src/llm/query-evidence-pack.ts: QueryEvidencePack (interface rieng, KHONG sua EvidencePack cua Tang 1), buildQueryEvidencePack() chay ca 4 scope (star_combination, palace_relationship via 3 RelationTarget loop, decade via daiVanAtBranch -- KHONG PHAI Dai Van hien tai, annual). Reviewer confirmed: decade group has zero reference to nominalAge/horoscope (true separation), palaces array preserves resolveQuery's order (test asserts positionally, not via .find()/toContain), decade_age_range correctly null except for decade scope. 10/10 tests, typecheck clean, full suite 149/149. 1 Minor finding logged to design doc Known Issues (InterpretationItem lacks matched_modifiers field -- pre-existing schema gap, not this task's bug).
Task 4 (Tang 2): complete (commit 73e21c0, base 86a888b, review clean)
  Added src/llm/query-prompt.ts: QUERY_SYSTEM_PROMPT (7 quy tac, copied verbatim from design doc) + buildQueryUserMessage(). Reviewer verified via scripted byte-for-byte string comparison (not just visual read) that the prompt content matches the brief EXACTLY -- 5270 characters, EXACT MATCH: true. Rule 7 (3-way temporal comparison logic for decade phases) confirmed intact with all 3 branches (da qua/dang dien ra/sap toi) and correct comparison operators. overview-prompt.ts confirmed untouched. 5/5 tests, typecheck clean, full suite 149/149.
Task 5 (Tang 2): complete (commit 761fb3d, base 73e21c0, review clean)
  Added src/llm/query.ts (generateDomainQuery orchestrator: buildChart -> resolveQuery -> buildQueryEvidencePack -> callAnthropic with QUERY_SYSTEM_PROMPT), POST /charts/query route in routes.ts (validates domain against 12 DomainKey values BEFORE calling generateDomainQuery, no try/catch -- relies on Express 5 auto error forwarding). Test added to existing test/server/routes.test.ts (NOT a separate file) per corrected convention. Reviewer independently confirmed baseline 154 -> 158 tests (+4), full response returns FULL Chart (12 palaces, not domain-filtered) while QueryEvidencePack stays internal-only (never in response). All 5 code-level tasks of Tang 2 plan now complete.
Task 6 (Tang 2): complete -- real-LLM verification, no code changes
  Started server with real ANTHROPIC_API_KEY from .env, called POST /charts/query 5 times against live Anthropic API (case Pham Duy): domain=phuc_duc (decade currently-active), domain=quan_loc (decade FUTURE -- hardest case, LLM correctly generalized to future tense despite prompt only having past/present examples), domain=phu_mau (ambiguous domain, correct ordering "cung chinh" vs "goc nhin bo sung"), domain=quan_loc+view_year=2026 (annual scope, correct "Rieng nam 2026" phrasing). Facts/Interpretation boundary held even with mostly-empty items (only 2 production Rules exist). No prompt fixes needed. Results logged to design doc muc 8.

TANG 2 (DOMAIN QUERY): ALL 6 TASKS COMPLETE (commits 6eb3ee5..761fb3d for code, plus design doc updates). Ready for final whole-branch review.

TANG 2 (DOMAIN QUERY): FINAL WHOLE-BRANCH REVIEW complete (range a06de18..f9a2156, 12 commits)
  Verdict: Approved. 0 Critical, 0 Important, 1 Minor (staticGroupItems reimplements evalCondition logic instead of reusing evaluateRule -- known, not new, root cause of the matched_modifiers gap already logged in Task 3's review). All 8 cross-task integration checks confirmed independently: resolveQuery correctly needs chart (not domain-only), daiVanAtBranch has zero overlap with currentDaiVan() and evaluator functions (evaluateDecadeRule/evaluateAnnualRule/evaluateRelationRule) have ZERO diff across all 12 commits, priority ordering preserved end-to-end via positional test assertions, evidence-pack.ts/overview-prompt.ts have ZERO diff (Tang 1 untouched), decade_age_range correctly scoped, all 3 RelationTarget values called, route validates domain before building Chart. Task 6's real-LLM verification confirmed genuine (quoted actual LLM output, not a generic "tested, fine" claim). 158/158 tests, typecheck clean. Branch hygiene clean -- no TODO/debug code, Known Issues properly logged not dropped.

TANG 2 READY FOR finishing-a-development-branch.

=== PATCH: matched_modifiers (plan: docs/superpowers/plans/2026-08-20-query-evidence-pack-modifiers-patch.md) ===
Started: 2026-08-20
Task 1 (patch): complete (commit a8d2683, base 1d9fa8d, review clean)
  Extended InterpretationItem with matched_modifiers: Modifier[] (full type, not reduced). staticGroupItems now calls evaluateRule (with existing scope filter preserved BEFORE the call, since evaluateRule throws on palace_relationship scope) instead of reimplementing evalCondition -- closes the Minor finding from Tang 2's final review. All 4 group functions (staticGroupItems/relationGroupItems/decadeGroup/annualGroupItems) confirmed passing result.matched_modifiers into ruleToItem, none skipped. Test confirms RULE_B's real modifier (branch Ty2/Hoi, weight 0.7) surfaces correctly, RULE_A's empty modifiers stay []. 13/13 tests, full suite 161/161, typecheck clean. 4 evaluator files confirmed untouched (0 diff).
Task 2 (patch): complete (commit b04c51a, base a8d2683, review clean)
  Added quy tac 8 to QUERY_SYSTEM_PROMPT (matched_modifiers wording as a mitigating factor, not a new conclusion, with real RULE_B example). Reviewer independently verified EXACT MATCH byte-for-byte (1552 chars) between the brief and the live file using scripted string comparison, confirmed correct insertion position (only 1 line changed in quy tac 7's closing to append quy tac 8 before the template string's closing backtick), confirmed quy tac 7 untouched. 163/163 tests, typecheck clean.
Task 3 (patch): complete -- real-LLM verification, found + fixed a real gap, verified again
  Vong 1 verify (domain=menh, RULE_A+RULE_B cung CG_001, RULE_B co modifier that tai branch Hoi): LLM sai -- diễn đạt modifier như "Quan điểm thứ hai" ngang hàng RULE_A, thay vì gia giảm LỒNG bên trong RULE_B. Đây là case KHÔNG hiếm -- chính là Entry 001, cặp Rule trung tâm duy nhất của KB, xảy ra ngay khi domain trả cung Mệnh của case Phạm Duy.
  Fix (commit eea8411): thêm sub-rule vào quy tac 8 (modifier lồng trong item khi có ca conflict_group_id LAN matched_modifiers, khong tach thanh muc ngang hang) + 1 cap vi du DUNG/SAI moi dung RULE_A/RULE_B that.
  Vong 2 verify: LLM dung -- modifier nam long trong "(Quan diem B)", khong con la "quan diem thu 3" doc lap.
  163/163 tests, typecheck clean. Ket qua log day du vao design doc muc 8 Known Issues.

PATCH matched_modifiers: ALL 3 TASKS COMPLETE (commits a8d2683..eea8411). Ready for final review.

PATCH matched_modifiers: FINAL REVIEW complete (range 1d9fa8d..eea8411, 4 commits)
  Verdict: Approved. 0 Critical, 0 Important, 0 Minor. All 6 verification points confirmed independently: matched_modifiers uses full Modifier type across all 4 group functions; staticGroupItems' scope filter preserved before evaluateRule (load-bearing, not decorative -- evaluateRule throws on palace_relationship); 4 evaluator files untouched (0 diff); quy tac 8 verbatim-matches design doc via scripted comparison; the "found gap + fixed + re-verified" story confirmed genuine (real RULE_A/RULE_B data, matches design doc's round-1/round-2 account); test coverage uses real Rule data, not mocks. 163/163 tests, typecheck clean. Both Known Issues closed with substantive explanation per CLAUDE.md muc 10.

PATCH READY FOR finishing-a-development-branch.

=== ALGORITHM ZHONGZHOU (plan: docs/superpowers/plans/2026-08-21-algorithm-zhongzhou.md) ===
Started: 2026-08-21
Task 1 (algorithm zhongzhou): complete (commit ad9ddca, base 0205125, review clean)
  Added astro.config({algorithm:'zhongzhou'}) at module-level of iztro-client.ts (verified: only 1 call site in entire codebase, before first function def). Added 4 new star_id entries (Long Duc, Dai Hao, Kiep Sat, Triet Khong) at correct position in star-id-map.ts without removing Triet Lo. Updated adapter.ts's notes array (Tuan/Triet comment TRIET_LO->TRIET_KHONG, added algorithm note). 162/163 tests pass, exactly 1 expected fail (pham-duy-crosscheck.test.ts soul_star assertion, Task 4's scope). Typecheck clean. Reviewer independently ran callIztro() to confirm Lộc Tồn output.
Task 2 (algorithm zhongzhou): complete (commit 0f2d986, base ad9ddca, review clean)
  Added test/chart/algorithm-config.test.ts: runtime behavior guard building 2 different cases interleaved 4 times, asserting specific known values (Loc Ton / Pha Quan), not internal comparison. Reviewer did a sabotage test (temporarily changed expected value to wrong 'Cu Mon', confirmed test genuinely fails, restored, confirmed clean diff) to prove the guard has real teeth. 2/2 new tests, full suite 164/165 (1 known pre-existing fail from Task 1, Task 4's scope), typecheck clean.
Task 3 (algorithm zhongzhou): complete (commit f48f8e3, base 0f2d986, review clean)
  Fixed all 3 test files that bypassed iztro-client.ts (adapter.test.ts's 2 call sites, iztro-smoke.test.ts, evidence-pack.test.ts) to call callIztro() instead of importing astro directly. Reviewer independently diffed iztro-smoke.test.ts against the original blob to confirm all 7 assertion values unchanged (only the call mechanism changed), and personally read the one "extra" grep hit in algorithm-config.test.ts to confirm it's a genuine comment, not disguised bypass code. 36/36 target tests, full suite 164/165 (1 known pre-existing fail, Task 4's scope), typecheck clean, grep confirms only iztro-client.ts remains as a real call site.
Task 4 (algorithm zhongzhou): complete (commit 6868baa, base f48f8e3, review clean)
  Replaced entire stale 18-line comment block in pham-duy-crosscheck.test.ts (explained OLD decision to keep algorithm:'default', now backwards vs reality) with new comment referencing 2026-08-21-algorithm-zhongzhou-design.md, updated soul_star assertion Cu Mon->Loc Ton. Rescanned 8 keyword-matching files, confirmed via real code runs (not guessing) that no other assertion needed updating. Suite reaches 100% (165/165) for the first time in this plan. Reviewer independently re-read 3 of the 8 rescanned files to verify "no fix needed" conclusions, and flagged 1 unrelated flaky test (POST /charts/overview timeout under load, reproducible only on first parallel run) as a Known Issue to log separately -- not this task's scope. Typecheck clean.

ALGORITHM ZHONGZHOU: ALL 4 CODE TASKS COMPLETE (commits ad9ddca..6868baa). Task 5 (design doc update only) remains, then final review.
Task 5 (algorithm zhongzhou): complete (commit 961cfb4, base 6868baa, review clean)
  Added update block to mục 7 of 2026-08-16-chart-engine-design.md, listing 5 discrepancies now resolved and 2 that remain genuinely independent (Thien Khoi, 7-vs-5 brightness scale). Original mục 6-7 content preserved verbatim, only additions. 165/165 tests, typecheck clean.

Post-Task-5 fix (commit 8e5979b, outside brief scope, flagged by final task review): the "Known issues" section at the TOP of chart-engine-design.md still said [MỞ] for exactly the work just completed, and still contained a sentence explicitly saying "KHONG doi algorithm trong code san pham" -- backwards from reality after Task 1-5. Fixed both entries to [ĐÃ XỬ LÝ] with cross-reference to 2026-08-21-algorithm-zhongzhou-design.md. Doc-only, 165/165 unaffected.

ALGORITHM ZHONGZHOU: ALL 5 TASKS COMPLETE (commits ad9ddca..8e5979b). Ready for final whole-branch review.

ALGORITHM ZHONGZHOU: FINAL WHOLE-BRANCH REVIEW complete (range 0205125..8e5979b, 6 commits)
  Verdict: Approved. 0 Critical, 0 Important, 0 Minor. All 7 integration checks confirmed independently: single astro.config() call site (grep-verified, 3 comment false-positives correctly excluded), 4 new star entries correct position/convention with Triet Lo preserved, 165/165 tests with zero loosened assertions, algorithm-config.test.ts proven to have real teeth (reviewer independently ran buildChart() for OTHER_CASE outside the test, matched hardcoded expectation), doc consistency confirmed genuine (both top-of-file and mục 7 now say [ĐÃ XỬ LÝ], old historical docs correctly left as history not contradiction), pham-duy-crosscheck.test.ts's old 18-line comment fully replaced, and mục 1.2's layering claim verified against real conflict-resolver.ts code (not just narrative). No TODO/debug residue, zero UI/frontend files touched (design doc mục 6 honored). Typecheck clean.

ALGORITHM ZHONGZHOU READY FOR finishing-a-development-branch.

=== WEB VONG CUNG PORT (plan: docs/superpowers/plans/2026-08-25-web-vong-cung-port.md) ===
Started: 2026-08-25
Task 1 (web vong cung port): complete (commit 4c9d392, base 0a3b24d, review clean)
  Added scripts/generate-star-labels.ts (regex-parse STAR_ID_BY_VI tu src/chart/star-id-map.ts, dao nguoc thanh web/src/star-labels.ts, KHONG import runtime). 80 nhan sao sinh ra, khop hoan toan voi source. Reviewer xac nhan byte-for-byte khop brief, khong co Critical/Important.
Task 2 (web vong cung port): complete (commits 3c83ebe..8a8a28b, review clean after 1 fix)
  Doi token mau/font sang palette giay do/muc cham/do son (3-layer dark-theme structure). Review vong 1 phat hien Important: xoa :root cu lam dangling 3 custom property (--border/--text-h/--code-bg) van dung o #root/code/.counter. Fix: thay truc tiep bang token moi (--brass-line/--ink/--paper-deep). Re-review sau fix: Approved, 0 Critical/Important/Minor.
Task 3 (web vong cung port): complete (commit e76b2ab, base 9b695f3, review clean)
  Them ham hasInterpretation(ruleResult): boolean vao cuoi web/src/types.ts, loc dung matched:boolean tren tung phan tu (khong dung .length cua mang goc). Reviewer xac nhan dung chu ky, dat dung vi tri, khong dung cham file khac. 1 Minor false-alarm (comment khong dau) -- xac nhan la quy uoc nhat quan toan bo codebase (vd star-id-map.ts cung dung), khong sua.
Task 5 (web vong cung port): complete (commits 6dc3104..1073ffd, review clean after 1 fix)
  Doi PalaceCell.tsx sang cau truc moi (chinh tinh font thu phap, ten sao co dau qua STAR_LABEL, badge hasInterpretation(), xoa RuleResults inline nhung KHONG xoa file RuleResults.tsx -- do Task 6). Doi thu tu thuc thi thuc te: 5->6->4->7 (khong phai 4->5->6->7 nhu plan viet) vi PalaceGrid (Task 4) phu thuoc RuleResultsPanel (Task 6), va Task 6 xoa RuleResults.tsx ma PalaceCell cu dang import -- xoa truoc se vo build. Loi build tam thoi tai PalaceGrid.tsx (thieu prop isMenhPalace/onSelect) la DU KIEN, cho Task 4. Review vong 1 phat hien Important: bo sot hien thi branch_element (nguhanh cua chi cung). Fix: them lai vao .palace-top-row. Re-review: Approved.
Task 6 (web vong cung port): complete (commit 396bf7d, base 56753c8, review clean)
  Tao RuleResultsPanel.tsx (modal khi click cung), xoa RuleResults.tsx cu (khong con noi nao import). Diem quan trong nhat da xac nhan doc lap: conflict groups hien thi DU MOI rule, NGANG HANG (khong slice/collapse/sort ngu y thu tu dung sai) -- dung nguyen tac cot loi du an (khong chon phe khi 2 nguon tri thuc mau thuan). Backdrop-click-vs-inner-click bubbling xu ly dung (stopPropagation). Esc listener cleanup dung. 0 Critical/Important, 2 Minor (khong can sua: memoization khong dang ke, aria-modal la accessibility polish ngoai pham vi brief).
Task 4 (web vong cung port): complete (commit ec5022f, base 0979eab, review clean)
  Viet lai PalaceGrid.tsx khop interface moi cua PalaceCell (Task 5)/RuleResultsPanel (Task 6): state selectedBranch, truyen du isMenhPalace/luuNienStars/onSelect, render RuleResultsPanel o cuoi. Props cong khai {data, displayName} giu nguyen, App.tsx khong doi. CSS .palace-grid/.center-block/#root port dung tu mockup, tim bang ten class (khong theo so dong da lech do Task 2/5/6). BUILD HOAN TOAN SACH lan dau tien sau khi doi thu tu thuc thi -- reviewer tu chay lai tsc -b va npm run build doc lap, xac nhan 0 loi. Day la task tich hop cuoi cung noi cac phan da tach roi tu Task 5/6.
Task 7 (web vong cung port): complete (commit 7b9bd52, base b6ccba8, review clean)
  Style .overview-section/.overview-section.error theo palette moi, OverviewSection.tsx khong doi (JSX da ke thua dung qua className). Verify: subagent khong the click trinh duyet that -- thay bang build+lint sach, khoi dong backend that + curl 2 request that (case Pham Duy khong/co view_year, xac nhan chart.palaces 12 phan tu + rules_by_palace + chart.luu_nien day du field), khoi dong dev server xac nhan start OK, dung ca 2 server sach (verify bang port-listen check). Phat hien phu: route Express that KHONG co prefix /api (chi Vite dev proxy co) -- verify bang doc code that (app.ts/routes.ts/vite.config.ts), khong doan. Reviewer xac nhan doc lap dung claim nay.

TAT CA 7 TASK HOAN TAT (commits 4c9d392..7b9bd52). Build hoan toan sach (tsc + oxlint). Con lai: human click-through UI test (Step 3 cua Task 7 brief) truoc final whole-branch review.
