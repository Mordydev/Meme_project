'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced jellyfish model with better visuals and animations
export default function Jellyfish({ scale = 1, color = '#9C59B6' }) {
  const group = useRef<THREE.Group>();
  const bellRef = useRef<THREE.Mesh>();
  const tentacleRefs = useRef<THREE.Mesh[]>([]);
  
  // Initialize tentacle refs array
  tentacleRefs.current = [];
  
  // Animate jellyfish - pulsating bell and flowing tentacles
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    
    // Animate the bell - pulsating movement
    if (bellRef.current) {
      const pulseFactor = 0.08; // How much the bell pulses
      const pulseSpeed = 1.5; // Speed of pulsation
      
      // Apply pulsating scale
      const pulseScale = 1 + Math.sin(time * pulseSpeed) * pulseFactor;
      bellRef.current.scale.set(pulseScale, 1 + (1 - pulseScale) * 0.5, pulseScale);
      
      // Slight vertical movement based on pulsation
      group.current.position.y += Math.cos(time * pulseSpeed) * 0.003;
    }
    
    // Animate the tentacles - flowing movement
    tentacleRefs.current.forEach((tentacle, i) => {
      if (tentacle) {
        // Flowing motion for tentacles
        const flowFactor = 0.15;
        const frequency = 1 + (i * 0.1);
        const phaseOffset = i * 0.2;
        
        // Apply flowing motion
        tentacle.rotation.x = Math.sin(time * frequency + phaseOffset) * flowFactor;
        tentacle.rotation.z = Math.cos(time * frequency + phaseOffset) * flowFactor;
        
        // Slight length pulsation
        const lengthPulse = 1 + Math.sin(time * frequency * 0.5 + phaseOffset) * 0.1;
        tentacle.scale.y = lengthPulse;
      }
    });
  });
  
  // Generate a random value within a range
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  
  // Create a tentacle with custom parameters
  const createTentacle = (angle: number, radius: number, length: number, thickness: number) => {
    // Calculate position
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Randomize color slightly
    const saturation = random(-0.1, 0.1);
    const lightness = random(-0.2, 0);
    
    const tentacleColor = new THREE.Color(color).offsetHSL(0, saturation, lightness).getHexString();
    
    return (
      <mesh 
        position={[x, -length / 2 - 0.2, z]} 
        rotation={[0, 0, 0]}
        ref={(el) => {
          if (el) tentacleRefs.current.push(el);
        }}
      >
        <cylinderGeometry args={[thickness * 0.5, thickness, length, 8]} />
        <meshStandardMaterial 
          color={`#${tentacleColor}`} 
          transparent={true}
          opacity={0.85}
          roughness={0.3}
          emissive={`#${tentacleColor}`}
          emissiveIntensity={0.05}
        />
      </mesh>
    );
  };
  
  return (
    <group ref={group} scale={scale}>
      {/* Bell (dome) with translucent material */}
      <mesh ref={bellRef} rotation={[Math.PI, 0, 0]}>
        <hemisphereGeometry args={[1, 1, 24, 16]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.2}
          transparent={true}
          opacity={0.8}
          transmission={0.3}
          thickness={0.5}
          emissive={color}
          emissiveIntensity={0.05}
        />
      </mesh>
      
      {/* Inner bell tissue */}
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]} scale={[0.7, 0.3, 0.7]}>
        <hemisphereGeometry args={[1, 0.5, 16, 8]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.4}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Create tentacles around the bell */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 0.7;
        const length = random(1.8, 3.0);
        const thickness = random(0.03, 0.07);
        
        return createTentacle(angle, radius, length, thickness);
      })}
      
      {/* Create central tentacles */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const radius = 0.3;
        const length = random(2.2, 3.5);
        const thickness = random(0.05, 0.08);
        
        return createTentacle(angle, radius, length, thickness);
      })}
      
      {/* Bioluminescent spots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <mesh key={i} position={[x, -0.05, z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial 
              color="#FFFFFF" 
              emissive="#FFFFFF"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}