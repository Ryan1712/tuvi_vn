# LLM Integration — Tầng 1 (Tổng quan) — Design Spec

**Ngày:** 2026-08-19
**Phạm vi:** Sinh 1 bài "Tổng quan" bằng LLM ngay khi lập lá số xong — vai trò Interpreter/Synthesizer
thuần túy (build spec mục 11, CLAUDE.md mục 2), KHÔNG tự tính toán, KHÔNG tự bịa tri thức.
KHÔNG bao gồm: Tầng 2 (Đào sâu theo domain + thời điểm — xem mục 8 "Ngoài phạm vi"), mở rộng
Knowledge Base, UI polish.

## Bối cảnh — vì sao tách 2 tầng

Ý tưởng ban đầu ("diễn giải từng cung khi user bấm xem") không đủ để trả lời câu hỏi thật của
người dùng ("xem công việc 2027-2029 thế nào") — vì câu hỏi thật thường có tính **domain**
(công việc → cung nào liên quan) và **thời gian** (2027 → Đại Vận/Lưu Niên nào). Sau khi đọc
code hiện có (`src/rule/relation-evaluator.ts`, `src/chart/queries.ts`, `src/rule/types.ts`),
xác nhận:

- Rule Engine hiện tại chỉ đánh giá Rule trên 1 cung tĩnh hoặc quan hệ cung cố định
  (`opposite`/`wealth`/`career` qua `relatedPalaces()`), KHÔNG có khái niệm domain.
- `RuleScope` đã khai sẵn `'decade'`/`'annual'` nhưng CHƯA có evaluator nào xử lý — gọi tới sẽ
  throw.
- KHÔNG có hàm nào resolve "thời điểm cụ thể → Đại Vận/Lưu Niên nào đang áp dụng" cho mục đích
  Rule Engine (dữ liệu `dai_van`/`tieu_van`/`luu_nien` đã có trong Chart Data Shape, nhưng chỉ
  là data tĩnh, chưa có query layer).

Vậy "diễn giải theo domain + thời điểm" (gọi là **Tầng 2 — Đào sâu**) cần thêm 2 khối tri thức/
code hoàn toàn mới (domain→cung, resolveQuery theo thời điểm) — phạm vi lớn hơn nhiều so với
"LLM integration" đơn thuần, và không phụ thuộc gì vào Tầng 1. Quyết định: **tách 2 tầng thành
2 phase riêng**, đúng ranh giới tự nhiên của hệ thống (không phải cắt tùy tiện cho gọn — mục 8
CLAUDE.md).

**Bản spec này CHỈ làm Tầng 1.** Tầng 2 brainstorm sau, khi Tầng 1 đã dùng thử.

## 1. Tầng 1 là gì

Ngay sau khi `POST /charts/rules` trả về Chart + rules_by_palace (không cần user bấm gì thêm),
sinh 1 bài văn tiếng Việt tự nhiên đóng vai "thầy Tử Vi đọc trọn đời" — dành cho người không
biết hỏi gì / chưa từng xem Tử Vi. 1 lần gọi LLM duy nhất per chart request.

## 2. Ranh giới cứng — Facts vs Interpretation

Đây là quyết định thiết kế quan trọng nhất của spec này, trực tiếp thực thi CLAUDE.md mục 2
("LLM chỉ nhận Evidence Pack đã tính sẵn, không tự tạo Rule/Source mới").

**Vấn đề:** nếu gửi toàn bộ dữ liệu 12 cung (chính/phụ tinh, sáng/tối) cho LLM mà không giới
hạn gì thêm, LLM có đủ dữ liệu thô để tự lấy kiến thức nền riêng (không qua Rule/Source đã
vetting) mà diễn giải ý nghĩa các cung KHÔNG có Rule khớp. Ví dụ: thấy "Thất Sát ở Tật Ách"
trong dữ liệu thô dù không Rule nào match, LLM vẫn có thể tự bịa 1 câu về sức khỏe dựa trên
kiến thức chung của nó. Đây là "tự bịa tri thức" len vào qua cửa dữ liệu thô, không qua cửa
"tự tạo Rule mới" — cùng bản chất vi phạm, khác đường vào.

**Giải pháp: Evidence Pack tách rõ 2 loại nội dung, gắn thẳng vào system prompt:**

- **Facts** (được phép nêu tự do, từ toàn bộ 12 cung + Đại Vận hiện tại): mô tả sự kiện thuần
  túy đã tính sẵn bằng code — sao gì tọa thủ cung nào, sáng/tối gì, ngũ hành cung gì, Đại Vận
  hiện tại tên gì. KHÔNG kèm phán xét ý nghĩa.
- **Interpretation** (CHỈ được nêu nếu có Rule matched:true): ý nghĩa/nhận định — giới hạn
  tuyệt đối vào nội dung `conclusion.text` của (các) Rule đã match tại đúng cung đó, kèm
  `valence`/`consensus`/`conflict_group_id` nếu có. KHÔNG được suy rộng ra ngoài nội dung Rule.

**Hệ quả thật, không phải bug — ghi vào Known Issues:** với chỉ 2 Rule hiện có trong KB (RULE_A/
RULE_B, cùng CG_001, chỉ match ở cung có Địa Không+Địa Kiếp), bài Tổng quan Tầng 1 sẽ có 1 đoạn
nhận định về cung đó, còn 11 cung còn lại CHỈ liệt kê Facts — không có nhận định gì. Đây là đặc
điểm trung thực của KB còn nhỏ, KHÔNG để LLM tự "lấp đầy" cho bài viết nghe trọn vẹn hơn bằng
cách nới lỏng ranh giới Facts/Interpretation.

System prompt phải nêu ranh giới này tường minh, KÈM 1-2 ví dụ đúng/sai cụ thể (không chỉ luật
trừu tượng) — vì bản chất mô hình ngôn ngữ có xu hướng tự lấp khoảng trống bằng suy luận riêng
nếu không bị cấm rõ bằng ví dụ neo lại. Ví dụ cụ thể viết trong mục 4 bên dưới.

## 3. Salience — quyết định HOÃN, không thiết kế trước

Với 2 Rule hiện có, "rule nào đủ quan trọng để vào bài Tổng quan" chưa có ý nghĩa thực tế —
mọi rule matched:true đều đưa vào Evidence Pack, không lọc gì.

**KHÔNG thêm field `salience` vào Rule Schema ở v0.1.** Lý do không chỉ là YAGNI: salience tự
nó là 1 dạng tri thức Tử Vi thật (thầy A luôn mở đầu bằng Mệnh-Thân-Cục, thầy B ưu tiên nói
Phúc Đức trước) — không phải con số kỹ thuật thuần túy. Thêm field số (VD 1-5) ngay bây giờ mà
không có nguồn/trường phái đi kèm tức là hard-code ngầm 1 phán đoán tri thức, đúng thứ CLAUDE.md
mục 9 cảnh báo. Dự án đã có tiền lệ tương tự: `weight` từng phải tách thành 3 khái niệm riêng
(condition/modifier/exception) sau khi có đủ ví dụ thật để thấy hình dạng đúng.

**Ghi rõ trong Known Issues:** "mọi rule matched đều vào Tầng 1" là giả định tạm thời có ý thức
cho v0.1, KHÔNG phải quyết định salience đã chốt. Khi KB đủ lớn cần lọc thật, đó là lúc
brainstorm riêng 1 vòng cho salience, dùng nhiều ví dụ Rule thật để kiểm tra hình dạng đúng.

## 4. Evidence Pack — cấu trúc cụ thể

```ts
interface EvidencePack {
  // Facts — toàn bộ 12 cung, mô tả thuần túy
  menh_than: { menh_branch: Branch; than_branch: Branch; soul_star: string; body_star: string };
  cuc: { ngu_hanh: NguHanh; raw: string }; // vd "Thuy Nhi Cuc"
  ban_menh_nap_am: string;
  palaces: {
    branch: Branch;
    palace_name: string;
    major_stars: { star_id: string; strength?: Brightness }[];
    minor_stars: { star_id: string; strength?: Brightness }[];
    branch_element: NguHanh;
  }[]; // đủ 12 cung
  current_dai_van: {
    palace_name: string; // cung Đại Vận đang chạy trỏ vào
    heavenly_stem: string;
    earthly_branch: string;
    nominal_age: number; // tuổi mụ, từ iztro horoscope().age.nominalAge — KHÔNG tự tính tuổi dương lịch
  };

  // Interpretation — CHỈ từ Rule matched:true
  interpretations: {
    palace_branch: Branch;
    rule_id: string;
    conclusion_text: string; // Rule.conclusion.text, nguyên văn, không viết lại
    valence: Valence;
    consensus: Consensus;
    conflict_group_id: string | null;
    // Nếu conflict_group_id !== null: LUÔN kèm TẤT CẢ interpretation khác cùng group
    // trong cùng response — không được chỉ chọn 1 bên.
  }[];
}
```

**Nguồn dữ liệu của mỗi field:** `palaces`/`menh_than`/`cuc`/`ban_menh_nap_am` lấy trực tiếp từ
`Chart` (đã có, không tính thêm). `current_dai_van` lấy từ `astrolabe.horoscope(hôm_nay, 0)
.decadal` + `.age.nominalAge` — đã xác minh thật với case Phạm Duy: `nominalAge: 29`, khớp
chính xác với "29 tuổi" ghi sẵn trong build spec mục 6 cho năm xem mẫu 2026 (bằng chứng độc lập
`nominalAge` đúng là tuổi mụ/tuổi Tử Vi, không phải tuổi dương lịch). `decadal` trả về ngay Đại
Vận đang chạy — KHÔNG tự viết logic tuổi/tra mảng `age_from`/`age_to` bằng tay (tránh lỗi
off-by-one như case Tuần/Triệt trước đây). `interpretations` lấy từ `rules_by_palace[branch]
.matched` đã filter `matched:true`, join với `KNOWLEDGE_BASE` để lấy `conclusion`/`consensus`.

## 5. System Prompt — nội dung bắt buộc

Phải có, không chỉ nêu luật suông mà kèm ví dụ neo lại:

```
Bạn là người viết lại (KHÔNG phải người luận giải) một lá số Tử Vi thành văn tự nhiên tiếng Việt.

QUY TẮC BẮT BUỘC:
1. Chỉ được đưa ra nhận định/ý nghĩa cho các mục xuất hiện trong "interpretations". Với các
   cung KHÔNG có trong "interpretations", CHỈ được mô tả sự kiện (sao gì, sáng/tối gì) — TUYỆT
   ĐỐI KHÔNG tự suy luận ý nghĩa, dù bạn có kiến thức Tử Vi riêng.

   Ví dụ ĐÚNG: "Cung Tật Ách có Thất Sát tọa thủ" (chỉ nêu sự kiện).
   Ví dụ SAI: "Cung Tật Ách có Thất Sát tọa thủ, cho thấy sức khỏe cần chú ý" (tự suy luận ý
   nghĩa không có trong interpretations — CẤM).

2. Khi diễn đạt 1 "interpretation", PHẢI giữ nguyên ý của conclusion_text — được viết lại cho
   tự nhiên hơn, nhưng KHÔNG được đổi nghĩa, KHÔNG được thêm ý ngoài conclusion_text.

3. Nếu 1 interpretation có conflict_group_id khác null, PHẢI trình bày TẤT CẢ các quan điểm
   trong cùng nhóm đó, KHÔNG được chỉ chọn 1 bên hoặc ngầm ưu tiên 1 bên là "đúng hơn".

   Ví dụ ĐÚNG: "Về tổ hợp này, có 2 quan điểm khác nhau: (A) ... (B) ... — đây là điểm còn
   tranh cãi giữa các nguồn."
   Ví dụ SAI: "Tổ hợp này cho thấy [chỉ nêu 1 trong 2 quan điểm]" (bỏ sót phía còn lại — CẤM).

4. KHÔNG tự thêm Rule/tri thức nào ngoài "interpretations" được cung cấp, dù nghe hợp lý.

5. Đây là bài đọc mở đầu, không phải trả lời 1 câu hỏi cụ thể — không đưa ra lời khuyên quyết
   định cá nhân (nghỉ việc, kết hôn...), chỉ trình bày xu hướng theo dữ liệu.
```

## 6. Kiến trúc kỹ thuật

**SDK:** `@anthropic-ai/sdk`, model Claude (chọn cụ thể ở implementation plan — không cần chốt
ở design doc này, vì đây là chi tiết code, không phải quyết định kiến trúc).

**API key:** đọc từ biến môi trường `ANTHROPIC_API_KEY`. Server throw lỗi rõ ràng lúc khởi động
nếu thiếu (fail loud, không chạy ngầm với key rỗng rồi lỗi khó hiểu lúc gọi thật).

**Endpoint mới:** `POST /charts/overview` — nhận `BuildChartInput` giống `/charts/rules`, bên
trong gọi lại pipeline hiện có (`buildChart` + `matchRules` + `resolveConflicts` cho toàn bộ 12
cung) để dựng Chart + rules_by_palace, cộng thêm `current_dai_van`, đóng gói thành Evidence
Pack, gọi LLM, trả về:

```ts
interface ChartOverviewResponse {
  chart: Chart; // giữ nguyên, để UI vẫn render được lưới 12 cung như hiện tại
  overview_text: string; // bài văn LLM sinh ra
}
```

**Vị trí file:** `src/llm/` (module mới, tách khỏi `src/chart/` và `src/rule/` — không phụ
thuộc ngược từ 2 module đó vào `src/llm/`, chỉ 1 chiều `src/llm/` → `src/chart/` + `src/rule/`).

- `src/llm/anthropic-client.ts` — wrapper gọi API, đọc `ANTHROPIC_API_KEY`.
- `src/llm/evidence-pack.ts` — hàm dựng `EvidencePack` từ `Chart` + `rules_by_palace` +
  `current_dai_van`.
- `src/llm/overview-prompt.ts` — system prompt (mục 5) + hàm build user message từ
  `EvidencePack`.
- `src/llm/overview.ts` — hàm `generateOverview(input: BuildChartInput): Promise<ChartOverviewResponse>`
  điều phối toàn bộ (build chart → build evidence pack → gọi LLM → trả response).

**Xử lý lỗi:** nếu gọi LLM API thất bại (network, rate limit, timeout...), route trả lỗi rõ
ràng (500 kèm message), KHÔNG trả về `overview_text` rỗng/giả — người dùng biết ngay là lỗi hệ
thống, không nhầm là "lá số không có gì để nói".

## 7. UI

Thêm 1 khu vực mới trong `web/src/App.tsx`, hiển thị SAU khi có `data` (kết quả `/charts/
rules` hiện tại vẫn giữ nguyên, không đổi) — gọi thêm `POST /charts/overview` song song hoặc
sau đó, hiển thị `overview_text` dưới dạng đoạn văn, đặt phía trên lưới 12 cung (đọc bài tổng
quan trước, xem chi tiết từng cung sau — đúng thứ tự đọc tự nhiên). Không thay thế lưới 12 cung
và RuleResults hiện có — cả 2 cùng tồn tại.

Chi tiết loading/error state, layout CSS cụ thể: viết trong implementation plan (chi tiết code,
không phải quyết định thiết kế).

## 8. Ngoài phạm vi (Known Issues / chưa xử lý)

- **[MỞ, cố ý hoãn] Tầng 2 — Đào sâu theo domain + thời điểm.** Cần: (a) tri thức mới
  domain→cung (VD "công việc" → cung Quan Lộc + tam hợp/xung chiếu), đi qua đúng quy trình
  Rule/Source, không hard-code; (b) hàm `resolveQuery(domain, thời_điểm)` gom cung liên quan +
  Đại Vận/Lưu Niên phủ theo thời điểm hỏi. Brainstorm riêng, sau khi Tầng 1 dùng thử.
- **[MỞ, cố ý hoãn] Salience.** Xem mục 3 — hoãn đến khi KB đủ lớn để test hình dạng đúng.
- **[MỞ, biết trước không phải bug] Bài Tổng quan sẽ mỏng phần nhận định.** Với 2 Rule hiện
  có, phần lớn 12 cung chỉ có Facts, không có Interpretation. Đây là hệ quả trung thực của KB
  nhỏ — sẽ tự cải thiện khi KB mở rộng (ngoài phạm vi spec này), KHÔNG sửa bằng cách nới lỏng
  ranh giới Facts/Interpretation.
- Chưa quyết định model Claude cụ thể (Sonnet/Opus/Haiku) — chi tiết implementation plan.
- Chưa có cơ chế cache overview_text (mỗi lần gọi `/charts/overview` đều gọi LLM lại) — chấp
  nhận được ở v0.1, số lượng request thấp. Tối ưu sau nếu cần.
- Chưa có test tự động gọi LLM thật trong CI (tốn phí, không deterministic) — test unit cho
  `evidence-pack.ts` (thuần code, không gọi API) vẫn cần; test tích hợp gọi LLM thật chỉ chạy
  thủ công lúc verify, không đưa vào `npm test` mặc định. Chi tiết trong implementation plan.

## 9. Testing

- `evidence-pack.ts`: unit test thuần code (không gọi LLM) — assert `EvidencePack` dựng đúng
  từ 1 `Chart` + `rules_by_palace` mẫu (case Phạm Duy), đặc biệt: `interpretations` chỉ chứa
  rule `matched:true`, `current_dai_van.nominal_age` khớp giá trị đã verify (29 cho năm xem
  2026), palaces đủ 12 cung không thiếu/thừa.
- `overview.ts`/`anthropic-client.ts`: KHÔNG gọi LLM thật trong test tự động. Verify thủ công
  lúc implementation (gọi thật 1 lần với case Phạm Duy, đọc kết quả, xác nhận không vi phạm
  ranh giới Facts/Interpretation bằng mắt) — ghi lại kết quả verify trong plan/report, không
  assert tự động nội dung văn bản LLM sinh ra (không deterministic).
- Route test (`test/server/routes.test.ts`): giả lập/mock LLM client ở tầng route test (không
  gọi API thật), assert route trả đúng cấu trúc response (`chart` + `overview_text`), và xử lý
  lỗi đúng khi LLM client throw.
