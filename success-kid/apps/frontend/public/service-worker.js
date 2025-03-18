/* Service Worker for Success Kid Community Platform */

// Cache version - update this when resources change to invalidate old caches
const CACHE_VERSION = 'v1';
const CACHE_NAME = `success-kid-${CACHE_VERSION}`;

// Resources to cache immediately on service worker install
const PRECACHE_RESOURCES = [
  '/',
  '/offline',
  '/manifest.json',
  '/styles/globals.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// App shell components that should be cached for offline use
const APP_SHELL_RESOURCES = [
  '/api/config', // Platform configuration
  '/dashboard',
  '/community',
  '/market',
  '/profile'
];

// Combined resources to cache on install
const RESOURCES_TO_CACHE = [...PRECACHE_RESOURCES, ...APP_SHELL_RESOURCES];

// Install event - precache key resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old versions of our cache
            return cacheName.startsWith('success-kid-') && cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker activated and controlling the page');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For API requests, use network first approach
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // For HTML requests, use network first with offline fallback
  if (event.request.headers.get('accept').includes('text/html')) {
    return handleHtmlRequest(event);
  }

  // For everything else (CSS, JS, images, etc.), use cache first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return from cache immediately, but also update cache in the background
          updateCache(event.request);
          return cachedResponse;
        }

        // Not in cache, get from network and cache response
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // If both cache and network fail, provide a generic fallback
        return caches.match('/offline');
      })
  );
});

// Handle API requests with network-first strategy
function handleApiRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache valid responses
        if (response && response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Only cache specific API responses
            if (
              event.request.url.includes('/api/config') ||
              event.request.url.includes('/api/content')
            ) {
              cache.put(event.request, clonedResponse);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // Try to get from cache if network fails
        return caches.match(event.request);
      })
  );
}

// Handle HTML requests with offline fallback
function handleHtmlRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the latest version of each page
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || caches.match('/offline');
          });
      })
  );
}

// Helper function to fetch and cache a request
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      // Cache valid responses
      if (response && response.status === 200) {
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, clonedResponse);
        });
      }
      return response;
    });
}

// Helper function to update a cached resource in the background
function updateCache(request) {
  fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    })
    .catch(err => {
      console.log('Background cache update failed:', err);
    });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  } else if (event.tag === 'sync-interactions') {
    event.waitUntil(syncInteractions());
  }
});

// Sync pending posts when online
async function syncPosts() {
  // This would need access to IndexedDB to get pending posts
  // Placeholder for implementation
  console.log('Syncing pending posts');
}

// Sync pending interactions when online
async function syncInteractions() {
  // This would need access to IndexedDB to get pending interactions
  // Placeholder for implementation
  console.log('Syncing pending interactions');
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

// Notification click event - open the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // If a window is already open, focus it
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
