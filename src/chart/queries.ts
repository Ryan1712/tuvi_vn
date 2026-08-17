import { callIztro } from './iztro-client.js';
import { branchFromVi } from './star-id-map.js';
import type { Branch, BuildChartInput, Chart, ChartPalace } from './types.js';

export function palaceOfBranch(chart: Chart, branch: Branch): ChartPalace {
  const p = chart.palaces.find((x) => x.branch === branch);
  if (p === undefined) {
    throw new Error(`Khong tim thay cung o dia chi "${branch}"`);
  }
  return p;
}

export function palaceOfName(chart: Chart, name: string): ChartPalace {
  const p = chart.palaces.find((x) => x.palace_name === name);
  if (p === undefined) {
    throw new Error(`Khong tim thay cung ten "${name}"`);
  }
  return p;
}

/** Gom toan bo star_id trong 1 cung: chinh tinh + phu tinh + tap tinh. */
export function starsIn(chart: Chart, branch: Branch): Set<string> {
  const p = palaceOfBranch(chart, branch);
  return new Set([
    ...p.major_stars.map((s) => s.star_id),
    ...p.minor_stars.map((s) => s.star_id),
    ...p.adjective_stars.map((s) => s.star_id),
  ]);
}

/**
 * Tam phuong tu chinh cua 1 cung, UY QUYEN hoan toan cho `surroundedPalaces()` cua iztro.
 * KHONG tu viet lai bang tam hop/xung chieu (build spec muc 7).
 *
 * Luu y: `surroundedPalaces` tra ve tam phuong tu chinh (target + doi cung + tai bach + quan loc),
 * KHONG dong nghia "tam hop" thuan tuy theo nhom dia chi.
 *
 * DANH DOI DA CAN NHAC VA CHAP NHAN O v0.1: ham nay nhan `BuildChartInput` va goi lai
 * `callIztro`, tuc TINH LAI TOAN BO la so cho moi lan truy van quan he. Cach nay ton kem
 * hon viec luu san quan he vao Chart, nhung:
 *  - design doc muc 3 quy dinh quan he giua cung la static knowledge, KHONG luu trong Chart;
 *  - quan he nay chi phu thuoc dia chi, giong nhau o moi la so — luu vao tung Chart la
 *    nhan ban cung mot thong tin tinh;
 *  - Rule Engine (noi se goi nhieu lan) nam NGOAI pham vi phase nay (build spec muc 13).
 * Khi Rule Engine thuc su can, phuong an toi uu la dung bang quan he 12 chi MOT LAN tu
 * iztro roi tra bang — van khong tu go bang bang tay. Doi sau khong kho vi chi 1 ham.
 */
export function relatedPalaces(
  input: BuildChartInput,
  branch: Branch,
): { opposite: Branch; wealth: Branch; career: Branch } {
  const astrolabe = callIztro(input);
  const target = astrolabe.palaces.find((p) => branchFromVi(p.earthlyBranch) === branch);
  if (target === undefined) {
    throw new Error(`Khong tim thay cung o dia chi "${branch}"`);
  }
  const sp = astrolabe.surroundedPalaces(target.index);
  return {
    opposite: branchFromVi(sp.opposite.earthlyBranch),
    wealth: branchFromVi(sp.wealth.earthlyBranch),
    career: branchFromVi(sp.career.earthlyBranch),
  };
}
