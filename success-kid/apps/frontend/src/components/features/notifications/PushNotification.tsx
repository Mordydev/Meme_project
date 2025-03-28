/**
 * Push Notification Component
 * Implements browser push notification capabilities
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, XCircle, CheckCircle, Info } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';

interface PushNotificationProps {
  vapidKey?: string;
  swPath?: string;
}

// Service worker registration status
type RegistrationStatus = 'unregistered' | 'registering' | 'registered' | 'failed';

// Permission request props
interface PermissionRequestProps {
  onPermissionChange: (permission: NotificationPermission) => void;
  onDismiss?: () => void;
}

/**
 * Check if push notifications are supported
 */
function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Permission Request Component
 */
export function PermissionRequest({ onPermissionChange, onDismiss }: PermissionRequestProps) {
  const [loading, setLoading] = useState(false);
  
  const requestPermission = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      onPermissionChange(permission);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      onPermissionChange('denied');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-4 mb-4">
      <div className="flex items-start">
        <Bell className="w-6 h-6 text-primary-500 mr-3 shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium mb-1">Enable Push Notifications</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Stay updated with important announcements, achievements, and community activity even when you're not browsing the site.
          </p>
          <div className="flex space-x-2">
            <Button
              variant="primary"
              onClick={requestPermission}
              isLoading={loading}
            >
              Enable Notifications
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                onClick={onDismiss}
              >
                Not Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Push Notification Component
 */
export function PushNotification({ 
  vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY,
  swPath = '/sw.js' 
}: PushNotificationProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('unregistered');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showPermissionRequest, setShowPermissionRequest] = useState<boolean>(false);
  const { settings, updateSettings } = useNotifications();
  
  // Check if push notifications are supported and initialize
  useEffect(() => {
    // Check if browser supports push notifications
    if (!isPushSupported()) {
      console.log('Push notifications not supported');
      return;
    }
    
    // Check initial permission status
    const currentPermission = Notification.permission as NotificationPermission;
    setPermission(currentPermission);
    
    // Only show permission request if user has enabled push in settings
    // and current permission is 'default' (not yet decided)
    if (settings.delivery.push && currentPermission === 'default') {
      setShowPermissionRequest(true);
    }
    
    // Register service worker
    if (currentPermission === 'granted') {
      registerServiceWorker();
    }
  }, [settings.delivery.push]);
  
  // Register service worker
  const registerServiceWorker = async () => {
    if (!isPushSupported()) return;
    
    try {
      setRegistrationStatus('registering');
      
      // Register service worker
      const reg = await navigator.serviceWorker.register(swPath);
      setRegistration(reg);
      setRegistrationStatus('registered');
      
      // Check for existing subscription
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setSubscription(existingSub);
      } else if (permission === 'granted' && vapidKey) {
        // Create new subscription if permission is granted
        await subscribeToPush(reg);
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
      setRegistrationStatus('failed');
    }
  };
  
  // Subscribe to push notifications
  const subscribeToPush = async (reg: ServiceWorkerRegistration) => {
    if (!vapidKey) {
      console.error('VAPID key not provided');
      return;
    }
    
    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      
      // Subscribe to push notifications
      const newSubscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      setSubscription(newSubscription);
      
      // Send subscription to server
      await sendSubscriptionToServer(newSubscription);
      
      return newSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  };
  
  // Send subscription to server
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
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
              name: navigator.userAgent
            }
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
      
      console.log('Push subscription successfully sent to server');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  };
  
  // Handle permission change
  const handlePermissionChange = async (newPermission: NotificationPermission) => {
    setPermission(newPermission);
    setShowPermissionRequest(false);
    
    // Update settings based on permission result
    updateSettings({
      delivery: {
        ...settings.delivery,
        push: newPermission === 'granted'
      }
    });
    
    // Register service worker and subscribe if permission granted
    if (newPermission === 'granted') {
      await registerServiceWorker();
    }
  };
  
  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!subscription) return;
    
    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();
      
      // Unregister from server
      await fetch('/api/notifications/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            endpoint: subscription.endpoint
          }
        }),
      });
      
      // Update state
      setSubscription(null);
      
      // Update settings
      updateSettings({
        delivery: {
          ...settings.delivery,
          push: false
        }
      });
      
      console.log('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };
  
  return (
    <>
      {/* Permission Request Dialog */}
      {showPermissionRequest && (
        <PermissionRequest
          onPermissionChange={handlePermissionChange}
          onDismiss={() => setShowPermissionRequest(false)}
        />
      )}
      
      {/* Current Status Display (for Settings page) */}
      {permission === 'granted' && registrationStatus === 'registered' && (
        <Card className="p-4 mb-4 border-success-200 bg-success-50">
          <div className="flex items-start">
            <CheckCircle className="w-6 h-6 text-success-500 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Push Notifications Enabled</h3>
              <p className="text-sm text-neutral-600 mb-4">
                You will receive notifications for important updates and activities.
              </p>
              <Button
                variant="outline"
                onClick={unsubscribe}
              >
                Disable Push Notifications
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Failed Status */}
      {registrationStatus === 'failed' && (
        <Card className="p-4 mb-4 border-alert-200 bg-alert-50">
          <div className="flex items-start">
            <XCircle className="w-6 h-6 text-alert-500 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Push Notifications Failed</h3>
              <p className="text-sm text-neutral-600 mb-4">
                We couldn't enable push notifications. This might be due to browser restrictions or network issues.
              </p>
              <Button
                variant="outline"
                onClick={registerServiceWorker}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Unsupported Browser */}
      {!isPushSupported() && (
        <Card className="p-4 mb-4 border-neutral-200 bg-neutral-50">
          <div className="flex items-start">
            <Info className="w-6 h-6 text-neutral-500 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Push Notifications Not Supported</h3>
              <p className="text-sm text-neutral-600">
                Your browser doesn't support push notifications. Please try using a modern browser like Chrome, Firefox, or Edge.
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
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

export default PushNotification;
