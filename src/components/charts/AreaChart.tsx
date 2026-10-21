import { useMemo, useRef, useState } from 'react';
import { useElementSize } from '@/hooks/useElementSize';

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  values: number[];
}

interface AreaChartProps {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  yTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  showArea?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const PADDING = { top: 16, right: 14, bottom: 26, left: 54 };

/** 把最大值向上取整到「好看」的刻度，避免 Y 轴出现 83,417 这种数字 */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const normalized = value / base;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * base;
}

function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) return `M${points.map((p) => `${p.x},${p.y}`).join(' L')}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    // Catmull-Rom 转三次贝塞尔，系数 1/6 保证曲线穿过每个数据点
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * 纯 SVG 折线/面积图，不引第三方图表库：
 * 自行处理比例尺、坐标轴、悬停吸附、键盘导航与响应式重绘。
 */
export function AreaChart({
  labels,
  series,
  height = 260,
  yTickFormatter = (value) => `${Math.round(value)}`,
  valueFormatter = (value) => `${Math.round(value)}`,
  showArea = true,
}: AreaChartProps) {
  const [hostRef, size] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const width = size.width;
  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = Math.max(0, height - PADDING.top - PADDING.bottom);
  const count = labels.length;

  const yMax = useMemo(() => {
    const max = Math.max(1, ...series.flatMap((item) => item.values));
    return niceCeil(max);
  }, [series]);

  const xOf = (index: number) =>
    count <= 1 ? PADDING.left + plotWidth / 2 : PADDING.left + (index / (count - 1)) * plotWidth;
  const yOf = (value: number) => PADDING.top + plotHeight - (value / yMax) * plotHeight;

  const yTicks = useMemo(() => [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMax * ratio), [yMax]);

  const xTickIndexes = useMemo(() => {
    if (count <= 6) return labels.map((_, index) => index);
    const desired = width < 520 ? 4 : 7;
    const step = Math.max(1, Math.ceil((count - 1) / (desired - 1)));
    const result: number[] = [];
    for (let i = 0; i < count; i += step) result.push(i);
    if (result[result.length - 1] !== count - 1) result.push(count - 1);
    return result;
  }, [count, labels, width]);

  const pickIndex = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || count === 0) return null;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - PADDING.left;
    const ratio = plotWidth === 0 ? 0 : x / plotWidth;
    return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
  };

  const active = activeIndex != null && activeIndex < count ? activeIndex : null;
  const tooltipLeft = active != null ? Math.min(width - 78, Math.max(78, xOf(active))) : 0;
  const tooltipTop =
    active != null ? Math.min(...series.map((item) => yOf(item.values[active] ?? 0))) : 0;

  return (
    <div
      className="chart-host"
      ref={hostRef}
      style={{ height }}
      tabIndex={0}
      role="img"
      aria-label={`趋势图，共 ${count} 个数据点，包含 ${series.map((item) => item.name).join('、')}`}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        setActiveIndex((prev) => {
          const base = prev ?? count - 1;
          return Math.min(count - 1, Math.max(0, base + (event.key === 'ArrowRight' ? 1 : -1)));
        });
      }}
      onBlur={() => setActiveIndex(null)}
    >
      {width > 0 && (
        <svg
          ref={svgRef}
          className="chart-svg"
          width={width}
          height={height}
          onMouseMove={(event) => setActiveIndex(pickIndex(event.clientX))}
          onMouseLeave={() => setActiveIndex(null)}
          onTouchStart={(event) => setActiveIndex(pickIndex(event.touches[0].clientX))}
          onTouchMove={(event) => setActiveIndex(pickIndex(event.touches[0].clientX))}
          onTouchEnd={() => setActiveIndex(null)}
        >
          <defs>
            {series.map((item) => (
              <linearGradient key={item.key} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>

          {yTicks.map((tick, index) => {
            const y = yOf(tick);
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="var(--grid-line)"
                  strokeDasharray={index === 0 ? undefined : '3 5'}
                />
                <text
                  x={PADDING.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10.5"
                  fill="var(--text-3)"
                >
                  {yTickFormatter(tick)}
                </text>
              </g>
            );
          })}

          {xTickIndexes.map((index) => (
            <text
              key={index}
              x={xOf(index)}
              y={height - 8}
              textAnchor={index === 0 ? 'start' : index === count - 1 ? 'end' : 'middle'}
              fontSize="10.5"
              fill="var(--text-3)"
            >
              {labels[index]}
            </text>
          ))}

          {count > 0 &&
            series.map((item) => {
            const points = item.values.map((value, index) => ({ x: xOf(index), y: yOf(value) }));
            const line = smoothPath(points);
            const area = `${line} L${xOf(count - 1)},${PADDING.top + plotHeight} L${xOf(0)},${
              PADDING.top + plotHeight
            } Z`;
            return (
              <g key={item.key}>
                {showArea && <path d={area} fill={`url(#grad-${item.key})`} />}
                <path
                  className="line-anim"
                  d={line}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                />
              </g>
            );
          })}

          {active != null && (
            <g pointerEvents="none">
              <line
                x1={xOf(active)}
                x2={xOf(active)}
                y1={PADDING.top}
                y2={PADDING.top + plotHeight}
                stroke="var(--border-strong)"
                strokeDasharray="4 4"
              />
              {series.map((item) => (
                <g key={item.key}>
                  <circle cx={xOf(active)} cy={yOf(item.values[active] ?? 0)} r="6" fill={item.color} opacity="0.16" />
                  <circle
                    cx={xOf(active)}
                    cy={yOf(item.values[active] ?? 0)}
                    r="3.2"
                    fill="var(--surface)"
                    stroke={item.color}
                    strokeWidth="2"
                  />
                </g>
              ))}
            </g>
          )}
        </svg>
      )}

      {active != null && (
        <div className="chart-tooltip" style={{ left: tooltipLeft, top: tooltipTop }}>
          <div className="chart-tooltip-title">{labels[active]}</div>
          {series.map((item) => (
            <div className="chart-tooltip-row" key={item.key}>
              <span className="chart-tooltip-key">
                <i className="legend-swatch" style={{ background: item.color }} />
                {item.name}
              </span>
              <span className="chart-tooltip-val">{valueFormatter(item.values[active] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
