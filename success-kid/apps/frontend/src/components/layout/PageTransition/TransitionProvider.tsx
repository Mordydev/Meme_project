'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TransitionType } from './PageTransition';

interface TransitionContextType {
  transitionType: TransitionType;
  duration: number;
  enabled: boolean;
  setTransitionType: (type: TransitionType) => void;
  setDuration: (duration: number) => void;
  setEnabled: (enabled: boolean) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

interface TransitionProviderProps {
  children: React.ReactNode;
  defaultType?: TransitionType;
  defaultDuration?: number;
  persistKey?: string;
}

export function TransitionProvider({
  children,
  defaultType = 'fade',
  defaultDuration = 0.3,
  persistKey = 'transition-preferences'
}: TransitionProviderProps) {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Initialize state from localStorage if available
  const [state, setState] = useState(() => {
    // Default state
    const defaultState = {
      transitionType: defaultType,
      duration: defaultDuration,
      enabled: !prefersReducedMotion
    };
    
    // Try to get stored state
    if (typeof window !== 'undefined') {
      try {
        const storedPrefs = localStorage.getItem(persistKey);
        if (storedPrefs) {
          const parsedPrefs = JSON.parse(storedPrefs);
          return {
            ...defaultState,
            ...parsedPrefs,
            // Always respect prefers-reduced-motion
            enabled: parsedPrefs.enabled && !prefersReducedMotion
          };
        }
      } catch (error) {
        console.error('Error retrieving transition preferences:', error);
      }
    }
    
    return defaultState;
  });
  
  // Update enabled state when reduced motion preference changes
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      enabled: prevState.enabled && !prefersReducedMotion
    }));
  }, [prefersReducedMotion]);
  
  // Persist preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, JSON.stringify(state));
      } catch (error) {
        console.error('Error storing transition preferences:', error);
      }
    }
  }, [state, persistKey]);
  
  // Update functions
  const setTransitionType = (type: TransitionType) => {
    setState(prev => ({ ...prev, transitionType: type }));
  };
  
  const setDuration = (duration: number) => {
    setState(prev => ({ ...prev, duration }));
  };
  
  const setEnabled = (enabled: boolean) => {
    setState(prev => ({ ...prev, enabled: enabled && !prefersReducedMotion }));
  };
  
  const value = {
    ...state,
    setTransitionType,
    setDuration,
    setEnabled
  };
  
  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
}

// Hook for accessing transition context
export function useTransition() {
  const context = useContext(TransitionContext);
  
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  
  return context;
}
