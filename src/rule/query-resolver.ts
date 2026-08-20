import type { Branch, Chart, DaiVan } from '../chart/types.js';
import { DOMAIN_PALACE_MAP } from './knowledge-base.js';
import type { DomainKey } from './types.js';

/**
 * Domain -> Branch[] cua CHINH la so nay. Ham THUAN TUY: chi tra loi "domain nay ung cung
 * nao", KHONG tu goi evaluator nao, KHONG tu gan Dai Van/Luu Nien. Nhan `chart` de tra
 * palace_name -> Branch (ten cung co dinh, nhung branch no roi vao thay doi theo tung la
 * so). Xem design doc 2026-08-20-llm-query-tang2-design.md muc 2.
 *
 * Bao toan THU TU cua DOMAIN_PALACE_MAP.palace_names (phan tu dau = quan trong nhat) —
 * caller (orchestrator, xem query.ts) PHAI giu nguyen thu tu nay, khong sap xep lai.
 */
export function resolveQuery(chart: Chart, domain: DomainKey): Branch[] {
  const entry = DOMAIN_PALACE_MAP.find((e) => e.domain === domain);
  if (entry === undefined) {
    throw new Error(`resolveQuery: khong tim thay domain "${domain}" trong DOMAIN_PALACE_MAP.`);
  }
  return entry.palace_names.map((name) => {
    const palace = chart.palaces.find((p) => p.palace_name === name);
    if (palace === undefined) {
      throw new Error(`resolveQuery: khong tim thay cung "${name}" trong chart.palaces.`);
    }
    return palace.branch;
  });
}

/**
 * Tim Dai Van co branch khop cung dang hoi — KHAC currentDaiVan() cua evidence-pack.ts
 * (ham do tra loi cau hoi "tuoi hien tai"; cau hoi o day la "giai doan nao trong doi ung
 * voi cung nay", dung cho domain-query — xem design doc muc 3). Moi la so co dung 12 Dai
 * Van phu du 12 dia chi (1-1), nen bat ky Branch hop le nao cung phai khop dung 1 entry —
 * khong tim thay la loi du lieu that, khong phai case hop le.
 */
export function daiVanAtBranch(chart: Chart, branch: Branch): DaiVan {
  const entry = chart.luck_cycles.dai_van.find((d) => d.branch === branch);
  if (entry === undefined) {
    throw new Error(`daiVanAtBranch: khong tim thay Dai Van nao co branch "${branch}".`);
  }
  return entry;
}
