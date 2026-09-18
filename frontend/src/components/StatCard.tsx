import React from 'react';
import clsx from 'clsx';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'info';
  trend?: string;
  trendPositive?: boolean;
  action?: string;
  className?: string;
  onClick?: () => void;
}

const VARIANT_ICON_BG: Record<string, string> = {
  default:  'bg-[var(--bg-muted)]   text-[var(--text-secondary)]',
  success:  'bg-[var(--color-success-bg)]  text-[var(--color-success-text)]',
  warning:  'bg-[var(--color-warning-bg)]  text-[var(--color-warning-text)]',
  critical: 'bg-[var(--color-critical-bg)] text-[var(--color-critical-text)]',
  info:     'bg-[var(--color-info-bg)]     text-[var(--color-info-text)]',
};

const VARIANT_VALUE: Record<string, string> = {
  default:  'text-[var(--text-primary)]',
  success:  'text-[var(--color-success-text)]',
  warning:  'text-[var(--color-warning-text)]',
  critical: 'text-[var(--color-critical-text)]',
  info:     'text-[var(--color-info-text)]',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  trend,
  trendPositive,
  action,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={clsx(
        'metric-card',
        onClick ? 'metric-card-clickable' : '',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="metric-label">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={clsx('metric-value', VARIANT_VALUE[variant])}>
              {value}
            </span>
            {trend && (
              <span className={clsx(
                'text-xs font-medium',
                trendPositive === true  ? 'text-[var(--color-success-text)]' :
                trendPositive === false ? 'text-[var(--color-critical-text)]' :
                'text-[var(--text-muted)]'
              )}>
                {trend}
              </span>
            )}
          </div>
          {description && (
            <p className="metric-description mt-1">{description}</p>
          )}
        </div>
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          VARIANT_ICON_BG[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {action && onClick && (
        <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-[var(--border-base)] text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors">
          <span>{action}</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};
