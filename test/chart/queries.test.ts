import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { palaceOfBranch, palaceOfName, starsIn, relatedPalaces } from '../../src/chart/queries.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

const PHAM_DUY_LUNAR: BuildChartInput = {
  calendar_type: 'am_lich',
  date: '1998-10-30',
  time_index: 0,
  gender: 'nam',
  is_leap_month: false,
  fix_leap: true,
};

describe('buildChart', () => {
  it('build duoc tu input duong lich', () => {
    const chart = buildChart(PHAM_DUY);
    expect(chart.metadata.chinese_date).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(chart.palaces).toHaveLength(12);
  });

  it('build duoc tu input am lich, cho cung 4 tru', () => {
    const chart = buildChart(PHAM_DUY_LUNAR);
    expect(chart.metadata.chinese_date).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(chart.metadata.calendar_type).toBe('am_lich');
  });

  it('hai duong nhap cho cung ket qua an sao', () => {
    const a = buildChart(PHAM_DUY);
    const b = buildChart(PHAM_DUY_LUNAR);
    const norm = (c: ReturnType<typeof buildChart>) =>
      c.palaces.map((p) => `${p.branch}:${p.major_stars.map((s) => s.star_id).sort().join(',')}`).sort();
    expect(norm(a)).toEqual(norm(b));
  });

  it('throw khi calendar_type khong phai duong_lich hay am_lich', () => {
    const badInput = { ...PHAM_DUY, calendar_type: 'khong_hop_le' } as unknown as BuildChartInput;
    expect(() => buildChart(badInput)).toThrowError(/calendar_type.*khong hop le/i);
  });
});

describe('queries', () => {
  it('palaceOfBranch lay dung cung theo dia chi', () => {
    const chart = buildChart(PHAM_DUY);
    expect(palaceOfBranch(chart, 'Hoi').palace_name).toBe('Mệnh');
    expect(palaceOfBranch(chart, 'Suu').palace_name).toBe('Phúc Đức');
  });

  it('palaceOfName lay dung cung theo ten', () => {
    const chart = buildChart(PHAM_DUY);
    expect(palaceOfName(chart, 'Mệnh').branch).toBe('Hoi');
  });

  it('palaceOfBranch nem loi khi khong tim thay', () => {
    const chart = buildChart(PHAM_DUY);
    expect(() => palaceOfName(chart, 'Cung Khong Ton Tai')).toThrowError(/khong tim thay/i);
  });

  it('starsIn gom ca chinh tinh, phu tinh, tap tinh', () => {
    const chart = buildChart(PHAM_DUY);
    const stars = starsIn(chart, 'Hoi');
    expect(stars.has('THIEN_DONG')).toBe(true);
    expect(stars.has('DIA_KHONG')).toBe(true);
    expect(stars.has('DIA_KIEP')).toBe(true);
    expect(stars.has('THIEN_DUC')).toBe(true);
  });

  it('relatedPalaces uy quyen cho surroundedPalaces cua iztro', () => {
    const rel = relatedPalaces(PHAM_DUY, 'Hoi');
    // Chay that: Menh@Hoi -> opposite=Thien Di@Ty(Tỵ), wealth=Tai Bach@Mui, career=Quan Loc@Mao
    expect(rel.opposite).toBe('Ty2');
    expect(rel.wealth).toBe('Mui');
    expect(rel.career).toBe('Mao');
  });
});
