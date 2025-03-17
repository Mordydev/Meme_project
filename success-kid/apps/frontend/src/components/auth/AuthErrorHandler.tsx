'use client';

import { useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, AuthError } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface AuthErrorHandlerProps {
  redirectUrl?: string;
  showCard?: boolean;
}

/**
 * Authentication Error Handler
 * 
 * Provides consistent error handling and recovery flows for authentication errors
 */
export function AuthErrorHandler({ redirectUrl = '/sign-in', showCard = true }: AuthErrorHandlerProps) {
  const { error, clearError } = useAuth();
  const router = useRouter();

  // Handle session expiration errors
  useEffect(() => {
    if (error?.code === 'session_expired') {
      // Add a small delay before redirecting to login
      const timer = setTimeout(() => {
        router.push(`${redirectUrl}?error=session_expired`);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, router, redirectUrl]);

  if (!error) return null;

  // Get action based on error type
  const getAction = () => {
    switch (error.code) {
      case 'unauthorized':
      case 'session_expired':
        return (
          <Button onClick={() => router.push(redirectUrl)} variant="secondary">
            Sign in again
          </Button>
        );
      case 'network_error':
        return (
          <Button onClick={() => window.location.reload()} variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh page
          </Button>
        );
      case 'wallet_error':
      case 'wallet_connection_failed':
      case 'wallet_verification_failed':
        return (
          <Button onClick={() => router.push('/sign-in')} variant="secondary">
            Try another method
          </Button>
        );
      default:
        return (
          <Button onClick={clearError} variant="secondary">
            <X className="mr-2 h-4 w-4" />
            Dismiss
          </Button>
        );
    }
  };

  const getErrorMessage = () => {
    switch (error.code) {
      case 'unauthorized':
        return 'Your session has ended. Please sign in again to continue.';
      case 'session_expired':
        return 'Your session has expired. You will be redirected to the login page.';
      case 'network_error':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'invalid_credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      default:
        return error.message;
    }
  };

  // Simple inline alert if not showing card
  if (!showCard) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{getErrorMessage()}</AlertDescription>
      </Alert>
    );
  }

  // Full card with action buttons for more serious errors
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertCircle className="mr-2 h-5 w-5" />
          Authentication Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{getErrorMessage()}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        {getAction()}
        <Button variant="ghost" onClick={clearError}>
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
}
