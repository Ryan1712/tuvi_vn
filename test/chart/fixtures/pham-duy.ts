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
