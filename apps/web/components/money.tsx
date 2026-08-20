import { formatMoney } from '@cc/shared';
import { cn } from '@/lib/utils';

interface MoneyProps {
  amount: number;
  currency?: string;
  className?: string;
  compareAt?: number | null;
}

/** Renders an integer minor-unit amount, with optional strikethrough compare-at. */
export function Money({ amount, currency = 'THB', className, compareAt }: MoneyProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span>{formatMoney(amount, { currency })}</span>
      {compareAt !== null && compareAt !== undefined && compareAt > amount && (
        <span className="text-muted-foreground text-xs line-through">
          {formatMoney(compareAt, { currency })}
        </span>
      )}
    </span>
  );
}
