'use client';

import { create } from 'zustand';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyParameters {
  speedMultiplier: number;
  obstacleDensity: number;
  collectibleDensity: number;
  powerUpFrequency: number;
  patternComplexity: number;
}

interface DifficultyState {
  currentLevel: DifficultyLevel;
  currentDistance: number;
  distanceThresholds: number[];
  parameters: Record<DifficultyLevel, DifficultyParameters>;
  getCurrentParameters: () => DifficultyParameters;
  updateDistance: (distance: number) => void;
  reset: () => void;
}

export const useDifficultyStore = create<DifficultyState>((set, get) => ({
  currentLevel: 1,
  currentDistance: 0,
  distanceThresholds: [500, 1500, 3000, 5000, 8000],
  
  parameters: {
    1: {
      speedMultiplier: 1.0,
      obstacleDensity: 0.3,
      collectibleDensity: 0.5,
      powerUpFrequency: 0.01,
      patternComplexity: 1
    },
    2: {
      speedMultiplier: 1.25,
      obstacleDensity: 0.4,
      collectibleDensity: 0.6,
      powerUpFrequency: 0.015,
      patternComplexity: 2
    },
    3: {
      speedMultiplier: 1.5,
      obstacleDensity: 0.5,
      collectibleDensity: 0.7,
      powerUpFrequency: 0.02,
      patternComplexity: 3
    },
    4: {
      speedMultiplier: 1.8,
      obstacleDensity: 0.6,
      collectibleDensity: 0.8,
      powerUpFrequency: 0.025,
      patternComplexity: 4
    },
    5: {
      speedMultiplier: 2.2,
      obstacleDensity: 0.7,
      collectibleDensity: 0.9,
      powerUpFrequency: 0.03,
      patternComplexity: 5
    }
  },
  
  getCurrentParameters: () => {
    return get().parameters[get().currentLevel];
  },
  
  updateDistance: (distance: number) => {
    const { distanceThresholds, currentLevel } = get();
    let newLevel = currentLevel;
    
    // Determine level based on distance
    for (let i = 0; i < distanceThresholds.length; i++) {
      if (distance < distanceThresholds[i]) {
        newLevel = (i + 1) as DifficultyLevel;
        break;
      }
      
      if (i === distanceThresholds.length - 1 && distance >= distanceThresholds[i]) {
        newLevel = 5;
      }
    }
    
    // Only update if level changed
    if (newLevel !== currentLevel) {
      console.log(`Difficulty increased to level ${newLevel}`);
    }
    
    set({ currentDistance: distance, currentLevel: newLevel });
  },
  
  reset: () => {
    set({
      currentLevel: 1,
      currentDistance: 0
    });
  }
}));

// Utility hook to get interpolated parameters between levels for smoother transitions
export function useInterpolatedDifficulty() {
  const { currentLevel, currentDistance, distanceThresholds, parameters } = useDifficultyStore();
  
  // If we're at max level, no interpolation needed
  if (currentLevel === 5) {
    return parameters[5];
  }
  
  // Get current and next level thresholds
  const currentThreshold = currentLevel === 1 ? 0 : distanceThresholds[currentLevel - 2];
  const nextThreshold = distanceThresholds[currentLevel - 1];
  
  // Calculate interpolation factor (0 to 1)
  const range = nextThreshold - currentThreshold;
  const progress = (currentDistance - currentThreshold) / range;
  const interpolationFactor = Math.max(0, Math.min(1, progress));
  
  // Get current and next level parameters
  const current = parameters[currentLevel];
  const next = parameters[currentLevel + 1 as DifficultyLevel];
  
  // Interpolate between current and next level
  return {
    speedMultiplier: current.speedMultiplier + (next.speedMultiplier - current.speedMultiplier) * interpolationFactor,
    obstacleDensity: current.obstacleDensity + (next.obstacleDensity - current.obstacleDensity) * interpolationFactor,
    collectibleDensity: current.collectibleDensity + (next.collectibleDensity - current.collectibleDensity) * interpolationFactor,
    powerUpFrequency: current.powerUpFrequency + (next.powerUpFrequency - current.powerUpFrequency) * interpolationFactor,
    patternComplexity: current.patternComplexity // Don't interpolate complexity - use discrete levels
  };
}