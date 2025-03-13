'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationStore } from '@/store/navigationStore';

/**
 * NavigationSync - Component that synchronizes navigation state with the store
 * Place this in a root layout to track all navigation changes
 */
export function NavigationSync() {
  const pathname = usePathname();
  const setActiveRoute = useNavigationStore(state => state.setActiveRoute);
  
  // Update navigation store when pathname changes
  useEffect(() => {
    if (pathname) {
      // Normalize the path to handle platform route group
      let normalizedPath = pathname;
      
      // Convert (platform)/route to /route for consistent path tracking
      if (pathname.includes('/(platform)')) {
        normalizedPath = pathname.replace('/(platform)', '');
      }
      
      // Remove trailing slashes for consistency
      normalizedPath = normalizedPath.endsWith('/')
        ? normalizedPath.slice(0, -1)
        : normalizedPath;
      
      // Ensure paths start with /
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }
      
      // Set the active route in the store
      setActiveRoute(normalizedPath);
    }
  }, [pathname, setActiveRoute]);
  
  // This component doesn't render anything
  return null;
}
