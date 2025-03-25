'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Root page that redirects based on authentication state
 * - Authenticated users go to dashboard
 * - Unauthenticated users see the marketing page or sign in
 */
export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is determined
    if (!isLoading) {
      if (isAuthenticated) {
        // Authenticated users go to the dashboard
        router.push('/dashboard');
      } else {
        // Unauthenticated users go to marketing page or sign in
        router.push('/sign-in');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state while determining where to redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-gray-500">Loading Success Kid platform...</p>
      </div>
    </div>
  );
}
