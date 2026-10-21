import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'purple' | 'info';

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot = false, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${tone === 'neutral' ? '' : `badge--${tone}`} ${className}`.trim()}>
      {dot && <i className="dot" />}
      {children}
    </span>
  );
}
