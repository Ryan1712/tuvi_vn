# Đổi `algorithm` mặc định của `iztro` sang `zhongzhou` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi cấu hình `algorithm` mặc định của `iztro` từ `'default'` sang `'zhongzhou'`
(Trung Châu phái) cho toàn bộ dự án, khớp lại đúng trường phái nền tảng đã chọn từ đầu.

**Architecture:** 1 lời gọi `astro.config({ algorithm: 'zhongzhou' })` ở module-level của
`src/chart/iztro-client.ts` — hằng số toàn cục, không phải field theo request (xem design doc
mục 1.1 lý do). Đóng luôn 1 lỗ hổng thật đã phát hiện: 3 file test tự import `astro` từ `iztro`
trực tiếp, bỏ qua `iztro-client.ts` — phải đổi sang gọi qua `callIztro()` để nhận đúng cấu hình
toàn cục, không chạy với `algorithm` mặc định của thư viện một cách vô tình.

**Tech Stack:** TypeScript, Vitest — không đổi.

**Design doc:** `docs/superpowers/specs/2026-08-21-algorithm-zhongzhou-design.md` — đọc trước
khi thực hiện bất kỳ task nào, đặc biệt mục 1.2 (ranh giới tầng tính toán vs tầng luận giải) và
mục 3 (lý do test khóa hành vi phải dùng runtime behavior, không dừng ở grep tĩnh).

## Global Constraints

- `astro.config({ algorithm: 'zhongzhou' })` CHỈ được gọi đúng 1 chỗ duy nhất trong toàn bộ
  codebase: module-level của `src/chart/iztro-client.ts`. KHÔNG gọi lại ở bất kỳ file nào khác
  (kể cả test) — nếu 1 test cần `algorithm` khác để so sánh, dùng `astro.config()` cục bộ trong
  chính test đó rồi PHẢI gọi lại `astro.config({ algorithm: 'zhongzhou' })` trong `afterEach`
  để khôi phục trạng thái toàn cục cho các test khác (xem Task 3 nếu cần case này — hiện tại
  design doc KHÔNG yêu cầu test nào so sánh 2 algorithm cùng lúc, chỉ nêu ra để phòng khi
  implementer cân nhắc thêm test debug).
- KHÔNG thêm field `algorithm` vào `BuildChartInput`/`Chart`/`EngineMeta` (đã chốt ở design doc
  mục 2.2 — không có nhu cầu chọn theo request).
- MỌI file trong `src/` và `test/` cần dữ liệu từ `iztro` PHẢI gọi qua `callIztro()` (export từ
  `src/chart/iztro-client.ts` hoặc `src/chart/index.ts`) hoặc `buildChart()` — KHÔNG tự
  `import { astro } from 'iztro'` rồi gọi `astro.bySolar`/`astro.byLunar` trực tiếp. Ngoại lệ
  duy nhất: chính `iztro-client.ts`.
- Test suite khóa hành vi (Task 2) dùng giá trị CỤ THỂ đã verify sẵn khi viết design doc —
  `PHAM_DUY_SOUL = 'Lộc Tồn'`, `OTHER_CASE_SOUL = 'Phá Quân'` — dùng nguyên các giá trị này,
  KHÔNG tự chạy lại để "xác nhận" rồi thay đổi nếu ra khác (nếu ra khác, đó là bug cần điều
  tra, không phải test sai).
- Mọi assertion test hiện có bị `algorithm` ảnh hưởng (soul_star, 1 số adjective_stars,
  suiqian) PHẢI được cập nhật sang giá trị CỤ THỂ mới (lấy từ chạy `buildChart()` thật sau khi
  đã đổi config) — KHÔNG được nới lỏng thành assertion chung chung (`toBeDefined()`,
  `toBeTruthy()`...) chỉ để test pass trở lại.
- Sau khi hoàn tất, TOÀN BỘ test suite phải pass — không có ngoại lệ, không skip test nào.

---

### Task 1: Đổi `algorithm` sang `zhongzhou` tại `iztro-client.ts` + bổ sung 4 sao mới + cập nhật `adapter.ts`

**[PHÁT HIỆN LÚC VERIFY PLAN TRONG SCRATCH — không có trong bản nháp đầu]** Chỉ đổi
`astro.config()` KHÔNG ĐỦ để test suite chạy được. `zhongzhou` làm xuất hiện 4 tên sao mới
chưa từng có trong `KNOWLEDGE_BASE`/case Phạm Duy trước đây — code fail-loud đúng thiết kế
(throw ngay, đúng ý đồ ban đầu của `starIdFromVi`), nhưng nếu không bổ sung bảng tra, TOÀN BỘ
77/165 test sẽ fail ngay khi build bất kỳ chart nào chạm cung liên quan. Đã verify bằng cách
chạy thật trong scratch: áp riêng bước đổi `algorithm` trước, chạy suite, thấy chính xác lỗi
này — không phải suy đoán. Ngoài ra design doc mục 2.2 còn yêu cầu 1 việc nữa (thêm dòng vào
`notes` của `adapter.ts`) mà bản nháp đầu của Task này quên liệt kê — gộp cả 3 việc vào đây vì
cùng thuộc phạm vi "đổi algorithm", tách nhỏ hơn sẽ vụn không cần thiết.

**Files:**
- Modify: `src/chart/iztro-client.ts`
- Modify: `src/chart/star-id-map.ts`
- Modify: `src/chart/adapter.ts`

**Interfaces:**
- Không đổi export nào — `callIztro(input: BuildChartInput): IFunctionalAstrolabe` giữ nguyên
  chữ ký. Chỉ thêm side-effect (gọi `astro.config()`) chạy 1 lần khi module được import, thêm
  4 entry vào bảng tra nội bộ `STAR_ID_BY_VI`, và thêm 1 dòng vào mảng `notes` nội bộ của
  `adaptFromIztro`.

- [ ] **Step 1: Sửa `src/chart/iztro-client.ts`**

Thêm import và lời gọi `astro.config()` ở module-level, TRƯỚC định nghĩa hàm đầu tiên. Nội
dung đầy đủ file sau khi sửa (giữ nguyên toàn bộ phần còn lại, chỉ thêm đoạn mới):

```ts
import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { BuildChartInput } from './types.js';

/**
 * Chon algorithm 'zhongzhou' (Trung Chau phai) lam MAC DINH TOAN CUC cho toan bo du an —
 * khop dung dinh huong nen tang da chon tu dau (TuVi_Build_Spec_v1.md: "lop suy luan sau:
 * Trung Chau phai"). Xem design doc 2026-08-21-algorithm-zhongzhou-design.md muc 1 ve ly do
 * chon global constant thay vi field trong BuildChartInput, va muc 1.2 ve ranh gioi giua
 * quyet dinh nay (tang TINH TOAN, 1 trường phai duy nhat) va cach Rule Engine xu ly da
 * trường phai o tang LUAN GIAI (giu ca 2 qua conflict_group_id, khong chon phe).
 *
 * QUAN TRONG: astro.config() mutate 1 bien module-level NOI BO cua iztro, khong phai tham
 * so truyen theo tung lan goi bySolar/byLunar — goi 1 LAN o day, KHONG goi lai o bat ky
 * dau khac trong codebase (se lam thay doi ngam ket qua cua MOI lan build chart sau do).
 * MOI noi trong src/ va test/ can du lieu tu iztro PHAI goi qua callIztro()/buildChart(),
 * KHONG tu import { astro } roi goi bySolar/byLunar truc tiep — xem Task 3 cua plan nay.
 */
astro.config({ algorithm: 'zhongzhou' });

/** Gioi tinh cua du an -> gioi tinh cua iztro. */
function toIztroGender(gender: 'nam' | 'nu'): 'male' | 'female' {
  return gender === 'nam' ? 'male' : 'female';
}

/**
 * Goi iztro dung theo loai lich, tra ve astrolabe tho.
 *
 * File rieng (khong nam trong index.ts) de tranh phu thuoc vong:
 * ca index.ts va queries.ts deu can ham nay.
 *
 * Ngon ngu co dinh 'vi-VN'; fixLeap mac dinh true theo mac dinh cua iztro.
 */
export function callIztro(input: BuildChartInput): IFunctionalAstrolabe {
  const gender = toIztroGender(input.gender);
  if (input.calendar_type === 'duong_lich') {
    return astro.bySolar(input.date, input.time_index, gender, input.fix_leap ?? true, 'vi-VN');
  }
  if (input.calendar_type === 'am_lich') {
    return astro.byLunar(
      input.date,
      input.time_index,
      gender,
      input.is_leap_month ?? false,
      input.fix_leap ?? true,
      'vi-VN',
    );
  }
  throw new Error(
    `calendar_type "${(input as { calendar_type: unknown }).calendar_type}" khong hop le. Chi chap nhan "duong_lich" hoac "am_lich".`,
  );
}
```

- [ ] **Step 2: Thêm 4 entry sao mới vào `src/chart/star-id-map.ts`**

`zhongzhou` làm xuất hiện 4 tên sao chưa từng có trong `STAR_ID_BY_VI` khi build case Phạm Duy
(đã xác nhận bằng cách liệt kê toàn bộ tên sao thật, diff với bảng hiện có — không đoán): "Long
Đức" (tạp diệu, xuất hiện tại cung Dậu), "Đại Hao" (tạp diệu THẬT, KHÁC với nhãn `suiqian12`
cùng tên — xem cảnh báo bên dưới), "Kiếp Sát" (tạp diệu, tại cung Hợi), "Triệt Không" (thay thế
"Triệt Lộ" cũ trong 1 số trường hợp — 2 tên khác nhau cho cùng khái niệm Triệt vong tinh giữa 2
algorithm, KHÔNG xóa "Triệt Lộ" cũ, chỉ thêm mới).

**CẢNH BÁO quan trọng cho implementer — dễ nhầm:** "Đại Hao" xuất hiện ở 2 NGỮ CẢNH khác nhau
trong dữ liệu `iztro`: (1) là 1 `adjectiveStar` THẬT (đi qua `starIdFromVi`, cần entry trong
bảng này), và (2) là 1 GIÁ TRỊ STRING của field `suiqian12` (gán trực tiếp, KHÔNG đi qua bảng
tra — xem `adapter.ts` dòng 88 `suiqian: palace.suiqian12`). Đây là 2 khái niệm khác nhau trùng
tên — thêm entry `star_id` cho (1) không ảnh hưởng gì đến (2), không cần sửa gì thêm cho field
`suiqian`.

Trong `src/chart/star-id-map.ts`, thêm vào cuối nhóm "Tap tinh quan sat duoc trong la so Pham
Duy" (ngay sau dòng `'Phá Toái': 'PHA_TOAI',`):

```ts
  // Tap tinh THEM khi doi algorithm sang 'zhongzhou' (2026-08-21) — quan sat duoc khi
  // build lai case Pham Duy voi zhongzhou, truoc do khong xuat hien (default khong co).
  'Long Đức': 'LONG_DUC',
  'Đại Hao': 'DAI_HAO',
  'Kiếp Sát': 'KIEP_SAT',
  'Triệt Không': 'TRIET_KHONG',
```

- [ ] **Step 3: Cập nhật `notes` trong `src/chart/adapter.ts`**

Trong hàm `adaptFromIztro`, mảng `notes` hiện có (đọc file thật để xác nhận vị trí chính xác
trước khi sửa — plan này trích đúng nội dung hiện tại, không phải giả định):

```ts
const notes: string[] = [
  'Do sang giu nguyen thang 7 muc cua iztro (Mieu/Vuong/Dac/Loi/Binh/Bat/Han), khong rut ve 5 muc.',
  'Nap am lay tu lunar-typescript vi iztro khong cung cap.',
  'Tuan/Triet nam trong adjective_stars (TUAN_KHONG / TRIET_LO / KHONG_VONG), khong phai truong rieng.',
  'luu_nien CO CHU DICH khong nam trong Chart: no la du lieu theo nam duoc hoi, khong phai fact tinh cua la so. Dung astrolabe.horoscope(date) khi can.',
];
```

Sửa dòng thứ 3 (đổi `TRIET_LO` → `TRIET_KHONG`, vì `zhongzhou` cho ra "Triệt Không" chứ không
phải "Triệt Lộ" cho case Phạm Duy — KHÔNG xóa `TRIET_LO` khỏi bảng `star-id-map.ts` ở Step 2,
chỉ sửa comment liệt kê ở đây cho khớp giá trị THỰC TẾ xuất hiện với algorithm hiện tại), và
thêm 1 dòng mới về `algorithm`:

```ts
const notes: string[] = [
  'Do sang giu nguyen thang 7 muc cua iztro (Mieu/Vuong/Dac/Loi/Binh/Bat/Han), khong rut ve 5 muc.',
  'Nap am lay tu lunar-typescript vi iztro khong cung cap.',
  'Tuan/Triet nam trong adjective_stars (TUAN_KHONG / TRIET_KHONG / KHONG_VONG), khong phai truong rieng.',
  'luu_nien CO CHU DICH khong nam trong Chart: no la du lieu theo nam duoc hoi, khong phai fact tinh cua la so. Dung astrolabe.horoscope(date) khi can.',
  'algorithm: zhongzhou (Trung Chau phai) — cau hinh toan cuc tai iztro-client.ts, xem design doc 2026-08-21-algorithm-zhongzhou-design.md.',
];
```

- [ ] **Step 4: Xác nhận thủ công `algorithm` đã có hiệu lực**

Chạy lệnh sau, xác nhận output khớp CHÍNH XÁC (đã verify khi viết design doc):

```bash
node --import tsx -e "
import { callIztro } from './src/chart/iztro-client.ts';
const a = callIztro({ calendar_type: 'duong_lich', date: '1998-12-17', time_index: 12, gender: 'nam', fix_leap: true });
console.log(a.soul);
"
```

Expected output: `Lộc Tồn`

Nếu ra `Cự Môn` (giá trị của `default`), `astro.config()` chưa có hiệu lực — DỪNG, điều tra
trước khi tiếp tục (không phải lỗi test, là lỗi Step 1).

- [ ] **Step 5: Chạy toàn bộ test suite, xác nhận CHỈ còn đúng loại lỗi đã biết trước**

Run: `npm test`
Expected: phần lớn test PASS. Nếu vẫn còn lỗi `"Sao ... chua co trong bang tra star_id"` — quay
lại Step 2, có thể còn tên sao khác chưa được bổ sung (case build khác Phạm Duy, hoặc
`view_year` khác). KHÔNG tự ý thêm entry vào bảng tra mà không xác nhận đúng chính tả/nguồn —
đọc lỗi báo tên sao chính xác, xác nhận đó đúng là 1 sao thật (không phải lỗi transcribe), rồi
mới thêm.

Test còn lại dự kiến FAIL đúng 1 chỗ: `test/chart/pham-duy-crosscheck.test.ts` (assertion cũ
`soul_star` = `'Cự Môn'`) — đây là phạm vi của Task 4, KHÔNG sửa ở Task này.

- [ ] **Step 6: Commit**

```bash
git add src/chart/iztro-client.ts src/chart/star-id-map.ts src/chart/adapter.ts
git commit -m "feat: đổi algorithm mặc định iztro sang zhongzhou, bổ sung 4 sao mới"
```

---

### Task 2: Test khóa hành vi (runtime, không phải grep tĩnh)

**Files:**
- Create: `test/chart/algorithm-config.test.ts`

**Interfaces:**
- Consumes: `buildChart` (từ `src/chart/index.js`), `BuildChartInput` (từ `src/chart/types.js`).

**Lưu ý cho implementer:** Task này PHỤ THUỘC Task 1 đã merge (cần `algorithm` đã đổi để test
có ý nghĩa). Giá trị `PHAM_DUY_SOUL`/`OTHER_CASE_SOUL` trong code dưới đây ĐÃ được verify thật
khi viết design doc — dùng nguyên văn, không tự đoán/không tự chạy lại để "xác nhận cho chắc"
rồi đổi nếu ra khác (nếu ra khác khi bạn chạy test, đó là bug thật cần báo cáo, không phải sửa
test cho khớp).

- [ ] **Step 1: Viết `test/chart/algorithm-config.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

const OTHER_CASE: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1990-06-15',
  time_index: 6,
  gender: 'nu',
  fix_leap: true,
};

describe('algorithm: zhongzhou — global config nhat quan qua nhieu lan build', () => {
  it('build xen ke 2 case khac nhau nhieu lan, moi lan deu ra dung gia tri zhongzhou da biet truoc', () => {
    // Ca 2 gia tri ky vong DA duoc xac dinh truoc (chay astro.config({algorithm:'zhongzhou'})
    // + astro.bySolar() that luc viet design doc 2026-08-21-algorithm-zhongzhou-design.md,
    // KHONG suy ra tu ket qua cua chinh test nay) — day la diem lam guard nay THAT SU co y
    // nghia: neu global state vo tinh chay theo algorithm 'default', ca 4 assert duoi day se
    // FAIL ngay (Cu Mon != Loc Ton), khong co cach nao "tu trung khop" gia.
    const PHAM_DUY_SOUL = 'Lộc Tồn';
    const OTHER_CASE_SOUL = 'Phá Quân';

    const chart1 = buildChart(PHAM_DUY);
    expect(chart1.menh_than.soul_star).toBe(PHAM_DUY_SOUL);

    const chart2 = buildChart(OTHER_CASE);
    expect(chart2.menh_than.soul_star).toBe(OTHER_CASE_SOUL);

    // Build lai CA 2 case LAN NUA, dao thu tu — xac nhan ket qua GIONG HET lan dau, khong
    // bi "troi" theo thu tu goi hay so lan build truoc do (bat loi tich luy qua nhieu lan
    // goi, khac voi loi chi xuat hien o 1 lan build dau tien).
    const chart2Again = buildChart(OTHER_CASE);
    expect(chart2Again.menh_than.soul_star).toBe(OTHER_CASE_SOUL);
    const chart1Again = buildChart(PHAM_DUY);
    expect(chart1Again.menh_than.soul_star).toBe(PHAM_DUY_SOUL);
  });

  it('engine_meta.notes ghi ro dang dung algorithm zhongzhou', () => {
    const chart = buildChart(PHAM_DUY);
    expect(chart.engine_meta.notes.some((n) => n.includes('zhongzhou'))).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận pass**

Run: `npm test -- algorithm-config`
Expected: 2/2 tests PASS.

Nếu test đầu tiên FAIL ở dòng `expect(chart1.menh_than.soul_star).toBe(PHAM_DUY_SOUL)` — kiểm
tra lại Task 1 đã merge đúng chưa (Step 2 của Task 1 phải đã xác nhận thủ công trước đó).

- [ ] **Step 3: Commit**

```bash
git add test/chart/algorithm-config.test.ts
git commit -m "test: khóa hành vi runtime cho algorithm zhongzhou (global config nhất quán qua nhiều lần build)"
```

---

### Task 3: Sửa 3 file test bypass `iztro-client.ts` — đóng lỗ hổng thật đã phát hiện

**Files:**
- Modify: `test/chart/adapter.test.ts`
- Modify: `test/chart/iztro-smoke.test.ts`
- Modify: `test/llm/evidence-pack.test.ts`

**Bối cảnh (không bỏ qua — đây không phải dọn dẹp tùy chọn):** khi viết design doc, user yêu
cầu xem nguyên văn claim "không có đường nào khác gọi `astro.bySolar`/`astro.byLunar` bỏ qua
`iztro-client.ts`" — grep thật phát hiện claim đó SAI. 3 file test dưới đây tự
`import { astro } from 'iztro'` rồi gọi `astro.bySolar()`/`astro.byLunar()` trực tiếp, hoàn
toàn bỏ qua module `iztro-client.ts` (nơi Task 1 vừa thêm `astro.config()`). Vì `astro.config()`
mutate state module-level của chính thư viện `iztro` (không phải state riêng của
`iztro-client.ts`), việc các file này KHÔNG import `iztro-client.ts` không có nghĩa chúng chạy
với `algorithm` sai — MIỄN LÀ `iztro-client.ts` đã được import (side-effect `astro.config()` đã
chạy) TRƯỚC ĐÓ trong cùng tiến trình Vitest. Nhưng đây là sự phụ thuộc NGẦM vào thứ tự
import/chạy file mà Vitest KHÔNG đảm bảo — rủi ro thật: nếu 1 trong 3 file này được Vitest chạy
trong 1 tiến trình/worker chưa từng import bất kỳ module nào từ `src/chart/` (thứ tự chạy file
song song của Vitest không đảm bảo), nó sẽ chạy với `algorithm` MẶC ĐỊNH của `iztro` (không
phải `zhongzhou`) — lỗi "chạy lúc pass lúc fail tùy thứ tự" rất khó debug. Sửa để không còn phụ
thuộc ngầm này: gọi qua `callIztro()` (đã đảm bảo import `iztro-client.ts`, đảm bảo
`astro.config()` đã chạy).

**Interfaces:**
- Consumes: `callIztro(input: BuildChartInput): IFunctionalAstrolabe` (export từ
  `src/chart/iztro-client.js` hoặc `src/chart/index.js`).

- [ ] **Step 1: Sửa `test/chart/adapter.test.ts`**

Đổi import và 3 chỗ gọi `astro.bySolar()` trực tiếp:

```ts
// XOA dong nay:
import { astro } from 'iztro';
// THAY BANG:
import { callIztro } from '../../src/chart/iztro-client.js';
```

Đổi hàm `buildPhamDuy()` (dòng 14-17):
```ts
function buildPhamDuy() {
  const astrolabe = callIztro(PHAM_DUY_INPUT);
  return adaptFromIztro(astrolabe, PHAM_DUY_INPUT);
}
```

Đổi lời gọi trong `describe('adaptFromIztro — Luu Nien (view_year)', ...)` — khối
`it('dien Chart.luu_nien dung khi co view_year...')`. **[Đã verify thật trong scratch — code
dưới đây đã chạy pass thật, không phải suy đoán]** chỉ cần đổi phần khởi tạo `chart`, PHẦN
ASSERTION SAU ĐÓ GIỮ NGUYÊN Y HỆT (đọc file thật để xác nhận, không chép lại toàn bộ khối ở
đây — chỉ đoạn đầu thay đổi):

```ts
it('dien Chart.luu_nien dung khi co view_year, index khop astrolabe.palaces', () => {
  const inputWithYear: BuildChartInput = {
    calendar_type: 'duong_lich',
    date: '1998-12-17',
    time_index: 12,
    gender: 'nam',
    fix_leap: true,
    view_year: '2026-01-01',
  };
  const chart = adaptFromIztro(callIztro(inputWithYear), inputWithYear);
  // ... phan assertion phia sau (expect(chart.luu_nien)...) GIU NGUYEN Y HET, khong doi gi ...
});
```

- [ ] **Step 2: Sửa `test/chart/iztro-smoke.test.ts`**

Đổi import và 2 lời gọi:

```ts
import { describe, it, expect } from 'vitest';
import { callIztro } from '../../src/chart/iztro-client.js';

/**
 * Smoke test: xac nhan iztro cai dat dung va cho ra lá số Phạm Duy đã xác minh.
 * Input nay da duoc xac minh bang cach doi chieu chineseDate voi anh reference #1 (tuvi.vn).
 * timeIndex = 12 la GIO TY MUON (23:00-00:00), khop "23 gio 15 phut" trong anh.
 * KHONG dung timeIndex = 0 (gio Ty som 00:00-01:00) -> cho ra lá số khac han.
 */
describe('iztro smoke test', () => {
  it('tao duoc la so Pham Duy voi 4 tru khop reference #1', () => {
    const astrolabe = callIztro({
      calendar_type: 'duong_lich',
      date: '1998-12-17',
      time_index: 12,
      gender: 'nam',
      fix_leap: true,
    });

    expect(astrolabe.chineseDate).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(astrolabe.solarDate).toBe('1998-12-17');
    expect(astrolabe.timeRange).toBe('23:00~00:00');
    expect(astrolabe.fiveElementsClass).toBe('Thủy Nhị Cục');
    expect(astrolabe.earthlyBranchOfSoulPalace).toBe('Hợi');
    expect(astrolabe.earthlyBranchOfBodyPalace).toBe('Hợi');
    expect(astrolabe.palaces).toHaveLength(12);
  });

  it('lunar input tuong duong cho cung 4 tru', () => {
    const byLunar = callIztro({
      calendar_type: 'am_lich',
      date: '1998-10-30',
      time_index: 0,
      gender: 'nam',
      is_leap_month: false,
      fix_leap: true,
    });
    expect(byLunar.chineseDate).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
  });
});
```

Không có field nào trong 7 assertion của test này bị `algorithm` ảnh hưởng (đã xác nhận ở
design doc mục 0 — `algorithm` chỉ đổi `soul`/1 số `adjectiveStars`/1 nhãn `suiqian12`, không
đổi `chineseDate`/`solarDate`/`timeRange`/`fiveElementsClass`/`earthlyBranchOfSoulPalace`/
`earthlyBranchOfBodyPalace`/số lượng `palaces`) — KHÔNG cần sửa giá trị assertion nào ở file
này, chỉ đổi cách gọi.

- [ ] **Step 3: Sửa `test/llm/evidence-pack.test.ts`**

Đổi import và lời gọi trong `buildPhamDuyChartAndRules()`:

```ts
// XOA dong nay:
import { astro } from 'iztro';
// THAY BANG:
import { callIztro } from '../../src/chart/iztro-client.js';
```

```ts
function buildPhamDuyChartAndRules() {
  const astrolabe = callIztro(PHAM_DUY_INPUT);
  const chart = adaptFromIztro(astrolabe, PHAM_DUY_INPUT);
  // ... phan con lai cua ham giu nguyen khong doi ...
}
```

- [ ] **Step 4: Chạy toàn bộ 3 file test đã sửa, xác nhận pass**

Run: `npm test -- adapter iztro-smoke evidence-pack`
Expected: tất cả PASS, không có regression. Nếu bất kỳ test nào FAIL vì giá trị `soul_star`
khác trước (case này chỉ xảy ra nếu test có assertion cụ thể về `soul_star`/tạp diệu — kiểm
tra lại, phần lớn assertion trong 3 file này KHÔNG liên quan `soul`/`adjectiveStars` cụ thể),
đó là việc của Task 4, không tự sửa ở đây.

- [ ] **Step 5: Xác nhận không còn nơi nào khác bypass `iztro-client.ts`**

Chạy lại đúng lệnh grep đã dùng lúc viết design doc:

```bash
grep -rn "astro\.bySolar\|astro\.byLunar\|from 'iztro'\|from \"iztro\"" src/ test/ --include="*.ts"
```

Expected: CHỈ còn `src/chart/iztro-client.ts` (3 dòng: import, 2 lời gọi trong `callIztro`).
Không còn dòng nào khác trong `test/`. Nếu vẫn còn, quay lại sửa file đó trước khi commit.

- [ ] **Step 6: Commit**

```bash
git add test/chart/adapter.test.ts test/chart/iztro-smoke.test.ts test/llm/evidence-pack.test.ts
git commit -m "fix: 3 file test không còn bypass iztro-client.ts, tránh phụ thuộc ngầm thứ tự chạy Vitest"
```

---

### Task 4: Sửa assertion đã lỗi thời trong `pham-duy-crosscheck.test.ts` + rà soát toàn suite

**[Đã verify thật trong scratch]** Sau khi Task 1-3 hoàn tất, chạy toàn bộ suite chỉ còn ĐÚNG 1
test FAIL: `test/chart/pham-duy-crosscheck.test.ts`, khối `describe('BUOC 2 — assertion cuoi
cung theo ket qua phan loai', ...)`, test có tên bắt đầu `'chu menh: iztro cho Cu Mon...'`. Đây
KHÔNG PHẢI chỉ 1 giá trị literal cần đổi — toàn bộ đoạn comment giải thích phía trên test này
(15+ dòng) viết CHO QUYẾT ĐỊNH CŨ ("KHÔNG đổi `algorithm` sang `zhongzhou` trong code sản
phẩm") — quyết định đó đã bị đảo ngược ở phase này, nên comment cũ giờ nói NGƯỢC với thực tế
codebase, phải viết lại toàn bộ, không chỉ đổi 1 string.

**Files:**
- Modify: `test/chart/pham-duy-crosscheck.test.ts`
- Rà thêm (Step 3 dưới đây) để không bỏ sót — dù verify trong scratch chỉ thấy đúng 1 file, đây
  là bằng chứng thực nghiệm CHO 1 lần chạy, không phải chứng minh hình thức "không còn file
  nào khác" — vẫn cần tự grep xác nhận lại, không tin suông kết quả của phiên verify trước.

**Interfaces:** không có interface mới — chỉ sửa nội dung test + comment.

- [ ] **Step 1: Đọc toàn bộ khối comment + test cần sửa**

Đọc từ dòng có `// NHOM 2 — khac truong phai hop le...` tới hết khối `it(...)` chứa
`expect(chart.menh_than.soul_star).toBe('Cự Môn')` trong `test/chart/pham-duy-crosscheck.test.ts`
— xác nhận đúng nội dung hiện tại trước khi sửa (không giả định plan này trích đúng 100%, file
thật có thể đã đổi nhẹ giữa lúc viết plan và lúc thực thi).

- [ ] **Step 2: Viết lại toàn bộ khối — comment lẫn test**

Thay TOÀN BỘ đoạn từ `// NHOM 2 — khac truong phai hop le...` tới hết khối `it(...)` bằng:

```ts
  // [CAP NHAT 2026-08-21] Doan comment + test duoi day TRUOC KIA giai thich vi sao du
  // an GIU `algorithm: 'default'` (Cu Mon) thay vi doi sang 'zhongzhou' (Loc Ton, khop
  // reference #1) — quyet dinh do da DAO NGUOC, xem design doc
  // 2026-08-21-algorithm-zhongzhou-design.md. Sau khi dieu tra lai TREN TOAN BO 12 cung
  // (khong chi field soul nay), zhongzhou khop reference #1 nhieu hon o >=5 diem, khong
  // kem o diem nao — du an gio DUNG zhongzhou lam mac dinh toan cuc (astro.config() tai
  // src/chart/iztro-client.ts). Vi vay day KHONG CON la 1 diem "khac truong phai giu
  // nguyen ca 2" nua — chart.menh_than.soul_star gio PHAI khop dung reference #1.
  it('chu menh: sau khi doi algorithm sang zhongzhou (Trung Chau phai), iztro khop dung Loc Ton nhu reference #1', () => {
    expect(chart.menh_than.soul_star).toBe('Lộc Tồn');
  });
});
```

Giữ nguyên dấu `});` đóng `describe` ở cuối (đã có trong khối gốc, không phải thêm mới).

- [ ] **Step 3: Rà lại toàn bộ suite tìm assertion khác còn sót (không tin suông kết quả scratch)**

```bash
grep -rln "soul_star\|Cự Môn\|Lộc Tồn\|adjective_stars\|suiqian\|Triệt Lộ\|Đại Hao" test/ --include="*.ts"
```

Với MỖI file trong kết quả, đọc context, xác định có assertion CỤ THỂ nào (VD
`.toBe('Cự Môn')`) khác với test đã sửa ở Step 2 không. Nếu có, lấy giá trị mới bằng cách chạy
code thật (KHÔNG đoán):

```bash
node --import tsx -e "
import { buildChart } from './src/chart/index.ts';
const chart = buildChart({ /* input giống hệt test cần sửa */ });
console.log(chart.menh_than.soul_star); // hoặc field khác cần kiểm tra
"
```

Sửa với giá trị CỤ THỂ mới — KHÔNG nới lỏng thành `toBeDefined()`/`toBeTruthy()`.

- [ ] **Step 4: Chạy toàn bộ test suite**

Run: `npm test`
Expected: 100% PASS (165/165 nếu không phát hiện thêm assertion nào ở Step 3; nếu có sửa
thêm, số có thể khác — ghi lại số thật để đối chiếu ở Task 5).

- [ ] **Step 5: Chạy typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add test/
git commit -m "fix: cập nhật assertion test theo giá trị thật của algorithm zhongzhou"
```

(Nếu Step 3 không tìm thấy assertion nào khác cần sửa ngoài Step 2, ghi rõ
trong báo cáo "không có assertion nào khác cần sửa, đã grep xác nhận" — không bỏ qua bước grep
chỉ vì "chắc là không có gì".)

---

### Task 5: Cập nhật design doc gốc — đóng Known Issues đã lỗi thời

**Files:**
- Modify: `docs/superpowers/specs/2026-08-16-chart-engine-design.md`

**Interfaces:** không có — chỉ sửa nội dung tài liệu.

- [ ] **Step 1: Đọc mục 7 hiện tại của `2026-08-16-chart-engine-design.md`**

Đọc toàn bộ mục "7. Cross-check & phân loại khi lệch với reference #1" để biết chính xác cấu
trúc/văn phong hiện có trước khi sửa.

- [ ] **Step 2: Cập nhật bảng phân loại**

Thêm 1 đoạn mới ngay sau tiêu đề mục 7 (không xóa nội dung gốc — đây là lịch sử quyết định,
giữ nguyên, chỉ bổ sung cập nhật):

```markdown
**[CẬP NHẬT 2026-08-21]** Sau khi đổi `algorithm` mặc định sang `'zhongzhou'` (xem
`docs/superpowers/specs/2026-08-21-algorithm-zhongzhou-design.md`), 5 điểm lệch dưới đây
**không còn là "khác trường phái hợp lệ"** — đã khớp reference #1:
- Chủ mệnh (`soul`): Cự Môn → **Lộc Tồn**, khớp ref.
- Hợi: **thêm Kiếp Sát** (trước thiếu).
- Dậu: **thêm Long Đức** (trước thiếu).
- Thân: nhãn `suiqian12` Đại Hao → **Tuế Phá**, khớp ref.
- Sửu: "Không Vong" (trước dư thừa so với ref) → không còn xuất hiện.

2 nhóm lệch còn tồn tại thật, KHÔNG do quyết định `algorithm` này, vẫn giữ nguyên trạng thái
Known Issue:
1. Thiên Khôi (Sửu vs ref: Hợi) — công thức khác tầng, độc lập `algorithm` (đã xác nhận đọc
   thẳng source `getKuiYueIndex()` trong `iztro`).
2. Độ sáng chính tinh (thang 7 mức `iztro` vs 5 mức chú thích ảnh gốc) — không có phép quy đổi
   trung lập, giữ nguyên nhóm 2 (khác trường phái/quy ước hiển thị hợp lệ).
```

- [ ] **Step 3: Rà lại toàn văn mục 6-7 xem còn chỗ nào ghi giá trị cũ (theo `default`) mà
không đánh dấu là đã lỗi thời**

Đọc kỹ, nếu có bảng/câu văn nào khác trong mục 6 hoặc 7 còn ghi giá trị theo `algorithm:
'default'` mà chưa được đoạn cập nhật ở Step 2 bao phủ, thêm ghi chú tương tự tại chỗ đó (không
tự ý xóa/sửa giá trị gốc — chỉ thêm ghi chú "giá trị này theo algorithm cũ, xem cập nhật 2026-
08-21").

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-16-chart-engine-design.md
git commit -m "docs: cập nhật mục 7 chart-engine-design — đóng Known Issues đã khớp sau khi đổi algorithm sang zhongzhou"
```

---

## Tổng kết Tasks

1. Đổi `algorithm` sang `zhongzhou` tại `iztro-client.ts` (module-level, hằng số toàn cục)
2. Test khóa hành vi runtime (build xen kẽ 2 case, giá trị cụ thể biết trước)
3. Sửa 3 file test bypass `iztro-client.ts` — đóng lỗ hổng phụ thuộc ngầm thứ tự chạy Vitest
4. Rà và cập nhật toàn bộ assertion test bị `algorithm` ảnh hưởng
5. Cập nhật design doc gốc — đóng Known Issues đã lỗi thời

Sau Task 5: final whole-branch review (đọc lại toàn bộ diff qua cả 5 task, xác nhận tính nhất
quán xuyên suốt — đặc biệt xác nhận Task 3+4 không bỏ sót assertion nào), rồi hỏi push-vs-keep-
local theo đúng pattern đã dùng ở mọi phase trước trong dự án này. KHÔNG động vào mockup UI ở
phase này (đúng design doc mục 6 "Ngoài phạm vi").
