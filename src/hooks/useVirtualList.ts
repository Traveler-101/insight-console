import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

export interface VirtualItem {
  index: number;
  offsetTop: number;
}

interface Options {
  /** 固定行高是虚拟滚动的性能前提，变高列表需改用测量缓存方案 */
  itemHeight: number;
  /** 上下各多渲染几行，减少快速滚动时的白屏 */
  overscan?: number;
}

export interface VirtualWindowInput {
  scrollTop: number;
  viewportHeight: number;
  itemHeight: number;
  overscan: number;
  total: number;
}

/** 纯函数计算可视区间，便于单测覆盖边界（空数据、首屏、滚到底部） */
export function computeVirtualWindow({
  scrollTop,
  viewportHeight,
  itemHeight,
  overscan,
  total,
}: VirtualWindowInput) {
  if (total === 0 || viewportHeight <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  // 滚动位置可能因为数据变少而超出范围，起点收敛到「最后一屏」避免渲染空列表
  const maxStart = Math.max(0, total - visibleCount);
  const startIndex = Math.min(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan), maxStart);
  const endIndex = Math.min(total, startIndex + visibleCount);
  return { startIndex, endIndex };
}

/**
 * 固定行高虚拟滚动：只渲染视口内的行，1 万行 DOM 节点从 10000 降到 ~20。
 * 关键点：外层滚动容器 + 内层占位高度撑开滚动条 + 绝对定位渲染可视行。
 */
export function useVirtualList<T>(items: T[], { itemHeight, overscan = 6 }: Options) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const rafRef = useRef<number | null>(null);
  const latestScrollTop = useRef(0);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => setViewportHeight(element.clientHeight);
    measure();

    // 侧边栏折叠 / 窗口缩放都会改变视口高度，用 ResizeObserver 统一监听
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    latestScrollTop.current = event.currentTarget.scrollTop;
    // rAF 节流：滚动事件高频触发，合帧更新避免每帧多次 render
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      setScrollTop(latestScrollTop.current);
    });
  }, []);

  useLayoutEffect(
    () => () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const { virtualItems, totalHeight, startIndex } = useMemo(() => {
    const total = items.length * itemHeight;
    if (!viewportHeight) {
      return { virtualItems: [] as VirtualItem[], totalHeight: total, startIndex: 0 };
    }
    const { startIndex: first, endIndex: last } = computeVirtualWindow({
      scrollTop,
      viewportHeight,
      itemHeight,
      overscan,
      total: items.length,
    });
    const rows: VirtualItem[] = [];
    for (let index = first; index < last; index += 1) {
      rows.push({ index, offsetTop: index * itemHeight });
    }
    return { virtualItems: rows, totalHeight: total, startIndex: first };
  }, [items.length, itemHeight, overscan, scrollTop, viewportHeight]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const element = containerRef.current;
      if (!element) return;
      element.scrollTop = Math.max(0, index * itemHeight - itemHeight);
    },
    [itemHeight],
  );

  return {
    containerRef,
    onScroll,
    virtualItems,
    totalHeight,
    startIndex,
    scrollToIndex,
    viewportHeight,
  };
}
