'use client';

import { useAuthentication } from '@/hooks/useAuthentication';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component that protects routes requiring authentication
 * Redirects to sign-in if user is not authenticated
 */
export function AuthGuard({ 
  children, 
  fallback, 
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const { isLoaded, isAuthenticated } = useAuthentication();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '';
      const redirectPath = `${redirectTo}?redirect_url=${encodeURIComponent(returnUrl)}`;
      router.push(redirectPath);
    }
  }, [isLoaded, isAuthenticated, redirectTo, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse text-battle-yellow">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}
