'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLevelStore } from '@/store/useLevelStore';
import { usePointsStore } from '@/store/usePointsStore';
import { UserLevelData } from '@/types';
import { LevelUpCelebration } from './LevelUpCelebration';

interface LevelContextValue {
  // Data
  level: number;
  title: string;
  progress: number;
  pointsToNextLevel: number;
  currentPoints: number;
  badges: {
    current: string;
    next?: string;
  };
  benefits: string[];
  isLoading: boolean;
  // Methods
  refreshLevel: () => Promise<void>;
}

const LevelContext = createContext<LevelContextValue | null>(null);

interface LevelProviderProps {
  children: React.ReactNode;
}

/**
 * Level Provider
 * 
 * Global provider for level system data and events. Handles:
 * - Loading level data
 * - Tracking points and level progress
 * - Displaying level-up celebrations
 * - Syncing with points store
 */
export function LevelProvider({ children }: LevelProviderProps) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    previousLevel: number;
    newLevel: number;
  } | null>(null);
  
  // Level store state and actions
  const {
    currentLevel,
    currentPoints,
    nextLevelPoints,
    progress,
    title,
    benefits,
    badges,
    isLoading,
    fetchLevelData,
    checkLevelUp
  } = useLevelStore();
  
  // Points store subscription - listen for point changes
  const pointsTotal = usePointsStore((state) => state.balance);
  
  // Fetch level data on mount
  useEffect(() => {
    fetchLevelData();
  }, [fetchLevelData]);
  
  // Check for level up when points change
  useEffect(() => {
    const handlePointsChange = async () => {
      const result = await checkLevelUp();
      
      if (result.leveledUp && result.previousLevel && result.newLevel) {
        // Set level up data for celebration
        setLevelUpData({
          previousLevel: result.previousLevel,
          newLevel: result.newLevel
        });
        
        // Show celebration
        setShowLevelUp(true);
      }
    };
    
    handlePointsChange();
  }, [pointsTotal, checkLevelUp]);
  
  // Calculate points needed for next level
  const pointsToNextLevel = nextLevelPoints - currentPoints;
  
  // Refresh level data
  const refreshLevel = async () => {
    await fetchLevelData();
  };
  
  // Handle dismissing the level up celebration
  const handleDismissLevelUp = () => {
    setShowLevelUp(false);
    setLevelUpData(null);
  };
  
  const contextValue: LevelContextValue = {
    level: currentLevel,
    title,
    progress,
    pointsToNextLevel,
    currentPoints,
    badges,
    benefits,
    isLoading,
    refreshLevel
  };
  
  return (
    <LevelContext.Provider value={contextValue}>
      {children}
      
      {/* Level up celebration */}
      {showLevelUp && levelUpData && (
        <LevelUpCelebration
          previousLevel={levelUpData.previousLevel}
          newLevel={levelUpData.newLevel}
          newTitle={title}
          benefits={benefits}
          badgeUrl={badges.current}
          onDismiss={handleDismissLevelUp}
        />
      )}
    </LevelContext.Provider>
  );
}

/**
 * Hook for accessing level context
 */
export function useLevelContext() {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error('useLevelContext must be used within a LevelProvider');
  }
  return context;
}
