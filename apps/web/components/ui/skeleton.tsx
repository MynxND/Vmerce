import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-[var(--animate-shimmer)] rounded-md bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_oklab,var(--muted)_60%,var(--card))_50%,var(--muted)_75%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}
