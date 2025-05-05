import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';

// Environment type
export type EnvironmentType = 'reef' | 'openOcean' | 'deepSea' | 'shipwreck' | 'kelpForest';

// Environment theme definition
interface EnvironmentTheme {
  type: EnvironmentType;
  backgroundColor: number;
  fogColor: number;
  fogDensity: number;
  lightIntensity: number;
  floorColor: number;
  floorRoughness: number;
  floorMetalness: number;
  decorationDensity: number;
  particleDensity: number;
  transitionDuration: number;
  minDistance: number; // Minimum distance to travel before possible transition
}

// Environment themes
const ENVIRONMENT_THEMES: Record<EnvironmentType, EnvironmentTheme> = {
  reef: {
    type: 'reef',
    backgroundColor: 0x4ac7e9,
    fogColor: 0x4ac7e9,
    fogDensity: 0.01,
    lightIntensity: 1.0,
    floorColor: 0xd9c7ad,
    floorRoughness: 0.8,
    floorMetalness: 0.1,
    decorationDensity: 0.8,
    particleDensity: 0.4,
    transitionDuration: 5.0,
    minDistance: 500
  },
  openOcean: {
    type: 'openOcean',
    backgroundColor: 0x0c6b9c,
    fogColor: 0x0c6b9c,
    fogDensity: 0.005,
    lightIntensity: 0.8,
    floorColor: 0x1a3f54,
    floorRoughness: 0.7,
    floorMetalness: 0.2,
    decorationDensity: 0.2,
    particleDensity: 0.2,
    transitionDuration: 8.0,
    minDistance: 800
  },
  deepSea: {
    type: 'deepSea',
    backgroundColor: 0x05445E,
    fogColor: 0x05445E,
    fogDensity: 0.03,
    lightIntensity: 0.4,
    floorColor: 0x0a1c21,
    floorRoughness: 0.9,
    floorMetalness: 0.3,
    decorationDensity: 0.5,
    particleDensity: 0.1,
    transitionDuration: 6.0,
    minDistance: 1200
  },
  shipwreck: {
    type: 'shipwreck',
    backgroundColor: 0x2d4559,
    fogColor: 0x2d4559,
    fogDensity: 0.02,
    lightIntensity: 0.6,
    floorColor: 0x2a3c4a,
    floorRoughness: 0.8,
    floorMetalness: 0.2,
    decorationDensity: 0.9,
    particleDensity: 0.3,
    transitionDuration: 7.0,
    minDistance: 1000
  },
  kelpForest: {
    type: 'kelpForest',
    backgroundColor: 0x2a8e82,
    fogColor: 0x2a8e82,
    fogDensity: 0.015,
    lightIntensity: 0.7,
    floorColor: 0x1a5951,
    floorRoughness: 0.7,
    floorMetalness: 0.1,
    decorationDensity: 1.0,
    particleDensity: 0.5,
    transitionDuration: 6.0,
    minDistance: 700
  }
};

// Decoration item definition
interface DecorationDefinition {
  type: string;
  scale: THREE.Vector3 | number;
  yOffset: number;
  rotationVariance: number;
  scaleVariance: number;
  canFloatAboveGround: boolean;
  environmentTypes: EnvironmentType[];
  probability: number; // Relative probability of spawning
}

// Decoration definitions
const DECORATION_DEFINITIONS: DecorationDefinition[] = [
  {
    type: 'coral1',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 1.0
  },
  {
    type: 'coral2',
    scale: 1.2,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.8
  },
  {
    type: 'seaweed1',
    scale: 1.5,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'kelpForest'],
    probability: 1.0
  },
  {
    type: 'kelpStalk',
    scale: 2.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.7,
    canFloatAboveGround: false,
    environmentTypes: ['kelpForest'],
    probability: 1.5
  },
  {
    type: 'rock1',
    scale: 0.8,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'deepSea', 'shipwreck', 'kelpForest'],
    probability: 0.7
  },
  {
    type: 'rock2',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'deepSea', 'shipwreck', 'kelpForest', 'openOcean'],
    probability: 0.6
  },
  {
    type: 'shipPart',
    scale: 1.5,
    yOffset: -1.0,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 1.2
  },
  {
    type: 'treasure',
    scale: 0.7,
    yOffset: -1.7,
    rotationVariance: Math.PI * 0.5,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.4
  },
  {
    type: 'deepsea_vent',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.5
  },
  {
    type: 'glowingPlant',
    scale: 0.8,
    yOffset: -1.6,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.8
  },
  {
    type: 'floatingPlankton',
    scale: 0.5,
    yOffset: 1.0,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: true,
    environmentTypes: ['openOcean', 'reef'],
    probability: 0.8
  },
  {
    type: 'schoolOfFish',
    scale: 1.0,
    yOffset: 0.5,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: true,
    environmentTypes: ['openOcean', 'reef', 'kelpForest'],
    probability: 0.7
  }
];

// Environment segment
class EnvironmentSegment {
  mesh: THREE.Group;
  decorations: THREE.Group;
  bounds: THREE.Box3;
  isActive: boolean = true;
  segmentLength: number;
  segmentType: EnvironmentType;
  
  constructor(
    scene: THREE.Scene,
    theme: EnvironmentTheme,
    position: THREE.Vector3,
    segmentLength: number,
    segmentWidth: number,
    createDecorations: boolean = true
  ) {
    this.segmentType = theme.type;
    this.segmentLength = segmentLength;
    
    // Create segment mesh
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    // Create floor geometry
    const floorGeometry = new THREE.PlaneGeometry(segmentWidth, segmentLength, 20, 20);
    
    // Apply some noise to the floor
    if (floorGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = floorGeometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        // Y is up in Three.js, but we're creating a horizontal plane so we want to perturb Z
        const y = Math.random() * 0.3 - 0.15;
        positions[i * 3 + 2] = y;
      }
      floorGeometry.attributes.position.needsUpdate = true;
      floorGeometry.computeVertexNormals();
    }
    
    // Create floor material
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: theme.floorColor,
      roughness: theme.floorRoughness,
      metalness: theme.floorMetalness,
      side: THREE.DoubleSide
    });
    
    // Create floor mesh
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2; // Rotate to be horizontal
    floor.position.y = -2; // Position below the camera
    
    // Add floor to segment
    this.mesh.add(floor);
    
    // Create decorations group
    this.decorations = new THREE.Group();
    this.mesh.add(this.decorations);
    
    // Add segment to scene
    scene.add(this.mesh);
    
    // Create bounding box
    this.bounds = new THREE.Box3().setFromObject(this.mesh);
    
    // Add decorations if needed
    if (createDecorations) {
      this.addDecorations(theme);
    }
  }
  
  // Add decorations based on environment theme
  private addDecorations(theme: EnvironmentTheme) {
    // Filter decorations for current environment type
    const availableDecorations = DECORATION_DEFINITIONS.filter(def => 
      def.environmentTypes.includes(theme.type)
    );
    
    if (availableDecorations.length === 0) return;
    
    // Calculate total probability weight
    const totalWeight = availableDecorations.reduce((sum, def) => sum + def.probability, 0);
    
    // Calculate number of decorations based on density and segment size
    const decorationCount = Math.floor(theme.decorationDensity * this.segmentLength / 10);
    
    // Create decorations
    for (let i = 0; i < decorationCount; i++) {
      // Choose a random decoration based on probability
      const random = Math.random() * totalWeight;
      let weightSum = 0;
      let chosenDecoration: DecorationDefinition | null = null;
      
      for (const def of availableDecorations) {
        weightSum += def.probability;
        if (random <= weightSum) {
          chosenDecoration = def;
          break;
        }
      }
      
      if (!chosenDecoration) {
        chosenDecoration = availableDecorations[0];
      }
      
      // Add decoration
      const decoration = this.createDecoration(chosenDecoration);
      
      // Position randomly within segment
      const x = (Math.random() - 0.5) * 30; // Segment width is 40, use slightly smaller area
      const z = (Math.random() - 0.5) * (this.segmentLength - 5) + this.mesh.position.z;
      
      decoration.position.set(x, chosenDecoration.yOffset, z - this.mesh.position.z);
      
      // For decorations that can float above ground, adjust Y position
      if (chosenDecoration.canFloatAboveGround) {
        decoration.position.y += Math.random() * 3;
      }
      
      // Add to decorations group
      this.decorations.add(decoration);
    }
  }
  
  // Create a decoration mesh
  private createDecoration(definition: DecorationDefinition): THREE.Group | THREE.Mesh {
    // Decoration type will determine what kind of mesh to create
    switch (definition.type) {
      case 'coral1':
        return this.createCoral1(definition);
      case 'coral2':
        return this.createCoral2(definition);
      case 'seaweed1':
        return this.createSeaweed1(definition);
      case 'kelpStalk':
        return this.createKelpStalk(definition);
      case 'rock1':
      case 'rock2':
        return this.createRock(definition);
      case 'shipPart':
        return this.createShipPart(definition);
      case 'treasure':
        return this.createTreasure(definition);
      case 'deepsea_vent':
        return this.createDeepSeaVent(definition);
      case 'glowingPlant':
        return this.createGlowingPlant(definition);
      case 'floatingPlankton':
        return this.createFloatingPlankton(definition);
      case 'schoolOfFish':
        return this.createSchoolOfFish(definition);
      default:
        // Default simple box
        return this.createGenericDecoration(definition);
    }
  }
  
  // Create various decoration types
  private createCoral1(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Base shape with several branches
    const branchCount = 3 + Math.floor(Math.random() * 4); // 3-6 branches
    
    for (let i = 0; i < branchCount; i++) {
      const heightScale = 0.5 + Math.random() * 0.5;
      const geometry = new THREE.CylinderGeometry(0.05, 0.2, 1.0 * heightScale, 8);
      
      // Random coral colors
      const color = new THREE.Color(
        0.9 + Math.random() * 0.1, // High red
        0.3 + Math.random() * 0.3, // Medium green
        0.5 + Math.random() * 0.3  // Medium-high blue
      );
      
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const branch = new THREE.Mesh(geometry, material);
      
      // Position branch
      const angle = (i / branchCount) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.2;
      
      branch.position.set(
        Math.cos(angle) * radius,
        heightScale * 0.5, // Half height
        Math.sin(angle) * radius
      );
      
      // Random rotation
      branch.rotation.set(
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      );
      
      group.add(branch);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createCoral2(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Brain coral like structure
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    // Add wrinkles to the surface
    if (geometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Distance from center
        const length = Math.sqrt(x * x + y * y + z * z);
        
        // Direction
        const dx = x / length;
        const dy = y / length;
        const dz = z / length;
        
        // Add noise
        const noise = 0.1 * Math.sin(x * 10) * Math.sin(y * 10) * Math.sin(z * 10);
        
        positions[i * 3] = dx * (length + noise);
        positions[i * 3 + 1] = dy * (length + noise);
        positions[i * 3 + 2] = dz * (length + noise);
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    
    // Random coral colors, more orange tones
    const color = new THREE.Color(
      0.9 + Math.random() * 0.1, // High red
      0.4 + Math.random() * 0.2, // Medium-low green
      0.2 + Math.random() * 0.2  // Low blue
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const coral = new THREE.Mesh(geometry, material);
    
    // Add to group
    group.add(coral);
    
    // Add a base
    const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.8), // Darker version of same color
      roughness: 0.9,
      metalness: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.5 - 0.15; // Half of coral height + half of base height
    group.add(base);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createSeaweed1(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Seaweed is made of several segments
    const segmentCount = 3 + Math.floor(Math.random() * 3); // 3-5 segments
    const segmentHeight = 0.8;
    const segmentWidth = 0.3;
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x2d9d6d, // Seaweed green
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    
    // Create segments
    for (let i = 0; i < segmentCount; i++) {
      const geometry = new THREE.PlaneGeometry(segmentWidth, segmentHeight, 1, 3);
      
      // Apply curve to each segment
      if (geometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = geometry.attributes.position.array;
        
        for (let j = 0; j < positions.length / 3; j++) {
          const y = positions[j * 3 + 1];
          
          // Apply horizontal curve (sine wave)
          positions[j * 3] += Math.sin(y * 5) * 0.05;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
      
      const segment = new THREE.Mesh(geometry, material);
      segment.position.y = i * segmentHeight;
      
      // Slight random rotation to each segment for a more natural look
      segment.rotation.x = Math.PI / 2; // Flat upward
      segment.rotation.y = (Math.random() - 0.5) * 0.2;
      segment.rotation.z = (Math.random() - 0.5) * 0.2;
      
      group.add(segment);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation around Y axis
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createKelpStalk(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Kelp stalk is a long, segmented structure with leaves
    const stalkHeight = 4.0;
    const segmentCount = 8;
    const segmentHeight = stalkHeight / segmentCount;
    
    // Stalk material (dark green)
    const stalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a633e,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Leaf material (slightly lighter, translucent)
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d8653,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    // Create stalk segments
    for (let i = 0; i < segmentCount; i++) {
      // Make the stalk thinner towards the top
      const topRadius = 0.08 * (1 - i / segmentCount * 0.5);
      const bottomRadius = 0.08 * (1 - (i - 0.5) / segmentCount * 0.5);
      
      const stalkGeometry = new THREE.CylinderGeometry(topRadius, bottomRadius, segmentHeight, 8);
      const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
      
      // Position the segment
      stalk.position.y = i * segmentHeight + segmentHeight / 2;
      
      // Add some gentle curve to the stalk
      const curveAmount = 0.05 * Math.sin(i / segmentCount * Math.PI);
      stalk.position.x += curveAmount * (i + 1);
      
      // Random rotation for variation
      stalk.rotation.z = Math.sin(i * 0.5) * 0.1;
      
      group.add(stalk);
      
      // Add leaves on alternating sides
      if (i > 0 && i < segmentCount - 1) {
        if (i % 2 === 0) {
          const leaf = this.createKelpLeaf(leafMaterial);
          leaf.position.set(0.15, stalk.position.y, 0);
          leaf.rotation.y = Math.PI / 2;
          group.add(leaf);
        } else {
          const leaf = this.createKelpLeaf(leafMaterial);
          leaf.position.set(-0.15, stalk.position.y, 0);
          leaf.rotation.y = -Math.PI / 2;
          group.add(leaf);
        }
      }
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation around Y axis
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createKelpLeaf(material: THREE.Material): THREE.Mesh {
    const shape = new THREE.Shape();
    
    // Create a leaf shape
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.2, 0.3, 0.6, 0.5, 1.0, 0.4);
    shape.bezierCurveTo(0.8, 0.1, 0.5, -0.2, 0, 0);
    
    const geometry = new THREE.ShapeGeometry(shape, 12);
    return new THREE.Mesh(geometry, material);
  }
  
  private createRock(definition: DecorationDefinition): THREE.Mesh {
    // Random rock using dodecahedron with noise
    const geometry = new THREE.DodecahedronGeometry(0.5, 1);
    
    // Add random noise to vertices
    if (geometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.3;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    
    // Random rock colors
    const shade = 0.3 + Math.random() * 0.3; // Dark to medium
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shade, shade, shade),
      roughness: 0.9,
      metalness: 0.1
    });
    
    const rock = new THREE.Mesh(geometry, material);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    rock.scale.set(finalScale, finalScale * 0.7, finalScale); // Slightly flatter
    
    // Apply random rotation
    rock.rotation.set(
      Math.random() * definition.rotationVariance,
      Math.random() * definition.rotationVariance,
      Math.random() * definition.rotationVariance
    );
    
    return rock;
  }
  
  private createShipPart(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Choose a random ship part type
    const partType = Math.floor(Math.random() * 3);
    
    if (partType === 0) {
      // Ship plank - wooden board
      const plankGeometry = new THREE.BoxGeometry(0.2, 0.05, 1.0);
      const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x5d4433, // Dark brown
        roughness: 0.9,
        metalness: 0.1
      });
      
      const plank = new THREE.Mesh(plankGeometry, woodMaterial);
      
      // Add some weathering - displace vertices
      if (plankGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = plankGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3] += (Math.random() - 0.5) * 0.02;
          positions[i * 3 + 1] += (Math.random() - 0.5) * 0.01;
          positions[i * 3 + 2] += (Math.random() - 0.5) * 0.02;
        }
        
        plankGeometry.attributes.position.needsUpdate = true;
        plankGeometry.computeVertexNormals();
      }
      
      group.add(plank);
      
      // Add nails
      const nailGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.08, 6);
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b8b8b, // Metallic gray
        roughness: 0.6,
        metalness: 0.7
      });
      
      // Add a few nails
      for (let i = 0; i < 4; i++) {
        const nail = new THREE.Mesh(nailGeometry, metalMaterial);
        nail.position.set(
          (Math.random() - 0.5) * 0.15,
          0.02, // Just above the plank
          (Math.random() - 0.5) * 0.8
        );
        group.add(nail);
      }
      
    } else if (partType === 1) {
      // Ship wheel
      const wheelRimGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 16);
      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x5d4433, // Dark brown
        roughness: 0.9,
        metalness: 0.1
      });
      
      const wheelRim = new THREE.Mesh(wheelRimGeometry, wheelMaterial);
      group.add(wheelRim);
      
      // Add spokes
      const spokeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
      
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spoke = new THREE.Mesh(spokeGeometry, wheelMaterial);
        spoke.position.set(
          Math.cos(angle) * 0.2,
          0,
          Math.sin(angle) * 0.2
        );
        spoke.rotation.x = Math.PI / 2;
        spoke.rotation.z = angle;
        group.add(spoke);
      }
      
      // Add center hub
      const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8);
      const hub = new THREE.Mesh(hubGeometry, wheelMaterial);
      hub.rotation.x = Math.PI / 2;
      group.add(hub);
      
    } else {
      // Anchor
      const anchorRodGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a, // Dark metallic gray
        roughness: 0.6,
        metalness: 0.7
      });
      
      const anchorRod = new THREE.Mesh(anchorRodGeometry, metalMaterial);
      group.add(anchorRod);
      
      // Anchor arms
      const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
      
      // Left arm
      const leftArm = new THREE.Mesh(armGeometry, metalMaterial);
      leftArm.position.set(0, -0.5, 0);
      leftArm.rotation.z = Math.PI / 4;
      group.add(leftArm);
      
      // Right arm
      const rightArm = new THREE.Mesh(armGeometry, metalMaterial);
      rightArm.position.set(0, -0.5, 0);
      rightArm.rotation.z = -Math.PI / 4;
      group.add(rightArm);
      
      // Anchor ring
      const ringGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
      const ring = new THREE.Mesh(ringGeometry, metalMaterial);
      ring.position.set(0, 0.6, 0);
      group.add(ring);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.set(
      Math.random() * Math.PI / 4, // Limit X rotation to seem more natural
      Math.random() * definition.rotationVariance,
      Math.random() * Math.PI / 4  // Limit Z rotation to seem more natural
    );
    
    return group;
  }
  
  private createTreasure(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Choose between treasure chest or gold coins
    const treasureType = Math.random() > 0.3 ? 'chest' : 'coins';
    
    if (treasureType === 'chest') {
      // Treasure chest
      const chestBaseGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
      const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x5d4433, // Dark brown
        roughness: 0.9,
        metalness: 0.1
      });
      
      const chestBase = new THREE.Mesh(chestBaseGeometry, woodMaterial);
      group.add(chestBase);
      
      // Chest lid
      const lidGeometry = new THREE.BoxGeometry(0.62, 0.2, 0.42);
      const lid = new THREE.Mesh(lidGeometry, woodMaterial);
      lid.position.set(0, 0.3, 0);
      group.add(lid);
      
      // Metal trims
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0xb5a642, // Brass
        roughness: 0.3,
        metalness: 0.8
      });
      
      // Add metal edges
      const trimGeometry = new THREE.BoxGeometry(0.62, 0.05, 0.42);
      const trim = new THREE.Mesh(trimGeometry, metalMaterial);
      trim.position.set(0, 0.2, 0);
      group.add(trim);
      
      // Add lock
      const lockGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.07);
      const lock = new THREE.Mesh(lockGeometry, metalMaterial);
      lock.position.set(0, 0.2, 0.22);
      group.add(lock);
      
    } else {
      // Gold coins pile
      const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700, // Gold
        roughness: 0.3,
        metalness: 0.9
      });
      
      // Create coins pile
      const coinCount = 8 + Math.floor(Math.random() * 8); // 8-15 coins
      
      for (let i = 0; i < coinCount; i++) {
        const coinGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16);
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        
        // Position coins in a pile
        coin.position.set(
          (Math.random() - 0.5) * 0.3,
          0.01 * i, // Stack up
          (Math.random() - 0.5) * 0.3
        );
        
        // Random rotation for more natural pile
        coin.rotation.set(
          (Math.random() - 0.5) * 0.5,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.5
        );
        
        group.add(coin);
      }
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createDeepSeaVent(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Base rock
    const baseGeometry = new THREE.ConeGeometry(0.5, 1.0, 8);
    baseGeometry.scale(1, 0.5, 1); // Flatten the cone
    
    // Apply random noise to vertices for natural look
    if (baseGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = baseGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.2;
      }
      
      baseGeometry.attributes.position.needsUpdate = true;
      baseGeometry.computeVertexNormals();
    }
    
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray
      roughness: 0.9,
      metalness: 0.2
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);
    
    // Chimney
    const chimneyGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.8, 8);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666, // Medium gray
      roughness: 0.8,
      metalness: 0.3
    });
    
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.y = 0.4; // Position above the base
    group.add(chimney);
    
    // Particles (simplified in this implementation)
    // In a real implementation, would use particle system to simulate billowing smoke
    const particlesGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const particlesMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa, // Light gray
      transparent: true,
      opacity: 0.5
    });
    
    const particles = new THREE.Mesh(particlesGeometry, particlesMaterial);
    particles.position.y = 0.8; // Above the chimney
    particles.scale.set(1, 1.5, 1); // Stretch vertically
    group.add(particles);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createGlowingPlant(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Base stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1.0, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x006666, // Dark teal
      roughness: 0.8,
      metalness: 0.2
    });
    
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.5; // Half height
    group.add(stem);
    
    // Glowing bulbs
    const bulbCount = 3 + Math.floor(Math.random() * 3); // 3-5 bulbs
    const bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff, // Cyan
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x00ffff, // Self-illuminating
      emissiveIntensity: 0.5
    });
    
    for (let i = 0; i < bulbCount; i++) {
      const bulbSize = 0.1 + Math.random() * 0.15;
      const bulbGeometry = new THREE.SphereGeometry(bulbSize, 8, 8);
      const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      
      // Position along the stem at different heights
      const height = 0.3 + i * (0.7 / bulbCount);
      const angle = i * Math.PI * 0.5; // Spread around stem
      const radius = 0.15;
      
      bulb.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      group.add(bulb);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createFloatingPlankton(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create small floating particles
    const particleCount = 10 + Math.floor(Math.random() * 15); // 10-24 particles
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < particleCount; i++) {
      const size = 0.02 + Math.random() * 0.05;
      const particleGeometry = new THREE.SphereGeometry(size, 6, 6);
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Position in a loose cloud
      particle.position.set(
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.0
      );
      
      group.add(particle);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    return group;
  }
  
  private createSchoolOfFish(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a cluster of simple fish
    const fishCount = 10 + Math.floor(Math.random() * 15); // 10-24 fish
    
    // Choose a random color for the school
    const hue = Math.random();
    const schoolColor = new THREE.Color().setHSL(hue, 0.8, 0.5);
    
    for (let i = 0; i < fishCount; i++) {
      const fish = this.createSimpleFish(schoolColor);
      
      // Position fish in a cohesive school formation
      const radius = 0.8;
      const offsetX = (Math.random() - 0.5) * radius;
      const offsetY = (Math.random() - 0.5) * radius;
      const offsetZ = (Math.random() - 0.5) * radius;
      
      fish.position.set(offsetX, offsetY, offsetZ);
      
      // Random rotation but generally facing the same direction
      fish.rotation.y = (Math.random() - 0.5) * Math.PI * 0.5;
      
      group.add(fish);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createSimpleFish(color: THREE.Color): THREE.Mesh {
    // Simple fish shape
    const fishGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
    fishGeometry.rotateZ(Math.PI / 2); // Orient horizontally
    
    // Slight color variation
    const fishColor = color.clone();
    fishColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
    
    const fishMaterial = new THREE.MeshBasicMaterial({
      color: fishColor
    });
    
    return new THREE.Mesh(fishGeometry, fishMaterial);
  }
  
  private createGenericDecoration(definition: DecorationDefinition): THREE.Mesh {
    // Simple box as fallback
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const decoration = new THREE.Mesh(geometry, material);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    decoration.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    decoration.rotation.set(
      Math.random() * definition.rotationVariance,
      Math.random() * definition.rotationVariance,
      Math.random() * definition.rotationVariance
    );
    
    return decoration;
  }
  
  // Update segment animations
  update(deltaTime: number) {
    // Animate decorations
    for (let i = 0; i < this.decorations.children.length; i++) {
      const decoration = this.decorations.children[i];
      
      // Add gentle swaying or movement
      if (decoration.name.includes('seaweed') || decoration.name.includes('kelp')) {
        decoration.rotation.z = Math.sin(performance.now() * 0.001 + i) * 0.05;
      } else if (decoration.name.includes('plankton')) {
        decoration.position.y += Math.sin(performance.now() * 0.001 + i) * 0.01 * deltaTime;
      } else if (decoration.name.includes('fish')) {
        decoration.position.x += Math.sin(performance.now() * 0.001 + i) * 0.02 * deltaTime;
        decoration.position.y += Math.cos(performance.now() * 0.001 + i * 0.7) * 0.01 * deltaTime;
      }
    }
  }
  
  // Clean up resources
  dispose() {
    // Remove from scene
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    // Dispose geometries and materials
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
  }
}

// Procedural Environment Generator
export class ProceduralEnvironment {
  private scene: THREE.Scene;
  private segments: EnvironmentSegment[] = [];
  private segmentLength: number = 50;
  private segmentWidth: number = 40;
  private segmentsAhead: number = 4; // How many segments to keep ahead of player
  private segmentsBehind: number = 2; // How many segments to keep behind player
  private currentEnvironmentType: EnvironmentType = 'reef';
  private currentTheme: EnvironmentTheme = ENVIRONMENT_THEMES.reef;
  private pendingTransition: EnvironmentType | null = null;
  private transitionProgress: number = 0;
  private transitionStartDistance: number = 0;
  private lastDistanceTraveled: number = 0;
  private distanceSinceLastChange: number = 0;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Set initial environment
    this.applyEnvironmentTheme(this.currentTheme);
    
    // Create initial segments
    this.generateInitialSegments();
  }
  
  // Update environment based on player position
  update(deltaTime: number, playerZ: number) {
    // Calculate distance traveled
    const distanceTraveled = Math.abs(playerZ);
    const segmentPosition = Math.floor(distanceTraveled / this.segmentLength);
    this.distanceSinceLastChange += Math.abs(distanceTraveled - this.lastDistanceTraveled);
    this.lastDistanceTraveled = distanceTraveled;
    
    // Update environment transitions
    this.updateEnvironmentTransition(deltaTime, distanceTraveled);
    
    // Generate new segments if needed
    this.manageSegments(segmentPosition, playerZ);
    
    // Update segment animations
    this.segments.forEach(segment => {
      segment.update(deltaTime);
    });
    
    // Consider environment type change
    this.considerEnvironmentChange(distanceTraveled);
  }
  
  // Apply an environment theme
  private applyEnvironmentTheme(theme: EnvironmentTheme) {
    // Set scene fog
    this.scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);
    this.scene.background = new THREE.Color(theme.backgroundColor);
    
    // Adjust lighting (directional light intensity)
    this.scene.children.forEach(child => {
      if (child instanceof THREE.DirectionalLight) {
        child.intensity = theme.lightIntensity;
      }
    });
    
    // The theme is fully applied
    this.currentEnvironmentType = theme.type;
    this.currentTheme = theme;
  }
  
  // Create initial segments
  private generateInitialSegments() {
    const startZ = 0;
    
    // Generate several segments ahead
    for (let i = 0; i < this.segmentsAhead; i++) {
      const z = startZ - i * this.segmentLength;
      const position = new THREE.Vector3(0, 0, z);
      
      const segment = new EnvironmentSegment(
        this.scene,
        this.currentTheme,
        position,
        this.segmentLength,
        this.segmentWidth
      );
      
      this.segments.push(segment);
    }
  }
  
  // Manage segments based on player position
  private manageSegments(segmentPosition: number, playerZ: number) {
    // Remove segments too far behind player
    const behindThreshold = segmentPosition - this.segmentsBehind;
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const segmentStart = segment.mesh.position.z + this.segmentLength / 2;
      const segmentIndex = Math.floor(Math.abs(segmentStart) / this.segmentLength);
      
      if (segmentIndex < behindThreshold) {
        segment.dispose();
        this.segments.splice(i, 1);
      }
    }
    
    // Add new segments ahead if needed
    const aheadThreshold = segmentPosition + this.segmentsAhead;
    let furthestSegmentIndex = -1;
    
    // Find the furthest segment
    for (const segment of this.segments) {
      const segmentStart = segment.mesh.position.z + this.segmentLength / 2;
      const segmentIndex = Math.floor(Math.abs(segmentStart) / this.segmentLength);
      
      if (segmentIndex > furthestSegmentIndex) {
        furthestSegmentIndex = segmentIndex;
      }
    }
    
    // Add segments if needed
    while (furthestSegmentIndex < aheadThreshold) {
      furthestSegmentIndex++;
      
      const z = -(furthestSegmentIndex * this.segmentLength);
      const position = new THREE.Vector3(0, 0, z);
      
      // Determine theme for this segment
      const segmentTheme = this.pendingTransition ? 
        this.calculateTransitionTheme(this.transitionProgress) : 
        this.currentTheme;
      
      const segment = new EnvironmentSegment(
        this.scene,
        segmentTheme,
        position,
        this.segmentLength,
        this.segmentWidth
      );
      
      this.segments.push(segment);
    }
  }
  
  // Consider random environment changes based on distance
  private considerEnvironmentChange(distanceTraveled: number) {
    // Don't change if we're already transitioning
    if (this.pendingTransition) return;
    
    // Don't change until minimum distance in current environment
    if (this.distanceSinceLastChange < this.currentTheme.minDistance) return;
    
    // Random chance to change, increases with distance
    const changeThreshold = Math.max(0.005, 0.02 - this.distanceSinceLastChange / 10000);
    
    if (Math.random() < changeThreshold) {
      // Choose a new environment type different from current
      const availableTypes = Object.keys(ENVIRONMENT_THEMES).filter(
        type => type !== this.currentEnvironmentType
      ) as EnvironmentType[];
      
      const newType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      
      // Start transition
      this.startEnvironmentTransition(newType, distanceTraveled);
    }
  }
  
  // Start transitioning to a new environment type
  private startEnvironmentTransition(newType: EnvironmentType, currentDistance: number) {
    this.pendingTransition = newType;
    this.transitionProgress = 0;
    this.transitionStartDistance = currentDistance;
    
    eventBus.emit('environment-change', {
      from: this.currentEnvironmentType,
      to: newType
    });
  }
  
  // Update environment transition
  private updateEnvironmentTransition(deltaTime: number, distanceTraveled: number) {
    if (!this.pendingTransition) return;
    
    const transitionTheme = ENVIRONMENT_THEMES[this.pendingTransition];
    const distance = distanceTraveled - this.transitionStartDistance;
    const transitionDistance = transitionTheme.transitionDuration * 10; // Convert to distance units
    
    this.transitionProgress = Math.min(1.0, distance / transitionDistance);
    
    // Apply interpolated theme
    const lerpedTheme = this.calculateTransitionTheme(this.transitionProgress);
    
    // Update scene with lerped theme
    this.scene.fog = new THREE.FogExp2(lerpedTheme.fogColor, lerpedTheme.fogDensity);
    this.scene.background = new THREE.Color(lerpedTheme.backgroundColor);
    
    // Update lighting
    this.scene.children.forEach(child => {
      if (child instanceof THREE.DirectionalLight) {
        child.intensity = lerpedTheme.lightIntensity;
      }
    });
    
    // If transition is complete, finalize
    if (this.transitionProgress >= 1.0) {
      this.applyEnvironmentTheme(transitionTheme);
      this.pendingTransition = null;
      this.distanceSinceLastChange = 0;
      
      eventBus.emit('environment-change-complete', {
        type: this.currentEnvironmentType
      });
    }
  }
  
  // Calculate interpolated theme during transition
  private calculateTransitionTheme(progress: number): EnvironmentTheme {
    if (!this.pendingTransition) return this.currentTheme;
    
    const fromTheme = this.currentTheme;
    const toTheme = ENVIRONMENT_THEMES[this.pendingTransition];
    
    // Linear interpolation between themes
    return {
      type: progress < 0.5 ? fromTheme.type : toTheme.type,
      backgroundColor: this.lerpColor(fromTheme.backgroundColor, toTheme.backgroundColor, progress),
      fogColor: this.lerpColor(fromTheme.fogColor, toTheme.fogColor, progress),
      fogDensity: THREE.MathUtils.lerp(fromTheme.fogDensity, toTheme.fogDensity, progress),
      lightIntensity: THREE.MathUtils.lerp(fromTheme.lightIntensity, toTheme.lightIntensity, progress),
      floorColor: this.lerpColor(fromTheme.floorColor, toTheme.floorColor, progress),
      floorRoughness: THREE.MathUtils.lerp(fromTheme.floorRoughness, toTheme.floorRoughness, progress),
      floorMetalness: THREE.MathUtils.lerp(fromTheme.floorMetalness, toTheme.floorMetalness, progress),
      decorationDensity: THREE.MathUtils.lerp(fromTheme.decorationDensity, toTheme.decorationDensity, progress),
      particleDensity: THREE.MathUtils.lerp(fromTheme.particleDensity, toTheme.particleDensity, progress),
      transitionDuration: toTheme.transitionDuration,
      minDistance: toTheme.minDistance
    };
  }
  
  // Lerp between two colors
  private lerpColor(colorA: number, colorB: number, alpha: number): number {
    const a = new THREE.Color(colorA);
    const b = new THREE.Color(colorB);
    
    const lerpedColor = new THREE.Color();
    lerpedColor.r = THREE.MathUtils.lerp(a.r, b.r, alpha);
    lerpedColor.g = THREE.MathUtils.lerp(a.g, b.g, alpha);
    lerpedColor.b = THREE.MathUtils.lerp(a.b, b.b, alpha);
    
    return lerpedColor.getHex();
  }
  
  // Get current environment type
  getCurrentEnvironment(): EnvironmentType {
    return this.currentEnvironmentType;
  }
  
  // Force a specific environment type
  setEnvironment(type: EnvironmentType) {
    const theme = ENVIRONMENT_THEMES[type];
    this.startEnvironmentTransition(type, this.lastDistanceTraveled);
  }
  
  // Clean up resources
  dispose() {
    // Clean up all segments
    this.segments.forEach(segment => {
      segment.dispose();
    });
    
    this.segments = [];
  }
}