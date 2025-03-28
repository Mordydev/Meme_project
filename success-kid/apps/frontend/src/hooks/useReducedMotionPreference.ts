import { useState, useEffect } from 'react';

/**
 * Hook that detects if the user prefers reduced motion
 * Follows accessibility guidelines to respect user preferences
 * 
 * @returns Boolean indicating if reduced motion is preferred
 */
export function useReducedMotionPreference(): boolean {
  // Default to false but will check for media query match
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;
    
    // Create media query list to detect user preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value based on current state
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Create event listener callback
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add event listener for changes in preference
    // Use the correct method based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
    } else {
      // Older browsers support the deprecated addListener method
      // @ts-ignore - for backwards compatibility
      mediaQuery.addListener(onChange);
    }
    
    // Clean up event listener on unmount
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', onChange);
      } else {
        // @ts-ignore - for backwards compatibility
        mediaQuery.removeListener(onChange);
      }
    };
  }, []);
  
  return prefersReducedMotion;
}

export default useReducedMotionPreference;
