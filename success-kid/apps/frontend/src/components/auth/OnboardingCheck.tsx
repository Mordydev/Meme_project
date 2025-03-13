'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

/**
 * Component that checks if user has completed onboarding
 * and redirects to onboarding page if not
 */
export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const { isLoaded, isSignedIn, isOnboarded } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && isSignedIn && !isOnboarded) {
      router.push('/onboarding');
    }
  }, [isLoaded, isSignedIn, isOnboarded, router]);
  
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-xl text-gray-400">Loading...</div>
      </div>
    );
  }
  
  return <>{children}</>;
}
