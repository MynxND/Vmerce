'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

const SIDE_CLASSES = {
  left: 'left-0 top-0 h-full w-80 border-r',
  right: 'right-0 top-0 h-full w-full max-w-md border-l',
  bottom: 'bottom-0 left-0 w-full rounded-t-2xl border-t',
} as const;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: keyof typeof SIDE_CLASSES;
  }
>(function SheetContent({ className, children, side = 'right', ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)] data-[state=open]:animate-[var(--animate-fade-in)]" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'border-border bg-card shadow-pop fixed z-50 flex flex-col gap-4 p-6 data-[state=open]:animate-[var(--animate-slide-up)]',
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="text-muted-foreground hover:bg-muted hover:text-foreground absolute right-4 top-4 rounded-md p-1 transition-colors">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
