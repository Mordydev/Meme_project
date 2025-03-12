import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// This store manages UI-specific state that doesn't belong in Server Components
// but needs to be shared across multiple Client Components
interface UIState {
  // Navigation state
  sidebarOpen: boolean;
  activeMobileTab: 'home' | 'market' | 'create' | 'community' | 'profile';
  
  // Modal states
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  }>;
  
  // Theme preference (if not using next-themes)
  colorScheme: 'light' | 'dark' | 'system';
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setActiveMobileTab: (tab: UIState['activeMobileTab']) => void;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (message: string, type: UIState['toasts'][0]['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  setColorScheme: (scheme: UIState['colorScheme']) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial states
        sidebarOpen: false,
        activeMobileTab: 'home',
        activeModal: null,
        modalData: null,
        toasts: [],
        colorScheme: 'system',
        
        // Actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
        
        openModal: (modalId, data = null) => set({ 
          activeModal: modalId, 
          modalData: data 
        }),
        
        closeModal: () => set({ 
          activeModal: null, 
          modalData: null 
        }),
        
        addToast: (message, type, duration = 5000) => {
          const id = Date.now().toString();
          set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
          }));
          
          // Auto-remove toast after duration
          if (duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, duration);
          }
        },
        
        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter(toast => toast.id !== id),
          }));
        },
        
        setColorScheme: (scheme) => set({ colorScheme: scheme }),
      }),
      {
        name: 'ui-storage',
        // Persist only user preferences, not transient UI state
        partialize: (state) => ({ 
          colorScheme: state.colorScheme,
          // We don't want to persist sidebar state, active modals, etc.
        }),
      }
    )
  )
);
