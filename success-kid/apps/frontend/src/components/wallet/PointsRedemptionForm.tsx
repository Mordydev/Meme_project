'use client';

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { TransactionReceipt } from './TransactionReceipt';
import { WalletErrorHandler } from './WalletErrorHandler';
import { apiClient } from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RedemptionStatus } from '@/types/wallet';
import { 
  Loader2, 
  RefreshCw, 
  Info, 
  AlertCircle, 
  ChevronRight, 
  ArrowRight,
  Lock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PointsRedemptionFormProps {
  className?: string;
  currentPoints?: number;
  onRedeemSuccess?: () => void;
  onRedeemError?: (error: string) => void;
  onClose?: () => void;
}

export function PointsRedemptionForm({
  className,
  currentPoints = 0,
  onRedeemSuccess,
  onRedeemError,
  onClose
}: PointsRedemptionFormProps) {
  const { wallet, isWalletReady, error: walletError } = useWalletContext();
  const { toast } = useToast();
  
  // Redemption state
  const [pointsAmount, setPointsAmount] = useState<number>(1000);
  const [tokenAmount, setTokenAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Conversion rate and limits
  const [conversionRate, setConversionRate] = useState<number>(100);
  const [conversionLimits, setConversionLimits] = useState({
    minimum: 1000,
    weekly: 10000,
    remaining: 10000
  });
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);
  
  // Transaction results
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionReceipt, setTransactionReceipt] = useState<any>(null);
  const [transactionTimestamp, setTransactionTimestamp] = useState<Date | null>(null);
  const [isCheckingTransaction, setIsCheckingTransaction] = useState<boolean>(false);
  
  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  
  // Success state
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  
  // Load conversion rates and limits
  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        setIsLoadingRates(true);
        const response = await apiClient.get('/api/v1/redemption/conversion-rate');
        const { conversionRate, pointsToToken, limits } = response.data.data;
        
        setConversionRate(conversionRate);
        setConversionLimits({
          minimum: limits.minimum,
          weekly: limits.weekly,
          remaining: limits.weekly // This would be modified by eligibility check
        });
        
        // Set initial redemption amount
        if (limits.minimum > 0) {
          setPointsAmount(limits.minimum);
          setTokenAmount(limits.minimum / conversionRate);
        }
      } catch (error) {
        console.error('Error fetching conversion rate:', error);
        setError('Unable to load conversion rates. Please try again later.');
        
        // Set default values
        setConversionRate(100);
        setConversionLimits({
          minimum: 1000,
          weekly: 10000,
          remaining: 10000
        });
      } finally {
        setIsLoadingRates(false);
      }
    };
    
    // Also check redemption eligibility
    const checkEligibility = async () => {
      if (!isWalletReady()) return;
      
      try {
        const eligibilityResponse = await apiClient.get('/api/v1/redemption/eligibility');
        const { eligible, reasons, limits } = eligibilityResponse.data.data;
        
        if (!eligible) {
          setError(reasons ? reasons.join('. ') : 'You are not eligible for redemption at this time.');
        }
        
        // Update remaining limits
        setConversionLimits(prevLimits => ({
          ...prevLimits,
          remaining: limits.weekly.remaining
        }));
      } catch (error) {
        console.error('Error checking eligibility:', error);
      }
    };
    
    fetchConversionRate();
    checkEligibility();
  }, []);
  
  // Update token amount when points amount changes
  useEffect(() => {
    setTokenAmount(pointsAmount / conversionRate);
  }, [pointsAmount, conversionRate]);
  
  // Handle points amount change
  const handlePointsChange = (value: number) => {
    // Ensure value is between minimum and maximum
    const clampedValue = Math.max(
      conversionLimits.minimum,
      Math.min(Math.min(conversionLimits.remaining, currentPoints), value)
    );
    
    // Ensure value is a multiple of 100
    const roundedValue = Math.floor(clampedValue / 100) * 100;
    
    setPointsAmount(roundedValue);
  };
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    handlePointsChange(value[0]);
  };
  
  // Handle redemption submission
  const handleRedeem = async () => {
    if (!isWalletReady() || !wallet) {
      setError('Please connect and verify your wallet first.');
      return;
    }
    
    if (pointsAmount < conversionLimits.minimum) {
      setError(`Minimum redemption amount is ${conversionLimits.minimum.toLocaleString()} points.`);
      return;
    }
    
    if (pointsAmount > conversionLimits.remaining) {
      setError(`You can only redeem up to ${conversionLimits.remaining.toLocaleString()} points this week.`);
      return;
    }
    
    if (pointsAmount > currentPoints) {
      setError(`You only have ${currentPoints.toLocaleString()} points available.`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Submit redemption request
      const response = await apiClient.post('/api/v1/redemption/redeem', {
        data: {
          pointsAmount,
          walletAddress: wallet.account.address
        }
      });
      
      const { id, status, transactionId, transactionHash } = response.data.data;
      
      setTransactionId(transactionId);
      setTransactionStatus(status);
      setTransactionHash(transactionHash || null);
      setTransactionTimestamp(new Date());
      
      // Check if already completed
      if (status === RedemptionStatus.COMPLETED && transactionHash) {
        handleRedemptionSuccess(id, transactionHash);
      } else {
        // Start polling for status updates
        pollTransactionStatus(id);
      }
      
      // Close confirmation dialog
      setShowConfirmDialog(false);
      
      toast({
        title: "Redemption Request Submitted",
        description: "Your points redemption request is being processed.",
      });
    } catch (error) {
      console.error('Error submitting redemption:', error);
      const errorMessage = error instanceof Error ? 
        error.message : 
        'An error occurred while processing your redemption request. Please try again.';
      
      setError(errorMessage);
      
      if (onRedeemError) {
        onRedeemError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Poll for transaction status updates
  const pollTransactionStatus = async (redemptionId: string) => {
    let pollCount = 0;
    const maxPolls = 30; // Max number of polls (5 minutes at 10-second intervals)
    const pollInterval = 10000; // 10 seconds
    
    const poll = async () => {
      if (pollCount >= maxPolls) {
        setError('Redemption is taking longer than expected. Please check your transaction history later.');
        return;
      }
      
      pollCount++;
      setIsCheckingTransaction(true);
      
      try {
        const response = await apiClient.get(`/api/v1/redemption/${redemptionId}`);
        const { status, transactionHash, receipt } = response.data.data;
        
        setTransactionStatus(status);
        
        if (transactionHash) {
          setTransactionHash(transactionHash);
        }
        
        if (receipt) {
          setTransactionReceipt(receipt);
        }
        
        // Check if completed or failed
        if (status === RedemptionStatus.COMPLETED && transactionHash) {
          handleRedemptionSuccess(redemptionId, transactionHash);
          return;
        } else if (status === RedemptionStatus.FAILED) {
          setError('Redemption failed. Please try again.');
          return;
        }
        
        // Continue polling if still processing
        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error('Error polling transaction status:', error);
        
        // Continue polling despite error
        setTimeout(poll, pollInterval);
      } finally {
        setIsCheckingTransaction(false);
      }
    };
    
    // Start polling
    poll();
  };
  
  // Handle successful redemption
  const handleRedemptionSuccess = (redemptionId: string, txHash: string) => {
    setIsSuccess(true);
    
    // Get the full transaction receipt if not already available
    if (!transactionReceipt) {
      apiClient.get(`/api/v1/redemption/${redemptionId}`)
        .then(response => {
          const { receipt } = response.data.data;
          if (receipt) {
            setTransactionReceipt(receipt);
          }
        })
        .catch(error => {
          console.error('Error fetching transaction receipt:', error);
        });
    }
    
    if (onRedeemSuccess) {
      onRedeemSuccess();
    }
    
    // Show success toast
    toast({
      title: "Redemption Successful",
      description: `${tokenAmount.toLocaleString()} SKC tokens have been sent to your wallet.`,
      variant: "default",
    });
  };
  
  // Reset form
  const handleReset = () => {
    setPointsAmount(conversionLimits.minimum);
    setError(null);
    setIsSuccess(false);
    setTransactionHash(null);
    setTransactionStatus(null);
    setTransactionId(null);
    setTransactionReceipt(null);
    setTransactionTimestamp(null);
  };
  
  // Handle close
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Render success state with transaction receipt
  if (isSuccess && transactionHash) {
    return (
      <div className={className}>
        <TransactionReceipt
          transactionHash={transactionHash}
          status="completed"
          pointsAmount={pointsAmount}
          tokenAmount={tokenAmount}
          timestamp={transactionTimestamp || new Date()}
          completedAt={new Date()}
          blockNumber={transactionReceipt?.blockNumber}
          confirmations={transactionReceipt?.confirmations}
          fee={transactionReceipt?.fee}
          onClose={handleClose}
        />
        
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline"
            onClick={handleReset}
          >
            Convert More Points
          </Button>
        </div>
      </div>
    );
  }
  
  // Render transaction processing state
  if (transactionStatus === RedemptionStatus.PENDING || 
      transactionStatus === RedemptionStatus.PROCESSING ||
      transactionStatus === RedemptionStatus.PENDING_CONFIRMATION) {
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Processing Redemption</span>
            {isCheckingTransaction && (
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
            )}
          </CardTitle>
          <CardDescription>
            Your points redemption is being processed
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="text-center mb-6">
            <div className="mb-4">
              <div className="size-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-1">
              Converting {pointsAmount.toLocaleString()} Points
            </h3>
            <p className="text-neutral-500">
              to {tokenAmount.toLocaleString()} SKC Tokens
            </p>
            
            <div className="mt-4 text-sm text-neutral-600">
              Current Status: <span className="font-medium">
                {transactionStatus === RedemptionStatus.PENDING && "Pending"}
                {transactionStatus === RedemptionStatus.PROCESSING && "Processing"}
                {transactionStatus === RedemptionStatus.PENDING_CONFIRMATION && "Awaiting Confirmation"}
              </span>
            </div>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-md w-full text-sm">
            <p className="mb-2">
              Transaction progress:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="bg-success rounded-full p-0.5 mr-2 mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span>Redemption request submitted</span>
              </li>
              
              <li className="flex items-start">
                {transactionStatus === RedemptionStatus.PENDING ? (
                  <div className="size-4 rounded-full border border-dashed border-neutral-300 mr-2 mt-0.5" />
                ) : (
                  <div className="bg-success rounded-full p-0.5 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <span>Points deducted from your account</span>
              </li>
              
              <li className="flex items-start">
                {(transactionStatus === RedemptionStatus.PENDING || 
                  transactionStatus === RedemptionStatus.PROCESSING) ? (
                  <div className="size-4 rounded-full border border-dashed border-neutral-300 mr-2 mt-0.5" />
                ) : (
                  <div className="bg-success rounded-full p-0.5 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <span>Token transaction created</span>
              </li>
              
              <li className="flex items-start">
                {transactionStatus !== RedemptionStatus.COMPLETED ? (
                  <div className="size-4 rounded-full border border-dashed border-neutral-300 mr-2 mt-0.5" />
                ) : (
                  <div className="bg-success rounded-full p-0.5 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <span>Tokens transferred to your wallet</span>
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-neutral-500 mt-4">
            This process typically takes 1-3 minutes to complete. 
            You'll be notified when your tokens are delivered.
          </p>
        </CardContent>
        
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Render redemption form
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Redeem Points for Tokens</CardTitle>
        <CardDescription>
          Convert your Success Points to SKC tokens
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {(error || walletError) && (
          <WalletErrorHandler 
            compact 
            className="mb-4"
          />
        )}
        
        <div className="space-y-4">
          {/* Points Balance */}
          <div className="bg-neutral-50 p-3 rounded-md flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-neutral-600">Available Points</span>
              <div className="font-medium">
                {currentPoints.toLocaleString()} Points
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-neutral-600">Weekly Limit</span>
              <div className="font-medium">
                {conversionLimits.remaining.toLocaleString()} Points
              </div>
            </div>
          </div>
          
          {/* Points Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="pointsAmount">Redemption Amount</Label>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Info className="h-4 w-4 text-neutral-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-80">
                      Minimum redemption: {conversionLimits.minimum.toLocaleString()} points<br/>
                      Weekly limit: {conversionLimits.weekly.toLocaleString()} points<br/>
                      Conversion rate: {conversionRate} points = 1 SKC
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                id="pointsAmount"
                type="number"
                value={pointsAmount}
                onChange={e => handlePointsChange(parseInt(e.target.value) || 0)}
                min={conversionLimits.minimum}
                max={Math.min(conversionLimits.remaining, currentPoints)}
                step={100}
                className="flex-1"
                disabled={isLoadingRates || isSubmitting}
              />
              <div className="text-sm font-medium">Points</div>
            </div>
            
            <Slider
              value={[pointsAmount]}
              onValueChange={handleSliderChange}
              min={conversionLimits.minimum}
              max={Math.min(conversionLimits.remaining, currentPoints)}
              step={100}
              disabled={isLoadingRates || isSubmitting}
            />
            
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{conversionLimits.minimum.toLocaleString()}</span>
              <span>{Math.min(conversionLimits.remaining, currentPoints).toLocaleString()}</span>
            </div>
          </div>
          
          {/* Conversion Preview */}
          <div>
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-600">You'll Receive</div>
              <div className="font-mono text-lg font-semibold">
                {tokenAmount.toLocaleString()} SKC
              </div>
            </div>
            
            <div className="flex justify-center my-4">
              <div className="flex items-center text-sm text-neutral-500">
                <div className="bg-neutral-100 rounded-l-md px-3 py-1">
                  {pointsAmount.toLocaleString()} Points
                </div>
                <div className="px-2">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="bg-neutral-100 rounded-r-md px-3 py-1">
                  {tokenAmount.toLocaleString()} SKC
                </div>
              </div>
            </div>
            
            <p className="text-xs text-center text-neutral-500">
              Conversion Rate: {conversionRate} Points = 1 SKC Token
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogTrigger asChild>
            <Button
              disabled={
                !isWalletReady() || 
                isSubmitting || 
                isLoadingRates || 
                pointsAmount < conversionLimits.minimum ||
                pointsAmount > Math.min(conversionLimits.remaining, currentPoints)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Redeem Points
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Redemption</DialogTitle>
              <DialogDescription>
                Please review your redemption details before proceeding.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-neutral-50 p-4 rounded-md mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-600">Amount to Redeem:</span>
                  <span className="font-medium">{pointsAmount.toLocaleString()} Points</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-600">You'll Receive:</span>
                  <span className="font-medium">{tokenAmount.toLocaleString()} SKC</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-neutral-600">Destination Wallet:</span>
                  <span className="font-mono text-sm">{wallet ? wallet.account.address.substring(0, 4) + '...' + wallet.account.address.substring(wallet.account.address.length - 4) : 'N/A'}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm bg-amber-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Important Note</p>
                  <p className="text-amber-700">
                    This action cannot be undone. Redeemed points will be permanently converted to SKC tokens 
                    in your connected wallet.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleRedeem} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Redemption
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
