'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useNetwork, ConnectionType } from '@/hooks/useNetwork';
import { useViewport } from '@/hooks/useViewport';

export type NetworkTier = 'high' | 'medium' | 'low' | 'offline' | 'unknown';

export interface AdaptiveLoadingProps {
  children: ReactNode;
  lowQualityFallback?: ReactNode;
  offlineFallback?: ReactNode;
  loadingFallback?: ReactNode;
  networkRequirement?: NetworkTier;
  className?: string;
  loadingDelay?: number;
  isLoading?: boolean;
  retryOnNetworkChange?: boolean;
}

/**
 * Component that adapts content loading based on network quality,
 * device capabilities, and connection status.
 */
export const AdaptiveLoading: React.FC<AdaptiveLoadingProps> = ({
  children,
  lowQualityFallback,
  offlineFallback,
  loadingFallback,
  networkRequirement = 'medium',
  className,
  loadingDelay = 300,
  isLoading = false,
  retryOnNetworkChange = true,
}) => {
  const network = useNetwork();
  const { isMobile } = useViewport();
  const [showLoader, setShowLoader] = React.useState(isLoading && loadingDelay > 0);
  const [hasDeterminedNetwork, setHasDeterminedNetwork] = React.useState(false);
  
  // Determine network tier based on connection type and downlink
  const determineNetworkTier = (): NetworkTier => {
    if (!network.isOnline) return 'offline';
    
    // If we have accurate downlink information
    if (network.downlink > 0) {
      if (network.downlink >= 5) return 'high';     // 5+ Mbps = high quality
      if (network.downlink >= 1.5) return 'medium'; // 1.5-5 Mbps = medium quality
      return 'low';                                // < 1.5 Mbps = low quality
    }
    
    // Fall back to connection type
    const connectionTiers: Record<ConnectionType, NetworkTier> = {
      'wifi': 'high',
      '4g': 'high',
      '3g': 'medium',
      '2g': 'low',
      'slow': 'low',
      'unknown': isMobile ? 'medium' : 'high' // Conservative guess based on device
    };
    
    return connectionTiers[network.connectionType] || 'medium';
  };
  
  // Handle delayed loading state
  React.useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    
    if (isLoading && loadingDelay > 0) {
      setShowLoader(false);
      timerId = setTimeout(() => {
        setShowLoader(true);
      }, loadingDelay);
    } else {
      setShowLoader(false);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isLoading, loadingDelay]);
  
  // Determine network tier with slight delay to ensure accurate detection
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasDeterminedNetwork(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get current network tier
  const currentTier = determineNetworkTier();
  
  // Network tier hierarchy for comparing requirements
  const tierHierarchy: Record<NetworkTier, number> = {
    'high': 3,
    'medium': 2,
    'low': 1,
    'offline': 0,
    'unknown': 2, // Treat unknown as medium to be safe
  };
  
  // Check if current network meets requirements
  const meetsRequirements = tierHierarchy[currentTier] >= tierHierarchy[networkRequirement];
  
  // Show loading state if explicitly loading
  if (isLoading && showLoader && loadingFallback) {
    return <div className={className}>{loadingFallback}</div>;
  }
  
  // Show offline fallback when offline
  if (currentTier === 'offline' && offlineFallback) {
    return <div className={className}>{offlineFallback}</div>;
  }
  
  // Show low quality fallback when network is poor
  if (!meetsRequirements && lowQualityFallback) {
    return <div className={className}>{lowQualityFallback}</div>;
  }
  
  // Otherwise show the main content
  return (
    <div 
      className={cn(
        'adaptive-loading',
        className
      )}
      data-network-tier={currentTier}
      data-network-determined={hasDeterminedNetwork ? 'true' : 'false'}
    >
      {children}
    </div>
  );
};

export default AdaptiveLoading;