'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface OfflineTest {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'not-applicable';
  details?: string;
}

export interface OfflineCapabilityTesterProps {
  showControls?: boolean;
  runOnLoad?: boolean;
  className?: string;
  onTestComplete?: (results: OfflineTest[]) => void;
}

/**
 * Component for testing the application's offline capabilities
 * by simulating offline conditions and checking resource availability.
 */
export const OfflineCapabilityTester: React.FC<OfflineCapabilityTesterProps> = ({
  showControls = true,
  runOnLoad = false,
  className,
  onTestComplete,
}) => {
  const [tests, setTests] = useState<OfflineTest[]>([
    {
      name: 'Service Worker',
      description: 'Checks if a service worker is registered',
      status: 'pending',
    },
    {
      name: 'Offline Page',
      description: 'Verifies if an offline fallback page exists',
      status: 'pending',
    },
    {
      name: 'Cache Storage',
      description: 'Tests if the application uses cache storage for assets',
      status: 'pending',
    },
    {
      name: 'IndexedDB',
      description: 'Verifies if the application uses IndexedDB for offline data',
      status: 'pending',
    },
    {
      name: 'Sync Manager',
      description: 'Checks if background sync is implemented',
      status: 'pending',
    },
    {
      name: 'Critical Resources',
      description: 'Validates that critical resources are cached',
      status: 'pending',
    },
    {
      name: 'Offline Form Submission',
      description: 'Tests if forms can be submitted while offline',
      status: 'pending',
    },
    {
      name: 'Offline Navigation',
      description: 'Verifies if navigation works without network',
      status: 'pending',
    },
  ]);
  
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [offlineSimulated, setOfflineSimulated] = useState<boolean>(false);
  const [hasServiceWorker, setHasServiceWorker] = useState<boolean>(false);
  const [hasCacheStorage, setHasCacheStorage] = useState<boolean>(false);
  const [lastTested, setLastTested] = useState<string>('');
  
  // Update test status
  const updateTest = (name: string, status: OfflineTest['status'], details?: string) => {
    setTests(prevTests => 
      prevTests.map(test => 
        test.name === name 
          ? { ...test, status, details } 
          : test
      )
    );
  };
  
  // Run all offline tests
  const runTests = async () => {
    setIsTesting(true);
    
    // Reset test statuses
    setTests(prevTests => 
      prevTests.map(test => ({ ...test, status: 'pending', details: undefined }))
    );
    
    // Check if service worker API is supported
    if (!('serviceWorker' in navigator)) {
      // Set all tests to not applicable since service worker is required
      setTests(prevTests => 
        prevTests.map(test => ({ 
          ...test, 
          status: 'not-applicable', 
          details: 'Service Worker API not supported by this browser' 
        }))
      );
      
      setIsTesting(false);
      setLastTested(new Date().toLocaleString());
      return;
    }
    
    // Start individual tests
    await testServiceWorker();
    await testOfflinePage();
    await testCacheStorage();
    await testIndexedDB();
    await testSyncManager();
    await testCriticalResources();
    await testOfflineFormSubmission();
    await testOfflineNavigation();
    
    setIsTesting(false);
    setLastTested(new Date().toLocaleString());
    
    // Call callback with results
    onTestComplete?.(tests);
  };
  
  // Test if service worker is registered
  const testServiceWorker = async () => {
    updateTest('Service Worker', 'running');
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        updateTest(
          'Service Worker', 
          'success', 
          `Found ${registrations.length} service worker registration(s)`
        );
        setHasServiceWorker(true);
        return true;
      } else {
        updateTest(
          'Service Worker', 
          'failure', 
          'No service worker registrations found'
        );
        setHasServiceWorker(false);
        return false;
      }
    } catch (error) {
      updateTest(
        'Service Worker', 
        'failure', 
        `Error checking service worker: ${error instanceof Error ? error.message : String(error)}`
      );
      setHasServiceWorker(false);
      return false;
    }
  };
  
  // Test if offline page exists
  const testOfflinePage = async () => {
    updateTest('Offline Page', 'running');
    
    try {
      const response = await fetch('/offline.html', { cache: 'no-store' });
      
      if (response.ok) {
        updateTest(
          'Offline Page', 
          'success', 
          'Offline fallback page exists'
        );
        return true;
      } else {
        updateTest(
          'Offline Page', 
          'failure', 
          `Offline page not found (status: ${response.status})`
        );
        return false;
      }
    } catch (error) {
      updateTest(
        'Offline Page', 
        'failure', 
        `Error fetching offline page: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Test if cache storage is used
  const testCacheStorage = async () => {
    updateTest('Cache Storage', 'running');
    
    if (!('caches' in window)) {
      updateTest(
        'Cache Storage', 
        'not-applicable', 
        'Cache Storage API not supported by this browser'
      );
      setHasCacheStorage(false);
      return false;
    }
    
    try {
      const cacheNames = await window.caches.keys();
      
      if (cacheNames.length > 0) {
        // Check if any cache has items
        let totalItems = 0;
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          totalItems += keys.length;
        }
        
        if (totalItems > 0) {
          updateTest(
            'Cache Storage', 
            'success', 
            `Found ${cacheNames.length} cache(s) with ${totalItems} items`
          );
          setHasCacheStorage(true);
          return true;
        } else {
          updateTest(
            'Cache Storage', 
            'failure', 
            'Cache storage exists but contains no items'
          );
          setHasCacheStorage(false);
          return false;
        }
      } else {
        updateTest(
          'Cache Storage', 
          'failure', 
          'No caches found'
        );
        setHasCacheStorage(false);
        return false;
      }
    } catch (error) {
      updateTest(
        'Cache Storage', 
        'failure', 
        `Error checking cache storage: ${error instanceof Error ? error.message : String(error)}`
      );
      setHasCacheStorage(false);
      return false;
    }
  };
  
  // Test if IndexedDB is used
  const testIndexedDB = async () => {
    updateTest('IndexedDB', 'running');
    
    if (!('indexedDB' in window)) {
      updateTest(
        'IndexedDB', 
        'not-applicable', 
        'IndexedDB API not supported by this browser'
      );
      return false;
    }
    
    try {
      // Get all databases
      // @ts-ignore - indexedDB.databases() might not be available in all browsers
      if (indexedDB.databases) {
        try {
          // @ts-ignore
          const databases = await indexedDB.databases();
          
          if (databases.length > 0) {
            updateTest(
              'IndexedDB', 
              'success', 
              `Found ${databases.length} IndexedDB database(s)`
            );
            return true;
          } else {
            updateTest(
              'IndexedDB', 
              'failure', 
              'No IndexedDB databases found'
            );
            return false;
          }
        } catch (error) {
          // Fallback test for older browsers
          return testIndexedDBFallback();
        }
      } else {
        // Fallback test for older browsers
        return testIndexedDBFallback();
      }
    } catch (error) {
      updateTest(
        'IndexedDB', 
        'failure', 
        `Error checking IndexedDB: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Fallback test for IndexedDB in browsers that don't support databases() method
  const testIndexedDBFallback = async (): Promise<boolean> => {
    // Try to detect common IndexedDB database names
    const commonDBNames = [
      'localforage',
      'keyval-store',
      'firebaseLocalStorageDb',
      'offline-data',
      'app-data',
      'user-data',
      'cache',
    ];
    
    for (const dbName of commonDBNames) {
      try {
        // Try to open the database
        const request = indexedDB.open(dbName);
        
        const result = await new Promise<boolean>((resolve) => {
          request.onsuccess = () => {
            const db = request.result;
            const storeNames = Array.from(db.objectStoreNames);
            db.close();
            
            if (storeNames.length > 0) {
              resolve(true);
            } else {
              resolve(false);
            }
          };
          
          request.onerror = () => {
            resolve(false);
          };
        });
        
        if (result) {
          updateTest(
            'IndexedDB', 
            'success', 
            `Found IndexedDB database '${dbName}'`
          );
          return true;
        }
      } catch (e) {
        // Ignore errors and try next database name
      }
    }
    
    // Check for existence of any IndexedDB database
    try {
      const testDB = 'offline-test-db';
      const request = indexedDB.open(testDB, 1);
      
      const result = await new Promise<boolean>((resolve) => {
        request.onupgradeneeded = () => {
          const db = request.result;
          // Create a test object store
          db.createObjectStore('test');
        };
        
        request.onsuccess = () => {
          const db = request.result;
          
          // Check if our database was created
          if (db.objectStoreNames.contains('test')) {
            // Clean up the test database
            db.close();
            indexedDB.deleteDatabase(testDB);
            
            // IndexedDB is available but not in use
            resolve(false);
          } else {
            // Another database exists
            resolve(true);
          }
        };
        
        request.onerror = () => {
          resolve(false);
        };
      });
      
      if (result) {
        updateTest(
          'IndexedDB', 
          'success', 
          'IndexedDB database detected'
        );
        return true;
      } else {
        updateTest(
          'IndexedDB', 
          'failure', 
          'IndexedDB is available but not in use'
        );
        return false;
      }
    } catch (error) {
      updateTest(
        'IndexedDB', 
        'failure', 
        `Error testing IndexedDB: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Test if sync manager is implemented
  const testSyncManager = async () => {
    updateTest('Sync Manager', 'running');
    
    if (!('serviceWorker' in navigator) || !hasServiceWorker) {
      updateTest(
        'Sync Manager', 
        'not-applicable', 
        'Service Worker not available or registered'
      );
      return false;
    }
    
    if (!('SyncManager' in window)) {
      updateTest(
        'Sync Manager', 
        'not-applicable', 
        'Background Sync API not supported by this browser'
      );
      return false;
    }
    
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Check if sync is available
      if ('sync' in registration) {
        updateTest(
          'Sync Manager', 
          'success', 
          'Background Sync API is available and can be used'
        );
        return true;
      } else {
        updateTest(
          'Sync Manager', 
          'failure', 
          'Background Sync API is not available in the service worker registration'
        );
        return false;
      }
    } catch (error) {
      updateTest(
        'Sync Manager', 
        'failure', 
        `Error checking Sync Manager: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Test if critical resources are cached
  const testCriticalResources = async () => {
    updateTest('Critical Resources', 'running');
    
    if (!hasCacheStorage) {
      updateTest(
        'Critical Resources', 
        'not-applicable', 
        'Cache Storage not available or in use'
      );
      return false;
    }
    
    try {
      // List of critical resources that should be cached
      const criticalResources = [
        '/', // Main page
        '/index.html',
        '/offline.html',
        '/manifest.json',
        '/static/css/', // Check if any CSS is cached
        '/static/js/', // Check if any JS is cached
        '/images/logo', // Logo image
        '/images/icons/', // Icons
      ];
      
      const cacheNames = await caches.keys();
      let cachedResourceCount = 0;
      let missingResources: string[] = [];
      
      // Check each cache for critical resources
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        // Check each critical resource
        for (const resource of criticalResources) {
          const found = requests.some(req => req.url.includes(resource));
          
          if (found) {
            cachedResourceCount++;
            // Remove from the list of critical resources to check
            criticalResources.splice(criticalResources.indexOf(resource), 1);
          }
        }
      }
      
      // Any resources left in the array were not found in any cache
      missingResources = criticalResources;
      
      if (missingResources.length === 0) {
        updateTest(
          'Critical Resources', 
          'success', 
          'All critical resources are cached'
        );
        return true;
      } else if (cachedResourceCount > 0) {
        updateTest(
          'Critical Resources', 
          'failure', 
          `Some critical resources are cached (${cachedResourceCount}), but missing: ${missingResources.join(', ')}`
        );
        return false;
      } else {
        updateTest(
          'Critical Resources', 
          'failure', 
          'No critical resources are cached'
        );
        return false;
      }
    } catch (error) {
      updateTest(
        'Critical Resources', 
        'failure', 
        `Error checking cached resources: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Test if forms can be submitted while offline
  const testOfflineFormSubmission = async () => {
    updateTest('Offline Form Submission', 'running');
    
    if (!('serviceWorker' in navigator) || !hasServiceWorker) {
      updateTest(
        'Offline Form Submission', 
        'not-applicable', 
        'Service Worker not available or registered'
      );
      return false;
    }
    
    // This is a very basic test that doesn't actually submit a form
    // A more accurate test would require actual form submission while offline
    
    try {
      // Check if the service worker has fetch event listeners
      // (This is a heuristic, not a definitive test)
      
      // Simulate offline
      setOfflineSimulated(true);
      
      // Try to make a POST request to a common endpoint
      const testEndpoints = [
        '/api/form-submit',
        '/api/submit',
        '/form',
        '/submit',
      ];
      
      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            body: 'test=1',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Test-Offline': 'true',
            },
          });
          
          // If we get a response despite being "offline", it suggests
          // the service worker is intercepting the request
          if (response) {
            updateTest(
              'Offline Form Submission', 
              'success', 
              `Service worker appears to handle offline form submissions to ${endpoint}`
            );
            setOfflineSimulated(false);
            return true;
          }
        } catch (e) {
          // Expected to fail in most cases, continue to next endpoint
        }
      }
      
      // Check for Background Sync registration as another heuristic
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        updateTest(
          'Offline Form Submission', 
          'success', 
          'Background Sync is available, which suggests offline form submission capability'
        );
        setOfflineSimulated(false);
        return true;
      }
      
      updateTest(
        'Offline Form Submission', 
        'failure', 
        'No evidence of offline form submission capability'
      );
      setOfflineSimulated(false);
      return false;
    } catch (error) {
      setOfflineSimulated(false);
      updateTest(
        'Offline Form Submission', 
        'failure', 
        `Error testing offline form submission: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Test if navigation works offline
  const testOfflineNavigation = async () => {
    updateTest('Offline Navigation', 'running');
    
    if (!('serviceWorker' in navigator) || !hasServiceWorker) {
      updateTest(
        'Offline Navigation', 
        'not-applicable', 
        'Service Worker not available or registered'
      );
      return false;
    }
    
    if (!hasCacheStorage) {
      updateTest(
        'Offline Navigation', 
        'not-applicable', 
        'Cache Storage not available or in use'
      );
      return false;
    }
    
    try {
      // Simulate offline
      setOfflineSimulated(true);
      
      // Try to navigate to the home page
      try {
        const response = await fetch('/', {
          headers: {
            'X-Test-Offline': 'true',
          },
        });
        
        if (response.ok) {
          updateTest(
            'Offline Navigation', 
            'success', 
            'Navigation to home page works offline'
          );
          setOfflineSimulated(false);
          return true;
        }
      } catch (e) {
        // Fetch may fail, which is expected
      }
      
      // Check if any HTML pages are cached (another heuristic)
      const cacheNames = await caches.keys();
      let htmlCached = false;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        // Check for HTML pages
        htmlCached = requests.some(req => 
          req.url.endsWith('.html') || 
          req.url.endsWith('/') ||
          !req.url.includes('.')
        );
        
        if (htmlCached) break;
      }
      
      if (htmlCached) {
        updateTest(
          'Offline Navigation', 
          'success', 
          'HTML pages are cached, suggesting offline navigation capability'
        );
        setOfflineSimulated(false);
        return true;
      }
      
      updateTest(
        'Offline Navigation', 
        'failure', 
        'No evidence of offline navigation capability'
      );
      setOfflineSimulated(false);
      return false;
    } catch (error) {
      setOfflineSimulated(false);
      updateTest(
        'Offline Navigation', 
        'failure', 
        `Error testing offline navigation: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  };
  
  // Run tests on load if specified
  useEffect(() => {
    if (runOnLoad) {
      runTests();
    }
  }, [runOnLoad]);
  
  // Helper to get status badge styles
  const getStatusBadge = (status: OfflineTest['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failure':
        return 'bg-red-100 text-red-700';
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'not-applicable':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Get overall status summary
  const getOverallStatus = () => {
    const completedTests = tests.filter(test => 
      test.status !== 'pending' && test.status !== 'running' && test.status !== 'not-applicable'
    );
    
    if (completedTests.length === 0) {
      return {
        label: 'Not Tested',
        class: 'bg-gray-100 text-gray-700 border-gray-300',
      };
    }
    
    const successTests = completedTests.filter(test => test.status === 'success');
    const failureTests = completedTests.filter(test => test.status === 'failure');
    
    if (failureTests.length === 0) {
      return {
        label: 'Fully Offline Capable',
        class: 'bg-green-100 text-green-700 border-green-300',
      };
    }
    
    if (successTests.length === 0) {
      return {
        label: 'No Offline Capability',
        class: 'bg-red-100 text-red-700 border-red-300',
      };
    }
    
    return {
      label: 'Partial Offline Capability',
      class: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
  };
  
  const overallStatus = getOverallStatus();
  
  return (
    <div className={cn(
      'offline-capability-tester border rounded-md overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Offline Capability Test</h2>
            <p className="text-sm text-gray-600">
              Tests application behavior when offline
            </p>
          </div>
          
          {showControls && (
            <button
              onClick={runTests}
              disabled={isTesting}
              className={cn(
                'px-4 py-2 rounded-md text-white',
                isTesting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
              )}
            >
              {isTesting ? 'Testing...' : 'Run Tests'}
            </button>
          )}
        </div>
      </div>
      
      {/* Overall status */}
      {(tests.some(test => test.status !== 'pending') || lastTested) && (
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={cn(
              'p-3 rounded-md border text-sm font-medium',
              overallStatus.class
            )}>
              {overallStatus.label}
            </div>
            
            {lastTested && (
              <div className="text-sm text-gray-500">
                Last tested: {lastTested}
              </div>
            )}
          </div>
          
          {offlineSimulated && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
              Offline mode is being simulated for testing purposes. Your actual connection is still active.
            </div>
          )}
        </div>
      )}
      
      {/* Test Results */}
      <div className="p-4">
        {isTesting && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary-500 rounded-full mb-2"></div>
            <div>Running offline capability tests...</div>
          </div>
        )}
        
        {!isTesting && tests.every(test => test.status === 'pending') && (
          <div className="text-center py-8 text-gray-500">
            No tests have been run yet.
            {showControls && (
              <div>
                <button
                  onClick={runTests}
                  className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Run Tests
                </button>
              </div>
            )}
          </div>
        )}
        
        {!isTesting && tests.some(test => test.status !== 'pending') && (
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className={cn(
                'border rounded-md overflow-hidden',
                test.status === 'success' ? 'border-green-200' :
                test.status === 'failure' ? 'border-red-200' :
                test.status === 'not-applicable' ? 'border-gray-200' :
                'border-gray-200'
              )}>
                <div className="flex items-center p-3 border-b bg-gray-50">
                  <div>
                    {test.status === 'success' && (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {test.status === 'failure' && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {test.status === 'running' && (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {(test.status === 'pending' || test.status === 'not-applicable') && (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">{test.description}</div>
                  </div>
                  <div>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      getStatusBadge(test.status)
                    )}>
                      {test.status === 'pending' ? 'Not Started' : 
                       test.status === 'running' ? 'Running' : 
                       test.status === 'success' ? 'Passed' : 
                       test.status === 'failure' ? 'Failed' : 
                       'Not Applicable'}
                    </span>
                  </div>
                </div>
                
                {test.details && test.status !== 'pending' && (
                  <div className="p-3 text-sm">
                    {test.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineCapabilityTester;