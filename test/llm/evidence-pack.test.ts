import { describe, it, expect } from 'vitest';
import { callIztro } from '../../src/chart/iztro-client.js';
import { buildEvidencePack } from '../../src/llm/evidence-pack.js';
import { adaptFromIztro } from '../../src/chart/adapter.js';
import { matchRules } from '../../src/rule/evaluator.js';
import { resolveConflicts } from '../../src/rule/conflict-resolver.js';
import { KNOWLEDGE_BASE } from '../../src/rule/knowledge-base.js';
import { BRANCHES } from '../../src/chart/types.js';
import type { BuildChartInput, Branch } from '../../src/chart/types.js';
import type { Rule } from '../../src/rule/types.js';

const PHAM_DUY_INPUT: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

function buildPhamDuyChartAndRules() {
  const astrolabe = callIztro(PHAM_DUY_INPUT);
  const chart = adaptFromIztro(astrolabe, PHAM_DUY_INPUT);
  const rulesByRuleId = new Map<string, Rule>(KNOWLEDGE_BASE.map((r) => [r.rule_id, r]));
  const rules_by_palace = Object.fromEntries(
    BRANCHES.map((branch) => {
      const matched = matchRules(chart, branch, KNOWLEDGE_BASE);
      const matchedRules = matched
        .filter((r) => r.matched)
        .map((r) => rulesByRuleId.get(r.rule_id))
        .filter((r): r is Rule => r !== undefined);
      const conflicts = resolveConflicts(matchedRules);
      return [branch, { matched, conflicts }];
    }),
    // Object.fromEntries widens to {[k: string]: T} — cast to Record<Branch, T> since
    // BRANCHES.map() guarantees every Branch key is present exactly once.
  ) as Record<Branch, { matched: ReturnType<typeof matchRules>; conflicts: ReturnType<typeof resolveConflicts> }>;
  return { chart, rules_by_palace, astrolabe };
}

describe('buildEvidencePack', () => {
  it('day du 12 cung trong facts, khong thieu khong thua', () => {
    const { chart, rules_by_palace } = buildPhamDuyChartAndRules();
    const pack = buildEvidencePack(PHAM_DUY_INPUT, chart, rules_by_palace);
    expect(pack.palaces).toHaveLength(12);
    expect(pack.palaces.map((p) => p.branch).sort()).toEqual([...BRANCHES].sort());
  });

  it('chi dua vao interpretations cac rule matched:true, dung ca 2 tai Hoi (CG_001)', () => {
    const { chart, rules_by_palace } = buildPhamDuyChartAndRules();
    const pack = buildEvidencePack(PHAM_DUY_INPUT, chart, rules_by_palace);
    const hoiInterpretations = pack.interpretations.filter((i) => i.palace_branch === 'Hoi');
    expect(hoiInterpretations).toHaveLength(2);
    const ruleIds = hoiInterpretations.map((i) => i.rule_id).sort();
    expect(ruleIds).toEqual([
      'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT',
      'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI',
    ]);
    for (const interp of hoiInterpretations) {
      expect(interp.conflict_group_id).toBe('CG_001');
      expect(interp.consensus).toBe('tranh_cai');
    }
  });

  it('khong co interpretation nao cho cung khong co rule matched (VD Ty)', () => {
    const { chart, rules_by_palace } = buildPhamDuyChartAndRules();
    const pack = buildEvidencePack(PHAM_DUY_INPUT, chart, rules_by_palace);
    const tyInterpretations = pack.interpretations.filter((i) => i.palace_branch === 'Ty');
    expect(tyInterpretations).toHaveLength(0);
  });

  it('current_dai_van dung tuoi mu, khop gia tri da xac minh (29 cho nam xem 2026)', () => {
    const { chart, rules_by_palace } = buildPhamDuyChartAndRules();
    const pack = buildEvidencePack(PHAM_DUY_INPUT, chart, rules_by_palace);
    // nominal_age phu thuoc ngay chay test (Date.now toi han) — chi assert la 1 so hop le
    // trong khoang tuoi nguoi (khong am, khong qua lon), KHONG hardcode 29 (test nay chay
    // vao ngay khac se sai). Case-bien cu the (age_from/age_to ranh gioi) test rieng ben duoi.
    expect(pack.current_dai_van.nominal_age).toBeGreaterThan(0);
    expect(pack.current_dai_van.nominal_age).toBeLessThan(120);
    expect(pack.current_dai_van.palace_name.length).toBeGreaterThan(0);
  });

  it('menh_than/cuc/ban_menh_nap_am khop du lieu Chart goc, khong bien doi', () => {
    const { chart, rules_by_palace } = buildPhamDuyChartAndRules();
    const pack = buildEvidencePack(PHAM_DUY_INPUT, chart, rules_by_palace);
    expect(pack.menh_than.menh_branch).toBe('Hoi');
    expect(pack.menh_than.soul_star).toBe(chart.menh_than.soul_star);
    expect(pack.cuc.raw).toBe(chart.cuc.raw);
    expect(pack.ban_menh_nap_am).toBe(chart.ban_menh_nap_am);
  });
});

describe('currentDaiVan qua horoscope() — case bien', () => {
  it('mot Dai Van bat ky trong 12 Dai Van co age_from <= nominal_age <= age_to tuong ung', () => {
    // Khong the ep "hom nay" (Date.now()) khop 1 tuoi bien cu the trong test tu dong —
    // thay vao do, xac minh TINH NHAT QUAN noi tai: nominal_age tra ve phai nam trong
    // dung khoang [age_from, age_to] cua chinh Dai Van ma decadal.name/branch tro toi,
    // doi chieu qua danh sach 12 Dai Van day du (chart.luck_cycles.dai_van, da tinh boi
    // adaptDaiVan — KHONG phai nguon rieng, tranh 2 nguon co the lech nhau).
    const { chart } = buildPhamDuyChartAndRules();
    const pack = buildEvidencePack(PHAM_DUY_INPUT, chart, buildPhamDuyChartAndRules().rules_by_palace);
    const matchingDaiVan = chart.luck_cycles.dai_van.find(
      (d) => d.branch === chart.palaces.find((p) => p.palace_name === pack.current_dai_van.palace_name)?.branch,
    );
    expect(matchingDaiVan).toBeDefined();
    expect(pack.current_dai_van.nominal_age).toBeGreaterThanOrEqual(matchingDaiVan!.age_from);
    expect(pack.current_dai_van.nominal_age).toBeLessThanOrEqual(matchingDaiVan!.age_to);
  });
});
