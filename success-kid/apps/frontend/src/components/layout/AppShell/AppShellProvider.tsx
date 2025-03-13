'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface AppShellState {
  sidebarOpen: boolean;
  isMobile: boolean;
  collapsed: boolean;
}

interface AppShellContextType extends AppShellState {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
}

const AppShellContext = createContext<AppShellContextType | null>(null);

interface AppShellProviderProps {
  children: ReactNode;
  initialState?: Partial<AppShellState>;
  persistKey?: string;
}

export function AppShellProvider({
  children,
  initialState,
  persistKey = 'app-shell-state'
}: AppShellProviderProps) {
  // Check if we're on a mobile device using a media query
  const isMobileDevice = useMediaQuery('(max-width: 768px)');
  
  // Initialize state from localStorage if available
  const [state, setState] = useState<AppShellState>(() => {
    // Try to get stored state
    if (typeof window !== 'undefined') {
      try {
        const storedState = localStorage.getItem(persistKey);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          return {
            sidebarOpen: isMobileDevice ? false : (parsedState.sidebarOpen ?? true),
            isMobile: isMobileDevice,
            collapsed: parsedState.collapsed ?? false
          };
        }
      } catch (error) {
        console.error('Error retrieving AppShell state from localStorage:', error);
      }
    }
    
    // Default state
    return {
      sidebarOpen: isMobileDevice ? false : (initialState?.sidebarOpen ?? true),
      isMobile: isMobileDevice,
      collapsed: initialState?.collapsed ?? false
    };
  });
  
  // Update state when media query changes
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      isMobile: isMobileDevice,
      // Auto-close sidebar on mobile
      sidebarOpen: isMobileDevice ? false : prevState.sidebarOpen
    }));
  }, [isMobileDevice]);
  
  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, JSON.stringify({
          sidebarOpen: state.sidebarOpen,
          collapsed: state.collapsed
        }));
      } catch (error) {
        console.error('Error storing AppShell state in localStorage:', error);
      }
    }
  }, [state.sidebarOpen, state.collapsed, persistKey]);
  
  // Toggle sidebar open/closed
  const toggleSidebar = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      sidebarOpen: !prevState.sidebarOpen
    }));
  }, []);
  
  // Set sidebar open state
  const setSidebarOpen = useCallback((open: boolean) => {
    setState(prevState => ({
      ...prevState,
      sidebarOpen: open
    }));
  }, []);
  
  // Set collapsed state
  const setCollapsed = useCallback((collapsed: boolean) => {
    setState(prevState => ({
      ...prevState,
      collapsed
    }));
  }, []);
  
  const value = {
    ...state,
    toggleSidebar,
    setSidebarOpen,
    setCollapsed
  };
  
  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

// Hook for accessing AppShell context
export function useAppShell() {
  const context = useContext(AppShellContext);
  
  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider');
  }
  
  return context;
}
