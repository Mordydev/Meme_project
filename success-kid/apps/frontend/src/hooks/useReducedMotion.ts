import { useState, useEffect } from 'react';

/**
 * Hook that checks if the user prefers reduced motion
 * 
 * @returns boolean True if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  // Default to false (no reduced motion) if no media query match is possible
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check if browser supports matchMedia and if the preference is set
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Add event listener for changes
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);
  
  return prefersReducedMotion;
}
