'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createPhantomAdapter } from '@/lib/wallet-adapters/PhantomAdapter';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface WalletAuthProps {
  redirect?: string;
  showTitle?: boolean;
}

/**
 * Wallet Authentication Component
 * 
 * Allows users to authenticate using their Phantom wallet
 * Can be used both for initial authentication and for connecting a wallet to an existing account
 */
export function WalletAuth({ redirect = '/dashboard', showTitle = true }: WalletAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'initial' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const { toast } = useToast();
  const { isAuthenticated, connectWallet } = useAuth();
  const router = useRouter();

  // Detect wallet provider
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProvider(window.phantom?.solana);
    }
  }, []);

  // Reset error when connection step changes
  useEffect(() => {
    if (connectionStep !== 'error') {
      setErrorMessage(null);
    }
  }, [connectionStep]);

  // Handle successful auth
  useEffect(() => {
    if (connectionStep === 'success' && isAuthenticated && redirect) {
      // Delay redirect slightly to show success state
      const timer = setTimeout(() => {
        router.push(redirect);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStep, isAuthenticated, redirect, router]);

  const handleAuth = async () => {
    if (!provider) {
      setErrorMessage('Phantom wallet extension not found. Please install it to continue.');
      setConnectionStep('error');
      return;
    }

    setIsConnecting(true);
    setConnectionStep('connecting');

    try {
      const phantomAdapter = createPhantomAdapter();
      
      // Step 1: Connect to wallet
      setConnectionStep('connecting');
      const address = await phantomAdapter.connect();
      
      // Step 2: Initialize connection with server
      setConnectionStep('signing');
      const { sessionId, message } = await phantomAdapter.initializeConnection();
      
      // Step 3: Sign message
      const signature = await phantomAdapter.signMessage(message);
      
      // Step 4: Verify and complete authentication
      setConnectionStep('verifying');
      
      // Call Auth hook to authenticate with wallet
      const success = await connectWallet(address, signature, sessionId);
      
      if (success) {
        setConnectionStep('success');
        toast({
          title: 'Authentication successful',
          description: 'You have successfully signed in with your wallet',
          variant: 'success',
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Wallet authentication error:', error);
      setConnectionStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to authenticate with wallet');
      
      toast({
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Error authenticating with wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getStepContent = () => {
    switch (connectionStep) {
      case 'connecting':
        return 'Connecting to your wallet...';
      case 'signing':
        return 'Please sign the message in your wallet to verify ownership...';
      case 'verifying':
        return 'Verifying your wallet signature...';
      case 'success':
        return 'Authentication successful! Redirecting...';
      case 'error':
        return errorMessage || 'An error occurred during authentication';
      default:
        return 'Connect your Phantom wallet to authenticate';
    }
  };

  const getStepIcon = () => {
    switch (connectionStep) {
      case 'connecting':
      case 'signing':
      case 'verifying':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Wallet className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Wallet Authentication
          </CardTitle>
          <CardDescription>
            Authenticate using your Phantom wallet
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4 rounded-lg border p-4">
          {getStepIcon()}
          <div className="flex-1">
            <p className="text-sm">{getStepContent()}</p>
          </div>
        </div>

        {connectionStep === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>
              {errorMessage || 'An error occurred during authentication'}
            </AlertDescription>
          </Alert>
        )}

        {connectionStep === 'success' && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              You have successfully authenticated with your wallet
            </AlertDescription>
          </Alert>
        )}

        {!provider && connectionStep === 'initial' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet Not Detected</AlertTitle>
            <AlertDescription>
              Phantom wallet extension not found. Please install it to continue.
              <a 
                href="https://phantom.app/download" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                Download Phantom
              </a>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleAuth}
          disabled={isConnecting || !provider || connectionStep === 'success'}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : connectionStep === 'success' ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Connected
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
