# Rule Engine (Phase 3) — Design Spec

**Ngày:** 2026-08-17
**Phạm vi:** Rule Schema v0.1 + Source entity (build spec mục 4-5), encode đúng 1 Entry mẫu
(mục 9 — "Thiên Đồng ngộ Không/Kiếp"), evaluator cho 4 scope đã chứng minh khả thi bằng
prototype Python, Conflict Resolver v0 (mục 10 — chỉ gom, không phân xử). KHÔNG bao gồm
LLM integration, không viết thêm Rule ngoài Entry mẫu, không UI (build spec mục 13).

## Known issues / chưa xử lý xong

*(Trống ở thời điểm viết design. Theo dõi phát hiện dở dang tại đây trong suốt quá trình
brainstorm/implementation, không dựa vào trí nhớ hội thoại — bài học từ Chart Engine.)*

---

## 1. Bối cảnh & nguồn tham khảo

- `TuVi_Build_Spec_v1.md` mục 4 (Rule Schema v0.1), mục 5 (Source entity), mục 6 (Case Schema
  + case nền Phạm Duy), mục 9 (Entry mẫu — 2 quan điểm trái chiều), mục 10 (Conflict Resolver v0).
- `tuvi_rule_engine_prototype.py` — đã chứng minh 5 loại rule test khả thi bằng code thuần
  (tổ hợp sao đơn giản, modifier mềm, hội chiếu/tam phương, tứ hóa theo can, conflict_group_id).
  Dùng tham khảo *cách tư duy evaluator*; KHÔNG port nguyên si vì đã tách condition/modifier/
  exception rõ ràng hơn ở build spec mục 4 (bản trước tách chung vào 1 `Rule.conditions` list).
- `src/chart/` (Chart Engine, Phase 2 — đã hoàn thành, đã cross-check, review sạch, đã push
  GitHub) — Rule Engine tiêu thụ `Chart` object từ đây qua `buildChart()`, KHÔNG tự parse lại
  output `iztro`.

## 2. Nguyên tắc bắt buộc (nhắc lại, áp dụng khi code)

- 3 khái niệm `condition` / `modifier` / `exception` **không gộp thành 1 con số `weight`**
  (build spec mục 4) — `weight` chỉ tồn tại trong `Modifier`, không có ở `Condition`.
- `Source.reliability_tier` và `Rule.consensus` là **2 trục độc lập**, không suy cái này ra
  cái kia (build spec mục 0, mục 4).
- Conflict Resolver **chỉ gom theo `conflict_group_id`, không tự chọn rule nào "thắng"**
  (build spec mục 10) — việc chọn phe thuộc về người đọc cuối/LLM ở giai đoạn sau.
- An sao/quan hệ cung là việc của Chart Engine — Rule Engine chỉ **đọc** `Chart` đã build sẵn,
  không tự tính lại hay tự viết bảng tam hợp/xung chiếu (kế thừa nguyên tắc Phase 2).
- **Fail loud, never guess** (quy ước đã thiết lập xuyên suốt Chart Engine): scope/field/relation
  chưa có evaluator thật → throw Error rõ ràng, không âm thầm trả `false` hay bỏ qua Rule.

## 3. Rule Schema v0.1 + Source entity — port sang TypeScript

Port đầy đủ build spec mục 4 (Rule) và mục 5 (Source) thành TypeScript interface trong
`src/rule/types.ts`. Khác biệt so với build spec YAML thô:

- `scope` khai đủ **9 giá trị** theo build spec mục 4 (`star_palace`, `star_pair`,
  `star_combination`, `palace_relationship`, `four_transform`, `pattern`, `decade`, `annual`,
  `spouse_matching`) — kể cả những scope chưa có evaluator thật. Enum đầy đủ giúp viết Rule
  đúng type ngay từ đầu; evaluator sẽ throw rõ ràng khi gặp scope chưa hỗ trợ (mục 5 bên dưới),
  KHÔNG chặn ở tầng type.
- `Rule.condition` (số ít, theo YAML build spec) → `Rule.conditions: Condition[]` (số nhiều).
  Build spec dùng số ít nhưng mô tả "điều kiện bắt buộc" theo nghĩa có thể nhiều điều kiện AND
  với nhau — đúng như prototype Python đã làm (`conditions: list[Condition]`). Giữ theo prototype
  vì đó là bản đã chứng minh khả thi bằng code chạy được, build spec YAML chỉ là schema minh họa.
- Tương tự `Rule.exception` (số ít) → `Rule.exceptions: Exception[]` (số nhiều, khớp cách
  build spec liệt kê `exceptions` ở cuối object Rule).
- `Rule.sources: string[]` — mảng `source_id` tham chiếu `Source` (build spec mục 5: many-to-many,
  1 Rule có nhiều Source). Không nhúng `Source` object trực tiếp vào Rule.

```ts
export type RuleScope =
  | 'star_palace' | 'star_pair' | 'star_combination' | 'palace_relationship'
  | 'four_transform' | 'pattern' | 'decade' | 'annual' | 'spouse_matching';

export type ConditionOperator = 'contains' | 'not_contains' | 'equals' | 'in' | 'not_in';
export type ChartField = 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type';

export interface Condition {
  field: ChartField;
  operator: ConditionOperator;
  value: string;
  required: true; // v0.1: mọi condition đều bắt buộc — không có optional condition
}

export interface Modifier {
  field: ChartField | 'branch';
  operator: ConditionOperator;
  value: string;
  effect: string;   // mô tả định tính, KHÔNG phải điểm số
  weight: number;   // 0..1, CHỈ dùng trong Modifier
}

export interface Exception {
  conditions: Condition[];
  effect: string;
}

export type Valence = 'cat' | 'hung' | 'trung_tinh';
export type Magnitude = 'nhe' | 'vua' | 'manh';
export type Consensus = 'cao' | 'trung_binh' | 'tranh_cai';

export interface Conclusion {
  text: string;
  valence: Valence;
  magnitude: Magnitude;
}

export interface Rule {
  rule_id: string;
  conflict_group_id: string | null;
  scope: RuleScope;
  subject: { type: 'star' | 'palace' | 'pattern'; id: string };
  conditions: Condition[];
  modifiers: Modifier[];
  exceptions: Exception[];
  conclusion: Conclusion;
  school: string;
  sources: string[];        // ref(Source.source_id), many-to-many
  consensus: Consensus;      // ĐỘC LẬP với source.reliability_tier
  notes: string;
}

export type SourceType = 'co_van_nguyen_ban' | 'sach_in_co_tac_gia' | 'dien_dan_web';
export type ReliabilityTier = '1_cao_nhat' | '2_trung' | '3_thap';

export interface Source {
  source_id: string;
  type: SourceType;
  title: string;
  author: string | null;
  school: string | null;
  reliability_tier: ReliabilityTier;
  excerpt_or_link: string;
}
```

**`ChartField` thu hẹp so với build spec** (`field: string` tự do): chỉ liệt kê các field thật
sự đọc được trên `ChartPalace` (`major_stars`, `minor_stars`, `adjective_stars`, hợp nhất thành
`all_stars`, và `sihua_type` cho scope `four_transform`). Field lạ sẽ bị TypeScript chặn ngay
lúc viết Rule thay vì lỗi runtime — nhưng nếu Rule Engine sau này cần field khác trên `Chart`
(vd `menh_than.same_palace`), mở rộng enum này, không dùng `field: string` tự do.

## 4. Đối tượng thực hiện

```
src/rule/
├── types.ts             # Rule Schema v0.1 + Source (mục 3 trên)
├── evaluator.ts          # evaluateRule() cho 3 scope: star_palace, star_combination,
│                          # four_transform (+ uỷ quyền palace_relationship cho file dưới)
├── relation-evaluator.ts # evaluator riêng cho scope palace_relationship
├── conflict-resolver.ts  # resolveConflicts() — chỉ gom theo conflict_group_id
└── knowledge-base.ts     # Entry mẫu mục 9: 2 Rule + 2 Source (TS object literal)
```

- **`evaluator.ts`**:
  - `resolveField(chart, branch, field): Set<string>` — đọc `ChartField` từ 1 `ChartPalace`.
    `sihua_type` trả về set các `SihuaType` (`Loc`/`Quyen`/`Khoa`/`Ky`) đã có sẵn trong
    `ChartPalace.sihua` (Chart Engine đã derive từ `iztro`, không cần tra bảng riêng như
    prototype Python đã tự viết `TU_HOA_TABLE`).
  - `evalCondition(chart, branch, condition): boolean` — 1 condition.
  - `evalModifier(chart, branch, modifier): boolean` — 1 modifier (không quyết định pass/fail
    của Rule, chỉ là thông tin phụ trả kèm kết quả).
  - `evaluateRule(chart, branch, rule): RuleEvalResult` — hàm chính. Với `scope ===
    'palace_relationship'` → gọi `relation-evaluator.ts`. Với `scope` thuộc nhóm chưa hỗ trợ
    (`pattern`/`decade`/`annual`/`spouse_matching`/`star_pair`) → `throw new Error(...)`.
    Với 4 scope đã hỗ trợ (`star_palace`, `star_combination`, `four_transform`, và
    `palace_relationship` qua uỷ quyền) → chạy AND toàn bộ `conditions`, gom `modifiers` matched,
    kiểm tra `exceptions` matched, trả:
    ```ts
    interface RuleEvalResult {
      rule_id: string;
      matched: boolean;                 // KẾT QUẢ CỦA conditions, KHÔNG bị modifier/exception đổi
      matched_modifiers: Modifier[];     // modifier nào áp dụng — thông tin phụ
      triggered_exceptions: Exception[]; // exception nào match — thông tin phụ, KHÔNG tự đảo matched
    }
    ```
    `matched_modifiers`/`triggered_exceptions` không tự động đổi `matched` — đúng nguyên tắc
    "không gộp 3 khái niệm thành 1 quyết định nhị phân". LLM/người đọc ở giai đoạn sau tự diễn
    giải ý nghĩa của modifier/exception khi trình bày kết luận.
  - `matchRules(chart, branch, rules: Rule[]): RuleEvalResult[]` — chạy toàn bộ knowledge base,
    trả về kết quả của MỌI rule (kể cả `matched: false`) để giữ đầy đủ traceability; lọc
    `matched === true` là việc của caller.

- **`relation-evaluator.ts`**: evaluator riêng cho scope `palace_relationship`, vì field không
  resolve trực tiếp trên 1 `ChartPalace` — cần quan hệ giữa cung (bài học Test 3 prototype Python).
  ```ts
  export type RelationTarget = 'opposite' | 'wealth' | 'career';

  export function evalRelationCondition(
    input: BuildChartInput,
    branch: Branch,
    relation: RelationTarget,
    condition: Condition,
  ): boolean
  ```
  Nhận `BuildChartInput` (không phải `Chart` xây sẵn) vì phải gọi lại `relatedPalaces(input,
  branch)` từ `queries.ts` — kế thừa đúng đánh đổi đã ghi trong `queries.ts` (tính lại toàn bộ
  lá số mỗi lần gọi, chấp nhận được vì Rule Engine cũng ngoài phạm vi tối ưu hiệu năng ở v0.1).
  Test bằng 1 Rule test-only (mục 6 bên dưới), KHÔNG có Rule sản xuất nào dùng scope này ở
  bản này — Entry mẫu mục 9 không cần quan hệ cung.

- **`conflict-resolver.ts`**:
  ```ts
  export interface ConflictGroup {
    conflict_group_id: string;
    rules: Rule[];            // nguyên vẹn cả 2 (hay nhiều) bên, KHÔNG sắp thứ tự theo "đúng hơn"
  }

  export function resolveConflicts(matchedRules: Rule[]): ConflictGroup[]
  ```
  Chỉ gom các rule có `conflict_group_id !== null` theo đúng group. Rule không có
  `conflict_group_id` (độc lập, không tranh cãi) không xuất hiện trong kết quả — đây là hàm gom
  conflict, không phải hàm liệt kê toàn bộ rule matched (đó là việc của `matchRules` output).
  KHÔNG có logic "chọn rule đáng tin hơn" — build spec mục 10 cấm rõ ràng.

- **`knowledge-base.ts`**: 2 Rule (`RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT`,
  `RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI`) cùng `conflict_group_id: 'CG_001'`, và 2 Source
  tương ứng (cả hai `reliability_tier: '3_thap'` theo đúng build spec mục 9 — "nguồn hiện tại
  đều ở tier thấp, cần truy nguyên bản gốc trước khi nâng tier"). Export dạng TS object literal,
  KHÔNG dùng DB/file JSON ở v0.1 (đúng mục 12 build spec — chưa cần hạ tầng phức tạp).

## 5. Encode Entry mẫu mục 9

**Rule A — "Thiên Đồng ngộ Không Kiếp bất cát":**
```ts
{
  rule_id: 'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
  conflict_group_id: 'CG_001',
  scope: 'star_combination',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: {
    text: 'Thiên Đồng ngộ Không Kiếp — dễ hoang mang, thiếu nhất quán, thay đổi thất thường.',
    valence: 'hung', magnitude: 'vua',
  },
  school: 'tong_hop_dien_dan',
  sources: ['SRC_001'],
  consensus: 'tranh_cai',
  notes: 'Xem RULE_B cùng conflict_group_id CG_001 — quan điểm trái chiều.',
}
```

**Rule B — "Không Kiếp Tỵ Hợi phản vi giai luận":** theo đúng build spec mục 9, đây là luận về
**vị trí Tỵ/Hợi** của Không-Kiếp, KHÔNG đồng nghĩa "Thiên Đồng + Không Kiếp = tốt" — Rule B
kiểm tra Không-Kiếp đồng cung tại Tỵ hoặc Hợi, KHÔNG yêu cầu Thiên Đồng trong `conditions` (đó
là điểm khác biệt thật giữa 2 quan điểm, giữ nguyên để 2 Rule không bị viết thành bản sao của
nhau chỉ khác conclusion).
```ts
{
  rule_id: 'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
  conflict_group_id: 'CG_001',
  scope: 'star_combination',
  subject: { type: 'star', id: 'DIA_KHONG_DIA_KIEP' },
  conditions: [
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'tang_xu_huong_tot', weight: 0.7 },
  ],
  exceptions: [],
  conclusion: {
    text: 'Không Kiếp đồng cung — tại Tỵ/Hợi có xu hướng phản vi giai (tốt hơn vị trí khác), tùy chính tinh đi kèm.',
    valence: 'cat', magnitude: 'nhe',
  },
  school: 'tong_hop_dien_dan',
  sources: ['SRC_002'],
  consensus: 'tranh_cai',
  notes: 'Luận về vị trí Tỵ/Hợi, KHÔNG đồng nghĩa trực tiếp "Thiên Đồng + Không Kiếp = tốt".',
}
```
Vì `evaluateRule` không tự áp modifier vào kết quả `matched`, việc branch có phải Tỵ/Hợi hay
không được kiểm tra qua `matched_modifiers` sau khi gọi `evaluateRule` — **không** đưa vào
`conditions`, vì đó chính là "yếu tố gia giảm mềm", đúng theo build spec mục 4.

**2 Source** (`SRC_001`, `SRC_002`): `type: 'dien_dan_web'`, `reliability_tier: '3_thap'`,
`school: null` (chưa xác định trường phái cụ thể — "tổng hợp diễn đàn" theo build spec mục 9).

## 6. Testing

- Framework: **Vitest**, tiếp nối Chart Engine.
- `test/rule/evaluator.test.ts`: build `Chart` Phạm Duy thật qua `buildChart()` (input đã xác
  minh: `bySolar('1998-12-17', 12, 'nam')`), assert:
  - `evaluateRule(chart, 'Hoi', RULE_A)` → `matched === true`.
  - `evaluateRule(chart, 'Hoi', RULE_B)` → `matched === true`, `matched_modifiers` chứa modifier
    branch Tỵ/Hợi (vì Mệnh tại Hợi).
  - `matchRules(chart, 'Hoi', KNOWLEDGE_BASE)` → cả 2 rule đều có mặt trong kết quả với
    `matched: true`.
  - `evaluateRule` với 1 Rule giả `scope: 'decade'` → throw Error rõ nội dung "chưa có evaluator".
- `test/rule/relation-evaluator.test.ts`: 1 Rule test-only (không thuộc `knowledge-base.ts`,
  đánh dấu rõ trong code là fixture test, không phải Rule sản xuất) kiểm tra
  `scope: 'palace_relationship'` — vd "cung Tài Bạch (wealth) của Mệnh có sao X" — chạy trên
  Chart Phạm Duy thật, assert đúng quan hệ đã biết (Mệnh@Hợi → wealth = Tài Bạch@Mùi, theo dữ
  liệu đã cross-check ở Phase 2).
- `test/rule/conflict-resolver.test.ts`: `matchRules` cho case Phạm Duy → `resolveConflicts(...)`
  → assert đúng 1 `ConflictGroup` với `conflict_group_id: 'CG_001'`, chứa cả RULE_A và RULE_B,
  cả 2 rule giữ nguyên `consensus`/`sources` (không bị lọc/sắp xếp theo "đáng tin hơn").
- Không viết case chart khác ngoài Phạm Duy ở bản này (theo đúng scope, tương tự Chart Engine
  Phase 2 chỉ có 1 case nền).

## 7. Ngoài phạm vi

Không làm ở bản này: LLM integration (Evidence Pack, Interpreter — build spec mục 11), UI,
vector DB, Case Schema thật (mục 6 build spec định nghĩa `Case` nhưng chưa cần implement — case
nền Phạm Duy chỉ dùng làm test fixture, không cần bảng `Case` lưu `life_events`/`tested_rules`
ở v0.1 này), viết thêm Rule ngoài Entry mẫu mục 9, DB/persistence cho Rule/Source (giữ TS object
literal — mục 3).
