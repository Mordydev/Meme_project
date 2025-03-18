'use client';

/**
 * Register the service worker for PWA functionality
 * 
 * @returns Promise resolving to the service worker registration
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(undefined);
  }

  return navigator.serviceWorker.register('/service-worker.js', {
    scope: '/'
  }).then(registration => {
    console.log('Service Worker registered with scope:', registration.scope);
    
    // Check for updates on page load
    if (registration.active) {
      registration.update();
    }
    
    return registration;
  }).catch(error => {
    console.error('Service Worker registration failed:', error);
    return undefined;
  });
}

/**
 * Check if the app can be installed (PWA installation criteria met)
 * 
 * @returns Boolean indicating if the app can be installed
 */
export function canInstallApp(): boolean {
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  // Check for beforeinstallprompt support (the main way to detect installability)
  return 'BeforeInstallPromptEvent' in window;
}

// Store the install prompt event for later use
let deferredPrompt: any = null;

/**
 * Listen for the beforeinstallprompt event to enable install button
 * This should be called early in the application lifecycle
 * 
 * @param callback Function to call when install prompt is available
 * @returns Cleanup function
 */
export function listenForInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Notify that the app can be installed
    callback(true);
  };
  
  // The app was installed, hide the install button
  const handleAppInstalled = () => {
    deferredPrompt = null;
    callback(false);
  };
  
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
  // Listen for the appinstalled event
  window.addEventListener('appinstalled', handleAppInstalled);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

/**
 * Show the install prompt to the user
 * 
 * @returns Promise that resolves with the user choice (true if accepted)
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const outcome = await deferredPrompt.userChoice;
  
  // Reset the deferred prompt
  deferredPrompt = null;
  
  // Return true if the user accepted the install
  return outcome.outcome === 'accepted';
}

/**
 * Check if the app is in standalone mode (installed as PWA)
 * 
 * @returns Boolean indicating if app is in standalone mode
 */
export function isRunningAsStandaloneApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Enable Web Push Notifications
 * 
 * @returns Promise resolving to the permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  // Check if permission is already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  // Request permission
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    await subscribeToPushNotifications();
  }
  
  return permission;
}

/**
 * Subscribe to push notifications
 * Call this after permission is granted
 */
async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push manager is supported
    if (!registration.pushManager) {
      console.log('Push notifications not supported');
      return;
    }
    
    // Get existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // Create new subscription if none exists
    if (!subscription) {
      // This would typically get public key from your server
      const response = await fetch('/api/notifications/vapid-public-key');
      const vapidPublicKey = await response.text();
      
      // Convert the key to the format expected by the browser
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Send the subscription to your server
      await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    }
    
    console.log('Push notification subscription successful');
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
}

/**
 * Converts a URL-safe base64 string to a Uint8Array
 * Required for WebPush API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
