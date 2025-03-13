'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

interface VerificationPromptProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function VerificationPrompt({
  isOpen,
  onComplete,
  onCancel,
}: VerificationPromptProps) {
  const { wallet, verify } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<
    'instructions' | 'verifying' | 'success' | 'error'
  >('instructions');
  const [error, setError] = useState<string | null>(null);
  
  // Reset step when opened
  useEffect(() => {
    if (isOpen) {
      setVerificationStep('instructions');
      setError(null);
    }
  }, [isOpen]);
  
  const handleVerify = async () => {
    if (!wallet) return;
    
    setIsVerifying(true);
    setVerificationStep('verifying');
    
    try {
      // For demo purposes, we'll simulate a successful verification
      // In a real implementation, we would sign a message and verify with the backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const success = await verify(wallet.account.address, 'signed-message');
      
      if (success) {
        setVerificationStep('success');
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      setVerificationStep('error');
      setError('Failed to verify wallet ownership. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white p-6 shadow-xl"
      >
        {verificationStep === 'instructions' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Verify Wallet Ownership</h3>
            
            <p className="mb-6 text-gray-600">
              To complete the verification process, you'll need to sign a message with your wallet.
              This proves you own the wallet without giving us any control over your assets.
            </p>
            
            <div className="mb-6 rounded-lg bg-primary-50 p-4 text-left">
              <h4 className="mb-2 font-medium text-gray-900">What to expect:</h4>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex">
                  <span className="mr-2">1.</span>
                  <span>Your wallet will ask you to sign a message</span>
                </li>
                <li className="flex">
                  <span className="mr-2">2.</span>
                  <span>Review the message in your wallet</span>
                </li>
                <li className="flex">
                  <span className="mr-2">3.</span>
                  <span>Approve the signature request</span>
                </li>
                <li className="flex">
                  <span className="mr-2">4.</span>
                  <span>Wait for verification to complete</span>
                </li>
              </ol>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerify}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
        
        {verificationStep === 'verifying' && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <svg className="h-12 w-12 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Verifying Wallet Ownership</h3>
            
            <p className="text-gray-600">
              Please confirm the signature request in your wallet.
              This process may take a few moments to complete.
            </p>
          </div>
        )}
        
        {verificationStep === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
              <svg className="h-10 w-10 text-success-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Verification Successful!</h3>
            
            <p className="text-gray-600">
              Your wallet has been verified. You now have access to all wallet features.
            </p>
          </div>
        )}
        
        {verificationStep === 'error' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Verification Failed</h3>
            
            <p className="mb-6 text-gray-600">
              {error || 'There was an issue verifying your wallet. Please try again.'}
            </p>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerify}
                className="flex-1"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
