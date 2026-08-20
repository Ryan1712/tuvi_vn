import type { Rule, Source, DomainPalaceEntry } from './types.js';

/**
 * Entry mau duy nhat cua Rule Engine v0.1 (build spec muc 9):
 * "Thien Dong ngo Khong/Kiep" — 2 quan diem trai chieu, dung de chung minh
 * conflict_group_id hoat dong dung. KHONG viet them Rule ngoai Entry nay (build spec muc 13).
 */

export const SRC_001: Source = {
  source_id: 'SRC_001',
  type: 'dien_dan_web',
  title: 'Tong hop dien dan — Thien Dong ngo Khong Kiep bat cat',
  author: null,
  school: null,
  reliability_tier: '3_thap',
  excerpt_or_link: 'chua truy nguyen ban goc/chu Han — xem build spec muc 9',
};

export const SRC_002: Source = {
  source_id: 'SRC_002',
  type: 'dien_dan_web',
  title: 'Tong hop dien dan — Khong Kiep Ty Hoi phan vi giai luan',
  author: null,
  school: null,
  reliability_tier: '3_thap',
  excerpt_or_link: 'chua truy nguyen ban goc/chu Han — xem build spec muc 9',
};

/**
 * Quan diem A (bat cat): "de hoang mang, thieu nhat quan, thay doi that thuong".
 * Yeu cau ca Thien Dong + Dia Khong + Dia Kiep dong cung.
 */
export const RULE_A: Rule = {
  rule_id: 'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
  conflict_group_id: 'CG_001',
  scope: 'star_combination',
  subject: { type: 'star', id: 'THIEN_DONG' },
  conditions: [
    { field: 'major_stars', operator: 'contains', value: 'THIEN_DONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: {
    text: 'Thien Dong ngo Khong Kiep — de hoang mang, thieu nhat quan, thay doi that thuong.',
    valence: 'hung',
    magnitude: 'vua',
  },
  school: 'tong_hop_dien_dan',
  sources: ['SRC_001'],
  consensus: 'tranh_cai',
  notes: 'Xem RULE_B cung conflict_group_id CG_001 — quan diem trai chieu.',
};

/**
 * Quan diem B (phan vi giai): luan ve VI TRI Ty/Hoi cua Khong-Kiep, KHONG dong nghia
 * truc tiep "Thien Dong + Khong Kiep = tot" — vi vay conditions KHONG doi hoi Thien Dong,
 * chi doi hoi Khong+Kiep dong cung. Vi tri Ty2/Hoi la modifier (yeu to gia giam mem),
 * KHONG dua vao conditions.
 */
export const RULE_B: Rule = {
  rule_id: 'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
  conflict_group_id: 'CG_001',
  scope: 'star_combination',
  subject: { type: 'star', id: 'DIA_KHONG_DIA_KIEP' },
  conditions: [
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KHONG', required: true },
    { field: 'minor_stars', operator: 'contains', value: 'DIA_KIEP', required: true },
  ],
  modifiers: [
    { field: 'branch', operator: 'in', value: 'Ty2,Hoi', effect: 'tang_xu_huong_tot', weight: 0.7 },
  ],
  exceptions: [],
  conclusion: {
    text: 'Khong Kiep dong cung — tai Ty/Hoi co xu huong phan vi giai (tot hon vi tri khac), tuy chinh tinh di kem.',
    valence: 'cat',
    magnitude: 'nhe',
  },
  school: 'tong_hop_dien_dan',
  sources: ['SRC_002'],
  consensus: 'tranh_cai',
  notes: 'Luan ve vi tri Ty/Hoi, KHONG dong nghia truc tiep "Thien Dong + Khong Kiep = tot".',
};

export const KNOWLEDGE_BASE: Rule[] = [RULE_A, RULE_B];
export const SOURCES: Source[] = [SRC_001, SRC_002];

/**
 * Tri thuc domain -> cung. 10 domain ro rang (1 cung), 2 domain mo ho (nhieu cung).
 * Xem design doc 2026-08-20-llm-query-tang2-design.md muc 1. Gia tri palace_names da
 * verify bang du lieu that tu iztro (khong go theo tri nho) — xem muc 8 Known Issues.
 */
export const DOMAIN_PALACE_MAP: DomainPalaceEntry[] = [
  {
    domain: 'menh',
    palace_names: ['Mệnh'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Menh — tinh cach, ban chat con nguoi.',
  },
  {
    domain: 'phu_mau',
    palace_names: ['Phụ Mẫu', 'Huynh Đệ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'tranh_cai',
    notes: 'Cha me: 1 so truong phai chi xem Phu Mau, 1 so khac tinh ca Huynh De (anh chi em ho hang gan). Thu tu: Phu Mau truoc.',
  },
  {
    domain: 'phuc_duc',
    palace_names: ['Phúc Đức'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Phuc Duc — phuc phan, tam linh, to tien.',
  },
  {
    domain: 'dien_trach',
    palace_names: ['Điền Trạch'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Dien Trach — nha cua, bat dong san.',
  },
  {
    domain: 'quan_loc',
    palace_names: ['Quan Lộc'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Quan Loc — su nghiep, cong danh.',
  },
  {
    domain: 'no_boc',
    palace_names: ['Nô Bộc'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung No Boc — ban be, dong nghiep, cap duoi.',
  },
  {
    domain: 'thien_di',
    palace_names: ['Thiên Di'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Thien Di — di chuyen, xuat ngoai, thay doi moi truong.',
  },
  {
    domain: 'tat_ach',
    palace_names: ['Tật Ách'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Tat Ach — suc khoe, benh tat.',
  },
  {
    domain: 'tai_bach',
    palace_names: ['Tài Bạch'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Tai Bach — tien bac, tai chinh.',
  },
  {
    domain: 'tu_tuc',
    palace_names: ['Tử Nữ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Tu Nu (iztro dung ten nay, khong phai "Tu Tuc") — con cai.',
  },
  {
    domain: 'phu_the',
    palace_names: ['Phu Thê', 'Tử Nữ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'tranh_cai',
    notes: 'Hon nhan: cung chinh la Phu The. Mot so goc hoi (con cai anh huong hon nhan) tham chieu them Tu Nu. Thu tu: Phu The truoc.',
  },
  {
    domain: 'huynh_de',
    palace_names: ['Huynh Đệ'],
    school: 'pho_thong',
    sources: [],
    consensus: 'cao',
    notes: 'Cung Huynh De — anh chi em.',
  },
];
