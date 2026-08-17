import { describe, it, expect } from 'vitest';
import { astro } from 'iztro';

/**
 * Smoke test: xac nhan iztro cai dat dung va cho ra lá số Phạm Duy đã xác minh.
 * Input nay da duoc xac minh bang cach doi chieu chineseDate voi anh reference #1 (tuvi.vn).
 * timeIndex = 12 la GIO TY MUON (23:00-00:00), khop "23 gio 15 phut" trong anh.
 * KHONG dung timeIndex = 0 (gio Ty som 00:00-01:00) -> cho ra lá số khac han.
 */
describe('iztro smoke test', () => {
  it('tao duoc la so Pham Duy voi 4 tru khop reference #1', () => {
    const astrolabe = astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN');

    expect(astrolabe.chineseDate).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(astrolabe.solarDate).toBe('1998-12-17');
    expect(astrolabe.timeRange).toBe('23:00~00:00');
    expect(astrolabe.fiveElementsClass).toBe('Thủy Nhị Cục');
    expect(astrolabe.earthlyBranchOfSoulPalace).toBe('Hợi');
    expect(astrolabe.earthlyBranchOfBodyPalace).toBe('Hợi');
    expect(astrolabe.palaces).toHaveLength(12);
  });

  it('lunar input tuong duong cho cung 4 tru', () => {
    const byLunar = astro.byLunar('1998-10-30', 0, 'male', false, true, 'vi-VN');
    expect(byLunar.chineseDate).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
  });
});
