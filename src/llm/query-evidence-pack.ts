import { callIztro } from '../chart/index.js';
import type { Branch, BuildChartInput, Brightness, Chart, NguHanh } from '../chart/types.js';
import { daiVanAtBranch } from '../rule/query-resolver.js';
import { evaluateRule } from '../rule/evaluator.js';
import { evaluateRelationRule, type RelationTarget } from '../rule/relation-evaluator.js';
import { evaluateDecadeRule } from '../rule/decade-evaluator.js';
import { evaluateAnnualRule } from '../rule/annual-evaluator.js';
import { KNOWLEDGE_BASE } from '../rule/knowledge-base.js';
import type { DomainKey, Modifier, Rule, Valence, Consensus } from '../rule/types.js';
import type { EvidencePack } from './evidence-pack.js';

export type InterpretationScope = 'star_combination' | 'palace_relationship' | 'decade' | 'annual';

interface InterpretationItem {
  rule_id: string;
  conclusion_text: string;
  valence: Valence;
  consensus: Consensus;
  conflict_group_id: string | null;
  matched_modifiers: Modifier[];
}

export interface QueryEvidencePack {
  menh_than: EvidencePack['menh_than'];
  cuc: EvidencePack['cuc'];
  ban_menh_nap_am: string;
  domain: DomainKey;
  palaces: {
    branch: Branch;
    palace_name: string;
    major_stars: { star_id: string; strength?: Brightness }[];
    minor_stars: { star_id: string; strength?: Brightness }[];
    branch_element: NguHanh;
    interpretation_groups: {
      scope: InterpretationScope;
      decade_age_range: { age_from: number; age_to: number } | null;
      items: InterpretationItem[];
    }[];
  }[];
  current_dai_van: EvidencePack['current_dai_van'];
  current_luu_nien: { year: string; heavenly_stem: string; earthly_branch: string } | null;
}

const RELATION_TARGETS: RelationTarget[] = ['opposite', 'wealth', 'career'];

function ruleToItem(rule: Rule, matchedModifiers: Modifier[]): InterpretationItem {
  return {
    rule_id: rule.rule_id,
    conclusion_text: rule.conclusion.text,
    valence: rule.conclusion.valence,
    consensus: rule.consensus,
    conflict_group_id: rule.conflict_group_id,
    matched_modifiers: matchedModifiers,
  };
}

function staticGroupItems(chart: Chart, branch: Branch): InterpretationItem[] {
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'star_combination' && rule.scope !== 'star_palace' && rule.scope !== 'four_transform') continue;
    const result = evaluateRule(chart, branch, rule);
    if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
  }
  return items;
}

function relationGroupItems(input: BuildChartInput, branch: Branch): InterpretationItem[] {
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'palace_relationship') continue;
    for (const relation of RELATION_TARGETS) {
      const result = evaluateRelationRule(input, branch, relation, rule);
      if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
    }
  }
  return items;
}

function decadeGroup(chart: Chart, branch: Branch): { decade_age_range: { age_from: number; age_to: number }; items: InterpretationItem[] } {
  const daiVan = daiVanAtBranch(chart, branch);
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'decade') continue;
    const result = evaluateDecadeRule(chart, daiVan, rule);
    if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
  }
  return { decade_age_range: { age_from: daiVan.age_from, age_to: daiVan.age_to }, items };
}

function annualGroupItems(chart: Chart, branch: Branch): InterpretationItem[] {
  if (chart.luu_nien === undefined) return [];
  const items: InterpretationItem[] = [];
  for (const rule of KNOWLEDGE_BASE) {
    if (rule.scope !== 'annual') continue;
    const result = evaluateAnnualRule(chart, chart.luu_nien, branch, rule);
    if (result.matched) items.push(ruleToItem(rule, result.matched_modifiers));
  }
  return items;
}

/**
 * Dung Chart + branches (tu resolveQuery, DA DUNG THU TU) de dung QueryEvidencePack.
 * Interface RIENG, KHONG sua EvidencePack cua Tang 1 (xem design doc muc 4). Voi MOI
 * cung, chay CA 4 scope hop le — khong tu loc theo "thoi diem cau hoi" (design doc muc 3).
 *
 * Decade dung Dai Van CUA CHINH CUNG DO (daiVanAtBranch, theo branch), KHONG PHAI Dai Van
 * hien tai — day la diem khac biet co y thuc so voi currentDaiVan() cua Tang 1, xem thiet
 * ke muc 3 "Decade dung Dai Van nao".
 */
export function buildQueryEvidencePack(
  input: BuildChartInput,
  chart: Chart,
  branches: Branch[],
  domain: DomainKey,
): QueryEvidencePack {
  const palaces = branches.map((branch) => {
    const palace = chart.palaces.find((p) => p.branch === branch);
    if (palace === undefined) {
      throw new Error(`buildQueryEvidencePack: khong tim thay cung o branch "${branch}".`);
    }
    const decade = decadeGroup(chart, branch);
    return {
      branch: palace.branch,
      palace_name: palace.palace_name,
      major_stars: palace.major_stars.map((s) => ({ star_id: s.star_id, strength: s.strength })),
      minor_stars: palace.minor_stars.map((s) => ({ star_id: s.star_id, strength: s.strength })),
      branch_element: palace.branch_element,
      interpretation_groups: [
        { scope: 'star_combination' as const, decade_age_range: null, items: staticGroupItems(chart, branch) },
        { scope: 'palace_relationship' as const, decade_age_range: null, items: relationGroupItems(input, branch) },
        { scope: 'decade' as const, decade_age_range: decade.decade_age_range, items: decade.items },
        { scope: 'annual' as const, decade_age_range: null, items: annualGroupItems(chart, branch) },
      ],
    };
  });

  const astrolabe = callIztro(input);
  const todayStr = new Date().toISOString().slice(0, 10);
  const nominalAge = astrolabe.horoscope(todayStr, 0).age.nominalAge;
  const matchingDaiVan = astrolabe
    .decadalList()
    .find((d) => nominalAge >= d.ageRange[0] && nominalAge <= d.ageRange[1]);
  if (matchingDaiVan === undefined) {
    throw new Error(`buildQueryEvidencePack: khong tim thay Dai Van khop tuoi mu ${nominalAge}.`);
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
    domain,
    palaces,
    current_dai_van: {
      palace_name: matchingDaiVan.palaceName,
      heavenly_stem: matchingDaiVan.heavenlyStem,
      earthly_branch: matchingDaiVan.earthlyBranch,
      nominal_age: nominalAge,
    },
    current_luu_nien: chart.luu_nien === undefined ? null : {
      year: String(chart.luu_nien.year),
      heavenly_stem: chart.luu_nien.heavenly_stem,
      earthly_branch: chart.luu_nien.earthly_branch,
    },
  };
}
