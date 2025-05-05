'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box, Plane, useTexture, useGLTF, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { EnvironmentZoneRef } from './CoralReefZone';
import Jellyfish from '../models/Jellyfish';
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

// Enhanced materials for deep sea entities
const createLavaMaterial = () => {
  // Dynamic shader for lava flow effect
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      baseColor: { value: new THREE.Color('#E25822') },
      glowColor: { value: new THREE.Color('#FF9800') }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 baseColor;
      uniform vec3 glowColor;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // Simplex 2D noise
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                                dot(x12.zw, x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void main() {
        // Flow animation based on position and time
        float noise1 = snoise(vec2(vUv.x * 3.0 + time * 0.2, vUv.y * 3.0 - time * 0.1));
        float noise2 = snoise(vec2(vUv.x * 5.0 - time * 0.1, vUv.y * 5.0 + time * 0.3));
        
        // Combine noise layers for more detailed flow
        float combinedNoise = (noise1 * 0.6 + noise2 * 0.4) * 0.6 + 0.4;
        
        // Create bright hot spots and darker cooler areas
        float hotspots = smoothstep(0.4, 0.8, combinedNoise);
        
        // Mix base color with glow based on the flow pattern
        vec3 finalColor = mix(baseColor, glowColor, hotspots);
        
        // Add glow effect
        float glow = smoothstep(0.2, 0.7, combinedNoise);
        finalColor += glowColor * glow * 0.6;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    transparent: true
  });
};

// Enhanced bioluminescent effect
const createBioluminescentMaterial = (color = '#5CFFFF', intensity = 1.0) => {
  return new THREE.MeshPhysicalMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    transmission: 0.5,
    thickness: 0.5,
    ior: 1.4,
    transparent: true,
    opacity: 0.7
  });
};

const DeepSeaZone = forwardRef<EnvironmentZoneRef, { active: boolean }>((props, ref) => {
  const { active } = props;
  const { camera } = useThree();
  
  // References for animated elements
  const zoneRef = useRef<THREE.Group>(null);
  const ventRefs = useRef<THREE.Group[]>([]);
  const creatureRefs = useRef<THREE.Group[]>([]);
  const kelprefs = useRef<THREE.Group[]>([]);
  const particleRefs = useRef<THREE.Mesh[]>([]);
  const volumetricLightRefs = useRef<THREE.Mesh[]>([]);
  const coralRefs = useRef<THREE.Group[]>([]);
  const lightSourceRefs = useRef<THREE.PointLight[]>([]);
  
  // Floor reference
  const floorRef = useRef<THREE.Mesh>(null);
  
  // Fog reference
  const fogRef = useRef<THREE.Fog | null>(null);
  
  // Load textures
  const terrainTextures = useTexture({
    map: '/textures/deepseafloor/deepseafloor_diffuse.jpg',
    displacementMap: '/textures/deepseafloor/deepseafloor_displacement.jpg',
    normalMap: '/textures/deepseafloor/deepseafloor_normal.jpg',
    roughnessMap: '/textures/deepseafloor/deepseafloor_roughness.jpg',
    aoMap: '/textures/deepseafloor/deepseafloor_ao.jpg',
  });
  
  // Dynamic materials
  const lavaMaterial = useMemo(() => createLavaMaterial(), []);
  
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
  
  // Create hydrothermal vent with enhanced geometry and effects
  const createVent = (position: [number, number, number], height: number = 3, scale: number = 1) => {
    const baseRadius = 1 * scale;
    const topRadius = 0.5 * scale;
    const ventHeight = height * scale;
    
    return (
      <group 
        position={position}
        ref={(el) => el && ventRefs.current.push(el)}
      >
        {/* Main vent structure with more detailed geometry */}
        <mesh position={[0, ventHeight / 2, 0]}>
          <cylinderGeometry args={[topRadius, baseRadius, ventHeight, 24, 8]} />
          <meshPhysicalMaterial 
            color="#1C2331" 
            roughness={0.9} 
            metalness={0.2}
            clearcoat={0.3}
            clearcoatRoughness={0.8}
            normalScale={new THREE.Vector2(1, 1)}
          />
        </mesh>
        
        {/* Vent crevices and details */}
        <group>
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = baseRadius * 0.8;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            
            return (
              <mesh 
                key={`crevice-${i}`} 
                position={[x, ventHeight * 0.5 + Math.random() * ventHeight * 0.2, z]}
                rotation={[
                  Math.random() * 0.5,
                  angle + Math.PI/2,
                  Math.random() * 0.5
                ]}
              >
                <boxGeometry args={[0.2 * scale, 0.5 * scale, 0.1 * scale]} />
                <meshStandardMaterial color="#0E1621" roughness={1} />
              </mesh>
            );
          })}
        </group>
        
        {/* Glowing lava at vent top */}
        <mesh position={[0, ventHeight + 0.1, 0]}>
          <cylinderGeometry args={[topRadius * 0.6, topRadius, 0.4, 24, 2]} />
          <primitive object={lavaMaterial} />
        </mesh>
        
        {/* Add point light at vent opening for illumination */}
        <pointLight
          position={[0, ventHeight + 0.5, 0]}
          color="#FF6A00"
          intensity={3}
          distance={8 * scale}
          decay={2}
          ref={(el) => el && lightSourceRefs.current.push(el)}
        />
        
        {/* Enhanced particle system for vent emissions */}
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh 
            key={`particle-${i}`}
            position={[
              (Math.random() - 0.5) * 0.4 * scale,
              ventHeight + 0.5 + Math.random() * 2 * scale,
              (Math.random() - 0.5) * 0.4 * scale
            ]}
            ref={(el) => el && particleRefs.current.push(el)}
          >
            <sphereGeometry args={[(0.05 + Math.random() * 0.1) * scale, 8, 8]} />
            <meshPhysicalMaterial 
              color={Math.random() > 0.6 ? "#FF6A00" : "#787878"} 
              emissive={Math.random() > 0.6 ? "#FF6A00" : "#787878"}
              emissiveIntensity={Math.random() > 0.6 ? 1 : 0.2}
              transparent 
              opacity={0.8}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
        ))}
      </group>
    );
  };
  
  // Create deep sea weird creature with improved materials and geometry
  const createDeepSeaCreature = (position: [number, number, number], size: number = 1, type: 'angler' | 'squid' | 'jellies' = 'angler') => {
    if (type === 'angler') {
      return (
        <group
          position={position}
          ref={(el) => el && creatureRefs.current.push(el)}
        >
          {/* Enhanced angler fish body with better geometry */}
          <mesh>
            <sphereGeometry args={[size * 0.5, 24, 16]} />
            <meshPhysicalMaterial 
              color="#121212" 
              roughness={0.7}
              metalness={0.1}
              clearcoat={0.2}
              clearcoatRoughness={0.3}
            />
          </mesh>
          
          {/* Add tail */}
          <mesh position={[-size * 0.6, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <coneGeometry args={[size * 0.3, size * 0.8, 16, 8]} />
            <meshPhysicalMaterial 
              color="#121212" 
              roughness={0.7}
              metalness={0.1}
              clearcoat={0.2}
              clearcoatRoughness={0.3}
            />
          </mesh>
          
          {/* Add fins */}
          <mesh position={[0, size * 0.3, 0]} rotation={[0, 0, Math.PI / 3]}>
            <coneGeometry args={[size * 0.2, size * 0.5, 16, 1, true]} />
            <meshPhysicalMaterial 
              color="#131313" 
              roughness={0.7}
              metalness={0.1}
              clearcoat={0.2}
              clearcoatRoughness={0.3}
            />
          </mesh>
          
          <mesh position={[0, -size * 0.3, 0]} rotation={[0, 0, -Math.PI / 3]}>
            <coneGeometry args={[size * 0.2, size * 0.5, 16, 1, true]} />
            <meshPhysicalMaterial 
              color="#131313" 
              roughness={0.7}
              metalness={0.1}
              clearcoat={0.2}
              clearcoatRoughness={0.3}
            />
          </mesh>
          
          {/* Enhanced angler light with better glow */}
          <mesh position={[size * 0.6, size * 0.3, 0]}>
            <sphereGeometry args={[size * 0.12, 16, 16]} />
            <meshPhysicalMaterial 
              color="#5CFFFF" 
              emissive="#5CFFFF"
              emissiveIntensity={2}
              toneMapped={false}
              roughness={0.2}
              metalness={0.8}
              clearcoat={1}
              clearcoatRoughness={0.1}
              transmission={0.2}
              thickness={2}
              ior={1.5}
            />
          </mesh>
          
          {/* Light source from angler's lure */}
          <pointLight
            position={[size * 0.6, size * 0.3, 0]}
            color="#5CFFFF"
            intensity={1}
            distance={size * 5}
            decay={2}
            ref={(el) => el && lightSourceRefs.current.push(el)}
          />
          
          {/* Enhanced teeth with better shape */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh 
              key={`tooth-${i}`}
              position={[
                size * 0.4,
                -size * 0.2 + Math.sin(i / 10 * Math.PI) * size * 0.2,
                Math.cos(i / 10 * Math.PI) * size * 0.2
              ]}
              rotation={[0, 0, Math.PI / 4 + (Math.random() - 0.5) * 0.2]}
            >
              <coneGeometry args={[size * 0.03, size * 0.2, 8, 1]} />
              <meshPhysicalMaterial 
                color="#FFFFFF" 
                roughness={0.3}
                metalness={0.1}
                clearcoat={0.5}
                clearcoatRoughness={0.2}
              />
            </mesh>
          ))}
          
          {/* Texture details for skin */}
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh
              key={`detail-${i}`}
              position={[
                (Math.random() - 0.7) * size * 0.5,
                (Math.random() - 0.5) * size * 0.5,
                (Math.random() - 0.5) * size * 0.5
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              ]}
              scale={[0.1, 0.1, 0.02].map(v => v * size)}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#0A0A0A" roughness={1} />
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
          {/* Enhanced squid body with better shape */}
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[size * 0.5, size * 1.5, 24, 12, false]} />
            <meshPhysicalMaterial 
              color="#671D6D" 
              emissive="#B026FF"
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.2}
              clearcoat={0.8}
              clearcoatRoughness={0.4}
              transmission={0.15}
              thickness={1}
              ior={1.3}
            />
          </mesh>
          
          {/* Add head dome for better shape */}
          <mesh rotation={[Math.PI, 0, 0]} position={[0, size * 0.7, 0]}>
            <sphereGeometry args={[size * 0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial 
              color="#732178" 
              emissive="#B026FF"
              emissiveIntensity={0.2}
              roughness={0.3}
              metalness={0.2}
              clearcoat={0.8}
              clearcoatRoughness={0.4}
              transmission={0.15}
              thickness={1}
              ior={1.3}
            />
          </mesh>
          
          {/* Improved tentacles with better geometry */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = i / 8 * Math.PI * 2;
            const xPos = Math.sin(angle) * size * 0.4;
            const zPos = Math.cos(angle) * size * 0.4;
            const segmentCount = 5;
            
            return (
              <group 
                key={`tentacle-${i}`} 
                position={[xPos, -size * 0.6, zPos]}
              >
                {/* Create articulated tentacle segments */}
                {Array.from({ length: segmentCount }).map((_, j) => (
                  <mesh
                    key={`segment-${i}-${j}`}
                    position={[0, -size * 0.3 * j, 0]}
                  >
                    <cylinderGeometry 
                      args={[
                        size * 0.05 * (1 - j / segmentCount * 0.7), 
                        size * 0.05 * (1 - (j+1) / segmentCount * 0.7), 
                        size * 0.3, 
                        8
                      ]} 
                    />
                    <meshPhysicalMaterial 
                      color="#521356" 
                      emissive="#B026FF"
                      emissiveIntensity={0.1}
                      roughness={0.4}
                      metalness={0.1}
                      clearcoat={0.6}
                      clearcoatRoughness={0.3}
                      transmission={0.1}
                    />
                  </mesh>
                ))}
              </group>
            );
          })}
          
          {/* Enhanced bioluminescent spots with better glow */}
          {Array.from({ length: 15 }).map((_, i) => (
            <mesh
              key={`spot-${i}`}
              position={[
                (Math.random() - 0.5) * size * 0.7,
                (Math.random() - 0.6) * size * 1.2,
                (Math.random() - 0.5) * size * 0.7
              ]}
            >
              <sphereGeometry args={[size * 0.05 + Math.random() * size * 0.03, 12, 12]} />
              <meshPhysicalMaterial 
                color="#5CFFFF" 
                emissive="#5CFFFF"
                emissiveIntensity={1.5}
                toneMapped={false}
                roughness={0.2}
                metalness={0.3}
                clearcoat={1}
                clearcoatRoughness={0.1}
                transmission={0.4}
                ior={1.5}
              />
            </mesh>
          ))}
          
          {/* Add small point lights for glow effect */}
          {Array.from({ length: 3 }).map((_, i) => (
            <pointLight 
              key={`squid-light-${i}`}
              position={[
                (Math.random() - 0.5) * size * 0.4,
                (Math.random() - 0.6) * size * 0.8,
                (Math.random() - 0.5) * size * 0.4
              ]}
              color="#5CFFFF"
              intensity={0.5}
              distance={size * 4}
              decay={2}
              ref={(el) => el && lightSourceRefs.current.push(el)}
            />
          ))}
        </group>
      );
    } else {
      // Use the custom Jellyfish component for better quality jellies
      return (
        <group
          position={position}
          ref={(el) => el && creatureRefs.current.push(el)}
        >
          <Jellyfish scale={size * 1.5} color="#5DB3FF" />
        </group>
      );
    }
  };
  
  // Create enhanced kelp with more detailed geometry and better materials
  const createKelp = (position: [number, number, number], height: number, segments: number = 8) => {
    const kelpColor = new THREE.Color('#0F4C5C');
    
    return (
      <group 
        position={position}
        ref={(el) => el && kelprefs.current.push(el)}
      >
        {/* Create multiple kelp strands for a more realistic look */}
        {Array.from({ length: 3 }).map((_, strandIndex) => {
          // Randomize each strand's position slightly
          const strandOffset = [
            (Math.random() - 0.5) * 0.5,
            0,
            (Math.random() - 0.5) * 0.5
          ];
          
          return (
            <group key={`strand-${strandIndex}`} position={strandOffset as [number, number, number]}>
              {/* Main kelp stalk segments */}
              {Array.from({ length: segments }).map((_, i) => {
                const segmentHeight = height / segments;
                const yPos = i * segmentHeight;
                // Create curve in the kelp by adjusting x and z based on height
                const xOffset = Math.sin(i * 0.3) * 0.3;
                const zOffset = Math.cos(i * 0.3) * 0.3;
                
                return (
                  <mesh 
                    key={`segment-${strandIndex}-${i}`}
                    position={[xOffset, yPos + segmentHeight/2, zOffset]}
                  >
                    <cylinderGeometry args={[0.1 * (1 - i/segments * 0.3), 0.15 * (1 - i/segments * 0.2), segmentHeight, 8]} />
                    <meshPhysicalMaterial 
                      color={kelpColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.1)} 
                      roughness={0.7}
                      metalness={0.1}
                      clearcoat={0.2}
                      clearcoatRoughness={0.7}
                      emissive="#5CFFFF"
                      emissiveIntensity={0.1}
                      transmission={0.15}
                      thickness={2}
                    />
                  </mesh>
                );
              })}
              
              {/* Add multiple leaves at various heights */}
              {Array.from({ length: 4 }).map((_, i) => {
                const leafHeight = height * (0.5 + i * 0.12);
                const leafRotationY = Math.random() * Math.PI * 2;
                const leafRotationZ = Math.PI / 6 + (Math.random() - 0.5) * 0.2;
                
                return (
                  <mesh 
                    key={`leaf-${strandIndex}-${i}`} 
                    position={[
                      Math.sin(leafHeight * 0.3) * 0.3 + Math.sin(leafRotationY) * 0.3,
                      leafHeight,
                      Math.cos(leafHeight * 0.3) * 0.3 + Math.cos(leafRotationY) * 0.3
                    ]} 
                    rotation={[0, leafRotationY, leafRotationZ]}
                  >
                    <planeGeometry args={[0.8 + Math.random() * 0.4, 1.5 + Math.random() * 0.5, 4, 4]} />
                    <meshPhysicalMaterial 
                      color={kelpColor.clone().offsetHSL(0, 0, 0.05)} 
                      transparent
                      opacity={0.9}
                      side={THREE.DoubleSide}
                      roughness={0.6}
                      metalness={0.1}
                      clearcoat={0.3}
                      clearcoatRoughness={0.5}
                      emissive="#5CFFFF"
                      emissiveIntensity={0.05}
                      transmission={0.2}
                      thickness={1}
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
  
  // Create bioluminescent coral structures
  const createBioluminescentCoral = (position: [number, number, number], scale: number = 1, color: string = '#5CFFFF') => {
    const branchCount = Math.floor(4 + Math.random() * 4);
    
    return (
      <group 
        position={position}
        ref={(el) => el && coralRefs.current.push(el)}
        scale={[scale, scale, scale]}
      >
        {/* Base structure */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 1, 12]} />
          <meshPhysicalMaterial
            color={new THREE.Color(color).offsetHSL(0, -0.2, -0.2).getHexString()}
            emissive={color}
            emissiveIntensity={0.2}
            roughness={0.6}
            metalness={0.1}
            clearcoat={0.4}
            clearcoatRoughness={0.6}
          />
        </mesh>
        
        {/* Branching structures */}
        {Array.from({ length: branchCount }).map((_, i) => {
          const angle = (i / branchCount) * Math.PI * 2;
          const radius = 0.3;
          const branchHeight = 1 + Math.random() * 1.5;
          const branchX = Math.sin(angle) * radius;
          const branchZ = Math.cos(angle) * radius;
          const branchAngle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
          
          return (
            <group 
              key={`branch-${i}`} 
              position={[branchX, 1, branchZ]}
              rotation={[
                Math.sin(angle) * branchAngle,
                0,
                Math.cos(angle) * branchAngle
              ]}
            >
              <mesh position={[0, branchHeight/2, 0]}>
                <cylinderGeometry args={[0.05, 0.15, branchHeight, 8]} />
                <meshPhysicalMaterial
                  color={new THREE.Color(color).offsetHSL(0, -0.1, -0.1).getHexString()}
                  emissive={color}
                  emissiveIntensity={0.3}
                  roughness={0.5}
                  metalness={0.2}
                  clearcoat={0.6}
                  clearcoatRoughness={0.4}
                  transmission={0.1}
                />
              </mesh>
              
              {/* Glowing tips */}
              <mesh position={[0, branchHeight, 0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshPhysicalMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={1}
                  roughness={0.3}
                  metalness={0.4}
                  clearcoat={1}
                  clearcoatRoughness={0.2}
                  transmission={0.3}
                  ior={1.5}
                />
              </mesh>
              
              {/* Add point light for glow */}
              <pointLight
                position={[0, branchHeight, 0]}
                color={color}
                intensity={0.5}
                distance={3}
                decay={2}
                ref={(el) => el && lightSourceRefs.current.push(el)}
              />
            </group>
          );
        })}
      </group>
    );
  };
  
  // Create unique deep sea formations
  const createDeepSeaFormation = (position: [number, number, number], scale: number = 1) => {
    // Random formation type
    const formationType = Math.floor(Math.random() * 3);
    
    switch (formationType) {
      case 0: // Crystalline structures
        return (
          <group position={position} scale={[scale, scale, scale]}>
            {/* Main crystal cluster */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 0.5 + Math.random() * 0.5;
              const height = 1 + Math.random() * 2;
              const xPos = Math.sin(angle) * radius;
              const zPos = Math.cos(angle) * radius;
              
              return (
                <mesh 
                  key={`crystal-${i}`}
                  position={[xPos, height / 2, zPos]}
                  rotation={[
                    (Math.random() - 0.5) * 0.3,
                    Math.random() * Math.PI * 2,
                    (Math.random() - 0.5) * 0.3
                  ]}
                >
                  <coneGeometry args={[0.2 + Math.random() * 0.3, height, 5 + Math.floor(Math.random() * 3), 1]} />
                  <meshPhysicalMaterial
                    color="#8BD8FF"
                    emissive="#8BD8FF"
                    emissiveIntensity={0.2}
                    roughness={0.1}
                    metalness={0.7}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    transmission={0.4}
                    thickness={2}
                    ior={1.8}
                  />
                </mesh>
              );
            })}
            
            {/* Base */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[1.2, 1.5, 0.5, 16]} />
              <meshStandardMaterial color="#1C2331" roughness={0.9} />
            </mesh>
            
            {/* Add point light for glow */}
            <pointLight
              position={[0, 1, 0]}
              color="#8BD8FF"
              intensity={0.7}
              distance={5}
              decay={2}
              ref={(el) => el && lightSourceRefs.current.push(el)}
            />
          </group>
        );
      
      case 1: // Volcanic vents
        return (
          <group position={position} scale={[scale, scale, scale]}>
            {/* Base mound */}
            <mesh position={[0, 0.5, 0]}>
              <coneGeometry args={[1.5, 1, 16, 2]} />
              <meshStandardMaterial color="#1C2331" roughness={0.9} />
            </mesh>
            
            {/* Small vents */}
            {Array.from({ length: 5 }).map((_, i) => {
              const angle = (i / 5) * Math.PI * 2;
              const radius = 0.7;
              const xPos = Math.sin(angle) * radius;
              const zPos = Math.cos(angle) * radius;
              
              return (
                <group key={`vent-${i}`} position={[xPos, 0.9, zPos]}>
                  <mesh>
                    <cylinderGeometry args={[0.1, 0.15, 0.3, 8]} />
                    <meshStandardMaterial color="#0E1621" roughness={1} />
                  </mesh>
                  
                  <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.05, 0.1, 0.1, 8]} />
                    <primitive object={lavaMaterial} />
                  </mesh>
                  
                  {/* Add small light */}
                  <pointLight
                    position={[0, 0.3, 0]}
                    color="#FF6A00"
                    intensity={0.5}
                    distance={2}
                    decay={2}
                    ref={(el) => el && lightSourceRefs.current.push(el)}
                  />
                </group>
              );
            })}
          </group>
        );
      
      case 2: // Strange tube structures
      default:
        return (
          <group position={position} scale={[scale, scale, scale]}>
            {/* Base */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[1.2, 1.5, 0.5, 16]} />
              <meshStandardMaterial color="#1C2331" roughness={0.9} />
            </mesh>
            
            {/* Tube structures */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const radius = 0.1 + Math.random() * 0.9;
              const height = 1 + Math.random() * 3;
              const xPos = Math.sin(angle) * radius;
              const zPos = Math.cos(angle) * radius;
              
              return (
                <mesh 
                  key={`tube-${i}`}
                  position={[xPos, height / 2 + 0.25, zPos]}
                  rotation={[
                    (Math.random() - 0.5) * 0.5,
                    0,
                    (Math.random() - 0.5) * 0.5
                  ]}
                >
                  <cylinderGeometry args={[0.05, 0.05, height, 8]} />
                  <meshPhysicalMaterial
                    color="#FF6B6B"
                    emissive="#FF6B6B"
                    emissiveIntensity={0.3}
                    roughness={0.4}
                    metalness={0.1}
                    clearcoat={0.5}
                    clearcoatRoughness={0.3}
                    transmission={0.2}
                  />
                </mesh>
              );
            })}
            
            {/* Add ambient light */}
            <pointLight
              position={[0, 1.5, 0]}
              color="#FF6B6B"
              intensity={0.5}
              distance={4}
              decay={2}
              ref={(el) => el && lightSourceRefs.current.push(el)}
            />
          </group>
        );
    }
  };
  
  // Create volumetric light ray
  const createVolumetricLightRay = (position: [number, number, number], rotation: [number, number, number], scale: number = 1, color: string = '#206695') => {
    return (
      <mesh 
        position={position}
        rotation={rotation}
        scale={[scale, scale, scale]}
        ref={(el) => el && volumetricLightRefs.current.push(el)}
      >
        <coneGeometry args={[1, 5, 32, 1, true]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    );
  };
  
  // Animation function
  const animateElements = (delta: number) => {
    if (!active) return;
    
    const time = Date.now() * 0.001;
    
    // Update lava material
    if (lavaMaterial && lavaMaterial.uniforms) {
      lavaMaterial.uniforms.time.value = time;
    }
    
    // Animate particles from vents
    particleRefs.current.forEach((particle, i) => {
      // Move particles upward with improved physics
      particle.position.y += (0.2 + Math.random() * 0.2) * delta;
      
      // Add some turbulence based on sine waves
      particle.position.x += (Math.sin(time * 2 + i) * 0.02) * delta;
      particle.position.z += (Math.cos(time * 2 + i * 1.5) * 0.02) * delta;
      
      // Gentle scaling effect
      const pulseFactor = 1 + Math.sin(time * 3 + i) * 0.1;
      particle.scale.set(pulseFactor, pulseFactor, pulseFactor);
      
      // Fade out particles as they rise
      const material = particle.material as THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial;
      if (material.opacity) {
        material.opacity = Math.max(0, material.opacity - 0.01 * delta);
      }
      
      // Reset particle when it rises too high or becomes invisible
      if (particle.position.y > 10 || (material.opacity && material.opacity <= 0)) {
        // Find parent vent
        const ventIndex = Math.floor(i / 30) % ventRefs.current.length;
        const vent = ventRefs.current[ventIndex];
        
        if (vent) {
          // Reset position to just above the vent
          const ventHeight = 3 + ventIndex % 2; // Use the vent's height
          particle.position.set(
            vent.position.x + (Math.random() - 0.5) * 0.3,
            vent.position.y + ventHeight + 0.5 + Math.random() * 0.2,
            vent.position.z + (Math.random() - 0.5) * 0.3
          );
          
          // Reset opacity
          if (material.opacity !== undefined) {
            material.opacity = 0.8;
          }
          
          // Randomize color between lava and smoke
          if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshPhysicalMaterial) {
            const isEmber = Math.random() > 0.5;
            const color = isEmber ? "#FF6A00" : "#787878";
            material.color.set(color);
            if ('emissive' in material && material.emissive) {
              material.emissive.set(color);
              if ('emissiveIntensity' in material) {
                material.emissiveIntensity = isEmber ? 1 : 0.2;
              }
            }
          }
        }
      }
    });
    
    // Animate deep sea creatures with improved behaviors
    creatureRefs.current.forEach((creature, i) => {
      // Base movement pattern - slow, eerie movements
      creature.position.y += Math.sin(time * 0.3 + i) * 0.005;
      
      // Add more natural movement patterns based on creature type
      const creatureType = i % 3; // 0: angler, 1: squid, 2: jellies
      
      if (creatureType === 0) { // Angler fish
        // More natural swimming pattern
        creature.position.x += Math.sin(time * 0.2 + i * 0.5) * 0.015 * delta;
        creature.position.z += Math.cos(time * 0.2 + i) * 0.015 * delta;
        
        // Body tilting to follow movement direction
        creature.rotation.x = Math.sin(time * 0.3 + i) * 0.1;
        creature.rotation.y = Math.sin(time * 0.1 + i) * 0.3 + Math.atan2(
          Math.cos(time * 0.2 + i), 
          Math.sin(time * 0.2 + i * 0.5)
        );
        
        // Occasional quick darting movements
        if (Math.random() < 0.008) {
          creature.position.x += (Math.random() - 0.5) * 0.7;
          creature.position.z += (Math.random() - 0.5) * 0.7;
        }
        
        // Light pulsing with improved timing
        if (creature.children[3]) { // Assuming light is the 4th child
          const lightMesh = creature.children[3] as THREE.Mesh;
          if (lightMesh.material instanceof THREE.MeshPhysicalMaterial) {
            lightMesh.material.emissiveIntensity = 1.5 + Math.sin(time * 4 + i) * 0.5;
          }
        }
        
        // Animate the tail
        if (creature.children[1]) {
          creature.children[1].rotation.y = Math.sin(time * 3 + i) * 0.2;
        }
        
        // Animate the fins
        if (creature.children[2] && creature.children[3]) {
          creature.children[2].rotation.z = Math.PI / 3 + Math.sin(time * 2 + i) * 0.2;
          creature.children[3].rotation.z = -Math.PI / 3 + Math.sin(time * 2 + i + Math.PI) * 0.2;
        }
      } 
      else if (creatureType === 1) { // Squid
        // Pulsing motion for propulsion
        creature.scale.y = 1 + Math.sin(time * 0.8 + i) * 0.1;
        
        // More gradual movement pattern
        const propulsionForce = Math.max(0, Math.sin(time * 0.8 + i)) * 0.03;
        creature.position.x += Math.sin(creature.rotation.y) * propulsionForce * delta;
        creature.position.z += Math.cos(creature.rotation.y) * propulsionForce * delta;
        creature.position.y += Math.sin(time * 0.2 + i) * 0.01;
        
        // Gentle rotation to change direction
        creature.rotation.y += Math.sin(time * 0.2 + i * 0.3) * 0.01 * delta;
        
        // Tentacle animation - move through each tentacle group
        for (let j = 1; j < 9; j++) {
          if (creature.children[j]) {
            // Get the group for this tentacle
            const tentacleGroup = creature.children[j] as THREE.Group;
            
            // Apply wave pattern down each tentacle
            tentacleGroup.children.forEach((segment, k) => {
              const segmentMesh = segment as THREE.Mesh;
              // More dramatic movement for segments further from body
              const waveIntensity = 0.1 + (k / tentacleGroup.children.length) * 0.3;
              const waveSpeed = 2 + k * 0.2; // Faster for segments further from body
              const wavePhase = j * 0.3 + k * 0.2 + i; // Different phase for each segment
              
              segmentMesh.rotation.x = Math.sin(time * waveSpeed + wavePhase) * waveIntensity;
              segmentMesh.rotation.z = Math.cos(time * waveSpeed + wavePhase) * waveIntensity;
            });
          }
        }
        
        // Bioluminescent spots pulsing
        const glowingSpots = creature.children.slice(9);
        glowingSpots.forEach((spot, j) => {
          if (spot instanceof THREE.Mesh && spot.material instanceof THREE.MeshPhysicalMaterial) {
            spot.material.emissiveIntensity = 0.8 + Math.sin(time * 3 + j + i) * 0.5;
          }
        });
      }
      else { // Jellies - handled by Jellyfish component
        // Subtle drift to add to the Jellyfish component's animation
        creature.position.x += Math.sin(time * 0.1 + i) * 0.01 * delta;
        creature.position.z += Math.cos(time * 0.1 + i * 1.2) * 0.01 * delta;
        
        // Gentle rotation
        creature.rotation.y += 0.05 * delta * Math.sin(time * 0.2 + i);
      }
    });
    
    // Animate kelp with improved physics
    kelprefs.current.forEach((kelp, i) => {
      // Animate each strand in the kelp group
      kelp.children.forEach((strand, strandIndex) => {
        // Get segments and leaves
        const segments = strand.children.filter((child, index) => index < 8); // Assume first 8 are segments
        const leaves = strand.children.filter((child, index) => index >= 8); // Assume rest are leaves
        
        // Animate segments with wave propagation
        segments.forEach((segment, j) => {
          // Wave starts at bottom and propagates upward
          const delay = j * 0.1;
          const swayFactor = j / segments.length * 0.3; // More movement at the top
          
          segment.rotation.x = Math.sin(time * 0.5 - delay + i + strandIndex * 0.1) * swayFactor;
          segment.rotation.z = Math.cos(time * 0.5 - delay + i + strandIndex * 0.2) * swayFactor;
        });
        
        // Animate leaves with more dramatic movement
        leaves.forEach((leaf, j) => {
          leaf.rotation.x = Math.sin(time * 0.7 + i + j * 0.2) * 0.2;
          leaf.rotation.z = leaf.rotation.z + Math.sin(time * 0.6 + i + j * 0.3) * 0.01;
        });
      });
    });
    
    // Animate volumetric light rays
    volumetricLightRefs.current.forEach((lightRay, i) => {
      // Subtle movement and intensity changes
      lightRay.material.opacity = 0.12 + Math.sin(time * 0.5 + i * 0.3) * 0.03;
      lightRay.rotation.x += Math.sin(time * 0.1 + i) * 0.001;
      lightRay.rotation.z += Math.cos(time * 0.1 + i) * 0.001;
    });
    
    // Animate bioluminescent coral
    coralRefs.current.forEach((coral, i) => {
      // Gentle pulsing glow
      coral.children.forEach((branch, j) => {
        if (branch instanceof THREE.Mesh && branch.material instanceof THREE.MeshPhysicalMaterial) {
          if (branch.material.emissiveIntensity !== undefined) {
            branch.material.emissiveIntensity = 0.2 + Math.sin(time * 1.2 + i * 0.4 + j * 0.2) * 0.1;
          }
        }
        
        // For group branch structures, animate their tips
        if (branch instanceof THREE.Group) {
          branch.children.forEach((tip, k) => {
            if (tip instanceof THREE.Mesh && tip.material instanceof THREE.MeshPhysicalMaterial) {
              if (tip.material.emissiveIntensity !== undefined) {
                tip.material.emissiveIntensity = 0.8 + Math.sin(time * 1.5 + i * 0.4 + j * 0.3 + k * 0.2) * 0.3;
              }
            }
          });
        }
      });
    });
    
    // Animate point lights
    lightSourceRefs.current.forEach((light, i) => {
      // Subtle intensity variations
      const baseLightIntensity = light.intensity;
      light.intensity = baseLightIntensity * (0.8 + Math.sin(time * 1.5 + i * 0.5) * 0.2);
    });
    
    // Animate floor for terrain variation
    if (floorRef.current && floorRef.current.geometry instanceof THREE.PlaneGeometry) {
      const positions = floorRef.current.geometry.attributes.position.array as Float32Array;
      
      // Create a slower moving wave pattern for the terrain
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        
        // Calculate displacement with multiple frequency components
        const displacement = 
          Math.sin(x * 0.1 + time * 0.05) * Math.cos(z * 0.1 + time * 0.05) * 0.5 +
          Math.sin(x * 0.2 + z * 0.3 + time * 0.02) * 0.3 +
          Math.sin(x * 0.05 - z * 0.05 + time * 0.01) * 0.7;
        
        positions[i + 1] = displacement;
      }
      
      floorRef.current.geometry.attributes.position.needsUpdate = true;
      floorRef.current.geometry.computeVertexNormals();
    }
  };
  
  // Reset refs when component unmounts
  useEffect(() => {
    return () => {
      ventRefs.current = [];
      creatureRefs.current = [];
      kelprefs.current = [];
      particleRefs.current = [];
      volumetricLightRefs.current = [];
      coralRefs.current = [];
      lightSourceRefs.current = [];
    };
  }, []);
  
  // Underwater fog effect that follows the camera
  useFrame(() => {
    if (active && camera) {
      // Update fog density based on camera depth
      // This simulates water getting darker as you go deeper
      const depth = Math.abs(camera.position.y);
      // Create underwater fog that follows the player
      if (!fogRef.current) {
        fogRef.current = scene.fog as THREE.Fog;
      }
      
      if (fogRef.current) {
        fogRef.current.near = 15 - depth * 0.5; // Reduce visibility with depth
        fogRef.current.far = 100 - depth * 2; // Reduce far plane with depth
      }
    }
  });
  
  return (
    <group ref={zoneRef} visible={active}>
      {/* Enhanced deep sea floor with detailed terrain */}
      <Plane 
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -5, 0]} 
        args={[100, 100, 32, 32]}
        receiveShadow
      >
        <meshPhysicalMaterial 
          color="#101820"
          roughness={0.9}
          metalness={0.1}
          clearcoat={0.1}
          clearcoatRoughness={0.8}
          {...terrainTextures}
          displacementScale={1}
          displacementBias={-0.2}
        />
      </Plane>
      
      {/* Environment elements */}
      {/* Enhanced hydrothermal vents */}
      {createVent([-10, -5, -15], 3, 1.2)}
      {createVent([5, -5, -20], 4, 1.5)}
      {createVent([-8, -5, -30], 2.5, 1)}
      {createVent([15, -5, -25], 3.5, 1.3)}
      {createVent([-12, -5, -40], 3, 1.1)}
      
      {/* Enhanced deep sea creatures */}
      {/* Angler fish */}
      {createDeepSeaCreature([-5, 2, -10], 1, 'angler')}
      {createDeepSeaCreature([8, 5, -15], 1.5, 'angler')}
      {createDeepSeaCreature([3, 7, -25], 1.2, 'angler')}
      {createDeepSeaCreature([-15, 3, -35], 1.3, 'angler')}
      
      {/* Glowing squid */}
      {createDeepSeaCreature([-12, 6, -20], 1.2, 'squid')}
      {createDeepSeaCreature([10, 3, -30], 1.5, 'squid')}
      {createDeepSeaCreature([0, 10, -35], 1, 'squid')}
      {createDeepSeaCreature([15, 8, -45], 1.4, 'squid')}
      
      {/* Bioluminescent jellies */}
      {createDeepSeaCreature([-3, 8, -12], 1.5, 'jellies')}
      {createDeepSeaCreature([6, 4, -18], 1.8, 'jellies')}
      {createDeepSeaCreature([-7, 12, -25], 2, 'jellies')}
      {createDeepSeaCreature([12, 7, -40], 1.6, 'jellies')}
      {createDeepSeaCreature([0, 5, -30], 1.2, 'jellies')}
      {createDeepSeaCreature([-10, 9, -38], 1.7, 'jellies')}
      {createDeepSeaCreature([8, 11, -22], 1.4, 'jellies')}
      
      {/* Enhanced kelp forests */}
      {createKelp([-12, -5, -5], 8, 12)}
      {createKelp([-10, -5, -8], 6, 10)}
      {createKelp([-14, -5, -7], 7, 11)}
      {createKelp([18, -5, -10], 9, 14)}
      {createKelp([16, -5, -12], 7, 12)}
      {createKelp([20, -5, -15], 8, 13)}
      {createKelp([-15, -5, -18], 9, 15)}
      {createKelp([22, -5, -20], 8, 12)}
      
      {/* Bioluminescent coral structures */}
      {createBioluminescentCoral([-18, -5, -22], 1.5, '#5CFFFF')}
      {createBioluminescentCoral([14, -5, -18], 1.2, '#8BD8FF')}
      {createBioluminescentCoral([-5, -5, -25], 1.8, '#B026FF')}
      {createBioluminescentCoral([8, -5, -28], 1.3, '#50FA7B')}
      {createBioluminescentCoral([-12, -5, -35], 1.7, '#FF6B6B')}
      {createBioluminescentCoral([18, -5, -30], 1.5, '#FFD54F')}
      
      {/* Unique deep sea formations */}
      {createDeepSeaFormation([-20, -5, -40], 2)}
      {createDeepSeaFormation([15, -5, -45], 1.8)}
      {createDeepSeaFormation([0, -5, -60], 2.5)}
      {createDeepSeaFormation([-25, -5, -20], 1.5)}
      {createDeepSeaFormation([25, -5, -35], 2.2)}
      
      {/* Volumetric light rays */}
      {createVolumetricLightRay([-5, 15, -20], [Math.PI, 0, 0], 8, '#206695')}
      {createVolumetricLightRay([10, 18, -25], [Math.PI, 0.2, 0], 10, '#143a52')}
      {createVolumetricLightRay([-12, 20, -35], [Math.PI, -0.3, 0.1], 12, '#175073')}
      {createVolumetricLightRay([15, 17, -15], [Math.PI, 0.4, -0.1], 9, '#0c2738')}
      {createVolumetricLightRay([0, 25, -40], [Math.PI, 0, 0], 15, '#1a3f59')}
      
      {/* Large rock formations */}
      <mesh position={[-15, -3, -20]} rotation={[0.2, 0.5, 0.1]}>
        <dodecahedronGeometry args={[5, 2]} />
        <meshPhysicalMaterial 
          color="#1C2331" 
          roughness={0.9}
          metalness={0.1}
          clearcoat={0.1}
          clearcoatRoughness={0.9}
        />
      </mesh>
      
      <mesh position={[20, -2, -25]} rotation={[-0.1, -0.3, 0.2]}>
        <dodecahedronGeometry args={[6, 2]} />
        <meshPhysicalMaterial 
          color="#1C2331" 
          roughness={0.85}
          metalness={0.2}
          clearcoat={0.2}
          clearcoatRoughness={0.8}
        />
      </mesh>
      
      <mesh position={[0, -4, -35]} rotation={[0.3, 0, -0.1]}>
        <dodecahedronGeometry args={[8, 2]} />
        <meshPhysicalMaterial 
          color="#1C2331" 
          roughness={0.9}
          metalness={0.1}
          clearcoat={0.1}
          clearcoatRoughness={0.9}
        />
      </mesh>
      
      {/* Enhanced ambient particles */}
      {Array.from({ length: 120 }).map((_, i) => (
        <mesh
          key={`ambient_${i}`}
          position={[
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 30 + 5,
            (Math.random() - 0.5) * 80 - 20
          ]}
        >
          <sphereGeometry args={[0.03 + Math.random() * 0.06, 8, 8]} />
          <meshPhysicalMaterial 
            color={
              Math.random() < 0.25 ? "#5CFFFF" : 
              Math.random() < 0.5 ? "#B026FF" : 
              Math.random() < 0.75 ? "#8BD8FF" : "#50FA7B"
            } 
            emissive={
              Math.random() < 0.25 ? "#5CFFFF" : 
              Math.random() < 0.5 ? "#B026FF" : 
              Math.random() < 0.75 ? "#8BD8FF" : "#50FA7B"
            }
            emissiveIntensity={0.5}
            transparent 
            opacity={0.7}
            roughness={0.3}
            metalness={0.3}
            transmission={0.2}
          />
        </mesh>
      ))}
      
      {/* Underwater fog/haze for atmospheric depth */}
      <fog 
        attach="fog" 
        args={[
          '#041e31',
          15, // near
          80  // far
        ]} 
      />
      
      {/* Zone transition effects */}
      <mesh position={[0, 0, 10]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[100, 50]} />
        <meshBasicMaterial 
          color="#0a4d7a" 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={[0, 0, -80]}>
        <planeGeometry args={[150, 100]} />
        <meshBasicMaterial 
          color="#020C18" 
          transparent 
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Add a global ambient light for minimum visibility */}
      <ambientLight color="#143652" intensity={0.2} />
      
      {/* Directional light from above for subtle illumination */}
      <directionalLight 
        position={[0, 50, -20]} 
        intensity={0.3} 
        color="#203d5e" 
      />
    </group>
  );
});

DeepSeaZone.displayName = 'DeepSeaZone';
export default DeepSeaZone;