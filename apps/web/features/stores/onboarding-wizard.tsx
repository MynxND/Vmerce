'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Loader2, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  CREATOR_TYPE_OPTIONS,
  THEME_PRESETS,
  handleSchema,
  slugify,
  type OnboardingInput,
} from '@cc/shared';
import { CreatorType, ThemePreset } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/field';
import { cn } from '@/lib/utils';
import { clientEnv } from '@/lib/env';
import { storesApi } from '@/features/stores/api';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { errorMessage } from '@/lib/api-error';
import { ThemePresetCard } from './theme-preset-card';
import { START_DRAFT_KEY, type StartDraft } from './start-wizard';

const STEPS = ['You', 'Your shop', 'Style', 'First product'] as const;

interface DraftState {
  creatorType: CreatorType | null;
  name: string;
  handle: string;
  description: string;
  themePreset: ThemePreset;
}

export function OnboardingWizard() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveStore = useAuthStore((state) => state.setActiveStore);

  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [handleTouched, setHandleTouched] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftState>({
    creatorType: null,
    name: '',
    handle: '',
    description: '',
    themePreset: ThemePreset.CLEAN_COMMERCE,
  });

  React.useEffect(() => {
    const saved = window.sessionStorage.getItem(START_DRAFT_KEY);
    if (!saved) return;
    try {
      const startDraft = JSON.parse(saved) as StartDraft;
      setDraft((current) => ({
        ...current,
        creatorType: startDraft.creatorType,
        name: startDraft.name,
        handle: startDraft.handle,
        themePreset: startDraft.themePreset,
      }));
      setHandleTouched(true);
      setStep(1);
      window.sessionStorage.removeItem(START_DRAFT_KEY);
    } catch {
      window.sessionStorage.removeItem(START_DRAFT_KEY);
    }
  }, []);

  const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // Auto-derive the handle from the shop name until the creator edits it.
  const setName = (name: string) => {
    setDraft((current) => ({
      ...current,
      name,
      handle: handleTouched ? current.handle : slugify(name).slice(0, 32),
    }));
  };

  const handleValidation = handleSchema.safeParse(draft.handle);
  const handleReady = handleValidation.success;

  const handleQuery = useQuery({
    queryKey: ['handle-check', draft.handle],
    queryFn: () => storesApi.checkHandle(draft.handle),
    enabled: handleReady,
    staleTime: 10_000,
  });

  const stepValid = [
    draft.creatorType !== null,
    draft.name.trim().length >= 2 && handleReady && handleQuery.data?.available === true,
    true,
    true,
  ][step];

  async function finish(next: 'product' | 'dashboard') {
    if (!draft.creatorType) return;
    setSubmitting(true);
    try {
      const payload: OnboardingInput = {
        creatorType: draft.creatorType,
        name: draft.name.trim(),
        handle: draft.handle,
        description: draft.description.trim() || null,
        logoUrl: null,
        avatarUrl: null,
        themePreset: draft.themePreset,
        currency: 'THB',
        country: 'TH',
      };
      const store = await storesApi.onboard(payload);

      // Refresh the session so the new membership and onboardedAt are in state.
      const me = await authApi.me();
      setUser(me, me.stores);
      setActiveStore(store.id);

      toast.success('Your shop is live');
      router.replace(next === 'product' ? '/dashboard/products/new' : '/dashboard');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not create your shop'));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-16">
      <ol className="mb-10 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                index < step && 'bg-primary text-primary-foreground',
                index === step &&
                  'bg-primary text-primary-foreground ring-4 ring-[color-mix(in_oklab,var(--primary)_18%,transparent)]',
                index > step && 'bg-muted text-muted-foreground',
              )}
            >
              {index < step ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:block',
                index === step ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && <span className="bg-border h-px flex-1" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="space-y-6">
          <header className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              What best describes you?
            </h1>
            <p className="text-muted-foreground text-sm">
              This only shapes the suggestions you see — you can sell anything on any shop.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            {CREATOR_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update('creatorType', option.value)}
                aria-pressed={draft.creatorType === option.value}
                className={cn(
                  'bg-card flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                  draft.creatorType === option.value
                    ? 'border-primary ring-[3px] ring-[color-mix(in_oklab,var(--primary)_16%,transparent)]'
                    : 'border-border hover:border-[color-mix(in_oklab,var(--primary)_40%,var(--border))]',
                )}
              >
                <span aria-hidden className="text-xl leading-none">
                  {option.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  <span className="text-muted-foreground block text-xs">{option.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <header className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">Name your shop</h1>
            <p className="text-muted-foreground text-sm">You can change all of this later.</p>
          </header>

          <div className="space-y-4">
            <Field label="Shop name" htmlFor="store-name" required>
              <Input
                id="store-name"
                value={draft.name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Neko Studio"
                maxLength={60}
              />
            </Field>

            <Field
              label="Shop handle"
              htmlFor="store-handle"
              required
              error={
                draft.handle && !handleReady
                  ? handleValidation.error?.issues[0]?.message
                  : handleQuery.data && !handleQuery.data.available
                    ? 'That handle is already taken'
                    : undefined
              }
            >
              <div className="relative">
                <Input
                  id="store-handle"
                  value={draft.handle}
                  onChange={(event) => {
                    setHandleTouched(true);
                    update('handle', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="neko"
                  maxLength={32}
                  className="pr-10"
                  aria-invalid={Boolean(draft.handle) && !handleReady}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {handleReady && handleQuery.isFetching && (
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  )}
                  {handleReady &&
                    !handleQuery.isFetching &&
                    handleQuery.data?.available === true && (
                      <Check className="size-4 text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" />
                    )}
                  {handleReady &&
                    !handleQuery.isFetching &&
                    handleQuery.data?.available === false && (
                      <X className="text-destructive size-4" />
                    )}
                </span>
              </div>
            </Field>

            <div className="border-border bg-muted/60 rounded-lg border px-3 py-2.5 font-mono text-sm">
              <span className="text-muted-foreground">
                {clientEnv.appUrl.replace(/^https?:\/\//, '')}/@
              </span>
              <span className="font-semibold">{draft.handle || 'your-handle'}</span>
            </div>

            <Field
              label="Short description"
              htmlFor="store-description"
              hint="Shown on your shop and in search results."
            >
              <Textarea
                id="store-description"
                value={draft.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Official merch from Nagi — VTuber, illustrator and full-time cat enthusiast."
                maxLength={500}
              />
            </Field>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <header className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Pick a starting style
            </h1>
            <p className="text-muted-foreground text-sm">
              Every colour, font and corner radius stays editable in the store editor.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_PRESETS.map((preset) => (
              <ThemePresetCard
                key={preset.preset}
                preset={preset}
                selected={draft.themePreset === preset.preset}
                onSelect={() => update('themePreset', preset.preset)}
              />
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <header className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Add your first product?
            </h1>
            <p className="text-muted-foreground text-sm">
              Your shop is ready. Add something to sell now, or explore the dashboard first.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void finish('product')}
              className="border-primary bg-card hover:shadow-card flex flex-col gap-2 rounded-xl border p-5 text-left transition-shadow disabled:opacity-60"
            >
              <span className="text-primary flex size-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                <Store className="size-4" />
              </span>
              <span className="font-medium">Create a product</span>
              <span className="text-muted-foreground text-xs">
                Set a title, price and options, and generate variants automatically.
              </span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void finish('dashboard')}
              className="border-border bg-card flex flex-col gap-2 rounded-xl border p-5 text-left transition-colors hover:border-[color-mix(in_oklab,var(--primary)_40%,var(--border))] disabled:opacity-60"
            >
              <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                <ArrowRight className="size-4" />
              </span>
              <span className="font-medium">Skip for now</span>
              <span className="text-muted-foreground text-xs">Go straight to the dashboard.</span>
            </button>
          </div>

          {submitting && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Setting up your shop…
            </p>
          )}
        </section>
      )}

      <footer className="mt-10 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || submitting}
        >
          <ArrowLeft /> Back
        </Button>

        {step < STEPS.length - 1 && (
          <Button
            type="button"
            onClick={() => setStep((current) => current + 1)}
            disabled={!stepValid}
          >
            Continue <ArrowRight />
          </Button>
        )}
      </footer>
    </div>
  );
}
