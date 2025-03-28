'use client';

import { ReactNode, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/auth/providers/AuthProvider';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';
import { ToastContainer } from '@/components/ui/toast';
import { WalletProvider } from './WalletProvider';
import { WebSocketProvider } from './WebSocketProvider';

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
  // Check if we have the Clerk publishable key
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#1E88E5', // Primary blue
          colorBackground: '#ffffff',
          colorText: '#212121',
          fontFamily: 'var(--font-inter)'
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthErrorHandler>
            <WebSocketProvider>
              <WalletProvider>
                {children}
                <ToastContainer position="bottom-right" limit={5} />
              </WalletProvider>
            </WebSocketProvider>
          </AuthErrorHandler>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

