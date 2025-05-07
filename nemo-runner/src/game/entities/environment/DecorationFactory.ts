import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import { DeviceCapabilities, optimizeModelAsset, optimizeGeometry } from '../../utils/DeviceUtils';
import { DecorationDefinition } from './DecorationDefinitions';
import { EnvironmentType, EnvironmentTheme } from './EnvironmentTypes';

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
   * Initialize instanced meshes for common decoration types
   */
  private initializeInstancedMeshes(): void {
    // Common decoration types that benefit from instancing
    const commonTypes = [
      'coral1', 'coral2', 'branchingCoral', 'tubeCoral',
      'rock1', 'rock2', 'seaweed1', 'seaGrass'
    ];
    
    // For each common type, create an instanced mesh
    for (const type of commonTypes) {
      // Create a simple placeholder geometry - will be replaced with real geometry later
      const geometry = this.createPlaceholderGeometry(type);
      
      // Create a basic material
      const material = new THREE.MeshStandardMaterial({
        color: this.getColorForType(type),
        roughness: 0.8,
        metalness: 0.1
      });
      
      // Create instanced mesh
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        this.config.maxInstancesPerType
      );
      
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      
      // Hide all instances initially by moving far away
      const matrix = new THREE.Matrix4().makeTranslation(0, -1000, 0);
      for (let i = 0; i < this.config.maxInstancesPerType; i++) {
        instancedMesh.setMatrixAt(i, matrix);
      }
      
      // Add to scene and track
      this.scene.add(instancedMesh);
      this.instancedMeshes.set(type, instancedMesh);
      this.instanceCount.set(type, 0);
    }
  }
  
  /**
   * Get a color for a decoration type
   */
  private getColorForType(type: string): number {
    // Basic color palette based on decoration type
    if (type.includes('coral')) {
      // Random coral colors
      const coralColors = [0xff7f50, 0xff6347, 0xe9967a, 0xfa8072, 0xf08080];
      return coralColors[Math.floor(Math.random() * coralColors.length)];
    } else if (type.includes('rock')) {
      // Grey rocks
      return 0x808080;
    } else if (type.includes('weed') || type.includes('grass')) {
      // Green plants
      return 0x2e8b57;
    } else {
      // Default sandy color
      return 0xc2b280;
    }
  }
  
  /**
   * Create a simple placeholder geometry for instanced rendering
   */
  private createPlaceholderGeometry(type: string): THREE.BufferGeometry {
    if (type.includes('coral')) {
      // Create a simple coral-like shape
      return new THREE.CylinderGeometry(0.2, 0.3, 1.0, 8);
    } else if (type.includes('rock')) {
      // Create a simple rock shape
      return new THREE.IcosahedronGeometry(0.5, 1);
    } else if (type.includes('seaweed') || type.includes('grass')) {
      // Create a simple plant shape
      return new THREE.CylinderGeometry(0.05, 0.1, 1.0, 4);
    } else {
      // Default cube shape
      return new THREE.BoxGeometry(0.5, 0.5, 0.5);
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
   * Create a unique decoration object
   */
  private createUniqueDecoration(
    definition: DecorationDefinition,
    position: THREE.Vector3,
    theme: EnvironmentTheme
  ): THREE.Object3D {
    let decorationObj: THREE.Object3D;
    
    try {
      // Check cache first
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
        } catch (cacheError) {
          console.warn(`Error using cached decoration for ${definition.type}:`, cacheError);
          // Continue to next approach if cache fails
          throw cacheError;
        }
      } else {
        // Try to load from asset manager with comprehensive error handling
        let assetLoadAttempted = false;
        
        // Check if this asset type is in our "known missing" list to avoid unnecessary warnings
        const knownMissingTypes = [
          'shipPart', 'treasure', 'anchor', 'shipHull', 'barrel', 'floatingDebris',
          'bioluminescentCoral', 'deepsea_vent', 'crystalFormation', 'glowingPlant'
        ];
        
        try {
          // Only attempt to load assets that aren't known to be missing
          if (!knownMissingTypes.includes(definition.type)) {
            assetLoadAttempted = true;
            const asset = this.assetManager?.getAsset(`decoration_${definition.type}`);
            
            if (asset && asset.scene) {
              // Successfully loaded the asset
              try {
                // Clone and optimize the loaded asset
                decorationObj = asset.scene.clone();
                
                // Apply optimizations using passed device capabilities
                decorationObj = optimizeModelAsset(decorationObj, this.deviceCapabilities);
                
                // Check if the asset is valid (has actual geometry)
                let hasValidGeometry = false;
                decorationObj.traverse((obj) => {
                  if (obj instanceof THREE.Mesh && obj.geometry) {
                    hasValidGeometry = true;
                  }
                });
                
                // If the asset doesn't have valid geometry, fall back to placeholder
                if (!hasValidGeometry) {
                  throw new Error("Loaded asset has no valid geometry");
                }
              } catch (optimizeError) {
                // If there's an error optimizing or validating the asset, use placeholder
                console.log(`Error optimizing asset for ${definition.type}: ${optimizeError}`);
                throw optimizeError;
              }
            } else {
              // Asset not found - throw error to proceed to direct procedural creation
              throw new Error(`Asset not found for ${definition.type}`);
            }
          } else {
            // Skip loading for known missing assets, throw to directly use placeholder
            throw new Error(`Skipping known missing asset: ${definition.type}`);
          }
        } catch (assetError) {
          // Direct procedural generation with proper error handling
          console.log(`Creating procedural decoration for ${definition.type}`);
          
          try {
            // Import and use the specialized decoration classes directly
            // CoralDecorations, RockDecorations, etc. from their modules
            
            // Attempt to dynamically select the appropriate decoration module based on type
            let DecorationClass;
            
            try {
              // Try to match the decoration type to a specialized class
              if (definition.type.includes('coral')) {
                DecorationClass = require('../environment/decorations/CoralDecorations').CoralDecorations;
                
                // Call the appropriate method based on subtype
                if (definition.type.includes('branching')) {
                  decorationObj = DecorationClass.createBranchingCoral(definition);
                } else if (definition.type.includes('tube')) {
                  decorationObj = DecorationClass.createTubeCoral(definition);
                } else if (definition.type.includes('cluster')) {
                  decorationObj = DecorationClass.createCoralCluster(definition);
                } else if (definition.type.includes('rock')) {
                  decorationObj = DecorationClass.createCoralRock(definition);
                } else if (definition.type.includes('2')) {
                  decorationObj = DecorationClass.createCoral2(definition);
                } else {
                  // Default coral type
                  decorationObj = DecorationClass.createCoral1(definition);
                }
              } 
              else if (definition.type.includes('rock')) {
                DecorationClass = require('../environment/decorations/RockDecorations').RockDecorations;
                
                // Call the appropriate method based on subtype
                if (definition.type.includes('cluster')) {
                  decorationObj = DecorationClass.createRockCluster(definition);
                } else if (definition.type.includes('2')) {
                  decorationObj = DecorationClass.createRock2(definition);
                } else {
                  // Default rock type
                  decorationObj = DecorationClass.createRock1(definition);
                }
              }
              else if (definition.type.includes('veg') || definition.type.includes('plant') || definition.type.includes('seaweed')) {
                DecorationClass = require('../environment/decorations/VegetationDecorations').VegetationDecorations;
                
                // Call the appropriate method based on subtype
                if (definition.type.includes('seagrass')) {
                  decorationObj = DecorationClass.createSeagrass(definition);
                } else if (definition.type.includes('kelp')) {
                  decorationObj = DecorationClass.createKelpPlant(definition);
                } else {
                  // Default vegetation type
                  decorationObj = DecorationClass.createSeaweed(definition);
                }
              }
              else if (definition.type.includes('ship')) {
                DecorationClass = require('../environment/decorations/ShipwreckDecorations').ShipwreckDecorations;
                
                // Call the appropriate method based on subtype
                if (definition.type.includes('part')) {
                  decorationObj = DecorationClass.createShipPart(definition);
                } else if (definition.type.includes('hull')) {
                  decorationObj = DecorationClass.createShipHull(definition);
                } else {
                  // Default shipwreck type
                  decorationObj = DecorationClass.createShipwreck(definition);
                }
              }
              else {
                // If we can't match to a specialized class, use placeholder
                throw new Error(`No specialized decoration class for type: ${definition.type}`);
              }
            } catch (specializedError) {
              // If the specialized class approach fails, use placeholder
              console.warn(`Error creating specialized decoration for ${definition.type}:`, specializedError);
              throw specializedError;
            }
          } catch (proceduralError) {
            // If direct procedural generation fails, use placeholder as final resort
            console.warn(`Error with procedural generation for ${definition.type}:`, proceduralError);
            decorationObj = this.createPlaceholderDecoration(definition.type);
          }
        }
      }
      
      // If we have a decoration object at this point, cache it for future use
      if (decorationObj) {
        // Cache for future use
        try {
          this.decorationCache.set(definition.type, {
            geometry: (decorationObj instanceof THREE.Mesh) ? decorationObj.geometry?.clone() : undefined,
            material: (decorationObj instanceof THREE.Mesh) ? decorationObj.material : undefined
          });
        } catch (cacheSetError) {
          console.warn(`Error caching decoration for ${definition.type}:`, cacheSetError);
          // Continue without caching - it's not fatal
        }
      } else {
        // If we somehow got here without a decoration object, use placeholder
        console.warn(`No decoration object created for ${definition.type}, using placeholder`);
        decorationObj = this.createPlaceholderDecoration(definition.type);
      }
      
      // Apply decorative variations
      try {
        this.applyVariations(decorationObj, definition, theme);
      } catch (variationError) {
        console.warn(`Error applying variations to ${definition.type}:`, variationError);
        // Continue without variations - it's not fatal
      }
      
      // Position decoration
      const finalPosition = position.clone();
      finalPosition.y += definition.yOffset;
      decorationObj.position.copy(finalPosition);
      
      return decorationObj;
    } catch (criticalError) {
      // Ultimate emergency fallback for any uncaught errors
      console.error(`Critical error creating decoration ${definition.type}:`, criticalError);
      
      // Create a very simple error indicator
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = `critical_error_${definition.type}`;
      
      // Position at the requested location
      const finalPosition = position.clone();
      finalPosition.y += definition.yOffset;
      errorMesh.position.copy(finalPosition);
      
      return errorMesh;
    }
  }
  
  /**
   * Create a placeholder decoration
   * Made public so it can be used as a fallback outside this class
   */
  public createPlaceholderDecoration(type: string): THREE.Object3D {
    try {
      // Try to use the PlaceholderGenerator if available
      try {
        const { PlaceholderGenerator } = require('../../utils/PlaceholderGenerator');
        return PlaceholderGenerator.createEntityPlaceholder(type.includes('coral') ? 'coral' : 
                                                          type.includes('rock') ? 'rock' : 
                                                          type.includes('seaweed') ? 'decoration' : 
                                                          type.includes('anemone') ? 'decoration' : 
                                                          type.includes('kelp') ? 'decoration' : 
                                                          'decoration');
      } catch (importError) {
        // PlaceholderGenerator not available, continue with original implementation
        console.log(`PlaceholderGenerator not available, using legacy placeholder for ${type}`);
      }
      
      // Default color for placeholder objects
      const defaultColor = this.getColorForType(type);
      
      // Create different geometry based on decoration type
      if (type.includes('coral')) {
        // Branching structure for coral
        const coralGroup = new THREE.Group();
        
        // Create base
        const baseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({
          color: defaultColor,
          roughness: 0.8
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.25;
        coralGroup.add(base);
        
        // Add branches
        const branchCount = 4;
        
        for (let i = 0; i < branchCount; i++) {
          const angle = (i / branchCount) * Math.PI * 2;
          const branchGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.8, 4);
          const branch = new THREE.Mesh(branchGeometry, baseMaterial);
          
          branch.position.set(
            Math.sin(angle) * 0.15,
            0.7,
            Math.cos(angle) * 0.15
          );
          
          branch.rotation.x = Math.random() * 0.3;
          branch.rotation.z = Math.random() * 0.3;
          coralGroup.add(branch);
        }
        
        coralGroup.name = `placeholder_coral_${type}`;
        return coralGroup;
      } else if (type.includes('rock')) {
        // Rock geometry
        const geometry = new THREE.IcosahedronGeometry(0.5, 1);
        const material = new THREE.MeshStandardMaterial({
          color: defaultColor,
          roughness: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `placeholder_rock_${type}`;
        return mesh;
      } else if (type.includes('seaweed')) {
        // Seaweed with multiple segments
        const seaweedGroup = new THREE.Group();
        seaweedGroup.name = `placeholder_seaweed_${type}`;
        const segmentCount = 3;
        
        for (let i = 0; i < segmentCount; i++) {
          const height = 0.4;
          const geometry = new THREE.CylinderGeometry(0.05, 0.1, height, 4);
          const material = new THREE.MeshStandardMaterial({
            color: defaultColor,
            roughness: 0.7
          });
          
          const segment = new THREE.Mesh(geometry, material);
          segment.position.y = i * height;
          segment.rotation.x = Math.random() * 0.2;
          segment.rotation.z = Math.random() * 0.2;
          
          seaweedGroup.add(segment);
        }
        
        return seaweedGroup;
      } else if (type.includes('anemone')) {
        // Sea anemone
        const anemoneGroup = new THREE.Group();
        anemoneGroup.name = `placeholder_anemone_${type}`;
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({
          color: defaultColor,
          roughness: 0.8
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        anemoneGroup.add(base);
        
        // Tentacles
        const tentacleCount = 12;
        
        for (let i = 0; i < tentacleCount; i++) {
          const angle = (i / tentacleCount) * Math.PI * 2;
          const tentacleGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.3, 3);
          const tentacle = new THREE.Mesh(tentacleGeometry, baseMaterial);
          
          tentacle.position.set(
            Math.sin(angle) * 0.15,
            0.15,
            Math.cos(angle) * 0.15
          );
          
          tentacle.rotation.x = Math.PI / 2 - Math.random() * 0.3;
          tentacle.rotation.y = angle;
          anemoneGroup.add(tentacle);
        }
        
        return anemoneGroup;
      } else if (type.includes('kelp')) {
        // Kelp with multiple layers
        const kelpGroup = new THREE.Group();
        kelpGroup.name = `placeholder_kelp_${type}`;
        const layerCount = 5;
        
        for (let i = 0; i < layerCount; i++) {
          const height = 0.4;
          const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, height, 3);
          const stemMaterial = new THREE.MeshStandardMaterial({
            color: defaultColor,
            roughness: 0.7
          });
          
          const stem = new THREE.Mesh(stemGeometry, stemMaterial);
          stem.position.y = i * height;
          
          // Add leaf
          const leafGeometry = new THREE.PlaneGeometry(0.3, 0.2);
          const leaf = new THREE.Mesh(leafGeometry, stemMaterial);
          leaf.rotation.y = Math.PI / 2;
          leaf.position.x = 0.15;
          
          stem.add(leaf);
          kelpGroup.add(stem);
        }
        
        return kelpGroup;
      } else {
        // Default box
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({
          color: defaultColor,
          roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `placeholder_default_${type}`;
        return mesh;
      }
    } catch (error) {
      // If all other placeholder creation fails, create a simple error placeholder
      console.error(`Error creating decoration placeholder for ${type}:`, error);
      
      // Emergency fallback
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `emergency_placeholder_${type}`;
      return mesh;
    }
  }
  
  /**
   * Apply variations to a decoration object
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
  }
  
  /**
   * Apply theme-based modifications to a material
   */
  private applyThemeToMaterial(
    material: THREE.Material,
    theme: EnvironmentTheme,
    type: string
  ): void {
    // Only modify supported material types
    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshLambertMaterial ||
        material instanceof THREE.MeshPhongMaterial) {
      
      // Get base color for this decoration type
      const baseColor = this.getColorForType(type);
      
      // Apply theme influence (30% theme, 70% decoration's natural color)
      if (theme.decorationColor) {
        const themeColor = new THREE.Color(theme.decorationColor);
        const naturalColor = new THREE.Color(baseColor);
        material.color.copy(naturalColor).lerp(themeColor, 0.3);
      }
      
      // Apply environment-specific material properties
      if (material instanceof THREE.MeshStandardMaterial) {
        // Adjust roughness and metalness based on theme
        material.roughness = theme.decorationRoughness || 0.8;
        material.metalness = theme.decorationMetalness || 0.1;
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
}