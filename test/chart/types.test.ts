import { describe, it, expect } from 'vitest';
import { BRANCHES, BRIGHTNESS_VALUES, isBranch } from '../../src/chart/types.js';

describe('Chart types', () => {
  it('co du 12 dia chi, dung thu tu chuan', () => {
    expect(BRANCHES).toEqual([
      'Ty', 'Suu', 'Dan', 'Mao', 'Thin', 'Ty2',
      'Ngo', 'Mui', 'Than', 'Dau', 'Tuat', 'Hoi',
    ]);
  });

  it('co du 7 muc do sang khop iztro (khong rut ve 5)', () => {
    expect(BRIGHTNESS_VALUES).toEqual([
      'mieu', 'vuong', 'dac', 'loi', 'binh', 'bat', 'ham',
    ]);
  });

  it('isBranch nhan dung va tu choi sai', () => {
    expect(isBranch('Hoi')).toBe(true);
    expect(isBranch('Ty2')).toBe(true);
    expect(isBranch('Hợi')).toBe(false);
    expect(isBranch('XX')).toBe(false);
  });
});
