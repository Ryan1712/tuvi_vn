import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { palaceOfBranch } from '../../src/chart/queries.js';
import { starIdFromVi } from '../../src/chart/star-id-map.js';
import { PHAM_DUY_REFERENCE } from './fixtures/pham-duy.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('BUOC 2 — assertion cuoi cung theo ket qua phan loai', () => {
  const chart = buildChart(PHAM_DUY);

  it('vi tri 12 cung khop reference #1 (nhom: khop)', () => {
    for (const ref of PHAM_DUY_REFERENCE.palaces) {
      const actual = palaceOfBranch(chart, ref.branch);
      expect(actual, `cung tai ${ref.branch}`).toBeDefined();
    }
    expect(chart.palaces).toHaveLength(12);
  });

  it('vi tri chinh tinh tung cung khop reference #1 (nhom: khop)', () => {
    for (const ref of PHAM_DUY_REFERENCE.palaces) {
      const actual = palaceOfBranch(chart, ref.branch);
      const actualIds = actual.major_stars.map((s) => s.star_id).sort();
      const refIds = ref.major_stars.map((s) => starIdFromVi(s.name)).sort();
      expect(actualIds, `chinh tinh tai ${ref.branch}`).toEqual(refIds);
    }
  });

  it('Menh/Than dong cung tai Hoi (nhom: khop)', () => {
    expect(chart.menh_than.menh_branch).toBe('Hoi');
    expect(chart.menh_than.than_branch).toBe('Hoi');
    expect(chart.menh_than.same_palace).toBe(true);
  });

  it('Cuc + nap am khop reference #1 (nhom: khop)', () => {
    expect(chart.cuc.raw).toBe(PHAM_DUY_REFERENCE.cuc);
    expect(chart.ban_menh_nap_am).toBe(PHAM_DUY_REFERENCE.ban_menh_nap_am);
  });

  it('chu than khop reference #1 (nhom: khop)', () => {
    expect(chart.menh_than.body_star).toBe(PHAM_DUY_REFERENCE.body_star);
  });

  // NHOM 2 — khac truong phai hop le. Assertion theo OUTPUT THAT cua iztro,
  // CHU DICH khong khop reference #1. Xem bao cao cross-check de biet ly do.
  it('do sang theo thang 7 muc cua iztro, khong ep khop tuvi.vn (nhom 2)', () => {
    const menh = palaceOfBranch(chart, 'Hoi');
    const thienDong = menh.major_stars.find((s) => s.star_id === 'THIEN_DONG');
    // iztro: Mieu | tuvi.vn: Dac. Bang do sang khac nhau giua 2 truong phai.
    // KHONG sua config iztro de ep ve 'dac'.
    expect(thienDong?.strength).toBe('mieu');
  });

  it('ten cung theo iztro (Tu Nu), reference #1 dung Tu Tuc — di ban ten (nhom 2)', () => {
    expect(palaceOfBranch(chart, 'Than').palace_name).toBe('Tử Nữ');
  });

  // NHOM 2 — khac truong phai hop le, DA TIM DUOC CAN CU CODE CU THE trong task nay
  // (truoc day treo o nhom 3 "chua xac dinh", nay da dieu tra xong).
  //
  // Doc truc tiep node_modules/iztro/lib/astro/astro.js:
  //   var soul = t(earthlyBranches[getConfig().algorithm === 'zhongzhou'
  //     ? earthlyBranchOfYear : earthlyBranchOfSoulPalace].soul);
  // Chu menh KHONG duoc tinh tu sao dang o cung Menh — no tra theo 1 bang co dinh
  // theo dia chi, va dia chi dung de tra phu thuoc config `algorithm`:
  //   - 'default' (mac dinh cua iztro, truong phai "thong dung"): tra theo dia chi
  //     CUNG MENH (Hoi) -> earthlyBranches.haiEarthly.soul = 'jumenMaj' = Cu Mon.
  //   - 'zhongzhou' (Trung Chau phai): tra theo dia chi NAM SINH (Dan, nam Mau Dan)
  //     -> earthlyBranches.yinEarthly.soul = 'lucunMin' = Loc Ton — khop dung
  //     reference #1.
  // Da xac minh thuc nghiem: goi iztro voi cung input, doi algorithm sang 'zhongzhou'
  // cho ra dung "Loc Ton". Day la khac biet TRUONG PHAI (chon dia chi goc de tra chu
  // menh), khong phai bug. KHONG doi `algorithm` sang 'zhongzhou' trong code san pham:
  // do la 1 config toan cuc anh huong ca cac field khac (vd fiveElementsClass) chua
  // duoc khao sat day du chi de khop 1 field cua 1 case test — xem Known Issues.
  it('chu menh: iztro cho Cu Mon (thuat toan "default"/thong dung), reference #1 cho Loc Ton (thuat toan "zhongzhou"/Trung Chau phai) — khac truong phai, da co can cu code (nhom 2)', () => {
    expect(chart.menh_than.soul_star).toBe('Cự Môn');
  });
});
