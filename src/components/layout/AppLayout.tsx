import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { Toaster } from '@/components/ui/Toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUiStore } from '@/store/ui';

export function AppLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`main ${collapsed ? 'main--collapsed' : ''}`}>
        <Topbar />
        <main className="page">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
