import type { Order, OrderQuery, OrderStatus, Paginated } from '@/types';
import { ApiError, mockRequest } from './client';
import { MOCK_ORDERS } from './mockData';

/** 内存库：让新增/修改在会话内可见，模拟服务端持久化 */
let store: Order[] = [...MOCK_ORDERS];

export function resetOrderStore() {
  store = [...MOCK_ORDERS];
}

const matches = (order: Order, query: OrderQuery) => {
  const keyword = query.keyword.trim().toLowerCase();
  if (keyword) {
    const haystack = `${order.id}${order.customer}${order.city}`.toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }
  if (query.status !== 'all' && order.status !== query.status) return false;
  if (query.channel !== 'all' && order.channel !== query.channel) return false;
  return true;
};

const compare = (a: Order, b: Order, query: OrderQuery) => {
  const dir = query.sortOrder === 'asc' ? 1 : -1;
  if (query.sortBy === 'amount') return (a.amount - b.amount) * dir;
  return a.createdAt.localeCompare(b.createdAt) * dir;
};

export async function listOrders(query: OrderQuery, signal?: AbortSignal): Promise<Paginated<Order>> {
  return mockRequest(
    () => {
      const filtered = store.filter((order) => matches(order, query)).sort((a, b) => compare(a, b, query));
      const start = (query.page - 1) * query.pageSize;
      return {
        rows: filtered.slice(start, start + query.pageSize),
        total: filtered.length,
      };
    },
    { signal, delay: 380 },
  );
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return mockRequest(
    () => {
      const index = store.findIndex((order) => order.id === id);
      if (index === -1) throw new ApiError('订单不存在', 404, 'NOT_FOUND');
      const next = { ...store[index], status };
      store = store.map((order, i) => (i === index ? next : order));
      return next;
    },
    { delay: 520 },
  );
}

/** 大数据量导出走「分页拉全量」，真实项目里换成流式下载 */
export async function exportOrders(query: OrderQuery): Promise<Order[]> {
  return mockRequest(
    () => store.filter((order) => matches(order, query)).sort((a, b) => compare(a, b, query)),
    { delay: 700 },
  );
}
