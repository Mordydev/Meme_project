/**
 * Hook for detecting reduced motion preference
 * 
 * This hook checks if the user has enabled the "prefers-reduced-motion" setting
 * and allows components to adjust animations accordingly for accessibility.
 */
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  // Default to false for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') return;
    
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Create event listener function
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // For older browsers
      mediaQuery.addListener(listener);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // For older browsers
        mediaQuery.removeListener(listener);
      }
    };
  }, []);
  
  return prefersReducedMotion;
}

export default useReducedMotion;
