'use client';

import { useState, useEffect } from 'react';
import { 
  detectBrowser, 
  getFeatureSupportSummary 
} from '../../lib/browser-compatibility';
import { 
  detectDeviceCapabilities 
} from '../../lib/performance/device-capabilities';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { usePerformanceConfig } from '../../hooks/usePerformanceConfig';

/**
 * Cross-Platform Experience Verification Component
 * A comprehensive tool for testing and verifying cross-platform compatibility
 */
export function CrossPlatformVerification() {
  const [activeTab, setActiveTab] = useState<string>('device');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isWindowResizing, setIsWindowResizing] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Get various detection hooks
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const prefersReducedMotion = useReducedMotion();
  const { isOnline } = useOfflineStatus();
  const performanceConfig = usePerformanceConfig();
  
  // Detect browser and features
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [featureSupport, setFeatureSupport] = useState<any>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  
  useEffect(() => {
    // Get browser information
    const browser = detectBrowser();
    setBrowserInfo(browser);
    
    // Get feature support information
    const support = getFeatureSupportSummary();
    setFeatureSupport(support);
    
    // Get device capabilities
    const capabilities = detectDeviceCapabilities();
    setDeviceCapabilities(capabilities);
    
    // Get window size
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      let resizeTimeout: NodeJS.Timeout;
      
      const handleResize = () => {
        setIsWindowResizing(true);
        
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
        
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          setIsWindowResizing(false);
        }, 500);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
    }
  }, []);
  
  // Get feature test results
  const getAllFeatures = () => {
    return featureSupport?.allFeatures || [];
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!browserInfo || !featureSupport || !deviceCapabilities) {
    return null; // Still loading
  }

  return (
    <div className={`fixed bottom-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-tl-lg ${isExpanded ? 'w-full md:max-w-2xl' : 'w-auto'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-primary text-white rounded-tl-lg cursor-pointer" onClick={toggleExpanded}>
        <h3 className="text-sm font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Cross-Platform Verification
        </h3>
        <div className="flex items-center">
          {isOnline ? (
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Content (visible when expanded) */}
      {isExpanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'device' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('device')}
            >
              Device
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'browser' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('browser')}
            >
              Browser
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'features' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'performance' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="overflow-y-auto max-h-80">
            {/* Device Tab */}
            {activeTab === 'device' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Device Type</h4>
                    <p className="font-medium">
                      {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Operating System</h4>
                    <p className="font-medium">{browserInfo.os}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Screen Resolution</h4>
                    <p className="font-medium">
                      {windowSize.width} × {windowSize.height} px
                      {isWindowResizing && <span className="text-xs text-gray-500 ml-2">(Resizing...)</span>}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Device Pixel Ratio</h4>
                    <p className="font-medium">
                      {deviceCapabilities.devicePixelRatio.toFixed(2)}x
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Device Tier</h4>
                    <p className="font-medium capitalize">
                      {deviceCapabilities.tier}
                      {deviceCapabilities.tier === 'low' && (
                        <span className="ml-2 inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          Performance Limited
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Touch Enabled</h4>
                    <p className="font-medium">
                      {deviceCapabilities.touchEnabled ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-600">No</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Hardware Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Device Memory</h5>
                      <p className="font-medium">
                        {deviceCapabilities.memory ? `${deviceCapabilities.memory} GB` : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">CPU Cores</h5>
                      <p className="font-medium">
                        {deviceCapabilities.cores || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Network Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Connection Type</h5>
                      <p className="font-medium">
                        {deviceCapabilities.connectionType || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Online Status</h5>
                      <p className="font-medium">
                        {isOnline ? (
                          <span className="text-green-600">Online</span>
                        ) : (
                          <span className="text-red-600">Offline</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">User Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Reduced Motion</h5>
                      <p className="font-medium">
                        {prefersReducedMotion ? (
                          <span className="text-amber-600">Enabled</span>
                        ) : (
                          <span className="text-gray-600">Disabled</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Color Scheme</h5>
                      <p className="font-medium">
                        {typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                          ? 'Dark'
                          : 'Light'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Browser Tab */}
            {activeTab === 'browser' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Browser Name</h4>
                    <p className="font-medium capitalize">{browserInfo.name}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Browser Version</h4>
                    <p className="font-medium">{browserInfo.version}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Compatibility Status</h4>
                  <div className="mt-2">
                    {browserInfo.supported ? (
                      browserInfo.partialSupport ? (
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                          <span className="font-medium">Partial Support</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                          <span className="font-medium">Fully Supported</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span className="font-medium">Not Supported</span>
                      </div>
                    )}
                  </div>
                  
                  {(browserInfo.potentialIssues.length > 0) && (
                    <div className="mt-4">
                      <h5 className="text-xs text-gray-500 mb-2">Potential Issues</h5>
                      <ul className="text-sm space-y-1">
                        {browserInfo.potentialIssues.slice(0, 3).map((issue: string, index: number) => (
                          <li key={index} className="text-amber-700 dark:text-amber-500">
                            • {issue}
                          </li>
                        ))}
                        {browserInfo.potentialIssues.length > 3 && (
                          <li className="text-gray-500">
                            • And {browserInfo.potentialIssues.length - 3} more issues...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">JavaScript Support</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Promises</h5>
                      <p className="font-medium">
                        {typeof Promise !== 'undefined' ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Async/Await</h5>
                      <p className="font-medium">
                        {(() => {
                          try {
                            eval('async () => {}');
                            return <span className="text-green-600">Supported</span>;
                          } catch (e) {
                            return <span className="text-red-600">Not Supported</span>;
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">ES6 Features</h5>
                      <p className="font-medium">
                        {(() => {
                          try {
                            eval('const { a } = { a: 1 }');
                            return <span className="text-green-600">Supported</span>;
                          } catch (e) {
                            return <span className="text-red-600">Not Supported</span>;
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Optional Chaining</h5>
                      <p className="font-medium">
                        {(() => {
                          try {
                            eval('const a = {}?.b');
                            return <span className="text-green-600">Supported</span>;
                          } catch (e) {
                            return <span className="text-red-600">Not Supported</span>;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">CSS Support</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Flexbox</h5>
                      <p className="font-medium">
                        {window.CSS && CSS.supports && CSS.supports('display', 'flex') ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Grid</h5>
                      <p className="font-medium">
                        {window.CSS && CSS.supports && CSS.supports('display', 'grid') ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">CSS Variables</h5>
                      <p className="font-medium">
                        {window.CSS && CSS.supports && CSS.supports('--a', '0') ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">CSS Animations</h5>
                      <p className="font-medium">
                        {window.CSS && CSS.supports && CSS.supports('animation', '0s') ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Feature Support Summary</h4>
                  <div className="mt-2">
                    {featureSupport.fullSupport ? (
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                        <span className="font-medium">All features supported</span>
                      </div>
                    ) : featureSupport.criticalSupport ? (
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                        <span className="font-medium">Critical features supported, some limitations</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span className="font-medium">Missing critical features</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Feature Details</h4>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="text-left py-2 px-2">Feature</th>
                          <th className="text-center py-2 px-2">Support</th>
                          <th className="text-center py-2 px-2">Critical</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {getAllFeatures().map((feature: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                            <td className="text-left py-2 px-2 text-sm">{feature.feature}</td>
                            <td className="text-center py-2 px-2">
                              {feature.supported ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                              ) : (
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                              )}
                            </td>
                            <td className="text-center py-2 px-2">
                              {feature.critical ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                              ) : (
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">PWA Capabilities</h4>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Service Worker</h5>
                      <p className="font-medium">
                        {'serviceWorker' in navigator ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Web App Manifest</h5>
                      <p className="font-medium">
                        {document.querySelector('link[rel="manifest"]') ? (
                          <span className="text-green-600">Implemented</span>
                        ) : (
                          <span className="text-red-600">Not Implemented</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Installable</h5>
                      <p className="font-medium">
                        {'BeforeInstallPromptEvent' in window ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Push Notifications</h5>
                      <p className="font-medium">
                        {'PushManager' in window ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Offline Capabilities</h4>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">IndexedDB</h5>
                      <p className="font-medium">
                        {'indexedDB' in window ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Local Storage</h5>
                      <p className="font-medium">
                        {'localStorage' in window ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Session Storage</h5>
                      <p className="font-medium">
                        {'sessionStorage' in window ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs text-gray-500 mb-1">Background Sync</h5>
                      <p className="font-medium">
                        {'serviceWorker' in navigator && 'SyncManager' in window ? (
                          <span className="text-green-600">Supported</span>
                        ) : (
                          <span className="text-red-600">Not Supported</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Performance Configuration</h4>
                  <div className="mt-2">
                    <h5 className="text-xs text-gray-500 mb-1">Animation Settings</h5>
                    <div className="text-sm">
                      <p><span className="font-medium">Enabled:</span> {performanceConfig.animations.enabled ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Complexity:</span> {performanceConfig.animations.complexity}</p>
                      {performanceConfig.animations.frameThrottling && (
                        <p><span className="font-medium">Frame Throttling:</span> {performanceConfig.animations.frameThrottling} FPS</p>
                      )}
                    </div>
                    
                    <h5 className="text-xs text-gray-500 mt-3 mb-1">Image Settings</h5>
                    <div className="text-sm">
                      <p><span className="font-medium">Format:</span> {performanceConfig.imageFormat}</p>
                      <p><span className="font-medium">Quality:</span> {performanceConfig.imageQuality}%</p>
                      <p><span className="font-medium">Lazy Loading:</span> {performanceConfig.lazyLoadOptions.enabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    
                    <h5 className="text-xs text-gray-500 mt-3 mb-1">Infinite Scroll</h5>
                    <div className="text-sm">
                      <p><span className="font-medium">Enabled:</span> {performanceConfig.infiniteScroll.enabled ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Items Per Page:</span> {performanceConfig.infiniteScroll.itemsPerPage}</p>
                      {performanceConfig.infiniteScroll.maxPages && (
                        <p><span className="font-medium">Max Pages:</span> {performanceConfig.infiniteScroll.maxPages}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Performance Metrics</h4>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 italic">Click the button below to run a quick performance test</p>
                    <button 
                      className="mt-2 px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={() => {
                        // In a real implementation, this would run actual performance benchmarks
                        alert('This would run performance benchmarks in a real implementation');
                      }}
                    >
                      Run Quick Test
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Memory Usage</h4>
                  <div className="mt-2">
                    {typeof (performance as any).memory !== 'undefined' ? (
                      <div className="text-sm">
                        <p>
                          <span className="font-medium">Used JS Heap:</span> 
                          {Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))} MB
                        </p>
                        <p>
                          <span className="font-medium">JS Heap Limit:</span> 
                          {Math.round((performance as any).memory.jsHeapSizeLimit / (1024 * 1024))} MB
                        </p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600" 
                            style={{
                              width: `${((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Memory usage information not available in this browser</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Web Vitals</h4>
                  <div className="mt-2 text-sm">
                    <p className="text-gray-500 italic">Web Vitals metrics would be displayed here in a real implementation.</p>
                    <p className="text-gray-500 italic mt-1">This would include LCP, FID, CLS, and other metrics.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
