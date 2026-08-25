import { useEffect } from 'react';
import type { Branch, PalaceRuleResult } from '../types';
import { hasInterpretation } from '../types';

interface RuleResultsPanelProps {
  branch: Branch | null;
  palaceName: string | null;
  ruleResult: PalaceRuleResult | null;
  onClose: () => void;
}

export function RuleResultsPanel({ branch, palaceName, ruleResult, onClose }: RuleResultsPanelProps) {
  useEffect(() => {
    if (branch === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [branch, onClose]);

  if (branch === null || ruleResult === null) return null;

  const matched = ruleResult.matched.filter((r) => r.matched);
  const hasContent = hasInterpretation(ruleResult);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className="rule-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rule-panel-head">
          <span>{palaceName}</span>
          <button type="button" className="rule-panel-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        {!hasContent && (
          <div className="rule-panel-empty">Chưa có luận giải cho cung này.</div>
        )}
        {matched.map((r) => (
          <div key={r.rule_id} className="rule-panel-match">
            <span>{r.rule_id}</span>
            {r.matched_modifiers.length > 0 && (
              <span className="rule-panel-modifier"> (modifier: {r.matched_modifiers.map((m) => m.effect).join(', ')})</span>
            )}
          </div>
        ))}
        {ruleResult.conflicts.map((c) => (
          <div key={c.conflict_group_id} className="rule-panel-conflict">
            <div className="rule-panel-conflict-label">Tranh cãi ({c.conflict_group_id})</div>
            <div className="rule-panel-conflict-group">
              {c.rules.map((r) => (
                <div key={r.rule_id} className="rule-panel-conflict-rule">
                  <div className="rule-panel-conflict-rule-id">{r.rule_id}</div>
                  <div className="rule-panel-conflict-rule-text">{r.conclusion.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
