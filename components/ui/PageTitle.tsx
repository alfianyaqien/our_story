import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Standard page heading for feature pages inside AppShell: title, optional
 * description, and a right-aligned action slot that wraps below on mobile.
 */
export function PageTitle({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-wrap items-start justify-between gap-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
