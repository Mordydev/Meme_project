'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ConnectionType = 'wifi' | '4g' | '3g' | '2g' | 'slow' | 'unknown';
export type NetworkTier = 'high' | 'medium' | 'low' | 'offline' | 'unknown';

export interface NetworkState {
  isOnline: boolean;
  connectionType: ConnectionType;
  effectiveConnectionType: string;
  downlink: number; // in Mbps
  saveData: boolean;
  networkTier: NetworkTier;
  lastChecked: Date;
}

interface NetworkContextType {
  network: NetworkState;
  checkConnection: () => Promise<NetworkState>;
}

const defaultNetworkState: NetworkState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
  connectionType: 'unknown',
  effectiveConnectionType: 'unknown',
  downlink: 0,
  saveData: false,
  networkTier: 'unknown',
  lastChecked: new Date(),
};

const NetworkContext = createContext<NetworkContextType>({
  network: defaultNetworkState,
  checkConnection: async () => defaultNetworkState,
});

export interface NetworkProviderProps {
  children: React.ReactNode;
  checkInterval?: number; // in ms, 0 to disable periodic checks
}

export function NetworkProvider({
  children,
  checkInterval = 30000, // 30 seconds by default
}: NetworkProviderProps) {
  const [network, setNetwork] = useState<NetworkState>(defaultNetworkState);
  
  // Check connection status and capabilities
  const checkConnection = async (): Promise<NetworkState> => {
    let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    
    // Use a ping to check actual connectivity (optional)
    if (isOnline) {
      try {
        // Try to fetch a small resource to verify connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('/api/ping', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
        });
        
        clearTimeout(timeoutId);
      } catch (err) {
        // If fetch fails, we might still be offline despite navigator.onLine
        isOnline = false;
      }
    }
    
    // Get connection information if available
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;
    
    let connectionType: ConnectionType = 'unknown';
    let effectiveConnectionType = 'unknown';
    let downlink = 0;
    let saveData = false;
    
    if (connection) {
      // Handle connection type
      connectionType = (connection.type as ConnectionType) || 'unknown';
      effectiveConnectionType = connection.effectiveType || 'unknown';
      downlink = connection.downlink || 0;
      saveData = !!connection.saveData;
    }
    
    // Calculate network tier based on connection quality
    let networkTier: NetworkTier = 'unknown';
    
    if (!isOnline) {
      networkTier = 'offline';
    } else if (effectiveConnectionType === '4g' || downlink > 5) {
      networkTier = 'high';
    } else if (effectiveConnectionType === '3g' || (downlink > 1 && downlink <= 5)) {
      networkTier = 'medium';
    } else {
      networkTier = 'low';
    }
    
    const newState: NetworkState = {
      isOnline,
      connectionType,
      effectiveConnectionType,
      downlink,
      saveData,
      networkTier,
      lastChecked: new Date(),
    };
    
    setNetwork(newState);
    return newState;
  };
  
  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetwork(prev => ({ ...prev, isOnline: true }));
      checkConnection();
    };
    
    const handleOffline = () => {
      setNetwork(prev => ({
        ...prev,
        isOnline: false,
        networkTier: 'offline',
      }));
    };
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes if supported
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', checkConnection);
    }
    
    // Initial connection check
    checkConnection();
    
    // Set up periodic connection checks if enabled
    let intervalId: NodeJS.Timeout | undefined;
    
    if (checkInterval > 0) {
      intervalId = setInterval(checkConnection, checkInterval);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', checkConnection);
      }
      
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkInterval]);
  
  return (
    <NetworkContext.Provider value={{ network, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  
  return context;
}
