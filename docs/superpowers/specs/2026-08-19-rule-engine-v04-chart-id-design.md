# Rule Engine v0.4 — `chart_id` cho `DaiVan`/`LuuNien` — Design Spec

**Ngày:** 2026-08-19
**Phạm vi:** Thêm `chart_id: string` vào `DaiVan` và `LuuNien`, truyền đúng giá trị từ
`Chart.chart_id` đã tính sẵn (không tính lại công thức ở nơi khác), nâng cấp guard trong
`evaluateDecadeRule`/`evaluateAnnualRule` để so `chart_id` thay vì so field-theo-field. KHÔNG
bao gồm: `resolveQuery`/domain-mapping (Tầng 2 thật, chờ phase này xong), sao "vận"/"lưu" phân
loại chi tiết hơn, phân biệt ý nghĩa `branch` cố định/xoay (Known Issue riêng, chưa xử lý).

## Bối cảnh — vì sao tách phase này

Rule Engine v0.2 (`decade`) và v0.3 (`annual`) đều ghi Known Issue giống nhau: guard xác minh
`DaiVan`/`LuuNien` "thuộc lá số nào" hiện chỉ so theo giá trị field (branch+age_from+age_to cho
decade), và cả 2 lần đều bị chứng minh là "guard giả" — final review của v0.2 dựng phản ví dụ
thật (2 lá số khác nhau CÙNG Cục cho `DaiVan` giống hệt cả 3 field), còn v0.3 xác nhận `LuuNien`
hoàn toàn không có cách nào so sánh theo giá trị (year/heavenly_stem/earthly_branch giống hệt
mọi lá số cùng năm; branch ordering là hằng số cấu trúc).

Đọc lại code phát hiện: `Chart.chart_id` **đã tồn tại từ trước** (Phase 2/4,
`src/chart/adapter.ts:153`, sinh từ `solarDate + time_index + gender`) — không phải trường
thiếu cần thêm mới vào `Chart`. Vấn đề thật hẹp hơn: `DaiVan`/`LuuNien` không mang `chart_id`
này để đối chiếu, dù giá trị đã tính sẵn ngay trong cùng hàm `adaptFromIztro`.

**Quyết định tách phase:** đây là 2 loại rủi ro khác hẳn nhau, không nên gộp cùng
`resolveQuery`/domain-mapping (Tầng 2 thật):
- Refactor `chart_id` là rủi ro **hồi quy** — đụng vào Chart Engine đã ổn định (117/117 test),
  có thể vô tình làm hỏng thứ đang chạy đúng.
- `resolveQuery` là rủi ro **thiết kế mới** — chưa có gì để hồi quy, chỉ có đúng/sai về ý tưởng.

Gộp 2 việc sẽ khó tách bạch nguồn gốc lỗi nếu review sau này phát hiện vấn đề. Tách riêng cũng
cho phase này 1 điểm hoàn thành rõ ràng: đóng dứt điểm Known Issue đã treo qua 2 design doc,
trước khi nó trôi tiếp sang phase thứ 3.

## 1. Mở rộng `DaiVan`/`LuuNien`

```ts
// src/chart/types.ts — CHANGES
export interface DaiVan {
  chart_id: string; // MOI — de doi chieu voi Chart.chart_id, xem Rule Engine v0.2's guard
  age_from: number;
  age_to: number;
  branch: Branch;
  stem: string;
  palace_name: string;
}

export interface LuuNien {
  chart_id: string; // MOI — cung ly do tren
  year: number;
  heavenly_stem: string;
  earthly_branch: string;
  mutagen: string[];
  palaces: LuuNienPalace[];
}
```

`chart_id` đặt là field ĐẦU TIÊN trong mỗi interface (khớp quy ước `Chart.chart_id` cũng đứng
đầu) — thuần phong cách, không ảnh hưởng runtime.

**Không thêm `chart_id` vào `LuuNienPalace`/`TieuVan`** — cả 2 đều chỉ dùng nội bộ trong
`LuuNien`/`Chart.luck_cycles`, không có evaluator nào nhận riêng lẻ `LuuNienPalace`/`TieuVan` mà
cần đối chiếu độc lập (khác `DaiVan`, được `evaluateDecadeRule` nhận trực tiếp làm tham số).

## 2. Refactor `adaptFromIztro` — tính `chart_id` một lần, truyền xuống

**Nguyên tắc bắt buộc:** `chart_id` gán cho `DaiVan`/`LuuNien` phải COPY từ giá trị đã tính sẵn
cho `Chart`, KHÔNG tự tính lại công thức `solarDate+time_index+gender` ở hàm khác — đảm bảo chỉ
1 nơi trong codebase biết cách sinh `chart_id`. Nếu công thức bị sửa sau này (VD thêm
`calendar_type` vào chuỗi), chỉ cần sửa đúng 1 chỗ.

Hiện tại `chart_id` được tính TRONG object trả về của `adaptFromIztro`, SAU khi
`adaptDaiVan(astrolabe)`/`adaptLuuNien(astrolabe, viewYear)` đã được gọi — cần đảo thứ tự: tính
`chart_id` TRƯỚC, rồi truyền làm tham số.

```ts
// src/chart/adapter.ts — CHANGES

function adaptDaiVan(astrolabe: IFunctionalAstrolabe, chartId: string): DaiVan[] {
  return astrolabe.decadalList().map((d) => ({
    chart_id: chartId,
    age_from: d.ageRange[0],
    age_to: d.ageRange[1],
    branch: branchFromVi(d.earthlyBranch),
    stem: d.heavenlyStem,
    palace_name: d.palaceName,
  }));
}

function adaptLuuNien(astrolabe: IFunctionalAstrolabe, viewYear: string, chartId: string): LuuNien {
  const horoscope = astrolabe.horoscope(viewYear, 0);
  const yearly = horoscope.yearly;
  const year = Number.parseInt(viewYear.split('-')[0] ?? '', 10);
  const palaces: LuuNienPalace[] = astrolabe.palaces.map((p, i) => ({
    branch: branchFromVi(p.earthlyBranch),
    palace_name: yearly.palaceNames[i] ?? '',
    stars: (yearly.stars?.[i] ?? []).map((s) => ({ star_id: starIdFromVi(s.name) })),
  }));
  return {
    chart_id: chartId,
    year,
    heavenly_stem: yearly.heavenlyStem,
    earthly_branch: yearly.earthlyBranch,
    mutagen: [...yearly.mutagen],
    palaces,
  };
}

export function adaptFromIztro(
  astrolabe: IFunctionalAstrolabe,
  input: BuildChartInput,
): Chart {
  const menhBranch = branchFromVi(astrolabe.earthlyBranchOfSoulPalace);
  const thanBranch = branchFromVi(astrolabe.earthlyBranchOfBodyPalace);
  const napAm = napAmFromSolarDate(astrolabe.solarDate);
  const yearCanChi = astrolabe.chineseDate.split(' - ')[0] ?? '';
  const chartId = `${astrolabe.solarDate}_t${input.time_index}_${input.gender}`; // TINH TRUOC

  // ... notes[] khong doi ...

  return {
    chart_id: chartId, // dung lai bien, khong tinh lai
    metadata: { /* khong doi */ },
    menh_than: { /* khong doi */ },
    cuc: parseFiveElementsClass(astrolabe.fiveElementsClass),
    ban_menh_nap_am: napAm.vi,
    palaces: astrolabe.palaces.map(adaptPalace),
    luck_cycles: {
      dai_van: adaptDaiVan(astrolabe, chartId), // truyen chartId
      tieu_van: adaptTieuVan(astrolabe),
    },
    engine_meta: { /* khong doi */ },
    luu_nien: input.view_year !== undefined ? adaptLuuNien(astrolabe, input.view_year, chartId) : undefined, // truyen chartId
  };
}
```

**Không đổi** chữ ký `adaptTieuVan` (không cần `chart_id`, xem mục 1).

## 3. Nâng cấp guard trong `evaluateDecadeRule`/`evaluateAnnualRule`

**`decade-evaluator.ts`:** thay so 3 field (`branch`+`age_from`+`age_to`) bằng so `chart_id` —
mạnh hơn nhiều (so đúng định danh lá số, không phụ thuộc trùng lặp giá trị) và đơn giản hơn:

```ts
// TRUOC:
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

// SAU:
if (daiVan.chart_id !== chart.chart_id) {
  throw new Error(
    `evaluateDecadeRule: daiVan.chart_id ("${daiVan.chart_id}") khong khop chart.chart_id ` +
    `("${chart.chart_id}") — dang truyen nham DaiVan cua 1 chart khac.`,
  );
}
```

**`annual-evaluator.ts`:** trước đây KHÔNG có guard (mục 3 design doc v0.3 xác nhận không có
cách nào viết guard có tác dụng thật ở tầng giá trị). Với `chart_id`, giờ CÓ thể viết guard thật
— thêm mới:

```ts
export function evaluateAnnualRule(
  chart: Chart,
  luuNien: LuuNien,
  branch: Branch,
  rule: Rule,
): RuleEvalResult {
  if (rule.scope !== 'annual') {
    throw new Error(`evaluateAnnualRule chi xu ly scope "annual", nhan duoc "${rule.scope}"`);
  }

  // MOI: guard chart-mismatch — truoc day KHONG the viet (xem design doc v0.3 muc 3), gio
  // co the vi LuuNien da mang chart_id that.
  if (luuNien.chart_id !== chart.chart_id) {
    throw new Error(
      `evaluateAnnualRule: luuNien.chart_id ("${luuNien.chart_id}") khong khop chart.chart_id ` +
      `("${chart.chart_id}") — dang truyen nham LuuNien cua 1 chart khac.`,
    );
  }

  // ... phan con lai khong doi ...
}
```

Comment cũ giải thích "KHÔNG có guard chart-mismatch" trong `annual-evaluator.ts` cần xóa/thay
bằng comment mới, không để lại mô tả sai về hành vi hiện tại.

## 4. Cập nhật test hiện có — không phá 117/125 test đang pass

- `test/chart/adapter.test.ts`: test hiện tại (`map dai van`, dòng 105-112) chỉ assert từng
  field riêng lẻ (`.age_from`, `.age_to`, `.branch`), không dùng `toEqual` toàn object — thêm
  `chart_id` KHÔNG phá test này. Thêm 1 assertion mới: `expect(first.chart_id).toBe(chart
  .chart_id)` để khóa hành vi mới.
- `test/rule/decade-evaluator.test.ts`: dòng 55 (`fakeDaiVan: DaiVan = { age_from: 999, ... }`)
  hiện dùng tuổi giả (999) để trigger guard cũ — với guard mới (so `chart_id`), object literal
  này cần thêm `chart_id: 'khong-thuoc-chart-nao'` (giá trị KHÁC `chart.chart_id` thật) để vẫn
  trigger đúng lỗi. Giữ nguyên các giá trị field khác (age_from=999 vẫn hợp lệ để giữ tính rõ
  ràng "đây là dữ liệu giả", dù giờ guard không còn đọc field đó để quyết định).
- `test/rule/annual-evaluator.test.ts`: dòng 108 (`brokenLuuNien = { ...chart.luu_nien!,
  palaces: [] }`) test "không tìm thấy cung" — KHÔNG đổi, vẫn hợp lệ vì spread giữ nguyên
  `chart_id` đúng (guard mới sẽ pass, rồi tới `resolveLuuNienStars` throw như cũ). **Thêm 1 test
  case MỚI** cho guard chart-mismatch mới của `annual`: `const wrongChartLuuNien = {
  ...chart.luu_nien!, chart_id: 'khong-thuoc-chart-nao' }`, xác nhận
  `evaluateAnnualRule` throw đúng lỗi mismatch.

## 5. Ngoài phạm vi (Known Issues)

- **Tầng 2 (domain-mapping + `resolveQuery`) chờ phase này xong.** Đây là phase cuối cùng
  trước khi bắt đầu `resolveQuery` thật — sau v0.4, `chart_id` đã đủ mạnh để mọi caller tương
  lai (kể cả `resolveQuery`) build `Chart`+`DaiVan`+`LuuNien` một cách an toàn, có xác minh
  runtime thật thay vì chỉ dựa vào kỷ luật quy trình.
- **Ý nghĩa `branch` cho `annual`** (cố định theo lá số gốc hay xoay theo Lưu Niên) vẫn để mở —
  Known Issue riêng từ design doc v0.3, không liên quan `chart_id`, chưa xử lý ở đây.
- **`chart_id`'s công thức hiện tại** (`solarDate_t{time_index}_{gender}`) không bao gồm
  `calendar_type` hay các trường khác — 2 request với input khác nhau nhưng cùng cho ra
  `solarDate` giống hệt (VD chuyển đổi âm→dương trùng ngày) sẽ có `chart_id` trùng nhau. Đây là
  hành vi ĐÃ CÓ TỪ TRƯỚC (không phải v0.4 tạo ra), không thuộc phạm vi phase này — chỉ ghi nhận
  vì `chart_id` giờ được dùng cho mục đích an toàn hơn (guard) so với trước (chỉ để hiển thị).
  Nếu phát hiện đây là vấn đề thật khi làm Tầng 2, xử lý riêng lúc đó.

## 6. Testing

- `test/chart/adapter.test.ts`: thêm assertion `chart_id` khớp `chart.chart_id` cho cả
  `dai_van[0]` và `luu_nien` (case có `view_year`). Chạy lại toàn bộ 97 test Chart Engine gốc,
  xác nhận không hồi quy.
- `test/rule/decade-evaluator.test.ts`: sửa `fakeDaiVan` thêm `chart_id` sai, xác nhận guard
  mới vẫn throw đúng thông báo lỗi (nội dung message đổi, nhưng vẫn throw). Chạy lại toàn bộ 6
  test hiện có, xác nhận không hồi quy.
- `test/rule/annual-evaluator.test.ts`: thêm test case mới cho guard chart-mismatch (trước đây
  không tồn tại vì không viết được). Chạy lại toàn bộ 8 test hiện có, xác nhận không hồi quy.
- Chạy toàn bộ `npm test` (125 test hiện có + test mới), xác nhận tổng số tăng đúng, không có
  test nào bị xóa/skip ngầm.
