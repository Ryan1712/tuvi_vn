# Chart Engine (Phase 2) — Design Spec

**Ngày:** 2026-08-16
**Phạm vi:** Chỉ Chart Engine (mục 1, 3, 7 của `TuVi_Build_Spec_v1.md`). KHÔNG bao gồm Rule Engine,
Conflict Resolver, hay LLM — những phần đó nằm ngoài phạm vi bản này (xem mục 13 của build spec).

**Định nghĩa "xong" cho bản này:** code Chart Engine chạy được, có test tự động (Vitest) assert
đúng case Phạm Duy, cross-check khớp với lá số gốc từ tuvi.vn, rồi dừng lại báo cáo kết quả trước
khi làm tiếp Rule Engine.

---

## 1. Bối cảnh & nguồn tham khảo

- `TuVi_Build_Spec_v1.md` — đặc tả đầy đủ, là ngữ cảnh bắt buộc phải tuân theo.
- `tuvi_rule_engine_prototype.py` — prototype Python chứng minh Chart Data Shape + Rule Schema
  khả thi. Dùng để tham khảo *cách tư duy evaluator* (condition/modifier/exception tách riêng),
  KHÔNG dùng dữ liệu chart trong đó làm ground truth — đó là dữ liệu rút gọn tự nghĩ, chỉ đủ để
  chứng minh shape hoạt động, và tự thừa nhận sai lệch (vd Tỵ/Hợi tưởng nhầm là tam hợp).
- **Ảnh lá số gốc từ tuvi.vn** (người dùng cung cấp 2026-08-16) — nguồn cross-check độc lập,
  dùng làm **ground truth duy nhất** cho fixture test case Phạm Duy. Transcript đầy đủ ở mục 6.

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
│       │   └── pham-duy.ts   # transcript đầy đủ từ ảnh tuvi.vn, dùng làm expected data
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

## 6. Ground truth: transcript lá số Phạm Duy (từ ảnh tuvi.vn)

Dùng làm dữ liệu kỳ vọng trong `test/chart/fixtures/pham-duy.ts`. Đây là **nguồn duy nhất** —
không dùng số liệu rút gọn trong `tuvi_rule_engine_prototype.py` làm ground truth (xem mục 1).

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
| Tý | Thiên Di | Thiên Lương (H) | Lộc Tồn, Thiếu Âm, Bác Sỹ |
| Sửu | Phúc Đức | Thái Âm (Đ), Thái Dương (Đ) | Hữu Bật, Tả Phù, Thiên Khôi, Quốc Ấn, Hồng Loan, Thiên Thọ |
| Dần | Điền Trạch | Tham Lang (Đ) | Phong Cáo, Ân Quang, Hóa Lộc |
| Mão | Quan Lộc | Cự Môn (H), Thiên Cơ (H) | Thiên Phúc, Thiên Quan, Đào Hoa, Thiếu Dương, Linh Tinh (Đ), Thiên Không, Phục Binh, Hóa Kỵ, Hóa Quyền |
| Thìn | Nô Bộc | Tử Vi (V), Thiên Tướng (V) | Văn Khúc (Đ), Đà La (Đ), Địa Giải, Thiên Khốc (H), Tang Môn, Quan Phù, Thiên La, Thiên Thương |
| Tỵ | Phụ Mẫu | Vũ Khúc (V), Thiên Phủ (M) | Hỷ Thần, Thiên Quý, Điếu Khách, Thiên Khốc, Thiên Hư |
| Ngọ | Tật Ách | Thất Sát (M) | Thai Phụ, Thiên Hình (H), Thiên Trù, Kình Dương (H), Long Trì, Lực Sỹ, Quan Phù, Thái Tuế, Tam Thai, Kình Dương, Văn Khúc, Thiên Sứ |
| Mùi | Tài Bạch | (vô chính diệu — chỉ có phụ tinh) | Thiên Việt, Tử Phù, Thiên Hỉ, Nguyệt Đức, Thanh Long |
| Thân | Tử Tức | Liêm Trinh (V) | Văn Tinh, Thiên Mã (H), Giải Thần, Phượng Các, Bát Tọa, Văn Xương, Thiên Mã, Thiên Hư (Đ), Tuế Phá, Tiểu Hao, Tang Môn, Hóa Kỵ |
| Dậu | Phu Thê | (vô chính diệu) | Long Đức, Hồng Loan, Thiên Việt, Phá Toái, Tướng Quân |
| Tuất | Huynh Đệ | Phá Quân (Đ) | Văn Xương (Đ), Thiên Diêu (Đ), Thiên Y, Đường Phù, Hoa Cái, Tấu Thư, Bạch Hổ, Địa Võng, Hóa Khoa |
| **Hợi** | **Mệnh〈Thân〉** | **Thiên Đồng (Đ)** | **Thiên Đức, Phúc Đức, Thiên Khôi, Hóa Lộc, Địa Không (Đ), Địa Kiếp, Kiếp Sát, Phi Liêm** |

(Đ = Đắc, V = Vượng, M = Miếu, H = Hãm — theo chú thích cuối ảnh)

**Điểm mấu chốt cần adapter/test bắt đúng:**
- Mệnh và Thân đồng cung tại **Hợi** (`menh_than.same_palace = true`).
- Cung **Phúc Đức nằm ở Sửu** (không phải Mùi như bản rút gọn trong prototype Python — đây
  chính là sai lệch giữa 2 nguồn mà spec cảnh báo phải điều tra; đã điều tra và chốt ở câu hỏi
  với người dùng: nguồn đúng là ảnh, prototype Python chỉ là dữ liệu rút gọn tự nghĩ).
  Quan hệ giữa Sửu và Hợi (tam hợp/xung chiếu/khác) KHÔNG được giả định tay trong design doc
  này — đúng bài học mục 8/9 build spec (đừng tin trí nhớ về quan hệ cung). Việc xác định quan
  hệ này là trách nhiệm của `relatedPalace()` gọi hàm gốc `iztro`, và test ở mục 8 sẽ assert
  kết quả cụ thể mà `iztro` trả về, không suy luận trước ở đây.
- Triệt tại Sửu/Thân (theo vị trí "Triệt" trong ảnh, giữa các cung Thìn-Tỵ hàng dưới) và Tuần
  tại Dậu — cần adapter map đúng nếu `iztro` output có trường tương ứng; nếu bản `iztro` đang
  dùng không hỗ trợ Tuần/Triệt trực tiếp thì ghi rõ trong `engine_meta` là "không map được ở
  bản này", KHÔNG bỏ qua âm thầm.
- Cục: Thủy Nhị Cục, Bản mệnh nạp âm: Thành Đầu Thổ.

## 7. Cross-check & xử lý sai lệch

Sau khi `buildChart()` chạy ra kết quả cho input Phạm Duy, so từng cung với bảng transcript mục 6.
Nếu có sai lệch:
1. Xác định là khác trường phái an sao, khác bảng tứ hóa, khác cách tính Tuần/Triệt, hay bug
   trong adapter — ghi rõ nguyên nhân trong báo cáo cuối, không âm thầm "sửa cho khớp".
2. Nếu là khác biệt trường phái hợp lệ (vd `iztro` mặc định dùng trường phái khác tuvi.vn cho 1
   sao phụ nào đó): ghi vào `engine_meta.school_used`, không coi là bug.
3. Nếu là bug thật trong adapter: sửa, thêm assertion cụ thể để bắt lại lỗi đó (giống bài học
   mục 8 build spec — mỗi lỗi tìm ra phải có regression test).

## 8. Testing

- Framework: **Vitest**.
- `test/chart/pham-duy.test.ts`: build chart từ input âm lịch Kỷ Hợi (theo mục 6), assert:
  - `menh_than.same_palace === true`, cung Mệnh = Hợi
  - `cuc.ngu_hanh === 'Thuy'`, `cuc.cuc_so` đúng (Nhị Cục)
  - `ban_menh_nap_am` chứa "Thành Đầu Thổ"
  - Mệnh có `THIEN_DONG` (major) + `DIA_KHONG`, `DIA_KIEP` (minor)
  - Cung Phúc Đức đúng vị trí Sửu với Thái Âm + Thái Dương
  - Với mỗi cung trong bảng mục 6: chính tinh khớp danh sách
- Không viết test cho input dương lịch ở bản này (chỉ cần cơ chế build được, không có case nền
  dương lịch để đối chiếu) — nhưng code vẫn hỗ trợ input đó theo mục 4 vì tương lai cần.

## 9. Ngoài phạm vi (giữ nguyên theo mục 13 build spec)

Không làm ở bản này: Rule Engine, Conflict Resolver, LLM integration, UI, vector DB/RAG,
billing. Không viết thêm Rule ngoài Entry mẫu mục 9 build spec — đó là việc của giai đoạn sau.
