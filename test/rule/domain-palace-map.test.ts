import { describe, it, expect } from 'vitest';
import { DOMAIN_PALACE_MAP } from '../../src/rule/knowledge-base.js';
import type { DomainKey } from '../../src/rule/types.js';

const ALL_DOMAINS: DomainKey[] = [
  'menh', 'phu_mau', 'phuc_duc', 'dien_trach', 'quan_loc', 'no_boc',
  'thien_di', 'tat_ach', 'tai_bach', 'tu_tuc', 'phu_the', 'huynh_de',
];

describe('DOMAIN_PALACE_MAP', () => {
  it('co dung 12 entry, moi domain xuat hien dung 1 lan', () => {
    expect(DOMAIN_PALACE_MAP).toHaveLength(12);
    const domains = DOMAIN_PALACE_MAP.map((e) => e.domain);
    expect(new Set(domains).size).toBe(12);
    for (const d of ALL_DOMAINS) {
      expect(domains).toContain(d);
    }
  });

  it('moi entry co it nhat 1 palace_name, khong rong', () => {
    for (const entry of DOMAIN_PALACE_MAP) {
      expect(entry.palace_names.length).toBeGreaterThanOrEqual(1);
      for (const name of entry.palace_names) {
        expect(name.length).toBeGreaterThan(0);
      }
    }
  });

  it('domain phu_mau va phu_the co nhieu hon 1 cung (mo ho), cac domain con lai co dung 1 cung', () => {
    const ambiguous = DOMAIN_PALACE_MAP.filter((e) => e.palace_names.length > 1);
    expect(ambiguous.map((e) => e.domain).sort()).toEqual(['phu_mau', 'phu_the']);
  });

  it('dung ten cung "Tu Nu" cho domain tu_tuc, KHONG PHAI "Tu Tuc" (verify tu iztro that)', () => {
    const entry = DOMAIN_PALACE_MAP.find((e) => e.domain === 'tu_tuc');
    expect(entry?.palace_names).toEqual(['Tử Nữ']);
  });
});
