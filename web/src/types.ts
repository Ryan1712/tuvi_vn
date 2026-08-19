// Hand-copied subset of backend types (src/chart/types.ts, src/rule/evaluator.ts,
// src/rule/conflict-resolver.ts). NOT imported directly — web/ is a separate package
// and must not bundle backend dependencies (iztro, express) into the browser build.
// Keep in sync by hand if the backend shape changes.

export const BRANCHES = [
  'Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Ty2',
  'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi',
] as const;
export type Branch = (typeof BRANCHES)[number];

export const BRIGHTNESS_VALUES = [
  'mieu', 'vuong', 'dac', 'loi', 'binh', 'bat', 'ham',
] as const;
export type Brightness = (typeof BRIGHTNESS_VALUES)[number];

export type NguHanh = 'Kim' | 'Moc' | 'Thuy' | 'Hoa' | 'Tho';
export type Gender = 'nam' | 'nu';
export type CalendarType = 'duong_lich' | 'am_lich';

export interface MajorStar {
  star_id: string;
  strength?: Brightness;
}

export type MinorStarType =
  | 'major' | 'soft' | 'tough' | 'adjective' | 'flower' | 'helper' | 'lucun' | 'tianma';

export interface MinorStar {
  star_id: string;
  strength?: Brightness;
  type: MinorStarType;
}

export interface AdjectiveStar {
  star_id: string;
}

export interface Sihua {
  star_id: string;
  type: 'Loc' | 'Quyen' | 'Khoa' | 'Ky';
  source: 'ban_menh' | 'dai_van' | 'luu_nien';
}

export interface ChartPalace {
  branch: Branch;
  palace_name: string;
  palace_stem: string;
  is_body_palace: boolean;
  is_original_palace: boolean;
  major_stars: MajorStar[];
  minor_stars: MinorStar[];
  adjective_stars: AdjectiveStar[];
  sihua: Sihua[];
  branch_element: NguHanh;
  truong_sinh: string;
  boshi: string;
  jiangqian: string;
  suiqian: string;
}

export interface DaiVan {
  age_from: number;
  age_to: number;
  branch: Branch;
  stem: string;
  palace_name: string;
}

export interface TieuVan {
  branch: Branch;
  ages: number[];
}

export interface LuuNienPalace {
  branch: Branch;
  palace_name: string;
  stars: { star_id: string }[];
}

export interface LuuNien {
  year: number;
  heavenly_stem: string;
  earthly_branch: string;
  mutagen: string[];
  palaces: LuuNienPalace[];
}

export interface ChartMetadata {
  birth_solar_date: string;
  birth_lunar_date: string;
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
  soul_star: string;
  body_star: string;
}

export interface Cuc {
  ngu_hanh: NguHanh;
  cuc_so: 2 | 3 | 4 | 5 | 6;
  raw: string;
}

export interface EngineMeta {
  engine: string;
  engine_version: string;
  language: string;
  notes: string[];
}

export interface Chart {
  chart_id: string;
  metadata: ChartMetadata;
  menh_than: MenhThan;
  cuc: Cuc;
  ban_menh_nap_am: string;
  palaces: ChartPalace[];
  luck_cycles: { dai_van: DaiVan[]; tieu_van: TieuVan[] };
  engine_meta: EngineMeta;
  luu_nien?: LuuNien;
}

export type BuildChartInput = (
  | {
      calendar_type: 'duong_lich';
      date: string;
      time_index: number;
      gender: Gender;
      fix_leap?: boolean;
    }
  | {
      calendar_type: 'am_lich';
      date: string;
      time_index: number;
      gender: Gender;
      is_leap_month?: boolean;
      fix_leap?: boolean;
    }
) & {
  view_year?: string;
};

// Rule Engine types (src/rule/evaluator.ts, src/rule/conflict-resolver.ts)
export interface Modifier {
  field: string;
  operator: string;
  value: string;
  effect: string;
  weight: number;
}

export interface Exception {
  conditions: unknown[];
  effect: string;
}

export interface RuleEvalResult {
  rule_id: string;
  matched: boolean;
  matched_modifiers: Modifier[];
  triggered_exceptions: Exception[];
}

export interface Rule {
  rule_id: string;
  conflict_group_id: string | null;
  scope: string;
  subject: { type: string; id: string };
  conditions: unknown[];
  modifiers: Modifier[];
  exceptions: Exception[];
  conclusion: { text: string; valence: string; magnitude: string };
  school: string;
  sources: string[];
  consensus: string;
  notes: string;
}

export interface ConflictGroup {
  conflict_group_id: string;
  rules: Rule[];
}

export interface PalaceRuleResult {
  matched: RuleEvalResult[];
  conflicts: ConflictGroup[];
}

export interface ChartRulesResponse {
  chart: Chart;
  rules_by_palace: Record<Branch, PalaceRuleResult>;
}

export interface ChartOverviewResponse {
  chart: Chart;
  overview_text: string;
}
