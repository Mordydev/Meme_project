'use client';

/**
 * Browser information interface
 */
export interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  mobile: boolean;
  supported: boolean;
  partialSupport: boolean;
  potentialIssues: string[];
}

/**
 * Browser support matrix
 * Defines support status for various browsers/versions
 */
const BROWSER_SUPPORT_MATRIX = {
  chrome: {
    minVersion: 80,
    fullSupportVersion: 88,
    notes: 'Fully supported in recent versions'
  },
  firefox: {
    minVersion: 78,
    fullSupportVersion: 85,
    notes: 'Fully supported in recent versions'
  },
  safari: {
    minVersion: 13,
    fullSupportVersion: 14,
    notes: 'Some features may have limited support in older versions'
  },
  edge: {
    minVersion: 80,
    fullSupportVersion: 88,
    notes: 'Based on Chromium, follows Chrome support matrix'
  },
  opera: {
    minVersion: 67,
    fullSupportVersion: 74,
    notes: 'Based on Chromium, follows Chrome support matrix'
  },
  samsung: {
    minVersion: 11,
    fullSupportVersion: 15,
    notes: 'Some features may have limited support'
  },
  ie: {
    minVersion: null,
    fullSupportVersion: null,
    notes: 'Not supported'
  }
};

/**
 * Feature detection for critical browser capabilities
 */
const CRITICAL_FEATURES = [
  {
    name: 'Promises',
    test: () => typeof Promise !== 'undefined',
    required: true
  },
  {
    name: 'Fetch API',
    test: () => typeof fetch !== 'undefined',
    required: true
  },
  {
    name: 'CSS Grid',
    test: () => CSS && CSS.supports && CSS.supports('display', 'grid'),
    required: true
  },
  {
    name: 'Flexbox',
    test: () => CSS && CSS.supports && CSS.supports('display', 'flex'),
    required: true
  },
  {
    name: 'Service Workers',
    test: () => 'serviceWorker' in navigator,
    required: false
  },
  {
    name: 'IndexedDB',
    test: () => 'indexedDB' in window,
    required: false
  },
  {
    name: 'WebSockets',
    test: () => 'WebSocket' in window,
    required: true
  },
  {
    name: 'LocalStorage',
    test: () => 'localStorage' in window,
    required: true
  },
  {
    name: 'WebP Support',
    test: () => {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    },
    required: false
  },
  {
    name: 'IntersectionObserver',
    test: () => 'IntersectionObserver' in window,
    required: false
  }
];

/**
 * Detect browser name and version
 * 
 * @returns Browser information object
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
      os: 'unknown',
      mobile: false,
      supported: true,
      partialSupport: false,
      potentialIssues: []
    };
  }

  const userAgent = navigator.userAgent;
  let name = 'unknown';
  let version = 'unknown';
  let os = 'unknown';
  let mobile = false;
  
  // OS detection
  if (/Windows/.test(userAgent)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(userAgent)) {
    os = 'macOS';
  } else if (/Linux/.test(userAgent)) {
    os = 'Linux';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
    mobile = true;
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    os = 'iOS';
    mobile = true;
  }
  
  // Browser detection
  // Edge (based on Chromium)
  if (/Edg/.test(userAgent)) {
    name = 'edge';
    version = userAgent.match(/Edg\/([\d.]+)/)?.[1] || 'unknown';
  }
  // Chrome
  else if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
    name = 'chrome';
    version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || 'unknown';
  }
  // Firefox
  else if (/Firefox/.test(userAgent)) {
    name = 'firefox';
    version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || 'unknown';
  }
  // Safari
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    name = 'safari';
    version = userAgent.match(/Version\/([\d.]+)/)?.[1] || 'unknown';
  }
  // Internet Explorer
  else if (/MSIE|Trident/.test(userAgent)) {
    name = 'ie';
    version = userAgent.match(/(?:MSIE |rv:)([\d.]+)/)?.[1] || 'unknown';
  }
  // Opera
  else if (/OPR/.test(userAgent)) {
    name = 'opera';
    version = userAgent.match(/OPR\/([\d.]+)/)?.[1] || 'unknown';
  }
  // Samsung Internet
  else if (/SamsungBrowser/.test(userAgent)) {
    name = 'samsung';
    version = userAgent.match(/SamsungBrowser\/([\d.]+)/)?.[1] || 'unknown';
  }
  
  // Mobile detection (additional check)
  if (!mobile) {
    mobile = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent);
  }
  
  // Determine support status and potential issues
  const versionNumber = parseFloat(version);
  const browserSupport = BROWSER_SUPPORT_MATRIX[name] || { 
    minVersion: null, 
    fullSupportVersion: null,
    notes: 'Unknown browser'
  };
  
  const supported = browserSupport.minVersion === null ? 
    false : 
    !isNaN(versionNumber) && versionNumber >= browserSupport.minVersion;
  
  const partialSupport = supported && 
    browserSupport.fullSupportVersion !== null && 
    versionNumber < browserSupport.fullSupportVersion;
  
  // Perform feature detection
  const potentialIssues = [];
  
  if (typeof window !== 'undefined') {
    for (const feature of CRITICAL_FEATURES) {
      try {
        const supported = feature.test();
        if (!supported && feature.required) {
          potentialIssues.push(`Missing required feature: ${feature.name}`);
        } else if (!supported) {
          potentialIssues.push(`Limited support: ${feature.name} not available`);
        }
      } catch (e) {
        if (feature.required) {
          potentialIssues.push(`Error testing required feature: ${feature.name}`);
        }
      }
    }
  }
  
  if (!supported) {
    potentialIssues.push(`Browser not supported: ${name} ${version}`);
  } else if (partialSupport) {
    potentialIssues.push(`Limited support in ${name} ${version}: ${browserSupport.notes}`);
  }
  
  return {
    name,
    version,
    os,
    mobile,
    supported,
    partialSupport,
    potentialIssues
  };
}

/**
 * Check if the current browser supports a specific CSS feature
 * 
 * @param property CSS property to check
 * @param value Property value to test
 * @returns True if the feature is supported
 */
export function supportsCssFeature(property: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.CSS || !window.CSS.supports) {
    return false;
  }
  
  return CSS.supports(property, value);
}

/**
 * Check if the browser supports modern JavaScript features
 * 
 * @returns Object with feature support information
 */
export function checkJsFeatureSupport() {
  return {
    arrowFunctions: (() => {
      try {
        // Test arrow functions
        eval('() => {}');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    destructuring: (() => {
      try {
        // Test destructuring
        eval('const { a } = { a: 1 }');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    async: (() => {
      try {
        // Test async/await
        eval('async () => {}');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    objectSpread: (() => {
      try {
        // Test object spread
        eval('const a = { ...{} }');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    nullishCoalescing: (() => {
      try {
        // Test nullish coalescing
        eval('const a = null ?? "default"');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    optionalChaining: (() => {
      try {
        // Test optional chaining
        eval('const a = {}?.b');
        return true;
      } catch (e) {
        return false;
      }
    })()
  };
}

/**
 * Verify if browser meets minimum requirements
 * 
 * @returns True if browser meets minimum requirements
 */
export function meetsMinimumRequirements(): boolean {
  const browser = detectBrowser();
  
  // If the browser is specifically not supported, return false
  if (!browser.supported) {
    return false;
  }
  
  // Check critical features
  let criticalFeaturesSupported = true;
  
  if (typeof window !== 'undefined') {
    for (const feature of CRITICAL_FEATURES) {
      if (feature.required) {
        try {
          if (!feature.test()) {
            criticalFeaturesSupported = false;
            break;
          }
        } catch (e) {
          criticalFeaturesSupported = false;
          break;
        }
      }
    }
  }
  
  return criticalFeaturesSupported;
}
