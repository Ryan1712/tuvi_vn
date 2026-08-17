/**
 * Rule Schema v0.1 + Source entity.
 * Port cua build spec muc 4 (Rule) va muc 5 (Source) sang TypeScript.
 * Chi dinh nghia type, khong chua logic (giong types.ts cua Chart Engine).
 */

/**
 * 9 gia tri theo build spec muc 4. Chi 4 trong so nay co evaluator that o v0.1
 * (star_palace, star_combination, four_transform, palace_relationship) — cac scope
 * con lai khai du trong enum de viet Rule dung type ngay tu dau, nhung evaluateRule()
 * se throw Error ro rang neu gap, KHONG am tham bo qua Rule (xem evaluator.ts).
 */
export type RuleScope =
  | 'star_palace'
  | 'star_pair'
  | 'star_combination'
  | 'palace_relationship'
  | 'four_transform'
  | 'pattern'
  | 'decade'
  | 'annual'
  | 'spouse_matching';

export type ConditionOperator = 'contains' | 'not_contains' | 'equals' | 'in' | 'not_in';

/**
 * Field doc duoc tren 1 ChartPalace, thu hep so voi build spec (field: string tu do).
 * Sao la se bi TypeScript chan luc viet Rule thay vi loi runtime. Mo rong enum nay
 * neu can field khac tren Chart — khong dung field: string tu do.
 */
export type ChartField = 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type';

export interface Condition {
  field: ChartField;
  operator: ConditionOperator;
  value: string;
  required: true; // v0.1: moi condition deu bat buoc — khong co optional condition
}

export interface Modifier {
  field: ChartField | 'branch';
  operator: ConditionOperator;
  value: string;
  effect: string; // mo ta dinh tinh, KHONG phai diem so
  weight: number; // 0..1, CHI dung trong Modifier — khong co tren Condition
}

export interface Exception {
  conditions: Condition[];
  effect: string;
}

export type Valence = 'cat' | 'hung' | 'trung_tinh';
export type Magnitude = 'nhe' | 'vua' | 'manh';
export type Consensus = 'cao' | 'trung_binh' | 'tranh_cai';

export interface Conclusion {
  text: string;
  valence: Valence;
  magnitude: Magnitude;
}

export interface Rule {
  rule_id: string;
  conflict_group_id: string | null;
  scope: RuleScope;
  subject: { type: 'star' | 'palace' | 'pattern'; id: string };
  conditions: Condition[];
  modifiers: Modifier[];
  exceptions: Exception[];
  conclusion: Conclusion;
  school: string;
  sources: string[]; // ref(Source.source_id), many-to-many voi Source
  consensus: Consensus; // DOC LAP voi Source.reliability_tier
  notes: string;
}

export type SourceType = 'co_van_nguyen_ban' | 'sach_in_co_tac_gia' | 'dien_dan_web';
export type ReliabilityTier = '1_cao_nhat' | '2_trung' | '3_thap';

export interface Source {
  source_id: string;
  type: SourceType;
  title: string;
  author: string | null;
  school: string | null;
  reliability_tier: ReliabilityTier;
  excerpt_or_link: string;
}
