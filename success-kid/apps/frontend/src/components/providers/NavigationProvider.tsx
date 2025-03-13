'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationStore } from '@/store/useNavigationStore';

const NavigationContext = createContext<null>(null);

interface NavigationProviderProps {
  children: React.ReactNode;
}

/**
 * NavigationProvider - Provides navigation state and synchronization across the app
 * Tracks route changes and updates navigation state accordingly
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const setActiveRoute = useNavigationStore(state => state.setActiveRoute);
  
  // Update active route when pathname changes
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname, setActiveRoute]);
  
  return (
    <NavigationContext.Provider value={null}>
      {children}
    </NavigationContext.Provider>
  );
}

// Custom hook for consuming the navigation context
export function useNavigation() {
  const context = useContext(NavigationContext);
  
  // We don't actually use the context value directly, but we want to ensure
  // the hook is used within a NavigationProvider
  
  return {
    // Helper methods can be added here in the future
  };
}
