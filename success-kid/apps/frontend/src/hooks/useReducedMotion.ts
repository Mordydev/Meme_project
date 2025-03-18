'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that listens for the user's reduced motion preference
 * 
 * @returns {boolean} Whether the user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }
    
    // Get initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for preference changes
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    try {
      // Modern browsers
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } catch (err) {
      // Older browsers
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);
  
  return prefersReducedMotion;
}
