'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { useAuthStore } from '@/store/useAuthStore';
import Loading from '@/components/ui/loading';

interface AuthGuardProps {
  children: ReactNode;
  requiredOnboarding?: boolean;
  fallbackUrl?: string;
}

/**
 * AuthGuard Component
 * 
 * Protects routes that require authentication
 * Optionally requires onboarding to be completed
 * 
 * @example
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 */
export default function AuthGuard({ 
  children, 
  requiredOnboarding = false,
  fallbackUrl = '/login'
}: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useClerk();
  const { isAuthenticated, isLoading, isOnboarded } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;
    
    // If not signed in with Clerk, redirect to login
    if (!isSignedIn) {
      router.push(fallbackUrl);
      return;
    }
    
    // If requiring onboarding and not onboarded, redirect to onboarding
    if (requiredOnboarding && !isOnboarded && !isLoading && isAuthenticated) {
      // Store the intended destination for after onboarding
      if (pathname && pathname !== '/onboarding') {
        sessionStorage.setItem('authRedirectPath', pathname);
      }
      router.push('/onboarding');
    }
  }, [isLoaded, isSignedIn, isAuthenticated, isOnboarded, isLoading, requiredOnboarding, router, fallbackUrl, pathname]);
  
  // Show loading spinner while checking auth
  if (!isLoaded || isLoading || (!isAuthenticated && isSignedIn) || (requiredOnboarding && !isOnboarded && isAuthenticated)) {
    return <Loading message="Validating authentication..." />;
  }
  
  // If all checks pass, render the protected content
  return <>{children}</>;
}
