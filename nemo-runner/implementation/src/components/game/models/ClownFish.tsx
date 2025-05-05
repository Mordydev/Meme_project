'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced realistic clownfish model
export default function ClownFish({ actionState = 'idle', actionSpeed = 1 }) {
  // Main refs
  const group = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  
  // Body parts refs for animation
  const bodyRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftFinRef = useRef<THREE.Group>(null);
  const rightFinRef = useRef<THREE.Group>(null);
  const dorsalFinRef = useRef<THREE.Group>(null);
  const pelvicFinRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  
  // Animation parameters
  const animationSpeed = useRef(1);
  const tailWaggle = useRef(0);
  const finWaggle = useRef(0);
  
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

  // Advanced animations with natural motion patterns
  useFrame((_, delta) => {
    const time = Date.now() * 0.001;
    
    if (!modelRef.current) return;
    
    // Body subtle undulation
    if (bodyRef.current) {
      // Sinusoidal motion with time gives natural swimming appearance
      bodyRef.current.rotation.y = Math.sin(time * animationSpeed.current * 0.4) * 0.05;
      bodyRef.current.rotation.z = Math.sin(time * animationSpeed.current * 0.3) * 0.03;
      
      // Forward movement pulse
      const pulse = Math.sin(time * animationSpeed.current * 2) * 0.02;
      bodyRef.current.position.z = pulse;
    }
    
    // Tail animation - more complex waveform for realistic fish tail motion
    if (tailRef.current) {
      tailWaggle.current += delta * animationSpeed.current * 8;
      
      // Main side-to-side motion 
      const mainWag = Math.sin(tailWaggle.current) * 0.25;
      
      // Add secondary smaller, faster oscillation for natural appearance
      const secondaryWag = Math.sin(tailWaggle.current * 1.5) * 0.05;
      
      tailRef.current.rotation.y = mainWag + secondaryWag;
      
      // Subtly adjust other rotations based on the tail wagging
      tailRef.current.rotation.z = Math.sin(tailWaggle.current * 0.5) * 0.05;
      
      // Scale tail slightly with swimming motion for stretch effect
      const tailStretch = 1 + Math.abs(Math.sin(tailWaggle.current * 0.5)) * 0.05;
      tailRef.current.scale.z = tailStretch;
    }
    
    // Pectoral fins animation - alternating pattern
    if (leftFinRef.current && rightFinRef.current) {
      finWaggle.current += delta * animationSpeed.current * 5;
      
      // Create natural fin rowing motion
      const finMotion = (fin: React.MutableRefObject<THREE.Group | null>, phaseOffset: number) => {
        if (!fin.current) return;
        
        // Main rowing motion (Z axis)
        const rowing = Math.sin(finWaggle.current + phaseOffset) * 0.3;
        fin.current.rotation.z = rowing - 0.2; // Base angle adjustment
        
        // Subtle twisting (Y axis)
        fin.current.rotation.y = Math.sin(finWaggle.current * 0.7 + phaseOffset) * 0.1;
        
        // Slight X rotation for more natural motion
        fin.current.rotation.x = Math.sin(finWaggle.current * 0.5 + phaseOffset) * 0.05;
      };
      
      // Apply motion with phase difference between fins for alternating stroke
      finMotion(leftFinRef, 0);
      finMotion(rightFinRef, Math.PI); // Opposite phase
    }
    
    // Dorsal fin subtle ripple
    if (dorsalFinRef.current) {
      // Subtle wave-like motion along the dorsal fin
      const segments = dorsalFinRef.current.children;
      segments.forEach((segment, i) => {
        // Progressive phase delay creates ripple effect
        const phaseDelay = i * 0.2;
        const ripple = Math.sin(time * animationSpeed.current * 3 + phaseDelay) * 0.1;
        segment.rotation.z = ripple;
      });
    }
    
    // Pelvic fin motion
    if (pelvicFinRef.current) {
      pelvicFinRef.current.rotation.x = Math.sin(time * animationSpeed.current * 2) * 0.15;
    }
    
    // Eye movement - occasional blinks and looking around
    const blinkEye = (eye: React.MutableRefObject<THREE.Group | null>) => {
      if (!eye.current) return;
      
      // Get eyelid from eye group
      const eyelid = eye.current.children.find(child => child.name === 'eyelid');
      if (!eyelid) return;
      
      // Random blink pattern - period check with random offset
      const shouldBlink = Math.sin(time * 0.5 + Math.sin(time * 0.2) * 2) > 0.95;
      
      // Apply blink
      if (shouldBlink) {
        (eyelid as THREE.Mesh).scale.y = Math.max(0.1, 1 - (Math.sin(time * 15) + 1) * 0.45);
      } else {
        (eyelid as THREE.Mesh).scale.y = 1;
      }
      
      // Subtle eye movement
      const pupil = eye.current.children.find(child => child.name === 'pupil');
      if (pupil) {
        // Occasional looking around
        const lookX = Math.sin(time * 0.2) * 0.02;
        const lookY = Math.cos(time * 0.3) * 0.02;
        pupil.position.x = 0.05 + lookX;
        pupil.position.y = lookY;
      }
    };
    
    blinkEye(leftEyeRef);
    blinkEye(rightEyeRef);
  });

  return (
    <group ref={group}>
      <group ref={modelRef}>
        {/* BODY - Primary orange body with white stripes */}
        <mesh ref={bodyRef} castShadow receiveShadow>
          {/* Use ellipsoid shape for fish body */}
          <sphereGeometry args={[0.5, 32, 24]} />
          <meshPhysicalMaterial 
            color="#FF8800"
            roughness={0.2}
            metalness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.2}
            envMapIntensity={0.5}
            emissive="#FF4000"
            emissiveIntensity={0.05}
            sheen={0.2}
            sheenRoughness={0.3}
            sheenColor="#FF9D2F"
          />
          
          {/* White stripes with advanced geometry */}
          <group position={[0.15, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.36, 0.09, 24, 36, Math.PI * 2]} />
              <meshPhysicalMaterial 
                color="#FFFFFF"
                roughness={0.1}
                metalness={0.1}
                clearcoat={1.0}
                clearcoatRoughness={0.1}
                emissive="#FFFFFF"
                emissiveIntensity={0.05}
              />
            </mesh>
          </group>
          
          <group position={[-0.12, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.33, 0.08, 24, 36, Math.PI * 2]} />
              <meshPhysicalMaterial 
                color="#FFFFFF"
                roughness={0.1}
                metalness={0.1}
                clearcoat={1.0}
                clearcoatRoughness={0.1}
                emissive="#FFFFFF"
                emissiveIntensity={0.05}
              />
            </mesh>
          </group>
          
          {/* Detailed face features */}
          <group position={[0.45, 0, 0]}>
            {/* Mouth */}
            <mesh position={[0.06, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.08, 0.02, 16, 24, Math.PI]} />
              <meshStandardMaterial color="#600000" />
            </mesh>
            
            {/* Nostrils */}
            <mesh position={[0.05, 0.05, 0.1]} rotation={[Math.PI / 4, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
              <meshStandardMaterial color="#400000" />
            </mesh>
            <mesh position={[0.05, 0.05, -0.1]} rotation={[-Math.PI / 4, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
              <meshStandardMaterial color="#400000" />
            </mesh>
          </group>
        </mesh>
        
        {/* DETAILED TAIL */}
        <group ref={tailRef} position={[-0.6, 0, 0]}>
          {/* Main tail fin */}
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.35, 0.12]} />
            <meshPhysicalMaterial
              color="#FF8800"
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.95}
              clearcoat={1.0}
              clearcoatRoughness={0.2}
              emissive="#FF4000"
              emissiveIntensity={0.05}
            />
          </mesh>
          
          {/* Tail fin with segments */}
          <group position={[-0.15, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.45, 0.06]} />
              <meshPhysicalMaterial
                color="#FF8800"
                roughness={0.2}
                metalness={0.1}
                transparent
                opacity={0.9}
                clearcoat={1.0}
                clearcoatRoughness={0.2}
                emissive="#FF4000"
                emissiveIntensity={0.05}
              />
            </mesh>
            
            {/* Tail end - translucent fin */}
            <mesh position={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.06, 0.6, 0.03]} />
              <meshPhysicalMaterial
                color="#FF9D2F"
                roughness={0.2}
                metalness={0.1}
                transparent
                opacity={0.8}
                clearcoat={1.0}
                clearcoatRoughness={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
        
        {/* LEFT EYE - Complex eye with pupil, eyelid, and highlight */}
        <group ref={leftEyeRef} position={[0.38, 0.15, 0.24]} rotation={[0, -Math.PI/6, 0]}>
          {/* Eyeball */}
          <mesh>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshPhysicalMaterial
              color="#FFFFFF"
              roughness={0.05}
              metalness={0.1}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* Iris */}
          <mesh position={[0.04, 0, 0.08]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshPhysicalMaterial
              color="#88CCFF"
              roughness={0.1}
              metalness={0.2}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* Pupil */}
          <mesh name="pupil" position={[0.05, 0, 0.09]}>
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshPhysicalMaterial
              color="#000000"
              roughness={0.2}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* Eyelid */}
          <mesh name="eyelid" position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial
              color="#FF9F59" 
              transparent
              opacity={0.7}
              roughness={0.2}
              clearcoat={0.7}
              clearcoatRoughness={0.2}
            />
          </mesh>
          
          {/* Eye highlight */}
          <mesh position={[0.02, 0.04, 0.11]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          
          <mesh position={[0.06, -0.02, 0.10]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
        
        {/* RIGHT EYE */}
        <group ref={rightEyeRef} position={[0.38, 0.15, -0.24]} rotation={[0, Math.PI/6, 0]}>
          {/* Eyeball */}
          <mesh>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshPhysicalMaterial
              color="#FFFFFF"
              roughness={0.05}
              metalness={0.1}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* Iris */}
          <mesh position={[0.04, 0, -0.08]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshPhysicalMaterial
              color="#88CCFF"
              roughness={0.1}
              metalness={0.2}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* Pupil */}
          <mesh name="pupil" position={[0.05, 0, -0.09]}>
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshPhysicalMaterial
              color="#000000"
              roughness={0.2}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>
          
          {/* Eyelid */}
          <mesh name="eyelid" position={[0, 0, -0.06]}>
            <sphereGeometry args={[0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial
              color="#FF9F59" 
              transparent
              opacity={0.7}
              roughness={0.2}
              clearcoat={0.7}
              clearcoatRoughness={0.2}
            />
          </mesh>
          
          {/* Eye highlight */}
          <mesh position={[0.02, 0.04, -0.11]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          
          <mesh position={[0.06, -0.02, -0.10]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
        
        {/* PECTORAL FINS - left and right with detailed structure */}
        <group ref={leftFinRef} position={[0.1, 0.25, 0.3]} rotation={[0, 0, -0.3]}>
          {/* Main fin structure - translucent with inner rays */}
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.03, 0.35]} />
            <meshPhysicalMaterial
              color="#FF8800"
              roughness={0.2}
              metalness={0.1}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              transparent
              opacity={0.95}
            />
          </mesh>
          
          {/* Fin membrane - highly translucent */}
          <mesh position={[0.15, 0, 0.1]} rotation={[0, -0.3, 0]}>
            <planeGeometry args={[0.4, 0.35]} />
            <meshPhysicalMaterial
              color="#FF9D2F"
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Fin rays */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0.07 + i * 0.07, 0, 0.08 + i * 0.02]} rotation={[0, -0.2 * i, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.3 - i * 0.04]} />
              <meshStandardMaterial
                color="#FF7700"
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
        
        <group ref={rightFinRef} position={[0.1, 0.25, -0.3]} rotation={[0, 0, -0.3]} scale={[1, 1, -1]}>
          {/* Main fin structure - translucent with inner rays */}
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.03, 0.35]} />
            <meshPhysicalMaterial
              color="#FF8800"
              roughness={0.2}
              metalness={0.1}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              transparent
              opacity={0.95}
            />
          </mesh>
          
          {/* Fin membrane - highly translucent */}
          <mesh position={[0.15, 0, 0.1]} rotation={[0, -0.3, 0]}>
            <planeGeometry args={[0.4, 0.35]} />
            <meshPhysicalMaterial
              color="#FF9D2F"
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Fin rays */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0.07 + i * 0.07, 0, 0.08 + i * 0.02]} rotation={[0, -0.2 * i, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.3 - i * 0.04]} />
              <meshStandardMaterial
                color="#FF7700"
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
        
        {/* DORSAL FIN - detailed with segments */}
        <group ref={dorsalFinRef} position={[0.1, 0.5, 0]}>
          {/* Series of fin segments that can animate independently */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[-0.05 - i * 0.06, 0, 0]} castShadow>
              <boxGeometry args={[0.05, 0.3 - i * 0.02, 0.03]} />
              <meshPhysicalMaterial
                color="#FF8800"
                roughness={0.2}
                metalness={0.1}
                clearcoat={0.8}
                clearcoatRoughness={0.2}
                transparent
                opacity={0.9 - i * 0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          
          {/* Fin membrane connecting the segments */}
          <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.5, 0.25]} />
            <meshPhysicalMaterial
              color="#FF9D2F"
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
        
        {/* PELVIC/ANAL FIN */}
        <group ref={pelvicFinRef} position={[0, -0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.04, 0.15]} />
            <meshPhysicalMaterial
              color="#FF8800"
              roughness={0.2}
              metalness={0.1}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              transparent
              opacity={0.95}
            />
          </mesh>
          
          {/* Membrane */}
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI/2, 0, 0]}>
            <planeGeometry args={[0.35, 0.2]} />
            <meshPhysicalMaterial
              color="#FF9D2F"
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Fin rays */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[-0.15 + i * 0.07, -0.08, 0]}>
              <boxGeometry args={[0.01, 0.15, 0.03]} />
              <meshStandardMaterial
                color="#FF7700"
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
        
        {/* FISH BODY DETAILS */}
        {/* Gill covers */}
        <mesh position={[0.3, 0, 0.25]} rotation={[0, -Math.PI/8, 0]}>
          <planeGeometry args={[0.25, 0.3]} />
          <meshStandardMaterial
            color="#FF6600" 
            side={THREE.DoubleSide}
          />
        </mesh>
        
        <mesh position={[0.3, 0, -0.25]} rotation={[0, Math.PI/8, 0]}>
          <planeGeometry args={[0.25, 0.3]} />
          <meshStandardMaterial
            color="#FF6600"
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Gill slits */}
        {[1, 2, 3].map((i) => (
          <mesh key={i} position={[0.32, 0.05 - i * 0.05, 0.24]} rotation={[0, -Math.PI/6, 0]}>
            <planeGeometry args={[0.15, 0.02]} />
            <meshStandardMaterial
              color="#400000"
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        
        {[1, 2, 3].map((i) => (
          <mesh key={i} position={[0.32, 0.05 - i * 0.05, -0.24]} rotation={[0, Math.PI/6, 0]}>
            <planeGeometry args={[0.15, 0.02]} />
            <meshStandardMaterial
              color="#400000"
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        
        {/* Subtle body patterns/spots - typical for clownfish */}
        {[...Array(15)].map((_, i) => {
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.random() * Math.PI;
          const r = 0.49;
          
          const x = r * Math.sin(theta) * Math.cos(phi);
          const y = r * Math.sin(theta) * Math.sin(phi);
          const z = r * Math.cos(theta);
          
          // Place subtle pattern spots around the body
          if (Math.random() > 0.7) {
            return (
              <mesh key={i} position={[x, y, z]} lookAt={[0, 0, 0]}>
                <circleGeometry args={[0.04 + Math.random() * 0.03, 8]} />
                <meshStandardMaterial
                  color="#FF5500"
                  transparent
                  opacity={0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          }
          return null;
        })}
      </group>
    </group>
  );
}