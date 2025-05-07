import * as THREE from 'three';
import { DeviceCapabilities } from '../../utils/DeviceUtils';
import { NoiseGenerator } from '../../utils/NoiseGenerator';
import { EnvironmentTheme, lerpColor } from './EnvironmentTypes';
// Import the lerp function from EnvironmentTypes to ensure consistency
import { lerp } from './EnvironmentTypes';

/**
 * Configuration options for the ground decoration system
 */
interface GroundSystemConfig {
  maxPebbles: number;
  maxShells: number;
  pebbleDensity: number;
  shellDensity: number;
  useInstancing: boolean;
  groundTextureSize: number;
}

/**
 * Manages the ground decorations like pebbles, shells, and other small details
 */
export class GroundSystem {
  private scene: THREE.Scene;
  private groundGroup: THREE.Group = new THREE.Group();
  private pebbleInstancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private shellInstancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private tempMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private noiseGen: NoiseGenerator;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private DOWN_VECTOR: THREE.Vector3 = new THREE.Vector3(0, -1, 0);
  private groundTexture: THREE.Texture;
  private groundMaterial: THREE.MeshStandardMaterial;
  
  // Configuration
  private config: GroundSystemConfig;
  
  // Current theme
  private currentTheme: EnvironmentTheme;
  
  constructor(
    scene: THREE.Scene, 
    deviceCapabilities: DeviceCapabilities,
    initialTheme: EnvironmentTheme
  ) {
    this.scene = scene;
    this.currentTheme = initialTheme;
    this.noiseGen = new NoiseGenerator(Math.random());
    
    // Configure based on device capabilities
    this.config = this.configureSettings(deviceCapabilities);
    
    // Create ground texture
    this.groundTexture = this.createGroundTexture(this.config.groundTextureSize);
    
    // Create ground material
    this.groundMaterial = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      color: this.currentTheme.groundColor || this.currentTheme.floorColor,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Initialize ground decoration system
    this.initialize();
    
    // Add to scene
    this.scene.add(this.groundGroup);
  }
  
  /**
   * Configure settings based on device capabilities
   */
  private configureSettings(capabilities: DeviceCapabilities): GroundSystemConfig {
    if (capabilities.highEnd) {
      return {
        maxPebbles: 2400,
        maxShells: 600,
        pebbleDensity: 1.5,
        shellDensity: 0.5,
        useInstancing: true,
        groundTextureSize: 1024
      };
    } else if (capabilities.midRange) {
      return {
        maxPebbles: 1600,
        maxShells: 400,
        pebbleDensity: 1.2,
        shellDensity: 0.4,
        useInstancing: true,
        groundTextureSize: 512
      };
    } else {
      return {
        maxPebbles: 800,
        maxShells: 200,
        pebbleDensity: 0.8,
        shellDensity: 0.2,
        useInstancing: true,
        groundTextureSize: 256
      };
    }
  }
  
  /**
   * Create a procedural ground texture
   */
  private createGroundTexture(size: number): THREE.Texture {
    // Create canvas for texture
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to get 2D context for ground texture');
      return new THREE.Texture();
    }
    
    // Fill background with base color
    ctx.fillStyle = '#' + new THREE.Color(this.currentTheme.groundColor || this.currentTheme.floorColor).getHexString();
    ctx.fillRect(0, 0, size, size);
    
    // Add noise texture
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        // Index for RGBA values
        const idx = (y * size + x) * 4;
        
        // Generate noise for this pixel
        const noise1 = this.noiseGen.noise2D(x / 20, y / 20);
        const noise2 = this.noiseGen.noise2D(x / 10, y / 10) * 0.5;
        const noise = (noise1 + noise2) * 0.7; // Normalize to -0.7 to 0.7 range
        
        // Apply noise to RGB values
        data[idx] = Math.max(0, Math.min(255, data[idx] + noise * 30)); // R
        data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise * 30)); // G
        data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise * 30)); // B
        data[idx + 3] = 255; // Alpha
      }
    }
    
    // Add small pebble spots to texture
    for (let i = 0; i < size * 0.2; i++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      const radius = Math.random() * 3 + 1;
      
      // Random pebble color
      const colorShift = Math.random() * 60 - 30;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${128 + colorShift}, ${128 + colorShift}, ${128 + colorShift}, 0.7)`;
      ctx.fill();
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }
  
  /**
   * Initialize the ground decoration system
   */
  private initialize(): void {
    // Create pebble instances
    this.initializePebbleMeshes();
    
    // Create shell instances
    this.initializeShellMeshes();
  }
  
  /**
   * Initialize pebble meshes for instancing
   */
  private initializePebbleMeshes(): void {
    // Create different pebble shapes
    const pebbleTypes = ['small', 'medium', 'large', 'flat'];
    
    pebbleTypes.forEach(type => {
      let geometry: THREE.BufferGeometry;
      
      // Create different geometries based on type
      switch (type) {
        case 'small':
          geometry = new THREE.SphereGeometry(0.1, 6, 4);
          break;
        case 'medium':
          geometry = new THREE.SphereGeometry(0.15, 8, 5);
          break;
        case 'large':
          geometry = new THREE.SphereGeometry(0.2, 9, 6);
          break;
        case 'flat':
          geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8, 1);
          break;
        default:
          geometry = new THREE.SphereGeometry(0.1, 6, 4);
      }
      
      // Add noise to pebble geometry for more natural look
      this.addGeometryNoise(geometry, 0.03);
      
      // Create material based on current theme
      const material = new THREE.MeshStandardMaterial({
        color: this.currentTheme.groundColor || 0xc2b280,
        roughness: 0.9,
        metalness: 0.1
      });
      
      // Create instanced mesh
      const count = Math.floor(this.config.maxPebbles / pebbleTypes.length);
      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      
      // Add to pebbles group
      this.groundGroup.add(instancedMesh);
      this.pebbleInstancedMeshes.set(type, instancedMesh);
    });
  }
  
  /**
   * Add noise to geometry vertices for more natural shapes
   */
  private addGeometryNoise(geometry: THREE.BufferGeometry, amount: number): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      // Get vertex
      vertex.fromBufferAttribute(positions, i);
      
      // Add noise based on vertex position
      const noise = this.noiseGen.noise3D(
        vertex.x * 5, 
        vertex.y * 5, 
        vertex.z * 5
      ) * amount;
      
      // Scale vertex by noise
      vertex.multiplyScalar(1 + noise);
      
      // Set new position
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  /**
   * Initialize shell meshes for instancing
   */
  private initializeShellMeshes(): void {
    // Create different shell shapes
    const shellTypes = ['conical', 'spiral', 'flat'];
    
    shellTypes.forEach(type => {
      let geometry: THREE.BufferGeometry;
      
      // Create different geometries based on type
      switch (type) {
        case 'conical':
          geometry = new THREE.ConeGeometry(0.12, 0.25, 8, 1);
          geometry.rotateX(Math.PI / 2);
          break;
        case 'spiral':
          geometry = this.createSpiralShellGeometry(0.15, 3, 12);
          break;
        case 'flat':
          geometry = new THREE.CircleGeometry(0.15, 8);
          geometry.rotateX(Math.PI / 2);
          break;
        default:
          geometry = new THREE.SphereGeometry(0.1, 8, 8);
          geometry.rotateX(Math.PI / 2);
      }
      
      // Create material based on current theme
      const material = new THREE.MeshStandardMaterial({
        color: 0xf8f8f8,
        roughness: 0.5,
        metalness: 0.3
      });
      
      // Create instanced mesh
      const count = Math.floor(this.config.maxShells / shellTypes.length);
      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      
      // Add to pebbles group
      this.groundGroup.add(instancedMesh);
      this.shellInstancedMeshes.set(type, instancedMesh);
    });
  }
  
  /**
   * Create a spiral shell geometry
   */
  private createSpiralShellGeometry(radius: number = 0.15, spirals: number = 3, detail: number = 16): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const points = [];
    
    // Create spiral shape
    for (let i = 0; i <= detail * spirals; i++) {
      const angle = (i / (detail * spirals)) * Math.PI * 2 * spirals;
      const r = radius * (i / (detail * spirals)); // Radius increases with angle
      points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
    }
    
    shape.setFromPoints(points);
    
    // Extrude settings
    const extrudeSettings = {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005
    };
    
    // Create geometry
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // Center geometry at origin
    geometry.rotateX(Math.PI / 2); // Lay flat
    
    return geometry;
  }
  
  /**
   * Generate pebbles and shells in a region
   * @param center Center position for generation
   * @param width Width of generation area
   * @param depth Depth of generation area
   * @param floorMeshes Floor meshes to place pebbles on
   */
  public populateRegion(
    center: THREE.Vector3,
    width: number,
    depth: number,
    floorMeshes: THREE.Mesh[]
  ): void {
    // Reset instance counters
    let pebbleCounts: Map<string, number> = new Map();
    let shellCounts: Map<string, number> = new Map();
    
    this.pebbleInstancedMeshes.forEach((mesh, type) => {
      pebbleCounts.set(type, 0);
    });
    
    this.shellInstancedMeshes.forEach((mesh, type) => {
      shellCounts.set(type, 0);
    });
    
    // Calculate pebble and shell counts based on density
    const area = width * depth;
    const totalPebbles = Math.min(
      this.config.maxPebbles,
      Math.floor(area * this.config.pebbleDensity)
    );
    
    const totalShells = Math.min(
      this.config.maxShells,
      Math.floor(area * this.config.shellDensity)
    );
    
    // Generate pebbles
    for (let i = 0; i < totalPebbles; i++) {
      // Random position within region
      const x = center.x + (Math.random() - 0.5) * width;
      const z = center.z + (Math.random() - 0.5) * depth;
      
      // Select a random pebble type
      const pebbleTypes = Array.from(this.pebbleInstancedMeshes.keys());
      const pebbleType = pebbleTypes[Math.floor(Math.random() * pebbleTypes.length)];
      
      // Get current count for this type
      const count = pebbleCounts.get(pebbleType) || 0;
      
      // Get instancedMesh for this type
      const instancedMesh = this.pebbleInstancedMeshes.get(pebbleType);
      
      if (instancedMesh && count < instancedMesh.count) {
        // Place pebble on the floor
        const position = this.placeOnFloor(new THREE.Vector3(x, 100, z), floorMeshes);
        
        // Apply random rotation
        const rotation = new THREE.Euler(
          0,
          Math.random() * Math.PI * 2,
          0
        );
        
        // Apply slight random scaling for variety
        const scale = 0.8 + Math.random() * 0.4;
        
        // Set instance matrix
        this.tempMatrix.compose(
          position,
          new THREE.Quaternion().setFromEuler(rotation),
          new THREE.Vector3(scale, scale, scale)
        );
        
        instancedMesh.setMatrixAt(count, this.tempMatrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Increment count
        pebbleCounts.set(pebbleType, count + 1);
      }
    }
    
    // Generate shells
    for (let i = 0; i < totalShells; i++) {
      // Random position within region
      const x = center.x + (Math.random() - 0.5) * width;
      const z = center.z + (Math.random() - 0.5) * depth;
      
      // Select a random shell type
      const shellTypes = Array.from(this.shellInstancedMeshes.keys());
      const shellType = shellTypes[Math.floor(Math.random() * shellTypes.length)];
      
      // Get current count for this type
      const count = shellCounts.get(shellType) || 0;
      
      // Get instancedMesh for this type
      const instancedMesh = this.shellInstancedMeshes.get(shellType);
      
      if (instancedMesh && count < instancedMesh.count) {
        // Place shell on the floor
        const position = this.placeOnFloor(new THREE.Vector3(x, 100, z), floorMeshes);
        
        // Apply random rotation
        const rotation = new THREE.Euler(
          0,
          Math.random() * Math.PI * 2,
          0
        );
        
        // Apply slight random scaling for variety
        const scale = 0.8 + Math.random() * 0.4;
        
        // Set instance matrix
        this.tempMatrix.compose(
          position,
          new THREE.Quaternion().setFromEuler(rotation),
          new THREE.Vector3(scale, scale, scale)
        );
        
        instancedMesh.setMatrixAt(count, this.tempMatrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Increment count
        shellCounts.set(shellType, count + 1);
      }
    }
  }
  
  /**
   * Place an object on the floor using raycasting
   * @param position Initial position above the floor
   * @param floorMeshes Floor meshes to cast against
   * @returns Position on the floor
   */
  private placeOnFloor(position: THREE.Vector3, floorMeshes: THREE.Mesh[]): THREE.Vector3 {
    // Set up raycaster
    this.raycaster.set(position, this.DOWN_VECTOR);
    
    // Test each floor mesh
    for (const floor of floorMeshes) {
      const intersects = this.raycaster.intersectObject(floor, false);
      
      if (intersects.length > 0) {
        // Position slightly above the floor to avoid z-fighting
        return intersects[0].point.clone().add(new THREE.Vector3(0, 0.05, 0));
      }
    }
    
    // If no intersection found, use original position but at y=0
    return new THREE.Vector3(position.x, 0, position.z);
  }
  
  /**
   * Update the ground system with a new environment theme
   * @param newTheme New environment theme
   * @param transitionProgress Transition progress (0-1)
   * @param previousTheme Optional previous theme for transitions
   */
  public updateTheme(
    newTheme: EnvironmentTheme, 
    transitionProgress: number = 1.0,
    previousTheme?: EnvironmentTheme
  ): void {
    // Update pebble colors
    this.pebbleInstancedMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        if (previousTheme && transitionProgress < 1.0) {
          // Interpolate colors for transition
          const prevColor = previousTheme.groundColor || 0xc2b280;
          const newColor = newTheme.groundColor || 0xc2b280;
          
          // Convert to THREE.Color for lerp
          const colorA = new THREE.Color(prevColor);
          const colorB = new THREE.Color(newColor);
          
          // Lerp between colors
          mesh.material.color.copy(colorA).lerp(colorB, transitionProgress);
        } else {
          // Just set new color
          mesh.material.color.set(newTheme.groundColor || 0xc2b280);
        }
      }
    });
    
    // Update ground material
    if (this.groundMaterial) {
      if (previousTheme && transitionProgress < 1.0) {
        // Interpolate colors for transition
        const prevColor = previousTheme.groundColor || previousTheme.floorColor;
        const newColor = newTheme.groundColor || newTheme.floorColor;
        
        // Use lerpColor function from EnvironmentTypes
        const lerpedColor = lerpColor(prevColor, newColor, transitionProgress);
        this.groundMaterial.color.set(lerpedColor);
        
        // Interpolate other properties
        if (previousTheme.floorRoughness !== undefined && newTheme.floorRoughness !== undefined) {
          this.groundMaterial.roughness = lerp(previousTheme.floorRoughness, newTheme.floorRoughness, transitionProgress);
        }
        
        if (previousTheme.floorMetalness !== undefined && newTheme.floorMetalness !== undefined) {
          this.groundMaterial.metalness = lerp(previousTheme.floorMetalness, newTheme.floorMetalness, transitionProgress);
        }
      } else {
        // Just set new color and properties
        this.groundMaterial.color.set(newTheme.groundColor || newTheme.floorColor);
        
        if (newTheme.floorRoughness !== undefined) {
          this.groundMaterial.roughness = newTheme.floorRoughness;
        }
        
        if (newTheme.floorMetalness !== undefined) {
          this.groundMaterial.metalness = newTheme.floorMetalness;
        }
      }
    }
    
    // Store current theme
    this.currentTheme = newTheme;
  }
  
  /**
   * Update ground decorations position with player movement
   * @param playerPosition Player's current position
   */
  public update(playerPosition: THREE.Vector3): void {
    // Move the entire ground decoration group with the player
    // This creates an illusion of infinite ground without actually moving instances
    this.groundGroup.position.x = playerPosition.x;
    this.groundGroup.position.z = playerPosition.z;
  }
  
  /**
   * Create a ground plane with the current material
   * @param width Width of the plane
   * @param height Height of the plane
   * @returns Mesh representing the ground plane
   */
  public createGroundPlane(width: number, height: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
    const mesh = new THREE.Mesh(geometry, this.groundMaterial);
    mesh.rotation.x = -Math.PI / 2; // Rotate to lie flat
    mesh.receiveShadow = true;
    return mesh;
  }
  
  /**
   * Clear all ground decorations
   */
  public clear(): void {
    this.pebbleInstancedMeshes.forEach((mesh) => {
      // Reset all instances
      for (let i = 0; i < mesh.count; i++) {
        // Move far away to effectively hide
        this.tempMatrix.makeTranslation(0, -1000, 0);
        mesh.setMatrixAt(i, this.tempMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
    
    this.shellInstancedMeshes.forEach((mesh) => {
      // Reset all instances
      for (let i = 0; i < mesh.count; i++) {
        // Move far away to effectively hide
        this.tempMatrix.makeTranslation(0, -1000, 0);
        mesh.setMatrixAt(i, this.tempMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  }
  
  /**
   * Dispose of ground system resources
   */
  public dispose(): void {
    // Remove group from scene
    this.scene.remove(this.groundGroup);
    
    // Dispose of ground texture
    if (this.groundTexture) {
      this.groundTexture.dispose();
    }
    
    // Dispose of ground material
    if (this.groundMaterial) {
      this.groundMaterial.dispose();
    }
    
    // Dispose of geometries and materials for pebbles
    this.pebbleInstancedMeshes.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    // Dispose of geometries and materials for shells
    this.shellInstancedMeshes.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    // Clear maps
    this.pebbleInstancedMeshes.clear();
    this.shellInstancedMeshes.clear();
  }
}