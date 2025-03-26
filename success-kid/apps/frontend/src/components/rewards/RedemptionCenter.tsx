'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle,
  ArrowRight, 
  Check, 
  ExternalLink, 
  HelpCircle, 
  Info, 
  Wallet 
} from 'lucide-react';
import { usePointsStore } from '@/store/usePointsStore';
import { useWallet } from '@/hooks/useWallet';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import CoinIcon from '@/components/ui/icons/CoinIcon';

interface RedemptionCenterProps {
  balance: number;
  isLoading: boolean;
}

export function RedemptionCenter({ balance, isLoading }: RedemptionCenterProps) {
  const { redemption, redemptionHistory, fetchRedemptionEligibility, fetchRedemptionHistory, redeemPoints } = usePointsStore();
  const { isConnected, connect, address } = useWallet();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
  // Redemption state
  const [amount, setAmount] = useState(1000);
  const [step, setStep] = useState<'eligibility' | 'amount' | 'confirmation' | 'processing' | 'success'>('eligibility');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // Load redemption eligibility and history
  useEffect(() => {
    fetchRedemptionEligibility();
    fetchRedemptionHistory();
  }, [fetchRedemptionEligibility, fetchRedemptionHistory]);
  
  // Default redemption requirements if not loaded
  const requirements = redemption?.requirements || {
    minimumBalance: 1000,
    walletConnected: true,
    verificationComplete: true
  };
  
  // Default redemption limits if not loaded
  const limits = redemption?.limits || {
    conversionRate: 100,
    minimumAmount: 1000,
    weeklyLimit: 10000,
    weeklyUsed: 0,
    resetsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  // Calculate token amount based on points
  const calculateTokenAmount = (pointsAmount: number) => {
    return pointsAmount / limits.conversionRate;
  };
  
  // Check if user is eligible for redemption
  const isEligible = () => {
    if (!redemption) return false;
    
    return (
      balance >= requirements.minimumBalance &&
      isConnected &&
      requirements.verificationComplete
    );
  };
  
  // Handler for redemption process
  const handleRedeem = async () => {
    if (step === 'eligibility') {
      // Move to amount selection if eligible
      if (isEligible()) {
        setStep('amount');
      } else {
        // Connect wallet if not connected
        if (!isConnected) {
          await connect();
        }
      }
    } else if (step === 'amount') {
      // Validate amount
      if (amount < limits.minimumAmount) {
        toast({
          title: "Invalid amount",
          description: `The minimum redemption amount is ${limits.minimumAmount} SP.`,
          variant: "destructive"
        });
        return;
      }
      
      if (amount > balance) {
        toast({
          title: "Insufficient balance",
          description: "You don't have enough Success Points for this redemption.",
          variant: "destructive"
        });
        return;
      }
      
      if (amount > limits.weeklyLimit - limits.weeklyUsed) {
        toast({
          title: "Weekly limit exceeded",
          description: `You can only redeem ${limits.weeklyLimit - limits.weeklyUsed} more SP this week.`,
          variant: "destructive"
        });
        return;
      }
      
      setStep('confirmation');
    } else if (step === 'confirmation') {
      setStep('processing');
      setIsRedeeming(true);
      
      try {
        // Process redemption
        const result = await redeemPoints(amount);
        
        if (result.success) {
          setTimeout(() => {
            setStep('success');
            setIsRedeeming(false);
          }, 2000);
        } else {
          toast({
            title: "Redemption failed",
            description: "There was an error processing your redemption. Please try again.",
            variant: "destructive"
          });
          setStep('amount');
          setIsRedeeming(false);
        }
      } catch (error) {
        toast({
          title: "Redemption failed",
          description: "There was an error processing your redemption. Please try again.",
          variant: "destructive"
        });
        setStep('amount');
        setIsRedeeming(false);
      }
    } else if (step === 'success') {
      // Reset and start over
      setStep('eligibility');
      setAmount(1000);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Redemption Flow */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Points Redemption</CardTitle>
              <CardDescription>Convert your Success Points to SKC tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <motion.div 
                  className="space-y-6"
                  variants={prefersReducedMotion ? {} : containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {step === 'eligibility' && (
                    <motion.div 
                      className="space-y-6"
                      variants={prefersReducedMotion ? {} : itemVariants}
                    >
                      <div className="rounded-lg border border-neutral-200 overflow-hidden">
                        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                          <h3 className="font-semibold">Redemption Requirements</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${balance >= requirements.minimumBalance ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                {balance >= requirements.minimumBalance ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4" />
                                )}
                              </div>
                              <span>Minimum Balance (1,000 SP)</span>
                            </div>
                            <span className={`font-mono ${balance >= requirements.minimumBalance ? 'text-green-600' : 'text-neutral-500'}`}>
                              {balance.toLocaleString()} SP
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${isConnected ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                {isConnected ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4" />
                                )}
                              </div>
                              <span>Wallet Connected</span>
                            </div>
                            <span className={isConnected ? 'text-green-600' : 'text-neutral-500'}>
                              {isConnected ? 'Connected' : 'Required'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-full ${requirements.verificationComplete ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                {requirements.verificationComplete ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4" />
                                )}
                              </div>
                              <span>Account Verification</span>
                            </div>
                            <span className={requirements.verificationComplete ? 'text-green-600' : 'text-neutral-500'}>
                              {requirements.verificationComplete ? 'Verified' : 'Required'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-neutral-500">
                          {isEligible() ? 'You meet all requirements for redemption' : 'Complete all requirements to proceed'}
                        </div>
                        <Button 
                          onClick={handleRedeem}
                          disabled={!isEligible() && isConnected}
                        >
                          {isConnected ? 'Continue' : 'Connect Wallet'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {step === 'amount' && (
                    <motion.div 
                      className="space-y-6"
                      variants={prefersReducedMotion ? {} : itemVariants}
                    >
                      <div className="rounded-lg border border-neutral-200 overflow-hidden">
                        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Select Redemption Amount</h3>
                            <span className="text-sm text-neutral-500">{balance.toLocaleString()} SP Available</span>
                          </div>
                        </div>
                        <div className="p-6 space-y-8">
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-4xl font-bold font-mono text-primary">
                              {amount.toLocaleString()} SP
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-neutral-500">
                              <ArrowRight className="h-4 w-4" />
                              <div className="text-xl font-bold font-mono">
                                {calculateTokenAmount(amount).toLocaleString()} SKC
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <input
                              type="range"
                              min={limits.minimumAmount}
                              max={Math.min(balance, limits.weeklyLimit - limits.weeklyUsed)}
                              step={100}
                              value={amount}
                              onChange={(e) => setAmount(parseInt(e.target.value))}
                              className="w-full accent-primary"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 mt-1">
                              <span>Min: {limits.minimumAmount} SP</span>
                              <span>Max: {Math.min(balance, limits.weeklyLimit - limits.weeklyUsed).toLocaleString()} SP</span>
                            </div>
                          </div>
                          
                          <div className="bg-neutral-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span>Points to Redeem</span>
                              <span className="font-mono font-medium">{amount.toLocaleString()} SP</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span>Conversion Rate</span>
                              <span className="font-mono">{limits.conversionRate} SP = 1 SKC</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span>Tokens to Receive</span>
                              <span className="font-mono font-medium">{calculateTokenAmount(amount).toLocaleString()} SKC</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline"
                          onClick={() => setStep('eligibility')}
                        >
                          Back
                        </Button>
                        <Button 
                          onClick={handleRedeem}
                          disabled={amount < limits.minimumAmount || amount > balance || amount > limits.weeklyLimit - limits.weeklyUsed}
                        >
                          Continue to Confirmation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {step === 'confirmation' && (
                    <motion.div 
                      className="space-y-6"
                      variants={prefersReducedMotion ? {} : itemVariants}
                    >
                      <div className="rounded-lg border border-neutral-200 overflow-hidden">
                        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                          <h3 className="font-semibold">Confirm Your Redemption</h3>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="bg-neutral-50 p-4 rounded-lg space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">From</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{amount.toLocaleString()} SP</span>
                                <div className="h-6 w-6 rounded-full bg-primary-50 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">SP</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-center">
                              <ArrowRight className="h-5 w-5 text-neutral-400" />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="font-medium">To</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{calculateTokenAmount(amount).toLocaleString()} SKC</span>
                                <div className="h-6 w-6 rounded-full bg-secondary-50 flex items-center justify-center">
                                  <CoinIcon className="h-4 w-4 text-secondary" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border border-neutral-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                              <div className="space-y-2">
                                <h4 className="font-medium">Important Information</h4>
                                <ul className="text-sm text-neutral-600 space-y-1">
                                  <li>• Redemptions are processed in weekly batches</li>
                                  <li>• Tokens will be sent to your connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</li>
                                  <li>• This transaction cannot be reversed once confirmed</li>
                                  <li>• No transaction fees will be charged for redemption</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="terms-agreement" 
                              className="h-4 w-4 border-neutral-300 rounded accent-primary"
                            />
                            <label htmlFor="terms-agreement" className="ml-2 text-sm text-neutral-600">
                              I understand and agree to the redemption terms
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline"
                          onClick={() => setStep('amount')}
                        >
                          Back
                        </Button>
                        <Button 
                          onClick={handleRedeem}
                        >
                          Confirm Redemption
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {step === 'processing' && (
                    <motion.div 
                      className="flex flex-col items-center justify-center py-12 space-y-6"
                      variants={prefersReducedMotion ? {} : itemVariants}
                    >
                      <div className="relative h-24 w-24">
                        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-neutral-100 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CoinIcon className="h-12 w-12 text-primary-200" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-semibold">Processing Your Redemption</h3>
                        <p className="text-neutral-500 mt-2">Please wait while we process your request...</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {step === 'success' && (
                    <motion.div 
                      className="flex flex-col items-center justify-center py-12 space-y-6"
                      variants={prefersReducedMotion ? {} : itemVariants}
                    >
                      <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-12 w-12 text-green-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-semibold">Redemption Successful!</h3>
                        <p className="text-neutral-500 mt-2">Your redemption has been submitted for processing</p>
                        <div className="mt-6 bg-neutral-50 rounded-lg p-4 inline-block">
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-mono font-medium text-2xl">{calculateTokenAmount(amount).toLocaleString()} SKC</span>
                            <span className="text-sm text-neutral-500">will be sent to your wallet</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </CardContent>
            {step === 'success' && (
              <CardFooter className="justify-center">
                <Button onClick={() => setStep('eligibility')}>
                  Return to Redemption Center
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Redemption Info and History */}
        <div className="space-y-6">
          {/* Redemption Limits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <span>Weekly Limits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Weekly Redemption Used</span>
                    <span className="font-medium">{limits.weeklyUsed.toLocaleString()} / {limits.weeklyLimit.toLocaleString()} SP</span>
                  </div>
                  
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(limits.weeklyUsed / limits.weeklyLimit) * 100}%` }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
                    />
                  </div>
                  
                  <div className="text-xs text-neutral-500">
                    Limits reset on {formatDate(limits.resetsAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Redemption History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span>About Redemptions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">How Redemptions Work</h4>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• Convert Success Points to SKC tokens at a rate of 100 SP = 1 SKC</li>
                  <li>• Minimum redemption of 1,000 SP (10 SKC)</li>
                  <li>• Weekly limit of 10,000 SP (100 SKC) per user</li>
                  <li>• Redemptions are processed in weekly batches</li>
                  <li>• Tokens are sent directly to your connected wallet</li>
                </ul>
              </div>
              
              <div className="pt-2">
                <a 
                  href="#" 
                  className="text-sm text-primary flex items-center gap-1 hover:underline"
                >
                  <span>Learn more about the Success Kid tokenomics</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Redemptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span>Recent Redemptions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex justify-between py-2">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : redemptionHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-500">No redemption history yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Redeem your first Success Points</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {redemptionHistory.slice(0, 5).map((redemption) => (
                    <div key={redemption.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                      <div>
                        <div className="font-medium">
                          {redemption.pointsAmount.toLocaleString()} SP → {redemption.tokenAmount.toLocaleString()} SKC
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(redemption.requestedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full
                        ${redemption.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${redemption.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                      </div>
                    </div>
                  ))}
                  
                  {redemptionHistory.length > 5 && (
                    <div className="text-center pt-2">
                      <a href="#" className="text-sm text-primary hover:underline">
                        View all redemptions
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
