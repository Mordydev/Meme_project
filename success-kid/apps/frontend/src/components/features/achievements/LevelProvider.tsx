'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLevelStore, LevelData } from '@/store/useLevelStore';
import { usePointsStore } from '@/store/usePointsStore';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';

/**
 * Level context type
 */
interface LevelContextType {
  isLoading: boolean;
  error: Error | null;
  showLevelUp: boolean;
  dismissLevelUp: () => void;
}

// Create context
const LevelContext = createContext<LevelContextType | null>(null);

/**
 * Props for LevelProvider
 */
interface LevelProviderProps {
  children: React.ReactNode;
  initialLevel?: LevelData;
}

/**
 * Level system provider component
 * Manages user level state and level-up celebrations
 */
export function LevelProvider({ children, initialLevel }: LevelProviderProps) {
  const { isLevelUpActive, dismissLevelUp, fetchUserLevel, isLoading, error } = useLevelStore();
  const { balance } = usePointsStore();
  const { user, isLoaded: authLoaded } = useAuth();
  const { subscribe } = useWebSocketContext();
  
  // Fetch level data when user is loaded
  useEffect(() => {
    if (authLoaded && user?.id) {
      fetchUserLevel();
    }
  }, [authLoaded, user?.id, fetchUserLevel]);
  
  // Listen for level-up events from WebSocket
  useEffect(() => {
    if (!authLoaded || !user?.id) return;
    
    const unsubscribe = subscribe('user.levelUp', (message) => {
      if (message.data) {
        // Level up event received, trigger celebration
        fetchUserLevel();
      }
    });
    
    return () => unsubscribe();
  }, [authLoaded, user?.id, subscribe, fetchUserLevel]);
  
  // Create context value
  const contextValue: LevelContextType = {
    isLoading,
    error,
    showLevelUp: isLevelUpActive,
    dismissLevelUp,
  };
  
  return (
    <LevelContext.Provider value={contextValue}>
      {children}
    </LevelContext.Provider>
  );
}

/**
 * Hook to use the level context
 */
export function useLevelContext() {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error('useLevelContext must be used within a LevelProvider');
  }
  return context;
}
