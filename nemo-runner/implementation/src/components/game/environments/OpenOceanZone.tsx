'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { EnvironmentZoneRef } from './CoralReefZone';

const OpenOceanZone = forwardRef<EnvironmentZoneRef, { active: boolean }>((props, ref) => {
  const { active } = props;
  
  // References for animated elements
  const zoneRef = useRef<THREE.Group>(null);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);
  const fishRefs = useRef<THREE.Group[]>([]);
  const jellyfishRefs = useRef<THREE.Group[]>([]);
  
  // Floor reference
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getElements: () => {
      if (!zoneRef.current) return [];
      return [zoneRef.current];
    },
    update: (delta: number) => {
      animateElements(delta);
    }
  }));
  
  // Create simple bubble
  const createBubble = (position: [number, number, number], size: number = 0.2) => {
    return (
      <mesh 
        position={position}
        ref={(el) => {
          if (el) bubbleRefs.current.push(el);
          return null;
        }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          transparent 
          opacity={0.4} 
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    );
  };
  
  // Create simple fish
  const createFish = (position: [number, number, number], size: number = 1, color: string = '#4D9DE0') => {
    return (
      <group
        position={position}
        ref={(el) => {
          if (el) fishRefs.current.push(el);
          return null;
        }}
      >
        {/* Fish body */}
        <mesh>
          <sphereGeometry args={[size * 0.5, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Fish tail */}
        <mesh position={[-size * 0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[size * 0.4, size * 0.8, 2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  };
  
  // Create simple jellyfish
  const createJellyfish = (position: [number, number, number], size: number = 1) => {
    return (
      <group
        position={position}
        ref={(el) => {
          if (el) jellyfishRefs.current.push(el);
          return null;
        }}
      >
        {/* Jellyfish bell */}
        <mesh>
          <sphereGeometry args={[size * 0.8, 16, 8, 0, Math.PI]} />
          <meshStandardMaterial 
            color="#9C89B8" 
            transparent 
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Jellyfish tentacles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              Math.sin(i * Math.PI / 4) * size * 0.4, 
              -size * 0.8, 
              Math.cos(i * Math.PI / 4) * size * 0.4
            ]}
          >
            <boxGeometry args={[size * 0.05, size * 1.5, size * 0.05]} />
            <meshStandardMaterial 
              color="#B8B8FF" 
              transparent 
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
    );
  };
  
  // Animation function
  const animateElements = (delta: number) => {
    if (!active) return;
    
    const time = Date.now() * 0.001;
    
    // Animate bubbles (rising effect)
    bubbleRefs.current.forEach((bubble, i) => {
      bubble.position.y += (0.15 + i * 0.03) * delta;
      bubble.position.x += Math.sin(time + i) * 0.01;
      
      // Reset bubble position when it rises too high
      if (bubble.position.y > 15) {
        bubble.position.y = -5;
        bubble.position.x = Math.random() * 50 - 25;
        bubble.position.z = Math.random() * 50 - 70;
      }
    });
    
    // Animate fish
    fishRefs.current.forEach((fish, i) => {
      // Swimming motion - more horizontal movement in open ocean
      fish.position.x += Math.sin(time * 0.2 + i) * 0.05;
      fish.position.y += Math.cos(time * 0.3 + i * 2) * 0.01;
      fish.position.z += Math.sin(time * 0.1 + i) * 0.02;
      
      // Fish body rotation to follow movement
      fish.rotation.y = Math.sin(time * 0.3 + i) * 0.8;
      
      // Tail wiggle
      if (fish.children[1]) {
        fish.children[1].rotation.y = Math.sin(time * 5 + i) * 0.3;
      }
      
      // Reset fish position if they swim too far
      if (Math.abs(fish.position.x) > 30 || Math.abs(fish.position.z) > 80) {
        // Reset to opposite side to create a continuous flow of fish
        fish.position.x = -fish.position.x * 0.8;
        fish.position.z = -fish.position.z * 0.8;
      }
    });
    
    // Animate jellyfish
    jellyfishRefs.current.forEach((jellyfish, i) => {
      // Slow pulsing motion
      jellyfish.scale.y = 1 + Math.sin(time * 1.5 + i) * 0.1;
      jellyfish.scale.x = 1 - Math.sin(time * 1.5 + i) * 0.05;
      jellyfish.scale.z = 1 - Math.sin(time * 1.5 + i) * 0.05;
      
      // Slow drift
      jellyfish.position.y += Math.sin(time * 0.2 + i) * 0.01;
      jellyfish.position.x += Math.sin(time * 0.1 + i * 2) * 0.005;
      jellyfish.position.z += Math.cos(time * 0.1 + i) * 0.005;
      
      // Tentacle animation
      for (let j = 1; j < jellyfish.children.length; j++) {
        jellyfish.children[j].rotation.x = Math.sin(time * 2 + j * 0.2 + i) * 0.1;
        jellyfish.children[j].rotation.z = Math.cos(time * 2 + j * 0.2 + i) * 0.1;
      }
    });
  };
  
  // Reset refs when component unmounts
  useEffect(() => {
    return () => {
      bubbleRefs.current = [];
      fishRefs.current = [];
      jellyfishRefs.current = [];
    };
  }, []);
  
  return (
    <group ref={zoneRef} visible={active}>
      {/* Ocean floor (distant and barely visible) */}
      <Plane 
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -15, 0]} 
        args={[200, 200, 10, 10]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#0A385E"
          roughness={1}
          opacity={0.5}
          transparent
        />
      </Plane>
      
      {/* Environment elements */}
      {/* Scattered bubbles */}
      {Array.from({ length: 20 }).map((_, i) => 
        createBubble([
          Math.random() * 40 - 20,
          Math.random() * 15 - 5,
          Math.random() * 40 - 60
        ], 0.1 + Math.random() * 0.2)
      )}
      
      {/* Open ocean fish schools */}
      {/* First school - blue fish */}
      {Array.from({ length: 8 }).map((_, i) => 
        createFish([
          -10 + Math.random() * 8 - 4,
          5 + Math.random() * 4 - 2,
          -30 + Math.random() * 10 - 5
        ], 0.6 + Math.random() * 0.3, '#4D9DE0')
      )}
      
      {/* Second school - silver fish */}
      {Array.from({ length: 8 }).map((_, i) => 
        createFish([
          15 + Math.random() * 8 - 4,
          2 + Math.random() * 4 - 2,
          -50 + Math.random() * 10 - 5
        ], 0.5 + Math.random() * 0.2, '#E0E0E0')
      )}
      
      {/* Distant large fish */}
      {createFish([-25, 0, -80], 3, '#3A7CA5')}
      {createFish([30, -2, -100], 4, '#2F6690')}
      
      {/* Jellyfish */}
      {createJellyfish([-8, 8, -40], 1.2)}
      {createJellyfish([12, 6, -30], 0.8)}
      {createJellyfish([5, 10, -50], 1.5)}
      {createJellyfish([-15, 4, -60], 1)}
      {createJellyfish([0, 12, -45], 1.3)}
      
      {/* Distant water volume */}
      <mesh position={[0, 0, -100]}>
        <boxGeometry args={[200, 100, 1]} />
        <meshBasicMaterial 
          color="#0a4d7a" 
          transparent 
          opacity={0.2}
        />
      </mesh>
      
      {/* Water volume light rays (fake with cones) */}
      <mesh position={[0, 15, -30]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[20, 40, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.05}
          side={THREE.BackSide} 
        />
      </mesh>
      
      <mesh position={[15, 15, -40]} rotation={[Math.PI, 0.2, 0]}>
        <coneGeometry args={[15, 30, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.04}
          side={THREE.BackSide} 
        />
      </mesh>
      
      {/* Distant background plane */}
      <Plane
        position={[0, 0, -120]}
        args={[300, 150]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#0a4d7a"
          transparent
          opacity={0.8}
        />
      </Plane>
    </group>
  );
});

OpenOceanZone.displayName = 'OpenOceanZone';
export default OpenOceanZone;