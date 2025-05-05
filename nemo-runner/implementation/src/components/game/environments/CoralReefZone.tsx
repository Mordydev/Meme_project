'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane } from '@react-three/drei';
import * as THREE from 'three';

export interface EnvironmentZoneRef {
  getElements: () => THREE.Object3D[];
  update: (delta: number) => void;
}

const CoralReefZone = forwardRef<EnvironmentZoneRef, { active: boolean }>((props, ref) => {
  const { active } = props;
  
  // References for animated elements
  const zoneRef = useRef<THREE.Group>(null);
  const seaweedRefs = useRef<THREE.Group[]>([]);
  const coralRefs = useRef<THREE.Mesh[]>([]);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);
  const fishRefs = useRef<THREE.Group[]>([]);
  
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
  
  // Create simple seaweed group
  const createSeaweed = (position: [number, number, number], height: number, count: number = 5) => {
    return (
      <group 
        position={position}
        ref={(el) => {
          if (el) seaweedRefs.current.push(el);
          return null;
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Box 
            key={i}
            position={[
              Math.sin(i * 0.5) * 0.2, 
              height / 2 + i * (height / count), 
              Math.cos(i * 0.5) * 0.2
            ]}
            args={[0.1, height / count, 0.1]}
          >
            <meshStandardMaterial color="#3EC483" />
          </Box>
        ))}
      </group>
    );
  };
  
  // Create simple coral
  const createCoral = (position: [number, number, number], size: number = 1) => {
    return (
      <Box 
        position={position}
        args={[size, size * 0.8, size]}
        ref={(el) => {
          if (el) coralRefs.current.push(el);
          return null;
        }}
      >
        <meshStandardMaterial color="#FF5A5F" />
      </Box>
    );
  };
  
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
          opacity={0.5} 
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    );
  };
  
  // Create simple fish
  const createFish = (position: [number, number, number], size: number = 1, color: string = '#FF9F59') => {
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
  
  // Animation function
  const animateElements = (delta: number) => {
    if (!active) return;
    
    const time = Date.now() * 0.001;
    
    // Animate seaweed
    seaweedRefs.current.forEach((seaweed, i) => {
      seaweed.children.forEach((blade, j) => {
        // Gentle swaying motion
        const swayFactor = 0.1;
        const frequency = 1 + (i * 0.2) + (j * 0.05);
        
        (blade as THREE.Mesh).rotation.x = Math.sin(time * frequency) * swayFactor;
        (blade as THREE.Mesh).rotation.z = Math.cos(time * frequency) * swayFactor;
      });
    });
    
    // Animate bubbles (rising effect)
    bubbleRefs.current.forEach((bubble, i) => {
      bubble.position.y += (0.2 + i * 0.05) * delta;
      bubble.position.x += Math.sin(time + i) * 0.01;
      
      // Reset bubble position when it rises too high
      if (bubble.position.y > 10) {
        bubble.position.y = -2;
        bubble.position.x = Math.random() * 20 - 10;
        bubble.position.z = Math.random() * 20 - 30;
      }
    });
    
    // Animate fish
    fishRefs.current.forEach((fish, i) => {
      // Swimming motion
      fish.position.x += Math.sin(time * 0.5 + i) * 0.05;
      fish.position.y += Math.cos(time * 0.5 + i * 2) * 0.02;
      
      // Tail wiggle
      if (fish.children[1]) {
        fish.children[1].rotation.y = Math.sin(time * 5 + i) * 0.3;
      }
      
      // Swimming direction
      fish.rotation.y = Math.sin(time * 0.2 + i) * 0.2;
    });
  };
  
  // Reset refs when component unmounts
  useEffect(() => {
    return () => {
      seaweedRefs.current = [];
      coralRefs.current = [];
      bubbleRefs.current = [];
      fishRefs.current = [];
    };
  }, []);
  
  return (
    <group ref={zoneRef} visible={active}>
      {/* Ocean floor */}
      <Plane 
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]} 
        args={[50, 50, 10, 10]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#F2D0A4"
          roughness={1}
        />
      </Plane>
      
      {/* Environment elements */}
      {/* Seaweed patches */}
      {createSeaweed([-5, -2, -8], 3, 6)}
      {createSeaweed([3, -2, -6], 2.5, 5)}
      {createSeaweed([7, -2, -4], 4, 7)}
      {createSeaweed([-8, -2, -2], 3.5, 6)}
      {createSeaweed([-3, -2, -12], 3, 5)}
      {createSeaweed([6, -2, -15], 4, 8)}
      
      {/* Coral formations */}
      {createCoral([-3, -1.5, -5], 1.2)}
      {createCoral([5, -1.5, -7], 0.8)}
      {createCoral([2, -1.5, -4], 1.5)}
      {createCoral([-6, -1.5, -3], 1)}
      {createCoral([4, -1.5, -10], 1.3)}
      {createCoral([-2, -1.5, -9], 0.9)}
      
      {/* Bubbles */}
      {createBubble([-4, 0, -6], 0.2)}
      {createBubble([2, 1, -5], 0.15)}
      {createBubble([0, 2, -4], 0.25)}
      {createBubble([-2, 3, -7], 0.18)}
      {createBubble([3, 4, -6], 0.22)}
      {createBubble([-1, 5, -8], 0.2)}
      {createBubble([1, 1, -10], 0.15)}
      {createBubble([-3, 2, -12], 0.2)}
      
      {/* Fish */}
      {createFish([-8, 2, -15], 0.8, '#FF9F59')} {/* Clownfish orange */}
      {createFish([5, 4, -12], 0.6, '#4DB6AC')} {/* Teal fish */}
      {createFish([0, 3, -20], 0.5, '#FFD54F')} {/* Yellow fish */}
      {createFish([-6, 5, -18], 0.7, '#FF5252')} {/* Red fish */}
      {createFish([7, 1, -25], 0.9, '#BA68C8')} {/* Purple fish */}
      
      {/* Water volume light rays (fake with cones) */}
      <mesh position={[0, 5, -10]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[10, 20, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.1}
          side={THREE.BackSide} 
        />
      </mesh>
      
      <mesh position={[8, 5, -15]} rotation={[Math.PI, 0.2, 0]}>
        <coneGeometry args={[8, 16, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.08}
          side={THREE.BackSide} 
        />
      </mesh>
      
      <mesh position={[-6, 5, -20]} rotation={[Math.PI, -0.3, 0]}>
        <coneGeometry args={[7, 18, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.07}
          side={THREE.BackSide} 
        />
      </mesh>
      
      {/* Distant background plane */}
      <Plane
        position={[0, 0, -40]}
        args={[200, 100]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#0c6b9c"
          transparent
          opacity={0.7}
        />
      </Plane>
    </group>
  );
});

CoralReefZone.displayName = 'CoralReefZone';
export default CoralReefZone;