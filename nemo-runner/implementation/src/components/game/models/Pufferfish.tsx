'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PufferfishProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  secondaryColor?: string;
  inflated?: boolean;
  proximityInflation?: boolean;
}

// Enhanced pufferfish model with realistic geometry and inflation animation
export default function Pufferfish({ 
  scale = 1, 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#F39C12', 
  secondaryColor = '#E67E22',
  inflated = false, 
  proximityInflation = false 
}: PufferfishProps) {
  const group = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const eyeRefs = useRef<THREE.Mesh[]>([]);
  const finRefs = useRef<THREE.Mesh[]>([]);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  // Time offset for random animation variation
  const timeOffset = useMemo(() => Math.random() * 100, []);
  
  // Inflation state
  const [inflationLevel, setInflationLevel] = useState(inflated ? 1 : 0);
  const inflationLevelRef = useRef(inflated ? 1 : 0);
  
  // Initialize refs arrays
  useEffect(() => {
    finRefs.current = [];
    eyeRefs.current = [];
    
    // Set initial inflation state
    if (inflated) {
      setInflationLevel(1);
      inflationLevelRef.current = 1;
    } else if (!proximityInflation) {
      setInflationLevel(0);
      inflationLevelRef.current = 0;
    }
  }, [inflated, proximityInflation]);
  
  // Handle inflation state changes
  useEffect(() => {
    if (inflated) {
      setInflationLevel(1);
      inflationLevelRef.current = 1;
    } else if (!proximityInflation) {
      setInflationLevel(0);
      inflationLevelRef.current = 0;
    }
  }, [inflated, proximityInflation]);
  
  // Body texture pattern - create spotty texture
  const spotPattern = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.Texture();
    
    // Fill base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add spots
    ctx.fillStyle = secondaryColor;
    const spotCount = 40;
    
    for (let i = 0; i < spotCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 10 + Math.random() * 30;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
  }, [color, secondaryColor]);
  
  // Custom geometry for more realistic fins
  const createFinGeometry = (width = 1, height = 1, segments = 8) => {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Center point at fin base
    vertices.push(0, 0, 0);
    uvs.push(0.5, 0);
    
    // Create curved fin shape
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = (t * Math.PI) - (Math.PI / 2);
      
      // Create a curved fin shape
      const x = Math.cos(angle) * width * t;
      const y = Math.sin(angle) * height * Math.sin(t * Math.PI);
      
      vertices.push(x, y, 0);
      uvs.push(t, 1);
      
      // Create triangles (fan from center point)
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    return geometry;
  };
  
  // Custom geometry for tail fin
  const tailFinGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const segments = 12;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create a fan-shaped geometry
    // Center point
    vertices.push(0, 0, 0);
    uvs.push(0.5, 0);
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = (t * Math.PI) - (Math.PI / 2);
      
      // Half-circle shape with some variation
      const x = Math.cos(angle) * 0.8;
      const y = Math.sin(angle) * 0.8 * (0.7 + 0.5 * Math.sin(t * Math.PI * 3));
      
      vertices.push(x, y, 0);
      uvs.push(t, 1);
      
      // Create triangles
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    return geometry;
  }, []);
  
  // Enhanced pufferfish animation
  useFrame((_, delta) => {
    const time = Date.now() * 0.001 + timeOffset;
    
    // Smooth inflation/deflation transition
    if ((inflated || proximityInflation) && inflationLevelRef.current < 1) {
      // Inflate with a bit of wobble at the end
      const inflationSpeed = 2;
      const newLevel = Math.min(1, inflationLevelRef.current + delta * inflationSpeed);
      
      // Add a slight wobble/bounce effect when almost fully inflated
      const wobbleThreshold = 0.8;
      if (inflationLevelRef.current < wobbleThreshold && newLevel >= wobbleThreshold) {
        // Temporarily over-inflate slightly for bounce effect
        inflationLevelRef.current = 1.05;
      } else {
        inflationLevelRef.current = newLevel;
      }
      
      setInflationLevel(inflationLevelRef.current);
    } else if (!inflated && !proximityInflation && inflationLevelRef.current > 0) {
      // Deflate gradually
      inflationLevelRef.current = Math.max(0, inflationLevelRef.current - delta * 1.5);
      setInflationLevel(inflationLevelRef.current);
    }
    
    // Normalize inflation level to 0-1 range for animation
    const normalizedInflation = Math.min(1, Math.max(0, inflationLevelRef.current));
    
    // Apply animation based on inflation
    if (bodyRef.current) {
      // Base size + inflation size with slight elongation when not inflated
      const baseScaleX = 1;
      const baseScaleY = 0.9;
      const baseScaleZ = 0.9;
      
      const inflatedScale = 1.8;
      
      // When inflated, become more round; when deflated, become more oval
      const currentScaleX = baseScaleX + (inflatedScale - baseScaleX) * normalizedInflation;
      const currentScaleY = baseScaleY + (inflatedScale - baseScaleY) * normalizedInflation;
      const currentScaleZ = baseScaleZ + (inflatedScale - baseScaleZ) * normalizedInflation;
      
      // Apply scaling to body
      bodyRef.current.scale.set(currentScaleX, currentScaleY, currentScaleZ);
      
      // Add subtle body wobble when swimming (less when inflated)
      const wobbleAmount = 0.05 * (1 - normalizedInflation);
      bodyRef.current.rotation.x = Math.sin(time * 2) * wobbleAmount;
      bodyRef.current.rotation.z = Math.sin(time * 1.7) * wobbleAmount;
    }
    
    // Apply animation to spikes - extend when inflated
    if (spikesRef.current) {
      const baseLength = 0.2;
      const extendedLength = 1.5;
      const currentLength = baseLength + (extendedLength - baseLength) * normalizedInflation;
      
      // Scale spikes based on inflation level
      spikesRef.current.scale.set(
        1 + normalizedInflation * 0.4,
        currentLength,
        1 + normalizedInflation * 0.4
      );
      
      // Rotate spikes slightly when inflating for dynamic effect
      const rotationAmount = normalizedInflation * 0.2;
      
      // Apply subtle rotation to spikes
      spikesRef.current.children.forEach((spike, i) => {
        if (spike instanceof THREE.Mesh) {
          const rotX = Math.sin(time * 1.5 + i * 0.2) * rotationAmount;
          const rotZ = Math.cos(time * 1.7 + i * 0.3) * rotationAmount;
          
          spike.rotation.x = rotX;
          spike.rotation.z = rotZ;
        }
      });
    }
    
    // Animate fins - more active when not inflated
    finRefs.current.forEach((fin, i) => {
      if (!fin) return;
      
      // More active when not inflated (swimming), less when inflated
      const activityFactor = 1 - normalizedInflation * 0.8;
      const finSpeed = 5 * activityFactor;
      const finAmount = 0.3 * activityFactor;
      
      // Fin animation with phase offset for each fin
      // Different animation pattern for different fins
      if (i === 0) { // Top fin
        fin.rotation.x = Math.sin(time * finSpeed) * finAmount * 0.5;
        fin.rotation.z = Math.sin(time * finSpeed * 0.7) * finAmount;
      } else if (i === 3) { // Tail fin
        fin.rotation.y = Math.sin(time * finSpeed * 1.2) * finAmount * 1.5;
      } else { // Side fins
        fin.rotation.z = Math.sin(time * finSpeed + i) * finAmount;
        fin.rotation.x = Math.cos(time * finSpeed * 0.8 + i) * finAmount * 0.5;
      }
    });
    
    // Mouth animation - open and close occasionally, more when inflated
    if (mouthRef.current) {
      const mouthActivity = 0.2 + normalizedInflation * 0.5; // More active when inflated
      const mouthCycle = Math.sin(time * 0.8) * 0.5 + 0.5; // 0-1 cycle
      
      // Open mouth more when inflated and during certain times in animation cycle
      if (mouthCycle > 0.7) {
        const openAmount = (mouthCycle - 0.7) / 0.3; // Normalize to 0-1
        mouthRef.current.scale.y = 1 + openAmount * mouthActivity * 2;
      } else {
        mouthRef.current.scale.y = 1;
      }
    }
    
    // Eye animation - occasional blinking and looking around
    eyeRefs.current.forEach((eye, i) => {
      if (!eye) return;
      
      // Occasional blinking
      const shouldBlink = Math.random() < 0.005;
      if (shouldBlink) {
        eye.scale.y = 0.2; // Blink
        setTimeout(() => {
          if (eye) eye.scale.y = 1; // Open after a short time
        }, 150);
      }
      
      // Look around subtly
      const lookSpeed = 0.3;
      const lookAmount = 0.1;
      eye.position.x = 0.12 + Math.sin(time * lookSpeed + i) * lookAmount * 0.3;
      eye.position.y = Math.sin(time * lookSpeed * 0.7 + i) * lookAmount * 0.2;
    });
    
    // Overall pufferfish movement - bobbing and floating
    if (group.current) {
      // Reduced movement when inflated
      const movementFactor = 1 - normalizedInflation * 0.7;
      
      // Float up and down
      group.current.position.y = Math.sin(time * 0.5) * 0.1 * movementFactor;
      
      // Subtle rotation
      group.current.rotation.x = Math.sin(time * 0.3) * 0.05 * movementFactor;
      group.current.rotation.z = Math.sin(time * 0.4) * 0.05 * movementFactor;
    }
  });
  
  // Create spikes all around the pufferfish with improved distribution
  const createSpikes = () => {
    const spikes = [];
    const spikeCount = 32;
    
    // Use Fibonacci sphere distribution for more even placement
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    for (let i = 0; i < spikeCount; i++) {
      const y = 1 - (i / (spikeCount - 1)) * 2; // Range from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      
      const theta = 2 * Math.PI * i / goldenRatio;
      
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      // Randomize spike length slightly
      const spikeLength = 0.5 * (0.8 + Math.random() * 0.4);
      const spikeWidth = 0.08 * (0.8 + Math.random() * 0.4);
      
      // Create spike with slight variation
      spikes.push(
        <mesh 
          key={i} 
          position={[x, y, z]} 
          rotation={[0, 0, 0]}
          lookAt={[0, 0, 0]}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[spikeWidth, spikeLength, 8]} />
          <meshPhysicalMaterial 
            color={secondaryColor} 
            roughness={0.7}
            clearcoat={0.2}
            clearcoatRoughness={0.4}
          />
        </mesh>
      );
    }
    
    return spikes;
  };
  
  return (
    <group ref={group} scale={scale} position={position} rotation={rotation}>
      {/* Body - main spherical body with better texture */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.6}
          metalness={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          map={spotPattern}
        />
      </mesh>
      
      {/* Spikes - extendable when inflated */}
      <group ref={spikesRef} scale={[1, 0.2, 1]}>
        {createSpikes()}
      </group>
      
      {/* Eyes with more detail */}
      {[0.5, -0.5].map((eyePos, i) => (
        <group key={`eye-group-${i}`} position={[0.6, 0.3, eyePos]} rotation={[0, eyePos > 0 ? -Math.PI / 6 : Math.PI / 6, 0]}>
          {/* Eye socket */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.27, 24, 24]} />
            <meshPhysicalMaterial 
              color="#FFFFFF" 
              roughness={0.3}
              metalness={0.1}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
            />
          </mesh>
          
          {/* Iris */}
          <mesh position={[0.12, 0, eyePos > 0 ? 0.05 : -0.05]} castShadow receiveShadow>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshPhysicalMaterial 
              color={eyePos > 0 ? "#2965A8" : "#2965A8"} // Different colored eyes
              roughness={0.2}
              metalness={0.2}
              clearcoat={0.8}
              clearcoatRoughness={0.1}
            />
            
            {/* Pupil */}
            <mesh 
              position={[0.08, 0, 0]} 
              ref={(el) => {
                if (el) eyeRefs.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color="#000000" roughness={0.1} />
              
              {/* Reflection highlight */}
              <mesh position={[0.02, 0.02, 0.02]} scale={0.3}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </mesh>
          </mesh>
        </group>
      ))}
      
      {/* Improved mouth */}
      <group position={[0.7, -0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Outer lips */}
        <mesh ref={mouthRef} receiveShadow>
          <torusGeometry args={[0.15, 0.05, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Inner mouth */}
        <mesh position={[0, 0, -0.02]} rotation={[0, 0, 0]} receiveShadow>
          <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#CA5C54" roughness={0.7} side={THREE.BackSide} />
        </mesh>
      </group>
      
      {/* Improved fins with better geometry */}
      {/* Top fin */}
      <mesh 
        position={[0, 0.6, 0]} 
        rotation={[0, 0, 0]}
        castShadow 
        receiveShadow
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <primitive object={createFinGeometry(0.4, 0.6, 12)} />
        <meshPhysicalMaterial 
          color={secondaryColor} 
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Side fins */}
      {[0.6, -0.6].map((zPos, i) => (
        <mesh 
          key={`side-fin-${i}`}
          position={[-0.2, -0.1, zPos]} 
          rotation={[0, zPos > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI / 2]}
          castShadow 
          receiveShadow
          ref={(el) => {
            if (el) finRefs.current.push(el);
          }}
        >
          <primitive object={createFinGeometry(0.35, 0.5, 10)} />
          <meshPhysicalMaterial 
            color={secondaryColor} 
            roughness={0.6}
            metalness={0.1}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Improved tail fin */}
      <mesh 
        position={[-0.7, 0, 0]} 
        rotation={[0, 0, Math.PI / 2]}
        castShadow 
        receiveShadow
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <primitive object={tailFinGeometry} />
        <meshPhysicalMaterial 
          color={secondaryColor} 
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Secondary fins - bottom */}
      <mesh 
        position={[-0.3, -0.5, 0]} 
        rotation={[0, 0, -Math.PI / 6]}
        scale={[0.6, 0.6, 0.6]}
        castShadow 
        receiveShadow
      >
        <primitive object={createFinGeometry(0.3, 0.4, 8)} />
        <meshPhysicalMaterial 
          color={secondaryColor} 
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Subtle pattern details on body */}
      {Array.from({ length: 8 }).map((_, i) => {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = 0.79; // Just below the surface
        
        const x = Math.sin(theta) * Math.cos(phi) * radius;
        const y = Math.sin(theta) * Math.sin(phi) * radius;
        const z = Math.cos(theta) * radius;
        
        const size = 0.1 + Math.random() * 0.2;
        
        return (
          <mesh 
            key={`spot-${i}`}
            position={[x, y, z]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[size, size]} />
            <meshStandardMaterial 
              color={secondaryColor}
              roughness={0.7}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}