import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { type ReactNode } from 'react';

// Glass card
export function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/60 rounded-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Animated page wrapper
export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex-1 min-h-0', className)}
    >
      {children}
    </motion.div>
  );
}

// Skeleton loader
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-zinc-800/80 rounded-lg', className)} />
  );
}

export function SkeletonCard() {
  return (
    <GlassCard className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </GlassCard>
  );
}

// Risk badge
export function RiskBadge({ score, className }: { score: number; className?: string }) {
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
  const colors = {
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-mono font-semibold border', colors[level], className)}>
      {level}
    </span>
  );
}

// Severity badge
export function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const colors = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-mono uppercase font-semibold border', colors[severity])}>
      {severity}
    </span>
  );
}

// Risk meter
export function RiskMeter({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#22c55e';
  const sizes = { sm: 60, md: 100, lg: 140 };
  const s = sizes[size];
  const r = s / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: s, height: s }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="-rotate-90">
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="#27272a" strokeWidth={size === 'lg' ? 10 : 8} />
        <motion.circle
          cx={s/2} cy={s/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={size === 'lg' ? 10 : 8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn('font-mono font-bold', size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm')} style={{ color }}>
          {score}
        </div>
        {size !== 'sm' && <div className="text-xs text-zinc-500">/100</div>}
      </div>
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon: Icon, trend, color = 'emerald' }: {
  label: string; value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: { value: number; positive: boolean };
  color?: 'emerald' | 'red' | 'orange' | 'blue' | 'purple';
}) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white font-mono">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1', trend.positive ? 'text-emerald-400' : 'text-red-400')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center', colors[color])}>
          <Icon size={18} />
        </div>
      </div>
    </GlassCard>
  );
}

// Loading spinner
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('rounded-full border-2 border-zinc-700 border-t-emerald-400 animate-spin', className)}
      style={{ width: size, height: size }}
    />
  );
}

// Tooltip wrapper (simple title)
export function Tip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span title={label} className="inline-flex">
      {children}
    </span>
  );
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center">
        <Icon size={28} className="text-zinc-500" />
      </div>
      <div>
        <p className="text-zinc-300 font-medium">{title}</p>
        {description && <p className="text-zinc-600 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
