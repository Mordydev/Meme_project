'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if user prefers reduced motion
 * This is used to disable or reduce animations for users who have this preference
 * 
 * @returns {boolean} True if user prefers reduced motion, false otherwise
 */
export function useReducedMotionPreference(): boolean {
  // Default to false server-side or during initial rendering
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for the media query support
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add listener for changes in preference
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
