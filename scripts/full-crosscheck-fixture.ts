/**
 * So sanh TU DONG, TOAN DIEN buildChart() that voi fixture PHAM_DUY_FULL_REFERENCE (transcribe
 * tu anh reference #1, da qua nguoi dung tu soat lai lan cuoi — xem
 * test/chart/fixtures/pham-duy-full.ts).
 *
 * Day la buoc DUT DIEM thay the cho doi chieu tay tung phan — chay 1 lan, liet ke day du
 * khop/thieu/thua cho MOI cung, MOI loai du lieu: chinh tinh (CHI SO TEN/VI TRI, KHONG so do
 * sang — xem ghi chu "KHONG SO DO SANG" duoi day), tap hop phu tinh gop chung (minor+
 * adjective+boshi+jiangqian+suiqian TINH), Tu Hoa (so theo LOAI), Tuan/Triet, sao Luu Nien.
 *
 * KHONG SO DO SANG: iztro dung thang 7 muc (Mieu/Vuong/Dac/Loi/Binh/Bat/Han), anh goc tuvi.vn
 * chu thich 5 muc (M/V/D/B/H) — KHONG CO PHEP QUY DOI TRUNG LAP giua 2 thang (Known Issue da
 * dong tu 2026-08-16, xem design doc muc 7: "khac trường phai/quy uoc hien thi hop le", khong
 * phai bug). So do sang van con lam trong scripts/crosscheck-report.ts (dung fixture rieng
 * PHAM_DUY_REFERENCE co du lieu do sang 5-muc chuan). Script nay CHI so su co mat/vi tri cua
 * sao, khong so muc do sang — tranh bao "loi" gia cho 1 Known Issue da dong.
 *
 * DA BIET KHONG TON TAI TRONG iztro (nhom 2 — khac thu vien, KHONG phai loi, xem design doc
 * cac vong 2026-08-25): danh sach nay dung de LOAI TRU khoi bao cao "van de", tranh nhieu lan
 * bao dung 1 Known Issue da dong.
 *
 * Chay: npx tsx scripts/full-crosscheck-fixture.ts
 */
import { buildChart } from '../src/chart/index.js';
import { palaceOfBranch } from '../src/chart/queries.js';
import { starIdFromVi } from '../src/chart/star-id-map.js';
import { PHAM_DUY_FULL_REFERENCE } from '../test/chart/fixtures/pham-duy-full.js';
import type { Branch, ChartPalace, SihuaType } from '../src/chart/types.js';

/** Sao/nhan da xac nhan KHONG TON TAI trong iztro (grep toan bo vocabulary, nhieu vong doi
 * chieu — xem docs/superpowers/specs/2026-08-16-chart-engine-design.md muc 7, cac ban cap
 * nhat 2026-08-25). Loai khoi bao cao "THIEU" vi day la gioi han thu vien da biet, khong phai
 * van de moi can xem lai moi lan chay script. */
const KNOWN_NOT_IN_IZTRO = new Set([
  'Đầu Quân', 'Thiếu Âm', 'Thiếu Dương', 'Đào Hoa', 'Thiên Giải', 'Lưu Hà', 'Thiên La',
  'Văn Tinh', 'Địa Giải', 'Thái Tuế', 'Tử Phù', 'Thiên Y', 'Đường Phù', 'Địa Võng',
  'Quốc Ấn', 'Trực Phù',
  // "Phúc Đức" (tap tinh, anh goc ghi tai cung Menh) LA TEN CUNG THU 12 trong iztro
  // (spiritPalace), khong phai ten tap tinh trong star.js — xac nhan 2026-08-25, xem design
  // doc muc 7.
  'Phúc Đức',
]);

/** Sao CO ton tai trong iztro nhung o CUNG KHAC voi vi tri anh goc ghi — da xac nhan qua
 * nguoi dung tu doi chieu lai anh goc (khong phai loi transcribe, la khac biet an sao that
 * giua iztro va tuvi.vn). Bao cao RIENG, khong gop chung voi "THIEU that/can dieu tra".
 *
 * Muc do tin cay KHONG DONG DEU: Giai Than/Thien Quy/Phi Liem la 3 sao le, khac 1 cung don
 * gian. "Dai Hao" KHAC — no thuoc vong suiqian12 (Tue Tien) da biet co CA VI TRI LAN TEN GOI
 * phu thuoc algorithm (xem design doc 2026-08-21). iztro/zhongzhou dat "Dai Hao" (nhan cua
 * algorithm 'default' tai vi tri #7 vong Tue Tien) o Dau — anh goc tuvi.vn lai in "Dai Hao"
 * o Dan. Day KHONG chi la "khac ten cung 1 vi tri" nhu case Thai Tue/Tue Kien — co the tuvi.vn
 * neo vong Tue Tien theo quy tac offset khac han, hoac dung he dat ten rieng cho vong nay.
 * Xep nhom 2 (khac truong phai) nhung MUC TIN CAY THAP HON — can nguon xac nhan them neu
 * muon hieu ro co che, chua chi dung o muc "chap nhan khac nhau roi bo qua". */
const KNOWN_DIFFERENT_PALACE: Readonly<Record<string, { fixtureBranch: string; actualBranch: string }>> = {
  'Giải Thần': { fixtureBranch: 'Than', actualBranch: 'Thin' },
  'Thiên Quý': { fixtureBranch: 'Ty', actualBranch: 'Than' },
  'Phi Liêm': { fixtureBranch: 'Hoi', actualBranch: 'Tuat' },
  'Đại Hao': { fixtureBranch: 'Dan', actualBranch: 'Dau' },
};

/** Ten hien thi trong anh goc (khong tien to "L.") -> ten THAT ma iztro dung cho phien ban
 * "luu nien" cua no, DE TRA QUA starIdFromVi. Chi 10 sao nay co phien ban luu nien trong iztro
 * (xem star-id-map.ts dong 90-106) — MOI ten khac voi tien to "L." trong fixture (VD "L.Thai
 * Tue", "L.Hoa Ky", "L.Dai Hao"...) KHONG thuoc nhom nay, se duoc xu ly rieng ben duoi (thuoc
 * yearlyDecStar hoac Tu Hoa luu nien — Chart Engine CHUA doc, xem Known Issue 2026-08-25).
 */
const LUU_NIEN_DISPLAY_TO_IZTRO_NAME: Readonly<Record<string, string>> = {
  'Thiên Khôi': 'Lưu Khôi',
  'Thiên Việt': 'Lưu Việt',
  'Văn Xương': 'Lưu Xương',
  'Văn Khúc': 'Lưu Khúc',
  'Hồng Loan': 'Lưu Loan',
  'Thiên Hỷ': 'Lưu Hỷ',
  'Lộc Tồn': 'Lưu Lộc',
  'Kình Dương': 'Lưu Dương',
  'Đà La': 'Lưu Đà',
  'Thiên Mã': 'Lưu Mã',
};

const SIHUA_VI_TO_TYPE: Readonly<Record<string, SihuaType>> = {
  'Hóa Lộc': 'Loc', 'Hóa Quyền': 'Quyen', 'Hóa Khoa': 'Khoa', 'Hóa Kỵ': 'Ky',
};

function parseMajorStarName(entry: string): string {
  const match = entry.match(/^(.+?)\s*\([^)]+\)$/);
  return (match ? match[1] : entry).trim();
}

function classifyEntry(entry: string): { kind: 'sihua'; type: SihuaType } | { kind: 'star'; name: string } {
  if (entry in SIHUA_VI_TO_TYPE) return { kind: 'sihua', type: SIHUA_VI_TO_TYPE[entry] };
  const match = entry.match(/^(.+?)\s*\([^)]+\)$/);
  return { kind: 'star', name: (match ? match[1] : entry).trim() };
}

function gatherIztroMinorSet(p: ChartPalace): Set<string> {
  const ids = new Set<string>();
  for (const s of p.minor_stars) ids.add(s.star_id);
  for (const s of p.adjective_stars) ids.add(s.star_id);
  return ids;
}

const chart = buildChart({
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
  view_year: PHAM_DUY_FULL_REFERENCE.view_year,
});

let realIssues = 0;
let excludedKnown = 0;

console.log('===== PHAN A: CHINH TINH (chi so TEN/VI TRI, KHONG so do sang — xem ghi chu dau file) =====\n');
for (const ref of PHAM_DUY_FULL_REFERENCE.palaces) {
  const actual = palaceOfBranch(chart, ref.branch as Branch);
  const refIds = ref.major_stars.map(parseMajorStarName).map((n) => starIdFromVi(n)).sort();
  const actualIds = actual.major_stars.map((s) => s.star_id).sort();
  const ok = JSON.stringify(refIds) === JSON.stringify(actualIds);
  if (!ok) realIssues++;
  console.log(`${ref.branch.padEnd(4)} | ${ref.palace_name.padEnd(12)} | [${ok ? 'KHOP' : 'LECH SAO/VI TRI'}]`);
  if (!ok) {
    console.log(`     fixture: ${refIds.join(', ') || '(khong co)'}`);
    console.log(`     iztro:   ${actualIds.join(', ') || '(khong co)'}`);
  }
}

console.log('\n===== PHAN B: PHU TINH + TAP TINH + BOSHI/JIANGQIAN/SUIQIAN (so SET gop chung) =====\n');
for (const ref of PHAM_DUY_FULL_REFERENCE.palaces) {
  const actual = palaceOfBranch(chart, ref.branch as Branch);
  const iztroSet = gatherIztroMinorSet(actual);
  const iztroCycleNames = new Set([actual.boshi, actual.jiangqian, actual.suiqian]);

  const refStarEntries: string[] = [];
  const refSihuaTypes: SihuaType[] = [];
  for (const entry of ref.minor_and_adjective) {
    const classified = classifyEntry(entry);
    if (classified.kind === 'sihua') refSihuaTypes.push(classified.type);
    else refStarEntries.push(classified.name);
  }

  const missing: string[] = [];
  const matchedViaCycle: string[] = [];
  const excludedKnownNames: string[] = [];
  const knownDifferentPalaceNames: string[] = [];
  const refIdsFound: string[] = [];
  for (const name of refStarEntries) {
    if (KNOWN_NOT_IN_IZTRO.has(name)) {
      excludedKnownNames.push(name);
      excludedKnown++;
      continue;
    }
    let id: string;
    try {
      id = starIdFromVi(name);
    } catch {
      if (iztroCycleNames.has(name)) {
        matchedViaCycle.push(name);
      } else {
        missing.push(`${name} (KHONG CO trong bang star_id VA khong khop boshi/jiangqian/suiqian — CAN DIEU TRA, chua nam trong danh sach da biet)`);
      }
      continue;
    }
    refIdsFound.push(id);
    if (!iztroSet.has(id)) {
      const knownDiff = KNOWN_DIFFERENT_PALACE[name];
      if (knownDiff && knownDiff.fixtureBranch === ref.branch) {
        knownDifferentPalaceNames.push(`${name} (thuc te o cung ${knownDiff.actualBranch})`);
        excludedKnown++;
      } else {
        missing.push(`${name} (${id})`);
      }
    }
  }

  const extra: string[] = [];
  const refIdsSet = new Set(refIdsFound);
  for (const id of iztroSet) {
    if (!refIdsSet.has(id)) extra.push(id);
  }

  const sihuaMismatch: string[] = [];
  const actualSihuaTypes = new Set(actual.sihua.map((s) => s.type));
  for (const type of refSihuaTypes) {
    if (!actualSihuaTypes.has(type)) sihuaMismatch.push(`Hóa ${type}`);
  }

  const tuanActual = actual.adjective_stars.some((s) => s.star_id === 'TUAN_KHONG');
  const trietActual = actual.adjective_stars.some((s) => s.star_id === 'TRIET_KHONG' || s.star_id === 'TRIET_LO');
  const tuanMismatch = ref.has_tuan !== tuanActual;
  const trietMismatch = ref.has_triet !== trietActual;

  const hasIssue = missing.length > 0 || sihuaMismatch.length > 0 || tuanMismatch || trietMismatch;
  if (hasIssue) realIssues++;

  console.log(`${ref.branch.padEnd(4)} | ${ref.palace_name.padEnd(12)} | [${hasIssue ? 'CO VAN DE' : 'OK'}]`);
  if (missing.length > 0) console.log(`     THIEU (that): ${missing.join('; ')}`);
  if (excludedKnownNames.length > 0) console.log(`     (loai tru — da biet khong ton tai trong iztro: ${excludedKnownNames.join(', ')})`);
  if (knownDifferentPalaceNames.length > 0) console.log(`     (loai tru — da biet o cung khac trong iztro, khac truong phai voi tuvi.vn, nguoi dung da xac nhan lai anh goc: ${knownDifferentPalaceNames.join(', ')})`);
  if (matchedViaCycle.length > 0) console.log(`     (khop qua boshi/jiangqian/suiqian: ${matchedViaCycle.join(', ')})`);
  if (extra.length > 0) console.log(`     THUA (chi tham khao, khong tinh loi — co the khac truong phai): ${extra.join(', ')}`);
  if (sihuaMismatch.length > 0) console.log(`     TU HOA LECH: ${sihuaMismatch.join('; ')}`);
  if (tuanMismatch) console.log(`     TUAN LECH: fixture=${ref.has_tuan} vs iztro=${tuanActual}`);
  if (trietMismatch) console.log(`     TRIET LECH: fixture=${ref.has_triet} vs iztro=${trietActual}`);
}

console.log('\n===== PHAN C: SAO LUU DONG (10 sao co phien ban Luu Nien trong iztro — xem LUU_NIEN_DISPLAY_TO_IZTRO_NAME) =====\n');

const unmappedLuuNienEntries: { branch: string; entry: string }[] = [];

for (const ref of PHAM_DUY_FULL_REFERENCE.palaces) {
  if (!chart.luu_nien) {
    console.log('KHONG CO chart.luu_nien -- kiem tra view_year truyen vao buildChart().');
    break;
  }
  const luuNienPalace = chart.luu_nien.palaces.find((p) => p.branch === ref.branch);
  const actualLuuNienIds = new Set((luuNienPalace?.stars ?? []).map((s) => s.star_id));

  const relevantRefEntries: string[] = [];
  for (const entry of ref.luu_nien_stars) {
    const displayName = entry.replace(/^L\./, '');
    if (displayName in LUU_NIEN_DISPLAY_TO_IZTRO_NAME) {
      relevantRefEntries.push(entry);
    } else {
      unmappedLuuNienEntries.push({ branch: ref.branch, entry });
    }
  }
  if (relevantRefEntries.length === 0) continue;

  const missing: string[] = [];
  const refIdsFound: string[] = [];
  for (const entry of relevantRefEntries) {
    const displayName = entry.replace(/^L\./, '');
    const iztroName = LUU_NIEN_DISPLAY_TO_IZTRO_NAME[displayName];
    const id = starIdFromVi(iztroName);
    refIdsFound.push(id);
    if (!actualLuuNienIds.has(id)) missing.push(`${entry} (${id})`);
  }

  const extra: string[] = [];
  const refIdsSet = new Set(refIdsFound);
  for (const id of actualLuuNienIds) {
    if (!refIdsSet.has(id)) extra.push(id);
  }

  const hasIssue = missing.length > 0;
  if (hasIssue) realIssues++;
  console.log(`${ref.branch.padEnd(4)} | ${ref.palace_name.padEnd(12)} | [${hasIssue ? 'THIEU' : 'OK'}]`);
  if (missing.length > 0) console.log(`     THIEU: ${missing.join('; ')}`);
  if (extra.length > 0) console.log(`     THUA (chi tham khao): ${extra.join(', ')}`);
}

console.log('\n===== PHAN D: VONG LUU TUE TIEN/TUONG TIEN (LuuNienPalace.jiangqian/.suiqian, them 2026-08-25) =====\n');
console.log('("L.Thai Tue" la ten hien thi cua ANH GOC cho vi tri dau vong Luu Tue Tien —');
console.log(' iztro/zhongzhou goi vi tri nay la "Tue Kien" (cung mau hinh Thai Tue/Tue Kien');
console.log(' da xac nhan o vong tinh). Cac muc "L.Hoa X" (Tu Hoa luu nien) CHUA duoc kiem tra');
console.log(' o day — extractSihua() trong adapter.ts moi chi doc Tu Hoa BAN MENH, chua doc Tu');
console.log(' Hoa luu nien, day la Known Issue RIENG, xem cuoi file.)\n');

const luuThaiTueMap: Readonly<Record<string, string>> = { 'Thái Tuế': 'Tuế Kiện' };
let luuHoaLuuNienCount = 0;

for (const ref of PHAM_DUY_FULL_REFERENCE.palaces) {
  if (!chart.luu_nien) break;
  const luuNienPalace = chart.luu_nien.palaces.find((p) => p.branch === ref.branch);
  const cycleEntries = ref.luu_nien_stars.filter((e) => {
    const displayName = e.replace(/^L\./, '');
    return !(displayName in LUU_NIEN_DISPLAY_TO_IZTRO_NAME) && !displayName.startsWith('Hóa ');
  });
  const sihuaLuuNienEntries = ref.luu_nien_stars.filter((e) => e.replace(/^L\./, '').startsWith('Hóa '));
  luuHoaLuuNienCount += sihuaLuuNienEntries.length;

  if (cycleEntries.length === 0) continue;

  const missing: string[] = [];
  for (const entry of cycleEntries) {
    const displayName = entry.replace(/^L\./, '');
    const expectedName = luuThaiTueMap[displayName] ?? displayName;
    const found = luuNienPalace?.jiangqian === expectedName || luuNienPalace?.suiqian === expectedName;
    if (!found) missing.push(`${entry} (ky vong "${expectedName}", thuc te jiangqian="${luuNienPalace?.jiangqian}" suiqian="${luuNienPalace?.suiqian}")`);
  }

  const hasIssue = missing.length > 0;
  if (hasIssue) realIssues++;
  console.log(`${ref.branch.padEnd(4)} | ${ref.palace_name.padEnd(12)} | [${hasIssue ? 'THIEU' : 'OK'}]`);
  if (missing.length > 0) console.log(`     THIEU: ${missing.join('; ')}`);
}

console.log(`\n(Tu Hoa luu nien: ${luuHoaLuuNienCount} muc trong fixture "L.Hoa X" — CHUA verify, xem Known Issue duoi.)`);
excludedKnown += luuHoaLuuNienCount;

console.log(`\n===== TONG KET =====`);
console.log(`Van de THAT can xem lai: ${realIssues}`);
console.log(`Da loai tru (Known Issue da dong hoac chua co cho trong Chart Engine, khong tinh loi): ${excludedKnown}`);
