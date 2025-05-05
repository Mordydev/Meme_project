'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '@/lib/game-engine/AudioContext';
import { AudioCategory } from '@/lib/game-engine/AudioManager';
import { useEnvironmentStore, EnvironmentZone } from '@/lib/game-engine/EnvironmentManager';
import { useGame, GameState } from '@/lib/game-engine/GameContext';

interface PositionalSoundInfo {
  id: string;
  position: THREE.Vector3;
  age: number;
  maxAge: number;
}

// Sound effect configuration for each zone
interface ZoneSoundConfig {
  minInterval: number;
  maxInterval: number;
  maxActiveSounds: number;
  radius: number;
  sounds: string[];
}

export default function EnvironmentAudioEffects() {
  const { playPositionalSound, setPosition, stopSound } = useAudio();
  const { state, distance } = useGame();
  
  // Environment info
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  
  // Track active positional sounds
  const activeSoundsRef = useRef<PositionalSoundInfo[]>([]);
  const nextSpawnTimeRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  
  // Define sound configuration for each zone
  const zoneSoundConfigs = useRef<Record<EnvironmentZone, ZoneSoundConfig>>({
    [EnvironmentZone.CORAL_REEF]: {
      minInterval: 3,   // Minimum seconds between spawning new sounds
      maxInterval: 8,   // Maximum seconds between spawning new sounds
      maxActiveSounds: 6,  // Maximum number of sounds that can be active
      radius: 50,       // Radius around player to spawn sounds
      sounds: [
        'coral_reef_fish',
        'coral_reef_bubbles',
        'coral_reef_creak'
      ]
    },
    [EnvironmentZone.OPEN_OCEAN]: {
      minInterval: 5,
      maxInterval: 12,
      maxActiveSounds: 4,
      radius: 80,
      sounds: [
        'open_ocean_whale',
        'open_ocean_current',
        'open_ocean_distant'
      ]
    },
    [EnvironmentZone.DEEP_SEA]: {
      minInterval: 8,
      maxInterval: 20,
      maxActiveSounds: 3,
      radius: 60,
      sounds: [
        'deep_sea_creak',
        'deep_sea_rumble',
        'deep_sea_creature'
      ]
    }
  }).current;
  
  // Player position proxy - in a real implementation, this would come from actual player position
  const playerPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  
  // Spawn a new positional sound
  const spawnSound = () => {
    if (state !== GameState.PLAYING) return;
    
    const config = zoneSoundConfigs[currentZone];
    if (!config) return;
    
    // Don't spawn if we already have max active sounds
    if (activeSoundsRef.current.length >= config.maxActiveSounds) return;
    
    // Generate random position around player
    const angle = Math.random() * Math.PI * 2;
    const distance = config.radius * 0.3 + Math.random() * config.radius * 0.7;
    
    const playerPos = playerPositionRef.current;
    const position = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * distance,
      playerPos.y + (Math.random() - 0.5) * distance * 0.5,
      playerPos.z + Math.sin(angle) * distance
    );
    
    // Choose random sound from zone sounds
    const soundKey = config.sounds[Math.floor(Math.random() * config.sounds.length)];
    
    // Play the sound
    const soundId = playPositionalSound(
      soundKey,
      position,
      AudioCategory.SFX,
      {
        volume: 0.5 + Math.random() * 0.5,
        playbackRate: 0.9 + Math.random() * 0.2,
        refDistance: 5,
        rolloffFactor: 2.5,
        maxDistance: config.radius * 2
      }
    );
    
    // Add to active sounds
    activeSoundsRef.current.push({
      id: soundId,
      position,
      age: 0,
      maxAge: 5 + Math.random() * 10  // Sound will play for 5-15 seconds
    });
    
    // Set next spawn time
    nextSpawnTimeRef.current = elapsedTimeRef.current + 
      config.minInterval + Math.random() * (config.maxInterval - config.minInterval);
  };
  
  // Update logic for environment sounds
  useFrame((_, delta) => {
    if (state !== GameState.PLAYING) return;
    
    // Update elapsed time
    elapsedTimeRef.current += delta;
    
    // Check if we should spawn a new sound
    if (elapsedTimeRef.current >= nextSpawnTimeRef.current) {
      spawnSound();
    }
    
    // Update active sounds
    const activeSounds = activeSoundsRef.current;
    const remainingSounds: PositionalSoundInfo[] = [];
    
    for (const sound of activeSounds) {
      sound.age += delta;
      
      // Remove old sounds
      if (sound.age >= sound.maxAge) {
        stopSound(sound.id);
      } else {
        // Move sounds slightly based on "currents"
        const drift = new THREE.Vector3(
          (Math.random() - 0.5) * delta * 2,
          (Math.random() - 0.5) * delta,
          (Math.random() - 0.5) * delta * 2
        );
        
        sound.position.add(drift);
        setPosition(sound.id, sound.position);
        remainingSounds.push(sound);
      }
    }
    
    activeSoundsRef.current = remainingSounds;
    
    // Update player position - based on distance traveled
    // In a real implementation, this would be the actual player position
    playerPositionRef.current.z = -distance;
  });
  
  // Handle zone transitions
  useEffect(() => {
    if (isTransitioning) {
      // Clean up any active sounds when changing zones
      for (const sound of activeSoundsRef.current) {
        stopSound(sound.id);
      }
      activeSoundsRef.current = [];
      
      // Reset spawn timer
      nextSpawnTimeRef.current = elapsedTimeRef.current + 1;
    }
  }, [currentZone, isTransitioning, stopSound]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const sound of activeSoundsRef.current) {
        stopSound(sound.id);
      }
    };
  }, [stopSound]);
  
  // Create special one-shot effects
  const createSurfaceSplash = (position: THREE.Vector3) => {
    playPositionalSound(
      'surface_splash',
      position,
      AudioCategory.SFX,
      {
        volume: 1.0,
        playbackRate: 0.9 + Math.random() * 0.2,
        refDistance: 1,
        rolloffFactor: 2,
        maxDistance: 50
      }
    );
  };
  
  const createCollisionSound = (position: THREE.Vector3) => {
    playPositionalSound(
      'collision',
      position,
      AudioCategory.SFX,
      {
        volume: 1.0,
        playbackRate: 0.9 + Math.random() * 0.2,
        refDistance: 1,
        rolloffFactor: 2,
        maxDistance: 40
      }
    );
  };
  
  // This component doesn't render anything visible
  return null;
}