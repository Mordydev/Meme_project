'use client';

import { create } from 'zustand';
import * as THREE from 'three';

export enum EnvironmentZone {
  CORAL_REEF = 'coral_reef',
  OPEN_OCEAN = 'open_ocean',
  DEEP_SEA = 'deep_sea'
}

export interface ZoneParameters {
  fogColor: string;
  fogDensity: number;
  lightColor: string;
  lightIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  particleDensity: number;
  backgroundColor: string;
}

export interface EnvironmentState {
  currentZone: EnvironmentZone;
  previousZone: EnvironmentZone | null;
  transitionProgress: number;
  distanceThresholds: Record<EnvironmentZone, number>;
  zoneParameters: Record<EnvironmentZone, ZoneParameters>;
  isTransitioning: boolean;
  
  getCurrentParameters: () => ZoneParameters;
  getInterpolatedParameters: () => ZoneParameters;
  updateDistance: (distance: number) => void;
  setTransitionProgress: (progress: number) => void;
  reset: () => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  currentZone: EnvironmentZone.CORAL_REEF,
  previousZone: null,
  transitionProgress: 0,
  isTransitioning: false,
  
  distanceThresholds: {
    [EnvironmentZone.CORAL_REEF]: 0,
    [EnvironmentZone.OPEN_OCEAN]: 3000,
    [EnvironmentZone.DEEP_SEA]: 7000
  },
  
  zoneParameters: {
    [EnvironmentZone.CORAL_REEF]: {
      fogColor: '#0c6b9c',
      fogDensity: 0.02,
      lightColor: '#ffffff',
      lightIntensity: 0.8,
      ambientColor: '#4a6a82',
      ambientIntensity: 0.4,
      particleDensity: 0.5,
      backgroundColor: '#0c6b9c'
    },
    [EnvironmentZone.OPEN_OCEAN]: {
      fogColor: '#0a4d7a',
      fogDensity: 0.01,
      lightColor: '#e0f7ff',
      lightIntensity: 0.7,
      ambientColor: '#3a5a72',
      ambientIntensity: 0.3,
      particleDensity: 0.3,
      backgroundColor: '#0a4d7a'
    },
    [EnvironmentZone.DEEP_SEA]: {
      fogColor: '#041e31',
      fogDensity: 0.03,
      lightColor: '#203d5e',
      lightIntensity: 0.4,
      ambientColor: '#152a3b',
      ambientIntensity: 0.2,
      particleDensity: 0.1,
      backgroundColor: '#041e31'
    }
  },
  
  getCurrentParameters: () => {
    return get().zoneParameters[get().currentZone];
  },
  
  getInterpolatedParameters: () => {
    const { currentZone, previousZone, transitionProgress, zoneParameters } = get();
    
    // If not transitioning or no previous zone, return current parameters
    if (!previousZone || transitionProgress <= 0) {
      return zoneParameters[currentZone];
    }
    
    // If transition complete, return current parameters
    if (transitionProgress >= 1) {
      return zoneParameters[currentZone];
    }
    
    // Get current and previous parameters
    const current = zoneParameters[currentZone];
    const previous = zoneParameters[previousZone];
    
    // Interpolate color parameters
    const interpolateColor = (color1: string, color2: string, progress: number) => {
      const c1 = new THREE.Color(color1);
      const c2 = new THREE.Color(color2);
      const result = new THREE.Color();
      return result.lerpColors(c1, c2, progress).getHexString();
    };
    
    // Interpolate numerical parameters
    const interpolate = (value1: number, value2: number, progress: number) => {
      return value1 + (value2 - value1) * progress;
    };
    
    // Return interpolated parameters
    return {
      fogColor: interpolateColor(previous.fogColor, current.fogColor, transitionProgress),
      fogDensity: interpolate(previous.fogDensity, current.fogDensity, transitionProgress),
      lightColor: interpolateColor(previous.lightColor, current.lightColor, transitionProgress),
      lightIntensity: interpolate(previous.lightIntensity, current.lightIntensity, transitionProgress),
      ambientColor: interpolateColor(previous.ambientColor, current.ambientColor, transitionProgress),
      ambientIntensity: interpolate(previous.ambientIntensity, current.ambientIntensity, transitionProgress),
      particleDensity: interpolate(previous.particleDensity, current.particleDensity, transitionProgress),
      backgroundColor: interpolateColor(previous.backgroundColor, current.backgroundColor, transitionProgress)
    };
  },
  
  updateDistance: (distance: number) => {
    const { currentZone, distanceThresholds } = get();
    
    // Find the appropriate zone for this distance
    let newZone = EnvironmentZone.CORAL_REEF;
    
    if (distance >= distanceThresholds[EnvironmentZone.DEEP_SEA]) {
      newZone = EnvironmentZone.DEEP_SEA;
    } else if (distance >= distanceThresholds[EnvironmentZone.OPEN_OCEAN]) {
      newZone = EnvironmentZone.OPEN_OCEAN;
    }
    
    // Only update if zone changed
    if (newZone !== currentZone) {
      console.log(`Transitioning from ${currentZone} to ${newZone}`);
      set({
        previousZone: currentZone,
        currentZone: newZone,
        transitionProgress: 0,
        isTransitioning: true
      });
    }
  },
  
  setTransitionProgress: (progress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    set({ 
      transitionProgress: clampedProgress,
      isTransitioning: clampedProgress < 1
    });
  },
  
  reset: () => {
    set({
      currentZone: EnvironmentZone.CORAL_REEF,
      previousZone: null,
      transitionProgress: 0,
      isTransitioning: false
    });
  }
}));