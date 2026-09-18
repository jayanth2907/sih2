import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';

type AttentionLevel = 'critical' | 'warning' | 'info';

interface AttentionCardProps {
  level: AttentionLevel;
  title: string;
  context?: string;         // mine name, zone name, timestamp
  description?: string;
  age?: string;             // "8 minutes ago"
  action?: string;          // button label
  onAction?: () => void;
  className?: string;
}

const LEVEL_CONFIG: Record<AttentionLevel, {
  icon: React.ElementType;
  cardClass: string;
  iconClass: string;
  titleClass: string;
  contextClass: string;
  actionClass: string;
}> = {
  critical: {
    icon: AlertTriangle,
    cardClass: 'attention-card-critical',
    iconClass: 'text-[var(--color-critical-text)]',
    titleClass: 'text-[var(--color-critical-text)] font-semibold',
    contextClass: 'text-[var(--color-critical-text)]/70',
    actionClass: 'text-[var(--color-critical-text)] border-[var(--color-critical-border)] hover:bg-[var(--color-critical-bg)]',
  },
  warning: {
    icon: AlertCircle,
    cardClass: 'attention-card-warning',
    iconClass: 'text-[var(--color-warning-text)]',
    titleClass: 'text-[var(--color-warning-text)] font-semibold',
    contextClass: 'text-[var(--color-warning-text)]/70',
    actionClass: 'text-[var(--color-warning-text)] border-[var(--color-warning-border)] hover:bg-[var(--color-warning-bg)]',
  },
  info: {
    icon: Info,
    cardClass: 'attention-card-info',
    iconClass: 'text-[var(--color-info-text)]',
    titleClass: 'text-[var(--color-info-text)] font-medium',
    contextClass: 'text-[var(--color-info-text)]/70',
    actionClass: 'text-[var(--color-info-text)] border-[var(--color-info-border)] hover:bg-[var(--color-info-bg)]',
  },
};

export const AttentionCard: React.FC<AttentionCardProps> = ({
  level,
  title,
  context,
  description,
  age,
  action,
  onAction,
  className,
}) => {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  return (
    <div className={clsx(config.cardClass, className)}>
      <div className="flex items-start gap-3">
        <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', config.iconClass)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className={clsx('text-sm', config.titleClass)}>{title}</p>
              {context && (
                <p className={clsx('text-xs mt-0.5', config.contextClass)}>{context}</p>
              )}
            </div>
            {age && (
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{age}</span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              {description}
            </p>
          )}
          {action && onAction && (
            <button
              onClick={onAction}
              className={clsx(
                'inline-flex items-center gap-1 mt-2.5 text-xs font-medium px-2.5 py-1 rounded border transition-colors cursor-pointer',
                config.actionClass
              )}
            >
              {action}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
