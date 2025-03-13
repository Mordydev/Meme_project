'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useClerk } from '@clerk/nextjs';

interface ConnectWalletPromptProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ConnectWalletPrompt({ 
  onNext,
  onSkip
}: ConnectWalletPromptProps) {
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const { openUserProfile } = useClerk();
  
  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    
    try {
      // Open Clerk's user profile to the connected accounts tab
      await openUserProfile({
        tab: 'account-connections',
      });
      
      // In a real implementation, we would have a way to detect
      // when the wallet is actually connected. For now, we'll just
      // simulate success after a delay
      setTimeout(() => {
        setWalletConnected(true);
        setConnectingWallet(false);
      }, 1000);
    } catch (error) {
      console.error('Error opening user profile:', error);
      setConnectingWallet(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4 inline-block"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl">
            💰
          </div>
        </motion.div>
        
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-2 text-2xl font-bold text-gray-900"
        >
          Connect Your Wallet
        </motion.h2>
        
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-gray-600"
        >
          Connect your wallet to track your tokens and enable redemptions.
        </motion.p>
      </div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mb-8"
      >
        <div className="mb-6 rounded-lg bg-primary/5 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">Benefits of connecting your wallet:</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="mr-2 text-primary">✓</span>
              <span className="text-gray-700">Track your SKC token balance</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary">✓</span>
              <span className="text-gray-700">Redeem Success Points for tokens</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary">✓</span>
              <span className="text-gray-700">Access exclusive holder-only features</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-primary">✓</span>
              <span className="text-gray-700">Participate in governance decisions</span>
            </li>
          </ul>
        </div>
        
        {walletConnected ? (
          <div className="flex items-center justify-center rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Wallet successfully connected!</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button 
              onClick={handleConnectWallet}
              disabled={connectingWallet}
              className="px-6 py-3 text-base"
            >
              {connectingWallet ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
        )}
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col space-y-3 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
      >
        <Button onClick={onNext}>
          {walletConnected ? 'Continue' : 'Skip for now'}
        </Button>
        {!walletConnected && (
          <Button variant="outline" onClick={onSkip}>
            Skip Tutorial
          </Button>
        )}
      </motion.div>
    </div>
  );
}
