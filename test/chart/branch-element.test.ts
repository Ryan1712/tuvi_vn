import { describe, it, expect } from 'vitest';
import { branchElement } from '../../src/chart/branch-element.js';
import type { Branch, NguHanh } from '../../src/chart/types.js';

describe('branchElement', () => {
  it('anh xa dung tat ca 12 dia chi sang ngu hanh, khop kien thuc tu vi chuan', () => {
    const expected: Record<Branch, NguHanh> = {
      Ty: 'Thuy', Suu: 'Tho', Dan: 'Moc', Mao: 'Moc', Thin: 'Tho', Ty2: 'Hoa',
      Ngo: 'Hoa', Mui: 'Tho', Than: 'Kim', Dau: 'Kim', Tuat: 'Tho', Hoi: 'Thuy',
    };
    for (const [branch, ngu_hanh] of Object.entries(expected)) {
      expect(branchElement(branch as Branch)).toBe(ngu_hanh);
    }
  });
});
