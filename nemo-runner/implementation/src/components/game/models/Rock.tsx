'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';

// Enhanced rock model with better geometry and materials
export default function Rock({ scale = 1 }) {
  const group = useRef<THREE.Group>();
  
  // Generate a random value within a range
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  
  // Create a rock formation with custom parameters
  const createRockFormation = () => {
    // Create a group of rocks with different shapes
    const rocks = [];
    
    // Main boulder
    rocks.push(
      <mesh key="main" position={[0, 0.5, 0]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial 
          color="#606060" 
          roughness={0.9}
          metalness={0.1}
          flatShading={true}
        />
      </mesh>
    );
    
    // Add smaller rocks around
    const smallRockCount = Math.floor(random(5, 8));
    for (let i = 0; i < smallRockCount; i++) {
      const size = random(0.3, 0.8);
      const angle = (i / smallRockCount) * Math.PI * 2;
      const radius = random(0.8, 1.3);
      
      // Position rocks in a rough circle
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = random(-0.2, 0.2);
      
      // Choose a random rock shape
      const rockType = Math.floor(random(0, 3));
      let geometry;
      
      switch (rockType) {
        case 0:
          geometry = <dodecahedronGeometry args={[size, 0]} />;
          break;
        case 1:
          geometry = <octahedronGeometry args={[size, 0]} />;
          break;
        case 2:
        default:
          geometry = <boxGeometry args={[size, size, size]} />;
          break;
      }
      
      // Vary the color slightly
      const brightness = random(0.8, 1.2);
      const color = new THREE.Color("#606060").multiplyScalar(brightness);
      
      rocks.push(
        <mesh 
          key={i} 
          position={[x, y, z]} 
          rotation={[random(0, Math.PI), random(0, Math.PI), random(0, Math.PI)]}
        >
          {geometry}
          <meshStandardMaterial 
            color={color} 
            roughness={0.9}
            metalness={0.1}
            flatShading={true}
          />
        </mesh>
      );
    }
    
    // Add coral accents or algae
    const accentCount = Math.floor(random(3, 6));
    for (let i = 0; i < accentCount; i++) {
      const size = random(0.1, 0.3);
      const angle = (i / accentCount) * Math.PI * 2 + random(-0.2, 0.2);
      const radius = random(0.8, 1.5);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = random(0.1, 0.5);
      
      // Choose between coral or algae
      const isAlgae = Math.random() > 0.5;
      
      if (isAlgae) {
        // Create algae (simple plane with alpha map)
        rocks.push(
          <mesh key={`algae-${i}`} position={[x, y, z]} rotation={[random(-0.3, 0.3), random(0, Math.PI * 2), random(-0.3, 0.3)]}>
            <planeGeometry args={[size * 2, size * 3]} />
            <meshStandardMaterial 
              color="#2C6E31" 
              roughness={0.8}
              transparent={true}
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      } else {
        // Create coral accent
        rocks.push(
          <mesh key={`coral-${i}`} position={[x, y, z]} rotation={[random(-0.3, 0.3), random(0, Math.PI * 2), random(-0.3, 0.3)]}>
            <cylinderGeometry args={[0, size, size * 2, 5]} />
            <meshStandardMaterial 
              color="#FF5A5F" 
              roughness={0.7}
              emissive="#FF5A5F"
              emissiveIntensity={0.1}
            />
          </mesh>
        );
      }
    }
    
    return rocks;
  };
  
  return (
    <group ref={group} scale={scale}>
      {/* Base sand mound */}
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 24]} />
        <meshStandardMaterial 
          color="#D2B48C" 
          roughness={1}
        />
      </mesh>
      
      {/* Rock formation */}
      {createRockFormation()}
    </group>
  );
}