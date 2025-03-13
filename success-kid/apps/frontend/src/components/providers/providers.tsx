'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WebSocketProvider } from './WebSocketProvider';
import { NavigationProvider } from './NavigationProvider';
import { AuthProvider } from '@/components/auth/providers/AuthProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </NavigationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
