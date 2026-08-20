import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'border-input bg-card flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgb(18_16_32/0.03)] outline-none transition-[border-color,box-shadow]',
        'placeholder:text-muted-foreground/70',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_oklab,var(--ring)_28%,transparent)]',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[color-mix(in_oklab,var(--destructive)_22%,transparent)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'file:bg-muted file:mr-3 file:rounded-md file:border-0 file:px-2 file:py-1 file:text-xs file:font-medium',
        className,
      )}
      {...props}
    />
  );
});
