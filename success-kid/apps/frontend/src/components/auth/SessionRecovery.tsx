'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface SessionRecoveryProps {
  redirectOnSuccess?: string;
  showAlways?: boolean;
}

/**
 * Session Recovery Component
 * 
 * Handles authentication session recovery after connectivity issues
 * Attempts to restore session state when connection is re-established
 */
export function SessionRecovery({ 
  redirectOnSuccess,
  showAlways = false 
}: SessionRecoveryProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAttemptingRecovery, setIsAttemptingRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, check if we need to recover session
      if (!isAuthenticated && !isLoading && recoveryAttempts < 3) {
        setIsVisible(true);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, isLoading, recoveryAttempts]);
  
  // Check for session storage data that indicates a previous session
  useEffect(() => {
    const checkPreviousSession = () => {
      // Only show if we're not authenticated, we're online, and loading is complete
      if (!isAuthenticated && isOnline && !isLoading) {
        // Check for previous auth data in session storage
        const hasPreviousSession = 
          sessionStorage.getItem('lastAuthCheck') || 
          localStorage.getItem('auth_sync');
          
        if (hasPreviousSession || showAlways) {
          setIsVisible(true);
          
          // Start auto-recovery attempt if configured (can be enabled for better UX)
          // attemptRecovery();
        }
      } else {
        setIsVisible(false);
      }
    };
    
    checkPreviousSession();
  }, [isAuthenticated, isLoading, isOnline, showAlways]);
  
  // Clear visibility when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setIsVisible(false);
      
      // Redirect if requested and session recovered
      if (redirectOnSuccess && recoveryAttempts > 0) {
        router.push(redirectOnSuccess);
      }
    }
  }, [isAuthenticated, redirectOnSuccess, recoveryAttempts, router]);

  const attemptRecovery = async () => {
    if (isAttemptingRecovery || isAuthenticated) return;
    
    setIsAttemptingRecovery(true);
    setRecoveryError(null);
    
    try {
      // Record attempt
      setRecoveryAttempts(prev => prev + 1);
      
      // Call endpoint to refresh session
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        throw new Error('Unable to recover session');
      }
      
      // Session successfully recovered - page will be updated via auth state
      toast({
        title: 'Session Recovered',
        description: 'Your session has been successfully restored.',
        variant: 'success',
      });
      
      // Record auth check time
      sessionStorage.setItem('lastAuthCheck', Date.now().toString());
    } catch (error) {
      console.error('Session recovery failed:', error);
      setRecoveryError('Unable to recover your session. Please sign in again.');
      
      // If we've tried 3 times, suggest signing in again
      if (recoveryAttempts >= 2) {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please sign in again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsAttemptingRecovery(false);
    }
  };

  // Don't show if not visible
  if (!isVisible) {
    return null;
  }

  // Offline message takes precedence
  if (!isOnline) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>You're offline</AlertTitle>
        <AlertDescription>
          Please check your internet connection to continue.
        </AlertDescription>
      </Alert>
    );
  }

  // Regular recovery component
  return (
    <Alert variant={recoveryError ? 'destructive' : 'default'} className="mb-4">
      <RefreshCw className={`h-4 w-4 ${isAttemptingRecovery ? 'animate-spin' : ''}`} />
      <AlertTitle>
        {recoveryError ? 'Session Recovery Failed' : 'Attempting to Restore Session'}
      </AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>
          {recoveryError || 
            (isAttemptingRecovery 
              ? 'Restoring your session, please wait...' 
              : 'Would you like to restore your previous session?')}
        </p>
        
        {!isAttemptingRecovery && !recoveryError && (
          <Button 
            size="sm" 
            onClick={attemptRecovery} 
            className="mt-2 w-full sm:w-auto"
          >
            Restore Session
          </Button>
        )}
        
        {isAttemptingRecovery && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        
        {recoveryError && recoveryAttempts >= 3 && (
          <Button 
            size="sm" 
            variant="secondary" 
            className="mt-2 w-full sm:w-auto"
            onClick={() => router.push('/sign-in')}
          >
            Sign in again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
