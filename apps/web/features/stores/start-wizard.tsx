'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Globe2, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CREATOR_TYPE_OPTIONS, THEME_PRESETS, registerFormSchema, slugify, type OnboardingInput } from '@cc/shared';
import { CreatorType, ThemePreset } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemePresetCard } from './theme-preset-card';
import { cn } from '@/lib/utils';
import { clientEnv } from '@/lib/env';
import { authApi } from '@/features/auth/api';
import { storesApi } from '@/features/stores/api';
import { useAuthStore } from '@/stores/auth-store';
import { errorMessage } from '@/lib/api-error';

export const START_DRAFT_KEY = 'vmerce:start-draft';

export interface StartDraft {
  creatorType: CreatorType;
  name: string;
  handle: string;
  themePreset: ThemePreset;
}

export function StartWizard() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveStore = useAuthStore((state) => state.setActiveStore);
  const [step, setStep] = React.useState(0);
  const [creatorType, setCreatorType] = React.useState<CreatorType | null>(null);
  const [name, setName] = React.useState('');
  const [themePreset, setThemePreset] = React.useState<ThemePreset>(ThemePreset.CLEAN_COMMERCE);
  const [accountName, setAccountName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const handle = slugify(name).slice(0, 32);
  const valid = [Boolean(creatorType), name.trim().length >= 2, true][step];

  function saveDraft() {
    if (!creatorType) return;
    const draft: StartDraft = { creatorType, name: name.trim(), handle, themePreset };
    window.sessionStorage.setItem(START_DRAFT_KEY, JSON.stringify(draft));
  }

  async function buildStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creatorType) return;
    const account = registerFormSchema.safeParse({ name: accountName, email, password, confirmPassword });
    if (!account.success) {
      toast.error(account.error.issues[0]?.message ?? 'Please check your account details');
      return;
    }
    setSubmitting(true);
    try {
      const session = await authApi.register({ name: account.data.name, email: account.data.email, password: account.data.password });
      setSession(session);
      const payload: OnboardingInput = { creatorType, name: name.trim(), handle, description: null, logoUrl: null, avatarUrl: null, themePreset, currency: 'THB', country: 'TH' };
      const store = await storesApi.onboard(payload);
      const me = await authApi.me();
      setUser(me, me.stores);
      setActiveStore(store.id);
      window.sessionStorage.removeItem(START_DRAFT_KEY);
      toast.success('Your shop is live');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not build your store'));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="font-display mx-auto mb-10 flex w-fit items-center gap-2 text-lg font-bold"><span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl"><ShoppingBag className="size-4" /></span>{clientEnv.platformName.toLowerCase()} <Sparkles className="size-3 text-[#c4a7e7]" /></Link>
        <div className="mb-10 flex justify-center gap-2">{[0,1,2,3].map((item) => <span key={item} className={cn('h-1.5 w-14 rounded-full transition-colors', item <= step ? 'bg-primary' : 'bg-secondary')} />)}</div>

        {step === 0 && <section><header className="mb-9 text-center"><p className="text-muted-foreground text-xs">Step 1 of 4</p><h1 className="font-display mt-2 text-3xl font-bold">Let&apos;s make something yours. <span className="text-primary">✦</span></h1><p className="text-sidebar-foreground mt-3">What are you creating?</p></header><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{CREATOR_TYPE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setCreatorType(option.value)} className={cn('rounded-2xl border-2 p-4 text-left transition-all hover:scale-[1.02]', creatorType === option.value ? 'border-primary bg-secondary' : 'border-border bg-card hover:border-primary/40')}><span className="text-2xl">{option.emoji}</span><span className="mt-2 block text-sm font-bold">{option.label}</span><span className="text-muted-foreground mt-0.5 block text-[10px]">{option.hint}</span></button>)}</div></section>}

        {step === 1 && <section><header className="mb-9 text-center"><p className="text-muted-foreground text-xs">Step 2 of 4</p><h1 className="font-display mt-2 text-3xl font-bold">What&apos;s your store called?</h1><p className="text-sidebar-foreground mt-3">You can always change this later.</p></header><div className="border-border bg-card rounded-3xl border p-8 shadow-card"><label htmlFor="start-store-name" className="mb-3 block text-sm font-bold">Store name</label><Input id="start-store-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Luna Boutique, Miso Studio..." className="h-14 rounded-2xl px-5 text-lg" />{handle && <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm"><Globe2 className="text-primary size-4" /> Your URL: <strong className="text-primary">{clientEnv.appUrl.replace(/^https?:\/\//, '')}/@{handle}</strong></p>}</div></section>}

        {step === 2 && <section><header className="mb-9 text-center"><p className="text-muted-foreground text-xs">Step 3 of 4</p><h1 className="font-display mt-2 text-3xl font-bold">Pick a starting vibe.</h1><p className="text-sidebar-foreground mt-3">You can customize everything later.</p></header><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{THEME_PRESETS.slice(0, 6).map((preset) => <ThemePresetCard key={preset.preset} preset={preset} selected={themePreset === preset.preset} onSelect={() => setThemePreset(preset.preset)} />)}</div></section>}

        {step === 3 && <section><header className="mb-8 text-center"><div className="bg-secondary mx-auto flex size-20 items-center justify-center rounded-full"><Sparkles className="text-primary size-8" /></div><h1 className="font-display mt-5 text-3xl font-bold">Ready? <span className="text-primary">✦</span></h1><p className="text-sidebar-foreground mt-2"><strong className="text-primary">{name}</strong> is about to come to life. Create your owner account to publish it.</p></header><form onSubmit={buildStore} className="border-border bg-card mx-auto max-w-xl space-y-4 rounded-3xl border p-7 shadow-card"><div><label htmlFor="owner-name" className="mb-1.5 block text-sm font-bold">Your name</label><Input id="owner-name" value={accountName} onChange={(event) => setAccountName(event.target.value)} autoComplete="name" placeholder="Miki" /></div><div><label htmlFor="owner-email" className="mb-1.5 block text-sm font-bold">Email</label><Input id="owner-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@studio.com" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="owner-password" className="mb-1.5 block text-sm font-bold">Password</label><Input id="owner-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" /></div><div><label htmlFor="owner-confirm" className="mb-1.5 block text-sm font-bold">Confirm password</label><Input id="owner-confirm" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" /></div></div><p className="text-muted-foreground text-xs">Use at least 8 characters with uppercase, lowercase and a number.</p><Button type="submit" size="lg" className="w-full" loading={submitting} onClick={saveDraft}>Build my store <Sparkles /></Button><p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs"><Check className="size-3" /> Free to start. No card needed.</p></form></section>}

        {step < 3 && <footer className="mt-10 flex items-center justify-between"><Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft /> Back</Button><Button onClick={() => setStep((current) => current + 1)} disabled={!valid}>Continue <ArrowRight /></Button></footer>}
      </div>
    </main>
  );
}
