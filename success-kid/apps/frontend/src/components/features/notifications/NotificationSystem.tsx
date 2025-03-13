/**
 * Notification System
 * Comprehensive notification system that combines all notification components
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { ToastContainer } from './ToastNotification';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { PushNotificationManager } from './PushNotificationManager';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface NotificationSystemProps {
  showToasts?: boolean;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showConnectionStatus?: boolean;
}

/**
 * Notification System Component
 * Integrates all notification functionality into a cohesive system
 */
export function NotificationSystem({ 
  showToasts = true,
  toastPosition = 'top-right',
  showConnectionStatus = true
}: NotificationSystemProps) {
  const { isConnected } = useWebSocketContext();
  const { settings } = useNotifications();
  const prefersReducedMotion = useReducedMotion();
  const [isOffline, setIsOffline] = useState(false);
  
  // Track online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    // Set initial status
    updateOnlineStatus();
    
    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  
  return (
    <>
      {/* Push Notification Manager */}
      <PushNotificationManager />
      
      {/* Toast Container for transient notifications */}
      {showToasts && settings.delivery.inApp && (
        <ToastContainer position={toastPosition} limit={3} />
      )}
      
      {/* Connection Status Indicator */}
      {showConnectionStatus && (
        <AnimatePresence>
          {(isOffline || !isConnected) && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-alert-500 text-white py-2 px-4 rounded-full shadow-md flex items-center z-50"
              role="alert"
              aria-live="polite"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {isOffline 
                  ? "You're offline. Some features may be unavailable." 
                  : "Connection lost. Reconnecting..."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

/**
 * Notification Sync Manager
 * Handles syncing notifications when reconnecting after being offline
 */
export function NotificationSyncManager() {
  const { isConnected } = useWebSocketContext();
  const [wasOffline, setWasOffline] = useState(false);
  
  // Track online/offline status and sync when coming back online
  useEffect(() => {
    const handleOffline = () => {
      setWasOffline(true);
    };
    
    const handleOnline = () => {
      if (wasOffline) {
        // Attempt to sync notifications
        syncOfflineNotifications();
        setWasOffline(false);
      }
    };
    
    // Set initial state
    if (!navigator.onLine) {
      setWasOffline(true);
    }
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [wasOffline]);
  
  // Sync notifications when WebSocket reconnects
  useEffect(() => {
    if (isConnected && wasOffline) {
      syncOfflineNotifications();
      setWasOffline(false);
    }
  }, [isConnected, wasOffline]);
  
  /**
   * Sync offline notifications
   */
  const syncOfflineNotifications = async () => {
    // Get pending notifications from IndexedDB or localStorage
    // This could be replaced with actual offline storage implementation
    try {
      const pendingNotifications = localStorage.getItem('pendingNotifications');
      
      if (pendingNotifications) {
        const notifications = JSON.parse(pendingNotifications);
        
        // Process each notification
        for (const notification of notifications) {
          // Send to server or process locally
          await fetch('/api/notifications/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notification }),
          });
        }
        
        // Clear pending notifications
        localStorage.removeItem('pendingNotifications');
      }
    } catch (error) {
      console.error('Error syncing offline notifications:', error);
    }
  };
  
  // This is a non-visual component
  return null;
}

/**
 * Mobile Notification Tab 
 * For bottom navigation in mobile view
 */
export function MobileNotificationTab({ className = '' }: { className?: string }) {
  const { unread } = useNotifications();
  const { isConnected } = useWebSocketContext();
  const [isOffline, setIsOffline] = useState(false);
  
  // Track online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    // Set initial status
    updateOnlineStatus();
    
    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <Bell className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-4 min-w-4 flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {(isOffline || !isConnected) && (
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-alert-500"></span>
        )}
      </div>
      <span className="text-xs mt-1">Notifications</span>
    </div>
  );
}

export default NotificationSystem;
