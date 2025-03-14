'use client';

import { useState, useEffect } from 'react';

export type ConnectionType = 'wifi' | '4g' | '3g' | '2g' | 'slow' | 'unknown';
export type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

export interface NetworkState {
  isOnline: boolean;
  connectionType: ConnectionType;
  effectiveConnectionType: EffectiveConnectionType;
  downlink: number; // Mbps
  rtt: number; // ms (round-trip time)
  saveData: boolean;
  unsupportedNetworkInfo: boolean;
}

/**
 * Hook to detect network status and capabilities.
 * Provides information about online status, connection type, and quality.
 */
export function useNetwork(): NetworkState {
  // Initial state with conservative defaults
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    effectiveConnectionType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    unsupportedNetworkInfo: true, // Assume unsupported until detected
  });
  
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    
    // Get the connection API (different browsers have different implementations)
    const connection = 
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    
    // Update network state from connection info
    const updateNetworkInfo = () => {
      const online = navigator.onLine;
      
      if (connection) {
        // NetworkInformation API is supported
        const {
          type = 'unknown',
          effectiveType = 'unknown',
          downlink = 0,
          rtt = 0,
          saveData = false,
        } = connection;
        
        setNetworkState({
          isOnline: online,
          connectionType: type,
          effectiveConnectionType: effectiveType as EffectiveConnectionType,
          downlink,
          rtt,
          saveData,
          unsupportedNetworkInfo: false,
        });
      } else {
        // Only online status is supported
        setNetworkState(prevState => ({
          ...prevState,
          isOnline: online,
          unsupportedNetworkInfo: true,
        }));
      }
    };
    
    // Initial update
    updateNetworkInfo();
    
    // Listen for changes
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }
    
    // Periodic update (connection quality can change even if the type doesn't)
    const intervalId = setInterval(updateNetworkInfo, 10000); // Every 10 seconds
    
    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
      
      clearInterval(intervalId);
    };
  }, []);
  
  return networkState;
}

export default useNetwork;