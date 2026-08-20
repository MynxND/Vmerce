'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Smartphone,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { THAI_BANKS, maskIdentifier } from '@cc/shared';
import { PaymentChannelType, type PaymentChannelDto } from '@cc/types';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { PageHeader } from '@/components/page-header';
import { paymentKeys, paymentsApi } from '@/features/payments/api';
import { storesApi } from '@/features/stores/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { ApiClientError, errorMessage } from '@/lib/api-error';

const TYPE_META: Record<
  PaymentChannelType,
  { label: string; hint: string; icon: typeof QrCode; identifierLabel: string; placeholder: string }
> = {
  [PaymentChannelType.PROMPTPAY_PHONE]: {
    label: 'PromptPay — mobile number',
    hint: 'Generates a QR with the exact amount already filled in.',
    icon: Smartphone,
    identifierLabel: 'Mobile number',
    placeholder: '0812345678',
  },
  [PaymentChannelType.PROMPTPAY_NATIONAL_ID]: {
    label: 'PromptPay — national ID / tax ID',
    hint: 'For a registered business account. QR carries the amount.',
    icon: QrCode,
    identifierLabel: 'National ID or tax ID',
    placeholder: '1234567890123',
  },
  [PaymentChannelType.PROMPTPAY_EWALLET]: {
    label: 'e-Wallet — TrueMoney and similar',
    hint: 'Uses the 15-digit PromptPay e-wallet id. QR carries the amount.',
    icon: Wallet,
    identifierLabel: 'e-Wallet ID (15 digits)',
    placeholder: '004999012345678',
  },
  [PaymentChannelType.BANK_TRANSFER]: {
    label: 'Bank transfer',
    hint: 'Shows your account details as text. No QR.',
    icon: Banknote,
    identifierLabel: 'Account number',
    placeholder: '1234567890',
  },
  [PaymentChannelType.CUSTOM_QR]: {
    label: 'Your own QR image',
    hint: 'Upload a QR you already have. It cannot carry the amount, so the buyer types it in.',
    icon: QrCode,
    identifierLabel: 'QR image URL',
    placeholder: 'https://…',
  },
};

const PROMPTPAY_TYPES: PaymentChannelType[] = [
  PaymentChannelType.PROMPTPAY_PHONE,
  PaymentChannelType.PROMPTPAY_NATIONAL_ID,
  PaymentChannelType.PROMPTPAY_EWALLET,
];

interface Draft {
  id: string | null;
  type: PaymentChannelType;
  label: string;
  accountName: string;
  proxyValue: string;
  bankCode: string;
  bankAccountNumber: string;
  qrImageUrl: string;
  instructions: string;
  enabled: boolean;
  isDefault: boolean;
}

function emptyDraft(): Draft {
  return {
    id: null,
    type: PaymentChannelType.PROMPTPAY_PHONE,
    label: 'PromptPay',
    accountName: '',
    proxyValue: '',
    bankCode: '',
    bankAccountNumber: '',
    qrImageUrl: '',
    instructions: '',
    enabled: true,
    isDefault: false,
  };
}

function toDraft(channel: PaymentChannelDto): Draft {
  return {
    id: channel.id,
    type: channel.type,
    label: channel.label,
    accountName: channel.accountName,
    proxyValue: channel.proxyValue ?? '',
    bankCode: channel.bankCode ?? '',
    bankAccountNumber: channel.bankAccountNumber ?? '',
    qrImageUrl: channel.qrImageUrl ?? '',
    instructions: channel.instructions ?? '',
    enabled: channel.enabled,
    isDefault: channel.isDefault,
  };
}

export function PaymentChannelManager() {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<PaymentChannelDto | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const listQuery = useQuery({
    queryKey: paymentKeys.channels(storeId ?? 'none'),
    queryFn: () => paymentsApi.listChannels(storeId!),
    enabled: Boolean(storeId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all(storeId!) });
  };

  const save = useMutation({
    mutationFn: async (value: Draft) => {
      const payload = {
        type: value.type,
        label: value.label.trim(),
        accountName: value.accountName.trim(),
        proxyValue: value.proxyValue.trim() || null,
        bankCode: value.bankCode || null,
        bankAccountNumber: value.bankAccountNumber.trim() || null,
        qrImageUrl: value.qrImageUrl.trim() || null,
        instructions: value.instructions.trim() || null,
        enabled: value.enabled,
        isDefault: value.isDefault,
      };
      return value.id
        ? paymentsApi.updateChannel(storeId!, value.id, payload)
        : paymentsApi.createChannel(storeId!, payload);
    },
    onSuccess: () => {
      toast.success('Payment method saved');
      setDraft(null);
      setFormError(null);
      invalidate();
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setFormError(Object.values(error.fieldErrors())[0] ?? error.message);
        return;
      }
      setFormError(errorMessage(error));
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: (channel: PaymentChannelDto) =>
      paymentsApi.updateChannel(storeId!, channel.id, { enabled: !channel.enabled }),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const makeDefault = useMutation({
    mutationFn: (channel: PaymentChannelDto) =>
      paymentsApi.updateChannel(storeId!, channel.id, { isDefault: true }),
    onSuccess: () => {
      toast.success('Default payment method updated');
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (channelId: string) => paymentsApi.removeChannel(storeId!, channelId),
    onSuccess: () => {
      toast.success('Payment method removed');
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function uploadQr(file: File) {
    if (!storeId || !draft) return;
    setUploading(true);
    try {
      const media = await storesApi.uploadMedia(storeId, file);
      setDraft({ ...draft, qrImageUrl: media.url });
    } catch (error) {
      toast.error(errorMessage(error, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const channels = listQuery.data ?? [];
  const isPromptPay = draft ? PROMPTPAY_TYPES.includes(draft.type) : false;
  const isBank = draft?.type === PaymentChannelType.BANK_TRANSFER;
  const isCustomQr = draft?.type === PaymentChannelType.CUSTOM_QR;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Where your customers send money. Add your PromptPay, e-wallet or bank details and the storefront generates the QR."
        actions={
          <Button
            onClick={() => {
              setFormError(null);
              setDraft(emptyDraft());
            }}
          >
            <Plus /> Add payment method
          </Button>
        }
      />

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2.5 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Money goes straight from your customer to your own account — this platform never holds
            it, and no card details are collected anywhere. Because a bank transfer has no gateway
            to report back, an order is only marked paid when you confirm it, either from the order
            page or by approving the slip your customer uploads.
          </span>
        </CardContent>
      </Card>

      {listQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No payment methods yet"
          description="Add a PromptPay number and your storefront will generate a QR with the exact amount for every order."
          action={<Button onClick={() => setDraft(emptyDraft())}>Add payment method</Button>}
        />
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => {
            const meta = TYPE_META[channel.type];
            const Icon = meta.icon;

            return (
              <Card key={channel.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <span className="text-primary flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]">
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{channel.label}</p>
                      {channel.isDefault && (
                        <Badge variant="default">
                          <Star className="size-3" /> Default
                        </Badge>
                      )}
                      {channel.supportsQr && <Badge variant="neutral">QR</Badge>}
                      {!channel.enabled && <Badge variant="outline">Hidden</Badge>}
                    </div>
                    <p className="text-muted-foreground truncate text-sm">
                      {channel.accountName}
                      {channel.proxyValue && ` · ${maskIdentifier(channel.proxyValue)}`}
                      {channel.bankAccountNumber &&
                        ` · ${THAI_BANKS.find((bank) => bank.code === channel.bankCode)?.shortName ?? ''} ${maskIdentifier(channel.bankAccountNumber)}`}
                    </p>
                  </div>

                  <Switch
                    checked={channel.enabled}
                    aria-label={`Toggle ${channel.label}`}
                    disabled={toggleEnabled.isPending}
                    onCheckedChange={() => toggleEnabled.mutate(channel)}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${channel.label}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setFormError(null);
                          setDraft(toDraft(channel));
                        }}
                      >
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      {!channel.isDefault && (
                        <DropdownMenuItem onSelect={() => makeDefault.mutate(channel)}>
                          <Star /> Make default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => setPendingDelete(channel)}>
                        <Trash2 /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Edit payment method' : 'Add payment method'}</DialogTitle>
            <DialogDescription>
              Customers see the name on the account, so make sure it matches what their banking app
              will show.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <Field label="Type" htmlFor="channel-type" hint={TYPE_META[draft.type].hint}>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft({ ...draft, type: value as PaymentChannelType })
                  }
                >
                  <SelectTrigger id="channel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_META).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Name shown at checkout"
                htmlFor="channel-label"
                hint="e.g. “PromptPay” or “TrueMoney Wallet”."
                required
              >
                <Input
                  id="channel-label"
                  value={draft.label}
                  onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                />
              </Field>

              <Field
                label="Account holder name"
                htmlFor="channel-account-name"
                hint="So the buyer can check they are paying the right person."
                required
              >
                <Input
                  id="channel-account-name"
                  value={draft.accountName}
                  onChange={(event) => setDraft({ ...draft, accountName: event.target.value })}
                  placeholder="Nagi Neko"
                />
              </Field>

              {isPromptPay && (
                <Field
                  label={TYPE_META[draft.type].identifierLabel}
                  htmlFor="channel-proxy"
                  required
                >
                  <Input
                    id="channel-proxy"
                    inputMode="numeric"
                    value={draft.proxyValue}
                    onChange={(event) => setDraft({ ...draft, proxyValue: event.target.value })}
                    placeholder={TYPE_META[draft.type].placeholder}
                  />
                </Field>
              )}

              {isBank && (
                <>
                  <Field label="Bank" htmlFor="channel-bank" required>
                    <Select
                      value={draft.bankCode || undefined}
                      onValueChange={(value) => setDraft({ ...draft, bankCode: value })}
                    >
                      <SelectTrigger id="channel-bank">
                        <SelectValue placeholder="Choose your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {THAI_BANKS.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name} ({bank.shortName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Account number" htmlFor="channel-account" required>
                    <Input
                      id="channel-account"
                      inputMode="numeric"
                      value={draft.bankAccountNumber}
                      onChange={(event) =>
                        setDraft({ ...draft, bankAccountNumber: event.target.value })
                      }
                      placeholder="1234567890"
                    />
                  </Field>
                </>
              )}

              {isCustomQr && (
                <Field
                  label="QR image"
                  hint="A static QR cannot include the amount, so the buyer enters it themselves."
                  required
                >
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={draft.qrImageUrl}
                        onChange={(event) => setDraft({ ...draft, qrImageUrl: event.target.value })}
                        placeholder="https://…"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        loading={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        Upload
                      </Button>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadQr(file);
                      }}
                    />
                    {draft.qrImageUrl && (
                      <div className="border-border size-40 overflow-hidden rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={draft.qrImageUrl} alt="" className="size-full object-contain" />
                      </div>
                    )}
                  </div>
                </Field>
              )}

              <Field
                label="Instructions for the buyer"
                htmlFor="channel-instructions"
                hint="Shown next to the QR on the confirmation page."
              >
                <Textarea
                  id="channel-instructions"
                  rows={3}
                  value={draft.instructions}
                  onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}
                  placeholder="Scan with any Thai banking app, then upload your slip below."
                />
              </Field>

              <div className="space-y-2">
                <label className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <span className="text-sm font-medium">Show at checkout</span>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
                  />
                </label>

                <label className="border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <span>
                    <span className="block text-sm font-medium">Default method</span>
                    <span className="text-muted-foreground block text-xs">
                      Pre-selected at checkout.
                    </span>
                  </span>
                  <Switch
                    checked={draft.isDefault}
                    onCheckedChange={(checked) => setDraft({ ...draft, isDefault: checked })}
                  />
                </label>
              </div>

              {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!draft?.label.trim() || !draft?.accountName.trim()}
              onClick={() => draft && save.mutate(draft)}
            >
              Save
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
            <DialogTitle>Remove “{pendingDelete?.label}”?</DialogTitle>
            <DialogDescription>
              Existing orders keep a copy of the details they were shown, so nothing already placed
              is affected.
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
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
