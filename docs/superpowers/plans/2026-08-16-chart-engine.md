# Chart Engine (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây Chart Engine deterministic: nhận ngày sinh (âm hoặc dương lịch), gọi `iztro`, trả về object `Chart` theo Chart Data Shape v0.1, có test tự động đối chiếu 12 cung với reference implementation #1 (tuvi.vn).

**Architecture:** Một lớp adapter mỏng bọc quanh `iztro` — `iztro` giữ toàn bộ thuật toán an sao (không tự viết lại), adapter chỉ transform sang schema của dự án. Truy vấn quan hệ cung (tam phương tứ chính, đối cung) uỷ quyền cho `surroundedPalaces()` của `iztro`. Nạp âm lấy từ `lunar-typescript` vì `iztro` không cung cấp.

**Tech Stack:** Node.js 22 + TypeScript (ESM) · `iztro@2.6.0` (MIT) · `lunar-typescript@1.8.6` (MIT) · Vitest

## Global Constraints

- **Không tự viết lại thuật toán an sao / bảng tam hợp / xung chiếu / tứ hóa.** Gọi hàm có sẵn của `iztro` (build spec mục 7).
- **Không sửa code hay đổi config `iztro` để ép khớp tuvi.vn.** Mọi điểm lệch phải phân loại theo quy trình 3 nhánh (bug / khác trường phái / chưa xác định) ở mục 7 design doc trước khi quyết định. Chỉ nhánh "bug thật" được sửa cho khớp.
- **KHÔNG làm UI/UX/CSS.** Không component, không CSS framework, không layout. Debug bằng `console.log`/JSON thuần (build spec mục 14).
- **Không mở rộng ngoài phạm vi:** không Rule Engine, không Conflict Resolver, không LLM, không vector DB (build spec mục 13).
- `star_id` dùng mã chuẩn hoá ASCII in hoa (`THIEN_DONG`), không dùng chuỗi tiếng Việt có dấu làm khoá.
- Ngôn ngữ output `iztro` cố định `'vi-VN'`.
- Mọi giá trị enum lấy từ `iztro` giữ **nguyên vẹn**, không map giảm mức (xem Task 2, quyết định về thang độ sáng 7 mức).

## Dữ liệu đã xác minh trước khi lập plan (không phải giả định)

Đã cài `iztro@2.6.0` thật và chạy thử. Các sự kiện dưới đây là **kết quả chạy thật**, dùng làm căn cứ cho plan:

**Input đúng cho case Phạm Duy** (`chineseDate` trùng khít 4 trụ trong ảnh reference #1):
```
astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN')
  → chineseDate: "Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý"   ✓ khớp ảnh
  → time: "Giờ tý muộn", timeRange: "23:00~00:00"          ✓ khớp "23 giờ 15 phút" trong ảnh
  → solarDate: "1998-12-17", lunarDate: "一九九八年十月廿九"
```
`timeIndex = 12` là **giờ Tý muộn (23:00–00:00)**, KHÁC `timeIndex = 0` là giờ Tý sớm (00:00–01:00). Dùng nhầm 0 cho ra lá số hoàn toàn khác.

Input tương đương qua âm lịch: `astro.byLunar('1998-10-30', 0, 'male', false, true, 'vi-VN')` → cùng `chineseDate`, cùng 12 cung, nhưng `solarDate` là `1998-12-18`.

**Ngày trong build spec mục 6 ("17/10 Kỷ Hợi âm lịch") là SAI** — cho ra lá số khác hẳn. Xem Known Issues trong design doc.

**Shape thật của `iztro` (đã đọc file `.d.ts` và dump runtime):**

| Đối tượng | Field |
|---|---|
| `Astrolabe` | `gender, solarDate, lunarDate, chineseDate, rawDates{lunarDate,chineseDate}, time, timeRange, sign, zodiac, earthlyBranchOfSoulPalace, earthlyBranchOfBodyPalace, soul, body, fiveElementsClass, palaces[], copyright` |
| `Palace` | `index, name, isBodyPalace, isOriginalPalace, heavenlyStem, earthlyBranch, majorStars[], minorStars[], adjectiveStars[], changsheng12, boshi12, jiangqian12, suiqian12, decadal{range,heavenlyStem,earthlyBranch}, ages[]` |
| `Star` | `name, type, scope, brightness?, mutagen?` |

**Giá trị enum thật (vi-VN):**
- `brightness`: `Miếu` `Vượng` `Đắc` `Lợi` `Bình` `Bất` `Hạn` — **7 mức**
- `mutagen`: `Lộc` `Quyền` `Khoa` `Kỵ`
- `fiveElementsClass`: `Thủy Nhị Cục` `Mộc Tam Cục` `Kim Tứ Cục` `Thổ Ngũ Cục` `Hỏa Lục Cục` — chuỗi gộp, cần parse
- `astrolabe.palaces[i].name` gồm `Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Nữ, Phu Thê, Huynh Đệ` (lưu ý: `iztro` dùng **Tử Nữ**, ảnh tuvi.vn dùng **Tử Tức**)

**Những gì `iztro` KHÔNG có:** nạp âm bản mệnh (`ban_menh_nap_am`). Lấy từ `lunar-typescript`: `Solar.fromYmd(1998,12,17).getLunar().getYearNaYin()` → `"城头土"` (= Thành Đầu Thổ, khớp ảnh).

**Tuần/Triệt:** có trong `adjectiveStars` — chạy thật thấy `Triệt Lộ` @ Tý, `Tuần Không` @ Thân, `Không Vong` @ Sửu.

**Kết quả cross-check sơ bộ (bySolar 1998-12-17 tIdx=12) vs reference #1:**
- Vị trí 12 cung: **khớp 100%**
- Vị trí chính tinh từng cung: **khớp 100%**
- Tứ hóa bản mệnh: Tham Lang[Lộc]@Dần, Thiên Cơ[Kỵ]@Mão, Thái Âm[Quyền]@Sửu, Hữu Bật[Khoa]@Sửu — **khớp đúng bảng Can Mậu** trong build spec mục 3
- Độ sáng: **lệch nhiều sao** (vd Thiên Đồng@Mệnh: `iztro`=Miếu, ảnh=Đắc) → nghi khác bảng độ sáng theo trường phái
- `soul` (chủ mệnh): `iztro`=**Cự Môn**, ảnh=**Lộc Tồn** → lệch, cần phân loại
- `body` (chủ thân): cả hai = **Thiên Lương** ✓

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `package.json`, `tsconfig.json`, `vitest.config.ts` | Cấu hình project |
| `src/chart/types.ts` | Định nghĩa Chart Data Shape v0.1 (chỉ type, không logic) |
| `src/chart/star-id-map.ts` | Bảng tra `star_id` chuẩn hoá ↔ tên tiếng Việt của `iztro` |
| `src/chart/nap-am.ts` | Lấy nạp âm từ `lunar-typescript` + bảng tra tên Việt |
| `src/chart/adapter.ts` | Transform `Astrolabe` của `iztro` → `Chart` |
| `src/chart/iztro-client.ts` | Gọi `iztro` đúng theo loại lịch (tách riêng để tránh phụ thuộc vòng) |
| `src/chart/queries.ts` | Truy vấn trên `Chart` đã build: `palaceOfBranch`, `palaceOfName`, `starsIn`, `relatedPalaces` |
| `src/chart/index.ts` | Public API `buildChart(input)` |
| `test/chart/fixtures/pham-duy.ts` | Transcript reference #1 (tuvi.vn) dạng dữ liệu |
| `test/chart/*.test.ts` | Test theo từng task |
| `scripts/crosscheck-report.ts` | Công cụ chẩn đoán in danh sách điểm lệch (không phải test) |
| `docs/superpowers/reports/2026-08-16-cross-check-pham-duy.md` | Báo cáo phân loại điểm lệch (Task 7) |

---

### Task 1: Scaffold project + smoke test `iztro`

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- Test: `test/chart/iztro-smoke.test.ts`

**Interfaces:**
- Consumes: (không có — task đầu tiên)
- Produces: môi trường chạy `vitest`; xác nhận `iztro` cài đúng và cho ra lá số Phạm Duy đã xác minh.

- [ ] **Step 1: Khởi tạo package.json**

```bash
cd "d:/8. AI/tuvi_AI"
npm init -y
npm pkg set type="module"
npm pkg set name="tuvi-chart-engine"
npm pkg set version="0.1.0"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch="vitest"
npm pkg set scripts.typecheck="tsc --noEmit"
```

- [ ] **Step 2: Cài dependencies**

```bash
npm install iztro@2.6.0 lunar-typescript@1.8.6
npm install -D typescript@^5.6.0 vitest@^2.1.0 @types/node@^22.0.0
```

- [ ] **Step 3: Tạo tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 4: Tạo vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 5: Tạo .gitignore**

```
node_modules/
dist/
*.log
```

- [ ] **Step 6: Viết smoke test (sẽ fail vì chưa cài xong / chưa chạy)**

Tạo `test/chart/iztro-smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { astro } from 'iztro';

/**
 * Smoke test: xac nhan iztro cai dat dung va cho ra lá số Phạm Duy đã xác minh.
 * Input nay da duoc xac minh bang cach doi chieu chineseDate voi anh reference #1 (tuvi.vn).
 * timeIndex = 12 la GIO TY MUON (23:00-00:00), khop "23 gio 15 phut" trong anh.
 * KHONG dung timeIndex = 0 (gio Ty som 00:00-01:00) -> cho ra lá số khac han.
 */
describe('iztro smoke test', () => {
  it('tao duoc la so Pham Duy voi 4 tru khop reference #1', () => {
    const astrolabe = astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN');

    expect(astrolabe.chineseDate).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(astrolabe.solarDate).toBe('1998-12-17');
    expect(astrolabe.timeRange).toBe('23:00~00:00');
    expect(astrolabe.fiveElementsClass).toBe('Thủy Nhị Cục');
    expect(astrolabe.earthlyBranchOfSoulPalace).toBe('Hợi');
    expect(astrolabe.earthlyBranchOfBodyPalace).toBe('Hợi');
    expect(astrolabe.palaces).toHaveLength(12);
  });

  it('lunar input tuong duong cho cung 4 tru', () => {
    const byLunar = astro.byLunar('1998-10-30', 0, 'male', false, true, 'vi-VN');
    expect(byLunar.chineseDate).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
  });
});
```

- [ ] **Step 7: Chạy test để xác nhận PASS**

Run: `npm test`
Expected: 2 test PASS. Nếu FAIL — dừng lại, không sửa assertion cho khớp; điều tra vì sao `iztro` cho kết quả khác dữ liệu đã xác minh (có thể do version khác).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore test/chart/iztro-smoke.test.ts
git commit -m "chore: scaffold TS project + iztro smoke test on verified Pham Duy input"
```

---

### Task 2: Chart Data Shape v0.1 types

**Files:**
- Create: `src/chart/types.ts`
- Test: `test/chart/types.test.ts`

**Interfaces:**
- Consumes: (không phụ thuộc task trước ngoài môi trường build)
- Produces:
  - `type Branch = 'Ty'|'Suu'|'Dan'|'Mao'|'Thin'|'Ty2'|'Ngo'|'Mui'|'Than'|'Dau'|'Tuat'|'Hoi'`
  - `type Brightness = 'mieu'|'vuong'|'dac'|'loi'|'binh'|'bat'|'ham'`
  - `type SihuaType = 'Loc'|'Quyen'|'Khoa'|'Ky'`
  - `type NguHanh = 'Kim'|'Moc'|'Thuy'|'Hoa'|'Tho'`
  - `interface Chart`, `interface ChartPalace`, `interface MajorStar`, `interface MinorStar`, `interface Sihua`, `interface LuckCycles`, `interface DaiVan`
  - `type BuildChartInput`

**Quyết định thiết kế cần tuân thủ:** `Brightness` có **7 giá trị** khớp đúng 7 mức của `iztro`, KHÔNG rút về 5 mức như bản nháp Chart Data Shape v0.1. Rút xuống 5 sẽ phải map `Lợi`→? và `Bất`→?, tức là ép chuẩn hoá mất thông tin và tự chọn một cách quy đổi không có căn cứ — trái nguyên tắc mục 7 design doc. Ghi rõ lý do trong comment.

- [ ] **Step 1: Viết test cho type (compile-time + runtime guard)**

Tạo `test/chart/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BRANCHES, BRIGHTNESS_VALUES, isBranch } from '../../src/chart/types.js';

describe('Chart types', () => {
  it('co du 12 dia chi, dung thu tu chuan', () => {
    expect(BRANCHES).toEqual([
      'Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Ty2',
      'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi',
    ]);
  });

  it('co du 7 muc do sang khop iztro (khong rut ve 5)', () => {
    expect(BRIGHTNESS_VALUES).toEqual([
      'mieu', 'vuong', 'dac', 'loi', 'binh', 'bat', 'ham',
    ]);
  });

  it('isBranch nhan dung va tu choi sai', () => {
    expect(isBranch('Hoi')).toBe(true);
    expect(isBranch('Ty2')).toBe(true);
    expect(isBranch('Hợi')).toBe(false);
    expect(isBranch('XX')).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- types`
Expected: FAIL — `Failed to resolve import "../../src/chart/types.js"`

- [ ] **Step 3: Viết `src/chart/types.ts`**

```ts
/**
 * Chart Data Shape v0.1
 * Theo build spec muc 3. Chi dinh nghia type, khong chua logic.
 */

/** 12 dia chi. `Ty2` = cung Ty (巳), phan biet voi `Ty` = cung Ty (子). */
export const BRANCHES = [
  'Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Ty2',
  'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi',
] as const;

export type Branch = (typeof BRANCHES)[number];

export function isBranch(value: string): value is Branch {
  return (BRANCHES as readonly string[]).includes(value);
}

/**
 * Do sang sao — 7 muc, khop DUNG thang cua iztro (Mieu/Vuong/Dac/Loi/Binh/Bat/Han).
 *
 * LUU Y CO CHU DICH: ban nhap Chart Data Shape v0.1 trong build spec chi liet ke 5 muc
 * (mieu/vuong/dac/binh/ham). Ta KHONG rut 7 -> 5, vi phai tu bia cach quy doi cho
 * `Loi` va `Bat` (khong co tuong duong trong thang 5 muc) — do la ep chuan hoa lam mat
 * thong tin va tu chon mot truong phai, trai nguyen tac muc 7 design doc.
 */
export const BRIGHTNESS_VALUES = [
  'mieu', 'vuong', 'dac', 'loi', 'binh', 'bat', 'ham',
] as const;

export type Brightness = (typeof BRIGHTNESS_VALUES)[number];

export type SihuaType = 'Loc' | 'Quyen' | 'Khoa' | 'Ky';

/** Nguon sinh ra tu hoa. v0.1 chi co `ban_menh`; dai_van/luu_nien de danh cho ban sau. */
export type SihuaSource = 'ban_menh' | 'dai_van' | 'luu_nien';

export type NguHanh = 'Kim' | 'Moc' | 'Thuy' | 'Hoa' | 'Tho';

export type Gender = 'nam' | 'nu';

export type CalendarType = 'duong_lich' | 'am_lich';

export interface MajorStar {
  star_id: string;
  /** `undefined` khi iztro khong cung cap do sang cho sao do. */
  strength?: Brightness;
}

export interface MinorStar {
  star_id: string;
  strength?: Brightness;
}

/** Tap tinh / sao le — iztro tra trong `adjectiveStars`. */
export interface AdjectiveStar {
  star_id: string;
}

export interface Sihua {
  star_id: string;
  type: SihuaType;
  source: SihuaSource;
}

export interface ChartPalace {
  branch: Branch;
  /** Ten cung theo iztro, giu nguyen tieng Viet co dau (vd "Menh", "Tu Nu"). */
  palace_name: string;
  palace_stem: string;
  is_body_palace: boolean;
  /** Cung lai nhan (iztro: isOriginalPalace). */
  is_original_palace: boolean;
  major_stars: MajorStar[];
  minor_stars: MinorStar[];
  adjective_stars: AdjectiveStar[];
  sihua: Sihua[];
}

export interface DaiVan {
  age_from: number;
  age_to: number;
  branch: Branch;
  stem: string;
  palace_name: string;
}

/** Tieu van: cac tuoi (am lich) ung voi tung cung. iztro tra trong `palace.ages`. */
export interface TieuVan {
  branch: Branch;
  ages: number[];
}

/**
 * Luu ý về `luu_nien`:
 *
 * Chart Data Shape v0.1 (build spec muc 3) liet ke `luu_nien` trong `luck_cycles`.
 * Nhung luu nien la du lieu THEO NAM DUOC HOI (vd "nam Binh Ngo 2026"), khong phai
 * du lieu tinh cua la so — cung 1 la so co vo han luu nien tuy nam tra cuu.
 * Nhet no vao Chart tinh se buoc Chart phai gan voi 1 nam cu the, lam hong tinh chat
 * "Chart = fact tinh cua nguoi do" (build spec muc 3 phan biet per-chart data vs
 * derived fields).
 *
 * Quyet dinh v0.1: KHONG dua `luu_nien` vao `Chart`. `iztro` da co san
 * `astrolabe.horoscope(date)` va `astrolabe.yearlyList(index)` de tra cuu khi can.
 * Ghi ro quyet dinh nay trong `engine_meta.notes` de khong bi hieu nham la bo sot.
 */
export interface LuckCycles {
  dai_van: DaiVan[];
  tieu_van: TieuVan[];
}

export interface ChartMetadata {
  birth_solar_date: string;
  birth_lunar_date: string;
  /** 4 tru: "Mau Dan - Quy Hoi - Ky Hoi - Giap Ty". */
  chinese_date: string;
  time_label: string;
  time_range: string;
  gender: Gender;
  calendar_type: CalendarType;
  year_can_chi: string;
}

export interface MenhThan {
  menh_branch: Branch;
  than_branch: Branch;
  same_palace: boolean;
  /** Chu menh (iztro: soul). */
  soul_star: string;
  /** Chu than (iztro: body). */
  body_star: string;
}

export interface Cuc {
  ngu_hanh: NguHanh;
  cuc_so: 2 | 3 | 4 | 5 | 6;
  /** Chuoi goc tu iztro, vd "Thuy Nhi Cuc" — giu de truy nguon. */
  raw: string;
}

export interface EngineMeta {
  engine: string;
  engine_version: string;
  language: string;
  /**
   * Ghi chu ve gioi han/khac biet da biet cua ban dung nay.
   * KHONG de trong khi co field khong map duoc — phai ghi ro (design doc muc 6).
   */
  notes: string[];
}

export interface Chart {
  chart_id: string;
  metadata: ChartMetadata;
  menh_than: MenhThan;
  cuc: Cuc;
  /** Nap am ban menh. `iztro` khong cung cap — lay tu lunar-typescript. */
  ban_menh_nap_am: string;
  palaces: ChartPalace[];
  luck_cycles: LuckCycles;
  engine_meta: EngineMeta;
}

export type BuildChartInput =
  | {
      calendar_type: 'duong_lich';
      /** YYYY-M-D duong lich. */
      date: string;
      /** 0..12. 0 = gio Ty som (00:00-01:00), 12 = gio Ty muon (23:00-00:00). */
      time_index: number;
      gender: Gender;
      fix_leap?: boolean;
    }
  | {
      calendar_type: 'am_lich';
      /** YYYY-M-D am lich. */
      date: string;
      time_index: number;
      gender: Gender;
      is_leap_month?: boolean;
      fix_leap?: boolean;
    };
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- types`
Expected: 3 test PASS

- [ ] **Step 5: Chạy typecheck**

Run: `npm run typecheck`
Expected: không lỗi

- [ ] **Step 6: Commit**

```bash
git add src/chart/types.ts test/chart/types.test.ts
git commit -m "feat: add Chart Data Shape v0.1 types with 7-level brightness scale"
```

---

### Task 3: Bảng tra `star_id` + độ sáng + tứ hóa

**Files:**
- Create: `src/chart/star-id-map.ts`
- Test: `test/chart/star-id-map.test.ts`

**Interfaces:**
- Consumes: `Brightness`, `SihuaType` từ `src/chart/types.ts`
- Produces:
  - `starIdFromVi(viName: string): string` — `"Thiên Đồng"` → `"THIEN_DONG"`
  - `brightnessFromVi(viName: string | undefined): Brightness | undefined`
  - `sihuaTypeFromVi(viName: string): SihuaType`
  - `branchFromVi(viName: string): Branch`

**Nguyên tắc:** bảng tra chỉ chứa các giá trị **đã quan sát thật** trong output `iztro` cho case Phạm Duy, cộng các giá trị enum đầy đủ của `brightness`/`mutagen`/`branch` (vì đã đọc trực tiếp file locale của `iztro`, không phải đoán). Sao nào chưa gặp thì hàm ném lỗi rõ ràng thay vì đoán bừa — để lỗi lộ ra sớm chứ không âm thầm sinh `star_id` sai.

- [ ] **Step 1: Viết test**

Tạo `test/chart/star-id-map.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  starIdFromVi,
  brightnessFromVi,
  sihuaTypeFromVi,
  branchFromVi,
} from '../../src/chart/star-id-map.js';

describe('star-id-map', () => {
  it('map ten sao tieng Viet sang star_id chuan hoa', () => {
    expect(starIdFromVi('Thiên Đồng')).toBe('THIEN_DONG');
    expect(starIdFromVi('Địa Không')).toBe('DIA_KHONG');
    expect(starIdFromVi('Địa Kiếp')).toBe('DIA_KIEP');
    expect(starIdFromVi('Tử Vi')).toBe('TU_VI');
    expect(starIdFromVi('Thái Âm')).toBe('THAI_AM');
  });

  it('nem loi ro rang khi gap sao chua co trong bang tra', () => {
    expect(() => starIdFromVi('Sao Bịa Đặt')).toThrowError(
      /chua co trong bang tra star_id/i,
    );
  });

  it('map du 7 muc do sang cua iztro', () => {
    expect(brightnessFromVi('Miếu')).toBe('mieu');
    expect(brightnessFromVi('Vượng')).toBe('vuong');
    expect(brightnessFromVi('Đắc')).toBe('dac');
    expect(brightnessFromVi('Lợi')).toBe('loi');
    expect(brightnessFromVi('Bình')).toBe('binh');
    expect(brightnessFromVi('Bất')).toBe('bat');
    expect(brightnessFromVi('Hạn')).toBe('ham');
  });

  it('do sang rong/undefined tra ve undefined', () => {
    expect(brightnessFromVi(undefined)).toBeUndefined();
    expect(brightnessFromVi('')).toBeUndefined();
  });

  it('map tu hoa', () => {
    expect(sihuaTypeFromVi('Lộc')).toBe('Loc');
    expect(sihuaTypeFromVi('Quyền')).toBe('Quyen');
    expect(sihuaTypeFromVi('Khoa')).toBe('Khoa');
    expect(sihuaTypeFromVi('Kỵ')).toBe('Ky');
  });

  it('map 12 dia chi, phan biet Ty (Tý) va Ty2 (Tỵ)', () => {
    expect(branchFromVi('Tý')).toBe('Ty');
    expect(branchFromVi('Tỵ')).toBe('Ty2');
    expect(branchFromVi('Hợi')).toBe('Hoi');
    expect(branchFromVi('Sửu')).toBe('Suu');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- star-id-map`
Expected: FAIL — không resolve được import

- [ ] **Step 3: Viết `src/chart/star-id-map.ts`**

```ts
import type { Branch, Brightness, SihuaType } from './types.js';

/**
 * Bang tra ten sao tieng Viet (iztro tra ve) -> star_id chuan hoa.
 *
 * Chi liet ke cac sao DA QUAN SAT THAT trong output iztro cho case Pham Duy
 * (YAGNI co chu dich, design doc muc 5). Gap sao la -> nem loi, KHONG tu doan
 * cach chuyen tu co dau sang khong dau, de lech chinh ta khong am tham lot qua.
 */
const STAR_ID_BY_VI: Readonly<Record<string, string>> = {
  // Chinh tinh (14)
  'Tử Vi': 'TU_VI',
  'Thiên Cơ': 'THIEN_CO',
  'Thái Dương': 'THAI_DUONG',
  'Vũ Khúc': 'VU_KHUC',
  'Thiên Đồng': 'THIEN_DONG',
  'Liêm Trinh': 'LIEM_TRINH',
  'Thiên Phủ': 'THIEN_PHU',
  'Thái Âm': 'THAI_AM',
  'Tham Lang': 'THAM_LANG',
  'Cự Môn': 'CU_MON',
  'Thiên Tướng': 'THIEN_TUONG',
  'Thiên Lương': 'THIEN_LUONG',
  'Thất Sát': 'THAT_SAT',
  'Phá Quân': 'PHA_QUAN',

  // Phu tinh
  'Tả Phù': 'TA_PHU',
  'Hữu Bật': 'HUU_BAT',
  'Văn Xương': 'VAN_XUONG',
  'Văn Khúc': 'VAN_KHUC',
  'Thiên Khôi': 'THIEN_KHOI',
  'Thiên Việt': 'THIEN_VIET',
  'Lộc Tồn': 'LOC_TON',
  'Thiên Mã': 'THIEN_MA',
  'Kình Dương': 'KINH_DUONG',
  'Đà La': 'DA_LA',
  'Hỏa Tinh': 'HOA_TINH',
  'Linh Tinh': 'LINH_TINH',
  'Địa Không': 'DIA_KHONG',
  'Địa Kiếp': 'DIA_KIEP',

  // Tap tinh quan sat duoc trong la so Pham Duy
  'Thiên Đức': 'THIEN_DUC',
  'Thiên Diêu': 'THIEN_DIEU',
  'Hoa Cái': 'HOA_CAI',
  'Phi Liêm': 'PHI_LIEM',
  'Triệt Lộ': 'TRIET_LO',
  'Tuần Không': 'TUAN_KHONG',
  'Không Vong': 'KHONG_VONG',
  'Hồng Loan': 'HONG_LOAN',
  'Ân Quang': 'AN_QUANG',
  'Thiên Tài': 'THIEN_TAI',
  'Thiên Thọ': 'THIEN_THO',
  'Quả Tú': 'QUA_TU',
  'Phong Cáo': 'PHONG_CAO',
  'Hàm Trì': 'HAM_TRI',
  'Thiên Quan': 'THIEN_QUAN',
  'Thiên Phúc': 'THIEN_PHUC',
  'Thiên Không': 'THIEN_KHONG',
  'Giải Thần': 'GIAI_THAN',
  'Thiên Khốc': 'THIEN_KHOC',
  'Thiên Thương': 'THIEN_THUONG',
  'Cô Thần': 'CO_THAN',
  'Tam Thai': 'TAM_THAI',
  'Long Trì': 'LONG_TRI',
  'Đài Phụ': 'DAI_PHU',
  'Thiên Trù': 'THIEN_TRU',
  'Thiên Nguyệt': 'THIEN_NGUYET',
  'Thiên Hình': 'THIEN_HINH',
  'Thiên Sứ': 'THIEN_SU',
  'Thiên Hỷ': 'THIEN_HY',
  'Nguyệt Đức': 'NGUYET_DUC',
  'Bát Tọa': 'BAT_TOA',
  'Thiên Quý': 'THIEN_QUY',
  'Phụng Các': 'PHUNG_CAC',
  'Thiên Vu': 'THIEN_VU',
  'Âm Sát': 'AM_SAT',
  'Thiên Hư': 'THIEN_HU',
  'Niên Giải': 'NIEN_GIAI',
  'Phá Toái': 'PHA_TOAI',
};

export function starIdFromVi(viName: string): string {
  const id = STAR_ID_BY_VI[viName];
  if (id === undefined) {
    throw new Error(
      `Sao "${viName}" chua co trong bang tra star_id. ` +
        `Them vao STAR_ID_BY_VI trong src/chart/star-id-map.ts sau khi doi chieu chinh ta.`,
    );
  }
  return id;
}

/** 7 muc do sang cua iztro (doc truc tiep tu lib/i18n/locales/vi-VN/brightness). */
const BRIGHTNESS_BY_VI: Readonly<Record<string, Brightness>> = {
  'Miếu': 'mieu',
  'Vượng': 'vuong',
  'Đắc': 'dac',
  'Lợi': 'loi',
  'Bình': 'binh',
  'Bất': 'bat',
  'Hạn': 'ham',
};

export function brightnessFromVi(viName: string | undefined): Brightness | undefined {
  if (viName === undefined || viName === '') return undefined;
  const b = BRIGHTNESS_BY_VI[viName];
  if (b === undefined) {
    throw new Error(`Do sang "${viName}" khong nam trong 7 muc cua iztro.`);
  }
  return b;
}

/** Tu hoa cua iztro (doc truc tiep tu lib/i18n/locales/vi-VN/mutagen). */
const SIHUA_BY_VI: Readonly<Record<string, SihuaType>> = {
  'Lộc': 'Loc',
  'Quyền': 'Quyen',
  'Khoa': 'Khoa',
  'Kỵ': 'Ky',
};

export function sihuaTypeFromVi(viName: string): SihuaType {
  const t = SIHUA_BY_VI[viName];
  if (t === undefined) {
    throw new Error(`Tu hoa "${viName}" khong hop le.`);
  }
  return t;
}

/**
 * 12 dia chi. Luu y `Tý` -> `Ty` va `Tỵ` -> `Ty2`: hai chi nay chi khac nhau dau,
 * rat de nham khi doc/go — chinh la loi da xay ra 2 lan trong qua trinh lam du an nay.
 */
const BRANCH_BY_VI: Readonly<Record<string, Branch>> = {
  'Tý': 'Ty',
  'Sửu': 'Suu',
  'Dần': 'Dan',
  'Mão': 'Mao',
  'Thìn': 'Thin',
  'Tỵ': 'Ty2',
  'Ngọ': 'Ngo',
  'Mùi': 'Mui',
  'Thân': 'Than',
  'Dậu': 'Dau',
  'Tuất': 'Tuat',
  'Hợi': 'Hoi',
};

export function branchFromVi(viName: string): Branch {
  const b = BRANCH_BY_VI[viName];
  if (b === undefined) {
    throw new Error(`Dia chi "${viName}" khong hop le.`);
  }
  return b;
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- star-id-map`
Expected: 6 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/chart/star-id-map.ts test/chart/star-id-map.test.ts
git commit -m "feat: add star_id / brightness / sihua / branch lookup tables"
```

---

### Task 4: Nạp âm bản mệnh từ `lunar-typescript`

**Files:**
- Create: `src/chart/nap-am.ts`
- Test: `test/chart/nap-am.test.ts`

**Interfaces:**
- Consumes: (không phụ thuộc task khác)
- Produces: `napAmFromSolarDate(solarDate: string): { raw: string; vi: string }`

**Lý do tồn tại file này:** `iztro` **không có** field nạp âm, nhưng Chart Data Shape v0.1 yêu cầu `ban_menh_nap_am`. `lunar-typescript` (đã là dependency của `iztro`, MIT) có `getYearNaYin()` nhưng trả tiếng Trung (`城头土`). Bảng tra tiếng Trung → tiếng Việt chỉ chứa các giá trị **đã đối chiếu được với reference #1**; giá trị chưa đối chiếu trả về chuỗi gốc kèm cảnh báo, KHÔNG tự dịch bừa (tránh lặp lại lỗi transcribe đã xảy ra 2 lần).

- [ ] **Step 1: Viết test**

Tạo `test/chart/nap-am.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { napAmFromSolarDate } from '../../src/chart/nap-am.js';

describe('nap-am', () => {
  it('cho ra Thanh Dau Tho cho nam Mau Dan 1998 (khop reference #1)', () => {
    const napAm = napAmFromSolarDate('1998-12-17');
    expect(napAm.raw).toBe('城头土');
    expect(napAm.vi).toBe('Thành Đầu Thổ');
  });

  it('gia tri chua doi chieu duoc thi giu nguyen chuoi goc, khong dich bua', () => {
    // Nam 2000 Canh Thin -> nap am "白蜡金", chua doi chieu voi nguon nao.
    const napAm = napAmFromSolarDate('2000-06-15');
    expect(napAm.raw).toBe('白蜡金');
    expect(napAm.vi).toBe('白蜡金');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- nap-am`
Expected: FAIL — không resolve được import

- [ ] **Step 3: Viết `src/chart/nap-am.ts`**

```ts
import { Solar } from 'lunar-typescript';

/**
 * Nap am ban menh.
 *
 * `iztro` KHONG cung cap nap am, nen lay tu `lunar-typescript` (MIT, von da la
 * dependency cua iztro). Ham `getYearNaYin()` tra ve tieng Trung.
 *
 * Bang dich duoi day CHI chua gia tri da doi chieu duoc voi nguon that.
 * Gia tri chua doi chieu -> tra ve nguyen chuoi goc tieng Trung, KHONG tu dich.
 * Ly do: du an nay da hai lan dinh loi transcribe tay (hoan doi Ty/Ty, sai do sang),
 * nen 30 gia tri nap am go tay khong kiem chung la rui ro khong can thiet o v0.1.
 */
const NAP_AM_VI: Readonly<Record<string, string>> = {
  // Doi chieu voi anh reference #1 (tuvi.vn) cho case Pham Duy, nam Mau Dan 1998.
  '城头土': 'Thành Đầu Thổ',
};

export function napAmFromSolarDate(solarDate: string): { raw: string; vi: string } {
  const [y, m, d] = solarDate.split('-').map((s) => Number.parseInt(s, 10));
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y)) {
    throw new Error(`Ngay duong lich khong hop le: "${solarDate}"`);
  }
  const raw = Solar.fromYmd(y, m, d).getLunar().getYearNaYin();
  return { raw, vi: NAP_AM_VI[raw] ?? raw };
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- nap-am`
Expected: 2 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/chart/nap-am.ts test/chart/nap-am.test.ts
git commit -m "feat: derive ban_menh_nap_am from lunar-typescript (iztro lacks it)"
```

---

### Task 5: Adapter `iztro` → `Chart`

**Files:**
- Create: `src/chart/adapter.ts`
- Test: `test/chart/adapter.test.ts`

**Interfaces:**
- Consumes: `Chart`, `ChartPalace`, `Cuc`, `BuildChartInput` từ `types.ts`; `starIdFromVi`, `brightnessFromVi`, `sihuaTypeFromVi`, `branchFromVi` từ `star-id-map.ts`; `napAmFromSolarDate` từ `nap-am.ts`
- Produces: `adaptFromIztro(astrolabe: IFunctionalAstrolabe, input: BuildChartInput): Chart`, `parseFiveElementsClass(raw: string): Cuc`

- [ ] **Step 1: Viết test cho `parseFiveElementsClass`**

Tạo `test/chart/adapter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { astro } from 'iztro';
import { adaptFromIztro, parseFiveElementsClass } from '../../src/chart/adapter.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY_INPUT: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

function buildPhamDuy() {
  const astrolabe = astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN');
  return adaptFromIztro(astrolabe, PHAM_DUY_INPUT);
}

describe('parseFiveElementsClass', () => {
  it('tach chuoi gop thanh ngu_hanh + cuc_so', () => {
    expect(parseFiveElementsClass('Thủy Nhị Cục')).toEqual({
      ngu_hanh: 'Thuy', cuc_so: 2, raw: 'Thủy Nhị Cục',
    });
    expect(parseFiveElementsClass('Mộc Tam Cục')).toEqual({
      ngu_hanh: 'Moc', cuc_so: 3, raw: 'Mộc Tam Cục',
    });
    expect(parseFiveElementsClass('Kim Tứ Cục')).toEqual({
      ngu_hanh: 'Kim', cuc_so: 4, raw: 'Kim Tứ Cục',
    });
    expect(parseFiveElementsClass('Thổ Ngũ Cục')).toEqual({
      ngu_hanh: 'Tho', cuc_so: 5, raw: 'Thổ Ngũ Cục',
    });
    expect(parseFiveElementsClass('Hỏa Lục Cục')).toEqual({
      ngu_hanh: 'Hoa', cuc_so: 6, raw: 'Hỏa Lục Cục',
    });
  });

  it('nem loi voi cuc khong nhan dang duoc', () => {
    expect(() => parseFiveElementsClass('Cục Bịa')).toThrowError(/khong nhan dang/i);
  });
});

describe('adaptFromIztro — case Pham Duy', () => {
  it('map metadata dung', () => {
    const chart = buildPhamDuy();
    expect(chart.metadata.birth_solar_date).toBe('1998-12-17');
    expect(chart.metadata.chinese_date).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(chart.metadata.gender).toBe('nam');
    expect(chart.metadata.calendar_type).toBe('duong_lich');
    expect(chart.metadata.year_can_chi).toBe('Mậu Dần');
    expect(chart.metadata.time_range).toBe('23:00~00:00');
  });

  it('map menh/than dung — dong cung tai Hoi', () => {
    const chart = buildPhamDuy();
    expect(chart.menh_than.menh_branch).toBe('Hoi');
    expect(chart.menh_than.than_branch).toBe('Hoi');
    expect(chart.menh_than.same_palace).toBe(true);
    expect(chart.menh_than.body_star).toBe('Thiên Lương');
  });

  it('map cuc + nap am dung', () => {
    const chart = buildPhamDuy();
    expect(chart.cuc.ngu_hanh).toBe('Thuy');
    expect(chart.cuc.cuc_so).toBe(2);
    expect(chart.ban_menh_nap_am).toBe('Thành Đầu Thổ');
  });

  it('co du 12 cung, moi cung co branch hop le va khong trung nhau', () => {
    const chart = buildPhamDuy();
    expect(chart.palaces).toHaveLength(12);
    const branches = chart.palaces.map((p) => p.branch);
    expect(new Set(branches).size).toBe(12);
  });

  it('cung Menh tai Hoi co Thien Dong + Dia Khong + Dia Kiep', () => {
    const chart = buildPhamDuy();
    const menh = chart.palaces.find((p) => p.branch === 'Hoi');
    expect(menh).toBeDefined();
    expect(menh!.palace_name).toBe('Mệnh');
    expect(menh!.is_body_palace).toBe(true);
    expect(menh!.major_stars.map((s) => s.star_id)).toContain('THIEN_DONG');
    expect(menh!.minor_stars.map((s) => s.star_id)).toEqual(
      expect.arrayContaining(['DIA_KHONG', 'DIA_KIEP']),
    );
  });

  it('map tu hoa ban menh dung bang Can Mau', () => {
    const chart = buildPhamDuy();
    const allSihua = chart.palaces.flatMap((p) =>
      p.sihua.map((s) => `${s.star_id}:${s.type}`),
    );
    // Build spec muc 3: Mau -> Tham Lang Loc, Thai Am Quyen, Huu Bat Khoa, Thien Co Ky
    expect(allSihua).toEqual(
      expect.arrayContaining([
        'THAM_LANG:Loc',
        'THAI_AM:Quyen',
        'HUU_BAT:Khoa',
        'THIEN_CO:Ky',
      ]),
    );
    expect(allSihua).toHaveLength(4);
  });

  it('map dai van — 12 moc, moc dau tai cung Menh', () => {
    const chart = buildPhamDuy();
    expect(chart.luck_cycles.dai_van).toHaveLength(12);
    const first = chart.luck_cycles.dai_van[0]!;
    expect(first.age_from).toBe(2);
    expect(first.age_to).toBe(11);
    expect(first.branch).toBe('Hoi');
  });

  it('map tieu van — 12 cung, moi cung co danh sach tuoi', () => {
    const chart = buildPhamDuy();
    expect(chart.luck_cycles.tieu_van).toHaveLength(12);
    for (const tv of chart.luck_cycles.tieu_van) {
      expect(tv.ages.length).toBeGreaterThan(0);
    }
  });

  it('ghi ro trong engine_meta rang luu_nien co chu dich khong nam trong Chart', () => {
    const chart = buildPhamDuy();
    expect(chart.engine_meta.notes.some((n) => n.includes('luu_nien'))).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- adapter`
Expected: FAIL — không resolve được import

- [ ] **Step 3: Viết `src/chart/adapter.ts`**

```ts
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace';
import {
  branchFromVi,
  brightnessFromVi,
  sihuaTypeFromVi,
  starIdFromVi,
} from './star-id-map.js';
import { napAmFromSolarDate } from './nap-am.js';
import type {
  BuildChartInput,
  Chart,
  ChartPalace,
  Cuc,
  DaiVan,
  MajorStar,
  MinorStar,
  NguHanh,
  Sihua,
  TieuVan,
} from './types.js';

const ENGINE_VERSION = '2.6.0';

/**
 * Tach chuoi cuc gop cua iztro ("Thuy Nhi Cuc") thanh ngu_hanh + cuc_so.
 * iztro chi co 5 gia tri co dinh (doc truc tiep tu lib/i18n/locales/vi-VN/fiveElementsClass).
 */
const FIVE_ELEMENTS: Readonly<Record<string, { ngu_hanh: NguHanh; cuc_so: 2 | 3 | 4 | 5 | 6 }>> = {
  'Thủy Nhị Cục': { ngu_hanh: 'Thuy', cuc_so: 2 },
  'Mộc Tam Cục': { ngu_hanh: 'Moc', cuc_so: 3 },
  'Kim Tứ Cục': { ngu_hanh: 'Kim', cuc_so: 4 },
  'Thổ Ngũ Cục': { ngu_hanh: 'Tho', cuc_so: 5 },
  'Hỏa Lục Cục': { ngu_hanh: 'Hoa', cuc_so: 6 },
};

export function parseFiveElementsClass(raw: string): Cuc {
  const parsed = FIVE_ELEMENTS[raw];
  if (parsed === undefined) {
    throw new Error(`Cuc "${raw}" khong nhan dang duoc. iztro chi co 5 cuc co dinh.`);
  }
  return { ngu_hanh: parsed.ngu_hanh, cuc_so: parsed.cuc_so, raw };
}

/** Gom tu hoa tu ca major + minor stars cua 1 cung. */
function extractSihua(palace: IFunctionalPalace): Sihua[] {
  const out: Sihua[] = [];
  for (const star of [...palace.majorStars, ...palace.minorStars]) {
    if (star.mutagen) {
      out.push({
        star_id: starIdFromVi(star.name),
        type: sihuaTypeFromVi(star.mutagen),
        source: 'ban_menh',
      });
    }
  }
  return out;
}

function adaptPalace(palace: IFunctionalPalace): ChartPalace {
  const major: MajorStar[] = palace.majorStars.map((s) => ({
    star_id: starIdFromVi(s.name),
    strength: brightnessFromVi(s.brightness),
  }));
  const minor: MinorStar[] = palace.minorStars.map((s) => ({
    star_id: starIdFromVi(s.name),
    strength: brightnessFromVi(s.brightness),
  }));
  return {
    branch: branchFromVi(palace.earthlyBranch),
    palace_name: palace.name,
    palace_stem: palace.heavenlyStem,
    is_body_palace: palace.isBodyPalace,
    is_original_palace: palace.isOriginalPalace,
    major_stars: major,
    minor_stars: minor,
    adjective_stars: palace.adjectiveStars.map((s) => ({ star_id: starIdFromVi(s.name) })),
    sihua: extractSihua(palace),
  };
}

function adaptDaiVan(astrolabe: IFunctionalAstrolabe): DaiVan[] {
  return astrolabe.decadalList().map((d) => ({
    age_from: d.ageRange[0],
    age_to: d.ageRange[1],
    branch: branchFromVi(d.earthlyBranch),
    stem: d.heavenlyStem,
    palace_name: d.palaceName,
  }));
}

function adaptTieuVan(astrolabe: IFunctionalAstrolabe): TieuVan[] {
  return astrolabe.palaces.map((p) => ({
    branch: branchFromVi(p.earthlyBranch),
    ages: [...p.ages],
  }));
}

export function adaptFromIztro(
  astrolabe: IFunctionalAstrolabe,
  input: BuildChartInput,
): Chart {
  const menhBranch = branchFromVi(astrolabe.earthlyBranchOfSoulPalace);
  const thanBranch = branchFromVi(astrolabe.earthlyBranchOfBodyPalace);
  const napAm = napAmFromSolarDate(astrolabe.solarDate);
  const yearCanChi = astrolabe.chineseDate.split(' - ')[0] ?? '';

  const notes: string[] = [
    'Do sang giu nguyen thang 7 muc cua iztro (Mieu/Vuong/Dac/Loi/Binh/Bat/Han), khong rut ve 5 muc.',
    'Nap am lay tu lunar-typescript vi iztro khong cung cap.',
    'Tuan/Triet nam trong adjective_stars (TUAN_KHONG / TRIET_LO / KHONG_VONG), khong phai truong rieng.',
    'luu_nien CO CHU DICH khong nam trong Chart: no la du lieu theo nam duoc hoi, khong phai fact tinh cua la so. Dung astrolabe.horoscope(date) khi can.',
  ];
  if (napAm.vi === napAm.raw) {
    notes.push(`Nap am "${napAm.raw}" chua co ban dich tieng Viet da doi chieu — giu nguyen chuoi goc.`);
  }

  return {
    chart_id: `${astrolabe.solarDate}_t${input.time_index}_${input.gender}`,
    metadata: {
      birth_solar_date: astrolabe.solarDate,
      birth_lunar_date: astrolabe.lunarDate,
      chinese_date: astrolabe.chineseDate,
      time_label: astrolabe.time,
      time_range: astrolabe.timeRange,
      gender: input.gender,
      calendar_type: input.calendar_type,
      year_can_chi: yearCanChi,
    },
    menh_than: {
      menh_branch: menhBranch,
      than_branch: thanBranch,
      same_palace: menhBranch === thanBranch,
      soul_star: astrolabe.soul,
      body_star: astrolabe.body,
    },
    cuc: parseFiveElementsClass(astrolabe.fiveElementsClass),
    ban_menh_nap_am: napAm.vi,
    palaces: astrolabe.palaces.map(adaptPalace),
    luck_cycles: {
      dai_van: adaptDaiVan(astrolabe),
      tieu_van: adaptTieuVan(astrolabe),
    },
    engine_meta: {
      engine: 'iztro',
      engine_version: ENGINE_VERSION,
      language: 'vi-VN',
      notes,
    },
  };
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `npm test -- adapter`
Expected: tất cả test PASS. Nếu test tứ hóa FAIL vì `toHaveLength(4)` — dừng lại kiểm tra: có thể `iztro` gắn tứ hóa ở cả `adjectiveStars`. Không sửa assertion cho khớp trước khi hiểu nguyên nhân.

- [ ] **Step 5: Chạy typecheck**

Run: `npm run typecheck`
Expected: không lỗi

- [ ] **Step 6: Commit**

```bash
git add src/chart/adapter.ts test/chart/adapter.test.ts
git commit -m "feat: add iztro -> Chart adapter with sihua, dai van, cuc parsing"
```

---

### Task 6: Query helpers + public API `buildChart`

**Files:**
- Create: `src/chart/iztro-client.ts`, `src/chart/queries.ts`, `src/chart/index.ts`
- Test: `test/chart/queries.test.ts`

**Interfaces:**
- Consumes: `Chart`, `ChartPalace`, `Branch`, `BuildChartInput` từ `types.ts`; `adaptFromIztro` từ `adapter.ts`
- Produces:
  - `callIztro(input: BuildChartInput): IFunctionalAstrolabe` (trong `iztro-client.ts`)
  - `buildChart(input: BuildChartInput): Chart`
  - `palaceOfBranch(chart: Chart, branch: Branch): ChartPalace`
  - `palaceOfName(chart: Chart, name: string): ChartPalace`
  - `starsIn(chart: Chart, branch: Branch): Set<string>`
  - `relatedPalaces(input: BuildChartInput, branch: Branch): { opposite: Branch; wealth: Branch; career: Branch }`

**Vì sao tách `iztro-client.ts` riêng:** cả `index.ts` (để build chart) và `queries.ts` (để gọi `surroundedPalaces`) đều cần hàm gọi `iztro`. Nếu đặt hàm này trong `index.ts` thì `queries.ts` phải import ngược từ `index.ts`, trong khi `index.ts` lại re-export `queries.ts` → phụ thuộc vòng. Tách ra file thứ ba để cả hai cùng import xuôi một chiều.

**Ghi chú quan trọng về quan hệ cung:** `iztro` cung cấp `surroundedPalaces()` trả về **tam phương tứ chính** — `{target, opposite, wealth, career}`. Đây KHÔNG hoàn toàn đồng nghĩa với "tam hợp" thuần tuý trong prototype Python (tam hợp = 3 cung cùng nhóm địa chi). `relatedPalaces` trả đúng thứ `iztro` cho, không tự suy diễn thêm quan hệ tam hợp — đúng nguyên tắc không tự viết lại bảng tĩnh.

- [ ] **Step 1: Viết test**

Tạo `test/chart/queries.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { palaceOfBranch, palaceOfName, starsIn, relatedPalaces } from '../../src/chart/queries.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

const PHAM_DUY_LUNAR: BuildChartInput = {
  calendar_type: 'am_lich',
  date: '1998-10-30',
  time_index: 0,
  gender: 'nam',
  is_leap_month: false,
  fix_leap: true,
};

describe('buildChart', () => {
  it('build duoc tu input duong lich', () => {
    const chart = buildChart(PHAM_DUY);
    expect(chart.metadata.chinese_date).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(chart.palaces).toHaveLength(12);
  });

  it('build duoc tu input am lich, cho cung 4 tru', () => {
    const chart = buildChart(PHAM_DUY_LUNAR);
    expect(chart.metadata.chinese_date).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(chart.metadata.calendar_type).toBe('am_lich');
  });

  it('hai duong nhap cho cung ket qua an sao', () => {
    const a = buildChart(PHAM_DUY);
    const b = buildChart(PHAM_DUY_LUNAR);
    const norm = (c: ReturnType<typeof buildChart>) =>
      c.palaces.map((p) => `${p.branch}:${p.major_stars.map((s) => s.star_id).sort().join(',')}`).sort();
    expect(norm(a)).toEqual(norm(b));
  });
});

describe('queries', () => {
  it('palaceOfBranch lay dung cung theo dia chi', () => {
    const chart = buildChart(PHAM_DUY);
    expect(palaceOfBranch(chart, 'Hoi').palace_name).toBe('Mệnh');
    expect(palaceOfBranch(chart, 'Suu').palace_name).toBe('Phúc Đức');
  });

  it('palaceOfName lay dung cung theo ten', () => {
    const chart = buildChart(PHAM_DUY);
    expect(palaceOfName(chart, 'Mệnh').branch).toBe('Hoi');
  });

  it('palaceOfBranch nem loi khi khong tim thay', () => {
    const chart = buildChart(PHAM_DUY);
    expect(() => palaceOfName(chart, 'Cung Khong Ton Tai')).toThrowError(/khong tim thay/i);
  });

  it('starsIn gom ca chinh tinh, phu tinh, tap tinh', () => {
    const chart = buildChart(PHAM_DUY);
    const stars = starsIn(chart, 'Hoi');
    expect(stars.has('THIEN_DONG')).toBe(true);
    expect(stars.has('DIA_KHONG')).toBe(true);
    expect(stars.has('DIA_KIEP')).toBe(true);
    expect(stars.has('THIEN_DUC')).toBe(true);
  });

  it('relatedPalaces uy quyen cho surroundedPalaces cua iztro', () => {
    const rel = relatedPalaces(PHAM_DUY, 'Hoi');
    // Chay that: Menh@Hoi -> opposite=Thien Di@Ty(Tỵ), wealth=Tai Bach@Mui, career=Quan Loc@Mao
    expect(rel.opposite).toBe('Ty2');
    expect(rel.wealth).toBe('Mui');
    expect(rel.career).toBe('Mao');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `npm test -- queries`
Expected: FAIL — không resolve được import

- [ ] **Step 3: Viết `src/chart/iztro-client.ts`**

```ts
import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { BuildChartInput } from './types.js';

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
  return astro.byLunar(
    input.date,
    input.time_index,
    gender,
    input.is_leap_month ?? false,
    input.fix_leap ?? true,
    'vi-VN',
  );
}
```

- [ ] **Step 4: Viết `src/chart/index.ts`**

```ts
import { adaptFromIztro } from './adapter.js';
import { callIztro } from './iztro-client.js';
import type { BuildChartInput, Chart } from './types.js';

export type { Chart, BuildChartInput } from './types.js';
export { callIztro } from './iztro-client.js';
export { palaceOfBranch, palaceOfName, starsIn, relatedPalaces } from './queries.js';

export function buildChart(input: BuildChartInput): Chart {
  return adaptFromIztro(callIztro(input), input);
}
```

- [ ] **Step 5: Viết `src/chart/queries.ts`**

```ts
import { callIztro } from './iztro-client.js';
import { branchFromVi } from './star-id-map.js';
import type { Branch, BuildChartInput, Chart, ChartPalace } from './types.js';

export function palaceOfBranch(chart: Chart, branch: Branch): ChartPalace {
  const p = chart.palaces.find((x) => x.branch === branch);
  if (p === undefined) {
    throw new Error(`Khong tim thay cung o dia chi "${branch}"`);
  }
  return p;
}

export function palaceOfName(chart: Chart, name: string): ChartPalace {
  const p = chart.palaces.find((x) => x.palace_name === name);
  if (p === undefined) {
    throw new Error(`Khong tim thay cung ten "${name}"`);
  }
  return p;
}

/** Gom toan bo star_id trong 1 cung: chinh tinh + phu tinh + tap tinh. */
export function starsIn(chart: Chart, branch: Branch): Set<string> {
  const p = palaceOfBranch(chart, branch);
  return new Set([
    ...p.major_stars.map((s) => s.star_id),
    ...p.minor_stars.map((s) => s.star_id),
    ...p.adjective_stars.map((s) => s.star_id),
  ]);
}

/**
 * Tam phuong tu chinh cua 1 cung, UY QUYEN hoan toan cho `surroundedPalaces()` cua iztro.
 * KHONG tu viet lai bang tam hop/xung chieu (build spec muc 7).
 *
 * Luu y: `surroundedPalaces` tra ve tam phuong tu chinh (target + doi cung + tai bach + quan loc),
 * KHONG dong nghia "tam hop" thuan tuy theo nhom dia chi.
 *
 * DANH DOI DA CAN NHAC VA CHAP NHAN O v0.1: ham nay nhan `BuildChartInput` va goi lai
 * `callIztro`, tuc TINH LAI TOAN BO la so cho moi lan truy van quan he. Cach nay ton kem
 * hon viec luu san quan he vao Chart, nhung:
 *  - design doc muc 3 quy dinh quan he giua cung la static knowledge, KHONG luu trong Chart;
 *  - quan he nay chi phu thuoc dia chi, giong nhau o moi la so — luu vao tung Chart la
 *    nhan ban cung mot thong tin tinh;
 *  - Rule Engine (noi se goi nhieu lan) nam NGOAI pham vi phase nay (build spec muc 13).
 * Khi Rule Engine thuc su can, phuong an toi uu la dung bang quan he 12 chi MOT LAN tu
 * iztro roi tra bang — van khong tu go bang bang tay. Doi sau khong kho vi chi 1 ham.
 */
export function relatedPalaces(
  input: BuildChartInput,
  branch: Branch,
): { opposite: Branch; wealth: Branch; career: Branch } {
  const astrolabe = callIztro(input);
  const target = astrolabe.palaces.find((p) => branchFromVi(p.earthlyBranch) === branch);
  if (target === undefined) {
    throw new Error(`Khong tim thay cung o dia chi "${branch}"`);
  }
  const sp = astrolabe.surroundedPalaces(target.index);
  return {
    opposite: branchFromVi(sp.opposite.earthlyBranch),
    wealth: branchFromVi(sp.wealth.earthlyBranch),
    career: branchFromVi(sp.career.earthlyBranch),
  };
}
```

- [ ] **Step 6: Chạy test để xác nhận PASS**

Run: `npm test -- queries`
Expected: tất cả test PASS

- [ ] **Step 7: Chạy toàn bộ test + typecheck**

Run: `npm test && npm run typecheck`
Expected: tất cả PASS, không lỗi type

- [ ] **Step 8: Commit**

```bash
git add src/chart/iztro-client.ts src/chart/index.ts src/chart/queries.ts test/chart/queries.test.ts
git commit -m "feat: add buildChart public API + palace query helpers"
```

---

### Task 7: Fixture reference #1 + cross-check 12 cung + báo cáo phân loại

**Files:**
- Create: `test/chart/fixtures/pham-duy.ts`, `scripts/crosscheck-report.ts`, `test/chart/pham-duy-crosscheck.test.ts`
- Create: `docs/superpowers/reports/2026-08-16-cross-check-pham-duy.md`
- Modify: `package.json` (thêm script `crosscheck`), `docs/superpowers/specs/2026-08-16-chart-engine-design.md` (cập nhật Known Issues)

**Interfaces:**
- Consumes: `buildChart` từ `src/chart/index.ts`; `palaceOfBranch` từ `queries.ts`
- Produces: fixture `PHAM_DUY_REFERENCE` + báo cáo phân loại điểm lệch

**Đây là task quan trọng nhất — thực thi đúng quy trình 2 bước ở mục 8 design doc:** bước 1 phát hiện toàn bộ điểm lệch, bước 2 phân loại rồi mới chốt assertion. Tuyệt đối không sửa code/đổi config `iztro` để ép khớp tuvi.vn.

- [ ] **Step 1: Viết fixture từ transcript reference #1**

Tạo `test/chart/fixtures/pham-duy.ts` (số liệu lấy từ mục 6 design doc, đã được người dùng soát tay 2 lần):

```ts
import type { Branch } from '../../../src/chart/types.js';

/**
 * Transcript lá số Phạm Duy tu reference implementation #1 (anh tuvi.vn).
 *
 * KHONG phai "ground truth" — day la output cua 1 phan mem cu the theo 1 lua chon
 * truong phai cu the. Moi diem lech giua iztro va fixture nay phai di qua quy trinh
 * phan loai muc 7 design doc truoc khi quyet dinh sua gi.
 */
export interface ReferencePalace {
  branch: Branch;
  palace_name: string;
  /** Chinh tinh kem do sang theo ky hieu anh: M=Mieu V=Vuong D=Dac B=Binh H=Ham */
  major_stars: { name: string; brightness: string }[];
}

export const PHAM_DUY_REFERENCE = {
  birth: {
    solar_date: '1998-12-17',
    time: '23:15',
    chinese_date: 'Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý',
    gender: 'Dương Nam',
  },
  cuc: 'Thủy Nhị Cục',
  ban_menh_nap_am: 'Thành Đầu Thổ',
  soul_star: 'Lộc Tồn',
  body_star: 'Thiên Lương',
  menh_branch: 'Hoi' as Branch,
  than_branch: 'Hoi' as Branch,
  palaces: [
    { branch: 'Ty2', palace_name: 'Thiên Di', major_stars: [{ name: 'Thiên Lương', brightness: 'H' }] },
    { branch: 'Suu', palace_name: 'Phúc Đức', major_stars: [{ name: 'Thái Âm', brightness: 'D' }, { name: 'Thái Dương', brightness: 'D' }] },
    { branch: 'Dan', palace_name: 'Điền Trạch', major_stars: [{ name: 'Tham Lang', brightness: 'D' }] },
    { branch: 'Mao', palace_name: 'Quan Lộc', major_stars: [{ name: 'Cự Môn', brightness: 'M' }, { name: 'Thiên Cơ', brightness: 'M' }] },
    { branch: 'Thin', palace_name: 'Nô Bộc', major_stars: [{ name: 'Tử Vi', brightness: 'V' }, { name: 'Thiên Tướng', brightness: 'V' }] },
    { branch: 'Ty', palace_name: 'Phụ Mẫu', major_stars: [{ name: 'Vũ Khúc', brightness: 'V' }, { name: 'Thiên Phủ', brightness: 'M' }] },
    { branch: 'Ngo', palace_name: 'Tật Ách', major_stars: [{ name: 'Thất Sát', brightness: 'M' }] },
    { branch: 'Mui', palace_name: 'Tài Bạch', major_stars: [] },
    { branch: 'Than', palace_name: 'Tử Tức', major_stars: [{ name: 'Liêm Trinh', brightness: 'V' }] },
    { branch: 'Dau', palace_name: 'Phu Thê', major_stars: [] },
    { branch: 'Tuat', palace_name: 'Huynh Đệ', major_stars: [{ name: 'Phá Quân', brightness: 'D' }] },
    { branch: 'Hoi', palace_name: 'Mệnh', major_stars: [{ name: 'Thiên Đồng', brightness: 'D' }] },
  ] satisfies ReferencePalace[],
};
```

- [ ] **Step 2: Viết SCRIPT chẩn đoán cho BƯỚC PHÁT HIỆN**

Bước phát hiện là **công cụ chẩn đoán**, không phải test: mục đích của nó là in ra danh sách điểm lệch để con người phân loại, chứ không phải để pass/fail. Viết nó thành test sẽ buộc phải có 1 assertion giả luôn đúng (`expect(Array.isArray(diffs)).toBe(true)`) — một test không kiểm chứng gì. Vì vậy đặt nó là script chạy riêng.

Tạo `scripts/crosscheck-report.ts`:

```ts
/**
 * Cong cu chan doan cho BUOC 1 cua quy trinh cross-check (design doc muc 8).
 *
 * In ra TOAN BO diem lech giua output iztro va reference #1 de con nguoi phan loai
 * theo 3 nhom o muc 7. KHONG phai test — khong pass/fail, khong assert.
 * Assertion cuoi cung nam trong test/chart/pham-duy-crosscheck.test.ts, viet SAU
 * khi da phan loai xong.
 *
 * Chay: npm run crosscheck
 */
import { buildChart } from '../src/chart/index.js';
import { palaceOfBranch } from '../src/chart/queries.js';
import { starIdFromVi } from '../src/chart/star-id-map.js';
import { PHAM_DUY_REFERENCE } from '../test/chart/fixtures/pham-duy.js';
import type { BuildChartInput } from '../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

/** Ky hieu do sang trong anh reference #1 -> gia tri Brightness cua ta. */
const REF_BRIGHTNESS: Readonly<Record<string, string>> = {
  M: 'mieu', V: 'vuong', D: 'dac', B: 'binh', H: 'ham',
};

function collectDiffs(): string[] {
  const chart = buildChart(PHAM_DUY);
  const diffs: string[] = [];

  for (const ref of PHAM_DUY_REFERENCE.palaces) {
    const actual = palaceOfBranch(chart, ref.branch);

    if (actual.palace_name !== ref.palace_name) {
      diffs.push(`[TEN CUNG] ${ref.branch}: iztro="${actual.palace_name}" ref="${ref.palace_name}"`);
    }

    const actualIds = actual.major_stars.map((s) => s.star_id).sort();
    const refIds = ref.major_stars.map((s) => starIdFromVi(s.name)).sort();
    if (JSON.stringify(actualIds) !== JSON.stringify(refIds)) {
      diffs.push(`[CHINH TINH] ${ref.branch}: iztro=[${actualIds}] ref=[${refIds}]`);
    }

    for (const refStar of ref.major_stars) {
      const match = actual.major_stars.find((s) => s.star_id === starIdFromVi(refStar.name));
      if (!match) continue; // da bao o dong [CHINH TINH] o tren
      const expected = REF_BRIGHTNESS[refStar.brightness];
      if (match.strength !== expected) {
        diffs.push(`[DO SANG] ${ref.branch} ${refStar.name}: iztro="${match.strength}" ref="${expected}"`);
      }
    }
  }

  if (chart.menh_than.soul_star !== PHAM_DUY_REFERENCE.soul_star) {
    diffs.push(`[CHU MENH] iztro="${chart.menh_than.soul_star}" ref="${PHAM_DUY_REFERENCE.soul_star}"`);
  }
  if (chart.menh_than.body_star !== PHAM_DUY_REFERENCE.body_star) {
    diffs.push(`[CHU THAN] iztro="${chart.menh_than.body_star}" ref="${PHAM_DUY_REFERENCE.body_star}"`);
  }
  if (chart.cuc.raw !== PHAM_DUY_REFERENCE.cuc) {
    diffs.push(`[CUC] iztro="${chart.cuc.raw}" ref="${PHAM_DUY_REFERENCE.cuc}"`);
  }
  if (chart.ban_menh_nap_am !== PHAM_DUY_REFERENCE.ban_menh_nap_am) {
    diffs.push(`[NAP AM] iztro="${chart.ban_menh_nap_am}" ref="${PHAM_DUY_REFERENCE.ban_menh_nap_am}"`);
  }

  return diffs;
}

const diffs = collectDiffs();
console.log('===== BAO CAO DIEM LECH: iztro vs reference #1 =====');
console.log(diffs.length === 0 ? '(khong co diem lech)' : diffs.join('\n'));
console.log(`\nTong: ${diffs.length} diem lech`);
```

Thêm script vào `package.json`:

```bash
npm pkg set scripts.crosscheck="npx tsx scripts/crosscheck-report.ts"
npm install -D tsx@^4.19.0
```

- [ ] **Step 3: Chạy script để thu thập danh sách điểm lệch**

Run: `npm run crosscheck`
Expected: in ra danh sách điểm lệch. **Ghi lại nguyên văn output** — nó là đầu vào bắt buộc cho bước phân loại. Không sửa gì ở bước này.

- [ ] **Step 4: Phân loại từng điểm lệch theo mục 7 design doc**

Với mỗi dòng trong báo cáo, xếp vào đúng 1 trong 3 nhóm:

1. **Bug thật** (đọc sai field, map nhầm, lỗi transcribe fixture) → sửa code hoặc sửa fixture, assertion cuối theo reference #1.
2. **Khác trường phái hợp lệ** → **KHÔNG sửa**, assertion cuối theo output thật của `iztro`, kèm comment giải thích.
3. **Chưa xác định** → assertion theo output `iztro`, đánh dấu `// TODO: can nghien cuu them`.

Căn cứ đã biết trước để phân loại (từ khảo sát trước khi lập plan):
- **Độ sáng lệch hàng loạt** → nhóm 2 (khác bảng độ sáng theo trường phái). `iztro` dùng thang 7 mức, tuvi.vn dùng thang 5 mức — không thể khớp tuyệt đối về mặt cấu trúc.
- **Chủ mệnh (`soul`)**: `iztro`=Cự Môn vs ref=Lộc Tồn → nhóm 3 (chưa xác định) trừ khi tìm được căn cứ.
- **Tên cung Tử Nữ vs Tử Tức** → nhóm 2 (dị bản tên gọi, cùng một cung).
- **Vị trí cung + vị trí chính tinh** → khảo sát cho thấy khớp 100%; nếu có lệch phát sinh, ưu tiên nghi nhóm 1.

- [ ] **Step 5: Viết báo cáo cross-check**

Tạo `docs/superpowers/reports/2026-08-16-cross-check-pham-duy.md`. Dùng khung dưới đây; các chỗ `<...>` là **ô điền số liệu thật thu được ở Step 3–4**, không phải phần để ngỏ — phải điền hết trước khi commit.

```markdown
# Cross-check Chart Engine vs Reference #1 — case Phạm Duy

**Ngày:** 2026-08-16
**Engine:** iztro 2.6.0, language vi-VN, config mặc định
**Input đã xác minh:** bySolar('1998-12-17', timeIndex=12, nam)
**Reference #1:** ảnh lá số tuvi.vn (transcript mục 6 design doc)

## Tóm tắt

- Tổng số điểm so sánh: <N>
- Khớp: <N>
- Lệch — nhóm 1 (bug, đã sửa): <N>
- Lệch — nhóm 2 (khác trường phái, giữ nguyên): <N>
- Lệch — nhóm 3 (chưa xác định): <N>

## Khớp hoàn toàn

<liệt kê>

## Nhóm 1 — Bug thật (đã sửa)

| Điểm | iztro | reference #1 | Nguyên nhân | Đã sửa |
|---|---|---|---|---|

## Nhóm 2 — Khác biệt trường phái hợp lệ (KHÔNG sửa)

| Điểm | iztro | reference #1 | Căn cứ phân loại |
|---|---|---|---|

## Nhóm 3 — Chưa xác định nguyên nhân

| Điểm | iztro | reference #1 | Cần nghiên cứu gì |
|---|---|---|---|

## Kết luận

<Chart Engine đã đủ tin cậy cho case nền chưa; còn gì phải làm>
```

Điền số liệu thật từ Step 3–4. **Không làm tròn, không bỏ bớt điểm lệch cho gọn.**

- [ ] **Step 6: Viết assertion cuối cùng theo kết quả phân loại**

Tạo `test/chart/pham-duy-crosscheck.test.ts`. Đây là nơi DUY NHẤT có assertion — viết SAU khi đã phân loại xong ở Step 4, mỗi assertion phản ánh kết quả phân loại chứ không tự động theo reference #1:

```ts
import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { palaceOfBranch } from '../../src/chart/queries.js';
import { starIdFromVi } from '../../src/chart/star-id-map.js';
import { PHAM_DUY_REFERENCE } from './fixtures/pham-duy.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('BUOC 2 — assertion cuoi cung theo ket qua phan loai', () => {
  const chart = buildChart(PHAM_DUY);

  it('vi tri 12 cung khop reference #1 (nhom: khop)', () => {
    for (const ref of PHAM_DUY_REFERENCE.palaces) {
      const actual = palaceOfBranch(chart, ref.branch);
      expect(actual, `cung tai ${ref.branch}`).toBeDefined();
    }
    expect(chart.palaces).toHaveLength(12);
  });

  it('vi tri chinh tinh tung cung khop reference #1 (nhom: khop)', () => {
    for (const ref of PHAM_DUY_REFERENCE.palaces) {
      const actual = palaceOfBranch(chart, ref.branch);
      const actualIds = actual.major_stars.map((s) => s.star_id).sort();
      const refIds = ref.major_stars.map((s) => starIdFromVi(s.name)).sort();
      expect(actualIds, `chinh tinh tai ${ref.branch}`).toEqual(refIds);
    }
  });

  it('Menh/Than dong cung tai Hoi (nhom: khop)', () => {
    expect(chart.menh_than.menh_branch).toBe('Hoi');
    expect(chart.menh_than.than_branch).toBe('Hoi');
    expect(chart.menh_than.same_palace).toBe(true);
  });

  it('Cuc + nap am khop reference #1 (nhom: khop)', () => {
    expect(chart.cuc.raw).toBe(PHAM_DUY_REFERENCE.cuc);
    expect(chart.ban_menh_nap_am).toBe(PHAM_DUY_REFERENCE.ban_menh_nap_am);
  });

  it('chu than khop reference #1 (nhom: khop)', () => {
    expect(chart.menh_than.body_star).toBe(PHAM_DUY_REFERENCE.body_star);
  });

  // NHOM 2 — khac truong phai hop le. Assertion theo OUTPUT THAT cua iztro,
  // CHU DICH khong khop reference #1. Xem bao cao cross-check de biet ly do.
  it('do sang theo thang 7 muc cua iztro, khong ep khop tuvi.vn (nhom 2)', () => {
    const menh = palaceOfBranch(chart, 'Hoi');
    const thienDong = menh.major_stars.find((s) => s.star_id === 'THIEN_DONG');
    // iztro: Mieu | tuvi.vn: Dac. Bang do sang khac nhau giua 2 truong phai.
    // KHONG sua config iztro de ep ve 'dac'.
    expect(thienDong?.strength).toBe('mieu');
  });

  it('ten cung theo iztro (Tu Nu), reference #1 dung Tu Tuc — di ban ten (nhom 2)', () => {
    expect(palaceOfBranch(chart, 'Than').palace_name).toBe('Tử Nữ');
  });

  // NHOM 3 — chua xac dinh. Assertion theo output hien tai de khoa hanh vi,
  // khong coi la dung/sai.
  // TODO: can nghien cuu them — vi sao chu menh khac nhau giua 2 engine.
  it('chu menh: iztro cho Cu Mon, reference #1 cho Loc Ton (nhom 3, chua xac dinh)', () => {
    expect(chart.menh_than.soul_star).toBe('Cự Môn');
  });
});
```

- [ ] **Step 7: Chạy toàn bộ test**

Run: `npm test`
Expected: tất cả PASS. Nếu có FAIL không giải thích được — dừng lại, KHÔNG sửa assertion cho xanh.

- [ ] **Step 8: Cập nhật Known Issues trong design doc**

Trong `docs/superpowers/specs/2026-08-16-chart-engine-design.md`, mục "Known issues": đánh dấu 2 mục `[MỞ]` hiện có thành `[ĐÃ XỬ LÝ]` kèm 1 câu kết luận, hoặc giữ `[MỞ]` nếu chưa giải quyết xong. Thêm mục mới nếu cross-check phát hiện vấn đề chưa xử lý.

- [ ] **Step 9: Commit**

```bash
git add test/chart/fixtures/pham-duy.ts scripts/crosscheck-report.ts test/chart/pham-duy-crosscheck.test.ts package.json package-lock.json docs/superpowers/reports/2026-08-16-cross-check-pham-duy.md docs/superpowers/specs/2026-08-16-chart-engine-design.md
git commit -m "test: cross-check 12 palaces vs reference #1 with discrepancy classification"
```

---

## Sau khi hoàn thành plan

Dừng lại báo cáo cho chủ dự án (build spec mục 13 yêu cầu rõ), gồm:
1. Kết quả `npm test` nguyên văn (pass/fail từng test).
2. Báo cáo cross-check: bao nhiêu điểm khớp, bao nhiêu lệch, phân loại từng nhóm.
3. Danh sách nhánh CHƯA test (mục 10 design doc: nữ mệnh, Cục khác, tháng nhuận).
4. Các mục Known Issues còn mở.

**KHÔNG tự ý làm tiếp Rule Engine, Conflict Resolver, LLM, hay UI sau khi xong plan này.**
