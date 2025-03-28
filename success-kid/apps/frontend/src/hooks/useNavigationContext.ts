'use client';

import { useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';

type SectionType = 'dashboard' | 'market' | 'community' | 'create' | 'rewards' | 
                    'leaderboard' | 'profile' | 'settings' | 'help' | 'other';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface NavigationContext {
  section: SectionType;
  isRouteActive: (route: string) => boolean;
  breadcrumbs: BreadcrumbItem[];
  showBackButton: boolean;
}

/**
 * useNavigationContext - Custom hook for navigation context
 * Provides navigation-related information and utilities based on current route
 */
export function useNavigationContext(): NavigationContext {
  const pathname = usePathname();
  
  // Derive section from pathname
  const section = useMemo((): SectionType => {
    if (pathname.includes('/dashboard')) return 'dashboard';
    if (pathname.includes('/market')) return 'market';
    if (pathname.includes('/community')) return 'community';
    if (pathname.includes('/create')) return 'create';
    if (pathname.includes('/rewards')) return 'rewards';
    if (pathname.includes('/leaderboard')) return 'leaderboard';
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/help')) return 'help';
    return 'other';
  }, [pathname]);
  
  // Check if route is active (exact or parent)
  const isRouteActive = useCallback((route: string): boolean => {
    if (route === '/' && pathname === '/') return true;
    if (route === '/') return false;
    return pathname === route || pathname.startsWith(`${route}/`);
  }, [pathname]);
  
  // Generate breadcrumbs based on current path
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    
    // Always start with home
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];
    
    // Add each path segment
    paths.reduce((acc, path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      items.push({ label, href: url });
      return acc + '/' + path;
    }, '');
    
    return items;
  }, [pathname]);
  
  // Determine if back button should be shown
  const showBackButton = useMemo((): boolean => {
    // Show back button if we're deeper than 1 level in the navigation
    return breadcrumbs.length > 2;
  }, [breadcrumbs]);
  
  return {
    section,
    isRouteActive,
    breadcrumbs,
    showBackButton
  };
}
