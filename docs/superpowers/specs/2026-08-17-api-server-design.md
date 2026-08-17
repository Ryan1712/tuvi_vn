# API Server (Phase 4) — Design Spec

**Ngày:** 2026-08-17
**Phạm vi:** HTTP layer mỏng bọc quanh Chart Engine (Phase 2) + Rule Engine (Phase 3) đã hoàn
thành, để frontend (sẽ xây dựng ngay sau đây) có cách gọi 2 engine từ bên ngoài. KHÔNG bao gồm
UI, LLM integration, mở rộng knowledge base, hay bất kỳ tính năng mới nào ngoài việc lộ 2 engine
đã có qua HTTP.

## Known issues / chưa xử lý xong

*(Trống ở thời điểm viết design.)*

---

## 1. Bối cảnh & nguồn tham khảo

- `TuVi_Build_Spec_v1.md` mục 12 — "chưa cần hạ tầng phức tạp ở giai đoạn này. Đủ dùng
  Node.js/TypeScript". Không có DB/session bắt buộc.
- `src/chart/index.ts` — `buildChart(input: BuildChartInput): Chart` đã hoàn thành, test qua,
  không có state (mỗi lần gọi build lại từ `iztro` từ đầu, tốc độ vài trăm ms).
- `src/rule/evaluator.ts` — `matchRules(chart, branch, rules): RuleEvalResult[]`.
- `src/rule/conflict-resolver.ts` — `resolveConflicts(matchedRules: Rule[]): ConflictGroup[]`.
- `src/rule/knowledge-base.ts` — `KNOWLEDGE_BASE: Rule[]` (Entry mẫu duy nhất hiện có).
- `test/rule/integration.test.ts` (Phase 3) — logic tham chiếu cho cách phối hợp `matchRules` +
  `resolveConflicts` trên 1 cung; API server áp dụng đúng logic này, lặp qua 12 cung.

## 2. Quyết định phạm vi (chốt qua brainstorm với chủ dự án)

- **Không có state / không lưu trữ Chart giữa các request.** Không cần `id` để tham chiếu lại
  1 Chart đã build — mỗi request tự đủ, gửi lại `BuildChartInput` mỗi lần cần kết quả. Lý do:
  Chart Engine không có state, build lại rất rẻ, và build spec mục 12 nói rõ chưa cần hạ tầng
  phức tạp (DB, cache, session) ở giai đoạn này.
- **2 endpoint, cả hai không state:**
  1. `POST /charts` — chỉ build Chart, dùng khi frontend chỉ cần xem lá số, chưa cần luận giải.
  2. `POST /charts/rules` — build Chart + chạy Rule Engine cho **toàn bộ 12 cung**, dùng khi
     frontend cần hiển thị cả lá số lẫn kết quả luận Rule cùng lúc (tránh N+1 request — chủ dự
     án xác nhận cần điều này vì frontend không muốn gọi riêng từng cung).
- **Không thêm validate layer riêng (Zod/Joi/...).** `buildChart()` đã tự throw `Error` rõ ràng
  khi input sai (vd `napAmFromSolarDate` throw khi ngày không hợp lệ, `branchFromVi` throw khi
  gặp branch lạ) — đúng quy ước "fail loud" đã thiết lập xuyên suốt Chart Engine. Route handler
  chỉ cần bắt `Error` và map sang HTTP 400, không cần lớp validate trùng lặp cho input chỉ có
  5-6 field đơn giản.
- **Framework: Express.** Không có framework HTTP nào được chọn từ trước trong dự án. Chọn
  Express vì: phổ biến nhất, tương thích tốt với ESM + TypeScript hiện tại của dự án, đủ nhẹ cho
  2 endpoint, không cần học đường cong mới (khác Fastify). Không dùng Node `http` thuần vì phải
  tự viết routing/body-parsing tay cho lợi ích không tương xứng ở quy mô này.

## 3. Kiến trúc & cấu trúc thư mục

```
src/server/
├── app.ts       # Express app: middleware (JSON body parser), dang ky route, error handler tap trung
├── routes.ts     # 2 route handler: POST /charts, POST /charts/rules
└── server.ts     # entrypoint: app.listen(), doc PORT tu env (mac dinh 3000)
test/server/
└── routes.test.ts  # supertest, goi HTTP that qua app.ts, khong mock Chart/Rule Engine
```

- **`app.ts`**: tạo Express app, đăng ký `express.json()` middleware để parse request body,
  gắn router từ `routes.ts`, gắn error-handling middleware cuối cùng (4-tham-số Express
  middleware bắt mọi lỗi ném ra từ route handler). Export `app` (không tự `listen()` ở đây) —
  để `test/server/routes.test.ts` import `app` và test qua `supertest(app)` mà không cần mở
  cổng mạng thật.
- **`routes.ts`**: export `router: express.Router` với 2 route. Mỗi handler bọc logic trong
  `try/catch`, lỗi bắt được gọi `next(err)` để error middleware tập trung xử lý — không tự viết
  response lỗi rải rác trong từng handler.
- **`server.ts`**: file duy nhất gọi `app.listen(PORT)`. Tách riêng khỏi `app.ts` để test không
  vô tình mở cổng mạng thật khi chỉ import app.

## 4. Chi tiết 2 endpoint

### `POST /charts`

- **Request body**: `BuildChartInput` (JSON) — đúng union type đã có trong `src/chart/types.ts`:
  ```ts
  { calendar_type: 'duong_lich', date: string, time_index: number, gender: 'nam'|'nu', fix_leap?: boolean }
  | { calendar_type: 'am_lich', date: string, time_index: number, gender: 'nam'|'nu', is_leap_month?: boolean, fix_leap?: boolean }
  ```
- **Response `200`**: `Chart` object nguyên vẹn (từ `buildChart(input)`), serialize JSON trực
  tiếp — không transform gì thêm.
- **Response `400`**: khi `buildChart()` throw (input sai định dạng ngày, branch lạ, v.v.) hoặc
  khi body thiếu field bắt buộc (`calendar_type`/`date`/`time_index`/`gender` là `undefined`) —
  body thiếu field cũng dẫn tới `buildChart()` throw vì các hàm nội bộ (`callIztro`, v.v.) sẽ
  nhận `undefined` và lỗi ở tầng `iztro`/parse ngày, được bắt cùng 1 chỗ.
  Body: `{ "error": string }` (message lấy từ `Error.message` thật, không che giấu).

### `POST /charts/rules`

- **Request body**: cùng `BuildChartInput`.
- **Xử lý**: `buildChart(input)` → với mỗi `branch` trong `BRANCHES` (12 địa chi, từ
  `src/chart/types.ts`): `matchRules(chart, branch, KNOWLEDGE_BASE)` → lọc `matched === true` →
  map về `Rule[]` gốc (tra trong `KNOWLEDGE_BASE` theo `rule_id`) → `resolveConflicts(...)`.
- **Response `200`**:
  ```ts
  {
    chart: Chart,
    rules_by_palace: Record<Branch, {
      matched: RuleEvalResult[],   // TOÀN BỘ kết quả matchRules (kể cả matched: false), giữ traceability
      conflicts: ConflictGroup[],   // chỉ nhóm rule matched=true có conflict_group_id
    }>
  }
  ```
  Giữ nguyên `matched: false` trong `rules_by_palace[branch].matched` (không lọc bỏ trước khi
  trả về) — đúng triết lý `matchRules` đã có (trả cả matched lẫn không matched để giữ đầy đủ
  traceability, xem design doc Rule Engine mục 4). Frontend tự lọc nếu chỉ muốn hiển thị matched.
- **Response `400`**: cùng quy ước như endpoint 1.

## 5. Error handling

Error middleware tập trung duy nhất trong `app.ts`:
```ts
app.use((err: unknown, req, res, next) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(400).json({ error: message });
});
```
Ở v0.1 **mọi lỗi bắt được đều trả 400** — không phân biệt lỗi do input người dùng (400 đúng
nghĩa) với lỗi hệ thống bất ngờ (nên là 500). Route handler trong `src/server/` chỉ gọi 2 hàm
đã biết rõ hành vi (`buildChart`, `matchRules`, `resolveConflicts`) và những hàm này chỉ throw
khi input sai hoặc dữ liệu không nhận dạng được — không có nguồn lỗi "hệ thống" nào khác ở tầng
server tại v0.1 (không DB, không network call ngoài `iztro` nội bộ). Phân biệt 400/500 chính
xác hơn là việc của bản sau khi có nguồn lỗi đa dạng hơn.

## 6. Testing

- Framework: **Vitest** + **supertest** (thêm làm devDependency mới — thư viện chuẩn để test
  Express route bằng cách gọi HTTP request thật vào `app` mà không mở cổng mạng).
- `test/server/routes.test.ts`:
  - `POST /charts` với input Phạm Duy đã xác minh (`bySolar 1998-12-17 timeIndex=12`) → `200`,
    body là `Chart` với `menh_than.menh_branch === 'Hoi'`.
  - `POST /charts` với input thiếu `date` → `400`, body có `error` là string không rỗng.
  - `POST /charts/rules` với input Phạm Duy → `200`, `rules_by_palace.Hoi.matched` chứa cả
    `RULE_A_...` và `RULE_B_...` với `matched: true` (đúng kết quả đã xác nhận ở Phase 3),
    `rules_by_palace.Hoi.conflicts` có đúng 1 nhóm `conflict_group_id: 'CG_001'` chứa cả 2 rule.
  - `POST /charts/rules` với input sai → `400`.
- Không mock `buildChart`/`matchRules`/`resolveConflicts` — gọi thật, đúng quy ước "test hành
  vi thật, không mock" đã áp dụng xuyên suốt Chart Engine và Rule Engine.

## 7. Ngoài phạm vi

Không làm ở bản này: authentication/authorization, rate limiting, CORS configuration (domain
frontend chưa xác định), lưu trữ Chart theo `id`, DB/persistence, logging/observability tập
trung, Docker/deploy config, phân biệt HTTP status code chi tiết hơn 200/400, UI, LLM
integration, mở rộng knowledge base ngoài Entry mẫu hiện có.
