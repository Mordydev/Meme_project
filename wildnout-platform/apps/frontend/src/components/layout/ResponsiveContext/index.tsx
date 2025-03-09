'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define breakpoints to match tailwind configuration
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type BreakpointType = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type OrientationType = 'portrait' | 'landscape';

interface ResponsiveContextType {
  width: number;
  height: number;
  breakpoint: BreakpointType;
  device: DeviceType;
  orientation: OrientationType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

// Create context with default values
const ResponsiveContext = createContext<ResponsiveContextType>({
  width: 0,
  height: 0,
  breakpoint: 'xs',
  device: 'mobile',
  orientation: 'portrait',
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isPortrait: true,
  isLandscape: false,
});

interface ResponsiveProviderProps {
  children: React.ReactNode;
}

/**
 * Responsive context provider that tracks device type, size, and orientation
 * Automatically updates on window resize and orientation changes
 */
export const ResponsiveProvider = ({ children }: ResponsiveProviderProps) => {
  // Initialize with default values
  const [responsive, setResponsive] = useState<ResponsiveContextType>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    breakpoint: 'xs',
    device: 'mobile',
    orientation: 'portrait',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isPortrait: true,
    isLandscape: false,
  });

  // Function to determine current state
  const updateResponsiveState = () => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Determine current breakpoint
    let breakpoint: BreakpointType = 'xs';
    if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
    else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
    else if (width >= BREAKPOINTS.md) breakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';
    
    // Determine device type based on breakpoint
    let device: DeviceType = 'mobile';
    if (breakpoint === 'xs' || breakpoint === 'sm') device = 'mobile';
    else if (breakpoint === 'md' || breakpoint === 'lg') device = 'tablet';
    else device = 'desktop';
    
    // Determine orientation
    const orientation: OrientationType = width > height ? 'landscape' : 'portrait';
    
    setResponsive({
      width,
      height,
      breakpoint,
      device,
      orientation,
      isMobile: device === 'mobile',
      isTablet: device === 'tablet',
      isDesktop: device === 'desktop',
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
    });
  };
  
  // Update on mount and window resize
  useEffect(() => {
    updateResponsiveState();
    
    const handleResize = () => {
      updateResponsiveState();
    };
    
    const handleOrientationChange = () => {
      updateResponsiveState();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
};

/**
 * Hook to access responsive context values
 */
export const useResponsive = () => useContext(ResponsiveContext);

export default ResponsiveProvider;
