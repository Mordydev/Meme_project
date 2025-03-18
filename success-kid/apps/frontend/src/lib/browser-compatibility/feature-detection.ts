'use client';

/**
 * Feature detection interface for browser capabilities
 */
export interface FeatureSupport {
  feature: string;
  supported: boolean;
  fallbackAvailable: boolean;
  critical: boolean;
  notes?: string;
}

/**
 * Check support for critical web platform features
 * 
 * @returns Array of feature support results
 */
export function detectBrowserFeatures(): FeatureSupport[] {
  if (typeof window === 'undefined') {
    return []; // SSR environment
  }

  const features: FeatureSupport[] = [];

  // Check for CSS Grid support
  features.push({
    feature: 'CSS Grid',
    supported: checkCssGridSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to flexbox layout'
  });

  // Check for CSS Variables support
  features.push({
    feature: 'CSS Variables',
    supported: checkCssVariableSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to static color values'
  });

  // Check for Flexbox support
  features.push({
    feature: 'Flexbox',
    supported: checkFlexboxSupport(),
    fallbackAvailable: true,
    critical: true,
    notes: 'Core layout system, limited experience without it'
  });

  // Check for IntersectionObserver support
  features.push({
    feature: 'IntersectionObserver',
    supported: checkIntersectionObserverSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to on-scroll handlers for lazy loading'
  });

  // Check for WebP image support
  features.push({
    feature: 'WebP Images',
    supported: checkWebpSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to JPEG/PNG images'
  });

  // Check for WebSocket support
  features.push({
    feature: 'WebSockets',
    supported: checkWebSocketSupport(),
    fallbackAvailable: true,
    critical: true,
    notes: 'Falls back to polling for real-time features'
  });

  // Check for localStorage support
  features.push({
    feature: 'LocalStorage',
    supported: checkLocalStorageSupport(),
    fallbackAvailable: true,
    critical: true,
    notes: 'Falls back to in-memory storage (no persistence)'
  });

  // Check for sessionStorage support
  features.push({
    feature: 'SessionStorage',
    supported: checkSessionStorageSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to in-memory storage'
  });

  // Check for IndexedDB support
  features.push({
    feature: 'IndexedDB',
    supported: checkIndexedDBSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to localStorage for offline data (limited capacity)'
  });

  // Check for Service Worker support
  features.push({
    feature: 'Service Workers',
    supported: checkServiceWorkerSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'No offline support without service workers'
  });

  // Check for Web Push API support
  features.push({
    feature: 'Web Push API',
    supported: checkWebPushSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to in-app notifications'
  });

  // Check for Drag and Drop API support
  features.push({
    feature: 'Drag and Drop API',
    supported: checkDragDropSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to alternative UI patterns for content manipulation'
  });

  // Check for WebAnimations API support
  features.push({
    feature: 'Web Animations API',
    supported: checkWebAnimationsSupport(),
    fallbackAvailable: true,
    critical: false,
    notes: 'Falls back to CSS animations'
  });

  // Check for Fetch API support
  features.push({
    feature: 'Fetch API',
    supported: checkFetchSupport(),
    fallbackAvailable: true,
    critical: true,
    notes: 'Falls back to XMLHttpRequest'
  });

  // Check for Async/Await support
  features.push({
    feature: 'Async/Await',
    supported: checkAsyncAwaitSupport(),
    fallbackAvailable: true,
    critical: true,
    notes: 'Core language feature, app may not function properly without it'
  });

  return features;
}

/**
 * Check if CSS Grid is supported
 */
function checkCssGridSupport(): boolean {
  if (typeof window === 'undefined' || !window.CSS || !window.CSS.supports) {
    return false;
  }
  return CSS.supports('display', 'grid');
}

/**
 * Check if CSS Variables are supported
 */
function checkCssVariableSupport(): boolean {
  if (typeof window === 'undefined' || !window.CSS || !window.CSS.supports) {
    return false;
  }
  return CSS.supports('--custom-property', 'value');
}

/**
 * Check if Flexbox is supported
 */
function checkFlexboxSupport(): boolean {
  if (typeof window === 'undefined' || !window.CSS || !window.CSS.supports) {
    return false;
  }
  return CSS.supports('display', 'flex');
}

/**
 * Check if IntersectionObserver is supported
 */
function checkIntersectionObserverSupport(): boolean {
  return typeof IntersectionObserver !== 'undefined';
}

/**
 * Check if WebP images are supported
 */
function checkWebpSupport(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  
  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.getContext('2d')) {
    return false;
  }
  
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Check if WebSockets are supported
 */
function checkWebSocketSupport(): boolean {
  return typeof WebSocket !== 'undefined';
}

/**
 * Check if localStorage is supported and working
 */
function checkLocalStorageSupport(): boolean {
  try {
    const testKey = 'test-local-storage';
    localStorage.setItem(testKey, '1');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return value === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Check if sessionStorage is supported and working
 */
function checkSessionStorageSupport(): boolean {
  try {
    const testKey = 'test-session-storage';
    sessionStorage.setItem(testKey, '1');
    const value = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    return value === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Check if IndexedDB is supported
 */
function checkIndexedDBSupport(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Check if Service Workers are supported
 */
function checkServiceWorkerSupport(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if Web Push API is supported
 */
function checkWebPushSupport(): boolean {
  return 'PushManager' in window;
}

/**
 * Check if Drag and Drop API is supported
 */
function checkDragDropSupport(): boolean {
  const div = document.createElement('div');
  return 'draggable' in div || ('ondragstart' in div && 'ondrop' in div);
}

/**
 * Check if Web Animations API is supported
 */
function checkWebAnimationsSupport(): boolean {
  return typeof Element !== 'undefined' && 'animate' in Element.prototype;
}

/**
 * Check if Fetch API is supported
 */
function checkFetchSupport(): boolean {
  return typeof fetch !== 'undefined';
}

/**
 * Check if Async/Await is supported
 */
function checkAsyncAwaitSupport(): boolean {
  try {
    eval('async () => {}');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get a summary of critical feature support
 * 
 * @returns Object with support status and details
 */
export function getFeatureSupportSummary() {
  const features = detectBrowserFeatures();
  const criticalFeatures = features.filter(f => f.critical);
  const criticalSupported = criticalFeatures.every(f => f.supported);
  
  const missingCritical = criticalFeatures
    .filter(f => !f.supported)
    .map(f => f.feature);
  
  const limitedFeatures = features
    .filter(f => !f.critical && !f.supported)
    .map(f => f.feature);
  
  return {
    fullSupport: features.every(f => f.supported),
    criticalSupport: criticalSupported,
    missingCritical,
    limitedFeatures,
    allFeatures: features
  };
}
