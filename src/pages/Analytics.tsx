import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaChart } from '@/components/charts/AreaChart';
import { Funnel } from '@/components/charts/Funnel';
import { Heatmap } from '@/components/charts/Heatmap';
import { getAnalytics } from '@/api/analytics';
import { usePermission } from '@/hooks/usePermission';
import { useUiStore } from '@/store/ui';
import type { TrendRange } from '@/types';
import { downloadCsv, toCsv } from '@/utils/csv';
import {
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
  relativeDelta,
  shortDate,
} from '@/utils/format';

type MetricKey = 'revenue' | 'orders' | 'visitors';

const METRIC: Record<MetricKey, { label: string; color: string; currency: boolean }> = {
  revenue: { label: 'GMV', color: '#4f6bff', currency: true },
  orders: { label: '支付订单', color: '#7c5cfc', currency: false },
  visitors: { label: '访问 UV', color: '#12b5a4', currency: false },
};

/** 移动平均：抹平单日波动，看清趋势方向 */
function movingAverage(values: number[], windowSize: number): number[] {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    return slice.reduce((acc, value) => acc + value, 0) / slice.length;
  });
}

export function AnalyticsPage() {
  const [range, setRange] = useState<TrendRange>('30d');
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const [showAverage, setShowAverage] = useState(true);
  const { can } = usePermission();
  const pushToast = useUiStore((state) => state.pushToast);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', range],
    queryFn: ({ signal }) => getAnalytics(range, signal),
  });

  const meta = METRIC[metric];

  const derived = useMemo(() => {
    if (!data) return null;
    const values = data.trend.map((point) => point[metric]);
    const average = movingAverage(values, 7);
    const bestIndex = values.indexOf(Math.max(...values));
    const channelTotal = data.channels.reduce((acc, item) => acc + item.value, 0) || 1;
    const visited = data.funnel[0]?.value ?? 1;
    const paid = data.funnel[data.funnel.length - 1]?.value ?? 0;
    return {
      values,
      average,
      bestIndex,
      bestDay: data.trend[bestIndex]?.date ?? '',
      channelTotal,
      overallCvr: (paid / visited) * 100,
    };
  }, [data, metric]);

  const series = useMemo(() => {
    if (!derived) return [];
    const list = [
      {
        key: 'actual',
        name: meta.label,
        color: meta.color,
        values: derived.values,
      },
    ];
    if (showAverage) {
      list.push({
        key: 'avg',
        name: '7 日均线',
        color: '#f0a02a',
        values: derived.average,
      });
    }
    return list;
  }, [derived, meta, showAverage]);

  const handleExport = () => {
    if (!data) return;
    const csv = toCsv(
      data.trend.map((point) => ({
        date: point.date,
        revenue: point.revenue,
        orders: point.orders,
        visitors: point.visitors,
      })),
      [
        { key: 'date', label: '日期' },
        { key: 'revenue', label: 'GMV(元)' },
        { key: 'orders', label: '支付订单数' },
        { key: 'visitors', label: '访问 UV' },
      ],
    );
    downloadCsv(`insight-trend-${range}.csv`, csv);
    pushToast({ title: '导出成功', description: `已生成 ${data.trend.length} 行趋势数据`, tone: 'success' });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Analytics</div>
          <h1 className="page-title">增长分析</h1>
          <p className="page-desc">趋势 · 归因 · 漏斗 · 留存，四层拆解增长质量</p>
        </div>
        <div className="page-actions">
          <Segmented
            ariaLabel="时间范围"
            value={range}
            onChange={setRange}
            options={[
              { value: '7d', label: '7 天' },
              { value: '30d', label: '30 天' },
              { value: '90d', label: '90 天' },
            ]}
          />
          <Button
            variant="outline"
            icon={<Icon name="download" size={15} />}
            onClick={handleExport}
            disabled={!can('order:export')}
            title={can('order:export') ? '导出趋势数据' : '当前角色无导出权限'}
          >
            导出 CSV
          </Button>
        </div>
      </div>

      {!can('order:export') && (
        <div className="info-banner" style={{ marginBottom: 16 }}>
          <Icon name="lock" size={15} />
          <span>当前为只读角色，「导出 CSV」已按权限禁用。切换管理员 / 分析师账号即可体验。</span>
        </div>
      )}

      {isLoading || !data || !derived ? (
        <div className="section-grid grid-main-side">
          <Card title="增长趋势">
            <Skeleton height={300} radius={12} />
          </Card>
          <Card title="关键结论">
            <Skeleton height={300} radius={12} />
          </Card>
        </div>
      ) : (
        <>
          <div className="section-grid grid-main-side">
            <Card
              title="增长趋势"
              sub={`${meta.label} 按日走势${showAverage ? ' · 含 7 日移动平均' : ''}`}
              actions={
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className={`btn btn--sm ${showAverage ? 'btn--outline' : 'btn--ghost'}`}
                    onClick={() => setShowAverage((prev) => !prev)}
                  >
                    <Icon name="pulse" size={14} />
                    均线
                  </button>
                  <Segmented
                    ariaLabel="指标"
                    value={metric}
                    onChange={(next) => setMetric(next)}
                    options={[
                      { value: 'revenue', label: 'GMV' },
                      { value: 'orders', label: '订单' },
                      { value: 'visitors', label: '访客' },
                    ]}
                  />
                </div>
              }
            >
              <AreaChart
                key={`${range}-${metric}-${showAverage}`}
                height={306}
                labels={data.trend.map((point) => shortDate(point.date))}
                series={series}
                yTickFormatter={(value) =>
                  meta.currency ? formatCurrency(value, true) : formatCompactNumber(value)
                }
                valueFormatter={(value) =>
                  meta.currency ? formatCurrency(value) : formatNumber(value)
                }
              />
            </Card>

            <div className="stack-16">
              <Card title="关键结论" sub="基于当前时间范围自动计算">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>峰值日</div>
                    <div style={{ fontSize: 18, fontWeight: 650, marginTop: 3 }}>
                      {derived.bestDay}
                      <span style={{ fontSize: 12, color: 'var(--success)', marginLeft: 8 }}>
                        {meta.currency
                          ? formatCurrency(derived.values[derived.bestIndex] ?? 0, true)
                          : formatNumber(derived.values[derived.bestIndex] ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>整链路转化率</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 18, fontWeight: 650 }}>{formatPercent(derived.overallCvr)}</span>
                      <Badge tone="accent">访问 → 支付</Badge>
                    </div>
                  </div>
                  <div className="detail-list">
                    {data.kpis.map((kpi) => (
                      <div className="detail-row" key={kpi.key}>
                        <span>{kpi.label}</span>
                        <strong className={kpi.delta >= 0 ? 'delta' : 'delta delta--down'}>
                          {relativeDelta(kpi.delta)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="渠道明细" sub="营收按支付归因拆分">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.channels.map((channel, index) => {
                    const share = (channel.value / derived.channelTotal) * 100;
                    return (
                      <div key={channel.name}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12.5,
                            marginBottom: 5,
                          }}
                        >
                          <span style={{ color: 'var(--text-2)' }}>{channel.name}</span>
                          <span className="tabular" style={{ fontWeight: 600 }}>
                            {formatCurrency(channel.value, true)}
                            <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
                              {share.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="rank-bar" style={{ width: '100%', height: 6 }}>
                          <i
                            style={{
                              width: `${share}%`,
                              background:
                                index === 0
                                  ? 'linear-gradient(90deg,#4f6bff,#7c5cfc)'
                                  : index === 1
                                    ? 'linear-gradient(90deg,#7c5cfc,#12b5a4)'
                                    : 'linear-gradient(90deg,#12b5a4,#5ad1c4)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          <div className="section-grid grid-main-side" style={{ marginTop: 16 }}>
            <Card title="转化漏斗" sub="环比上一周期，各环节转化率">
              <Funnel stages={data.funnel} />
              <div className="detail-list" style={{ marginTop: 8 }}>
                <div className="detail-row">
                  <span>加购率（浏览 → 加购）</span>
                  <strong>{formatPercent((data.funnel[2].value / data.funnel[1].value) * 100)}</strong>
                </div>
                <div className="detail-row">
                  <span>支付成功率（下单 → 支付）</span>
                  <strong>{formatPercent((data.funnel[4].value / data.funnel[3].value) * 100)}</strong>
                </div>
              </div>
            </Card>

            <Card title="渠道转化对比" sub="单渠道效率 = 支付订单 / 访问量">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.channels.map((channel, index) => {
                  // 演示数据：以整链路 CVR 为基线，乘以渠道转化系数
                  const cvr = derived.overallCvr * ([1.32, 1.06, 1.58, 0.82][index] ?? 1);
                  return (
                    <div key={channel.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ color: 'var(--text-2)' }}>{channel.name}</span>
                        <strong>{formatPercent(cvr)}</strong>
                      </div>
                      <div className="funnel-track" style={{ height: 9, marginTop: 6, borderRadius: 99 }}>
                        <div
                          className="funnel-bar"
                          style={{
                            width: `${cvr * 9}%`,
                            borderRadius: 99,
                            background:
                              cvr > 7 ? 'linear-gradient(90deg,#12b5a4,#5ad1c4)' : 'linear-gradient(90deg,#4f6bff,#7c5cfc)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card
            title="用户留存热力图"
            sub="按注册周分群，D0 ~ D7 留存率（%）"
            actions={<Badge tone="purple">Cohort</Badge>}
          >
            <div style={{ overflowX: 'auto' }}>
              <Heatmap cells={data.cohort} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
              D1 留存稳定在 60% 左右，但 D3 之后出现明显衰减，建议在第 3 天补一次召回触达。
            </p>
          </Card>
        </>
      )}
    </>
  );
}
