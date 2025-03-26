'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOffline, PendingAction } from './OfflineProvider';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface OfflineSyncProps {
  children: ReactNode;
  showSyncIndicator?: boolean;
  autoSync?: boolean;
  syncInterval?: number;
  onSyncStart?: () => void;
  onSyncComplete?: (success: boolean, actions: PendingAction[]) => void;
  className?: string;
  indicatorClassName?: string;
  indicatorPosition?: 'top' | 'bottom' | 'floating';
  showActionCount?: boolean;
  customSyncIndicator?: ReactNode;
  syncOnLoad?: boolean;
}

/**
 * Component that manages synchronization of offline actions with the server.
 * Provides visual feedback about sync status and pending actions.
 */
export const OfflineSync: React.FC<OfflineSyncProps> = ({
  children,
  showSyncIndicator = true,
  autoSync = true,
  syncInterval = 60000, // 1 minute
  onSyncStart,
  onSyncComplete,
  className,
  indicatorClassName,
  indicatorPosition = 'top',
  showActionCount = true,
  customSyncIndicator,
  syncOnLoad = false,
}) => {
  const { 
    isOnline, 
    pendingActions, 
    syncPendingActions, 
    isSynchronizing, 
    syncProgress 
  } = useOffline();
  
  const prefersReducedMotion = useReducedMotion();
  const [showSync, setShowSync] = useState(false);
  const hasPendingActions = pendingActions.length > 0;
  
  // Run sync on load if requested
  useEffect(() => {
    if (syncOnLoad && isOnline && hasPendingActions) {
      syncPendingActions();
    }
  }, [syncOnLoad, isOnline, hasPendingActions, syncPendingActions]);
  
  // Set up automatic sync interval
  useEffect(() => {
    if (!autoSync || !isOnline) return;
    
    // Only set up interval if there are pending actions
    if (hasPendingActions) {
      const intervalId = setInterval(() => {
        syncPendingActions();
      }, syncInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [autoSync, isOnline, hasPendingActions, syncInterval, syncPendingActions]);
  
  // Show sync indicator when synchronizing or has pending actions
  useEffect(() => {
    if (isSynchronizing) {
      setShowSync(true);
      onSyncStart?.();
    } else if (showSync) {
      // Hide sync indicator after a delay when sync completes
      const timerId = setTimeout(() => {
        setShowSync(false);
      }, 1500);
      
      return () => clearTimeout(timerId);
    }
  }, [isSynchronizing, showSync, onSyncStart]);
  
  // Call onSyncComplete when sync finishes
  useEffect(() => {
    if (!isSynchronizing && showSync) {
      onSyncComplete?.(pendingActions.length === 0, pendingActions);
    }
  }, [isSynchronizing, showSync, pendingActions, onSyncComplete]);
  
  // Sync indicator positions
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 pt-safe z-50',
    bottom: 'fixed bottom-0 left-0 right-0 pb-safe z-50',
    floating: 'fixed bottom-20 right-4 z-50 rounded-full shadow-lg',
  };
  
  return (
    <div className={cn('offline-sync', className)}>
      {/* Sync indicator */}
      {showSyncIndicator && (showSync || hasPendingActions) && (
        <motion.div
          className={cn(
            positionClasses[indicatorPosition],
            indicatorPosition === 'floating' 
              ? 'bg-white p-3' 
              : 'bg-blue-600 text-white p-2',
            indicatorClassName
          )}
          initial={{ 
            opacity: 0,
            y: indicatorPosition === 'top' ? -50 : (indicatorPosition === 'bottom' ? 50 : 0),
            scale: indicatorPosition === 'floating' ? 0.9 : 1
          }}
          animate={{ 
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0,
            y: indicatorPosition === 'top' ? -50 : (indicatorPosition === 'bottom' ? 50 : 0),
            scale: indicatorPosition === 'floating' ? 0.9 : 1
          }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          {customSyncIndicator || (
            <div className="flex items-center justify-center">
              {/* Sync icon */}
              {isSynchronizing ? (
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )}
              
              {/* Sync text */}
              <span>
                {isSynchronizing
                  ? `Syncing${showActionCount ? ` (${pendingActions.length} actions)` : ''}...`
                  : hasPendingActions
                    ? `${pendingActions.length} action${pendingActions.length !== 1 ? 's' : ''} pending`
                    : 'Sync complete'
                }
              </span>
              
              {/* Progress indicator */}
              {isSynchronizing && syncProgress > 0 && (
                <div className="ml-2 w-16 bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full" 
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              )}
              
              {/* Manual sync button */}
              {!isSynchronizing && hasPendingActions && isOnline && (
                <button
                  onClick={() => syncPendingActions()}
                  className="ml-2 text-xs bg-white text-blue-600 px-2 py-0.5 rounded"
                >
                  Sync now
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
      
      {/* Main content */}
      {children}
    </div>
  );
};

export default OfflineSync;