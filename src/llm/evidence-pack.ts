import { callIztro } from '../chart/index.js';
import type { Branch, BuildChartInput, Chart, NguHanh, Brightness } from '../chart/types.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import type { Rule, Valence, Consensus } from '../rule/types.js';

export interface EvidencePack {
  menh_than: { menh_branch: Branch; than_branch: Branch; soul_star: string; body_star: string };
  cuc: { ngu_hanh: NguHanh; raw: string };
  ban_menh_nap_am: string;
  palaces: {
    branch: Branch;
    palace_name: string;
    major_stars: { star_id: string; strength?: Brightness }[];
    minor_stars: { star_id: string; strength?: Brightness }[];
    branch_element: NguHanh;
  }[];
  current_dai_van: {
    palace_name: string;
    heavenly_stem: string;
    earthly_branch: string;
    nominal_age: number;
  };
  interpretations: {
    palace_branch: Branch;
    rule_id: string;
    conclusion_text: string;
    valence: Valence;
    consensus: Consensus;
    conflict_group_id: string | null;
  }[];
}

interface RulesByPalaceEntry {
  matched: { rule_id: string; matched: boolean }[];
  conflicts: unknown[];
}

/**
 * Doc Dai Van dang chay tai thoi diem hien tai (hom nay) tu iztro.
 *
 * QUAN TRONG: `horoscope(date).decadal.palaceNames[decadal.index]` KHONG PHAI ten cung
 * Dai Van dung — `palaceNames` la mang 12 ten cung DUOC GAN NHAN LAI theo goc nhin cua
 * chinh Dai Van do (vong Dai Van), khac voi ten cung tinh (natal) ma `chart.luck_cycles
 * .dai_van` da dung. Da phat hien bang test thuc te trong luc verify plan nay: voi case
 * Pham Duy tuoi 29, `decadal.palaceNames[decadal.index]` tra ve "Mệnh" (SAI — 29 tuoi
 * khong nam trong khoang [2,11] cua Dai Van "Mệnh"), trong khi dung phai la "Phúc Đức"
 * (khoang [22,31]).
 *
 * Cach dung: dung `astrolabe.decadalList()` (CUNG ham `adaptDaiVan()` trong adapter.ts
 * da dung va da qua test) + tim entry co `nominalAge` nam trong `ageRange`, lay
 * `.palaceName` truc tiep tu entry do — KHONG suy ra tu index cua mang `palaceNames`.
 * `horoscope().age.nominalAge` van la nguon dung cho tuoi mu (da xac minh: 29 khop
 * du lieu case Pham Duy ghi san trong build spec cho nam xem 2026).
 */
function currentDaiVan(input: BuildChartInput): EvidencePack['current_dai_van'] {
  const astrolabe = callIztro(input);
  const todayStr = new Date().toISOString().slice(0, 10);
  const nominalAge = astrolabe.horoscope(todayStr, 0).age.nominalAge;

  const matching = astrolabe
    .decadalList()
    .find((d) => nominalAge >= d.ageRange[0] && nominalAge <= d.ageRange[1]);
  if (matching === undefined) {
    throw new Error(
      `Khong tim thay Dai Van nao khop voi tuoi mu ${nominalAge} trong danh sach decadalList().`,
    );
  }

  return {
    palace_name: matching.palaceName,
    heavenly_stem: matching.heavenlyStem,
    earthly_branch: matching.earthlyBranch,
    nominal_age: nominalAge,
  };
}

/**
 * Dung Chart + rules_by_palace (dang da co san trong routes.ts) de dung EvidencePack.
 * Facts (palaces) lay TU DO tu toan bo 12 cung — mo ta thuan tuy, khong phan xet.
 * Interpretations CHI lay tu rule matched:true — gioi han tuyet doi vao conclusion_text,
 * khong duoc suy rong. Day la ranh gioi cung nhat cua module nay (xem design doc muc 2).
 */
export function buildEvidencePack(
  input: BuildChartInput,
  chart: Chart,
  rulesByPalace: Record<Branch, RulesByPalaceEntry>,
): EvidencePack {
  const rulesByRuleId = new Map<string, Rule>(KNOWLEDGE_BASE.map((r) => [r.rule_id, r]));

  const palaces = chart.palaces.map((p) => ({
    branch: p.branch,
    palace_name: p.palace_name,
    major_stars: p.major_stars.map((s) => ({ star_id: s.star_id, strength: s.strength })),
    minor_stars: p.minor_stars.map((s) => ({ star_id: s.star_id, strength: s.strength })),
    branch_element: p.branch_element,
  }));

  const interpretations: EvidencePack['interpretations'] = [];
  for (const palace of chart.palaces) {
    const entry = rulesByPalace[palace.branch];
    for (const m of entry.matched) {
      if (!m.matched) continue;
      const rule = rulesByRuleId.get(m.rule_id);
      if (rule === undefined) continue;
      interpretations.push({
        palace_branch: palace.branch,
        rule_id: rule.rule_id,
        conclusion_text: rule.conclusion.text,
        valence: rule.conclusion.valence,
        consensus: rule.consensus,
        conflict_group_id: rule.conflict_group_id,
      });
    }
  }

  return {
    menh_than: {
      menh_branch: chart.menh_than.menh_branch,
      than_branch: chart.menh_than.than_branch,
      soul_star: chart.menh_than.soul_star,
      body_star: chart.menh_than.body_star,
    },
    cuc: { ngu_hanh: chart.cuc.ngu_hanh, raw: chart.cuc.raw },
    ban_menh_nap_am: chart.ban_menh_nap_am,
    palaces,
    current_dai_van: currentDaiVan(input),
    interpretations,
  };
}
