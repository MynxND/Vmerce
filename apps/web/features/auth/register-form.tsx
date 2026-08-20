'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { registerFormSchema } from '@cc/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/field';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { ApiClientError, errorMessage } from '@/lib/api-error';

type FormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<FormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (formValues) => {
    // confirmPassword is a client-side check only; the API never sees it.
    const { confirmPassword, ...values } = formValues;
    void confirmPassword;
    try {
      const session = await authApi.register(values);
      setSession(session);
      // Straight into onboarding — a new account has no store yet.
      router.replace('/onboarding');
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'EMAIL_TAKEN') {
        form.setError('email', { message: 'That email is already registered' });
        return;
      }
      toast.error(errorMessage(error, 'Could not create your account'));
    }
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your shop</h1>
        <p className="text-muted-foreground text-sm">Free to set up. No card needed.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label="Your name"
          htmlFor="name"
          error={form.formState.errors.name?.message}
          required
        >
          <Input
            id="name"
            autoComplete="name"
            placeholder="Nagi"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register('name')}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint="At least 8 characters, with upper and lower case and a number."
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={form.formState.errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register('confirmPassword')}
          />
        </Field>

        <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
