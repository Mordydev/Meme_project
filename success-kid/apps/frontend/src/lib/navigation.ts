'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUIStore } from '@/store/useUIStore';

/**
 * useEnhancedNavigation - Custom hook for handling navigation with state updates
 * Provides utilities for navigating while updating navigation state
 */
export const useEnhancedNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setActiveRoute = useNavigationStore(state => state.setActiveRoute);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  
  /**
   * Navigate to a new route with proper state updates
   * @param href - The destination route
   * @param options - Optional navigation options
   */
  const navigateTo = (href: string, options?: { 
    closeMobileSidebar?: boolean;
    replace?: boolean;
  }) => {
    // Set new active route
    setActiveRoute(href);
    
    // Close mobile sidebar if needed
    if (options?.closeMobileSidebar !== false) {
      setSidebarOpen(false);
    }
    
    // Navigate to the route
    if (options?.replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };
  
  /**
   * Go back to the previous route
   */
  const goBack = () => {
    router.back();
  };
  
  return {
    navigateTo,
    goBack,
    currentPath: pathname
  };
};

/**
 * Utility function to generate breadcrumbs from a path
 * @param path - The current path
 * @returns Array of breadcrumb items
 */
export const generateBreadcrumbs = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  
  // Always start with home
  const breadcrumbs = [{ label: 'Home', href: '/' }];
  
  // Build up breadcrumbs from path segments
  let currentPath = '';
  parts.forEach(part => {
    currentPath += `/${part}`;
    
    // Format label (convert kebab-case to Title Case)
    const label = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: currentPath
    });
  });
  
  return breadcrumbs;
};
