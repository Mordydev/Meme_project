'use client';

import React, { useEffect } from 'react';
import { PerformanceProvider as CorePerformanceProvider } from '@/lib/performance/context';
import { FontOptimizer, ResourceHints } from '@/lib/performance/asset-optimization';
import performanceMonitor from '@/lib/performance/metrics';
import performanceService from '@/services/performanceService';

/**
 * Performance Provider wrapper with initialization logic
 * 
 * This component initializes performance monitoring and wraps the application
 * with the PerformanceProvider context to provide performance optimization features.
 */
export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  // Initialize performance monitoring on mount
  useEffect(() => {
    // Set performance budget based on environment
    performanceMonitor.setPerformanceBudget({
      maxJSSize: 150, // 150KB
      maxCSSSize: 50,  // 50KB
      maxImageSize: 500, // 500KB
      maxFCP: 1800,    // 1.8s
      maxLCP: 2500,    // 2.5s
      maxCLS: 0.1,     // 0.1
      maxTTI: 3500,    // 3.5s
      maxINP: 200,     // 200ms
      componentBudgets: {
        // Set budgets for critical components
        'UserProfile': { maxRenderTime: 50, maxRenderCount: 5 },
        'Dashboard': { maxRenderTime: 100, maxRenderCount: 3 },
        'ContentCard': { maxRenderTime: 30, maxRenderCount: 10 },
        'PointsDisplay': { maxRenderTime: 25, maxRenderCount: 8 },
      }
    });

    // Initialize performance reporting service
    // For production, enable reporting. For development, disable to reduce noise
    if (process.env.NODE_ENV === 'production') {
      performanceService.startReporting();
    }

    // Register performance event handlers
    const subscribeToWebVitals = performanceMonitor.subscribe('webVitals', (data) => {
      if (process.env.NODE_ENV === 'production') {
        performanceService.reportWebVitals();
      }
    });

    // Track significant budget exceeded events
    const subscribeToBudget = performanceMonitor.subscribe('budgetExceeded', (data) => {
      if (process.env.NODE_ENV === 'production') {
        performanceService.reportEvent('budget', `${data.type}-${data.metric}`, data.value);
      }
    });

    // Mark navigation start
    if (typeof performance !== 'undefined') {
      performanceMonitor.startMark('navigation');
      performanceMonitor.markAndMeasure('navigation_start', 'navigation_start_measure');
      
      // Clean up performance marks when window unloads
      const handleUnload = () => {
        performanceMonitor.clearPerformanceMarks();
        
        // Send final metrics during unload
        if (process.env.NODE_ENV === 'production') {
          performanceService.flushMetrics?.();
        }
      };
      
      window.addEventListener('unload', handleUnload);
      
      // Clean up event listeners and reporting
      return () => {
        window.removeEventListener('unload', handleUnload);
        subscribeToWebVitals();
        subscribeToBudget();
        
        // Stop reporting on unmount
        if (process.env.NODE_ENV === 'production') {
          performanceService.stopReporting();
        }
      };
    }
  }, []);

  return (
    <CorePerformanceProvider>
      {/* Font optimization */}
      <FontOptimizer
        fonts={[
          { family: 'Montserrat', weight: 'variable', style: 'normal', display: 'swap' },
          { family: 'Inter', weight: 'variable', style: 'normal', display: 'swap' },
          { family: 'Roboto Mono', weight: 'variable', style: 'normal', display: 'swap' }
        ]}
        strategy="swap"
        disableLayoutShift={true}
      >
        {/* Resource hints for faster loading */}
        <ResourceHints 
          resources={[
            // Preconnect to critical domains
            { url: 'https://fonts.googleapis.com', hint: 'preconnect' },
            { url: 'https://fonts.gstatic.com', hint: 'preconnect' },
            { url: 'https://success-kid-api.com', hint: 'preconnect' },
            // DNS prefetch for external services
            { url: 'https://clerk.success-kid.com', hint: 'dns-prefetch' },
            { url: 'https://cdn.success-kid.com', hint: 'dns-prefetch' }
          ]}
        />
        {children}
      </FontOptimizer>
    </CorePerformanceProvider>
  );
}
