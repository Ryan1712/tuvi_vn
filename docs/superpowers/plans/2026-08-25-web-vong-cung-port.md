# Port bố cục vòng cung sang React (`web/`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay bố cục hiển thị lá số trong `web/` (CSS Grid 4x4 kiểu bảng hiện tại) bằng bố cục + palette đã
duyệt qua mockup HTML tĩnh (`docs/superpowers/mockups/2026-08-24-dia-ban-vong-cung.html`) — giấy dó/mực
chàm/đỏ son, chính tinh nổi bật font thư pháp, tên sao hiển thị có dấu (không phải `star_id` thô).

**Architecture:** Thêm 1 script generate (`scripts/generate-star-labels.ts`) đảo ngược
`STAR_ID_BY_VI` từ `src/chart/star-id-map.ts` thành `web/src/star-labels.ts` (đọc bằng regex, không import
runtime — `web/` không cài `iztro`). Thay CSS token + style trong `web/src/index.css` theo mockup. Viết lại
`PalaceGrid.tsx`/`PalaceCell.tsx` theo bố cục mockup, tách `RuleResults` (Interpretation) ra khỏi ô, hiển thị
qua `RuleResultsPanel` (modal) mới khi click 1 cung. Xóa `RuleResults.tsx` cũ.

**Tech Stack:** React 19, TypeScript, Vite 8 (không đổi). Không thêm dependency mới.

## Global Constraints

(Copy verbatim từ design doc `docs/superpowers/specs/2026-08-25-web-vong-cung-port-design.md`)

- **`PalaceRuleResult.matched` là mảng CHỨA CẢ rule KHÔNG match.** Bất kỳ chỗ nào cần biết "cung này có luận
  giải hay không" PHẢI dùng hàm `hasInterpretation()` dùng chung (Task 3), KHÔNG tự viết lại biểu thức lọc
  `matched.some(...)`/`matched.filter(...)` ở nơi khác.
- **Conflict groups PHẢI hiển thị đủ mọi `rules` trong nhóm, ngang hàng nhau** — không rút gọn, không mặc
  định thu gọn 1 bên, không sắp xếp theo thứ tự ngụ ý "cái đầu tiên đúng hơn".
- **Không đổi `ChartRulesResponse`/`PalaceRuleResult`/`Chart` types** (`web/src/types.ts`). Nếu cần field mới
  không có trong đó nhưng có ở backend, DỪNG LẠI hỏi — không tự thêm field đoán theo tên.
- **Không xóa/rút gọn bất kỳ field dữ liệu nào đang hiển thị** trong `PalaceCell`/`CenterBlock` hiện tại —
  chỉ đổi style/vị trí trình bày.
- **`RuleResultsPanel` phải xử lý rõ trường hợp rỗng** ("Chưa có luận giải cho cung này") — không để
  trống/không render gì.
- **Khi panel đang mở cung A, click sang ô cung B phải cập nhật ngay sang B** (không cần đóng-mở lại).
  Backdrop chỉ đóng khi click NGOÀI lưới 12 cung, không chặn việc click từ ô này sang ô khác.
- **`web/src/star-labels.ts` PHẢI được sinh tự động từ `src/chart/star-id-map.ts`**, không chép tay — nếu
  chép tay, đây sẽ là "nơi thứ 2 tính cùng 1 bảng", lệch âm thầm khi `star-id-map.ts` gốc thêm sao mới mà
  quên đồng bộ.
- **KHÔNG thêm test framework mới** (Vitest/RTL) ở phase này. Verify bằng `tsc -b` (qua `npm run build`),
  `oxlint` (qua `npm run lint`), và xem tay qua dev server.
- **Không đổi `App.tsx`'s state/luồng gọi API**, không đổi props interface `PalaceGrid({ data, displayName
  })`.
- **KHÔNG đụng `domain-query`** — chưa nối vào UI, ngoài phạm vi plan này.

---

### Task 1: Script sinh bảng nhãn sao (`web/src/star-labels.ts`)

**Files:**
- Create: `scripts/generate-star-labels.ts`
- Create (bằng cách CHẠY script trên, không viết tay): `web/src/star-labels.ts`
- Modify: `package.json` (thêm script `generate:star-labels`)

**Interfaces:**
- Produces: `web/src/star-labels.ts` export `const STAR_LABEL: Readonly<Record<string, string>>` (key =
  `star_id`, value = tên tiếng Việt có dấu — VD `{ THAM_LANG: 'Tham Lang', ... }`). Task 5 (`PalaceCell.tsx`)
  tiêu thụ export này.

- [ ] **Step 1: Đọc `src/chart/star-id-map.ts` để xác nhận vị trí bảng nguồn**

Bảng `STAR_ID_BY_VI` nằm dòng 10-107 của `src/chart/star-id-map.ts` (tại thời điểm viết plan này — script
PHẢI tìm bằng regex trên nội dung file, không hardcode số dòng, vì file này có thể thêm sao mới sau này làm
lệch số dòng). Format từng dòng trong bảng: `'Tên Có Dấu': 'STAR_ID',` (có thể có comment `//` ở dòng riêng
xen giữa — script phải bỏ qua comment, chỉ match dòng có pattern `'...': '...'`).

- [ ] **Step 2: Viết script generate**

Tạo `scripts/generate-star-labels.ts`:

```ts
/**
 * Sinh web/src/star-labels.ts tu STAR_ID_BY_VI trong src/chart/star-id-map.ts (dao nguoc
 * key/value: id -> ten co dau). KHONG import runtime tu src/chart/ (web/ khong cai iztro,
 * phai giu tach biet build) -- doc file nguon bang regex tren van ban thuan.
 *
 * Chay: npx tsx scripts/generate-star-labels.ts
 * (Chay lai moi khi src/chart/star-id-map.ts doi bang STAR_ID_BY_VI.)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE_PATH = 'src/chart/star-id-map.ts';
const OUTPUT_PATH = 'web/src/star-labels.ts';

const source = readFileSync(SOURCE_PATH, 'utf8');

const startMarker = 'const STAR_ID_BY_VI: Readonly<Record<string, string>> = {';
const startIdx = source.indexOf(startMarker);
if (startIdx === -1) {
  throw new Error(`Khong tim thay bang STAR_ID_BY_VI trong ${SOURCE_PATH}. File nguon co the da doi cau truc -- kiem tra lai truoc khi sua script nay.`);
}
const endIdx = source.indexOf('\n};', startIdx);
if (endIdx === -1) {
  throw new Error(`Khong tim thay dong dong bang (\`};\`) sau STAR_ID_BY_VI trong ${SOURCE_PATH}.`);
}
const tableBody = source.slice(startIdx + startMarker.length, endIdx);

const entryPattern = /'([^']+)':\s*'([A-Z_0-9]+)'/g;
const labelById: Record<string, string> = {};
let match: RegExpExecArray | null;
while ((match = entryPattern.exec(tableBody)) !== null) {
  const [, viName, starId] = match;
  labelById[starId] = viName;
}

const entryCount = Object.keys(labelById).length;
if (entryCount < 50) {
  throw new Error(`Chi parse duoc ${entryCount} entry tu STAR_ID_BY_VI -- qua it so voi ky vong (~80). Regex co the sai, KHONG ghi file output voi du lieu thieu.`);
}

const lines = Object.entries(labelById)
  .map(([id, vi]) => `  ${id}: ${JSON.stringify(vi)},`)
  .join('\n');

const output = `// TU DONG SINH boi scripts/generate-star-labels.ts tu src/chart/star-id-map.ts.
// KHONG SUA TAY FILE NAY -- sua ban goc (STAR_ID_BY_VI trong star-id-map.ts) roi chay lai:
//   npx tsx scripts/generate-star-labels.ts

export const STAR_LABEL: Readonly<Record<string, string>> = {
${lines}
};
`;

writeFileSync(OUTPUT_PATH, output, 'utf8');
console.log(`Da sinh ${OUTPUT_PATH} voi ${entryCount} nhan sao.`);
```

- [ ] **Step 3: Chạy script, xác nhận output**

Run: `npx tsx scripts/generate-star-labels.ts`
Expected output: `Da sinh web/src/star-labels.ts voi 80 nhan sao.` (số 80 khớp số entry hiện tại của
`STAR_ID_BY_VI` — nếu số khác 80, đối chiếu lại với `src/chart/star-id-map.ts` xem có đúng không trước khi
tiếp tục, KHÔNG tự ý sửa ngưỡng `< 50` trong script để né lỗi).

- [ ] **Step 4: Kiểm tra file sinh ra hợp lệ**

Run: `node -e "const m = require('./web/src/star-labels.ts')"` sẽ lỗi vì cú pháp ESM/TS — thay bằng:
`npx tsx -e "import { STAR_LABEL } from './web/src/star-labels.ts'; console.log(STAR_LABEL.THAM_LANG, STAR_LABEL.TU_VI, Object.keys(STAR_LABEL).length)"`
Expected: in ra `Tham Lang Tử Vi 80` (hoặc số entry thực tế nếu khác 80).

- [ ] **Step 5: Đăng ký script trong `package.json`**

Trong `package.json`'s `"scripts"` (sau dòng `"crosscheck": "npx tsx scripts/crosscheck-report.ts",`), thêm:
```json
    "generate:star-labels": "npx tsx scripts/generate-star-labels.ts",
```

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-star-labels.ts web/src/star-labels.ts package.json
git commit -m "feat: script sinh bang nhan sao tieng Viet cho web/ tu star-id-map.ts"
```

---

### Task 2: CSS token + font (palette giấy dó/mực chàm/đỏ son)

**Files:**
- Modify: `web/index.html`
- Modify: `web/src/index.css`

**Interfaces:**
- Produces: CSS custom properties `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--vermilion`,
  `--vermilion-soft`, `--umber`, `--brass`, `--brass-line`, `--paper-shadow`, `--center-bg`, `--focus-ring` —
  Task 4/5/6 dùng các token này qua `var(--...)`.

- [ ] **Step 1: Thêm Google Fonts vào `web/index.html`**

Đọc `web/index.html` hiện tại trước khi sửa (để giữ nguyên phần khác của file, chỉ thêm vào `<head>`):

```bash
cat web/index.html
```

Thêm 3 dòng sau vào trong `<head>`, ngay trước `</head>` (hoặc trước thẻ `<title>` nếu có, miễn còn trong
`<head>`):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Thay token màu trong `web/src/index.css`**

Thay toàn bộ khối `:root { ... }` (dòng 1-31 hiện tại) và khối `@media (prefers-color-scheme: dark) { :root {
... } }` (dòng 33-51 hiện tại) bằng:

```css
:root {
  --paper: #f2e9d8;
  --paper-deep: #e9dcc0;
  --ink: #1f3a5c;
  --ink-soft: #3a5578;
  --vermilion: #a8342a;
  --vermilion-soft: #c25c47;
  --umber: #4a3b2c;
  --brass: #b8935a;
  --brass-line: #cbaa74;
  --paper-shadow: rgba(31, 58, 92, 0.14);
  --center-bg: #ece0c8;
  --focus-ring: #a8342a;

  --sans: 'IBM Plex Sans', system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: 'Noto Serif TC', serif;
  --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color-scheme: light dark;
  color: var(--ink);
  background: var(--paper);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-variant-numeric: tabular-nums;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #16212e;
    --paper-deep: #101924;
    --ink: #e8dcc3;
    --ink-soft: #cbbfa4;
    --vermilion: #d9695a;
    --vermilion-soft: #e88a7c;
    --umber: #c9b899;
    --brass: #8f7442;
    --brass-line: #6e5a34;
    --paper-shadow: rgba(0, 0, 0, 0.45);
    --center-bg: #1c2a3a;
    --focus-ring: #d9695a;
  }
}

:root[data-theme="dark"] {
  --paper: #16212e;
  --paper-deep: #101924;
  --ink: #e8dcc3;
  --ink-soft: #cbbfa4;
  --vermilion: #d9695a;
  --vermilion-soft: #e88a7c;
  --umber: #c9b899;
  --brass: #8f7442;
  --brass-line: #6e5a34;
  --paper-shadow: rgba(0, 0, 0, 0.45);
  --center-bg: #1c2a3a;
  --focus-ring: #d9695a;
}
```

(Dự án không có cơ chế đổi `data-theme` bằng tay — không cần thêm toggle UI, chỉ cần khối `[data-theme="dark"]`
tồn tại để nhất quán với mockup gốc và sẵn sàng nếu sau này có toggle. `@media` là cơ chế active duy nhất.)

- [ ] **Step 3: Cập nhật các rule dùng biến màu cũ**

`h1`, `h2` (dòng 69-93 hiện tại) dùng `var(--text-h)` — đổi thành `var(--ink)`. `.error` (dòng 206-208) dùng
`#d94f4f` — đổi thành `var(--vermilion)`.

- [ ] **Step 4: Build thử để xác nhận không lỗi CSS/font**

Run: `cd web && npm run build`
Expected: build thành công, không lỗi.

- [ ] **Step 5: Commit**

```bash
git add web/index.html web/src/index.css
git commit -m "style: doi token mau + font sang palette giay do/muc cham/do son"
```

---

### Task 3: Hàm `hasInterpretation()` dùng chung

**Files:**
- Modify: `web/src/types.ts`

**Interfaces:**
- Consumes: `PalaceRuleResult` (đã có trong `web/src/types.ts`).
- Produces: `export function hasInterpretation(ruleResult: PalaceRuleResult): boolean` — Task 5
  (`PalaceCell.tsx`) và Task 6 (`RuleResultsPanel.tsx`) đều gọi hàm này, không tự viết lại logic lọc.

- [ ] **Step 1: Thêm hàm vào cuối `web/src/types.ts`**

Sau `export interface ChartOverviewResponse { ... }` (cuối file hiện tại), thêm:

```ts

/**
 * "Co luan giai hay khong" cho 1 cung -- DUY NHAT 1 cong thuc, dung o ca badge (PalaceCell)
 * lan dieu kien hien "chua co luan giai" (RuleResultsPanel). matched la mang CHUA CA rule
 * KHONG match (RuleEvalResult.matched la co that) -- phai loc truoc khi dung.
 */
export function hasInterpretation(ruleResult: PalaceRuleResult): boolean {
  return ruleResult.matched.some((r) => r.matched) || ruleResult.conflicts.length > 0;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc -b --noEmit`
Expected: không lỗi kiểu (hàm mới không phá vỡ gì, chưa có ai gọi nó).

- [ ] **Step 3: Commit**

```bash
git add web/src/types.ts
git commit -m "feat: them ham hasInterpretation() dung chung cho badge va panel"
```

---

### Task 4: Bố cục vòng cung trong `PalaceGrid.tsx` + CSS tương ứng

**Files:**
- Modify: `web/src/components/PalaceGrid.tsx`
- Modify: `web/src/index.css`

**Interfaces:**
- Consumes: `RuleResultsPanel` component từ `./RuleResultsPanel` (Task 6 tạo file này). `Branch` (đã có).
- Produces: `PalaceGrid` giữ nguyên props `{ data: ChartRulesResponse; displayName: string }` (không đổi —
  Global Constraint). Thêm nội bộ state `selectedBranch: Branch | null`. Truyền prop mới xuống `PalaceCell`:
  `onSelect: () => void`. Render `<RuleResultsPanel>` (Task 6 sẽ tạo file này — Task 4 CHỈ viết phần gọi, code
  thực của `RuleResultsPanel` do Task 6 cung cấp; nếu chạy Task 4 trước Task 6, tạm import từ đường dẫn đã
  định sẵn `./RuleResultsPanel` — file sẽ tồn tại sau khi Task 6 chạy, thứ tự khuyến nghị: chạy Task 6 trước
  hoặc cùng lúc Task 4 nếu dùng subagent-driven-development với review theo thứ tự Task 1→2→3→4→5→6→7 tuần
  tự, tránh vấn đề import file chưa tồn tại).

- [ ] **Step 1: Viết lại `web/src/components/PalaceGrid.tsx`**

```tsx
import { useState } from 'react';
import type { Branch, Chart, ChartRulesResponse } from '../types';
import { PalaceCell } from './PalaceCell';
import { RuleResultsPanel } from './RuleResultsPanel';

interface PalaceGridProps {
  data: ChartRulesResponse;
  displayName: string;
}

// Vi tri tren luoi CSS Grid 4x4, dung thu tu dia chi chuan tu vi (doi chieu voi anh
// goc tuvi.vn trong luc brainstorm — hang tren Ty-Ngo-Mui-Than, hang duoi Dan-Suu-Ty-Hoi).
const GRID_POSITION: Record<Branch, { column: number; row: number }> = {
  Ty2: { column: 1, row: 1 },
  Ngo: { column: 2, row: 1 },
  Mui: { column: 3, row: 1 },
  Than: { column: 4, row: 1 },
  Thin: { column: 1, row: 2 },
  Dau: { column: 4, row: 2 },
  Mao: { column: 1, row: 3 },
  Tuat: { column: 4, row: 3 },
  Dan: { column: 1, row: 4 },
  Suu: { column: 2, row: 4 },
  Ty: { column: 3, row: 4 },
  Hoi: { column: 4, row: 4 },
};

function CenterBlock({ chart, displayName }: { chart: Chart; displayName: string }) {
  const laiNhanPalace = chart.palaces.find((p) => p.is_original_palace);
  return (
    <div className="center-block">
      {displayName && <div className="center-title">{displayName}</div>}
      <div className="center-row">Ngày sinh: {chart.metadata.birth_solar_date} (dương) / {chart.metadata.birth_lunar_date} (âm)</div>
      <div className="center-row">Giờ: {chart.metadata.time_label} ({chart.metadata.time_range})</div>
      <div className="center-row">Năm can chi: {chart.metadata.year_can_chi}</div>
      {chart.luu_nien && <div className="center-row">Năm xem: {chart.luu_nien.year} ({chart.luu_nien.heavenly_stem}.{chart.luu_nien.earthly_branch})</div>}
      <div className="center-row">Bản mệnh: {chart.ban_menh_nap_am} — {chart.cuc.raw}</div>
      <div className="center-row">Chủ mệnh: {chart.menh_than.soul_star}</div>
      <div className="center-row">Chủ thân: {chart.menh_than.body_star}</div>
      {laiNhanPalace && <div className="center-row">Lai nhân cung: {laiNhanPalace.palace_name}</div>}
    </div>
  );
}

export function PalaceGrid({ data, displayName }: PalaceGridProps) {
  const { chart, rules_by_palace } = data;
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const selectedPalace = selectedBranch
    ? chart.palaces.find((p) => p.branch === selectedBranch)
    : null;

  return (
    <div className="palace-grid">
      {chart.palaces.map((palace) => {
        const pos = GRID_POSITION[palace.branch];
        const decadal = chart.luck_cycles.dai_van.find((d) => d.branch === palace.branch);
        const luuNienPalace = chart.luu_nien?.palaces.find((p) => p.branch === palace.branch);
        return (
          <div
            key={palace.branch}
            style={{ gridColumn: pos.column, gridRow: pos.row }}
          >
            <PalaceCell
              palace={palace}
              isMenhPalace={palace.branch === chart.menh_than.menh_branch}
              ageAtDecadalStart={decadal?.age_from ?? 0}
              daiVanPalaceName={decadal?.palace_name}
              luuNienPalaceName={luuNienPalace?.palace_name}
              luuNienStars={luuNienPalace?.stars}
              ruleResult={rules_by_palace[palace.branch]}
              onSelect={() => setSelectedBranch(palace.branch)}
            />
          </div>
        );
      })}
      <div style={{ gridColumn: '2 / 4', gridRow: '2 / 4' }}>
        <CenterBlock chart={chart} displayName={displayName} />
      </div>
      <RuleResultsPanel
        branch={selectedBranch}
        palaceName={selectedPalace?.palace_name ?? null}
        ruleResult={selectedBranch ? rules_by_palace[selectedBranch] : null}
        onClose={() => setSelectedBranch(null)}
      />
    </div>
  );
}
```

Ghi chú: thêm `isMenhPalace` (để viền đỏ ô Mệnh, đúng mockup) và `luuNienStars` (mockup hiển thị TÊN SAO lưu
niên, không chỉ tên cung — bản `PalaceCell.tsx` hiện tại chỉ có `luuNienPalaceName`, thiếu danh sách sao lưu
niên; đây là field ĐÃ CÓ SẴN trong `LuuNienPalace.stars` của `web/src/types.ts` dòng 78, chỉ chưa được
`PalaceGrid` truyền xuống — không phải thêm field mới ngoài Global Constraint "không đổi
ChartRulesResponse/PalaceRuleResult/Chart types", vì `types.ts` không đổi, chỉ truyền thêm 1 prop nội bộ giữa
`PalaceGrid`↔`PalaceCell`).

- [ ] **Step 2: Thêm CSS cho `.palace-grid` (khối vòng cung) và `.center-block` mới trong `web/src/index.css`**

CẢNH BÁO SỐ DÒNG: Task 2 (chạy trước) đã sửa phần đầu `web/src/index.css` (token màu), nên số dòng của
`.palace-grid`/`.center-block` không còn đúng như bản gốc trước phase này — tìm bằng tên class, không dựa vào
số dòng. Thay 2 rule đó bằng (port từ mockup, giữ tên class hiện có để không phải sửa lại JSX ngoài những gì
Step 1 đã đổi):

```css
.palace-grid {
  position: relative;
  width: min(1240px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: clamp(6px, 0.8vw, 12px);
}

.center-block {
  height: 100%;
  background: radial-gradient(circle at 30% 20%, var(--paper-deep), var(--center-bg) 70%);
  border: 1px solid var(--brass-line);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(10px, 1.6vw, 22px);
  gap: 6px;
  box-sizing: border-box;
}

.center-row {
  font-size: clamp(11px, 1vw, 13px);
  color: var(--ink-soft);
  line-height: 1.6;
}

@media (max-width: 760px) {
  .palace-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(7, auto);
    aspect-ratio: auto;
  }
}
```

- [ ] **Step 3: Sửa `#root` width để phù hợp bố cục vuông rộng hơn**

Tìm rule `#root { ... }` trong `web/src/index.css` (không dựa vào số dòng — xem cảnh báo ở Step 2), đổi
`width: 1126px;` thành `width: 1320px;` (đủ chỗ cho `.palace-grid` rộng tối đa 1240px + padding hai bên,
tránh bố cục bị bó hẹp so với mockup gốc). Các thuộc tính khác của `#root` giữ nguyên.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/PalaceGrid.tsx web/src/index.css
git commit -m "feat: doi PalaceGrid sang bo cuc 4x4 vong cung, them state selectedBranch"
```

---

### Task 5: `PalaceCell.tsx` — style mới + tên sao có dấu + badge, bỏ RuleResults inline

**Files:**
- Modify: `web/src/components/PalaceCell.tsx`
- Modify: `web/src/index.css`

**Interfaces:**
- Consumes: `STAR_LABEL` từ `../star-labels` (Task 1). `hasInterpretation` từ `../types` (Task 3).
- Produces: `PalaceCell` nhận thêm props `isMenhPalace: boolean`, `luuNienStars?: { star_id: string }[]`,
  `onSelect: () => void` (khớp với những gì Task 4 đã truyền xuống).

- [ ] **Step 1: Viết lại `web/src/components/PalaceCell.tsx`**

```tsx
import type { ChartPalace, PalaceRuleResult, Sihua } from '../types';
import { hasInterpretation } from '../types';
import { STAR_LABEL } from '../star-labels';

interface PalaceCellProps {
  palace: ChartPalace;
  isMenhPalace: boolean;
  ageAtDecadalStart: number;
  daiVanPalaceName?: string;
  luuNienPalaceName?: string;
  luuNienStars?: { star_id: string }[];
  ruleResult: PalaceRuleResult;
  onSelect: () => void;
}

const BRANCH_LABEL: Record<string, string> = {
  Ty: 'Tý', Suu: 'Sửu', Dan: 'Dần', Mao: 'Mão', Thin: 'Thìn', Ty2: 'Tỵ',
  Ngo: 'Ngọ', Mui: 'Mùi', Than: 'Thân', Dau: 'Dậu', Tuat: 'Tuất', Hoi: 'Hợi',
};

const BRIGHTNESS_LABEL: Record<string, string> = {
  mieu: 'Miếu', vuong: 'Vượng', dac: 'Đắc', loi: 'Lợi', binh: 'Bình', bat: 'Bất', ham: 'Hãm',
};

const SIHUA_LABEL: Record<Sihua['type'], string> = {
  Loc: 'Lộc', Quyen: 'Quyền', Khoa: 'Khoa', Ky: 'Kỵ',
};

function starLabel(starId: string): string {
  return STAR_LABEL[starId] ?? starId;
}

function sihuaFor(starId: string, sihua: Sihua[]): string | null {
  const hit = sihua.find((s) => s.star_id === starId);
  return hit ? SIHUA_LABEL[hit.type] : null;
}

export function PalaceCell({
  palace,
  isMenhPalace,
  ageAtDecadalStart,
  daiVanPalaceName,
  luuNienPalaceName,
  luuNienStars,
  ruleResult,
  onSelect,
}: PalaceCellProps) {
  const hasTriet = palace.adjective_stars.some((s) => s.star_id === 'TRIET_LO' || s.star_id === 'TRIET_KHONG');
  const hasTuan = palace.adjective_stars.some((s) => s.star_id === 'TUAN_KHONG');
  const catStars = palace.minor_stars.filter((s) => s.type === 'soft');
  const otherStars = palace.minor_stars.filter((s) => s.type !== 'soft');
  const showBadge = hasInterpretation(ruleResult);

  const cellClass = [
    'palace-cell',
    isMenhPalace ? 'palace-cell-menh' : '',
    palace.is_body_palace ? 'palace-cell-than' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cellClass} onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}>
      <div className="palace-top-row">
        <span className="palace-branch-stem">
          {palace.palace_stem}.{BRANCH_LABEL[palace.branch]}
        </span>
        <span className="palace-name">{palace.palace_name}</span>
        <span className="palace-age">{ageAtDecadalStart}</span>
      </div>
      {palace.major_stars.length > 0 && (
        <div className="major-row">
          {palace.major_stars.map((s) => {
            const sihuaText = sihuaFor(s.star_id, palace.sihua);
            return (
              <span key={s.star_id} className="star-chip">
                {starLabel(s.star_id)}
                {s.strength && <span className="brightness">({BRIGHTNESS_LABEL[s.strength]})</span>}
                {sihuaText && <span className="sihua-tag">Hóa {sihuaText}</span>}
              </span>
            );
          })}
        </div>
      )}
      {(catStars.length > 0 || otherStars.length > 0) && (
        <div className="minor-row">
          {[...catStars, ...otherStars].map((s) => {
            const sihuaText = sihuaFor(s.star_id, palace.sihua);
            return (
              <span key={s.star_id} className="star">
                {starLabel(s.star_id)}
                {s.strength ? `(${BRIGHTNESS_LABEL[s.strength]})` : ''}
                {sihuaText && <span className="sihua-tag">Hóa {sihuaText}</span>}
              </span>
            );
          })}
        </div>
      )}
      {palace.adjective_stars.length > 0 && (
        <div className="adj-row">
          {palace.adjective_stars.map((s) => (
            <span key={s.star_id} className="star">{starLabel(s.star_id)}</span>
          ))}
        </div>
      )}
      {(hasTuan || hasTriet) && (
        <div className="badge-row">
          {hasTuan && <span className="badge tuan">Tuần</span>}
          {hasTriet && <span className="badge triet">Triệt</span>}
        </div>
      )}
      <div className="cycle-strip">
        <div><span className="lbl">TS</span> {palace.truong_sinh}</div>
        <div><span className="lbl">ĐV</span> {daiVanPalaceName ?? '—'}</div>
        <div><span className="lbl">BS</span> {palace.boshi}</div>
        <div><span className="lbl">TT</span> {palace.jiangqian}</div>
        <div><span className="lbl">TuT</span> {palace.suiqian}</div>
      </div>
      {luuNienPalaceName && (
        <div className="luu-nien-line">
          <strong>LN.{luuNienPalaceName}</strong>
          {luuNienStars && luuNienStars.length > 0 && ` — ${luuNienStars.map((s) => starLabel(s.star_id)).join(', ')}`}
        </div>
      )}
      {showBadge && <div className="palace-has-interpretation" title="Có luận giải — bấm để xem" />}
    </div>
  );
}
```

Ghi chú các quyết định trong bước này:
- `hasTriet` giờ kiểm tra CẢ `TRIET_LO` lẫn `TRIET_KHONG` — bản gốc chỉ kiểm tra `TRIET_LO`. Đây KHÔNG phải
  mở rộng phạm vi tự ý: `docs/superpowers/specs/2026-08-16-chart-engine-design.md` mục 7 (cập nhật
  2026-08-21) đã ghi rõ sau khi đổi `algorithm` sang `zhongzhou`, nhãn Triệt đổi từ `TRIET_LO` sang
  `TRIET_KHONG` — giữ nguyên chỉ `TRIET_LO` sẽ làm badge "Triệt" biến mất âm thầm với cấu hình hiện tại của
  dự án. Nếu điều tra thấy ngược lại (VD `TRIET_LO` vẫn xuất hiện song song), báo cáo lại thay vì tự sửa
  thêm.
- `role="button" tabIndex={0}` + `onKeyDown` cho khả năng bấm bằng bàn phím (Enter/Space) — vì ô giờ có hành
  vi click nhưng dùng thẻ `div`, không phải `<button>` (giữ để không phá cấu trúc CSS Grid layout của
  `PalaceGrid`).

- [ ] **Step 2: Thay CSS cho ô cung trong `web/src/index.css`**

CẢNH BÁO SỐ DÒNG: Task 4 (chạy trước) đã sửa `web/src/index.css`, nên số dòng thực tế trong file lúc Task 5
bắt đầu KHÁC với bản gốc trước Task 1-4. KHÔNG dựa vào số dòng để định vị — tìm bằng TÊN CLASS/nội dung.

Đọc lại `web/src/index.css` hiện tại trước khi sửa. Tìm và XÓA các rule sau (nội dung gốc trước phase này —
`.center-block`/`.center-title` có thể đã bị Task 4 sửa/xóa, nếu vậy bỏ qua rule nào không còn tồn tại):
`.palace-cell`, `.palace-top-row`, `.palace-name`, `.palace-major`, `.sihua-marker`, `.palace-minor-grid`,
`.palace-minor-col-cat`, `.palace-minor-col-other`, `.palace-adjective`, `.palace-cycles`, `.badge`,
`.center-title` (nếu Task 4 chưa xóa nó — nếu Task 4 đã port `.center-title` rồi thì bỏ qua, không xóa lại).
Sau khi xóa các rule cũ không còn dùng (JSX của Task 5 Step 1 không còn render class `.palace-top-row` với
nội dung cũ, `.palace-major`, `.palace-minor-grid`, `.palace-adjective`, `.palace-cycles` theo đúng cấu trúc
cũ — các class này bị THAY TÊN sang cấu trúc mới bên dưới), thêm các rule mới sau:

```css
.palace-cell {
  background: var(--paper-deep);
  border: 1px solid var(--brass-line);
  border-radius: 5px;
  padding: 8px 9px 7px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  box-shadow: 0 1px 0 var(--paper-shadow);
  position: relative;
  cursor: pointer;
}

.palace-cell-menh {
  border-color: var(--vermilion);
  border-width: 2px;
  box-shadow: 0 0 0 1px var(--vermilion) inset, 0 2px 6px var(--paper-shadow);
}

.palace-cell-than::after {
  content: "Thân";
  position: absolute;
  top: -9px;
  right: 8px;
  background: var(--ink);
  color: var(--paper);
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 1px 6px;
  border-radius: 999px;
}

.palace-top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
  border-bottom: 1px solid var(--brass-line);
  padding-bottom: 3px;
}

.palace-branch-stem {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--brass);
  letter-spacing: 0.04em;
}

.palace-name {
  font-family: var(--heading);
  font-weight: 600;
  font-size: clamp(12px, 1.05vw, 15px);
  color: var(--ink);
}

.palace-age {
  font-size: 10px;
  color: var(--ink-soft);
  font-family: var(--mono);
}

.major-row {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 5px;
}

.star-chip {
  font-family: var(--heading);
  font-size: clamp(14px, 1.3vw, 18px);
  font-weight: 700;
  color: var(--vermilion);
  letter-spacing: 0.02em;
}

.star-chip .brightness {
  font-family: var(--sans);
  font-weight: 500;
  font-size: 0.6em;
  color: var(--vermilion-soft);
  margin-left: 2px;
}

.sihua-tag {
  font-size: 9px;
  font-weight: 600;
  color: var(--paper);
  background: var(--ink);
  border-radius: 3px;
  padding: 0 3px;
  margin-left: 2px;
  letter-spacing: 0.02em;
  vertical-align: 1px;
}

.minor-row, .adj-row {
  font-size: clamp(9.5px, 0.8vw, 11px);
  color: var(--ink-soft);
  line-height: 1.5;
}

.minor-row .star, .adj-row .star {
  color: var(--umber);
}

.minor-row .star::after, .adj-row .star:not(:last-child)::after {
  content: "、";
  color: var(--ink-soft);
}

.badge-row {
  display: flex;
  gap: 4px;
  margin-top: 1px;
}

.badge {
  font-size: 9px;
  letter-spacing: 0.05em;
  border: 1px solid var(--ink-soft);
  color: var(--ink-soft);
  border-radius: 3px;
  padding: 0 4px;
}

.badge.tuan { border-color: var(--brass); color: var(--brass); }
.badge.triet { border-color: var(--vermilion-soft); color: var(--vermilion); }

.cycle-strip {
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px dashed var(--brass-line);
  font-size: 9px;
  color: var(--ink-soft);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px 6px;
}

.cycle-strip .lbl { color: var(--brass); }

.luu-nien-line {
  font-size: 9px;
  color: var(--ink-soft);
  font-style: italic;
}

.luu-nien-line strong { color: var(--umber); font-style: normal; }

.palace-has-interpretation {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vermilion);
}

.center-title {
  font-family: var(--heading);
  font-weight: 700;
  font-size: clamp(18px, 2.2vw, 28px);
  letter-spacing: 0.08em;
  margin: 2px 0 6px;
  color: var(--ink);
}
```

- [ ] **Step 3: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: cả 2 sạch, không lỗi.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/PalaceCell.tsx web/src/index.css
git commit -m "feat: PalaceCell dung ten sao co dau, style vong cung, bo RuleResults inline"
```

---

### Task 6: `RuleResultsPanel.tsx` (mới) + xóa `RuleResults.tsx` cũ

**Files:**
- Create: `web/src/components/RuleResultsPanel.tsx`
- Delete: `web/src/components/RuleResults.tsx`
- Modify: `web/src/index.css`

**Interfaces:**
- Consumes: `PalaceRuleResult`, `Branch`, `hasInterpretation` từ `../types` (Task 3).
- Produces: `RuleResultsPanel` — component Task 4 đã import và render.

- [ ] **Step 1: Viết `web/src/components/RuleResultsPanel.tsx`**

```tsx
import { useEffect } from 'react';
import type { Branch, PalaceRuleResult } from '../types';
import { hasInterpretation } from '../types';

interface RuleResultsPanelProps {
  branch: Branch | null;
  palaceName: string | null;
  ruleResult: PalaceRuleResult | null;
  onClose: () => void;
}

export function RuleResultsPanel({ branch, palaceName, ruleResult, onClose }: RuleResultsPanelProps) {
  useEffect(() => {
    if (branch === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [branch, onClose]);

  if (branch === null || ruleResult === null) return null;

  const matched = ruleResult.matched.filter((r) => r.matched);
  const hasContent = hasInterpretation(ruleResult);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className="rule-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rule-panel-head">
          <span>{palaceName}</span>
          <button type="button" className="rule-panel-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        {!hasContent && (
          <div className="rule-panel-empty">Chưa có luận giải cho cung này.</div>
        )}
        {matched.map((r) => (
          <div key={r.rule_id} className="rule-panel-match">
            <span>{r.rule_id}</span>
            {r.matched_modifiers.length > 0 && (
              <span className="rule-panel-modifier"> (modifier: {r.matched_modifiers.map((m) => m.effect).join(', ')})</span>
            )}
          </div>
        ))}
        {ruleResult.conflicts.map((c) => (
          <div key={c.conflict_group_id} className="rule-panel-conflict">
            <div className="rule-panel-conflict-label">Tranh cãi ({c.conflict_group_id})</div>
            <div className="rule-panel-conflict-group">
              {c.rules.map((r) => (
                <div key={r.rule_id} className="rule-panel-conflict-rule">
                  <div className="rule-panel-conflict-rule-id">{r.rule_id}</div>
                  <div className="rule-panel-conflict-rule-text">{r.conclusion.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Xác nhận đúng Global Constraint "conflict groups hiển thị đủ mọi rules, ngang hàng": mọi `r` trong
`c.rules.map(...)` render cùng 1 style `.rule-panel-conflict-rule` — không có `r` nào bị wrap trong
`<details>`/accordion đóng mặc định, không có `.slice(0, 1)` hay tương tự.

- [ ] **Step 2: Xóa `web/src/components/RuleResults.tsx`**

```bash
rm web/src/components/RuleResults.tsx
```

Xác nhận không còn nơi nào import file này:

Run: `grep -rn "from './RuleResults'" web/src/ 2>/dev/null; grep -rn "from \"./RuleResults\"" web/src/ 2>/dev/null`
Expected: không có kết quả nào (Task 5 đã xóa import này khỏi `PalaceCell.tsx`).

- [ ] **Step 3: Thêm CSS cho panel vào `web/src/index.css`**

```css
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.rule-panel {
  background: var(--paper);
  border: 1px solid var(--brass-line);
  border-radius: 8px;
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 16px 20px 20px;
  box-shadow: 0 8px 24px var(--paper-shadow);
}

.rule-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--brass-line);
  padding-bottom: 8px;
  margin-bottom: 10px;
  font-family: var(--heading);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
}

.rule-panel-close {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 0 4px;
}

.rule-panel-close:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.rule-panel-empty {
  color: var(--ink-soft);
  font-style: italic;
  padding: 8px 0;
}

.rule-panel-match {
  padding: 6px 0;
  border-bottom: 1px solid var(--brass-line);
  font-size: 14px;
  color: var(--ink);
}

.rule-panel-modifier {
  color: var(--ink-soft);
  font-size: 13px;
}

.rule-panel-conflict {
  margin-top: 10px;
}

.rule-panel-conflict-label {
  font-size: 12px;
  color: var(--vermilion);
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.rule-panel-conflict-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-panel-conflict-rule {
  background: var(--paper-deep);
  border: 1px solid var(--brass-line);
  border-radius: 5px;
  padding: 8px 10px;
}

.rule-panel-conflict-rule-id {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--brass);
  margin-bottom: 3px;
}

.rule-panel-conflict-rule-text {
  font-size: 14px;
  color: var(--ink);
}
```

- [ ] **Step 4: Build + lint**

Run: `cd web && npm run build && npm run lint`
Expected: cả 2 sạch.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/RuleResultsPanel.tsx web/src/index.css
git rm web/src/components/RuleResults.tsx
git commit -m "feat: them RuleResultsPanel (modal khi click cung), xoa RuleResults.tsx cu"
```

---

### Task 7: `OverviewSection.tsx` style nhẹ + xem tay toàn bộ luồng qua dev server

**Files:**
- Modify: `web/src/components/OverviewSection.tsx`
- Modify: `web/src/index.css`

**Interfaces:**
- Không đổi props/logic của `OverviewSection`.

- [ ] **Step 1: Thêm className cho các dòng trong `OverviewSection.tsx`**

Đọc file hiện tại (`web/src/components/OverviewSection.tsx`, 17 dòng, đã có trong design doc/context — không
đổi cấu trúc, chỉ đảm bảo `<h2>`/`<p>` bên trong `.overview-section` kế thừa đúng token màu mới qua CSS đã
sửa ở Step 2, không cần sửa JSX của file này — nếu đọc lại thấy cấu trúc khác với bản đã biết, dừng lại đối
chiếu trước khi sửa).

- [ ] **Step 2: Cập nhật CSS cho `.overview-section`**

CẢNH BÁO SỐ DÒNG: `web/src/index.css` đã bị Task 2/4/5/6 sửa nhiều lần trước Task 7 — KHÔNG dựa vào số dòng,
tìm bằng tên class `.overview-section`/`.overview-section.error` trong file hiện tại. Thay 2 rule đó bằng:

```css
.overview-section {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--brass-line);
  border-radius: 6px;
  background: var(--paper-deep);
  text-align: left;
}

.overview-section.error {
  border-color: var(--vermilion-soft);
  color: var(--vermilion);
}

.overview-section h2 {
  font-family: var(--heading);
}
```

- [ ] **Step 3: Chạy dev server, test tay toàn bộ luồng**

Run: `cd web && npm run dev` (giữ chạy), và ở terminal khác: `npm run start` (backend, từ thư mục gốc dự án)
để có API thật.

Test case Phạm Duy (dùng input đã dùng suốt dự án: dương lịch 1998-12-17, giờ Tý muộn/time_index=12, nam):
- Submit form → 12 cung hiển thị đúng bố cục vòng cung, palette giấy dó/mực chàm/đỏ son.
- Tên chính tinh hiển thị có dấu, to/đậm rõ hơn phụ/tạp tinh (VD "Tham Lang", không phải "THAM_LANG").
- Ô cung Mệnh (Hợi, theo case Phạm Duy) có viền đỏ đậm hơn các ô khác.
- Click 1 cung có chấm đỏ góc dưới phải → panel mở, đúng nội dung `RuleResults` của cung đó (đối chiếu qua
  DevTools Network tab, xem response `/api/charts/rules` để xác nhận `matched`/`conflicts` khớp).
- Click 1 cung KHÔNG có chấm đỏ → panel mở, hiển thị "Chưa có luận giải cho cung này".
- Đang mở panel cung A, click sang ô cung B (không đóng panel trước) → panel cập nhật ngay sang B.
- Đóng panel bằng cả 3 cách: nút ×, click nền tối ngoài panel, phím Esc.
- Nếu có cung rơi vào `conflicts`: xác nhận CẢ 2 rule trong nhóm hiển thị ngang hàng (không cái to cái nhỏ,
  không cái bị ẩn).
- Test với `view_year` điền vào form (VD `2026-6-15`) → khối trung tâm hiện "Năm xem", ô cung tương ứng hiện
  dòng "LN.<tên cung>" kèm tên sao lưu niên có dấu.
- Tắt backend, thử submit lại → thông báo lỗi vẫn hiển thị đúng như trước khi port (dùng `.error` class mới).
- Đổi theme hệ điều hành (sáng ↔ tối) hoặc qua DevTools rendering emulation → palette đổi đúng theo cả 2
  theme, không có vùng chữ không đọc được trên nền của nó.

Dừng server sau khi xác minh xong (Ctrl+C ở cả 2 terminal).

- [ ] **Step 4: Build + lint lần cuối toàn bộ**

Run: `cd web && npm run build && npm run lint`
Expected: cả 2 sạch — đây là lần build cuối xác nhận toàn bộ 6 task trước không để lại lỗi kiểu/lint nào.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/OverviewSection.tsx web/src/index.css
git commit -m "style: dieu chinh OverviewSection theo palette moi, xac nhan toan bo luong qua dev server"
```
