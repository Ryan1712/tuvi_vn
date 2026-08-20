import { describe, it, expect } from 'vitest';
import { QUERY_SYSTEM_PROMPT, buildQueryUserMessage } from '../../src/llm/query-prompt.js';
import type { QueryEvidencePack } from '../../src/llm/query-evidence-pack.js';

describe('QUERY_SYSTEM_PROMPT', () => {
  it('chua quy tac ve interpretation_groups va scope', () => {
    expect(QUERY_SYSTEM_PROMPT).toContain('interpretation_groups');
    expect(QUERY_SYSTEM_PROMPT).toContain('decade_age_range');
  });

  it('chua vi du DUNG va SAI cu the (khong chi luat truu tuong)', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/Ví dụ ĐÚNG/);
    expect(QUERY_SYSTEM_PROMPT).toMatch(/Ví dụ SAI/);
  });

  it('chua huong dan ve thu tu khi co nhieu cung (domain mo ho)', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/THỨ TỰ|thứ tự/);
  });

  it('giu nguyen quy tac ranh gioi Facts/Interpretation tu Tang 1', () => {
    expect(QUERY_SYSTEM_PROMPT).toMatch(/interpretations|interpretation_groups/);
    expect(QUERY_SYSTEM_PROMPT).toMatch(/conflict_group_id/);
  });
});

describe('buildQueryUserMessage', () => {
  it('tra ve chuoi JSON chua toan bo QueryEvidencePack', () => {
    const fakePack = {
      menh_than: { menh_branch: 'Hoi', than_branch: 'Hoi', soul_star: 'X', body_star: 'Y' },
      cuc: { ngu_hanh: 'Thủy', raw: 'Thuy Nhi Cuc' },
      ban_menh_nap_am: 'Test',
      domain: 'quan_loc',
      palaces: [],
      current_dai_van: { palace_name: 'Mệnh', heavenly_stem: 'X', earthly_branch: 'Hoi', nominal_age: 29 },
      current_luu_nien: null,
    } as unknown as QueryEvidencePack;
    const msg = buildQueryUserMessage(fakePack);
    expect(msg).toContain('quan_loc');
    expect(msg).toContain('29');
  });
});
