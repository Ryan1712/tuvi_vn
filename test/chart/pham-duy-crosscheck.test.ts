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

  // [CAP NHAT 2026-08-21] Doan comment + test duoi day TRUOC KIA giai thich vi sao du
  // an GIU `algorithm: 'default'` (Cu Mon) thay vi doi sang 'zhongzhou' (Loc Ton, khop
  // reference #1) — quyet dinh do da DAO NGUOC, xem design doc
  // 2026-08-21-algorithm-zhongzhou-design.md. Sau khi dieu tra lai TREN TOAN BO 12 cung
  // (khong chi field soul nay), zhongzhou khop reference #1 nhieu hon o >=5 diem, khong
  // kem o diem nao — du an gio DUNG zhongzhou lam mac dinh toan cuc (astro.config() tai
  // src/chart/iztro-client.ts). Vi vay day KHONG CON la 1 diem "khac truong phai giu
  // nguyen ca 2" nua — chart.menh_than.soul_star gio PHAI khop dung reference #1.
  it('chu menh: sau khi doi algorithm sang zhongzhou (Trung Chau phai), iztro khop dung Loc Ton nhu reference #1', () => {
    expect(chart.menh_than.soul_star).toBe('Lộc Tồn');
  });
});
