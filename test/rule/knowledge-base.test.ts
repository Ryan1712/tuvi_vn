import { describe, it, expect } from 'vitest';
import {
  RULE_A, RULE_B, RULE_VO_CHINH_DIEU_MUON_CHINH_TINH,
  SRC_001, SRC_002, SRC_003,
  KNOWLEDGE_BASE, SOURCES,
} from '../../src/rule/knowledge-base.js';
import { buildChart } from '../../src/chart/index.js';
import { evaluateRule } from '../../src/rule/evaluator.js';
import type { BuildChartInput } from '../../src/chart/types.js';

const PHAM_DUY: BuildChartInput = {
  calendar_type: 'duong_lich',
  date: '1998-12-17',
  time_index: 12,
  gender: 'nam',
  fix_leap: true,
};

describe('knowledge base — Entry mau muc 9', () => {
  it('RULE_A va RULE_B cung conflict_group_id', () => {
    expect(RULE_A.conflict_group_id).toBe('CG_001');
    expect(RULE_B.conflict_group_id).toBe('CG_001');
  });

  it('RULE_A yeu cau Thien Dong + Khong + Kiep dong cung', () => {
    const values = RULE_A.conditions.map((c) => c.value);
    expect(values).toEqual(expect.arrayContaining(['THIEN_DONG', 'DIA_KHONG', 'DIA_KIEP']));
  });

  it('RULE_B KHONG yeu cau Thien Dong trong conditions — chi Khong+Kiep dong cung', () => {
    const values = RULE_B.conditions.map((c) => c.value);
    expect(values).toEqual(expect.arrayContaining(['DIA_KHONG', 'DIA_KIEP']));
    expect(values).not.toContain('THIEN_DONG');
  });

  it('RULE_B co modifier branch Ty2,Hoi voi weight 0.7', () => {
    expect(RULE_B.modifiers).toHaveLength(1);
    expect(RULE_B.modifiers[0]).toMatchObject({ field: 'branch', value: 'Ty2,Hoi', weight: 0.7 });
  });

  it('ca 2 rule co consensus tranh_cai — CHUA CHOT ket luan', () => {
    expect(RULE_A.consensus).toBe('tranh_cai');
    expect(RULE_B.consensus).toBe('tranh_cai');
  });

  it('ca 2 source o reliability_tier 3_thap theo dung build spec muc 9', () => {
    expect(SRC_001.reliability_tier).toBe('3_thap');
    expect(SRC_002.reliability_tier).toBe('3_thap');
  });

  it('KNOWLEDGE_BASE va SOURCES gom dung 3 phan tu (them RULE_VO_CHINH_DIEU_MUON_CHINH_TINH 2026-08-25)', () => {
    expect(KNOWLEDGE_BASE).toEqual([RULE_A, RULE_B, RULE_VO_CHINH_DIEU_MUON_CHINH_TINH]);
    expect(SOURCES).toEqual([SRC_001, SRC_002, SRC_003]);
  });
});

describe('RULE_VO_CHINH_DIEU_MUON_CHINH_TINH — Vo Chinh Dieu (ap dung MOI cung, khong rieng Menh)', () => {
  it('dung operator is_empty tren field major_stars', () => {
    expect(RULE_VO_CHINH_DIEU_MUON_CHINH_TINH.conditions).toEqual([
      { field: 'major_stars', operator: 'is_empty', value: '', required: true },
    ]);
  });

  it('subject.type la pattern (cach cuc, khong phai 1 sao hay 1 cung cu the)', () => {
    expect(RULE_VO_CHINH_DIEU_MUON_CHINH_TINH.subject.type).toBe('pattern');
  });

  it('khong nam trong conflict_group_id nao (khong tranh chap voi Rule khac)', () => {
    expect(RULE_VO_CHINH_DIEU_MUON_CHINH_TINH.conflict_group_id).toBeNull();
  });

  it('conclusion.text TONG QUAT, khong hardcode ten 1 cung cu the (vd "Thien Di") — vi doi cung khac nhau tuy cung dang xet', () => {
    expect(RULE_VO_CHINH_DIEU_MUON_CHINH_TINH.conclusion.text).not.toContain('Thiên Di');
    expect(RULE_VO_CHINH_DIEU_MUON_CHINH_TINH.conclusion.text).not.toContain('Mệnh');
  });

  it('match dung cung Tai Bach cua Pham Duy — cung nay THAT SU khong co chinh tinh, KHONG PHAI Menh', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Mui', RULE_VO_CHINH_DIEU_MUON_CHINH_TINH);
    expect(result.matched).toBe(true);
  });

  it('match dung cung Phu The cua Pham Duy — cung nay cung khong co chinh tinh, KHONG PHAI Menh', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Dau', RULE_VO_CHINH_DIEU_MUON_CHINH_TINH);
    expect(result.matched).toBe(true);
  });

  it('KHONG match cung Menh cua Pham Duy — cung nay co Thien Dong', () => {
    const chart = buildChart(PHAM_DUY);
    const result = evaluateRule(chart, 'Hoi', RULE_VO_CHINH_DIEU_MUON_CHINH_TINH);
    expect(result.matched).toBe(false);
  });

  it('source SRC_003 o reliability_tier 3_thap, dung dung quy uoc voi SRC_001/SRC_002', () => {
    expect(SRC_003.reliability_tier).toBe('3_thap');
  });
});
