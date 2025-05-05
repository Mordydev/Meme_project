'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import Coral from '../models/Coral';
import ClownFish from '../models/ClownFish';

// Seaweed geometry and materials
const SEAWEED_COLORS = [
  '#2ECC71', // Bright green
  '#27AE60', // Dark green
  '#3EC483', // Teal-green
  '#1ABC9C', // Turquoise
  '#45B39D', // Sea green
];

export interface EnvironmentZoneRef {
  getElements: () => THREE.Object3D[];
  update: (delta: number) => void;
}

const CoralReefZone = forwardRef<EnvironmentZoneRef, { active: boolean }>((props, ref) => {
  const { active } = props;
  
  // References for animated elements
  const zoneRef = useRef<THREE.Group>(null);
  const seaweedRefs = useRef<THREE.Group[]>([]);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);
  const fishRefs = useRef<THREE.Group[]>([]);
  
  // Floor reference
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Water surface geometry
  const waterSurfaceGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Add gentle wave pattern to z coordinate
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 2] = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.5;
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  
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
  
  // Create improved seaweed group with better geometry
  const createSeaweed = (position: [number, number, number], height: number, count: number = 5) => {
    const segments = Math.max(5, Math.floor(count * 1.5));
    const color = SEAWEED_COLORS[Math.floor(Math.random() * SEAWEED_COLORS.length)];
    const width = 0.05 + Math.random() * 0.05;
    
    return (
      <group 
        position={position}
        ref={(el) => {
          if (el) seaweedRefs.current.push(el);
          return null;
        }}
      >
        {/* Multiple strands of seaweed */}
        {Array.from({ length: Math.floor(3 + Math.random() * 3) }).map((_, strandIndex) => {
          const strandOffset = [
            (Math.random() - 0.5) * 0.5,
            0,
            (Math.random() - 0.5) * 0.5
          ];
          
          return (
            <group key={`strand-${strandIndex}`} position={strandOffset as [number, number, number]}>
              {Array.from({ length: segments }).map((_, i) => {
                const segmentHeight = height / segments;
                const yPos = i * segmentHeight;
                const segmentWidth = width * (1 - (i / segments) * 0.5); // Taper towards the top
                
                return (
                  <mesh 
                    key={`segment-${strandIndex}-${i}`}
                    position={[0, yPos + segmentHeight/2, 0]}
                    castShadow
                    receiveShadow
                  >
                    <cylinderGeometry args={[segmentWidth * 0.7, segmentWidth, segmentHeight, 8]} />
                    <meshPhysicalMaterial 
                      color={color}
                      roughness={0.8}
                      clearcoat={0.2}
                      clearcoatRoughness={0.4}
                      transmission={0.2}
                      ior={1.3}
                    />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>
    );
  };
  
  // Create enhanced bubble with better materials
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
        <meshPhysicalMaterial 
          color="#FFFFFF" 
          transparent 
          opacity={0.2} 
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    );
  };
  
  // Create school of small ambient fish
  const createSchoolOfFish = (position: [number, number, number], count: number = 10, color: string = '#48CAFF') => {
    const school = [];
    
    for (let i = 0; i < count; i++) {
      // Random position within the school
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetY = (Math.random() - 0.5) * 2;
      const offsetZ = (Math.random() - 0.5) * 3;
      
      // Vary the size slightly
      const size = 0.1 + Math.random() * 0.1;
      
      // Vary the color slightly
      const fishColor = new THREE.Color(color);
      fishColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      
      school.push(
        <group
          key={`small-fish-${i}`}
          position={[position[0] + offsetX, position[1] + offsetY, position[2] + offsetZ]}
          rotation={[0, Math.random() * Math.PI * 2, 0]}
          ref={(el) => {
            if (el) fishRefs.current.push(el);
            return null;
          }}
        >
          {/* Fish body */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[size, 16, 16]} scale={[1, 0.5, 0.2]} />
            <meshPhysicalMaterial 
              color={fishColor} 
              roughness={0.3}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
            />
          </mesh>
          
          {/* Fish tail */}
          <mesh position={[-size * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <coneGeometry args={[size * 0.5, size * 0.8, 2, 1]} />
            <meshPhysicalMaterial 
              color={fishColor}
              roughness={0.4}
              clearcoat={0.4}
              clearcoatRoughness={0.3}
            />
          </mesh>
        </group>
      );
    }
    
    return school;
  };
  
  // Animation function
  const animateElements = (delta: number) => {
    if (!active) return;
    
    const time = Date.now() * 0.001;
    
    // Animate seaweed
    seaweedRefs.current.forEach((seaweed, i) => {
      seaweed.children.forEach((strand, j) => {
        strand.children.forEach((segment, k) => {
          // More natural swaying motion - stronger at the top
          const swayFactor = 0.05 + (k / strand.children.length) * 0.2;
          const frequency = 0.8 + (i * 0.1) + (j * 0.05);
          const phaseOffset = i * 0.5 + j * 0.3 + k * 0.1;
          
          segment.rotation.x = Math.sin(time * frequency + phaseOffset) * swayFactor;
          segment.rotation.z = Math.cos(time * frequency * 0.7 + phaseOffset) * swayFactor;
        });
      });
    });
    
    // Animate bubbles (rising effect with improved physics)
    bubbleRefs.current.forEach((bubble, i) => {
      // Vertical movement with acceleration
      bubble.position.y += (0.3 + i * 0.02) * delta;
      
      // Side-to-side motion
      bubble.position.x += Math.sin(time * 0.8 + i * 2.1) * 0.015 * delta;
      bubble.position.z += Math.cos(time * 0.7 + i * 1.8) * 0.012 * delta;
      
      // Reset bubble position when it rises too high
      if (bubble.position.y > 12) {
        bubble.position.y = -2;
        bubble.position.x = Math.random() * 25 - 12.5;
        bubble.position.z = Math.random() * 25 - 35;
        
        // Randomize bubble size when respawning
        const newSize = 0.05 + Math.random() * 0.25;
        if (bubble.geometry instanceof THREE.SphereGeometry) {
          bubble.geometry.dispose();
          bubble.geometry = new THREE.SphereGeometry(newSize, 16, 16);
        }
      }
    });
    
    // Animate fish - more complex swimming behaviors
    fishRefs.current.forEach((fish, i) => {
      const uniqueTime = time + i * 0.5;
      
      // School swimming patterns - fish follow sinusoidal paths
      const swimSpeed = 0.5 + Math.sin(uniqueTime * 0.3) * 0.2; // Speed varies over time
      
      // Forward movement
      const direction = fish.rotation.y;
      fish.position.x += Math.sin(direction) * swimSpeed * delta;
      fish.position.z += Math.cos(direction) * swimSpeed * delta;
      
      // Vertical undulation
      fish.position.y += Math.sin(uniqueTime * 2) * 0.01;
      
      // Turning behavior
      const turnSpeed = 0.1;
      fish.rotation.y += Math.sin(uniqueTime * 0.2) * turnSpeed * delta;
      
      // Tail wiggle
      if (fish.children[1]) {
        fish.children[1].rotation.y = Math.sin(uniqueTime * 8) * 0.4;
      }
      
      // Keep fish within bounds
      const bounds = 30;
      if (Math.abs(fish.position.x) > bounds || Math.abs(fish.position.z) > bounds || fish.position.z > -5) {
        // Turn fish around when it reaches the boundary
        fish.rotation.y = Math.atan2(-fish.position.x, -fish.position.z - 20);
      }
    });
    
    // Animate water surface if it exists
    if (floorRef.current) {
      // Gentle wave animation for sand ripples
      const positions = (floorRef.current.geometry as THREE.PlaneGeometry).attributes.position.array;
      const time = Date.now() * 0.001;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        // Subtle sand ripple effect
        positions[i + 1] = Math.sin(x * 0.5 + time * 0.1) * Math.cos(z * 0.5 + time * 0.1) * 0.05;
      }
      
      (floorRef.current.geometry as THREE.PlaneGeometry).attributes.position.needsUpdate = true;
      (floorRef.current.geometry as THREE.PlaneGeometry).computeVertexNormals();
    }
  };
  
  // Reset refs when component unmounts
  useEffect(() => {
    return () => {
      seaweedRefs.current = [];
      bubbleRefs.current = [];
      fishRefs.current = [];
    };
  }, []);
  
  return (
    <group ref={zoneRef} visible={active}>
      {/* Improved ocean floor with realistic sand texture */}
      <Plane 
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]} 
        args={[60, 60, 32, 32]}
        receiveShadow
      >
        <meshPhysicalMaterial 
          color="#F2D0A4"
          roughness={0.9}
          clearcoat={0.05}
          clearcoatRoughness={0.8}
          metalness={0.1}
          displacement={0.05}
          displacementScale={0.2}
        >
          {/* Add displacement map for sand ripples */}
          <displacementMap attach="displacementMap">
            <planeGeometry args={[1, 1, 32, 32]} />
            <meshStandardMaterial 
              wireframe 
              color="white" 
              opacity={0}
              transparent
            />
          </displacementMap>
        </meshPhysicalMaterial>
      </Plane>
      
      {/* Rock formations */}
      <group position={[5, -2, -12]}>
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.5, 1]} />
          <meshPhysicalMaterial color="#666666" roughness={0.9} />
        </mesh>
        <mesh position={[-1, 0.4, 0.5]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.8, 1]} />
          <meshPhysicalMaterial color="#7A7A7A" roughness={0.85} />
        </mesh>
        <mesh position={[0.8, 0.5, -0.6]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshPhysicalMaterial color="#5A5A5A" roughness={0.92} />
        </mesh>
      </group>
      
      <group position={[-7, -2, -7]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.2, 1]} />
          <meshPhysicalMaterial color="#707070" roughness={0.88} />
        </mesh>
        <mesh position={[0.9, 0.3, 0.3]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.7, 1]} />
          <meshPhysicalMaterial color="#656565" roughness={0.9} />
        </mesh>
      </group>
      
      {/* Environment elements */}
      {/* Enhanced seaweed patches */}
      {createSeaweed([-5, -2, -8], 3, 6)}
      {createSeaweed([3, -2, -6], 2.5, 5)}
      {createSeaweed([7, -2, -4], 4, 7)}
      {createSeaweed([-8, -2, -2], 3.5, 6)}
      {createSeaweed([-3, -2, -12], 3, 5)}
      {createSeaweed([6, -2, -15], 4, 8)}
      {createSeaweed([0, -2, -18], 3.8, 7)}
      {createSeaweed([-6, -2, -20], 3.2, 6)}
      {createSeaweed([8, -2, -22], 4.5, 9)}
      
      {/* Detailed coral formations using our new Coral component */}
      <Coral position={[-3, -1.6, -5]} scale={1.2} type="branching" swayFactor={0.8} />
      <Coral position={[5, -1.5, -7]} scale={0.9} type="elkhorn" color="#FF8A5E" />
      <Coral position={[2, -1.5, -4]} scale={1.5} type="table" color="#FFB6C1" />
      <Coral position={[-6, -1.5, -3]} scale={1.1} type="soft" color="#8BE9FD" swayFactor={1.5} />
      <Coral position={[4, -1.5, -10]} scale={1.3} type="brain" color="#FF5A5F" />
      <Coral position={[-2, -1.5, -9]} scale={0.9} type="staghorn" color="#50FA7B" swayFactor={1.2} />
      <Coral position={[1, -1.5, -15]} scale={1.2} type="mushroom" color="#BD93F9" />
      <Coral position={[-5, -1.5, -12]} scale={1.5} type="branching" color="#FFC154" swayFactor={1} />
      <Coral position={[6, -1.5, -12]} scale={1.1} type="soft" color="#FF6B6B" swayFactor={1.3} />
      <Coral position={[3, -1.5, -20]} scale={1.4} type="brain" color="#FFA07A" />
      <Coral position={[-4, -1.5, -18]} scale={1.3} type="elkhorn" color="#8BE9FD" />
      <Coral position={[0, -1.5, -22]} scale={1.6} type="table" color="#50FA7B" />
      <Coral position={[-7, -1.5, -15]} scale={1.2} type="mushroom" color="#FFB6C1" />
      <Coral position={[7, -1.5, -18]} scale={1.0} type="staghorn" color="#FF8A5E" swayFactor={1.1} />
      <Coral position={[-3, -1.5, -25]} scale={1.5} type="branching" color="#BD93F9" swayFactor={0.9} />
      
      {/* Enhanced bubbles with better materials */}
      {createBubble([-4, 0, -6], 0.2)}
      {createBubble([2, 1, -5], 0.15)}
      {createBubble([0, 2, -4], 0.25)}
      {createBubble([-2, 3, -7], 0.18)}
      {createBubble([3, 4, -6], 0.22)}
      {createBubble([-1, 5, -8], 0.2)}
      {createBubble([1, 1, -10], 0.15)}
      {createBubble([-3, 2, -12], 0.2)}
      {createBubble([5, 0, -15], 0.3)}
      {createBubble([-5, 4, -20], 0.25)}
      {createBubble([2, 6, -18], 0.18)}
      {createBubble([-1, 3, -25], 0.22)}
      {createBubble([4, 7, -22], 0.17)}
      {createBubble([0, 5, -16], 0.24)}
      {createBubble([-4, 6, -14], 0.19)}
      {createBubble([6, 2, -8], 0.21)}
      {createBubble([-6, 1, -9], 0.16)}
      {createBubble([3, 3, -12], 0.26)}
      {createBubble([-2, 5, -22], 0.23)}
      {createBubble([7, 8, -17], 0.18)}
      
      {/* Featured clownfish using our new detailed model */}
      <ClownFish position={[-8, 2, -15]} scale={1.8} swim />
      <ClownFish position={[5, 4, -12]} scale={1.4} color="#FF6B6B" swim />
      
      {/* Schools of small ambient fish */}
      {createSchoolOfFish([-12, 6, -20], 15, '#48CAFF')} {/* Blue school */}
      {createSchoolOfFish([10, 8, -25], 12, '#FFD54F')} {/* Yellow school */}
      {createSchoolOfFish([0, 10, -30], 18, '#FF9F59')} {/* Orange school */}
      {createSchoolOfFish([-8, 7, -35], 14, '#4DB6AC')} {/* Teal school */}
      
      {/* Enhanced volumetric light rays */}
      <mesh position={[0, 8, -10]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[12, 25, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      
      <mesh position={[8, 8, -15]} rotation={[Math.PI, 0.2, 0]}>
        <coneGeometry args={[10, 20, 32, 1, true]} />
        <meshBasicMaterial 
          color="#ABCDEF" 
          transparent 
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      
      <mesh position={[-6, 8, -20]} rotation={[Math.PI, -0.3, 0]}>
        <coneGeometry args={[9, 22, 32, 1, true]} />
        <meshBasicMaterial 
          color="#75C2F6" 
          transparent 
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Caustic light patterns on seafloor */}
      <mesh position={[0, -1.95, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial 
          color="#FFFFFF"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Water surface with ripples */}
      <mesh position={[0, 12, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={waterSurfaceGeometry} />
        <meshPhysicalMaterial 
          color="#75C2F6"
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          ior={1.4}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Improved distant background gradient */}
      <Plane
        position={[0, 0, -60]}
        args={[200, 100]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#0A2E52" // Deeper blue for better depth cues
          transparent
          opacity={0.7}
        />
      </Plane>
    </group>
  );
});

CoralReefZone.displayName = 'CoralReefZone';
export default CoralReefZone;