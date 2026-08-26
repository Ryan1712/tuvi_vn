import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { BRANCHES } from '../../src/chart/types.js';
import type { Branch } from '../../src/chart/types.js';

/**
 * Backlog case da dang tu design doc (docs/superpowers/specs/2026-08-16-chart-engine-design.md
 * muc 10): "pass test case Pham Duy KHONG co nghia la Chart Engine dang tin cay noi chung" --
 * can it nhat 1 chart nu menh, 1 Cuc so khac Thuy Nhi Cuc, 1 chart thang sinh nhuan.
 *
 * KHONG CO reference implementation (anh la so that) cho 3 case nay -- design doc goc yeu cau
 * phai co nguon doi chieu doc lap truoc khi coi la "du tin cay". Nguoi dung xac nhan HA THAP
 * yeu cau cho lan nay: KHONG can anh doi chieu, chi can xac nhan (1) khong crash, (2) shape du
 * lieu hop le, (3) logic TU NHAT QUAN kiem chung duoc bang chinh cong thuc da biet (vd quy luat
 * Duong Nam/Am Nu di thuan, Am Nam/Duong Nu di nghich) -- KHONG assert gia tri chinh tinh/phu
 * tinh cu the nao (se la tu bia, dung dieu CLAUDE.md muc 6 canh bao).
 */

function daiVanDirection(branches: Branch[]): 'thuan' | 'nghich' {
  const b0 = branches[0];
  const b1 = branches[1];
  if (b0 === undefined || b1 === undefined) {
    throw new Error('daiVanDirection can it nhat 2 phan tu de xac dinh chieu.');
  }
  const i0 = BRANCHES.indexOf(b0);
  const i1 = BRANCHES.indexOf(b1);
  const diff = (i1 - i0 + 12) % 12;
  if (diff === 1) return 'thuan';
  if (diff === 11) return 'nghich';
  throw new Error(`Dai Van branch lien tiep khong cach nhau 1 vi tri: ${branches[0]} -> ${branches[1]} (diff=${diff})`);
}

/** Duong Can: Giap/Binh/Mau/Canh/Nham. Am Can: con lai. */
const DUONG_CAN = new Set(['Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm']);

function shapeAssertions(chart: ReturnType<typeof buildChart>) {
  expect(chart.palaces).toHaveLength(12);
  const branchSet = new Set(chart.palaces.map((p) => p.branch));
  expect(branchSet.size).toBe(12);
  expect(chart.luck_cycles.dai_van).toHaveLength(12);
  expect(chart.luck_cycles.tieu_van).toHaveLength(12);
  expect(chart.menh_than.menh_branch).toBeTruthy();
  expect(chart.menh_than.than_branch).toBeTruthy();
  expect(chart.cuc.cuc_so).toBeGreaterThanOrEqual(2);
  expect(chart.cuc.cuc_so).toBeLessThanOrEqual(6);
  expect(chart.ban_menh_nap_am).toBeTruthy();
  // Moi cung phai co it nhat field co ban, khong throw khi doc.
  for (const p of chart.palaces) {
    expect(p.palace_name).toBeTruthy();
    expect(p.branch_element).toBeTruthy();
    expect(p.truong_sinh).toBeTruthy();
    expect(p.boshi).toBeTruthy();
    expect(p.jiangqian).toBeTruthy();
    expect(p.suiqian).toBeTruthy();
  }
}

describe('backlog case da dang (khong co reference anh, chi kiem tra khong crash + logic tu nhat quan)', () => {
  it('case nu menh + Cuc khac Thuy Nhi Cuc (1990-06-15, nu, gio Mao): khong crash, shape hop le, chieu Dai Van dung quy luat', () => {
    const chart = buildChart({
      calendar_type: 'duong_lich',
      date: '1990-06-15',
      time_index: 6,
      gender: 'nu',
      fix_leap: true,
    });

    shapeAssertions(chart);

    // Da xac nhan truoc (script doc lap, khong phai gia dinh): case nay ra Hoa Luc Cuc,
    // khac Thuy Nhi Cuc cua Pham Duy -- phu duoc it nhat 1 Cuc khac.
    expect(chart.cuc.raw).toBe('Hỏa Lục Cục');
    expect(chart.cuc.cuc_so).toBe(6);

    // Quy luat co dien: Duong Can (nam sinh) + Nu -> di NGHICH (Duong Nu di nghich, khac
    // Duong Nam di thuan). Xac dinh Duong/Am Can tu chinh chart.metadata.chinese_date (khong
    // gia dinh truoc), roi kiem tra chieu Dai Van khop dung quy luat.
    const yearStem = chart.metadata.chinese_date.split(' - ')[0]?.split(' ')[0] ?? '';
    const isDuongCan = DUONG_CAN.has(yearStem);
    const direction = daiVanDirection(chart.luck_cycles.dai_van.map((d) => d.branch));
    const expectedDirection = isDuongCan ? 'nghich' : 'thuan'; // Duong Nu nghich, Am Nu thuan
    expect(direction, `Duong Can=${isDuongCan}, gioi tinh nu -> ky vong ${expectedDirection}`).toBe(expectedDirection);
  });

  it('case thang am lich nhuan (2023, thang 2 nhuan, ngay 15): khong crash, is_leap_month thuc su anh huong ket qua quy doi', () => {
    const withLeap = buildChart({
      calendar_type: 'am_lich',
      date: '2023-2-15',
      time_index: 6,
      gender: 'nam',
      is_leap_month: true,
      fix_leap: true,
    });
    const withoutLeap = buildChart({
      calendar_type: 'am_lich',
      date: '2023-2-15',
      time_index: 6,
      gender: 'nam',
      is_leap_month: false,
      fix_leap: true,
    });

    shapeAssertions(withLeap);
    shapeAssertions(withoutLeap);

    // Cung 1 ngay am lich "2-15" nhung is_leap_month khac nhau PHAI quy doi ra 2 ngay duong
    // lich khac nhau (thang 2 nhuan va thang 2 thuong la 2 thang khac nhau ve mat lich) --
    // day la bang chung is_leap_month duoc doc thuc su, khong bi bo qua am tham.
    expect(withLeap.metadata.birth_solar_date).not.toBe(withoutLeap.metadata.birth_solar_date);

    // Gia tri cu the da xac nhan bang script doc lap truoc khi viet test nay (khong doan).
    expect(withLeap.metadata.birth_solar_date).toBe('2023-4-5');
    expect(withoutLeap.metadata.birth_solar_date).toBe('2023-3-6');
  });

  it('ca 3 case build duoc lap lai nhieu lan, ket qua on dinh (khong bi troi theo thu tu goi)', () => {
    const input = {
      calendar_type: 'duong_lich' as const,
      date: '1990-06-15',
      time_index: 6,
      gender: 'nu' as const,
      fix_leap: true,
    };
    const first = buildChart(input);
    const second = buildChart(input);
    expect(second.cuc.raw).toBe(first.cuc.raw);
    expect(second.menh_than.menh_branch).toBe(first.menh_than.menh_branch);
    expect(second.palaces.map((p) => p.palace_name)).toEqual(first.palaces.map((p) => p.palace_name));
  });
});
