'use client';

// Breakpoints matching Tailwind configuration
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
};

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Create a media query string for a given breakpoint
 * @param breakpoint The breakpoint to create a media query for
 * @param type 'min' for min-width, 'max' for max-width
 * @returns The media query string
 */
export function createMediaQuery(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): string {
  const value = BREAKPOINTS[breakpoint];
  const unit = 'px';
  
  if (type === 'min') {
    return `(min-width: ${value}${unit})`;
  } else {
    return `(max-width: ${value - 0.1}${unit})`;
  }
}

/**
 * Create a range media query string between two breakpoints
 * @param minBreakpoint The minimum breakpoint
 * @param maxBreakpoint The maximum breakpoint
 * @returns The media query string
 */
export function createRangeMediaQuery(minBreakpoint: Breakpoint, maxBreakpoint: Breakpoint): string {
  const minValue = BREAKPOINTS[minBreakpoint];
  const maxValue = BREAKPOINTS[maxBreakpoint];
  
  return `(min-width: ${minValue}px) and (max-width: ${maxValue - 0.1}px)`;
}

/**
 * Check if a media query matches
 * @param query The media query to check
 * @returns Whether the query matches
 */
export function matchesMedia(query: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
}

/**
 * Check if the current viewport is at least a certain breakpoint
 * @param breakpoint The breakpoint to check
 * @returns Whether the viewport is at least that breakpoint
 */
export function isMinWidth(breakpoint: Breakpoint): boolean {
  return matchesMedia(createMediaQuery(breakpoint, 'min'));
}

/**
 * Check if the current viewport is at most a certain breakpoint
 * @param breakpoint The breakpoint to check
 * @returns Whether the viewport is at most that breakpoint
 */
export function isMaxWidth(breakpoint: Breakpoint): boolean {
  return matchesMedia(createMediaQuery(breakpoint, 'max'));
}

/**
 * Check if the current viewport is between two breakpoints
 * @param minBreakpoint The minimum breakpoint
 * @param maxBreakpoint The maximum breakpoint
 * @returns Whether the viewport is between the breakpoints
 */
export function isBetween(minBreakpoint: Breakpoint, maxBreakpoint: Breakpoint): boolean {
  return matchesMedia(createRangeMediaQuery(minBreakpoint, maxBreakpoint));
}

/**
 * Add a listener for a media query
 * @param query The media query to listen to
 * @param callback Function to call when the query changes
 * @returns A function to remove the listener
 */
export function addMediaListener(query: string, callback: (matches: boolean) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia(query);
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  // Modern API
  mediaQuery.addEventListener('change', handler);
  
  // Initial callback
  callback(mediaQuery.matches);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Get the current breakpoint
 * @returns The name of the current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'xs';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}
