import type { CSSProperties } from 'react';
import type { CohortCell } from '@/types';

interface HeatmapProps {
  cells: CohortCell[];
}

/**
 * 留存热力图：纯 CSS Grid 实现，颜色透明度映射留存率，
 * 比引入图表库轻量得多，也便于做响应式。
 */
export function Heatmap({ cells }: HeatmapProps) {
  const cohorts = [...new Set(cells.map((cell) => cell.cohort))];
  const days = [...new Set(cells.map((cell) => cell.day))].sort((a, b) => a - b);
  const get = (cohort: string, day: number) =>
    cells.find((cell) => cell.cohort === cohort && cell.day === day)?.retention ?? 0;

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))`,
  };

  const cellStyle = (value: number): CSSProperties => ({
    background: `rgba(79, 107, 255, ${(0.06 + (value / 100) * 0.8).toFixed(3)})`,
    color: value > 46 ? '#fff' : 'var(--text-2)',
  });

  return (
    <div className="heatmap" style={gridStyle}>
      <div />
      {days.map((day) => (
        <div key={`d-${day}`} style={{ textAlign: 'center', color: 'var(--text-3)', paddingBottom: 2 }}>
          D{day}
        </div>
      ))}
      {cohorts.map((cohort) => (
        <div key={cohort} style={{ display: 'contents' }}>
          <div style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>{cohort}</div>
          {days.map((day) => {
            const value = get(cohort, day);
            return (
              <div
                key={`${cohort}-${day}`}
                className="heat-cell"
                style={cellStyle(value)}
                title={`${cohort}  cohort · D${day} 留存 ${value.toFixed(1)}%`}
              >
                {value.toFixed(0)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
