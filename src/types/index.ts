/** 全局领域模型，前后端共享的类型契约集中放在这里 */

export type Role = 'admin' | 'analyst' | 'viewer';

export type Permission =
  | 'order:read'
  | 'order:update'
  | 'order:export'
  | 'user:manage'
  | 'settings:manage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  lastActive: string;
}

export interface Session {
  token: string;
  user: User;
  permissions: Permission[];
}

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface Order {
  id: string;
  customer: string;
  channel: '自然流量' | '信息流' | '私域' | '合作渠道';
  amount: number;
  status: OrderStatus;
  createdAt: string;
  city: string;
  items: number;
}

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
  visitors: number;
}

export interface ChannelShare {
  name: string;
  value: number;
}

export interface KpiCard {
  key: string;
  label: string;
  value: number;
  unit: 'currency' | 'number' | 'percent';
  delta: number;
  series: number[];
  hint: string;
}

export interface FunnelStage {
  stage: string;
  value: number;
}

export interface CohortCell {
  cohort: string;
  day: number;
  retention: number;
}

export interface AnalyticsPayload {
  trend: TrendPoint[];
  channels: ChannelShare[];
  kpis: KpiCard[];
  funnel: FunnelStage[];
  cohort: CohortCell[];
}

export type TrendRange = '7d' | '30d' | '90d';

export interface OrderQuery {
  keyword: string;
  status: OrderStatus | 'all';
  channel: Order['channel'] | 'all';
  sortBy: 'createdAt' | 'amount';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
}
