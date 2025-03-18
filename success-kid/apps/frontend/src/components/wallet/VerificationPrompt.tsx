'use client';

import React, { useState } from 'react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface VerificationPromptProps {
  onComplete?: (success: boolean) => void;
  className?: string;
  compact?: boolean;
}

export function VerificationPrompt({ 
  onComplete, 
  className,
  compact = false
}: VerificationPromptProps) {
  const { wallet, verifyWallet, isVerifying, error } = useWalletContext();
  const [verified, setVerified] = useState(wallet?.isVerified || false);
  const prefersReducedMotion = useReducedMotion();
  
  const handleVerify = async () => {
    if (!wallet) return;
    
    try {
      const success = await verifyWallet();
      setVerified(success);
      
      if (onComplete) {
        onComplete(success);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };
  
  if (!wallet) {
    return null;
  }
  
  if (wallet.isVerified || verified) {
    if (compact) {
      return (
        <div className={cn("inline-flex items-center gap-1.5 text-sm text-success-600", className)}>
          <ShieldCheck className="h-4 w-4" />
          <span>Verified</span>
        </div>
      );
    }
    
    return (
      <Card className={cn("border-success bg-success/5", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-success-700">
            <ShieldCheck className="h-5 w-5" />
            Wallet Verified
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Your wallet ownership has been verified. You can now redeem points for tokens.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleVerify}
          disabled={isVerifying}
          className="h-7 px-2.5 text-xs"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-1.5 h-3 w-3" />
              Verify Wallet
            </>
          )}
        </Button>
      </div>
    );
  }
  
  return (
    <Card className={cn("border-amber-200 bg-amber-50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          Verification Required
        </CardTitle>
        <CardDescription>
          Please verify wallet ownership to enable redemption
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-600 mb-4">
          This one-time verification ensures you own this wallet and helps secure your account.
          You'll need to sign a message in your wallet - no tokens will be transferred.
        </p>
        
        {error && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleVerify}
          disabled={isVerifying}
          className="mr-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify Now
            </>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={() => onComplete && onComplete(false)}
        >
          Verify Later
        </Button>
      </CardFooter>
    </Card>
  );
}
