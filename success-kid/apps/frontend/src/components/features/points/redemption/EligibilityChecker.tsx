'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRedemptionEligibility } from '@/hooks/usePointsData';
import { useWallet } from '@/hooks/useWallet';
import { ConnectWalletButton } from '@/components/features/wallet/ConnectWalletButton';

export interface RequirementItem {
  id: string;
  label: string;
  description?: string;
  isMet: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface EligibilityCheckerProps {
  userId: string;
  onStatusChange?: (isEligible: boolean) => void;
  onContinue?: () => void;
  className?: string;
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({
  userId,
  onStatusChange,
  onContinue,
  className,
}) => {
  const { data: eligibilityData, isLoading, error } = useRedemptionEligibility(userId);
  const { wallet, connect } = useWallet();
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    if (eligibilityData) {
      const reqs: RequirementItem[] = [
        {
          id: 'walletConnected',
          label: 'Connect Wallet',
          description: 'Connect your wallet to receive tokens',
          isMet: !!wallet?.isConnected,
          action: wallet?.isConnected ? undefined : {
            label: 'Connect Wallet',
            onClick: () => connect(),
          },
        },
        {
          id: 'minimumBalance',
          label: 'Minimum Points Balance',
          description: `You need at least ${eligibilityData.limits.minimumAmount} points to redeem`,
          isMet: (eligibilityData.pointsBalance >= eligibilityData.limits.minimumAmount),
        },
        {
          id: 'weeklyCapAvailable',
          label: 'Weekly Redemption Limit',
          description: `You can redeem up to ${eligibilityData.limits.weeklyLimit} points per week`,
          isMet: eligibilityData.limits.remainingWeeklyLimit > 0,
        },
      ];

      setRequirements(reqs);
      
      // Check overall eligibility
      const eligible = reqs.every(req => req.isMet);
      setIsEligible(eligible);
      
      if (onStatusChange) {
        onStatusChange(eligible);
      }
    }
  }, [eligibilityData, wallet?.isConnected, connect, onStatusChange]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-neutral-500">Checking eligibility...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-alert">
            <p>Unable to check eligibility</p>
            <p className="text-sm mt-2">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Redemption Eligibility</span>
          {isEligible && (
            <span className="ml-2 text-sm bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
              Eligible
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Complete these requirements to redeem your Success Points for SKC tokens
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-4">
          {requirements.map((req) => (
            <li key={req.id} className="flex items-start">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                req.isMet ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {req.isMet ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                )}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="font-medium">{req.label}</div>
                {req.description && (
                  <p className="text-sm text-neutral-500 mt-0.5">{req.description}</p>
                )}
                
                {req.action && (
                  <div className="mt-2">
                    {req.id === 'walletConnected' ? (
                      <ConnectWalletButton size="sm" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={req.action.onClick}
                      >
                        {req.action.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      
      {eligibilityData && (
        <CardFooter className="flex-col items-start pt-2 pb-6">
          <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <p className="text-sm text-neutral-500">
                Current Points Balance: <span className="font-medium text-neutral-800">{eligibilityData.pointsBalance}</span>
              </p>
              {eligibilityData.requirements.weeklyCapAvailable && (
                <p className="text-sm text-neutral-500 mt-1">
                  Weekly Redemption Remaining: <span className="font-medium text-neutral-800">{eligibilityData.limits.remainingWeeklyLimit}</span>
                </p>
              )}
            </div>
            
            {onContinue && (
              <Button 
                variant="primary" 
                disabled={!isEligible}
                onClick={onContinue}
              >
                Continue to Redemption
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
