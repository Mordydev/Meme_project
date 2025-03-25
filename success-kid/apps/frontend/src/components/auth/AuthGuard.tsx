'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard - Protects routes from unauthenticated access
 * Redirects to sign-in page if user is not authenticated
 * Shows loading state during authentication check
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  
  // Add debug state
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Prevent redirect loops by only attempting to redirect once per session
    if (!isLoading && !initialCheckComplete) {
      setInitialCheckComplete(true);
      
      if (!isAuthenticated && !redirectAttempted) {
        console.log('AuthGuard: User not authenticated, redirecting to sign-in');
        // Store intended destination ONLY if not already on an auth page
        if (!pathname.includes('/sign-in') && !pathname.includes('/sign-up')) {
          sessionStorage.setItem('redirectAfterLogin', pathname);
        }
        setRedirectAttempted(true);
        router.push('/sign-in');
      }
    }
  }, [isLoading, isAuthenticated, initialCheckComplete, pathname, router, redirectAttempted]);

  // Show loading state only during initial auth check
  if (isLoading || (!initialCheckComplete && !isAuthenticated)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If auth check is complete and user is not authenticated, we've already triggered a redirect
  // This fallback prevents flashing content while redirecting
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Authentication is confirmed, render the protected content
  return <>{children}</>;
}

export default AuthGuard;