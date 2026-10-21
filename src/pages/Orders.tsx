import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { VirtualTable, type Column } from '@/components/table/VirtualTable';
import { exportOrders, listOrders, updateOrderStatus } from '@/api/orders';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { useUiStore } from '@/store/ui';
import type { Order, OrderQuery, OrderStatus } from '@/types';
import { downloadCsv, toCsv } from '@/utils/csv';
import { formatMoney, formatNumber } from '@/utils/format';

const STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  paid: { label: '已支付', tone: 'success' },
  pending: { label: '待支付', tone: 'warning' },
  refunded: { label: '已退款', tone: 'purple' },
  failed: { label: '支付失败', tone: 'danger' },
};

const CHANNELS: Order['channel'][] = ['自然流量', '信息流', '私域', '合作渠道'];
const PAGE_SIZES = [50, 200, 1000, 10000];

const initialQuery: OrderQuery = {
  keyword: '',
  status: 'all',
  channel: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 10000,
};

export function OrdersPage() {
  const { can } = usePermission();
  const pushToast = useUiStore((state) => state.pushToast);
  const queryClient = useQueryClient();

  const [query, setQuery] = useState<OrderQuery>(initialQuery);
  const [keywordInput, setKeywordInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('paid');
  const debouncedKeyword = useDebounce(keywordInput, 320);

  // 搜索框防抖后同步进查询条件，并重置到第一页
  useEffect(() => {
    setQuery((prev) =>
      prev.keyword === debouncedKeyword ? prev : { ...prev, keyword: debouncedKeyword, page: 1 },
    );
  }, [debouncedKeyword]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['orders', query],
    queryFn: ({ signal }) => listOrders(query, signal),
    placeholderData: keepPreviousData,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const detail = rows.find((row) => row.id === detailId) ?? null;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  /** 乐观更新：先改本地缓存让 UI 立即响应，失败再回滚 */
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const snapshot = queryClient.getQueryData<{ rows: Order[]; total: number }>(['orders', query]);
      queryClient.setQueryData<{ rows: Order[]; total: number }>(['orders', query], (previous) =>
        previous
          ? { ...previous, rows: previous.rows.map((row) => (row.id === id ? { ...row, status } : row)) }
          : previous,
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshot) queryClient.setQueryData(['orders', query], context.snapshot);
      pushToast({ title: '状态更新失败', description: '已恢复为更新前的数据', tone: 'danger' });
    },
    onSuccess: (order) => {
      pushToast({
        title: '订单状态已更新',
        description: `${order.id} → ${STATUS_META[order.status].label}`,
        tone: 'success',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => updateOrderStatus(id, 'paid')));
      return ids.length;
    },
    onSuccess: (count) => {
      pushToast({ title: `已批量标记 ${count} 笔订单为已支付`, tone: 'success' });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateQuery = (patch: Partial<OrderQuery>) => {
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
    setSelected(new Set());
  };

  const handleExport = async () => {
    const all = await exportOrders(query);
    const csv = toCsv(
      all.map((order) => ({
        id: order.id,
        customer: order.customer,
        channel: order.channel,
        amount: order.amount,
        status: STATUS_META[order.status].label,
        createdAt: order.createdAt,
        city: order.city,
      })),
      [
        { key: 'id', label: '订单号' },
        { key: 'customer', label: '客户' },
        { key: 'channel', label: '渠道' },
        { key: 'amount', label: '金额' },
        { key: 'status', label: '状态' },
        { key: 'createdAt', label: '下单时间' },
        { key: 'city', label: '城市' },
      ],
    );
    downloadCsv(`insight-orders-${Date.now()}.csv`, csv);
    pushToast({ title: '导出完成', description: `共 ${all.length} 条订单`, tone: 'success' });
  };

  const columns = useMemo<Column<Order>[]>(
    () => [
      {
        key: 'id',
        label: '订单号',
        width: '1.15fr',
        render: (row) => <span className="mono">{row.id}</span>,
      },
      {
        key: 'customer',
        label: '客户',
        width: '1.25fr',
        render: (row) => (
          <div className="user-cell">
            <div className="avatar avatar--sm" style={{ background: 'linear-gradient(135deg,#6d83ff,#9a6bff)' }}>
              {row.customer.slice(0, 1)}
            </div>
            <span>{row.customer}</span>
          </div>
        ),
      },
      { key: 'channel', label: '渠道', width: '0.95fr', render: (row) => row.channel },
      {
        key: 'amount',
        label: '金额',
        width: '0.95fr',
        align: 'right',
        sortable: true,
        render: (row) => <span className="tabular">{formatMoney(row.amount)}</span>,
      },
      {
        key: 'status',
        label: '状态',
        width: '0.9fr',
        render: (row) => (
          <Badge tone={STATUS_META[row.status].tone} dot>
            {STATUS_META[row.status].label}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        label: '下单时间',
        width: '1.25fr',
        sortable: true,
        render: (row) => <span className="tabular" style={{ color: 'var(--text-2)' }}>{row.createdAt}</span>,
      },
      {
        key: 'actions',
        label: '操作',
        width: '0.85fr',
        align: 'right',
        render: (row) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setDetailId(row.id);
              setDraftStatus(row.status);
            }}
          >
            查看
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Orders</div>
          <h1 className="page-title">订单中心</h1>
          <p className="page-desc">
            {formatNumber(total)} 条订单数据 · 虚拟滚动只渲染可视行 · 排序与筛选在数据层完成
          </p>
        </div>
        <div className="page-actions">
          <Button
            variant="outline"
            icon={<Icon name="refresh" size={15} />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            刷新
          </Button>
          <Button
            variant="primary"
            icon={<Icon name="download" size={15} />}
            onClick={handleExport}
            disabled={!can('order:export')}
            title={can('order:export') ? '导出当前筛选结果' : '当前角色无导出权限'}
          >
            导出 CSV
          </Button>
        </div>
      </div>

      <div className="table-shell">
        <div className="table-toolbar">
          <div className="search-input-wrap">
            <Icon name="search" size={15} />
            <input
              className="input"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="搜索订单号 / 客户 / 城市"
              aria-label="搜索订单"
            />
          </div>

          <select
            className="select"
            value={query.status}
            aria-label="按状态筛选"
            onChange={(event) => updateQuery({ status: event.target.value as OrderQuery['status'] })}
          >
            <option value="all">全部状态</option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={query.channel}
            aria-label="按渠道筛选"
            onChange={(event) => updateQuery({ channel: event.target.value as OrderQuery['channel'] })}
          >
            <option value="all">全部渠道</option>
            {CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>

          <div className="spacer" />

          {selected.size > 0 && (
            <>
              <Badge tone="accent">已选 {selected.size} 条</Badge>
              {can('order:update') ? (
                <Button
                  size="sm"
                  variant="primary"
                  loading={batchMutation.isPending}
                  onClick={() => batchMutation.mutate([...selected])}
                >
                  批量标记已支付
                </Button>
              ) : (
                <span className="locked-note">
                  <Icon name="lock" size={13} /> 无批量操作权限
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                取消
              </Button>
            </>
          )}

          <span className="perf-chip">
            <Icon name="pulse" size={12} />
            DOM 行数 ≈ {Math.min(rows.length, 26)}
          </span>

          <select
            className="select"
            value={query.pageSize}
            aria-label="每页条数"
            onChange={(event) => updateQuery({ pageSize: Number(event.target.value) })}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size === 10000 ? '全部（虚拟滚动）' : `每页 ${size} 条`}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div style={{ padding: 40 }}>
            <EmptyState title="正在加载订单…" description="模拟接口延迟 380ms" />
          </div>
        ) : (
          <VirtualTable
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            rowHeight={48}
            height={560}
            sort={{ key: query.sortBy, order: query.sortOrder }}
            onSortChange={(key) => {
              const sortBy = key === 'amount' ? 'amount' : 'createdAt';
              updateQuery({
                sortBy,
                sortOrder: query.sortBy === sortBy && query.sortOrder === 'desc' ? 'asc' : 'desc',
              });
            }}
            selected={selected}
            onSelectChange={setSelected}
            onRowClick={(row) => {
              setDetailId(row.id);
              setDraftStatus(row.status);
            }}
            empty={
              <EmptyState
                title="没有匹配的订单"
                description="试着调整关键词或筛选条件"
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setKeywordInput('');
                      setQuery(initialQuery);
                    }}
                  >
                    重置筛选
                  </Button>
                }
              />
            }
            footer={
              <>
                <span>
                  共 {formatNumber(total)} 条 · 当前 {formatNumber(rows.length)} 条
                  {isFetching && ' · 更新中…'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>
                    第 {query.page} / {pageCount} 页
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={query.page <= 1}
                    onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    <Icon name="chevronLeft" size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={query.page >= pageCount}
                    onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    <Icon name="chevronRight" size={14} />
                  </Button>
                </div>
              </>
            }
          />
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
        提示：在「全部（虚拟滚动）」模式下，1 万条订单只渲染约 26 个 DOM 行；切换每页条数可对比分页与虚拟滚动的差异。
      </p>

      <Drawer
        open={Boolean(detail)}
        title={detail ? `订单 ${detail.id}` : '订单详情'}
        description={detail ? `${detail.createdAt} · ${detail.channel}` : undefined}
        onClose={() => setDetailId(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDetailId(null)}>
              关闭
            </Button>
            {can('order:update') ? (
              <Button
                variant="primary"
                loading={statusMutation.isPending}
                onClick={() => {
                  if (!detail) return;
                  statusMutation.mutate({ id: detail.id, status: draftStatus });
                }}
              >
                保存状态
              </Button>
            ) : (
              <span className="locked-note">
                <Icon name="lock" size={13} /> 只读角色不可修改
              </span>
            )}
          </>
        }
      >
        {detail && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div className="avatar" style={{ width: 42, height: 42 }}>
                {detail.customer.slice(0, 1)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.customer}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {detail.city} · {detail.items} 件商品
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>订单金额</div>
                <div style={{ fontSize: 20, fontWeight: 680 }}>{formatMoney(detail.amount)}</div>
              </div>
            </div>

            <div className="detail-list">
              <div className="detail-row">
                <span>当前状态</span>
                <Badge tone={STATUS_META[detail.status].tone} dot>
                  {STATUS_META[detail.status].label}
                </Badge>
              </div>
              <div className="detail-row">
                <span>订单号</span>
                <strong className="mono">{detail.id}</strong>
              </div>
              <div className="detail-row">
                <span>来源渠道</span>
                <strong>{detail.channel}</strong>
              </div>
              <div className="detail-row">
                <span>下单时间</span>
                <strong className="tabular">{detail.createdAt}</strong>
              </div>
              <div className="detail-row">
                <span>收货城市</span>
                <strong>{detail.city}</strong>
              </div>
              <div className="detail-row">
                <span>商品件数</span>
                <strong>{detail.items}</strong>
              </div>
              <div className="detail-row">
                <span>支付方式</span>
                <strong>在线支付</strong>
              </div>
            </div>

            {can('order:update') && (
              <label className="field" style={{ marginTop: 20 }}>
                <span className="field-label">修改订单状态</span>
                <select
                  className="select"
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as OrderStatus)}
                >
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>
                  保存后采用乐观更新，失败会自动回滚。
                </span>
              </label>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
