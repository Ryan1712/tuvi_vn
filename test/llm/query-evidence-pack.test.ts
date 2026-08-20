import { describe, it, expect } from 'vitest';
import { buildChart } from '../../src/chart/index.js';
import { buildQueryEvidencePack } from '../../src/llm/query-evidence-pack.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY_2026: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
  view_year: '2026-01-01',
};

const PHAM_DUY_NO_YEAR: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('buildQueryEvidencePack', () => {
  it('domain ro rang (quan_loc): chi 1 cung trong palaces, dung branch Mao', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.palaces).toHaveLength(1);
    expect(pack.palaces[0]?.branch).toBe('Mao');
    expect(pack.palaces[0]?.palace_name).toBe('Quan Lộc');
  });

  it('domain mo ho (phu_mau): 2 cung trong palaces, DUNG THU TU truyen vao (khong sap xep lai)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Ty', 'Tuat'], 'phu_mau');
    expect(pack.palaces).toHaveLength(2);
    expect(pack.palaces[0]?.branch).toBe('Ty');
    expect(pack.palaces[1]?.branch).toBe('Tuat');
  });

  it('moi cung co du 4 scope trong interpretation_groups: star_combination, palace_relationship, decade, annual', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    const scopes = pack.palaces[0]?.interpretation_groups.map((g) => g.scope).sort();
    expect(scopes).toEqual(['annual', 'decade', 'palace_relationship', 'star_combination']);
  });

  it('decade_age_range dung Dai Van CUA CUNG DO (Quan Loc: 42-51), KHONG PHAI Dai Van hien tai', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    const decadeGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'decade');
    expect(decadeGroup?.decade_age_range).toEqual({ age_from: 42, age_to: 51 });
  });

  it('scope khac decade co decade_age_range = null', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    expect(staticGroup?.decade_age_range).toBeNull();
  });

  it('current_luu_nien la null khi input khong co view_year', () => {
    const chart = buildChart(PHAM_DUY_NO_YEAR);
    const pack = buildQueryEvidencePack(PHAM_DUY_NO_YEAR, chart, ['Mao'], 'quan_loc');
    expect(pack.current_luu_nien).toBeNull();
  });

  it('current_luu_nien co gia tri khi input co view_year', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.current_luu_nien).not.toBeNull();
    expect(pack.current_luu_nien?.year).toBe('2026');
  });

  it('current_dai_van co nominal_age dung 29 cho nam xem 2026 (da xac minh o Tang 1)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.current_dai_van.nominal_age).toBe(29);
  });

  it('menh_than/cuc/ban_menh_nap_am khop du lieu Chart goc', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.menh_than).toEqual({
      menh_branch: chart.menh_than.menh_branch,
      than_branch: chart.menh_than.than_branch,
      soul_star: chart.menh_than.soul_star,
      body_star: chart.menh_than.body_star,
    });
    expect(pack.ban_menh_nap_am).toBe(chart.ban_menh_nap_am);
  });

  it('domain field trong pack khop domain truyen vao', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Mao'], 'quan_loc');
    expect(pack.domain).toBe('quan_loc');
  });
});

describe('buildQueryEvidencePack — matched_modifiers', () => {
  it('RULE_B matched tai cung Menh (branch Hoi) co matched_modifiers khong rong', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Hoi'], 'menh');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    const ruleBItem = staticGroup?.items.find((i) => i.rule_id === 'RULE_B_KHONG_KIEP_TY_HOI_PHAN_VI_GIAI');
    expect(ruleBItem).toBeDefined();
    expect(ruleBItem?.matched_modifiers).toHaveLength(1);
    expect(ruleBItem?.matched_modifiers[0]?.field).toBe('branch');
    expect(ruleBItem?.matched_modifiers[0]?.value).toBe('Ty2,Hoi');
    expect(ruleBItem?.matched_modifiers[0]?.effect).toBe('tang_xu_huong_tot');
    expect(ruleBItem?.matched_modifiers[0]?.weight).toBe(0.7);
  });

  it('RULE_A matched (khong co modifier trong Rule) co matched_modifiers rong', () => {
    const chart = buildChart(PHAM_DUY_2026);
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Hoi'], 'menh');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    const ruleAItem = staticGroup?.items.find((i) => i.rule_id === 'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT');
    expect(ruleAItem).toBeDefined();
    expect(ruleAItem?.matched_modifiers).toEqual([]);
  });

  it('cung khong o Ty2/Hoi: RULE_B khong matched (conditions da khong khop, khong lien quan modifier)', () => {
    const chart = buildChart(PHAM_DUY_2026);
    // Dan = cung Dien Trach, khong co Khong/Kiep -> RULE_A, RULE_B deu khong matched
    const pack = buildQueryEvidencePack(PHAM_DUY_2026, chart, ['Dan'], 'dien_trach');
    const staticGroup = pack.palaces[0]?.interpretation_groups.find((g) => g.scope === 'star_combination');
    expect(staticGroup?.items).toEqual([]);
  });
});
