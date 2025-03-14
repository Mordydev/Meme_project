'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';

// Action that was initiated while offline and needs to be synchronized
export interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  path: string;
  method: string;
}

// Offline cache entry for storing API responses
export interface CacheEntry {
  url: string;
  response: any;
  timestamp: string;
  expiry?: string;
  version?: string;
  headers?: Record<string, string>;
}

export interface OfflineContextType {
  // Status
  isOnline: boolean;
  wasOffline: boolean;
  isFirstLoad: boolean;
  isSynchronizing: boolean;
  syncProgress: number;
  
  // Data
  pendingActions: PendingAction[];
  cachedData: Record<string, CacheEntry>;
  storage: {
    available: boolean;
    used: number;
    quota: number;
    percentage: number;
  };
  
  // Functions
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => string;
  removePendingAction: (id: string) => void;
  syncPendingActions: () => Promise<boolean>;
  
  cacheResponse: (url: string, response: any, options?: { expiry?: number, headers?: Record<string, string> }) => void;
  getCachedResponse: (url: string) => CacheEntry | undefined;
  clearCache: () => void;
  invalidateCache: (pattern?: string) => void;
  
  // Settings
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  isOfflineModeEnabled: boolean;
  
  // Storage
  storeData: <T>(key: string, data: T) => Promise<void>;
  retrieveData: <T>(key: string) => Promise<T | null>;
  removeData: (key: string) => Promise<void>;
}

// Create context
const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export interface OfflineProviderProps {
  children: ReactNode;
  persistenceKey?: string;
  syncInterval?: number;
  cacheDuration?: number;
  maxCacheSize?: number;
  maxPendingActions?: number;
  onSyncComplete?: (success: boolean, actions: PendingAction[]) => void;
  onStorageQuotaExceeded?: () => void;
}

/**
 * Provider component that manages offline capabilities, including
 * connection status, offline data storage, and synchronization.
 */
export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
  persistenceKey = 'sk-offline-data',
  syncInterval = 30000, // 30 seconds
  cacheDuration = 86400000, // 24 hours
  maxCacheSize = 50 * 1024 * 1024, // 50MB
  maxPendingActions = 1000,
  onSyncComplete,
  onStorageQuotaExceeded,
}) => {
  const network = useNetwork();
  
  // State
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [cachedData, setCachedData] = useState<Record<string, CacheEntry>>({});
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);
  const [storage, setStorage] = useState({
    available: false,
    used: 0,
    quota: 0,
    percentage: 0,
  });
  
  // Check storage availability and usage
  useEffect(() => {
    const checkStorage = async () => {
      try {
        // Check if storage estimation is available
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          
          setStorage({
            available: true,
            used: estimate.usage || 0,
            quota: estimate.quota || 0,
            percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
          });
        } else {
          // Storage API not available
          setStorage({
            available: false,
            used: 0,
            quota: 0,
            percentage: 0,
          });
        }
      } catch (error) {
        console.error('Error checking storage:', error);
        setStorage({
          available: false,
          used: 0,
          quota: 0,
          percentage: 0,
        });
      }
    };
    
    checkStorage();
    
    // Set up periodic check
    const intervalId = setInterval(checkStorage, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Load cached data and pending actions from persistent storage
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Load pending actions
        const actionsJson = localStorage.getItem(`${persistenceKey}-actions`);
        if (actionsJson) {
          const actions = JSON.parse(actionsJson);
          setPendingActions(actions);
        }
        
        // Load cached data
        const cacheJson = localStorage.getItem(`${persistenceKey}-cache`);
        if (cacheJson) {
          const cache = JSON.parse(cacheJson);
          
          // Filter out expired cache entries
          const now = new Date().toISOString();
          const validCache = Object.entries(cache).reduce<Record<string, CacheEntry>>(
            (acc, [key, entry]) => {
              const cacheEntry = entry as CacheEntry;
              if (!cacheEntry.expiry || cacheEntry.expiry > now) {
                acc[key] = cacheEntry;
              }
              return acc;
            },
            {}
          );
          
          setCachedData(validCache);
        }
        
        // Load offline mode setting
        const offlineModeEnabled = localStorage.getItem(`${persistenceKey}-offline-mode`) === 'true';
        setIsOfflineModeEnabled(offlineModeEnabled);
        
        setIsFirstLoad(false);
      } catch (error) {
        console.error('Error loading persisted offline data:', error);
        setIsFirstLoad(false);
      }
    };
    
    loadPersistedData();
  }, [persistenceKey]);
  
  // Persist data when it changes
  useEffect(() => {
    // Skip saving on first load
    if (isFirstLoad) return;
    
    try {
      // Save pending actions
      localStorage.setItem(`${persistenceKey}-actions`, JSON.stringify(pendingActions));
      
      // Save cached data
      localStorage.setItem(`${persistenceKey}-cache`, JSON.stringify(cachedData));
      
      // Save offline mode setting
      localStorage.setItem(`${persistenceKey}-offline-mode`, isOfflineModeEnabled.toString());
    } catch (error) {
      console.error('Error persisting offline data:', error);
      onStorageQuotaExceeded?.();
    }
  }, [pendingActions, cachedData, isOfflineModeEnabled, persistenceKey, isFirstLoad, onStorageQuotaExceeded]);
  
  // Update online status and trigger sync when coming online
  useEffect(() => {
    // If transitioning from offline to online
    if (network.isOnline && wasOffline) {
      syncPendingActions();
    }
    
    // Update offline status
    setWasOffline(wasOffline || !network.isOnline);
  }, [network.isOnline, wasOffline]);
  
  // Periodically sync pending actions when online
  useEffect(() => {
    if (!network.isOnline || pendingActions.length === 0) return;
    
    const intervalId = setInterval(() => {
      syncPendingActions();
    }, syncInterval);
    
    return () => clearInterval(intervalId);
  }, [network.isOnline, pendingActions, syncInterval]);
  
  // Add a new pending action
  const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => {
    // Generate unique ID
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create pending action
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    // Add to pending actions
    setPendingActions(prev => {
      // Check if we've hit the maximum number of pending actions
      if (prev.length >= maxPendingActions) {
        // Remove oldest action
        const newActions = [...prev];
        newActions.shift();
        return [...newActions, pendingAction];
      }
      
      return [...prev, pendingAction];
    });
    
    return id;
  };
  
  // Remove a pending action
  const removePendingAction = (id: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== id));
  };
  
  // Synchronize pending actions with the server
  const syncPendingActions = async (): Promise<boolean> => {
    if (!network.isOnline || pendingActions.length === 0 || isSynchronizing) {
      return false;
    }
    
    setIsSynchronizing(true);
    setSyncProgress(0);
    
    const totalActions = pendingActions.length;
    let completedActions = 0;
    let successfulActions = 0;
    let failedActions: PendingAction[] = [];
    
    // Process actions in order
    const actionsToProcess = [...pendingActions];
    
    for (const action of actionsToProcess) {
      try {
        // Attempt to send the action to the server
        const response = await fetch(action.path, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.payload),
        });
        
        if (response.ok) {
          // Action successfully processed, remove from pending
          removePendingAction(action.id);
          successfulActions++;
        } else {
          // Server error, increment retry count
          const updatedAction = {
            ...action,
            retryCount: action.retryCount + 1,
          };
          
          // If too many retries, remove the action
          if (updatedAction.retryCount >= 5) {
            removePendingAction(action.id);
          } else {
            // Otherwise update the retry count
            setPendingActions(prev =>
              prev.map(a => (a.id === action.id ? updatedAction : a))
            );
          }
          
          failedActions.push(updatedAction);
        }
      } catch (error) {
        // Network error, increment retry count
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
        };
        
        // If too many retries, remove the action
        if (updatedAction.retryCount >= 5) {
          removePendingAction(action.id);
        } else {
          // Otherwise update the retry count
          setPendingActions(prev =>
            prev.map(a => (a.id === action.id ? updatedAction : a))
          );
        }
        
        failedActions.push(updatedAction);
      }
      
      // Update progress
      completedActions++;
      setSyncProgress(Math.round((completedActions / totalActions) * 100));
    }
    
    // Sync complete
    setIsSynchronizing(false);
    onSyncComplete?.(failedActions.length === 0, failedActions);
    
    return failedActions.length === 0;
  };
  
  // Cache a response
  const cacheResponse = (
    url: string,
    response: any,
    options?: { expiry?: number, headers?: Record<string, string> }
  ) => {
    const now = new Date();
    const expiry = options?.expiry
      ? new Date(now.getTime() + options.expiry).toISOString()
      : new Date(now.getTime() + cacheDuration).toISOString();
    
    const entry: CacheEntry = {
      url,
      response,
      timestamp: now.toISOString(),
      expiry,
      headers: options?.headers,
    };
    
    setCachedData(prev => {
      // Check if we need to clean up cache based on size
      const currentSize = JSON.stringify(prev).length;
      const newEntrySize = JSON.stringify(entry).length;
      
      if (currentSize + newEntrySize > maxCacheSize) {
        // Remove oldest entries to make room
        const entries = Object.entries(prev);
        entries.sort((a, b) => {
          return (a[1].timestamp < b[1].timestamp) ? -1 : 1;
        });
        
        let sizeToFree = (currentSize + newEntrySize) - maxCacheSize + 1024 * 1024; // Free extra 1MB
        let sizeFreed = 0;
        const entriesMap = { ...prev };
        
        for (const [key, entry] of entries) {
          const entrySize = JSON.stringify(entry).length;
          delete entriesMap[key];
          sizeFreed += entrySize;
          
          if (sizeFreed >= sizeToFree) {
            break;
          }
        }
        
        return {
          ...entriesMap,
          [url]: entry,
        };
      }
      
      return {
        ...prev,
        [url]: entry,
      };
    });
  };
  
  // Get a cached response
  const getCachedResponse = (url: string): CacheEntry | undefined => {
    const entry = cachedData[url];
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry is expired
    const now = new Date().toISOString();
    if (entry.expiry && entry.expiry < now) {
      // Remove expired entry
      setCachedData(prev => {
        const newCache = { ...prev };
        delete newCache[url];
        return newCache;
      });
      
      return undefined;
    }
    
    return entry;
  };
  
  // Clear the entire cache
  const clearCache = () => {
    setCachedData({});
  };
  
  // Invalidate cache entries matching a pattern
  const invalidateCache = (pattern?: string) => {
    if (!pattern) {
      clearCache();
      return;
    }
    
    setCachedData(prev => {
      const newCache = { ...prev };
      
      // Remove entries matching the pattern
      Object.keys(newCache).forEach(key => {
        if (key.includes(pattern)) {
          delete newCache[key];
        }
      });
      
      return newCache;
    });
  };
  
  // Enable offline mode
  const enableOfflineMode = () => {
    setIsOfflineModeEnabled(true);
  };
  
  // Disable offline mode
  const disableOfflineMode = () => {
    setIsOfflineModeEnabled(false);
  };
  
  // Store data in local storage
  const storeData = async <T,>(key: string, data: T): Promise<void> => {
    try {
      localStorage.setItem(`${persistenceKey}-${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  };
  
  // Retrieve data from local storage
  const retrieveData = async <T,>(key: string): Promise<T | null> => {
    try {
      const data = localStorage.getItem(`${persistenceKey}-${key}`);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  };
  
  // Remove data from local storage
  const removeData = async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(`${persistenceKey}-${key}`);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  };
  
  // Context value
  const value: OfflineContextType = {
    // Status
    isOnline: network.isOnline,
    wasOffline,
    isFirstLoad,
    isSynchronizing,
    syncProgress,
    
    // Data
    pendingActions,
    cachedData,
    storage,
    
    // Functions
    addPendingAction,
    removePendingAction,
    syncPendingActions,
    
    cacheResponse,
    getCachedResponse,
    clearCache,
    invalidateCache,
    
    // Settings
    enableOfflineMode,
    disableOfflineMode,
    isOfflineModeEnabled,
    
    // Storage
    storeData,
    retrieveData,
    removeData,
  };
  
  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

/**
 * Hook to use the offline context in components.
 */
export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  
  return context;
};

export default OfflineProvider;