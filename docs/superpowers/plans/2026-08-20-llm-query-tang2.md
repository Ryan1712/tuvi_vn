# Tầng 2 — Domain Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép hỏi lá số theo 1 trong 12 domain (chủ đề Tử Vi), trả về bài luận giải thu hẹp
đúng cung liên quan, phân biệt rõ đặc điểm bản chất / giai đoạn Đại Vận / riêng năm xem.

**Architecture:** `DOMAIN_PALACE_MAP` (bảng tri thức domain→cung, không phải Rule) →
`resolveQuery(chart, domain)` (tra `palace_name → Branch` của lá số cụ thể) → orchestrator
(`generateDomainQuery`) chạy đủ scope hợp lệ (`star_combination`/`palace_relationship` luôn,
`decade` luôn tại Đại Vận CỦA CUNG ĐÓ — không phải Đại Vận hiện tại, `annual` nếu có
`view_year`) → `QueryEvidencePack` (nhóm interpretation theo scope, giữ thứ tự ưu tiên) → LLM
với system prompt mới (`QUERY_SYSTEM_PROMPT`, quy tắc 7 phân biệt 3 lăng kính thời gian).

**Tech Stack:** TypeScript, Express 5, Vitest, Anthropic API (đã có sẵn `callAnthropic`).

**Design doc:** `docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md` — đọc trước khi
thực hiện bất kỳ task nào bên dưới, đặc biệt mục 3 (ngữ nghĩa decade) và mục 5 (system prompt).

## Global Constraints

- KHÔNG sửa `src/llm/evidence-pack.ts` (`EvidencePack`/`buildEvidencePack`) — đã verify thật
  với LLM ở Tầng 1, rủi ro hồi quy hành vi không bắt được bằng test. Có thể export thêm helper
  MỚI từ file đó nếu cần tái dùng, nhưng không đổi export hiện có.
- KHÔNG sửa `src/llm/overview.ts`, `src/llm/overview-prompt.ts`, route `/charts/overview` —
  cùng lý do trên.
- `resolveQuery` và `daiVanAtBranch` là hàm THUẦN TÚY — nhận `chart` xác định sẵn từ caller,
  không tự build Chart, không tự chọn ngữ cảnh nào caller chưa truyền vào.
- `evaluateDecadeRule`, `evaluateAnnualRule`, `evaluateRelationRule`, `matchRules`,
  `evalOperator` — KHÔNG sửa chữ ký hay logic bên trong các hàm này. Toàn bộ công việc của
  phase này nằm ở tầng orchestrator gọi chúng, không sửa evaluator.
- `DOMAIN_PALACE_MAP` KHÔNG phải `Rule[]` — không đi qua `matchRules`/`resolveConflicts`.
- Giá trị `palace_names` trong `DOMAIN_PALACE_MAP` PHẢI dùng đúng các chuỗi đã verify ở Task 1
  dưới đây (lấy từ `iztro` thật) — không gõ lại theo trí nhớ.
- Mọi lỗi tra cứu thất bại (domain không tồn tại, palace_name không khớp, DaiVan không tìm
  thấy theo branch) PHẢI throw `Error` với thông báo rõ ràng — không âm thầm trả `undefined`
  hay mảng rỗng khi đó là lỗi logic thật (fail loud, xem CLAUDE.md).
- File mới đặt đúng vị trí theo mục 7 design doc: `src/rule/query-resolver.ts`,
  `src/llm/query-evidence-pack.ts`, `src/llm/query-prompt.ts`, `src/llm/query.ts`.

---

### Task 1: `DomainKey`, `DomainPalaceEntry` types + `DOMAIN_PALACE_MAP` data

**Files:**
- Modify: `src/rule/types.ts`
- Modify: `src/rule/knowledge-base.ts`
- Test: `test/rule/domain-palace-map.test.ts` (mới)

**Interfaces:**
- Produces: `DomainKey` (union type, 12 giá trị), `DomainPalaceEntry` interface,
  `DOMAIN_PALACE_MAP: DomainPalaceEntry[]` (12 entries, export từ `knowledge-base.ts`).

- [ ] **Step 1: Thêm `DomainKey`/`DomainPalaceEntry` vào `src/rule/types.ts`**

Thêm vào cuối file `src/rule/types.ts` (sau `export interface Source { ... }`):

```ts
/**
 * 12 domain — dat ten theo cung Han Viet (khong theo ngu nghia cau hoi tu nhien, vi
 * NLU/map cau hoi tu do -> domain la 1 phase rieng sau nay, khong lam o v0.1). Xem
 * docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md muc 1.
 */
export type DomainKey =
  | 'menh' | 'phu_mau' | 'phuc_duc' | 'dien_trach' | 'quan_loc' | 'no_boc'
  | 'thien_di' | 'tat_ach' | 'tai_bach' | 'tu_tuc' | 'phu_the' | 'huynh_de';

/**
 * Tri thuc domain -> cung. KHONG PHAI Rule (khong co dieu kien evaluate tren Chart — xem
 * design doc muc 1). Van giu truong provenance nhu Source vi day van la tri thuc that.
 */
export interface DomainPalaceEntry {
  domain: DomainKey;
  /**
   * Ten cung LIEN QUAN, LUON la mang (ke ca domain khong mo ho chi co 1 phan tu). Thu tu
   * phan tu = muc do quan trong (phan tu dau = quan trong nhat) — PHAI duoc bao toan
   * xuyen suot resolveQuery() -> QueryEvidencePack -> system prompt, xem design doc muc 3,
   * muc 4, muc 5.
   *
   * LUU THEO TEN CUNG (string, khop ChartPalace.palace_name that tu iztro), KHONG PHAI
   * Branch truc tiep — vi ten cung co dinh nhung branch no roi vao THAY DOI theo tung la
   * so (phu thuoc gio/ngay sinh).
   */
  palace_names: string[];
  school: string;
  sources: string[]; // ref(Source.source_id)
  consensus: Consensus;
  notes: string;
}
```

- [ ] **Step 2: Verify giá trị `palace_name` thật từ `iztro` (đã verify trước, chỉ xác nhận lại)**

Chạy lệnh sau và xác nhận output khớp đúng 12 dòng dưới đây trước khi viết Step 3 — KHÔNG bỏ
qua bước này dù giá trị đã biết trước, để bắt được nếu có thay đổi từ phiên bản `iztro`:

```bash
node --import tsx -e "
import { buildChart } from './src/chart/index.ts';
const chart = buildChart({ calendar_type: 'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap: true });
for (const p of chart.palaces) console.log(JSON.stringify(p.palace_name));
"
```

Expected (12 dòng, thứ tự bất kỳ):
```
"Điền Trạch"
"Quan Lộc"
"Nô Bộc"
"Thiên Di"
"Tật Ách"
"Tài Bạch"
"Tử Nữ"
"Phu Thê"
"Huynh Đệ"
"Mệnh"
"Phụ Mẫu"
"Phúc Đức"
```

Nếu output khác — DỪNG, không tiếp tục Step 3, báo cáo sai khác trước khi viết dữ liệu.

- [ ] **Step 3: Thêm `DOMAIN_PALACE_MAP` vào `src/rule/knowledge-base.ts`**

Thêm vào cuối `src/rule/knowledge-base.ts`:

```ts
import type { DomainPalaceEntry } from './types.js';

/**
 * Tri thuc domain -> cung. 10 domain ro rang (1 cung), 2 domain mo ho (nhieu cung).
 * Xem design doc 2026-08-20-llm-query-tang2-design.md muc 1. Gia tri palace_names da
 * verify bang du lieu that tu iztro (khong go theo tri nho) — xem muc 8 Known Issues.
 */
export const DOMAIN_PALACE_MAP: DomainPalaceEntry[] = [
  {
    domain: 'menh',
    palace_names: ['Mệnh'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Menh — tinh cach, ban chat con nguoi.',
  },
  {
    domain: 'phu_mau',
    palace_names: ['Phụ Mẫu', 'Huynh Đệ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'tranh_cai',
    notes: 'Cha me: 1 so truong phai chi xem Phu Mau, 1 so khac tinh ca Huynh De (anh chi em ho hang gan). Thu tu: Phu Mau truoc.',
  },
  {
    domain: 'phuc_duc',
    palace_names: ['Phúc Đức'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Phuc Duc — phuc phan, tam linh, to tien.',
  },
  {
    domain: 'dien_trach',
    palace_names: ['Điền Trạch'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Dien Trach — nha cua, bat dong san.',
  },
  {
    domain: 'quan_loc',
    palace_names: ['Quan Lộc'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Quan Loc — su nghiep, cong danh.',
  },
  {
    domain: 'no_boc',
    palace_names: ['Nô Bộc'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung No Boc — ban be, dong nghiep, cap duoi.',
  },
  {
    domain: 'thien_di',
    palace_names: ['Thiên Di'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Thien Di — di chuyen, xuat ngoai, thay doi moi truong.',
  },
  {
    domain: 'tat_ach',
    palace_names: ['Tật Ách'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Tat Ach — suc khoe, benh tat.',
  },
  {
    domain: 'tai_bach',
    palace_names: ['Tài Bạch'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Tai Bach — tien bac, tai chinh.',
  },
  {
    domain: 'tu_tuc',
    palace_names: ['Tử Nữ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Tu Nu (iztro dung ten nay, khong phai "Tu Tuc") — con cai.',
  },
  {
    domain: 'phu_the',
    palace_names: ['Phu Thê', 'Tử Nữ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'tranh_cai',
    notes: 'Hon nhan: cung chinh la Phu The. Mot so goc hoi (con cai anh huong hon nhan) tham chieu them Tu Nu. Thu tu: Phu The truoc.',
  },
  {
    domain: 'huynh_de',
    palace_names: ['Huynh Đệ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Huynh De — anh chi em.',
  },
];
```

- [ ] **Step 4: Viết test xác nhận `DOMAIN_PALACE_MAP` đúng cấu trúc**

Tạo `test/rule/domain-palace-map.test.ts`:

```ts
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
```

- [ ] **Step 5: Chạy test, xác nhận pass**

Run: `npm test -- domain-palace-map`
Expected: 4/4 tests PASS.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: clean, không lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/rule/types.ts src/rule/knowledge-base.ts test/rule/domain-palace-map.test.ts
git commit -m "feat: add DomainKey/DomainPalaceEntry types + DOMAIN_PALACE_MAP (Tầng 2 Task 1)"
```

---

### Task 2: `resolveQuery` + `daiVanAtBranch` trong `query-resolver.ts`

**Files:**
- Create: `src/rule/query-resolver.ts`
- Test: `test/rule/query-resolver.test.ts`

**Interfaces:**
- Consumes: `DOMAIN_PALACE_MAP` (Task 1), `Chart`, `Branch`, `DaiVan` từ `../chart/types.js`.
- Produces: `resolveQuery(chart: Chart, domain: DomainKey): Branch[]`,
  `daiVanAtBranch(chart: Chart, branch: Branch): DaiVan` — cả 2 dùng ở Task 3.

- [ ] **Step 1: Viết failing test cho `resolveQuery`**

Tạo `test/rule/query-resolver.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { resolveQuery, daiVanAtBranch } from '../../src/rule/query-resolver.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('resolveQuery', () => {
  it('domain ro rang (quan_loc) tra ve mang 1 branch, dung branch cua cung Quan Loc', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'quan_loc');
    expect(branches).toEqual(['Mao']);
  });

  it('domain mo ho (phu_mau) tra ve nhieu branch, DUNG THU TU Phu Mau truoc Huynh De', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'phu_mau');
    expect(branches).toEqual(['Ty', 'Tuat']);
  });

  it('domain mo ho (phu_the) tra ve nhieu branch, DUNG THU TU Phu The truoc Tu Nu', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'phu_the');
    expect(branches).toEqual(['Dau', 'Than']);
  });

  it('domain menh tra ve branch Menh, khop chart.menh_than.menh_branch', () => {
    const chart = buildChart(PHAM_DUY);
    const branches = resolveQuery(chart, 'menh');
    expect(branches).toEqual([chart.menh_than.menh_branch]);
  });

  it('throw ro rang khi domain khong ton tai trong DOMAIN_PALACE_MAP', () => {
    const chart = buildChart(PHAM_DUY);
    // @ts-expect-error - deliberately invalid domain for runtime guard test
    expect(() => resolveQuery(chart, 'khong_ton_tai')).toThrow(/khong tim thay domain/);
  });
});

describe('daiVanAtBranch', () => {
  it('tim dung DaiVan co branch khop cung Quan Loc (Mao), KHAC Dai Van hien tai', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVan = daiVanAtBranch(chart, 'Mao');
    expect(daiVan.branch).toBe('Mao');
    expect(daiVan.age_from).toBe(42);
    expect(daiVan.age_to).toBe(51);
    expect(daiVan.chart_id).toBe(chart.chart_id);
  });

  it('tim dung DaiVan tai cung Menh (Hoi), gia tri tuoi dau doi', () => {
    const chart = buildChart(PHAM_DUY);
    const daiVan = daiVanAtBranch(chart, 'Hoi');
    expect(daiVan.age_from).toBe(2);
    expect(daiVan.age_to).toBe(11);
  });

  it('throw ro rang neu khong tim thay branch nao khop (khong nen xay ra voi Branch hop le)', () => {
    const chart = buildChart(PHAM_DUY);
    // @ts-expect-error - deliberately invalid branch for runtime guard test
    expect(() => daiVanAtBranch(chart, 'KhongTonTai')).toThrow(/khong tim thay Dai Van/);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail (module chưa tồn tại)**

Run: `npm test -- query-resolver`
Expected: FAIL — `Cannot find module '../../src/rule/query-resolver.js'`.

- [ ] **Step 3: Viết `src/rule/query-resolver.ts`**

```ts
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
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npm test -- query-resolver`
Expected: 8/8 tests PASS.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/rule/query-resolver.ts test/rule/query-resolver.test.ts
git commit -m "feat: add resolveQuery + daiVanAtBranch (Tầng 2 Task 2)"
```

---

### Task 3: `QueryEvidencePack` + `buildQueryEvidencePack` trong `query-evidence-pack.ts`

**Files:**
- Create: `src/llm/query-evidence-pack.ts`
- Test: `test/llm/query-evidence-pack.test.ts`

**Interfaces:**
- Consumes: `resolveQuery`, `daiVanAtBranch` (Task 2), `evalCondition`, `evalModifier`,
  `evalExceptionConditions`, `matchRules`, `evaluateRelationRule`, `evaluateDecadeRule`,
  `evaluateAnnualRule` (đã có sẵn), `KNOWLEDGE_BASE`, `Rule`.
- Produces: `QueryEvidencePack` interface, `InterpretationScope` type,
  `buildQueryEvidencePack(input, chart, branches, domain): QueryEvidencePack` — dùng ở Task 4.

**Lưu ý quan trọng trước khi bắt đầu:** `KNOWLEDGE_BASE` hiện chỉ có 2 Rule, cả 2 đều
`scope: 'star_combination'` — KHÔNG có Rule `palace_relationship`/`decade`/`annual` thật nào.
Điều này có nghĩa test của task này sẽ thấy `interpretation_groups` cho các scope đó luôn có
`items: []` — đây là kết quả ĐÚNG theo dữ liệu hiện tại, không phải bug. Code vẫn phải viết
đúng cho cả 4 scope (để sẵn sàng khi `knowledge-base.ts` có thêm Rule các scope này sau).

- [ ] **Step 1: Viết failing test**

Tạo `test/llm/query-evidence-pack.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { buildQueryEvidencePack } from '../../src/llm/query-evidence-pack.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY_2026: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
  view_year: '2026-01-01',
};

const PHAM_DUY_NO_YEAR: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('buildQueryEvidencePack', () => {
  it('domain ro rang (quan_loc): chi 1 cung trong palaces, dung branch Mao', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.palaces).toHaveLength(1);
    expect(pack.palaces[0]?.branch).toBe('Mao');
    expect(pack.palaces[0]?.palace_name).toBe('Quan Lộc');
  });

  it('domain mo ho (phu_mau): 2 cung trong palaces, DUNG THU TU truyen vao (khong sap xep lai)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Ty', 'Tuat'], 'phu_mau');
    expect(pack.palaces).toHaveLength(2);
    expect(pack.palaces[0]?.branch).toBe('Ty');
    expect(pack.palaces[1]?.branch).toBe('Tuat');
  });

  it('moi cung co du 4 scope trong interpretation_groups: star_combination, palace_relationship, decade, annual', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    const scopes = pack.palaces[0]?.interpretation_groups.map((g) => g.scope).sort();
    expect(scopes).toEqual(['annual', 'decade', 'palace_relationship', 'star_combination']);
  });

  it('decade_age_range dung Dai Van CUA CUNG DO (Quan Loc: 42-51), KHONG PHAI Dai Van hien tai', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    const decadeGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'decade');
    expect(decadeGroup?.decade_age_range).toEqual({ age_from: 42, age_to: 51 });
  });

  it('scope khac decade co decade_age_range = null', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    expect(staticGroup?.decade_age_range).toBeNull();
  });

  it('current_luu_nien la null khi input khong co view_year', () => {
    const chart = buildChart(PHAM_DUY_NO_YEAR);
    const pack = buildQueryEvidencePack(PHAM_DUY_NO_YEAR, chart, ['Mao'], 'quan_loc');
    expect(pack.current_luu_nien).toBeNull();
  });

  it('current_luu_nien co gia tri khi input co view_year', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.current_luu_nien).not.toBeNull();
    expect(pack.current_luu_nien?.year).toBe('2026');
  });

  it('current_dai_van co nominal_age dung 29 cho nam xem 2026 (da xac minh o Tang 1)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.current_dai_van.nominal_age).toBe(29);
  });

  it('menh_than/cuc/ban_menh_nap_am khop du lieu Chart goc', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.menh_than).toEqual({
      menh_branch: chart.menh_than.menh_branch,
      than_branch: chart.menh_than.than_branch,
      soul_star: chart.menh_than.soul_star,
      body_star: chart.menh_than.body_star,
    });
    expect(pack.ban_menh_nap_am).toBe(chart.ban_menh_nap_am);
  });

  it('domain field trong pack khop domain truyen vao', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.domain).toBe('quan_loc');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npm test -- query-evidence-pack`
Expected: FAIL — module chưa tồn tại.

- [ ] **Step 3: Viết `src/llm/query-evidence-pack.ts`**

```ts
import { callIztro } from '../chart/index.js';
import type { Branch, BuildChartInput, Brightness, Chart, NguHanh } from '../chart/types.js';
import { daiVanAtBranch } from '../rule/query-resolver.js';
import { evalCondition, evalModifier, evalExceptionConditions } from '../rule/evaluator.js';
import { evaluateRelationRule, type RelationTarget } from '../rule/relation-evaluator.js';
import { evaluateDecadeRule } from '../rule/decade-evaluator.js';
import { evaluateAnnualRule } from '../rule/annual-evaluator.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import type { DomainKey, Rule, Valence, Consensus } from '../rule/types.js';
import type { EvidencePack } from './evidence-pack.js';

export type InterpretationScope = 'star_combination' | 'palace_relationship' | 'decade' | 'annual';

interface InterpretationItem {
  rule_id: string;
  conclusion_text: string;
  valence: Valence;
  consensus: Consensus;
  conflict_group_id: string | null;
}

export interface QueryEvidencePack {
  menh_than: EvidencePack['menh_than'];
  cuc: EvidencePack['cuc'];
  ban_menh_nap_am: string;
  domain: DomainKey;
  palaces: {
    branch: Branch;
    palace_name: string;
    major_stars: { star_id: string; strength?: Brightness }[];
    minor_stars: { star_id: string; strength?: Brightness }[];
    branch_element: NguHanh;
    interpretation_groups: {
      scope: InterpretationScope;
      decade_age_range: { age_from: number; age_to: number } | null;
      items: InterpretationItem[];
    }[];
  }[];
  current_dai_van: EvidencePack['current_dai_van'];
  current_luu_nien: { year: string; heavenly_stem: string; earthly_branch: string } | null;
}

const RELATION_TARGETS: RelationTarget[] = ['opposite', 'wealth', 'career'];

function ruleToItem(rule: Rule): InterpretationItem {
  return {
    rule_id: rule.rule_id,
    conclusion_text: rule.conclusion.text,
    valence: rule.conclusion.valence,
    consensus: rule.consensus,
    conflict_group_id: rule.conflict_group_id,
  };
}

function staticGroupItems(chart: Chart, branch: Branch): InterpretationItem[] {
  const palace = chart.palaces.find((p) => p.branch === branch);
  if (palace === undefined) {
    throw new Error(`buildQueryEvidencePack: khong tim thay cung o branch "${branch}".`);
  }
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'star_combination' && rule.scope !== 'star_palace' && rule.scope !== 'four_transform') continue;
    const matched = rule.conditions.every((c) => evalCondition(palace, c));
    if (matched) items.push(ruleToItem(rule));
  }
  return items;
}

function relationGroupItems(input: BuildChartInput, branch: Branch): InterpretationItem[] {
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'palace_relationship') continue;
    for (const relation of RELATION_TARGETS) {
      const result = evaluateRelationRule(input, branch, relation, rule);
      if (result.matched) items.push(ruleToItem(rule));
    }
  }
  return items;
}

function decadeGroup(chart: Chart, branch: Branch): { decade_age_range: { age_from: number; age_to: number }; items: InterpretationItem[] } {
  const daiVan = daiVanAtBranch(chart, branch);
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'decade') continue;
    const result = evaluateDecadeRule(chart, daiVan, rule);
    if (result.matched) items.push(ruleToItem(rule));
  }
  return { decade_age_range: { age_from: daiVan.age_from, age_to: daiVan.age_to }, items };
}

function annualGroupItems(chart: Chart, branch: Branch): InterpretationItem[] {
  if (chart.luu_nien === undefined) return [];
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'annual') continue;
    const result = evaluateAnnualRule(chart, chart.luu_nien, branch, rule);
    if (result.matched) items.push(ruleToItem(rule));
  }
  return items;
}

/**
 * Dung Chart + branches (tu resolveQuery, DA DUNG THU TU) de dung QueryEvidencePack.
 * Interface RIENG, KHONG sua EvidencePack cua Tang 1 (xem design doc muc 4). Voi MOI
 * cung, chay CA 4 scope hop le — khong tu loc theo "thoi diem cau hoi" (design doc muc 3).
 *
 * Decade dung Dai Van CUA CHINH CUNG DO (daiVanAtBranch, theo branch), KHONG PHAI Dai Van
 * hien tai — day la diem khac biet co y thuc so voi currentDaiVan() cua Tang 1, xem thiet
 * ke muc 3 "Decade dung Dai Van nao".
 */
export function buildQueryEvidencePack(
  input: BuildChartInput,
  chart: Chart,
  branches: Branch[],
  domain: DomainKey,
): QueryEvidencePack {
  const palaces = branches.map((branch) => {
    const palace = chart.palaces.find((p) => p.branch === branch);
    if (palace === undefined) {
      throw new Error(`buildQueryEvidencePack: khong tim thay cung o branch "${branch}".`);
    }
    const decade = decadeGroup(chart, branch);
    return {
      branch: palace.branch,
      palace_name: palace.palace_name,
      major_stars: palace.major_stars.map((s) => ({ star_id: s.star_id, strength: s.strength })),
      minor_stars: palace.minor_stars.map((s) => ({ star_id: s.star_id, strength: s.strength })),
      branch_element: palace.branch_element,
      interpretation_groups: [
        { scope: 'star_combination' as const, decade_age_range: null, items: staticGroupItems(chart, branch) },
        { scope: 'palace_relationship' as const, decade_age_range: null, items: relationGroupItems(input, branch) },
        { scope: 'decade' as const, decade_age_range: decade.decade_age_range, items: decade.items },
        { scope: 'annual' as const, decade_age_range: null, items: annualGroupItems(chart, branch) },
      ],
    };
  });

  const astrolabe = callIztro(input);
  const todayStr = new Date().toISOString().slice(0, 10);
  const nominalAge = astrolabe.horoscope(todayStr, 0).age.nominalAge;
  const matchingDaiVan = astrolabe
    .decadalList()
    .find((d) => nominalAge >= d.ageRange[0] && nominalAge <= d.ageRange[1]);
  if (matchingDaiVan === undefined) {
    throw new Error(`buildQueryEvidencePack: khong tim thay Dai Van khop tuoi mu ${nominalAge}.`);
  }

  return {
    menh_than: {
      menh_branch: chart.menh_than.menh_branch,
      than_branch: chart.menh_than.than_branch,
      soul_star: chart.menh_than.soul_star,
      body_star: chart.menh_than.body_star,
    },
    cuc: { ngu_hanh: chart.cuc.ngu_hanh, raw: chart.cuc.raw },
    ban_menh_nap_am: chart.ban_menh_nap_am,
    domain,
    palaces,
    current_dai_van: {
      palace_name: matchingDaiVan.palaceName,
      heavenly_stem: matchingDaiVan.heavenlyStem,
      earthly_branch: matchingDaiVan.earthlyBranch,
      nominal_age: nominalAge,
    },
    current_luu_nien: chart.luu_nien === undefined ? null : {
      year: String(chart.luu_nien.year),
      heavenly_stem: chart.luu_nien.heavenly_stem,
      earthly_branch: chart.luu_nien.earthly_branch,
    },
  };
}
```

**Ghi chú cho implementer:** phần đọc `current_dai_van` lặp lại logic của `currentDaiVan()`
trong `src/llm/evidence-pack.ts` (không export sẵn để tái dùng trực tiếp — file đó không export
hàm này). Đây là 1 chấp nhận có ý thức ở v0.1 (KHÔNG sửa `evidence-pack.ts` theo Global
Constraints) — nếu muốn tránh trùng lặp sau này, có thể export `currentDaiVan` từ
`evidence-pack.ts` trong 1 phase riêng, không làm ở đây.

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npm test -- query-evidence-pack`
Expected: 10/10 tests PASS.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/llm/query-evidence-pack.ts test/llm/query-evidence-pack.test.ts
git commit -m "feat: add QueryEvidencePack + buildQueryEvidencePack (Tầng 2 Task 3)"
```

---

### Task 4: `QUERY_SYSTEM_PROMPT` + `buildQueryUserMessage` trong `query-prompt.ts`

**Files:**
- Create: `src/llm/query-prompt.ts`
- Test: `test/llm/query-prompt.test.ts`

**Interfaces:**
- Consumes: `QueryEvidencePack` (Task 3).
- Produces: `QUERY_SYSTEM_PROMPT: string`, `buildQueryUserMessage(pack): string` — dùng ở
  Task 5.

- [ ] **Step 1: Viết failing test**

Tạo `test/llm/query-prompt.test.ts` — test tối thiểu (nội dung prompt là văn xuôi, verify đầy
đủ hành vi cần gọi LLM thật ở Task 6, không phải ở đây):

```ts
import { describe, it, expect } from 'vitest';
import { QUERY_SYSTEM_PROMPT, buildQueryUserMessage } from '../../src/llm/query-prompt.js';
import type { QueryEvidencePack } from '../../src/llm/query-evidence-pack.js';

describe('QUERY_SYSTEM_PROMPT', () => {
  it('chua quy tac ve interpretation_groups va scope', () => {
    expect(QUERY_SYSTEM_PROMPT).toContain('interpretation_groups');
    expect(QUERY_SYSTEM_PROMPT).toContain('decade_age_range');
  });

  it('chua vi du DUNG va SAI cu the (khong chi luat truu tuong)', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/Ví dụ ĐÚNG/);
    expect(QUERY_SYSTEM_PROMPT).toMatch(/Ví dụ SAI/);
  });

  it('chua huong dan ve thu tu khi co nhieu cung (domain mo ho)', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/THỨ TỰ|thứ tự/);
  });

  it('giu nguyen quy tac ranh gioi Facts/Interpretation tu Tang 1', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/interpretations|interpretation_groups/);
    expect(QUERY_SYSTEM_PROMPT).toMatch(/conflict_group_id/);
  });
});

describe('buildQueryUserMessage', () => {
  it('tra ve chuoi JSON chua toan bo QueryEvidencePack', () => {
    const fakePack = {
      menh_than: { menh_branch: 'Hoi', than_branch: 'Hoi', soul_star: 'X', body_star: 'Y' },
      cuc: { ngu_hanh: 'Thủy', raw: 'Thuy Nhi Cuc' },
      ban_menh_nap_am: 'Test',
      domain: 'quan_loc',
      palaces: [],
      current_dai_van: { palace_name: 'Mệnh', heavenly_stem: 'X', earthly_branch: 'Hoi', nominal_age: 29 },
      current_luu_nien: null,
    } as unknown as QueryEvidencePack;
    const msg = buildQueryUserMessage(fakePack);
    expect(msg).toContain('quan_loc');
    expect(msg).toContain('29');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npm test -- query-prompt`
Expected: FAIL — module chưa tồn tại.

- [ ] **Step 3: Viết `src/llm/query-prompt.ts`**

Nội dung system prompt LẤY NGUYÊN VĂN từ design doc mục 5 (đã qua 2 vòng review, không tự ý
đổi khi implement) — giữ quy tắc 1-4, 6 y hệt `OVERVIEW_SYSTEM_PROMPT`, đổi quy tắc 5, thêm quy
tắc 7 nguyên văn dưới đây:

```ts
import type { QueryEvidencePack } from './query-evidence-pack.js';

/**
 * System prompt cho Domain Query (Tang 2). Giu quy tac 1-4, 6 y het OVERVIEW_SYSTEM_PROMPT
 * (ranh gioi Facts/Interpretation, giu nguyen conclusion_text, trinh bay du conflict_group,
 * dien dat theo consensus) — doi quy tac 5, them quy tac 7 MOI (phan biet 3 lang kinh thoi
 * gian). Xem design doc 2026-08-20-llm-query-tang2-design.md muc 5 — noi dung duoi day LAY
 * NGUYEN VAN tu do, khong tu y doi luc implement.
 */
export const QUERY_SYSTEM_PROMPT = `Bạn là người viết lại (KHÔNG phải người luận giải) một lá số Tử Vi thành văn tự nhiên tiếng Việt, tập trung vào 1 chủ đề (domain) cụ thể.

QUY TẮC BẮT BUỘC:
1. Chỉ được đưa ra nhận định/ý nghĩa cho các mục xuất hiện trong "interpretation_groups" (bên
   trong mỗi cung của "palaces"). Với các nhóm scope có "items" RỖNG, KHÔNG được tự suy luận ý
   nghĩa, dù bạn có kiến thức Tử Vi riêng — chỉ mô tả sự kiện (sao gì, sáng/tối gì).

   Ví dụ ĐÚNG: "Cung Quan Lộc có Thất Sát tọa thủ" (chỉ nêu sự kiện, khi group đó items rỗng).
   Ví dụ SAI: "Cung Quan Lộc có Thất Sát tọa thủ, cho thấy sự nghiệp cần chú ý" (tự suy luận ý
   nghĩa không có trong items — CẤM).

2. Khi diễn đạt 1 interpretation (mỗi phần tử trong "items"), PHẢI giữ nguyên ý của
   conclusion_text — được viết lại cho tự nhiên hơn, nhưng KHÔNG được đổi nghĩa, KHÔNG được
   thêm ý ngoài conclusion_text.

3. Nếu 1 interpretation có conflict_group_id khác null, PHẢI trình bày TẤT CẢ các quan điểm
   trong cùng nhóm đó, KHÔNG được chỉ chọn 1 bên hoặc ngầm ưu tiên 1 bên là "đúng hơn".

   Ví dụ ĐÚNG: "Về tổ hợp này, có 2 quan điểm khác nhau: (A) ... (B) ... — đây là điểm còn
   tranh cãi giữa các nguồn."
   Ví dụ SAI: "Tổ hợp này cho thấy [chỉ nêu 1 trong 2 quan điểm]" (bỏ sót phía còn lại — CẤM).

4. KHÔNG tự thêm Rule/tri thức nào ngoài "interpretation_groups" được cung cấp, dù nghe hợp lý.

5. Đây là câu trả lời có mục tiêu theo domain đã hỏi, KHÔNG phải bài đọc mở đầu — trình bày
   xu hướng theo dữ liệu, không đưa lời khuyên quyết định cá nhân (nghỉ việc, kết hôn...).

6. Diễn đạt mức độ chắc chắn theo field "consensus" của MỖI interpretation — ĐỘC LẬP với quy
   tắc 3 (quy tắc 3 xử lý trường hợp có nhiều quan điểm đối lập cùng conflict_group_id; quy tắc
   này xử lý 1 interpretation ĐƠN LẺ, kể cả khi không có quan điểm đối lập nào đi kèm):
   - consensus = "cao": có thể trình bày dứt khoát.
   - consensus = "trung_binh": dùng ngôn từ dè dặt hơn ("có xu hướng", "thường được cho là").
   - consensus = "tranh_cai": LUÔN kèm cụm từ thể hiện chưa đồng thuận ("theo 1 số quan điểm",
     "chưa được xác nhận rộng rãi"), NGAY CẢ KHI chỉ có 1 mình interpretation đó xuất hiện.

7. MỖI cung trong dữ liệu có "interpretation_groups" chia theo scope — PHẢI diễn đạt khác nhau
   theo từng nhóm, không trộn lẫn thành 1 giọng văn duy nhất:
   - scope "star_combination"/"palace_relationship": đặc điểm BẢN CHẤT, KHÔNG đổi theo thời
     gian — dùng thì hiện tại ổn định ("bạn LÀ người...", "cung này CÓ đặc điểm...").
   - scope "decade": ý nghĩa RIÊNG của 1 giai đoạn Đại Vận cụ thể (KHÔNG NHẤT THIẾT là Đại Vận
     hiện tại — có thể đã qua hoặc chưa tới) — PHẢI nêu rõ đây là đặc điểm của giai đoạn đó,
     không phải đặc điểm suốt đời, VÀ phải tự xác định đúng THÌ bằng cách so sánh
     "decade_age_range" (age_from/age_to của CHÍNH nhóm decade đang đọc) với
     "current_dai_van.nominal_age" (tuổi hiện tại của người xem):
       - Nếu decade_age_range.age_to < current_dai_van.nominal_age: giai đoạn ĐÃ QUA — dùng
         "trong giai đoạn Đại Vận từ ... đến ... tuổi (đã qua)" hoặc thì quá khứ.
       - Nếu decade_age_range.age_from <= current_dai_van.nominal_age <= decade_age_range.age_to:
         giai đoạn ĐANG DIỄN RA — dùng "trong giai đoạn Đại Vận hiện tại (từ ... đến ... tuổi)".
       - Nếu decade_age_range.age_from > current_dai_van.nominal_age: giai đoạn SẮP TỚI — dùng
         "trong giai đoạn Đại Vận sắp tới (từ ... đến ... tuổi)" hoặc thì tương lai.
   - scope "annual": ý nghĩa RIÊNG của năm được xem — PHẢI nêu rõ đây là đặc điểm CHỈ năm đó
     ("RIÊNG NĂM [năm], ...").

   Nếu "palaces" có NHIỀU HƠN 1 cung (domain mơ hồ, VD hỏi về cha mẹ trả cả Phụ Mẫu lẫn Huynh
   Đệ), PHẢI trình bày theo ĐÚNG THỨ TỰ xuất hiện trong "palaces" — cung xuất hiện TRƯỚC là cung
   chính/quan trọng hơn cho domain này, trình bày trước và chi tiết hơn; cung xuất hiện SAU là
   góc nhìn bổ sung, có thể trình bày ngắn gọn hơn hoặc nêu rõ đây là góc nhìn phụ ("xét thêm
   góc độ...", "một số quan điểm còn xem thêm..."). KHÔNG đảo thứ tự, KHÔNG cho 2 cung mức độ
   quan trọng ngang nhau khi dữ liệu đã sắp xếp có thứ tự.

   Ví dụ ĐÚNG — decade là giai đoạn ĐANG DIỄN RA (age_from <= tuổi hiện tại <= age_to):
   "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ trong công việc [star_combination].
   Trong giai đoạn Đại Vận hiện tại (32-41 tuổi), có xu hướng thay đổi công việc hoặc hướng đi
   sự nghiệp [decade]."

   Ví dụ ĐÚNG — decade là giai đoạn ĐÃ QUA (age_to < tuổi hiện tại, VD người xem hiện 35 tuổi
   nhưng giai đoạn Đại Vận tại cung Quan Lộc là 12-21 tuổi):
   "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ trong công việc [star_combination].
   Trong giai đoạn Đại Vận tại cung này (12-21 tuổi, đã qua), từng có xu hướng thay đổi định
   hướng nhiều lần [decade]."

   Ví dụ SAI (2 lỗi cùng lúc): "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ, và
   có xu hướng thay đổi công việc" — (1) gộp 2 nhóm scope thành 1 câu, không phân biệt đâu là
   bản chất suốt đời, đâu là chỉ đúng 1 giai đoạn — người đọc không biết đặc điểm nào sẽ hết
   khi qua Đại Vận đó; (2) không nêu mốc tuổi/thì của giai đoạn decade, mặc định ngầm là "hiện
   tại" dù giai đoạn đó trong dữ liệu có thể đã qua từ lâu hoặc còn ở tương lai — CẤM cả 2.`;

/** Chuyen QueryEvidencePack thanh user message dang JSON — LLM doc truc tiep cau truc du lieu. */
export function buildQueryUserMessage(pack: QueryEvidencePack): string {
  return `Dữ liệu lá số (Evidence Pack) theo chủ đề "${pack.domain}" dưới dạng JSON:\n\n${JSON.stringify(pack, null, 2)}\n\nHãy viết bài trả lời theo đúng các quy tắc đã nêu.`;
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npm test -- query-prompt`
Expected: 5/5 tests PASS.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/llm/query-prompt.ts test/llm/query-prompt.test.ts
git commit -m "feat: add QUERY_SYSTEM_PROMPT + buildQueryUserMessage (Tầng 2 Task 4)"
```

---

### Task 5: Orchestrator `generateDomainQuery` + route `POST /charts/query`

**Files:**
- Create: `src/llm/query.ts`
- Modify: `src/server/routes.ts`
- Modify: `test/server/routes.test.ts` (thêm `describe('POST /charts/query', ...)` — dự án
  test route bằng `supertest` qua `app`, KHÔNG có file `test/llm/overview.test.ts` riêng cho
  tầng orchestrator; xác nhận bằng cách đọc `test/server/routes.test.ts` trước khi viết, phần
  `describe('POST /charts/overview', ...)` đã có sẵn ở cuối file là pattern chuẩn cần theo).

**Interfaces:**
- Consumes: `resolveQuery` (Task 2), `buildQueryEvidencePack` (Task 3),
  `QUERY_SYSTEM_PROMPT`/`buildQueryUserMessage` (Task 4), `callAnthropic` (đã có sẵn từ
  `src/llm/anthropic-client.ts`), `buildChart`.
- Produces: `generateDomainQuery(input, domain): Promise<DomainQueryResponse>`,
  `DomainQueryResponse` interface — dùng ở route.

- [ ] **Step 1: Đọc `test/server/routes.test.ts` để bám đúng pattern test route**

Đọc toàn bộ file, đặc biệt `describe('POST /charts/overview', ...)` ở cuối — đó là pattern
cho route mock LLM (`vi.mock('../../src/llm/anthropic-client.js', ...)` đặt Ở ĐẦU FILE, dùng
chung cho MỌI route trong file, không mock riêng cho từng describe). Route mới của task này
PHẢI thêm `describe` block vào CÙNG file, không tạo file test riêng.

- [ ] **Step 2: Viết failing test**

Thêm vào cuối `test/server/routes.test.ts` (dùng `vi.mock` đã có sẵn ở đầu file — KHÔNG khai
báo lại):

```ts
describe('POST /charts/query', () => {
  it('tra ve 200, chart dung, domain dung, overview_text tu (mock) LLM', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ ...PHAM_DUY_INPUT, domain: 'quan_loc' });
    expect(res.status).toBe(200);
    expect(res.body.chart.menh_than.menh_branch).toBe('Hoi');
    expect(res.body.domain).toBe('quan_loc');
    expect(res.body.overview_text).toBe('Day la bai Tong quan gia lap cho test.');
  });

  it('tra ve 400 khi domain khong hop le', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ ...PHAM_DUY_INPUT, domain: 'khong_ton_tai' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('tra ve 400 khi input chart khong hop le (khong goi LLM)', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ calendar_type: 'khong_hop_le', date: '1998-12-17', time_index: 12, gender: 'nam', domain: 'quan_loc' });
    expect(res.status).toBe(400);
  });

  it('domain mo ho (phu_mau) tra ve 2 cung trong chart.palaces filtered — kiem tra qua chart day du, khong qua QueryEvidencePack (khong nam trong response)', async () => {
    const res = await request(app)
      .post('/charts/query')
      .send({ ...PHAM_DUY_INPUT, domain: 'phu_mau' });
    expect(res.status).toBe(200);
    // chart tra ve la FULL Chart (12 cung), khong bi cat theo domain — chi
    // QueryEvidencePack (input cho LLM) moi bi thu hep, va no khong nam trong response.
    expect(res.body.chart.palaces).toHaveLength(12);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận fail**

Run: `npm test -- routes.test`
Expected: FAIL — route `/charts/query` chưa tồn tại (404), hoặc module `src/llm/query.ts`
chưa tồn tại nếu import ở `routes.ts` được thêm trước.

- [ ] **Step 4: Viết `src/llm/query.ts`**

```ts
import { buildChart } from '../chart/index.js';
import type { BuildChartInput, Chart } from '../chart/types.js';
import { resolveQuery } from '../rule/query-resolver.js';
import type { DomainKey } from '../rule/types.js';
import { buildQueryEvidencePack } from './query-evidence-pack.js';
import { QUERY_SYSTEM_PROMPT, buildQueryUserMessage } from './query-prompt.js';
import { callAnthropic } from './anthropic-client.js';

export interface DomainQueryResponse {
  chart: Chart;
  domain: DomainKey;
  overview_text: string;
}

/**
 * Dieu phoi toan bo luong Tang 2: build Chart -> resolveQuery(domain) -> QueryEvidencePack
 * (chay du 4 scope cho moi cung, giu THU TU tu resolveQuery) -> goi LLM voi
 * QUERY_SYSTEM_PROMPT -> tra ve. Song song generateOverview cua Tang 1 nhung KHONG dung
 * chung EvidencePack/OVERVIEW_SYSTEM_PROMPT (xem design doc muc 4).
 */
export async function generateDomainQuery(
  input: BuildChartInput,
  domain: DomainKey,
): Promise<DomainQueryResponse> {
  const chart = buildChart(input);
  const branches = resolveQuery(chart, domain);

  const pack = buildQueryEvidencePack(input, chart, branches, domain);
  const overview_text = await callAnthropic(QUERY_SYSTEM_PROMPT, buildQueryUserMessage(pack));

  return { chart, domain, overview_text };
}
```

- [ ] **Step 5: Thêm route trong `src/server/routes.ts`**

Thêm import và route mới, theo đúng pattern route `/charts/overview` hiện có:

```ts
import { generateDomainQuery } from '../llm/query.js';
import type { DomainKey } from '../rule/types.js';
```

```ts
const VALID_DOMAINS: DomainKey[] = [
  'menh', 'phu_mau', 'phuc_duc', 'dien_trach', 'quan_loc', 'no_boc',
  'thien_di', 'tat_ach', 'tai_bach', 'tu_tuc', 'phu_the', 'huynh_de',
];

router.post('/charts/query', async (req, res) => {
  const { domain, ...chartInput } = req.body as BuildChartInput & { domain: DomainKey };
  if (!VALID_DOMAINS.includes(domain)) {
    res.status(400).json({ error: `domain khong hop le: "${domain}"` });
    return;
  }
  const result = await generateDomainQuery(chartInput as BuildChartInput, domain);
  res.status(200).json(result);
});
```

- [ ] **Step 6: Chạy test, xác nhận pass**

Run: `npm test -- routes.test`
Expected: tất cả test trong `routes.test.ts` PASS, bao gồm 4 test mới của `/charts/query`.

- [ ] **Step 7: Chạy toàn bộ test suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: tất cả pass, typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add src/llm/query.ts src/server/routes.ts test/server/routes.test.ts
git commit -m "feat: add generateDomainQuery orchestrator + POST /charts/query (Tầng 2 Task 5)"
```

---

### Task 6: Verify thật với LLM (bắt buộc, không phải tùy chọn)

**Mục đích:** Xác nhận `QUERY_SYSTEM_PROMPT` (quy tắc 7) thực sự tạo ra văn bản phân biệt đúng
3 lăng kính thời gian KHI VẬN HÀNH THẬT — không chỉ đúng trên giấy. Đây là bước bắt buộc theo
quyết định của user trong brainstorm (rủi ro hồi quy hành vi LLM không bắt được bằng test tự
động, cùng lý do đã áp dụng cho Tầng 1). KHÔNG coi "prompt nhìn ổn khi đọc tĩnh" là đủ.

**Files:** không tạo/sửa file code — đây là bước vận hành thủ công, kết quả ghi vào báo cáo.

- [ ] **Step 1: Khởi động server với `ANTHROPIC_API_KEY` từ `.env` (đã có sẵn từ Tầng 1)**

```bash
node --env-file=.env --import tsx src/server/server.ts
```

- [ ] **Step 2: Gọi thật `POST /charts/query` với domain cho case "decade đang diễn ra"**

Case Phạm Duy, domain `dien_trach` (Điền Trạch, branch Dan, Đại Vận 32-41 tuổi — tuổi hiện tại
29 SẼ rơi vào SẮP TỚI theo dữ liệu thật đã verify ở đầu phase; nếu muốn case "đang diễn ra"
thật sự, dùng `view_year` để đẩy `input.date` far enough hoặc chọn domain có Đại Vận khớp đúng
29 tuổi — `phuc_duc`, Đại Vận Suu 22-31, ĐANG DIỄN RA):

```bash
curl -X POST http://localhost:3000/charts/query \
  -H "Content-Type: application/json" \
  -d '{"calendar_type":"duong_lich","date":"1998-12-17","time_index":12,"gender":"nam","fix_leap":true,"domain":"phuc_duc"}'
```

Đọc `overview_text` trong response. Xác nhận bằng mắt:
- Có câu riêng cho `star_combination` (thì hiện tại ổn định, "bạn LÀ...").
- Có câu riêng cho `decade`, nêu rõ mốc tuổi 22-31 VÀ đúng là "hiện tại"/"đang diễn ra" (vì
  29 tuổi nằm trong 22-31) — không lẫn với câu star_combination.
- KHÔNG có câu nào tự suy luận ý nghĩa cho scope có `items: []` (nếu `KNOWLEDGE_BASE` chưa có
  Rule decade/annual thật, các nhóm đó sẽ rỗng — xác nhận LLM không tự bịa nội dung cho chúng).

- [ ] **Step 3: Gọi thật với domain có decade là "SẮP TỚI"**

```bash
curl -X POST http://localhost:3000/charts/query \
  -H "Content-Type: application/json" \
  -d '{"calendar_type":"duong_lich","date":"1998-12-17","time_index":12,"gender":"nam","fix_leap":true,"domain":"quan_loc"}'
```

(Quan Lộc = branch Mao, Đại Vận 42-51 tuổi — tuổi hiện tại 29 CHƯA tới, đúng case SẮP TỚI.)

Đọc `overview_text`. Xác nhận bằng mắt:
- Câu decade dùng đúng ngôn ngữ "sắp tới"/thì tương lai, KHÔNG viết như thể đang diễn ra.
- Mốc tuổi 42-51 xuất hiện đúng.

- [ ] **Step 4: Gọi thật với domain mơ hồ (nhiều cung, kiểm tra thứ tự)**

```bash
curl -X POST http://localhost:3000/charts/query \
  -H "Content-Type: application/json" \
  -d '{"calendar_type":"duong_lich","date":"1998-12-17","time_index":12,"gender":"nam","fix_leap":true,"domain":"phu_mau"}'
```

Đọc `overview_text`. Xác nhận bằng mắt:
- Cung Phụ Mẫu được trình bày TRƯỚC, chi tiết hơn/là trọng tâm chính.
- Cung Huynh Đệ (nếu có nội dung) được trình bày SAU, như góc nhìn bổ sung — không ngang hàng.

- [ ] **Step 5: Gọi thật với `view_year` để kiểm tra scope annual**

```bash
curl -X POST http://localhost:3000/charts/query \
  -H "Content-Type: application/json" \
  -d '{"calendar_type":"duong_lich","date":"1998-12-17","time_index":12,"gender":"nam","fix_leap":true,"view_year":"2026-01-01","domain":"quan_loc"}'
```

Xác nhận: nếu `KNOWLEDGE_BASE` có Rule annual matched, câu tương ứng dùng đúng "riêng năm
2026" — không lẫn với câu decade.

- [ ] **Step 6: Ghi kết quả verify vào design doc**

Thêm 1 đoạn ngắn vào cuối mục 8 (Known Issues) của
`docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md`, xác nhận đã verify thật với LLM
ngày nào, kết quả ra sao (đạt/có vấn đề cần sửa prompt). Nếu phát hiện vấn đề, SỬA
`QUERY_SYSTEM_PROMPT` trong `src/llm/query-prompt.ts`, chạy lại test Task 4, rồi lặp lại Step
2-5 của task này cho tới khi đạt.

- [ ] **Step 7: Dừng server, commit ghi chú verify (nếu có sửa prompt thì commit riêng)**

```bash
git add docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md
git commit -m "docs: log real-LLM verification results for Tầng 2 query prompt (Task 6)"
```

Nếu Step 6 phát hiện cần sửa prompt, commit sửa đổi TRƯỚC (message riêng mô tả sửa gì), rồi mới
commit ghi chú verify.

---

## Tổng kết Tasks

1. `DomainKey`/`DomainPalaceEntry` + `DOMAIN_PALACE_MAP` (dữ liệu tri thức, đã verify thật)
2. `resolveQuery` + `daiVanAtBranch` (2 hàm thuần túy trong `query-resolver.ts`)
3. `QueryEvidencePack` + `buildQueryEvidencePack` (orchestration dữ liệu, chạy đủ 4 scope)
4. `QUERY_SYSTEM_PROMPT` + `buildQueryUserMessage` (prompt, lấy nguyên văn từ design doc)
5. `generateDomainQuery` + route `POST /charts/query` (orchestrator + API)
6. Verify thật với LLM (bắt buộc, không bỏ qua)

Sau Task 6: final whole-branch review (model mạnh nhất), rồi hỏi push-vs-keep-local theo đúng
pattern đã dùng ở mọi phase trước trong dự án này.
