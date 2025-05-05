'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useQualityStore, QualityLevel, getQualityValue } from '@/lib/game-engine/QualityManager';
import * as THREE from 'three';
import AssetManager from '@/lib/game-engine/AssetManager';

interface QualityAdapterProps {
  levelManager: any; // Level manager instance
  obstacleManager: any; // Obstacle manager instance
  scene: THREE.Scene | THREE.Group; // Scene to apply settings to
  assetManager?: AssetManager; // Asset manager for texture quality
}

// Array to store frame times for FPS calculation
const FRAME_TIMES: number[] = [];
const MAX_FRAME_SAMPLES = 60; // Track 1 second at 60fps

export default function QualityAdapter({ 
  levelManager, 
  obstacleManager, 
  scene,
  assetManager
}: QualityAdapterProps) {
  const { 
    settings, 
    updateMetrics, 
    adaptQuality,
    autoAdapt
  } = useQualityStore();
  
  // Get renderer for advanced settings
  const { gl } = useThree();
  
  const lastFrameTime = useRef(0);
  const lastMetricsUpdate = useRef(0);
  const updateInterval = 500; // Update metrics every 500ms
  
  // Apply settings whenever they change
  useEffect(() => {
    if (!levelManager || !obstacleManager || !scene) return;
    
    // Apply view distance settings
    const viewDistance = getQualityValue(
      settings.viewDistance,
      30, // LOW: Shorter view distance
      50, // MEDIUM: Default
      80  // HIGH: Extended view distance
    );
    
    // Apply culling distance settings
    const cullDistance = getQualityValue(
      settings.cullDistance,
      40, // LOW: Aggressive culling
      30, // MEDIUM: Default
      20  // HIGH: Less aggressive culling (keep objects longer)
    );
    
    // Apply these values if the properties exist
    if (levelManager.generationDistance !== undefined) {
      levelManager.generationDistance = viewDistance;
    }
    
    if (levelManager.cullDistance !== undefined) {
      levelManager.cullDistance = cullDistance;
    }
    
    // Apply shadow quality settings if we have scene access
    if (scene instanceof THREE.Scene) {
      const shadowMapSize = getQualityValue(
        settings.shadowQuality,
        512,   // LOW
        1024,  // MEDIUM
        2048   // HIGH
      );
      
      // Configure shadow quality
      scene.traverse(object => {
        if (object instanceof THREE.Light && object.shadow) {
          object.shadow.mapSize.set(shadowMapSize, shadowMapSize);
          
          // Disable shadows completely on low quality
          object.castShadow = settings.shadowQuality !== QualityLevel.LOW;
          
          // Set shadow bias based on quality
          object.shadow.bias = getQualityValue(
            settings.shadowQuality,
            -0.001, // LOW
            -0.0005, // MEDIUM
            -0.0001  // HIGH
          );
        }
        
        // Configure object shadow casting/receiving
        if (object instanceof THREE.Mesh) {
          // Only main objects cast shadows on higher quality settings
          if (object.userData.isMainObject) {
            object.castShadow = settings.shadowQuality > QualityLevel.LOW;
          } else {
            object.castShadow = settings.shadowQuality === QualityLevel.HIGH;
          }
          
          // All objects receive shadows
          object.receiveShadow = settings.shadowQuality > QualityLevel.LOW;
        }
      });
    }
    
    // Configure particle density if the function exists
    if (typeof window !== 'undefined' && window.setParticleDensity) {
      const particleDensity = getQualityValue(
        settings.particleDensity,
        0.3,  // LOW: 30% of particles
        0.7,  // MEDIUM: 70% of particles
        1.0   // HIGH: 100% of particles
      );
      window.setParticleDensity(particleDensity);
    }
    
    // Configure geometry detail
    if (scene) {
      scene.traverse(object => {
        if (object instanceof THREE.Mesh && object.userData.detailLevel) {
          // Only show objects that match or are below current detail level
          object.visible = object.userData.detailLevel <= settings.geometryDetail;
        }
      });
    }
    
    // If post-processing effects are available, configure them
    if (typeof window !== 'undefined' && window.setPostProcessingLevel) {
      window.setPostProcessingLevel(settings.postProcessing);
    }
    
    // Update texture quality settings in the asset manager if available
    if (assetManager) {
      assetManager.setTextureQuality(settings.textureQuality);
    }
    
    // Set anisotropy based on quality settings
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    const anisotropyLevel = getQualityValue(
      settings.textureQuality,
      1,                      // LOW: No anisotropic filtering
      Math.min(4, maxAnisotropy),  // MEDIUM: Some anisotropic filtering
      maxAnisotropy           // HIGH: Maximum anisotropic filtering
    );
    
    // Update all loaded textures in the scene
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        const material = object.material;
        if (material instanceof THREE.MeshBasicMaterial || 
            material instanceof THREE.MeshStandardMaterial || 
            material instanceof THREE.MeshPhongMaterial) {
          if (material.map) {
            material.map.anisotropy = anisotropyLevel;
            material.needsUpdate = true;
          }
        }
      }
    });
    
  }, [settings, levelManager, obstacleManager, scene, assetManager, gl]);
  
  // Monitor performance metrics
  useFrame((_, delta) => {
    if (!autoAdapt) return;
    
    // Calculate and store frame time
    const frameTime = delta * 1000; // Convert to milliseconds
    
    // Track frame times for rolling average
    FRAME_TIMES.push(frameTime);
    if (FRAME_TIMES.length > MAX_FRAME_SAMPLES) {
      FRAME_TIMES.shift();
    }
    
    // Calculate average frame time and FPS
    const avgFrameTime = FRAME_TIMES.reduce((sum, time) => sum + time, 0) / FRAME_TIMES.length;
    const fps = Math.round(1000 / avgFrameTime);
    
    // Update performance metrics periodically
    const now = performance.now();
    if (now - lastMetricsUpdate.current > updateInterval) {
      lastMetricsUpdate.current = now;
      
      // Get memory usage if available (Chrome only feature)
      let memoryUsage = 0;
      if ((performance as any).memory) {
        memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
      }
      
      // Update metrics in store
      updateMetrics({
        frameRate: fps,
        averageFrameTime: avgFrameTime,
        memoryUsage
      });
      
      // Trigger quality adaptation
      adaptQuality();
    }
    
    lastFrameTime.current = now;
  });
  
  // This component doesn't render anything
  return null;
}

// Add a global interface for optional functions that may be implemented elsewhere
declare global {
  interface Window {
    setParticleDensity?: (density: number) => void;
    setPostProcessingLevel?: (level: QualityLevel) => void;
  }
}