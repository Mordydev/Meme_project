'use client';

import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireOnboarding?: boolean;
}

/**
 * Enhanced client-side authentication guard component
 * Redirects to sign-in page if user is not authenticated
 * Optionally redirects to onboarding if user is not onboarded
 */
export function AuthGuard({ 
  children, 
  fallback,
  requireOnboarding = true 
}: AuthGuardProps) {
  const { isLoaded, isSignedIn, isOnboarded } = useAuth();
  
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        redirect('/sign-in');
      } else if (requireOnboarding && !isOnboarded) {
        redirect('/onboarding');
      }
    }
  }, [isLoaded, isSignedIn, isOnboarded, requireOnboarding]);
  
  if (!isLoaded) {
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!isSignedIn) {
    return null;
  }
  
  if (requireOnboarding && !isOnboarded) {
    return null;
  }
  
  return <>{children}</>;
}
