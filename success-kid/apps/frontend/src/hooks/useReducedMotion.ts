/**
 * Hook for detecting user's reduced motion preference
 */
'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect reduced motion preference
 * @returns {boolean} True if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  // Initialize with no preference (false) for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check if window is available (for SSR)
    if (typeof window === 'undefined') return;
    
    // Check for preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Create event listener for changes
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Clean up event listener
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  return prefersReducedMotion;
}

export default useReducedMotion;
