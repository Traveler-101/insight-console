import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { useVirtualList } from '@/hooks/useVirtualList';

export interface Column<T> {
  key: string;
  label: string;
  /** CSS grid 宽度，如 '1.2fr' / '140px' */
  width?: string;
  align?: 'left' | 'right';
  sortable?: boolean;
  render: (row: T) => ReactNode;
}

interface VirtualTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHeight?: number;
  height?: number;
  sort?: { key: string; order: 'asc' | 'desc' };
  onSortChange?: (key: string) => void;
  selected?: Set<string>;
  onSelectChange?: (next: Set<string>) => void;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
  empty?: ReactNode;
}

/**
 * 通用虚拟滚动表格：
 * - 只管「渲染可视行」，筛选/排序/分页仍由数据层负责；
 * - 表头与滚动区分层，表头用 scrollbar 宽度补偿保证列对齐。
 */
export function VirtualTable<T>({
  columns,
  rows,
  rowKey,
  rowHeight = 48,
  height = 560,
  sort,
  onSortChange,
  selected,
  onSelectChange,
  onRowClick,
  footer,
  empty,
}: VirtualTableProps<T>) {
  const { containerRef, onScroll, virtualItems, totalHeight } = useVirtualList(rows, {
    itemHeight: rowHeight,
    overscan: 8,
  });
  const headRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const sync = () => setScrollbarWidth(Math.max(0, element.offsetWidth - element.clientWidth));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  const selectable = Boolean(selected && onSelectChange);
  const template = `${selectable ? '42px ' : ''}${columns.map((column) => column.width ?? '1fr').join(' ')}`;
  const gridStyle: CSSProperties = { gridTemplateColumns: template };

  const allChecked = rows.length > 0 && rows.every((row) => selected?.has(rowKey(row)));
  const someChecked = !allChecked && rows.some((row) => selected?.has(rowKey(row)));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleAll = (checked: boolean) => {
    if (!selected || !onSelectChange) return;
    const next = new Set(selected);
    rows.forEach((row) => {
      if (checked) next.add(rowKey(row));
      else next.delete(rowKey(row));
    });
    onSelectChange(next);
  };

  return (
    <div className="vtable">
      <div className="vtable-head" ref={headRef} style={{ ...gridStyle, paddingRight: 16 + scrollbarWidth }}>
        {selectable && (
          <input
            ref={selectAllRef}
            type="checkbox"
            aria-label="全选当前结果"
            checked={allChecked}
            onChange={(event) => toggleAll(event.target.checked)}
          />
        )}
        {columns.map((column) => (
          <div
            key={column.key}
            className={column.align === 'right' ? 'vtable-cell--right' : ''}
            style={{ minWidth: 0 }}
          >
            {column.sortable && onSortChange ? (
              <button
                className={`sort-btn ${sort?.key === column.key ? 'active' : ''}`}
                onClick={() => onSortChange(column.key)}
              >
                {column.label}
                <Icon
                  name={sort?.key === column.key && sort.order === 'asc' ? 'arrowUp' : 'arrowDown'}
                  size={11}
                  style={{ opacity: sort?.key === column.key ? 1 : 0.35 }}
                />
              </button>
            ) : (
              column.label
            )}
          </div>
        ))}
      </div>

      <div
        className="vtable-scroll"
        ref={containerRef}
        onScroll={onScroll}
        style={{ height }}
        role="rowgroup"
      >
        {rows.length === 0 ? (
          <div className="vtable-empty">{empty ?? '暂无数据'}</div>
        ) : (
          <div className="vtable-canvas" style={{ height: totalHeight }}>
            {virtualItems.map(({ index, offsetTop }) => {
              const row = rows[index];
              const id = rowKey(row);
              const isSelected = selected?.has(id) ?? false;
              return (
                <div
                  key={id}
                  className={`vtable-row ${isSelected ? 'selected' : ''}`}
                  style={{ ...gridStyle, height: rowHeight, transform: `translateY(${offsetTop}px)` }}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <input
                      type="checkbox"
                      aria-label={`选择 ${id}`}
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        const next = new Set<string>(selected ?? []);
                        if (event.target.checked) next.add(id);
                        else next.delete(id);
                        onSelectChange?.(next);
                      }}
                    />
                  )}
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={`vtable-cell ${column.align === 'right' ? 'vtable-cell--right' : ''}`}
                    >
                      {column.render(row)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {footer && <div className="table-foot">{footer}</div>}
    </div>
  );
}
