'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { WalletManager } from '@/components/wallet';
import { useWallet } from '@/hooks/useWallet';

interface ConnectWalletPromptProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ConnectWalletPrompt({ 
  onNext,
  onSkip
}: ConnectWalletPromptProps) {
  const { isConnected, isVerified } = useWallet();
  
  // Handle wallet connection completion
  useEffect(() => {
    if (isConnected && isVerified) {
      // Automatically proceed after successful wallet connection and verification
      setTimeout(() => {
        onNext();
      }, 1500); // Give user a moment to see success state
    }
  }, [isConnected, isVerified, onNext]);
  
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
        
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <WalletManager 
              showWalletCard={isConnected}
              compact={true}
            />
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col space-y-3 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
      >
        {!isConnected && (
          <>
            <Button onClick={onNext}>
              Skip for now
            </Button>
            <Button variant="outline" onClick={onSkip}>
              Skip Tutorial
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
