'use client';

import React from 'react';
import { Loader2, CheckCircle, CircleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ProcessingStepProps {
  pointsAmount: number;
  tokenAmount: number;
  status: string;
  error: string | null;
}

export function ProcessingStep({ 
  pointsAmount, 
  tokenAmount, 
  status, 
  error 
}: ProcessingStepProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'confirming':
        return 'Confirming Transaction';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Processing';
    }
  };
  
  // Define animation properties
  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
      };
  
  // Display error if present
  if (error) {
    return (
      <div className="py-4">
        <Alert variant="destructive" className="mb-6">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Transaction Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="text-center">
          <p className="text-neutral-600 mb-4">
            Your points have not been deducted. Please try again or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-6">
          <div className="relative">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-center mt-4 mb-1">
            Processing Your Redemption
          </h3>
          
          <p className="text-neutral-600 text-center max-w-xs mx-auto">
            Converting {pointsAmount.toLocaleString()} Points 
            to {tokenAmount.toLocaleString()} SKC Tokens
          </p>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-lg w-full">
          <div className="text-sm font-medium text-neutral-700 mb-3">
            Transaction progress:
          </div>
          
          <motion.div className="space-y-4" {...animationProps}>
            {/* Step 1: Request Submitted */}
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Redemption request submitted</p>
                <p className="text-sm text-neutral-600">Your request has been received</p>
              </div>
            </div>
            
            {/* Step 2: Points Deducted */}
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {status === 'pending' ? (
                  <div className="size-5 rounded-full border-2 border-neutral-300" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className={cn(
                  "font-medium",
                  status !== 'pending' ? "text-green-900" : "text-neutral-600"
                )}>
                  Points deducted from your balance
                </p>
                <p className="text-sm text-neutral-600">
                  {status !== 'pending' 
                    ? `${pointsAmount.toLocaleString()} points have been deducted` 
                    : 'Waiting for points to be deducted'}
                </p>
              </div>
            </div>
            
            {/* Step 3: Transaction Created */}
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {status === 'pending' || status === 'processing' ? (
                  <div className="size-5 rounded-full border-2 border-neutral-300" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className={cn(
                  "font-medium",
                  status !== 'pending' && status !== 'processing' ? "text-green-900" : "text-neutral-600"
                )}>
                  Token transaction created
                </p>
                <p className="text-sm text-neutral-600">
                  {status !== 'pending' && status !== 'processing'
                    ? 'Transaction has been created on the blockchain' 
                    : 'Creating transaction on the blockchain'}
                </p>
              </div>
            </div>
            
            {/* Step 4: Tokens Transferred */}
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="size-5 rounded-full border-2 border-neutral-300" />
                )}
              </div>
              <div>
                <p className={cn(
                  "font-medium",
                  status === 'completed' ? "text-green-900" : "text-neutral-600"
                )}>
                  Tokens transferred to your wallet
                </p>
                <p className="text-sm text-neutral-600">
                  {status === 'completed'
                    ? `${tokenAmount.toLocaleString()} SKC tokens have been sent to your wallet` 
                    : 'Waiting for token transfer confirmation'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="mt-6 text-sm text-center text-neutral-500">
          <p>Current Status: <span className="font-medium">{formatStatus(status)}</span></p>
          <p className="mt-1">This process typically takes 1-3 minutes to complete.</p>
        </div>
      </div>
    </div>
  );
}
