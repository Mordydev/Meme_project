'use client';

import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Redirects to sign-in page if user is not authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);
  
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
  
  return <>{children}</>;
}
