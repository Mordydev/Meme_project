'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { ToastProvider } from './ToastProvider';
import { MonitoringProvider } from '../../lib/monitoring/monitoring-provider';
import ErrorBoundaryProvider from './ErrorBoundaryProvider';
import { PerformanceProvider } from '../../lib/performance/context';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryProvider>
      <MonitoringProvider webVitals={true}>
        <PerformanceProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </QueryClientProvider>
        </PerformanceProvider>
      </MonitoringProvider>
    </ErrorBoundaryProvider>
  );
}
