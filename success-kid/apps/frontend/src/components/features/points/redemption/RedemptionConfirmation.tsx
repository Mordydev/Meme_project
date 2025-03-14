'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export interface RedemptionData {
  pointsAmount: number;
  tokenAmount: number;
  walletAddress: string;
}

interface RedemptionConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  redemptionData: RedemptionData;
  onConfirm: () => Promise<void>;
  onSuccess?: (transactionId: string) => void;
}

type ConfirmationStep = 'summary' | 'disclaimer' | 'processing' | 'success' | 'error';

export const RedemptionConfirmation: React.FC<RedemptionConfirmationProps> = ({
  isOpen,
  onClose,
  redemptionData,
  onConfirm,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<ConfirmationStep>('summary');
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Format wallet address for display (truncate middle)
  const formatWalletAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle disclaimer agreement
  const handleAgreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAgreed(e.target.checked);
  };
  
  // Handle next step navigation
  const handleNext = () => {
    if (currentStep === 'summary') {
      setCurrentStep('disclaimer');
    } else if (currentStep === 'disclaimer' && isAgreed) {
      handleConfirm();
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'disclaimer') {
      setCurrentStep('summary');
    } else if (currentStep === 'error') {
      setCurrentStep('summary');
      setError(null);
    }
  };
  
  // Handle confirmation
  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      setCurrentStep('processing');
      
      // Call the confirm function from props
      await onConfirm();
      
      // Mock successful transaction ID 
      const mockTransactionId = `tx_${Date.now().toString(36)}`;
      setTransactionId(mockTransactionId);
      
      // Move to success step
      setCurrentStep('success');
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(mockTransactionId);
      }
    } catch (err) {
      console.error('Redemption error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during redemption');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle close and reset
  const handleCloseAndReset = () => {
    onClose();
    
    // Reset state after modal animation completes
    setTimeout(() => {
      setCurrentStep('summary');
      setIsAgreed(false);
      setIsProcessing(false);
      setError(null);
      setTransactionId(null);
    }, 300);
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'summary':
        return (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4">Redemption Summary</h3>
            
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 text-xl font-bold">
                    <span>{redemptionData.pointsAmount} SP</span>
                    <span className="text-neutral-400">→</span>
                    <span>{redemptionData.tokenAmount.toFixed(2)} SKC</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    Rate: 100 SP = 1 SKC
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Points Amount:</span>
                  <span className="font-medium">{redemptionData.pointsAmount} SP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Token Amount:</span>
                  <span className="font-medium">{redemptionData.tokenAmount.toFixed(2)} SKC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Receiving Wallet:</span>
                  <span className="font-medium">{formatWalletAddress(redemptionData.walletAddress)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Transaction Fee:</span>
                  <span className="font-medium">None</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseAndReset}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        );
        
      case 'disclaimer':
        return (
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
            
            <div className="bg-neutral-50 p-4 rounded-lg text-sm text-neutral-800 mb-4 h-48 overflow-y-auto">
              <p className="mb-3">
                By proceeding with this redemption, you acknowledge and agree to the following:
              </p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  You are converting Success Points (SP) to SKC tokens at the current fixed rate of 100 SP = 1 SKC.
                </li>
                <li>
                  The SP will be deducted from your account immediately upon confirmation.
                </li>
                <li>
                  SKC tokens will be sent to the connected wallet address shown in the summary.
                </li>
                <li>
                  Token delivery may take up to 24 hours to process and appear in your wallet.
                </li>
                <li>
                  This transaction cannot be reversed once confirmed.
                </li>
                <li>
                  You are responsible for ensuring your wallet address is correct and compatible with the Solana blockchain.
                </li>
                <li>
                  Token values may fluctuate and the Success Kid platform is not responsible for any changes in market value after redemption.
                </li>
                <li>
                  This redemption may be subject to weekly limits and other platform policies.
                </li>
              </ol>
            </div>
            
            <div className="flex items-start mb-6">
              <input
                type="checkbox"
                id="disclaimer-agree"
                checked={isAgreed}
                onChange={handleAgreeChange}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary"
              />
              <label htmlFor="disclaimer-agree" className="ml-2 block text-sm text-neutral-700">
                I have read and agree to the terms and conditions of this redemption process
              </label>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button variant="primary" disabled={!isAgreed} onClick={handleNext}>
                Confirm Redemption
              </Button>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="px-6 pb-6 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Your Redemption</h3>
              <p className="text-neutral-600 max-w-sm mx-auto">
                Please wait while we process your redemption. This may take a moment.
              </p>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="px-6 pb-6 text-center">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Redemption Successful!</h3>
              <p className="text-neutral-600 max-w-sm mx-auto mb-4">
                Your points have been successfully redeemed for SKC tokens. The tokens will arrive in your wallet soon.
              </p>
              
              <div className="bg-neutral-50 p-3 rounded-lg text-sm w-full max-w-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-600">Points Redeemed:</span>
                  <span className="font-medium">{redemptionData.pointsAmount} SP</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-600">Tokens Received:</span>
                  <span className="font-medium">{redemptionData.tokenAmount.toFixed(2)} SKC</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-600">Transaction ID:</span>
                  <span className="font-medium">{transactionId?.substring(0, 8)}...</span>
                </div>
              </div>
              
              <div className="mt-6 w-full">
                <Button variant="primary" className="w-full" onClick={handleCloseAndReset}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="px-6 pb-6 text-center">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-alert-100 text-alert-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Redemption Failed</h3>
              <p className="text-neutral-600 max-w-sm mx-auto mb-4">
                {error || "We encountered an error while processing your redemption. Please try again later."}
              </p>
              
              <div className="flex gap-3 mt-4 w-full">
                <Button variant="outline" className="flex-1" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleCloseAndReset}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Progress indicator for steps
  const renderProgressSteps = () => {
    const steps = [
      { key: 'summary', label: 'Summary' },
      { key: 'disclaimer', label: 'Terms' },
      { key: 'confirmation', label: 'Complete' },
    ];
    
    // Determine the active step index
    let activeIndex = 0;
    if (currentStep === 'disclaimer') activeIndex = 1;
    if (['processing', 'success', 'error'].includes(currentStep)) activeIndex = 2;
    
    return (
      <div className="flex items-center justify-center px-6 py-4 border-b border-neutral-200">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= activeIndex
                  ? 'bg-primary text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}>
                {index < activeIndex ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-xs mt-1">{step.label}</span>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-12 mx-2 ${
                index < activeIndex ? 'bg-primary' : 'bg-neutral-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isProcessing ? handleCloseAndReset : undefined}
      maxWidth="max-w-md"
    >
      {renderProgressSteps()}
      {renderStepContent()}
    </Modal>
  );
};
