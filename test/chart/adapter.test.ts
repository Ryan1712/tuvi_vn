import { describe, it, expect } from 'vitest';
import { astro } from 'iztro';
import { adaptFromIztro, parseFiveElementsClass } from '../../src/chart/adapter.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY_INPUT: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

function buildPhamDuy() {
  const astrolabe = astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN');
  return adaptFromIztro(astrolabe, PHAM_DUY_INPUT);
}

describe('parseFiveElementsClass', () => {
  it('tach chuoi gop thanh ngu_hanh + cuc_so', () => {
    expect(parseFiveElementsClass('Thủy Nhị Cục')).toEqual({
      ngu_hanh: 'Thuy', cuc_so: 2, raw: 'Thủy Nhị Cục',
    });
    expect(parseFiveElementsClass('Mộc Tam Cục')).toEqual({
      ngu_hanh: 'Moc', cuc_so: 3, raw: 'Mộc Tam Cục',
    });
    expect(parseFiveElementsClass('Kim Tứ Cục')).toEqual({
      ngu_hanh: 'Kim', cuc_so: 4, raw: 'Kim Tứ Cục',
    });
    expect(parseFiveElementsClass('Thổ Ngũ Cục')).toEqual({
      ngu_hanh: 'Tho', cuc_so: 5, raw: 'Thổ Ngũ Cục',
    });
    expect(parseFiveElementsClass('Hỏa Lục Cục')).toEqual({
      ngu_hanh: 'Hoa', cuc_so: 6, raw: 'Hỏa Lục Cục',
    });
  });

  it('nem loi voi cuc khong nhan dang duoc', () => {
    expect(() => parseFiveElementsClass('Cục Bịa')).toThrowError(/khong nhan dang/i);
  });
});

describe('adaptFromIztro — case Pham Duy', () => {
  it('map metadata dung', () => {
    const chart = buildPhamDuy();
    expect(chart.metadata.birth_solar_date).toBe('1998-12-17');
    expect(chart.metadata.chinese_date).toBe('Mậu Dần - Quý Hợi - Kỷ Hợi - Giáp Tý');
    expect(chart.metadata.gender).toBe('nam');
    expect(chart.metadata.calendar_type).toBe('duong_lich');
    expect(chart.metadata.year_can_chi).toBe('Mậu Dần');
    expect(chart.metadata.time_range).toBe('23:00~00:00');
  });

  it('map menh/than dung — dong cung tai Hoi', () => {
    const chart = buildPhamDuy();
    expect(chart.menh_than.menh_branch).toBe('Hoi');
    expect(chart.menh_than.than_branch).toBe('Hoi');
    expect(chart.menh_than.same_palace).toBe(true);
    expect(chart.menh_than.body_star).toBe('Thiên Lương');
  });

  it('map cuc + nap am dung', () => {
    const chart = buildPhamDuy();
    expect(chart.cuc.ngu_hanh).toBe('Thuy');
    expect(chart.cuc.cuc_so).toBe(2);
    expect(chart.ban_menh_nap_am).toBe('Thành Đầu Thổ');
  });

  it('co du 12 cung, moi cung co branch hop le va khong trung nhau', () => {
    const chart = buildPhamDuy();
    expect(chart.palaces).toHaveLength(12);
    const branches = chart.palaces.map((p) => p.branch);
    expect(new Set(branches).size).toBe(12);
  });

  it('cung Menh tai Hoi co Thien Dong + Dia Khong + Dia Kiep', () => {
    const chart = buildPhamDuy();
    const menh = chart.palaces.find((p) => p.branch === 'Hoi');
    expect(menh).toBeDefined();
    expect(menh!.palace_name).toBe('Mệnh');
    expect(menh!.is_body_palace).toBe(true);
    expect(menh!.major_stars.map((s) => s.star_id)).toContain('THIEN_DONG');
    expect(menh!.minor_stars.map((s) => s.star_id)).toEqual(
      expect.arrayContaining(['DIA_KHONG', 'DIA_KIEP']),
    );
  });

  it('map tu hoa ban menh dung bang Can Mau', () => {
    const chart = buildPhamDuy();
    const allSihua = chart.palaces.flatMap((p) =>
      p.sihua.map((s) => `${s.star_id}:${s.type}`),
    );
    // Build spec muc 3: Mau -> Tham Lang Loc, Thai Am Quyen, Huu Bat Khoa, Thien Co Ky
    expect(allSihua).toEqual(
      expect.arrayContaining([
        'THAM_LANG:Loc',
        'THAI_AM:Quyen',
        'HUU_BAT:Khoa',
        'THIEN_CO:Ky',
      ]),
    );
    expect(allSihua).toHaveLength(4);
  });

  it('map dai van — 12 moc, moc dau tai cung Menh', () => {
    const chart = buildPhamDuy();
    expect(chart.luck_cycles.dai_van).toHaveLength(12);
    const first = chart.luck_cycles.dai_van[0]!;
    expect(first.age_from).toBe(2);
    expect(first.age_to).toBe(11);
    expect(first.branch).toBe('Hoi');
  });

  it('map tieu van — 12 cung, moi cung co danh sach tuoi', () => {
    const chart = buildPhamDuy();
    expect(chart.luck_cycles.tieu_van).toHaveLength(12);
    for (const tv of chart.luck_cycles.tieu_van) {
      expect(tv.ages.length).toBeGreaterThan(0);
    }
  });

  it('ghi ro trong engine_meta rang luu_nien co chu dich khong nam trong Chart', () => {
    const chart = buildPhamDuy();
    expect(chart.engine_meta.notes.some((n) => n.includes('luu_nien'))).toBe(true);
  });

  it('map type cho minor_stars — Dia Khong va Dia Kiep la tough', () => {
    const chart = buildPhamDuy();
    const menh = chart.palaces.find((p) => p.branch === 'Hoi')!;
    const diaKhong = menh.minor_stars.find((s) => s.star_id === 'DIA_KHONG');
    const diaKiep = menh.minor_stars.find((s) => s.star_id === 'DIA_KIEP');
    expect(diaKhong?.type).toBe('tough');
    expect(diaKiep?.type).toBe('tough');
  });

  it('map ngu hanh cung va vong 12 than cho cung Menh (Hoi)', () => {
    const chart = buildPhamDuy();
    const menh = chart.palaces.find((p) => p.branch === 'Hoi')!;
    expect(menh.branch_element).toBe('Thuy');
    expect(menh.truong_sinh).toBe('Lâm Quan');
    expect(menh.boshi).toBe('Phi Liêm');
    expect(menh.jiangqian).toBe('Kiếp Sát');
    expect(menh.suiqian).toBe('Thiên Đức');
  });

  it('luu_nien la undefined khi khong co view_year', () => {
    const chart = buildPhamDuy();
    expect(chart.luu_nien).toBeUndefined();
  });
});

describe('adaptFromIztro — Luu Nien (view_year)', () => {
  it('dien Chart.luu_nien dung khi co view_year, index khop astrolabe.palaces', () => {
    const chart = adaptFromIztro(
      astro.bySolar('1998-12-17', 12, 'male', true, 'vi-VN'),
      {
        calendar_type: 'duong_lich',
        date: '1998-12-17',
        time_index: 12,
        gender: 'nam',
        fix_leap: true,
        view_year: '2026-01-01',
      },
    );
    expect(chart.luu_nien).toBeDefined();
    expect(chart.luu_nien!.year).toBe(2026);
    expect(chart.luu_nien!.palaces).toHaveLength(12);
    // Cung Hoi (index 9 trong astrolabe.palaces) mang ten Luu Nien "Thiên Di" cho nam 2026
    // (re-verified for real while writing this plan — an earlier brainstorming pass had
    // mixed up results between two different view_year runs and briefly wrote "Mệnh" here;
    // caught by actually running the assertion, not by re-deriving it from memory).
    const hoiLuuNien = chart.luu_nien!.palaces.find((p) => p.branch === 'Hoi');
    expect(hoiLuuNien?.palace_name).toBe('Thiên Di');
  });
});
