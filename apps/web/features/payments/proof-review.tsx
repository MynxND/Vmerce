'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, ReceiptText, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@cc/shared';
import type { OrderDto, PaymentProofDto } from '@cc/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { paymentKeys, paymentsApi } from '@/features/payments/api';
import { orderKeys } from '@/features/orders/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { errorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/utils';

const STATUS: Record<
  PaymentProofDto['status'],
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  PENDING: { label: 'Awaiting review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
};

/**
 * Slip review. Approving here is what marks the order paid — a bank transfer has
 * no gateway to report back, so this decision is the source of truth.
 */
export function PaymentProofReview({ order }: { order: OrderDto }) {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();
  const [note, setNote] = React.useState('');

  const { data: proofs, isPending } = useQuery({
    queryKey: paymentKeys.proofs(storeId ?? 'none', order.id),
    queryFn: () => paymentsApi.listProofs(storeId!, order.id),
    enabled: Boolean(storeId),
  });

  const review = useMutation({
    mutationFn: (input: { proofId: string; approve: boolean }) =>
      paymentsApi.reviewProof(storeId!, input.proofId, {
        approve: input.approve,
        note: note.trim() || null,
      }),
    onSuccess: (result, input) => {
      toast.success(input.approve ? 'Payment confirmed' : 'Slip rejected');
      setNote('');
      queryClient.setQueryData(orderKeys.detail(storeId!, order.id), result.order);
      void queryClient.invalidateQueries({ queryKey: paymentKeys.proofs(storeId!, order.id) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all(storeId!) });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.pending(storeId!) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rows = proofs ?? [];
  const pending = rows.find((proof) => proof.status === 'PENDING');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="size-4" /> Transfer slips
        </CardTitle>
        <CardDescription>
          {pending
            ? 'Check the slip against the order total, then confirm or reject.'
            : 'Slips your customer uploaded for this order.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isPending && <Skeleton className="h-24 w-full" />}

        {!isPending && rows.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nothing uploaded yet. You can still mark this order paid by hand above.
          </p>
        )}

        {rows.map((proof) => {
          const mismatch = proof.amount !== order.total;

          return (
            <div key={proof.id} className="border-border space-y-3 rounded-lg border p-3">
              <div className="flex flex-wrap items-start gap-3">
                <a
                  href={proof.slipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border bg-muted block size-20 shrink-0 overflow-hidden rounded-lg border"
                  aria-label="Open the full slip image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proof.slipUrl} alt="" className="size-full object-cover" />
                </a>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS[proof.status].variant}>
                      {STATUS[proof.status].label}
                    </Badge>
                    {proof.channelLabel && (
                      <span className="text-muted-foreground text-xs">{proof.channelLabel}</span>
                    )}
                  </div>

                  <p className="text-sm">
                    <span className="font-medium">
                      {formatMoney(proof.amount, { currency: order.currency })}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      claimed · order total {formatMoney(order.total, { currency: order.currency })}
                    </span>
                  </p>

                  {mismatch && (
                    <p className="text-destructive flex items-center gap-1.5 text-xs font-medium">
                      <TriangleAlert className="size-3.5" />
                      Amount does not match the order total
                    </p>
                  )}

                  {proof.reference && (
                    <p className="text-muted-foreground font-mono text-xs">Ref {proof.reference}</p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Sent {formatDateTime(proof.createdAt)}
                    {proof.transferredAt && ` · transferred ${formatDateTime(proof.transferredAt)}`}
                  </p>
                  {proof.reviewNote && (
                    <p className="text-muted-foreground text-xs italic">“{proof.reviewNote}”</p>
                  )}
                </div>

                <Button asChild variant="ghost" size="icon-sm" aria-label="Open slip">
                  <a href={proof.slipUrl} target="_blank" rel="noreferrer">
                    <ExternalLink />
                  </a>
                </Button>
              </div>

              {proof.status === 'PENDING' && (
                <div className="space-y-2">
                  <Input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Note for your customer (optional)"
                    className="h-9"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={review.isPending}
                      onClick={() => review.mutate({ proofId: proof.id, approve: true })}
                    >
                      <Check /> Confirm payment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={review.isPending}
                      onClick={() => review.mutate({ proofId: proof.id, approve: false })}
                    >
                      <X /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
