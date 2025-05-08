import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import { DeviceCapabilities, optimizeModelAsset, optimizeGeometry } from '../../utils/DeviceUtils';
import { DecorationDefinition } from './DecorationDefinitions';
import { EnvironmentType, EnvironmentTheme } from './EnvironmentTypes';
import { PlaceholderGenerator } from '../../utils/PlaceholderGenerator';
import { NoiseGenerator } from '../../utils/NoiseGenerator';

// Static imports for all decoration classes
import { CoralDecorations } from './decorations/CoralDecorations';
import { RockDecorations } from './decorations/RockDecorations';
import { VegetationDecorations } from './decorations/VegetationDecorations';
import { ShipwreckDecorations } from './decorations/ShipwreckDecorations';
import { DeepSeaDecorations } from './decorations/DeepSeaDecorations';
import { FloatingDecorations } from './decorations/FloatingDecorations';

// Mapping of decoration types to their creation functions
// This replaces the dynamic require logic with static imports
const decorationCreators: Record<string, (def: DecorationDefinition) => THREE.Object3D> = {
  // Coral decorations
  'coral1': CoralDecorations.createCoral1,
  'coral2': CoralDecorations.createCoral2,
  'branchingCoral': CoralDecorations.createBranchingCoral,
  'tubeCoral': CoralDecorations.createTubeCoral,
  'coralCluster': CoralDecorations.createCoralCluster, 
  'coralRock': CoralDecorations.createCoralRock,
  'staghornCoral': CoralDecorations.createStaghornCoral, // Add the new staghorn coral creator
  'bioluminescentCoral': DeepSeaDecorations.createBioluminescentCoral,
  
  // Rock decorations
  'rock1': RockDecorations.createRock1,
  'rock2': RockDecorations.createRock2,
  'rockFormation': RockDecorations.createRockFormation,
  'rockCluster': RockDecorations.createRockCluster,
  'abyssalRock': DeepSeaDecorations.createAbyssalRock,
  
  // Vegetation decorations
  'seaweed1': VegetationDecorations.createSeaweed1,
  'kelpStalk': VegetationDecorations.createKelpStalk,
  'seaGrass': VegetationDecorations.createSeaGrass,
  'seaAnemone': VegetationDecorations.createSeaAnemone,
  'giantKelp': VegetationDecorations.createGiantKelp,
  'glowingPlant': DeepSeaDecorations.createGlowingPlant,
  
  // Special formations
  'crystalFormation': DeepSeaDecorations.createCrystalFormation,
  'deepsea_vent': DeepSeaDecorations.createDeepSeaVent,
  'deepSeaVent': DeepSeaDecorations.createDeepSeaVent,
  
  // Shipwreck decorations
  'shipPart': ShipwreckDecorations.createShipPart,
  'treasure': ShipwreckDecorations.createTreasure,
  'anchor': ShipwreckDecorations.createAnchor,
  'shipHull': ShipwreckDecorations.createShipHull,
  'barrel': ShipwreckDecorations.createBarrel,
  
  // Floating decorations
  'floatingPlankton': FloatingDecorations.createFloatingPlankton,
  'schoolOfFish': FloatingDecorations.createSchoolOfFish,
  'jellyfish': FloatingDecorations.createJellyfish,
  'bubbleStream': FloatingDecorations.createBubbleStream,
  'floatingDebris': FloatingDecorations.createFloatingDebris,
};

/**
 * Factory class for creating environment decorations
 */
export class DecorationFactory {
  private scene: THREE.Scene;
  private deviceCapabilities: DeviceCapabilities;
  private assetManager?: AssetManager;
  
  // Cached geometries and materials for decoration types
  private decorationCache: Map<string, {
    geometry?: THREE.BufferGeometry,
    material?: THREE.Material | THREE.Material[],
    instance?: THREE.InstancedMesh
  }> = new Map();
  
  // Cache for optimized geometries
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  
  // Instanced meshes for common decoration types
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private instanceCount: Map<string, number> = new Map();
  
  // Configuration
  private config: {
    useInstancing: boolean;
    maxInstancesPerType: number;
    useLOD: boolean;
    maxPolygonsPerDecoration: number;
  };
  
  constructor(
    scene: THREE.Scene, 
    deviceCapabilities: DeviceCapabilities,
    assetManager?: AssetManager
  ) {
    this.scene = scene;
    this.deviceCapabilities = deviceCapabilities;
    this.assetManager = assetManager;
    
    // Configure based on device capabilities
    this.config = this.configureSettings(deviceCapabilities);
    
    // Initialize instanced meshes
    this.initializeInstancedMeshes();
  }
  
  /**
   * Configure settings based on device capabilities
   */
  private configureSettings(capabilities: DeviceCapabilities): {
    useInstancing: boolean;
    maxInstancesPerType: number;
    useLOD: boolean;
    maxPolygonsPerDecoration: number;
  } {
    if (capabilities.highEnd) {
      return {
        useInstancing: true,
        maxInstancesPerType: 500,
        useLOD: true,
        maxPolygonsPerDecoration: 2000
      };
    } else if (capabilities.midRange) {
      return {
        useInstancing: true,
        maxInstancesPerType: 300,
        useLOD: true,
        maxPolygonsPerDecoration: 1000
      };
    } else {
      return {
        useInstancing: true,
        maxInstancesPerType: 150,
        useLOD: true,
        maxPolygonsPerDecoration: 500
      };
    }
  }
  
  /**
   * Initialize instanced meshes for common decoration types with enhanced performance
   */
  private initializeInstancedMeshes(): void {
    // Enhanced list of common decoration types that benefit from instancing
    // Expanded to include more types for better performance
    const commonTypes = [
      // Basic coral types
      'coral1', 'coral2', 'branchingCoral', 'tubeCoral', 'coralCluster',
      
      // Rock types - all commonly used
      'rock1', 'rock2', 'rockFormation', 'rockCluster', 'coralRock',
      
      // Vegetation types
      'seaweed1', 'kelpStalk', 'seaGrass', 'seaAnemone',
      
      // Common floating elements
      'floatingPlankton', 'bubbleStream'
    ];
    
    // Categories for grouping similar decoration types (improves batching)
    const categories = {
      coral: ['coral1', 'coral2', 'branchingCoral', 'tubeCoral', 'coralCluster'],
      rock: ['rock1', 'rock2', 'rockFormation', 'rockCluster', 'coralRock'],
      vegetation: ['seaweed1', 'kelpStalk', 'seaGrass', 'seaAnemone'],
      floating: ['floatingPlankton', 'bubbleStream']
    };
    
    // For each common type, create an optimized instanced mesh
    for (const type of commonTypes) {
      try {
        // Determine the decoration category
        let category = 'default';
        for (const [cat, types] of Object.entries(categories)) {
          if (types.includes(type)) {
            category = cat;
            break;
          }
        }
        
        // Create appropriate geometry based on type
        const geometry = this.createOptimizedGeometry(type, category);
        
        // Create material appropriate for the decoration type
        const material = new THREE.MeshStandardMaterial({
          color: this.getColorForType(type),
          roughness: 0.8,
          metalness: 0.1,
          // Use flat shading for low-end devices to improve performance
          flatShading: !this.deviceCapabilities.highEnd
        });
        
        // Calculate appropriate instance count based on device capabilities
        const instanceCount = Math.min(
          this.config.maxInstancesPerType,
          this.deviceCapabilities.highEnd ? this.config.maxInstancesPerType :
          this.deviceCapabilities.midRange ? Math.floor(this.config.maxInstancesPerType * 0.6) :
          Math.floor(this.config.maxInstancesPerType * 0.3)
        );
        
        // Create instanced mesh with optimized settings
        const instancedMesh = new THREE.InstancedMesh(
          geometry,
          material,
          instanceCount
        );
        
        // Optimize for dynamic updates
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        // Set shadow properties based on device capabilities
        if (this.deviceCapabilities.highEnd) {
          instancedMesh.castShadow = true;
          instancedMesh.receiveShadow = true;
        } else {
          // Disable shadows on lower-end devices for performance
          instancedMesh.castShadow = false;
          instancedMesh.receiveShadow = false;
        }
        
        // Hide all instances initially by moving far away
        const matrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
        for (let i = 0; i < instanceCount; i++) {
          instancedMesh.setMatrixAt(i, matrix);
        }
        
        // Use frustum culling for optimization
        instancedMesh.frustumCulled = true;
        
        // Add to scene and track
        this.scene.add(instancedMesh);
        this.instancedMeshes.set(type, instancedMesh);
        this.instanceCount.set(type, 0);
      } catch (error) {
        console.warn(`Error creating instanced mesh for ${type}:`, error);
      }
    }
  }
  
  /**
   * Create optimized geometry for instanced rendering
   * @param type The decoration type
   * @param category The decoration category for optimizations
   * @returns Optimized geometry
   */
  private createOptimizedGeometry(type: string, category: string): THREE.BufferGeometry {
    try {
      // Check for cached geometry first
      const cacheKey = `instanced_${type}`;
      if (this.geometryCache.has(cacheKey)) {
        return this.geometryCache.get(cacheKey)!.clone();
      }
      
      let geometry: THREE.BufferGeometry;
      const lowDetail = !this.deviceCapabilities.highEnd;
      
      // Create appropriate geometry based on category
      switch (category) {
        case 'coral':
          if (type === 'coralCluster') {
            geometry = new THREE.SphereGeometry(0.5, lowDetail ? 5 : 8, lowDetail ? 4 : 6);
          } else {
            // Most coral types are branch-like
            geometry = new THREE.CylinderGeometry(
              0.1, 0.2, 0.8, 
              lowDetail ? 5 : 8, 
              lowDetail ? 1 : 2
            );
          }
          break;
        
        case 'rock':
          if (type.includes('Formation')) {
            geometry = new THREE.DodecahedronGeometry(0.6, lowDetail ? 0 : 1);
          } else {
            geometry = new THREE.IcosahedronGeometry(0.4, lowDetail ? 0 : 1);
          }
          break;
        
        case 'vegetation':
          if (type.includes('kelp')) {
            geometry = new THREE.CylinderGeometry(
              0.05, 0.08, 1.2, 
              lowDetail ? 4 : 6, 
              lowDetail ? 1 : 3
            );
          } else if (type.includes('Grass')) {
            geometry = new THREE.PlaneGeometry(0.2, 0.6, 1, lowDetail ? 1 : 2);
          } else {
            geometry = new THREE.CylinderGeometry(
              0.1, 0.15, 0.8, 
              lowDetail ? 4 : 6, 
              lowDetail ? 1 : 2
            );
          }
          break;
        
        case 'floating':
          if (type.includes('Plankton')) {
            geometry = new THREE.SphereGeometry(0.1, lowDetail ? 4 : 6, lowDetail ? 3 : 4);
          } else if (type.includes('Bubble')) {
            geometry = new THREE.SphereGeometry(0.1, lowDetail ? 4 : 8, lowDetail ? 3 : 6);
          } else {
            geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          }
          break;
        
        default:
          // Default placeholder geometry
          geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      }
      
      // Apply subtle noise deformation to make each instance look less identical
      // But only on higher-end devices
      if (this.deviceCapabilities.highEnd && (category === 'rock' || category === 'coral')) {
        try {
          if (geometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = geometry.attributes.position.array;
            const noise = new NoiseGenerator(Math.PI * 1000); // Use a fixed seed for consistency
            
            for (let i = 0; i < positions.length / 3; i++) {
              const x = positions[i * 3];
              const y = positions[i * 3 + 1];
              const z = positions[i * 3 + 2];
              
              // Apply less intense noise
              const noiseVal = noise.noise3D(x * 5, y * 5, z * 5) * 0.1;
              
              positions[i * 3] += noiseVal;
              positions[i * 3 + 1] += noiseVal;
              positions[i * 3 + 2] += noiseVal;
            }
            
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
          }
        } catch (noiseError) {
          // Noise application is optional - continue without it if it fails
          console.log(`Skipping noise for ${type} due to error:`, noiseError);
        }
      }
      
      // Cache the geometry for future use
      this.geometryCache.set(cacheKey, geometry.clone());
      
      return geometry;
    } catch (error) {
      console.warn(`Error creating optimized geometry for ${type}:`, error);
      // Fallback to simple box geometry
      return new THREE.BoxGeometry(0.3, 0.3, 0.3);
    }
  }
  
  /**
   * Get a color for a decoration type
   * Enhanced to support more decoration types
   */
  private getColorForType(type: string): number {
    // Basic color palette based on decoration type
    if (type.includes('coral')) {
      if (type.includes('bioluminescent')) {
        // Glowing colors for bioluminescent coral
        const glowColors = [0x66ffaa, 0x55ffff, 0xff66ff, 0xaaaaff];
        return glowColors[Math.floor(Math.random() * glowColors.length)];
      } else {
        // Random coral colors
        const coralColors = [0xff7f50, 0xff6347, 0xe9967a, 0xfa8072, 0xf08080];
        return coralColors[Math.floor(Math.random() * coralColors.length)];
      }
    } else if (type.includes('rock')) {
      if (type.includes('abyssal')) {
        // Darker color for abyssal rocks
        return 0x333333;
      } else {
        // Grey rocks
        return 0x808080;
      }
    } else if (type.includes('weed') || type.includes('grass') || type.includes('kelp') || type.includes('plant')) {
      if (type.includes('glowing')) {
        // Glowing plants
        const glowPlantColors = [0x00ffff, 0xff00ff, 0x66ffaa, 0xaaaaff];
        return glowPlantColors[Math.floor(Math.random() * glowPlantColors.length)];
      } else {
        // Green plants
        return 0x2e8b57;
      }
    } else if (type.includes('ship') || type.includes('barrel') || type.includes('debris')) {
      // Wooden/Metal shipwreck parts
      return 0x5d4037; // Brown
    } else if (type.includes('jellyfish')) {
      return 0xdd88ff; // Purple
    } else if (type.includes('crystal')) {
      return 0x55ffff; // Cyan
    } else if (type.includes('vent')) {
      return 0x333333; // Dark gray
    } else {
      // Default sandy color
      return 0xc2b280;
    }
  }
  
  /**
   * Create a simple placeholder geometry for instanced rendering
   * Enhanced to support more types of decorations
   */
  private createPlaceholderGeometry(type: string): THREE.BufferGeometry {
    try {
      // Default to box geometry
      let geometry: THREE.BufferGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  
      if (type.includes('coral') || type.includes('plant') || type.includes('seaweed') || type.includes('kelp')) {
        geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 6);
      } else if (type.includes('rock')) {
        geometry = new THREE.IcosahedronGeometry(0.4, 0);
      } else if (type.includes('grass')) {
        geometry = new THREE.PlaneGeometry(0.1, 0.5);
      } else if (type.includes('jellyfish')) {
        geometry = new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI*2, 0, Math.PI/2);
        geometry.rotateX(Math.PI); // Flip
      } else if (type.includes('bubble')) {
        geometry = new THREE.SphereGeometry(0.1, 8, 6);
      } else if (type.includes('vent')) {
        geometry = new THREE.CylinderGeometry(0.2, 0.4, 0.6, 8);
      } else if (type.includes('crystal')) {
        geometry = new THREE.OctahedronGeometry(0.3, 0);
      }
      
      // Compute normals for proper lighting
      try {
        geometry.computeVertexNormals();
      } catch(e) {
        console.warn("Could not compute normals for placeholder:", type, e);
      }
  
      return geometry;
    } catch (error) {
      console.warn(`Error creating placeholder geometry for ${type}:`, error);
      // Fallback to most basic shape
      return new THREE.BoxGeometry(0.3, 0.3, 0.3);
    }
  }
  
  /**
   * Create a decoration based on its definition
   * @param definition Decoration definition
   * @param position World position
   * @param theme Current environment theme
   * @returns Created decoration object
   */
  public createDecoration(
    definition: DecorationDefinition,
    position: THREE.Vector3,
    theme: EnvironmentTheme
  ): THREE.Object3D | null {
    // Check if we can use instancing for this decoration type
    if (this.config.useInstancing && this.instancedMeshes.has(definition.type)) {
      return this.createInstancedDecoration(definition, position, theme);
    } else {
      return this.createUniqueDecoration(definition, position, theme);
    }
  }
  
  /**
   * Create an instanced decoration
   */
  private createInstancedDecoration(
    definition: DecorationDefinition,
    position: THREE.Vector3,
    theme: EnvironmentTheme
  ): THREE.Object3D | null {
    const type = definition.type;
    const instancedMesh = this.instancedMeshes.get(type);
    
    if (!instancedMesh) return null;
    
    // Get current instance count
    const count = this.instanceCount.get(type) || 0;
    
    // Check if we've reached the maximum instances
    if (count >= this.config.maxInstancesPerType) {
      return null;
    }
    
    // Calculate variation for this instance
    const scale = typeof definition.scale === 'number'
      ? definition.scale * (1 + (Math.random() - 0.5) * definition.scaleVariance)
      : definition.scale.clone().multiplyScalar(1 + (Math.random() - 0.5) * definition.scaleVariance);
    
    // Random rotation
    const rotation = new THREE.Euler(
      0,
      Math.random() * definition.rotationVariance,
      0
    );
    
    // Apply Y offset
    const finalPosition = position.clone();
    finalPosition.y += definition.yOffset;
    
    // Create transform matrix
    const matrix = new THREE.Matrix4();
    
    if (typeof scale === 'number') {
      matrix.compose(
        finalPosition,
        new THREE.Quaternion().setFromEuler(rotation),
        new THREE.Vector3(scale, scale, scale)
      );
    } else {
      matrix.compose(
        finalPosition,
        new THREE.Quaternion().setFromEuler(rotation),
        scale
      );
    }
    
    // Update instanced mesh
    instancedMesh.setMatrixAt(count, matrix);
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    // Increment count
    this.instanceCount.set(type, count + 1);
    
    // Update material color to match theme
    if (instancedMesh.material instanceof THREE.MeshStandardMaterial) {
      // Base decoration color on theme color
      const baseColor = this.getColorForType(type);
      const themeColor = theme.decorationColor || baseColor;
      
      // Mix the theme and base color
      const color = new THREE.Color(baseColor).lerp(new THREE.Color(themeColor), 0.3);
      instancedMesh.material.color = color;
    }
    
    // Return a dummy object with original position for reference
    const dummy = new THREE.Object3D();
    dummy.position.copy(finalPosition);
    return dummy;
  }
  
  /**
   * Create a unique decoration object - refactored to prioritize procedural generation
   */
  private createUniqueDecoration(
    definition: DecorationDefinition,
    position: THREE.Vector3,
    theme: EnvironmentTheme
  ): THREE.Object3D {
    let decorationObj: THREE.Object3D | null = null;

    try {
      // 1. Check cache first
      const cached = this.decorationCache.get(definition.type);
      
      if (cached && cached.geometry && cached.material) {
        try {
          // Clone geometry and material from cache
          const geometry = cached.geometry.clone();
          
          // Clone material or array of materials
          let material: THREE.Material | THREE.Material[];
          
          if (Array.isArray(cached.material)) {
            material = cached.material.map(mat => mat.clone());
          } else {
            material = cached.material.clone();
          }
          
          // Create mesh
          decorationObj = new THREE.Mesh(geometry, material);
          decorationObj.name = `cached_${definition.type}`;
        } catch (cacheError) {
          console.warn(`Error using cached decoration for ${definition.type}:`, cacheError);
          decorationObj = null; // Force re-creation
        }
      }

      // 2. If not cached, try procedural generation first (prioritize procedural over asset loading)
      if (!decorationObj) {
        try {
          // Check if we have a procedural creator function for this type
          const creatorFunction = decorationCreators[definition.type];
          
          if (creatorFunction) {
            console.log(`Creating procedural decoration for ${definition.type}`);
            
            try {
              // Call the appropriate static creation method
              decorationObj = creatorFunction(definition);
            } catch (proceduralError) {
              console.error(`❌ Error with procedural generation for ${definition.type}:`, proceduralError);
              // Don't create placeholder yet - try asset loading first as fallback
              decorationObj = null;
            }
          } else {
            // No creator function found for this type - will try asset loading
            console.log(`No procedural creator found for ${definition.type}, trying asset loading.`);
            decorationObj = null;
          }
        } catch (proceduralGenError) {
          console.warn(`Error during procedural generation attempt for ${definition.type}:`, proceduralGenError);
          decorationObj = null; // Will try asset loading next
        }
      }
      
      // 3. If still no decoration object, try to load from asset manager as fallback
      if (!decorationObj && this.assetManager) {
        // Check if this asset type is in our "known missing" list to avoid unnecessary warnings
        const knownMissingTypes = [
          'shipPart', 'treasure', 'anchor', 'shipHull', 'barrel', 'floatingDebris',
          'bioluminescentCoral', 'deepsea_vent', 'crystalFormation', 'glowingPlant'
        ];
        
        try {
          // Only attempt to load assets that aren't known to be missing
          if (!knownMissingTypes.includes(definition.type)) {
            console.log(`Attempting to load asset for ${definition.type} as fallback`);
            
            const asset = this.assetManager.getAsset(`decoration_${definition.type}`);
            
            if (asset && asset.scene) {
              // Successfully loaded the asset
              try {
                // Clone and optimize the loaded asset
                decorationObj = asset.scene.clone();
                
                // Apply optimizations using passed device capabilities
                if (decorationObj) {
                  decorationObj = optimizeModelAsset(decorationObj, this.deviceCapabilities);
                }
                
                // Check if the asset is valid (has actual geometry)
                let hasValidGeometry = false;
                if (decorationObj) {
                  decorationObj.traverse((obj) => {
                    if (obj instanceof THREE.Mesh && obj.geometry) {
                      hasValidGeometry = true;
                    }
                  });
                  
                  // If the asset doesn't have valid geometry, go to fallback
                  if (!hasValidGeometry) {
                    decorationObj = null;
                    throw new Error("Loaded asset has no valid geometry");
                  }
                } else {
                  throw new Error("Asset clone failed, returned null object");
                }
              } catch (optimizeError) {
                console.log(`Error optimizing asset for ${definition.type}: ${optimizeError}`);
                decorationObj = null;
              }
            } else {
              // Asset not found
              decorationObj = null;
              console.log(`Asset not found for ${definition.type}`);
            }
          } else {
            // Skip loading for known missing assets
            decorationObj = null;
            console.log(`Skipping known missing asset: ${definition.type}`);
          }
        } catch (assetError) {
          console.warn(`Error loading asset for ${definition.type}:`, assetError);
          decorationObj = null;
        }
      }

      // 4. If still no decoration object, create a placeholder
      if (!decorationObj) {
        console.warn(`No valid decoration for ${definition.type}, using placeholder`);
        
        try {
          // Last resort - use placeholder
          decorationObj = PlaceholderGenerator.createEntityPlaceholder(definition.type);
        } catch (placeholderError) {
          console.error(`Even placeholder creation failed for ${definition.type}:`, placeholderError);
          // Ultimate emergency fallback
          decorationObj = PlaceholderGenerator.createErrorPlaceholder(`critical_${definition.type}`);
        }
      }

      // 5. Ensure we have a valid decoration object at this point
      if (!decorationObj) {
        console.error(`Failed to create or retrieve decoration for ${definition.type}. Using emergency placeholder.`);
        decorationObj = new THREE.Group(); // Empty group as absolute last resort
        decorationObj.name = `empty_${definition.type}`;
      }

      // 6. Cache the decoration if it's not an error placeholder
      try {
        if (decorationObj && !decorationObj.name.includes('error_placeholder') && decorationObj instanceof THREE.Mesh) {
          this.decorationCache.set(definition.type, {
            geometry: decorationObj.geometry?.clone(),
            material: decorationObj.material ? (Array.isArray(decorationObj.material) ? 
              decorationObj.material.map(m => m.clone()) : decorationObj.material.clone()) : undefined
          });
        }
      } catch (cacheSetError) {
        console.warn(`Error caching decoration for ${definition.type}:`, cacheSetError);
        // Continue without caching - it's not fatal
      }
      
      // 7. Apply decorative variations
      try {
        this.applyVariations(decorationObj, definition, theme);
      } catch (variationError) {
        console.warn(`Error applying variations to ${definition.type}:`, variationError);
        // Continue without variations - it's not fatal
      }
      
      // 8. Position decoration
      const finalPosition = position.clone();
      finalPosition.y += definition.yOffset;
      decorationObj.position.copy(finalPosition);

      // 9. Add cast/receive shadow properties
      decorationObj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      return decorationObj;
    } catch (criticalError) {
      // Ultimate emergency fallback for any uncaught errors
      console.error(`Critical error creating decoration ${definition.type}:`, criticalError);
      return PlaceholderGenerator.createErrorPlaceholder(`critical_${definition.type}`);
    }
  }
  
  /**
   * Create a placeholder decoration
   * Made public so it can be used as a fallback outside this class
   * Refactored to use imported PlaceholderGenerator directly
   */
  public createPlaceholderDecoration(type: string): THREE.Object3D {
    try {
      // Determine the best entity type for the placeholder
      const entityType = type.includes('coral') ? 'coral' : 
                         type.includes('rock') ? 'rock' : 
                         type.includes('seaweed') ? 'decoration' : 
                         type.includes('anemone') ? 'decoration' : 
                         type.includes('kelp') ? 'decoration' : 
                         'decoration';
                        
      // Use our imported PlaceholderGenerator
      return PlaceholderGenerator.createEntityPlaceholder(entityType);
    } catch (error) {
      // If PlaceholderGenerator fails, create a simple error placeholder
      console.error(`Error creating decoration placeholder for ${type}:`, error);
      
      // Emergency fallback - directly create a simple shape
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `emergency_placeholder_${type}`;
      return mesh;
    }
  }
  
  /**
   * Apply variations to a decoration object
   * Improved to handle null or invalid theme objects gracefully
   */
  private applyVariations(
    object: THREE.Object3D,
    definition: DecorationDefinition,
    theme: EnvironmentTheme
  ): void {
    // Apply random rotation
    object.rotation.y = Math.random() * definition.rotationVariance;
    
    // Apply random scale variation
    const scale = typeof definition.scale === 'number'
      ? definition.scale * (1 + (Math.random() - 0.5) * definition.scaleVariance)
      : definition.scale.clone().multiplyScalar(1 + (Math.random() - 0.5) * definition.scaleVariance);
    
    if (typeof scale === 'number') {
      object.scale.set(scale, scale, scale);
    } else {
      object.scale.copy(scale);
    }
    
    // Ensure theme object is valid before applying theme-based variations
    if (theme && typeof theme === 'object') {
      // Apply theme-based color variations
      object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Apply material modifications based on theme
          if (child.material instanceof THREE.Material) {
            this.applyThemeToMaterial(child.material, theme, definition.type);
          } else if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.applyThemeToMaterial(mat, theme, definition.type));
          }
        }
      });
    } else {
      console.warn(`Invalid theme object passed for ${definition.type}, applying default variations`);
      // Apply default variations without theme influence
      this.applyDefaultVariations(object, definition);
    }
  }
  
  /**
   * Apply default variations when theme data is unavailable
   */
  private applyDefaultVariations(
    object: THREE.Object3D,
    definition: DecorationDefinition
  ): void {
    // No theme available, just apply basic material properties
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Apply generic material properties
        if (child.material instanceof THREE.MeshStandardMaterial) {
          // Apply standard values
          child.material.roughness = 0.8;
          child.material.metalness = 0.1;
          
          // Use default color based on decoration type
          const baseColor = this.getColorForType(definition.type);
          child.material.color = new THREE.Color(baseColor);
        } else if (child.material instanceof THREE.MeshPhongMaterial || 
                   child.material instanceof THREE.MeshLambertMaterial) {
          // Use default color for Phong/Lambert materials too
          const baseColor = this.getColorForType(definition.type);
          child.material.color = new THREE.Color(baseColor);
        }
      }
    });
  }
  
  /**
   * Apply theme-based modifications to a material
   * Improved to handle null values gracefully
   */
  private applyThemeToMaterial(
    material: THREE.Material,
    theme: EnvironmentTheme,
    type: string
  ): void {
    // Safety check for material
    if (!material) return;
    
    // Only modify supported material types
    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshLambertMaterial ||
        material instanceof THREE.MeshPhongMaterial) {
      
      // Get base color for this decoration type
      const baseColor = this.getColorForType(type);
      
      // Apply theme influence (30% theme, 70% decoration's natural color)
      if (theme && theme.decorationColor) {
        try {
          const themeColor = new THREE.Color(theme.decorationColor);
          const naturalColor = new THREE.Color(baseColor);
          material.color.copy(naturalColor).lerp(themeColor, 0.3);
        } catch (colorError) {
          console.warn(`Error applying theme color to ${type}:`, colorError);
          // Set fallback color
          material.color = new THREE.Color(baseColor);
        }
      } else {
        // No theme color specified, use base color
        material.color = new THREE.Color(baseColor);
      }
      
      // Apply environment-specific material properties for standard materials
      if (material instanceof THREE.MeshStandardMaterial) {
        // Safely handle theme properties with fallbacks
        material.roughness = theme && typeof theme.decorationRoughness === 'number' ? 
          theme.decorationRoughness : 0.8;
        material.metalness = theme && typeof theme.decorationMetalness === 'number' ? 
          theme.decorationMetalness : 0.1;
      }
    }
  }
  
  /**
   * Clear all instanced decorations
   */
  public clear(): void {
    this.instancedMeshes.forEach((mesh, type) => {
      // Reset all matrices to be far away
      const matrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
      
      for (let i = 0; i < mesh.count; i++) {
        mesh.setMatrixAt(i, matrix);
      }
      
      mesh.instanceMatrix.needsUpdate = true;
    });
    
    // Reset instance counts
    this.instanceCount.forEach((_, type) => {
      this.instanceCount.set(type, 0);
    });
  }
  
  /**
   * Dispose of factory resources
   */
  public dispose(): void {
    // Dispose of instanced meshes
    this.instancedMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    // Clear cache
    this.decorationCache.clear();
    this.instancedMeshes.clear();
    this.instanceCount.clear();
  }
  
  /**
   * Set the detail level for decorations
   * @param level Detail level (1-3, where 1 is low, 2 is medium, 3 is high)
   */
  setDetailLevel(level: number): void {
    level = Math.max(1, Math.min(3, level));
    
    // Update configuration based on detail level
    this.config.maxPolygonsPerDecoration = level === 1 ? 100 : 
                                          level === 2 ? 500 : 1000;
                                          
    this.config.useLOD = level > 1;
    
    console.log(`DecorationFactory: Set detail level to ${level}, max polygons: ${this.config.maxPolygonsPerDecoration}`);
  }
  
  /**
   * Set the maximum number of decorations
   * @param count Maximum decoration count
   */
  setMaxDecorations(count: number): void {
    this.config.maxInstancesPerType = Math.floor(count / 10); // Distribute across types
    
    console.log(`DecorationFactory: Set max instances per type to ${this.config.maxInstancesPerType}`);
  }
  
  /**
   * Configure the factory to ignore asset loading and use only procedural generation
   * This is useful for tests and environments without loaded assets
   * @param ignoreAssets Whether to ignore asset loading (true = use only procedural)
   */
  setIgnoreAssets(ignoreAssets: boolean = true): void {
    if (ignoreAssets) {
      // Clear the asset manager reference to prevent asset loading attempts
      this.assetManager = undefined;
      console.log('DecorationFactory: Now using only procedural generation (ignoring assets)');
    } else if (!this.assetManager) {
      console.warn('DecorationFactory: Cannot restore asset loading - no AssetManager was provided');
    } else {
      console.log('DecorationFactory: Restored normal asset loading behavior');
    }
  }
}