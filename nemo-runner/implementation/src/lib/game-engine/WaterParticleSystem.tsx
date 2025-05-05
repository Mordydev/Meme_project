'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvironmentStore } from './EnvironmentManager';

// Enhanced particle system for underwater effects
export function WaterParticleSystem() {
  const { camera } = useThree();
  const environmentParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  
  // Particle parameters
  const count = 1000;
  const size = 0.1;
  
  // Create particle groups
  const bubblesRef = useRef<THREE.Points>();
  const debrisRef = useRef<THREE.Points>();
  const planktonRef = useRef<THREE.Points>();
  
  // Create particle positions based on environment
  const { bubblePositions, bubbleColors, debrisPositions, debrisColors, planktonPositions, planktonColors } = useMemo(() => {
    // Create arrays for positions and colors
    const bubblePositions = new Float32Array(count * 3);
    const bubbleColors = new Float32Array(count * 3);
    const debrisPositions = new Float32Array(count * 3);
    const debrisColors = new Float32Array(count * 3);
    const planktonPositions = new Float32Array(count * 3);
    const planktonColors = new Float32Array(count * 3);
    
    // Bubble parameters
    const bubbleColor = new THREE.Color('#FFFFFF');
    
    // Debris parameters - based on environment
    const debrisBaseColor = new THREE.Color(environmentParams.fogColor);
    debrisBaseColor.multiplyScalar(1.2); // Slightly brighter than background
    
    // Plankton parameters - glowing particles
    const planktonBaseColor = new THREE.Color('#88CCFF');
    
    // Create random positions and colors for each particle type
    for (let i = 0; i < count; i++) {
      // Generate random positions in a volume around the camera
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      
      // Bubbles (tend to rise)
      bubblePositions[i * 3] = x;
      bubblePositions[i * 3 + 1] = y;
      bubblePositions[i * 3 + 2] = z;
      
      // Add slight color variation to bubbles
      bubbleColors[i * 3] = bubbleColor.r * (0.9 + Math.random() * 0.2);
      bubbleColors[i * 3 + 1] = bubbleColor.g * (0.9 + Math.random() * 0.2);
      bubbleColors[i * 3 + 2] = bubbleColor.b * (0.9 + Math.random() * 0.2);
      
      // Debris (drifts slowly)
      debrisPositions[i * 3] = x;
      debrisPositions[i * 3 + 1] = y;
      debrisPositions[i * 3 + 2] = z;
      
      // Add slight color variation to debris
      const colorVariation = 0.3 * Math.random();
      debrisColors[i * 3] = debrisBaseColor.r * (0.8 + colorVariation);
      debrisColors[i * 3 + 1] = debrisBaseColor.g * (0.8 + colorVariation);
      debrisColors[i * 3 + 2] = debrisBaseColor.b * (0.8 + colorVariation);
      
      // Plankton (moves slowly in currents)
      planktonPositions[i * 3] = x;
      planktonPositions[i * 3 + 1] = y;
      planktonPositions[i * 3 + 2] = z;
      
      // Add color variation to plankton
      planktonColors[i * 3] = planktonBaseColor.r * (0.8 + Math.random() * 0.4);
      planktonColors[i * 3 + 1] = planktonBaseColor.g * (0.8 + Math.random() * 0.4);
      planktonColors[i * 3 + 2] = planktonBaseColor.b * (0.8 + Math.random() * 0.4);
    }
    
    return { 
      bubblePositions, 
      bubbleColors, 
      debrisPositions, 
      debrisColors, 
      planktonPositions, 
      planktonColors 
    };
  }, [count, environmentParams.fogColor]);
  
  // Animation for particles
  useFrame((_, delta) => {
    if (bubblesRef.current && debrisRef.current && planktonRef.current) {
      const bubblePositionsArray = bubblesRef.current.geometry.attributes.position.array as Float32Array;
      const debrisPositionsArray = debrisRef.current.geometry.attributes.position.array as Float32Array;
      const planktonPositionsArray = planktonRef.current.geometry.attributes.position.array as Float32Array;
      
      // Update each particle position
      for (let i = 0; i < count; i++) {
        // Bubbles rise up with some horizontal drifting
        bubblePositionsArray[i * 3 + 1] += delta * 2 * (0.5 + Math.random() * 0.5); // Y position (up)
        bubblePositionsArray[i * 3] += delta * 0.2 * (Math.random() - 0.5); // X position (drift)
        bubblePositionsArray[i * 3 + 2] += delta * 0.2 * (Math.random() - 0.5); // Z position (drift)
        
        // Reset bubbles when they rise too high
        if (bubblePositionsArray[i * 3 + 1] > camera.position.y + 50) {
          bubblePositionsArray[i * 3] = camera.position.x + (Math.random() - 0.5) * 100;
          bubblePositionsArray[i * 3 + 1] = camera.position.y - 50;
          bubblePositionsArray[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 100;
        }
        
        // Debris drifts slowly in currents
        debrisPositionsArray[i * 3] += delta * 0.1 * (Math.random() - 0.5);
        debrisPositionsArray[i * 3 + 1] += delta * 0.05 * (Math.random() - 0.5);
        debrisPositionsArray[i * 3 + 2] += delta * 0.1 * (Math.random() - 0.5);
        
        // Reset debris that moves too far from camera
        const debrisDistSq = 
          Math.pow(debrisPositionsArray[i * 3] - camera.position.x, 2) +
          Math.pow(debrisPositionsArray[i * 3 + 1] - camera.position.y, 2) +
          Math.pow(debrisPositionsArray[i * 3 + 2] - camera.position.z, 2);
          
        if (debrisDistSq > 10000) {
          debrisPositionsArray[i * 3] = camera.position.x + (Math.random() - 0.5) * 100;
          debrisPositionsArray[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 100;
          debrisPositionsArray[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 100;
        }
        
        // Plankton moves in swirling patterns
        const time = Date.now() * 0.001;
        const i3 = i * 3;
        const swirl = Math.sin(time * 0.1 + i * 0.1) * 0.2;
        
        planktonPositionsArray[i3] += delta * swirl;
        planktonPositionsArray[i3 + 1] += delta * 0.05 * (Math.sin(time * 0.2 + i * 0.1));
        planktonPositionsArray[i3 + 2] += delta * swirl * 0.5;
        
        // Reset plankton that moves too far from camera
        const planktonDistSq = 
          Math.pow(planktonPositionsArray[i3] - camera.position.x, 2) +
          Math.pow(planktonPositionsArray[i3 + 1] - camera.position.y, 2) +
          Math.pow(planktonPositionsArray[i3 + 2] - camera.position.z, 2);
          
        if (planktonDistSq > 10000) {
          planktonPositionsArray[i3] = camera.position.x + (Math.random() - 0.5) * 100;
          planktonPositionsArray[i3 + 1] = camera.position.y + (Math.random() - 0.5) * 100;
          planktonPositionsArray[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 100;
        }
      }
      
      // Update the buffers
      bubblesRef.current.geometry.attributes.position.needsUpdate = true;
      debrisRef.current.geometry.attributes.position.needsUpdate = true;
      planktonRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <group>
      {/* Bubbles */}
      <points ref={bubblesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={bubblePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={bubbleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size * 2}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.6}
          vertexColors={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Debris */}
      <points ref={debrisRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={debrisPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={debrisColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.4}
          vertexColors={true}
          depthWrite={false}
        />
      </points>
      
      {/* Plankton */}
      <points ref={planktonRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={planktonPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={planktonColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size * 0.5}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.7}
          vertexColors={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}