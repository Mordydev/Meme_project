'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface PWACheckResult {
  test: string;
  passed: boolean;
  details?: string;
  critical: boolean;
}

export interface PWAVerifierProps {
  manifestUrl?: string;
  serviceWorkerPath?: string;
  showControls?: boolean;
  runOnLoad?: boolean;
  className?: string;
}

/**
 * A component that verifies PWA implementation details,
 * checking manifest.json, service worker, and other PWA requirements.
 */
export const PWAVerifier: React.FC<PWAVerifierProps> = ({
  manifestUrl = '/manifest.json',
  serviceWorkerPath = '/sw.js',
  showControls = true,
  runOnLoad = true,
  className,
}) => {
  const [results, setResults] = useState<PWACheckResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [lastChecked, setLastChecked] = useState<string>('');
  
  // Run checks
  const runChecks = async () => {
    setIsChecking(true);
    const checkResults: PWACheckResult[] = [];
    const startTime = Date.now();
    
    try {
      // Check manifest.json
      await checkManifest(manifestUrl, checkResults);
      
      // Check service worker
      await checkServiceWorker(serviceWorkerPath, checkResults);
      
      // Check PWA installability
      await checkInstallability(checkResults);
      
      // Check offline capabilities
      await checkOfflineCapabilities(checkResults);
      
      // Calculate score
      calculateScore(checkResults);
    } catch (error) {
      console.error('Error running PWA checks:', error);
      
      checkResults.push({
        test: 'Check execution',
        passed: false,
        details: `Error running checks: ${error instanceof Error ? error.message : String(error)}`,
        critical: true,
      });
    }
    
    // Sort results: critical failures first, then by pass/fail
    checkResults.sort((a, b) => {
      if (a.critical && !a.passed && (!b.critical || b.passed)) return -1;
      if (b.critical && !b.passed && (!a.critical || a.passed)) return 1;
      if (a.passed && !b.passed) return 1;
      if (!a.passed && b.passed) return -1;
      return 0;
    });
    
    setResults(checkResults);
    setIsChecking(false);
    setLastChecked(new Date().toLocaleString());
  };
  
  // Check manifest.json
  const checkManifest = async (url: string, results: PWACheckResult[]) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        results.push({
          test: 'Manifest Availability',
          passed: false,
          details: `Manifest file not found at ${url}. Status: ${response.status}`,
          critical: true,
        });
        return;
      }
      
      results.push({
        test: 'Manifest Availability',
        passed: true,
        details: `Manifest found at ${url}`,
        critical: true,
      });
      
      try {
        const manifest = await response.json();
        
        // Check required fields
        const requiredFields = ['name', 'short_name', 'icons', 'start_url', 'display'];
        const missingFields = requiredFields.filter(field => !manifest[field]);
        
        if (missingFields.length > 0) {
          results.push({
            test: 'Manifest Required Fields',
            passed: false,
            details: `Manifest missing required fields: ${missingFields.join(', ')}`,
            critical: true,
          });
        } else {
          results.push({
            test: 'Manifest Required Fields',
            passed: true,
            details: 'Manifest contains all required fields',
            critical: true,
          });
        }
        
        // Check icons
        if (manifest.icons && Array.isArray(manifest.icons)) {
          const hasSizes = manifest.icons.some(icon => icon.sizes === '192x192') &&
                          manifest.icons.some(icon => icon.sizes === '512x512');
          
          results.push({
            test: 'Manifest Icons',
            passed: hasSizes,
            details: hasSizes 
              ? 'Manifest includes 192x192 and 512x512 icons' 
              : 'Manifest is missing 192x192 and/or 512x512 icons',
            critical: true,
          });
          
          const hasMaskable = manifest.icons.some(icon => 
            icon.purpose && icon.purpose.includes('maskable')
          );
          
          results.push({
            test: 'Maskable Icons',
            passed: hasMaskable,
            details: hasMaskable 
              ? 'Manifest includes maskable icons' 
              : 'Manifest does not include maskable icons',
            critical: false,
          });
        } else {
          results.push({
            test: 'Manifest Icons',
            passed: false,
            details: 'Manifest is missing icons array',
            critical: true,
          });
        }
        
        // Check display mode
        const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
        const hasValidDisplayMode = manifest.display && validDisplayModes.includes(manifest.display);
        
        results.push({
          test: 'Display Mode',
          passed: hasValidDisplayMode,
          details: hasValidDisplayMode 
            ? `Display mode is set to ${manifest.display}` 
            : 'Display mode is missing or invalid',
          critical: false,
        });
        
        // Check theme color
        results.push({
          test: 'Theme Color',
          passed: Boolean(manifest.theme_color),
          details: manifest.theme_color 
            ? `Theme color is set to ${manifest.theme_color}` 
            : 'Theme color is not set',
          critical: false,
        });
        
        // Check background color
        results.push({
          test: 'Background Color',
          passed: Boolean(manifest.background_color),
          details: manifest.background_color 
            ? `Background color is set to ${manifest.background_color}` 
            : 'Background color is not set',
          critical: false,
        });
        
        // Check description
        results.push({
          test: 'Description',
          passed: Boolean(manifest.description),
          details: manifest.description 
            ? 'Description is provided' 
            : 'Description is not provided',
          critical: false,
        });
      } catch (error) {
        results.push({
          test: 'Manifest Parsing',
          passed: false,
          details: `Failed to parse manifest as JSON: ${error instanceof Error ? error.message : String(error)}`,
          critical: true,
        });
      }
    } catch (error) {
      results.push({
        test: 'Manifest Fetch',
        passed: false,
        details: `Failed to fetch manifest: ${error instanceof Error ? error.message : String(error)}`,
        critical: true,
      });
    }
  };
  
  // Check service worker
  const checkServiceWorker = async (path: string, results: PWACheckResult[]) => {
    if (!('serviceWorker' in navigator)) {
      results.push({
        test: 'Service Worker API',
        passed: false,
        details: 'Service Worker API is not available in this browser',
        critical: true,
      });
      return;
    }
    
    results.push({
      test: 'Service Worker API',
      passed: true,
      details: 'Service Worker API is supported',
      critical: true,
    });
    
    try {
      // Check if service worker file exists
      const response = await fetch(path);
      
      if (!response.ok) {
        results.push({
          test: 'Service Worker File',
          passed: false,
          details: `Service worker file not found at ${path}. Status: ${response.status}`,
          critical: true,
        });
        return;
      }
      
      results.push({
        test: 'Service Worker File',
        passed: true,
        details: `Service worker file found at ${path}`,
        critical: true,
      });
      
      // Check if service worker is registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      const isRegistered = registrations.length > 0;
      
      results.push({
        test: 'Service Worker Registration',
        passed: isRegistered,
        details: isRegistered 
          ? `${registrations.length} service worker(s) registered` 
          : 'No service worker is registered',
        critical: true,
      });
      
      // Check specific paths in registration scope
      if (isRegistered) {
        const scopesCovered = registrations.map(reg => reg.scope);
        
        results.push({
          test: 'Service Worker Scope',
          passed: true,
          details: `Service worker scopes: ${scopesCovered.join(', ')}`,
          critical: false,
        });
      }
    } catch (error) {
      results.push({
        test: 'Service Worker Check',
        passed: false,
        details: `Failed to check service worker: ${error instanceof Error ? error.message : String(error)}`,
        critical: true,
      });
    }
  };
  
  // Check if the app is installable
  const checkInstallability = async (results: PWACheckResult[]) => {
    try {
      if ('BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window) {
        results.push({
          test: 'Install Prompt Support',
          passed: true,
          details: 'Browser supports app installation prompt',
          critical: false,
        });
      } else {
        results.push({
          test: 'Install Prompt Support',
          passed: false,
          details: 'Browser does not support app installation prompt',
          critical: false,
        });
      }
      
      // Check for web app manifest link
      const manifestLink = document.querySelector('link[rel="manifest"]');
      results.push({
        test: 'Manifest Link',
        passed: manifestLink !== null,
        details: manifestLink 
          ? 'Manifest is linked in the HTML'
          : 'Manifest link is missing in the HTML',
        critical: true,
      });
      
      // Check for theme-color meta tag
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      results.push({
        test: 'Theme Color Meta Tag',
        passed: themeColorMeta !== null,
        details: themeColorMeta 
          ? `Theme color meta tag is set to ${themeColorMeta.getAttribute('content')}`
          : 'Theme color meta tag is missing',
        critical: false,
      });
      
      // Check for apple-touch-icon
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
      results.push({
        test: 'Apple Touch Icon',
        passed: appleTouchIcon !== null,
        details: appleTouchIcon 
          ? 'Apple touch icon is defined'
          : 'Apple touch icon is missing',
        critical: false,
      });
    } catch (error) {
      results.push({
        test: 'Installability Check',
        passed: false,
        details: `Failed to check installability: ${error instanceof Error ? error.message : String(error)}`,
        critical: false,
      });
    }
  };
  
  // Check offline capabilities
  const checkOfflineCapabilities = async (results: PWACheckResult[]) => {
    try {
      // Check for an offline HTML page
      const offlinePageResponse = await fetch('/offline.html');
      
      results.push({
        test: 'Offline Page',
        passed: offlinePageResponse.ok,
        details: offlinePageResponse.ok 
          ? 'Offline fallback page is available'
          : 'Offline fallback page is missing or not accessible',
        critical: false,
      });
      
      // Check if cache is available
      if ('caches' in window) {
        results.push({
          test: 'Cache API',
          passed: true,
          details: 'Cache API is supported',
          critical: false,
        });
        
        // Check existing caches
        try {
          const cacheNames = await window.caches.keys();
          
          results.push({
            test: 'Cache Usage',
            passed: cacheNames.length > 0,
            details: cacheNames.length > 0 
              ? `Found ${cacheNames.length} caches: ${cacheNames.join(', ')}`
              : 'No caches are currently in use',
            critical: false,
          });
        } catch (error) {
          results.push({
            test: 'Cache Check',
            passed: false,
            details: `Failed to check caches: ${error instanceof Error ? error.message : String(error)}`,
            critical: false,
          });
        }
      } else {
        results.push({
          test: 'Cache API',
          passed: false,
          details: 'Cache API is not supported',
          critical: false,
        });
      }
    } catch (error) {
      results.push({
        test: 'Offline Capabilities Check',
        passed: false,
        details: `Failed to check offline capabilities: ${error instanceof Error ? error.message : String(error)}`,
        critical: false,
      });
    }
  };
  
  // Calculate overall PWA score
  const calculateScore = (results: PWACheckResult[]) => {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const criticalTotal = results.filter(r => r.critical).length;
    const criticalPassed = results.filter(r => r.critical && r.passed).length;
    
    // Weighted score: critical tests are worth 70% of the score
    const criticalWeight = 0.7;
    const normalWeight = 0.3;
    
    const criticalScore = criticalTotal > 0 ? (criticalPassed / criticalTotal) * 100 : 0;
    const normalScore = (total - criticalTotal) > 0 ? ((passed - criticalPassed) / (total - criticalTotal)) * 100 : 0;
    
    const finalScore = (criticalScore * criticalWeight) + (normalScore * normalWeight);
    setScore(Math.round(finalScore));
  };
  
  // Run checks on load if specified
  useEffect(() => {
    if (runOnLoad) {
      runChecks();
    }
  }, [runOnLoad]);
  
  // Get score class
  const getScoreClass = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className={cn('pwa-verifier border rounded-md overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">PWA Verification</h2>
            <p className="text-sm text-gray-600">
              Checks Progressive Web App implementation details
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
      
      {/* Score */}
      {results.length > 0 && (
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="flex items-end">
              <span className={cn('text-3xl font-bold', getScoreClass(score))}>
                {score}
              </span>
              <span className="text-gray-500 ml-1">/100</span>
            </div>
            <div className="text-sm text-gray-600">
              PWA Score
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm">
              <span className="font-medium">{results.filter(r => r.passed).length}</span>
              {' / '}
              <span>{results.length}</span> checks passed
            </div>
            <div className="text-xs text-gray-500">
              Last checked: {lastChecked}
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      <div className="p-4">
        {isChecking && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary-500 rounded-full mb-2"></div>
            <div>Running PWA verification checks...</div>
          </div>
        )}
        
        {!isChecking && results.length === 0 && (
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
        
        {!isChecking && results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index}
                className={cn(
                  'p-3 rounded-md',
                  result.passed 
                    ? 'bg-green-50 border border-green-200' 
                    : result.critical 
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                )}
              >
                <div className="flex items-start">
                  <div className={cn(
                    'w-6 h-6 mr-2 rounded-full flex items-center justify-center flex-shrink-0',
                    result.passed 
                      ? 'bg-green-100 text-green-600' 
                      : result.critical 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-600'
                  )}>
                    {result.passed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <div className="font-medium">
                        {result.test}
                      </div>
                      {result.critical && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                          Critical
                        </span>
                      )}
                    </div>
                    
                    {result.details && (
                      <div className="text-sm mt-1 text-gray-600">
                        {result.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAVerifier;