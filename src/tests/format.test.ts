import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatCurrency,
  formatMoney,
  formatPercent,
  relativeDelta,
  shortDate,
} from '@/utils/format';

describe('format utils', () => {
  it('把金额压缩为万/亿单位', () => {
    expect(formatCurrency(1286400, true)).toBe('¥128.6 万');
    expect(formatCurrency(230000000, true)).toBe('¥2.30 亿');
    expect(formatMoney(1234.5)).toBe('¥1,234.50');
  });

  it('紧凑数字保留单位并做四舍五入', () => {
    expect(formatCompactNumber(12860)).toBe('1.3 万');
    expect(formatCompactNumber(980)).toBe('980');
  });

  it('百分比与环比符号', () => {
    expect(formatPercent(6.834)).toBe('6.8%');
    expect(relativeDelta(12.34)).toBe('+12.3%');
    expect(relativeDelta(-3)).toBe('-3.0%');
  });

  it('短日期用于坐标轴', () => {
    expect(shortDate('2026-10-21')).toBe('10/21');
  });
});
