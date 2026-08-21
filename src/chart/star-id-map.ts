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

  // Tap tinh THEM khi doi algorithm sang 'zhongzhou' (2026-08-21) — quan sat duoc khi
  // build lai case Pham Duy voi zhongzhou, truoc do khong xuat hien (default khong co).
  'Long Đức': 'LONG_DUC',
  'Đại Hao': 'DAI_HAO',
  'Kiếp Sát': 'KIEP_SAT',
  'Triệt Không': 'TRIET_KHONG',

  // Luu tinh (vong Luu Nien) — quan sat duoc khi goi astrolabe.horoscope() cho nam xem.
  // Doi chieu voi key goc cua iztro (lib/i18n/locales/vi-VN/star.js): liukui/liuyue/
  // liuchang/liuqu/liuluan/liuxi/liulu/liuyang/liutuo/liuma — la phien ban "luu nien"
  // cua 10 sao goc (Thien Khoi, Thien Viet, Van Xuong, Van Khuc, Hong Loan, Thien Hy,
  // Loc Ton, Kinh Duong, Da La, Thien Ma). star_id dat theo tien to LUU_ + ten sao goc
  // da chuan hoa, KHONG dung chung star_id voi sao goc (Luu Xuong != Van Xuong, la 2
  // thuc the khac nhau ve scope: 'yearly' vs 'origin').
  'Lưu Khôi': 'LUU_THIEN_KHOI',
  'Lưu Việt': 'LUU_THIEN_VIET',
  'Lưu Xương': 'LUU_VAN_XUONG',
  'Lưu Khúc': 'LUU_VAN_KHUC',
  'Lưu Loan': 'LUU_HONG_LOAN',
  'Lưu Hỷ': 'LUU_THIEN_HY',
  'Lưu Lộc': 'LUU_LOC_TON',
  'Lưu Dương': 'LUU_KINH_DUONG',
  'Lưu Đà': 'LUU_DA_LA',
  'Lưu Mã': 'LUU_THIEN_MA',
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
