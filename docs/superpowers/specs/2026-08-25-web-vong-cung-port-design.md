# Port bố cục vòng cung sang React (`web/`) — Design Spec

**Ngày:** 2026-08-25
**Phạm vi:** Thay bố cục hiển thị lá số trong `web/` (hiện tại: CSS Grid 4x4 kiểu bảng, chính tinh/phụ tinh cùng
cỡ chữ) bằng bố cục + palette đã duyệt qua mockup HTML tĩnh
(`docs/superpowers/mockups/2026-08-24-dia-ban-vong-cung.html`). KHÔNG đổi logic gọi API, KHÔNG đổi Chart
Engine/Rule Engine, KHÔNG thêm domain-query vào UI (Tầng 2 để phase riêng sau).

## Bối cảnh

Mockup HTML tĩnh (giấy dó/mực chàm/đỏ son, bố cục 4x4 quanh khối trung tâm, chính tinh font thư pháp to/đậm)
đã qua nhiều vòng duyệt: người dùng xác nhận thẩm mỹ, 4 điểm nghi vấn đối chiếu dữ liệu với ảnh gốc tuvi.vn
đều đã đóng bằng bằng chứng code (xem `docs/superpowers/specs/2026-08-16-chart-engine-design.md` mục 7, cập
nhật 2026-08-25). Mockup dùng dữ liệu tĩnh nhúng sẵn (`buildChart()` case Phạm Duy, không qua API) và KHÔNG
có phần Rule Engine (`RuleResults`) — vì mockup chỉ minh họa tầng Chart Engine.

`web/` hiện tại là React app THẬT đang chạy được: `App.tsx` quản lý state (loading/error, kết quả chart,
overview text), gọi 2 API (`fetchChartWithRules`, `fetchChartOverview`), render qua `ChartForm` → `PalaceGrid`
→ `PalaceCell` (mỗi ô có `RuleResults` lồng bên trong, hiển thị match/conflict theo cung) → `OverviewSection`.
Không có test framework nào cho `web/` (chỉ có `tsc -b` build và `oxlint`).

## Mục tiêu

1. Áp bố cục + palette + typography đã duyệt từ mockup vào `PalaceGrid.tsx`/`PalaceCell.tsx`/`index.css` thật.
2. Giữ nguyên 100% hành vi đang hoạt động: gọi API, quản lý loading/error, submit form, hiển thị Tổng quan.
3. Không mất chức năng `RuleResults` đang có — chuyển từ hiển thị inline trong ô sang panel riêng (xem mục
   "Quyết định UX" bên dưới), không xóa bất kỳ thông tin nào nó đang hiển thị.

## Ngoài phạm vi (chốt cùng người dùng, không tự ý mở rộng giữa chừng)

- **domain-query (Tầng 2)**: chưa từng được nối vào `web/` ở bất kỳ đâu (không phải bị bỏ sót khi port — nó
  chưa tồn tại trong UI từ đầu). Để phase riêng sau khi phase này xong.
- **Test framework mới (Vitest/React Testing Library)**: không thêm ở phase này. Lý do: đây là thay đổi
  thẩm mỹ/bố cục (CSS + sắp xếp lại JSX), không phải logic phức tạp dễ sinh lỗi runtime ẩn — khác với Rule
  Engine (nơi tổ hợp điều kiện quá nhiều để xem tay hết). Verify bằng `tsc -b` (bắt lỗi kiểu) + `oxlint` +
  xem tay qua dev server (đủ khả thi vì bố cục có thể xem trực quan toàn bộ). Đây là quyết định có phạm vi
  rõ ràng, không phải "web/ vĩnh viễn không cần test" — nếu sau này thêm logic phức tạp hơn (domain-query
  UI, quản lý nhiều bước), cần xét lại.
- **Không đổi `App.tsx`'s state/luồng gọi API** — chỉ đổi những gì `PalaceGrid`/`PalaceCell` nhận vào và
  render ra bên trong, không đổi props interface của `PalaceGrid` (`data: ChartRulesResponse; displayName:
  string`).

## Quyết định UX: RuleResults tách khỏi ô cung, hiển thị qua panel khi click

**Quyết định:** áp dụng đúng ranh giới Facts/Interpretation đã dùng xuyên suốt tầng LLM (Tầng 1 Tổng quan
tự động hiện, Tầng 2 Đào sâu cần bấm) sang quy mô 1 ô cung: mỗi ô chỉ hiện Facts (chính tinh, phụ/tạp tinh,
Đại Vận, Tràng Sinh, Bác Sỹ/Tướng Tiền/Tuế Tiền, Lưu Niên nếu có) — không hiện `RuleResults` trực tiếp trong
ô. Click vào ô mở 1 panel riêng hiển thị `RuleResults` (Interpretation) của đúng cung đó.

**Lý do:** mockup đã thẩm mỹ đúng theo hướng "bản đồ sao gọn gàng" — mỗi ô đã khá đầy thông tin (case Phạm
Duy có cung Tử Nữ với 8 tạp tinh + chính tinh + hàng ĐV/TS/BS/TT). Nhồi thêm `RuleResults` vào cùng không
gian sẽ quay lại đúng kiểu "bảng dữ liệu dày đặc" mà việc thiết kế lại đang cố tránh.

## Component: `RuleResultsPanel` (mới)

**File:** `web/src/components/RuleResultsPanel.tsx`

**Props:**
```ts
interface RuleResultsPanelProps {
  branch: Branch | null;       // null = đóng panel
  palaceName: string | null;
  ruleResult: PalaceRuleResult | null;
  onClose: () => void;
}
```

**Nội dung hiển thị (giữ nguyên logic từ `RuleResults.tsx` hiện tại, chỉ đổi nơi/style hiển thị):**

1. Lọc `matched = ruleResult.matched.filter((r) => r.matched)` — **BẮT BUỘC lọc `matched: true`** trước khi
   dùng để quyết định có luận giải hay không hoặc để hiển thị. Xem "Global Constraints" bên dưới — đây là
   bẫy dữ liệu cụ thể, không phải quy ước phong cách. Dùng qua hàm `hasInterpretation()` dùng chung (xem
   Global Constraints) — không tự viết lại biểu thức lọc ở đây.
2. Nếu `!hasInterpretation(ruleResult)`: hiển thị rõ ràng dòng chữ "Chưa có luận giải cho cung này" (không để
   trống trơn — trống trơn gây cảm giác lỗi tải dữ liệu, đúng nguyên tắc "fail loud" áp dụng cho UI, không
   chỉ code).
3. Nếu có `matched` (không thuộc `conflicts`): liệt kê từng rule — `rule_id`, và nếu có
   `matched_modifiers.length > 0` thì hiện modifier (`effect` của từng modifier), giữ đúng format hiện tại
   của `RuleResults.tsx` dòng 13-19.
4. Nếu có `conflicts`: với MỖI `ConflictGroup`, liệt kê **ĐỦ CẢ 2 (hoặc nhiều) `rules` trong nhóm đó** —
   không được rút gọn chỉ hiện 1 quan điểm rồi thu gọn quan điểm còn lại (VD dạng "xem thêm", accordion mặc
   định đóng cho 1 bên). Đây là ranh giới cốt lõi của dự án (CLAUDE.md mục 2: "khi 2 nguồn tri thức mâu
   thuẫn: lưu cả hai, không ép về 1 đáp án") — áp dụng cho UI y hệt như đã áp dụng cho prompt LLM ở Tầng 1/2.
   Hiển thị rõ `conflict_group_id` và tên/kết luận từng rule trong nhóm ngang hàng nhau về mặt trực quan
   (cùng cỡ chữ, cùng vị trí phân cấp — không cái to cái nhỏ, không cái trên cùng cái thu gọn).

**Đóng panel:** nút X, click nền ngoài (backdrop), phím Esc — cả 3 cách đều gọi `onClose()`.

**Chuyển cung khi panel đang mở:** nếu panel đang hiện cung A và người dùng click sang ô cung B (không đóng
panel trước), panel PHẢI cập nhật ngay sang nội dung cung B — không cần đóng-rồi-mở lại. Cơ chế: click 1 ô
luôn gọi `setSelectedBranch(branch)` của ô đó (không phải toggle so với state hiện tại), nên `selectedBranch`
tự nhiên đổi giá trị khi click ô khác, panel re-render theo `ruleResult` mới. Backdrop chỉ chặn/đóng khi click
NGOÀI toàn bộ lưới 12 cung (VD ngoài `.board`) — không chặn việc click từ ô này sang ô khác trong lưới.

**Style:** dùng palette mới (giấy dó/mực chàm/đỏ son) nhất quán với ô cung, nhưng panel nổi trên nền tối mờ
(backdrop) để phân biệt rõ đang ở lớp Interpretation, không phải Facts.

## Thay đổi từng file

### `web/index.html`

Thêm Google Fonts link (giống mockup):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### `web/src/index.css`

Thay toàn bộ token màu + style hiện có bằng token đã duyệt trong mockup (copy nguyên khối `:root` /
`@media (prefers-color-scheme: dark)` / `:root[data-theme="dark"]` từ
`docs/superpowers/mockups/2026-08-24-dia-ban-vong-cung.html` dòng 6-51). Port các class CSS tương ứng:
`.board`, `.center-block`, `.palace`, `.palace-head`, `.star-chip`, `.minor-row`, `.adj-row`, `.badge-row`,
`.cycle-strip`, `.luu-nien-line` — giữ nguyên tên class hoặc đổi sang quy ước camelCase nếu dùng CSS Modules
(quyết định ở bước viết plan, không phải ở đây — mục tiêu design doc này là mô tả HÀNH VI/BỐ CỤC, không ép
buộc chi tiết build tooling).

Thêm class mới cho `RuleResultsPanel`: `.panel-backdrop`, `.rule-panel`, `.rule-panel-match`,
`.rule-panel-conflict-group` (2+ rules ngang hàng bên trong, không cái to cái nhỏ).

Thêm class mới cho badge "có luận giải" trên mỗi ô: `.palace-has-interpretation` (chấm nhỏ hoặc icon ở góc
ô, chỉ hiện khi `hasInterpretation(ruleResult)` trả về true — xem Global Constraints).

### `web/src/components/PalaceGrid.tsx`

- Giữ nguyên `GRID_POSITION` (đã đúng vị trí địa bàn — Tý-Ngọ-Mùi-Thân hàng trên, Dần-Sửu-Tý-Hợi hàng dưới,
  đối chiếu tuvi.vn từ lúc brainstorm ban đầu).
- Thêm state: `const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);`
- `CenterBlock`: đổi style theo mockup (khối bát giác/radial gradient giấy dó đậm hơn nền), nội dung thông
  tin GIỮ NGUYÊN 100% (không bớt field nào đang hiển thị: birth date, giờ, năm can chi, luu_nien nếu có, bản
  mệnh, chủ mệnh, chủ thân, lai nhân cung).
- Mỗi `PalaceCell` nhận thêm prop `onSelect: () => void` gọi `setSelectedBranch(palace.branch)`.
- Render `<RuleResultsPanel>` ở cuối, với `ruleResult = selectedBranch ? rules_by_palace[selectedBranch] :
  null`, `onClose={() => setSelectedBranch(null)}`.

### `web/src/components/PalaceCell.tsx`

- Đổi style chính tinh: font thư pháp (Noto Serif TC), cỡ lớn hơn hẳn phụ/tạp tinh, đậm 700 — đúng CSS đã
  sửa trong mockup (`.star-chip` dòng 244-250 của file mockup).
- Giữ nguyên toàn bộ field đang hiển thị: `palace_stem`.`branch`, `palace_name`, tuổi Đại Vận, chính tinh +
  độ sáng + Tứ Hóa, phụ tinh (soft/tough tách cột như hiện tại HOẶC gộp 1 dòng như mockup — quyết định ở
  bước plan dựa trên thử nghiệm thực tế, không ép ở đây vì đây là chi tiết trình bày nhỏ không ảnh hưởng dữ
  liệu), tạp tinh, badge Tuần/Triệt, Tràng Sinh, Bác Sỹ/Tướng Tiền/Tuế Tiền, Đại Vận cung, Lưu Niên cung nếu
  có.
- **XÓA** `<RuleResults result={ruleResult} />` khỏi render trực tiếp trong ô.
- **THÊM** badge nhỏ `.palace-has-interpretation` khi `hasInterpretation(ruleResult)` (xem Global
  Constraints) — không tự viết lại biểu thức lọc ở đây.
- **THÊM** `onClick={onSelect}` trên cả ô (toàn bộ `.palace` clickable, không chỉ badge — dễ bấm hơn, đúng
  thực hành UI thông thường khi cả khối đại diện 1 đối tượng có thể click).

### `web/src/components/RuleResults.tsx`

Xóa file này sau khi `RuleResultsPanel.tsx` thay thế toàn bộ logic của nó (không giữ file cũ không dùng —
YAGNI, tránh code chết).

### `web/src/components/OverviewSection.tsx`

Không đổi logic. Chỉnh style nhẹ (font, màu) cho khớp palette mới — vẫn ở vị trí hiện tại (trên `PalaceGrid`,
ngoài vòng cung).

## Global Constraints

- **`PalaceRuleResult.matched` là mảng CHỨA CẢ rule KHÔNG match** (`RuleEvalResult.matched: boolean` — field
  đó mới là cờ thật). Bất kỳ chỗ nào cần biết "cung này có luận giải hay không" (badge, điều kiện hiện panel
  rỗng) PHẢI lọc `.filter((r) => r.matched)` trước, KHÔNG được dùng `ruleResult.matched.length > 0` của mảng
  gốc — dùng sai sẽ khiến badge/panel báo "có luận giải" ngay cả khi mọi rule trong cung đó đều
  `matched: false`. Đây là nguồn lỗi âm thầm nguy hiểm nhất của phase này — ghi rõ ở đây để implementer/
  reviewer đều thấy trước khi code, không chỉ nằm trong đầu người viết design doc.
- **Chỉ 1 công thức duy nhất cho "cung này có luận giải hay không", dùng ở cả 2 nơi (badge trong
  `PalaceCell` và điều kiện rỗng trong `RuleResultsPanel`).** Viết 1 hàm dùng chung:
  ```ts
  export function hasInterpretation(ruleResult: PalaceRuleResult): boolean {
    return ruleResult.matched.some((r) => r.matched) || ruleResult.conflicts.length > 0;
  }
  ```
  Đặt trong `web/src/types.ts` (cạnh các type `PalaceRuleResult`/`ConflictGroup` mà nó thao tác) hoặc 1 file
  helper mới `web/src/rule-helpers.ts` nếu `types.ts` không phải chỗ hợp lý cho logic (quyết định ở bước
  plan). KHÔNG viết lại biểu thức lọc `matched.some(...)`/`matched.filter(...)` riêng ở `PalaceCell.tsx` và
  `RuleResultsPanel.tsx` — cả 2 nơi PHẢI gọi `hasInterpretation()`. Lý do: đây là 2 nơi tính cùng 1 điều kiện
  từ cùng 1 dữ liệu nguồn — đúng mẫu rủi ro đã gặp với `chart_id` (Rule Engine v0.4): nếu sau này định nghĩa
  "có luận giải" thay đổi (VD thêm 1 loại kết quả khác cần tính vào), sửa 1 chỗ mà quên chỗ kia sẽ làm 2 nơi
  lệch nhau âm thầm.
- **Conflict groups PHẢI hiển thị đủ mọi `rules` trong nhóm, ngang hàng nhau** — không rút gọn, không mặc
  định thu gọn 1 bên, không sắp xếp theo thứ tự ngụ ý "cái đầu tiên đúng hơn". Đây là ranh giới cốt lõi dự
  án (CLAUDE.md mục 2), áp dụng cho UI y hệt tầng LLM.
- **Không đổi `ChartRulesResponse`/`PalaceRuleResult`/`Chart` types** (`web/src/types.ts`) — đây là bản copy
  tay từ backend, đổi ở đây mà không đồng bộ ngược sẽ gây lệch thầm lặng. Nếu implement phát hiện cần field
  mới không có trong `web/src/types.ts` nhưng CÓ trong `src/chart/types.ts`/`src/rule/*.ts` (backend), dừng
  lại hỏi — không tự thêm field đoán theo tên.
- **Không xóa/rút gọn bất kỳ field dữ liệu nào đang hiển thị** trong `PalaceCell`/`CenterBlock` hiện tại —
  chỉ đổi style/vị trí trình bày, không đổi nội dung thông tin hiển thị cho người dùng.
- **`RuleResultsPanel` phải xử lý rõ trường hợp rỗng** ("Chưa có luận giải cho cung này") — không để
  trống/không render gì khi click vào cung không có match.

## Testing

Không thêm test framework (xem "Ngoài phạm vi"). Xác nhận bằng:
1. `cd web && npm run build` (chạy `tsc -b && vite build`) — không có lỗi kiểu.
2. `cd web && npm run lint` (oxlint) — sạch.
3. Chạy `npm run dev` trong `web/`, mở trình duyệt, test tay case Phạm Duy:
   - Submit form → 12 cung hiển thị đúng bố cục vòng cung, palette đúng.
   - Click từng cung có badge "có luận giải" → panel mở, hiển thị đúng match/conflict (đối chiếu với dữ liệu
     API trả về qua DevTools Network tab nếu cần xác minh).
   - Click cung KHÔNG có badge → panel mở, hiển thị "Chưa có luận giải cho cung này".
   - Đóng panel bằng cả 3 cách (X, backdrop, Esc).
   - Test case có `view_year` → Lưu Niên hiển thị đúng trong ô + khối trung tâm.
   - Test light/dark mode (đổi theme hệ điều hành hoặc DevTools) — palette đổi đúng, không có vùng chữ không
     đọc được.
   - Test lỗi API (VD tắt backend) → thông báo lỗi vẫn hiển thị đúng như trước khi port.
