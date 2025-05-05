'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Types of coral for variation
const CORAL_TYPES = {
  BRANCHING: 'branching',
  TABLE: 'table',
  BRAIN: 'brain',
  STAGHORN: 'staghorn',
  ELKHORN: 'elkhorn',
  SOFT: 'soft',
  MUSHROOM: 'mushroom'
};

// Colors for coral diversity
const CORAL_COLORS = [
  '#FF5A5F', // Pink
  '#FF8A5E', // Orange-pink
  '#FFC154', // Yellow
  '#8BE9FD', // Light blue
  '#BD93F9', // Purple
  '#50FA7B', // Green
  '#FFB6C1', // Light pink
  '#FF6B6B', // Red
  '#FFA07A'  // Light salmon
];

interface CoralProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  type?: string;
  color?: string;
  swayFactor?: number;
  variant?: number;
}

export default function Coral({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1, 
  type = CORAL_TYPES.BRANCHING,
  color,
  swayFactor = 1,
  variant = 0
}: CoralProps) {
  const groupRef = useRef<THREE.Group>(null);
  const branchesRef = useRef<THREE.Mesh[]>([]);
  
  // Randomly select color if not provided
  const coralColor = color || CORAL_COLORS[Math.floor(Math.random() * CORAL_COLORS.length)];
  
  // Animation time reference
  const timeRef = useRef(Math.random() * 100);
  
  // Random values for variation
  const randomValues = useRef<number[]>(Array(20).fill(0).map(() => Math.random()));
  const swayFactors = useRef<number[]>(Array(20).fill(0).map(() => 0.5 + Math.random()));
  
  // Initialize branches array
  useEffect(() => {
    branchesRef.current = [];
  }, []);
  
  // Animation for gentle swaying motion
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    if (!groupRef.current) return;
    
    // Only animate soft and branching corals
    if (type === CORAL_TYPES.SOFT || type === CORAL_TYPES.BRANCHING || type === CORAL_TYPES.STAGHORN) {
      branchesRef.current.forEach((branch, i) => {
        if (!branch) return;
        
        const frequency = 0.5 + swayFactors.current[i % swayFactors.current.length] * 0.5;
        const amplitude = 0.02 * swayFactor * swayFactors.current[i % swayFactors.current.length];
        
        // Primary sway motion
        branch.rotation.x = Math.sin(timeRef.current * frequency) * amplitude;
        branch.rotation.z = Math.cos(timeRef.current * frequency * 1.3) * amplitude;
        
        // Slight scale pulsing for soft corals
        if (type === CORAL_TYPES.SOFT) {
          const pulseFactor = 1 + Math.sin(timeRef.current * 0.8 + i * 0.2) * 0.03;
          branch.scale.set(pulseFactor, pulseFactor, pulseFactor);
        }
      });
    }
  });
  
  // Generate geometry based on coral type
  const renderCoral = () => {
    switch(type) {
      case CORAL_TYPES.BRANCHING:
        return renderBranchingCoral();
      case CORAL_TYPES.TABLE:
        return renderTableCoral();
      case CORAL_TYPES.BRAIN:
        return renderBrainCoral();
      case CORAL_TYPES.STAGHORN:
        return renderStaghornCoral();
      case CORAL_TYPES.ELKHORN:
        return renderElkhornCoral();
      case CORAL_TYPES.SOFT:
        return renderSoftCoral();
      case CORAL_TYPES.MUSHROOM:
        return renderMushroomCoral();
      default:
        return renderBranchingCoral();
    }
  };
  
  // Branching coral model
  const renderBranchingCoral = () => {
    const branches = [];
    const branchCount = 4 + Math.floor(randomValues.current[0] * 6);
    
    for (let i = 0; i < branchCount; i++) {
      const height = 0.5 + randomValues.current[i % randomValues.current.length] * 1.5;
      const thickness = 0.05 + randomValues.current[i % randomValues.current.length] * 0.1;
      const angle = Math.PI * 2 * (i / branchCount);
      const radius = 0.2 + randomValues.current[i % randomValues.current.length] * 0.3;
      
      // Position each branch in a circular pattern
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const branchRotation = [
        -0.2 + randomValues.current[i % randomValues.current.length] * 0.4,
        angle,
        -0.2 + randomValues.current[i % randomValues.current.length] * 0.4
      ];
      
      // Main branch
      branches.push(
        <mesh
          key={`branch-${i}`}
          position={[x, height / 2, z]}
          rotation={branchRotation as [number, number, number]}
          castShadow
          receiveShadow
          ref={(el) => {
            if (el) branchesRef.current[i] = el;
          }}
        >
          <cylinderGeometry args={[thickness * 0.5, thickness, height, 8]} />
          <meshPhysicalMaterial
            color={coralColor}
            roughness={0.7}
            metalness={0.1}
            emissive={coralColor}
            emissiveIntensity={0.1}
            clearcoat={0.5}
            clearcoatRoughness={0.2}
          />
        </mesh>
      );
      
      // Sub branches for more complexity
      const subBranchCount = 2 + Math.floor(randomValues.current[i % randomValues.current.length] * 4);
      for (let j = 0; j < subBranchCount; j++) {
        const subHeight = height * (0.3 + randomValues.current[(i + j) % randomValues.current.length] * 0.4);
        const subThickness = thickness * (0.5 + randomValues.current[(i + j) % randomValues.current.length] * 0.2);
        const heightOffset = height * (0.3 + randomValues.current[(i + j) % randomValues.current.length] * 0.7);
        const subAngle = Math.PI * 2 * (j / subBranchCount);
        
        // Calculate sub-branch position relative to main branch
        const subX = x + Math.cos(subAngle) * thickness * 2;
        const subZ = z + Math.sin(subAngle) * thickness * 2;
        const subRotation = [
          branchRotation[0] + (randomValues.current[(i + j) % randomValues.current.length] - 0.5) * 0.7,
          branchRotation[1] + (randomValues.current[(i + j) % randomValues.current.length] - 0.5) * 0.7,
          branchRotation[2] + (randomValues.current[(i + j) % randomValues.current.length] - 0.5) * 0.7
        ];
        
        branches.push(
          <mesh
            key={`subbranch-${i}-${j}`}
            position={[subX, heightOffset, subZ]}
            rotation={subRotation as [number, number, number]}
            castShadow
            receiveShadow
            ref={(el) => {
              if (el) branchesRef.current.push(el);
            }}
          >
            <cylinderGeometry args={[subThickness * 0.3, subThickness, subHeight, 8]} />
            <meshPhysicalMaterial
              color={coralColor}
              roughness={0.7}
              metalness={0.1}
              emissive={coralColor}
              emissiveIntensity={0.1}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
            />
          </mesh>
        );
      }
    }
    
    // Base of the coral
    branches.push(
      <mesh key="base" position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 12]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.7).getHex()}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    );
    
    return branches;
  };
  
  // Table coral model
  const renderTableCoral = () => {
    // Create a flat table-like structure with rippled top
    const elements = [];
    
    // Base stem
    elements.push(
      <mesh key="stem" position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.4, 1, 12]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.8).getHex()}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Table top - complex geometry
    const tableRadius = 0.8 + randomValues.current[0] * 0.6;
    const detailLevel = 24;
    
    const tableGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create a rippled disc for the table top
    const centerVertex = 0;
    vertices.push(0, 1, 0); // Center vertex
    uvs.push(0.5, 0.5);
    
    // Create concentric rings of vertices
    const rings = 5;
    let vertexCount = 1;
    
    for (let ring = 1; ring <= rings; ring++) {
      const ringRadius = tableRadius * (ring / rings);
      const segmentsInRing = detailLevel * ring;
      
      for (let segment = 0; segment < segmentsInRing; segment++) {
        const angle = (segment / segmentsInRing) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;
        
        // Add ripple effect to height
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const rippleHeight = 1 + Math.sin(distanceFromCenter * 5) * 0.05 + 
                             Math.cos(angle * 3) * 0.03 + 
                             Math.sin(angle * 5 + distanceFromCenter * 4) * 0.02;
        
        vertices.push(x, rippleHeight, z);
        
        // Calculate UVs
        const u = x / (tableRadius * 2) + 0.5;
        const v = z / (tableRadius * 2) + 0.5;
        uvs.push(u, v);
        
        // Create faces (triangles)
        if (ring > 1) {
          const prevRingSegments = detailLevel * (ring - 1);
          const prevRingStart = vertexCount - segmentsInRing - prevRingSegments;
          
          // Determine corresponding vertex in previous ring
          const prevRingIndex = prevRingStart + Math.floor(segment * prevRingSegments / segmentsInRing);
          const nextPrevRingIndex = prevRingStart + Math.floor(((segment + 1) % segmentsInRing) * prevRingSegments / segmentsInRing);
          
          const currIndex = vertexCount;
          const nextIndex = vertexCount + 1 < vertices.length / 3 ? vertexCount + 1 : vertexCount - segmentsInRing + 1;
          
          // Create two triangles to connect this segment to previous ring
          indices.push(currIndex, prevRingIndex, nextPrevRingIndex);
          indices.push(currIndex, nextPrevRingIndex, nextIndex);
        } else {
          // First ring connects directly to center
          const currIndex = vertexCount;
          const nextIndex = vertexCount + 1 < vertices.length / 3 ? vertexCount + 1 : vertexCount - segmentsInRing + 1;
          
          indices.push(centerVertex, currIndex, nextIndex);
        }
        
        vertexCount++;
      }
    }
    
    // Create geometry from vertices and indices
    tableGeometry.setIndex(indices);
    tableGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    tableGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    tableGeometry.computeVertexNormals();
    
    // Add table top
    elements.push(
      <mesh key="table-top" position={[0, 1, 0]} castShadow receiveShadow>
        <primitive object={tableGeometry} />
        <meshPhysicalMaterial
          color={coralColor}
          roughness={0.7}
          metalness={0.1}
          emissive={coralColor}
          emissiveIntensity={0.08}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
    
    return elements;
  };
  
  // Brain coral model
  const renderBrainCoral = () => {
    const elements = [];
    
    // Base
    elements.push(
      <mesh key="base" position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.4, 16]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.7).getHex()}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Main brain structure
    elements.push(
      <mesh key="brain-body" position={[0, 0.6, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial
          color={coralColor}
          roughness={0.7}
          metalness={0.1}
          emissive={coralColor}
          emissiveIntensity={0.08}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          bumpScale={0.02}
        />
      </mesh>
    );
    
    // Generate ridges characteristic of brain coral
    const ridgeCount = 10 + Math.floor(randomValues.current[0] * 6);
    
    for (let i = 0; i < ridgeCount; i++) {
      const angle = Math.PI * 2 * (i / ridgeCount);
      const radius = 0.48;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Create wavy ridge effect with multiple segments
      const segments = 10 + Math.floor(randomValues.current[i % randomValues.current.length] * 8);
      
      for (let j = 0; j < segments; j++) {
        const segmentAngle = Math.PI * (j / segments);
        const height = 0.6 + Math.sin(segmentAngle) * 0.48;
        
        // Position each segment to form a continuous ridge
        const segmentX = x * Math.sin(segmentAngle);
        const segmentZ = z * Math.sin(segmentAngle);
        const segmentY = 0.6 + Math.cos(segmentAngle) * 0.48;
        
        elements.push(
          <mesh
            key={`ridge-${i}-${j}`}
            position={[segmentX, segmentY, segmentZ]}
            rotation={[0, angle + Math.PI/2, segmentAngle]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.03, 0.04, 0.08]} />
            <meshPhysicalMaterial
              color={new THREE.Color(coralColor).multiplyScalar(1.1).getHex()}
              roughness={0.6}
              metalness={0.1}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
            />
          </mesh>
        );
      }
    }
    
    return elements;
  };
  
  // Staghorn coral model - elongated branching structure
  const renderStaghornCoral = () => {
    const elements = [];
    
    // Base of the coral
    elements.push(
      <mesh key="base" position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.3, 10]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.7).getHex()}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Generate main branches
    const branchCount = 3 + Math.floor(randomValues.current[0] * 4);
    
    for (let i = 0; i < branchCount; i++) {
      const angle = Math.PI * 2 * (i / branchCount);
      const branchLength = 1.0 + randomValues.current[i % randomValues.current.length] * 1.2;
      const thickness = 0.06 + randomValues.current[i % randomValues.current.length] * 0.04;
      
      // Position the branch
      const baseRadius = 0.1 + randomValues.current[i % randomValues.current.length] * 0.15;
      const baseX = Math.cos(angle) * baseRadius;
      const baseZ = Math.sin(angle) * baseRadius;
      
      // Rotation angles
      const xAngle = -0.3 + randomValues.current[i % randomValues.current.length] * 0.6;
      const zAngle = -0.3 + randomValues.current[(i+1) % randomValues.current.length] * 0.6;
      
      // Create main branch
      elements.push(
        <mesh
          key={`staghorn-branch-${i}`}
          position={[baseX, branchLength / 2 + 0.2, baseZ]}
          rotation={[xAngle, angle, zAngle]}
          castShadow
          receiveShadow
          ref={(el) => {
            if (el) branchesRef.current[i] = el;
          }}
        >
          <cylinderGeometry args={[thickness * 0.5, thickness, branchLength, 8]} />
          <meshPhysicalMaterial
            color={coralColor}
            roughness={0.6}
            metalness={0.1}
            emissive={coralColor}
            emissiveIntensity={0.08}
            clearcoat={0.4}
            clearcoatRoughness={0.2}
          />
        </mesh>
      );
      
      // Add sub-branches
      const subBranchCount = 3 + Math.floor(randomValues.current[i % randomValues.current.length] * 5);
      
      for (let j = 0; j < subBranchCount; j++) {
        const subLength = branchLength * 0.4 * (0.7 + randomValues.current[(i+j) % randomValues.current.length] * 0.6);
        const subThickness = thickness * 0.7;
        const heightRatio = 0.3 + randomValues.current[(i+j) % randomValues.current.length] * 0.6;
        
        // Position the sub-branch along the main branch
        const subBranchHeight = branchLength * heightRatio;
        const offsetX = Math.cos(angle + Math.PI/2) * thickness * 0.8;
        const offsetZ = Math.sin(angle + Math.PI/2) * thickness * 0.8;
        
        const subX = baseX + offsetX + xAngle * subBranchHeight * 0.5;
        const subY = subBranchHeight + 0.2;
        const subZ = baseZ + offsetZ + zAngle * subBranchHeight * 0.5;
        
        // Rotation for sub-branch
        const subXAngle = xAngle + (randomValues.current[(i+j*2) % randomValues.current.length] - 0.5) * 0.8;
        const subZAngle = zAngle + (randomValues.current[(i+j*3) % randomValues.current.length] - 0.5) * 0.8;
        
        elements.push(
          <mesh
            key={`staghorn-subbranch-${i}-${j}`}
            position={[subX, subY, subZ]}
            rotation={[subXAngle, angle + Math.PI/2, subZAngle]}
            castShadow
            receiveShadow
            ref={(el) => {
              if (el) branchesRef.current.push(el);
            }}
          >
            <cylinderGeometry args={[subThickness * 0.3, subThickness, subLength, 8]} />
            <meshPhysicalMaterial
              color={coralColor}
              roughness={0.6}
              metalness={0.1}
              emissive={coralColor}
              emissiveIntensity={0.08}
              clearcoat={0.4}
              clearcoatRoughness={0.2}
            />
          </mesh>
        );
      }
    }
    
    return elements;
  };
  
  // Elkhorn coral model - broad, flattened branches
  const renderElkhornCoral = () => {
    const elements = [];
    
    // Base
    elements.push(
      <mesh key="base" position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.3, 12]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.7).getHex()}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Create main trunk
    elements.push(
      <mesh
        key="trunk"
        position={[0, 0.5, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.1, 0.2, 0.7, 10]} />
        <meshPhysicalMaterial
          color={coralColor}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Create broad, flat branches
    const branchCount = 3 + Math.floor(randomValues.current[0] * 3);
    
    for (let i = 0; i < branchCount; i++) {
      const angle = Math.PI * 2 * (i / branchCount);
      const height = 0.7 + randomValues.current[i % randomValues.current.length] * 0.3;
      
      // First, create a branch "bone" structure
      elements.push(
        <mesh
          key={`elkhorn-branch-${i}`}
          position={[Math.cos(angle) * 0.2, height, Math.sin(angle) * 0.2]}
          rotation={[0, angle, -Math.PI / 4]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.03, 0.08, 0.6, 6]} />
          <meshPhysicalMaterial
            color={coralColor}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      );
      
      // Then create a flat, broad structure
      const branchWidth = 0.5 + randomValues.current[i % randomValues.current.length] * 0.3;
      const branchHeight = 0.4 + randomValues.current[(i+1) % randomValues.current.length] * 0.2;
      
      // Create a custom shape for the elkhorn plate
      const shape = new THREE.Shape();
      
      // Starting point
      shape.moveTo(0, 0);
      
      // Create a natural-looking elk horn shape
      const points = 10;
      for (let p = 1; p <= points; p++) {
        const progress = p / points;
        const x = progress * branchWidth;
        
        // Create wavy top edge
        const topWave = Math.sin(progress * Math.PI) * branchHeight;
        const noise = (randomValues.current[(i+p) % randomValues.current.length] - 0.5) * 0.1;
        
        shape.lineTo(x, topWave + noise);
      }
      
      // Connect back to origin
      shape.lineTo(branchWidth, -0.05);
      shape.lineTo(0, -0.05);
      
      // Create geometry from shape
      const geometry = new THREE.ShapeGeometry(shape, 20);
      
      // Position the elkhorn plate
      elements.push(
        <mesh
          key={`elkhorn-plate-${i}`}
          position={[Math.cos(angle) * 0.3, height + 0.05, Math.sin(angle) * 0.3]}
          rotation={[0, angle, -Math.PI / 4]}
          castShadow
          receiveShadow
        >
          <primitive object={geometry} />
          <meshPhysicalMaterial
            color={coralColor}
            roughness={0.6}
            metalness={0.1}
            emissive={coralColor}
            emissiveIntensity={0.05}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
      
      // Add texture details - small bumps on the elkhorn plate
      const detailCount = 20 + Math.floor(randomValues.current[i % randomValues.current.length] * 30);
      
      for (let d = 0; d < detailCount; d++) {
        const xPos = randomValues.current[(i+d*2) % randomValues.current.length] * branchWidth;
        const yPos = (Math.sin(xPos / branchWidth * Math.PI) * branchHeight * 
                     (0.5 + randomValues.current[(i+d*3) % randomValues.current.length] * 0.5));
        
        // Only add details that fall within the shape
        if (yPos < 0 || yPos > Math.sin(xPos / branchWidth * Math.PI) * branchHeight) continue;
        
        const detailSize = 0.01 + randomValues.current[(i+d) % randomValues.current.length] * 0.015;
        
        elements.push(
          <mesh
            key={`elkhorn-detail-${i}-${d}`}
            position={[
              Math.cos(angle) * 0.3 + Math.cos(angle - Math.PI/2) * xPos,
              height + 0.05 + yPos,
              Math.sin(angle) * 0.3 + Math.sin(angle - Math.PI/2) * xPos
            ]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[detailSize, 8, 8]} />
            <meshPhysicalMaterial
              color={new THREE.Color(coralColor).multiplyScalar(1.1).getHex()}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>
        );
      }
    }
    
    return elements;
  };
  
  // Soft coral model with gentle swaying polyps
  const renderSoftCoral = () => {
    const elements = [];
    
    // Base
    elements.push(
      <mesh key="base" position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 12]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.7).getHex()}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Main body - soft and flexible
    elements.push(
      <mesh key="body" position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.2, 0.7, 10]} />
        <meshPhysicalMaterial
          color={coralColor}
          roughness={0.4}
          metalness={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          transparent
          opacity={0.95}
        />
      </mesh>
    );
    
    // Generate soft polyps
    const polypCount = 20 + Math.floor(randomValues.current[0] * 30);
    
    for (let i = 0; i < polypCount; i++) {
      // Distribute polyps around central stem
      const height = 0.3 + randomValues.current[i % randomValues.current.length] * 0.8;
      const angle = randomValues.current[(i*2) % randomValues.current.length] * Math.PI * 2;
      const radius = 0.05 + randomValues.current[(i*3) % randomValues.current.length] * 0.15;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Polyp size variation
      const size = 0.04 + randomValues.current[i % randomValues.current.length] * 0.05;
      
      // Color variation - slight tint changes for natural look
      const polypColor = new THREE.Color(coralColor);
      polypColor.offsetHSL(0, 0, (randomValues.current[i % randomValues.current.length] - 0.5) * 0.1);
      
      elements.push(
        <group
          key={`polyp-${i}`}
          position={[x, height, z]}
          ref={(el) => {
            if (el) branchesRef.current.push(el as any);
          }}
        >
          {/* Polyp stem */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[size * 0.3, size * 0.4, size * 2, 8]} />
            <meshPhysicalMaterial
              color={polypColor}
              roughness={0.5}
              metalness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Polyp head */}
          <mesh position={[0, size, 0]} castShadow receiveShadow>
            <sphereGeometry args={[size * 0.8, 12, 12]} />
            <meshPhysicalMaterial
              color={polypColor}
              roughness={0.4}
              metalness={0.1}
              emissive={polypColor}
              emissiveIntensity={0.05}
              clearcoat={0.4}
              clearcoatRoughness={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Polyp tentacles */}
          {[...Array(6)].map((_, j) => {
            const tentacleAngle = (j / 6) * Math.PI * 2;
            const tx = Math.cos(tentacleAngle) * (size * 0.7);
            const tz = Math.sin(tentacleAngle) * (size * 0.7);
            
            return (
              <mesh
                key={`tentacle-${i}-${j}`}
                position={[tx, size, tz]}
                rotation={[Math.PI/2 - Math.PI/4, 0, tentacleAngle]}
                castShadow
                receiveShadow
              >
                <coneGeometry args={[size * 0.2, size * 1.5, 8, 1]} />
                <meshPhysicalMaterial
                  color={polypColor}
                  roughness={0.5}
                  metalness={0.1}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            );
          })}
        </group>
      );
    }
    
    return elements;
  };
  
  // Mushroom coral model
  const renderMushroomCoral = () => {
    const elements = [];
    
    // Base
    elements.push(
      <mesh key="base" position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 12]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.7).getHex()}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Center column
    elements.push(
      <mesh key="stem" position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 16]} />
        <meshPhysicalMaterial
          color={new THREE.Color(coralColor).multiplyScalar(0.8).getHex()}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
    );
    
    // Cap geometry
    const capRadius = 0.6 + randomValues.current[0] * 0.3;
    const detailLevel = 40;
    
    // Create a custom geometry for the rippled mushroom cap
    const capGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create center vertex
    vertices.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    
    let vertexCount = 1;
    
    // Create concentric rings of vertices
    const rings = 8;
    
    for (let ring = 1; ring <= rings; ring++) {
      const ringRadius = capRadius * (ring / rings);
      const rippleHeight = 0.05 * Math.sin(ringRadius * 10);
      const segmentsInRing = Math.max(8, Math.floor(detailLevel * (ring / rings)));
      
      for (let segment = 0; segment < segmentsInRing; segment++) {
        const angle = (segment / segmentsInRing) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;
        
        // Complex height function to create a mushroom shape with ripples
        let y = 0;
        
        if (ring < rings) {
          // Curved cap shape with ripples
          const normalizedRadius = ringRadius / capRadius;
          
          // Base dome shape
          y = -Math.sin(normalizedRadius * Math.PI/2) * 0.2;
          
          // Add ripples
          y += Math.sin(ringRadius * 15 + angle * 6) * 0.01;
          y += Math.cos(ringRadius * 8 - angle * 4) * 0.015;
          
          // Add more structured ridges radiating from center
          y += Math.cos(angle * 8) * normalizedRadius * 0.03;
        } else {
          // Create a downward-curved edge
          y = -0.2;
        }
        
        vertices.push(x, y, z);
        
        // Calculate UV coordinates
        const u = x / (capRadius * 2) + 0.5;
        const v = z / (capRadius * 2) + 0.5;
        uvs.push(u, v);
        
        // Create triangular faces
        if (ring > 1) {
          const prevRingSegments = Math.max(8, Math.floor(detailLevel * ((ring - 1) / rings)));
          const prevRingStart = vertexCount - segmentsInRing - prevRingSegments;
          
          // Find the closest vertex in previous ring
          const ratio = prevRingSegments / segmentsInRing;
          const prevSegment = Math.floor(segment * ratio);
          const nextPrevSegment = Math.floor(((segment + 1) % segmentsInRing) * ratio) % prevRingSegments;
          
          const prevRingIndex = prevRingStart + prevSegment;
          const nextPrevRingIndex = prevRingStart + nextPrevSegment;
          
          const currIndex = vertexCount;
          const nextIndex = (segment < segmentsInRing - 1) ? vertexCount + 1 : vertexCount - segmentsInRing + 1;
          
          // Add triangles - ensure proper winding order
          indices.push(currIndex, prevRingIndex, nextPrevRingIndex);
          
          // Connect with next vertex in same ring
          if (segment < segmentsInRing - 1) {
            indices.push(currIndex, nextPrevRingIndex, nextIndex);
          } else {
            // Connect last segment to first segment
            indices.push(currIndex, nextPrevRingIndex, vertexCount - segmentsInRing + 1);
          }
        } else {
          // First ring connects to center vertex
          const currIndex = vertexCount;
          const nextIndex = (segment < segmentsInRing - 1) ? vertexCount + 1 : vertexCount - segmentsInRing + 1;
          
          indices.push(0, currIndex, nextIndex);
        }
        
        vertexCount++;
      }
    }
    
    // Create geometry from vertices and indices
    capGeometry.setIndex(indices);
    capGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    capGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    capGeometry.computeVertexNormals();
    
    // Add the mushroom cap
    elements.push(
      <mesh key="cap" position={[0, 0.65, 0]} castShadow receiveShadow>
        <primitive object={capGeometry} />
        <meshPhysicalMaterial
          color={coralColor}
          roughness={0.6}
          metalness={0.1}
          emissive={coralColor}
          emissiveIntensity={0.08}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
    
    // Add small polyps on the underside
    const polypCount = 40 + Math.floor(randomValues.current[1] * 40);
    
    for (let i = 0; i < polypCount; i++) {
      const polypRadius = (0.2 + randomValues.current[i % randomValues.current.length] * 0.8) * capRadius;
      const angle = randomValues.current[(i*2) % randomValues.current.length] * Math.PI * 2;
      
      const x = Math.cos(angle) * polypRadius;
      const z = Math.sin(angle) * polypRadius;
      
      // Height follows the cap curve
      const normalizedRadius = polypRadius / capRadius;
      let y = -Math.sin(normalizedRadius * Math.PI/2) * 0.2;
      
      // Polyp size
      const size = 0.02 + randomValues.current[(i*3) % randomValues.current.length] * 0.02;
      
      // Only add polyps on the underside
      if (y >= 0) continue;
      
      elements.push(
        <mesh
          key={`polyp-${i}`}
          position={[x, 0.65 + y - size/2, z]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[size * 0.3, size, size, 8]} />
          <meshPhysicalMaterial
            color={new THREE.Color(coralColor).multiplyScalar(1.2).getHex()}
            roughness={0.5}
            metalness={0.1}
            emissive={coralColor}
            emissiveIntensity={0.08}
          />
        </mesh>
      );
    }
    
    return elements;
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {renderCoral()}
    </group>
  );
}