# Rule Engine v0.2 — Hỗ trợ scope `decade` — Design Spec

**Ngày:** 2026-08-19
**Phạm vi:** Thêm evaluator cho `RuleScope: 'decade'` (Đại Vận) — hiện đã khai trong enum nhưng
`evaluateRule()` throw ngay khi gặp. KHÔNG bao gồm: scope `annual` (Lưu Niên — tách riêng hoàn
toàn, xem mục 5), domain-mapping/`resolveQuery` (Tầng 2, phụ thuộc vào phase này nhưng không
nằm trong phạm vi), sao "vận" riêng (Vận Đà/Vận Lộc...), mở rộng `ChartField`/Rule Schema.

## Bối cảnh — vì sao tách phase này

Trong lúc brainstorm Tầng 2 (LLM Đào sâu theo domain+thời điểm), phát hiện: `RuleScope` đã khai
`'decade'`/`'annual'` từ Phase 3 nhưng chưa từng có evaluator nào xử lý — bất kỳ Rule nào dùng 2
scope này sẽ throw ngay tại `evaluateRule()`. Không có Rule nào trong KB hiện tại (2 Entry mẫu,
đều scope `star_combination`) dùng 2 scope này, nên khoảng trống chưa từng bị phát hiện.

Đọc kỹ hơn phát hiện `decade` và `annual` có độ phức tạp khác hẳn nhau:
- `decade` (Đại Vận): dữ liệu tĩnh, đã có sẵn trong `Chart.luck_cycles.dai_van: DaiVan[]`.
- `annual` (Lưu Niên): dữ liệu DẪN XUẤT theo năm được hỏi, cố ý KHÔNG nằm trong `Chart`
  (xem comment tại `src/chart/types.ts` dòng 120-133 — "Chart = fact tĩnh của 1 người" không
  được lẫn với dữ liệu phụ thuộc năm tra cứu). Cần 1 evaluator nhận `view_year` làm tham số
  ngoài `Chart`, thiết kế riêng, phức tạp hơn nhiều — tách hoàn toàn khỏi phase này.

Do độ phức tạp lệch nhau nhiều, và để giữ mỗi phase tự đứng vững/tự test được (không phụ thuộc
Tầng 2/LLM), quyết định: **phase này CHỈ làm `decade`**. `annual` là 1 mục Known Issues, không
đánh số version chung với phase này (tránh hiểu nhầm "xong v0.2 = annual cũng xong").

## 1. Cách tiếp cận — tái dùng, không thêm field

Đọc `src/rule/relation-evaluator.ts` (evaluator hiện có cho scope `palace_relationship`) cho
thấy đúng mẫu hình cần tái dùng: **không sửa `ChartField`/`evalCondition`**, mà viết 1 evaluator
mới **trỏ `evalCondition` (đã có) vào một `ChartPalace` khác** — cụ thể là cung mà Đại Vận đang
xét rơi vào (`DaiVan.branch`), thay vì cung được truyền trực tiếp vào `evaluateRule()`.

Điều này có nghĩa: `decade` **không cần mở rộng Rule Schema/`ChartField`** — Condition vẫn dùng
đúng 5 giá trị `ChartField` hiện có (`major_stars`, `minor_stars`, `adjective_stars`,
`all_stars`, `sihua_type`), chỉ khác là được đánh giá trên cung mà Đại Vận trỏ tới.

**Kỹ thuật đọc Đại Vận dùng ở v0.2:** chính/phụ tinh BẢN MỆNH tại cung mà Đại Vận đang chạy rơi
vào (kỹ thuật đọc Đại Vận cơ bản, phổ biến nhất trong thực hành) — KHÔNG dùng "sao vận" riêng
(Vận Đà, Vận Lộc, Vận Xương...), vì các sao này chỉ tồn tại tạm thời trong
`astrolabe.horoscope()`, chưa persist vào Chart Data Shape. Đây là kỹ thuật đọc Đại Vận nâng cao
hơn, hoãn có ý thức — xem mục 5.

## 2. Chữ ký hàm — thuần túy, không tự suy luận "Đại Vận nào"

```ts
export function evaluateDecadeRule(chart: Chart, daiVan: DaiVan, rule: Rule): RuleEvalResult
```

**Quyết định quan trọng:** hàm nhận `DaiVan` đã xác định sẵn (không tự tìm theo tuổi bên
trong). Lý do:
- Việc "tuổi X → Đại Vận nào" đã giải xong ở Tầng 1 (`astrolabe.horoscope().decadal` +
  `astrolabe.decadalList()`, đã verify khớp thực tế 29 tuổi cho case Phạm Duy). Không viết lại
  logic này lần 2 trong evaluator — tránh 2 đường tính cùng 1 thứ ở 2 nơi khác nhau, có thể tự
  mâu thuẫn nếu 1 bên sửa mà bên kia quên.
- Hàm thuần túy: "Đại Vận hiện tại" (Tầng 1) hay "Đại Vận user chọn xem" (Tầng 2 sau này) là
  quyết định của phía GỌI hàm, không rò rỉ vào logic evaluator — đúng ranh giới sạch, tái dùng
  được cho cả 2 ngữ cảnh mà không cần sửa `evaluateDecadeRule` sau này.

## 3. Triển khai

```ts
// src/rule/decade-evaluator.ts
import { palaceOfBranch } from '../chart/queries.js';
import type { Chart, DaiVan } from '../chart/types.js';
import { evalCondition, evalModifier, type RuleEvalResult } from './evaluator.js';
import type { Rule } from './types.js';

export function evaluateDecadeRule(chart: Chart, daiVan: DaiVan, rule: Rule): RuleEvalResult {
  if (rule.scope !== 'decade') {
    throw new Error(
      `evaluateDecadeRule chi xu ly scope "decade", nhan duoc "${rule.scope}"`,
    );
  }
  // Fail loud neu daiVan khong khop bat ky entry nao trong chinh chart.luck_cycles.dai_van
  // cua chart nay — tranh evaluate im lang tren du lieu treo lo lung (VD Tang 2 sau nay tu
  // resolveQuery lo truyen nham DaiVan cua 1 la so khac, hoac object tu tao sai branch). So
  // theo branch + age_from + age_to (khong dung reference identity — caller co the hop le
  // clone object), khop dung tinh than "fail loud" da ap dung cho loi API key/calendar_type.
  const belongsToChart = chart.luck_cycles.dai_van.some(
    (d) => d.branch === daiVan.branch && d.age_from === daiVan.age_from && d.age_to === daiVan.age_to,
  );
  if (!belongsToChart) {
    throw new Error(
      `evaluateDecadeRule: daiVan (branch=${daiVan.branch}, age_from=${daiVan.age_from}, ` +
      `age_to=${daiVan.age_to}) khong khop entry nao trong chart.luck_cycles.dai_van cua chart ` +
      `nay — co the dang truyen nham DaiVan cua 1 chart khac.`,
    );
  }
  const targetPalace = palaceOfBranch(chart, daiVan.branch);
  const matched = rule.conditions.every((c) => evalCondition(targetPalace, c));
  const matched_modifiers = rule.modifiers.filter((m) => evalModifier(targetPalace, m));
  const triggered_exceptions = rule.exceptions.filter((e) =>
    e.conditions.every((c) => evalCondition(targetPalace, c)),
  );
  return { rule_id: rule.rule_id, matched, matched_modifiers, triggered_exceptions };
}
```

Tái dùng `evalCondition`/`evalModifier` từ `evaluator.ts` nguyên vẹn (giống
`relation-evaluator.ts` đã làm), không viết lại logic đọc sao từ `ChartPalace` lần 2.

**Vì sao guard này không phá nguyên tắc "hàm thuần túy, không tự suy luận Đại Vận nào" (mục 2):**
guard KHÔNG tự chọn/tìm Đại Vận nào — nó chỉ xác minh `daiVan` được truyền vào THẬT SỰ thuộc về
`chart` được truyền vào (2 tham số phải nhất quán với nhau), không quyết định thay caller "Đại
Vận nào nên dùng". Phía gọi vẫn hoàn toàn tự do chọn "hiện tại" hay "năm được hỏi" — guard chỉ
chặn trường hợp 2 tham số đến từ 2 nguồn không liên quan.

**Lưu ý:** `evalExceptionConditions` trong `evaluator.ts` hiện là hàm private (không export) —
implementation plan cần hoặc export nó, hoặc lặp lại 1 dòng `.every(evalCondition)` như trên
(1 trong 2 cách, quyết định cụ thể ở implementation plan, không phải quyết định thiết kế).

## 4. Rule test mẫu — bắt buộc, không chỉ "compile được"

Để xác nhận scope `decade` THẬT SỰ dùng được (không chỉ đúng kiểu dữ liệu), cần ít nhất 1 Rule
test mẫu chạy qua case Phạm Duy thật, viết theo đúng Rule Schema hiện có:

```ts
// Vi du CHI DE TEST scope decade — KHONG dua vao KNOWLEDGE_BASE that (build spec muc 13:
// khong tu y viet Rule ngoai Entry mau da duyet). Dat trong test/rule/decade-evaluator.test.ts,
// khong dat trong src/rule/knowledge-base.ts.
const TEST_RULE_DECADE: Rule = {
  rule_id: 'TEST_DECADE_THIEN_DONG',
  conflict_group_id: null,
  scope: 'decade',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: { text: 'Test rule — khong dung that.', valence: 'trung_tinh', magnitude: 'nhe' },
  school: 'test',
  sources: [],
  consensus: 'cao',
  notes: 'Chi dung de verify evaluateDecadeRule hoat dong dung, khong phai Rule that.',
};
```

Case Phạm Duy đã verify (từ Tầng 1 design doc, và xác nhận lại bằng script thật lúc soạn spec
này): `chart.luck_cycles.dai_van` có 12 entry tĩnh, trong đó entry tuổi 2-11 (`age_from: 2,
age_to: 11`) có `branch: 'Hoi'`, và entry tuổi 22-31 (bao gồm tuổi hiện tại 29) có `branch:
'Suu'`. Cung Hợi (Mệnh) CÓ Thiên Đồng; cung Sửu (Phúc Đức) có Thái Dương + Thái Âm, KHÔNG có
Thiên Đồng. Test lấy CẢ HAI entry này TRỰC TIẾP từ `chart.luck_cycles.dai_van` (không tự tạo
object giả lập nữa — guard mới ở mục 3 sẽ throw nếu `daiVan` không khớp entry thật của chart):

```ts
const daiVanTaiHoi = chart.luck_cycles.dai_van.find((d) => d.branch === 'Hoi')!; // tuoi 2-11
const daiVanTaiSuu = chart.luck_cycles.dai_van.find((d) => d.branch === 'Suu')!; // tuoi 22-31, gom tuoi 29
```

`evaluateDecadeRule(chart, daiVanTaiHoi, TEST_RULE_DECADE)` → `matched: true` (Hợi có Thiên
Đồng). `evaluateDecadeRule(chart, daiVanTaiSuu, TEST_RULE_DECADE)` → `matched: false` (Sửu
không có Thiên Đồng). 2 case này (matched:true và matched:false, cùng 1 Rule, khác Đại Vận trỏ
tới, cả hai đều là entry thật) đủ để xác nhận evaluator dùng đúng cung đích, không lẫn với cung
được truyền trực tiếp — đồng thời tự động đi qua guard mới mà không cần entry giả lập riêng.

## 5. Ngoài phạm vi (Known Issues)

- **[MỞ, cố ý tách riêng — ĐÃ CHUYỂN THÀNH v0.3] Scope `annual` (Lưu Niên).** Thiết kế đầy đủ
  tại `docs/superpowers/specs/2026-08-19-rule-engine-v03-annual-design.md`. Xác nhận lúc thiết
  kế v0.3: không tái dùng nguyên vẹn `evalCondition` được (khác dự đoán ban đầu ở đây) — vì
  `LuuNienPalace` không có cấu trúc `major_stars`/`minor_stars`/`adjective_stars` như
  `ChartPalace` (đúng bản chất tri thức: chính tinh không "lưu" theo năm), cần thêm 1 giá trị
  `ChartField` mới (`'luu_nien_stars'`) và 1 evaluator riêng không qua `evalCondition`.
- **[MỞ, cố ý hoãn] Sao "vận" riêng (Vận Đà, Vận Lộc, Vận Xương...).** v0.2 chỉ dùng chính/phụ
  tinh BẢN MỆNH tại cung Đại Vận đang chạy — không dùng các sao "vận" tạm thời trong
  `horoscope()`, vì chưa persist vào Chart Data Shape. Đây là kỹ thuật đọc Đại Vận nâng cao,
  hợp lệ nhưng hoãn có ý thức — nếu cần sau này, đòi hỏi mở rộng `Chart Data Shape` (đụng vào
  `DaiVan` interface), phạm vi lớn hơn 1 evaluator đơn thuần.
- **[GHI NHỚ cho thiết kế Tầng 2 sau, KHÔNG xử lý ở đây]** Cùng 1 dữ liệu vật lý (VD "Thiên
  Đồng tại cung X") có thể đọc qua 2 lăng kính khác nhau: `scope: star_palace` (đặc điểm cố
  định, thuộc bản chất suốt đời) và `scope: decade` (ý nghĩa riêng cho giai đoạn Đại Vận này) —
  cùng điều kiện, khác `conclusion.text`. Khi thiết kế Evidence Pack cho Tầng 2, cần đảm bảo LLM
  phân biệt được 2 loại interpretation này khi trình bày ("đặc điểm bản chất của bạn" khác hẳn
  "trong giai đoạn này"). Không liên quan phase v0.2 (thuần code, chưa đụng LLM) — chỉ ghi lại
  để không quên khi tới lúc.
- **[GHI NHỚ, phát hiện lúc review cuối] Guard `evaluateDecadeRule` không phân biệt được 2
  `Chart` khác nhau CÙNG Cục.** Guard so `daiVan` với `chart.luck_cycles.dai_van` qua 3 field
  (`branch`+`age_from`+`age_to`) — nhưng 3 field này là hàm thuần túy của Cục (`cuc_so`) và
  hướng khởi Đại Vận, KHÔNG phụ thuộc ngày sinh cụ thể của người đó. Reviewer đã dựng phản ví dụ
  thật: 2 lá số khác nhau (nữ sinh 1990-05-10 và nam sinh 1985-03-15), cùng Cục Thổ Ngũ Cục, cho
  ra `DaiVan` giống hệt nhau ở cả 3 field được guard so sánh (`branch: 'Hoi', age_from: 5,
  age_to: 14`). Nếu 1 caller tương lai (VD `resolveQuery` của Tầng 2) lỡ trộn nhầm `Chart`/
  `DaiVan` của 2 người khác nhau CÙNG Cục, guard sẽ KHÔNG bắt được — vì `DaiVan` tự thân không
  mang thông tin định danh lá số (`chart_id`), không có tổ hợp field nào của nó phân biệt được
  "chart nào". Đây không phải lỗi của v0.2 (guard vẫn đúng mục đích thiết kế: xác nhận 2 tham số
  truyền cùng lúc nhất quán với nhau — mục 3 đã ghi rõ "2 tham số phải nhất quán với nhau",
  không tuyên bố "duy nhất toàn cục"), và hiện chưa có caller nào trong codebase khai thác được
  lỗ hổng này (Tầng 2 chưa tồn tại). Cần ghi nhớ khi thiết kế `resolveQuery`: caller đó nên tự
  truyền/kiểm tra định danh lá số (VD `chart_id`) một cách tường minh, không dựa vào guard này
  làm tuyến phòng thủ duy nhất chống trộn nhầm `Chart`. **Cập nhật:** thiết kế v0.3 (`annual`)
  xác nhận đây là 1 nguyên nhân gốc chung — `LuuNien` cũng không có cách phân biệt across-chart
  nào (thậm chí không viết được guard nào có tác dụng thật, khác `decade` còn viết được guard
  tuy có giới hạn). Xem `2026-08-19-rule-engine-v03-annual-design.md` mục 5 — gộp chung thành 1
  Known Issue: cần `chart_id` tường minh trong Chart Data Shape, brainstorm riêng lúc thiết kế
  Tầng 2/`resolveQuery`, không vá lẻ tẻ ở từng evaluator.
- **Tầng 2 (domain-mapping + `resolveQuery`) phụ thuộc vào phase này.** Phase v0.2 phải xong và
  có test pass trước khi domain-mapping/`resolveQuery` của Tầng 2 có ý nghĩa thực tế — nếu
  không có Rule nào dùng được scope `decade`, `resolveQuery` dù đúng cũng không trả về
  interpretation nào theo Đại Vận. `resolveQuery`/domain-mapping KHÔNG nằm trong phạm vi phase
  này.

## 6. Testing

- `test/rule/decade-evaluator.test.ts`: dùng case Phạm Duy thật (`buildChart` với input đã
  verify), Rule test mẫu (mục 4). Assert:
  - `evaluateDecadeRule` throw khi `rule.scope !== 'decade'` (nhất quán với
    `evaluateRelationRule`'s guard).
  - `evaluateDecadeRule` throw khi `daiVan` KHÔNG khớp entry nào trong
    `chart.luck_cycles.dai_van` của chính `chart` đó — dùng 1 object `DaiVan` tự tạo với
    `branch`/`age_from`/`age_to` không trùng bất kỳ entry thật nào (VD `age_from: 999`) để kích
    hoạt guard mới (mục 3). Đây là test bắt buộc cho phần "fail loud" — không được bỏ qua.
  - Khi `daiVan` là entry thật của Hợi (tuổi 2-11, lấy trực tiếp từ
    `chart.luck_cycles.dai_van`) → `matched: true` (Hợi có Thiên Đồng).
  - Khi `daiVan` là entry thật của Sửu (tuổi 22-31, gồm tuổi hiện tại 29) → `matched: false`
    (Sửu không có Thiên Đồng).
  - `matched_modifiers`/`triggered_exceptions` (nếu Rule test có) được đánh giá đúng trên cung
    đích, không phải cung gốc theo `branch` truyền trực tiếp (khác `evaluateRule` thường).
