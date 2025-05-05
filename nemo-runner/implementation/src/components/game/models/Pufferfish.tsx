'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced pufferfish model with inflation animation
export default function Pufferfish({ scale = 1, color = '#F39C12', inflated = false, proximityInflation = false }) {
  const group = useRef<THREE.Group>();
  const bodyRef = useRef<THREE.Mesh>();
  const spikesRef = useRef<THREE.Group>();
  const finRefs = useRef<THREE.Mesh[]>([]);
  
  // Inflation state
  const [inflationLevel, setInflationLevel] = useState(inflated ? 1 : 0);
  const inflationLevelRef = useRef(inflated ? 1 : 0);
  
  // Initialize fin refs array
  finRefs.current = [];
  
  // Handle inflation state changes
  useEffect(() => {
    if (inflated) {
      setInflationLevel(1);
      inflationLevelRef.current = 1;
    } else if (!proximityInflation) {
      setInflationLevel(0);
      inflationLevelRef.current = 0;
    }
  }, [inflated, proximityInflation]);
  
  // Animate pufferfish - swimming and inflation
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    
    // Smooth inflation/deflation transition
    if ((inflated || proximityInflation) && inflationLevelRef.current < 1) {
      // Inflate
      inflationLevelRef.current = Math.min(1, inflationLevelRef.current + delta * 2);
      setInflationLevel(inflationLevelRef.current);
    } else if (!inflated && !proximityInflation && inflationLevelRef.current > 0) {
      // Deflate
      inflationLevelRef.current = Math.max(0, inflationLevelRef.current - delta * 1.5);
      setInflationLevel(inflationLevelRef.current);
    }
    
    // Apply animation based on inflation
    if (bodyRef.current) {
      // Base size + inflation size
      const baseScale = 1;
      const inflatedScale = 1.8;
      const currentScale = baseScale + (inflatedScale - baseScale) * inflationLevelRef.current;
      
      // Apply scaling to body
      bodyRef.current.scale.set(currentScale, currentScale, currentScale);
    }
    
    // Apply animation to spikes - extend when inflated
    if (spikesRef.current) {
      const baseLength = 0.5;
      const extendedLength = 1.5;
      const currentLength = baseLength + (extendedLength - baseLength) * inflationLevelRef.current;
      
      spikesRef.current.scale.set(
        1 + inflationLevelRef.current * 0.4,
        currentLength,
        1 + inflationLevelRef.current * 0.4
      );
    }
    
    // Animate fins - more active when not inflated
    finRefs.current.forEach((fin, i) => {
      if (fin) {
        // More active when not inflated (swimming), less when inflated
        const activityFactor = 1 - inflationLevelRef.current * 0.8;
        const finSpeed = 5 * activityFactor;
        const finAmount = 0.3 * activityFactor;
        
        // Fin animation with phase offset for each fin
        fin.rotation.z = Math.sin(time * finSpeed + i) * finAmount;
      }
    });
  });
  
  // Generate a random value within a range
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  
  // Create spikes all around the pufferfish
  const createSpikes = () => {
    const spikes = [];
    const spikeCount = 24;
    
    for (let i = 0; i < spikeCount; i++) {
      // Distribute points evenly on a sphere
      const phi = Math.acos(1 - 2 * (i / spikeCount));
      const theta = Math.sqrt(spikeCount * Math.PI) * phi;
      
      // Convert to cartesian coordinates
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      // Create spike
      spikes.push(
        <mesh 
          key={i} 
          position={[x, y, z]} 
          rotation={[0, 0, 0]}
          lookAt={[0, 0, 0]}
        >
          <coneGeometry args={[0.08, 0.5, 6]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
    }
    
    return spikes;
  };
  
  return (
    <group ref={group} scale={scale}>
      {/* Body - main spherical body */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      
      {/* Spikes - extendable when inflated */}
      <group ref={spikesRef}>
        {createSpikes()}
      </group>
      
      {/* Eyes */}
      <group position={[0.6, 0.3, 0.5]} rotation={[0, -Math.PI / 6, 0]}>
        {/* Eye white */}
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        
        {/* Pupil */}
        <mesh position={[0.12, 0, 0.05]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
      
      <group position={[0.6, 0.3, -0.5]} rotation={[0, Math.PI / 6, 0]}>
        {/* Eye white */}
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        
        {/* Pupil */}
        <mesh position={[0.12, 0, -0.05]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
      
      {/* Mouth - simple curve */}
      <mesh position={[0.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Fins */}
      <mesh 
        position={[0, 0.6, 0]} 
        rotation={[0, 0, 0]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <coneGeometry args={[0.3, 0.6, 16, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh 
        position={[-0.3, 0, 0.6]} 
        rotation={[0, Math.PI / 2, Math.PI / 2]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <coneGeometry args={[0.25, 0.5, 16, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh 
        position={[-0.3, 0, -0.6]} 
        rotation={[0, -Math.PI / 2, Math.PI / 2]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <coneGeometry args={[0.25, 0.5, 16, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Tail fin */}
      <mesh 
        position={[-0.7, 0, 0]} 
        rotation={[0, 0, Math.PI / 2]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <coneGeometry args={[0.4, 0.8, 16, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}