'use client';

import { useState, useEffect } from 'react';
import { usePointsStore } from '@/store/usePointsStore';
import { useWallet } from '@/hooks/useWallet';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Requirement {
  id: string;
  label: string;
  description?: string;
  isMet: boolean;
  actionLabel?: string;
  action?: () => void;
}

export interface EligibilityVerificationProps {
  onStatusChange?: (isEligible: boolean) => void;
  showDetails?: boolean;
  className?: string;
}

export function EligibilityVerification({
  onStatusChange,
  showDetails = true,
  className
}: EligibilityVerificationProps) {
  const { redemption, balance, fetchRedemptionEligibility } = usePointsStore();
  const { isConnected, connect } = useWallet();
  
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  
  // Fetch eligibility data if not already available
  useEffect(() => {
    if (!redemption) {
      fetchRedemptionEligibility();
    }
  }, [redemption, fetchRedemptionEligibility]);
  
  // Update requirements based on current state
  useEffect(() => {
    if (!redemption) return;
    
    const minimumBalance = redemption.limits.minimumAmount || 1000;
    const hasMinimumBalance = balance >= minimumBalance;
    
    const requirementsList: Requirement[] = [
      {
        id: 'wallet-connected',
        label: 'Wallet Connection',
        description: 'Connect your wallet to receive tokens',
        isMet: isConnected,
        actionLabel: 'Connect Wallet',
        action: () => connect()
      },
      {
        id: 'minimum-balance',
        label: `Minimum ${minimumBalance} SP Balance`,
        description: `You need at least ${minimumBalance} SP to redeem`,
        isMet: hasMinimumBalance,
        // No action for balance - user needs to earn more points
      }
    ];
    
    // Determine overall eligibility
    const eligible = requirementsList.every(req => req.isMet);
    setIsEligible(eligible);
    setRequirements(requirementsList);
    
    // Notify parent of eligibility change
    if (onStatusChange) {
      onStatusChange(eligible);
    }
  }, [redemption, balance, isConnected, connect, onStatusChange]);
  
  if (!redemption) {
    return null; // Or loading state
  }
  
  return (
    <div 
      className={cn(
        "rounded-lg border", 
        isEligible ? "border-success bg-success/5" : "border-amber-200 bg-amber-50",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isEligible ? "bg-success text-white" : "bg-amber-100 text-amber-600"
            )}
          >
            {isEligible ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-lg">
              {isEligible ? 'Ready to Redeem' : 'Redemption Requirements'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEligible 
                ? 'You meet all the requirements to redeem your points for tokens.' 
                : 'Complete these requirements to redeem your points for tokens.'}
            </p>
            
            {showDetails && (
              <div className="mt-4 space-y-3">
                {requirements.map((requirement) => (
                  <RequirementItem key={requirement.id} requirement={requirement} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RequirementItemProps {
  requirement: Requirement;
}

function RequirementItem({ requirement }: RequirementItemProps) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full",
            requirement.isMet 
              ? "bg-success text-white" 
              : "bg-amber-100 text-amber-600"
          )}
        >
          {requirement.isMet ? (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-xs">!</span>
          )}
        </motion.div>
      </div>
      
      <div className="flex-1">
        <p className={cn(
          "font-medium",
          requirement.isMet ? "text-success-700" : "text-amber-800"
        )}>
          {requirement.label}
        </p>
        
        {requirement.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {requirement.description}
          </p>
        )}
      </div>
      
      {!requirement.isMet && requirement.action && (
        <div className="mt-[-2px]">
          <ConnectWalletButton
            size="sm"
            variant="outline"
            onSuccess={requirement.action}
          />
        </div>
      )}
    </div>
  );
}
