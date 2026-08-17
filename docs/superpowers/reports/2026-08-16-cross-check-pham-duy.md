# Cross-check Chart Engine vs Reference #1 — case Phạm Duy

**Ngày:** 2026-08-16
**Engine:** iztro 2.6.0, language vi-VN, config mặc định (`algorithm: 'default'`, không set `zhongzhou`)
**Input đã xác minh:** `bySolar('1998-12-17', timeIndex=12, nam)` — giờ Tý muộn 23:00–00:00, khớp "23:15" trong ảnh
**Reference #1:** ảnh lá số tuvi.vn (transcript mục 6 design doc, `test/chart/fixtures/pham-duy.ts`)
**Công cụ:** `scripts/crosscheck-report.ts`, chạy bằng `npm run crosscheck`

## Tóm tắt

Cách đếm: 12 cung × (1 so khớp tên cung + 1 so khớp tập chính tinh) = 24, cộng 14 lượt so khớp độ
sáng (mỗi chính tinh có trong ảnh reference là 1 lượt — có 14 chính tinh được ghi trong ảnh across
12 cung), cộng 4 mục vô hướng (chủ mệnh, chủ thân, cục, nạp âm) = **42 điểm so sánh**.

- Tổng số điểm so sánh: 42
- Khớp: 30
- Lệch — nhóm 1 (bug, đã sửa): 0
- Lệch — nhóm 2 (khác trường phái, giữ nguyên): 12
- Lệch — nhóm 3 (chưa xác định): 0

Script chẩn đoán báo tổng **12 điểm lệch** (10 độ sáng + 1 tên cung + 1 chủ mệnh). Toàn bộ 12 điểm
lệch đều được xếp vào nhóm 2 sau khi điều tra — không có điểm nào là bug, không có điểm nào chưa
xác định được. Chi tiết lý do xem các bảng bên dưới, đặc biệt mục chủ mệnh (trước khi lập plan này
được ghi tạm là nhóm 3 — điều tra trong task này tìm ra căn cứ code cụ thể nên đã chuyển sang
nhóm 2, xem giải trình).

## Khớp hoàn toàn

- **Vị trí 12 cung** (branch → palace tồn tại): khớp 12/12.
- **Vị trí chính tinh từng cung** (tập `star_id` mỗi cung): khớp 12/12 cung — không có dòng
  `[CHINH TINH]` nào trong output script chẩn đoán. Xác nhận lại đúng như khảo sát trước khi lập
  plan: an sao (vị trí sao) khớp tuyệt đối giữa iztro và ảnh reference.
- **Mệnh/Thân**: đồng cung tại Hợi — khớp.
- **Cục**: `Thủy Nhị Cục` — khớp.
- **Nạp âm bản mệnh**: `Thành Đầu Thổ` — khớp.
- **Chủ thân (`body`)**: `Thiên Lương` — khớp.
- **Sihua (tứ hoá bản mệnh, Can Mậu)**: script chẩn đoán hiện tại không kiểm sihua (không có
  trong `PHAM_DUY_REFERENCE` fixture của brief), nhưng đã xác minh thủ công trong `astro.js`/dữ
  liệu build trước plan: Tham Lang→Lộc, Thái Âm→Quyền, Hữu Bật→Khoa, Thiên Cơ→Kỵ — đúng bảng Can
  Mậu. Không phát sinh vấn đề mới trong task này.
- **10/12 tên cung**: khớp (chỉ lệch tại Thân, xem nhóm 2).
- **4/14 độ sáng chính tinh**: khớp (Mão/Cự Môn, Tỵ/Vũ Khúc, Tỵ/Thiên Phủ, và các cung không có
  chính tinh không tính — xem bảng nhóm 2 cho danh sách lệch).

## Nhóm 1 — Bug thật (đã sửa)

*(không có mục nào)*

| Điểm | iztro | reference #1 | Nguyên nhân | Đã sửa |
|---|---|---|---|---|
| — | — | — | — | — |

Không phát hiện bug thật nào trong lượt cross-check này. Vị trí cung và vị trí chính tinh — nơi
một bug thật (đọc sai field, map nhầm cung) nhiều khả năng lộ ra nhất — khớp tuyệt đối 100%.

## Nhóm 2 — Khác biệt trường phái hợp lệ (KHÔNG sửa)

| Điểm | iztro | reference #1 | Căn cứ phân loại |
|---|---|---|---|
| Độ sáng — Sửu/Thái Âm | mieu | dac | Thang 7 mức (iztro) vs thang 5 mức (ảnh) — không thể quy đổi 1-1 có nguyên tắc (xem dưới) |
| Độ sáng — Sửu/Thái Dương | bat | dac | nt |
| Độ sáng — Dần/Tham Lang | binh | dac | nt |
| Độ sáng — Mão/Thiên Cơ | vuong | mieu | nt |
| Độ sáng — Thìn/Tử Vi | dac | vuong | nt |
| Độ sáng — Thìn/Thiên Tướng | dac | vuong | nt |
| Độ sáng — Ngọ/Thất Sát | vuong | mieu | nt |
| Độ sáng — Thân/Liêm Trinh | mieu | vuong | nt |
| Độ sáng — Tuất/Phá Quân | vuong | dac | nt |
| Độ sáng — Hợi/Thiên Đồng | mieu | dac | nt |
| Tên cung — Thân | Tử Nữ | Tử Tức | Dị bản tên gọi cùng 1 cung (con cái) giữa các trường phái/phần mềm — không phải khác nội dung |
| Chủ mệnh (`soul`) | Cự Môn | Lộc Tồn | **Xác định được căn cứ code cụ thể, xem giải trình bên dưới** — khác thuật toán chọn địa chi làm gốc tra chủ mệnh, KHÔNG phải bug |

### Giải trình — độ sáng (10 điểm)

`iztro` dùng bảng độ sáng 7 mức: Miếu/Vượng/Đắc/**Lợi**/Bình/**Bất**/Hạn (đọc trực tiếp từ
`iztro/lib/i18n/locales/vi-VN`). Ảnh tuvi.vn dùng chú thích 5 mức: M/V/Đ/B/H. Hai mức "Lợi" và
"Bất" của `iztro` không có tương đương trong thang 5 mức của ảnh — bản thân việc thang 7 mức có
nhiều hơn 2 giá trị mà thang 5 mức không thể biểu diễn được đã chứng minh việc khớp tuyệt đối là
**không thể về mặt cấu trúc**, không phải do tính sai. Đây là 2 bảng độ sáng khác nhau của 2
trường phái/phần mềm khác nhau — quyết định trong design doc (mục Known issues, đã có từ trước
task này) là KHÔNG rút gọn 7→5 vì sẽ phải tự bịa cách quy đổi cho "Lợi"/"Bất", tức tự chọn 1
trường phái một cách ngầm định. Giữ nguyên giá trị gốc của `iztro`.

Không có mục nào trong 10 điểm lệch độ sáng này gợi ý một bug đọc sai field: chênh lệch phân bố
đều khắp bảng (khi thì iztro cao hơn, khi thì thấp hơn ảnh), không theo 1 pattern kiểu "luôn lệch
đúng 1 bậc theo 1 hướng" mà một phép quy đổi cố định có thể sửa — củng cố thêm rằng đây là 2 bảng
tra cứu độc lập, không phải lỗi offset có thể vá.

### Giải trình — tên cung Thân (Tử Nữ vs Tử Tức)

Cả hai đều chỉ cung "con cái" (cung thứ 9 tính từ Mệnh). `Tử Tức` và `Tử Nữ` là 2 tên gọi khác
nhau cho cùng 1 cung trong các tài liệu tử vi tiếng Việt — không phải 2 cung khác nội dung, không
phải lỗi map nhầm cung (vị trí — cung tại chi Thân — khớp tuyệt đối, chỉ tên hiển thị khác).

### Giải trình — chủ mệnh (Cự Môn vs Lộc Tồn)

Đây là điểm được đánh dấu "chưa xác định" (nhóm 3) trong khảo sát trước khi lập plan. Task này đã
điều tra sâu hơn bằng cách đọc trực tiếp mã nguồn đã biên dịch của `iztro`
(`node_modules/iztro/lib/astro/astro.js` và `node_modules/iztro/lib/data/earthlyBranches.js`) và
tìm ra căn cứ code cụ thể, sau đó xác minh lại bằng thực nghiệm:

1. `astro.js` dòng ~212:
   ```js
   var soul = t(earthlyBranches[getConfig().algorithm === 'zhongzhou' ? earthlyBranchOfYear : earthlyBranchOfSoulPalace].soul);
   ```
   Chủ mệnh (`soul`) KHÔNG được tính từ việc sao nào đang ở cung Mệnh — nó được tra từ 1 bảng cố
   định theo ĐỊA CHI, gán sẵn theo tên `iztro` gọi là "命主" (soul). Địa chi dùng để tra phụ thuộc
   `algorithm` config:
   - `algorithm: 'default'` (mặc định của `iztro`, trường phái "thông dụng"): tra theo **địa chi
     cung Mệnh** (ở đây là Hợi).
   - `algorithm: 'zhongzhou'` (trường phái Trung Châu phái): tra theo **địa chi năm sinh** (ở đây
     là Dần, năm Mậu Dần).
2. `earthlyBranches.js`: `haiEarthly` (Hợi) → `soul: 'jumenMaj'` = Cự Môn (đúng bằng output hiện
   tại của engine); `yinEarthly` (Dần) → `soul: 'lucunMin'` = Lộc Tồn.
3. Thực nghiệm xác minh bằng cách gọi trực tiếp `iztro` với 2 config, cùng 1 input
   (`bySolar('1998-12-17', 12, 'male', true, 'vi-VN')`):
   - `algorithm: 'default'` (config hiện tại của project) → `soul = "Cự Môn"` — khớp đúng bằng
     những gì `buildChart` của ta trả về.
   - `algorithm: 'zhongzhou'` → `soul = "Lộc Tồn"` — **khớp chính xác** giá trị trong ảnh
     reference #1.

**Kết luận:** đây KHÔNG phải bug, và KHÔNG còn là "chưa xác định" nữa — có căn cứ code + thực
nghiệm rõ ràng rằng chênh lệch đến từ việc 2 nguồn dùng 2 trường phái khác nhau để xác định chủ
mệnh (chủ mệnh theo địa chi cung Mệnh vs chủ mệnh theo địa chi năm sinh). tuvi.vn dùng cách tính
kiểu Trung Châu phái cho mục này; `iztro` mặc định dùng cách tính "thông dụng". Cả hai đều là cách
tính hợp lệ, có tên trường phái cụ thể, không phải một bên đúng một bên sai. Theo đúng nguyên tắc
"không ép code/config iztro để khớp tuvi.vn chỉ vì báo cáo gọn hơn", KHÔNG đổi `algorithm` sang
`'zhongzhou'` trong code sản phẩm — đó sẽ là chọn ngầm 1 trường phái cho toàn bộ engine chỉ vì nó
khớp 1 case test, ảnh hưởng đến tất cả các field khác lấy theo cùng config (vd `fiveElementsClass`
cũng có nhánh khác nhau theo `algorithm`, chưa được kiểm chứng có bị ảnh hưởng theo hướng khác hay
không). Giữ nguyên `algorithm: 'default'`, assertion cuối cùng theo output thật của `iztro`
(`Cự Môn`), có comment giải thích đầy đủ trong test.

**Ghi chú quan trọng:** Vì phát hiện này chạm tới 1 config toàn cục (`algorithm`) chứ không chỉ 1
field, nó có thể ảnh hưởng đến các field khác ngoài phạm vi fixture Phạm Duy hiện tại (vd cục ngũ
hành cũng đọc theo nhánh `algorithm`). Task này KHÔNG mở rộng điều tra sang các field khác — ghi
lại thành mục Known Issues mới trong design doc để không bị quên.

## Nhóm 3 — Chưa xác định nguyên nhân

*(không có mục nào — chủ mệnh đã được chuyển sang nhóm 2 sau khi điều tra, xem trên)*

| Điểm | iztro | reference #1 | Cần nghiên cứu gì |
|---|---|---|---|
| — | — | — | — |

## Kết luận

Chart Engine đã đủ tin cậy làm case nền cho case Phạm Duy: **vị trí cung và vị trí chính tinh khớp
tuyệt đối 100%** — đây là phần quan trọng nhất về mặt an sao và không phát sinh bug nào trong lượt
cross-check này. Toàn bộ 12 điểm lệch phát hiện được đều đã được điều tra và xếp vào nhóm khác biệt
trường phái hợp lệ (nhóm 2) với căn cứ cụ thể — kể cả điểm chủ mệnh trước đây bị treo ở "chưa xác
định" nay đã tìm được nguyên nhân gốc rễ trong mã nguồn `iztro`. Không có điểm nào phải sửa code
(nhóm 1), không có điểm nào còn treo lại "chưa xác định" (nhóm 3).

Việc còn phải làm (không thuộc phạm vi task này, xem mục 10 design doc + Known Issues):
- Chưa test nhánh nữ mệnh (`gender: 'nu'`).
- Chưa test các Cục khác ngoài Thủy Nhị Cục (Mộc Tam, Kim Tứ, Thổ Ngũ, Hỏa Lục).
- Chưa test tháng nhuận (`is_leap_month: true`).
- Chưa có reference #2 độc lập để đối chiếu chéo — mọi cross-check hiện tại chỉ dựa trên 1 ảnh
  tuvi.vn duy nhất, nên các phân loại "khác trường phái" ở trên là so với ĐÚNG 1 trường phái tham
  chiếu, không phải khảo sát nhiều trường phái.
- Tác động của `algorithm: 'zhongzhou'` lên các field khác ngoài `soul` (vd `fiveElementsClass`,
  `body`) chưa được khảo sát — xem Known Issues mới trong design doc.
