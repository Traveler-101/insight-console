import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Funnel } from '@/components/charts/Funnel';
import { Sparkline } from '@/components/charts/Sparkline';
import { getAnalytics } from '@/api/analytics';
import { REALTIME_EVENTS } from '@/api/mockData';
import { useCountUp } from '@/hooks/useCountUp';
import { useUiStore } from '@/store/ui';
import type { KpiCard, TrendRange } from '@/types';
import { formatCompactNumber, formatCurrency, formatMetric, formatNumber, relativeDelta, shortDate } from '@/utils/format';

type MetricKey = 'revenue' | 'orders' | 'visitors';

const METRIC_META: Record<MetricKey, { label: string; color: string; unit: 'currency' | 'number' }> = {
  revenue: { label: 'GMV', color: '#4f6bff', unit: 'currency' },
  orders: { label: '订单量', color: '#7c5cfc', unit: 'number' },
  visitors: { label: '访问 UV', color: '#12b5a4', unit: 'number' },
};

function KpiTile({ kpi, index }: { kpi: KpiCard; index: number }) {
  const animated = useCountUp(kpi.value);
  const up = kpi.delta >= 0;
  const display =
    kpi.unit === 'percent'
      ? `${animated.toFixed(2)}%`
      : kpi.unit === 'currency'
        ? formatCurrency(animated, true)
        : formatCompactNumber(animated);

  return (
    <article className="kpi-card reveal" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="kpi-label">
        <span>{kpi.label}</span>
        <Badge tone="accent">环比</Badge>
      </div>
      <div className="kpi-value">{display}</div>
      <div className="kpi-foot">
        <div>
          <span className={`delta ${up ? '' : 'delta--down'}`}>
            <Icon name={up ? 'arrowUp' : 'arrowDown'} size={12} />
            {relativeDelta(kpi.delta)}
          </span>
          <div className="kpi-hint">{kpi.hint}</div>
        </div>
        <div className="kpi-spark">
          <Sparkline
            values={kpi.series}
            color={up ? '#12b5a4' : '#e5484d'}
            width={92}
            height={34}
          />
        </div>
      </div>
    </article>
  );
}

export function OverviewPage() {
  const [range, setRange] = useState<TrendRange>('30d');
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const autoRefresh = useUiStore((state) => state.autoRefresh);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['analytics', range],
    queryFn: ({ signal }) => getAnalytics(range, signal),
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const meta = METRIC_META[metric];
  const channelTotal = (data?.channels ?? []).reduce((acc, item) => acc + item.value, 0);
  const privateChannel = data?.channels.find((item) => item.name === '私域');
  const privateShare = privateChannel && channelTotal ? (privateChannel.value / channelTotal) * 100 : 0;
  const topChannel = Math.max(...(data?.channels ?? [{ value: 1 }]).map((item) => item.value), 1);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Overview</div>
          <h1 className="page-title">经营概览</h1>
          <p className="page-desc">
            全站核心指标 · 数据更新于今日 09:42 · 对比维度：上一周期
          </p>
        </div>
        <div className="page-actions">
          <Segmented
            ariaLabel="时间范围"
            value={range}
            onChange={setRange}
            options={[
              { value: '7d', label: '近 7 天' },
              { value: '30d', label: '近 30 天' },
              { value: '90d', label: '近 90 天' },
            ]}
          />
          <Button
            variant="outline"
            icon={!isFetching ? <Icon name="refresh" size={15} /> : undefined}
            loading={isFetching}
            onClick={() => refetch()}
          >
            刷新
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="kpi-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="kpi-card" key={item}>
              <Skeleton width={90} height={12} />
              <div style={{ marginTop: 12 }}>
                <Skeleton width={130} height={28} />
              </div>
              <div style={{ marginTop: 10 }}>
                <Skeleton width={110} height={10} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          {data.kpis.map((kpi, index) => (
            <KpiTile kpi={kpi} index={index} key={kpi.key} />
          ))}
        </div>
      )}

      <div className="section-grid grid-main-side">
        <Card
          title="营收趋势"
          sub={range === '7d' ? '按日聚合 · 近 7 天' : range === '30d' ? '按日聚合 · 近 30 天' : '按日聚合 · 近 90 天'}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="legend">
                <span className="legend-item">
                  <i className="legend-swatch" style={{ background: meta.color }} />
                  {meta.label}
                </span>
              </div>
              <Segmented
                ariaLabel="指标切换"
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
          {isLoading || !data ? (
            <Skeleton height={260} radius={12} />
          ) : (
            <AreaChart
              key={`${range}-${metric}`}
              height={268}
              labels={data.trend.map((point) => shortDate(point.date))}
              series={[
                {
                  key: metric,
                  name: meta.label,
                  color: meta.color,
                  values: data.trend.map((point) => point[metric]),
                },
              ]}
              yTickFormatter={(value) =>
                meta.unit === 'currency' ? formatCurrency(value, true) : formatCompactNumber(value)
              }
              valueFormatter={(value) =>
                meta.unit === 'currency' ? formatCurrency(value) : formatNumber(value)
              }
            />
          )}
        </Card>

        <Card
          title="渠道营收结构"
          sub="按支付订单归因"
          actions={<Badge tone="info">自动归因</Badge>}
        >
          {isLoading || !data ? (
            <Skeleton height={190} radius={12} />
          ) : (
            <DonutChart data={data.channels} />
          )}
          <div className="info-banner" style={{ marginTop: 16 }}>
            <Icon name="spark" size={15} />
            <span>
              私域渠道贡献了 <strong>{privateShare.toFixed(1)}%</strong> 的营收，获客成本比信息流低 32%。
            </span>
          </div>
        </Card>
      </div>

      <div className="section-grid grid-3" style={{ marginTop: 16 }}>
        <Card title="转化漏斗" sub="从访问到支付的环节流失" revealDelay={60}>
          {isLoading || !data ? <Skeleton height={150} /> : <Funnel stages={data.funnel} />}
        </Card>

        <Card title="实时动态" sub="每 30 秒刷新" actions={<Badge tone="success" dot>Live</Badge>} revealDelay={120}>
          <div className="activity-list">
            {REALTIME_EVENTS.map((event) => (
              <div className="activity-item" key={event.id}>
                <i className={`activity-dot activity-dot--${event.tone}`} />
                <div>
                  <div className="activity-text">{event.text}</div>
                  <div className="activity-time">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="渠道排行" sub="近 30 天营收贡献" revealDelay={180}>
          <div className="rank-list">
            {(data?.channels ?? []).map((channel, index) => (
              <div className="rank-row" key={channel.name}>
                <span className="rank-index">{index + 1}</span>
                <span className="rank-name">{channel.name}</span>
                <div className="rank-bar">
                  <i style={{ width: `${(channel.value / topChannel) * 100}%` }} />
                </div>
                <span className="rank-value">{formatCurrency(channel.value, true)}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-3)',
            }}
          >
            <span>合计营收</span>
            <strong style={{ color: 'var(--text)' }}>{formatMetric(channelTotal, 'currency')}</strong>
          </div>
        </Card>
      </div>
    </>
  );
}
