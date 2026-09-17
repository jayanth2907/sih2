import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'blue';
  trend?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className,
  onClick
}) => {
  const variantStyles = {
    default: 'bg-[#0D100F] border-[#1B211E] text-slate-100 hover:border-[#2D3732]',
    emerald: 'bg-[#0D100F] border-emerald-950 text-emerald-400 hover:border-emerald-800/60',
    amber: 'bg-[#0D100F] border-amber-950 text-amber-400 hover:border-amber-800/60',
    rose: 'bg-[#0D100F] border-rose-950 text-rose-400 hover:border-rose-800/60',
    cyan: 'bg-[#0D100F] border-cyan-950 text-cyan-400 hover:border-cyan-800/60',
    blue: 'bg-[#0D100F] border-blue-950 text-blue-400 hover:border-blue-800/60'
  };

  const iconStyles = {
    default: 'bg-[#121614] text-slate-400 border border-[#1B211E]',
    emerald: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
    amber: 'bg-amber-950/60 text-amber-400 border border-amber-800/50',
    rose: 'bg-rose-950/60 text-rose-400 border border-rose-800/50',
    cyan: 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50',
    blue: 'bg-blue-950/60 text-blue-400 border border-blue-800/50'
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-md border transition-all duration-150',
        onClick ? 'cursor-pointer hover:shadow-md' : '',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-white font-mono">{value}</span>
            {trend && <span className="text-[11px] font-mono text-slate-400">{trend}</span>}
          </div>
          {subtitle && <p className="mt-1 text-[10.5px] text-slate-400 truncate">{subtitle}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-md shrink-0', iconStyles[variant])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
