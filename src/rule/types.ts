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
/**
 * 'luu_nien_stars' doc LuuNienPalace.stars (mang phang, khong phan loai chinh/phu/tap —
 * dung ban chat Tu Vi: chinh tinh khong "luu" theo nam, chi phu tinh/tap dieu moi luu.
 * CHI hop le cho Rule.scope === 'annual' — evaluateAnnualRule throw neu dung field khac.
 */
export type ChartField =
  | 'major_stars' | 'minor_stars' | 'adjective_stars' | 'all_stars' | 'sihua_type'
  | 'luu_nien_stars';

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

/**
 * 12 domain — dat ten theo cung Han Viet (khong theo ngu nghia cau hoi tu nhien, vi
 * NLU/map cau hoi tu do -> domain la 1 phase rieng sau nay, khong lam o v0.1). Xem
 * docs/superpowers/specs/2026-08-20-llm-query-tang2-design.md muc 1.
 */
export type DomainKey =
  | 'menh' | 'phu_mau' | 'phuc_duc' | 'dien_trach' | 'quan_loc' | 'no_boc'
  | 'thien_di' | 'tat_ach' | 'tai_bach' | 'tu_tuc' | 'phu_the' | 'huynh_de';

/**
 * Tri thuc domain -> cung. KHONG PHAI Rule (khong co dieu kien evaluate tren Chart — xem
 * design doc muc 1). Van giu truong provenance nhu Source vi day van la tri thuc that.
 */
export interface DomainPalaceEntry {
  domain: DomainKey;
  /**
   * Ten cung LIEN QUAN, LUON la mang (ke ca domain khong mo ho chi co 1 phan tu). Thu tu
   * phan tu = muc do quan trong (phan tu dau = quan trong nhat) — PHAI duoc bao toan
   * xuyen suot resolveQuery() -> QueryEvidencePack -> system prompt, xem design doc muc 3,
   * muc 4, muc 5.
   *
   * LUU THEO TEN CUNG (string, khop ChartPalace.palace_name that tu iztro), KHONG PHAI
   * Branch truc tiep — vi ten cung co dinh nhung branch no roi vao THAY DOI theo tung la
   * so (phu thuoc gio/ngay sinh).
   */
  palace_names: string[];
  school: string;
  sources: string[]; // ref(Source.source_id)
  consensus: Consensus;
  notes: string;
}
