import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name="database" size={19} />
      </div>
      <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{title}</strong>
      {description && <span>{description}</span>}
      {action}
    </div>
  );
}
