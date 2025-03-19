'use client';

import { ReactNode, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application providers wrapper
 */
export function Providers({ children }: ProvidersProps) {
  // Check if the CLERK_PUBLISHABLE_KEY is available and properly formatted
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = publishableKey && publishableKey.startsWith('pk_');

  // Conditional rendering based on Clerk configuration
  return (
    <>
      {isClerkConfigured ? (
        <ClerkProvider
          fallbackRedirectUrl="/dashboard"
        >
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AuthErrorHandler>
                {children}
              </AuthErrorHandler>
            </AuthProvider>
          </QueryClientProvider>
        </ClerkProvider>
      ) : (
        // Fallback when Clerk is not configured properly
        <QueryClientProvider client={queryClient}>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
            <p className="text-amber-700">
              <strong>Warning:</strong> Authentication is not properly configured. Please check your Clerk API keys.
            </p>
          </div>
          {children}
        </QueryClientProvider>
      )}
    </>
  );
}
