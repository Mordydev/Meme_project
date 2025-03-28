'use client';

import React from 'react';
import { ConnectWalletButton } from '@/components/wallet/modal/ConnectWalletButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EligibilityCheckProps {
  isEligible: boolean;
  requirements: {
    minimumBalance: number;
    walletConnected: boolean;
    verificationComplete: boolean;
  };
  pointsBalance: number;
  isLoading: boolean;
  error: string | null;
}

export function EligibilityCheck({
  isEligible,
  requirements,
  pointsBalance,
  isLoading,
  error,
}: EligibilityCheckProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-neutral-600">Checking eligibility...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Overall Eligibility Status */}
      <div className={cn(
        "p-4 rounded-lg flex items-center",
        isEligible ? "bg-green-50" : "bg-amber-50"
      )}>
        {isEligible ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
        )}
        
        <div>
          <h3 className={cn(
            "font-medium",
            isEligible ? "text-green-900" : "text-amber-900"
          )}>
            {isEligible 
              ? "You're eligible to redeem points" 
              : "Complete the requirements below to redeem"}
          </h3>
          <p className={cn(
            "text-sm mt-1",
            isEligible ? "text-green-700" : "text-amber-700"
          )}>
            {isEligible
              ? "Continue to select the amount of points you want to redeem"
              : "Address all requirements to unlock points redemption"}
          </p>
        </div>
      </div>
      
      {/* Requirements List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-700">Redemption Requirements</h3>
        
        <div className="space-y-3">
          {/* Minimum Balance Check */}
          <div className="flex items-start">
            {pointsBalance >= requirements.minimumBalance ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-neutral-400 mr-3 mt-0.5 flex-shrink-0" />
            )}
            
            <div>
              <p className={cn(
                "font-medium",
                pointsBalance >= requirements.minimumBalance ? "text-neutral-900" : "text-neutral-500"
              )}>
                Minimum Balance
              </p>
              <p className="text-sm text-neutral-600">
                You need at least {requirements.minimumBalance.toLocaleString()} points to redeem
              </p>
              
              <div className="mt-1 text-sm">
                <span className="font-medium">Current Balance:</span>{' '}
                <span className={pointsBalance >= requirements.minimumBalance ? "text-green-600" : "text-neutral-500"}>
                  {pointsBalance.toLocaleString()} Points
                </span>
              </div>
            </div>
          </div>
          
          {/* Wallet Connected Check */}
          <div className="flex items-start">
            {requirements.walletConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-neutral-400 mr-3 mt-0.5 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                requirements.walletConnected ? "text-neutral-900" : "text-neutral-500"
              )}>
                Wallet Connected
              </p>
              <p className="text-sm text-neutral-600 mb-2">
                Connect a crypto wallet to receive tokens
              </p>
              
              {!requirements.walletConnected && (
                <ConnectWalletButton size="sm" className="mt-1">
                  Connect Wallet
                </ConnectWalletButton>
              )}
            </div>
          </div>
          
          {/* Wallet Verified Check */}
          <div className="flex items-start">
            {requirements.verificationComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-neutral-400 mr-3 mt-0.5 flex-shrink-0" />
            )}
            
            <div>
              <p className={cn(
                "font-medium",
                requirements.verificationComplete ? "text-neutral-900" : "text-neutral-500"
              )}>
                Wallet Verified
              </p>
              <p className="text-sm text-neutral-600">
                Verify wallet ownership through signature
              </p>
              
              {requirements.walletConnected && !requirements.verificationComplete && (
                <p className="text-xs text-amber-600 mt-1">
                  Please sign the verification message in your wallet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Conversion Information */}
      <div className="bg-neutral-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Redemption Information</h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Points convert at a rate of 100 SP = 1 SKC Token</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Minimum redemption amount is {requirements.minimumBalance.toLocaleString()} points</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Weekly redemption limit of 10,000 points per user</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Redemptions typically process within minutes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
