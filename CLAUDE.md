# Nguyên tắc nền tảng — Đọc trước khi làm bất cứ việc gì trong repo này

> File này khác `TuVi_Build_Spec_v1.md` và các design doc trong `docs/superpowers/specs/`.
> Những file đó là **việc cụ thể cần làm**. File này là **tại sao ta làm theo cách đó** —
> không đổi theo từng task, không phụ thuộc ai có nhớ nhắc lại hay không.
>
> Nếu 1 chỉ dẫn trong build spec/design doc có vẻ mâu thuẫn với nguyên tắc ở đây, hoặc không
> rõ áp dụng thế nào cho tình huống đang gặp: **dừng lại, viết ra cách hiểu của bạn, hỏi lại
> trước khi code** — đừng tự suy diễn theo nghĩa đen rồi làm.

## 1. Dự án này là gì, tóm tắt 1 câu

Hệ thống tính lá số Tử Vi **deterministic** (code, không LLM) + kho tri thức luận giải **có cấu
trúc và nguồn gốc** (không phải văn bản tự do) + LLM chỉ **diễn giải** dữ liệu đã có sẵn, không
tự tính toán, không tự bịa tri thức.

## 2. Ranh giới cứng — không bao giờ được vượt qua dù lý do gì

- An sao, quan hệ cung (tam hợp/xung chiếu), Tứ Hóa: **code tính, không LLM tính.**
- LLM chỉ nhận Evidence Pack đã tính sẵn, không tự tạo Rule/Source mới, không tự chọn phe khi
  2 nguồn tri thức mâu thuẫn.
- Khi 2 nguồn tri thức mâu thuẫn nhau: lưu cả hai (`conflict_group_id`), không ép về 1 đáp án.

## 3. "Chính xác" nghĩa là gì — dễ hiểu sai nhất, đọc kỹ

**"Chính xác" = không có bug code, không có lỗi transcribe/gõ nhầm dữ liệu.**
**"Chính xác" KHÔNG có nghĩa = output phải trùng tuyệt đối 1 nguồn tham khảo cụ thể (VD ảnh
tuvi.vn) khi chỉ lệch là do khác biệt trường phái hợp lệ.**

- Đúng: `iztro` tính sai vì đọc nhầm field → sửa code, assert theo nguồn đối chiếu.
- Đúng: `iztro` và tuvi.vn ra khác nhau vì 2 bên implement 2 công thức phụ tinh khác nhau →
  **giữ nguyên** output của `iztro`, ghi chú lý do khác biệt, KHÔNG đổi config/code để ép khớp.
- Sai: thấy test đỏ vì lệch tuvi.vn → mặc định coi đó là bug, sửa cho khớp mà không phân loại
  trước xem có phải khác trường phái hay không.

Quy trình phân loại đầy đủ khi phát hiện lệch: xem `docs/superpowers/specs/2026-08-16-chart-engine-design.md` mục 7 (bug / khác trường phái hợp lệ / chưa xác định — 3 nhánh, không được bỏ qua nhánh 2 và 3).

## 4. Không có "ground truth" tuyệt đối — chỉ có "reference implementation"

Mọi nguồn đối chiếu (ảnh tuvi.vn, `iztro`, sách, lời thầy) đều là **1 cách triển khai/1 quan
điểm cụ thể**, không phải chân lý. Gọi đúng tên ("reference implementation #1", không phải
"ground truth") để tự nhắc mình không mặc định 1 bên đúng.

## 5. Không chắc chắn phải được NÓI RÕ là không chắc chắn

Nếu tra cứu không ra nguồn xác nhận, hoặc 2 nguồn nói khác nhau mà chưa rõ vì sao: đánh dấu
`consensus: tranh_cai` hoặc "chưa xác định", KHÔNG tự chọn 1 bên nghe hợp lý hơn rồi trình bày
như đã chốt. Trạng thái "chưa biết" là kết quả hợp lệ, không phải thất bại cần che đi.

## 6. Ngay cả dữ liệu "tĩnh" cũng phải verify, không tin theo trí nhớ

Lịch sử dự án đã bắt được nhiều lỗi loại này (Tỵ/Hợi tưởng nhầm tam hợp — thực ra là xung
chiếu; Cự Môn/Thiên Cơ ở Mão ghi nhầm Hãm — thực ra Miếu; nhãn Tý/Tỵ bị hoán đổi khi transcribe
ảnh; bảng Tứ Hóa Can Mậu đoán sai). Mẫu số chung: **nhầm giữa 2 giá trị gần giống nhau, hoặc
tin vào trí nhớ thay vì đối chiếu nguồn**. Với bất kỳ bảng tra cố định nào (quan hệ cung, Tứ
Hóa, miếu vượng đắc hãm...) — verify bằng nguồn/hàm có sẵn (`iztro`), không tự gõ theo trí nhớ.

## 7. Thứ tự ưu tiên hiện tại — không tự ý đổi

1. Độ chính xác + đầy đủ của Chart Engine (code tính toán) — ưu tiên cao nhất.
2. UI/UX/CSS — CHƯA làm. Khi làm, chuẩn tối thiểu là đủ thông tin ngang tuvi.vn, chưa cần đẹp.
3. Rule Engine / kho tri thức mở rộng — làm song song, không chặn Chart Engine, nhưng không
   viết Rule mới ngoài phạm vi đang được yêu cầu cụ thể.
4. LLM integration — sau khi có Evidence Pack ổn định, không làm sớm.

Không tự ý nhảy việc giữa các mục trên chỉ vì "tiện đang code".

## 8. Trước quyết định lớn — checkpoint bắt buộc

Với: thay đổi schema, thêm loại Rule mới, quyết định kiến trúc, hoặc bất kỳ việc nào design doc
hiện tại chưa nói rõ phải làm sao — **viết ra cách hiểu + kế hoạch bằng lời trước, đưa cho
người dùng xem, đợi xác nhận rồi mới code.** Rẻ hơn nhiều so với code xong rồi mới phát hiện
hiểu sai (đã xảy ra nhiều lần trong dự án này).

## 9. Biên soạn tri thức — không phải việc "tự nhiên đúng"

Mọi bảng ánh xạ tri thức mới (VD: domain câu hỏi → cung nào liên quan, trạng thái hôn nhân →
cung nào để xem) là **tri thức Tử Vi thật, có thể có dị bản giữa trường phái**, không phải suy
luận logic thuần túy. Không hard-code ngầm trong code — đi qua đúng quy trình Rule/Source như
mọi tri thức khác, kể cả khi nó "nghe hợp lý".

## 10. Ghi lại việc dở dang — đừng để trôi theo hội thoại

Nếu phát hiện 1 vấn đề nhưng chưa xử lý xong ngay (VD đang bận việc khác), ghi vào mục
"Known issues / chưa xử lý" đầu design doc liên quan. Không dựa vào việc "nhớ quay lại sau" —
đã có tiền lệ 1 phát hiện đúng bị trôi mất vài lượt trao đổi vì không ai ghi lại.

## 11. Mockup/UI có nội dung Tử Vi thật — không được viết tay dữ liệu

Mọi mockup, demo, hoặc UI hiển thị dữ liệu lá số (tên sao, độ sáng, tên cung, chủ mệnh, Đại
Vận...) **PHẢI lấy từ `buildChart()`/API thật**, KHÔNG viết tay bất kỳ giá trị nào dù chỉ để
minh họa bố cục/màu sắc nhanh. Đây là mục 6 (đừng tin trí nhớ, phải verify bằng nguồn/hàm có
sẵn) áp dụng cho tầng trình bày (UI/mockup) — tầng này trước đây chưa từng bị lộ rủi ro, vì mọi
việc verify trước giờ chỉ nhắm vào Chart Engine/Rule Engine, không nhắm vào việc dựng giao diện.

Nếu 1 giá trị phụ thuộc lựa chọn trường phái đang cấu hình (VD `algorithm: 'default'` vs
`'zhongzhou'` của `iztro` — xem `docs/superpowers/specs/2026-08-18-ui-design.md`), UI phải hiển
thị đúng giá trị mà cấu hình hiện tại trả về, không tự đoán/gõ theo trí nhớ con số "nghe đúng
hơn" từ 1 nguồn khác — đúng tinh thần mục 3, không ép 1 nguồn thắng khi chưa phân loại.

- Đúng: dựng mockup UI → gọi `buildChart()` với input case đã verify (VD Phạm Duy) → đọc trực
  tiếp `major_stars[].strength`, `palace_name`, `menh_than.soul_star`... từ kết quả trả về.
- Sai: nhớ mang máng "cung Mệnh hình như Đắc" rồi gõ "Đắc" vào mockup cho nhanh, không chạy lại
  code để xác nhận — đã xảy ra thật (10 giá trị `strength` + 1 khái niệm "Mệnh chủ" bị gõ sai/
  nhầm lẫn khi dựng 1 mockup UI, dù dữ liệu thật đã có sẵn trong chính phiên làm việc đó).

Nếu cần dữ liệu cho case khác (nhiều/ít sao hơn, để test layout) — build bằng input khác qua
`buildChart()`, không tự nghĩ ra giá trị.
