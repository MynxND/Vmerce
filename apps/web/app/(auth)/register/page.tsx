import type { Metadata } from 'next';
import { RedirectIfAuthenticated } from '@/components/session-gate';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata: Metadata = { title: 'Create your shop' };

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <RegisterForm />
    </RedirectIfAuthenticated>
  );
}
