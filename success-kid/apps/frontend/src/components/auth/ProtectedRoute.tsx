'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requireOnboarded?: boolean;
  fallback?: ReactNode;
}

/**
 * Enhanced client-side protection for routes that need authentication
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requireOnboarded = true,
  fallback
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, isOnboarded, hasPermission } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded) {
      // Check authentication
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      
      // Check onboarding if required
      if (requireOnboarded && !isOnboarded) {
        router.push('/onboarding');
        return;
      }
      
      // Check permission if required
      if (requiredPermission && !hasPermission && !hasPermission(requiredPermission)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isLoaded, isSignedIn, isOnboarded, requiredPermission, requireOnboarded, hasPermission, router]);
  
  // Show loading state while auth is being determined
  if (!isLoaded) {
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If checks failed, return null (redirection will happen in useEffect)
  if (!isSignedIn || (requireOnboarded && !isOnboarded) || (requiredPermission && hasPermission && !hasPermission(requiredPermission))) {
    return null;
  }
  
  // All checks passed, render children
  return <>{children}</>;
}
