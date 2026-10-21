import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  revealDelay?: number;
}

/** 统一卡片容器：标题区/操作区/内容区固定结构，避免每个页面重复写布局 */
export function Card({ title, sub, actions, children, className = '', flush, revealDelay = 0 }: CardProps) {
  const style: CSSProperties | undefined = revealDelay
    ? { animationDelay: `${revealDelay}ms` }
    : undefined;

  return (
    <section className={`card reveal ${className}`.trim()} style={style}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {sub && <p className="card-sub">{sub}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={flush ? 'card-body--flush' : 'card-body'}>{children}</div>
    </section>
  );
}
