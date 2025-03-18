'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

interface AuthErrorHandlerProps {
  children: ReactNode;
}

export function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Error handling for auth-related issues
  useEffect(() => {
    // Example: Handle auth errors here
    // You can add global error handling for authentication issues
    // For now, this is just a placeholder for future implementation
    
    const handleAuthError = (error: any) => {
      console.error('Authentication error:', error);
      // Redirect or show a toast notification, etc.
    };

    window.addEventListener('auth:error', handleAuthError as EventListener);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError as EventListener);
    };
  }, [router]);

  return <>{children}</>;
}
