import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';

export function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h1 style={{ fontSize: 20, fontWeight: 650 }}>页面走丢了</h1>
      <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
        你访问的地址不存在，或者已被移动到其他位置。
      </p>
      <Link to="/" className="btn btn--primary" style={{ marginTop: 8 }}>
        <Icon name="chevronLeft" size={15} />
        返回概览
      </Link>
    </div>
  );
}
