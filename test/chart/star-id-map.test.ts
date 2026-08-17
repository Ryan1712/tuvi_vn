import { describe, it, expect } from 'vitest';
import {
  starIdFromVi,
  brightnessFromVi,
  sihuaTypeFromVi,
  branchFromVi,
} from '../../src/chart/star-id-map.js';

describe('star-id-map', () => {
  it('map ten sao tieng Viet sang star_id chuan hoa', () => {
    expect(starIdFromVi('Thiên Đồng')).toBe('THIEN_DONG');
    expect(starIdFromVi('Địa Không')).toBe('DIA_KHONG');
    expect(starIdFromVi('Địa Kiếp')).toBe('DIA_KIEP');
    expect(starIdFromVi('Tử Vi')).toBe('TU_VI');
    expect(starIdFromVi('Thái Âm')).toBe('THAI_AM');
  });

  it('nem loi ro rang khi gap sao chua co trong bang tra', () => {
    expect(() => starIdFromVi('Sao Bịa Đặt')).toThrowError(
      /chua co trong bang tra star_id/i,
    );
  });

  it('map du 7 muc do sang cua iztro', () => {
    expect(brightnessFromVi('Miếu')).toBe('mieu');
    expect(brightnessFromVi('Vượng')).toBe('vuong');
    expect(brightnessFromVi('Đắc')).toBe('dac');
    expect(brightnessFromVi('Lợi')).toBe('loi');
    expect(brightnessFromVi('Bình')).toBe('binh');
    expect(brightnessFromVi('Bất')).toBe('bat');
    expect(brightnessFromVi('Hạn')).toBe('ham');
  });

  it('do sang rong/undefined tra ve undefined', () => {
    expect(brightnessFromVi(undefined)).toBeUndefined();
    expect(brightnessFromVi('')).toBeUndefined();
  });

  it('map tu hoa', () => {
    expect(sihuaTypeFromVi('Lộc')).toBe('Loc');
    expect(sihuaTypeFromVi('Quyền')).toBe('Quyen');
    expect(sihuaTypeFromVi('Khoa')).toBe('Khoa');
    expect(sihuaTypeFromVi('Kỵ')).toBe('Ky');
  });

  it('map 12 dia chi, phan biet Ty (Tý) va Ty2 (Tỵ)', () => {
    expect(branchFromVi('Tý')).toBe('Ty');
    expect(branchFromVi('Tỵ')).toBe('Ty2');
    expect(branchFromVi('Hợi')).toBe('Hoi');
    expect(branchFromVi('Sửu')).toBe('Suu');
  });
});
