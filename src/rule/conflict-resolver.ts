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
