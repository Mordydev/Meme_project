'use client';

import { useState, useEffect, useCallback } from 'react';

// Define phantom wallet types
interface PhantomProvider {
  connect: () => Promise<{ publicKey: string }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  isPhantom: boolean;
  publicKey?: { toString: () => string };
  on: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback: (data: any) => void) => void;
}

interface Window {
  phantom?: {
    solana?: PhantomProvider;
  };
  solana?: PhantomProvider;
}

/**
 * Hook to interact with Phantom wallet
 */
export function useWallet() {
  const [wallet, setWallet] = useState<PhantomProvider | null>(null);
  const [publicKey, setPublicKey] = useState<{ toString: () => string } | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Check if Phantom is installed and available
  const getProvider = useCallback((): PhantomProvider | null => {
    if (typeof window === 'undefined') return null;
    
    const windowObj = window as unknown as Window;
    
    // Check multiple ways the provider might be available
    const provider = 
      windowObj.phantom?.solana ||
      windowObj.solana ||
      null;
    
    if (provider?.isPhantom) {
      return provider;
    }
    
    return null;
  }, []);
  
  // Initialize wallet
  useEffect(() => {
    const provider = getProvider();
    
    if (provider) {
      setWallet(provider);
      
      // Check if already connected
      if (provider.publicKey) {
        setPublicKey(provider.publicKey);
        setConnected(true);
      }
      
      // Setup disconnect listener
      const handleDisconnect = () => {
        setPublicKey(null);
        setConnected(false);
      };
      
      provider.on('disconnect', handleDisconnect);
      
      return () => {
        provider.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [getProvider]);
  
  // Connect to wallet
  const connect = useCallback(async () => {
    if (!wallet) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    
    try {
      setLoading(true);
      const { publicKey } = await wallet.connect();
      setPublicKey({ toString: () => publicKey });
      setConnected(true);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [wallet]);
  
  // Disconnect from wallet
  const disconnect = useCallback(async () => {
    if (!wallet) return;
    
    try {
      setLoading(true);
      await wallet.disconnect();
      setPublicKey(null);
      setConnected(false);
    } catch (error) {
      console.error('Error disconnecting from wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [wallet]);
  
  // Sign a message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Convert message string to Uint8Array
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      const { signature } = await wallet.signMessage(messageBytes);
      
      // Convert signature to base58 string
      const bs58 = await import('bs58');
      return bs58.default.encode(signature);
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }, [wallet, publicKey]);
  
  return {
    wallet,
    publicKey,
    connected,
    loading,
    connect,
    disconnect,
    signMessage,
    isInstalled: !!getProvider(),
  };
}
