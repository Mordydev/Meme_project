'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '@/lib/utils';
import { usePointsStore } from '@/store/usePointsStore';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';

export interface MiniRedemptionWidgetProps {
  onFullRedemptionClick?: () => void;
  className?: string;
}

export function MiniRedemptionWidget({
  onFullRedemptionClick,
  className = ''
}: MiniRedemptionWidgetProps) {
  const router = useRouter();
  const { balance, redemption, fetchRedemptionEligibility } = usePointsStore();
  const { isConnected } = useWallet();
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  
  // Default conversion rate is 100, can be updated when redemption data is loaded
  const conversionRate = redemption?.limits.conversionRate || 100;
  
  // Check eligibility and fetch redemption data
  useEffect(() => {
    if (!redemption) {
      fetchRedemptionEligibility();
    }
    
    // Check if user has minimum balance and wallet connected
    if (redemption && balance >= redemption.limits.minimumAmount && isConnected) {
      setIsEligible(true);
    } else {
      setIsEligible(false);
    }
  }, [redemption, balance, isConnected, fetchRedemptionEligibility]);
  
  // Set default selection when data is loaded
  useEffect(() => {
    if (redemption && balance) {
      const minAmount = redemption.limits.minimumAmount;
      setSelectedAmount(balance >= minAmount ? minAmount : null);
    }
  }, [redemption, balance]);
  
  // Calculate token amount from points
  const getTokenAmount = (points: number) => points / conversionRate;
  
  // Navigate to full redemption flow
  const handleFullRedemptionClick = () => {
    if (onFullRedemptionClick) {
      onFullRedemptionClick();
    } else {
      // Default behavior - navigate to points/redeem page
      router.push('/points/redeem');
    }
  };
  
  // Calculate preset amounts based on user's balance
  const getPresetAmounts = () => {
    if (!redemption || !balance) return [];
    
    const minRedemption = redemption.limits.minimumAmount;
    
    // Only show presets user can afford
    const presets = [];
    
    if (balance >= minRedemption) {
      presets.push(minRedemption);
    }
    
    if (balance >= 5000) {
      presets.push(5000);
    }
    
    if (balance >= 10000) {
      presets.push(10000);
    }
    
    return presets;
  };
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Balance Display */}
          <div>
            <div className="text-sm text-muted-foreground">Available to Redeem</div>
            <div className="font-mono text-2xl font-bold">{formatCompactNumber(balance)} SP</div>
          </div>
          
          {/* Quick Conversion */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Quick Redemption</div>
            <div className="flex flex-wrap gap-2">
              {getPresetAmounts().map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                    selectedAmount === amount
                      ? 'border-primary bg-primary-50 text-primary-900' 
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {formatCompactNumber(amount)} SP
                </button>
              ))}
            </div>
          </div>
          
          {/* Conversion Preview */}
          {selectedAmount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-neutral-50 p-3"
            >
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono font-medium">{formatCompactNumber(selectedAmount)}</span> SP
                </div>
                <div className="text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div>
                  <span className="font-mono font-medium">{getTokenAmount(selectedAmount)}</span> SKC
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!isConnected && (
              <ConnectWalletButton
                fullWidth
                size="sm"
              />
            )}
            
            {isConnected && selectedAmount && (
              <Button
                disabled={!isEligible || !selectedAmount}
                size="sm"
                onClick={handleFullRedemptionClick}
              >
                {isEligible
                  ? `Redeem ${formatCompactNumber(selectedAmount)} SP`
                  : 'Not Eligible'
                }
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullRedemptionClick}
            >
              Advanced Options
            </Button>
          </div>
          
          {/* Eligibility Indicator */}
          {isConnected && !isEligible && (
            <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
              {!redemption && "Loading eligibility information..."}
              {redemption && balance < redemption.limits.minimumAmount && (
                `Minimum ${redemption.limits.minimumAmount} SP required.`
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
