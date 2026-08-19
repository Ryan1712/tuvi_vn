import { describe, it, expect } from 'vitest';
import { OVERVIEW_SYSTEM_PROMPT, buildUserMessage } from '../../src/llm/overview-prompt.js';
import type { EvidencePack } from '../../src/llm/evidence-pack.js';

const SAMPLE_PACK: EvidencePack = {
  menh_than: { menh_branch: 'Hoi', than_branch: 'Hoi', soul_star: 'LOC_TON', body_star: 'THIEN_LUONG' },
  cuc: { ngu_hanh: 'Thuy', raw: 'Thuy Nhi Cuc' },
  ban_menh_nap_am: 'Thanh Dau Tho',
  palaces: [
    { branch: 'Hoi', palace_name: 'Menh', major_stars: [{ star_id: 'THIEN_DONG', strength: 'dac' }], minor_stars: [], branch_element: 'Thuy' },
  ],
  current_dai_van: { palace_name: 'Menh', heavenly_stem: 'Quy', earthly_branch: 'Hoi', nominal_age: 29 },
  interpretations: [
    { palace_branch: 'Hoi', rule_id: 'RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT', conclusion_text: 'Thien Dong ngo Khong Kiep — de hoang mang.', valence: 'hung', consensus: 'tranh_cai', conflict_group_id: 'CG_001' },
  ],
};

describe('OVERVIEW_SYSTEM_PROMPT', () => {
  it('cam suy luan y nghia ngoai interpretations', () => {
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/interpretations/);
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/KHÔNG.*suy luận|TUYỆT\s*ĐỐI KHÔNG/);
  });

  it('yeu cau trinh bay tat ca quan diem trong 1 conflict_group_id', () => {
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/conflict_group_id/);
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/TẤT CẢ/);
  });

  it('yeu cau dien dat theo consensus, doc lap voi conflict_group_id', () => {
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/consensus/);
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/tranh_cai/);
    expect(OVERVIEW_SYSTEM_PROMPT).toMatch(/ĐỘC LẬP/);
  });
});

describe('buildUserMessage', () => {
  it('bao gom du lieu tu EvidencePack duoi dang doc duoc (JSON hoac tuong duong)', () => {
    const msg = buildUserMessage(SAMPLE_PACK);
    expect(msg).toContain('THIEN_DONG');
    expect(msg).toContain('RULE_A_THIEN_DONG_KHONG_KIEP_BAT_CAT');
    expect(msg).toContain('CG_001');
    expect(msg).toContain('29'); // nominal_age
  });
});
