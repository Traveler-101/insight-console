import { describe, expect, it } from 'vitest';
import { computeVirtualWindow } from '@/hooks/useVirtualList';

const base = { itemHeight: 48, viewportHeight: 480, overscan: 6 };

describe('computeVirtualWindow', () => {
  it('首屏从 0 开始，多渲染 overscan 行', () => {
    const result = computeVirtualWindow({ ...base, scrollTop: 0, total: 10000 });
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(10 + 12);
  });

  it('滚动后窗口跟随并保留 overscan', () => {
    const result = computeVirtualWindow({ ...base, scrollTop: 4800, total: 10000 });
    expect(result.startIndex).toBe(100 - 6);
    expect(result.endIndex).toBe(100 + 10 + 6);
  });

  it('滚动到底部时不会越界', () => {
    const total = 120;
    const result = computeVirtualWindow({ ...base, scrollTop: 999999, total });
    expect(result.endIndex).toBe(total);
    expect(result.startIndex).toBeLessThanOrEqual(total);
  });

  it('空数据或未测量高度时返回空窗口', () => {
    expect(computeVirtualWindow({ ...base, scrollTop: 0, total: 0 })).toEqual({
      startIndex: 0,
      endIndex: 0,
    });
    expect(
      computeVirtualWindow({ ...base, viewportHeight: 0, scrollTop: 0, total: 100 }),
    ).toEqual({ startIndex: 0, endIndex: 0 });
  });
});
