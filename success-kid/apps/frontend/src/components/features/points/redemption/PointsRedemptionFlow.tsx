'use client';

import React, { useState, useEffect } from 'react';
import { EligibilityChecker } from './EligibilityChecker';
import { ConversionCalculator } from './ConversionCalculator';
import { RedemptionConfirmation, RedemptionData } from './RedemptionConfirmation';
import { TransactionStatus } from './TransactionStatus';
import { useRedemptionEligibility } from '@/hooks/usePointsData';
import { useWallet } from '@/hooks/useWallet';
import { apiClient } from '@/lib/api-client';

export interface PointsRedemptionFlowProps {
  userId: string;
  onComplete?: (transactionId: string) => void;
  className?: string;
}

type FlowStep = 'eligibility' | 'conversion' | 'confirmation' | 'status';

export const PointsRedemptionFlow: React.FC<PointsRedemptionFlowProps> = ({
  userId,
  onComplete,
  className,
}) => {
  const { data: eligibilityData, isLoading: isEligibilityLoading } = useRedemptionEligibility(userId);
  const { wallet } = useWallet();
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('eligibility');
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update token amount when points amount changes
  useEffect(() => {
    if (eligibilityData) {
      setTokenAmount(pointsAmount / eligibilityData.conversionRate);
    }
  }, [pointsAmount, eligibilityData]);

  // Handle eligibility status change
  const handleEligibilityChange = (eligible: boolean) => {
    setIsEligible(eligible);
  };

  // Handle continue to conversion step
  const handleContinueToConversion = () => {
    setCurrentStep('conversion');
  };

  // Handle amount change in converter
  const handleAmountChange = (amount: number) => {
    setPointsAmount(amount);
  };

  // Handle continue to confirmation step
  const handleContinueToConfirmation = () => {
    setShowConfirmation(true);
  };

  // Handle redemption confirmation
  const handleConfirmRedemption = async () => {
    try {
      // This would be a real API call in production
      // const response = await apiClient.post('/api/v1/redemption/transactions', {
      //   data: {
      //     pointsAmount,
      //     recipientAddress: wallet?.address,
      //   }
      // });
      
      // Simulate API call with timeout and mock response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response data
      const mockTransactionId = `tx_${Date.now().toString(36)}`;
      
      // Update state
      setTransactionId(mockTransactionId);
      setCurrentStep('status');
      setShowConfirmation(false);
      
      return Promise.resolve();
    } catch (err) {
      console.error('Redemption error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during redemption');
      return Promise.reject(err);
    }
  };

  // Handle transaction completion
  const handleTransactionComplete = (txId: string) => {
    if (onComplete) {
      onComplete(txId);
    }
  };

  // Prepare redemption data for confirmation
  const getRedemptionData = (): RedemptionData => {
    return {
      pointsAmount,
      tokenAmount,
      walletAddress: wallet?.address || '',
    };
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'eligibility':
        return (
          <EligibilityChecker
            userId={userId}
            onStatusChange={handleEligibilityChange}
            onContinue={isEligible ? handleContinueToConversion : undefined}
            className={className}
          />
        );
      
      case 'conversion':
        if (!eligibilityData) return null;
        
        return (
          <ConversionCalculator
            pointsBalance={eligibilityData.pointsBalance}
            conversionRate={eligibilityData.conversionRate}
            minRedemption={eligibilityData.limits.minimumAmount}
            maxRedemption={Math.min(
              eligibilityData.pointsBalance,
              eligibilityData.limits.maximumAmount,
              eligibilityData.limits.remainingWeeklyLimit
            )}
            onAmountChange={handleAmountChange}
            onSubmit={handleContinueToConfirmation}
            className={className}
          />
        );
      
      case 'status':
        if (!transactionId) return null;
        
        return (
          <TransactionStatus
            transactionId={transactionId}
            onStatusChange={(status) => {
              if (status === 'completed') {
                handleTransactionComplete(transactionId);
              }
            }}
            autoRefresh={true}
            className={className}
          />
        );
      
      default:
        return null;
    }
  };

  // Show loading state while eligibility data is loading
  if (isEligibilityLoading && currentStep === 'eligibility') {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600">Loading redemption options...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-alert-100 text-alert-600 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Redemption Error</h3>
          <p className="text-neutral-600 max-w-sm mx-auto mb-4 text-center">
            {error}
          </p>
          
          <button
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => {
              setError(null);
              setCurrentStep('eligibility');
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderStepContent()}
      
      {showConfirmation && (
        <RedemptionConfirmation
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          redemptionData={getRedemptionData()}
          onConfirm={handleConfirmRedemption}
          onSuccess={(txId) => {
            setTransactionId(txId);
            setCurrentStep('status');
          }}
        />
      )}
    </>
  );
};
