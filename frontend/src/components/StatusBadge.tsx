import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  let colorClasses = 'bg-[#121614] text-slate-300 border-[#1B211E]';

  if (['ACTIVE', 'GOOD', 'OPERATIONAL', 'CLOSED', 'LOW', 'VERIFIED', 'RESOLVED', 'HEALTHY', 'PASS'].includes(normalized)) {
    colorClasses = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60';
  } else if (['WARNING', 'MEDIUM', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'REVIEW_REQUIRED'].includes(normalized)) {
    colorClasses = 'bg-amber-950/50 text-amber-300 border-amber-800/60';
  } else if (['CRITICAL', 'HIGH', 'ESCALATED', 'OFFLINE', 'FAIL', 'TAMPER_DETECTED', 'BREACH'].includes(normalized)) {
    colorClasses = 'bg-rose-950/50 text-rose-300 border-rose-800/60';
  } else if (['SIMULATED', 'DEMO', 'EXTERNAL', 'PREDICTIVE'].includes(normalized)) {
    colorClasses = 'bg-blue-950/50 text-blue-300 border-blue-800/60';
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border rounded-md font-mono tracking-wider',
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs',
        colorClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
