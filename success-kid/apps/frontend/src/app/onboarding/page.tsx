'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingFlow } from '@/components/auth/onboarding/OnboardingFlow';

/**
 * Onboarding page for new users
 */
export default function OnboardingPage() {
  const { isLoaded, isSignedIn, isOnboarded } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If auth is loaded and user is not signed in, redirect to sign in
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
    
    // If user has already completed onboarding, redirect to dashboard
    if (isLoaded && isSignedIn && isOnboarded) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, isOnboarded, router]);
  
  // Show loading state while auth is loading
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <OnboardingFlow />
    </div>
  );
}
