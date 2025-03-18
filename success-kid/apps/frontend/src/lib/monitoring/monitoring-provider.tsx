'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWebVitalsReporting } from '../performance/metrics';
import analytics, { EventCategory } from './analytics';
import { logError } from './error-logging';

// Context to provide monitoring capabilities throughout the app
interface MonitoringContextType {
  /**
   * Track a user event
   */
  trackEvent: (category: string, action: string, label?: string, value?: number, properties?: Record<string, any>) => void;
  
  /**
   * Track a UI action (click, view, etc)
   */
  trackAction: (action: string, element: string, properties?: Record<string, any>) => void;
  
  /**
   * Track an error
   */
  trackError: (error: any, context?: Record<string, any>) => void;
  
  /**
   * Track a performance metric
   */
  trackPerformance: (metric: string, value: number, context?: Record<string, any>) => void;
  
  /**
   * Enable or disable analytics tracking
   */
  setAnalyticsEnabled: (enabled: boolean) => void;
  
  /**
   * Get analytics enabled status
   */
  isAnalyticsEnabled: () => boolean;
}

// Create context with default implementations
const MonitoringContext = createContext<MonitoringContextType>({
  trackEvent: () => {},
  trackAction: () => {},
  trackError: () => {},
  trackPerformance: () => {},
  setAnalyticsEnabled: () => {},
  isAnalyticsEnabled: () => true,
});

interface MonitoringProviderProps {
  /**
   * Children to render
   */
  children: ReactNode;
  
  /**
   * Enable Web Vitals reporting
   */
  webVitals?: boolean;
}

/**
 * Monitoring Provider Component
 * 
 * Provides monitoring capabilities throughout the app
 */
export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ 
  children,
  webVitals = true
}) => {
  // Initialize Web Vitals reporting if enabled
  const webVitalsInitialized = useWebVitalsReporting();
  
  // Effect to run once on component mount
  useEffect(() => {
    // Initialize analytics
    analytics.init();
    
    // Track initial page load
    analytics.trackPageView(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      typeof document !== 'undefined' ? document.title : 'Unmounted'
    );
    
    // Log initial load performance
    if (typeof window !== 'undefined' && window.performance) {
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          analytics.trackPerformance('initialLoad', navEntry.duration);
        }
      } catch (error) {
        // Silently handle any errors in performance measurement
      }
    }
    
  }, []);
  
  // Report web vitals initialization
  useEffect(() => {
    if (webVitals && webVitalsInitialized) {
      analytics.track({
        category: EventCategory.PERFORMANCE,
        action: 'web_vitals_initialized'
      });
    }
  }, [webVitals, webVitalsInitialized]);
  
  // Context value
  const contextValue: MonitoringContextType = {
    trackEvent: (category, action, label, value, properties) => {
      analytics.track({
        category: category as EventCategory,
        action,
        label,
        value,
        properties
      });
    },
    
    trackAction: (action, element, properties) => {
      analytics.track({
        category: EventCategory.ENGAGEMENT,
        action,
        label: element,
        properties
      });
    },
    
    trackError: (error, context) => {
      logError(error, context);
    },
    
    trackPerformance: (metric, value, context) => {
      analytics.trackPerformance(metric, value, context);
    },
    
    setAnalyticsEnabled: (enabled) => {
      analytics.setEnabled(enabled);
    },
    
    isAnalyticsEnabled: () => {
      return typeof localStorage !== 'undefined' ? 
        localStorage.getItem('analytics_opt_out') !== 'true' : 
        true;
    }
  };
  
  return (
    <MonitoringContext.Provider value={contextValue}>
      {children}
    </MonitoringContext.Provider>
  );
};

/**
 * Hook to use monitoring throughout the app
 */
export const useMonitoring = () => useContext(MonitoringContext);

export default MonitoringProvider;
