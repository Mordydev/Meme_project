'use client';

import React, { useEffect } from 'react';
import { 
  WebVitalsReporter,
  initWebVitalsReporting,
  preloadCriticalFonts,
  fontDisplayOptimization,
  optimizeFontLoading,
  addSkeletonStyles,
  preventLayoutShift,
  monitorLayoutShifts
} from '@/lib/performance';

export interface PerformanceProviderProps {
  children: React.ReactNode;
  analyticsEndpoint?: string;
  debug?: boolean;
  sampleRate?: number;
  reportAllMetrics?: boolean;
}

/**
 * Provider component that initializes performance optimizations and monitoring
 */
export function PerformanceProvider({
  children,
  analyticsEndpoint,
  debug = process.env.NODE_ENV === 'development',
  sampleRate = 1.0,
  reportAllMetrics = false,
}: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize font optimization
    preloadCriticalFonts();
    fontDisplayOptimization();
    optimizeFontLoading();
    
    // Initialize layout stability optimizations
    addSkeletonStyles();
    preventLayoutShift();
    
    // Initialize monitoring
    const cleanupLayoutMonitoring = monitorLayoutShifts((cls) => {
      if (debug && cls > 0.05) {
        console.warn(`[CLS Warning] Layout shift detected: ${cls.toFixed(4)}`);
      }
    });
    
    // Initialize web vitals reporting
    initWebVitalsReporting({
      analyticsEndpoint,
      debug,
      sampleRate,
      reportAllMetrics,
    });
    
    return () => {
      if (cleanupLayoutMonitoring) cleanupLayoutMonitoring();
    };
  }, [analyticsEndpoint, debug, sampleRate, reportAllMetrics]);
  
  return (
    <>
      {children}
      <WebVitalsReporter
        analyticsEndpoint={analyticsEndpoint}
        debug={debug}
        sampleRate={sampleRate}
        reportAllMetrics={reportAllMetrics}
      />
    </>
  );
}

export default PerformanceProvider;
