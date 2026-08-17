import { describe, it, expect } from 'vitest';
import { RULE_A, RULE_B, SRC_001, SRC_002, KNOWLEDGE_BASE, SOURCES } from '../../src/rule/knowledge-base.js';

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

  it('KNOWLEDGE_BASE va SOURCES gom dung 2 phan tu moi', () => {
    expect(KNOWLEDGE_BASE).toEqual([RULE_A, RULE_B]);
    expect(SOURCES).toEqual([SRC_001, SRC_002]);
  });
});
