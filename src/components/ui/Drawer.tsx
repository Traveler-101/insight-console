import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/Icon';

interface DrawerProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * 用 Portal 渲染到 body：
 * 1) 避免被父级 overflow / transform 裁剪；
 * 2) 打开时锁滚动 + Esc 关闭 + 焦点回归触发器，兼顾手动无障碍处理。
 */
export function Drawer({ open, title, description, onClose, footer, children }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={String(title)}>
        <header className="drawer-head">
          <div>
            <h3 className="card-title">{title}</h3>
            {description && <p className="card-sub">{description}</p>}
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={17} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </>,
    document.body,
  );
}
