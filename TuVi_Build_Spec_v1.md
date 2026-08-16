# TỬ VI APP — BUILD SPEC v1 (cho Claude Code)

> Đây là tài liệu đặc tả đầy đủ, đúc kết từ quá trình brainstorm kiến trúc + product.
> Mục tiêu của Claude Code khi đọc file này: **bắt đầu code Phase 2 (Chart Engine)**,
> phần schema/nguyên tắc bên dưới là ngữ cảnh bắt buộc phải tuân theo khi code,
> không phải phần cần thiết kế lại từ đầu.

---

## 0. Sản phẩm là gì

Không phải "chatbot xem tử vi". Đây là:

> Một hệ thống tính lá số **deterministic**, truy xuất tri thức Tử Vi có **cấu trúc và provenance**,
> bảo toàn sự khác biệt giữa các trường phái (không ép về 1 đáp án), rồi dùng LLM để
> **diễn giải** (không phải để tính toán hay tự bịa quy tắc).

**Đối tượng người dùng (chọn theo trực giác, chưa qua phỏng vấn thực tế — cần biết để không lạc hướng khi thiết kế UX sau này):** prosumer — người học/nghiên cứu Tử Vi nghiêm túc, cần tra cứu có nguồn, đối chiếu trường phái. Không phải người dùng phổ thông hỏi nhanh.

**Nguyên tắc bất biến xuyên suốt toàn bộ hệ thống:**
- An sao là tính toán **deterministic bằng code**, KHÔNG để LLM tính.
- LLM chỉ **tổng hợp + diễn giải**, KHÔNG được tự bịa Rule, tự bịa Source, không tự ý chọn 1 trường phái làm "đúng" khi 2 nguồn mâu thuẫn.
- Khi 2 nguồn/trường phái mâu thuẫn nhau: lưu cả hai, gắn `conflict_group_id`, để người dùng cuối tự thấy sự khác biệt — không để hệ thống "chọn phe".
- `Source.reliability_tier` (độ tin cậy của nguồn) và `Rule.consensus` (mức đồng thuận của quy tắc) là **2 trục độc lập**, không suy cái này ra cái kia.

---

## 1. Việc cần làm NGAY (Phase 2 — Chart Engine)

1. Cài `iztro` (npm, MIT license, đã xác nhận an toàn dùng thương mại — xem mục 7).
2. Viết adapter chuyển output của `iztro` sang **Chart Data Shape v0.1** (mục 3 bên dưới).
3. Test bằng chart Phạm Duy (dữ liệu mẫu ở mục 6).
4. Cross-check output `iztro` với ít nhất 1 nguồn độc lập khác (ảnh lá số gốc từ tuvi.vn đính kèm trong dự án, hoặc thư viện Python `lasotuvi`) — KHÔNG coi `iztro` là ground truth ngay, nếu lệch phải xác định: khác trường phái an sao? khác bảng Tứ Hóa? khác cách tính lịch? hay bug?
5. Chưa cần làm Rule Engine / Conflict Resolver / LLM ở bước này — chỉ cần Chart Engine chạy đúng và có test.

**Khuyến nghị ngôn ngữ:** vì `iztro` là thư viện TS/JS gốc (có sẵn hàm tam phương tứ chính, đối cung, tứ hóa theo thiên can, xử lý đa trường phái qua config/plugin), nên dùng **TypeScript/Node.js** cho toàn bộ backend thay vì Python, để tránh phải bridge 2 ngôn ngữ. (Bản prototype rule-evaluator ở mục 8 hiện viết bằng Python để chứng minh khả thi nhanh — khi build thật nên port logic đó sang TS.)

---

## 2. Nguyên tắc biên soạn tri thức

- **Khung xương sống:**
  - Lớp nền (từ vựng, ý nghĩa cơ bản sao/cung): Vân Đằng Thái Thứ Lang — Tử Vi Đẩu Số Tân Biên
  - Lớp suy luận sâu (logic cách cục): Trung Châu phái
  - KHÔNG mặc định 1 trường phái là "đúng tuyệt đối".
- Mỗi Rule cần: nội dung quy tắc, `scope`, `conditions`, `modifiers`, `exceptions`, `conclusion`, `school`, `sources`, `source reliability`, `rule consensus`, `conflict_group` (nếu có), case thực tế (nếu có).
- Rule **không phải đoạn văn tự do** — phải đủ structured để máy query/evaluate được.
- Cảnh báo bắt buộc giữ trong code/UI: số liệu tổng hợp từ tập Case (vd "X% case phù hợp Rule Y") KHÔNG được trình bày như xác suất khoa học — mẫu không ngẫu nhiên, không kiểm soát biến nhiễu, chỉ là "empirical evidence" tham khảo.

---

## 3. Chart Data Shape v0.1 (Lớp A — Fact, chưa gồm thuật toán)

```yaml
Chart:
  chart_id: string
  metadata:
    birth_datetime: string
    gender: enum [nam, nu]
    calendar_type: enum [duong_lich, am_lich]
    year_can_chi: string
  menh_than:
    menh_palace_id: ref(Palace)
    than_palace_id: ref(Palace)
    same_palace: bool
  cuc:
    ngu_hanh: enum [Kim, Moc, Thuy, Hoa, Tho]
    cuc_so: enum [2,3,4,5,6]
  ban_menh_nap_am: string
  palaces[12]:
    branch: enum [Ty, Suu, Dan, Mao, Thin, Ty2, Ngo, Mui, Than, Dau, Tuat, Hoi]
    palace_name: string          # Mệnh, Phụ Mẫu, Phúc Đức...
    palace_stem: string          # Thiên can của cung (cho tứ hóa lưu)
    major_stars: [{star_id, strength: enum[mieu,vuong,dac,binh,ham]}]
    minor_stars: [{star_id}]
    sihua: [{star_id, type: enum[Loc,Quyen,Khoa,Ky], source: enum[ban_menh,dai_van,luu_nien]}]
  luck_cycles:
    dai_van: [{age_from, age_to, palace_id}]
    tieu_van: [...]
    luu_nien: [...]
  engine_meta:
    school_used: string    # phái an sao dùng — VÌ CÓ DỊ BẢN AN SAO GIỮA CÁC PHÁI
    engine_version: string
```

**Quan trọng — phân biệt 2 loại dữ liệu:**
- **Per-chart data** (lưu trong Chart): sao ở cung nào, Mệnh/Thân, Cục, thiên can địa chi, đại vận, trạng thái sao...
- **Static knowledge / derived fields** (KHÔNG lưu trong Chart, tính lúc query từ bảng tra cố định):
  - Quan hệ tam hợp/xung chiếu/nhị hợp giữa 12 cung (VD: Tỵ↔Hợi là xung, KHÔNG phải tam hợp; Hợi–Mão–Mùi mới là tam hợp — lỗi này đã từng xảy ra khi prototype, xem mục 9)
  - Bảng Tứ Hóa theo Thiên Can (VD: Mậu → Tham Lang Lộc, Thái Âm Quyền, Hữu Bật Khoa, Thiên Cơ Kỵ)
  - `iztro` đã có sẵn hàm cho cả 2 việc này — không cần tự viết lại (xem mục 7).

`star_id` dùng bộ mã chuẩn hóa cố định (không dùng chuỗi tiếng Việt có dấu tự do, tránh lệch chính tả/dị bản) — ví dụ `DIA_KHONG`, `DIA_KIEP`, `THIEN_DONG`. **Việc còn thiếu, cần làm sớm:** lập bảng tra `star_id` ↔ tên hiển thị tiếng Việt.

---

## 4. Rule Schema v0.1 (Lớp B)

```yaml
Rule:
  rule_id: string
  conflict_group_id: string | null   # nhiều rule cùng group = đang tranh cãi nhau
  scope: enum [star_palace, star_pair, star_combination, palace_relationship,
               four_transform, pattern, decade, annual, spouse_matching]
  subject: {type: enum[star,palace,pattern], id: string}

  condition:                # điều kiện BẮT BUỘC để rule áp dụng
    field: string            # vd "palace.minor_stars"
    operator: enum [contains, not_contains, equals, in, not_in]
    value: string
    required: true

  modifier:                 # yếu tố GIA GIẢM (mềm) — KHÔNG dùng weight để quyết định
    field: string            # có phải điều kiện bắt buộc hay không (đó là việc của condition.required)
    operator: string
    value: string
    effect: string
    weight: float             # weight CHỈ dùng trong modifier, không gộp chung với condition

  exception:                # NGOẠI LỆ — semantic riêng biệt, không gộp vào weight
    conditions: [Condition]
    effect: string

  conclusion:
    text: string
    valence: enum [cat, hung, trung_tinh]
    magnitude: enum [nhe, vua, manh]

  school: string
  sources: [ref(Source)]             # many-to-many, xem mục 5
  consensus: enum [cao, trung_binh, tranh_cai]   # ĐỘC LẬP với source.reliability_tier
  exceptions: [Exception]
  notes: string
```

**3 khái niệm `condition` / `modifier` / `exception` KHÔNG được gộp thành 1 con số `weight`** — dùng 1 float để gánh cả 3 sẽ biến hệ thống thành scoring engine kiểu máy học, sai bản chất miền tri thức này (không phải mọi quy tắc Tử Vi cộng dồn được theo kiểu đó).

---

## 5. Source entity (tách riêng khỏi Rule — quan hệ nhiều-nhiều)

```yaml
Source:
  source_id: string
  type: enum [co_van_nguyen_ban, sach_in_co_tac_gia, dien_dan_web]
  title: string
  author: string | null
  school: string | null
  reliability_tier: enum [1_cao_nhat, 2_trung, 3_thap]  # 1 = cổ văn/chữ Hán gốc, 3 = diễn đàn
  excerpt_or_link: string
```

Một Source có thể support nhiều Rule; một Rule có thể có nhiều Source.

**Lưu ý bản quyền — quan trọng khi build tính năng nạp tri thức sau này:** sách nền tảng (Vân Đằng Thái Thứ Lang, xuất bản 1951/1956) **vẫn còn bản quyền hiệu lực**, đang được bán chính thức. KHÔNG bulk-scrape/nạp nguyên văn PDF vào vector DB. Chỉ dùng: (a) tự viết lại/paraphrase có trích dẫn ngắn (do người hoặc AI biên soạn), (b) nguồn public domain thật sự (văn bản cổ Trung Quốc quá hạn bản quyền), (c) tài liệu do chính người dùng cung cấp và diễn giải lại.

---

## 6. Case Schema v0.1 + Case nền dùng để test

```yaml
Case:
  case_id: string
  chart_id: ref(Chart)
  life_events: [{date, description, category}]
  tested_rules:
    - rule_id: ref(Rule)
      outcome: enum [phu_hop, khong_ro, trai_chieu]
      evidence_note: string
  evidence_quality: enum [tu_bao_cao, xac_minh_cong_khai, nhan_vat_cong_khai]
```

**Case nền (dùng test xuyên suốt dự án):**
- Tên: Phạm Duy, Dương Nam, sinh 17/10 Kỷ Hợi (âm lịch), giờ Tý, Mệnh/Thân đồng cung tại **Hợi**
- Cục: Thủy Nhị Cục — Bản mệnh: Thành Đầu Thổ (Mệnh khắc Cục)
- Mệnh có: **Thiên Đồng (Đắc)** + **Địa Không (Đắc)** + **Địa Kiếp**
- Chủ mệnh: Lộc Tồn / Chủ thân: Thiên Lương
- Năm xem mẫu: Bính Ngọ 2026 (29 tuổi)

⚠️ Số liệu case KHÔNG phải "ground truth chứng minh 1 Rule đúng" — chỉ là regression test case để bắt lỗi encode/logic.

---

## 7. Chart Engine — dùng `iztro`, đã kiểm chứng

- Repo: `github.com/SylarLong/iztro` — **MIT License**, an toàn dùng cho sản phẩm thương mại.
- Cài: `npm install iztro -S`
- Hỗ trợ sẵn: đa trường phái qua config/plugin (từ v2.3.0), đa ngôn ngữ output (kể cả tiếng Việt), và **đã có sẵn các hàm**:
  - kiểm tra sao có ở 1 cung không
  - kiểm tra tam phương tứ chính của 1 cung có sao X không
  - lấy đối cung (xung chiếu)
  - tra tứ hóa theo thiên can
  - lấy cung theo đại vận/lưu niên

→ **KHÔNG cần tự viết lại logic quan hệ tĩnh (tam hợp/xung chiếu/tứ hóa) như bản prototype Python đã làm** — chỉ cần viết adapter gọi đúng hàm có sẵn của `iztro`, map sang Chart Data Shape ở mục 3.

Ví dụ dùng cơ bản:
```ts
import { astro } from 'iztro';
const astrolabe = astro.byLunar('1998-10-17', 2, 'nam', false, true, 'vi-VN');
```

---

## 8. Prototype đã chứng minh — tham khảo logic, không cần port nguyên si

Đã viết + chạy thành công 1 bản Python chứng minh Chart Schema + Rule Schema (bản trước khi tách condition/modifier/exception rõ ràng như mục 4) đủ khả thi để encode 5 loại rule test mà không cần "hack" bằng câu văn tự do:

1. Tổ hợp sao đơn giản (chính tinh + phụ tinh đồng cung)
2. Điều kiện mềm / modifier (miếu vượng đắc hãm ảnh hưởng hiệu lực)
3. Hội chiếu / tam phương tứ chính (quan hệ giữa cung, không chỉ same_palace)
4. Tứ Hóa theo Thiên Can (derived field, KHÔNG lưu tay)
5. Rule mâu thuẫn trường phái + `conflict_group_id`

Trong lúc chạy test đã bắt được 2 lỗi kiến thức nền (nhầm Tỵ/Hợi là tam hợp — thực ra là xung; nhầm bảng Tứ Hóa của Can Mậu) — **bài học giữ nguyên tắc:** ngay cả bảng "tĩnh" cũng phải có regression test, không tin theo trí nhớ.

File prototype đầy đủ: đính kèm cùng bộ tài liệu này (`tuvi_rule_engine_prototype.py`). Dùng để tham khảo cách tư duy evaluator, khi build thật nên viết lại bằng TypeScript và tận dụng hàm có sẵn của `iztro` thay vì tự viết bảng tam hợp/xung chiếu.

---

## 9. Entry/Rule mẫu đầu tiên — Thiên Đồng ngộ Không/Kiếp (test case cho conflict)

- **Quan điểm A (bất cát):** "Thiên Đồng ngộ Không Kiếp bất cát" — dễ hoang mang, thiếu nhất quán, thay đổi thất thường.
- **Quan điểm B (phản vi giai):** "Không Kiếp Tỵ Hợi phản vi giai luận" — Không Kiếp đồng cung tại Tỵ/Hợi có xu hướng tốt hơn vị trí khác, tùy chính tinh đi kèm. (Lưu ý: đây là luận về vị trí Tỵ/Hợi, KHÔNG đồng nghĩa trực tiếp "Thiên Đồng + Không Kiếp = tốt".)
- Cách "phản vi kỳ cách" nổi tiếng khác của Thiên Đồng (Càn cung phản bối, tại Tuất) là chuyện KHÁC — cần Hóa Kỵ (không phải Không/Kiếp) + Cự Môn + Hóa Lộc + Văn Xương hội hợp.
- `consensus: tranh_cai` — CHƯA CHỐT kết luận. Case Phạm Duy (Mệnh tại Hợi, đúng Thiên Đồng Đắc + Địa Không Đắc + Địa Kiếp) chỉ là test case tốt cho `conflict_group`, KHÔNG phải bằng chứng xác nhận bên A hay B.
- Nguồn hiện tại đều ở `reliability_tier: 3_thap` (tổng hợp diễn đàn) — cần truy nguyên bản gốc/chữ Hán trước khi nâng tier.

---

## 10. Conflict Resolver v0 — chỉ gom, KHÔNG phân xử

Khi 1 chart match nhiều Rule cùng `conflict_group_id`: gom lại, đính kèm metadata (`consensus`, `reliability_tier` từng source, case evidence nếu có), đưa **nguyên vẹn cả 2 bên** cho LLM trình bày. **Không** để hệ thống tự động chọn bên nào "đáng tin hơn" ở v0 — việc chọn phe luôn thuộc về người đọc cuối.

---

## 11. Vai trò LLM (áp dụng ở giai đoạn sau, chưa cần code ngay)

LLM là **Interpreter/Synthesizer**, không phải **Rule Engine**:
- Nhận "Evidence Pack" (Chart Facts + Matched Rules + Conflicts + Sources + Consensus + Case Evidence) đã được code tính toán sẵn.
- Chỉ tổng hợp, giải thích, viết tự nhiên, trình bày khác biệt trường phái.
- KHÔNG được: tự tạo Rule mới, tự bịa Source, biến Rule đang tranh cãi thành khẳng định chắc chắn, bỏ qua conflict.
- Với câu hỏi mang tính quyết định cá nhân (VD "có nên nghỉ việc không"): trình bày xu hướng theo Rule, không chốt quyết định thay người dùng.

---

## 12. Không cần hạ tầng phức tạp ở giai đoạn này

Đủ dùng: Node.js/TypeScript + PostgreSQL. Chưa cần vector DB/pgvector (chỉ thêm khi Rule đủ nhiều và có nhiều văn bản tự do cần semantic search — structured query luôn ưu tiên trước, vì tổ hợp sao rất cụ thể, semantic search dễ lấy nhầm tổ hợp). Chưa cần graph DB — quan hệ cung là bảng tra tĩnh, không cần graph engine.

---

## 13. Việc CHƯA làm (để tránh Claude Code tự ý mở rộng ngoài phạm vi)

- Chưa viết thêm Rule ngoài Entry mẫu ở mục 9 (KB mở rộng tạm dừng, chờ định hướng product tiếp theo).
- Chưa build UI/UX cuối cùng.
- Chưa tích hợp LLM API.
- Chưa cần vector DB/RAG.
- Chưa quyết định mô hình kinh doanh/billing.

**Việc cần làm ngay và duy nhất lúc này: Chart Engine (mục 1, 3, 7) — code xong, test qua case Phạm Duy (mục 6), cross-check với nguồn thứ 2, rồi dừng lại báo cáo kết quả trước khi làm tiếp phần Rule Engine.**

## 14. Thứ tự ưu tiên (chỉ đạo trực tiếp từ chủ dự án, 2026-08-16)

1. **Độ chính xác + đầy đủ của phép tính (Chart Engine) là ưu tiên số 1**, cao hơn mọi thứ khác kể cả tốc độ code nhanh. Mỗi lá số sinh ra sẽ được đối chiếu tay với lá số gốc (nguồn tham khảo độc lập) — sai 1 sao/1 cung là không chấp nhận được.
2. **UI/UX/CSS chưa làm ở giai đoạn này.** Khi làm, chuẩn tối thiểu là **đầy đủ và giống mức độ thông tin hiển thị của tuvi.vn** (đủ 12 cung, đủ chính/phụ tinh, đủ chú thích miếu vượng đắc hãm, đủ Đại Vận/Tiểu Vận/Lưu Niên...) — chưa cần trang trí/hiệu ứng, phần đó sẽ có yêu cầu riêng sau.
3. Không tự ý nhảy sang làm UI đẹp trong lúc Chart Engine chưa được xác nhận chính xác 100% trên case nền.
