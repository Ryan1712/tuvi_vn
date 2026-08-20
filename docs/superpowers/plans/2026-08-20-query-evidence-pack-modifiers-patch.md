# Patch: matched_modifiers trong QueryEvidencePack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng Known Issue phát hiện lúc final review Tầng 2: `InterpretationItem` không mang
`matched_modifiers`, khiến sắc thái gia giảm của Rule (VD `RULE_B` tại Tý/Hợi, weight 0.7) bị
mất hoàn toàn khi vào `QueryEvidencePack`. Đồng thời đóng luôn Minor finding (trùng lặp logic
`evalCondition` trong `staticGroupItems` thay vì tái dùng evaluator có sẵn).

**Architecture:** Mở rộng `InterpretationItem` thêm `matched_modifiers: Modifier[]`. Sửa
`ruleToItem` nhận thêm tham số `matchedModifiers`. Sửa `staticGroupItems` gọi `evaluateRule`
trực tiếp (không tự viết `evalCondition`). 3 hàm nhóm còn lại (`relationGroupItems`/
`decadeGroup`/`annualGroupItems`) chỉ cần truyền `result.matched_modifiers` (đã có sẵn từ
`RuleEvalResult`, chỉ chưa được dùng) vào `ruleToItem`. Thêm quy tắc 8 vào `QUERY_SYSTEM_PROMPT`.

**Tech Stack:** TypeScript, Vitest — không đổi.

**Design doc:** `docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md` mục 4 ("Patch sau
final review"), mục 5 quy tắc 8, mục 8 Known Issues (2 entry "ĐÃ QUYẾT ĐỊNH") — đọc trước khi
thực hiện bất kỳ task nào.

## Global Constraints

- File chỉ giới hạn: sửa `src/llm/query-evidence-pack.ts`, `src/llm/query-prompt.ts`,
  `test/llm/query-evidence-pack.test.ts`, `test/llm/query-prompt.test.ts` — KHÔNG sửa
  `src/rule/evaluator.ts`, `src/rule/decade-evaluator.ts`, `src/rule/annual-evaluator.ts`,
  `src/rule/relation-evaluator.ts` (các hàm này đã đúng, `RuleEvalResult.matched_modifiers` đã
  có sẵn từ trước — chỉ chưa được đọc ra).
- `matched_modifiers` trong `InterpretationItem` PHẢI là `Modifier[]` đầy đủ (nguyên type từ
  `src/rule/types.ts`), KHÔNG rút gọn thành `{effect, weight}[]`.
- `staticGroupItems` PHẢI đổi sang gọi `evaluateRule(chart, branch, rule)` cho từng Rule đã lọc
  đúng scope (`star_combination`/`star_palace`/`four_transform`) — KHÔNG dùng `matchRules` trên
  toàn `KNOWLEDGE_BASE` chưa lọc (vì `matchRules` gọi `evaluateRule` cho MỌI rule trong mảng,
  sẽ throw nếu gặp Rule scope `palace_relationship`/`decade`/`annual`).
- Nội dung quy tắc 8 trong `QUERY_SYSTEM_PROMPT` PHẢI khớp NGUYÊN VĂN với design doc mục 5 —
  đã qua brainstorm/review, không tự ý viết lại.
- Sau khi patch, chạy lại Task 6-tương-đương: verify thật với LLM cho case domain=`menh` (branch
  `Hoi`, nơi `RULE_B` matched thật với modifier kích hoạt) — xác nhận `QUERY_SYSTEM_PROMPT`
  quy tắc 8 hoạt động đúng khi vận hành thật, không chỉ đúng trên giấy (cùng lý do đã áp dụng
  cho quy tắc 7 ở Task 6 gốc — rủi ro hồi quy hành vi LLM không bắt được bằng test tự động).

---

### Task 1: Mở rộng `InterpretationItem` + sửa 4 hàm nhóm để truyền `matched_modifiers`

**Files:**
- Modify: `src/llm/query-evidence-pack.ts`
- Modify: `test/llm/query-evidence-pack.test.ts`

**Interfaces:**
- Consumes: `Modifier` type (đã có sẵn trong `src/rule/types.ts`), `RuleEvalResult` (đã có sẵn
  trong `src/rule/evaluator.ts`, đã mang `matched_modifiers`).
- Produces: `InterpretationItem.matched_modifiers: Modifier[]` — dùng ở Task 2 (system prompt
  không cần sửa signature, chỉ đọc field mới qua JSON).

- [ ] **Step 1: Viết failing test cho `matched_modifiers` xuất hiện đúng**

Thêm vào `test/llm/query-evidence-pack.test.ts` (giữ nguyên các test cũ, chỉ thêm mới):

```ts
describe('buildQueryEvidencePack — matched_modifiers', () => {
  it('RULE_B matched tai cung Menh (branch Hoi) co matched_modifiers khong rong', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Hoi'], 'menh');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    const ruleBItem = staticGroup?.items.find((i) => i.rule_id === 'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI');
    expect(ruleBItem).toBeDefined();
    expect(ruleBItem?.matched_modifiers).toHaveLength(1);
    expect(ruleBItem?.matched_modifiers[0]?.field).toBe('branch');
    expect(ruleBItem?.matched_modifiers[0]?.value).toBe('Ty2,Hoi');
    expect(ruleBItem?.matched_modifiers[0]?.effect).toBe('tang_xu_huong_tot');
    expect(ruleBItem?.matched_modifiers[0]?.weight).toBe(0.7);
  });

  it('RULE_A matched (khong co modifier trong Rule) co matched_modifiers rong', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Hoi'], 'menh');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    const ruleAItem = staticGroup?.items.find((i) => i.rule_id === 'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT');
    expect(ruleAItem).toBeDefined();
    expect(ruleAItem?.matched_modifiers).toEqual([]);
  });

  it('cung khong o Ty2/Hoi: RULE_B khong matched (conditions da khong khop, khong lien quan modifier)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    // Dan = cung Dien Trach, khong co Khong/Kiep -> RULE_A, RULE_B deu khong matched
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Dan'], 'dien_trach');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    expect(staticGroup?.items).toEqual([]);
  });
});
```

**Lưu ý cho implementer:** case Phạm Duy (`PHAM_DUY_2026`, đã có sẵn trong file test) có
`chart.menh_than.menh_branch === 'Hoi'`, và `RULE_A`/`RULE_B` cả 2 đều matched tại cung Mệnh
(đã xác nhận trong `test/server/routes.test.ts`'s `POST /charts/rules` test — "ca RULE_A va
RULE_B match tren cung Hoi"). Domain `menh` map tới `palace_names: ['Mệnh']`, và với case này
cung Mệnh nằm ở branch `Hoi` — nên `resolveQuery(chart, 'menh')` trả về `['Hoi']`, dùng trực
tiếp giá trị này cho test, không cần build lại.

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npm test -- query-evidence-pack`
Expected: FAIL — `matched_modifiers` chưa tồn tại trên `InterpretationItem` (lỗi TypeScript
hoặc `undefined` khi assert `toHaveLength(1)`).

- [ ] **Step 3: Sửa `src/llm/query-evidence-pack.ts`**

**3a. Import `Modifier`:**

```ts
import type { DomainKey, Modifier, Rule, Valence, Consensus } from '../rule/types.js';
```

**3b. Mở rộng `InterpretationItem`:**

```ts
interface InterpretationItem {
  rule_id: string;
  conclusion_text: string;
  valence: Valence;
  consensus: Consensus;
  conflict_group_id: string | null;
  matched_modifiers: Modifier[];
}
```

**3c. Sửa `ruleToItem` nhận thêm tham số:**

```ts
function ruleToItem(rule: Rule, matchedModifiers: Modifier[]): InterpretationItem {
  return {
    rule_id: rule.rule_id,
    conclusion_text: rule.conclusion.text,
    valence: rule.conclusion.valence,
    consensus: rule.consensus,
    conflict_group_id: rule.conflict_group_id,
    matched_modifiers: matchedModifiers,
  };
}
```

**3d. Sửa `staticGroupItems` — dùng `evaluateRule` thay vì tự viết `evalCondition`:**

```ts
import { evaluateRule } from '../rule/evaluator.js';
// XOA: import { evalCondition } from '../rule/evaluator.js';

function staticGroupItems(chart: Chart, branch: Branch): InterpretationItem[] {
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'star_combination' && rule.scope !== 'star_palace' && rule.scope !== 'four_transform') continue;
    const result = evaluateRule(chart, branch, rule);
    if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
  }
  return items;
}
```

Chú ý: `evaluateRule` tự tra `palaceOfBranch(chart, branch)` bên trong — không cần
`chart.palaces.find(...)` thủ công như bản cũ, có thể XÓA đoạn tìm `palace`/throw ở đầu hàm
(bản cũ dùng để lấy `palace` cho `evalCondition`, giờ không cần nữa vì `evaluateRule` tự làm).

**3e. Sửa 3 hàm nhóm còn lại — chỉ thêm `result.matched_modifiers` vào lời gọi `ruleToItem`:**

```ts
function relationGroupItems(input: BuildChartInput, branch: Branch): InterpretationItem[] {
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'palace_relationship') continue;
    for (const relation of RELATION_TARGETS) {
      const result = evaluateRelationRule(input, branch, relation, rule);
      if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
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
    if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
  }
  return { decade_age_range: { age_from: daiVan.age_from, age_to: daiVan.age_to }, items };
}

function annualGroupItems(chart: Chart, branch: Branch): InterpretationItem[] {
  if (chart.luu_nien === undefined) return [];
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'annual') continue;
    const result = evaluateAnnualRule(chart, chart.luu_nien, branch, rule);
    if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
  }
  return items;
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npm test -- query-evidence-pack`
Expected: 13/13 tests PASS (10 cũ + 3 mới).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean — đặc biệt xác nhận không còn import `evalCondition` thừa (nếu Step 3d xóa
đúng, TypeScript sẽ báo lỗi unused import nếu quên xóa; nếu chưa xóa, xóa ngay).

- [ ] **Step 6: Chạy toàn bộ suite**

Run: `npm test`
Expected: 161/161 tests (158 baseline + 3 mới), không regression ở bất kỳ file nào khác.

- [ ] **Step 7: Commit**

```bash
git add src/llm/query-evidence-pack.ts test/llm/query-evidence-pack.test.ts
git commit -m "feat: add matched_modifiers to InterpretationItem, reuse evaluateRule in staticGroupItems"
```

---

### Task 2: Thêm quy tắc 8 vào `QUERY_SYSTEM_PROMPT`

**Files:**
- Modify: `src/llm/query-prompt.ts`
- Modify: `test/llm/query-prompt.test.ts`

**Interfaces:**
- Consumes: không đổi signature nào — chỉ thêm text vào `QUERY_SYSTEM_PROMPT`.

- [ ] **Step 1: Viết failing test**

Thêm vào `test/llm/query-prompt.test.ts`:

```ts
describe('QUERY_SYSTEM_PROMPT — quy tac 8 (matched_modifiers)', () => {
  it('chua quy tac ve matched_modifiers nhu yeu to gia giam', () => {
    expect(QUERY_SYSTEM_PROMPT).toContain('matched_modifiers');
    expect(QUERY_SYSTEM_PROMPT).toMatch(/GIA GIẢM/);
  });

  it('vi du dung RULE_B that (branch Ty2,Hoi, effect tang_xu_huong_tot)', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/Không Kiếp/);
    expect(QUERY_SYSTEM_PROMPT).toMatch(/Tý\/Hợi/);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npm test -- query-prompt`
Expected: FAIL — quy tắc 8 chưa tồn tại trong `QUERY_SYSTEM_PROMPT`.

- [ ] **Step 3: Chép NGUYÊN VĂN quy tắc 8 từ design doc vào `QUERY_SYSTEM_PROMPT`**

Trong `src/llm/query-prompt.ts`, chèn đoạn sau vào NGAY TRƯỚC dấu backtick đóng của template
string (sau quy tắc 7, sau ví dụ SAI cuối cùng của quy tắc 7):

```ts
export const QUERY_SYSTEM_PROMPT = `... (giu nguyen toan bo noi dung cu, khong doi 1 ky tu nao) ...

   Ví dụ SAI (2 lỗi cùng lúc): "Về sự nghiệp: bạn là người có tư duy độc lập, thích tự chủ, và
   có xu hướng thay đổi công việc" — (1) gộp 2 nhóm scope thành 1 câu, không phân biệt đâu là
   bản chất suốt đời, đâu là chỉ đúng 1 giai đoạn — người đọc không biết đặc điểm nào sẽ hết
   khi qua Đại Vận đó; (2) không nêu mốc tuổi/thì của giai đoạn decade, mặc định ngầm là "hiện
   tại" dù giai đoạn đó trong dữ liệu có thể đã qua từ lâu hoặc còn ở tương lai — CẤM cả 2.

8. Mỗi "item" trong "items" có thể kèm "matched_modifiers" — đây là các YẾU TỐ GIA GIẢM đã
   kích hoạt cho Rule đó, KHÔNG PHẢI kết luận mới, KHÔNG được diễn đạt ngang hàng với
   conclusion_text chính. Khi "matched_modifiers" không rỗng, PHẢI:
   - Diễn đạt như phần bổ trợ/điều chỉnh mức độ cho conclusion_text chính, không phải 1 nhận
     định độc lập mới.
   - Nêu rõ ĐIỀU KIỆN kích hoạt modifier đó (dựa vào "field"/"value" của modifier — VD nếu
     field là "branch", nói rõ "vì [cung này/vị trí này]..."), không chỉ nói "có gia giảm"
     mà không giải thích dựa trên yếu tố gì.
   - Nếu "matched_modifiers" rỗng, KHÔNG được tự thêm câu gia giảm nào — im lặng bỏ qua, đúng
     tinh thần quy tắc 1 (không suy luận ngoài dữ liệu).

   Ví dụ ĐÚNG (dùng đúng RULE_B thật trong KNOWLEDGE_BASE — modifier field:"branch",
   value:"Ty2,Hoi", effect:"tang_xu_huong_tot", weight:0.7):
   "Không Kiếp đồng cung tại cung này cho thấy xu hướng dễ hoang mang, thiếu nhất quán, thay
   đổi thất thường. Tuy nhiên, vì cung này nằm ở vị trí Tý/Hợi, có xu hướng phần nào giảm nhẹ
   hơn so với các vị trí khác — dù chính tinh đi kèm vẫn cần lưu ý."

   Ví dụ SAI: "Không Kiếp đồng cung tại cung này cho thấy xu hướng dễ hoang mang, thiếu nhất
   quán, thay đổi thất thường. Ngoài ra, vị trí Tý/Hợi cũng mang lại may mắn." — (1) diễn đạt
   modifier như 1 kết luận MỚI ngang hàng ("mang lại may mắn" nghe như 1 đặc điểm riêng, không
   phải điều chỉnh mức độ của câu trước), (2) không nêu rõ đây là yếu tố GIA GIẢM cho chính
   conclusion_text đó — CẤM cả 2.`;
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npm test -- query-prompt`
Expected: 7/7 tests PASS (5 cũ + 2 mới).

- [ ] **Step 5: Tự đối chiếu nguyên văn**

Đọc lại `QUERY_SYSTEM_PROMPT` trong file thật và đoạn quy tắc 8 trong design doc mục 5 cạnh
nhau — xác nhận khớp 100% ký tự (đúng convention đã dùng ở Task 4 gốc của Tầng 2, nơi reviewer
đã dùng script so sánh byte-for-byte).

- [ ] **Step 6: Typecheck + toàn bộ suite**

Run: `npm run typecheck && npm test`
Expected: typecheck sạch, 163/163 tests (161 sau Task 1 + 2 mới).

- [ ] **Step 7: Commit**

```bash
git add src/llm/query-prompt.ts test/llm/query-prompt.test.ts
git commit -m "feat: add quy tac 8 (matched_modifiers wording) to QUERY_SYSTEM_PROMPT"
```

---

### Task 3: Verify thật với LLM cho quy tắc 8 (bắt buộc, không phải tùy chọn)

**Mục đích:** Xác nhận quy tắc 8 thực sự tạo ra văn bản diễn đạt modifier đúng cách (gia giảm,
không phải kết luận mới) KHI VẬN HÀNH THẬT — cùng lý do đã áp dụng cho quy tắc 7 ở Task 6 gốc
của Tầng 2 (rủi ro hồi quy hành vi LLM không bắt được bằng test tự động).

**Files:** không tạo/sửa file code — bước vận hành thủ công, kết quả ghi vào design doc.

- [ ] **Step 1: Khởi động server thật**

```bash
node --env-file=.env --import tsx src/server/server.ts
```

- [ ] **Step 2: Gọi thật `POST /charts/query` với `domain=menh` (RULE_B matched, modifier kích
hoạt thật tại branch Hợi)**

```bash
curl -X POST http://localhost:3000/charts/query \
  -H "Content-Type: application/json" \
  -d '{"calendar_type":"duong_lich","date":"1998-12-17","time_index":12,"gender":"nam","fix_leap":true,"domain":"menh"}'
```

Đọc `overview_text`. Xác nhận bằng mắt:
- Có câu diễn đạt sắc thái gia giảm của `RULE_B` (Không Kiếp tại Tý/Hợi) — KHÔNG phải câu
  ngang hàng với `conclusion_text` chính, mà là phần bổ trợ/điều chỉnh.
- Câu đó có nêu ĐIỀU KIỆN kích hoạt (vị trí Tý/Hợi), không chỉ nói chung chung "có gia giảm".
- `RULE_A` (không có modifier trong Rule) KHÔNG bị LLM tự thêm câu gia giảm nào.

- [ ] **Step 3: Ghi kết quả verify vào design doc**

Thêm 1 đoạn ngắn vào mục 8 Known Issues của
`docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md`, xác nhận đã verify thật, trích
dẫn câu chữ cụ thể LLM sinh ra (không chỉ nói chung chung "đã test, ổn" — đúng convention đã
dùng cho Task 6 gốc). Nếu phát hiện vấn đề, SỬA quy tắc 8 trong `QUERY_SYSTEM_PROMPT`, chạy lại
test Task 2, lặp lại Step 2 cho tới khi đạt.

- [ ] **Step 4: Dừng server, commit ghi chú verify**

```bash
git add docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md
git commit -m "docs: log real-LLM verification for quy tac 8 (matched_modifiers wording)"
```

---

## Tổng kết Tasks

1. Mở rộng `InterpretationItem` + sửa `staticGroupItems`/3 hàm nhóm để truyền `matched_modifiers`
2. Thêm quy tắc 8 vào `QUERY_SYSTEM_PROMPT`
3. Verify thật với LLM (bắt buộc)

Sau Task 3: final review nhỏ (không cần review rộng bằng model mạnh nhất như final review của
toàn Tầng 2 — đây là patch nhỏ, review tiêu chuẩn đủ), rồi hỏi push-vs-keep-local.
