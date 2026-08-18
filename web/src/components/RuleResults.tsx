import type { PalaceRuleResult } from '../types';

interface RuleResultsProps {
  result: PalaceRuleResult;
}

export function RuleResults({ result }: RuleResultsProps) {
  const matched = result.matched.filter((r) => r.matched);
  if (matched.length === 0 && result.conflicts.length === 0) return null;

  return (
    <div className="rule-results">
      {matched.map((r) => (
        <div key={r.rule_id} className="rule-match">
          <span>{r.rule_id}</span>
          {r.matched_modifiers.length > 0 && (
            <span> (modifier: {r.matched_modifiers.map((m) => m.effect).join(', ')})</span>
          )}
        </div>
      ))}
      {result.conflicts.map((c) => (
        <div key={c.conflict_group_id} className="conflict-group">
          Tranh cãi ({c.conflict_group_id}): {c.rules.map((r) => r.rule_id).join(' vs ')}
        </div>
      ))}
    </div>
  );
}
