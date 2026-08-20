'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@cc/shared';
import { DiscountType, type DiscountDto } from '@cc/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { PageHeader } from '@/components/page-header';
import { discountKeys, discountsApi } from '@/features/discounts/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { ApiClientError, errorMessage } from '@/lib/api-error';
import { formatDate, inputToMinor, minorToInput } from '@/lib/utils';

const STATUS_VARIANT: Record<DiscountDto['status'], NonNullable<BadgeProps['variant']>> = {
  ACTIVE: 'success',
  SCHEDULED: 'default',
  EXPIRED: 'neutral',
  USED_UP: 'warning',
  DISABLED: 'outline',
};

const STATUS_LABEL: Record<DiscountDto['status'], string> = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  EXPIRED: 'Expired',
  USED_UP: 'Used up',
  DISABLED: 'Disabled',
};

const TYPE_OPTIONS = [
  { value: DiscountType.PERCENTAGE, label: 'Percentage off' },
  { value: DiscountType.FIXED_AMOUNT, label: 'Fixed amount off' },
  { value: DiscountType.FREE_SHIPPING, label: 'Free shipping' },
];

interface Draft {
  id: string | null;
  code: string;
  type: DiscountType;
  /** Percent as-is for PERCENTAGE; major-unit text for FIXED_AMOUNT. */
  value: string;
  minimumSpend: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

function emptyDraft(): Draft {
  return {
    id: null,
    code: '',
    type: DiscountType.PERCENTAGE,
    value: '10',
    minimumSpend: '',
    usageLimit: '',
    startsAt: '',
    endsAt: '',
    active: true,
  };
}

function toDraft(discount: DiscountDto): Draft {
  return {
    id: discount.id,
    code: discount.code,
    type: discount.type,
    value:
      discount.type === DiscountType.FIXED_AMOUNT
        ? minorToInput(discount.value)
        : String(discount.value),
    minimumSpend: minorToInput(discount.minimumSpend),
    usageLimit: discount.usageLimit === null ? '' : String(discount.usageLimit),
    // `datetime-local` wants `YYYY-MM-DDTHH:mm`, with no zone or seconds.
    startsAt: discount.startsAt ? discount.startsAt.slice(0, 16) : '',
    endsAt: discount.endsAt ? discount.endsAt.slice(0, 16) : '',
    active: discount.active,
  };
}

function describe(discount: DiscountDto): string {
  switch (discount.type) {
    case DiscountType.PERCENTAGE:
      return `${discount.value}% off`;
    case DiscountType.FIXED_AMOUNT:
      return `${formatMoney(discount.value)} off`;
    case DiscountType.FREE_SHIPPING:
      return 'Free shipping';
    default:
      return '—';
  }
}

export function DiscountManager() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<{ id: string; code: string } | null>(
    null,
  );
  const [formError, setFormError] = React.useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: discountKeys.list(storeId ?? 'none'),
    queryFn: () => discountsApi.list(storeId!),
    enabled: Boolean(storeId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: discountKeys.all(storeId!) });
  };

  const save = useMutation({
    mutationFn: async (value: Draft) => {
      const payload = {
        code: value.code.trim().toUpperCase(),
        type: value.type,
        value:
          value.type === DiscountType.FIXED_AMOUNT
            ? inputToMinor(value.value)
            : value.type === DiscountType.PERCENTAGE
              ? Number(value.value) || 0
              : 0,
        minimumSpend: value.minimumSpend.trim() ? inputToMinor(value.minimumSpend) : null,
        usageLimit: value.usageLimit.trim() ? Number(value.usageLimit) : null,
        // `datetime-local` has no zone, so anchor it to the browser's.
        startsAt: value.startsAt ? new Date(value.startsAt).toISOString() : null,
        endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null,
        active: value.active,
        productIds: [],
        collectionIds: [],
      };

      return value.id
        ? discountsApi.update(storeId!, value.id, payload)
        : discountsApi.create(storeId!, payload);
    },
    onSuccess: () => {
      toast.success('Discount saved');
      setDraft(null);
      setFormError(null);
      invalidate();
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        const first = Object.values(error.fieldErrors())[0];
        setFormError(first ?? error.message);
        return;
      }
      setFormError(errorMessage(error));
    },
  });

  const remove = useMutation({
    mutationFn: (discountId: string) => discountsApi.remove(storeId!, discountId),
    onSuccess: () => {
      toast.success('Discount deleted');
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const toggleActive = useMutation({
    mutationFn: (discount: DiscountDto) =>
      discountsApi.update(storeId!, discount.id, { active: !discount.active }),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const items = listQuery.data?.items ?? [];
  const isPercentage = draft?.type === DiscountType.PERCENTAGE;
  const isFixed = draft?.type === DiscountType.FIXED_AMOUNT;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description="Codes your customers can enter in the cart. Validated again at checkout."
        actions={
          <Button
            onClick={() => {
              setFormError(null);
              setDraft(emptyDraft());
            }}
          >
            <Plus /> New discount
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 pb-0 pt-0">
          {listQuery.isPending ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Ticket}
                title="No discount codes yet"
                description="Create a welcome code, a launch promo, or free shipping over a certain spend."
                action={<Button onClick={() => setDraft(emptyDraft())}>New discount</Button>}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Used</TableHead>
                  <TableHead className="hidden lg:table-cell">Minimum spend</TableHead>
                  <TableHead className="hidden xl:table-cell">Window</TableHead>
                  <TableHead className="w-20">On</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setDraft(toDraft(discount));
                        }}
                        className="hover:text-primary font-mono text-sm font-semibold hover:underline"
                      >
                        {discount.code}
                      </button>
                    </TableCell>
                    <TableCell>{describe(discount)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[discount.status]}>
                        {STATUS_LABEL[discount.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {discount.usageCount}
                      {discount.usageLimit !== null && (
                        <span className="text-muted-foreground"> / {discount.usageLimit}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {discount.minimumSpend === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        formatMoney(discount.minimumSpend)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden whitespace-nowrap text-xs xl:table-cell">
                      {discount.startsAt || discount.endsAt ? (
                        <>
                          {discount.startsAt ? formatDate(discount.startsAt) : 'Now'} →{' '}
                          {discount.endsAt ? formatDate(discount.endsAt) : 'No end'}
                        </>
                      ) : (
                        'Always'
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={discount.active}
                        aria-label={`Toggle ${discount.code}`}
                        disabled={toggleActive.isPending}
                        onCheckedChange={() => toggleActive.mutate(discount)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${discount.code}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setFormError(null);
                              setDraft(toDraft(discount));
                            }}
                          >
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onSelect={() =>
                              setPendingDelete({ id: discount.id, code: discount.code })
                            }
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Edit discount' : 'New discount'}</DialogTitle>
            <DialogDescription>
              Customers enter this code in the cart. Everything is re-checked server-side at
              checkout.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <Field label="Code" htmlFor="discount-code" hint="Letters, numbers, dashes." required>
                <Input
                  id="discount-code"
                  value={draft.code}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      code: event.target.value.toUpperCase().replace(/\s/g, ''),
                    })
                  }
                  placeholder="WELCOME10"
                  className="font-mono"
                />
              </Field>

              <Field label="Type" htmlFor="discount-type">
                <Select
                  value={draft.type}
                  onValueChange={(value) => setDraft({ ...draft, type: value as DiscountType })}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {(isPercentage || isFixed) && (
                <Field
                  label={isPercentage ? 'Percentage off' : 'Amount off'}
                  htmlFor="discount-value"
                  hint={isPercentage ? 'Between 1 and 100.' : undefined}
                  required
                >
                  <Input
                    id="discount-value"
                    inputMode="decimal"
                    value={draft.value}
                    onChange={(event) => setDraft({ ...draft, value: event.target.value })}
                    placeholder={isPercentage ? '10' : '100'}
                  />
                </Field>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Minimum spend"
                  htmlFor="discount-minimum"
                  hint="Leave empty for no minimum."
                >
                  <Input
                    id="discount-minimum"
                    inputMode="decimal"
                    value={draft.minimumSpend}
                    onChange={(event) => setDraft({ ...draft, minimumSpend: event.target.value })}
                    placeholder="1000"
                  />
                </Field>

                <Field
                  label="Usage limit"
                  htmlFor="discount-limit"
                  hint="Leave empty for unlimited."
                >
                  <Input
                    id="discount-limit"
                    type="number"
                    min={1}
                    value={draft.usageLimit}
                    onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value })}
                    placeholder="500"
                  />
                </Field>

                <Field label="Starts" htmlFor="discount-starts">
                  <Input
                    id="discount-starts"
                    type="datetime-local"
                    value={draft.startsAt}
                    onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
                  />
                </Field>

                <Field label="Ends" htmlFor="discount-ends">
                  <Input
                    id="discount-ends"
                    type="datetime-local"
                    value={draft.endsAt}
                    onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
                  />
                </Field>
              </div>

              <label className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">Code is live</span>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
                />
              </label>

              {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!draft?.code.trim()}
              onClick={() => draft && save.mutate(draft)}
            >
              Save discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pendingDelete?.code}”?</DialogTitle>
            <DialogDescription>
              Orders that used this code keep it recorded, so your history stays intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
