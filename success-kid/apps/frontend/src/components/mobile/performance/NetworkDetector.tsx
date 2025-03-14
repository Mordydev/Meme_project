'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface NetworkDetectorProps {
  children: ReactNode;
  offlineContent?: ReactNode;
  lowBandwidthContent?: ReactNode;
  onNetworkChange?: (state: ReturnType<typeof useNetwork>) => void;
  showBanner?: boolean;
  bannerPosition?: 'top' | 'bottom';
  lowQualityThreshold?: number; // In Mbps for downlink
  className?: string;
}

/**
 * Component that detects network status and quality, showing appropriate
 * content based on connection state.
 */
export const NetworkDetector: React.FC<NetworkDetectorProps> = ({
  children,
  offlineContent,
  lowBandwidthContent,
  onNetworkChange,
  showBanner = true,
  bannerPosition = 'top',
  lowQualityThreshold = 1.0, // 1 Mbps is considered low quality
  className,
}) => {
  const network = useNetwork();
  const prefersReducedMotion = useReducedMotion();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [previousOnline, setPreviousOnline] = useState(network.isOnline);
  
  // Determine if network is low quality
  const isLowQuality = !network.isOnline || (
    network.downlink > 0 && 
    network.downlink < lowQualityThreshold
  );
  
  // Call onNetworkChange callback when network status changes
  useEffect(() => {
    onNetworkChange?.(network);
  }, [
    network.isOnline,
    network.connectionType,
    network.effectiveConnectionType,
    network.downlink,
    onNetworkChange,
  ]);
  
  // Show banner when going offline or coming back online
  useEffect(() => {
    if (network.isOnline !== previousOnline) {
      setPreviousOnline(network.isOnline);
      
      if (showBanner) {
        setBannerVisible(true);
        
        // Hide banner after 5 seconds
        const timerId = setTimeout(() => {
          setBannerVisible(false);
        }, 5000);
        
        return () => clearTimeout(timerId);
      }
    }
  }, [network.isOnline, previousOnline, showBanner]);
  
  // Render offline content if offline
  if (!network.isOnline && offlineContent) {
    return (
      <div className={className}>
        {showBanner && (
          <NetworkStatusBanner 
            isOnline={false}
            isVisible={bannerVisible}
            position={bannerPosition}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
        {offlineContent}
      </div>
    );
  }
  
  // Render low bandwidth content if connection is poor
  if (isLowQuality && lowBandwidthContent) {
    return (
      <div className={className}>
        {showBanner && (
          <NetworkStatusBanner 
            isOnline={true}
            isVisible={bannerVisible}
            position={bannerPosition}
            prefersReducedMotion={prefersReducedMotion}
            isLowQuality
          />
        )}
        {lowBandwidthContent}
      </div>
    );
  }
  
  // Otherwise render normal content
  return (
    <div className={className}>
      {showBanner && (
        <NetworkStatusBanner 
          isOnline={network.isOnline}
          isVisible={bannerVisible}
          position={bannerPosition}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
      {children}
    </div>
  );
};

// Internal component for the network status banner
interface NetworkStatusBannerProps {
  isOnline: boolean;
  isVisible: boolean;
  position: 'top' | 'bottom';
  prefersReducedMotion: boolean;
  isLowQuality?: boolean;
}

const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  isOnline,
  isVisible,
  position,
  prefersReducedMotion,
  isLowQuality = false,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed left-0 right-0 z-50 px-4 py-2 text-white text-center',
            position === 'top' ? 'top-0 pt-safe' : 'bottom-0 pb-safe',
            isOnline ? (isLowQuality ? 'bg-yellow-600' : 'bg-green-600') : 'bg-red-600'
          )}
          initial={{ 
            y: position === 'top' ? -100 : 100,
            opacity: prefersReducedMotion ? 0 : 1
          }}
          animate={{ 
            y: 0,
            opacity: 1
          }}
          exit={{ 
            y: position === 'top' ? -100 : 100,
            opacity: prefersReducedMotion ? 0 : 1
          }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          {!isOnline && (
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18.364 5.636a9 9 0 010 12.728l-2.829-2.829a5 5 0 000-7.07l2.829-2.829zm-4.95 2.121a5 5 0 00-7.07 0L3.515 4.93a9 9 0 0112.728 0l-2.829 2.828z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3.515 15.071a9 9 0 010-12.728l2.829 2.829a5 5 0 000 7.07l-2.829 2.829zm4.95-2.121a5 5 0 007.07 0l2.829 2.829a9 9 0 01-12.728 0l2.829-2.829z" clipRule="evenodd" />
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span>You're offline. Some features may not be available.</span>
            </div>
          )}
          
          {isOnline && isLowQuality && (
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Slow connection detected. Some content may load slowly.</span>
            </div>
          )}
          
          {isOnline && !isLowQuality && (
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You're back online!</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkDetector;