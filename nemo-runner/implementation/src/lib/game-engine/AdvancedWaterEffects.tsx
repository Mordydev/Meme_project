'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Effects, 
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
      <EffectComposer multisampling={0}>
        {/* God rays from sun */}
        {sunRef.current && (
          <GodRays
            sun={sunRef.current}
            blendFunction={BlendFunction.ADD}
            samples={60}
            density={0.96}
            decay={0.93}
            weight={0.4}
            exposure={0.6}
            clampMax={1}
            kernelSize={KernelSize.LARGE}
            blur={true}
          />
        )}
        
        {/* Bloom effect for underwater glow */}
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={Resolution.AUTO_SIZE}
          kernelSize={KernelSize.VERY_LARGE}
        />
        
        {/* Depth of field effect */}
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.5}
          bokehScale={6}
        />
        
        {/* Vignette for underwater feel */}
        <Vignette
          offset={0.5}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
        
        {/* Brightness/contrast adjustments based on environment */}
        <BrightnessContrast
          brightness={0.03}
          contrast={0.15}
        />
      </EffectComposer>
      
      {/* Underwater fog */}
      <fog 
        attach="fog" 
        args={[
          fogColor,
          10, // Near
          70  // Far - adjusted based on environment
        ]} 
      />
    </>
  );
}