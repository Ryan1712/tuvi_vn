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
