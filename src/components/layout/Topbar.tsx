import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { PAGE_TITLES } from '@/config/navigation';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const pushToast = useUiStore((state) => state.pushToast);
  const session = useAuthStore((state) => state.session);

  const current = PAGE_TITLES[location.pathname] ?? { title: '页面', sub: '' };

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={toggleSidebar} aria-label="折叠侧边栏">
        <Icon name="panel" size={17} />
      </button>

      <div className="topbar-crumbs">
        <span>工作台</span>
        <Icon name="chevronRight" size={13} />
        <strong>{current.title}</strong>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <button className="search-trigger" onClick={() => setCommandOpen(true)} aria-label="打开命令面板">
          <Icon name="search" size={15} />
          <span>搜索页面或操作</span>
          <kbd className="kbd">Ctrl K</kbd>
        </button>

        <button
          className="icon-btn icon-btn--bordered"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          title={theme === 'light' ? '深色模式' : '浅色模式'}
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
        </button>

        <button
          className="icon-btn icon-btn--bordered"
          aria-label="查看通知"
          onClick={() =>
            pushToast({
              title: '暂无新通知',
              description: '指标预警规则可在「工作台设置」中调整',
              tone: 'info',
            })
          }
        >
          <Icon name="bell" size={16} />
        </button>

        <div className="avatar avatar--sm" title={session?.user.name}>
          {session?.user.name.slice(0, 1)}
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => navigate('/analytics')}>
          <Icon name="spark" size={14} />
          生成周报
        </button>
      </div>
    </header>
  );
}
