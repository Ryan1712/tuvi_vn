import { buildChart } from '../chart/index.js';
import type { BuildChartInput, Chart, Branch } from '../chart/types.js';
import { matchRules, type RuleEvalResult } from '../rule/evaluator.js';
import { resolveConflicts, type ConflictGroup } from '../rule/conflict-resolver.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import { BRANCHES } from '../chart/types.js';
import type { Rule } from '../rule/types.js';
import { buildEvidencePack } from './evidence-pack.js';
import { OVERVIEW_SYSTEM_PROMPT, buildUserMessage } from './overview-prompt.js';
import { callAnthropic } from './anthropic-client.js';

export interface ChartOverviewResponse {
  chart: Chart;
  overview_text: string;
}

/**
 * Dieu phoi toan bo luong Tang 1: build Chart + rules_by_palace (giong het pattern trong
 * routes.ts's POST /charts/rules) -> dung EvidencePack -> goi LLM -> tra ve.
 * Tinh lai toan bo pipeline (khong tai dung ket qua tu /charts/rules) — chap nhan duoc
 * o v0.1, xem design doc muc 8 Known Issues.
 */
export async function generateOverview(input: BuildChartInput): Promise<ChartOverviewResponse> {
  const chart = buildChart(input);

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
    // Object.fromEntries widens to {[k: string]: T} — cast to Record<Branch, T> since
    // BRANCHES.map() guarantees every Branch key is present exactly once. Use the REAL
    // RuleEvalResult/ConflictGroup types here (not a narrowed structural subset) — a
    // narrower type fails the cast (TS2352, insufficient overlap) since RuleEvalResult
    // carries matched_modifiers/triggered_exceptions that a hand-written subset omits.
  ) as Record<Branch, { matched: RuleEvalResult[]; conflicts: ConflictGroup[] }>;

  const pack = buildEvidencePack(input, chart, rules_by_palace);
  const overview_text = await callAnthropic(OVERVIEW_SYSTEM_PROMPT, buildUserMessage(pack));

  return { chart, overview_text };
}
