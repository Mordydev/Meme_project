'use client';

import { useState, useEffect } from 'react';

/**
 * Interface for the hook return value
 */
interface OfflineStatusHook {
  isOnline: boolean;
  wasOffline: boolean;
  hasPendingActions: boolean;
  isReconnecting: boolean;
  reconnectionAttempts: number;
  handleReconnect: () => void;
  clearWasOffline: () => void;
}

/**
 * Hook to track online/offline status and handle reconnection
 * 
 * @returns Object with online status information and handlers
 */
export function useOfflineStatus(): OfflineStatusHook {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [hasPendingActions, setHasPendingActions] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we have pending actions
    const checkPendingActions = async () => {
      try {
        // This would need to be implemented based on your offline storage system
        // For example, checking IndexedDB for pending actions
        const hasPending = localStorage.getItem('has-pending-actions') === 'true';
        setHasPendingActions(hasPending);
      } catch (error) {
        console.error('Error checking pending actions:', error);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      checkPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkPendingActions();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Handle manual reconnection attempt
   */
  const handleReconnect = () => {
    if (isOnline) return; // Already online
    
    setIsReconnecting(true);
    setReconnectionAttempts(prevAttempts => prevAttempts + 1);
    
    // Simulate reconnection attempt
    setTimeout(() => {
      // Check if we've come online
      if (navigator.onLine) {
        setIsOnline(true);
        setWasOffline(true);
        setIsReconnecting(false);
      } else {
        setIsReconnecting(false);
      }
    }, 1500);
  };

  /**
   * Clear the wasOffline flag once handled
   */
  const clearWasOffline = () => {
    setWasOffline(false);
  };

  return {
    isOnline,
    wasOffline,
    hasPendingActions,
    isReconnecting,
    reconnectionAttempts,
    handleReconnect,
    clearWasOffline
  };
}
