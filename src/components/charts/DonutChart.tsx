import { useState } from 'react';
import { formatCurrency } from '@/utils/format';

interface DonutDatum {
  name: string;
  value: number;
}

interface DonutChartProps {
  data: DonutDatum[];
  colors?: string[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}

const PALETTE = ['#4f6bff', '#7c5cfc', '#12b5a4', '#f0a02a', '#e5648a'];

/** 用 stroke-dasharray 画环形图：比 path 弧线更简单，且天然带圆角端点 */
export function DonutChart({
  data,
  colors = PALETTE,
  size = 164,
  thickness = 15,
  centerLabel = '总营收',
}: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cursor = 0;
  const slices = data.map((item, index) => {
    const ratio = item.value / total;
    const length = Math.max(0, ratio * circumference - 3);
    const offset = -cursor * circumference;
    cursor += ratio;
    return {
      ...item,
      ratio,
      color: colors[index % colors.length],
      dasharray: `${length} ${circumference - length}`,
      dashoffset: offset,
      index,
    };
  });

  const active = hovered != null ? slices[hovered] : null;

  return (
    <div className="donut-wrap">
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} role="img" aria-label="渠道营收占比">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
          {slices.map((slice) => (
            <circle
              key={slice.name}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={hovered === slice.index ? thickness + 4 : thickness}
              strokeDasharray={slice.dasharray}
              strokeDashoffset={slice.dashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              opacity={hovered == null || hovered === slice.index ? 1 : 0.32}
              style={{ transition: 'stroke-width 0.18s, opacity 0.18s', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(slice.index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div className="donut-center-value tabular">
            {active ? `${(active.ratio * 100).toFixed(1)}%` : formatCurrency(total, true)}
          </div>
          <div className="donut-center-label">{active ? active.name : centerLabel}</div>
        </div>
      </div>

      <div className="donut-legend">
        {slices.map((slice) => (
          <div
            key={slice.name}
            className="donut-legend-row"
            onMouseEnter={() => setHovered(slice.index)}
            onMouseLeave={() => setHovered(null)}
            style={{ opacity: hovered == null || hovered === slice.index ? 1 : 0.5, transition: 'opacity .18s' }}
          >
            <i className="legend-swatch" style={{ background: slice.color }} />
            <span className="donut-legend-name">{slice.name}</span>
            <span className="donut-legend-value">{formatCurrency(slice.value, true)}</span>
            <span className="donut-legend-pct">{(slice.ratio * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
