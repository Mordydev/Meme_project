/**
 * Detects if the browser supports backdrop-filter
 * Returns true if supported, false otherwise
 */
export function supportsBackdropFilter(): boolean {
  // Use in client-side code only
  if (typeof document === 'undefined') return false;
  
  // Check for backdrop-filter or -webkit-backdrop-filter support
  return (
    'backdropFilter' in document.documentElement.style ||
    'webkitBackdropFilter' in document.documentElement.style
  );
}
