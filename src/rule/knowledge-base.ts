import type { Rule, Source } from './types.js';

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
