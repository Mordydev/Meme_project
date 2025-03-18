'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface FeatureSupport {
  api: string;
  supported: boolean;
  description: string;
  critical: boolean;
  moreInfoUrl?: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  os: string;
  mobile: boolean;
}

export interface BrowserCompatibilityCheckerProps {
  showControls?: boolean;
  runOnLoad?: boolean;
  showUnsupported?: boolean; // Only show unsupported features
  className?: string;
  onCompatibilityResult?: (features: FeatureSupport[], browserInfo: BrowserInfo) => void;
}

/**
 * A component that checks for browser compatibility with various features
 * required by the platform, highlighting potential issues.
 */
export const BrowserCompatibilityChecker: React.FC<BrowserCompatibilityCheckerProps> = ({
  showControls = true,
  runOnLoad = true,
  showUnsupported = false,
  className,
  onCompatibilityResult,
}) => {
  const [features, setFeatures] = useState<FeatureSupport[]>([]);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    name: 'Unknown',
    version: 'Unknown',
    engine: 'Unknown',
    os: 'Unknown',
    mobile: false,
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<string>('');
  
  // Run compatibility checks
  const runChecks = () => {
    setIsChecking(true);
    
    // Detect browser info
    detectBrowser();
    
    // Check feature support
    const featureChecks = checkFeatureSupport();
    setFeatures(featureChecks);
    
    setIsChecking(false);
    setLastChecked(new Date().toLocaleString());
    
    // Call callback
    onCompatibilityResult?.(featureChecks, browserInfo);
  };
  
  // Detect browser information
  const detectBrowser = () => {
    const ua = navigator.userAgent;
    
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let engineName = 'Unknown';
    let osName = 'Unknown';
    let isMobile = false;
    
    // Detect browser and version
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || '';
      engineName = 'Gecko';
    } else if (ua.indexOf('SamsungBrowser') > -1) {
      browserName = 'Samsung Browser';
      browserVersion = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || '';
      engineName = 'Blink';
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
      browserName = 'Opera';
      browserVersion = ua.match(/(?:Opera|OPR)\/([\d.]+)/)?.[1] || '';
      engineName = 'Blink';
    } else if (ua.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edge\/([\d.]+)/)?.[1] || '';
      engineName = 'EdgeHTML';
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || '';
      engineName = 'Blink';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || '';
      engineName = 'Blink';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || '';
      engineName = 'WebKit';
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browserName = 'Internet Explorer';
      browserVersion = ua.match(/(?:MSIE |rv:)([\d.]+)/)?.[1] || '';
      engineName = 'Trident';
    }
    
    // Detect operating system
    if (ua.indexOf('Windows') > -1) {
      osName = 'Windows';
    } else if (ua.indexOf('Mac') > -1) {
      osName = 'macOS';
    } else if (ua.indexOf('Linux') > -1) {
      osName = 'Linux';
    } else if (ua.indexOf('Android') > -1) {
      osName = 'Android';
      isMobile = true;
    } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 || ua.indexOf('iPod') > -1) {
      osName = 'iOS';
      isMobile = true;
    }
    
    // Check for mobile
    if (!isMobile) {
      isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }
    
    // Update state
    setBrowserInfo({
      name: browserName,
      version: browserVersion,
      engine: engineName,
      os: osName,
      mobile: isMobile,
    });
  };
  
  // Check support for required features
  const checkFeatureSupport = (): FeatureSupport[] => {
    const checks: FeatureSupport[] = [];
    
    // Core browser APIs
    checks.push({
      api: 'ES6+ Support',
      supported: typeof Promise !== 'undefined' && typeof Symbol !== 'undefined',
      description: 'Modern JavaScript features (ES6+)',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/es6',
    });
    
    checks.push({
      api: 'Fetch API',
      supported: typeof fetch !== 'undefined',
      description: 'Modern network request API',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/fetch',
    });
    
    checks.push({
      api: 'localStorage',
      supported: typeof localStorage !== 'undefined',
      description: 'Local storage for data persistence',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/namevalue-storage',
    });
    
    // Modern web APIs
    checks.push({
      api: 'Service Worker API',
      supported: 'serviceWorker' in navigator,
      description: 'Required for offline support and PWA features',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/serviceworkers',
    });
    
    checks.push({
      api: 'WebSockets',
      supported: typeof WebSocket !== 'undefined',
      description: 'Required for real-time messaging features',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/websockets',
    });
    
    checks.push({
      api: 'CSS Grid',
      supported: CSS && CSS.supports && CSS.supports('display', 'grid'),
      description: 'Modern CSS layout system',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/css-grid',
    });
    
    checks.push({
      api: 'Flexbox',
      supported: CSS && CSS.supports && CSS.supports('display', 'flex'),
      description: 'Flexible box layout model',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/flexbox',
    });
    
    checks.push({
      api: 'Web Animations API',
      supported: typeof document.createElement('div').animate === 'function',
      description: 'Native browser animations',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/web-animation',
    });
    
    // PWA-related APIs
    checks.push({
      api: 'Web App Manifest',
      supported: 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window,
      description: 'Required for installable web apps',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/web-app-manifest',
    });
    
    checks.push({
      api: 'Push API',
      supported: 'PushManager' in window,
      description: 'Required for push notifications',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/push-api',
    });
    
    checks.push({
      api: 'Background Sync',
      supported: 'SyncManager' in window,
      description: 'Required for offline data synchronization',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/background-sync',
    });
    
    // Advanced browser APIs
    checks.push({
      api: 'Intersection Observer',
      supported: 'IntersectionObserver' in window,
      description: 'Used for lazy loading and scroll animations',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/intersectionobserver',
    });
    
    checks.push({
      api: 'ResizeObserver',
      supported: 'ResizeObserver' in window,
      description: 'Used for responsive components',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/resizeobserver',
    });
    
    checks.push({
      api: 'CSS Variables',
      supported: CSS && CSS.supports && CSS.supports('--test: 0'),
      description: 'Used for theme customization',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/css-variables',
    });
    
    checks.push({
      api: 'IndexedDB',
      supported: 'indexedDB' in window,
      description: 'Client-side database for offline data',
      critical: false,
      moreInfoUrl: 'https://caniuse.com/indexeddb',
    });
    
    // Wallet-related APIs
    checks.push({
      api: 'Web Crypto API',
      supported: 'crypto' in window && 'subtle' in window.crypto,
      description: 'Used for cryptographic operations',
      critical: true,
      moreInfoUrl: 'https://caniuse.com/cryptography',
    });
    
    // Sort by support status and criticality
    return checks.sort((a, b) => {
      // Sort unsupported critical features first
      if (!a.supported && a.critical && (b.supported || !b.critical)) return -1;
      if (!b.supported && b.critical && (a.supported || !a.critical)) return 1;
      
      // Then sort unsupported non-critical features
      if (!a.supported && !a.critical && b.supported) return -1;
      if (!b.supported && !b.critical && a.supported) return 1;
      
      // Then sort by api name
      return a.api.localeCompare(b.api);
    });
  };
  
  // Run checks on load if specified
  useEffect(() => {
    if (runOnLoad) {
      runChecks();
    }
  }, [runOnLoad]);
  
  // Calculate compatibility score
  const calculateScore = () => {
    const criticalFeatures = features.filter(f => f.critical);
    const criticalSupported = criticalFeatures.filter(f => f.supported).length;
    const criticalScore = criticalFeatures.length > 0 
      ? (criticalSupported / criticalFeatures.length) * 100 
      : 100;
    
    const nonCriticalFeatures = features.filter(f => !f.critical);
    const nonCriticalSupported = nonCriticalFeatures.filter(f => f.supported).length;
    const nonCriticalScore = nonCriticalFeatures.length > 0 
      ? (nonCriticalSupported / nonCriticalFeatures.length) * 100 
      : 100;
    
    // Weight critical features more heavily
    return Math.round((criticalScore * 0.7) + (nonCriticalScore * 0.3));
  };
  
  // Filtered features based on showUnsupported prop
  const filteredFeatures = showUnsupported 
    ? features.filter(f => !f.supported) 
    : features;
  
  // Get browser compatibility info
  const getBrowserCompatibilityInfo = () => {
    const criticalUnsupported = features.filter(f => f.critical && !f.supported).length;
    
    if (criticalUnsupported > 0) {
      return {
        status: 'incompatible',
        message: `${criticalUnsupported} critical features not supported.`,
        color: 'bg-red-100 text-red-700 border-red-300',
      };
    }
    
    const nonCriticalUnsupported = features.filter(f => !f.critical && !f.supported).length;
    
    if (nonCriticalUnsupported > 0) {
      return {
        status: 'partially-compatible',
        message: `All critical features supported. ${nonCriticalUnsupported} non-critical features missing.`,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      };
    }
    
    return {
      status: 'compatible',
      message: 'Fully compatible. All features supported.',
      color: 'bg-green-100 text-green-700 border-green-300',
    };
  };
  
  const compatibilityInfo = getBrowserCompatibilityInfo();
  
  return (
    <div className={cn(
      'browser-compatibility-checker border rounded-md overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Browser Compatibility</h2>
            <p className="text-sm text-gray-600">
              Checks support for required features
            </p>
          </div>
          
          {showControls && (
            <button
              onClick={runChecks}
              disabled={isChecking}
              className={cn(
                'px-4 py-2 rounded-md text-white',
                isChecking ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
              )}
            >
              {isChecking ? 'Checking...' : 'Run Checks'}
            </button>
          )}
        </div>
      </div>
      
      {/* Browser information */}
      {features.length > 0 && (
        <div className="p-4 border-b">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <h3 className="font-medium mb-2">Browser Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Browser:</span> {browserInfo.name} {browserInfo.version}</div>
                <div><span className="font-medium">Engine:</span> {browserInfo.engine}</div>
                <div><span className="font-medium">OS:</span> {browserInfo.os}</div>
                <div><span className="font-medium">Device:</span> {browserInfo.mobile ? 'Mobile' : 'Desktop'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Compatibility</h3>
              <div className={cn(
                'p-3 rounded-md border text-sm',
                compatibilityInfo.color
              )}>
                <div className="font-medium">
                  {compatibilityInfo.status === 'compatible' && 'Fully Compatible'}
                  {compatibilityInfo.status === 'partially-compatible' && 'Partially Compatible'}
                  {compatibilityInfo.status === 'incompatible' && 'Incompatible'}
                </div>
                <div className="mt-1">
                  {compatibilityInfo.message}
                </div>
                <div className="mt-2">
                  Compatibility Score: <span className="font-medium">{calculateScore()}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Feature support details */}
      <div className="p-4">
        {isChecking && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary-500 rounded-full mb-2"></div>
            <div>Checking browser compatibility...</div>
          </div>
        )}
        
        {!isChecking && features.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No checks have been run yet.
            {showControls && (
              <div>
                <button
                  onClick={runChecks}
                  className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Run Checks
                </button>
              </div>
            )}
          </div>
        )}
        
        {!isChecking && filteredFeatures.length > 0 && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Feature Support</h3>
              <div className="text-sm text-gray-500">
                Last checked: {lastChecked}
              </div>
            </div>
            
            <div className="overflow-hidden border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeatures.map((feature, index) => (
                    <tr key={index} className={feature.supported ? 'bg-white' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-sm">
                        {feature.moreInfoUrl ? (
                          <a 
                            href={feature.moreInfoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary-600 hover:underline"
                          >
                            {feature.api}
                          </a>
                        ) : (
                          feature.api
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs',
                            feature.supported 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {feature.supported ? 'Supported' : 'Not Supported'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs',
                          feature.critical 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-700'
                        )}>
                          {feature.critical ? 'Critical' : 'Optional'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {feature.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Show warning for critical unsupported features */}
            {features.some(f => f.critical && !f.supported) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 mt-3">
                <p className="font-medium">Warning: Critical features not supported</p>
                <p className="mt-1">This browser is missing critical features required by the application. Some functionality may not work correctly.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserCompatibilityChecker;