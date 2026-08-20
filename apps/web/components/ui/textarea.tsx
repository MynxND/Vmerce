import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'border-input bg-card flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgb(18_16_32/0.03)] outline-none transition-[border-color,box-shadow]',
        'placeholder:text-muted-foreground/70',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_oklab,var(--ring)_28%,transparent)]',
        'aria-[invalid=true]:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
});
