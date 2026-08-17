import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { BuildChartInput } from './types.js';

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
  return astro.byLunar(
    input.date,
    input.time_index,
    gender,
    input.is_leap_month ?? false,
    input.fix_leap ?? true,
    'vi-VN',
  );
}
