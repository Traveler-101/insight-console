import type { IconName } from '@/components/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  tag?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '数据洞察',
    items: [
      { to: '/', label: '经营概览', icon: 'dashboard', end: true },
      { to: '/analytics', label: '增长分析', icon: 'analytics', tag: 'BI' },
      { to: '/orders', label: '订单中心', icon: 'orders' },
    ],
  },
  {
    label: '组织与配置',
    items: [
      { to: '/team', label: '成员与权限', icon: 'users' },
      { to: '/settings', label: '工作台设置', icon: 'settings' },
    ],
  },
];

export const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/': { title: '经营概览', sub: '核心指标实时监控' },
  '/analytics': { title: '增长分析', sub: '渠道、漏斗与留存' },
  '/orders': { title: '订单中心', sub: '万级数据虚拟滚动' },
  '/team': { title: '成员与权限', sub: 'RBAC 角色模型' },
  '/settings': { title: '工作台设置', sub: '主题、密度与演示数据' },
};
