'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Wallet } from '@/types/wallet';

interface ConfirmationStepProps {
  pointsAmount: number;
  tokenAmount: number;
  wallet: Wallet | null;
  conversionRate: number;
}

export function ConfirmationStep({ 
  pointsAmount, 
  tokenAmount, 
  wallet, 
  conversionRate 
}: ConfirmationStepProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return 'Not connected';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };
  
  // Define animation properties
  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
      };
  
  return (
    <div className="space-y-6">
      <motion.div 
        className="bg-neutral-50 p-4 rounded-lg"
        {...animationProps}
      >
        <h3 className="text-base font-medium mb-3">Redemption Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Points to Redeem:</span>
            <span className="font-medium">{pointsAmount.toLocaleString()} Points</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">You'll Receive:</span>
            <span className="font-medium">{tokenAmount.toLocaleString()} SKC</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Conversion Rate:</span>
            <span className="text-sm text-neutral-500">{conversionRate} Points = 1 SKC</span>
          </div>
          
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Destination Wallet:</span>
              <span className="font-mono text-sm">
                {wallet ? formatAddress(wallet.account.address) : 'Not connected'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg"
        {...animationProps}
        transition={{ delay: 0.1 }}
      >
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-800 mb-1">Important Information</h4>
          <ul className="space-y-2 text-sm text-amber-700">
            <li>This action cannot be undone once confirmed</li>
            <li>Tokens will be sent directly to your connected wallet</li>
            <li>The transaction typically processes within minutes</li>
            <li>Your points balance will be immediately updated</li>
          </ul>
        </div>
      </motion.div>
      
      <motion.div 
        className="p-4 rounded-lg border border-neutral-200"
        {...animationProps}
        transition={{ delay: 0.2 }}
      >
        <h4 className="font-medium mb-2">Terms & Conditions</h4>
        <p className="text-sm text-neutral-600 mb-4">
          By proceeding with this redemption, you confirm that:
        </p>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You understand the points will be permanently deducted from your balance
          </li>
          <li className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            The wallet address provided is correct and under your control
          </li>
          <li className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You accept the platform's redemption policy
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
