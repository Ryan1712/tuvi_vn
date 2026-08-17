import { Solar } from 'lunar-typescript';

/**
 * Nap am ban menh.
 *
 * `iztro` KHONG cung cap nap am, nen lay tu `lunar-typescript` (MIT, von da la
 * dependency cua iztro). Ham `getYearNaYin()` tra ve tieng Trung.
 *
 * Bang dich duoi day CHI chua gia tri da doi chieu duoc voi nguon that.
 * Gia tri chua doi chieu -> tra ve nguyen chuoi goc tieng Trung, KHONG tu dich.
 * Ly do: du an nay da hai lan dinh loi transcribe tay (hoan doi Ty/Ty, sai do sang),
 * nen 30 gia tri nap am go tay khong kiem chung la rui ro khong can thiet o v0.1.
 */
const NAP_AM_VI: Readonly<Record<string, string>> = {
  // Doi chieu voi anh reference #1 (tuvi.vn) cho case Pham Duy, nam Mau Dan 1998.
  '城头土': 'Thành Đầu Thổ',
};

export function napAmFromSolarDate(solarDate: string): { raw: string; vi: string } {
  const parts = solarDate.split('-');
  if (parts.length !== 3) {
    throw new Error(`Ngay duong lich khong hop le: "${solarDate}"`);
  }
  const [y, m, d] = parts.map((s) => Number.parseInt(s, 10));
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d)
  ) {
    throw new Error(`Ngay duong lich khong hop le: "${solarDate}"`);
  }
  const raw = Solar.fromYmd(y, m, d).getLunar().getYearNaYin();
  return { raw, vi: NAP_AM_VI[raw] ?? raw };
}
