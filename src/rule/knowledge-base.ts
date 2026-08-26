import type { Rule, Source, DomainPalaceEntry } from './types.js';

/**
 * Entry mau dau tien cua Rule Engine v0.1 (build spec muc 9):
 * "Thien Dong ngo Khong/Kiep" — 2 quan diem trai chieu, dung de chung minh
 * conflict_group_id hoat dong dung.
 *
 * [CAP NHAT 2026-08-25] Rang buoc goc "KHONG viet them Rule ngoai Entry nay" (build spec muc
 * 13, ghi ngay 2026-08-16) la chi dao cho GIAI DOAN DAU ("KB mo rong tam dung, cho dinh huong
 * product tiep theo") — dinh huong do da toi (Rule Engine v0.2/v0.3/v0.4, Tang 2 Domain Query,
 * UI da build xong), va chu du an truc tiep yeu cau mo rong KB. Rang buoc nay KHONG con hieu
 * luc, xem RULE_MENH_VCD_MUON_CHINH_TINH ben duoi la Entry thu 3.
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

export const SRC_003: Source = {
  source_id: 'SRC_003',
  type: 'dien_dan_web',
  title: 'Tong hop nhieu trang tra cuu Tu Vi pho thong (baoquocte.vn, thansohoconline.com, huyenbi.net, astrology.vn, tracuutuvi.com...)',
  author: null,
  school: null,
  reliability_tier: '3_thap',
  excerpt_or_link: 'Tra cuu qua web search 2026-08-26 — xem hoi thoai brainstorm goc cho danh sach URL day du neu can truy lai.',
};

/**
 * Vo Chinh Dieu (1 cung khong co chinh tinh nao) — cach cuc pho thong, nhieu nguon doc lap
 * dong thuan ve co che loi: MUON chinh tinh cua cung xung chieu de luan thay vi tu chinh tinh
 * cua chinh cung do (khong co). Muc do anh huong cu the (~60-80% tuy nguon, CHUA thong nhat
 * con so chinh xac) khong dua vao conditions/modifiers — chi ghi trong conclusion.text nhu 1
 * mo ta dinh tinh, dung dua so lieu chua thong nhat lam dieu kien cung.
 *
 * QUAN TRONG — pham vi ap dung MOI CUNG, khong rieng Menh: Rule Engine chay matchRules() cho
 * ca 12 cung (xem src/server/routes.ts), khong chi cung Menh. "Menh Vo Chinh Dieu" chi la
 * truong hop duoc ban nhieu nhat vi Menh la cung quan trong nhat — nguon tra cuu KHONG gioi
 * han hien tuong nay chi xay ra o Menh. conclusion.text vi vay viet TONG QUAT ("cung xung
 * chieu", khong hardcode ten 1 cung cu the nhu "Thien Di") — vi doi cung khac nhau tuy cung
 * dang xet (VD Tai Bach doi cung la Phu The, khong phai Thien Di). Neu tang LLM can biet TEN
 * CU THE cua cung xung chieu de dien dat tu nhien hon, do la viec cua Evidence Pack dua them
 * du kien (da co san qua relatedPalaces()), KHONG phai nhet cung vao conclusion.text tinh.
 *
 * QUAN TRONG ve pham vi dieu kien: chi encode dung DIEU KIEN "cung nay khong co chinh tinh"
 * (kiem tra duoc tren 1 cung, scope star_palace, KHONG can palace_relationship) — phan "muon
 * chinh tinh doi cung" la MO TA CO CHE trong ket luan, khong phai 1 condition rieng can
 * evaluate. Day la Rule DAU TIEN dung operator is_empty (them 2026-08-25 sau khi phat hien
 * ConditionOperator cu khong co cach dien dat "khong co sao nao" ma khong ep cau truc).
 *
 * Nhom "6 cach cuc Tam Khong/Tu Khong" (Dac Nhi Khong, Dac Tam Khong, Kien Tam Khong, Ngo Tam
 * Khong, Dac Tu Khong, Nhat Nguyet tinh minh) CHUA duoc encode — can dem so sao tren TAP NHIEU
 * cung cung luc (1 cung + 2 tam hop + xung chieu), Rule Engine hien tai (scope star_palace/
 * palace_relationship) khong xu ly duoc dieu nay, can thiet ke scope moi rieng. Xem
 * docs/superpowers/specs/2026-08-16-chart-engine-design.md hoac spec Rule Engine lien quan
 * ve quyet dinh nay khi duoc thiet ke.
 */
export const RULE_VO_CHINH_DIEU_MUON_CHINH_TINH: Rule = {
  rule_id: 'RULE_VO_CHINH_DIEU_MUON_CHINH_TINH',
  conflict_group_id: null,
  scope: 'star_palace',
  subject: { type: 'pattern', id: 'VO_CHINH_DIEU' },
  conditions: [
    { field: 'major_stars', operator: 'is_empty', value: '', required: true },
  ],
  modifiers: [],
  exceptions: [],
  conclusion: {
    text: 'Vo Chinh Dieu (khong co chinh tinh toa thu tai cung nay) — muon chinh tinh cua cung xung chieu de luan thay, mot phan anh huong so voi truong hop chinh tinh toa thu truc tiep.',
    valence: 'trung_tinh',
    magnitude: 'vua',
  },
  school: 'pho_thong',
  sources: ['SRC_003'],
  consensus: 'cao',
  notes: 'Muc do "%" anh huong cu the KHONG thong nhat giua cac nguon (60-80% tuy nguon) — khong dua vao dieu kien/modifier, chi mo ta dinh tinh trong conclusion.',
};

export const KNOWLEDGE_BASE: Rule[] = [RULE_A, RULE_B, RULE_VO_CHINH_DIEU_MUON_CHINH_TINH];
export const SOURCES: Source[] = [SRC_001, SRC_002, SRC_003];

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
