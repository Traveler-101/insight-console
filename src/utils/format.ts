const cny = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

const cnyPrecise = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 大额金额压缩成「万 / 亿」，仪表盘卡片里更易读 */
export function formatCurrency(value: number, compact = false): string {
  if (!compact) return cny.format(value);
  if (Math.abs(value) >= 1e8) return `¥${(value / 1e8).toFixed(2)} 亿`;
  if (Math.abs(value) >= 1e4) return `¥${(value / 1e4).toFixed(1)} 万`;
  return cny.format(value);
}

export function formatMoney(value: number): string {
  return cnyPrecise.format(value);
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1e8) return `${(value / 1e8).toFixed(2)} 亿`;
  if (Math.abs(value) >= 1e4) return `${(value / 1e4).toFixed(1)} 万`;
  return new Intl.NumberFormat('zh-CN').format(Math.round(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(Math.round(value));
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** KPI 主数值按单位分派格式化，避免每个组件重复 switch */
export function formatMetric(value: number, unit: 'currency' | 'number' | 'percent'): string {
  if (unit === 'currency') return formatCurrency(value, true);
  if (unit === 'percent') return `${value.toFixed(2)}%`;
  return formatCompactNumber(value);
}

/** YYYY-MM-DD → MM/DD，图表 X 轴用 */
export function shortDate(iso: string): string {
  return iso.slice(5).replace('-', '/');
}

export function relativeDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}
