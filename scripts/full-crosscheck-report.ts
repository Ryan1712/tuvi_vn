/**
 * Bao cao doi chieu DAY DU 12 cung (khong dung lai o vai diem mau) — chay sau khi doi
 * algorithm sang 'zhongzhou' (2026-08-21), truoc khi build lai mockup UI.
 *
 * Pham vi TU DONG so sanh: CHINH TINH + DO SANG — fixture PHAM_DUY_REFERENCE (transcript
 * tu anh reference #1) da co du lieu chuan cho phan nay, khong can phan loai gi them.
 *
 * Pham vi CHI LIET KE (khong tu dong gan nhan khop/lech): phu tinh + tap tinh
 * (minor_stars/adjective_stars). Bang "phu tinh noi bat" cu trong design doc muc 6 tron
 * lan nhieu vong sao khac nhau (phu tinh chinh thuc, vong Bac Sy/Luc Sy, Tu Hoa...) —
 * TU PHAN LOAI LAI se doi hoi kien thuc Tu Vi chuyen sau, rui ro tu doan sai (dung loai
 * loi CLAUDE.md muc 6/9 canh bao). Con nguoi doi chieu bang mat voi anh goc, khong may
 * tu dong gan nhan dung/sai cho phan nay.
 *
 * Chay: npx tsx scripts/full-crosscheck-report.ts
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

const REF_BRIGHTNESS: Readonly<Record<string, string>> = {
  M: 'mieu', V: 'vuong', D: 'dac', B: 'binh', H: 'ham',
};
const BRIGHTNESS_VI: Readonly<Record<string, string>> = {
  mieu: 'Miếu', vuong: 'Vượng', dac: 'Đắc', loi: 'Lợi', binh: 'Bình', bat: 'Bất', ham: 'Hãm',
};

const chart = buildChart(PHAM_DUY);

console.log('===== PHAN A: CHINH TINH + DO SANG (tu dong so, du lieu chuan tu fixture) =====\n');

let matchCount = 0;
let mismatchCount = 0;

for (const ref of PHAM_DUY_REFERENCE.palaces) {
  const actual = palaceOfBranch(chart, ref.branch);
  const actualStars = actual.major_stars
    .map((s) => `${s.star_id}(${s.strength ? BRIGHTNESS_VI[s.strength] ?? s.strength : '?'})`)
    .join(', ') || '(vo chinh dieu)';
  const refStars = ref.major_stars.map((s) => `${s.name}(${s.brightness})`).join(', ') || '(vo chinh dieu)';

  const nameMatch = actual.palace_name === ref.palace_name;
  const actualIds = actual.major_stars.map((s) => s.star_id).sort();
  const refIds = ref.major_stars.map((s) => starIdFromVi(s.name)).sort();
  const starsMatch = JSON.stringify(actualIds) === JSON.stringify(refIds);

  let brightnessMatch = true;
  const brightnessNotes: string[] = [];
  for (const refStar of ref.major_stars) {
    const match = actual.major_stars.find((s) => s.star_id === starIdFromVi(refStar.name));
    if (!match) continue;
    const expected = REF_BRIGHTNESS[refStar.brightness];
    if (match.strength !== expected) {
      brightnessMatch = false;
      brightnessNotes.push(`${refStar.name}: iztro=${match.strength} vs ref=${refStar.brightness}`);
    }
  }

  const overallMatch = nameMatch && starsMatch && brightnessMatch;
  if (overallMatch) matchCount++; else mismatchCount++;

  const status = overallMatch ? 'KHOP' : (starsMatch ? 'LECH DO SANG' : 'LECH SAO/TEN');
  console.log(`${ref.branch.padEnd(4)} | ${(ref.palace_name + (nameMatch ? '' : ` (iztro: ${actual.palace_name})`)).padEnd(20)} | [${status}]`);
  console.log(`     iztro: ${actualStars}`);
  console.log(`     ref:   ${refStars}`);
  if (brightnessNotes.length > 0) console.log(`     lech do sang: ${brightnessNotes.join('; ')}`);
  console.log('');
}

console.log(`Tong ket Phan A: ${matchCount}/12 cung khop hoan toan, ${mismatchCount}/12 cung co lech.\n`);

console.log('===== PHAN B: PHU TINH + TAP TINH (chi liet ke, KHONG tu dong gan nhan) =====\n');
console.log('(Doi chieu bang mat voi anh goc — xem ghi chu dau file ve ly do khong tu dong hoa phan nay)\n');

for (const p of chart.palaces) {
  const minors = p.minor_stars.map((s) => s.star_id).join(', ') || '(khong co)';
  const adjectives = p.adjective_stars.map((s) => s.star_id).join(', ') || '(khong co)';
  console.log(`${p.branch.padEnd(4)} | ${p.palace_name}`);
  console.log(`     minor_stars:     ${minors}`);
  console.log(`     adjective_stars: ${adjectives}`);
  console.log(`     truong_sinh:     ${p.truong_sinh}`);
  console.log(`     boshi (Bac Sy):      ${p.boshi}`);
  console.log(`     jiangqian (Tuong Tien): ${p.jiangqian}`);
  console.log(`     suiqian (Tue Tien):     ${p.suiqian}`);
  console.log('');
}

console.log('===== PHAN C: CAC FIELD KHAC =====\n');
console.log(`Chu menh: iztro="${chart.menh_than.soul_star}" ref="${PHAM_DUY_REFERENCE.soul_star}" — ${chart.menh_than.soul_star === PHAM_DUY_REFERENCE.soul_star ? 'KHOP' : 'LECH'}`);
console.log(`Chu than: iztro="${chart.menh_than.body_star}" ref="${PHAM_DUY_REFERENCE.body_star}" — ${chart.menh_than.body_star === PHAM_DUY_REFERENCE.body_star ? 'KHOP' : 'LECH'}`);
console.log(`Cuc:      iztro="${chart.cuc.raw}" ref="${PHAM_DUY_REFERENCE.cuc}" — ${chart.cuc.raw === PHAM_DUY_REFERENCE.cuc ? 'KHOP' : 'LECH'}`);
console.log(`Nap am:   iztro="${chart.ban_menh_nap_am}" ref="${PHAM_DUY_REFERENCE.ban_menh_nap_am}" — ${chart.ban_menh_nap_am === PHAM_DUY_REFERENCE.ban_menh_nap_am ? 'KHOP' : 'LECH'}`);
