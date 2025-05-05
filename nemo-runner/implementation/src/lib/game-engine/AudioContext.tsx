'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { create } from 'zustand';
import AudioManager, { AudioCategory } from './AudioManager';
import { GameState, useGame } from './GameContext';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';
import * as THREE from 'three';

// Singleton AudioManager instance
let audioManagerInstance: AudioManager | null = null;

export const getAudioManager = (): AudioManager => {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
};

// Audio state store
interface AudioState {
  muted: boolean;
  globalVolume: number;
  categoryVolumes: Record<AudioCategory, number>;
  underwaterEffectEnabled: boolean;
  
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setGlobalVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  setUnderwaterEffectEnabled: (enabled: boolean) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  muted: false,
  globalVolume: 1.0,
  categoryVolumes: {
    [AudioCategory.MUSIC]: 0.5,
    [AudioCategory.SFX]: 0.7,
    [AudioCategory.AMBIENT]: 0.6,
    [AudioCategory.UI]: 0.8
  },
  underwaterEffectEnabled: true,
  
  setMuted: (muted: boolean) => set({ muted }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setGlobalVolume: (volume: number) => set({ globalVolume: Math.max(0, Math.min(1, volume)) }),
  setCategoryVolume: (category: AudioCategory, volume: number) => 
    set((state) => ({ 
      categoryVolumes: {
        ...state.categoryVolumes,
        [category]: Math.max(0, Math.min(1, volume))
      }
    })),
  setUnderwaterEffectEnabled: (enabled: boolean) => set({ underwaterEffectEnabled: enabled })
}));

// Audio context for components
interface AudioContextValue {
  playSound: (key: string, category?: AudioCategory, loop?: boolean, params?: any) => string;
  playPositionalSound: (key: string, position: THREE.Vector3, category?: AudioCategory, params?: any) => string;
  stopSound: (audioId: string) => void;
  pauseSound: (audioId: string) => void;
  resumeSound: (audioId: string) => void;
  setPosition: (audioId: string, position: THREE.Vector3) => void;
  setUnderwaterEffectIntensity: (intensity: number) => void;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audioManager = useRef(getAudioManager());
  const { state } = useGame();
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const zoneProgress = useEnvironmentStore(state => state.transitionProgress);
  
  const muted = useAudioStore(state => state.muted);
  const globalVolume = useAudioStore(state => state.globalVolume);
  const categoryVolumes = useAudioStore(state => state.categoryVolumes);
  const underwaterEffectEnabled = useAudioStore(state => state.underwaterEffectEnabled);
  
  // Apply volume settings to AudioManager
  useEffect(() => {
    const manager = audioManager.current;
    manager.setMute(muted);
    manager.setGlobalVolume(globalVolume);
    
    Object.entries(categoryVolumes).forEach(([category, volume]) => {
      manager.setCategoryVolume(category as AudioCategory, volume);
    });
  }, [muted, globalVolume, categoryVolumes]);
  
  // Handle game state changes
  useEffect(() => {
    const manager = audioManager.current;
    
    if (state === GameState.PLAYING) {
      manager.resumeAll();
    } else if (state === GameState.PAUSED || state === GameState.GAME_OVER) {
      manager.pauseAll();
    }
    
    // Clean up inactive audio sources periodically
    const cleanupInterval = setInterval(() => {
      manager.cleanupInactiveSources();
    }, 5000);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [state]);
  
  // Update environment zone for audio
  useEffect(() => {
    audioManager.current.updateEnvironmentZone(currentZone);
    
    // Set underwater effect intensity based on zone
    // Deep Sea has most intense effect, Open Ocean medium, Coral Reef least
    if (underwaterEffectEnabled) {
      let intensity = 0;
      
      switch (currentZone) {
        case EnvironmentZone.CORAL_REEF:
          intensity = 0.3;
          break;
        case EnvironmentZone.OPEN_OCEAN:
          intensity = 0.6;
          break;
        case EnvironmentZone.DEEP_SEA:
          intensity = 0.9;
          break;
      }
      
      audioManager.current.setUnderwaterEffectIntensity(intensity);
    }
  }, [currentZone, underwaterEffectEnabled]);
  
  // Functions for the context
  const playSound = (
    key: string, 
    category: AudioCategory = AudioCategory.SFX, 
    loop: boolean = false,
    params: any = {}
  ): string => {
    const audioId = audioManager.current.createAudio(
      key, 
      category, 
      { ...params, loop }
    );
    
    if (audioId) {
      audioManager.current.play(audioId);
    }
    
    return audioId;
  };
  
  const playPositionalSound = (
    key: string, 
    position: THREE.Vector3, 
    category: AudioCategory = AudioCategory.SFX,
    params: any = {}
  ): string => {
    const audioId = audioManager.current.createAudio(
      key, 
      category, 
      { 
        ...params, 
        positional: true,
        loop: params.loop || false 
      }
    );
    
    if (audioId) {
      audioManager.current.setPosition(audioId, position);
      audioManager.current.play(audioId);
    }
    
    return audioId;
  };
  
  const stopSound = (audioId: string): void => {
    audioManager.current.stop(audioId);
  };
  
  const pauseSound = (audioId: string): void => {
    audioManager.current.pause(audioId);
  };
  
  const resumeSound = (audioId: string): void => {
    audioManager.current.play(audioId);
  };
  
  const setPosition = (audioId: string, position: THREE.Vector3): void => {
    audioManager.current.setPosition(audioId, position);
  };
  
  const setUnderwaterEffectIntensity = (intensity: number): void => {
    if (underwaterEffectEnabled) {
      audioManager.current.setUnderwaterEffectIntensity(intensity);
    }
  };
  
  const value = {
    playSound,
    playPositionalSound,
    stopSound,
    pauseSound,
    resumeSound,
    setPosition,
    setUnderwaterEffectIntensity
  };
  
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}