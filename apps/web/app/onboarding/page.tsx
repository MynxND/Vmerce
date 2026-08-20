import type { Metadata } from 'next';
import { RequireSession } from '@/components/session-gate';
import { OnboardingWizard } from '@/features/stores/onboarding-wizard';

export const metadata: Metadata = { title: 'Set up your shop' };

export default function OnboardingPage() {
  return (
    <RequireSession>
      <OnboardingWizard />
    </RequireSession>
  );
}
