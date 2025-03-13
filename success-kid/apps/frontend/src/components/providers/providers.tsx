'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { WebSocketProvider } from './WebSocketProvider';
import { NotificationProvider } from './NotificationProvider';
import { ModalProvider } from './ModalProvider';
import { ToastNotification } from '@/components/ui/toast-notification';
import { useAuth } from '@clerk/nextjs';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';

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

  // Get Clerk auth state
  const { isLoaded, isSignedIn, userId } = useAuth();
  
  // Get auth store actions
  const { setAuthenticated, setLoading } = useAuthStore();
  
  // Get user store actions
  const { fetchProfile } = useUserStore();
  
  // Synchronize authentication state
  useEffect(() => {
    if (isLoaded) {
      setAuthenticated(!!isSignedIn);
      setLoading(false);
      
      // Fetch user profile if signed in
      if (isSignedIn && userId) {
        fetchProfile().catch(error => {
          console.error('Error fetching user profile:', error);
        });
      }
    }
  }, [isLoaded, isSignedIn, userId, setAuthenticated, setLoading, fetchProfile]);

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <NotificationProvider>
          {children}
          <ModalProvider />
          <ToastNotification position="top-right" limit={3} />
        </NotificationProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
