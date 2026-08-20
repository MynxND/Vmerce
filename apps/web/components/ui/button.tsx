import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,box-shadow,transform,color] outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_oklab,var(--ring)_35%,transparent)] active:translate-y-px [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_2px_5px_rgb(72_51_99/0.18)] hover:bg-[#6b4f95] hover:-translate-y-0.5',
        accent:
          'bg-accent text-accent-foreground shadow-[0_1px_2px_rgb(18_16_32/0.16)] hover:bg-[color-mix(in_oklab,var(--accent)_88%,black)]',
        outline: 'border border-border bg-card hover:bg-secondary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary)_80%,var(--foreground)_6%)]',
        ghost: 'hover:bg-muted hover:text-foreground',
        subtle:
          'bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-primary hover:bg-[color-mix(in_oklab,var(--primary)_16%,transparent)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklab,var(--destructive)_88%,black)]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 rounded-full px-3 text-[0.8125rem]',
        default: 'h-10 rounded-full px-4 text-sm',
        lg: 'h-12 rounded-full px-7 text-[0.9375rem]',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-8 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Component>
  );
});

export { buttonVariants };
