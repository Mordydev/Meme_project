'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EnhancedWalletConnector } from '@/components/features/wallet/EnhancedWalletConnector';
import { Spinner } from '@/components/ui/Spinner';
import { useWallet } from '@/hooks/useWallet';
import { useRedemptionData } from '@/hooks/useRedemptionData';
import { usePoints } from '@/hooks/usePoints';
import { motion, AnimatePresence } from 'framer-motion';
import { getExplorerUrl } from '@/lib/wallet-utils';
import confetti from 'canvas-confetti';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Steps in the redemption flow
const STEPS = {
  CHECK_WALLET: 'check_wallet',
  AMOUNT_SELECTION: 'amount_selection',
  CONFIRMATION: 'confirmation',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Conversion rate and limits
const POINTS_TO_TOKEN_RATIO = 100; // 100 points = 1 token
const MIN_REDEMPTION = 1000; // Minimum 1000 points (10 tokens)
const MAX_WEEKLY_REDEMPTION = 10000; // Maximum 10000 points (100 tokens) per week

interface PointsRedemptionFlowProps {
  className?: string;
}

export function PointsRedemptionFlow({ className = '' }: PointsRedemptionFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallet } = useWallet();
  const { pointsBalance, fetchBalance } = usePoints();
  const { redeem, redeemStatus, redemptionHistory, weeklyRedemptionTotal, fetchWeeklyTotal } = useRedemptionData();
  const prefersReducedMotion = useReducedMotion();
  
  // Initial setup - get amount from URL if provided
  const initialAmount = searchParams?.get('amount') ? 
    parseInt(searchParams.get('amount') as string, 10) : 
    MIN_REDEMPTION;
  
  // State for the flow
  const [currentStep, setCurrentStep] = useState(STEPS.CHECK_WALLET);
  const [amount, setAmount] = useState(initialAmount);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate token amount and remaining weekly allowance
  const tokenAmount = amount / POINTS_TO_TOKEN_RATIO;
  const remainingWeeklyAllowance = MAX_WEEKLY_REDEMPTION - weeklyRedemptionTotal;
  
  // Check wallet status on first render and when wallet changes
  useEffect(() => {
    if (wallet?.isConnected) {
      // Wallet is connected, proceed
      setCurrentStep(STEPS.AMOUNT_SELECTION);
      
      // Fetch latest points balance and weekly redemption total
      fetchBalance();
      fetchWeeklyTotal();
    } else {
      // No wallet connected, stay on check wallet step
      setCurrentStep(STEPS.CHECK_WALLET);
    }
  }, [wallet?.isConnected, fetchBalance, fetchWeeklyTotal]);
  
  // Watch redemption status for changes
  useEffect(() => {
    switch (redeemStatus) {
      case 'processing':
        setCurrentStep(STEPS.PROCESSING);
        break;
      case 'success':
        setCurrentStep(STEPS.SUCCESS);
        
        // Trigger celebration if no reduced motion preference
        if (!prefersReducedMotion) {
          setTimeout(triggerCelebration, 500);
        }
        
        // Update points balance
        fetchBalance();
        break;
      case 'error':
        setCurrentStep(STEPS.ERROR);
        break;
    }
  }, [redeemStatus, fetchBalance, prefersReducedMotion]);
  
  // Validate amount for redemption
  const validateAmount = () => {
    // Reset error
    setError(null);
    
    // Check minimum
    if (amount < MIN_REDEMPTION) {
      setError(`Minimum redemption amount is ${MIN_REDEMPTION} points (${MIN_REDEMPTION / POINTS_TO_TOKEN_RATIO} tokens)`);
      return false;
    }
    
    // Check divisibility
    if (amount % POINTS_TO_TOKEN_RATIO !== 0) {
      setError(`Amount must be divisible by ${POINTS_TO_TOKEN_RATIO} points`);
      return false;
    }
    
    // Check balance
    if (amount > pointsBalance) {
      setError(`Insufficient points balance. You have ${pointsBalance} points available.`);
      return false;
    }
    
    // Check weekly limit
    if (amount > remainingWeeklyAllowance) {
      setError(`Exceeds weekly redemption limit. You can redeem up to ${remainingWeeklyAllowance} more points this week.`);
      return false;
    }
    
    return true;
  };
  
  // Trigger confetti celebration
  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    
    (function frame() {
      // Launch a few confetti from the left and right
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors: ['#1E88E5', '#FFC107', '#4CAF50']
      });
      
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors: ['#1E88E5', '#FFC107', '#4CAF50']
      });
      
      // Keep launching until duration is up
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };
  
  // Handle next step in the flow
  const handleNext = () => {
    switch (currentStep) {
      case STEPS.AMOUNT_SELECTION:
        if (validateAmount()) {
          setCurrentStep(STEPS.CONFIRMATION);
        }
        break;
      case STEPS.CONFIRMATION:
        handleRedeem();
        break;
    }
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseInt(e.target.value, 10) || 0;
    setAmount(newAmount);
  };
  
  // Handle redemption
  const handleRedeem = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Do one final validation
      if (!validateAmount()) {
        setIsLoading(false);
        return;
      }
      
      // Process redemption
      const result = await redeem(amount);
      
      // Update transaction hash if returned
      if (result && result.transactionHash) {
        setTransactionHash(result.transactionHash);
      }
      
      // Move to processing step (status changes will trigger next steps)
      setCurrentStep(STEPS.PROCESSING);
    } catch (error) {
      setError(error.message || "Failed to process redemption");
      setCurrentStep(STEPS.ERROR);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle retry after error
  const handleRetry = () => {
    setError(null);
    setCurrentStep(STEPS.AMOUNT_SELECTION);
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.CHECK_WALLET:
        return (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="text-neutral-400 text-6xl">👛</div>
            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
              <p className="text-neutral-600 mb-4">
                You need to connect your wallet to redeem points for tokens. This allows us to send tokens directly to your wallet.
              </p>
              <EnhancedWalletConnector />
            </div>
          </div>
        );
        
      case STEPS.AMOUNT_SELECTION:
        return (
          <div className="space-y-6">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>Your Balance</span>
                <span>{pointsBalance.toLocaleString()} Points</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Weekly Redemption Remaining</span>
                <span>{remainingWeeklyAllowance.toLocaleString()} Points</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="points-amount" className="block text-sm font-medium mb-1">
                  Redemption Amount (Points)
                </label>
                <Input
                  id="points-amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  min={MIN_REDEMPTION}
                  step={POINTS_TO_TOKEN_RATIO}
                  max={Math.min(pointsBalance, remainingWeeklyAllowance)}
                  className="text-lg"
                />
                <p className="text-sm text-neutral-500 mt-1">
                  Minimum: {MIN_REDEMPTION.toLocaleString()} points ({MIN_REDEMPTION / POINTS_TO_TOKEN_RATIO} tokens)
                </p>
              </div>
              
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">You will receive:</h4>
                <div className="text-2xl font-bold text-primary">
                  {tokenAmount.toLocaleString()} SKC Tokens
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Conversion rate: {POINTS_TO_TOKEN_RATIO} Points = 1 SKC Token
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={handleNext}
                disabled={!amount || amount < MIN_REDEMPTION || isLoading}
              >
                Continue to Review
              </Button>
            </div>
          </div>
        );
        
      case STEPS.CONFIRMATION:
        return (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium mb-1">Transaction Details</h4>
              
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral-600">Points to Redeem</span>
                <span className="font-medium">{amount.toLocaleString()} Points</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral-600">Tokens to Receive</span>
                <span className="font-medium">{tokenAmount.toLocaleString()} SKC</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-neutral-600">Receiving Wallet</span>
                <span className="font-medium">{wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}</span>
              </div>
            </div>
            
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>
                This action cannot be undone. Points will be deducted from your account and tokens will be sent to your connected wallet.
              </AlertDescription>
            </Alert>
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="pt-2 flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setCurrentStep(STEPS.AMOUNT_SELECTION)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleNext}
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Confirm Redemption
              </Button>
            </div>
          </div>
        );
        
      case STEPS.PROCESSING:
        return (
          <div className="flex flex-col items-center py-8 space-y-6">
            <Spinner className="h-12 w-12 text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Processing Your Redemption</h3>
              <p className="text-neutral-600">
                Please wait while we process your request. This may take a few moments.
              </p>
              <div className="pt-4 flex items-center justify-center space-x-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-ping"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-ping animation-delay-200"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-ping animation-delay-400"></div>
              </div>
            </div>
          </div>
        );
        
      case STEPS.SUCCESS:
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="bg-success-100 text-success-700 h-16 w-16 rounded-full flex items-center justify-center"
            >
              <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Redemption Successful!</h3>
              <p className="text-neutral-600">
                Your points have been redeemed successfully. The tokens have been sent to your wallet.
              </p>
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg w-full">
              <h4 className="font-medium mb-3">Transaction Summary</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Points Redeemed</span>
                  <span className="font-medium">{amount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tokens Received</span>
                  <span className="font-medium">{tokenAmount.toLocaleString()} SKC</span>
                </div>
                
                {transactionHash && (
                  <div className="pt-2">
                    <a
                      href={getExplorerUrl(transactionHash, 'transaction')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      View Transaction
                      <svg className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4 w-full flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => {
                  setAmount(MIN_REDEMPTION);
                  setCurrentStep(STEPS.AMOUNT_SELECTION);
                }}
              >
                Redeem More Points
              </Button>
            </div>
          </div>
        );
        
      case STEPS.ERROR:
        return (
          <div className="flex flex-col items-center py-6 space-y-6">
            <div className="bg-red-100 text-red-700 h-16 w-16 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Redemption Failed</h3>
              <p className="text-neutral-600">
                We encountered an error while processing your redemption request.
              </p>
            </div>
            
            <Alert variant="destructive">
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>{error || "Unknown error occurred"}</AlertDescription>
            </Alert>
            
            <div className="pt-4 w-full">
              <Button 
                className="w-full" 
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Redeem Points for Tokens</CardTitle>
        <CardDescription>
          Convert your Success Points to SKC tokens at a rate of {POINTS_TO_TOKEN_RATIO} points = 1 token
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
