'use client';

import React, { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { NavigationItem } from './NavigationDrawer';
import { NavigationTab } from './BottomTabNavigation';
import { usePathname } from 'next/navigation';

export interface NavigationContextType {
  // Drawer state
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  drawerItems: NavigationItem[];
  setDrawerItems: (items: NavigationItem[]) => void;
  
  // Bottom tab state
  tabs: NavigationTab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  setTabs: (tabs: NavigationTab[]) => void;
  
  // Navigation history
  previousPath: string | null;
  currentPath: string;
  
  // Back navigation
  canGoBack: boolean;
  goBack: () => void;
  
  // Helper functions
  isTabActive: (tabId: string) => boolean;
  isItemActive: (itemId: string) => boolean;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export interface NavigationProviderProps {
  children: ReactNode;
  initialTabs?: NavigationTab[];
  initialDrawerItems?: NavigationItem[];
}

/**
 * Provider component for navigation state and functionality.
 * Manages drawer state, tab navigation, and navigation history.
 */
export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialTabs = [],
  initialDrawerItems = [],
}) => {
  const pathname = usePathname();
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerItems, setDrawerItems] = useState<NavigationItem[]>(initialDrawerItems);
  
  // Bottom tab state
  const [tabs, setTabs] = useState<NavigationTab[]>(initialTabs);
  const [activeTab, setActiveTab] = useState<string>(
    initialTabs.length > 0 ? initialTabs[0].id : ''
  );
  
  // Navigation history
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([pathname]);
  
  // Update navigation history when path changes
  React.useEffect(() => {
    if (pathname !== navigationHistory[navigationHistory.length - 1]) {
      setPreviousPath(navigationHistory[navigationHistory.length - 1]);
      setNavigationHistory([...navigationHistory, pathname]);
    }
  }, [pathname, navigationHistory]);
  
  // Determine if can go back
  const canGoBack = navigationHistory.length > 1;
  
  // Drawer controls
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);
  
  // Go back function
  const goBack = useCallback(() => {
    if (canGoBack) {
      window.history.back();
    }
  }, [canGoBack]);
  
  // Helper functions
  const isTabActive = useCallback((tabId: string) => {
    return activeTab === tabId;
  }, [activeTab]);
  
  const isItemActive = useCallback((itemId: string) => {
    return drawerItems.some(item => item.id === itemId && item.isActive);
  }, [drawerItems]);
  
  const value: NavigationContextType = {
    // Drawer state
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    drawerItems,
    setDrawerItems,
    
    // Bottom tab state
    tabs,
    activeTab,
    setActiveTab,
    setTabs,
    
    // Navigation history
    previousPath,
    currentPath: pathname,
    
    // Back navigation
    canGoBack,
    goBack,
    
    // Helper functions
    isTabActive,
    isItemActive,
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to use the navigation context.
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;