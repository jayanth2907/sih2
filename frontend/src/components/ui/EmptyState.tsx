import React from 'react';
import clsx from 'clsx';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}) => {
  return (
    <div className={clsx('empty-state', compact ? 'py-8' : 'py-14', className)}>
      <Icon className="empty-state-icon" aria-hidden="true" />
      <p className="empty-state-title">{title}</p>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
};

/** Loading skeleton card */
export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={clsx('surface-card p-4 space-y-3', className)}>
      <div className="skeleton h-4 w-1/3 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
};

/** Page-level loading state */
export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading…',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" aria-hidden="true" />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
};
