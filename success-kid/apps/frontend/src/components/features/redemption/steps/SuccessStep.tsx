'use client';

import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface SuccessStepProps {
  pointsAmount: number;
  tokenAmount: number;
  transactionHash: string | null;
}

export function SuccessStep({ 
  pointsAmount, 
  tokenAmount, 
  transactionHash 
}: SuccessStepProps) {
  const prefersReducedMotion = useReducedMotion();
  const confettiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Launch confetti on mount
  React.useEffect(() => {
    if (prefersReducedMotion) return;
    
    if (confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true
      });
      
      // Fire celebration
      myConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [prefersReducedMotion]);
  
  // Format transaction hash for display
  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
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
    <div className="py-4">
      {/* Canvas for confetti */}
      {!prefersReducedMotion && (
        <canvas
          ref={confettiCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-50"
        />
      )}
      
      <div className="flex flex-col items-center justify-center">
        <motion.div 
          className="mb-6 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <div className="mb-4">
            <div className="relative">
              <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              
              <div className="absolute -top-6 -right-6">
                <div className="relative w-12 h-12">
                  <Image 
                    src="/images/success-kid.png" 
                    alt="Success Kid" 
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-center mb-1">
            Redemption Successful!
          </h3>
          
          <p className="text-green-600 font-medium text-lg mb-2">
            {tokenAmount.toLocaleString()} SKC Tokens Received
          </p>
          
          <p className="text-neutral-600 text-center max-w-xs mx-auto">
            Your points have been successfully converted to tokens and transferred to your wallet.
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-neutral-50 p-4 rounded-lg w-full mb-6"
          {...animationProps}
        >
          <h4 className="font-medium text-neutral-700 mb-3">Transaction Details</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Points Redeemed:</span>
              <span className="font-medium">{pointsAmount.toLocaleString()} Points</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-neutral-600">Tokens Received:</span>
              <span className="font-medium">{tokenAmount.toLocaleString()} SKC</span>
            </div>
            
            {transactionHash && (
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200 mt-2">
                <span className="text-neutral-600">Transaction:</span>
                <div className="flex items-center">
                  <span className="font-mono text-sm">{formatHash(transactionHash)}</span>
                  <a 
                    href={`https://explorer.solana.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          className="text-center"
          {...animationProps}
          transition={{ delay: 0.2 }}
        >
          <p className="text-neutral-600 mb-4">
            What would you like to do next?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <a 
                href="/market"
                className="flex items-center"
              >
                View My Tokens
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            
            <Button variant="outline" asChild>
              <a 
                href="/rewards"
                className="flex items-center"
              >
                Back to Rewards
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
