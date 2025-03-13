'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WALLET_PROVIDERS } from '@/lib/walletProviders';
import { WalletType } from '@/types/wallet';
import { useWallet } from '@/hooks/useWallet';
import Image from 'next/image';

interface WalletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (walletType: string) => void;
}

export function WalletSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: WalletSelectorModalProps) {
  const { isMobile, isProviderInstalled, getProviderInstallLink } = useWallet();
  const [step, setStep] = useState<'select' | 'instructions'>('select');
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  
  const handleSelect = (walletType: WalletType) => {
    setSelectedWallet(walletType);
    
    // If wallet is not installed and we're on desktop, show instructions
    if (!isProviderInstalled(walletType) && !isMobile) {
      setStep('instructions');
      return;
    }
    
    // Otherwise, proceed with connection
    onSelect(walletType);
  };
  
  const handleBackToSelect = () => {
    setStep('select');
    setSelectedWallet(null);
  };
  
  const handleContinueToInstall = () => {
    if (selectedWallet) {
      window.open(getProviderInstallLink(selectedWallet), '_blank');
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className="relative mx-auto max-w-md overflow-hidden rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Connect Wallet</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mb-4 text-sm text-gray-500">
                Connect your wallet to track your tokens, enable redemptions, and access exclusive features.
              </p>
              
              <div className="mb-6 space-y-3">
                {Object.values(WALLET_PROVIDERS).map((provider) => (
                  <button
                    key={provider.type}
                    onClick={() => handleSelect(provider.type)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                        <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.3 5.71a9.95 9.95 0 00-7.29-3.71 9.95 9.95 0 00-7.29 3.71C1.7 8.79 1 12.57 1 16.5c0 .62.08 1.21.21 1.79l3.5-3.5a3 3 0 012.8-.81l.7.16.5.16.45.15-.77-2.3a3 3 0 013.68-2.03L13.26 11l.5.99-2.5.5a1 1 0 00-.02 1.99L15 15l.97.5.5 2a1 1 0 001.95-.32l-.5-3 1.97-1.97a1 1 0 10-1.32-1.5l-1.5 1.34-2-1a3 3 0 01-1.46-2.74v-.89l1.5-1.5A3 3 0 0118.3 5.71z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{provider.name}</h3>
                        <p className="text-xs text-gray-500">
                          {isProviderInstalled(provider.type) 
                            ? 'Installed' 
                            : isMobile 
                              ? 'Opens in app' 
                              : 'Not installed'}
                        </p>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>
              
              <p className="text-center text-xs text-gray-500">
                By connecting, you agree to our terms and wallet connection policy.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <button
                onClick={handleBackToSelect}
                className="absolute left-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="mb-6 mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Wallet Not Installed</h2>
                <p className="mt-2 text-gray-600">
                  {selectedWallet && WALLET_PROVIDERS[selectedWallet]?.name} wallet is not installed on your browser.
                </p>
              </div>
              
              <div className="mx-auto mb-6 w-24">
                <div className="rounded-full bg-primary-50 p-6">
                  <svg className="h-12 w-12 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7h-5m-5 0H5m10 10H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v1" />
                  </svg>
                </div>
              </div>
              
              <div className="mb-8 space-y-4">
                <p className="text-gray-600">
                  You'll need to install {selectedWallet && WALLET_PROVIDERS[selectedWallet]?.name} to continue with the connection process.
                </p>
                
                <div className="rounded-lg bg-primary-50 p-4">
                  <ol className="space-y-2 text-left text-sm">
                    <li className="flex">
                      <span className="mr-2 font-bold">1.</span>
                      <span>Install the wallet extension from the official website</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2 font-bold">2.</span>
                      <span>Create or import a wallet</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2 font-bold">3.</span>
                      <span>Return to this page and try connecting again</span>
                    </li>
                  </ol>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleBackToSelect}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleContinueToInstall}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-600"
                >
                  Install Wallet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
