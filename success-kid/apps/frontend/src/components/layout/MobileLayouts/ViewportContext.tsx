'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define breakpoints according to our design system
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type Orientation = 'portrait' | 'landscape';

export interface Viewport {
  width: number;
  height: number;
  orientation: Orientation;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

interface ViewportContextType {
  viewport: Viewport;
}

const defaultViewport: Viewport = {
  width: 0,
  height: 0,
  orientation: 'portrait',
  breakpoint: 'xs',
  isMobile: true,
  isTablet: false,
  isDesktop: false,
};

// Define breakpoint thresholds
const breakpointThresholds: Record<Breakpoint, number> = {
  'xs': 0,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

const ViewportContext = createContext<ViewportContextType>({
  viewport: defaultViewport,
});

export function useViewport(): Viewport {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context.viewport;
}

interface ViewportProviderProps {
  children: React.ReactNode;
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);

  useEffect(() => {
    const calculateBreakpoint = (width: number): Breakpoint => {
      if (width >= breakpointThresholds['2xl']) return '2xl';
      if (width >= breakpointThresholds.xl) return 'xl';
      if (width >= breakpointThresholds.lg) return 'lg';
      if (width >= breakpointThresholds.md) return 'md';
      if (width >= breakpointThresholds.sm) return 'sm';
      return 'xs';
    };

    const calculateDeviceType = (breakpoint: Breakpoint): {
      isMobile: boolean;
      isTablet: boolean;
      isDesktop: boolean;
    } => {
      // Mobile: xs, sm
      // Tablet: md, lg
      // Desktop: xl, 2xl
      return {
        isMobile: breakpoint === 'xs' || breakpoint === 'sm',
        isTablet: breakpoint === 'md' || breakpoint === 'lg',
        isDesktop: breakpoint === 'xl' || breakpoint === '2xl',
      };
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation: Orientation = width >= height ? 'landscape' : 'portrait';
      const breakpoint = calculateBreakpoint(width);
      const { isMobile, isTablet, isDesktop } = calculateDeviceType(breakpoint);

      setViewport({
        width,
        height,
        orientation,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
      });
    };

    // Initial calculation
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      // Also listen for orientation changes on mobile
      window.addEventListener('orientationchange', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, []);

  return (
    <ViewportContext.Provider value={{ viewport }}>
      {children}
    </ViewportContext.Provider>
  );
}
