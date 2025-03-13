import { AuthGuard } from '@/components/auth/AuthGuard';
import { OnboardingCheck } from '@/components/auth/OnboardingCheck';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <OnboardingCheck>
        {children}
      </OnboardingCheck>
    </AuthGuard>
  );
}
