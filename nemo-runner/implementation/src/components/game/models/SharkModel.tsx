'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SharkModelProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  aggressive?: boolean;
}

// Advanced realistic shark model with detailed geometry and animations
export default function SharkModel({ 
  scale = 1, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  color = '#4B6D82',
  aggressive = false 
}: SharkModelProps) {
  const group = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const finRefs = useRef<THREE.Mesh[]>([]);
  const jawRef = useRef<THREE.Mesh>(null);
  const eyeRefs = useRef<THREE.Mesh[]>([]);
  
  // Time offset for animation variation
  const timeOffset = useMemo(() => Math.random() * 100, []);
  const lastChomp = useRef<number>(0);
  const lastBlink = useRef<number>(0);
  const blinkDuration = 0.15; // seconds
  
  // Initialize ref arrays
  useEffect(() => {
    finRefs.current = [];
    eyeRefs.current = [];
  }, []);
  
  // Custom colors based on main color
  const darkSharkColor = useMemo(() => {
    const color3 = new THREE.Color(color);
    color3.multiplyScalar(0.8);
    return color3.getHex();
  }, [color]);
  
  const lightSharkColor = useMemo(() => {
    const color3 = new THREE.Color(color);
    color3.multiplyScalar(1.1);
    return color3.getHex();
  }, [color]);
  
  const bellyColor = useMemo(() => {
    return '#E0E0E0'; // Light color for shark belly
  }, []);
  
  // Custom geometry for more realistic shark body
  const sharkBodyGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const bodyLength = 4;
    const bodyRadius = 1;
    const segments = 32;
    const ringSections = 16;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create vertices for shark body
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = bodyLength * (0.5 - t); // Place head at positive z
      
      // Taper the body - wider in middle, narrower at tail
      const radius = bodyRadius * (1 - 0.6 * Math.pow(t - 0.4, 2));
      
      // Flatten the body vertically slightly for a more realistic shark shape
      const verticalScale = 0.8;
      
      for (let j = 0; j <= ringSections; j++) {
        const theta = (j / ringSections) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius * verticalScale;
        
        // Add vertex
        vertices.push(x, y, z);
        
        // Add UV coordinates
        uvs.push(t, j / ringSections);
      }
    }
    
    // Create faces
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < ringSections; j++) {
        const a = i * (ringSections + 1) + j;
        const b = i * (ringSections + 1) + j + 1;
        const c = (i + 1) * (ringSections + 1) + j;
        const d = (i + 1) * (ringSections + 1) + j + 1;
        
        // Two triangles per quad
        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    return geometry;
  }, []);
  
  // Custom fin geometry for more realistic fins
  const createFinGeometry = (width = 1, height = 1, tipSharpness = 0.8) => {
    const geometry = new THREE.BufferGeometry();
    const segments = 8;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Center point at fin base
    vertices.push(0, 0, 0);
    uvs.push(0.5, 0);
    
    // Create curved fin shape
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI;
      
      // Create a curved fin shape that tapers to a point
      const x = Math.sin(angle) * width * (1 - t * tipSharpness);
      const y = Math.cos(angle) * height * t;
      
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
  
  // Custom tail fin geometry
  const tailFinGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create a more realistic tail fin with asymmetric lobes
    const topLobe = 1.8; // Height of top lobe
    const bottomLobe = 1.4; // Height of bottom lobe
    const width = 1.5;
    const segments = 12;
    
    // Center point
    vertices.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    const centerIndex = 0;
    
    // Top lobe points
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI;
      
      // Shape the top lobe with a curve
      const x = Math.sin(angle) * width * (0.5 - 0.5 * t);
      const y = Math.cos(angle) * topLobe * t;
      
      vertices.push(x, y, 0);
      uvs.push(t, 1);
      
      // Connect to center except for the first point
      if (i > 0) {
        indices.push(centerIndex, i, i + 1);
      }
    }
    
    // Bottom lobe points
    const bottomStart = vertices.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI;
      
      // Shape the bottom lobe with a curve
      const x = Math.sin(angle) * width * (0.5 - 0.4 * t);
      const y = -Math.cos(angle) * bottomLobe * t;
      
      vertices.push(x, y, 0);
      uvs.push(t, 0);
      
      // Connect to center except for the first point
      if (i > 0) {
        indices.push(centerIndex, bottomStart + i, bottomStart + i + 1);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    return geometry;
  }, []);
  
  // Enhanced shark animation with more natural swimming motion
  useFrame((_, delta) => {
    if (!group.current) return;
    
    const time = Date.now() * 0.001 + timeOffset;
    
    // Overall swimming motion - gentle undulation
    const swimSpeed = aggressive ? 1.5 : 1.0;
    const swimIntensity = aggressive ? 1.2 : 1.0;
    
    // Body undulation and roll
    if (bodyRef.current) {
      // Subtle side-to-side motion
      bodyRef.current.rotation.y = Math.sin(time * 0.4 * swimSpeed) * 0.05 * swimIntensity;
      bodyRef.current.rotation.z = Math.sin(time * 0.5 * swimSpeed) * 0.08 * swimIntensity;
      
      // Slight up-down motion
      bodyRef.current.position.y = Math.sin(time * 0.3 * swimSpeed) * 0.1 * swimIntensity;
    }
    
    // Tail swinging - more pronounced and natural
    if (tailRef.current) {
      // Main side-to-side motion
      tailRef.current.rotation.y = Math.sin(time * 2 * swimSpeed) * 0.25 * swimIntensity;
      
      // Add slight up-down component
      tailRef.current.rotation.x = Math.sin(time * 1.8 * swimSpeed) * 0.08 * swimIntensity;
    }
    
    // Fin movement - more dynamic
    finRefs.current.forEach((fin, i) => {
      if (!fin) return;
      
      const finSpeed = 0.8 * swimSpeed;
      const baseFinAmount = 0.15 * swimIntensity;
      const finPhase = i * 0.5; // Different phase for each fin
      
      // Primary motion
      const primaryAxis = i < 2 ? 'z' : 'x'; // Different axis based on fin type
      fin.rotation[primaryAxis] = Math.sin(time * finSpeed + finPhase) * baseFinAmount;
      
      // Secondary subtle motion
      const secondaryAxis = i < 2 ? 'x' : 'z';
      fin.rotation[secondaryAxis] = Math.sin(time * finSpeed * 0.7 + finPhase + 1) * baseFinAmount * 0.3;
    });
    
    // Jaw movement - occasional chomping behavior
    if (jawRef.current) {
      if (aggressive) {
        // More frequent chomping when aggressive
        const chompFrequency = 1.2;
        const chompCycle = Math.sin(time * chompFrequency) * 0.5 + 0.5; // 0-1 value
        const chompThreshold = 0.7; // Lower threshold = more chomping
        
        if (chompCycle > chompThreshold) {
          const openAmount = (chompCycle - chompThreshold) / (1 - chompThreshold) * 0.4;
          jawRef.current.rotation.x = openAmount;
          lastChomp.current = time;
        } else {
          // Gradually close jaw
          const timeSinceChomp = time - lastChomp.current;
          if (timeSinceChomp < 0.2) {
            jawRef.current.rotation.x = Math.max(0, 0.4 - timeSinceChomp * 2);
          } else {
            jawRef.current.rotation.x = 0;
          }
        }
      } else {
        // Occasional chomping when not aggressive
        const chompFrequency = 0.3;
        const chompCycle = Math.sin(time * chompFrequency) * 0.5 + 0.5;
        const chompThreshold = 0.85;
        
        if (chompCycle > chompThreshold) {
          const openAmount = (chompCycle - chompThreshold) / (1 - chompThreshold) * 0.25;
          jawRef.current.rotation.x = openAmount;
          lastChomp.current = time;
        } else {
          // Ensure jaw closes smoothly
          const timeSinceChomp = time - lastChomp.current;
          if (timeSinceChomp < 0.2) {
            jawRef.current.rotation.x = Math.max(0, 0.25 - timeSinceChomp * 1.25);
          } else {
            jawRef.current.rotation.x = 0;
          }
        }
      }
    }
    
    // Eye blinking
    eyeRefs.current.forEach((eye) => {
      if (!eye) return;
      
      // Occasional blinking
      const shouldBlink = Math.random() < 0.002; // Random chance to initiate blink
      if (shouldBlink && time - lastBlink.current > 1) {
        lastBlink.current = time;
      }
      
      // Blink animation
      const timeSinceBlink = time - lastBlink.current;
      if (timeSinceBlink < blinkDuration) {
        // Scale the eye vertically during blink
        const blinkProgress = timeSinceBlink / blinkDuration;
        const blinkCurve = Math.sin(blinkProgress * Math.PI);
        eye.scale.y = 1 - blinkCurve * 0.9;
      } else {
        eye.scale.y = 1;
      }
    });
  });
  
  return (
    <group ref={group} scale={scale} position={position} rotation={rotation}>
      {/* Main body - anatomically shaped */}
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow receiveShadow>
        <primitive object={sharkBodyGeometry} />
        <meshPhysicalMaterial 
          color={color}
          roughness={0.7}
          metalness={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          vertexColors={false}
        />
      </mesh>
      
      {/* Shark belly - lighter color */}
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <planeGeometry args={[1.6, 3.5]} />
        <meshPhysicalMaterial 
          color={bellyColor}
          roughness={0.6}
          metalness={0.1}
          clearcoat={0.2}
          clearcoatRoughness={0.3}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Head shape - more anatomical */}
      <group position={[0, 0, 2]}>
        {/* Upper head */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 32]} scale={[1, 0.8, 1.2]} />
          <meshPhysicalMaterial 
            color={color}
            roughness={0.7}
            metalness={0.1}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
          />
        </mesh>
        
        {/* Snout */}
        <mesh position={[0, -0.1, 0.8]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.9, 32, 32]} scale={[1, 0.67, 0.89]} />
          <meshPhysicalMaterial 
            color={darkSharkColor}
            roughness={0.8}
            metalness={0.1}
            clearcoat={0.2}
            clearcoatRoughness={0.5}
          />
        </mesh>
        
        {/* Jaw structure */}
        <group position={[0, -0.4, 0.9]}>
          {/* Lower jaw */}
          <mesh ref={jawRef} position={[0, -0.1, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.85, 32, 32]} scale={[1, 0.35, 0.82]} />
            <meshPhysicalMaterial 
              color={darkSharkColor}
              roughness={0.8}
              metalness={0.1}
            />
            
            {/* Lower teeth - more rows and realistic placement */}
            {Array.from({ length: 12 }).map((_, i) => (
              <mesh 
                key={`lower-teeth-front-${i}`} 
                position={[
                  (-0.6 + (i / 11) * 1.2), 
                  0.25, 
                  0.3
                ]}
                rotation={[0.2, 0, 0]}
              >
                <coneGeometry args={[0.04, 0.15, 8]} />
                <meshPhysicalMaterial color="#F8F8F8" roughness={0.3} clearcoat={0.5} />
              </mesh>
            ))}
            
            {/* Second row of teeth */}
            {Array.from({ length: 10 }).map((_, i) => (
              <mesh 
                key={`lower-teeth-back-${i}`} 
                position={[
                  (-0.5 + (i / 9) * 1.0), 
                  0.2, 
                  0.2
                ]}
                rotation={[0.3, 0, 0]}
                scale={0.8}
              >
                <coneGeometry args={[0.04, 0.12, 8]} />
                <meshPhysicalMaterial color="#F8F8F8" roughness={0.3} clearcoat={0.5} />
              </mesh>
            ))}
          </mesh>
        </group>
        
        {/* Upper jaw */}
        <group position={[0, -0.15, 0.95]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.85, 32, 32]} scale={[1, 0.29, 0.82]} />
            <meshPhysicalMaterial 
              color={darkSharkColor}
              roughness={0.8}
              metalness={0.1}
            />
            
            {/* Upper teeth - more rows and realistic placement */}
            {Array.from({ length: 12 }).map((_, i) => (
              <mesh 
                key={`upper-teeth-front-${i}`} 
                position={[
                  (-0.6 + (i / 11) * 1.2), 
                  -0.2, 
                  0.3
                ]}
                rotation={[-0.2, 0, 0]}
              >
                <coneGeometry args={[0.04, 0.15, 8]} />
                <meshPhysicalMaterial color="#F8F8F8" roughness={0.3} clearcoat={0.5} />
              </mesh>
            ))}
            
            {/* Second row of teeth */}
            {Array.from({ length: 10 }).map((_, i) => (
              <mesh 
                key={`upper-teeth-back-${i}`} 
                position={[
                  (-0.5 + (i / 9) * 1.0), 
                  -0.15, 
                  0.2
                ]}
                rotation={[-0.3, 0, 0]}
                scale={0.8}
              >
                <coneGeometry args={[0.04, 0.12, 8]} />
                <meshPhysicalMaterial color="#F8F8F8" roughness={0.3} clearcoat={0.5} />
              </mesh>
            ))}
          </mesh>
        </group>
        
        {/* Realistic eyes */}
        {[0.65, -0.65].map((zPos, i) => (
          <group key={`eye-group-${i}`} position={[0.6, 0.2, zPos]} rotation={[0, zPos > 0 ? -0.5 : 0.5, 0]}>
            {/* Eye socket */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={darkSharkColor} roughness={0.9} />
            </mesh>
            
            {/* Eyeball */}
            <mesh 
              position={[0.05, 0, 0]} 
              castShadow 
              receiveShadow
              ref={(el) => {
                if (el) eyeRefs.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
              
              {/* Pupil */}
              <mesh position={[0.15, 0, 0]}>
                <sphereGeometry args={[0.1, 16, 16]} />
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
        
        {/* Nostril */}
        {[-0.3, 0.3].map((zPos, i) => (
          <mesh key={`nostril-${i}`} position={[0.7, -0.1, zPos]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        ))}
      </group>
      
      {/* Improved tail section */}
      <group position={[-2.5, 0, 0]} ref={tailRef}>
        {/* Tail base */}
        <mesh position={[0.5, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.8, 1, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshPhysicalMaterial 
            color={color}
            roughness={0.7}
            metalness={0.1}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
          />
        </mesh>
        
        {/* Improved tail fin with better geometry */}
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <primitive object={tailFinGeometry} />
          <meshPhysicalMaterial 
            color={darkSharkColor}
            roughness={0.7}
            metalness={0.1}
            clearcoat={0.2}
            clearcoatRoughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* Improved dorsal fin */}
      <mesh 
        position={[0, 1.2, 0]} 
        rotation={[0, 0, 0.1]}
        castShadow 
        receiveShadow
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <primitive object={createFinGeometry(0.6, 1.5, 0.9)} />
        <meshPhysicalMaterial 
          color={darkSharkColor}
          roughness={0.7}
          metalness={0.1}
          clearcoat={0.2}
          clearcoatRoughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Secondary dorsal fin */}
      <mesh 
        position={[-1.5, 0.8, 0]} 
        rotation={[0, 0, 0.05]}
        scale={[0.5, 0.5, 0.5]}
        castShadow 
        receiveShadow
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <primitive object={createFinGeometry(0.6, 1.2, 0.8)} />
        <meshPhysicalMaterial 
          color={darkSharkColor}
          roughness={0.7}
          metalness={0.1}
          clearcoat={0.2}
          clearcoatRoughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Improved pectoral fins */}
      {[1, -1].map((side, i) => (
        <mesh 
          key={`pectoral-${i}`}
          position={[0.5, -0.2, side * 1]}
          rotation={[0, side * Math.PI / 6, side * Math.PI / 2 - side * 0.2]}
          castShadow 
          receiveShadow
          ref={(el) => {
            if (el) finRefs.current.push(el);
          }}
        >
          <primitive object={createFinGeometry(1.5, 0.9, 0.7)} />
          <meshPhysicalMaterial 
            color={darkSharkColor}
            roughness={0.7}
            metalness={0.1}
            clearcoat={0.2}
            clearcoatRoughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Pelvic fins */}
      {[1, -1].map((side, i) => (
        <mesh 
          key={`pelvic-${i}`}
          position={[-0.8, -0.7, side * 0.4]}
          rotation={[0, side * Math.PI / 8, side * Math.PI / 2 - side * 0.4]}
          scale={[0.6, 0.6, 0.6]}
          castShadow 
          receiveShadow
          ref={(el) => {
            if (el) finRefs.current.push(el);
          }}
        >
          <primitive object={createFinGeometry(1.2, 0.8, 0.7)} />
          <meshPhysicalMaterial 
            color={darkSharkColor}
            roughness={0.7}
            metalness={0.1}
            clearcoat={0.2}
            clearcoatRoughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Anal fin */}
      <mesh 
        position={[-1.5, -0.7, 0]} 
        rotation={[0, 0, -0.1]}
        scale={[0.5, 0.5, 0.5]}
        castShadow 
        receiveShadow
        ref={(el) => {
          if (el) finRefs.current.push(el);
        }}
      >
        <primitive object={createFinGeometry(0.6, 1, 0.8)} />
        <meshPhysicalMaterial 
          color={darkSharkColor}
          roughness={0.7}
          metalness={0.1}
          clearcoat={0.2}
          clearcoatRoughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* More realistic gill slits */}
      {[0.65, -0.65].map((side, i) => (
        <group key={`gills-${i}`} position={[0, 0, side]}>
          {Array.from({ length: 5 }).map((_, j) => {
            const posX = 0.6 - j * 0.12;
            return (
              <mesh 
                key={`gill-${i}-${j}`} 
                position={[posX, 0, 0]} 
                rotation={[0, 0, Math.PI / 2]}
                castShadow
                receiveShadow
              >
                <capsuleGeometry args={[0.01, 0.5, 4, 8]} />
                <meshStandardMaterial color="#2D4554" />
                
                {/* Gill slit depth */}
                <mesh position={[0, 0, -0.02]} rotation={[0, 0, 0]}>
                  <capsuleGeometry args={[0.005, 0.48, 4, 8]} />
                  <meshStandardMaterial color="#1A2A34" />
                </mesh>
              </mesh>
            );
          })}
        </group>
      ))}
      
      {/* Subtle skin texture - small marks and scars */}
      {Array.from({ length: 15 }).map((_, i) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 0.95;
        
        const x = Math.sin(phi) * Math.cos(theta) * radius;
        const y = Math.sin(phi) * Math.sin(theta) * radius;
        const z = Math.cos(phi) * radius;
        
        const length = 0.1 + Math.random() * 0.3;
        const width = 0.02 + Math.random() * 0.03;
        
        return (
          <mesh 
            key={`scar-${i}`} 
            position={[z * 2, x, y]}
            rotation={[Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[length, width]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? lightSharkColor : darkSharkColor}
              roughness={0.8}
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}