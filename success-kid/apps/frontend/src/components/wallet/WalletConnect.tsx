'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/store/useUserStore';
import { Loader2, Wallet } from 'lucide-react';

// Add global type for Phantom wallet
declare global {
  interface Window {
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
      };
    };
  }
}

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { profile, connectWallet, disconnectWallet } = useUserStore();
  const { toast } = useToast();
  
  const isWalletConnected = profile?.wallet?.connected;
  
  const handleConnect = async () => {
    if (!window.phantom) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the Phantom wallet extension',
        variant: 'destructive',
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Request wallet connection
      const provider = window.phantom?.solana;
      if (!provider) {
        throw new Error('Phantom provider not found');
      }
      
      // Connect wallet
      const resp = await provider.connect();
      const publicKey = resp.publicKey.toString();
      
      // Generate message for signing
      const response = await fetch(`/api/users/wallet/message/${publicKey}`);
      if (!response.ok) {
        throw new Error('Failed to generate signing message');
      }
      
      const { data } = await response.json();
      const message = data.message;
      
      // Request signature
      const encodedMessage = new TextEncoder().encode(message);
      const signatureData = await provider.signMessage(encodedMessage, 'utf8');
      const signature = btoa(String.fromCharCode.apply(null, signatureData.signature));
      
      // Complete connection with backend
      const connectResponse = await fetch('/api/users/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey,
          signature,
          message,
          chainType: 'solana'
        }),
      });
      
      if (!connectResponse.ok) {
        const error = await connectResponse.json();
        throw new Error(error.message || 'Failed to connect wallet');
      }
      
      // Update local state
      await connectWallet(publicKey);
      
      toast({
        title: 'Wallet connected',
        description: 'Your wallet has been connected successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Error connecting wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!profile?.wallet?.address) return;
    
    setIsConnecting(true);
    
    try {
      // Disconnect wallet from backend
      const response = await fetch('/api/users/wallet/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: profile.wallet.address,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disconnect wallet');
      }
      
      // Update local state
      disconnectWallet();
      
      toast({
        title: 'Wallet disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      
      toast({
        title: 'Disconnection failed',
        description: error instanceof Error ? error.message : 'Error disconnecting wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-4 flex items-center">
        <Wallet className="mr-2 h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Wallet Connection</h3>
      </div>
      
      {isWalletConnected ? (
        <div className="space-y-4">
          <div className="rounded-md bg-muted/50 p-3">
            <div className="text-sm font-medium">Connected Wallet</div>
            <div className="mt-1 break-all text-xs text-muted-foreground">
              {profile.wallet.address}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Wallet'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Phantom wallet to track tokens and enable redemptions.
          </p>
          
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Phantom Wallet'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
