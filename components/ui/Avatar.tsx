import { cn, initials } from '@/lib/utils';

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

export function Avatar({
  name = '',
  color = '#0c8b7c',
  size = 'md',
  className,
}: {
  name?: string;
  color?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name) || '?'}
    </span>
  );
}
