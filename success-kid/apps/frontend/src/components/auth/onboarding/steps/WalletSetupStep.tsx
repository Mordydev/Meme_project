'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { useAuthStore } from '@/store/auth/authStore';
import { Button } from '@/components/ui/Button';
import { WalletAuthButton } from '@/components/wallet/WalletAuthButton';

interface WalletSetupStepProps {
  onComplete: (data: any) => void;
  isSubmitting: boolean;
}

export function WalletSetupStep({ onComplete, isSubmitting }: WalletSetupStepProps) {
  const { wallet, publicKey } = useWallet();
  const [skipped, setSkipped] = useState(false);
  
  // Handle wallet connection - once connected, complete the step
  const handleComplete = () => {
    // Complete the step with wallet information if connected
    if (wallet && publicKey) {
      onComplete({
        walletConnected: true,
        walletAddress: publicKey.toString()
      });
    } else {
      // Or with skipped flag
      onComplete({
        walletConnected: false,
        skipped: true
      });
    }
  };
  
  // Handle skip
  const handleSkip = () => {
    setSkipped(true);
    onComplete({
      walletConnected: false,
      skipped: true
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">
          Connect your wallet to earn crypto rewards and access exclusive features
        </p>
      </div>
      
      {wallet && publicKey ? (
        // Wallet connected view
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 p-4 rounded-lg border border-green-200"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-center text-lg font-medium text-green-800 mb-2">
            Wallet Connected!
          </h3>
          
          <p className="text-center text-green-700 mb-4">
            You've successfully connected your wallet to your account.
          </p>
          
          <div className="bg-white p-3 rounded border border-green-200 text-center">
            <span className="font-mono text-sm">
              {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </span>
          </div>
          
          <Button
            className="w-full mt-4"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            Continue
          </Button>
        </motion.div>
      ) : skipped ? (
        // Skipped view
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-center text-lg font-medium text-yellow-800 mb-2">
            Wallet Connection Skipped
          </h3>
          
          <p className="text-center text-yellow-700 mb-4">
            You can connect your wallet later from your profile settings.
          </p>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSkipped(false)}
              disabled={isSubmitting}
            >
              Go Back
            </Button>
            
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={isSubmitting}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      ) : (
        // Wallet connection view
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Why connect a wallet?</h3>
            <ul className="space-y-2 text-blue-700 text-sm list-disc list-inside">
              <li>Earn crypto rewards for your contributions</li>
              <li>Access exclusive token-gated content and features</li>
              <li>Participate in governance and voting</li>
              <li>Build your on-chain reputation</li>
            </ul>
          </div>
          
          <div className="pt-2">
            <WalletAuthButton />
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-gray-500 text-sm hover:underline"
              disabled={isSubmitting}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
