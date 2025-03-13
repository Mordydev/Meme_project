import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useUIStore } from './useUIStore';

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeCount?: number;
  requiredAuth?: boolean;
  children?: NavigationItem[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: NavigationItem[];
};

export type NavTab = 'home' | 'market' | 'create' | 'community' | 'profile';

interface NavigationState {
  // Core navigation state
  activeRoute: string;
  previousRoute: string | null;
  visitedRoutes: string[];
  pinnedRoutes: string[];
  
  // Navigation preferences
  sidebarExpanded: boolean;
  expandedGroups: string[];
  defaultRoute: string;
  
  // Navigation history
  recentRoutes: string[];
  
  // Actions
  setActiveRoute: (route: string) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleExpandGroup: (groupId: string) => void;
  setExpandedGroups: (groupIds: string[]) => void;
  pinRoute: (route: string) => void;
  unpinRoute: (route: string) => void;
  setActiveMobileTab: (tab: NavTab) => void;
  getActiveMobileTab: () => NavTab;
  
  // Helpers
  isRouteActive: (route: string) => boolean;
  isGroupExpanded: (groupId: string) => boolean;
  isRoutePinned: (route: string) => boolean;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial states
        activeRoute: '/',
        previousRoute: null,
        visitedRoutes: [],
        pinnedRoutes: [],
        
        sidebarExpanded: true,
        expandedGroups: [],
        defaultRoute: '/dashboard',
        
        recentRoutes: [],
        
        // Actions
        setActiveRoute: (route) => set((state) => {
          const newVisitedRoutes = [...state.visitedRoutes];
          if (!newVisitedRoutes.includes(route)) {
            newVisitedRoutes.push(route);
          }
          
          // Update recent routes (keep last 10)
          const newRecentRoutes = [...state.recentRoutes.filter(r => r !== route)];
          newRecentRoutes.unshift(route);
          if (newRecentRoutes.length > 10) {
            newRecentRoutes.pop();
          }
          
          return {
            activeRoute: route,
            previousRoute: state.activeRoute,
            visitedRoutes: newVisitedRoutes,
            recentRoutes: newRecentRoutes,
          };
        }),
        
        toggleSidebar: () => set((state) => ({
          sidebarExpanded: !state.sidebarExpanded
        })),
        
        setSidebarExpanded: (expanded) => set({
          sidebarExpanded: expanded
        }),
        
        toggleExpandGroup: (groupId) => set((state) => {
          const isExpanded = state.expandedGroups.includes(groupId);
          return {
            expandedGroups: isExpanded
              ? state.expandedGroups.filter(id => id !== groupId)
              : [...state.expandedGroups, groupId]
          };
        }),
        
        setExpandedGroups: (groupIds) => set({
          expandedGroups: groupIds
        }),
        
        pinRoute: (route) => set((state) => ({
          pinnedRoutes: state.pinnedRoutes.includes(route)
            ? state.pinnedRoutes
            : [...state.pinnedRoutes, route]
        })),
        
        unpinRoute: (route) => set((state) => ({
          pinnedRoutes: state.pinnedRoutes.filter(r => r !== route)
        })),
        
        setActiveMobileTab: (tab) => {
          // Access the UI store to set the active tab
          useUIStore.getState().setActiveMobileTab(tab);
        },
        
        getActiveMobileTab: () => {
          // Access the UI store to get the active tab
          return useUIStore.getState().activeMobileTab;
        },
        
        // Helpers
        isRouteActive: (route) => {
          const state = get();
          return state.activeRoute === route || state.activeRoute.startsWith(route);
        },
        
        isGroupExpanded: (groupId) => {
          return get().expandedGroups.includes(groupId);
        },
        
        isRoutePinned: (route) => {
          return get().pinnedRoutes.includes(route);
        },
      }),
      {
        name: 'navigation-storage',
        partialize: (state) => ({
          // Only persist user preferences
          sidebarExpanded: state.sidebarExpanded,
          pinnedRoutes: state.pinnedRoutes,
          defaultRoute: state.defaultRoute,
          recentRoutes: state.recentRoutes.slice(0, 5),
        }),
      }
    )
  )
);
