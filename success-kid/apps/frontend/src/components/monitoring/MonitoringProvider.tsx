'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { monitoringService, errorTrackingService } from '@/lib/monitoring';
import { useAuth } from '@/hooks/useAuth';

interface MonitoringProviderProps {
  children: React.ReactNode;
}

/**
 * MonitoringProvider component
 * 
 * Provides application-wide monitoring and error tracking.
 * This should be placed near the root of the application.
 */
const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Initialize monitoring and error tracking
  useEffect(() => {
    // Initialize error tracking
    errorTrackingService.initializeSentry();
    
    // Initialize monitoring
    monitoringService.initialize();
    
    // Record application startup for analytics
    monitoringService.recordEvent('application', 'initialize', 'startup');
    
    // Add performance metrics listener
    const unsubscribe = monitoringService.onMetricsUpdate((metrics) => {
      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('Performance metrics updated:', metrics);
      }
    });
    
    // Cleanup on unmount
    return () => {
      monitoringService.cleanup();
      unsubscribe();
    };
  }, []); // Only run once on mount
  
  // Track route changes
  useEffect(() => {
    if (!pathname) return;
    
    // Record page view
    monitoringService.recordEvent('navigation', 'page_view', pathname);
    
    // Track as an interaction for more detailed analytics
    monitoringService.trackInteraction('view', pathname, undefined, {
      search: searchParams?.toString(),
      title: document.title
    });
  }, [pathname, searchParams]);
  
  // Update user ID when auth state changes
  useEffect(() => {
    if (user?.id) {
      // Update user context for error tracking
      errorTrackingService.registerOnErrorListener((error, context) => {
        if (!context) return;
        context.userId = user.id;
      });
      
      // Track user authentication for analytics
      monitoringService.recordEvent('user', 'authenticated', user.id);
    }
  }, [user]);
  
  return <>{children}</>;
};

export default MonitoringProvider;