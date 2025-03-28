'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that returns whether a given media query matches the current viewport
 * @param query - The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with null for SSR compatibility
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window === 'undefined') return;
    
    // Create the media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial value
    setMatches(mediaQuery.matches);
    
    // Define the change handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
}

export default useMediaQuery;
