'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOffline } from './OfflineProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface OfflineIndicatorProps {
  showOfflineMessage?: boolean;
  showOnlineMessage?: boolean;
  messageTimeout?: number;
  position?: 'top' | 'bottom' | 'floating';
  className?: string;
  offlineMessage?: string;
  onlineMessage?: string;
  onlineIcon?: React.ReactNode;
  offlineIcon?: React.ReactNode;
  showPendingActions?: boolean;
}

/**
 * Component that provides visual feedback about the current online/offline status.
 * Can show temporary status changes or persistent indicators.
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showOfflineMessage = true,
  showOnlineMessage = true,
  messageTimeout = 5000,
  position = 'top',
  className,
  offlineMessage = "You're currently offline. Some features may not be available.",
  onlineMessage = "You're back online!",
  onlineIcon,
  offlineIcon,
  showPendingActions = true,
}) => {
  const { isOnline, pendingActions } = useOffline();
  const prefersReducedMotion = useReducedMotion();
  const [showMessage, setShowMessage] = useState(false);
  const [previousOnline, setPreviousOnline] = useState(isOnline);
  
  // Show message when online status changes
  useEffect(() => {
    if (isOnline !== previousOnline) {
      if ((isOnline && showOnlineMessage) || (!isOnline && showOfflineMessage)) {
        setShowMessage(true);
        
        // Hide message after timeout (if specified)
        if (messageTimeout > 0) {
          const timerId = setTimeout(() => {
            setShowMessage(false);
          }, messageTimeout);
          
          return () => clearTimeout(timerId);
        }
      }
      
      setPreviousOnline(isOnline);
    }
  }, [isOnline, previousOnline, showOnlineMessage, showOfflineMessage, messageTimeout]);
  
  // Always show message for offline state if showOfflineMessage is true
  const shouldShowMessage = showMessage || (!isOnline && showOfflineMessage);
  
  // Calculate pending actions message
  const pendingActionsCount = pendingActions.length;
  const hasPendingActions = pendingActionsCount > 0;
  
  // Position classes
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 pt-safe z-50',
    bottom: 'fixed bottom-0 left-0 right-0 pb-safe z-50',
    floating: 'fixed top-4 right-4 z-50 rounded-full shadow-lg',
  };
  
  if (!shouldShowMessage && (!hasPendingActions || !showPendingActions)) {
    return null;
  }
  
  return (
    <AnimatePresence>
      {(shouldShowMessage || (hasPendingActions && showPendingActions)) && (
        <motion.div
          className={cn(
            positionClasses[position],
            position === 'floating' 
              ? 'bg-white p-3 rounded-lg shadow-lg max-w-xs' 
              : isOnline 
                ? 'bg-green-600 text-white p-2' 
                : 'bg-red-600 text-white p-2',
            className
          )}
          initial={{ 
            opacity: 0,
            y: position === 'top' ? -50 : (position === 'bottom' ? 50 : 0),
            scale: position === 'floating' ? 0.9 : 1
          }}
          animate={{ 
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0,
            y: position === 'top' ? -50 : (position === 'bottom' ? 50 : 0),
            scale: position === 'floating' ? 0.9 : 1
          }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          <div className="flex items-center justify-center">
            {/* Online/Offline Icon */}
            {isOnline ? (
              onlineIcon || (
                <svg className="h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )
            ) : (
              offlineIcon || (
                <svg className="h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              )
            )}
            
            {/* Online/Offline Message */}
            <span>
              {isOnline 
                ? onlineMessage
                : offlineMessage
              }
            </span>
            
            {/* Pending Actions Count */}
            {isOnline && hasPendingActions && showPendingActions && (
              <span className="ml-2 text-xs bg-white text-green-600 px-2 py-0.5 rounded">
                {pendingActionsCount} pending action{pendingActionsCount !== 1 ? 's' : ''}
              </span>
            )}
            
            {/* Close Button for Persistent Messages */}
            {messageTimeout === 0 && (
              <button
                className="ml-auto p-1"
                onClick={() => setShowMessage(false)}
                aria-label="Close"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;