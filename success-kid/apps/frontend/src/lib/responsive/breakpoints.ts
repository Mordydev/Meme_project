/**
 * Tailwind CSS breakpoint definitions for consistent use across the application
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Media query strings for each breakpoint (min-width queries)
 */
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  // Additional queries for specific use cases
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  touch: `(hover: none) and (pointer: coarse)`,
  mouse: `(hover: hover) and (pointer: fine)`,
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
};

/**
 * Helper function to create a media query string
 * @param query The query string or predefined query name
 * @returns Full media query string
 */
export function createMediaQuery(query: string | keyof typeof mediaQueries): string {
  if (query in mediaQueries) {
    return mediaQueries[query as keyof typeof mediaQueries];
  }
  return query;
}
