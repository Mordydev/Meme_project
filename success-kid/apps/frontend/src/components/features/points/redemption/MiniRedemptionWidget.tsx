'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRedemptionEligibility } from '@/hooks/usePointsData';
import { useWallet } from '@/hooks/useWallet';

interface MiniRedemptionWidgetProps {
  userId: string;
  onRedeemClick?: () => void;
  showBalance?: boolean;
  className?: string;
}

export const MiniRedemptionWidget: React.FC<MiniRedemptionWidgetProps> = ({
  userId,
  onRedeemClick,
  showBalance = true,
  className,
}) => {
  const { data: eligibilityData, isLoading } = useRedemptionEligibility(userId);
  const { wallet } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  
  // Update eligibility status based on data
  useEffect(() => {
    if (eligibilityData) {
      const walletConnected = !!wallet?.isConnected;
      const hasMinimumBalance = eligibilityData.pointsBalance >= eligibilityData.limits.minimumAmount;
      const hasWeeklyCap = eligibilityData.limits.remainingWeeklyLimit > 0;
      
      setIsEligible(walletConnected && hasMinimumBalance && hasWeeklyCap);
      
      // Set default selected amount if not already set
      if (!selectedAmount && hasMinimumBalance) {
        // Start with minimum redemption amount
        setSelectedAmount(eligibilityData.limits.minimumAmount);
      }
    }
  }, [eligibilityData, wallet?.isConnected, selectedAmount]);
  
  // Generate preset amount options based on user's balance and limits
  const getPresetAmounts = () => {
    if (!eligibilityData) return [];
    
    const { pointsBalance, limits } = eligibilityData;
    const effectiveMax = Math.min(pointsBalance, limits.weeklyLimit, limits.remainingWeeklyLimit);
    
    // Create preset options: minimum, 25%, 50%, 75%, maximum
    const presets = [
      limits.minimumAmount,
      Math.round(effectiveMax * 0.25),
      Math.round(effectiveMax * 0.5),
      Math.round(effectiveMax * 0.75),
      effectiveMax,
    ];
    
    // Filter out duplicates and values below minimum
    return [...new Set(presets)].filter(amount => amount >= limits.minimumAmount);
  };
  
  // Handle preset amount selection
  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
  };
  
  // Handle redeem button click
  const handleRedeemClick = () => {
    if (onRedeemClick && isEligible && selectedAmount) {
      onRedeemClick();
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Quick Redemption</span>
          {isEligible && (
            <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
              Eligible
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Points Balance */}
        {showBalance && eligibilityData && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Points Balance:</span>
            <span className="font-medium">{eligibilityData.pointsBalance} SP</span>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-2">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !isEligible ? (
          <div className="bg-neutral-50 p-3 rounded-lg text-sm">
            {!wallet?.isConnected ? (
              <p className="text-center">Connect your wallet to redeem tokens</p>
            ) : !eligibilityData?.requirements.minimumBalance ? (
              <p className="text-center">
                You need at least {eligibilityData?.limits.minimumAmount} points to redeem
              </p>
            ) : !eligibilityData?.requirements.weeklyCapAvailable ? (
              <p className="text-center">Weekly redemption limit reached</p>
            ) : (
              <p className="text-center">Unable to determine eligibility</p>
            )}
          </div>
        ) : (
          <>
            {/* Preset Amounts */}
            <div className="space-y-2">
              <p className="text-xs text-neutral-600">Select Amount:</p>
              <div className="flex flex-wrap gap-2">
                {getPresetAmounts().map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetClick(amount)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedAmount === amount
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {amount} SP
                  </button>
                ))}
              </div>
            </div>
            
            {/* Conversion Preview */}
            {selectedAmount && (
              <div className="bg-primary-50 p-2 rounded-lg text-sm text-center">
                <div className="font-medium">{selectedAmount} SP → {selectedAmount / 100} SKC</div>
              </div>
            )}
          </>
        )}
        
        {/* Redeem Button */}
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={!isEligible || !selectedAmount}
          onClick={handleRedeemClick}
        >
          Redeem Tokens
        </Button>
      </CardContent>
    </Card>
  );
};
