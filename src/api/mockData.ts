import type {
  AnalyticsPayload,
  ChannelShare,
  CohortCell,
  FunnelStage,
  KpiCard,
  Order,
  Role,
  TrendPoint,
  User,
} from '@/types';

/**
 * 使用固定种子的伪随机数，保证每次刷新图表/表格数据一致，
 * 这样截图、单测、面试演示都可复现。
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHANNELS: Order['channel'][] = ['自然流量', '信息流', '私域', '合作渠道'];
const CITIES = ['北京', '上海', '深圳', '杭州', '成都', '广州', '南京', '武汉', '西安', '苏州'];
const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'.split('');
const GIVEN = ['一鸣', '思远', '雨桐', '子墨', '若曦', '嘉宁', '文博', '梓涵', '云帆', '书瑶'];

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(d: Date): string {
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${formatDate(d)} ${hh}:${mm}`;
}

export const MOCK_USERS: User[] = [
  {
    id: 'u_1001',
    name: '林清和',
    email: 'admin@insight.dev',
    role: 'admin',
    department: '数据平台部',
    lastActive: '刚刚',
  },
  {
    id: 'u_1002',
    name: '周砚',
    email: 'analyst@insight.dev',
    role: 'analyst',
    department: '增长运营部',
    lastActive: '12 分钟前',
  },
  {
    id: 'u_1003',
    name: '苏晚',
    email: 'viewer@insight.dev',
    role: 'viewer',
    department: '客户成功部',
    lastActive: '2 小时前',
  },
  {
    id: 'u_1004',
    name: '陈屿',
    email: 'chenyu@insight.dev',
    role: 'analyst',
    department: '商业化部',
    lastActive: '昨天 18:40',
  },
  {
    id: 'u_1005',
    name: '许知野',
    email: 'xuzhiye@insight.dev',
    role: 'viewer',
    department: '财务部',
    lastActive: '3 天前',
  },
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['order:read', 'order:update', 'order:export', 'user:manage', 'settings:manage'],
  analyst: ['order:read', 'order:export'],
  viewer: ['order:read'],
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: '管理员',
  analyst: '数据分析师',
  viewer: '只读成员',
};

/** 生成按日聚合的趋势数据，带周末波动与缓慢增长 */
export function generateTrend(days: number, seed = 20261021): TrendPoint[] {
  const rand = mulberry32(seed);
  const points: TrendPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const weekday = d.getDay();
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.18 : 1;
    const growth = 1 + (days - i) / (days * 6);
    const noise = 0.86 + rand() * 0.3;
    const visitors = Math.round(8600 * weekendBoost * growth * noise);
    const orders = Math.round(visitors * (0.083 + rand() * 0.022));
    const revenue = Math.round(orders * (268 + rand() * 46));
    points.push({ date: formatDate(d), revenue, orders, visitors });
  }
  return points;
}

export function generateChannels(): ChannelShare[] {
  return [
    { name: '自然流量', value: 428600 },
    { name: '信息流', value: 312400 },
    { name: '私域', value: 186900 },
    { name: '合作渠道', value: 96400 },
  ];
}

export function generateFunnel(): FunnelStage[] {
  return [
    { stage: '访问落地页', value: 128400 },
    { stage: '浏览商品', value: 86300 },
    { stage: '加入购物车', value: 41200 },
    { stage: '提交订单', value: 23800 },
    { stage: '支付成功', value: 18640 },
  ];
}

export function generateCohort(): CohortCell[] {
  const rand = mulberry32(77);
  const cells: CohortCell[] = [];
  for (let c = 0; c < 8; c += 1) {
    const cohortDate = new Date();
    cohortDate.setDate(cohortDate.getDate() - (7 - c) * 7);
    const cohort = formatDate(cohortDate).slice(5);
    for (let day = 0; day <= 7; day += 1) {
      const base = day === 0 ? 100 : Math.max(8, 62 * Math.exp(-day / 2.6));
      cells.push({
        cohort,
        day,
        retention: Number((base + (rand() - 0.5) * 6).toFixed(1)),
      });
    }
  }
  return cells;
}

function buildKpis(trend: TrendPoint[]): KpiCard[] {
  const sum = (key: keyof TrendPoint, slice: TrendPoint[]) =>
    slice.reduce((acc, item) => acc + Number(item[key]), 0);
  const current = trend.slice(-7);
  const previous = trend.slice(-14, -7);

  const revenue = sum('revenue', current);
  const prevRevenue = sum('revenue', previous) || 1;
  const orders = sum('orders', current);
  const prevOrders = sum('orders', previous) || 1;
  const visitors = sum('visitors', current);
  const prevVisitors = sum('visitors', previous) || 1;
  const conversion = (orders / visitors) * 100;
  const prevConversion = (prevOrders / prevVisitors) * 100;

  const delta = (a: number, b: number) => Number((((a - b) / b) * 100).toFixed(1));

  return [
    {
      key: 'revenue',
      label: '近 7 日 GMV',
      value: revenue,
      unit: 'currency',
      delta: delta(revenue, prevRevenue),
      series: current.map((p) => p.revenue),
      hint: '较上一周期',
    },
    {
      key: 'orders',
      label: '支付订单数',
      value: orders,
      unit: 'number',
      delta: delta(orders, prevOrders),
      series: current.map((p) => p.orders),
      hint: '较上一周期',
    },
    {
      key: 'visitors',
      label: '访问 UV',
      value: visitors,
      unit: 'number',
      delta: delta(visitors, prevVisitors),
      series: current.map((p) => p.visitors),
      hint: '较上一周期',
    },
    {
      key: 'conversion',
      label: '支付转化率',
      value: Number(conversion.toFixed(2)),
      unit: 'percent',
      delta: Number((conversion - prevConversion).toFixed(1)),
      series: current.map((p) => Number(((p.orders / p.visitors) * 100).toFixed(2))),
      hint: '较上一周期',
    },
  ];
}

export function buildAnalytics(days: number, seed = 20261021): AnalyticsPayload {
  const trend = generateTrend(days, seed);
  return {
    trend,
    channels: generateChannels(),
    kpis: buildKpis(trend),
    funnel: generateFunnel(),
    cohort: generateCohort(),
  };
}

/** 生成 10000 条订单，用于验证虚拟滚动性能 */
export function generateOrders(count = 10000, seed = 421): Order[] {
  const rand = mulberry32(seed);
  const orders: Order[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const statusRoll = rand();
    const status: Order['status'] =
      statusRoll > 0.82 ? 'refunded' : statusRoll > 0.72 ? 'pending' : statusRoll > 0.69 ? 'failed' : 'paid';
    const createdAt = new Date(now - Math.floor(rand() * 90 * 24 * 3600 * 1000));
    orders.push({
      id: `SO${(202610000 + i).toString()}`,
      customer: `${pick(rand, SURNAMES)}${pick(rand, GIVEN)}`,
      channel: pick(rand, CHANNELS),
      amount: Math.round((59 + rand() * 2380) * 100) / 100,
      status,
      createdAt: formatDateTime(createdAt),
      city: pick(rand, CITIES),
      items: 1 + Math.floor(rand() * 5),
    });
  }
  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const MOCK_ORDERS = generateOrders();

export const REALTIME_EVENTS = [
  { id: 'e1', text: '私域渠道新增一笔 ¥1,268.00 的支付订单', time: '刚刚', tone: 'success' as const },
  { id: 'e2', text: '信息流广告 ROI 低于阈值 1.8，已触发预警', time: '3 分钟前', tone: 'warning' as const },
  { id: 'e3', text: '华东区域退款率环比上升 2.1%', time: '11 分钟前', tone: 'danger' as const },
  { id: 'e4', text: '「秋季新品」活动页转化率提升至 6.8%', time: '26 分钟前', tone: 'success' as const },
  { id: 'e5', text: '数据同步任务 ods_orders_d 执行完成', time: '41 分钟前', tone: 'info' as const },
];
