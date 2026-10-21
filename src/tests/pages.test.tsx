import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { OverviewPage } from '@/pages/Overview';
import { AnalyticsPage } from '@/pages/Analytics';
import { OrdersPage } from '@/pages/Orders';
import { TeamPage } from '@/pages/Team';
import { useAuthStore } from '@/store/auth';
import { MOCK_USERS, ROLE_PERMISSIONS } from '@/api/mockData';

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  const user = MOCK_USERS[0];
  useAuthStore.setState({
    session: {
      token: 'mock.u_1001.test',
      user,
      permissions: ROLE_PERMISSIONS[user.role] as never,
    },
    status: 'authenticated',
    error: null,
  });
});

describe('页面渲染冒烟测试', () => {
  it('概览页加载完成后展示 KPI 与图表标题', async () => {
    render(
      <Providers>
        <OverviewPage />
      </Providers>,
    );

    expect(screen.getByText('经营概览')).toBeInTheDocument();
    expect(await screen.findByText('近 7 日 GMV', undefined, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('渠道营收结构')).toBeInTheDocument();
    expect(screen.getByText('转化漏斗')).toBeInTheDocument();
  });

  it('增长分析展示关键结论与留存热力图', async () => {
    render(
      <Providers>
        <AnalyticsPage />
      </Providers>,
    );

    expect(await screen.findByText('用户留存热力图', undefined, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('关键结论')).toBeInTheDocument();
    expect(screen.getByText('整链路转化率')).toBeInTheDocument();
  });

  it('订单中心渲染 1 万条数据并只挂载可视行', async () => {
    const { container } = render(
      <Providers>
        <OrdersPage />
      </Providers>,
    );

    expect(await screen.findByText(/共 10,000 条/, undefined, { timeout: 4000 })).toBeInTheDocument();
    const rows = container.querySelectorAll('.vtable-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(40);
  });

  it('成员页展示权限矩阵', async () => {
    render(
      <Providers>
        <TeamPage />
      </Providers>,
    );

    expect(screen.getByText('角色权限矩阵')).toBeInTheDocument();
    expect(await screen.findByText('林清和', undefined, { timeout: 4000 })).toBeInTheDocument();
  });
});
