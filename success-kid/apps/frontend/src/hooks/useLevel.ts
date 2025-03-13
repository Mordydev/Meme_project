'use client';

import { useLevelContext } from '@/components/features/levels/LevelProvider';

/**
 * Hook for accessing and interacting with level data
 * 
 * This hook provides a simplified interface to the level system
 * and wraps the useLevelContext hook.
 */
export function useLevel() {
  const {
    level,
    title,
    progress,
    pointsToNextLevel,
    currentPoints,
    badges,
    benefits,
    isLoading,
    refreshLevel
  } = useLevelContext();
  
  /**
   * Format points with appropriate suffix (K, M)
   */
  const formatPoints = (points: number): string => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(points % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (points >= 1000) {
      return `${(points / 1000).toFixed(points % 1000 === 0 ? 0 : 1)}K`;
    }
    return points.toString();
  };
  
  /**
   * Calculate the formatted points needed for next level
   */
  const getFormattedPointsToNextLevel = (): string => {
    return formatPoints(pointsToNextLevel);
  };
  
  /**
   * Check if user is at max level
   */
  const isMaxLevel = (): boolean => {
    // Current implementation max is level 10
    return level >= 10;
  };
  
  /**
   * Get level-specific color class
   */
  const getLevelColorClass = (): string => {
    if (level <= 3) return 'text-primary bg-primary/10';
    if (level <= 6) return 'text-secondary bg-secondary/10';
    return 'text-accent bg-accent/10';
  };
  
  return {
    // Raw data
    level,
    title,
    progress,
    pointsToNextLevel,
    currentPoints,
    badges,
    benefits,
    isLoading,
    // Helper methods
    refreshLevel,
    formatPoints,
    getFormattedPointsToNextLevel,
    isMaxLevel,
    getLevelColorClass
  };
}
