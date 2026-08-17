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
