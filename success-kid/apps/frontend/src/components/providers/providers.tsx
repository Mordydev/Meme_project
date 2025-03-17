'use client';

import { ReactNode } from 'react';
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
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthErrorHandler>
            {children}
          </AuthErrorHandler>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
