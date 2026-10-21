import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { LoginPage } from '@/pages/Login';
import { OverviewPage } from '@/pages/Overview';
import { AnalyticsPage } from '@/pages/Analytics';
import { OrdersPage } from '@/pages/Orders';
import { TeamPage } from '@/pages/Team';
import { SettingsPage } from '@/pages/Settings';
import { NotFoundPage } from '@/pages/NotFound';

function RequireAuth({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const location = useLocation();

  if (!session) {
    // 记录来路，登录成功后回跳，避免用户丢失上下文
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export default function App() {
  const theme = useUiStore((state) => state.theme);
  const density = useUiStore((state) => state.density);

  // 主题与密度挂在 <html> 上：登录页同样生效，切换后全局 CSS 变量立即重算
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
