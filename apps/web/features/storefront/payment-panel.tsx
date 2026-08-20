'use client';

import * as React from 'react';
import { Check, ClipboardCopy, Clock, Info, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@cc/shared';
import { PaymentChannelType } from '@cc/types';
import type { OrderDto, PaymentInstructionDto, PaymentProofDto } from '@cc/types';
import { storefrontApi } from './api';
import { errorMessage } from '@/lib/api-error';
import { minorToInput } from '@/lib/utils';

interface PaymentPanelProps {
  handle: string;
  order: OrderDto;
  instruction: PaymentInstructionDto | null;
  proofs: PaymentProofDto[];
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error('Could not copy — please select and copy manually');
        }
      }}
      className="storefront-chip inline-flex items-center gap-1.5 px-2 py-1 text-xs"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="size-3" /> : <ClipboardCopy className="size-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="storefront-muted text-sm">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">{value}</span>
        <CopyButton value={value} label={label} />
      </span>
    </div>
  );
}

/**
 * Everything the buyer needs to pay, plus slip submission.
 *
 * A PromptPay QR is a transfer instruction, not a gateway — nothing here can
 * confirm that money arrived, so the panel is explicit that the creator reviews
 * the slip and marks the order paid.
 */
export function PaymentPanel({ handle, order, instruction, proofs }: PaymentPanelProps) {
  const [amount, setAmount] = React.useState(minorToInput(order.total));
  const [reference, setReference] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<PaymentProofDto[]>(proofs);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const paid = order.paymentStatus === 'PAID';
  const pending = submitted.find((proof) => proof.status === 'PENDING');
  const rejected = submitted.find((proof) => proof.status === 'REJECTED');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error('Attach your transfer slip first');
      return;
    }

    setSubmitting(true);
    try {
      const proof = await storefrontApi.submitPaymentProof(handle, order.orderNumber, {
        email: order.email,
        amount: Math.round(Number.parseFloat(amount.replace(/,/g, '')) * 100) || order.total,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        slip: file,
      });
      setSubmitted([proof, ...submitted]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Slip received — the creator will confirm shortly');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not send your slip'));
    } finally {
      setSubmitting(false);
    }
  }

  if (paid) {
    return (
      <div className="storefront-surface mt-5 p-6">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Check className="size-4" style={{ color: 'var(--store-primary)' }} />
          Payment confirmed. Your order is being prepared.
        </p>
      </div>
    );
  }

  return (
    <div className="storefront-surface mt-5 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider">How to pay</h2>

      {!instruction ? (
        <p className="storefront-muted mt-3 text-sm">
          The creator will email you payment instructions for{' '}
          <strong>{formatMoney(order.total, { currency: order.currency })}</strong>.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr]">
          {instruction.qrImageUrl && (
            <div className="mx-auto sm:mx-0">
              <div
                className="size-52 overflow-hidden bg-white p-2"
                style={{
                  borderRadius: 'var(--store-radius)',
                  border: '1px solid var(--store-border)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={instruction.qrImageUrl}
                  alt={`Payment QR for order ${order.orderNumber}`}
                  className="size-full object-contain"
                />
              </div>
              <p className="storefront-muted mt-2 text-center text-xs">
                {instruction.channelType === PaymentChannelType.CUSTOM_QR
                  ? 'Enter the amount manually'
                  : 'Amount is already included'}
              </p>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-base font-semibold">
              {formatMoney(instruction.amount, { currency: instruction.currency })}
            </p>
            <p className="storefront-muted text-sm">
              {instruction.label} · {instruction.accountName}
            </p>

            <div className="mt-4 divide-y" style={{ borderColor: 'var(--store-border)' }}>
              {instruction.bankName && (
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="storefront-muted text-sm">Bank</span>
                  <span className="text-sm font-medium">{instruction.bankName}</span>
                </div>
              )}
              {instruction.identifier && (
                <DetailRow
                  label={instruction.bankName ? 'Account number' : 'Account'}
                  value={instruction.identifier}
                />
              )}
              <DetailRow label="Amount" value={minorToInput(instruction.amount)} />
              <DetailRow label="Reference" value={instruction.reference} />
            </div>

            {instruction.instructions && (
              <p className="storefront-muted mt-4 text-sm leading-relaxed">
                {instruction.instructions}
              </p>
            )}
          </div>
        </div>
      )}

      <div
        className="mt-6 flex items-start gap-2.5 pt-5 text-xs"
        style={{ borderTop: '1px solid var(--store-border)' }}
      >
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p className="storefront-muted leading-relaxed">
          Transfers are checked by hand — a bank transfer cannot notify the shop automatically.
          Upload your slip below and the creator will confirm your order.
        </p>
      </div>

      {/* ---- slip status ---- */}
      {pending && (
        <div
          className="mt-5 flex items-start gap-2.5 p-3.5 text-sm"
          style={{
            borderRadius: 'var(--store-radius)',
            backgroundColor: 'color-mix(in oklab, var(--store-accent) 12%, transparent)',
          }}
        >
          <Clock className="mt-0.5 size-4 shrink-0" />
          <span>
            Your slip is waiting for review — sent{' '}
            {new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(pending.createdAt))}
            . You will get an email once it is confirmed.
          </span>
        </div>
      )}

      {rejected && !pending && (
        <div
          className="mt-5 flex items-start gap-2.5 p-3.5 text-sm"
          style={{
            borderRadius: 'var(--store-radius)',
            backgroundColor: 'color-mix(in oklab, var(--store-accent) 16%, transparent)',
          }}
        >
          <X className="mt-0.5 size-4 shrink-0" />
          <span>
            Your last slip could not be accepted
            {rejected.reviewNote ? `: ${rejected.reviewNote}` : '.'} Please check the amount and
            send it again.
          </span>
        </div>
      )}

      {/* ---- slip upload ---- */}
      {!pending && (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <p className="text-sm font-medium">Upload your transfer slip</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="storefront-muted mb-1.5 block text-xs">Amount transferred</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                className="storefront-chip w-full px-3 py-2 text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="storefront-muted mb-1.5 block text-xs">
                Transaction reference (optional)
              </span>
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="storefront-chip w-full px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="storefront-chip flex w-full items-center justify-center gap-2 px-3 py-3 text-sm"
          >
            <Upload className="size-4" />
            {file ? file.name : 'Choose a photo or screenshot'}
          </button>

          <button
            type="submit"
            disabled={submitting || !file}
            className="storefront-button w-full py-3 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send slip'}
          </button>
        </form>
      )}
    </div>
  );
}
