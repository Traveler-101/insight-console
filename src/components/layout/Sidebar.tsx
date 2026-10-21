import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { NAV_GROUPS } from '@/config/navigation';
import { ROLE_LABEL } from '@/api/mockData';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const initials = session?.user.name.slice(0, 1) ?? '访';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19V10M12 19V5M19 19v-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="brand-name">Insight Console</div>
          <div className="brand-sub">Data Workspace</div>
        </div>
      </div>

      <nav className="nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {item.tag && <em className="nav-tag">{item.tag}</em>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">{session?.user.name ?? '未登录'}</div>
            <div className="sidebar-user-role">
              {session ? ROLE_LABEL[session.user.role] : '—'}
            </div>
          </div>
          <button
            className="sidebar-foot-action"
            aria-label="退出登录"
            title="退出登录"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
