'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { WALLET_PROVIDERS } from '@/lib/walletProviders';
import { WalletType } from '@/types/wallet';

interface MobileWalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  walletType?: WalletType;
}

export function MobileWalletConnect({
  isOpen,
  onClose,
  onComplete,
  walletType = 'phantom',
}: MobileWalletConnectProps) {
  const { connectionSession, createConnectionSession } = useWallet();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'pending' | 'connected' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  
  // Create or get connection session when modal opens
  useEffect(() => {
    if (isOpen && !connectionSession) {
      const initSession = async () => {
        setIsCreatingSession(true);
        try {
          await createConnectionSession();
          setConnectionStatus('pending');
        } catch (error) {
          console.error('Error creating connection session:', error);
          setConnectionStatus('failed');
          setError('Failed to create connection session. Please try again.');
        } finally {
          setIsCreatingSession(false);
        }
      };
      
      initSession();
    }
  }, [isOpen, connectionSession, createConnectionSession]);
  
  // Poll for connection status
  useEffect(() => {
    if (!isOpen || !connectionSession || connectionStatus !== 'pending') {
      return;
    }
    
    const checkConnectionStatus = async () => {
      // In a real implementation, we would check with the backend if the user has connected
      // For demo purposes, we'll simulate success after 5 seconds
      const timeout = setTimeout(() => {
        setConnectionStatus('connected');
        setTimeout(() => {
          onComplete();
        }, 1500);
      }, 5000);
      
      return () => clearTimeout(timeout);
    };
    
    const cleanup = checkConnectionStatus();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [isOpen, connectionSession, connectionStatus, onComplete]);
  
  const handleOpenWallet = () => {
    if (!connectionSession?.deepLink) return;
    
    // Open the wallet app via deep link
    window.location.href = connectionSession.deepLink;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white p-6 shadow-xl"
      >
        {isCreatingSession ? (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="mb-4 h-10 w-10 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Preparing secure connection...</p>
          </div>
        ) : connectionStatus === 'pending' && connectionSession ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Connect with {WALLET_PROVIDERS[walletType].name}</h3>
            
            <p className="mb-6 text-gray-600">
              Open the {WALLET_PROVIDERS[walletType].name} app on your mobile device to connect your wallet.
            </p>
            
            {connectionSession.qrCodeData && (
              <div className="mb-6 flex justify-center">
                {/* In a real implementation, this would be an actual QR code */}
                <div className="h-48 w-48 rounded-lg bg-gray-200 p-4 flex items-center justify-center">
                  <div className="text-center text-sm text-gray-500">
                    [QR Code]
                    <br />
                    Would render actual QR code here
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button onClick={handleOpenWallet}>
                Open {WALLET_PROVIDERS[walletType].name} App
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
            
            <p className="mt-4 text-xs text-gray-500">
              Connection will expire in 15 minutes. Refresh to generate a new connection code.
            </p>
          </div>
        ) : connectionStatus === 'connected' ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
              <svg className="h-10 w-10 text-success-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Connected Successfully!</h3>
            
            <p className="text-gray-600">
              Your wallet has been connected successfully.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Connection Failed</h3>
            
            <p className="mb-6 text-gray-600">
              {error || 'There was an issue connecting your wallet. Please try again.'}
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setConnectionStatus('pending');
                  createConnectionSession();
                }}
                className="flex-1"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
