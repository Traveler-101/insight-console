import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/components/Icon';
import { NAV_GROUPS } from '@/config/navigation';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

interface CommandItem {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  run: () => void;
}

/** Ctrl/Cmd + K 命令面板：路由跳转 + 常用操作的统一入口 */
export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [keyword, setKeyword] = useState('');
  const [cursor, setCursor] = useState(0);

  const items = useMemo<CommandItem[]>(() => {
    const navItems = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        id: item.to,
        label: item.label,
        hint: group.label,
        icon: item.icon,
        run: () => navigate(item.to),
      })),
    );
    return [
      ...navItems,
      {
        id: 'theme',
        label: '切换深浅色主题',
        hint: '外观',
        icon: 'sun' as IconName,
        run: toggleTheme,
      },
      {
        id: 'logout',
        label: '退出登录',
        hint: '账号',
        icon: 'logout' as IconName,
        run: () => {
          logout();
          navigate('/login', { replace: true });
        },
      },
    ];
  }, [navigate, toggleTheme, logout]);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return query ? items.filter((item) => item.label.toLowerCase().includes(query)) : items;
  }, [items, keyword]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!open);
        return;
      }
      if (!open) return;
      if (event.key === 'Escape') {
        setOpen(false);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((prev) => Math.min(filtered.length - 1, prev + 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((prev) => Math.max(0, prev - 1));
      } else if (event.key === 'Enter') {
        const target = filtered[cursor];
        if (target) {
          target.run();
          setOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, cursor, setOpen]);

  useEffect(() => {
    if (open) {
      setKeyword('');
      setCursor(0);
      // 等 Portal / 动画挂载后再聚焦，避免 focus 被覆盖
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        style={{
          position: 'fixed',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 520,
          maxWidth: '92vw',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '13px 15px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setCursor(0);
            }}
            placeholder="搜索页面或操作…"
            style={{
              flex: 1,
              border: 0,
              outline: 'none',
              background: 'transparent',
              fontSize: 13.5,
            }}
          />
          <kbd className="kbd">ESC</kbd>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
              没有匹配结果
            </div>
          )}
          {filtered.map((item, index) => (
            <button
              key={item.id}
              onMouseEnter={() => setCursor(index)}
              onClick={() => {
                item.run();
                setOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                border: 0,
                borderRadius: 9,
                cursor: 'pointer',
                textAlign: 'left',
                background: index === cursor ? 'var(--accent-soft)' : 'transparent',
                color: index === cursor ? 'var(--accent-strong)' : 'var(--text-2)',
                fontSize: 13,
              }}
            >
              <Icon name={item.icon} size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
