'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NavigationState {
  activeRoute: string;
  previousRoute: string | null;
  visitedRoutes: string[];
  recentRoutes: string[];
  pinnedRoutes: string[];
  defaultRoute: string;
  
  // Actions
  setActiveRoute: (route: string) => void;
  setPinnedRoutes: (routes: string[]) => void;
  pinRoute: (route: string) => void;
  unpinRoute: (route: string) => void;
  setDefaultRoute: (route: string) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      // Initial state
      activeRoute: '/',
      previousRoute: null,
      visitedRoutes: [],
      recentRoutes: [],
      pinnedRoutes: [],
      defaultRoute: '/',
      
      // Actions
      setActiveRoute: (route) => {
        set((state) => {
          const visitedRoutes = [...state.visitedRoutes];
          
          // Don't add duplicates if this is the same as current route
          if (route !== state.activeRoute) {
            visitedRoutes.push(route);
          }
          
          // Get recent routes (last 5 unique routes)
          const recentRoutes = [
            ...new Set([route, ...state.recentRoutes])
          ].slice(0, 5);
          
          return {
            activeRoute: route,
            previousRoute: state.activeRoute,
            visitedRoutes,
            recentRoutes
          };
        });
      },
      
      setPinnedRoutes: (routes) => {
        set({ pinnedRoutes: routes });
      },
      
      pinRoute: (route) => {
        set((state) => {
          // Only add if not already pinned
          if (!state.pinnedRoutes.includes(route)) {
            return { pinnedRoutes: [...state.pinnedRoutes, route] };
          }
          return state;
        });
      },
      
      unpinRoute: (route) => {
        set((state) => ({
          pinnedRoutes: state.pinnedRoutes.filter(r => r !== route)
        }));
      },
      
      setDefaultRoute: (route) => {
        set({ defaultRoute: route });
      }
    }),
    {
      name: 'navigation-state',
      partialize: (state) => ({
        recentRoutes: state.recentRoutes,
        pinnedRoutes: state.pinnedRoutes,
        defaultRoute: state.defaultRoute
      })
    }
  )
);

// Navigation state sync hook for use in components
export function useNavigationSync() {
  const setActiveRoute = useNavigationStore((state) => state.setActiveRoute);
  
  // This function should be called whenever a page changes
  // Usually in a top-level layout component that wraps all pages
  const syncNavigation = (route: string) => {
    setActiveRoute(route);
  };
  
  return { syncNavigation };
}
