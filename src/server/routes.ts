import { Router } from 'express';
import { buildChart } from '../chart/index.js';
import type { BuildChartInput } from '../chart/types.js';
import { matchRules } from '../rule/evaluator.js';
import { resolveConflicts } from '../rule/conflict-resolver.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import { BRANCHES } from '../chart/types.js';
import type { Rule } from '../rule/types.js';
import { generateOverview } from '../llm/overview.js';
import { generateDomainQuery } from '../llm/query.js';
import type { DomainKey } from '../rule/types.js';

export const router = Router();

const VALID_DOMAINS: DomainKey[] = [
  'menh', 'phu_mau', 'phuc_duc', 'dien_trach', 'quan_loc', 'no_boc',
  'thien_di', 'tat_ach', 'tai_bach', 'tu_tuc', 'phu_the', 'huynh_de',
];

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

router.post('/charts/overview', async (req, res) => {
  const result = await generateOverview(req.body as BuildChartInput);
  res.status(200).json(result);
});

router.post('/charts/query', async (req, res) => {
  const { domain, ...chartInput } = req.body as BuildChartInput & { domain: DomainKey };
  if (!VALID_DOMAINS.includes(domain)) {
    res.status(400).json({ error: `domain khong hop le: "${domain}"` });
    return;
  }
  const result = await generateDomainQuery(chartInput as BuildChartInput, domain);
  res.status(200).json(result);
});
