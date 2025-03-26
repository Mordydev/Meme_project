'use client';

import React, { useState, useEffect } from 'react';
import { usePointsStore } from '@/store/usePointsStore';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { ConnectWalletButton } from '@/components/wallet/modal/ConnectWalletButton';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EligibilityCheck } from './steps/EligibilityCheck';
import { AmountSelection } from './steps/AmountSelection';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { SuccessStep } from './steps/SuccessStep';
import { apiClient } from '@/lib/api-client';

type RedemptionStep = 'eligibility' | 'amount' | 'confirmation' | 'processing' | 'success';

export interface RedemptionWizardProps {
  className?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function RedemptionWizard({ className, onSuccess, onClose }: RedemptionWizardProps) {
  // State
  const [currentStep, setCurrentStep] = useState<RedemptionStep>('eligibility');
  const [pointsAmount, setPointsAmount] = useState<number>(1000);
  const [tokenAmount, setTokenAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [requirements, setRequirements] = useState({
    minimumBalance: 1000,
    walletConnected: false,
    verificationComplete: false
  });
  const [limits, setLimits] = useState({
    conversionRate: 100,
    minimumAmount: 1000,
    weeklyLimit: 10000,
    weeklyUsed: 0,
    resetsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  // Transaction data
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
  
  // Get points balance and wallet state
  const { balance: pointsBalance } = usePointsStore();
  const { wallet, isWalletReady } = useWalletContext();
  
  // Load eligibility and limits data
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get redemption eligibility
        const response = await apiClient.get('/api/v1/redemption/eligibility');
        const { eligible, requirements, limits } = response.data.data;
        
        setIsEligible(eligible);
        setRequirements(requirements);
        setLimits(limits);
        
        // Set initial amount to minimum (if eligible)
        if (eligible && limits.minimumAmount > 0) {
          setPointsAmount(limits.minimumAmount);
          setTokenAmount(limits.minimumAmount / limits.conversionRate);
        }
      } catch (error) {
        console.error('Error fetching eligibility:', error);
        setError('Unable to check eligibility. Please try again later.');
        setIsEligible(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEligibility();
  }, []);
  
  // Update token amount when points amount changes
  useEffect(() => {
    setTokenAmount(pointsAmount / limits.conversionRate);
  }, [pointsAmount, limits.conversionRate]);
  
  // Update wallet requirement when wallet state changes
  useEffect(() => {
    setRequirements(prev => ({
      ...prev,
      walletConnected: !!wallet?.isConnected,
      verificationComplete: !!wallet?.isVerified
    }));
  }, [wallet]);
  
  // Handle amount change
  const handleAmountChange = (amount: number) => {
    setPointsAmount(amount);
  };
  
  // Handle next step navigation
  const handleNext = () => {
    switch (currentStep) {
      case 'eligibility':
        setCurrentStep('amount');
        break;
      case 'amount':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        setCurrentStep('processing');
        handleRedemption();
        break;
      case 'processing':
        // This is auto-advanced when processing completes
        break;
      case 'success':
        if (onSuccess) onSuccess();
        break;
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    switch (currentStep) {
      case 'amount':
        setCurrentStep('eligibility');
        break;
      case 'confirmation':
        setCurrentStep('amount');
        break;
      case 'processing':
      case 'success':
        // No going back from these states
        break;
    }
  };
  
  // Handle close
  const handleClose = () => {
    if (onClose) onClose();
  };
  
  // Process redemption
  const handleRedemption = async () => {
    if (!isWalletReady() || !wallet) {
      setError('Wallet not connected or verified');
      setCurrentStep('eligibility');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Submit redemption request
      const response = await apiClient.post('/api/v1/redemption/redeem', {
        data: {
          pointsAmount,
          walletAddress: wallet.account.address
        }
      });
      
      const { id, status, transactionId, transactionHash } = response.data.data;
      
      setTransactionId(id);
      setTransactionStatus(status);
      setTransactionHash(transactionHash || null);
      
      // Check if already completed
      if (status === 'completed' && transactionHash) {
        setCurrentStep('success');
      } else {
        // Start polling for status updates
        pollTransactionStatus(id);
      }
    } catch (error) {
      console.error('Redemption error:', error);
      setError('Error processing redemption. Please try again.');
      setCurrentStep('confirmation');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Poll for transaction status
  const pollTransactionStatus = async (redemptionId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Try for up to 5 minutes
    const pollInterval = 10000; // 10 seconds between attempts
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setError('Redemption is taking longer than expected. Please check your transaction history later.');
        return;
      }
      
      attempts++;
      
      try {
        const response = await apiClient.get(`/api/v1/redemption/${redemptionId}`);
        const { status, transactionHash } = response.data.data;
        
        setTransactionStatus(status);
        
        if (transactionHash) {
          setTransactionHash(transactionHash);
        }
        
        // Check if completed or failed
        if (status === 'completed' && transactionHash) {
          setCurrentStep('success');
          return;
        } else if (status === 'failed') {
          setError('Redemption failed. Please try again.');
          setCurrentStep('confirmation');
          return;
        }
        
        // Continue polling if still processing
        setTimeout(checkStatus, pollInterval);
      } catch (error) {
        console.error('Error checking transaction status:', error);
        
        // Continue polling despite error
        setTimeout(checkStatus, pollInterval);
      }
    };
    
    // Start polling
    checkStatus();
  };
  
  // Render appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'eligibility':
        return (
          <EligibilityCheck
            isEligible={isEligible}
            requirements={requirements}
            pointsBalance={pointsBalance}
            isLoading={isLoading}
            error={error}
          />
        );
      case 'amount':
        return (
          <AmountSelection
            pointsAmount={pointsAmount}
            tokenAmount={tokenAmount}
            conversionRate={limits.conversionRate}
            minimumAmount={limits.minimumAmount}
            maximumAmount={Math.min(
              pointsBalance, 
              limits.weeklyLimit - limits.weeklyUsed
            )}
            onChange={handleAmountChange}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationStep
            pointsAmount={pointsAmount}
            tokenAmount={tokenAmount}
            wallet={wallet}
            conversionRate={limits.conversionRate}
          />
        );
      case 'processing':
        return (
          <ProcessingStep
            pointsAmount={pointsAmount}
            tokenAmount={tokenAmount}
            status={transactionStatus || 'processing'}
            error={error}
          />
        );
      case 'success':
        return (
          <SuccessStep
            pointsAmount={pointsAmount}
            tokenAmount={tokenAmount}
            transactionHash={transactionHash}
          />
        );
    }
  };
  
  // Determine if next button should be enabled
  const isNextEnabled = () => {
    switch (currentStep) {
      case 'eligibility':
        return isEligible;
      case 'amount':
        return pointsAmount >= limits.minimumAmount && 
               pointsAmount <= Math.min(pointsBalance, limits.weeklyLimit - limits.weeklyUsed);
      case 'confirmation':
        return true;
      case 'processing':
        return false;
      case 'success':
        return true;
    }
  };
  
  // Determine next button text
  const getNextButtonText = () => {
    switch (currentStep) {
      case 'eligibility':
        return 'Select Amount';
      case 'amount':
        return 'Review & Confirm';
      case 'confirmation':
        return 'Redeem Points';
      case 'success':
        return 'Done';
    }
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'eligibility', label: 'Eligibility' },
      { id: 'amount', label: 'Amount' },
      { id: 'confirmation', label: 'Confirmation' },
      { id: 'success', label: 'Complete' },
    ];
    
    return (
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const isProcessing = currentStep === 'processing' && step.id === 'success';
          
          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {index > 0 && (
                <div className="flex-1 flex items-center mx-2">
                  <div 
                    className={cn(
                      "h-0.5 flex-1",
                      isCompleted ? "bg-primary" : "bg-neutral-200"
                    )}
                  />
                </div>
              )}
              
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                    isActive ? "border-primary bg-primary text-white" : 
                    isCompleted ? "border-primary bg-primary text-white" : 
                    isProcessing ? "border-primary bg-white text-primary animate-pulse" :
                    "border-neutral-200 bg-white text-neutral-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <span 
                  className={cn(
                    "mt-1 text-xs",
                    isActive || isCompleted || isProcessing ? "text-primary font-medium" : "text-neutral-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Redeem Points for Tokens</CardTitle>
        <CardDescription>Convert your Success Points to SKC tokens</CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderStepIndicator()}
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        {currentStep !== 'eligibility' && currentStep !== 'processing' && currentStep !== 'success' ? (
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        
        {currentStep !== 'processing' && (
          <Button
            onClick={handleNext}
            disabled={isLoading || !isNextEnabled()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {getNextButtonText()}
                {currentStep !== 'success' && <ArrowRight className="ml-2 h-4 w-4" />}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
