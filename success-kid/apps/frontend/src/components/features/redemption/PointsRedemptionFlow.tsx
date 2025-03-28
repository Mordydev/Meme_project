'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EligibilityVerification } from './EligibilityVerification';
import { PointsConversionCalculator } from './PointsConversionCalculator';
import { RedemptionConfirmationModal, RedemptionData } from './RedemptionConfirmationModal';
import { TransactionStatusTracker } from './TransactionStatusTracker';
import { RedemptionHistory } from './RedemptionHistory';
import { usePointsStore } from '@/store/usePointsStore';
import { useWallet } from '@/hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface PointsRedemptionFlowProps {
  className?: string;
}

export function PointsRedemptionFlow({ className }: PointsRedemptionFlowProps) {
  const prefersReducedMotion = useReducedMotion();
  const { 
    balance, 
    redemption,
    redemptionHistory,
    fetchRedemptionEligibility,
    fetchRedemptionHistory,
    redeemPoints,
    isLoading 
  } = usePointsStore();
  
  const { wallet, publicKey } = useWallet();
  
  // State to manage different steps and modals
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showStatusTracker, setShowStatusTracker] = useState<boolean>(false);
  const [activeTransaction, setActiveTransaction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Fetch eligibility and history data when component mounts
  useEffect(() => {
    if (!redemption) {
      fetchRedemptionEligibility();
    }
    
    if (!redemptionHistory || redemptionHistory.length === 0) {
      fetchRedemptionHistory();
    }
  }, [redemption, redemptionHistory, fetchRedemptionEligibility, fetchRedemptionHistory]);
  
  // Handle eligibility status changes
  const handleEligibilityChange = (eligible: boolean) => {
    setIsEligible(eligible);
  };
  
  // Handle amount selection from calculator
  const handleAmountChange = (amount: number) => {
    setPointsToRedeem(amount);
  };
  
  // Handle redemption submission
  const handleSubmit = async (amount: number) => {
    // Show confirmation modal
    setPointsToRedeem(amount);
    setIsModalOpen(true);
  };
  
  // Process redemption after confirmation
  const handleConfirmRedemption = async () => {
    setIsProcessing(true);
    
    try {
      // Call API to process redemption
      const result = await redeemPoints(pointsToRedeem);
      
      if (result.success) {
        // Show transaction tracker
        setActiveTransaction(Date.now().toString());
        setShowStatusTracker(true);
        
        // Update redemption history
        fetchRedemptionHistory();
      }
      
      return result;
    } catch (error) {
      console.error('Error processing redemption:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle transaction item click in history
  const handleTransactionClick = (id: string) => {
    setSelectedTransactionId(id);
  };
  
  // Get configuration values or use defaults
  const getRedemptionConfig = () => {
    const minRedemption = redemption?.limits.minimumAmount || 1000;
    const maxRedemption = redemption?.limits.weeklyLimit || 10000;
    const conversionRate = redemption?.limits.conversionRate || 100;
    const weeklyUsed = redemption?.limits.weeklyUsed || 0;
    
    // Adjust max redemption based on weekly cap
    const adjustedMax = Math.min(maxRedemption - weeklyUsed, balance);
    
    return {
      minRedemption,
      maxRedemption: adjustedMax,
      conversionRate
    };
  };
  
  return (
    <div className={className}>
      <div className="space-y-8">
        {/* Eligibility Verification */}
        <EligibilityVerification 
          onStatusChange={handleEligibilityChange} 
          showDetails={true}
        />
        
        {/* Main Redemption Interface */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Redemption Calculator */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Redeem Points for Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <PointsConversionCalculator
                  pointsBalance={balance}
                  minRedemption={getRedemptionConfig().minRedemption}
                  maxRedemption={getRedemptionConfig().maxRedemption}
                  conversionRate={getRedemptionConfig().conversionRate}
                  onAmountChange={handleAmountChange}
                  onSubmit={handleSubmit}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
            
            {/* Transaction Status Tracker - shown after redemption */}
            <AnimatePresence>
              {showStatusTracker && activeTransaction && (
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <TransactionStatusTracker
                    transactionId={activeTransaction}
                    onStatusChange={(status) => {
                      if (status === 'completed' || status === 'failed') {
                        // Auto-hide tracker after completion (optional)
                        // setTimeout(() => setShowStatusTracker(false), 5000);
                      }
                    }}
                    initialData={{
                      id: activeTransaction,
                      pointsAmount: pointsToRedeem,
                      tokenAmount: pointsToRedeem / getRedemptionConfig().conversionRate,
                      recipientAddress: publicKey ? publicKey.toString() : '',
                      status: 'pending',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      steps: {
                        verification: 'pending',
                        tokenTransfer: 'pending',
                        confirmation: 'pending'
                      }
                    }}
                    onClose={() => setShowStatusTracker(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Redemption History */}
          <div>
            <RedemptionHistory
              transactions={redemptionHistory}
              isLoading={isLoading}
              onRefresh={fetchRedemptionHistory}
              onItemClick={handleTransactionClick}
            />
          </div>
        </div>
        
        {/* Configuration and Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>About Token Redemption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium">Requirements</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Connected wallet is required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Minimum {getRedemptionConfig().minRedemption} SP balance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Weekly redemption limit is {getRedemptionConfig().maxRedemption} SP</span>
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-medium">Process</h3>
                  </div>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-xs font-medium text-primary">1</span>
                      <span>Select amount of points to redeem</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-xs font-medium text-primary">2</span>
                      <span>Review and confirm transaction details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-xs font-medium text-primary">3</span>
                      <span>Receive tokens in your connected wallet</span>
                    </li>
                  </ol>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="font-medium">Security</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Transactions cannot be reversed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Points are deducted only when token transfer is successful</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Transaction history is always available</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="rounded-lg bg-neutral-50 p-4 text-sm text-muted-foreground">
                <p>
                  <strong>Note:</strong> Redemption transactions may take a few minutes to complete due to blockchain processing times.
                  You can check the status of your transaction in the history section.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Modal */}
      <RedemptionConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        data={{
          pointsAmount: pointsToRedeem,
          tokenAmount: pointsToRedeem / getRedemptionConfig().conversionRate,
          recipientAddress: publicKey ? publicKey.toString() : '',
          conversionRate: getRedemptionConfig().conversionRate
        }}
        onConfirm={handleConfirmRedemption}
      />
    </div>
  );
}
