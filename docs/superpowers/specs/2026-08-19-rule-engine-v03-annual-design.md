# Rule Engine v0.3 — Hỗ trợ scope `annual` — Design Spec

**Ngày:** 2026-08-19
**Phạm vi:** Thêm evaluator cho `RuleScope: 'annual'` (Lưu Niên) — khai từ Phase 3, chưa từng có
evaluator, `evaluateRule()` throw ngay khi gặp. Tiếp nối Rule Engine v0.2 (scope `decade`, đã
xong — xem `2026-08-19-rule-engine-v02-decade-design.md`). KHÔNG bao gồm: domain-mapping/
`resolveQuery` (Tầng 2, phụ thuộc phase này nhưng không nằm trong phạm vi), mở rộng Chart Data
Shape (`chart_id` — xem mục 5), sao "vận"/"lưu" phân loại chi tiết hơn.

## Bối cảnh

`decade` (Đại Vận) đã xong — dùng dữ liệu tĩnh có sẵn (`Chart.luck_cycles.dai_van`), tái dùng
nguyên vẹn `evalCondition`/`evalModifier`/`evalExceptionConditions`. `annual` (Lưu Niên) khác
hẳn ở 2 điểm cấu trúc quan trọng, phát hiện qua đọc code thật:

1. **`LuuNien` không nằm trong `Chart`** — là dữ liệu dẫn xuất theo năm được hỏi (`view_year`),
   cố ý tách khỏi "Chart = fact tĩnh của 1 người" (đã ghi rõ ở design doc `decade` mục Bối
   cảnh, xem `src/chart/types.ts` dòng 120-133 comment gốc trên `LuckCycles`).
2. **`LuuNienPalace` không có cấu trúc `major_stars`/`minor_stars`/`adjective_stars`/`sihua`
   như `ChartPalace`** — chỉ có 1 mảng phẳng `stars: { star_id: string }[]`. Đây KHÔNG phải
   giới hạn kỹ thuật của `iztro`, mà đúng bản chất tri thức Tử Vi: 14 chính tinh chỉ được an 1
   lần theo Cục, cố định suốt đời — không có khái niệm "chính tinh lưu niên" để phân loại.
   Chỉ phụ tinh/tạp diệu mới "lưu" theo năm (Lưu Kình Dương, Lưu Đà La, Lưu Lộc Tồn...).

Vì (2), mẫu hình "trỏ `evalCondition` vào 1 `ChartPalace` khác" (đã dùng cho `decade` và
`palace_relationship`) **không áp dụng trực tiếp được** — `evalCondition` cần 1 `ChartPalace`
thật để `resolveField()` phân loại theo `ChartField`, nhưng `LuuNienPalace` không có cấu trúc
đó. Ép `LuuNienPalace` có thêm `major_stars: []` (luôn rỗng vĩnh viễn) để tái dùng `evalCondition`
sẽ là "ép cấu trúc dữ liệu khớp code, dù không khớp thực tế tri thức" — đúng loại lỗi dự án đã
tránh nhiều lần (Tuần/Triệt, Tứ Hóa). Chọn hướng ngược lại: để cấu trúc dữ liệu phản ánh đúng
tri thức, chấp nhận `evaluateAnnualRule` không tái dùng `evalCondition` nguyên vẹn.

## 1. `ChartField` mở rộng — thêm `'luu_nien_stars'`

```ts
// src/rule/types.ts — CHANGES
export type ChartField =
  | 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type'
  | 'luu_nien_stars'; // MOI: doc LuuNienPalace.stars (mang phang, khong phan loai)
```

**Vì sao thêm giá trị mới thay vì tái dùng `'all_stars'`:** rủi ro không chỉ nằm ở tên gọi —
`'all_stars'` mang nghĩa cụ thể "hợp 3 mảng major+minor+adjective" ở mọi Condition khác. Nếu 1
Rule scope `annual` ghi `field: 'all_stars'`, người đọc Rule sau này (không nhìn evaluator) hoàn
toàn có thể hiểu lầm "cung Lưu Niên cũng chia 3 loại sao như cung tĩnh" — trong khi thực tế
không có khái niệm đó ở `LuuNienPalace`. Bỏ hẳn `field` (không kiểm tra) cũng không tốt hơn: về
bản chất, `Condition.field: ChartField` bắt buộc (TypeScript, không optional — `required: true`
cùng dòng suy nghĩ), nên vẫn cần 1 giá trị hợp lệ; dùng `'all_stars'` giả rồi lặng lẽ bỏ qua chỉ
là mã hóa "trường này vô nghĩa" bằng 1 enum sai ngữ cảnh — dễ gây hiểu lầm tĩnh hơn là thêm hẳn
1 giá trị đúng tên. **Đây là thay đổi additive nhỏ vào Rule Schema (thêm 1 enum value, không
sửa field/interface nào có sẵn)** — khác quyết định "không sửa Rule Schema" ở `decade`, vì ở đó
dữ liệu thực sự khớp `ChartPalace` sẵn có (không cần gì thêm); ở đây `LuuNienPalace` thực sự
không khớp cấu trúc đó — ép dùng field cũ mới là hành động "cố khớp cho gọn".

`evaluateAnnualRule` validate nghiêm: **throw nếu `Condition.field !== 'luu_nien_stars'`** khi
`rule.scope === 'annual'` — fail loud, bắt lỗi tác giả Rule gõ nhầm field (VD lỡ để
`major_stars` vì quen tay) ngay lúc evaluate, không âm thầm bỏ qua.

## 2. Chữ ký hàm — nhận `LuuNien` VÀ `branch` đã xác định sẵn (không tự suy luận gì)

```ts
export function evaluateAnnualRule(
  chart: Chart,
  luuNien: LuuNien,
  branch: Chart['palaces'][number]['branch'],
  rule: Rule,
): RuleEvalResult
```

**Quyết định 1:** nhận `LuuNien` đã build sẵn từ phía gọi, KHÔNG tự gọi lại `buildChart`/
`adaptLuuNien` bên trong (khác mẫu `evaluateRelationRule(input: BuildChartInput, ...)` đã dùng
cho `palace_relationship`).

**Quyết định 2 (sửa sau khi tự phát hiện mâu thuẫn nội tại — xem lịch sử revision):** `branch`
(cung cần tra Lưu Niên) cũng là tham số tường minh, KHÔNG mặc định cứng
`chart.menh_than.menh_branch` bên trong hàm. Bản thảo đầu tiên đã hard-code cung Mệnh, mâu thuẫn
trực tiếp với chính nguyên tắc "hàm thuần túy, không tự suy luận ngữ cảnh" vừa chốt cho
`LuuNien` — "cung nào cần tra" là quyết định của phía gọi (Tầng 2 sau này: domain "sức khỏe" →
tra cung Tật Ách, domain "công việc" → tra cung Quan Lộc, KHÔNG phải luôn là Mệnh), y hệt lý do
`relation`'s `RelationTarget` không hard-code 1 quan hệ cố định. Case Phạm Duy dùng cung Mệnh ở
Rule test mẫu (mục 6) chỉ vì đó là giá trị TRUYỀN VÀO lúc test, không phải giá trị mặc định
trong chữ ký hàm.

**Vì sao 2 mẫu hình khác nhau cùng tồn tại trong dự án — không phải thiếu nhất quán cần "dọn
cho giống nhau":**
- `relation-evaluator.ts` tự build vì quan hệ cung (tam hợp/xung chiếu) là dữ liệu cố định,
  rẻ để tính lại, không có ngữ cảnh "nhiều lần gọi cùng 1 input" trong 1 request.
- `decade`/`annual` nhận sẵn vì đây là dữ liệu có ngữ cảnh bên ngoài quyết định (tuổi hiện tại,
  hoặc năm được hỏi) và có khả năng dùng lại nhiều lần trong 1 request thật (Tầng 2 sau này:
  hỏi "công việc năm 2027" có thể match 5-10 Rule cùng lúc, cùng 1 `LuuNien` của năm 2027). Nếu
  mỗi Rule tự build lại `LuuNien` từ đầu (gọi lại `astrolabe.horoscope()`), đó là tính trùng lặp
  THẬT, không phải lý thuyết — khác `relation-evaluator.ts`, nơi mỗi lần gọi chỉ ứng với 1 quan
  hệ cố định tại thời điểm gọi.

Đây là 2 lý do khác nhau dẫn đến 2 lựa chọn khác nhau, đúng đắn riêng cho từng trường hợp.

**Trách nhiệm build `LuuNien` 1 lần rồi tái dùng cho nhiều Rule** thuộc về tầng gọi (Tầng 2/
`resolveQuery` sau này, KHÔNG nằm trong phạm vi phase này) — `evaluateAnnualRule` chỉ đảm bảo
KHÔNG tự build lại, không đảm bảo caller đã tối ưu đúng.

## 3. KHÔNG có guard chart-mismatch (khác `decade`) — giới hạn cấu trúc thật, không phải thiếu sót

`decade` có guard so `daiVan` với `chart.luck_cycles.dai_van` (3 field: `branch`+`age_from`+
`age_to`). `annual` **không có cách tương đương**:

- `LuuNien.year`/`heavenly_stem`/`earthly_branch` chỉ phụ thuộc **năm dương lịch** — giống hệt
  nhau cho MỌI lá số cùng 1 năm. Không có giá trị nào của `LuuNien` (tự thân) suy ra được nó
  "thuộc về" `Chart` nào.
- Cân nhắc thay thế: so `luuNien.palaces[i].branch` với `chart.palaces[i].branch` theo từng
  index (12 phần tử). **Đã xác minh bằng code thật (không chỉ suy luận): `chart.palaces[].branch`
  luôn theo 1 thứ tự CỐ ĐỊNH** (`Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi, Tý, Sửu`),
  giống hệt nhau bất kể lá số nào — chạy thử 2 lá số hoàn toàn khác nhau (nam 1998-12-17 và nữ
  1990-05-10) cho ra đúng 1 thứ tự branch giống hệt. Vì `LuuNienPalace[]` cũng được build theo
  cùng logic index (`astrolabe.palaces.map((p, i) => ...)`), guard so-branch-theo-index sẽ
  **luôn pass**, kể cả khi nhận nhầm `LuuNien` của 1 lá số hoàn toàn khác — vì thứ tự cấu trúc
  không phải giá trị đặc trưng của lá số, chỉ là hằng số sắp mảng.

**Kết luận: không viết guard giả (nghe hợp lý nhưng không bảo vệ gì thật).** Đây là giới hạn
cấu trúc dữ liệu thật, ghi vào Known Issues (mục 5), không phải thiếu sót của phase này.

## 4. Triển khai

```ts
// src/rule/annual-evaluator.ts
import { palaceOfBranch } from '../chart/queries.js';
import type { Chart, LuuNien } from '../chart/types.js';
import type { Rule, Condition, Modifier, Exception } from './types.js';
import type { RuleEvalResult } from './evaluator.js';

function resolveLuuNienStars(luuNien: LuuNien, branch: Chart['palaces'][number]['branch']): Set<string> {
  const palace = luuNien.palaces.find((p) => p.branch === branch);
  if (palace === undefined) {
    throw new Error(`evaluateAnnualRule: khong tim thay cung "${branch}" trong LuuNien.palaces.`);
  }
  return new Set(palace.stars.map((s) => s.star_id));
}

function evalAnnualCondition(luuNien: LuuNien, branch: Chart['palaces'][number]['branch'], condition: Condition): boolean {
  if (condition.field !== 'luu_nien_stars') {
    throw new Error(
      `evaluateAnnualRule: Condition.field phai la "luu_nien_stars" cho scope "annual", ` +
      `nhan duoc "${condition.field}".`,
    );
  }
  const values = resolveLuuNienStars(luuNien, branch);
  // Tai dung dung logic operator da co trong evaluator.ts — KHONG viet lai contains/in/...
  // (chi tiet ham dung chung nao se quyet dinh trong implementation plan: export evalOperator
  // hoac tuong duong, cung tinh than Task 1 cua v0.2 da export evalExceptionConditions).
  if (condition.operator === 'contains') return values.has(condition.value);
  if (condition.operator === 'not_contains') return !values.has(condition.value);
  if (condition.operator === 'equals') return values.size === 1 && values.has(condition.value);
  if (condition.operator === 'in') return condition.value.split(',').some((v) => values.has(v));
  return !condition.value.split(',').some((v) => values.has(v)); // not_in
}

/**
 * Evaluator rieng cho scope annual. KHONG tai dung evalCondition/evalModifier nguyen ven
 * (khac decade) — vi LuuNienPalace khong co cau truc major_stars/minor_stars/adjective_stars
 * nhu ChartPalace (dung ban chat tri thuc: chinh tinh khong "luu" theo nam). Xem design doc
 * muc 1. Ham THUAN TUY: nhan CA LuuNien LAN branch da xac dinh san tu phia goi, khong tu suy
 * luan "cung nao can tra" ben trong — dung nguyen tac da giu nhat quan o muc 2 (khong tu build
 * lai LuuNien) va o decade (khong tu chon Dai Van). "Cung nao" la quyet dinh cua phia goi (VD
 * Tang 2 sau nay: domain "suc khoe" -> tra cung Tat Ach, domain "cong viec" -> tra cung Quan
 * Loc — KHONG phai luon la Menh). Rule test mau (muc 6) dung cung Menh cho case Pham Duy chi vi
 * do la gia tri truyen vao luc test, KHONG phai gia tri mac dinh trong evaluator.
 */
export function evaluateAnnualRule(
  chart: Chart,
  luuNien: LuuNien,
  branch: Chart['palaces'][number]['branch'],
  rule: Rule,
): RuleEvalResult {
  if (rule.scope !== 'annual') {
    throw new Error(
      `evaluateAnnualRule chi xu ly scope "annual", nhan duoc "${rule.scope}"`,
    );
  }

  // KHONG co guard chart-mismatch — xem design doc muc 3 (khong co tieu chi that o tang du lieu
  // nay de phan biet LuuNien thuoc lá so nao). Trach nhiem dam bao Chart+LuuNien khop nhau
  // thuoc ve phia goi (build ca 2 tu CUNG 1 input trong CUNG 1 request).
  //
  // Tham so `chart` hien khong duoc dung truc tiep trong than ham (branch da truyen san,
  // khong can palaceOfBranch(chart, ...) nhu decade) — giu lai trong chu ky ham de nhat quan
  // voi cac evaluator khac (deu nhan Chart dau tien) va de danh cho viec kiem tra sau nay neu
  // can (VD validate branch hop le). Implementation plan xac nhan lai co thuc su can `chart`
  // hay co the bo tham so nay — khong quyet ngam, ghi ro neu bo.

  const matched = rule.conditions.every((c) => evalAnnualCondition(luuNien, branch, c));
  const matched_modifiers = rule.modifiers.filter((m) => {
    if (m.field === 'branch') {
      // Modifier field 'branch' kiem tra branch DUOC TRUYEN VAO (khong con ngam dinh la Menh
      // nhu ban thao truoc) co khop danh sach mong muon hay khong — VD 1 Rule annual muon
      // modifier chi ap dung khi dang tra cuu tai 1 vai cung cu the.
      return branch === m.value || m.value.split(',').includes(branch);
    }
    return evalAnnualCondition(luuNien, branch, m as Condition);
  });
  const triggered_exceptions = rule.exceptions.filter((e: Exception) =>
    e.conditions.every((c) => evalAnnualCondition(luuNien, branch, c)),
  );

  return { rule_id: rule.rule_id, matched, matched_modifiers, triggered_exceptions };
}
```

**Lưu ý implementation plan cần làm rõ (không phải quyết định thiết kế):**
- `evalAnnualCondition`'s operator logic trùng lặp với `evalOperator` (private, trong
  `evaluator.ts`) — cân nhắc export `evalOperator` (giống Task 1 của v0.2 export
  `evalExceptionConditions`) thay vì viết lại 5 nhánh if/else lần 2. Quyết định cụ thể ở
  implementation plan.
- Tham số `chart` trong `evaluateAnnualRule` hiện không được dùng trực tiếp trong thân hàm sau
  khi `branch` trở thành tham số tường minh (xem comment trong code mẫu) — implementation plan
  xác nhận lại có thực sự cần giữ tham số này hay có thể bỏ, không quyết ngầm lúc code.

## 5. Ngoài phạm vi (Known Issues)

- **[MỞ, phát hiện lúc verify số liệu thật cho Rule test mẫu] Ý nghĩa `branch` mơ hồ giữa "địa
  chi cố định của lá số gốc" và "địa chi mà Lưu Niên xoay tới mang tên đó".** Chạy thử
  `Chart.luu_nien` cho case Phạm Duy, `view_year: '2026-01-01'`: cung Mệnh GỐC
  (`chart.menh_than.menh_branch = 'Hoi'`) và cung mang `palace_name: 'Mệnh'` theo Lưu Niên 2026
  (`branch: 'Ty2'`) là 2 địa chi KHÁC NHAU — đúng bản chất "vòng Lưu Niên xoay theo năm xem" đã
  ghi trong comment `LuuNienPalace.palace_name`. Vậy "xem Mệnh năm nay" có thể mang 2 nghĩa Tử
  Vi khác nhau: (a) tra sao lưu tại ĐÚNG địa chi Mệnh gốc (Hợi) — cách đọc phổ biến, không cần
  tính thêm Lưu Thái Tuế; (b) tra sao lưu tại địa chi mà vòng Lưu Niên GỌI LÀ "Mệnh" năm đó
  (Tỵ2) — đã tra cứu nhanh: nguồn tham khảo theo hệ Trung Châu/Tam Hợp Phái (trường phái dự án
  chọn làm nền, xem build spec) nghiêng về cách (b) khi luận vận hạn năm, nhưng nguồn khác gợi
  ý cả 2 khái niệm cùng tồn tại song song trong thực hành — CHƯA đủ nguồn tin cậy (mới ở tier
  diễn đàn/blog) để chốt 1 cách là "đúng". **Quyết định v0.3:** `evaluateAnnualRule`'s tham số
  `branch` nhận thẳng kiểu `Branch`, KHÔNG ràng buộc theo 1 cách hiểu nào — phía gọi (Rule test,
  hoặc Tầng 2 sau này) tự quyết định truyền địa chi cố định hay địa chi xoay theo Lưu Niên. Rule
  test mẫu (mục 6) dùng `Hoi` (cố định) cho mục đích verify code chạy đúng kỹ thuật, KHÔNG phải
  khẳng định đây là cách đọc Tử Vi "đúng" — ghi rõ trong comment test. Đây là ứng viên tốt cho
  vòng structured hóa tri thức tiếp theo (encode như 1 Rule/quyết định trường phái thật, có
  Source) khi có thời gian, KHÔNG tự quyết ngầm trong evaluator.
- **[MỞ, phát hiện chung cho cả `decade` VÀ `annual`] Không có tiêu chí nào ở tầng dữ liệu hiện
  tại (`Chart`, `DaiVan`, `LuuNien`) để xác minh 1 object dữ liệu thực sự thuộc về lá số nào.**
  `decade`: 2 lá số khác nhau CÙNG Cục cho `DaiVan` giống hệt cả 3 field guard so sánh (branch+
  age_from+age_to) — guard hiện có không phân biệt được (đã ghi trong design doc `decade` mục
  Known Issues, phát hiện lúc final review). `annual`: `LuuNien` của 1 năm giống hệt nhau cho
  mọi lá số ở tầng giá trị (year/heavenly_stem/earthly_branch), còn thứ tự cấu trúc
  (`palaces[i].branch`) luôn cố định bất kể lá số — không viết được guard nào có tác dụng thật
  (mục 3). Cả 2 phát hiện CÙNG 1 nguyên nhân gốc: thiếu 1 trường định danh lá số tường minh
  (VD `chart_id`) trên các object dữ liệu dẫn xuất (`DaiVan`, `LuuNien`). Giải pháp đúng gốc —
  thêm `chart_id` vào Chart Data Shape — phạm vi lớn hơn 1 evaluator, cần brainstorm riêng khi
  bắt đầu thiết kế Tầng 2/`resolveQuery` (nơi rủi ro này mới thực sự phát sinh: nhiều Chart,
  nhiều Rule, nhiều request đan xen). KHÔNG vá lẻ tẻ ở từng evaluator mỗi lần gặp.
- **[MỞ, cố ý hoãn] Chưa phân loại chi tiết hơn cho `luu_nien_stars`.** `LuuNienPalace.stars`
  hiện là 1 mảng phẳng — không phân biệt "sao lưu chính" (Lưu Lộc Tồn, Lưu Kình Dương...) với
  loại khác nếu `iztro` có phân loại sâu hơn trong tương lai. v0.3 chấp nhận độ chi tiết hiện
  có, không tự suy diễn thêm phân loại không có nguồn.
- **Tầng 2 (domain-mapping + `resolveQuery`) phụ thuộc vào CẢ `decade` và `annual`.** Với
  `annual` xong, Tầng 2 mới có đủ 2 khối evaluator cần để trả lời câu hỏi có tính thời gian
  (VD "công việc 2027-2029" cần cả Đại Vận lẫn Lưu Niên của các năm trong khoảng đó).
  `resolveQuery`/domain-mapping vẫn KHÔNG nằm trong phạm vi phase này.

## 6. Testing

- `test/rule/annual-evaluator.test.ts`: dùng case Phạm Duy thật, Rule TEST-ONLY (không thêm
  vào `knowledge-base.ts`, theo đúng convention `TEST_ONLY_*` đã dùng ở `relation-evaluator
  .test.ts`/`decade-evaluator.test.ts`).

  **Số liệu thật đã verify lúc soạn design doc này** (`buildChart` case Phạm Duy,
  `view_year: '2026-01-01'`): `chart.luu_nien.year === 2026`. `chart.luu_nien.palaces` gồm:

  ```
  Dan (Tử Nữ):    LUU_DA_LA
  Mao (Phu Thê):   LUU_LOC_TON
  Thin (Huynh Đệ): LUU_KINH_DUONG, LUU_THIEN_HY
  Ty2 (Mệnh — theo Lưu Niên): NIEN_GIAI
  Ngo (Phụ Mẫu):   LUU_VAN_XUONG
  Mui (Phúc Đức):  (không có sao)
  Than (Điền Trạch): LUU_THIEN_VIET, LUU_VAN_KHUC
  Dau (Quan Lộc):  (không có sao)
  Tuat (Nô Bộc):   LUU_HONG_LOAN
  Hoi (Thiên Di — theo Lưu Niên; = Mệnh GỐC): LUU_THIEN_MA
  Ty (Tật Ách):    LUU_THIEN_KHOI
  Suu (Tài Bạch):  (không có sao)
  ```

  **Chọn `branch: 'Hoi'`** (Mệnh gốc, `chart.menh_than.menh_branch`) cho Rule test chính —
  KHÔNG phải khẳng định đây là cách đọc Tử Vi "đúng" (xem mục 5, Known Issues mới), chỉ vì đây
  là giá trị cố định, không cần tính thêm Lưu Thái Tuế, đơn giản nhất để verify code chạy đúng
  kỹ thuật. Ghi rõ comment này trong test. Tại `Hoi`: có `LUU_THIEN_MA` — dùng làm sao test
  `matched: true`. **Cung thứ 2 để test `branch` là tham số hoạt động thật:** `Ty` (Tật Ách),
  có `LUU_THIEN_KHOI` — khác `Hoi` hoàn toàn, xác nhận `matched` đổi khi `branch` đổi. **Cung
  test `matched: false`:** `Suu` (Tài Bạch), không có sao nào — Rule tìm `LUU_THIEN_MA` tại
  `Suu` sẽ `matched: false`.

- Assert bắt buộc:
  - `evaluateAnnualRule` throw khi `rule.scope !== 'annual'`.
  - `evalAnnualCondition` (hoặc qua `evaluateAnnualRule`) throw khi `Condition.field !==
    'luu_nien_stars'` cho scope `annual` — test riêng cho lỗi gõ nhầm field.
  - `matched: true` khi tra tại `Hoi` (có `LUU_THIEN_MA`).
  - `matched: false` khi tra tại `Suu` (không có sao nào, dùng CÙNG Rule tìm `LUU_THIEN_MA`).
  - `matched_modifiers`/`triggered_exceptions` đánh giá đúng qua `evalAnnualCondition`, không
    lẫn với `evalCondition` gốc.
  - Truyền `branch: 'Hoi'` và `branch: 'Ty'` cho CÙNG 1 `luuNien`, 1 Rule tìm `LUU_THIEN_MA`
    (chỉ có ở `Hoi`) hoặc `LUU_THIEN_KHOI` (chỉ có ở `Ty`) — xác nhận kết quả khác nhau giữa 2
    lần gọi, chứng minh evaluator thực sự đọc theo `branch` tham số.
  - Truyền 2 `branch` khác nhau (VD Mệnh và Tật Ách) cho CÙNG 1 `luuNien`, xác nhận kết quả
    `matched` có thể khác nhau giữa 2 lần gọi — chứng minh evaluator thực sự đọc theo `branch`
    tham số, không hard-code 1 cung cố định nào bên trong.
