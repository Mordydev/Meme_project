'use client';

import React, { useEffect, ReactNode } from 'react';
import { useViewport } from '@/hooks/useViewport';

export interface ViewportObserverProps {
  children: ReactNode;
  onViewportChange?: (viewport: ReturnType<typeof useViewport>) => void;
  onBreakpointChange?: (breakpoint: string) => void;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  onMobileChange?: (isMobile: boolean) => void;
  onPwaChange?: (isPwa: boolean) => void;
  reportInitialValues?: boolean;
}

/**
 * Component that observes viewport changes and reports them through callbacks.
 * Useful for triggering logic when screen size, orientation, or other viewport
 * attributes change.
 */
export const ViewportObserver: React.FC<ViewportObserverProps> = ({
  children,
  onViewportChange,
  onBreakpointChange,
  onOrientationChange,
  onMobileChange,
  onPwaChange,
  reportInitialValues = true,
}) => {
  const viewport = useViewport();
  
  useEffect(() => {
    // Report initial values if requested
    if (reportInitialValues) {
      onViewportChange?.(viewport);
      onBreakpointChange?.(viewport.breakpoint);
      onOrientationChange?.(viewport.orientation);
      onMobileChange?.(viewport.isMobile);
      onPwaChange?.(viewport.isPwa);
    }
    
    // We'll use a ref to track previous values
    const prev = {
      breakpoint: viewport.breakpoint,
      orientation: viewport.orientation,
      isMobile: viewport.isMobile,
      isPwa: viewport.isPwa,
    };
    
    // Set up viewport change observer
    const observer = () => {
      // Always call the complete viewport change handler
      onViewportChange?.(viewport);
      
      // Check individual changes
      if (viewport.breakpoint !== prev.breakpoint) {
        onBreakpointChange?.(viewport.breakpoint);
        prev.breakpoint = viewport.breakpoint;
      }
      
      if (viewport.orientation !== prev.orientation) {
        onOrientationChange?.(viewport.orientation);
        prev.orientation = viewport.orientation;
      }
      
      if (viewport.isMobile !== prev.isMobile) {
        onMobileChange?.(viewport.isMobile);
        prev.isMobile = viewport.isMobile;
      }
      
      if (viewport.isPwa !== prev.isPwa) {
        onPwaChange?.(viewport.isPwa);
        prev.isPwa = viewport.isPwa;
      }
    };
    
    // Set up resize event listener
    window.addEventListener('resize', observer);
    window.addEventListener('orientationchange', observer);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', observer);
      window.removeEventListener('orientationchange', observer);
    };
  }, [
    viewport,
    onViewportChange,
    onBreakpointChange,
    onOrientationChange,
    onMobileChange,
    onPwaChange,
    reportInitialValues,
  ]);
  
  return <>{children}</>;
};

export default ViewportObserver;