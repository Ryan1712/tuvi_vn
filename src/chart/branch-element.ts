import type { Branch, NguHanh } from './types.js';

/**
 * Ngu hanh cua 12 dia chi — bang tinh, khong doi theo la so.
 *
 * Gia tri lay tu `iztro.data.earthlyBranches[key].fiveElements` (doc truc tiep luc phat trien,
 * xac nhan khop kien thuc tu vi chuan: Ty/Hoi->Thuy, Suu/Thin/Mui/Tuat->Tho, Dan/Mao->Moc,
 * Ty2/Ngo->Hoa, Than/Dau->Kim). KHONG tu bia bang nay — day la du lieu tinh co san trong iztro,
 * dung nguon co san thay vi tu viet lai (dung nguyen tac da ap dung cho star-id-map.ts).
 */
const BRANCH_ELEMENT: Readonly<Record<Branch, NguHanh>> = {
  Ty: 'Thuy',
  Suu: 'Tho',
  Dan: 'Moc',
  Mao: 'Moc',
  Thin: 'Tho',
  Ty2: 'Hoa',
  Ngo: 'Hoa',
  Mui: 'Tho',
  Than: 'Kim',
  Dau: 'Kim',
  Tuat: 'Tho',
  Hoi: 'Thuy',
};

export function branchElement(branch: Branch): NguHanh {
  return BRANCH_ELEMENT[branch];
}
