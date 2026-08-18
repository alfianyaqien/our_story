import type { ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
      style={{ animationDuration: '1.4s' }}
    />
  );
}

const BADGE_VARIANTS = {
  default: 'bg-surface-2 text-muted border border-default',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200',
  green:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
} as const;

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: keyof typeof BADGE_VARIANTS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        BADGE_VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-900/30">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Inline error banner - replaces the ad-hoc red divs in the old pages. */
export function Alert({
  variant = 'error',
  children,
  className,
}: {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}) {
  const variants = {
    error:
      'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/25 dark:border-red-900/50 dark:text-red-300',
    success:
      'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/25 dark:border-emerald-900/50 dark:text-emerald-300',
    info: 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/25 dark:border-brand-900/50 dark:text-brand-200',
  } as const;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
