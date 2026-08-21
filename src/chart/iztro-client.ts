import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { BuildChartInput } from './types.js';

/**
 * Chon algorithm 'zhongzhou' (Trung Chau phai) lam MAC DINH TOAN CUC cho toan bo du an —
 * khop dung dinh huong nen tang da chon tu dau (TuVi_Build_Spec_v1.md: "lop suy luan sau:
 * Trung Chau phai"). Xem design doc 2026-08-21-algorithm-zhongzhou-design.md muc 1 ve ly do
 * chon global constant thay vi field trong BuildChartInput, va muc 1.2 ve ranh gioi giua
 * quyet dinh nay (tang TINH TOAN, 1 trường phai duy nhat) va cach Rule Engine xu ly da
 * trường phai o tang LUAN GIAI (giu ca 2 qua conflict_group_id, khong chon phe).
 *
 * QUAN TRONG: astro.config() mutate 1 bien module-level NOI BO cua iztro, khong phai tham
 * so truyen theo tung lan goi bySolar/byLunar — goi 1 LAN o day, KHONG goi lai o bat ky
 * dau khac trong codebase (se lam thay doi ngam ket qua cua MOI lan build chart sau do).
 * MOI noi trong src/ va test/ can du lieu tu iztro PHAI goi qua callIztro()/buildChart(),
 * KHONG tu import { astro } roi goi bySolar/byLunar truc tiep — xem Task 3 cua plan nay.
 */
astro.config({ algorithm: 'zhongzhou' });

/** Gioi tinh cua du an -> gioi tinh cua iztro. */
function toIztroGender(gender: 'nam' | 'nu'): 'male' | 'female' {
  return gender === 'nam' ? 'male' : 'female';
}

/**
 * Goi iztro dung theo loai lich, tra ve astrolabe tho.
 *
 * File rieng (khong nam trong index.ts) de tranh phu thuoc vong:
 * ca index.ts va queries.ts deu can ham nay.
 *
 * Ngon ngu co dinh 'vi-VN'; fixLeap mac dinh true theo mac dinh cua iztro.
 */
export function callIztro(input: BuildChartInput): IFunctionalAstrolabe {
  const gender = toIztroGender(input.gender);
  if (input.calendar_type === 'duong_lich') {
    return astro.bySolar(input.date, input.time_index, gender, input.fix_leap ?? true, 'vi-VN');
  }
  if (input.calendar_type === 'am_lich') {
    return astro.byLunar(
      input.date,
      input.time_index,
      gender,
      input.is_leap_month ?? false,
      input.fix_leap ?? true,
      'vi-VN',
    );
  }
  throw new Error(
    `calendar_type "${(input as { calendar_type: unknown }).calendar_type}" khong hop le. Chi chap nhan "duong_lich" hoac "am_lich".`,
  );
}
