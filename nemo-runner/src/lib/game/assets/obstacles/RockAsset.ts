import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { RockConfig } from '../../config/gameConfig';

export class RockAsset {
  public mesh!: THREE.Group;
  private mainRock!: THREE.Mesh;
  private collisionSphere!: THREE.Mesh;
  private smallRocks: THREE.Mesh[] = [];
  
  constructor(shaderManager?: ShaderManager) {
    // We accept shaderManager parameter for backward compatibility
    // but we don't use it in our implementation
  }
  
  /**
   * Creates an enhanced rock with StandardMaterial and improved geometry
   */
  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group
      this.mesh = new THREE.Group();
      this.mesh.name = "RockObstacle_StdMat";
      
      // Get rock config for visual properties
      const config = this.config;
      const visualConf = config?.visuals || {};
      
      // Create the main rock with enhanced geometry and material
      this.createMainRock(visualConf);
      
      // Add small detail rocks around the base
      this.addSmallRocks(visualConf);
      
      // Add subtle surface details
      this.addSurfaceDetails(this.mainRock, visualConf);
      
      // Create collision sphere
      this.createCollisionSphere();
      
      // Set userData for identification
      this.mesh.userData = {
        type: 'obstacle',
        name: 'rock',
        assetInstance: this,
        isDangerous: false
      };
      
      // Store reference to last created mesh for collision detection
      this._lastCreatedMesh = this.mesh;
      
      return this.mesh;
    } catch (error) {
      console.error("RockAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }
  
  /**
   * Creates the main rock with enhanced geometry
   */
  private createMainRock(visualConf: any): void {
    // Generate random rock dimensions
    const rockHeight = (Math.random() * 0.5 + 0.5) * 0.8; // 0.4 to 0.8 units high
    const rockWidth = Math.random() * 0.5 + 0.8;  // 0.8 to 1.3 units wide
    const rockDepth = Math.random() * 0.5 + 0.8;  // 0.8 to 1.3 units deep
    
    // For greater complexity, choose a different base geometry
    const geomType = Math.floor(Math.random() * 3);
    let geometry;
    
    if (geomType === 0) {
      // Option 1: Icosahedron (more natural for rounded rocks)
      geometry = new THREE.IcosahedronGeometry(Math.min(rockWidth, rockHeight, rockDepth) * 0.5, 2);
      
      // Scale to the desired dimensions
      geometry.scale(rockWidth / rockHeight, 1.0, rockDepth / rockHeight);
    } else if (geomType === 1) {
      // Option 2: Enhanced box geometry (with more segments for finer displacement)
      geometry = new THREE.BoxGeometry(
        rockWidth, 
        rockHeight, 
        rockDepth, 
        5, 5, 5 // More segments for higher detail
      );
    } else {
      // Option 3: Octahedron (angular but natural)
      geometry = new THREE.OctahedronGeometry(Math.min(rockWidth, rockHeight, rockDepth) * 0.5, 2);
      
      // Scale to the desired dimensions
      geometry.scale(rockWidth / rockHeight, 1.0, rockDepth / rockHeight);
    }
    
    // Apply more sophisticated displacement using multiple noise scales
    this.applyMultiScaleDisplacement(geometry, [
      { scale: 0.2, amount: 0.15 },  // Large features
      { scale: 0.1, amount: 0.08 },  // Medium features
      { scale: 0.05, amount: 0.03 }  // Small details
    ]);
    
    // Create StandardMaterial with properties from config
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x787A7A),
      roughness: visualConf.roughness !== undefined ? visualConf.roughness : 0.8,
      metalness: visualConf.metalness !== undefined ? visualConf.metalness : 0.1,
      flatShading: true // Gives a more rugged appearance with flat faces
    });
    
    // Create the mesh and position it
    this.mainRock = new THREE.Mesh(geometry, rockMaterial);
    this.mainRock.name = "MainRock";
    
    // Position so bottom of rock sits at origin
    this.mainRock.position.y = rockHeight / 2;
    
    // Add to group
    this.mesh.add(this.mainRock);
  }
  
  /**
   * Adds small rocks around the base of the main rock
   */
  private addSmallRocks(visualConf: any): void {
    const numSmallRocks = Math.floor(Math.random() * 4) + 2; // 2-5 small rocks
    this.smallRocks = [];
    
    // Get base color and modify for each small rock
    const baseColor = new THREE.Color(visualConf.mainColor || 0x787A7A);
    
    for (let i = 0; i < numSmallRocks; i++) {
      // Random size for small rock
      const size = 0.15 + Math.random() * 0.2; // 0.15-0.35 in size
      
      // Choose random geometry type
      const smallGeomType = Math.floor(Math.random() * 3);
      let smallGeometry;
      
      if (smallGeomType === 0) {
        smallGeometry = new THREE.IcosahedronGeometry(size, 1);
      } else if (smallGeomType === 1) {
        smallGeometry = new THREE.BoxGeometry(size * 1.2, size, size * 1.1, 3, 3, 3);
      } else {
        smallGeometry = new THREE.TetrahedronGeometry(size, 1);
      }
      
      // Apply displacement for a natural look
      this.applyMultiScaleDisplacement(smallGeometry, [
        { scale: 0.15, amount: 0.15 },
        { scale: 0.05, amount: 0.05 }
      ]);
      
      // Create material with slight color variation
      const smallRockColor = baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      const smallRockMaterial = new THREE.MeshStandardMaterial({
        color: smallRockColor,
        roughness: (visualConf.roughness || 0.8) * (0.9 + Math.random() * 0.2),
        metalness: (visualConf.metalness || 0.1) * (0.8 + Math.random() * 0.4),
        flatShading: true
      });
      
      // Create the small rock
      const smallRock = new THREE.Mesh(smallGeometry, smallRockMaterial);
      smallRock.name = `SmallRock_${i}`;
      
      // Position around the main rock
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.4 + Math.random() * 0.3;
      smallRock.position.set(
        Math.cos(angle) * distance,
        size / 2, // Place on ground
        Math.sin(angle) * distance
      );
      
      // Random rotation
      smallRock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Add to group
      this.mesh.add(smallRock);
      this.smallRocks.push(smallRock);
    }
  }
  
  /**
   * Adds surface detail features to a rock
   */
  private addSurfaceDetails(rockMesh: THREE.Mesh, visualConf: any): void {
    // Add cracks, bumps, or other surface features
    const numDetails = Math.floor(Math.random() * 5) + 3; // 3-7 details
    
    // Get base color and modify for details
    const baseColor = new THREE.Color(visualConf.patternColor || visualConf.mainColor || 0x505252);
    
    for (let i = 0; i < numDetails; i++) {
      // Choose detail type
      const detailType = Math.floor(Math.random() * 3);
      let detailGeometry;
      
      if (detailType === 0) {
        // Crack/crevice (thin box)
        const crackLength = 0.2 + Math.random() * 0.3;
        const crackWidth = 0.02 + Math.random() * 0.02;
        const crackDepth = 0.05 + Math.random() * 0.05;
        
        detailGeometry = new THREE.BoxGeometry(crackLength, crackWidth, crackDepth);
      } else if (detailType === 1) {
        // Bump/nodule (small sphere)
        const bumpSize = 0.03 + Math.random() * 0.05;
        detailGeometry = new THREE.SphereGeometry(bumpSize, 8, 6);
      } else {
        // Ridge (elongated cylinder)
        const ridgeLength = 0.15 + Math.random() * 0.2;
        const ridgeRadius = 0.02 + Math.random() * 0.02;
        detailGeometry = new THREE.CylinderGeometry(ridgeRadius, ridgeRadius, ridgeLength, 8);
        // Orient cylinder along the surface
        detailGeometry.rotateX(Math.PI / 2);
      }
      
      // Create material slightly darker than the rock
      const detailColor = baseColor.clone().offsetHSL(0, 0, -0.1 - Math.random() * 0.1);
      const detailMaterial = new THREE.MeshStandardMaterial({
        color: detailColor,
        roughness: Math.min((visualConf.roughness || 0.8) * 1.2, 1.0), // Rougher than the main rock
        metalness: (visualConf.metalness || 0.1) * 0.8, // Less metallic
        flatShading: true
      });
      
      // Create detail mesh
      const detail = new THREE.Mesh(detailGeometry, detailMaterial);
      detail.name = `RockDetail_${i}`;
      
      // Position randomly on rock surface
      // This is a simple approximation - for a more accurate placement,
      // you would need to raytrace to the surface of the rock
      
      // Get rock bounds
      const rockBounds = new THREE.Box3().setFromObject(rockMesh);
      const rockSize = new THREE.Vector3();
      rockBounds.getSize(rockSize);
      
      // Create a direction from center outwards
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      // Scale by rock size and position
      const positionOnSurface = direction.clone().multiply(
        new THREE.Vector3(rockSize.x * 0.4, rockSize.y * 0.4, rockSize.z * 0.4)
      );
      
      // Position relative to rock center
      detail.position.copy(positionOnSurface);
      
      // Orient detail to point outward from rock center
      detail.lookAt(direction.multiplyScalar(10)); // Look along direction
      
      // Add detail to the rock
      rockMesh.add(detail);
    }
  }
  
  /**
   * Applies displacement to geometry at multiple scales for more natural results
   */
  private applyMultiScaleDisplacement(geometry: THREE.BufferGeometry, noiseParams: Array<{scale: number, amount: number}>): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    
    // Get original vertices for normalization
    const originalVertices: THREE.Vector3[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      originalVertices.push(new THREE.Vector3(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2]
      ));
    }
    
    // Find center and max distance for normalization
    const center = new THREE.Vector3();
    let maxDist = 0;
    
    originalVertices.forEach(v => {
      center.add(v);
    });
    center.divideScalar(vertexCount);
    
    originalVertices.forEach(v => {
      const dist = v.distanceTo(center);
      if (dist > maxDist) maxDist = dist;
    });
    
    // Apply multi-scale displacement
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const vertex = new THREE.Vector3(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2]
      );
      
      // Get normalized direction from center
      const dirFromCenter = vertex.clone().sub(center).normalize();
      
      // Get normalized vertex position relative to bounding size (for consistent noise)
      const normPos = vertex.clone().sub(center).divideScalar(maxDist);
      
      // Apply displacement at each scale
      let totalDisplacement = 0;
      
      noiseParams.forEach(param => {
        // Simple noise approximation (for a more sophisticated approach, use Perlin/Simplex noise)
        // We vary displacement based on position to create coherent noise-like patterns
        const noiseX = Math.sin(normPos.x / param.scale * 10) * Math.cos(normPos.y / param.scale * 10);
        const noiseY = Math.sin(normPos.z / param.scale * 10) * Math.cos(normPos.x / param.scale * 10);
        const noiseZ = Math.sin(normPos.y / param.scale * 10) * Math.cos(normPos.z / param.scale * 10);
        
        const noise = new THREE.Vector3(noiseX, noiseY, noiseZ).normalize();
        const scaledDisplacement = param.amount * maxDist;
        
        // Offset vertex
        vertex.x += noise.x * scaledDisplacement;
        vertex.y += noise.y * scaledDisplacement;
        vertex.z += noise.z * scaledDisplacement;
        
        // Add random displacement along the normal direction
        const dispAmount = Math.random() * param.amount * maxDist;
        vertex.add(dirFromCenter.clone().multiplyScalar(dispAmount));
        
        totalDisplacement += scaledDisplacement;
      });
      
      // Set new position
      positions[idx] = vertex.x;
      positions[idx + 1] = vertex.y;
      positions[idx + 2] = vertex.z;
    }
    
    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  /**
   * Creates a collision sphere for the rock
   */
  private createCollisionSphere(): void {
    // Calculate bounds of the entire rock group
    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Calculate collision radius to encompass all rocks
    const collisionRadius = Math.max(size.x, size.y, size.z) * 0.5;
    
    // Create collision geometry
    const collisionGeometry = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionSphere.name = "RockCollisionSphere";
    
    // Center collision sphere based on bounding box
    const center = new THREE.Vector3();
    box.getCenter(center);
    this.collisionSphere.position.copy(center);
    
    // Add to group
    this.mesh.add(this.collisionSphere);
  }
  
  /**
   * Creates a minimal fallback rock in case of errors
   */
  private createMinimalFallback(): void {
    console.warn("RockAsset: Creating minimal fallback model");
    
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "RockFallback";
    
    // Create a simple rock shape
    const geometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const material = new THREE.MeshBasicMaterial({ color: 0x777777 });
    
    this.mainRock = new THREE.Mesh(geometry, material);
    this.mainRock.position.y = 0.3; // Half height
    this.mesh.add(this.mainRock);
    
    // Create simple collision sphere
    const collisionGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionSphere.position.y = 0.3; // Match rock position
    this.mesh.add(this.collisionSphere);
    
    // Set userData for identification
    this.mesh.userData = {
      type: 'obstacle',
      name: 'rock',
      assetInstance: this,
      isDangerous: false
    };
    
    // Store reference for collision detection
    this._lastCreatedMesh = this.mesh;
  }

  /**
   * Reset the rock to its initial state
   * Since rocks have no animation or state, this is a no-op
   */
  public reset(): void {
    // Nothing to reset for static rocks
  }

  /**
   * Dispose of any resources
   */
  public dispose(): void {
    // Clean up geometries and materials
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      
      // Clear references
      this.smallRocks = [];
    }
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    if (this._lastCreatedMesh) {
      // Try to find the collision sphere
      const collisionSphere = this._lastCreatedMesh.getObjectByName("RockCollisionSphere") as THREE.Mesh;
      if (collisionSphere) {
        return collisionSphere;
      }

      // If no collision sphere, return the mesh itself
      if (this.mainRock) {
        return this.mainRock;
      }
    }

    // Fallback to a new simple collision sphere if nothing else is available
    const geometry = new THREE.SphereGeometry(0.6, 8, 8);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Returns the rock mesh group
   * Creates the mesh if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }
  
  /**
   * Get rock configuration with defaults as fallback
   */
  public get config(): RockConfig {
    // Default configuration
    const defaultConfig: RockConfig = {
      visuals: {
        mainColor: 0x787A7A, // Stone gray
        roughness: 0.8, // Very rough surface
        metalness: 0.05, // Minimal sheen
        patternColor: 0x505252, // Darker pattern spots
        textureScale: 5.0 // Scale for procedural noise texture
      }
    };
    
    try {
      return configSystem.getObstaclesConfig()?.rock || defaultConfig;
    } catch (error) {
      console.warn("RockAsset: Could not get rock config, using defaults", error);
      return defaultConfig;
    }
  }

  // Store reference to last created mesh
  private _lastCreatedMesh?: THREE.Group;
}