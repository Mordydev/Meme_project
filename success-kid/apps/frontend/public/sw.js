/**
 * Service Worker for Success Kid Community Platform
 * Handles push notifications and offline functionality
 */

// Cache name for offline assets
const CACHE_NAME = 'success-kid-cache-v1';

// Assets to cache on install
const OFFLINE_ASSETS = [
  '/',
  '/offline',
  '/images/logos/success-kid-logo.svg',
  '/images/icons/icon-192x192.png'
];

// Install event - cache offline assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Cache offline assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching offline assets');
      return cache.addAll(OFFLINE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  // Claim clients to take control immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('[ServiceWorker] Removing old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip caching for API requests
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response to cache it and return it
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // If fetch fails, return offline page for document requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let notification;
  
  try {
    // Parse notification data
    notification = event.data.json();
  } catch (e) {
    // Fallback for plain text notifications
    notification = {
      title: 'Success Kid Community',
      body: event.data.text(),
      icon: '/images/icons/icon-192x192.png'
    };
  }
  
  // Ensure we have required notification properties
  const title = notification.title || 'Success Kid Community';
  const options = {
    body: notification.body || 'You have a new notification',
    icon: notification.icon || '/images/icons/icon-192x192.png',
    badge: notification.badge || '/images/icons/badge-72x72.png',
    tag: notification.tag || 'success-kid-notification',
    data: notification.data || {},
    actions: notification.actions || [],
    // Notification vibration pattern
    vibrate: [100, 50, 100],
    // Notification will be considered important in Android
    requireInteraction: notification.requireInteraction || false
  };
  
  // Show notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click');
  
  // Close the notification
  event.notification.close();
  
  // Get action (if any)
  const action = event.action;
  const notification = event.notification;
  
  // Get notification data
  const data = notification.data || {};
  
  // Determine URL to open
  let url = '/notifications';
  
  // If action was clicked and we have a URL for it
  if (action && data.actions && data.actions[action] && data.actions[action].url) {
    url = data.actions[action].url;
  } 
  // If main notification was clicked and we have a URL
  else if (data.url) {
    url = data.url;
  }
  
  // Open the appropriate window or focus if already open
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if a window with the URL is already open
      const matchingClient = windowClients.find((client) => {
        return (new URL(client.url).pathname === new URL(url, self.location.origin).pathname);
      });
      
      // If so, focus it
      if (matchingClient) {
        return matchingClient.focus();
      }
      
      // Otherwise open a new window
      return clients.openWindow(url);
    })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[ServiceWorker] Push subscription changed');
  
  // Re-subscribe with the same options
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.applicationServerKey
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            subscription,
            device: {
              type: 'browser',
              name: 'Unknown (resubscribe)'
            }
          }
        })
      });
    })
  );
});

// Store applicationServerKey when received
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_APPLICATION_SERVER_KEY') {
    self.applicationServerKey = event.data.applicationServerKey;
  }
});
