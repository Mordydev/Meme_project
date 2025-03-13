/**
 * Push Notification Manager Component
 * Manages service worker registration and push notification subscriptions
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserStore } from '@/store/useUserStore';

/**
 * Check if push notifications are supported
 */
function isPushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;
}

/**
 * Push Notification Manager Component
 * Initializes service worker and push notifications
 */
export function PushNotificationManager() {
  // Get notification settings and user data
  const { settings } = useNotifications();
  const { user } = useUserStore();
  
  // Track service worker registration status
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  // Initialize service worker when component mounts
  useEffect(() => {
    // Skip if push notifications are not supported
    if (!isPushSupported()) {
      console.log('Push notifications not supported in this browser');
      return;
    }
    
    // Skip if push notifications are not enabled in settings
    if (!settings.delivery.push) {
      console.log('Push notifications not enabled in user settings');
      return;
    }
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          setSwRegistration(registration);
          
          // Handle push notification subscription
          handlePushSubscription(registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      
      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New Service Worker activated');
      });
    }
  }, [settings.delivery.push]);
  
  /**
   * Handle push notification subscription
   */
  const handlePushSubscription = async (registration: ServiceWorkerRegistration) => {
    try {
      // Check if permission is granted
      if (Notification.permission !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }
      
      // Get existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log('Using existing push subscription');
        syncSubscriptionWithServer(existingSubscription);
        return;
      }
      
      // Create new subscription if none exists
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key not available');
        return;
      }
      
      // Convert VAPID key from base64 to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      
      // Store server key in service worker for resubscribe events
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_APPLICATION_SERVER_KEY',
          applicationServerKey
        });
      }
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('New push subscription created');
      
      // Send subscription to server
      syncSubscriptionWithServer(subscription);
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  };
  
  /**
   * Send subscription to server
   */
  const syncSubscriptionWithServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            subscription,
            device: {
              type: 'browser',
              name: navigator.userAgent,
              userId: user?.id
            }
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync subscription with server');
      }
      
      console.log('Push subscription synced with server');
    } catch (error) {
      console.error('Error syncing subscription with server:', error);
      
      // Store subscription locally for later sync when online
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        try {
          localStorage.setItem('pendingPushSubscription', JSON.stringify({
            subscription,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Failed to store subscription locally:', e);
        }
      }
    }
  };
  
  /**
   * Check for pending subscriptions to sync
   */
  useEffect(() => {
    // Skip if offline
    if (!navigator.onLine) return;
    
    // Check for pending subscriptions
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const pendingSubscription = localStorage.getItem('pendingPushSubscription');
      
      if (pendingSubscription) {
        try {
          const { subscription, timestamp } = JSON.parse(pendingSubscription);
          
          // Only attempt to sync if less than 7 days old
          const isRecent = Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000;
          
          if (isRecent) {
            syncSubscriptionWithServer(subscription)
              .then(() => {
                localStorage.removeItem('pendingPushSubscription');
              });
          } else {
            // Remove old pending subscription
            localStorage.removeItem('pendingPushSubscription');
          }
        } catch (e) {
          console.error('Failed to process pending subscription:', e);
          localStorage.removeItem('pendingPushSubscription');
        }
      }
    }
  }, []);
  
  // Online/offline status change handler
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      
      // Attempt to sync any pending subscriptions
      const pendingSubscription = localStorage.getItem('pendingPushSubscription');
      if (pendingSubscription) {
        try {
          const { subscription } = JSON.parse(pendingSubscription);
          syncSubscriptionWithServer(subscription)
            .then(() => {
              localStorage.removeItem('pendingPushSubscription');
            });
        } catch (e) {
          console.error('Failed to process pending subscription:', e);
        }
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

/**
 * Utility function to convert URL-safe base64 to Uint8Array
 * (Required for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

export default PushNotificationManager;
