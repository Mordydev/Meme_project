'use client';

import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatWalletAddress } from '@/lib/walletService';

export interface RedemptionData {
  pointsAmount: number;
  tokenAmount: number;
  recipientAddress: string;
  conversionRate: number;
}

export interface RedemptionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RedemptionData;
  onConfirm: () => Promise<void>;
}

export function RedemptionConfirmationModal({
  isOpen,
  onClose,
  data,
  onConfirm
}: RedemptionConfirmationModalProps) {
  enum ConfirmationStep {
    SUMMARY = 'summary',
    DISCLAIMER = 'disclaimer',
    PROCESSING = 'processing',
    COMPLETE = 'complete',
    ERROR = 'error'
  }
  
  const [currentStep, setCurrentStep] = useState<ConfirmationStep>(ConfirmationStep.SUMMARY);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only close if not in processing state
      if (currentStep !== ConfirmationStep.PROCESSING) {
        onClose();
        
        // Reset state after closing animation completes
        setTimeout(() => {
          setCurrentStep(ConfirmationStep.SUMMARY);
          setIsAgreed(false);
          setError(null);
        }, 300);
      }
    }
  };
  
  const handleContinue = () => {
    if (currentStep === ConfirmationStep.SUMMARY) {
      setCurrentStep(ConfirmationStep.DISCLAIMER);
    } else if (currentStep === ConfirmationStep.DISCLAIMER && isAgreed) {
      handleConfirm();
    }
  };
  
  const handleConfirm = async () => {
    try {
      setCurrentStep(ConfirmationStep.PROCESSING);
      setIsConfirming(true);
      
      await onConfirm();
      
      setCurrentStep(ConfirmationStep.COMPLETE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setCurrentStep(ConfirmationStep.ERROR);
    } finally {
      setIsConfirming(false);
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setCurrentStep(ConfirmationStep.SUMMARY);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === ConfirmationStep.SUMMARY && 'Confirm Redemption'}
            {currentStep === ConfirmationStep.DISCLAIMER && 'Important Information'}
            {currentStep === ConfirmationStep.PROCESSING && 'Processing Redemption'}
            {currentStep === ConfirmationStep.COMPLETE && 'Redemption Successful'}
            {currentStep === ConfirmationStep.ERROR && 'Redemption Failed'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* Summary Step */}
          {currentStep === ConfirmationStep.SUMMARY && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please review your redemption details before continuing:
              </p>
              
              <div className="rounded-lg border bg-neutral-50 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Points Amount:</span>
                    <span className="font-mono font-medium">{data.pointsAmount} SP</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                    <span>{data.conversionRate} SP = 1 SKC</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Token Amount:</span>
                    <span className="font-mono font-medium">{data.tokenAmount} SKC</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Receiving Wallet:</span>
                    <span className="font-mono text-sm">{formatWalletAddress(data.recipientAddress, 5)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Once confirmed, this transaction cannot be reversed. Please ensure the details are correct.
              </p>
            </div>
          )}
          
          {/* Disclaimer Step */}
          {currentStep === ConfirmationStep.DISCLAIMER && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-neutral-50 p-4 text-sm">
                <p className="mb-2">By proceeding with this redemption:</p>
                <ul className="space-y-2 pl-5 list-disc">
                  <li>I understand that this transaction is irreversible once processed.</li>
                  <li>I confirm that I own the receiving wallet address.</li>
                  <li>I acknowledge that token redemptions are subject to blockchain transaction times and network conditions.</li>
                  <li>I understand that token values may fluctuate and the USD value is not guaranteed.</li>
                </ul>
              </div>
              
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary"
                />
                <label htmlFor="agreement" className="text-sm">
                  I agree to the terms and conditions for token redemption.
                </label>
              </div>
            </div>
          )}
          
          {/* Processing Step */}
          {currentStep === ConfirmationStep.PROCESSING && (
            <div className="flex flex-col items-center justify-center py-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-16 w-16 rounded-full border-4 border-neutral-200 border-t-primary"
              />
              <p className="mt-4 text-center">
                Processing your redemption request...
              </p>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Please do not close this window.
              </p>
            </div>
          )}
          
          {/* Complete Step */}
          {currentStep === ConfirmationStep.COMPLETE && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20 
                  }}
                >
                  <svg className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </div>
              
              <h3 className="mt-4 text-lg font-medium">Redemption Successful!</h3>
              
              <div className="mt-3 text-center text-sm text-muted-foreground">
                <p>
                  {data.pointsAmount} SP have been redeemed for {data.tokenAmount} SKC tokens.
                </p>
                <p className="mt-1">
                  Tokens will be transferred to your wallet shortly.
                </p>
              </div>
              
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>Transaction ID: TXN-{Date.now().toString().substring(0, 8)}</p>
                <p>Processing time may vary based on network conditions.</p>
              </div>
            </div>
          )}
          
          {/* Error Step */}
          {currentStep === ConfirmationStep.ERROR && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20 
                  }}
                >
                  <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
              </div>
              
              <h3 className="mt-4 text-lg font-medium">Redemption Failed</h3>
              
              <div className="mt-3 text-center text-sm">
                <p className="text-red-500">{error}</p>
                <p className="mt-2 text-muted-foreground">
                  Don't worry, your points have not been deducted.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          {/* Summary Step */}
          {currentStep === ConfirmationStep.SUMMARY && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleContinue}>
                Continue
              </Button>
            </>
          )}
          
          {/* Disclaimer Step */}
          {currentStep === ConfirmationStep.DISCLAIMER && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep(ConfirmationStep.SUMMARY)}>
                Back
              </Button>
              <Button onClick={handleContinue} disabled={!isAgreed}>
                Confirm Redemption
              </Button>
            </>
          )}
          
          {/* Processing Step */}
          {currentStep === ConfirmationStep.PROCESSING && (
            <div className="w-full">
              <p className="text-center text-xs text-muted-foreground">
                Please wait while your redemption is being processed...
              </p>
            </div>
          )}
          
          {/* Complete Step */}
          {currentStep === ConfirmationStep.COMPLETE && (
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          )}
          
          {/* Error Step */}
          {currentStep === ConfirmationStep.ERROR && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
