'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '@/lib/game-engine/AudioContext';
import { AudioCategory } from '@/lib/game-engine/AudioManager';
import { useEnvironmentStore, EnvironmentZone } from '@/lib/game-engine/EnvironmentManager';
import { useGame, GameState } from '@/lib/game-engine/GameContext';

interface AmbientSoundInfo {
  id: string;
  active: boolean;
  volume: number;
  targetVolume: number;
}

export default function AmbientAudioSystem() {
  const { playSound, stopSound } = useAudio();
  const { state } = useGame();
  
  // Environment info
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  const transitionProgress = useEnvironmentStore(state => state.transitionProgress);
  
  // Refs for tracking sound IDs
  const ambientSoundsRef = useRef<Map<EnvironmentZone, AmbientSoundInfo>>(new Map());
  
  // Initialize ambient sounds on mount
  useEffect(() => {
    const ambientSounds = ambientSoundsRef.current;
    
    // Create ambient sounds for each zone (these would need to be preloaded)
    const createZoneAmbient = (zone: EnvironmentZone, active: boolean) => {
      // Mapping of sound keys to zones - these should match asset keys in AssetManager
      const soundKeysMap: Record<EnvironmentZone, string> = {
        [EnvironmentZone.CORAL_REEF]: 'ambient_coral_reef',
        [EnvironmentZone.OPEN_OCEAN]: 'ambient_open_ocean',
        [EnvironmentZone.DEEP_SEA]: 'ambient_deep_sea'
      };
      
      const soundId = playSound(
        soundKeysMap[zone],
        AudioCategory.AMBIENT,
        true, // Loop the ambient sound
        { 
          volume: active ? 0.8 : 0, // Start with volume 0 if not active
          playbackRate: 1.0
        }
      );
      
      ambientSounds.set(zone, {
        id: soundId,
        active,
        volume: active ? 0.8 : 0,
        targetVolume: active ? 0.8 : 0
      });
    };
    
    // Create ambient sounds for all zones
    createZoneAmbient(EnvironmentZone.CORAL_REEF, currentZone === EnvironmentZone.CORAL_REEF);
    createZoneAmbient(EnvironmentZone.OPEN_OCEAN, currentZone === EnvironmentZone.OPEN_OCEAN);
    createZoneAmbient(EnvironmentZone.DEEP_SEA, currentZone === EnvironmentZone.DEEP_SEA);
    
    // Clean up function to stop all sounds when unmounted
    return () => {
      for (const [_, info] of ambientSounds) {
        stopSound(info.id);
      }
      ambientSounds.clear();
    };
  }, [playSound, stopSound, currentZone]);
  
  // Handle zone transitions and state changes
  useEffect(() => {
    const ambientSounds = ambientSoundsRef.current;
    
    if (state === GameState.PLAYING) {
      // Set target volumes based on current zone
      for (const [zone, info] of ambientSounds) {
        const isCurrentZone = zone === currentZone;
        const isPreviousZone = isTransitioning && zone !== currentZone;
        
        let newTargetVolume = 0;
        
        if (isCurrentZone) {
          newTargetVolume = 0.8; // Full volume for current zone
        } else if (isPreviousZone) {
          newTargetVolume = 0.8 * (1 - transitionProgress); // Fade out for previous zone
        }
        
        ambientSounds.set(zone, {
          ...info,
          targetVolume: newTargetVolume
        });
      }
    } else {
      // If not playing, set all target volumes to 0
      for (const [zone, info] of ambientSounds) {
        ambientSounds.set(zone, {
          ...info,
          targetVolume: 0
        });
      }
    }
  }, [state, currentZone, isTransitioning, transitionProgress]);
  
  // Smoothly adjust volumes in animation frame
  useFrame((_, delta) => {
    const ambientSounds = ambientSoundsRef.current;
    const fadeSpeed = 1.5; // Adjust for faster/slower fades
    
    // Update volumes with smooth transitions
    for (const [zone, info] of ambientSounds) {
      if (info.volume !== info.targetVolume) {
        let newVolume = info.volume;
        
        if (info.volume < info.targetVolume) {
          newVolume = Math.min(info.targetVolume, info.volume + fadeSpeed * delta);
        } else {
          newVolume = Math.max(info.targetVolume, info.volume - fadeSpeed * delta);
        }
        
        // Update the local volume tracking
        ambientSounds.set(zone, {
          ...info,
          volume: newVolume
        });
        
        // This would need an actual hook to change the volume of an existing sound
        // Ideally, AudioManager would have a method to set volume on an existing sound ID
        // For now, this is a placeholder until we implement that function
      }
    }
  });
  
  // This component doesn't render anything visible
  return null;
}