'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if a media query matches
 * 
 * @param query CSS media query string (e.g. '(max-width: 768px)')
 * @returns Boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on the server or if window.matchMedia isn't available
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window and matchMedia are available
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia(query);
      
      // Set the initial match state
      setMatches(mediaQuery.matches);
      
      // Define listener for changes
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener
      mediaQuery.addEventListener('change', listener);
      
      // Cleanup
      return () => {
        mediaQuery.removeEventListener('change', listener);
      };
    }
    
    return undefined;
  }, [query]);

  return matches;
}
