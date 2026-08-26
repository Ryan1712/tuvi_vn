# Chart Engine (Phase 2) — Design Spec

**Ngày:** 2026-08-16
**Phạm vi:** Chỉ Chart Engine (mục 1, 3, 7 của `TuVi_Build_Spec_v1.md`). KHÔNG bao gồm Rule Engine,
Conflict Resolver, hay LLM — những phần đó nằm ngoài phạm vi bản này (xem mục 13 của build spec).

## Known issues / chưa xử lý xong

Mục này track các phát hiện đã nêu ra trong quá trình review nhưng CHƯA được xác nhận đóng —
để tránh lặp lại đúng rủi ro mà chính tài liệu này đang cố phòng: 1 phát hiện đúng có thể "trôi
mất" giữa nhiều lượt sửa của 1 cuộc trò chuyện dài, kể cả khi không ai cố ý bỏ qua. Không dựa vào
trí nhớ hội thoại để track việc còn dang dở — dùng mục này.

- **[MỞ] Build spec mục 6 ghi sai ngày sinh case nền.** Build spec ghi "sinh 17/10 Kỷ Hợi (âm
  lịch)". Đối chiếu ảnh reference #1: ảnh ghi "Tháng: 12 (10) Quý Hợi | Ngày: 17 (30) Kỷ Hợi" —
  tức **17 là ngày DƯƠNG lịch, 30 mới là ngày ÂM lịch**; và **Kỷ Hợi là trụ NGÀY, không phải năm**
  (năm là Mậu Dần 1998). Build spec đã gộp nhầm "ngày dương 17" + "tháng âm 10" thành "17/10 âm
  lịch", đồng thời hiểu nhầm Kỷ Hợi là năm sinh. Đã xác minh bằng `iztro`: chỉ
  `bySolar('1998-12-17', 12)` (giờ Tý muộn 23:00–00:00, khớp "23 giờ 15 phút" trong ảnh) mới cho
  `chineseDate = "Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý"` trùng khít 4 trụ trong ảnh. Nhập theo
  "17/10 âm lịch" cho ra lá số HOÀN TOÀN KHÁC. → Cần sửa mục 6 build spec sau khi Chart Engine
  xong; fixture phải dùng ngày đã xác minh, không dùng ngày trong build spec.
- **[ĐÃ XỬ LÝ] Thang độ sáng lệch nhau giữa 3 nguồn.** `iztro` dùng **7 mức** (Miếu/Vượng/Đắc/
  **Lợi**/Bình/**Bất**/Hạn); Chart Data Shape v0.1 (build spec mục 3) định nghĩa **5 mức**
  (`mieu,vuong,dac,binh,ham`); ảnh tuvi.vn chú thích **5 mức** (M/V/Đ/B/H). "Lợi" và "Bất" của
  `iztro` không có tương đương trong thang 5 mức. → Quyết định trong plan: KHÔNG map giảm 7→5
  (sẽ là ép chuẩn hoá, mất thông tin, đúng thứ mục 7 cấm); mở rộng enum giữ nguyên giá trị gốc
  `iztro`. **Kết luận sau cross-check Task 7 (xem
  `docs/superpowers/reports/2026-08-16-cross-check-pham-duy.md`):** case Phạm Duy có đúng 10/14
  chính tinh lệch độ sáng so với ảnh reference #1, phân bố không theo 1 pattern lệch cố định 1
  bậc — xác nhận đây là 2 bảng tra độc lập của 2 trường phái, không phải lỗi offset có thể vá.
  Xếp nhóm 2 (khác trường phái hợp lệ), giữ nguyên hành vi hiện tại, không sửa code.
- **[ĐÃ XỬ LÝ — xem cập nhật 2026-08-21 bên dưới] Chủ mệnh (`soul`) lệch giữa `iztro` và
  reference #1 — case Phạm Duy: `iztro` cho "Cự Môn", ảnh tuvi.vn cho "Lộc Tồn".** Trước Task 7,
  mục này bị treo ở nhóm 3 (chưa xác định). Task 7 điều tra bằng cách đọc
  `node_modules/iztro/lib/astro/astro.js` + `node_modules/iztro/lib/data/earthlyBranches.js` và
  xác minh thực nghiệm: chủ mệnh (`soul`) KHÔNG tính từ sao đang đứng ở cung Mệnh, mà tra theo 1
  bảng cố định theo địa chi — địa chi dùng để tra phụ thuộc config `algorithm`: `'default'` (mặc
  định `iztro`, trường phái "thông dụng") tra theo địa chi CUNG MỆNH; `'zhongzhou'` (Trung Châu
  phái) tra theo địa chi NĂM SINH. Đổi `algorithm` sang `'zhongzhou'` cho ra đúng "Lộc Tồn", khớp
  reference #1. → Đây là khác biệt TRƯỜNG PHÁI có căn cứ code rõ ràng, không phải bug. Xếp nhóm 2.
  **[Quyết định "KHÔNG đổi `algorithm` trong code sản phẩm" ở câu này ĐÃ BỊ ĐẢO NGƯỢC ngày
  2026-08-21** — xem `docs/superpowers/specs/2026-08-21-algorithm-zhongzhou-design.md` và bản cập
  nhật ở mục 7 bên dưới. Dự án hiện DÙNG `algorithm: 'zhongzhou'` làm mặc định toàn cục.**
- **[ĐÃ XỬ LÝ — 2026-08-21] Tác động của `algorithm: 'zhongzhou'` lên các field khác.** Phát hiện
  ở mục chủ mệnh phía trên cho thấy `iztro` có 1 config toàn cục `algorithm` (`'default'` vs
  `'zhongzhou'`) ảnh hưởng tới cách tính `soul`. Khảo sát ban đầu (2026-08-16) chỉ xác minh cho
  ĐÚNG 1 input (case Phạm Duy): `body` và `fiveElementsClass` (cục) KHÔNG đổi — chỉ `soul` đổi,
  nhưng chưa phải khảo sát toàn diện. **Khảo sát mở rộng 2026-08-21** (xem
  `docs/superpowers/specs/2026-08-21-algorithm-zhongzhou-design.md`) so sánh TOÀN BỘ 12 cung của
  case Phạm Duy giữa `default` và `zhongzhou`: xác nhận thêm 4 điểm khác biệt cụ thể (Hợi thêm
  Kiếp Sát, Dậu thêm Long Đức, Thân nhãn `suiqian12` đổi, Sửu hết "Không Vong") — tất cả đều khớp
  reference #1 tốt hơn, không có điểm nào tệ hơn. Quyết định: đổi `algorithm` mặc định của dự án
  sang `'zhongzhou'` (xem mục 7 cập nhật bên dưới để biết chi tiết đầy đủ và lý do đảo ngược quyết
  định cũ). Chưa khảo sát case nữ mệnh/Cục khác — nếu phát sinh nhu cầu, khảo sát tiếp khi cần,
  không phải điều kiện chặn quyết định đã đưa ra (dữ liệu 12 cung của 1 case thật đã đủ thuyết
  phục để hành động, xem lý do trong design doc 2026-08-21).

**Định nghĩa "xong" cho bản này:** code Chart Engine chạy được, có test tự động (Vitest) assert
đúng case Phạm Duy đối chiếu với reference implementation #1 (mục 1), rồi dừng lại báo cáo kết
quả — kèm danh sách các nhánh CHƯA được test (mục 10) — trước khi làm tiếp Rule Engine.

**Chỉ đạo ưu tiên (mục 14 build spec, 2026-08-16 — xem nguyên văn trong
`TuVi_Build_Spec_v1.md`):** độ chính xác + đầy đủ của phép tính là ưu tiên số 1, cao hơn tốc độ
code nhanh. Sai 1 sao/1 cung so với reference implementation là KHÔNG chấp nhận được — không
được coi là "gần đúng thì được". **Làm rõ ngay để tránh mâu thuẫn với mục 7:** "sai" ở đây nghĩa
là lỗi code hoặc lỗi transcribe (đọc sai field, map nhầm cung, gõ nhầm dữ liệu) — KHÔNG có nghĩa
là output `iztro` bắt buộc phải trùng tuyệt đối tuvi.vn. Nếu 1 điểm lệch hóa ra là khác biệt
trường phái hợp lệ (phân loại theo mục 7), KHÔNG được sửa code hay đổi cấu hình `iztro` chỉ để
ép khớp tuvi.vn — làm vậy là âm thầm để 1 nguồn "thắng" ở tầng an sao, đúng điều mà toàn bộ
Rule Schema/`conflict_group_id` ở tầng tri thức được thiết kế ra để tránh. Xem quy trình đầy đủ
ở mục 7 và mục 8. UI/UX/CSS KHÔNG làm ở bản này; khi làm ở giai đoạn sau, chuẩn tối thiểu là
hiển thị đầy đủ thông tin ngang mức tuvi.vn (đủ 12 cung, đủ chính/phụ tinh, đủ chú thích miếu
vượng đắc hãm, đủ Đại Vận/Tiểu Vận/Lưu Niên), chưa cần trang trí/hiệu ứng. Xem thêm mục 9.

**Lưu ý quan trọng về bản chất của việc "cross-check" trong toàn bộ tài liệu này:** không có
nguồn nào ở đây là "sự thật tuyệt đối". `iztro` là 1 cách triển khai cụ thể của 1 (hoặc vài)
trường phái an sao; ảnh tuvi.vn cũng chỉ là output của 1 phần mềm khác, theo lựa chọn trường
phái/thuật toán riêng của họ — không phải "chân lý vũ trụ". Khi 2 nguồn lệch nhau, đó có thể là
bug ở 1 trong 2 bên, hoặc chỉ là khác biệt trường phái hợp lệ — không được mặc định bên nào đúng.
Xem mục 1 và mục 7 để biết cách xử lý khi phát hiện lệch.

---

## 1. Bối cảnh & nguồn tham khảo

- `TuVi_Build_Spec_v1.md` (lưu tại gốc repo) — đặc tả đầy đủ, là ngữ cảnh bắt buộc phải tuân theo,
  bao gồm mục 14 bổ sung 2026-08-16 (thứ tự ưu tiên: chính xác tính toán trước, UI để sau — xem
  mục 9 dưới đây).
- `tuvi_rule_engine_prototype.py` (lưu tại gốc repo) — prototype Python chứng minh Chart Data
  Shape + Rule Schema
  khả thi. Dùng để tham khảo *cách tư duy evaluator* (condition/modifier/exception tách riêng),
  KHÔNG dùng dữ liệu chart trong đó làm ground truth — đó là dữ liệu rút gọn tự nghĩ, chỉ đủ để
  chứng minh shape hoạt động, và tự thừa nhận sai lệch (vd Tỵ/Hợi tưởng nhầm là tam hợp).
- **Ảnh lá số từ tuvi.vn** (người dùng cung cấp 2026-08-16) — gọi là **"reference implementation
  #1 (tuvi.vn)"** trong tài liệu này, KHÔNG gọi là "ground truth". Đây là output của 1 phần mềm
  cụ thể theo 1 lựa chọn trường phái/thuật toán cụ thể của tuvi.vn — không phải sự thật khách
  quan, y hệt như `iztro` cũng là 1 lựa chọn trường phái cụ thể khác. Dùng làm điểm đối chiếu
  duy nhất hiện có cho fixture test case Phạm Duy (transcript đầy đủ ở mục 6), nhưng bất kỳ lệch
  nào giữa `iztro` và nguồn này PHẢI được phân loại theo quy trình mục 7, không tự động "sửa cho
  khớp tuvi.vn".

## 2. Nguyên tắc bắt buộc (nhắc lại từ build spec, áp dụng khi code)

- An sao là tính toán deterministic — dùng hàm có sẵn của `iztro`, KHÔNG tự viết lại thuật toán
  an sao, KHÔNG tự viết lại bảng tam hợp/xung chiếu/tứ hóa (mục 7 build spec).
  Điểm này khác bản Python prototype: prototype tự viết `BRANCH_ORDER`, `TAM_HOP_GROUPS`,
  `TU_HOA_TABLE` vì lúc đó chỉ chứng minh shape khả thi bằng code thuần. Bản TypeScript thật
  phải gọi hàm gốc của `iztro` cho các bảng tĩnh này.
- `star_id` dùng mã chuẩn hóa cố định (`THIEN_DONG`, không phải "Thiên Đồng") — cần bảng tra
  `star_id ↔ tên hiển thị tiếng Việt` vì đây là việc "còn thiếu, cần làm sớm" theo mục 3 build spec.
- Adapter là lớp mỏng transform dữ liệu — không chứa business logic tự chế.

## 3. Kiến trúc & cấu trúc thư mục

```
tuvi_AI/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   └── chart/
│       ├── types.ts          # Chart Data Shape v0.1 — interfaces đầy đủ theo mục 3 build spec
│       ├── star-id-map.ts    # bảng tra star_id chuẩn hóa <-> tên hiển thị tiếng Việt (iztro trả về)
│       ├── adapter.ts        # transform output của iztro -> Chart (types.ts)
│       ├── queries.ts        # helper đọc Chart: palaceOf, starsIn, relatedPalace (gọi hàm iztro cho quan hệ tĩnh)
│       └── index.ts          # public API: buildChart(input: BuildChartInput): Chart
├── test/
│   └── chart/
│       ├── fixtures/
│       │   └── pham-duy.ts   # transcript từ reference implementation #1 (tuvi.vn), dùng để đối chiếu
│       └── pham-duy.test.ts  # assertion Chart output khớp fixture
└── docs/superpowers/specs/2026-08-16-chart-engine-design.md   # file này
```

**Vì sao tách `queries.ts` khỏi `adapter.ts`:** adapter chỉ làm 1 việc — transform output thô của
`iztro` thành `Chart`. Các câu hỏi "cung này có sao X không", "cung tam hợp với Mệnh là cung nào"
là truy vấn trên `Chart` đã build xong, không phải một phần của việc transform. Tách riêng để mỗi
file có 1 trách nhiệm rõ, và `queries.ts` là chỗ Rule Engine (giai đoạn sau) sẽ import.

## 4. Chart Data Shape v0.1 — map đầy đủ theo mục 3 build spec

Toàn bộ trường trong YAML của build spec mục 3 được implement thành TypeScript interface trong
`types.ts`, bao gồm: `metadata`, `menh_than`, `cuc`, `ban_menh_nap_am`, `palaces[12]` (branch,
palace_name, palace_stem, major_stars, minor_stars, sihua), `luck_cycles` (dai_van, tieu_van,
luu_nien), `engine_meta`.

`iztro` đã có sẵn dữ liệu cho tất cả các trường này qua `astro.byLunar()` / `astro.bySolar()` —
adapter chỉ đọc và map, không tính toán gì thêm.

**Input hỗ trợ:** cả âm lịch (`astro.byLunar`) và dương lịch (`astro.bySolar`) của `iztro`,
qua một union type `BuildChartInput`:

```ts
type BuildChartInput =
  | { calendarType: 'lunar'; dateStr: string; timeIndex: number; gender: 'male' | 'female'; isLeapMonth?: boolean }
  | { calendarType: 'solar'; dateStr: string; timeIndex: number; gender: 'male' | 'female' };
```

## 5. Đối tượng thực hiện

- **`buildChart(input)`** (index.ts): entrypoint duy nhất. Gọi `iztro`, truyền kết quả cho
  adapter, trả về `Chart` đầy đủ.
- **`adapter.ts`**: 1 hàm `adaptFromIztro(astrolabe): Chart` thuần transform, có unit test riêng
  ngoài test case Phạm Duy (test các nhánh map: sihua rỗng, minor_stars rỗng, v.v. nếu cần —
  nhưng KHÔNG bịa thêm case ngoài Phạm Duy ở bản này, theo mục 13 "chưa cần mở rộng ngoài scope").
- **`queries.ts`**: `palaceOf(chart, branchOrPalaceName)`, `starsIn(chart, branch)`,
  `relatedPalace(chart, branch, relation: 'tam_hop' | 'xung_chieu')` — quan hệ tĩnh gọi qua
  hàm có sẵn của `iztro`, không tự bảng hóa lại.
- **`star-id-map.ts`**: chỉ liệt kê các sao xuất hiện trong lá số Phạm Duy (từ transcript mục 6)
  ở bản này — YAGNI, không cố map hết toàn bộ hệ thống sao ngay.

## 6. Reference implementation #1: transcript lá số Phạm Duy (từ ảnh tuvi.vn)

Dùng làm dữ liệu đối chiếu trong `test/chart/fixtures/pham-duy.ts`. Đây là **điểm đối chiếu duy
nhất hiện có** cho case Phạm Duy — không dùng số liệu rút gọn trong `tuvi_rule_engine_prototype.py`
làm điểm đối chiếu (xem mục 1), vì đó là dữ liệu tự nghĩ, không phải output của phần mềm nào.
Nhắc lại: đây là 1 cách triển khai cụ thể, không phải chuẩn tuyệt đối — xem mục 7 khi lệch với
`iztro`.

**Thông tin sinh:**
- Họ tên: Phạm Duy — Dương Nam
- Năm: 1998, Mậu Dần | Tháng: 12 (âm: 10), Quý Hợi | Ngày: 17 (âm: 30), Kỷ Hợi
- Giờ: 23:15, Giáp Tý (giờ Tý)
- Năm xem mẫu: Bính Ngọ 2026, 29 tuổi
- Bản mệnh: Thành Đầu Thổ — Thủy Nhị Cục (Mệnh khắc Cục Thủy) — cân lượng 4 lượng 8 chỉ
- Chủ mệnh: Lộc Tồn | Chủ thân: Thiên Lương | Lai nhân cung: Tật Ách

**12 cung (branch — palace_name — chính tinh — phụ tinh chính — vòng đời/lưu niên):**

| Chi (branch) | Cung | Chính tinh | Phụ tinh nổi bật |
|---|---|---|---|
| Tỵ | Thiên Di | Thiên Lương (H) | Lộc Tồn, Thiếu Âm, Bác Sỹ |
| Sửu | Phúc Đức | Thái Âm (Đ), Thái Dương (Đ) | Hữu Bật, Tả Phù, Thiên Khôi, Quốc Ấn, Hồng Loan, Thiên Thọ |
| Dần | Điền Trạch | Tham Lang (Đ) | Phong Cáo, Ân Quang, Hóa Lộc |
| Mão | Quan Lộc | Cự Môn (M), Thiên Cơ (M) | Thiên Phúc, Thiên Quan, Đào Hoa, Thiếu Dương, Linh Tinh (Đ), Thiên Không, Phục Binh, Hóa Kỵ, Hóa Quyền |
| Thìn | Nô Bộc | Tử Vi (V), Thiên Tướng (V) | Văn Khúc (Đ), Đà La (Đ), Địa Giải, Thiên Khốc (H), Tang Môn, Quan Phù, Thiên La, Thiên Thương |
| Tý | Phụ Mẫu | Vũ Khúc (V), Thiên Phủ (M) | Hỷ Thần, Thiên Quý, Điếu Khách, Thiên Khốc, Thiên Hư |
| Ngọ | Tật Ách | Thất Sát (M) | Thai Phụ, Thiên Hình (H), Thiên Trù, Kình Dương (H), Long Trì, Lực Sỹ, Quan Phù, Thái Tuế, Tam Thai, Kình Dương, Văn Khúc, Thiên Sứ |
| Mùi | Tài Bạch | (vô chính diệu — chỉ có phụ tinh) | Thiên Việt, Tử Phù, Thiên Hỉ, Nguyệt Đức, Thanh Long |
| Thân | Tử Tức | Liêm Trinh (V) | Văn Tinh, Thiên Mã (H), Giải Thần, Phượng Các, Bát Tọa, Văn Xương, Thiên Mã, Thiên Hư (Đ), Tuế Phá, Tiểu Hao, Tang Môn, Hóa Kỵ |
| Dậu | Phu Thê | (vô chính diệu) | Long Đức, Hồng Loan, Thiên Việt, Phá Toái, Tướng Quân |
| Tuất | Huynh Đệ | Phá Quân (Đ) | Văn Xương (Đ), Thiên Diêu (Đ), Thiên Y, Đường Phù, Hoa Cái, Tấu Thư, Bạch Hổ, Địa Võng, Hóa Khoa |
| **Hợi** | **Mệnh〈Thân〉** | **Thiên Đồng (Đ)** | **Thiên Đức, Phúc Đức, Thiên Khôi, Hóa Lộc, Địa Không (Đ), Địa Kiếp, Kiếp Sát, Phi Liêm** |

(Đ = Đắc, V = Vượng, M = Miếu, H = Hãm — theo chú thích cuối ảnh)

**Ghi chú tự-soát:** lần transcribe đầu tiên của bảng trên bị lỗi — hoán đổi nhãn branch của
Tý và Tỵ (Thiên Di thực ra ở Tỵ, Phụ Mẫu thực ra ở Tý; đã sửa), và ghi sai độ sáng sao ở Mão
(Cự Môn/Thiên Cơ là Miếu, ghi nhầm thành Hãm; đã sửa). Người dùng phát hiện qua đối chiếu tay
với ảnh gốc. Đây là minh chứng trực tiếp cho nguyên tắc mục 8/9 build spec — kể cả bước transcribe
1 ảnh cụ thể, do người/AI làm trực tiếp, cũng cần bị soát lại chứ không mặc định đúng ngay lần
đầu. Toàn bộ 12 dòng đã được đối chiếu lại lần 2 sau khi sửa, không phát hiện thêm sai lệch.

**Điểm mấu chốt cần adapter/test bắt đúng:**
- Mệnh và Thân đồng cung tại **Hợi** (`menh_than.same_palace = true`).
- Reference #1 (ảnh) đặt cung **Phúc Đức ở Sửu**; bản rút gọn trong prototype Python đặt Phúc
  Đức ở Mùi. Đây KHÔNG được coi là "prototype sai, ảnh đúng" — prototype Python chưa bao giờ là
  1 nguồn đối chiếu (dữ liệu tự nghĩ để chứng minh code shape, tác giả tự ghi chú là rút gọn),
  nên không có xung đột thật giữa 2 nguồn ở đây, chỉ đơn giản là dùng đúng nguồn có giá trị đối
  chiếu (reference #1) thay vì dữ liệu tự nghĩ. Việc cần cảnh giác thật sự là bước SAU: nếu
  `iztro` build ra Phúc Đức khác Sửu, đó mới là chỗ cần phân loại theo mục 7 (bug vs khác trường
  phái), không tự sửa cho khớp ảnh.
  Quan hệ giữa Sửu và Hợi (tam hợp/xung chiếu/khác) KHÔNG được giả định tay trong design doc
  này — đúng bài học mục 8/9 build spec (đừng tin trí nhớ về quan hệ cung). Việc xác định quan
  hệ này là trách nhiệm của `relatedPalace()` gọi hàm gốc `iztro`, và test ở mục 8 sẽ assert
  kết quả cụ thể mà `iztro` trả về, không suy luận trước ở đây.
- Ảnh có 2 nhãn "Tuần" và "Triệt" đặt tại 1 ranh giới cung nào đó, nhưng design doc này KHÔNG
  khóa cứng vị trí cụ thể của chúng bằng cách đọc pixel/layout trên 1 ảnh — Tuần/Triệt là kết quả
  của công thức tính theo Can/Chi năm sinh, không phải thứ suy luận đáng tin cậy chỉ từ việc nhìn
  nhãn nằm cạnh cung nào trong 1 hình ảnh. Nguồn chính cho vị trí Tuần/Triệt phải là hàm tính có
  sẵn của `iztro` (đúng mục 7 build spec: không tự viết lại bảng tĩnh). Nếu `iztro` không hỗ trợ
  Tuần/Triệt trực tiếp, ghi rõ trong `engine_meta` là "không map được ở bản này", KHÔNG bỏ qua âm
  thầm. Nếu `iztro` cho vị trí khác với quan sát trên ảnh, xử lý qua đúng quy trình phân loại mục
  7 như mọi điểm lệch khác (rất có thể sẽ rơi vào nhóm "cần nghiên cứu thêm" trước, vì bản thân vị
  trí đọc từ ảnh ở đây chưa được xác nhận chắc chắn) — không suy diễn công thức tổng quát chỉ từ
  cách đọc 1 ảnh.
- Cục: Thủy Nhị Cục, Bản mệnh nạp âm: Thành Đầu Thổ.

## 7. Cross-check & phân loại khi lệch với reference #1

**[CẬP NHẬT 2026-08-21]** Sau khi đổi `algorithm` mặc định sang `'zhongzhou'` (xem `docs/superpowers/specs/2026-08-21-algorithm-zhongzhou-design.md`), 5 điểm lệch dưới đây **không còn là "khác trường phái hợp lệ"** — đã khớp reference #1:
- Chủ mệnh (`soul`): Cự Môn → **Lộc Tồn**, khớp ref.
- Hợi: **thêm Kiếp Sát** (trước thiếu).
- Dậu: **thêm Long Đức** (trước thiếu).
- Thân: nhãn `suiqian12` Đại Hao → **Tuế Phá**, khớp ref.
- Sửu: "Không Vong" (trước dư thừa so với ref) → không còn xuất hiện.

3 nhóm lệch còn tồn tại thật, KHÔNG do quyết định `algorithm` này, vẫn giữ nguyên trạng thái Known Issue:
1. Thiên Khôi (Sửu vs ref: Hợi) — công thức khác tầng, độc lập `algorithm` (đã xác nhận đọc thẳng source `getKuiYueIndex()` trong `iztro`).
2. Độ sáng chính tinh (thang 7 mức `iztro` vs 5 mức chú thích ảnh gốc) — không có phép quy đổi trung lập, giữ nguyên nhóm 2 (khác trường phái/quy ước hiển thị hợp lệ).
3. **[2026-08-24] Đối chiếu phụ tinh/tạp tinh đầy đủ 12 cung — xem chi tiết bên dưới.**

**[2026-08-24] Đối chiếu đầy đủ 12 cung (phụ tinh + tạp tinh + vòng Bác Sỹ/Tướng Tiền/Tuế Tiền) với ảnh reference #1, sau khi đổi `algorithm` sang `'zhongzhou'`:**

Trước khi coi bảng đối chiếu này là "đạt", đã qua 1 vòng đối chiếu tay (người dùng) phát hiện nhiều sao "thiếu" ở ≥6/12 cung, và 1 vòng điều tra bằng công cụ (không dựa vào đọc ảnh bằng mắt) để phân loại đúng theo quy trình mục 7. Cả người dùng lẫn agent đều tự phát hiện mình đọc/transcribe sót ít nhất 1 điểm trong quá trình này — ghi nhận đối chiếu bằng mắt ở mức chi tiết 96 điểm dữ liệu đã chạm giới hạn độ tin cậy của phương pháp, không phải lỗi riêng của 1 bên. Kết luận cuối, đã verify bằng code:

- **Nguyên nhân chính của phần lớn "sao thiếu" ban đầu: lỗi ở script chẩn đoán (`scripts/full-crosscheck-report.ts`), không phải lỗi Chart Engine.** Bản đầu của script chỉ in `minor_stars`/`adjective_stars`, quên in 3 field `boshi`/`jiangqian`/`suiqian` (`ChartPalace`, `src/chart/types.ts:90-103`) — vốn đã được `adapter.ts` đọc đúng từ `iztro` từ trước, chỉ là script không hiển thị. Đã sửa script (thêm in 3 field này), chạy lại — phần lớn sao "thiếu" (Phục Binh, Bác Sỹ, Lực Sỹ, Thanh Long, Tang Môn, Tiểu Hao, Tuế Phá...) hóa ra đều có mặt, chỉ nằm ở field khác. → Nhóm 1 theo mục 7 (bug, nhưng ở tầng công cụ chẩn đoán, không phải Chart Engine sản phẩm) — đã sửa.
- **"Quan Phù" (cung Nô Bộc, ảnh gốc) vs "Quan Phủ" (`boshi` tại Nô Bộc, `iztro`) — 2 sao khác nhau thật**, chỉ lệch 1 dấu thanh điệu (Quan Phủ = 官府, vòng Bác Sỹ; Quan Phù = 官符, vòng Tuế Tiền). "Quan Phù" đúng nghĩa nằm ở `suiqian` tại Tật Ách trong dữ liệu `iztro`, không phải Nô Bộc. Ví dụ cụ thể của loại lỗi CLAUDE.md mục 6 cảnh báo (nhầm 2 giá trị gần giống nhau) — xảy ra ở chính vòng đối chiếu tay lần này.
- **"Thái Tuế" không tồn tại trong `iztro`** dưới tên đó, ở bất kỳ field nào (đã grep toàn bộ `node_modules/iztro/lib/i18n/locales/vi-VN/star.js`). Đọc trực tiếp source `node_modules/iztro/lib/star/decorativeStar.js:185-226` (`getYearly12`) xác nhận: vòng `suiqian12` (Tuế Tiền) của `iztro` dùng 1 bộ 12 tên gọi khác hệ hoàn toàn với hệ "Thái Tuế, Thiếu Dương, Tang Môn, Thiếu Âm..." quen thuộc — `iztro` dùng "Tuế Kiện, Hối Khí, Tang Môn, Quán Sách, Quan Phù, Tiểu Hao, [Đại Hao|Tuế Phá tùy algorithm], Long Đức, Bạch Hổ, Thiên Đức, Điếu Khách, Bệnh Phù" cho CẢ 2 vị trí đầu vòng — vị trí #1 (neo tại chi năm sinh, đúng cơ chế Thái Tuế) được `iztro` gọi là "Tuế Kiện" thay vì "Thái Tuế". Có comment gốc của tác giả thư viện xác nhận đây là khác biệt trường phái chủ đích: `// 中州派的大耗叫岁破` ("Trung Châu phái gọi Đại Hao là Tuế Phá") — đúng vị trí #7 của vòng, giải thích tại sao case Phạm Duy có cả `DAI_HAO` (ảnh gốc, hệ `default`) lẫn `TUE_PHA` (sau đổi sang `zhongzhou`) xuất hiện trong dữ liệu ở các thời điểm khác nhau. → **Nhóm 2 (khác trường phái hợp lệ)**, không sửa.
- **Nhóm sao thật sự không tồn tại trong `iztro`** (đã grep toàn bộ vocabulary vi-VN, không có ở bất kỳ tên/field nào): Đào Hoa, Thiếu Dương, Thiếu Âm, Thiên Giải, Lưu Hà, Thiên La, Văn Tinh, Địa Giải (khác "Giải Thần" — 2 sao thật sự khác nhau: 解神 vs 地解, công thức an sao khác nhau, không phải bị gõ nhầm). → **Nhóm 2 (khác trường phái hợp lệ / giới hạn triển khai thư viện)**, không phải bug, không sửa.
- **Mã "lạ" trong lần đối chiếu đầu (HAM_TRI, THIEN_NGUYET, THIEN_QUY, THIEN_VU, AM_SAT, NIEN_GIAI)** — đã tra `src/chart/star-id-map.ts` + đối chiếu tên gốc: đều là tạp tinh thật, hợp lệ (Hàm Trì, Thiên Nguyệt, Thiên Quý, Thiên Vu, Âm Sát, Niên Giải), không phải mã rác/lỗi transcribe.
- **Đã loại trừ giả thuyết "`callIztro()`/`astro.bySolar()` thiếu tham số khiến `iztro` không sinh đủ tạp tinh":** đọc `node_modules/iztro/lib/astro/astro.js` (hàm `bySolar`, dòng 142-234) xác nhận `majorStars`/`minorStars`/`adjectiveStars`/`boshi12`/`jiangqian12`/`suiqian12` luôn được tính không điều kiện, không phụ thuộc config nào ngoài `algorithm` + ngày giờ sinh. `Config` type (`node_modules/iztro/lib/data/types/astro.d.ts`) không có field nào gate việc sinh tạp tinh.

**Quyết định:** coi đối chiếu 12 cung là đã đạt điểm bão hòa (diminishing returns) — chấp nhận dừng đối chiếu tay thêm ở đây. Không còn giả thuyết "thiếu tham số"/"bug adapter" nào chưa được loại trừ bằng code thật.

**[2026-08-25] 4 điểm nghi vấn phát sinh khi dựng mockup UI (`docs/superpowers/mockups/2026-08-24-dia-ban-vong-cung.html`), đối chiếu tiếp với ảnh reference #1:**

- **"Đầu Quân" — (a) thật sự không tồn tại trong `iztro`.** Grep toàn bộ `node_modules/iztro/lib/` (không chỉ `star.js`): 0 kết quả dưới mọi biến thể tên. Nhóm 2 (khác trường phái/giới hạn thư viện), không sửa.
- **"Quán Tác" (cung Thiên Di/Tỵ, field `suiqian`) và "Vong Thần" (field `jiangqian`) — (b) cùng mẫu hình Thái Tuế/Tuế Kiện.** Đọc `decorativeStar.js`'s `getYearly12()`/`getJiangqian12StartIndex()`: "Vong Thần" khớp cả tên lẫn vị trí chuẩn (không lệch gì). "Quán Tác" nằm đúng vị trí cố định (offset từ chi năm sinh) mà 1 số sách gọi "Thiếu Âm" — cùng công thức neo, khác nhãn theo dị bản sách, không phải bug. Nhóm 2.
- **"Lưu Lộc Tồn" tưởng thiếu ở Thiên Di (Tỵ) — (d)→(a) đảo ngược: lỗi ở tham số `view_year` khi dựng mockup, không phải Chart Engine.** Giả thuyết ban đầu ("có thể do khác biệt ranh giới Lập Xuân giữa `iztro` và tuvi.vn") **đã bị bác bỏ bằng thực nghiệm**: build lại với 4 mốc `view_year` khác nhau trong 2026 xác nhận `iztro` tự chuyển đúng Ất Tỵ (trước Lập Xuân) → Bính Ngọ (sau Lập Xuân) — cùng 1 cơ chế, không có 2 hệ tính khác nhau. Mockup ban đầu dùng `view_year: '2026-01-01'` (trước Lập Xuân) nên còn tính Ất Tỵ, ra Lưu Lộc Tồn ở Mão — sai so với "Năm xem mẫu: Bính Ngọ 2026" mà chính build spec/ảnh gốc đã ghi từ đầu dự án (`TuVi_Build_Spec_v1.md:178`). Đổi `view_year: '2026-06-15'` (chắc chắn thuộc Bính Ngọ) → Lưu Lộc Tồn đúng ra ở Tỵ, khớp ảnh gốc. **Bài học:** khi cần dữ liệu Lưu Niên cho 1 năm can-chi cụ thể ghi trong tài liệu, chọn `view_year` giữa năm (an toàn qua mốc Lập Xuân ~cuối tháng 1/đầu tháng 2), không dùng mốc đầu năm dương lịch.
- **Sao "Phúc Đức" (tạp tinh) tại cung Mệnh — (a) thật sự không tồn tại trong `iztro` như 1 SAO.** Grep toàn bộ thư viện: "Phúc Đức" chỉ xuất hiện đúng 1 nơi — làm TÊN CUNG thứ 12 (`spiritPalace: 'Phúc Đức'` trong `i18n/locales/vi-VN/palace.js`), không phải tên tạp tinh trong `star.js`. Đã loại trừ khả năng đây là biến thể của "Thiên Đức"(`tiande`)/"Nguyệt Đức"(`yuede`) — cả 2 sao này tồn tại độc lập trong `iztro` với tên riêng, không trùng "Phúc Đức". Rủi ro nhầm lẫn khi đối chiếu tay: tên sao trùng tên cung. Nhóm 2, không sửa.

Cả 4 điểm đều đã đóng bằng bằng chứng code (grep vocabulary + đọc source công thức + thực nghiệm build nhiều tham số), không còn điểm nào "chưa xác định" treo lại từ vòng đối chiếu mockup UI.

**[2026-08-25, vòng 2] 2 điểm phát hiện khi người dùng tự test UI thật (case cá nhân, năm xem Bính Ngọ 2026):**

- **[MỞ — khoảng trống Chart Engine thật] "Lưu Thái Tuế" thiếu ở cung có chi trùng năm xem (case cụ thể: Bính Ngọ → thiếu ở cung Ngọ).** Điều tra bằng code: `astrolabe.horoscope(viewYear, 0).yearly.yearlyDecStar` là 1 field HOÀN TOÀN RIÊNG BIỆT chứa `suiqian12`/`jiangqian12` **của năm xem** (Lưu Tuế Tiền/Lưu Tướng Tiền) — khác hẳn `yearly.stars` (sao lưu động: Lưu Xương/Lưu Khúc...) mà `adaptLuuNien()` đang đọc, và khác hẳn `suiqian12`/`jiangqian12` TĨNH của bản mệnh mà `adaptPalace()` đã đọc cho từng cung. Đã verify bằng code thật: với năm xem `2026-6-15` (Bính Ngọ), `yearlyDecStar.suiqian12[4]` = `"Tuế Kiện"` và `astrolabe.palaces[4].earthlyBranch` = `"Ngọ"` — khớp đúng vị trí "L.Thái Tuế" trong ảnh gốc (tên "Tuế Kiện" của `iztro`/Trung Châu phái tương đương "Thái Tuế" ở hệ khác — cùng mẫu hình đã xác nhận trước đó cho vòng tĩnh). **Kết luận: (c) có trong dữ liệu `iztro` nhưng `adaptLuuNien()` (`src/chart/adapter.ts:116-133`) chưa từng đọc `yearly.yearlyDecStar`.** Cần thêm field mới vào `LuuNienPalace`/`LuuNien` type (VD `suiqian`/`jiangqian` riêng cho lưu niên, song song với field tĩnh đã có trên `ChartPalace`) + cập nhật `adaptLuuNien()`. Ngoài phạm vi UI port, để phase Chart Engine riêng.
- **"Tử Phù" tại cung Tài Bạch (case cụ thể) — (b) cùng mẫu hình Thái Tuế/Tuế Kiện, không phải bug.** Grep toàn bộ vocabulary: "Tử Phù" không tồn tại trong `iztro` dưới tên đó. Nhưng vị trí #6 trong vòng `suiqian12` (đếm từ chi năm sinh/năm xem) — nơi `iztro`/Trung Châu phái gọi "Tiểu Hao" (`xiaohao`) — chính là vị trí mà 1 số trường phái khác (bao gồm tuvi.vn) gọi "Tử Phù". Cùng công thức neo, khác nhãn theo dị bản sách — đúng mẫu hình Thái Tuế↔Tuế Kiện, Đại Hao↔Tuế Phá đã xác nhận nhiều lần trước đó trong cùng vòng 12 thần này. Nhóm 2, không sửa.

**Ghi chú phương pháp:** cả 2 phát hiện này đến từ việc người dùng tự test UI với case cá nhân (không phải case Phạm Duy chuẩn) — khẳng định soi ảnh gốc bằng mắt qua nhiều vòng đã chạm giới hạn, dù mỗi lần đều bắt được ít nhất 1 điểm thật. **Quyết định:** chuyển hẳn sang so sánh tự động bằng code — mở rộng `full-crosscheck-report.ts` (hoặc viết script mới) dùng 1 fixture transcribe cẩn thận 1 LẦN từ ảnh gốc (đầy đủ mọi vòng sao: major/minor/adjective/boshi/jiangqian/suiqian TĨNH + `yearlyDecStar` LƯU NIÊN một khi đã thêm vào Chart Engine), so với output `iztro` cho MỌI cung một lần dứt điểm, không tiếp tục vòng lặp đối chiếu tay từng phần. Đang chờ ảnh gốc rõ nét từ người dùng để transcribe.

**[2026-08-25, vòng 3] Xác định vị trí Tuần/Triệt cho case cá nhân (Mậu Dần) — ví dụ thực tế của lỗi "nhầm 2 giá trị gần giống" xảy ra ở TẦNG LÝ THUYẾT, không phải tầng đọc ảnh:**

Người dùng đề xuất công thức lý thuyết cho Tuần Không (nguyên lý "vòng Giáp": 10 Thiên Can ghép 12 Địa Chi trong 1 tuần Giáp, 2 Chi dư ra là Tuần Không) và Triệt Không (tra theo Thiên Can năm sinh). Verify bằng 2 bước:

1. **Đọc trực tiếp source `iztro`** (`node_modules/iztro/lib/star/location.js:600-637`, hàm `getYearlyStarIndex`): `xunkongIndex` tính bằng công thức đại số (`fixEarthlyBranchIndex(yearly[1]) + index(Quý) - index(Thiên Can năm) + 1`, có bước điều chỉnh +1 theo âm dương chi năm), `jiekongIndex` (Triệt) tra theo Thiên Can năm sinh qua 1 trong 2 bảng `jieluIndex`/`kongwangIndex` tùy âm dương. Chạy code thật cho case Mậu Dần: `astrolabe.palaces` cho **Tuần Không tại Thân**, **Triệt Không tại Tý** — khớp đúng ảnh gốc người dùng gửi (badge Tuần ở biên Thân/Dậu, badge Triệt ở biên Tý/Tuất).
2. **Tính tay lại công thức "vòng Giáp"** để đối chiếu với ảnh: ban đầu tưởng nhầm Mậu Dần thuộc "vòng Giáp Dần" (kết luận sai: Tuần = Tý/Sửu, MÂU THUẪN với `iztro`) — nhưng viết script tính đúng vị trí 60 Can-Chi xác nhận **Mậu Dần thực ra thuộc vòng Giáp TUẤT** (Giáp Tuất→Ất Hợi→Bính Tý→Đinh Sửu→Mậu Dần→...→Quý Mùi), 2 Chi dư ra đúng là **Thân, Dậu** — khớp hoàn toàn `iztro` và ảnh gốc.

**Kết luận: KHÔNG có mâu thuẫn giữa lý thuyết và `iztro` — cả 2 cùng 1 công thức (biến đổi đại số của cùng nguyên lý "vòng Giáp"), sai lệch ban đầu là do TÍNH TAY NHẦM vòng Giáp chứa Mậu Dần** (nhầm "Mậu Dần" trùng chữ "Dần" với "vòng Giáp Dần" — trong khi vòng Giáp được đặt tên theo Can-Chi ĐẦU vòng, không phải theo phần chi trùng). Đây là ví dụ cụ thể, mới, của đúng loại lỗi CLAUDE.md mục 6 cảnh báo ("nhầm giữa 2 giá trị gần giống nhau") — nhưng lần này xảy ra ở TẦNG SUY LUẬN LÝ THUYẾT (tính tay vòng 60 Giáp Tý), không phải tầng đọc ảnh/đọc code. Bài học mở rộng: verify chéo không chỉ "code vs ảnh" mà cả "lý thuyết vs code" — khi 1 công thức lý thuyết mâu thuẫn với code đã chạy thật, ưu tiên viết script tính lại chính xác (không tính nhẩm) trước khi kết luận "2 trường phái khác nhau".

**Fixture kết luận (dùng để transcribe cố định):** Tuần Không → cung Thân (Tử Tức); Triệt Không → cung Tý (Phụ Mẫu). Nhóm 1 áp dụng ngược lại — nghĩa là: không có bug, không có khác trường phái, output `iztro` hiện tại đã đúng, không sửa gì.

**[2026-08-25, vòng 4 — DỨT ĐIỂM] Xây dựng script so sánh tự động toàn diện, chấm dứt đối chiếu tay từng phần:**

Fixture đầy đủ 12 cung: `test/chart/fixtures/pham-duy-full.ts` (`PHAM_DUY_FULL_REFERENCE`) — transcribe từ ảnh reference #1 (năm xem Bính Ngọ 2026), đã qua đúng 1 vòng người dùng tự soát lại toàn bộ so với ảnh gốc trước khi tin dùng (không phải "AI tự tin dữ liệu do chính AI đọc"). Script: `scripts/full-crosscheck-fixture.ts` (`npm run crosscheck:full`) — so 4 phần: (A) chính tinh theo tên/vị trí, KHÔNG so độ sáng (Known Issue thang 7 vs 5 mức đã đóng từ 2026-08-16, không có phép quy đổi trung lập); (B) phụ tinh+tạp tinh+boshi/jiangqian/suiqian TĨNH, so theo SET gộp chung (không tách vòng vì phân loại lại đòi hỏi kiến thức chuyên sâu, rủi ro tự đoán sai — CLAUDE.md mục 6/9); (C) 10 sao lưu động có phiên bản riêng trong `iztro` (Khôi/Việt/Xương/Khúc/Loan/Hỷ/Lộc/Dương/Đà/Mã — LƯU Ý: `iztro` dùng tên rút gọn khác nhau cho mỗi sao, VD "Lưu Lộc" không phải "Lưu Lộc Tồn", không theo quy tắc chung `LUU_` + tên gốc); (D) các mục còn lại ("L.Thái Tuế", "L.Hóa Kỵ"...) thuộc `yearlyDecStar`/Tứ Hóa lưu niên — Chart Engine CHƯA đọc (xem Known Issue vòng 2), báo cáo riêng không tính vào tổng.

Quá trình sửa script (v1 → v3) tự phát hiện và sửa lần lượt: (1) so sai thang độ sáng 7-vs-5 mức (bug script, không phải Chart Engine); (2) **bug thật trong logic tra cứu tên sao lưu động** — ban đầu tưởng nhầm "starIdFromVi() có bug ảnh hưởng sản phẩm", đã grep toàn bộ `src/` xác nhận `starIdFromVi()`/`adaptLuuNien()` (`src/chart/adapter.ts:123`) hoàn toàn đúng (bảng `STAR_ID_BY_VI` đã có sẵn entry rút gọn đúng, VD `'Lưu Lộc': 'LUU_LOC_TON'`) — bug chỉ nằm ở SCRIPT (giả định sai cách rút gọn tên khi strip tiền tố "L." khỏi fixture); (3) chưa loại trừ các sao đã biết không tồn tại trong `iztro` từ các vòng điều tra trước, gây báo "vấn đề" giả cho Known Issue đã đóng.

Sau khi sửa script, chạy lại phát hiện 7 vấn đề "thật" cần điều tra tiếp — điều tra dứt điểm từng cái bằng grep vocabulary `iztro` (không đoán):
- **"Thai Phụ" (Tật Ách) → lỗi transcribe thật, đã sửa fixture:** tên đúng là "Đài Phụ" (`taifu`/`DAI_PHU`) — 2 tên gần giống khi đọc ảnh nén ("Đài" vs "Thai").
- **"Phượng Các" (Tử Tức) → lỗi transcribe thật, đã sửa fixture:** tên đúng là "Phụng Các" (`fengge`/`PHUNG_CAC`) — lệch 1 chữ.
- **"Thiên Y", "Đường Phù", "Địa Võng" (Huynh Đệ), "Quốc Ấn", "Trực Phù" (Phúc Đức) → nhóm 2, thật sự không tồn tại trong `iztro`** (grep toàn bộ vocabulary `star.js`, không có tên nào khớp hay gần giống).
- **"Giải Thần"/Tử Tức, "Thiên Quý"/Phụ Mẫu, "Phi Liêm"/Mệnh → nhóm 2, khác cung thật, KHÔNG phải lỗi transcribe:** người dùng tự đối chiếu lại ảnh gốc xác nhận vị trí fixture ghi đúng (không phải gõ nhầm cung) — `iztro` đặt 3 sao này ở cung khác (Nô Bộc/Thìn, Tử Tức/Thân, Huynh Đệ/Tuất tương ứng). Khác biệt an sao thật giữa `iztro` và tuvi.vn.
- **"Đại Hao" (Điền Trạch/Dần) → nhóm 2, khác cung, nhưng MỨC TIN CẬY THẤP HƠN các case trên:** `iztro`/`algorithm: 'zhongzhou'` đặt "Đại Hao" (nhãn của vòng `suiqian12`, vị trí #7 theo hệ đặt tên `algorithm: 'default'` — xem Known Issue 2026-08-21) tại cung Dậu, không phải Dần. Khác với case Thái Tuế/Tuế Kiện (chỉ khác TÊN GỌI cùng 1 vị trí, đã verify công thức khớp), đây có thể là tuvi.vn neo vòng Tuế Tiền theo quy tắc offset khác hẳn, hoặc dùng hệ đặt tên hoàn toàn riêng cho vòng này — CHƯA verify được cơ chế cụ thể như đã làm với Thái Tuế/Tuế Kiện. Xếp nhóm 2 nhưng đánh dấu rõ "cần nguồn xác nhận thêm nếu muốn hiểu cơ chế", không dừng ở mức "chấp nhận khác nhau rồi bỏ qua".
- **"Phúc Đức" (Mệnh) → đã biết từ trước:** tên cung thứ 12, không phải tạp tinh.

**Kết quả cuối: chạy `npm run crosscheck:full` → 0 vấn đề thật còn lại, 32 mục đã phân loại minh bạch (không giấu diếm) vào 1 trong 4 nhóm: khác thư viện (nhóm 2 — không tồn tại), khác cung do trường phái (nhóm 2 — vị trí khác), khớp qua vòng Bác Sỹ/Tướng Tiền/Tuế Tiền (không phải thiếu, chỉ chưa hiển thị đúng field), hoặc thuộc Chart Engine chưa đọc (`yearlyDecStar`, để phase riêng).**

**Quyết định:** `scripts/full-crosscheck-fixture.ts` + `test/chart/fixtures/pham-duy-full.ts` là công cụ đối chiếu tự động CHÍNH THỨC cho case Phạm Duy từ nay — thay thế hoàn toàn việc đối chiếu tay từng phần qua nhiều vòng hội thoại. Khi Chart Engine thay đổi (đổi `algorithm`, cập nhật `iztro`, sửa adapter...), chạy lại `npm run crosscheck:full` để xác nhận không có regression, không cần lặp lại quy trình soi ảnh bằng mắt.

**[2026-08-25, vòng 5 — ĐÃ XỬ LÝ MỘT PHẦN] Vòng Lưu Tuế Tiền/Tướng Tiền (`yearlyDecStar`) đã được thêm vào Chart Engine — đóng "Lưu Thái Tuế" thiếu:**

Thêm `LuuNienPalace.jiangqian`/`.suiqian` (`src/chart/types.ts`) đọc từ `astrolabe.horoscope(viewYear, 0).yearly.yearlyDecStar.jiangqian12`/`.suiqian12` (`adaptLuuNien()`, `src/chart/adapter.ts`) — song song với field tĩnh `ChartPalace.jiangqian`/`.suiqian` đã có từ trước. Đồng thời thêm `LuuNien.nominal_age` (đọc `horoscope.age.nominalAge`, cùng object trả về, cùng công thức đã dùng ở `src/llm/query-evidence-pack.ts:139` — verify chéo khớp giá trị `29` cho case Phạm Duy năm 2026).

Cập nhật `scripts/full-crosscheck-fixture.ts` Phần D để verify thật (không chỉ báo "chưa đọc" nữa): 4/6 mục "L.X" liên quan vòng lưu niên khớp ngay lần đầu, bao gồm đúng **"Lưu Thái Tuế" tại cung Tật Ách** (khớp `suiqian: "Tuế Kiện"`, đúng mẫu hình Thái Tuế/Tuế Kiện đã xác nhận ở vòng tĩnh) — xác nhận field mới hoạt động đúng, đóng phát hiện ban đầu của người dùng.

**[MỞ — phạm vi hẹp hơn, để lần sau] 2 mục còn chưa khớp sau khi thêm field mới:**
- "L.Đào Hoa" (Quan Lộc) — không thuộc `yearlyDecStar.jiangqian12`/`.suiqian12` (đã verify: cung này có `jiangqian="Hàm Trì"`, `suiqian="Thiên Đức"`, không phải "Đào Hoa"). Lưu ý: "Đào Hoa" (tĩnh) đã biết không tồn tại trong `iztro` (nhóm 2) — nhưng "L.Đào Hoa" là sao LƯU NIÊN, chưa rõ có cùng kết luận hay thuộc field khác chưa điều tra.
- "L.Thiên Khốc"/"L.Thiên Hư" (Phụ Mẫu) — cũng không thuộc `jiangqian12`/`suiqian12` của cung đó (`jiangqian="Tai Sát"`, `suiqian="Tuế Phá"`).
- Đã thử grep `changsheng`/`Trường Sinh`/biến thể trong `node_modules/iztro/lib/data/types/astro.d.ts` — không ra kết quả, chưa xác định được 2 sao này thuộc field nào của `horoscope()`. Cần đọc trực tiếp toàn bộ cấu trúc object `horoscope()` trả về (không chỉ nhánh `yearly`) để tìm đúng field, hoặc đối chiếu tên gốc tiếng Trung khác.
- **Tứ Hóa lưu niên hoàn toàn CHƯA được đọc** (phát hiện khi điều tra, KHÁC với vấn đề trên): `extractSihua()` (`src/chart/adapter.ts:49-61`) chỉ đọc `star.mutagen` từ `palace.majorStars`/`minorStars` (Tứ Hóa BẢN MỆNH), luôn gán cứng `source: 'ban_menh'` — không có nhánh nào đọc Tứ Hóa lưu niên (dù `LuuNien.mutagen: string[]` đã tồn tại từ trước, chưa map vào `sihua` của từng `LuuNienPalace`). 4 mục "L.Hóa X" trong fixture case Phạm Duy (L.Hóa Kỵ, L.Hóa Quyền, L.Hóa Khoa, L.Hóa Lộc) chưa được `crosscheck:full` verify vì lý do này — script hiện chỉ đếm số lượng, không so khớp.

Cả 2 nhóm trên đều ngoài phạm vi đã chốt cho lần sửa này (chỉ định `jiangqian`/`suiqian`/`nominal_age`) — để phase riêng sau khi cần.

**Các trường hợp từng ghi ở mục Known Issues — [ĐÃ GIẢI QUYẾT]:**
- Chủ mệnh lệch "Cự Môn" vs "Lộc Tồn" → đã khớp sau đổi algorithm (xem cập nhật ở trên).
- Tác động của `algorithm: 'zhongzhou'` lên các field khác → đã khảo sát và cập nhật toàn suite test (xem `docs/superpowers/specs/2026-08-21-algorithm-zhongzhou-design.md`).

Sau khi `buildChart()` chạy ra kết quả cho input Phạm Duy, so từng cung với bảng transcript mục 6.
Nếu có lệch giữa `iztro` và reference #1, phân loại vào đúng 1 trong 3 nhóm sau — **không được
mặc định reference #1 đúng chỉ vì nó đến trước hoặc "nhìn uy tín"**:

1. **Bug thật trong adapter/code của ta** (vd đọc sai field, map nhầm cung, off-by-one) — sửa,
   thêm assertion cụ thể để bắt lại lỗi đó (giống bài học mục 8 build spec: mỗi lỗi tìm ra phải
   có regression test). Đây là trường hợp DUY NHẤT được phép "sửa cho khớp".
2. **Khác biệt trường phái hợp lệ** (vd `iztro` và tuvi.vn dùng công thức an sao phụ tinh khác
   nhau cho cùng 1 sao, hoặc cách tính Tuần/Triệt khác nhau) — KHÔNG sửa để ép khớp. Ghi cả 2 kết
   quả vào báo cáo, đặt `engine_meta.school_used` mô tả trường phái `iztro` đang dùng, và note
   rõ "tuvi.vn cho kết quả khác ở điểm X, nghi là khác trường phái, chưa xác nhận".
3. **Chưa xác định được nguyên nhân** — đây là trạng thái mặc định khi không đủ căn cứ để xếp
   vào (1) hay (2). Ghi vào báo cáo là "cần nghiên cứu thêm", giữ nguyên output của `iztro` (vì
   đó là engine ta chọn dùng), KHÔNG tự ý sửa theo reference #1 chỉ để 2 bên khớp nhau.

Nguyên tắc chung: bất đồng giữa 2 nguồn là dữ liệu cần trình bày trung thực trong báo cáo cuối,
không phải thứ cần "giải quyết cho êm" bằng cách chọn 1 bên.

## 8. Testing

- Framework: **Vitest**.

**Làm rõ phạm vi của "sai 1 sao/1 cung là không chấp nhận được" (mục 14 build spec) — điểm này
áp dụng cho LỖI CODE (đọc sai field của `iztro`, map nhầm cung, thiếu trường, off-by-one, lỗi
transcribe reference #1), KHÔNG áp dụng để ép output `iztro` khớp tuyệt đối reference #1 khi lệch
đó là khác biệt trường phái hợp lệ. Mục 14 và mục 7 không mâu thuẫn khi đọc đúng cách: "chính xác"
nghĩa là code không có bug và không có sai sót transcribe — không có nghĩa "mọi con số phải trùng
tuvi.vn 100%". Quy trình 2 bước bắt buộc:**

1. **Bước phát hiện (không phải bước kết luận):** viết assertion so từng cung trong bảng mục 6
   với output `iztro` để tìm ra toàn bộ điểm lệch (nếu có) — không bỏ sót cung nào, không chỉ
   check vài cung tiêu biểu, vì mục tiêu bước này là tìm hết lệch, chưa phải chốt đúng/sai.
2. **Bước phân loại + chốt assertion (bắt buộc đi qua mục 7 trước khi sửa bất cứ gì):** với mỗi
   điểm lệch tìm được ở bước 1, phân loại theo đúng 3 nhóm mục 7:
   - **Bug thật** → sửa adapter/transcribe, assertion cuối cùng theo reference #1 (khớp mục 6).
   - **Khác trường phái hợp lệ** → **KHÔNG sửa code, KHÔNG đổi config `iztro` cho khớp tuvi.vn
     chỉ để test xanh.** Assertion cuối cùng phải theo đúng output thật của `iztro`, kèm comment
     giải thích lý do khác reference #1 (vd `// iztro dùng công thức an [sao X] khác tuvi.vn,
     xem mục 7`). Test case này CHỦ ĐÍCH không khớp bảng mục 6 ở điểm đó.
   - **Chưa xác định** → assertion theo output hiện tại của `iztro`, đánh dấu `// TODO: cần
     nghiên cứu thêm, xem mục 7` — không chặn việc coi Chart Engine "xong" ở bản này nếu số lượng
     điểm chưa xác định nhỏ và đã liệt kê đầy đủ trong báo cáo cuối; không được tự sửa cho êm.

   Nói cách khác: **assertion cuối cùng trong test suite phản ánh kết quả PHÂN LOẠI, không phải
   luôn luôn phản ánh reference #1.** Không được vì muốn "12/12 cung khớp tuvi.vn cho đẹp" mà bỏ
   qua bước phân loại và ép sửa/ép đổi trường phái `iztro`.

- `test/chart/pham-duy.test.ts`: build chart từ input âm lịch Kỷ Hợi (theo mục 6), assert:
  - `menh_than.same_palace === true`, cung Mệnh = Hợi
  - `cuc.ngu_hanh === 'Thuy'`, `cuc.cuc_so` đúng (Nhị Cục)
  - `ban_menh_nap_am` chứa "Thành Đầu Thổ"
  - Mệnh có `THIEN_DONG` (major) + `DIA_KHONG`, `DIA_KIEP` (minor)
  - Cung Phúc Đức đúng vị trí Sửu với Thái Âm + Thái Dương
  - **Cả 12 cung** trong bảng mục 6: chính tinh + độ sáng (miếu/vượng/đắc/hãm) — chạy qua quy
    trình 2 bước ở trên, không bỏ sót cung nào ở bước phát hiện.
- Không viết test cho input dương lịch ở bản này (chỉ cần cơ chế build được, không có case nền
  dương lịch để đối chiếu) — nhưng code vẫn hỗ trợ input đó theo mục 4 vì tương lai cần.

## 9. Ngoài phạm vi (giữ nguyên theo mục 13 build spec + chỉ đạo mục 14)

Không làm ở bản này: Rule Engine, Conflict Resolver, LLM integration, **UI/UX/CSS**, vector
DB/RAG, billing. Không viết thêm Rule ngoài Entry mẫu mục 9 build spec — đó là việc của giai
đoạn sau.

**Về UI cụ thể (mục 14 build spec):** không tự ý bắt đầu làm UI đẹp/có trang trí trong lúc Chart
Engine chưa được xác nhận chính xác 100% trên case nền. Nếu vì lý do nào đó cần 1 cách xem output
Chart (debug, demo nội bộ), dùng console.log/print JSON hoặc test output thuần — KHÔNG viết
component UI, KHÔNG chọn CSS framework, KHÔNG thiết kế layout ở bản này. Khi tới lúc làm UI (ở
giai đoạn sau, do người dùng yêu cầu riêng), chuẩn tối thiểu là hiển thị đủ thông tin ngang mức
tuvi.vn trước, đẹp/hiệu ứng tính sau.

## 10. Fixture case Phạm Duy chỉ là 1/nhiều — backlog các case còn thiếu

**Quan trọng: pass test case Phạm Duy KHÔNG có nghĩa là "Chart Engine đáng tin cậy nói chung".**
Nó chỉ chứng minh đúng với đúng 1 tổ hợp cụ thể: 1 giới tính (Dương Nam), 1 Cục số (Thủy Nhị
Cục), 1 cách tính chiều Đại Vận tương ứng, tháng sinh không nhuận. Rất nhiều nhánh logic an sao
chưa được chạm tới bởi case này, ví dụ:

- **Giới tính khác** → đổi chiều thuận/nghịch khi an Đại Vận (Dương Nam đi thuận, Âm Nam đi
  nghịch, v.v. — case Phạm Duy chỉ phủ 1 trong 4 tổ hợp Âm Dương × Nam Nữ).
- **Cục số khác** Thủy Nhị Cục là 1 trong 5 cục (Kim/Mộc/Thủy/Hỏa/Thổ) và Nhị Cục là 1 trong các
  cục số (2/3/4/5/6) — chưa test các cục còn lại, vốn ảnh hưởng vị trí an Tử Vi.
- **Tháng nhuận** — case Phạm Duy không rơi vào tháng nhuận âm lịch, chưa test logic
  `isLeapMonth` của `iztro` có map đúng vào adapter hay không.
- Các sao phụ hiếm/ít gặp không xuất hiện trong lá số Phạm Duy — `star-id-map.ts` ở bản này chỉ
  liệt kê sao xuất hiện trong case này (YAGNI có chủ đích, xem mục 5), nghĩa là còn thiếu nhiều
  mã sao chưa được đưa vào bảng tra.

**Việc CHƯA làm ở bản này (backlog, không phải phạm vi bây giờ):** trước khi coi Chart Engine là
"đáng tin cậy nói chung" (khác với "đúng ở đúng 1 trường hợp đã test"), cần bổ sung tối thiểu:
1. 1 chart nữ mệnh (để phủ chiều Đại Vận ngược).
2. 1 chart Cục số khác Thủy Nhị Cục.
3. 1 chart có tháng sinh nhuận.

Mỗi case bổ sung này cần 1 reference implementation độc lập riêng (ảnh lá số từ 1 nguồn nào đó)
để đối chiếu, theo đúng quy trình mục 7 — không tự bịa dữ liệu kỳ vọng. Việc này nằm ngoài phạm
vi bản Chart Engine đầu tiên, ghi lại đây để không bị quên khi đánh giá "đã đủ tin cậy chưa".

**[2026-08-25 — ĐÃ XỬ LÝ MỘT PHẦN, hạ thấp yêu cầu có chủ đích] `test/chart/diverse-cases.test.ts`
thêm cả 3 case, nhưng KHÔNG có reference implementation ảnh thật** — người dùng xác nhận trực
tiếp hạ thấp yêu cầu (không cần đối chiếu ảnh), chỉ cần: (1) không crash, (2) shape dữ liệu hợp
lệ (12 cung, đủ field), (3) logic TỰ NHẤT QUÁN kiểm chứng được bằng công thức đã biết — không
assert giá trị chính tinh/phụ tinh cụ thể nào (sẽ là tự bịa, đúng điều CLAUDE.md mục 6 cấm).

- **Case 1 (nữ mệnh + Cục khác):** `1990-06-15`, nữ, giờ Mão. Verify độc lập bằng script trước
  khi viết assertion (không suy từ code đang test): ra **Hỏa Lục Cục** (khác Thủy Nhị Cục của
  Phạm Duy — phủ được 1 Cục khác). Kiểm tra chiều Đại Vận bằng quy luật cổ điển (Dương Can +
  Nữ → đi nghịch, khác Dương Nam đi thuận của Phạm Duy) — xác định Dương/Âm Can TỪ CHÍNH
  `chart.metadata.chinese_date` của case đó (không hardcode), rồi so với chiều `dai_van` thực
  tế: case này là Canh Ngọ (Canh = Dương Can) + Nữ → đúng đi **nghịch**, khớp quy luật.
- **Case 2 (tháng nhuận):** năm 2023 (âm lịch có tháng 2 nhuận), ngày "2-15". Verify: build với
  `is_leap_month: true` và `is_leap_month: false` cho CÙNG chuỗi ngày âm lịch phải ra 2 ngày
  dương lịch KHÁC NHAU (`2023-4-5` vs `2023-3-6`) — bằng chứng `is_leap_month` thực sự được đọc
  và ảnh hưởng kết quả, không bị bỏ qua âm thầm.
- **Case 3 (ổn định):** build lặp lại 2 lần cùng input, xác nhận kết quả giống hệt (không bị
  "trôi" theo số lần gọi trước đó — cùng tinh thần guard đã có ở `algorithm-config.test.ts`).

**Còn treo (không đóng hẳn mục 10):** đây KHÔNG phải "đã đủ tin cậy nói chung" theo đúng nghĩa
ban đầu của mục 10 — chỉ xác nhận Chart Engine không crash và 1 vài quy luật tổng quát (chiều
Đại Vận, tôn trọng `is_leap_month`) đúng như lý thuyết. Chưa verify chính tinh/phụ tinh cụ thể
của 3 case này có đúng không (cần ảnh đối chiếu thật, như đã làm cho case Phạm Duy qua
`full-crosscheck-fixture.ts`) — nếu sau này có ảnh/nguồn đối chiếu cho 1 trong 3 case, nên bổ
sung fixture đầy đủ theo đúng mẫu `pham-duy-full.ts`.
