'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvironmentStore } from './EnvironmentManager';
import { useTexture } from '@react-three/drei';

// Enhanced particle system for underwater effects
export function WaterParticleSystem() {
  const { camera } = useThree();
  const environmentParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  
  // Enhanced particle parameters
  const count = 2000; // Doubled for more particles
  const bubbleSize = 0.12;
  const debrisSize = 0.08;
  const planktonSize = 0.05;
  const dustSize = 0.03; // New dust particles
  
  // Create particle groups
  const bubblesRef = useRef<THREE.Points>(null);
  const debrisRef = useRef<THREE.Points>(null);
  const planktonRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null); // New dust reference
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Load particle textures for more realistic appearance
  const bubbleTexture = useMemo(() => {
    // Create bubble texture programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create radial gradient for bubble
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      // Draw circle with gradient
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
      
      // Add highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(45, 45, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Create dust texture programmatically
  const dustTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create soft dust particle
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Create plankton texture
  const planktonTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create glowing plankton particle
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(136, 204, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(136, 204, 255, 0.7)');
      gradient.addColorStop(0.7, 'rgba(136, 204, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(136, 204, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      
      // Add a slight halo effect
      ctx.globalCompositeOperation = 'lighter';
      const haloGradient = ctx.createRadialGradient(32, 32, 16, 32, 32, 32);
      haloGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      haloGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Mark textures as loaded when component mounts
  useEffect(() => {
    setTexturesLoaded(true);
  }, []);
  
  // Create particle positions and sizes based on environment
  const { 
    bubblePositions, bubbleColors, bubbleSizes,
    debrisPositions, debrisColors, debrisSizes,
    planktonPositions, planktonColors, planktonSizes,
    dustPositions, dustColors, dustSizes
  } = useMemo(() => {
    // Create arrays for positions, colors, and sizes
    const bubblePositions = new Float32Array(count * 3);
    const bubbleColors = new Float32Array(count * 3);
    const bubbleSizes = new Float32Array(count);
    
    const debrisPositions = new Float32Array(count * 3);
    const debrisColors = new Float32Array(count * 3);
    const debrisSizes = new Float32Array(count);
    
    const planktonPositions = new Float32Array(count * 3);
    const planktonColors = new Float32Array(count * 3);
    const planktonSizes = new Float32Array(count);
    
    const dustPositions = new Float32Array(count * 3);
    const dustColors = new Float32Array(count * 3);
    const dustSizes = new Float32Array(count);
    
    // Bubble parameters
    const bubbleColor = new THREE.Color('#FFFFFF');
    
    // Debris parameters - based on environment
    const debrisBaseColor = new THREE.Color(environmentParams.fogColor);
    debrisBaseColor.multiplyScalar(1.2); // Slightly brighter than background
    
    // Plankton parameters - different color variations for bioluminescence
    const planktonColors = [
      new THREE.Color('#88CCFF'), // Blue
      new THREE.Color('#50FA7B'), // Green
      new THREE.Color('#BD93F9'), // Purple
      new THREE.Color('#5CFFFF')  // Cyan
    ];
    
    // Dust parameters
    const dustBaseColor = new THREE.Color(environmentParams.fogColor);
    dustBaseColor.multiplyScalar(1.1); // Just a bit brighter than background
    
    // Create random positions, colors, and sizes for each particle type
    for (let i = 0; i < count; i++) {
      // Generate random positions in a volume around the camera position
      // Different distribution strategies for each particle type
      
      // Bubbles - concentrated more below the camera
      const bubbleX = (Math.random() - 0.5) * 150;
      const bubbleY = (Math.random() - 0.5) * 150 - 25; // More below
      const bubbleZ = (Math.random() - 0.5) * 150;
      
      bubblePositions[i * 3] = bubbleX;
      bubblePositions[i * 3 + 1] = bubbleY;
      bubblePositions[i * 3 + 2] = bubbleZ;
      
      // Add slight color variation to bubbles
      bubbleColors[i * 3] = bubbleColor.r * (0.9 + Math.random() * 0.2);
      bubbleColors[i * 3 + 1] = bubbleColor.g * (0.9 + Math.random() * 0.2);
      bubbleColors[i * 3 + 2] = bubbleColor.b * (0.9 + Math.random() * 0.2);
      
      // Random bubble sizes for more natural appearance
      bubbleSizes[i] = bubbleSize * (0.8 + Math.random() * 0.6);
      
      // Debris - spread throughout the volume
      const debrisX = (Math.random() - 0.5) * 150;
      const debrisY = (Math.random() - 0.5) * 150;
      const debrisZ = (Math.random() - 0.5) * 150;
      
      debrisPositions[i * 3] = debrisX;
      debrisPositions[i * 3 + 1] = debrisY;
      debrisPositions[i * 3 + 2] = debrisZ;
      
      // Add color variation to debris
      const colorVariation = 0.4 * Math.random();
      debrisColors[i * 3] = debrisBaseColor.r * (0.7 + colorVariation);
      debrisColors[i * 3 + 1] = debrisBaseColor.g * (0.7 + colorVariation);
      debrisColors[i * 3 + 2] = debrisBaseColor.b * (0.7 + colorVariation);
      
      // Random debris sizes
      debrisSizes[i] = debrisSize * (0.5 + Math.random() * 1.2);
      
      // Plankton - concentrated more at mid-depths
      const planktonX = (Math.random() - 0.5) * 120;
      const planktonY = (Math.random() - 0.5) * 80;
      const planktonZ = (Math.random() - 0.5) * 120;
      
      planktonPositions[i * 3] = planktonX;
      planktonPositions[i * 3 + 1] = planktonY;
      planktonPositions[i * 3 + 2] = planktonZ;
      
      // Add color variation to plankton - use different base colors
      const planktonBaseColor = planktonColors[Math.floor(Math.random() * planktonColors.length)];
      planktonColors[i * 3] = planktonBaseColor.r * (0.8 + Math.random() * 0.4);
      planktonColors[i * 3 + 1] = planktonBaseColor.g * (0.8 + Math.random() * 0.4);
      planktonColors[i * 3 + 2] = planktonBaseColor.b * (0.8 + Math.random() * 0.4);
      
      // Random plankton sizes
      planktonSizes[i] = planktonSize * (0.6 + Math.random() * 0.8);
      
      // Dust - omnipresent
      const dustX = (Math.random() - 0.5) * 200;
      const dustY = (Math.random() - 0.5) * 200;
      const dustZ = (Math.random() - 0.5) * 200;
      
      dustPositions[i * 3] = dustX;
      dustPositions[i * 3 + 1] = dustY;
      dustPositions[i * 3 + 2] = dustZ;
      
      // Add color variation to dust
      const dustVariation = 0.3 * Math.random();
      dustColors[i * 3] = dustBaseColor.r * (0.8 + dustVariation);
      dustColors[i * 3 + 1] = dustBaseColor.g * (0.8 + dustVariation);
      dustColors[i * 3 + 2] = dustBaseColor.b * (0.8 + dustVariation);
      
      // Random dust sizes - much smaller than other particles
      dustSizes[i] = dustSize * (0.5 + Math.random() * 1.0);
    }
    
    return { 
      bubblePositions, bubbleColors, bubbleSizes,
      debrisPositions, debrisColors, debrisSizes,
      planktonPositions, planktonColors, planktonSizes,
      dustPositions, dustColors, dustSizes
    };
  }, [count, environmentParams.fogColor]);
  
  // Enhanced animation for particles with better physics
  useFrame((_, delta) => {
    if (!texturesLoaded) return;
    
    if (bubblesRef.current && debrisRef.current && planktonRef.current && dustRef.current) {
      const bubblePositionsArray = bubblesRef.current.geometry.attributes.position.array as Float32Array;
      const debrisPositionsArray = debrisRef.current.geometry.attributes.position.array as Float32Array;
      const planktonPositionsArray = planktonRef.current.geometry.attributes.position.array as Float32Array;
      const dustPositionsArray = dustRef.current.geometry.attributes.position.array as Float32Array;
      
      const time = Date.now() * 0.001;
      
      // Update each particle position
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Bubbles rise up with more realistic physics
        // Include slight horizontal drift and wobbling
        const bubbleRiseSpeed = 2.5 * (0.5 + Math.random() * 0.5); // Faster rise
        const bubbleWobble = Math.sin(time * (1 + i * 0.01) + i) * 0.2;
        
        bubblePositionsArray[i3 + 1] += delta * bubbleRiseSpeed; // Y position (up)
        bubblePositionsArray[i3] += delta * (bubbleWobble + 0.1 * (Math.random() - 0.5)); // X position (drift)
        bubblePositionsArray[i3 + 2] += delta * (bubbleWobble + 0.1 * (Math.random() - 0.5)); // Z position (drift)
        
        // Reset bubbles when they rise too high
        if (bubblePositionsArray[i3 + 1] > camera.position.y + 75) {
          // Respawn below the camera
          bubblePositionsArray[i3] = camera.position.x + (Math.random() - 0.5) * 150;
          bubblePositionsArray[i3 + 1] = camera.position.y - 75 - Math.random() * 50; // More variation in respawn height
          bubblePositionsArray[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 150;
        }
        
        // Debris drifts in ocean currents with improved patterns
        // Create more complex turbulent flow
        const turbulenceX = Math.sin(time * 0.3 + i * 0.1) * Math.cos(time * 0.2 + i * 0.05);
        const turbulenceY = Math.sin(time * 0.2 + i * 0.2) * Math.cos(time * 0.3 + i * 0.1);
        const turbulenceZ = Math.sin(time * 0.25 + i * 0.15) * Math.cos(time * 0.15 + i * 0.2);
        
        debrisPositionsArray[i3] += delta * 0.3 * turbulenceX;
        debrisPositionsArray[i3 + 1] += delta * 0.2 * turbulenceY;
        debrisPositionsArray[i3 + 2] += delta * 0.3 * turbulenceZ;
        
        // Reset debris that moves too far from camera - keep particles around the player
        const debrisDistSq = 
          Math.pow(debrisPositionsArray[i3] - camera.position.x, 2) +
          Math.pow(debrisPositionsArray[i3 + 1] - camera.position.y, 2) +
          Math.pow(debrisPositionsArray[i3 + 2] - camera.position.z, 2);
          
        if (debrisDistSq > 40000) { // Reset at a larger distance
          debrisPositionsArray[i3] = camera.position.x + (Math.random() - 0.5) * 150;
          debrisPositionsArray[i3 + 1] = camera.position.y + (Math.random() - 0.5) * 150;
          debrisPositionsArray[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 150;
        }
        
        // Plankton moves in more complex swirling patterns and pulses
        // Create vortex-like motion with multiple frequencies
        const baseFreq = 0.2 + i * 0.001;
        const swirl1 = Math.sin(time * baseFreq) * 0.3;
        const swirl2 = Math.cos(time * baseFreq * 1.3) * 0.2;
        const verticalPulse = Math.sin(time * baseFreq * 0.7) * 0.15;
        
        planktonPositionsArray[i3] += delta * swirl1;
        planktonPositionsArray[i3 + 1] += delta * verticalPulse;
        planktonPositionsArray[i3 + 2] += delta * swirl2;
        
        // Reset plankton that moves too far from camera
        const planktonDistSq = 
          Math.pow(planktonPositionsArray[i3] - camera.position.x, 2) +
          Math.pow(planktonPositionsArray[i3 + 1] - camera.position.y, 2) +
          Math.pow(planktonPositionsArray[i3 + 2] - camera.position.z, 2);
          
        if (planktonDistSq > 30000) {
          planktonPositionsArray[i3] = camera.position.x + (Math.random() - 0.5) * 120;
          planktonPositionsArray[i3 + 1] = camera.position.y + (Math.random() - 0.5) * 80;
          planktonPositionsArray[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 120;
        }
        
        // Dust particles - very subtle movement, almost imperceptible
        // Creates a sense of suspended particles in water
        const microTurbulenceX = Math.sin(time * 0.05 + i * 0.01) * 0.05;
        const microTurbulenceY = Math.cos(time * 0.03 + i * 0.02) * 0.03;
        const microTurbulenceZ = Math.sin(time * 0.04 + i * 0.015) * 0.05;
        
        dustPositionsArray[i3] += delta * microTurbulenceX;
        dustPositionsArray[i3 + 1] += delta * microTurbulenceY;
        dustPositionsArray[i3 + 2] += delta * microTurbulenceZ;
        
        // Reset dust that moves too far from camera
        const dustDistSq = 
          Math.pow(dustPositionsArray[i3] - camera.position.x, 2) +
          Math.pow(dustPositionsArray[i3 + 1] - camera.position.y, 2) +
          Math.pow(dustPositionsArray[i3 + 2] - camera.position.z, 2);
          
        if (dustDistSq > 50000) {
          dustPositionsArray[i3] = camera.position.x + (Math.random() - 0.5) * 200;
          dustPositionsArray[i3 + 1] = camera.position.y + (Math.random() - 0.5) * 200;
          dustPositionsArray[i3 + 2] = camera.position.z + (Math.random() - 0.5) * 200;
        }
      }
      
      // Update the buffers
      bubblesRef.current.geometry.attributes.position.needsUpdate = true;
      debrisRef.current.geometry.attributes.position.needsUpdate = true;
      planktonRef.current.geometry.attributes.position.needsUpdate = true;
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <group>
      {/* Bubbles - enhanced with texture and variable size */}
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
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={bubbleSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={bubbleSize}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.6}
          vertexColors={true}
          depthWrite={false} // Disable depth writing for better blending
          depthTest={true}
          alphaTest={0.01}
          map={bubbleTexture}
          blending={THREE.AdditiveBlending} // Better blending mode for bubbles
        />
      </points>
      
      {/* Debris - enhanced with texture and variable size */}
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
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={debrisSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={debrisSize}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.4}
          vertexColors={true}
          depthWrite={false}
          depthTest={true}
          alphaTest={0.01}
        />
      </points>
      
      {/* Plankton - enhanced with texture and variable size, with glow effect */}
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
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={planktonSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={planktonSize}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.7}
          vertexColors={true}
          depthWrite={false}
          depthTest={true}
          alphaTest={0.01}
          map={planktonTexture}
          blending={THREE.AdditiveBlending} // Additive blending for glow effect
        />
      </points>
      
      {/* Dust - very small particles for added realism */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={dustPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={dustColors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={dustSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={dustSize}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.3}
          vertexColors={true}
          depthWrite={false}
          depthTest={true}
          alphaTest={0.01}
          map={dustTexture}
        />
      </points>
    </group>
  );
}