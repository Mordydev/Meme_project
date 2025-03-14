'use client';

import React from 'react';
import { useNetwork, NetworkTier } from './NetworkContext';

export interface AdaptiveLoadingProps {
  children: React.ReactNode;
  lowQualityFallback?: React.ReactNode;
  offlineFallback?: React.ReactNode;
  networkRequirement?: NetworkTier;
  showLoadingIndicator?: boolean;
  checkInterval?: number; // ms to check connection changes
  criticalContent?: boolean; // if true, will always try to show content
}

/**
 * A component that adapts content based on network conditions
 * 
 * @param children - Primary content for good network conditions
 * @param lowQualityFallback - Simplified content for poor network
 * @param offlineFallback - Content to show when offline
 * @param networkRequirement - Minimum network quality required
 * @param showLoadingIndicator - Whether to show loading state
 * @param checkInterval - How often to check network changes (ms)
 * @param criticalContent - Whether content is essential
 */
export function AdaptiveLoading({
  children,
  lowQualityFallback,
  offlineFallback,
  networkRequirement = 'medium',
  showLoadingIndicator = true,
  checkInterval = 5000,
  criticalContent = false,
}: AdaptiveLoadingProps) {
  const { network, checkConnection } = useNetwork();
  const { isOnline, networkTier } = network;
  
  // Helper functions to determine what content to show
  const isNetworkSufficient = () => {
    // If critical content, show it regardless (but may be slow)
    if (criticalContent) return true;
    
    // Tier comparison logic
    const tierValues: Record<NetworkTier, number> = {
      high: 3,
      medium: 2,
      low: 1,
      offline: 0,
      unknown: 1, // Assume low quality for unknown
    };
    
    const requiredTierValue = tierValues[networkRequirement];
    const actualTierValue = tierValues[networkTier];
    
    return actualTierValue >= requiredTierValue;
  };
  
  // Determine what to render based on network conditions
  if (!isOnline && offlineFallback) {
    return (
      <div className="adaptive-loading offline">
        {offlineFallback}
        <button 
          onClick={async () => {
            await checkConnection();
          }}
          className="mt-4 px-4 py-2 bg-neutral-200 rounded-md text-sm"
        >
          Check connection
        </button>
      </div>
    );
  }
  
  if (isOnline && !isNetworkSufficient() && lowQualityFallback) {
    return (
      <div className="adaptive-loading low-quality">
        {lowQualityFallback}
      </div>
    );
  }
  
  // Show primary content
  return (
    <div className="adaptive-loading">
      {children}
    </div>
  );
}
