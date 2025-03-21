'use client';

import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
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
  
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);
  
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
