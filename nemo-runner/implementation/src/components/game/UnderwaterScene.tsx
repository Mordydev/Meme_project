'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';
import CoralReefZone from './environments/CoralReefZone';
import OpenOceanZone from './environments/OpenOceanZone';
import DeepSeaZone from './environments/DeepSeaZone';
import { EnvironmentZoneRef } from './environments/CoralReefZone';
import { useEnvironmentStore, EnvironmentZone } from '@/lib/game-engine/EnvironmentManager';
import AmbientAudioSystem from './audio/AmbientAudioSystem';
import EnvironmentAudioEffects from './audio/EnvironmentAudioEffects';
import { AudioProvider } from '@/lib/game-engine/AudioContext';

export default function UnderwaterScene() {
  const { state, speed, increaseDistance, distance } = useGame();
  const isPlaying = state === GameState.PLAYING;
  
  // Environment store hooks
  const updateEnvironmentDistance = useEnvironmentStore(state => state.updateDistance);
  const setTransitionProgress = useEnvironmentStore(state => state.setTransitionProgress);
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  const resetEnvironment = useEnvironmentStore(state => state.reset);
  const zoneParameters = useEnvironmentStore(state => state.getInterpolatedParameters());
  
  // References to environment zones
  const coralReefRef = useRef<EnvironmentZoneRef>(null);
  const openOceanRef = useRef<EnvironmentZoneRef>(null);
  const deepSeaRef = useRef<EnvironmentZoneRef>(null);
  
  // Scene references
  const fogRef = useRef<THREE.Fog | null>(null);
  const sceneRef = useRef<THREE.Group>(null);
  
  // Transition timer
  const transitionTimerRef = useRef<number>(0);
  const transitionDuration = 3; // seconds for transition
  
  // Reset environment when game state changes
  useEffect(() => {
    if (state === GameState.MENU || state === GameState.GAME_OVER) {
      resetEnvironment();
      transitionTimerRef.current = 0;
    }
  }, [state, resetEnvironment]);
  
  // Update environment based on player distance
  useEffect(() => {
    if (isPlaying) {
      updateEnvironmentDistance(distance);
    }
  }, [distance, isPlaying, updateEnvironmentDistance]);
  
  // Handle zone transitions
  useFrame((state, delta) => {
    if (!isPlaying) return;
    
    // Update distance based on speed
    increaseDistance(speed * delta * 10);
    
    // Update environment parameters based on current zone
    const scene = state.scene;
    
    // Apply zone parameters
    if (scene.fog) {
      scene.fog.color.set(zoneParameters.fogColor);
      (scene.fog as THREE.FogExp2).density = zoneParameters.fogDensity;
    }
    
    scene.background = new THREE.Color(zoneParameters.backgroundColor);
    
    // Find the directional light and update it
    scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) {
        object.color.set(zoneParameters.lightColor);
        object.intensity = zoneParameters.lightIntensity;
      }
      if (object instanceof THREE.AmbientLight) {
        object.color.set(zoneParameters.ambientColor);
        object.intensity = zoneParameters.ambientIntensity;
      }
    });
    
    // Handle zone transitions
    if (isTransitioning) {
      transitionTimerRef.current += delta;
      const progress = Math.min(1, transitionTimerRef.current / transitionDuration);
      setTransitionProgress(progress);
      
      // Reset transition timer when complete
      if (progress >= 1) {
        transitionTimerRef.current = 0;
      }
    }
    
    // Animate environment elements
    if (coralReefRef.current) {
      coralReefRef.current.update(delta);
    }
    
    if (openOceanRef.current) {
      openOceanRef.current.update(delta);
    }
    
    if (deepSeaRef.current) {
      deepSeaRef.current.update(delta);
    }
  });
  
  return (
    <AudioProvider>
      <group ref={sceneRef}>
        {/* Audio Systems */}
        <AmbientAudioSystem />
        <EnvironmentAudioEffects />
        
        {/* Environment Zones */}
        <CoralReefZone 
          ref={coralReefRef} 
          active={currentZone === EnvironmentZone.CORAL_REEF || isTransitioning} 
        />
        
        <OpenOceanZone 
          ref={openOceanRef} 
          active={currentZone === EnvironmentZone.OPEN_OCEAN || isTransitioning} 
        />
        
        <DeepSeaZone 
          ref={deepSeaRef} 
          active={currentZone === EnvironmentZone.DEEP_SEA || isTransitioning} 
        />
      </group>
    </AudioProvider>
  );
}