'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/Spinner';
import QRCode from 'qrcode.react';

interface MobileWalletConnectionProps {
  onConnect?: () => void;
  onCancel?: () => void;
}

export function MobileWalletConnection({
  onConnect,
  onCancel
}: MobileWalletConnectionProps) {
  const { selectedProvider } = useWallet();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'connecting' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Set up the mobile session when component mounts
  useEffect(() => {
    const createMobileSession = async () => {
      try {
        setStatus('loading');
        
        // Detect device type
        const isAndroid = /android/i.test(navigator.userAgent);
        const deviceType = isAndroid ? 'android' : 'ios';
        
        // Call API to create a session
        const response = await fetch('/api/v1/wallet/mobile/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              deviceType,
              walletType: selectedProvider || 'phantom'
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create mobile connection session');
        }
        
        const data = await response.json();
        
        // Set session info
        setSessionId(data.data.sessionId);
        setQRCodeData(data.data.qrCodeData);
        setDeepLink(data.data.deepLink);
        setStatus('ready');
        
        // Start polling for session status
        startPolling(data.data.sessionId);
      } catch (err) {
        console.error('Error creating mobile session:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to set up mobile connection');
      }
    };
    
    createMobileSession();
    
    return () => {
      // Clean up polling interval on unmount
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedProvider]);
  
  // Set up polling function to check session status
  const startPolling = (sid: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Check session status every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/wallet/mobile/session/${sid}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Session expired or not found
            clearInterval(interval);
            setPollingInterval(null);
            setStatus('error');
            setError('Connection session expired. Please try again.');
            return;
          }
          throw new Error('Failed to check session status');
        }
        
        const data = await response.json();
        
        if (data.data.status === 'connected') {
          // Connection successful
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('connected');
          onConnect?.();
        } else if (data.data.status === 'expired') {
          // Session expired
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('error');
          setError('Connection session expired. Please try again.');
        }
      } catch (err) {
        console.error('Error checking session status:', err);
      }
    }, 2000);
    
    setPollingInterval(interval);
  };
  
  // Handle deep link button click
  const handleDeepLinkClick = () => {
    if (deepLink) {
      setStatus('connecting');
      window.location.href = deepLink;
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    onCancel?.();
  };
  
  // Handle retry button click
  const handleRetry = () => {
    // Reset state and start over
    setSessionId(null);
    setQRCodeData(null);
    setDeepLink(null);
    setStatus('loading');
    setError(null);
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // The useEffect will run again and create a new session
  };
  
  // Render based on current status
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Spinner className="h-8 w-8 mb-4" />
        <p className="text-neutral-600">Setting up wallet connection...</p>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 rounded-full p-3 mb-4">
          <span className="text-2xl">✕</span>
        </div>
        <h3 className="font-medium mb-2">Connection Error</h3>
        <p className="text-neutral-600 text-center mb-4">{error || 'Failed to connect wallet'}</p>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRetry}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Spinner className="h-8 w-8 mb-4" />
        <h3 className="font-medium mb-2">Connecting Wallet</h3>
        <p className="text-neutral-600 text-center mb-4">
          Please approve the connection request in your wallet app.
        </p>
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }
  
  if (status === 'connected') {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="bg-primary-50 text-primary-600 rounded-full p-3 mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h3 className="font-medium mb-2">Wallet Connected!</h3>
        <p className="text-neutral-600 text-center mb-4">
          Your wallet has been successfully connected.
        </p>
        <Button
          variant="primary"
          onClick={onConnect}
        >
          Continue
        </Button>
      </div>
    );
  }
  
  // Default: status === 'ready'
  return (
    <div className="p-4">
      <h3 className="font-medium text-center mb-4">Connect Mobile Wallet</h3>
      
      <Tabs defaultValue="qrcode" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="deeplink">Open App</TabsTrigger>
        </TabsList>
        
        <TabsContent value="qrcode" className="flex flex-col items-center space-y-4">
          <div className="border border-neutral-200 rounded-lg p-2 bg-white">
            {qrCodeData && (
              <QRCode
                value={qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
                renderAs="svg"
              />
            )}
          </div>
          <p className="text-sm text-neutral-600 text-center">
            Scan this QR code with your wallet app to connect
          </p>
        </TabsContent>
        
        <TabsContent value="deeplink" className="flex flex-col items-center space-y-4">
          <div className="bg-neutral-50 rounded-full p-8 mb-2">
            <div className="text-4xl">📱</div>
          </div>
          <p className="text-sm text-neutral-600 text-center mb-2">
            Open your wallet app to connect directly
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleDeepLinkClick}
          >
            Open {selectedProvider?.charAt(0).toUpperCase()}{selectedProvider?.slice(1) || 'Wallet'} App
          </Button>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
