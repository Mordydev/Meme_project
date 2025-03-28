'use client';

import { useState, useEffect } from 'react';

interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

/**
 * useResponsive - Custom hook for responsive design
 * Provides boolean values for different screen sizes
 */
export function useResponsive(): ResponsiveBreakpoints {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
  });

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1280,
        isLargeDesktop: width >= 1280,
      });
    };

    // Check breakpoints initially
    checkBreakpoints();

    // Add event listener for window resize
    window.addEventListener('resize', checkBreakpoints);

    // Clean up event listener
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  return breakpoints;
}
