/**
 * Fixture DAY DU 12 cung — transcribe tu anh reference #1 (tuvi.vn, case Pham Duy, nam xem
 * Binh Ngo 2026).
 *
 * QUAN TRONG ve minor_and_adjective: day la TAP HOP GOP CHUNG moi loai sao phu (phu tinh
 * chinh thuc, tap tinh, VA ca vong Bac Sy/Tuong Tien/Tue Tien nhu "Luc Sy", "Quan Phu",
 * "Thanh Long"...) — KHONG tach rieng theo dung 3 field boshi/jiangqian/suiqian cua
 * ChartPalace, vi anh goc khong the phan biet ro vong nao khi doc bang mat, va viec tu phan
 * loai lai doi hoi kien thuc Tu Vi chuyen sau (rui ro tu doan sai, dung loai loi CLAUDE.md
 * muc 6/9 canh bao). Script so sanh PHAI gop tuong tu o phia iztro (minor_stars +
 * adjective_stars + boshi + jiangqian + suiqian) roi so SET, khong so tung field rieng le.
 *
 * DA QUA SOAT LAN CUOI cua nguoi dung (2026-08-25): 10/12 cung khop ngay lan dau, 2 loi da
 * sua (chinh ta "Thai Phu" khong dau sac o Tat Ach; thieu "Hoa Ky" ban menh o Quan Loc). Coi
 * day la nguon tham chieu on dinh de viet script so sanh tu dong — khong con o trang thai
 * "fixture tho" nua.
 *
 * Vi tri Tuan Khong / Triet Khong da CHOT bang verify cheo ly thuyet + code that (khong con
 * mau thuan): Tuan Khong -> cung Than, Triet Khong -> cung Ty. Xem
 * docs/superpowers/specs/2026-08-16-chart-engine-design.md muc 7, cap nhat 2026-08-25 vong 3.
 *
 * Sao co tien to "L." trong anh goc la sao Luu Nien (can view_year, KHONG phai fact tinh cua
 * la so) — giu nguyen tien to trong fixture nay de phan biet ro voi sao TINH.
 */

export interface FullPalaceFixture {
  branch: string;
  palace_name: string;
  major_stars: string[];
  minor_and_adjective: string[]; // cot trai + cot phai gop lai, GIU THU TU nhu anh (trai truoc, phai sau)
  luu_nien_stars: string[]; // sao co tien to "L." trong o nay
  has_tuan: boolean;
  has_triet: boolean;
}

export const PHAM_DUY_FULL_REFERENCE: {
  view_year: string; // nam xem dung de transcribe (Binh Ngo 2026)
  palaces: FullPalaceFixture[];
} = {
  view_year: '2026-06-15',
  palaces: [
    {
      branch: 'Ty2', // Ty
      palace_name: 'Thiên Di',
      major_stars: ['Thiên Lương (Hãm)'],
      minor_and_adjective: [
        'Thiên Giải', 'Lộc Tồn', 'Thiếu Âm', 'Bác Sỹ',
        'Lưu Hà', 'Cô Thần', 'Đầu Quân',
      ],
      luu_nien_stars: ['L.Lộc Tồn'],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Ngo',
      palace_name: 'Tật Ách',
      major_stars: ['Thất Sát (Miếu)'],
      minor_and_adjective: [
        'Đài Phụ', 'Thiên Trù', 'Long Trì', 'Lực Sỹ', 'Tam Thai',
        'Thiên Hình (Hãm)', 'Kình Dương (Hãm)', 'Quan Phù', 'Thiên Sứ',
      ],
      luu_nien_stars: ['L.Thái Tuế', 'L.Kình Dương', 'L.Văn Khúc'],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Mui',
      palace_name: 'Tài Bạch',
      major_stars: [],
      minor_and_adjective: [
        'Thiên Việt', 'Thiên Hỷ', 'Nguyệt Đức',
        'Tử Phù', 'Thanh Long',
      ],
      luu_nien_stars: [],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Than',
      palace_name: 'Tử Tức',
      major_stars: ['Liêm Trinh (Vượng)'],
      minor_and_adjective: [
        'Văn Tinh', 'Thiên Mã (Hãm)', 'Giải Thần', 'Phụng Các', 'Bát Tọa',
        'Thiên Hư (Đắc)', 'Tuế Phá', 'Tiểu Hao',
      ],
      luu_nien_stars: ['L.Văn Xương', 'L.Tang Môn', 'L.Hóa Kỵ', 'L.Thiên Mã'],
      has_tuan: true, // CHOT: Tuan Khong o cung Than (verify code + ly thuyet)
      has_triet: false,
    },
    {
      branch: 'Thin',
      palace_name: 'Nô Bộc',
      major_stars: ['Tử Vi (Vượng)', 'Thiên Tướng (Vượng)'],
      minor_and_adjective: [
        'Văn Khúc (Đắc)', 'Địa Giải', 'Tang Môn', 'Thiên La', 'Thiên Thương',
        'Đà La (Đắc)', 'Thiên Khốc (Hãm)', 'Quan Phủ',
      ],
      luu_nien_stars: [],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Dau',
      palace_name: 'Phu Thê',
      major_stars: [],
      minor_and_adjective: [
        'Long Đức',
        'Phá Toái', 'Tướng Quân',
      ],
      luu_nien_stars: ['L.Hồng Loan', 'L.Thiên Việt'],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Mao',
      palace_name: 'Quan Lộc',
      major_stars: ['Cự Môn (Miếu)', 'Thiên Cơ (Miếu)'],
      minor_and_adjective: [
        'Thiên Phúc', 'Thiên Quan', 'Đào Hoa', 'Thiếu Dương', 'Hóa Kỵ',
        'Linh Tinh (Đắc)', 'Thiên Không', 'Phục Binh',
      ],
      luu_nien_stars: ['L.Đào Hoa', 'L.Hóa Quyền'],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Tuat',
      palace_name: 'Huynh Đệ',
      major_stars: ['Phá Quân (Đắc)'],
      minor_and_adjective: [
        'Văn Xương (Đắc)', 'Thiên Y', 'Đường Phù', 'Hoa Cái', 'Tấu Thư',
        'Thiên Diêu (Đắc)', 'Bạch Hổ', 'Địa Võng',
      ],
      luu_nien_stars: ['L.Hóa Khoa'],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Dan',
      palace_name: 'Điền Trạch',
      major_stars: ['Tham Lang (Đắc)'],
      minor_and_adjective: [
        'Phong Cáo', 'Ân Quang', 'Hóa Lộc',
        'Thái Tuế', 'Đại Hao',
      ],
      luu_nien_stars: ['L.Bạch Hổ'],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Suu',
      palace_name: 'Phúc Đức',
      major_stars: ['Thái Âm (Đắc)', 'Thái Dương (Đắc)'],
      minor_and_adjective: [
        'Hữu Bật', 'Tả Phù', 'Thiên Khôi', 'Quốc Ấn', 'Hồng Loan',
        'Thiên Tài', 'Thiên Thọ', 'Hóa Quyền', 'Hóa Khoa',
        'Hỏa Tinh (Hãm)', 'Quả Tú', 'Trực Phù', 'Bệnh Phù',
      ],
      luu_nien_stars: [],
      has_tuan: false,
      has_triet: false,
    },
    {
      branch: 'Ty',
      palace_name: 'Phụ Mẫu',
      major_stars: ['Vũ Khúc (Vượng)', 'Thiên Phủ (Miếu)'],
      minor_and_adjective: [
        'Hỷ Thần', 'Thiên Quý',
        'Điếu Khách',
      ],
      luu_nien_stars: ['L.Thiên Khốc', 'L.Thiên Hư'],
      has_tuan: false,
      has_triet: true, // CHOT: Triet Khong o cung Ty (verify code + ly thuyet)
    },
    {
      branch: 'Hoi',
      palace_name: 'Mệnh',
      major_stars: ['Thiên Đồng (Đắc)'],
      minor_and_adjective: [
        'Thiên Đức', 'Phúc Đức',
        'Địa Không (Đắc)', 'Địa Kiếp', 'Kiếp Sát', 'Phi Liêm',
      ],
      luu_nien_stars: ['L.Thiên Khôi', 'L.Hóa Lộc', 'L.Kiếp Sát'],
      has_tuan: false,
      has_triet: false,
    },
  ],
};
