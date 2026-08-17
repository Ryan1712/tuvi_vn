/**
 * Cong cu chan doan cho BUOC 1 cua quy trinh cross-check (design doc muc 8).
 *
 * In ra TOAN BO diem lech giua output iztro va reference #1 de con nguoi phan loai
 * theo 3 nhom o muc 7. KHONG phai test — khong pass/fail, khong assert.
 * Assertion cuoi cung nam trong test/chart/pham-duy-crosscheck.test.ts, viet SAU
 * khi da phan loai xong.
 *
 * Chay: npm run crosscheck
 */
import { buildChart } from '../src/chart/index.js';
import { palaceOfBranch } from '../src/chart/queries.js';
import { starIdFromVi } from '../src/chart/star-id-map.js';
import { PHAM_DUY_REFERENCE } from '../test/chart/fixtures/pham-duy.js';
import type { BuildChartInput } from '../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

/** Ky hieu do sang trong anh reference #1 -> gia tri Brightness cua ta. */
const REF_BRIGHTNESS: Readonly<Record<string, string>> = {
  M: 'mieu', V: 'vuong', D: 'dac', B: 'binh', H: 'ham',
};

function collectDiffs(): string[] {
  const chart = buildChart(PHAM_DUY);
  const diffs: string[] = [];

  for (const ref of PHAM_DUY_REFERENCE.palaces) {
    const actual = palaceOfBranch(chart, ref.branch);

    if (actual.palace_name !== ref.palace_name) {
      diffs.push(`[TEN CUNG] ${ref.branch}: iztro="${actual.palace_name}" ref="${ref.palace_name}"`);
    }

    const actualIds = actual.major_stars.map((s) => s.star_id).sort();
    const refIds = ref.major_stars.map((s) => starIdFromVi(s.name)).sort();
    if (JSON.stringify(actualIds) !== JSON.stringify(refIds)) {
      diffs.push(`[CHINH TINH] ${ref.branch}: iztro=[${actualIds}] ref=[${refIds}]`);
    }

    for (const refStar of ref.major_stars) {
      const match = actual.major_stars.find((s) => s.star_id === starIdFromVi(refStar.name));
      if (!match) continue; // da bao o dong [CHINH TINH] o tren
      const expected = REF_BRIGHTNESS[refStar.brightness];
      if (match.strength !== expected) {
        diffs.push(`[DO SANG] ${ref.branch} ${refStar.name}: iztro="${match.strength}" ref="${expected}"`);
      }
    }
  }

  if (chart.menh_than.soul_star !== PHAM_DUY_REFERENCE.soul_star) {
    diffs.push(`[CHU MENH] iztro="${chart.menh_than.soul_star}" ref="${PHAM_DUY_REFERENCE.soul_star}"`);
  }
  if (chart.menh_than.body_star !== PHAM_DUY_REFERENCE.body_star) {
    diffs.push(`[CHU THAN] iztro="${chart.menh_than.body_star}" ref="${PHAM_DUY_REFERENCE.body_star}"`);
  }
  if (chart.cuc.raw !== PHAM_DUY_REFERENCE.cuc) {
    diffs.push(`[CUC] iztro="${chart.cuc.raw}" ref="${PHAM_DUY_REFERENCE.cuc}"`);
  }
  if (chart.ban_menh_nap_am !== PHAM_DUY_REFERENCE.ban_menh_nap_am) {
    diffs.push(`[NAP AM] iztro="${chart.ban_menh_nap_am}" ref="${PHAM_DUY_REFERENCE.ban_menh_nap_am}"`);
  }

  return diffs;
}

const diffs = collectDiffs();
console.log('===== BAO CAO DIEM LECH: iztro vs reference #1 =====');
console.log(diffs.length === 0 ? '(khong co diem lech)' : diffs.join('\n'));
console.log(`\nTong: ${diffs.length} diem lech`);
