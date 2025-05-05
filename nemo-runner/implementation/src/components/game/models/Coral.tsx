'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced coral model with better visuals
export default function Coral({ scale = 1, color = '#FF5A5F' }) {
  const group = useRef<THREE.Group>();
  const branchRefs = useRef<THREE.Mesh[]>([]);
  
  // Initialize branch refs array
  branchRefs.current = [];
  
  // Animate coral branches - gentle swaying motion
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    
    branchRefs.current.forEach((branch, i) => {
      if (branch) {
        // Gentle swaying motion
        const swayFactor = 0.05;
        const frequency = 1 + (i * 0.2);
        
        branch.rotation.x = Math.sin(time * frequency) * swayFactor;
        branch.rotation.z = Math.cos(time * frequency) * swayFactor;
      }
    });
  });
  
  // Generate a random value within a range
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  
  // Create a coral branch with custom parameters
  const createCoralBranch = (
    position: [number, number, number], 
    rotation: [number, number, number], 
    size: [number, number, number],
    branchColor = color
  ) => {
    return (
      <mesh 
        position={position}
        rotation={rotation}
        ref={(el) => {
          if (el) branchRefs.current.push(el);
        }}
      >
        <cylinderGeometry args={[size[0], size[1], size[2], 8]} />
        <meshStandardMaterial 
          color={branchColor} 
          roughness={0.8}
          emissive={branchColor}
          emissiveIntensity={0.1}
        />
      </mesh>
    );
  };
  
  // Create a coral colony
  const createCoralColony = (posX: number, posZ: number, colonySize: number = 1) => {
    // Array to hold the branches
    const branches = [];
    
    // Create the main branch
    branches.push(
      createCoralBranch(
        [posX, colonySize * 1, posZ], 
        [0, 0, 0], 
        [colonySize * 0.5, colonySize * 1, colonySize * 0.5]
      )
    );
    
    // Add smaller branches around the main one
    const branchCount = Math.floor(random(3, 7));
    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2;
      const radius = colonySize * random(0.5, 0.8);
      const height = colonySize * random(0.8, 1.5);
      const topRadius = colonySize * random(0.1, 0.3);
      const bottomRadius = colonySize * random(0.2, 0.4);
      
      // Calculate position
      const x = posX + Math.cos(angle) * radius;
      const z = posZ + Math.sin(angle) * radius;
      
      // Randomize color slightly
      const hue = random(-10, 10);
      const saturation = random(-0.1, 0.1);
      const lightness = random(-0.1, 0.1);
      
      const branchColor = new THREE.Color(color).offsetHSL(hue/360, saturation, lightness).getHexString();
      
      branches.push(
        createCoralBranch(
          [x, height / 2, z], 
          [random(-0.2, 0.2), random(0, Math.PI * 2), random(-0.2, 0.2)], 
          [topRadius, bottomRadius, height],
          `#${branchColor}`
        )
      );
    }
    
    return branches;
  };
  
  return (
    <group ref={group} scale={scale}>
      {/* Base rock */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.5, 0.5, 8]} />
        <meshStandardMaterial color="#A9A9A9" roughness={1} />
      </mesh>
      
      {/* Coral colonies - main structure */}
      {createCoralColony(0, 0, 1.2)}
      {createCoralColony(0.8, 0.5, 0.9)}
      {createCoralColony(-0.7, -0.3, 1)}
      {createCoralColony(0.3, -0.8, 0.8)}
      {createCoralColony(-0.4, 0.7, 0.7)}
      
      {/* Small decorative elements */}
      <mesh position={[0, 0.2, 0]} scale={[1.3, 0.2, 1.3]}>
        <torusGeometry args={[0.5, 0.2, 16, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}