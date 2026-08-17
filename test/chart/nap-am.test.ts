import { describe, it, expect } from 'vitest';
import { napAmFromSolarDate } from '../../src/chart/nap-am.js';

describe('nap-am', () => {
  it('cho ra Thanh Dau Tho cho nam Mau Dan 1998 (khop reference #1)', () => {
    const napAm = napAmFromSolarDate('1998-12-17');
    expect(napAm.raw).toBe('城头土');
    expect(napAm.vi).toBe('Thành Đầu Thổ');
  });

  it('gia tri chua doi chieu duoc thi giu nguyen chuoi goc, khong dich bua', () => {
    // Nam 2000 Canh Thin -> nap am "白蜡金", chua doi chieu voi nguon nao.
    const napAm = napAmFromSolarDate('2000-06-15');
    expect(napAm.raw).toBe('白蜡金');
    expect(napAm.vi).toBe('白蜡金');
  });
});
