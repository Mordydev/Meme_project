'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { WalletErrorType } from '@/types/wallet';
import { categorizeWalletError } from '@/lib/walletService';
import { WALLET_PROVIDERS } from '@/lib/walletProviders';

interface WalletErrorHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: any;
}

export function WalletErrorHandler({
  isOpen,
  onClose,
  onRetry,
  error,
}: WalletErrorHandlerProps) {
  const { clearError } = useWallet();
  
  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  if (!isOpen) return null;
  
  const categorizedError = categorizeWalletError(error);
  
  const getErrorContent = () => {
    switch (categorizedError.code) {
      case WalletErrorType.WALLET_NOT_FOUND:
        return {
          title: 'Wallet Not Found',
          description: 'The wallet extension or app was not found on your device.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7h-5m-5 0H5m10 10H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v1" />
            </svg>
          ),
          steps: [
            'Install the wallet extension from the official website',
            'Create or import a wallet',
            'Refresh this page and try connecting again',
          ],
          actions: [
            {
              label: 'Install Phantom',
              action: () => {
                window.open(WALLET_PROVIDERS.phantom.url, '_blank');
              },
              variant: 'primary',
            },
            {
              label: 'Try Different Wallet',
              action: onRetry,
              variant: 'outline',
            },
          ],
        };
      
      case WalletErrorType.CONNECTION_REFUSED:
        return {
          title: 'Connection Declined',
          description: 'The connection request was declined in your wallet.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          steps: [
            'Open your wallet extension',
            'Ensure your wallet is unlocked',
            'Try connecting again and approve the request',
          ],
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'primary',
            },
          ],
        };
      
      case WalletErrorType.NETWORK_ERROR:
        return {
          title: 'Network Error',
          description: 'There was a problem connecting to the network.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
          steps: [
            'Check your internet connection',
            'Ensure your wallet is connected to the internet',
            'Try connecting again after a moment',
          ],
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'primary',
            },
          ],
        };
      
      case WalletErrorType.SIGNATURE_DECLINED:
        return {
          title: 'Signature Declined',
          description: 'The signature request was declined in your wallet.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          ),
          steps: [
            'Open your wallet extension',
            'Ensure your wallet is unlocked',
            'Try connecting again and approve the signature request',
          ],
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'primary',
            },
          ],
        };
      
      case WalletErrorType.WRONG_NETWORK:
        return {
          title: 'Wrong Network',
          description: 'Your wallet is connected to the wrong network.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          steps: [
            'Open your wallet extension',
            'Switch to the Solana Mainnet network',
            'Try connecting again',
          ],
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'primary',
            },
          ],
        };
      
      case WalletErrorType.TIMEOUT:
        return {
          title: 'Connection Timeout',
          description: 'The connection request timed out.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          steps: [
            'Check if your wallet is running and unlocked',
            'Ensure you have a stable internet connection',
            'Try connecting again',
          ],
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'primary',
            },
          ],
        };
      
      default:
        return {
          title: 'Connection Error',
          description: categorizedError.message || 'There was an error connecting to your wallet.',
          icon: (
            <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          steps: [
            'Check if your wallet is running and unlocked',
            'Refresh the page and try again',
            'If the problem persists, try a different browser or device',
          ],
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'primary',
            },
          ],
        };
    }
  };
  
  const errorContent = getErrorContent();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            {errorContent.icon}
          </div>
          
          <h3 className="mb-2 text-xl font-semibold text-gray-900">{errorContent.title}</h3>
          
          <p className="mb-6 text-gray-600">
            {errorContent.description}
          </p>
          
          <div className="mb-6 rounded-lg bg-primary-50 p-4 text-left">
            <h4 className="mb-2 font-medium text-gray-900">Try these steps:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              {errorContent.steps.map((step, index) => (
                <li key={index} className="flex">
                  <span className="mr-2">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {errorContent.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant as any}
                onClick={action.action}
                className="flex-1"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
