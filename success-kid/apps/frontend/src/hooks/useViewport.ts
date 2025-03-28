'use client';

import { useState, useEffect } from 'react';

// Define breakpoint type directly instead of importing
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface Viewport {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  breakpoint: Breakpoint;
  isPwa: boolean;
  isMobile: boolean;
}

// Default breakpoint thresholds based on Tailwind defaults
const DEFAULT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook to get the current viewport size, orientation, and breakpoint
 */
export function useViewport(): Viewport {
  // Initialize with reasonable defaults for SSR
  const [viewport, setViewport] = useState<Viewport>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: 'portrait',
    breakpoint: 'lg',
    isPwa: false,
    isMobile: false,
  });

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Calculate current breakpoint based on width
    const calculateBreakpoint = (width: number): Breakpoint => {
      if (width < DEFAULT_BREAKPOINTS.sm) return 'sm';
      if (width < DEFAULT_BREAKPOINTS.md) return 'md';
      if (width < DEFAULT_BREAKPOINTS.lg) return 'lg';
      if (width < DEFAULT_BREAKPOINTS.xl) return 'xl';
      return '2xl';
    };

    // Detect if running as installed PWA
    const checkIsPwa = (): boolean => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches ||
             window.matchMedia('(display-mode: minimal-ui)').matches ||
             (window.navigator as any).standalone === true;
    };

    // Detect if on mobile device
    const checkIsMobile = (): boolean => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || (window.innerWidth <= DEFAULT_BREAKPOINTS.md);
    };

    // Update viewport state
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      const breakpoint = calculateBreakpoint(width);
      const isPwa = checkIsPwa();
      const isMobile = checkIsMobile();

      setViewport({
        width,
        height,
        orientation,
        breakpoint,
        isPwa,
        isMobile,
      });
    };

    // Initial call
    updateViewport();

    // Set up listeners
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
}

export default useViewport;