'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePointsStore } from '@/store/usePointsStore';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Component for calculating and previewing points-to-token redemption
 */
export function PointsRedemptionCalculator() {
  const { 
    balance, 
    redemption,
    redemptionHistory,
    fetchRedemptionEligibility,
    fetchRedemptionHistory,
    redeemPoints,
    isLoading 
  } = usePointsStore();
  
  // Defaults if redemption data is not loaded yet
  const CONVERSION_RATE = redemption?.limits.conversionRate || 100;
  const MIN_REDEMPTION = redemption?.limits.minimumAmount || 1000;
  const WEEKLY_CAP = redemption?.limits.weeklyLimit || 10000;
  const WEEKLY_USED = redemption?.limits.weeklyUsed || 0;
  const REMAINING_CAP = WEEKLY_CAP - WEEKLY_USED;
  
  const [pointsToRedeem, setPointsToRedeem] = useState(MIN_REDEMPTION);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fetch redemption data when component mounts
  useEffect(() => {
    if (!redemption) {
      fetchRedemptionEligibility();
    }
    if (!redemptionHistory || redemptionHistory.length === 0) {
      fetchRedemptionHistory();
    }
  }, [redemption, redemptionHistory, fetchRedemptionEligibility, fetchRedemptionHistory]);
  
  // If MIN_REDEMPTION changes, update the default points to redeem
  useEffect(() => {
    setPointsToRedeem(MIN_REDEMPTION);
  }, [MIN_REDEMPTION]);
  
  // Calculate redemption preview values
  const tokenAmount = pointsToRedeem / CONVERSION_RATE;
  const walletConnected = redemption?.requirements.walletConnected || false;
  const isEligible = balance >= MIN_REDEMPTION && walletConnected;
  const isOverBalance = pointsToRedeem > balance;
  const isOverWeeklyCap = pointsToRedeem > REMAINING_CAP;
  const isValid = pointsToRedeem >= MIN_REDEMPTION && !isOverBalance && !isOverWeeklyCap;
  
  // Handle redemption submission
  const handleRedeem = async () => {
    if (!isValid || !isEligible || isLoading) return;
    
    try {
      const result = await redeemPoints(pointsToRedeem);
      
      if (result.success) {
        // Show success message
        setShowSuccess(true);
        
        // Fetch updated redemption history
        fetchRedemptionHistory();
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Redemption Calculator */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Points Redemption</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !redemption ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-green-50 p-4 text-green-800"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-1.5 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Redemption Successful!</h3>
                  <p className="mt-1 text-sm">
                    Your redemption of {pointsToRedeem} SP for {tokenAmount} SKC tokens has been initiated.
                    Tokens will be transferred to your wallet shortly.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Eligibility Checker */}
              {!isEligible && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-1.5 text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Redemption Requirements</h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className={balance >= MIN_REDEMPTION ? "text-green-600" : "text-amber-600"}>
                            {balance >= MIN_REDEMPTION ? "✓" : "○"}
                          </span>
                          <span>Minimum balance of {MIN_REDEMPTION} SP</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className={walletConnected ? "text-green-600" : "text-amber-600"}>
                            {walletConnected ? "✓" : "○"}
                          </span>
                          <span>Wallet connection required</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Points Amount Selector */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="points-input" className="font-medium">
                    Points to Redeem
                  </label>
                  <span className="text-sm text-muted-foreground">
                    Available: <span className="font-mono font-medium">{balance}</span>
                  </span>
                </div>
                
                <div className="flex rounded-md shadow-sm">
                  <input
                    id="points-input"
                    type="number"
                    min={MIN_REDEMPTION}
                    max={Math.min(balance, REMAINING_CAP)}
                    step={CONVERSION_RATE}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className={`block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                      isOverBalance || isOverWeeklyCap ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                
                {isOverBalance && (
                  <p className="mt-1 text-xs text-red-500">
                    Amount exceeds your available balance
                  </p>
                )}
                
                {isOverWeeklyCap && (
                  <p className="mt-1 text-xs text-red-500">
                    Amount exceeds your weekly redemption cap of {WEEKLY_CAP} SP
                  </p>
                )}
                
                {!isOverBalance && !isOverWeeklyCap && pointsToRedeem < MIN_REDEMPTION && (
                  <p className="mt-1 text-xs text-amber-500">
                    Minimum redemption amount is {MIN_REDEMPTION} SP
                  </p>
                )}
                
                {/* Quick Selection Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button 
                    onClick={() => setPointsToRedeem(MIN_REDEMPTION)}
                    className="rounded-md border border-input bg-background px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    Minimum ({MIN_REDEMPTION})
                  </button>
                  <button 
                    onClick={() => setPointsToRedeem(Math.min(balance, REMAINING_CAP, 5000))}
                    className="rounded-md border border-input bg-background px-3 py-1 text-xs hover:bg-gray-50"
                    disabled={5000 > balance}
                  >
                    5,000 SP
                  </button>
                  <button 
                    onClick={() => setPointsToRedeem(Math.min(balance, REMAINING_CAP))}
                    className="rounded-md border border-input bg-background px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    Maximum
                  </button>
                </div>
              </div>
              
              {/* Conversion Preview */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-2 font-medium">Conversion Preview</h3>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-mono">{pointsToRedeem}</span> Success Points
                  </div>
                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <span className="font-mono">{tokenAmount}</span> SKC Tokens
                  </div>
                </div>
                
                <p className="mt-3 text-xs text-muted-foreground">
                  Conversion Rate: {CONVERSION_RATE} SP = 1 SKC
                </p>
              </div>
              
              {/* Weekly Cap Information */}
              <div>
                <h3 className="mb-2 text-sm font-medium">Weekly Redemption Limit</h3>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {REMAINING_CAP} of {WEEKLY_CAP} SP remaining
                  </span>
                  <span className="text-muted-foreground">
                    {((REMAINING_CAP / WEEKLY_CAP) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div 
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(REMAINING_CAP / WEEKLY_CAP) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Redemption Button */}
              <div className="mt-2">
                <button
                  onClick={handleRedeem}
                  disabled={!isValid || !isEligible || isLoading}
                  className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-2" /> Processing...
                    </span>
                  ) : !walletConnected ? (
                    "Connect Wallet to Redeem"
                  ) : isValid ? (
                    `Redeem ${pointsToRedeem} SP for ${tokenAmount} SKC`
                  ) : (
                    "Invalid Redemption Amount"
                  )}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Redemption History */}
      <Card>
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !redemptionHistory ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : redemptionHistory && redemptionHistory.length > 0 ? (
            <div className="space-y-4">
              {redemptionHistory.map((redemption) => (
                <div key={redemption.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-medium">
                        {redemption.pointsAmount} SP → {redemption.tokenAmount} SKC
                      </span>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                      redemption.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : redemption.status === 'pending' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(redemption.requestedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-center text-muted-foreground">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2">No redemption history yet.</p>
                <p className="text-sm">Your redemption records will appear here.</p>
                {!walletConnected && (
                  <button className="mt-4 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20">
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
