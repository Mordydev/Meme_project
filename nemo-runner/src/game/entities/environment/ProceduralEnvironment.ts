import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';
import { WaterEffects } from './WaterEffects';

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
  // Coral and reef formations
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
    type: 'branchingCoral',
    scale: 1.3,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.9
  },
  {
    type: 'tubeCoral',
    scale: 0.8,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.7
  },
  {
    type: 'coralCluster',
    scale: 1.5,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.8
  },
  
  // Vegetation
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
    type: 'seaGrass',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.2,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'kelpForest'],
    probability: 1.2
  },
  {
    type: 'seaAnemone',
    scale: 0.7,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.6
  },
  {
    type: 'giantKelp',
    scale: 3.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['kelpForest'],
    probability: 1.8
  },
  
  // Rock formations
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
    type: 'rockFormation',
    scale: 1.6,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea', 'reef', 'openOcean'],
    probability: 0.7
  },
  {
    type: 'coralRock',
    scale: 1.2,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.9
  },
  
  // Shipwreck elements
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
    type: 'anchor',
    scale: 1.3,
    yOffset: -1.6,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.5
  },
  {
    type: 'shipHull',
    scale: 2.5,
    yOffset: -1.0,
    rotationVariance: Math.PI * 0.5,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.8
  },
  {
    type: 'barrel',
    scale: 0.7,
    yOffset: -1.7,
    rotationVariance: Math.PI,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.6
  },
  
  // Deep sea elements
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
    type: 'crystalFormation',
    scale: 1.1,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.3,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.7
  },
  {
    type: 'bioluminescentCoral',
    scale: 0.9,
    yOffset: -1.7,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.9
  },
  {
    type: 'abyssalRock',
    scale: 1.4,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.6
  },
  
  // Floating elements
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
  },
  {
    type: 'jellyfish',
    scale: 0.8,
    yOffset: 0.8,
    rotationVariance: Math.PI * 0.2,
    scaleVariance: 0.3,
    canFloatAboveGround: true,
    environmentTypes: ['openOcean', 'deepSea'],
    probability: 0.5
  },
  {
    type: 'bubbleStream',
    scale: 0.6,
    yOffset: -1.5,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.2,
    canFloatAboveGround: true,
    environmentTypes: ['reef', 'kelpForest', 'deepSea'],
    probability: 0.4
  },
  {
    type: 'floatingDebris',
    scale: 0.7,
    yOffset: 0.6,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.4,
    canFloatAboveGround: true,
    environmentTypes: ['shipwreck', 'openOcean'],
    probability: 0.4
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
  
  // Cached geometries and materials for decoration types
  private decorationCache: Map<string, {
    geometry?: THREE.BufferGeometry,
    material?: THREE.Material | THREE.Material[],
    instance?: THREE.InstancedMesh
  }> = new Map();
  
  // Device-specific quality settings
  private qualitySettings: {
    useInstancing: boolean;
    maxInstancesPerType: number;
    useLOD: boolean;
    maxPolygonsPerDecoration: number;
    cullingDistance: number;
  };
  
  // Track instanced meshes by type
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private instanceMatrices: Map<string, Float32Array> = new Map();
  private instanceCount: Map<string, number> = new Map();
  
  // Function to initialize instanced meshes for types that benefit from instancing
  private initInstancedMeshes() {
    // Create instanced meshes for common decoration types
    const instanceTypes = [
      'coral1', 'coral2', 'seaweed1', 'seaGrass', 'rock1', 'rock2',
      'floatingPlankton', 'schoolOfFish'
    ];
    
    instanceTypes.forEach(type => {
      // Create a template decoration to get the geometry and material
      const definition = DECORATION_DEFINITIONS.find(def => def.type === type);
      if (!definition) return;
      
      let templateMesh: THREE.Mesh | THREE.Group;
      
      // Create the template based on type
      switch (type) {
        case 'coral1': templateMesh = this.createCoral1(definition) as THREE.Group; break;
        case 'coral2': templateMesh = this.createCoral2(definition) as THREE.Group; break;
        case 'seaweed1': templateMesh = this.createSeaweed1(definition) as THREE.Group; break;
        case 'seaGrass': templateMesh = this.createSeaGrass(definition) as THREE.Group; break;
        case 'rock1': case 'rock2': templateMesh = this.createRock(definition) as THREE.Mesh; break;
        case 'floatingPlankton': templateMesh = this.createFloatingPlankton(definition) as THREE.Group; break;
        case 'schoolOfFish': templateMesh = this.createSchoolOfFish(definition) as THREE.Group; break;
        default: return;
      }
      
      // Extract geometry and material from first mesh if it's a group
      let geometry, material;
      
      if (templateMesh instanceof THREE.Mesh) {
        geometry = templateMesh.geometry;
        material = templateMesh.material;
      } else if (templateMesh instanceof THREE.Group && templateMesh.children.length > 0) {
        const firstChild = templateMesh.children[0];
        if (firstChild instanceof THREE.Mesh) {
          geometry = firstChild.geometry;
          material = firstChild.material;
        }
      }
      
      // Cache the geometry and material
      if (geometry && material) {
        this.decorationCache.set(type, { geometry, material });
        
        // Create instanced mesh with maximum instances
        const maxInstances = this.qualitySettings.maxInstancesPerType;
        const instancedMesh = new THREE.InstancedMesh(
          geometry, 
          material instanceof THREE.Material ? material : material[0], 
          maxInstances
        );
        instancedMesh.count = 0; // Start with zero instances
        instancedMesh.frustumCulled = true;
        
        // Store the instanced mesh
        this.instancedMeshes.set(type, instancedMesh);
        this.instanceCount.set(type, 0);
        
        // Create matrix array for instance transforms
        this.instanceMatrices.set(type, new Float32Array(maxInstances * 16));
      }
    });
  }
  
  // Create a decoration mesh with optimizations
  private createDecoration(definition: DecorationDefinition): THREE.Group | THREE.Mesh {
    // Check if we can use instancing for this decoration type
    if (this.qualitySettings.useInstancing && this.instancedMeshes.has(definition.type)) {
      // Check if we've reached the instance limit
      const instancedMesh = this.instancedMeshes.get(definition.type)!;
      const currentCount = this.instanceCount.get(definition.type)!;
      
      if (currentCount < this.qualitySettings.maxInstancesPerType) {
        // Create a matrix for the instance transform
        const matrix = new THREE.Matrix4();
        
        // Scale with variation
        const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
        const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
        matrix.makeScale(finalScale, finalScale, finalScale);
        
        // Apply random rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(Math.random() * definition.rotationVariance);
        matrix.multiply(rotationMatrix);
        
        // Set instance matrix
        instancedMesh.setMatrixAt(currentCount, matrix);
        
        // Increase count
        this.instanceCount.set(definition.type, currentCount + 1);
        instancedMesh.count = currentCount + 1;
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Create a dummy object for positioning, the actual rendering will use the instanced mesh
        const dummyObj = new THREE.Group();
        dummyObj.userData.isInstancedDecorationReference = true;
        dummyObj.userData.instanceType = definition.type;
        dummyObj.userData.instanceIndex = currentCount;
        
        return dummyObj;
      }
    }
    
    // If instancing is not possible or instance limit reached, fall back to individual meshes
    // Decoration type will determine what kind of mesh to create
    switch (definition.type) {
      // Coral and reef formations
      case 'coral1':
        return this.createCoral1(definition);
      case 'coral2':
        return this.createCoral2(definition);
      case 'branchingCoral':
        return this.createBranchingCoral(definition);
      case 'tubeCoral':
        return this.createTubeCoral(definition);
      case 'coralCluster':
        return this.createCoralCluster(definition);
        
      // Vegetation
      case 'seaweed1':
        return this.createSeaweed1(definition);
      case 'kelpStalk':
        return this.createKelpStalk(definition);
      case 'seaGrass':
        return this.createSeaGrass(definition);
      case 'seaAnemone':
        return this.createSeaAnemone(definition);
      case 'giantKelp':
        return this.createGiantKelp(definition);
        
      // Rock formations
      case 'rock1':
      case 'rock2':
        return this.createRock(definition);
      case 'rockFormation':
        return this.createRockFormation(definition);
      case 'coralRock':
        return this.createCoralRock(definition);
        
      // Shipwreck elements
      case 'shipPart':
        return this.createShipPart(definition);
      case 'treasure':
        return this.createTreasure(definition);
      case 'anchor':
        return this.createAnchor(definition);
      case 'shipHull':
        return this.createShipHull(definition);
      case 'barrel':
        return this.createBarrel(definition);
        
      // Deep sea elements
      case 'deepsea_vent':
        return this.createDeepSeaVent(definition);
      case 'glowingPlant':
        return this.createGlowingPlant(definition);
      case 'crystalFormation':
        return this.createCrystalFormation(definition);
      case 'bioluminescentCoral':
        return this.createBioluminescentCoral(definition);
      case 'abyssalRock':
        return this.createAbyssalRock(definition);
        
      // Floating elements
      case 'floatingPlankton':
        return this.createFloatingPlankton(definition);
      case 'schoolOfFish':
        return this.createSchoolOfFish(definition);
      case 'jellyfish':
        return this.createJellyfish(definition);
      case 'bubbleStream':
        return this.createBubbleStream(definition);
      case 'floatingDebris':
        return this.createFloatingDebris(definition);
        
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
  
  private createBranchingCoral(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create branching coral formation
    const branchCount = 5 + Math.floor(Math.random() * 5); // 5-9 branches
    
    // Random coral color - pinkish/reddish
    const baseColor = new THREE.Color(
      0.8 + Math.random() * 0.2, // High red
      0.2 + Math.random() * 0.3, // Low-medium green
      0.4 + Math.random() * 0.3  // Medium blue
    );
    
    // Create base cylinder
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().multiplyScalar(0.8), // Darker
      roughness: 0.9,
      metalness: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.2;
    group.add(base);
    
    // Create branches
    for (let i = 0; i < branchCount; i++) {
      // Calculate branching angle
      const angle = (i / branchCount) * Math.PI * 2;
      const branchLength = 0.6 + Math.random() * 0.8;
      
      // Branch geometry - thin at tip, wider at base
      const branchGeometry = new THREE.CylinderGeometry(0.03, 0.08, branchLength, 6);
      
      // Slight color variation for each branch
      const branchColor = baseColor.clone();
      branchColor.r += (Math.random() - 0.5) * 0.1;
      branchColor.g += (Math.random() - 0.5) * 0.1;
      branchColor.b += (Math.random() - 0.5) * 0.1;
      
      const branchMaterial = new THREE.MeshStandardMaterial({
        color: branchColor,
        roughness: 0.7,
        metalness: 0.2
      });
      
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      // Position branch at angle
      const radius = 0.15;
      branch.position.set(
        Math.cos(angle) * radius,
        0.4 + branchLength/2, // Position on top of base
        Math.sin(angle) * radius
      );
      
      // Angle the branch outward
      const outwardAngle = 0.3 + Math.random() * 0.4; // 0.3-0.7 radians
      branch.rotation.x = Math.cos(angle) * outwardAngle;
      branch.rotation.z = Math.sin(angle) * outwardAngle;
      
      group.add(branch);
      
      // Add smaller sub-branches to some of the main branches
      if (Math.random() > 0.5) {
        const subBranchCount = 1 + Math.floor(Math.random() * 3); // 1-3 sub-branches
        
        for (let j = 0; j < subBranchCount; j++) {
          const subBranchLength = branchLength * 0.4;
          const subBranchGeometry = new THREE.CylinderGeometry(0.01, 0.04, subBranchLength, 5);
          const subBranch = new THREE.Mesh(subBranchGeometry, branchMaterial);
          
          // Position sub-branch halfway up the main branch
          const subBranchGroup = new THREE.Group();
          subBranchGroup.position.copy(branch.position);
          subBranchGroup.rotation.copy(branch.rotation);
          
          // Place sub-branch offset from main branch center
          subBranch.position.y = 0.1;
          
          // Angle sub-branch outward and to the side
          const subAngle = (Math.random() - 0.5) * Math.PI; // Random angle
          subBranch.rotation.x = 0.3 + Math.random() * 0.3;
          subBranch.rotation.z = subAngle;
          
          subBranchGroup.add(subBranch);
          group.add(subBranchGroup);
        }
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
  
  private createTubeCoral(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Base material for the coral tubes
    const tubeCount = 5 + Math.floor(Math.random() * 8); // 5-12 tubes
    
    // Random tube coral color - usually blue/purple
    const baseColor = new THREE.Color(
      0.3 + Math.random() * 0.3, // Low-medium red
      0.1 + Math.random() * 0.3, // Low green
      0.6 + Math.random() * 0.4  // High blue
    );
    
    // Create base mound
    const baseGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    baseGeometry.scale(1, 0.5, 1); // Flatten into a mound
    
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().multiplyScalar(0.7), // Darker base
      roughness: 0.9,
      metalness: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.2;
    group.add(base);
    
    // Create tubes
    for (let i = 0; i < tubeCount; i++) {
      // Calculate position on the mound
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.3;
      const tubeHeight = 0.4 + Math.random() * 0.6;
      
      // Create tube with hole
      const outerRadius = 0.04 + Math.random() * 0.04;
      const innerRadius = outerRadius * 0.6;
      const tubeGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, tubeHeight, 8, 1, true);
      
      // Slight color variation for each tube
      const tubeColor = baseColor.clone();
      tubeColor.r += (Math.random() - 0.5) * 0.1;
      tubeColor.g += (Math.random() - 0.5) * 0.1;
      tubeColor.b += (Math.random() - 0.5) * 0.1;
      
      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: tubeColor,
        roughness: 0.7,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      
      // Position tube on the mound
      tube.position.set(
        Math.cos(angle) * radius,
        0.2 + tubeHeight/2, // Half height above mound
        Math.sin(angle) * radius
      );
      
      // Angle tubes slightly outward
      const outwardAngle = 0.1 + Math.random() * 0.2;
      tube.rotation.x = Math.cos(angle) * outwardAngle;
      tube.rotation.z = Math.sin(angle) * outwardAngle;
      
      group.add(tube);
      
      // Add cap to tube
      const capGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 8);
      const cap = new THREE.Mesh(capGeometry, tubeMaterial);
      
      // Position cap at the top of the tube
      cap.position.copy(tube.position);
      cap.position.y += tubeHeight/2;
      cap.rotation.x = Math.PI/2; // Rotate to be horizontal
      
      // Apply same rotation as tube
      cap.rotation.x += tube.rotation.x;
      cap.rotation.z += tube.rotation.z;
      
      group.add(cap);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createCoralCluster(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a diverse cluster of different coral types
    const elementCount = 6 + Math.floor(Math.random() * 5); // 6-10 coral elements
    
    // Create a base rock
    const baseGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    baseGeometry.scale(1, 0.5, 1); // Flatten into a mound
    
    // Apply some noise to make it more rock-like
    if (baseGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = baseGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.3;
      }
      
      baseGeometry.attributes.position.needsUpdate = true;
      baseGeometry.computeVertexNormals();
    }
    
    // Dark rock/sand color
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.3;
    group.add(base);
    
    // Add various coral elements to the base
    for (let i = 0; i < elementCount; i++) {
      // Determine coral type for this element
      const coralType = Math.floor(Math.random() * 5); // 0-4 different types
      let coralElement: THREE.Mesh | THREE.Group;
      
      // Random position on the base
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;
      const posX = Math.cos(angle) * radius;
      const posZ = Math.sin(angle) * radius;
      
      // Common colors
      const redCoral = new THREE.Color(0xb24c63);
      const orangeCoral = new THREE.Color(0xe76f51);
      const purpleCoral = new THREE.Color(0x8a5e99);
      const blueCoral = new THREE.Color(0x219ebc);
      
      // Create coral element based on type
      switch (coralType) {
        case 0: // Fan coral
          const fanWidth = 0.2 + Math.random() * 0.3;
          const fanHeight = 0.3 + Math.random() * 0.4;
          const fanGeometry = new THREE.PlaneGeometry(fanWidth, fanHeight, 4, 6);
          
          // Add some undulation to the fan
          if (fanGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = fanGeometry.attributes.position.array;
            for (let j = 0; j < positions.length / 3; j++) {
              const x = positions[j * 3];
              const y = positions[j * 3 + 1];
              positions[j * 3 + 2] = Math.sin(x * 10) * Math.sin(y * 10) * 0.05;
            }
            fanGeometry.attributes.position.needsUpdate = true;
            fanGeometry.computeVertexNormals();
          }
          
          const fanMaterial = new THREE.MeshStandardMaterial({
            color: purpleCoral.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2),
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
          });
          
          coralElement = new THREE.Mesh(fanGeometry, fanMaterial);
          coralElement.rotation.y = Math.random() * Math.PI;
          break;
          
        case 1: // Small brain coral
          const brainSize = 0.1 + Math.random() * 0.15;
          const brainGeometry = new THREE.SphereGeometry(brainSize, 8, 8);
          
          // Add wrinkles
          if (brainGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = brainGeometry.attributes.position.array;
            for (let j = 0; j < positions.length / 3; j++) {
              const x = positions[j * 3];
              const y = positions[j * 3 + 1];
              const z = positions[j * 3 + 2];
              
              positions[j * 3] += Math.sin(x * 50) * 0.03;
              positions[j * 3 + 1] += Math.sin(y * 50) * 0.03;
              positions[j * 3 + 2] += Math.sin(z * 50) * 0.03;
            }
            brainGeometry.attributes.position.needsUpdate = true;
            brainGeometry.computeVertexNormals();
          }
          
          const brainMaterial = new THREE.MeshStandardMaterial({
            color: orangeCoral.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2),
            roughness: 0.7,
            metalness: 0.3
          });
          
          coralElement = new THREE.Mesh(brainGeometry, brainMaterial);
          break;
          
        case 2: // Branching twigs
          const twigGroup = new THREE.Group();
          const twigCount = 2 + Math.floor(Math.random() * 3);
          
          for (let j = 0; j < twigCount; j++) {
            const twigHeight = 0.2 + Math.random() * 0.3;
            const twigGeometry = new THREE.CylinderGeometry(0.01, 0.02, twigHeight, 5);
            
            const twigMaterial = new THREE.MeshStandardMaterial({
              color: redCoral.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.3),
              roughness: 0.7,
              metalness: 0.2
            });
            
            const twig = new THREE.Mesh(twigGeometry, twigMaterial);
            twig.position.y = twigHeight / 2;
            twig.rotation.x = (Math.random() - 0.5) * 0.5;
            twig.rotation.z = (Math.random() - 0.5) * 0.5;
            
            twigGroup.add(twig);
          }
          
          coralElement = twigGroup;
          break;
          
        case 3: // Small tube cluster
          const tubeGroup = new THREE.Group();
          const smallTubeCount = 3 + Math.floor(Math.random() * 3);
          
          for (let j = 0; j < smallTubeCount; j++) {
            const tubeHeight = 0.15 + Math.random() * 0.2;
            const tubeRadius = 0.02 + Math.random() * 0.02;
            const tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 6, 1, true);
            
            const tubeMaterial = new THREE.MeshStandardMaterial({
              color: blueCoral.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2),
              roughness: 0.7,
              metalness: 0.2,
              side: THREE.DoubleSide
            });
            
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            tube.position.set(
              (Math.random() - 0.5) * 0.1,
              tubeHeight / 2,
              (Math.random() - 0.5) * 0.1
            );
            
            const ringGeometry = new THREE.RingGeometry(tubeRadius * 0.6, tubeRadius, 6);
            const ring = new THREE.Mesh(ringGeometry, tubeMaterial);
            ring.position.copy(tube.position);
            ring.position.y += tubeHeight / 2;
            ring.rotation.x = Math.PI / 2;
            
            tubeGroup.add(tube);
            tubeGroup.add(ring);
          }
          
          coralElement = tubeGroup;
          break;
          
        case 4: // Encrusting coral patch
          const patchRadius = 0.1 + Math.random() * 0.15;
          const patchGeometry = new THREE.CircleGeometry(patchRadius, 8);
          
          // Add some texture
          if (patchGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = patchGeometry.attributes.position.array;
            for (let j = 0; j < positions.length / 3; j++) {
              const x = positions[j * 3];
              const y = positions[j * 3 + 1];
              positions[j * 3 + 2] = Math.sin(x * 20) * Math.sin(y * 20) * 0.02;
            }
            patchGeometry.attributes.position.needsUpdate = true;
            patchGeometry.computeVertexNormals();
          }
          
          const patchMaterial = new THREE.MeshStandardMaterial({
            color: redCoral.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2),
            roughness: 0.8,
            metalness: 0.1
          });
          
          coralElement = new THREE.Mesh(patchGeometry, patchMaterial);
          coralElement.rotation.x = -Math.PI / 2; // Lay flat on rock surface
          break;
          
        default:
          // Default case should never be reached
          coralElement = new THREE.Group();
      }
      
      // Position on the base
      coralElement.position.set(posX, 0.3, posZ);
      group.add(coralElement);
    }
    
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
  
  private createSeaGrass(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create several sea grass blades
    const bladeCount = 8 + Math.floor(Math.random() * 8); // 8-15 blades
    
    // Green color with variations
    const baseColor = new THREE.Color(0x2d9d6d); // Base seagrass green
    
    for (let i = 0; i < bladeCount; i++) {
      // Create a single blade as a plane with curve
      const height = 0.5 + Math.random() * 0.8;
      const width = 0.05 + Math.random() * 0.07;
      
      const bladeGeometry = new THREE.PlaneGeometry(width, height, 1, 6);
      
      // Apply gentle curve to blade
      if (bladeGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = bladeGeometry.attributes.position.array;
        
        for (let j = 0; j < positions.length / 3; j++) {
          const y = positions[j * 3 + 1];
          const normalizedY = (y / height + 0.5); // Convert to 0-1 range
          
          // Apply S-curve with more bend at top
          const curveAmount = 0.1 * (normalizedY * normalizedY);
          positions[j * 3] += Math.sin(normalizedY * Math.PI) * curveAmount;
        }
        
        bladeGeometry.attributes.position.needsUpdate = true;
        bladeGeometry.computeVertexNormals();
      }
      
      // Slight color variation for each blade
      const bladeColor = baseColor.clone();
      bladeColor.r += (Math.random() - 0.5) * 0.05;
      bladeColor.g += (Math.random() - 0.5) * 0.1;
      bladeColor.b += (Math.random() - 0.5) * 0.05;
      
      const bladeMaterial = new THREE.MeshStandardMaterial({
        color: bladeColor,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      
      // Position blade in circular arrangement
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.2;
      blade.position.set(
        Math.cos(angle) * radius,
        height / 2, // Blade height at half
        Math.sin(angle) * radius
      );
      
      // Random rotation
      blade.rotation.y = Math.random() * Math.PI;
      
      // Slight tilt
      blade.rotation.x = (Math.random() - 0.5) * 0.1;
      blade.rotation.z = (Math.random() - 0.5) * 0.1;
      
      // Set name for animation identification
      blade.name = 'seagrass_blade';
      
      group.add(blade);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createSeaAnemone(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create sea anemone - base and tentacles
    
    // Create base cylinder
    const baseRadius = 0.2;
    const baseHeight = 0.3;
    const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius * 1.2, baseHeight, 12);
    
    // Random anemone colors - commonly red, orange, or purple
    const colorType = Math.floor(Math.random() * 3);
    let baseColor: THREE.Color;
    
    switch (colorType) {
      case 0: // Red
        baseColor = new THREE.Color(0xc1121f);
        break;
      case 1: // Orange
        baseColor = new THREE.Color(0xff8800);
        break;
      case 2: // Purple
        baseColor = new THREE.Color(0x9d4edd);
        break;
      default:
        baseColor = new THREE.Color(0xc1121f);
    }
    
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = baseHeight / 2;
    group.add(base);
    
    // Add tentacles
    const tentacleCount = 15 + Math.floor(Math.random() * 10); // 15-24 tentacles
    
    // Tentacles material - slightly lighter than base
    const tentacleColor = baseColor.clone().offsetHSL(0, 0, 0.1);
    const tentacleMaterial = new THREE.MeshStandardMaterial({
      color: tentacleColor,
      roughness: 0.7,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9
    });
    
    for (let i = 0; i < tentacleCount; i++) {
      // Calculate position on the top of the base
      const angle = (i / tentacleCount) * Math.PI * 2;
      const tentacleRadius = baseRadius * (0.7 + Math.random() * 0.3);
      
      // Create tentacle
      const tentacleHeight = 0.3 + Math.random() * 0.4;
      const tentacleThickness = 0.02 + Math.random() * 0.02;
      
      const tentacleGeometry = new THREE.CylinderGeometry(
        tentacleThickness * 0.5, // Thinner at top
        tentacleThickness,
        tentacleHeight,
        5
      );
      
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      
      // Position tentacle on the top edge of base
      tentacle.position.set(
        Math.cos(angle) * tentacleRadius,
        baseHeight + tentacleHeight / 2,
        Math.sin(angle) * tentacleRadius
      );
      
      // Angle tentacles outward slightly
      const outwardAngle = 0.1 + Math.random() * 0.3;
      tentacle.rotation.x = Math.cos(angle) * outwardAngle;
      tentacle.rotation.z = Math.sin(angle) * outwardAngle;
      
      // Set name for animation
      tentacle.name = 'anemone_tentacle';
      
      group.add(tentacle);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createGiantKelp(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a large kelp plant with main stalk and many leaves
    const kelpHeight = 4.0 + Math.random() * 3.0; // 4-7 units tall
    
    // Define materials
    const stalkColor = new THREE.Color(0x3b5221); // Dark green
    const leafColor = new THREE.Color(0x4d7c30);  // Lighter green
    
    const stalkMaterial = new THREE.MeshStandardMaterial({
      color: stalkColor,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: leafColor,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    
    // Create main stalk with segments
    const segmentCount = Math.floor(kelpHeight / 0.5); // One segment every 0.5 units
    const segmentHeight = kelpHeight / segmentCount;
    
    // Previous segment end position for connecting segments
    let prevTop = new THREE.Vector3(0, 0, 0);
    let prevDirection = new THREE.Vector3(0, 1, 0); // Start growing upward
    
    for (let i = 0; i < segmentCount; i++) {
      // Vary the thickness of the stalk, thinner at the top
      const topThickness = 0.08 * (1 - i / segmentCount * 0.7);
      const bottomThickness = 0.08 * (1 - (i - 0.5) / segmentCount * 0.7);
      
      // Create segment geometry
      const segmentGeometry = new THREE.CylinderGeometry(
        topThickness, 
        bottomThickness, 
        segmentHeight, 
        6
      );
      
      const segment = new THREE.Mesh(segmentGeometry, stalkMaterial);
      
      // Position the segment to connect with the previous one
      segment.position.copy(prevTop);
      segment.position.y += segmentHeight / 2;
      
      // Add gentle curve to the kelp stalk - more pronounced as we go up
      const curveStrength = 0.05 * (i / segmentCount);
      
      // Calculate random sway direction for this segment
      const swayAngle = (Math.sin(i * 0.5) + Math.random() * 0.5) * curveStrength;
      
      // Calculate new growth direction with slight randomness
      const newDirection = new THREE.Vector3(
        prevDirection.x + swayAngle,
        1,
        prevDirection.z + swayAngle
      ).normalize();
      
      // Make the segment point in the new direction
      segment.lookAt(
        segment.position.clone().add(newDirection.multiplyScalar(segmentHeight))
      );
      
      group.add(segment);
      
      // Update prevTop for next segment
      const topOfSegment = new THREE.Vector3(0, segmentHeight / 2, 0);
      topOfSegment.applyQuaternion(segment.quaternion);
      topOfSegment.add(segment.position);
      
      prevTop = topOfSegment;
      prevDirection = newDirection;
      
      // Add leaves on alternating sides every few segments
      if (i > 0 && i % 2 === 0 && i < segmentCount - 1) {
        // Add a pair of leaves
        this.addKelpLeaves(segment, leafMaterial);
      }
    }
    
    // Add bulb at the top with air bladder
    const bulbGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const bulb = new THREE.Mesh(bulbGeometry, leafMaterial);
    bulb.position.copy(prevTop);
    group.add(bulb);
    
    // Add final leaves at the top
    const topLeafCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < topLeafCount; i++) {
      const leafAngle = (i / topLeafCount) * Math.PI * 2;
      const leaf = this.createKelpLeaf(leafMaterial, 0.7 + Math.random() * 0.5); // Larger top leaves
      
      leaf.position.copy(prevTop);
      leaf.rotation.set(
        Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        leafAngle,
        (Math.random() - 0.5) * 0.3
      );
      
      group.add(leaf);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation around Y axis
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private addKelpLeaves(segment: THREE.Mesh, material: THREE.Material): void {
    // Add a pair of leaves to the given segment
    const leafLeft = this.createKelpLeaf(material);
    const leafRight = this.createKelpLeaf(material);
    
    // Position leaves at segment midpoint
    leafLeft.position.copy(segment.position);
    leafRight.position.copy(segment.position);
    
    // Rotate leaves to point in opposite directions
    leafLeft.rotation.set(
      Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      Math.PI / 2 + (Math.random() - 0.5) * 0.3,
      0
    );
    
    leafRight.rotation.set(
      Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      -Math.PI / 2 + (Math.random() - 0.5) * 0.3,
      0
    );
    
    // Apply segment rotation to leaves
    leafLeft.setRotationFromQuaternion(
      segment.quaternion.clone().multiply(leafLeft.quaternion)
    );
    
    leafRight.setRotationFromQuaternion(
      segment.quaternion.clone().multiply(leafRight.quaternion)
    );
    
    segment.parent?.add(leafLeft);
    segment.parent?.add(leafRight);
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
  
  private createKelpLeaf(material: THREE.Material, sizeFactor: number = 1.0): THREE.Mesh {
    const shape = new THREE.Shape();
    
    // Create a leaf shape
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.2 * sizeFactor, 0.3 * sizeFactor, 0.6 * sizeFactor, 0.5 * sizeFactor, 1.0 * sizeFactor, 0.4 * sizeFactor);
    shape.bezierCurveTo(0.8 * sizeFactor, 0.1 * sizeFactor, 0.5 * sizeFactor, -0.2 * sizeFactor, 0, 0);
    
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
  
  private createRockFormation(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a formation with multiple rocks
    const rockCount = 3 + Math.floor(Math.random() * 4); // 3-6 rocks
    
    // Create rocks of varying sizes arranged together
    for (let i = 0; i < rockCount; i++) {
      // Create a rock with varying shape
      const rockType = Math.floor(Math.random() * 3);
      let rockGeometry: THREE.BufferGeometry;
      
      switch (rockType) {
        case 0:
          // Standard rock
          rockGeometry = new THREE.DodecahedronGeometry(0.4, 1);
          break;
        case 1:
          // More complex rock
          rockGeometry = new THREE.IcosahedronGeometry(0.4, 1);
          break;
        case 2:
          // Simpler rock
          rockGeometry = new THREE.OctahedronGeometry(0.4, 1);
          break;
        default:
          rockGeometry = new THREE.DodecahedronGeometry(0.4, 1);
      }
      
      // Add random noise to vertices
      if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let j = 0; j < positions.length / 3; j++) {
          positions[j * 3] *= 1 + (Math.random() - 0.5) * 0.4;
          positions[j * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.4;
          positions[j * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.4;
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Random rock color with slight variations
      const baseShade = 0.25 + Math.random() * 0.3; // Dark to medium
      const colorVariance = 0.05;
      
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          baseShade + (Math.random() - 0.5) * colorVariance,
          baseShade + (Math.random() - 0.5) * colorVariance,
          baseShade + (Math.random() - 0.5) * colorVariance
        ),
        roughness: 0.9,
        metalness: 0.1
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Position rocks in a cluster
      if (i === 0) {
        // Center rock
        rock.position.set(0, 0, 0);
        rock.scale.setScalar(1.2); // Larger center rock
      } else {
        // Surrounding rocks
        const angle = (i / (rockCount - 1)) * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.2;
        rock.position.set(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 0.3, // Slight height variation
          Math.sin(angle) * radius
        );
        
        // Random sizes for outer rocks
        const rockScale = 0.6 + Math.random() * 0.6;
        rock.scale.setScalar(rockScale);
      }
      
      // Random rotation
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      group.add(rock);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createCoralRock(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a base rock
    const rockGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    
    // Deform the rock to be more natural
    if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = rockGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] *= 0.7 + (Math.random() - 0.5) * 0.2; // Flatten a bit
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.3;
      }
      
      rockGeometry.attributes.position.needsUpdate = true;
      rockGeometry.computeVertexNormals();
    }
    
    // Rock material
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555, // Medium gray
      roughness: 0.9,
      metalness: 0.1
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.y = 0.3; // Raise slightly
    group.add(rock);
    
    // Add coral patches to the rock surface
    const coralCount = 5 + Math.floor(Math.random() * 6); // 5-10 coral elements
    
    // Coral colors
    const coralColors = [
      new THREE.Color(0xe63946), // Red
      new THREE.Color(0xf4a261), // Orange
      new THREE.Color(0x90be6d), // Green
      new THREE.Color(0x8338ec)  // Purple
    ];
    
    for (let i = 0; i < coralCount; i++) {
      // Choose coral type
      const coralType = Math.floor(Math.random() * 3);
      let coralGeometry: THREE.BufferGeometry;
      
      switch (coralType) {
        case 0:
          // Tube coral
          const tubeRadius = 0.05 + Math.random() * 0.05;
          const tubeHeight = 0.1 + Math.random() * 0.15;
          coralGeometry = new THREE.CylinderGeometry(tubeRadius * 0.7, tubeRadius, tubeHeight, 8);
          break;
        case 1:
          // Brain coral
          coralGeometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8);
          
          // Add wrinkles
          if (coralGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = coralGeometry.attributes.position.array;
            for (let j = 0; j < positions.length / 3; j++) {
              const x = positions[j * 3];
              const y = positions[j * 3 + 1];
              const z = positions[j * 3 + 2];
              
              positions[j * 3] += Math.sin(x * 40) * 0.01;
              positions[j * 3 + 1] += Math.sin(y * 40) * 0.01;
              positions[j * 3 + 2] += Math.sin(z * 40) * 0.01;
            }
            coralGeometry.attributes.position.needsUpdate = true;
            coralGeometry.computeVertexNormals();
          }
          break;
        case 2:
          // Encrusting coral patch
          coralGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.08, 8);
          break;
        default:
          coralGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      }
      
      // Random coral color
      const colorIndex = Math.floor(Math.random() * coralColors.length);
      const coralColor = coralColors[colorIndex].clone();
      
      // Add slight color variation
      coralColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      
      const coralMaterial = new THREE.MeshStandardMaterial({
        color: coralColor,
        roughness: 0.7,
        metalness: 0.2
      });
      
      const coral = new THREE.Mesh(coralGeometry, coralMaterial);
      
      // Position on rock surface at random
      // Calculate position on a sphere
      const phi = Math.random() * Math.PI; // 0 to π
      const theta = Math.random() * Math.PI * 2; // 0 to 2π
      
      // Avoid placing on bottom of rock
      const y = Math.cos(phi);
      if (y < -0.3) phi = Math.random() * Math.PI * 0.7; // Recalculate to avoid bottom
      
      const rockRadius = 0.5;
      coral.position.set(
        rockRadius * Math.sin(phi) * Math.cos(theta),
        rockRadius * Math.cos(phi) + 0.3, // Add the rock's y-offset
        rockRadius * Math.sin(phi) * Math.sin(theta)
      );
      
      // Orient normal to surface
      coral.lookAt(new THREE.Vector3(0, 0.3, 0)); // Look at rock center
      
      // For encrusting type, rotate to lie flat against rock
      if (coralType === 2) {
        coral.rotateX(Math.PI / 2); // Rotate to lie against the rock
      }
      
      group.add(coral);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
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
  
  private createAnchor(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Rusty anchor material
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a, // Dark metallic gray with rust tint
      roughness: 0.8,
      metalness: 0.6
    });
    
    // Add rust patches 
    const rustMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Rusty brown
      roughness: 0.9,
      metalness: 0.2
    });
    
    // Main vertical shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8);
    const shaft = new THREE.Mesh(shaftGeometry, metalMaterial);
    group.add(shaft);
    
    // Top ring
    const ringGeometry = new THREE.TorusGeometry(0.15, 0.04, 8, 16);
    const ring = new THREE.Mesh(ringGeometry, metalMaterial);
    ring.position.set(0, 0.7, 0);
    // Add random rotation to the ring
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    
    // Cross beam at bottom
    const crossBeamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const crossBeam = new THREE.Mesh(crossBeamGeometry, metalMaterial);
    crossBeam.position.set(0, -0.55, 0);
    crossBeam.rotation.z = Math.PI / 2;
    group.add(crossBeam);
    
    // Arms (curved)
    const createArm = (isLeft: boolean) => {
      // Create a curved arm using a custom shape
      const armGroup = new THREE.Group();
      
      // Main arm segment (cylinder)
      const armGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 8);
      const arm = new THREE.Mesh(armGeometry, metalMaterial);
      
      // Position at the end of the cross beam
      arm.position.set(isLeft ? -0.4 : 0.4, -0.55, 0);
      // Rotate to curve outward
      arm.rotation.z = isLeft ? Math.PI / 4 : -Math.PI / 4;
      
      armGroup.add(arm);
      
      // Add a fluke (triangular tip)
      const flukeGeometry = new THREE.ConeGeometry(0.12, 0.25, 4);
      const fluke = new THREE.Mesh(flukeGeometry, metalMaterial);
      
      // Position at the end of the arm
      fluke.position.set(
        isLeft ? -0.6 : 0.6,
        -0.8,
        0
      );
      
      // Rotate to point outward
      fluke.rotation.z = isLeft ? Math.PI / 1.5 : -Math.PI / 1.5;
      
      armGroup.add(fluke);
      
      // Add rust patches to the arm
      const rustPatchCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < rustPatchCount; i++) {
        const patchSize = 0.05 + Math.random() * 0.05;
        const patchGeometry = new THREE.SphereGeometry(patchSize, 4, 4);
        const rustPatch = new THREE.Mesh(patchGeometry, rustMaterial);
        
        // Position along the arm
        const patchX = isLeft ? (-0.4 - Math.random() * 0.2) : (0.4 + Math.random() * 0.2);
        const patchY = -0.55 - Math.random() * 0.3;
        rustPatch.position.set(patchX, patchY, (Math.random() - 0.5) * 0.1);
        
        // Flatten the rust patch
        rustPatch.scale.set(1, 0.2, 1);
        
        armGroup.add(rustPatch);
      }
      
      return armGroup;
    };
    
    // Add both arms
    group.add(createArm(true)); // Left arm
    group.add(createArm(false)); // Right arm
    
    // Add some rust patches to the main shaft and ring
    const mainRustCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < mainRustCount; i++) {
      const patchSize = 0.05 + Math.random() * 0.1;
      const patchGeometry = new THREE.SphereGeometry(patchSize, 4, 4);
      const rustPatch = new THREE.Mesh(patchGeometry, rustMaterial);
      
      // Random position on the shaft
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 1.2;
      const radius = 0.07;
      
      rustPatch.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      // Flatten the rust patch against the surface
      rustPatch.scale.set(1, 0.2, 1);
      
      // Orient the patch to face outward
      rustPatch.lookAt(new THREE.Vector3(
        Math.cos(angle) * (radius + 1),
        height,
        Math.sin(angle) * (radius + 1)
      ));
      
      group.add(rustPatch);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createShipHull(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a section of ship hull
    const hullLength = 2.5;
    const hullWidth = 1.0;
    const hullHeight = 1.2;
    
    // Basic hull shape - use a box for the main hull
    const hullGeometry = new THREE.BoxGeometry(hullWidth, hullHeight, hullLength);
    
    // Modify to create ship-like hull curve
    if (hullGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = hullGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Taper front and back
        if (Math.abs(z) > hullLength * 0.3) {
          const taperFactor = 1.0 - (Math.abs(z) - hullLength * 0.3) / (hullLength * 0.5);
          positions[i * 3] *= taperFactor;
        }
        
        // Round bottom
        if (y < 0) {
          const roundingFactor = 1.0 - Math.pow(Math.abs(x / (hullWidth * 0.5)), 2) * 0.3;
          positions[i * 3 + 1] *= roundingFactor;
        }
      }
      
      hullGeometry.attributes.position.needsUpdate = true;
      hullGeometry.computeVertexNormals();
    }
    
    // Wood material - weathered look
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4433, // Dark brown
      roughness: 0.9,
      metalness: 0.1
    });
    
    const hull = new THREE.Mesh(hullGeometry, woodMaterial);
    
    // Position hull to be partially buried
    hull.position.y = 0.2;
    group.add(hull);
    
    // Add barnacles and small details to show aging
    const detailCount = 15 + Math.floor(Math.random() * 10);
    
    // Barnacle material
    const barnacleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9d9d9, // Off-white
      roughness: 0.8,
      metalness: 0.1
    });
    
    for (let i = 0; i < detailCount; i++) {
      const detailType = Math.random();
      let detailMesh: THREE.Mesh;
      
      if (detailType < 0.7) {
        // Barnacle
        const barnacleSize = 0.03 + Math.random() * 0.04;
        const barnacleGeometry = new THREE.ConeGeometry(barnacleSize, barnacleSize * 1.5, 6);
        detailMesh = new THREE.Mesh(barnacleGeometry, barnacleMaterial);
      } else {
        // Damage hole
        const holeSize = 0.05 + Math.random() * 0.1;
        const holeGeometry = new THREE.CircleGeometry(holeSize, 6);
        const holeMaterial = new THREE.MeshStandardMaterial({
          color: 0x221e1b, // Very dark brown
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide
        });
        detailMesh = new THREE.Mesh(holeGeometry, holeMaterial);
      }
      
      // Position randomly on hull surface
      const side = Math.floor(Math.random() * 5); // 0-4: bottom, front, back, left, right
      
      let nx = 0, ny = 0, nz = 0; // Normal direction to orient detail
      
      switch (side) {
        case 0: // Bottom
          detailMesh.position.set(
            (Math.random() - 0.5) * hullWidth * 0.8,
            -hullHeight / 2 + 0.2,
            (Math.random() - 0.5) * hullLength * 0.8
          );
          ny = -1;
          break;
        case 1: // Front
          detailMesh.position.set(
            (Math.random() - 0.5) * hullWidth * 0.8,
            (Math.random() - 0.5) * hullHeight * 0.8 + 0.2,
            hullLength / 2
          );
          nz = 1;
          break;
        case 2: // Back
          detailMesh.position.set(
            (Math.random() - 0.5) * hullWidth * 0.8,
            (Math.random() - 0.5) * hullHeight * 0.8 + 0.2,
            -hullLength / 2
          );
          nz = -1;
          break;
        case 3: // Left
          detailMesh.position.set(
            -hullWidth / 2,
            (Math.random() - 0.5) * hullHeight * 0.8 + 0.2,
            (Math.random() - 0.5) * hullLength * 0.8
          );
          nx = -1;
          break;
        case 4: // Right
          detailMesh.position.set(
            hullWidth / 2,
            (Math.random() - 0.5) * hullHeight * 0.8 + 0.2,
            (Math.random() - 0.5) * hullLength * 0.8
          );
          nx = 1;
          break;
      }
      
      // Orient to face outward
      if (nx !== 0 || ny !== 0 || nz !== 0) {
        const target = new THREE.Vector3(
          detailMesh.position.x + nx,
          detailMesh.position.y + ny,
          detailMesh.position.z + nz
        );
        detailMesh.lookAt(target);
      }
      
      group.add(detailMesh);
    }
    
    // Add some planks to show ship structure
    const plankCount = 6 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < plankCount; i++) {
      const plankLength = 0.8 + Math.random() * 1.0;
      const plankWidth = 0.08 + Math.random() * 0.06;
      const plankThickness = 0.04;
      
      const plankGeometry = new THREE.BoxGeometry(plankWidth, plankThickness, plankLength);
      const plankMaterial = new THREE.MeshStandardMaterial({
        color: 0x6e5b46, // Slightly lighter wood color
        roughness: 0.85,
        metalness: 0.1
      });
      
      const plank = new THREE.Mesh(plankGeometry, plankMaterial);
      
      // Position randomly on the hull
      const isVertical = Math.random() > 0.5;
      
      if (isVertical) {
        // Vertical plank on the side
        const side = Math.random() > 0.5 ? 1 : -1;
        plank.position.set(
          side * hullWidth / 2 * 0.95,
          Math.random() * hullHeight * 0.6 - hullHeight * 0.1 + 0.2,
          (Math.random() - 0.5) * hullLength * 0.7
        );
        plank.rotation.set(
          Math.PI / 2,
          0,
          Math.PI / 2
        );
      } else {
        // Horizontal plank
        const side = Math.random() > 0.5 ? 1 : -1;
        plank.position.set(
          side * hullWidth / 2 * 0.95,
          (Math.random() - 0.5) * hullHeight * 0.5 + 0.2,
          (Math.random() - 0.5) * hullLength * 0.7
        );
        plank.rotation.set(
          0,
          Math.PI / 2,
          0
        );
      }
      
      group.add(plank);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createBarrel(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a wooden barrel
    const barrelRadius = 0.25;
    const barrelHeight = 0.5;
    
    // Main barrel body
    const barrelGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelHeight, 12);
    
    // Apply slight bulge to barrel middle
    if (barrelGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = barrelGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const y = positions[i * 3 + 1];
        // Skip top and bottom vertices
        if (Math.abs(y) < barrelHeight / 2 - 0.01) {
          const x = positions[i * 3];
          const z = positions[i * 3 + 2];
          
          // Calculate distance from center axis
          const r = Math.sqrt(x * x + z * z);
          
          // Bulge factor - maximum at middle, reduces toward ends
          const bulgeFactor = 1.0 + 0.15 * (1.0 - Math.pow(y / (barrelHeight / 2), 2));
          
          // Apply bulge
          const angle = Math.atan2(z, x);
          positions[i * 3] = Math.cos(angle) * r * bulgeFactor;
          positions[i * 3 + 2] = Math.sin(angle) * r * bulgeFactor;
        }
      }
      
      barrelGeometry.attributes.position.needsUpdate = true;
      barrelGeometry.computeVertexNormals();
    }
    
    // Wood material
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4433, // Dark brown
      roughness: 0.85,
      metalness: 0.1
    });
    
    const barrel = new THREE.Mesh(barrelGeometry, woodMaterial);
    barrel.position.y = barrelHeight / 2;
    group.add(barrel);
    
    // Add barrel rings
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a, // Dark metallic gray
      roughness: 0.6,
      metalness: 0.7
    });
    
    const createRing = (yPos: number) => {
      // Create metal barrel ring
      // Use a torus for the ring
      const ringRadius = barrelRadius * (yPos === 0 ? 1.15 : 1.1); // Middle ring is larger
      const ringThickness = 0.03;
      
      const ringGeometry = new THREE.TorusGeometry(ringRadius, ringThickness, 8, 16);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      
      // Position the ring
      ring.position.y = yPos;
      ring.rotation.x = Math.PI / 2; // Orient horizontally
      
      return ring;
    };
    
    // Add 3 rings - top, middle, and bottom
    group.add(createRing(barrelHeight * 0.35));
    group.add(createRing(0));
    group.add(createRing(-barrelHeight * 0.35));
    
    // Add lid details to top and bottom
    const lidGeometry = new THREE.CircleGeometry(barrelRadius * 0.95, 12);
    const lid = new THREE.Mesh(lidGeometry, woodMaterial);
    lid.position.y = barrelHeight / 2;
    lid.rotation.x = -Math.PI / 2; // Orient horizontally
    group.add(lid);
    
    const bottomLid = lid.clone();
    bottomLid.position.y = -barrelHeight / 2;
    bottomLid.rotation.x = Math.PI / 2; // Orient horizontally
    group.add(bottomLid);
    
    // Add wood grain pattern using color variations
    const grainOverlayGeometry = new THREE.CylinderGeometry(
      barrelRadius * 1.01, // Slightly larger than barrel
      barrelRadius * 1.01,
      barrelHeight * 1.01,
      12
    );
    
    // Create a special material for wood grain
    const grainMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Slightly reddish brown
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const grainOverlay = new THREE.Mesh(grainOverlayGeometry, grainMaterial);
    grainOverlay.position.y = barrelHeight / 2;
    
    // Add some weathering
    const weatheringGroup = new THREE.Group();
    
    // Add algae or moss patches
    const algaeCount = Math.floor(Math.random() * 4); // 0-3 patches
    const algaeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e4d2b, // Dark green
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    
    for (let i = 0; i < algaeCount; i++) {
      const patchRadius = 0.08 + Math.random() * 0.12;
      const patchGeometry = new THREE.CircleGeometry(patchRadius, 8);
      const algaePatch = new THREE.Mesh(patchGeometry, algaeMaterial);
      
      // Position randomly on barrel surface
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * barrelHeight;
      
      algaePatch.position.set(
        Math.cos(angle) * barrelRadius,
        height + barrelHeight / 2,
        Math.sin(angle) * barrelRadius
      );
      
      // Orient to face outward
      algaePatch.lookAt(new THREE.Vector3(
        Math.cos(angle) * (barrelRadius + 1),
        height + barrelHeight / 2,
        Math.sin(angle) * (barrelRadius + 1)
      ));
      
      weatheringGroup.add(algaePatch);
    }
    
    group.add(weatheringGroup);
    
    // Apply random rotation to barrel
    barrel.rotation.y = Math.random() * Math.PI * 2;
    
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
  
  private createCrystalFormation(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a base rock
    const baseGeometry = new THREE.SphereGeometry(0.3, 6, 6);
    
    // Deform base to look more like a rock
    if (baseGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = baseGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] *= 0.7 + (Math.random() - 0.5) * 0.2; // Flatten a bit
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.3;
      }
      
      baseGeometry.attributes.position.needsUpdate = true;
      baseGeometry.computeVertexNormals();
    }
    
    // Dark rock material
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray
      roughness: 0.9,
      metalness: 0.3
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1;
    group.add(base);
    
    // Crystal colors - choose a dominant color
    const colorType = Math.floor(Math.random() * 4);
    let crystalBaseColor: THREE.Color;
    
    switch (colorType) {
      case 0: // Blue crystals
        crystalBaseColor = new THREE.Color(0x1e88e5);
        break;
      case 1: // Purple crystals
        crystalBaseColor = new THREE.Color(0x7b1fa2);
        break;
      case 2: // Green crystals
        crystalBaseColor = new THREE.Color(0x2e7d32);
        break;
      case 3: // Orange crystals
        crystalBaseColor = new THREE.Color(0xef6c00);
        break;
      default:
        crystalBaseColor = new THREE.Color(0x1e88e5);
    }
    
    // Create crystal spikes
    const crystalCount = 6 + Math.floor(Math.random() * 6); // 6-11 crystals
    
    for (let i = 0; i < crystalCount; i++) {
      // Crystal properties
      const crystalHeight = 0.2 + Math.random() * 0.5;
      const crystalWidth = 0.06 + Math.random() * 0.08;
      
      // Individual crystal color variation
      const crystalColor = crystalBaseColor.clone();
      // Add slight color variation
      crystalColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      
      // Crystal material with emission
      const crystalMaterial = new THREE.MeshStandardMaterial({
        color: crystalColor,
        roughness: 0.2,
        metalness: 0.8,
        emissive: crystalColor.clone().multiplyScalar(0.5),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      // Choose between different crystal shapes
      const shapeType = Math.floor(Math.random() * 3);
      let crystalGeometry: THREE.BufferGeometry;
      
      switch (shapeType) {
        case 0: // Pointed crystal (cone-like)
          crystalGeometry = new THREE.ConeGeometry(crystalWidth, crystalHeight, 6);
          break;
        case 1: // Prismatic crystal
          crystalGeometry = new THREE.CylinderGeometry(crystalWidth * 0.6, crystalWidth, crystalHeight, 6);
          break;
        case 2: // Diamond-shaped crystal
          crystalGeometry = new THREE.OctahedronGeometry(crystalWidth * 1.5, 0);
          // Scale to make it taller
          crystalGeometry.scale(1, 2, 1);
          break;
        default:
          crystalGeometry = new THREE.ConeGeometry(crystalWidth, crystalHeight, 6);
      }
      
      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      
      // Position on the base rock
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 * (Math.random() * 0.5 + 0.5);
      
      crystal.position.set(
        Math.cos(angle) * radius,
        0.1 + crystalHeight * 0.5, // Half height above the base
        Math.sin(angle) * radius
      );
      
      // Angle crystals outward slightly
      const outwardAngle = 0.2 + Math.random() * 0.4;
      crystal.rotation.x = Math.cos(angle) * outwardAngle;
      crystal.rotation.z = Math.sin(angle) * outwardAngle;
      
      group.add(crystal);
      
      // Add smaller crystals around some of the larger ones
      if (Math.random() > 0.5) {
        const smallCrystalCount = 1 + Math.floor(Math.random() * 3); // 1-3 small crystals
        
        for (let j = 0; j < smallCrystalCount; j++) {
          const smallCrystalGeometry = new THREE.ConeGeometry(
            crystalWidth * 0.4,
            crystalHeight * 0.4,
            5
          );
          
          const smallCrystal = new THREE.Mesh(smallCrystalGeometry, crystalMaterial);
          
          // Position near the parent crystal
          const smallAngle = angle + (Math.random() - 0.5) * 0.5;
          const smallRadius = radius * 0.8;
          
          smallCrystal.position.set(
            Math.cos(smallAngle) * smallRadius,
            0.05 + (crystalHeight * 0.4 * 0.5), // Half height of small crystal
            Math.sin(smallAngle) * smallRadius
          );
          
          // Angle slightly differently
          smallCrystal.rotation.x = Math.cos(smallAngle) * outwardAngle * 1.2;
          smallCrystal.rotation.z = Math.sin(smallAngle) * outwardAngle * 1.2;
          
          group.add(smallCrystal);
        }
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
  
  private createBioluminescentCoral(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a base structure
    const baseGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    baseGeometry.scale(1, 0.6, 1); // Flatten
    
    // Deform base
    if (baseGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = baseGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.2;
      }
      
      baseGeometry.attributes.position.needsUpdate = true;
      baseGeometry.computeVertexNormals();
    }
    
    // Base colors - deep sea corals are often vibrant
    const baseHue = Math.random(); // Random base hue
    const baseColor = new THREE.Color().setHSL(baseHue, 0.8, 0.3); // Saturated but dark
    
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.2,
      emissive: baseColor.clone(),
      emissiveIntensity: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.2;
    group.add(base);
    
    // Create glowing spots on the coral
    const spotCount = 8 + Math.floor(Math.random() * 8); // 8-15 spots
    
    // Glow spot material - brighter version of base color
    const glowColor = new THREE.Color().setHSL(baseHue, 0.9, 0.6);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: glowColor,
      roughness: 0.4,
      metalness: 0.6,
      emissive: glowColor,
      emissiveIntensity: 0.6
    });
    
    for (let i = 0; i < spotCount; i++) {
      const spotSize = 0.03 + Math.random() * 0.05;
      const spotGeometry = new THREE.SphereGeometry(spotSize, 6, 6);
      const spot = new THREE.Mesh(spotGeometry, glowMaterial);
      
      // Position on the surface of the base
      const phi = Math.random() * Math.PI; // 0 to π
      const theta = Math.random() * Math.PI * 2; // 0 to 2π
      
      const radius = 0.3 * (0.9 + Math.random() * 0.2); // Slight variation
      spot.position.set(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.cos(phi) * radius * 0.6 + 0.2, // Account for flattening
        Math.sin(phi) * Math.sin(theta) * radius
      );
      
      group.add(spot);
    }
    
    // Add some branching tentacles/polyps
    const tentacleCount = 4 + Math.floor(Math.random() * 5); // 4-8 tentacles
    
    for (let i = 0; i < tentacleCount; i++) {
      const height = 0.15 + Math.random() * 0.3;
      const thickness = 0.03 + Math.random() * 0.02;
      
      // Create tapered cylinder for tentacle
      const tentacleGeometry = new THREE.CylinderGeometry(
        thickness * 0.5, // Top
        thickness, // Bottom
        height,
        6
      );
      
      // Tentacle material - slightly different hue
      const tentacleHue = (baseHue + (Math.random() - 0.5) * 0.1 + 1) % 1;
      const tentacleColor = new THREE.Color().setHSL(tentacleHue, 0.7, 0.4);
      
      const tentacleMaterial = new THREE.MeshStandardMaterial({
        color: tentacleColor,
        roughness: 0.7,
        metalness: 0.3,
        emissive: tentacleColor.clone(),
        emissiveIntensity: 0.2
      });
      
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      
      // Position on the base, skewing toward the top
      const phi = Math.random() * Math.PI * 0.6; // 0 to 0.6π (upper hemisphere)
      const theta = Math.random() * Math.PI * 2; // 0 to 2π
      
      const radius = 0.3;
      tentacle.position.set(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.cos(phi) * radius * 0.6 + 0.2,
        Math.sin(phi) * Math.sin(theta) * radius
      );
      
      // Orient tentacle to point outward from center
      tentacle.lookAt(
        tentacle.position.clone().add(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
          )
        )
      );
      
      group.add(tentacle);
      
      // Add glowing tip to tentacle
      const tipGeometry = new THREE.SphereGeometry(thickness * 0.7, 6, 6);
      const tip = new THREE.Mesh(tipGeometry, glowMaterial);
      
      // Position at end of tentacle
      tip.position.copy(tentacle.position);
      
      // Move tip to top of tentacle
      const tipOffset = new THREE.Vector3(0, height / 2, 0);
      tipOffset.applyQuaternion(tentacle.quaternion);
      tip.position.add(tipOffset);
      
      group.add(tip);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createAbyssalRock(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a large, dark, jagged rock formation
    const rockGeometry = new THREE.DodecahedronGeometry(0.6, 1);
    
    // Add significant noise to vertices to create jagged appearance
    if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = rockGeometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] *= 1 + (Math.random() - 0.5) * 0.7; // Significant x variation
        positions[i * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.5; // Moderate y variation
        positions[i * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.7; // Significant z variation
      }
      
      rockGeometry.attributes.position.needsUpdate = true;
      rockGeometry.computeVertexNormals();
    }
    
    // Very dark rock material
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111, // Almost black
      roughness: 0.95,
      metalness: 0.2
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.y = 0.4;
    group.add(rock);
    
    // Add some smaller attached rocks
    const smallRockCount = 3 + Math.floor(Math.random() * 4); // 3-6 smaller rocks
    
    for (let i = 0; i < smallRockCount; i++) {
      const rockSize = 0.2 + Math.random() * 0.3;
      let smallRockGeometry: THREE.BufferGeometry;
      
      const rockType = Math.floor(Math.random() * 3);
      switch (rockType) {
        case 0:
          smallRockGeometry = new THREE.DodecahedronGeometry(rockSize, 1);
          break;
        case 1:
          smallRockGeometry = new THREE.OctahedronGeometry(rockSize, 1);
          break;
        case 2:
          smallRockGeometry = new THREE.TetrahedronGeometry(rockSize, 1);
          break;
        default:
          smallRockGeometry = new THREE.DodecahedronGeometry(rockSize, 1);
      }
      
      // Add noise
      if (smallRockGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = smallRockGeometry.attributes.position.array;
        
        for (let j = 0; j < positions.length / 3; j++) {
          positions[j * 3] *= 1 + (Math.random() - 0.5) * 0.4;
          positions[j * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.4;
          positions[j * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.4;
        }
        
        smallRockGeometry.attributes.position.needsUpdate = true;
        smallRockGeometry.computeVertexNormals();
      }
      
      // Slightly different color
      const rockShade = 0.05 + Math.random() * 0.1; // Very dark
      const smallRockMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(rockShade, rockShade, rockShade),
        roughness: 0.9,
        metalness: 0.3
      });
      
      const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
      
      // Position around base
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 0.3;
      smallRock.position.set(
        Math.cos(angle) * radius,
        Math.random() * 0.3, // Varied height
        Math.sin(angle) * radius
      );
      
      group.add(smallRock);
    }
    
    // Add a few bioluminescent details
    const glowSpotCount = Math.floor(Math.random() * 6); // 0-5 spots
    
    // Choose glow color
    const glowOptions = [
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0x6a00ff), // Purple
      new THREE.Color(0x00ff8c)  // Green
    ];
    const glowColor = glowOptions[Math.floor(Math.random() * glowOptions.length)];
    
    for (let i = 0; i < glowSpotCount; i++) {
      const spotSize = 0.03 + Math.random() * 0.04;
      const spotGeometry = new THREE.SphereGeometry(spotSize, 6, 6);
      
      const spotMaterial = new THREE.MeshStandardMaterial({
        color: glowColor,
        roughness: 0.4,
        metalness: 0.6,
        emissive: glowColor,
        emissiveIntensity: 0.7
      });
      
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      
      // Position on the rock surface
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      spot.position.set(
        Math.sin(theta) * Math.cos(phi) * 0.6 + (Math.random() - 0.5) * 0.2,
        Math.cos(theta) * 0.6 + 0.4,
        Math.sin(theta) * Math.sin(phi) * 0.6 + (Math.random() - 0.5) * 0.2
      );
      
      group.add(spot);
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
  
  private createJellyfish(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Choose jellyfish type (small or large)
    const isLarge = Math.random() > 0.5;
    
    // Choose a color scheme
    const colorSchemes = [
      { bell: 0xee82ee, tentacles: 0xd8bfd8 },  // Pink/Purple
      { bell: 0x00bfff, tentacles: 0x87cefa },  // Blue
      { bell: 0xff6347, tentacles: 0xffa07a },  // Orange/Red
      { bell: 0x32cd32, tentacles: 0x98fb98 }   // Green
    ];
    
    const colorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    
    // Create bell (main body)
    const bellRadius = isLarge ? 0.3 : 0.15;
    const bellHeight = isLarge ? 0.4 : 0.2;
    
    // Create custom bell shape (like a dome or umbrella)
    const bellShape = new THREE.Shape();
    
    // Draw half profile of bell
    bellShape.moveTo(0, 0); // Top center
    bellShape.bezierCurveTo(
      bellRadius * 0.8, 0,            // Control point 1
      bellRadius, -bellHeight * 0.5,  // Control point 2
      bellRadius, -bellHeight         // End point (bottom edge)
    );
    
    // Create lathe geometry by rotating the profile
    const bellGeometry = new THREE.LatheGeometry(
      bellShape.getPoints(12), // Convert shape to points
      16                       // Number of segments around the rotation
    );
    
    // Slightly transparent, glowing bell material
    const bellMaterial = new THREE.MeshStandardMaterial({
      color: colorScheme.bell,
      transparent: true,
      opacity: 0.7,
      emissive: colorScheme.bell,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    
    const bell = new THREE.Mesh(bellGeometry, bellMaterial);
    
    // Position the bell with open side facing down
    bell.rotation.x = Math.PI; // Flip upside down
    bell.position.y = 0;
    group.add(bell);
    
    // Add inner glow for the bell (slightly smaller, more glowy)
    const innerGlowGeometry = bellGeometry.clone().scale(0.85, 0.85, 0.85);
    const innerGlowMaterial = new THREE.MeshStandardMaterial({
      color: colorScheme.bell,
      transparent: true,
      opacity: 0.5,
      emissive: colorScheme.bell,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
      side: THREE.DoubleSide
    });
    
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    innerGlow.rotation.x = Math.PI;
    innerGlow.position.y = 0;
    group.add(innerGlow);
    
    // Create tentacles
    const tentacleCount = isLarge ? 
      12 + Math.floor(Math.random() * 8) : // 12-19 for large
      6 + Math.floor(Math.random() * 6);   // 6-11 for small
    
    // Tentacle material (slightly transparent)
    const tentacleMaterial = new THREE.MeshStandardMaterial({
      color: colorScheme.tentacles,
      transparent: true,
      opacity: 0.6,
      roughness: 0.6,
      metalness: 0.1
    });
    
    for (let i = 0; i < tentacleCount; i++) {
      const tentacleLength = isLarge ? 
        0.5 + Math.random() * 0.7 : // 0.5-1.2 for large
        0.3 + Math.random() * 0.4;  // 0.3-0.7 for small
      
      const tentacleThickness = isLarge ? 0.03 : 0.015;
      
      // Create tentacle
      const tentacle = this.createJellyfishTentacle(
        tentacleLength, 
        tentacleThickness,
        tentacleMaterial
      );
      
      // Position tentacle around the bottom edge of bell
      const angle = (i / tentacleCount) * Math.PI * 2;
      const positionRadius = bellRadius * (0.7 + Math.random() * 0.3); // Varied position
      
      tentacle.position.set(
        Math.cos(angle) * positionRadius,
        -bellHeight, // At the bottom of the bell
        Math.sin(angle) * positionRadius
      );
      
      // Slightly randomize tentacle rotation
      tentacle.rotation.x = (Math.random() - 0.5) * 0.2;
      tentacle.rotation.z = (Math.random() - 0.5) * 0.2;
      
      // Set name for animation
      tentacle.name = 'jellyfish_tentacle';
      
      group.add(tentacle);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createJellyfishTentacle(
    length: number, 
    thickness: number, 
    material: THREE.Material
  ): THREE.Group {
    const tentacleGroup = new THREE.Group();
    
    // Create tentacle as a series of segments for more natural look
    const segmentCount = 4 + Math.floor(Math.random() * 3); // 4-6 segments
    const segmentLength = length / segmentCount;
    
    let cumulativeLength = 0;
    
    for (let i = 0; i < segmentCount; i++) {
      // Make segments thinner toward the end
      const topThickness = thickness * (1 - (i / segmentCount) * 0.7);
      const bottomThickness = thickness * (1 - ((i + 1) / segmentCount) * 0.7);
      
      const segmentGeometry = new THREE.CylinderGeometry(
        topThickness, 
        bottomThickness, 
        segmentLength, 
        6
      );
      
      const segment = new THREE.Mesh(segmentGeometry, material);
      
      // Position segment below previous one
      segment.position.y = -cumulativeLength - segmentLength / 2;
      
      // Add slight randomization to each segment
      segment.rotation.x = (Math.random() - 0.5) * 0.15;
      segment.rotation.z = (Math.random() - 0.5) * 0.15;
      
      tentacleGroup.add(segment);
      
      cumulativeLength += segmentLength;
    }
    
    return tentacleGroup;
  }
  
  private createBubbleStream(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a stream of rising bubbles
    const bubbleCount = 8 + Math.floor(Math.random() * 8); // 8-15 bubbles
    
    // Bubble material (transparent)
    const bubbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.1,
      metalness: 0.9,
      envMapIntensity: 1.0
    });
    
    // Stream properties
    const streamWidth = 0.2;
    const streamHeight = 1.0;
    
    for (let i = 0; i < bubbleCount; i++) {
      // Vary bubble sizes
      const bubbleSize = 0.03 + Math.random() * 0.07;
      const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 8, 8);
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      
      // Position bubbles in a rising pattern
      const heightFraction = i / bubbleCount;
      
      bubble.position.set(
        (Math.random() - 0.5) * streamWidth * (1 + heightFraction), // Wider at top
        streamHeight * heightFraction,                             // Higher is further up
        (Math.random() - 0.5) * streamWidth * (1 + heightFraction)  // Wider at top
      );
      
      // Add slight random rotation
      bubble.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      // Name for animation
      bubble.name = 'bubble';
      
      group.add(bubble);
    }
    
    // Add source of bubbles (small vent)
    const ventGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.1, 8);
    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555, // Dark gray
      roughness: 0.9,
      metalness: 0.2
    });
    
    const vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.y = -0.05; // Half height
    group.add(vent);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation around Y axis (keep bubbles rising upward)
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private createFloatingDebris(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Create a collection of floating debris pieces
    const debrisCount = 4 + Math.floor(Math.random() * 5); // 4-8 pieces
    
    // Choose debris theme
    const debrisType = Math.floor(Math.random() * 3);
    let debrisMaterial: THREE.Material;
    
    switch (debrisType) {
      case 0: // Wooden debris
        debrisMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513, // Brown
          roughness: 0.9,
          metalness: 0.1
        });
        break;
      case 1: // Plastic debris
        debrisMaterial = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0, // Off-white
          roughness: 0.7,
          metalness: 0.3,
          transparent: true,
          opacity: 0.8
        });
        break;
      case 2: // Metal debris
        debrisMaterial = new THREE.MeshStandardMaterial({
          color: 0x777777, // Gray
          roughness: 0.6,
          metalness: 0.8
        });
        break;
      default:
        debrisMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.9,
          metalness: 0.1
        });
    }
    
    for (let i = 0; i < debrisCount; i++) {
      // Create different debris shapes
      const shapeType = Math.floor(Math.random() * 4);
      let debrisGeometry: THREE.BufferGeometry;
      
      switch (shapeType) {
        case 0: // Flat fragment
          const width = 0.1 + Math.random() * 0.3;
          const height = 0.1 + Math.random() * 0.3;
          const thickness = 0.01 + Math.random() * 0.03;
          debrisGeometry = new THREE.BoxGeometry(width, thickness, height);
          break;
        case 1: // Rod/tube
          const length = 0.2 + Math.random() * 0.4;
          const radius = 0.02 + Math.random() * 0.04;
          debrisGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
          break;
        case 2: // Small box/container
          const size = 0.1 + Math.random() * 0.15;
          debrisGeometry = new THREE.BoxGeometry(
            size, 
            size * (0.5 + Math.random() * 0.5), 
            size * (0.8 + Math.random() * 0.4)
          );
          break;
        case 3: // Irregular fragment
          debrisGeometry = new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.1, 0);
          // Distort shape
          if (debrisGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = debrisGeometry.attributes.position.array;
            for (let j = 0; j < positions.length / 3; j++) {
              positions[j * 3] *= 1 + (Math.random() - 0.5) * 0.5;
              positions[j * 3 + 1] *= 1 + (Math.random() - 0.5) * 0.5;
              positions[j * 3 + 2] *= 1 + (Math.random() - 0.5) * 0.5;
            }
            debrisGeometry.attributes.position.needsUpdate = true;
            debrisGeometry.computeVertexNormals();
          }
          break;
        default:
          debrisGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      }
      
      // Create mesh with material variant
      const debrisVariantMaterial = debrisMaterial.clone();
      if (debrisVariantMaterial instanceof THREE.MeshStandardMaterial) {
        // Add slight color variation
        const color = debrisVariantMaterial.color.clone();
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
        debrisVariantMaterial.color = color;
      }
      
      const debris = new THREE.Mesh(debrisGeometry, debrisVariantMaterial);
      
      // Position randomly in small cloud
      debris.position.set(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      );
      
      // Random rotation
      debris.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      // Set name for animation
      debris.name = 'floating_debris';
      
      group.add(debris);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
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
  private waterEffects: WaterEffects;
  private assetManager?: AssetManager;
  private qualityLevel: 'low' | 'medium' | 'high' = 'medium';
  private skyboxMesh?: THREE.Mesh;
  
  constructor(scene: THREE.Scene, assetManager?: AssetManager, quality: 'low' | 'medium' | 'high' = 'medium') {
    this.scene = scene;
    this.assetManager = assetManager;
    this.qualityLevel = quality;
    
    // Create water effects
    this.waterEffects = new WaterEffects(scene, quality);
    
    // Create skybox
    this.createSkybox();
    
    // Set initial environment
    this.applyEnvironmentTheme(this.currentTheme);
    
    // Create initial segments
    this.generateInitialSegments();
  }
  
  /**
   * Creates skybox for environment
   */
  private createSkybox() {
    // Create simple gradient skybox
    const vertexShader = `
      varying vec3 vWorldPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(0.0, min(1.0, pow(max(0.0, h), exponent)));
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x6cc7fa) },   // Lighter blue at top
      bottomColor: { value: new THREE.Color(0x0c4a6e) }, // Darker blue at bottom
      offset: { value: 10 },
      exponent: { value: 0.6 }
    };
    
    const skyMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.BackSide,
      fog: false
    });
    
    const skyGeometry = new THREE.SphereGeometry(450, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.skyboxMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyboxMesh);
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
    
    // Update water effects
    this.waterEffects.update(deltaTime, new THREE.Vector3(0, 0, playerZ));
    
    // Update skybox position to follow player
    if (this.skyboxMesh) {
      this.skyboxMesh.position.z = playerZ;
    }
    
    // Consider environment type change
    this.considerEnvironmentChange(distanceTraveled);
  }
  
  /**
   * Set environment quality level
   */
  setQuality(quality: 'low' | 'medium' | 'high') {
    if (this.qualityLevel === quality) return;
    
    this.qualityLevel = quality;
    this.waterEffects.setQuality(quality);
    
    // Update segments for quality change
    // This is expensive, so we only recreate visible segments
    this.segments.forEach(segment => {
      // Mark for recreation on next update cycle
      segment.isActive = false;
    });
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
    
    // Update skybox colors if it exists
    if (this.skyboxMesh && this.skyboxMesh.material instanceof THREE.ShaderMaterial) {
      const material = this.skyboxMesh.material;
      const topColor = new THREE.Color(theme.backgroundColor).lerp(new THREE.Color(0xffffff), 0.3);
      const bottomColor = new THREE.Color(theme.backgroundColor).multiplyScalar(0.7);
      
      material.uniforms.topColor.value = topColor;
      material.uniforms.bottomColor.value = bottomColor;
    }
    
    // The theme is fully applied
    this.currentEnvironmentType = theme.type;
    this.currentTheme = theme;
    
    // Emit environment theme change event with more details
    eventBus.emit('environment-theme-applied', {
      type: theme.type,
      colors: {
        background: theme.backgroundColor,
        fog: theme.fogColor,
        floor: theme.floorColor
      },
      properties: {
        fogDensity: theme.fogDensity,
        lightIntensity: theme.lightIntensity
      }
    });
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
    
    // Use smoothstep for smoother transitions
    const easedProgress = this.smoothstep(0, 1, progress);
    
    // Linear interpolation between themes with eased progress
    return {
      type: progress < 0.5 ? fromTheme.type : toTheme.type,
      backgroundColor: this.lerpColor(fromTheme.backgroundColor, toTheme.backgroundColor, easedProgress),
      fogColor: this.lerpColor(fromTheme.fogColor, toTheme.fogColor, easedProgress),
      fogDensity: THREE.MathUtils.lerp(fromTheme.fogDensity, toTheme.fogDensity, easedProgress),
      lightIntensity: THREE.MathUtils.lerp(fromTheme.lightIntensity, toTheme.lightIntensity, easedProgress),
      floorColor: this.lerpColor(fromTheme.floorColor, toTheme.floorColor, easedProgress),
      floorRoughness: THREE.MathUtils.lerp(fromTheme.floorRoughness, toTheme.floorRoughness, easedProgress),
      floorMetalness: THREE.MathUtils.lerp(fromTheme.floorMetalness, toTheme.floorMetalness, easedProgress),
      decorationDensity: THREE.MathUtils.lerp(fromTheme.decorationDensity, toTheme.decorationDensity, easedProgress),
      particleDensity: THREE.MathUtils.lerp(fromTheme.particleDensity, toTheme.particleDensity, easedProgress),
      transitionDuration: toTheme.transitionDuration,
      minDistance: toTheme.minDistance
    };
  }
  
  /**
   * Smooth step function for easing transitions
   */
  private smoothstep(min: number, max: number, value: number): number {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
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
  
  /**
   * Force environment change for testing or specific game events
   */
  forceEnvironmentChange(type: EnvironmentType, instantTransition: boolean = false) {
    if (type === this.currentEnvironmentType) return;
    
    if (instantTransition) {
      // Apply immediately
      this.applyEnvironmentTheme(ENVIRONMENT_THEMES[type]);
      this.distanceSinceLastChange = 0;
      
      // Update visible segments to the new theme
      this.segments.forEach(segment => {
        segment.dispose();
      });
      this.segments = [];
      this.generateInitialSegments();
    } else {
      // Start normal transition
      this.startEnvironmentTransition(type, this.lastDistanceTraveled);
    }
  }
  
  /**
   * Get current environment details
   */
  getEnvironmentInfo() {
    return {
      type: this.currentEnvironmentType,
      theme: this.currentTheme,
      isTransitioning: this.pendingTransition !== null,
      transitionProgress: this.transitionProgress,
      pendingType: this.pendingTransition
    };
  }
  
  /**
   * Set segment view distance
   */
  setViewDistance(segmentsAhead: number, segmentsBehind: number) {
    this.segmentsAhead = Math.max(2, Math.min(8, segmentsAhead));
    this.segmentsBehind = Math.max(1, Math.min(4, segmentsBehind));
  }
  
  // Clean up resources
  dispose() {
    // Clean up all segments
    this.segments.forEach(segment => {
      segment.dispose();
    });
    
    // Clean up water effects
    this.waterEffects.dispose();
    
    // Clean up skybox
    if (this.skyboxMesh) {
      if (this.skyboxMesh.geometry) {
        this.skyboxMesh.geometry.dispose();
      }
      if (this.skyboxMesh.material instanceof THREE.Material) {
        this.skyboxMesh.material.dispose();
      }
      if (this.skyboxMesh.parent) {
        this.scene.remove(this.skyboxMesh);
      }
    }
    
    this.segments = [];
  }
}