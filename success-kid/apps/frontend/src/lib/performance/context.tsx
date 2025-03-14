'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import performanceMonitor, { 
  CoreWebVitalsMetrics, 
  PerformanceBudget,
  useWebVitalsReporting
} from './metrics';
import { useNetworkInfo } from './network-optimization';

// Define the context type
interface PerformanceContextType {
  isMonitoringEnabled: boolean;
  toggleMonitoring: (enabled?: boolean) => void;
  webVitals: CoreWebVitalsMetrics;
  performanceBudget: PerformanceBudget;
  updatePerformanceBudget: (budget: Partial<PerformanceBudget>) => void;
  networkInfo: {
    isOnline: boolean;
    effectiveType: string;
    saveData: boolean;
  };
  isPerformanceMode: 'high' | 'balanced' | 'data-saving';
  setPerformanceMode: (mode: 'high' | 'balanced' | 'data-saving') => void;
}

// Create the context with default values
const PerformanceContext = createContext<PerformanceContextType>({
  isMonitoringEnabled: true,
  toggleMonitoring: () => {},
  webVitals: {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTI: null,
    TTFB: null,
    INP: null
  },
  performanceBudget: {
    maxJSSize: 150,
    maxCSSSize: 50,
    maxImageSize: 500,
    maxFCP: 1800,
    maxLCP: 2500,
    maxCLS: 0.1,
    maxTTI: 3500,
    maxINP: 200,
    componentBudgets: {}
  },
  updatePerformanceBudget: () => {},
  networkInfo: {
    isOnline: true,
    effectiveType: 'unknown',
    saveData: false
  },
  isPerformanceMode: 'balanced',
  setPerformanceMode: () => {}
});

/**
 * Provider component for the performance monitoring context
 */
export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  // Initialize web vitals reporting
  useWebVitalsReporting();
  
  // Get network information
  const network = useNetworkInfo();
  
  // State for monitoring toggle
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true);
  
  // State for web vitals
  const [webVitals, setWebVitals] = useState<CoreWebVitalsMetrics>(
    performanceMonitor.getCoreWebVitals()
  );
  
  // State for performance budget
  const [performanceBudget, setPerformanceBudget] = useState<PerformanceBudget>(
    performanceMonitor.getPerformanceBudget()
  );
  
  // State for performance mode
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'data-saving'>(
    network.saveData ? 'data-saving' : 
    network.effectiveType === '4g' ? 'high' : 'balanced'
  );
  
  // Subscribe to web vitals updates
  useEffect(() => {
    if (!isMonitoringEnabled) return;
    
    const unsubscribe = performanceMonitor.subscribe('webVitals', (data) => {
      setWebVitals(prevState => ({
        ...prevState,
        [data.metric]: data.value
      }));
    });
    
    return unsubscribe;
  }, [isMonitoringEnabled]);
  
  // Update performance mode based on network conditions
  useEffect(() => {
    if (network.saveData) {
      setPerformanceMode('data-saving');
    } else if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      setPerformanceMode('data-saving');
    } else if (network.effectiveType === '3g') {
      setPerformanceMode('balanced');
    } else if (network.effectiveType === '4g') {
      setPerformanceMode('high');
    }
  }, [network.saveData, network.effectiveType]);
  
  // Toggle monitoring
  const toggleMonitoring = (enabled?: boolean) => {
    setIsMonitoringEnabled(prev => enabled !== undefined ? enabled : !prev);
  };
  
  // Update performance budget
  const updatePerformanceBudget = (budget: Partial<PerformanceBudget>) => {
    performanceMonitor.setPerformanceBudget(budget);
    setPerformanceBudget(performanceMonitor.getPerformanceBudget());
  };
  
  // Create the context value
  const contextValue = useMemo(
    () => ({
      isMonitoringEnabled,
      toggleMonitoring,
      webVitals,
      performanceBudget,
      updatePerformanceBudget,
      networkInfo: {
        isOnline: network.isOnline,
        effectiveType: network.effectiveType,
        saveData: network.saveData
      },
      isPerformanceMode: performanceMode,
      setPerformanceMode
    }),
    [
      isMonitoringEnabled,
      webVitals,
      performanceBudget,
      network.isOnline,
      network.effectiveType,
      network.saveData,
      performanceMode
    ]
  );
  
  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to use the performance context
 */
export function usePerformance() {
  const context = useContext(PerformanceContext);
  
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  
  return context;
}
