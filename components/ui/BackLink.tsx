import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Consistent "up one level" affordance.
 *
 * The app ships as `display: standalone` in manifest.json, so an installed PWA
 * has no browser chrome and therefore no OS back button. Every screen that is
 * not a root needs its own way out, above the fold - never only at the bottom
 * of a long form.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        // h-11 keeps the tap target at 44px; negative inline margin keeps the
        // label optically flush with the content below it.
        'inline-flex h-11 -ml-2 items-center gap-1.5 rounded-xl px-2 text-sm font-medium',
        'text-muted transition-colors hover:bg-surface-2 hover:text-fg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}
