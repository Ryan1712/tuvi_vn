import { Router } from 'express';
import { buildChart } from '../chart/index.js';
import type { BuildChartInput } from '../chart/types.js';
import { matchRules } from '../rule/evaluator.js';
import { resolveConflicts } from '../rule/conflict-resolver.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import { BRANCHES } from '../chart/types.js';
import type { Rule } from '../rule/types.js';

export const router = Router();

router.post('/charts', (req, res) => {
  const chart = buildChart(req.body as BuildChartInput);
  res.status(200).json(chart);
});

router.post('/charts/rules', (req, res) => {
  const chart = buildChart(req.body as BuildChartInput);

  const rulesByRuleId = new Map<string, Rule>(KNOWLEDGE_BASE.map((r) => [r.rule_id, r]));

  const rules_by_palace = Object.fromEntries(
    BRANCHES.map((branch) => {
      // Keep matched unfiltered (including matched: false entries) for full traceability;
      // filtering to matched-only happens separately in matchedRules for resolveConflicts.
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
