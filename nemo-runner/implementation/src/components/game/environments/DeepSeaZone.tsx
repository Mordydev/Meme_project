'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { EnvironmentZoneRef } from './CoralReefZone';

const DeepSeaZone = forwardRef<EnvironmentZoneRef, { active: boolean }>((props, ref) => {
  const { active } = props;
  
  // References for animated elements
  const zoneRef = useRef<THREE.Group>(null);
  const ventRefs = useRef<THREE.Group[]>([]);
  const creatureRefs = useRef<THREE.Group[]>([]);
  const kelprefs = useRef<THREE.Group[]>([]);
  const particleRefs = useRef<THREE.Mesh[]>([]);
  
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
  
  // Create hydrothermal vent
  const createVent = (position: [number, number, number], height: number = 3) => {
    return (
      <group 
        position={position}
        ref={(el) => el && ventRefs.current.push(el)}
      >
        {/* Vent structure */}
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.5, 1, height, 16]} />
          <meshStandardMaterial color="#1C2331" roughness={0.9} />
        </mesh>
        
        {/* Vent top with particles */}
        <mesh position={[0, height + 0.2, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 0.4, 16]} />
          <meshStandardMaterial color="#E25822" emissive="#E25822" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Particle system will be handled in animation */}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              (Math.random() - 0.5) * 0.3,
              height + 0.5 + Math.random() * 2,
              (Math.random() - 0.5) * 0.3
            ]}
            ref={(el) => el && particleRefs.current.push(el)}
          >
            <sphereGeometry args={[0.05 + Math.random() * 0.05, 8, 8]} />
            <meshBasicMaterial 
              color={Math.random() > 0.5 ? "#E25822" : "#787878"} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>
    );
  };
  
  // Create deep sea weird creature
  const createDeepSeaCreature = (position: [number, number, number], size: number = 1, type: 'angler' | 'squid' | 'jellies' = 'angler') => {
    if (type === 'angler') {
      return (
        <group
          position={position}
          ref={(el) => el && creatureRefs.current.push(el)}
        >
          {/* Angler fish body */}
          <mesh>
            <sphereGeometry args={[size * 0.5, 16, 16]} />
            <meshStandardMaterial color="#121212" />
          </mesh>
          
          {/* Angler light */}
          <mesh position={[size * 0.6, size * 0.3, 0]}>
            <sphereGeometry args={[size * 0.1, 8, 8]} />
            <meshStandardMaterial 
              color="#5CFFFF" 
              emissive="#5CFFFF"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          
          {/* Scary teeth */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh 
              key={i}
              position={[
                size * 0.4,
                -size * 0.2 + Math.sin(i / 6 * Math.PI) * size * 0.2,
                Math.cos(i / 6 * Math.PI) * size * 0.2
              ]}
              rotation={[0, 0, Math.PI / 4]}
            >
              <coneGeometry args={[size * 0.05, size * 0.2, 8]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          ))}
        </group>
      );
    } else if (type === 'squid') {
      return (
        <group
          position={position}
          ref={(el) => el && creatureRefs.current.push(el)}
        >
          {/* Squid body */}
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[size * 0.4, size * 1.2, 16]} />
            <meshStandardMaterial 
              color="#671D6D" 
              emissive="#B026FF"
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Tentacles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i / 8 * Math.PI * 2) * size * 0.3,
                -size * 0.6,
                Math.cos(i / 8 * Math.PI * 2) * size * 0.3
              ]}
            >
              <boxGeometry args={[size * 0.05, size * 1.5, size * 0.05]} />
              <meshStandardMaterial 
                color="#521356" 
                emissive="#B026FF"
                emissiveIntensity={0.1}
              />
            </mesh>
          ))}
          
          {/* Bioluminescent spots */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh
              key={i + 10}
              position={[
                (Math.random() - 0.5) * size * 0.5,
                (Math.random() - 0.5) * size * 0.8,
                (Math.random() - 0.5) * size * 0.5
              ]}
            >
              <sphereGeometry args={[size * 0.05, 8, 8]} />
              <meshStandardMaterial 
                color="#5CFFFF" 
                emissive="#5CFFFF"
                emissiveIntensity={1}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      );
    } else {
      // Bioluminescent jellies
      return (
        <group
          position={position}
          ref={(el) => el && creatureRefs.current.push(el)}
        >
          {/* Main body */}
          <mesh>
            <sphereGeometry args={[size * 0.3, 16, 16]} />
            <meshStandardMaterial 
              color="#001C55" 
              emissive="#2E5EAA"
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
          
          {/* Glowing inner core */}
          <mesh scale={[0.8, 0.8, 0.8]}>
            <sphereGeometry args={[size * 0.2, 16, 16]} />
            <meshStandardMaterial 
              color="#8BD8FF" 
              emissive="#8BD8FF"
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
          
          {/* Wispy tentacles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i / 12 * Math.PI * 2) * size * 0.25,
                -size * 0.2,
                Math.cos(i / 12 * Math.PI * 2) * size * 0.25
              ]}
            >
              <boxGeometry args={[size * 0.02, size * 0.8, size * 0.02]} />
              <meshStandardMaterial 
                color="#8BD8FF" 
                emissive="#8BD8FF"
                emissiveIntensity={0.5}
                transparent
                opacity={0.5}
              />
            </mesh>
          ))}
        </group>
      );
    }
  };
  
  // Create giant kelp
  const createKelp = (position: [number, number, number], height: number, segments: number = 8) => {
    return (
      <group 
        position={position}
        ref={(el) => el && kelprefs.current.push(el)}
      >
        {Array.from({ length: segments }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              Math.sin(i * 0.3) * 0.3, 
              i * (height / segments), 
              Math.cos(i * 0.3) * 0.3
            ]}
          >
            <cylinderGeometry args={[0.1, 0.2, height / segments, 8]} />
            <meshStandardMaterial 
              color="#0F4C5C" 
              roughness={0.8}
              emissive="#5CFFFF"
              emissiveIntensity={0.1}
            />
          </mesh>
        ))}
        
        {/* Kelp leaf at the top */}
        <mesh position={[0, height, 0]} rotation={[0, 0, Math.PI / 6]}>
          <planeGeometry args={[1, 2]} />
          <meshStandardMaterial 
            color="#0F4C5C" 
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            emissive="#5CFFFF"
            emissiveIntensity={0.05}
          />
        </mesh>
      </group>
    );
  };
  
  // Animation function
  const animateElements = (delta: number) => {
    if (!active) return;
    
    const time = Date.now() * 0.001;
    
    // Animate particles from vents
    particleRefs.current.forEach((particle, i) => {
      // Move particles upward
      particle.position.y += (0.1 + Math.random() * 0.1) * delta;
      particle.position.x += (Math.random() - 0.5) * 0.02;
      particle.position.z += (Math.random() - 0.5) * 0.02;
      
      // Fade out particles as they rise
      const material = particle.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, material.opacity - 0.01 * delta);
      
      // Reset particle when it rises too high or becomes invisible
      if (particle.position.y > 8 || material.opacity <= 0) {
        // Find parent vent
        const ventIndex = Math.floor(i / 15) % ventRefs.current.length;
        const vent = ventRefs.current[ventIndex];
        
        if (vent) {
          // Reset position to just above the vent
          particle.position.set(
            vent.position.x + (Math.random() - 0.5) * 0.3,
            vent.position.y + 3.5 + Math.random() * 0.2,
            vent.position.z + (Math.random() - 0.5) * 0.3
          );
          
          // Reset opacity
          material.opacity = 0.8;
          
          // Randomize color between smoke and embers
          material.color.set(Math.random() > 0.5 ? "#E25822" : "#787878");
        }
      }
    });
    
    // Animate deep sea creatures
    creatureRefs.current.forEach((creature, i) => {
      // Slow, eerie movements
      creature.position.y += Math.sin(time * 0.3 + i) * 0.005;
      creature.position.x += Math.sin(time * 0.2 + i * 0.5) * 0.01;
      creature.position.z += Math.cos(time * 0.2 + i) * 0.01;
      
      // Rotation to face movement direction slightly
      creature.rotation.y = Math.sin(time * 0.1 + i) * 0.2;
      
      // Handle different creature types differently
      if (i % 3 === 0) {
        // Angler fish - occasional quick darting
        if (Math.random() < 0.01) {
          creature.position.x += (Math.random() - 0.5) * 0.5;
          creature.position.z += (Math.random() - 0.5) * 0.5;
        }
        
        // Light pulsing
        if (creature.children[1]) {
          const lightMesh = creature.children[1] as THREE.Mesh;
          const lightMaterial = lightMesh.material as THREE.MeshStandardMaterial;
          lightMaterial.emissiveIntensity = 1.5 + Math.sin(time * 4 + i) * 0.5;
        }
      } else if (i % 3 === 1) {
        // Squid - pulsing motion
        creature.scale.y = 1 + Math.sin(time * 0.8 + i) * 0.1;
        
        // Tentacle wiggling
        for (let j = 1; j < 9; j++) {
          if (creature.children[j]) {
            creature.children[j].rotation.x = Math.sin(time * 2 + j * 0.3 + i) * 0.2;
            creature.children[j].rotation.z = Math.cos(time * 2 + j * 0.3 + i) * 0.2;
          }
        }
        
        // Bioluminescent spots pulsing
        for (let j = 9; j < creature.children.length; j++) {
          if (creature.children[j]) {
            const spotMesh = creature.children[j] as THREE.Mesh;
            const spotMaterial = spotMesh.material as THREE.MeshStandardMaterial;
            spotMaterial.emissiveIntensity = 0.8 + Math.sin(time * 3 + j + i) * 0.3;
          }
        }
      } else {
        // Luminescent jellies - gentle pulsing
        creature.scale.x = 1 + Math.sin(time * 1.2 + i) * 0.1;
        creature.scale.y = 1 + Math.sin(time * 1.2 + i + 1) * 0.1;
        creature.scale.z = 1 + Math.sin(time * 1.2 + i + 2) * 0.1;
        
        // Tentacle movement
        for (let j = 2; j < creature.children.length; j++) {
          if (creature.children[j]) {
            creature.children[j].rotation.x = Math.sin(time * 1.5 + j * 0.2 + i) * 0.3;
          }
        }
        
        // Inner core pulsing
        if (creature.children[1]) {
          const coreMesh = creature.children[1] as THREE.Mesh;
          const coreMaterial = coreMesh.material as THREE.MeshStandardMaterial;
          coreMaterial.emissiveIntensity = 0.8 + Math.sin(time * 2 + i) * 0.2;
        }
      }
    });
    
    // Animate kelp
    kelprefs.current.forEach((kelp, i) => {
      // Gentle swaying
      const segments = kelp.children.length - 1; // Subtract the leaf at the top
      
      for (let j = 0; j < segments; j++) {
        const segment = kelp.children[j];
        
        // Segments sway more the higher up they are
        const swayFactor = j / segments * 0.2;
        segment.rotation.x = Math.sin(time * 0.5 + i + j * 0.1) * swayFactor;
        segment.rotation.z = Math.cos(time * 0.5 + i + j * 0.2) * swayFactor;
      }
      
      // Leaf sways more dramatically
      if (kelp.children[segments]) {
        kelp.children[segments].rotation.x = Math.sin(time * 0.7 + i) * 0.4;
        kelp.children[segments].rotation.z = Math.PI / 6 + Math.cos(time * 0.6 + i) * 0.3;
      }
    });
  };
  
  // Reset refs when component unmounts
  useEffect(() => {
    return () => {
      ventRefs.current = [];
      creatureRefs.current = [];
      kelprefs.current = [];
      particleRefs.current = [];
    };
  }, []);
  
  return (
    <group ref={zoneRef} visible={active}>
      {/* Deep sea floor */}
      <Plane 
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -5, 0]} 
        args={[100, 100, 10, 10]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#101820"
          roughness={1}
        />
      </Plane>
      
      {/* Environment elements */}
      {/* Hydrothermal vents */}
      {createVent([-10, -5, -15], 3)}
      {createVent([5, -5, -20], 4)}
      {createVent([-8, -5, -30], 2.5)}
      {createVent([15, -5, -25], 3.5)}
      
      {/* Deep sea creatures */}
      {/* Angler fish */}
      {createDeepSeaCreature([-5, 2, -10], 1, 'angler')}
      {createDeepSeaCreature([8, 5, -15], 1.5, 'angler')}
      {createDeepSeaCreature([3, 7, -25], 1.2, 'angler')}
      
      {/* Glowing squid */}
      {createDeepSeaCreature([-12, 6, -20], 1.2, 'squid')}
      {createDeepSeaCreature([10, 3, -30], 1.5, 'squid')}
      {createDeepSeaCreature([0, 10, -35], 1, 'squid')}
      
      {/* Bioluminescent jellies */}
      {createDeepSeaCreature([-3, 8, -12], 1.5, 'jellies')}
      {createDeepSeaCreature([6, 4, -18], 1.8, 'jellies')}
      {createDeepSeaCreature([-7, 12, -25], 2, 'jellies')}
      {createDeepSeaCreature([12, 7, -40], 1.6, 'jellies')}
      {createDeepSeaCreature([0, 5, -30], 1.2, 'jellies')}
      
      {/* Kelp forests */}
      {createKelp([-12, -5, -5], 8, 12)}
      {createKelp([-10, -5, -8], 6, 10)}
      {createKelp([-14, -5, -7], 7, 11)}
      {createKelp([18, -5, -10], 9, 14)}
      {createKelp([16, -5, -12], 7, 12)}
      {createKelp([20, -5, -15], 8, 13)}
      
      {/* Large rock formations */}
      <mesh position={[-15, -3, -20]} rotation={[0.2, 0.5, 0.1]}>
        <dodecahedronGeometry args={[5, 0]} />
        <meshStandardMaterial color="#1C2331" roughness={0.9} />
      </mesh>
      
      <mesh position={[20, -2, -25]} rotation={[-0.1, -0.3, 0.2]}>
        <dodecahedronGeometry args={[6, 0]} />
        <meshStandardMaterial color="#1C2331" roughness={0.9} />
      </mesh>
      
      <mesh position={[0, -4, -35]} rotation={[0.3, 0, -0.1]}>
        <dodecahedronGeometry args={[8, 0]} />
        <meshStandardMaterial color="#1C2331" roughness={0.9} />
      </mesh>
      
      {/* Ambient glowing particles */}
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh
          key={`ambient_${i}`}
          position={[
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 20 + 5,
            (Math.random() - 0.5) * 60 - 20
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial 
            color={
              Math.random() < 0.33 ? "#5CFFFF" : 
              Math.random() < 0.66 ? "#B026FF" : "#8BD8FF"
            } 
            transparent 
            opacity={0.7}
          />
        </mesh>
      ))}
      
      {/* Distant mist effect */}
      <mesh position={[0, 0, -60]}>
        <planeGeometry args={[150, 100]} />
        <meshBasicMaterial 
          color="#041e31" 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Very distant background */}
      <Plane
        position={[0, 0, -100]}
        args={[300, 200]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#020C18"
          transparent
          opacity={0.95}
        />
      </Plane>
    </group>
  );
});

DeepSeaZone.displayName = 'DeepSeaZone';
export default DeepSeaZone;