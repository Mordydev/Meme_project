import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';
import { detectDeviceCapabilities, DeviceCapabilities } from '../../utils/DeviceUtils';
import { WaterEffects } from './WaterEffects';
import { EnvironmentSegment } from './EnvironmentSegment';
import { 
  EnvironmentTheme, 
  EnvironmentType, 
  ENVIRONMENT_THEMES, 
  applyEnvironmentTheme,
  lerpThemes
} from './EnvironmentTypes';
import { 
  DecorationDefinition, 
  getDecorationsForEnvironment 
} from './DecorationDefinitions';
import { DecorationFactory } from './DecorationModels';

/**
 * ProceduralEnvironment is responsible for generating and managing the underwater environment
 * It creates segments of terrain with decorations and handles the transitions between environment types
 */
export class ProceduralEnvironment {
  private scene: THREE.Scene;
  private segments: EnvironmentSegment[] = [];
  private segmentLength: number = 100;
  private segmentWidth: number = 40;
  private visibleSegments: number = 3;
  private maxSegments: number = 10; // Maximum number of segments to keep in memory
  private currentTheme: EnvironmentTheme;
  private previousTheme: EnvironmentTheme | null = null;
  private nextThemeChange: number = 0;
  private totalDistance: number = 0;
  private waterEffects: WaterEffects;
  private themeTransitionProgress: number = 1.0; // 1.0 means fully transitioned
  private skyboxMesh?: THREE.Mesh;
  private renderer: THREE.WebGLRenderer;
  private deviceCapabilities: DeviceCapabilities;
  
  // Performance optimization
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraViewMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private tempMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Settings based on device capabilities
  private qualitySettings: {
    useInstancing: boolean;
    maxInstancesPerType: number;
    useLOD: boolean;
    maxPolygonsPerDecoration: number;
    cullingDistance: number;
  } = {
    useInstancing: true,
    maxInstancesPerType: 300,
    useLOD: true,
    maxPolygonsPerDecoration: 1000,
    cullingDistance: 200
  };
  
  // Cached geometries and materials for decoration types
  private decorationCache: Map<string, {
    geometry?: THREE.BufferGeometry,
    material?: THREE.Material | THREE.Material[],
    instance?: THREE.InstancedMesh
  }> = new Map();
  
  // Track instanced meshes by type
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private instanceMatrices: Map<string, Float32Array> = new Map();
  private instanceCount: Map<string, number> = new Map();
  
  // For object pooling
  private decorationPool: Map<string, THREE.Object3D[]> = new Map();
  
  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.currentTheme = ENVIRONMENT_THEMES.reef; // Start with reef environment
    
    // Initialize quality settings based on device capabilities
    this.deviceCapabilities = detectDeviceCapabilities();
    this.configureQualitySettings(this.deviceCapabilities);
    
    // Initialize instanced meshes for common decoration types
    this.initInstancedMeshes();
    
    // Add instanced meshes to scene
    this.instancedMeshes.forEach(mesh => {
      this.scene.add(mesh);
    });
    
    // Create skybox
    this.createSkybox();
    
    // Initialize with a few segments
    for (let i = 0; i < this.visibleSegments; i++) {
      this.createSegment(new THREE.Vector3(0, 0, i * this.segmentLength));
    }
    
    // Create water effects
    // Use the already detected capabilities from constructor
    const quality = this.deviceCapabilities.highEnd ? 'high' : 
                 this.deviceCapabilities.midRange ? 'medium' : 'low';
    this.waterEffects = new WaterEffects(scene, quality);
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
  
  /**
   * Configure quality settings based on device capabilities
   */
  private configureQualitySettings(capabilities: DeviceCapabilities): void {
    if (capabilities.highEnd) {
      this.qualitySettings = {
        useInstancing: true,
        maxInstancesPerType: 500,
        useLOD: true,
        maxPolygonsPerDecoration: 2000,
        cullingDistance: 300
      };
    } else if (capabilities.midRange) {
      this.qualitySettings = {
        useInstancing: true,
        maxInstancesPerType: 300,
        useLOD: true,
        maxPolygonsPerDecoration: 1000,
        cullingDistance: 200
      };
    } else {
      // Low-end device
      this.qualitySettings = {
        useInstancing: true,
        maxInstancesPerType: 150,
        useLOD: true,
        maxPolygonsPerDecoration: 500,
        cullingDistance: 150
      };
      
      // Reduce visible segments for low-end devices
      this.visibleSegments = 2;
      this.maxSegments = 5;
    }
    
    // Mobile specific adjustments
    if (capabilities.mobile) {
      this.qualitySettings.maxInstancesPerType = Math.floor(this.qualitySettings.maxInstancesPerType * 0.7);
      this.qualitySettings.cullingDistance *= 0.8;
      this.qualitySettings.maxPolygonsPerDecoration = Math.floor(this.qualitySettings.maxPolygonsPerDecoration * 0.6);
    }
  }
  
  /**
   * Initialize instanced meshes for common decoration types
   */
  private initInstancedMeshes(): void {
    // Create instanced meshes for common decoration types
    const instanceTypes = [
      'coral1', 'coral2', 'seaweed1', 'seaGrass', 'rock1', 'rock2',
      'floatingPlankton', 'schoolOfFish'
    ];
    
    instanceTypes.forEach(type => {
      // Find the definition for this type
      const definitions = getDecorationsForEnvironment('reef');
      const definition = definitions.find(def => def.type === type);
      
      if (!definition) return;
      
      // Create a template decoration
      const templateMesh = DecorationFactory.createDecoration(definition);
      
      // Extract geometry and material
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
  
  /**
   * Create a decoration with performance optimizations
   */
  private createDecoration(definition: DecorationDefinition): THREE.Object3D {
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
    
    // If instancing is not possible or we've reached the limit, check if we have a pooled object
    if (this.decorationPool.has(definition.type)) {
      const pool = this.decorationPool.get(definition.type)!;
      if (pool.length > 0) {
        // Reuse an object from the pool
        const decoration = pool.pop()!;
        
        // Reset the object (scale, rotation, etc.)
        const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
        const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
        decoration.scale.set(finalScale, finalScale, finalScale);
        decoration.rotation.y = Math.random() * definition.rotationVariance;
        
        return decoration;
      }
    }
    
    // If no pooled object is available, create a new one
    const decoration = DecorationFactory.createDecoration(definition);
    
    // If we're using LOD, create a low-poly version for distance rendering
    if (this.qualitySettings.useLOD) {
      const lodGroup = new THREE.LOD();
      
      // Add the full detail mesh at close range
      lodGroup.addLevel(decoration, 0);
      
      // Create and add a lower detail version for medium range
      const mediumDetail = DecorationFactory.createLowPolyVersion(decoration, 0.5);
      lodGroup.addLevel(mediumDetail, 50);
      
      // Create and add a low detail version for far range
      const lowDetail = DecorationFactory.createLowPolyVersion(decoration, 0.2);
      lodGroup.addLevel(lowDetail, 150);
      
      return lodGroup;
    }
    
    return decoration;
  }
  
  /**
   * Create an environment segment at the specified position
   */
  private createSegment(position: THREE.Vector3): EnvironmentSegment {
    // Determine environment type based on distance
    const environmentType = this.determineEnvironmentType(position.z);
    const theme = ENVIRONMENT_THEMES[environmentType];
    
    // Create the segment
    const segment = new EnvironmentSegment(
      this.scene,
      theme,
      position,
      this.segmentLength,
      this.segmentWidth,
      false // We'll add decorations manually for better control
    );
    
    // Add decorations to the segment
    this.addDecorationsToSegment(segment, theme);
    
    // Store the segment
    this.segments.push(segment);
    
    return segment;
  }
  
  /**
   * Add decorations to a segment
   */
  private addDecorationsToSegment(segment: EnvironmentSegment, theme: EnvironmentTheme): void {
    // Filter decorations for current environment type
    const availableDecorations = getDecorationsForEnvironment(theme.type);
    
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
      const z = (Math.random() - 0.5) * (segment.segmentLength - 5) + segment.mesh.position.z;
      
      decoration.position.set(x, chosenDecoration.yOffset, z - segment.mesh.position.z);
      
      // For decorations that can float above ground, adjust Y position
      if (chosenDecoration.canFloatAboveGround) {
        decoration.position.y += Math.random() * 3;
      }
      
      // Add to segment's decorations group
      segment.decorations.add(decoration);
    }
  }
  
  /**
   * Determine which environment type to use based on distance
   */
  private determineEnvironmentType(distance: number): EnvironmentType {
    // Check if we need to transition to a new environment
    if (distance >= this.nextThemeChange) {
      // Choose a new environment type
      const currentType = this.currentTheme.type;
      let availableTypes: EnvironmentType[] = Object.keys(ENVIRONMENT_THEMES) as EnvironmentType[];
      
      // Filter out current type
      availableTypes = availableTypes.filter(type => type !== currentType);
      
      // Choose randomly from available types
      const nextType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      
      // Store previous theme for transition
      this.previousTheme = this.currentTheme;
      
      // Set new current theme
      this.currentTheme = ENVIRONMENT_THEMES[nextType];
      
      // Calculate next theme change distance
      this.nextThemeChange = distance + this.currentTheme.minDistance + Math.random() * 500;
      
      // Start transition
      this.themeTransitionProgress = 0;
      
      // Notify of environment change
      eventBus.emit('environment-change', {
        from: this.previousTheme.type,
        to: this.currentTheme.type,
        distance
      });
    }
    
    return this.currentTheme.type;
  }
  
  /**
   * Get access to water effects instance for external control
   */
  public getWaterEffects(): WaterEffects {
    return this.waterEffects;
  }

  /**
   * Update environment based on player position and camera
   */
  public update(playerPosition: THREE.Vector3, camera: THREE.Camera, deltaTime: number): void {
    this.totalDistance = playerPosition.z;
    
    // Calculate which segment the player is in
    const currentSegmentIndex = Math.floor(playerPosition.z / this.segmentLength);
    
    // Update camera frustum for culling
    this.cameraViewMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewMatrix);
    
    // Generate new segments ahead
    while (this.segments.length - this.maxSegments < currentSegmentIndex + this.visibleSegments) {
      const position = new THREE.Vector3(
        0,
        0,
        (this.segments.length - this.maxSegments + this.segments.length) * this.segmentLength
      );
      
      // Create new segment
      this.createSegment(position);
    }
    
    // Recycle segments behind player
    while (this.segments.length > this.maxSegments && 
           this.segments[0].mesh.position.z < playerPosition.z - this.segmentLength * 2) {
      const segment = this.segments.shift();
      if (segment) {
        // Recycle segment resources
        this.recycleSegment(segment);
      }
    }
    
    // Update theme transition
    if (this.themeTransitionProgress < 1.0 && this.previousTheme) {
      this.themeTransitionProgress += deltaTime / this.currentTheme.transitionDuration;
      this.themeTransitionProgress = Math.min(this.themeTransitionProgress, 1.0);
      
      // Create interpolated theme
      const lerpedTheme = lerpThemes(this.previousTheme, this.currentTheme, this.themeTransitionProgress);
      
      // Apply to scene
      applyEnvironmentTheme(this.scene, this.renderer, lerpedTheme);
      
      // Update skybox colors if it exists
      if (this.skyboxMesh && this.skyboxMesh.material instanceof THREE.ShaderMaterial) {
        const material = this.skyboxMesh.material;
        const topColor = new THREE.Color(lerpedTheme.backgroundColor).lerp(new THREE.Color(0xffffff), 0.3);
        const bottomColor = new THREE.Color(lerpedTheme.backgroundColor).multiplyScalar(0.7);
        
        material.uniforms.topColor.value = topColor;
        material.uniforms.bottomColor.value = bottomColor;
      }
    }
    
    // Update water effects
    if (this.waterEffects) {
      this.waterEffects.update(deltaTime, playerPosition);
    }
    
    // Update skybox position to follow player
    if (this.skyboxMesh) {
      this.skyboxMesh.position.z = playerPosition.z;
    }
    
    // Update all visible segments
    for (const segment of this.segments) {
      // Skip updating if segment is far away
      if (this.isSegmentVisible(segment, camera, playerPosition)) {
        segment.update(deltaTime);
      }
    }
  }
  
  /**
   * Check if a segment is visible to the camera
   */
  private isSegmentVisible(segment: EnvironmentSegment, camera: THREE.Camera, playerPosition: THREE.Vector3): boolean {
    // Distance check
    const distance = playerPosition.distanceTo(segment.mesh.position);
    if (distance > this.qualitySettings.cullingDistance) {
      return false;
    }
    
    // Frustum check
    return segment.isVisibleToCamera(camera);
  }
  
  /**
   * Recycle segment resources
   */
  private recycleSegment(segment: EnvironmentSegment): void {
    // Store decorations in object pools
    segment.decorations.children.forEach(decoration => {
      // Check if it's an instanced decoration reference
      if (decoration.userData.isInstancedDecorationReference) {
        const instanceType = decoration.userData.instanceType;
        const instanceIndex = decoration.userData.instanceIndex;
        
        // Release the instance
        if (this.instancedMeshes.has(instanceType)) {
          const instancedMesh = this.instancedMeshes.get(instanceType)!;
          // Mark instance as unused (we could do this by setting the matrix to scale 0)
          const matrix = new THREE.Matrix4();
          matrix.makeScale(0, 0, 0);
          instancedMesh.setMatrixAt(instanceIndex, matrix);
          instancedMesh.instanceMatrix.needsUpdate = true;
        }
      } else {
        // Regular mesh - add to pool
        const decorationType = decoration.userData.decorationType;
        if (decorationType) {
          if (!this.decorationPool.has(decorationType)) {
            this.decorationPool.set(decorationType, []);
          }
          
          // Store in pool
          this.decorationPool.get(decorationType)!.push(decoration);
        }
      }
    });
    
    // Clear segment decorations without disposing
    while (segment.decorations.children.length > 0) {
      segment.decorations.remove(segment.decorations.children[0]);
    }
    
    // Remove from scene
    this.scene.remove(segment.mesh);
    
    // Dispose segment resources
    segment.dispose();
  }
  
  /**
   * Set environment quality level
   */
  public setQualityLevel(level: 'high' | 'medium' | 'low'): void {
    let settings;
    
    switch (level) {
      case 'high':
        settings = {
          useInstancing: true,
          maxInstancesPerType: 500,
          useLOD: true,
          maxPolygonsPerDecoration: 2000,
          cullingDistance: 300
        };
        break;
      case 'medium':
        settings = {
          useInstancing: true,
          maxInstancesPerType: 300,
          useLOD: true,
          maxPolygonsPerDecoration: 1000,
          cullingDistance: 200
        };
        break;
      case 'low':
        settings = {
          useInstancing: true,
          maxInstancesPerType: 150,
          useLOD: true,
          maxPolygonsPerDecoration: 500,
          cullingDistance: 150
        };
        break;
    }
    
    this.qualitySettings = settings;
    
    // Reset instance meshes
    this.instancedMeshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    
    this.instancedMeshes.clear();
    this.instanceMatrices.clear();
    this.instanceCount.clear();
    
    // Reinitialize instance meshes
    this.initInstancedMeshes();
    
    // Add instanced meshes to scene
    this.instancedMeshes.forEach(mesh => {
      this.scene.add(mesh);
    });
  }
  
  /**
   * Force environment change for testing or specific game events
   */
  public forceEnvironmentChange(type: EnvironmentType, instantTransition: boolean = false): void {
    if (type === this.currentTheme.type) return;
    
    if (instantTransition) {
      // Apply immediately
      this.previousTheme = null;
      this.currentTheme = ENVIRONMENT_THEMES[type];
      this.themeTransitionProgress = 1.0;
      applyEnvironmentTheme(this.scene, this.renderer, this.currentTheme);
      
      // Update visible segments to the new theme
      this.segments.forEach(segment => {
        segment.dispose();
      });
      this.segments = [];
      
      // Initialize with a few segments
      for (let i = 0; i < this.visibleSegments; i++) {
        this.createSegment(new THREE.Vector3(0, 0, i * this.segmentLength));
      }
    } else {
      // Store previous theme for transition
      this.previousTheme = this.currentTheme;
      
      // Set new current theme
      this.currentTheme = ENVIRONMENT_THEMES[type];
      
      // Start transition
      this.themeTransitionProgress = 0;
      
      // Notify of environment change
      eventBus.emit('environment-change', {
        from: this.previousTheme.type,
        to: this.currentTheme.type,
        distance: this.totalDistance
      });
    }
  }
  
  /**
   * Get current environment details
   */
  public getEnvironmentInfo() {
    return {
      type: this.currentTheme.type,
      theme: this.currentTheme,
      isTransitioning: this.previousTheme !== null,
      transitionProgress: this.themeTransitionProgress,
      pendingType: this.previousTheme ? null : this.currentTheme.type
    };
  }
  
  /**
   * Set segment view distance
   */
  public setViewDistance(segmentsAhead: number, segmentsBehind: number): void {
    this.visibleSegments = Math.max(2, Math.min(8, segmentsAhead));
    this.maxSegments = Math.max(this.visibleSegments, segmentsBehind);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Dispose all segments
    for (const segment of this.segments) {
      segment.dispose();
      this.scene.remove(segment.mesh);
    }
    this.segments = [];
    
    // Dispose water effects
    if (this.waterEffects) {
      this.waterEffects.dispose();
    }
    
    // Dispose instanced meshes
    this.instancedMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      this.scene.remove(mesh);
    });
    this.instancedMeshes.clear();
    
    // Dispose decoration pool
    this.decorationPool.forEach(pool => {
      pool.forEach(decoration => {
        if (decoration instanceof THREE.Mesh) {
          if (decoration.geometry) decoration.geometry.dispose();
          if (decoration.material instanceof THREE.Material) decoration.material.dispose();
        }
      });
    });
    this.decorationPool.clear();
    
    // Dispose skybox
    if (this.skyboxMesh) {
      if (this.skyboxMesh.geometry) this.skyboxMesh.geometry.dispose();
      if (this.skyboxMesh.material instanceof THREE.Material) this.skyboxMesh.material.dispose();
      this.scene.remove(this.skyboxMesh);
    }
  }
}