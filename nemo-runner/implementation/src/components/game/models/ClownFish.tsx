'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced clownfish model
export default function ClownFish({ actionState = 'idle', actionSpeed = 1 }) {
  const group = useRef<THREE.Group>();
  const bodyRef = useRef<THREE.Mesh>();
  const tailRef = useRef<THREE.Mesh>();
  const leftFinRef = useRef<THREE.Mesh>();
  const rightFinRef = useRef<THREE.Mesh>();
  const topFinRef = useRef<THREE.Mesh>();
  
  // Animation parameters
  const animationSpeed = useRef(1);
  
  // Update animation speed based on action state
  useEffect(() => {
    switch(actionState) {
      case 'fast':
        animationSpeed.current = 2.5 * actionSpeed;
        break;
      case 'turning':
        animationSpeed.current = 3 * actionSpeed;
        break;
      case 'diving':
        animationSpeed.current = 2 * actionSpeed;
        break;
      case 'jumping':
        animationSpeed.current = 2 * actionSpeed;
        break;
      case 'idle':
      default:
        animationSpeed.current = 1 * actionSpeed;
        break;
    }
  }, [actionState, actionSpeed]);

  // Animate the fish body and fins
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    
    // Tail animation
    if (tailRef.current) {
      const wagSpeed = animationSpeed.current;
      tailRef.current.rotation.y = Math.sin(time * wagSpeed * 5) * 0.3;
    }
    
    // Side fins animation
    if (leftFinRef.current && rightFinRef.current) {
      const finSpeed = animationSpeed.current * 0.7;
      leftFinRef.current.rotation.z = Math.sin(time * finSpeed * 3) * 0.2 - 0.3;
      rightFinRef.current.rotation.z = Math.sin(time * finSpeed * 3 + 0.5) * 0.2 + 0.3;
    }
    
    // Top fin animation (subtle movement)
    if (topFinRef.current) {
      topFinRef.current.rotation.z = Math.sin(time * animationSpeed.current * 2) * 0.05;
    }
    
    // Body subtle wobble
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(time * animationSpeed.current * 2) * 0.03;
    }
  });

  return (
    <group ref={group}>
      {/* Body - main orange body with white stripes */}
      <group ref={bodyRef}>
        {/* Main body */}
        <mesh castShadow receiveShadow>
          <ellipsoidGeometry args={[0.5, 0.4, 0.3]} />
          <meshStandardMaterial 
            color="#FF7E00" 
            roughness={0.3} 
            metalness={0.2}
          />
        </mesh>
        
        {/* White stripes */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.35, 0.08, 16, 32, Math.PI * 2]} />
          <meshStandardMaterial 
            color="#FFFFFF" 
            roughness={0.3}
          />
        </mesh>
        
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.32, 0.08, 16, 32, Math.PI * 2]} />
          <meshStandardMaterial 
            color="#FFFFFF" 
            roughness={0.3}
          />
        </mesh>
        
        {/* Eyes with eyelids */}
        <group position={[0.35, 0.15, 0.22]}>
          {/* Eye white */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          
          {/* Pupil */}
          <mesh position={[0.05, 0, 0.08]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          
          {/* Eyelid */}
          <mesh position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#FF9F59" transparent opacity={0.5} />
          </mesh>
        </group>
        
        <group position={[0.35, -0.15, 0.22]}>
          {/* Eye white */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          
          {/* Pupil */}
          <mesh position={[0.05, 0, 0.08]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          
          {/* Eyelid */}
          <mesh position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#FF9F59" transparent opacity={0.5} />
          </mesh>
        </group>
        
        {/* Mouth - simple curved line */}
        <mesh position={[0.5, 0, 0.05]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.1, 0.01, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
      
      {/* Tail */}
      <mesh ref={tailRef} position={[-0.6, 0, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.6, 16, 1]} />
        <meshStandardMaterial 
          color="#FF7E00" 
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Side fins */}
      <mesh ref={leftFinRef} position={[0, 0.4, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.2, 0.4, 16, 1]} />
        <meshStandardMaterial 
          color="#FF7E00" 
          roughness={0.4}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh ref={rightFinRef} position={[0, -0.4, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.2, 0.4, 16, 1]} />
        <meshStandardMaterial 
          color="#FF7E00" 
          roughness={0.4}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Top fin */}
      <mesh ref={topFinRef} position={[0.1, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.5, 16, 1]} />
        <meshStandardMaterial 
          color="#FF7E00" 
          roughness={0.4}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Bottom fin (smaller) */}
      <mesh position={[0, 0, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 16, 1]} />
        <meshStandardMaterial 
          color="#FF7E00" 
          roughness={0.4}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}