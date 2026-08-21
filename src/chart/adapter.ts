import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace';
import {
  branchFromVi,
  brightnessFromVi,
  sihuaTypeFromVi,
  starIdFromVi,
} from './star-id-map.js';
import { napAmFromSolarDate } from './nap-am.js';
import { branchElement } from './branch-element.js';
import type {
  BuildChartInput,
  Chart,
  ChartPalace,
  Cuc,
  DaiVan,
  LuuNien,
  LuuNienPalace,
  MajorStar,
  MinorStar,
  NguHanh,
  Sihua,
  TieuVan,
} from './types.js';

const ENGINE_VERSION = '2.6.0';

/**
 * Tach chuoi cuc gop cua iztro ("Thuy Nhi Cuc") thanh ngu_hanh + cuc_so.
 * iztro chi co 5 gia tri co dinh (doc truc tiep tu lib/i18n/locales/vi-VN/fiveElementsClass).
 */
const FIVE_ELEMENTS: Readonly<Record<string, { ngu_hanh: NguHanh; cuc_so: 2 | 3 | 4 | 5 | 6 }>> = {
  'Thủy Nhị Cục': { ngu_hanh: 'Thuy', cuc_so: 2 },
  'Mộc Tam Cục': { ngu_hanh: 'Moc', cuc_so: 3 },
  'Kim Tứ Cục': { ngu_hanh: 'Kim', cuc_so: 4 },
  'Thổ Ngũ Cục': { ngu_hanh: 'Tho', cuc_so: 5 },
  'Hỏa Lục Cục': { ngu_hanh: 'Hoa', cuc_so: 6 },
};

export function parseFiveElementsClass(raw: string): Cuc {
  const parsed = FIVE_ELEMENTS[raw];
  if (parsed === undefined) {
    throw new Error(`Cuc "${raw}" khong nhan dang duoc. iztro chi co 5 cuc co dinh.`);
  }
  return { ngu_hanh: parsed.ngu_hanh, cuc_so: parsed.cuc_so, raw };
}

/** Gom tu hoa tu ca major + minor stars cua 1 cung. */
function extractSihua(palace: IFunctionalPalace): Sihua[] {
  const out: Sihua[] = [];
  for (const star of [...palace.majorStars, ...palace.minorStars]) {
    if (star.mutagen) {
      out.push({
        star_id: starIdFromVi(star.name),
        type: sihuaTypeFromVi(star.mutagen),
        source: 'ban_menh',
      });
    }
  }
  return out;
}

function adaptPalace(palace: IFunctionalPalace): ChartPalace {
  const major: MajorStar[] = palace.majorStars.map((s) => ({
    star_id: starIdFromVi(s.name),
    strength: brightnessFromVi(s.brightness),
  }));
  const minor: MinorStar[] = palace.minorStars.map((s) => ({
    star_id: starIdFromVi(s.name),
    strength: brightnessFromVi(s.brightness),
    type: s.type,
  }));
  const branch = branchFromVi(palace.earthlyBranch);
  return {
    branch,
    palace_name: palace.name,
    palace_stem: palace.heavenlyStem,
    is_body_palace: palace.isBodyPalace,
    is_original_palace: palace.isOriginalPalace,
    major_stars: major,
    minor_stars: minor,
    adjective_stars: palace.adjectiveStars.map((s) => ({ star_id: starIdFromVi(s.name) })),
    sihua: extractSihua(palace),
    branch_element: branchElement(branch),
    truong_sinh: palace.changsheng12,
    boshi: palace.boshi12,
    jiangqian: palace.jiangqian12,
    suiqian: palace.suiqian12,
  };
}

function adaptDaiVan(astrolabe: IFunctionalAstrolabe, chartId: string): DaiVan[] {
  return astrolabe.decadalList().map((d) => ({
    chart_id: chartId,
    age_from: d.ageRange[0],
    age_to: d.ageRange[1],
    branch: branchFromVi(d.earthlyBranch),
    stem: d.heavenlyStem,
    palace_name: d.palaceName,
  }));
}

/** Tieu van: cac tuoi ung voi tung cung. iztro tra trong `palace.ages`. */
function adaptTieuVan(astrolabe: IFunctionalAstrolabe): TieuVan[] {
  return astrolabe.palaces.map((p) => ({
    branch: branchFromVi(p.earthlyBranch),
    ages: [...p.ages],
  }));
}

/**
 * Luu Nien cho 1 nam xem cu the. `iztro.astrolabe.horoscope(dateStr, timeIndex).yearly`
 * co `palaceNames[i]`/`stars[i]` DUNG CHUNG index voi `astrolabe.palaces[i]` (theo vi
 * tri, khong phai theo branch) — da xac minh thuc te trong luc lap ke hoach.
 */
function adaptLuuNien(astrolabe: IFunctionalAstrolabe, viewYear: string, chartId: string): LuuNien {
  const horoscope = astrolabe.horoscope(viewYear, 0);
  const yearly = horoscope.yearly;
  const year = Number.parseInt(viewYear.split('-')[0] ?? '', 10);
  const palaces: LuuNienPalace[] = astrolabe.palaces.map((p, i) => ({
    branch: branchFromVi(p.earthlyBranch),
    palace_name: yearly.palaceNames[i] ?? '',
    stars: (yearly.stars?.[i] ?? []).map((s) => ({ star_id: starIdFromVi(s.name) })),
  }));
  return {
    chart_id: chartId,
    year,
    heavenly_stem: yearly.heavenlyStem,
    earthly_branch: yearly.earthlyBranch,
    mutagen: [...yearly.mutagen],
    palaces,
  };
}

export function adaptFromIztro(
  astrolabe: IFunctionalAstrolabe,
  input: BuildChartInput,
): Chart {
  const menhBranch = branchFromVi(astrolabe.earthlyBranchOfSoulPalace);
  const thanBranch = branchFromVi(astrolabe.earthlyBranchOfBodyPalace);
  const napAm = napAmFromSolarDate(astrolabe.solarDate);
  const yearCanChi = astrolabe.chineseDate.split(' - ')[0] ?? '';
  const chartId = `${astrolabe.solarDate}_t${input.time_index}_${input.gender}`;

  const notes: string[] = [
    'Do sang giu nguyen thang 7 muc cua iztro (Mieu/Vuong/Dac/Loi/Binh/Bat/Han), khong rut ve 5 muc.',
    'Nap am lay tu lunar-typescript vi iztro khong cung cap.',
    'Tuan/Triet nam trong adjective_stars (TUAN_KHONG / TRIET_KHONG / KHONG_VONG), khong phai truong rieng.',
    'luu_nien CO CHU DICH khong nam trong Chart: no la du lieu theo nam duoc hoi, khong phai fact tinh cua la so. Dung astrolabe.horoscope(date) khi can.',
    'algorithm: zhongzhou (Trung Chau phai) — cau hinh toan cuc tai iztro-client.ts, xem design doc 2026-08-21-algorithm-zhongzhou-design.md.',
  ];
  if (napAm.vi === napAm.raw) {
    notes.push(`Nap am "${napAm.raw}" chua co ban dich tieng Viet da doi chieu — giu nguyen chuoi goc.`);
  }

  return {
    chart_id: chartId,
    metadata: {
      birth_solar_date: astrolabe.solarDate,
      birth_lunar_date: astrolabe.lunarDate,
      chinese_date: astrolabe.chineseDate,
      time_label: astrolabe.time,
      time_range: astrolabe.timeRange,
      gender: input.gender,
      calendar_type: input.calendar_type,
      year_can_chi: yearCanChi,
    },
    menh_than: {
      menh_branch: menhBranch,
      than_branch: thanBranch,
      same_palace: menhBranch === thanBranch,
      soul_star: astrolabe.soul,
      body_star: astrolabe.body,
    },
    cuc: parseFiveElementsClass(astrolabe.fiveElementsClass),
    ban_menh_nap_am: napAm.vi,
    palaces: astrolabe.palaces.map(adaptPalace),
    luck_cycles: {
      dai_van: adaptDaiVan(astrolabe, chartId),
      tieu_van: adaptTieuVan(astrolabe),
    },
    engine_meta: {
      engine: 'iztro',
      engine_version: ENGINE_VERSION,
      language: 'vi-VN',
      notes,
    },
    luu_nien: input.view_year !== undefined ? adaptLuuNien(astrolabe, input.view_year, chartId) : undefined,
  };
}
