'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  GodRays, 
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  BrightnessContrast
} from '@react-three/postprocessing';
import { 
  BlendFunction, 
  KernelSize,
  Resolution
} from 'postprocessing';
import * as THREE from 'three';
import { useEnvironmentStore } from './EnvironmentManager';

export function AdvancedWaterEffects() {
  // Get environment parameters
  const environmentParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  
  // References for sun position and material
  const sunRef = useRef<THREE.Mesh>(null);
  const sunMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // Camera from three context
  const { camera } = useThree();
  
  // Create water fog color based on environment
  const fogColor = useMemo(() => new THREE.Color(environmentParams.fogColor), [environmentParams.fogColor]);
  
  // Adjust sun color and intensity based on environment
  const sunColor = useMemo(() => {
    const color = new THREE.Color(environmentParams.lightColor);
    return color;
  }, [environmentParams.lightColor]);
  
  // Dynamic bloom intensity based on environment
  const bloomIntensity = useMemo(() => {
    // Deeper water has more pronounced bloom on bioluminescent elements
    if (environmentParams.fogColor === '#041e31') { // Deep Sea
      return 1.5;
    } else if (environmentParams.fogColor === '#0a4d7a') { // Open Ocean
      return 1.0;
    } else { // Coral Reef
      return 0.8;
    }
  }, [environmentParams.fogColor]);
  
  // Update sun position to stay above camera
  useFrame(({ camera }) => {
    if (sunRef.current) {
      // Position sun above and in front of camera
      sunRef.current.position.x = camera.position.x;
      sunRef.current.position.y = camera.position.y + 20;
      sunRef.current.position.z = camera.position.z - 15;
      
      // Update sun material color
      if (sunMaterialRef.current) {
        sunMaterialRef.current.color = sunColor;
      }
    }
  });
  
  return (
    <>
      {/* Sun light source for god rays */}
      <mesh ref={sunRef} position={[0, 20, -15]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial ref={sunMaterialRef} color={sunColor} />
      </mesh>
      
      {/* Post-processing effects */}
      <EffectComposer multisampling={2}>
        {/* God rays from sun - reduced intensity */}
        {sunRef.current && (
          <GodRays
            sun={sunRef.current}
            blendFunction={BlendFunction.ADD}
            samples={30}
            density={0.7}
            decay={0.88}
            weight={0.25}
            exposure={0.4}
            clampMax={1}
            kernelSize={KernelSize.MEDIUM}
            blur={true}
          />
        )}
        
        {/* Bloom effect for underwater glow - reduced intensity */}
        <Bloom
          intensity={bloomIntensity * 0.6}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.7}
          height={Resolution.AUTO_SIZE}
          kernelSize={KernelSize.LARGE}
        />
        
        {/* Lighter depth of field effect for better clarity */}
        <DepthOfField
          focusDistance={0.2}
          focalLength={0.2}
          bokehScale={3}
        />
        
        {/* Reduced vignette for underwater feel */}
        <Vignette
          offset={0.7}
          darkness={0.3}
          blendFunction={BlendFunction.NORMAL}
        />
        
        {/* Improved brightness/contrast adjustments for clarity */}
        <BrightnessContrast
          brightness={0.08}
          contrast={0.1}
        />
      </EffectComposer>
      
      {/* Underwater fog with improved visibility */}
      <fog 
        attach="fog" 
        args={[
          fogColor,
          15, // Increased near distance for better visibility
          100  // Increased far distance for better clarity
        ]} 
      />
    </>
  );
}