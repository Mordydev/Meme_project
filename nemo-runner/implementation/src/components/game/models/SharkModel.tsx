'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Advanced shark model with animations
export default function SharkModel({ scale = 1 }) {
  const group = useRef<THREE.Group>();
  const bodyRef = useRef<THREE.Mesh>();
  const tailRef = useRef<THREE.Mesh>();
  const finRefs = useRef<THREE.Mesh[]>([]);
  const jawRef = useRef<THREE.Mesh>();
  
  // Initialize fin refs array
  finRefs.current = [];
  
  // Animate shark - swimming motion and occasional jaw movement
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    
    // Body subtle roll
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(time * 0.5) * 0.08;
    }
    
    // Tail swinging
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(time * 2) * 0.25;
    }
    
    // Fin movement
    finRefs.current.forEach((fin, i) => {
      if (fin) {
        const finSpeed = 0.8;
        const finAmount = 0.15;
        
        // Slightly different motion for each fin
        fin.rotation.z = Math.sin(time * finSpeed + i) * finAmount;
      }
    });
    
    // Jaw movement - occasional chomping
    if (jawRef.current) {
      // Create a chomping pattern - mostly closed with occasional opening
      const chompCycle = Math.sin(time * 0.3) * 0.5 + 0.5; // 0-1 value
      const chompThreshold = 0.85; // Only open when above this value
      
      if (chompCycle > chompThreshold) {
        // Map remaining range to jaw opening (0-0.25 radians)
        const openAmount = (chompCycle - chompThreshold) / (1 - chompThreshold) * 0.25;
        jawRef.current.rotation.x = openAmount;
      } else {
        // Closed jaw
        jawRef.current.rotation.x = 0;
      }
    }
  });
  
  return (
    <group ref={group} scale={scale}>
      {/* Main body - sleek shape */}
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[1, 3, 8, 16]} />
        <meshStandardMaterial 
          color="#4B6D82" 
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      
      {/* Head shape */}
      <mesh position={[1.6, 0, 0]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.95, 1, 8, 16]} />
        <meshStandardMaterial 
          color="#4B6D82" 
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      
      {/* Jaw */}
      <group position={[2.1, -0.3, 0]}>
        <mesh ref={jawRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1, 0.4, 1.5]} />
          <meshStandardMaterial 
            color="#3A5769" 
            roughness={0.6}
            metalness={0.1}
          />
          
          {/* Teeth */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[0.3, 0.15, (-0.6 + (i / 7) * 1.2)]}>
              <coneGeometry args={[0.05, 0.15, 8]} />
              <meshStandardMaterial color="#F8F8F8" roughness={0.3} />
            </mesh>
          ))}
        </mesh>
      </group>
      
      {/* Upper jaw/snout */}
      <mesh position={[2.1, 0.3, 0]}>
        <boxGeometry args={[1, 0.5, 1.5]} />
        <meshStandardMaterial 
          color="#3A5769" 
          roughness={0.6}
          metalness={0.1}
        />
        
        {/* Upper teeth */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0.3, -0.2, (-0.6 + (i / 7) * 1.2)]}>
            <coneGeometry args={[0.05, 0.15, 8]} />
            <meshStandardMaterial color="#F8F8F8" roughness={0.3} />
          </mesh>
        ))}
      </mesh>
      
      {/* Eyes */}
      <mesh position={[1.8, 0.3, 0.6]} rotation={[0, -Math.PI / 8, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#000000" roughness={0.3} />
      </mesh>
      
      <mesh position={[1.8, 0.3, -0.6]} rotation={[0, Math.PI / 8, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#000000" roughness={0.3} />
      </mesh>
      
      {/* Tail */}
      <group position={[-2, 0, 0]}>
        <mesh ref={tailRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.8, 2, 8]} />
          <meshStandardMaterial 
            color="#4B6D82" 
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>
        
        {/* Tail fin */}
        <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[2, 2.5]} />
          <meshStandardMaterial 
            color="#4B6D82" 
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* Dorsal fin */}
      <mesh 
        position={[0, 1.2, 0]} 
        rotation={[0, 0, 0.1]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <coneGeometry args={[0.2, 1.5, 8]} />
        <meshStandardMaterial 
          color="#4B6D82" 
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Pectoral fins */}
      <mesh 
        position={[0.5, 0, 1.2]} 
        rotation={[0, Math.PI / 4, Math.PI / 2]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <planeGeometry args={[1.5, 0.8]} />
        <meshStandardMaterial 
          color="#4B6D82" 
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh 
        position={[0.5, 0, -1.2]} 
        rotation={[0, -Math.PI / 4, -Math.PI / 2]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <planeGeometry args={[1.5, 0.8]} />
        <meshStandardMaterial 
          color="#4B6D82" 
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Ventral fin */}
      <mesh 
        position={[-0.5, -0.8, 0]} 
        rotation={[0, 0, -0.1]}
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <coneGeometry args={[0.15, 0.6, 8]} />
        <meshStandardMaterial 
          color="#4B6D82" 
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Gills */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0.6, 0.2, 0.8 - i * 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[0.5, 0.05]} />
          <meshStandardMaterial color="#2D4554" side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0.6, 0.2, -0.8 + i * 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[0.5, 0.05]} />
          <meshStandardMaterial color="#2D4554" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}