import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { CoralConfig } from '../../config/gameConfig';

export class CoralAsset {
  public mesh!: THREE.Group;
  private collisionSphere!: THREE.Mesh;
  private branches: THREE.Mesh[] = [];
  private animationTime: number = 0;
  
  constructor(shaderManager?: ShaderManager) {
    // We accept shaderManager parameter for backward compatibility
    // but we don't use it in our implementation
  }

  /**
   * Creates the coral mesh with enhanced geometry and StandardMaterial
   */
  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group
      this.mesh = new THREE.Group();
      this.mesh.name = "CoralObstacle_StdMat";
      
      // Get coral config for visual properties
      const config = this.config;
      const visualConf = config?.visuals || {};
      
      // Create a more complex, fractal-like coral structure
      this.createCoralBranches(visualConf);
      
      // Set userData for identification
      this.mesh.userData = {
        type: 'obstacle',
        name: 'coral',
        assetInstance: this,
        isDangerous: false
      };
      
      // Create collision sphere after all branches are added
      this.createCollisionSphere();
      
      return this.mesh;
    } catch (error) {
      console.error("CoralAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }
  
  /**
   * Creates a more complex, fractal-like coral structure with various branch types
   */
  private createCoralBranches(visualConf: any): void {
    // Clear branches array
    this.branches = [];
    
    // Base properties
    const numPrimaryBranches = Math.floor(Math.random() * 3) + 3; // 3 to 5 primary branches
    const baseColor = new THREE.Color(visualConf.mainColor || 0xFF7F50);
    const emissiveColor = new THREE.Color(visualConf.emissiveColor || baseColor.clone());
    
    // Create a base/ground for the coral
    this.createCoralBase(visualConf);
    
    // Add random primary branches - each with unique properties
    for (let i = 0; i < numPrimaryBranches; i++) {
      // Create variations in color and shape for each primary branch
      const colorVariation = Math.random() * 0.1 - 0.05; // -0.05 to 0.05
      const mainBranchColor = baseColor.clone().offsetHSL(colorVariation, 0, 0);
      
      // Random properties
      const height = 0.7 + Math.random() * 0.8; // 0.7 to 1.5
      const baseRadius = 0.1 + Math.random() * 0.1; // 0.1 to 0.2
      const topRadius = baseRadius * (0.4 + Math.random() * 0.4); // 40-80% of base radius
      const bendFactor = Math.random() * 0.3; // How much the branch bends
      
      // Random position (centered roughly at origin, but with variation)
      const posX = (Math.random() - 0.5) * 0.3;
      const posZ = (Math.random() - 0.5) * 0.3;
      
      // Create primary branch with StandardMaterial
      const primaryBranch = this.createBranch(
        height,
        baseRadius, 
        topRadius,
        {
          mainColor: mainBranchColor,
          emissiveColor: emissiveColor,
          emissiveIntensity: visualConf.emissiveIntensity || 0.15,
          roughness: visualConf.roughness || 0.7,
          metalness: visualConf.metalness || 0.05
        },
        bendFactor
      );
      
      // Position the branch
      primaryBranch.position.set(posX, 0, posZ);
      primaryBranch.rotation.x = (Math.random() - 0.5) * Math.PI * 0.2;
      primaryBranch.rotation.z = (Math.random() - 0.5) * Math.PI * 0.2;
      
      // Add to coral group
      this.mesh.add(primaryBranch);
      this.branches.push(primaryBranch);
      
      // Add secondary branches at various positions along the primary branch
      const numSecondaryBranches = Math.floor(Math.random() * 3) + 1; // 1 to 3 secondary branches
      
      for (let j = 0; j < numSecondaryBranches; j++) {
        // Secondary branches are smaller
        const secondaryHeight = height * (0.3 + Math.random() * 0.4); // 30-70% of primary height
        const secondaryRadius = baseRadius * (0.4 + Math.random() * 0.3); // 40-70% of primary radius
        const secondaryTopRadius = secondaryRadius * (0.4 + Math.random() * 0.3); // 40-70% of its base
        
        // Create secondary branch with slight color variation
        const secondaryBranchColor = mainBranchColor.clone().offsetHSL(Math.random() * 0.05 - 0.025, 0, 0.05);
        const secondaryBranch = this.createBranch(
          secondaryHeight,
          secondaryRadius,
          secondaryTopRadius,
          {
            mainColor: secondaryBranchColor,
            emissiveColor: emissiveColor,
            emissiveIntensity: (visualConf.emissiveIntensity || 0.15) * 0.9,
            roughness: (visualConf.roughness || 0.7) * 0.9,
            metalness: (visualConf.metalness || 0.05) * 0.9
          },
          bendFactor * 1.5
        );
        
        // Position offset from main branch
        const relativeHeight = 0.3 + Math.random() * 0.6; // Position 30-90% up the primary branch
        const angle = Math.random() * Math.PI * 2; // Random angle around primary branch
        const offsetDistance = baseRadius * 0.8; // Distance from primary branch center
        
        secondaryBranch.position.set(
          Math.cos(angle) * offsetDistance,
          relativeHeight * height,
          Math.sin(angle) * offsetDistance
        );
        
        // Random rotation for more organic look
        secondaryBranch.rotation.x = (Math.random() - 0.5) * Math.PI * 0.5;
        secondaryBranch.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
        secondaryBranch.rotation.y = angle; // Point outward from primary branch
        
        // Add secondary branch to primary branch
        primaryBranch.add(secondaryBranch);
        this.branches.push(secondaryBranch);
        
        // Add some small decorative elements to secondary branches
        this.addCoralDecorations(secondaryBranch, secondaryBranchColor, visualConf);
      }
      
      // Add some small decorative elements to primary branch too
      this.addCoralDecorations(primaryBranch, mainBranchColor, visualConf);
    }
    
    // Add some small decorative elements directly to the coral base
    this.addSmallCoralElements(visualConf);
  }
  
  /**
   * Creates a base/ground for the coral to sit on
   */
  private createCoralBase(visualConf: any): void {
    // Create a flattened hemisphere for the base
    const baseGeometry = new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    baseGeometry.scale(1.2, 0.3, 1.2); // Flatten it
    
    // Create a StandardMaterial for the base
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xFF7F50).multiplyScalar(0.8), // Darker than branches
      emissive: new THREE.Color(visualConf.emissiveColor || 0xFF7F50).multiplyScalar(0.6),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.15) * 0.6,
      roughness: (visualConf.roughness || 0.7) * 1.2, // Rougher than branches
      metalness: (visualConf.metalness || 0.05) * 0.5 // Less metallic
    });
    
    // Create and position the base mesh
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.15; // Slightly below origin
    base.rotation.x = Math.PI; // Flip upside down
    
    // Add to coral group
    this.mesh.add(base);
  }
  
  /**
   * Creates a coral branch with enhanced geometry and StandardMaterial
   */
  private createBranch(height: number, baseRadius: number, topRadius: number, materialProps: any, bendFactor: number = 0): THREE.Mesh {
    // Create more complex geometry with slight bend for more organic look
    const segments = 8;
    const radialSegments = 10;
    
    // Create a path for the curved branch
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Apply increasing bend as we go up the branch
      const bendX = bendFactor * Math.sin(t * Math.PI) * height;
      points.push(new THREE.Vector3(bendX, t * height, 0));
    }
    
    const path = new THREE.CatmullRomCurve3(points);
    
    // Create tube geometry along the path
    const getRadius = (t: number) => THREE.MathUtils.lerp(baseRadius, topRadius, t);
    const branchGeometry = new THREE.TubeGeometry(
      path,
      segments * 2, // More segments for smoother curve
      getRadius, // Radius is a function of t
      radialSegments,
      false // Not closed
    );
    
    // Apply some noise to geometry for more organic look
    this.applyNoiseToGeometry(branchGeometry, baseRadius * 0.1);
    
    // Create StandardMaterial with provided properties
    const branchMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(materialProps.mainColor),
      emissive: new THREE.Color(materialProps.emissiveColor),
      emissiveIntensity: materialProps.emissiveIntensity,
      roughness: materialProps.roughness,
      metalness: materialProps.metalness
    });
    
    // Create and return the branch mesh
    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
    branch.name = "CoralBranch";
    
    return branch;
  }
  
  /**
   * Adds small decorative elements to a branch
   */
  private addCoralDecorations(branch: THREE.Mesh, branchColor: THREE.Color, visualConf: any): void {
    // Add some small spherical "polyps" or nodules to the branch
    const numDecorations = Math.floor(Math.random() * 5) + 3; // 3-7 decorations
    
    for (let i = 0; i < numDecorations; i++) {
      // Create small sphere or custom shape
      const decorSize = 0.02 + Math.random() * 0.03; // Small sizes
      
      // Decide on decoration type (sphere, disc, or tiny branch)
      const decorType = Math.floor(Math.random() * 3);
      let decorGeometry;
      
      if (decorType === 0) {
        // Sphere polyp
        decorGeometry = new THREE.SphereGeometry(decorSize, 8, 6);
      } else if (decorType === 1) {
        // Disc polyp
        decorGeometry = new THREE.CylinderGeometry(decorSize, decorSize, decorSize * 0.3, 8);
      } else {
        // Tiny branch polyp
        decorGeometry = new THREE.ConeGeometry(decorSize * 0.6, decorSize * 2, 6);
      }
      
      // Apply slight noise
      this.applyNoiseToGeometry(decorGeometry, decorSize * 0.1);
      
      // Create material with slight color variation
      const decorColor = branchColor.clone().offsetHSL(Math.random() * 0.1 - 0.05, 0, Math.random() * 0.2);
      const decorMaterial = new THREE.MeshStandardMaterial({
        color: decorColor,
        emissive: new THREE.Color(visualConf.emissiveColor || decorColor).multiplyScalar(1.2),
        emissiveIntensity: (visualConf.emissiveIntensity || 0.15) * 1.3, // Brighter than branch
        roughness: (visualConf.roughness || 0.7) * 0.8, // Smoother than branch
        metalness: (visualConf.metalness || 0.05) * 1.2 // More metallic/shiny
      });
      
      // Create decoration mesh
      const decoration = new THREE.Mesh(decorGeometry, decorMaterial);
      
      // Position randomly along the branch
      const t = Math.random(); // Position along branch (0-1)
      const angle = Math.random() * Math.PI * 2; // Position around branch
      
      // Get radius at this point if available
      let radius = 0.1; // Default fallback radius
      const tubeGeometry = branch.geometry as THREE.TubeGeometry;
      if (tubeGeometry.parameters) {
        const radiusFunc = tubeGeometry.parameters.radius;
        if (typeof radiusFunc === 'function') {
          radius = radiusFunc(t);
        } else if (typeof radiusFunc === 'number') {
          radius = radiusFunc;
        }
      }
      
      const radialPos = radius * 0.9; // Slightly inset from the surface
      
      // Get position on branch
      let pointOnPath = new THREE.Vector3(0, t * 0.5, 0); // Default fallback position
      let tangent = new THREE.Vector3(0, 1, 0); // Default fallback tangent
      
      if (tubeGeometry.parameters && tubeGeometry.parameters.path) {
        const path = tubeGeometry.parameters.path as THREE.Curve<THREE.Vector3>;
        pointOnPath = path.getPointAt(t);
        tangent = path.getTangentAt(t).normalize();
      }
      
      decoration.position.copy(pointOnPath);
      
      // Create a random direction perpendicular to tangent
      const perpendicular = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).applyAxisAngle(tangent, angle);
      
      // Add radial offset along the perpendicular direction
      decoration.position.add(
        perpendicular.multiplyScalar(radialPos)
      );
      
      // Orient decoration to point outward from branch
      decoration.lookAt(
        decoration.position.clone().add(perpendicular)
      );
      
      // Add decoration to branch
      branch.add(decoration);
    }
  }
  
  /**
   * Adds small coral elements directly to the base
   */
  private addSmallCoralElements(visualConf: any): void {
    // Add some small standalone coral elements
    const numElements = Math.floor(Math.random() * 5) + 3; // 3-7 elements
    
    for (let i = 0; i < numElements; i++) {
      // Create small coral element
      const size = 0.05 + Math.random() * 0.08; // Small sizes
      
      // Create geometry
      let geometry;
      const elementType = Math.floor(Math.random() * 3);
      
      if (elementType === 0) {
        // Small dome
        geometry = new THREE.SphereGeometry(size, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        geometry.scale(1, 0.5, 1); // Flatten
      } else if (elementType === 1) {
        // Small cone
        geometry = new THREE.ConeGeometry(size * 0.7, size * 1.2, 8);
      } else {
        // Small cylinder
        geometry = new THREE.CylinderGeometry(size * 0.6, size * 0.8, size * 1.1, 8);
      }
      
      // Apply noise
      this.applyNoiseToGeometry(geometry, size * 0.1);
      
      // Create material with random color variation
      const hue = Math.random() * 0.1 - 0.05; // -0.05 to 0.05
      const elementColor = new THREE.Color(visualConf.mainColor || 0xFF7F50).offsetHSL(hue, 0, Math.random() * 0.1);
      
      const material = new THREE.MeshStandardMaterial({
        color: elementColor,
        emissive: new THREE.Color(visualConf.emissiveColor || elementColor).multiplyScalar(0.8),
        emissiveIntensity: visualConf.emissiveIntensity || 0.15,
        roughness: visualConf.roughness || 0.7,
        metalness: visualConf.metalness || 0.05
      });
      
      // Create element mesh
      const element = new THREE.Mesh(geometry, material);
      
      // Position randomly on base
      const r = 0.3 * Math.sqrt(Math.random()); // Radial distance (sqrt for even distribution)
      const theta = Math.random() * Math.PI * 2; // Angle
      element.position.set(
        r * Math.cos(theta),
        0, // At base level
        r * Math.sin(theta)
      );
      
      // Random rotation
      element.rotation.y = Math.random() * Math.PI * 2;
      
      // Add to coral group
      this.mesh.add(element);
      this.branches.push(element);
    }
  }
  
  /**
   * Applies noise to a geometry to make it more organic
   */
  private applyNoiseToGeometry(geometry: THREE.BufferGeometry, amount: number): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Apply random displacement to each vertex
      positions[i] += (Math.random() - 0.5) * amount;
      positions[i + 1] += (Math.random() - 0.5) * amount;
      positions[i + 2] += (Math.random() - 0.5) * amount;
    }
    
    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  /**
   * Creates a collision sphere for the coral
   */
  private createCollisionSphere(): void {
    if (!this.mesh || !this.mesh.children || this.mesh.children.length === 0) {
      // Fallback if mesh is not properly initialized
      const collisionGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
      
      this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
      this.collisionSphere.name = "CoralCollisionSphere";
      
      if (this.mesh) {
        this.mesh.add(this.collisionSphere);
      }
      
      return;
    }
    
    // Manually calculate bounds instead of using Box3.setFromObject
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    // Traverse all children meshes to find bounds
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        // Use child local position (already in mesh space)
        const pos = child.position;
        
        // Approximate size based on geometry or scale
        let size = 0.5;
        if (child.geometry) {
          // Simple approximation based on geometry type
          if (child.geometry instanceof THREE.SphereGeometry) {
            size = (child.geometry as THREE.SphereGeometry).parameters.radius;
          } else if (child.geometry instanceof THREE.BoxGeometry) {
            const params = (child.geometry as THREE.BoxGeometry).parameters;
            size = Math.max(params.width, params.height, params.depth) / 2;
          } else {
            // Default approximation
            size = 0.2;
          }
        }
        
        // Scale by the mesh's scale
        size *= Math.max(child.scale.x, child.scale.y, child.scale.z);
        
        // Update bounds
        minX = Math.min(minX, pos.x - size);
        minY = Math.min(minY, pos.y - size);
        minZ = Math.min(minZ, pos.z - size);
        maxX = Math.max(maxX, pos.x + size);
        maxY = Math.max(maxY, pos.y + size);
        maxZ = Math.max(maxZ, pos.z + size);
      }
    });
    
    // Use calculated bounds, with fallback in case no valid bounds were found
    if (!isFinite(minX) || !isFinite(maxX)) {
      minX = -0.5;
      maxX = 0.5;
    }
    
    if (!isFinite(minY) || !isFinite(maxY)) {
      minY = -0.5;
      maxY = 1.0;  // Higher to account for coral branches
    }
    
    if (!isFinite(minZ) || !isFinite(maxZ)) {
      minZ = -0.5;
      maxZ = 0.5;
    }
    
    // Calculate center and size
    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );
    
    const size = new THREE.Vector3(
      maxX - minX,
      maxY - minY,
      maxZ - minZ
    );
    
    // Calculate radius that will encompass all coral branches
    const collisionRadius = Math.max(size.x, size.y, size.z) * 0.6;
    
    // Create collision geometry
    const collisionGeometry = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionSphere.name = "CoralCollisionSphere";
    
    // Adjust collision sphere position to match the center
    this.collisionSphere.position.copy(center);
    
    // Add to group
    this.mesh.add(this.collisionSphere);
  }
  
  /**
   * Creates a minimal fallback coral in case of errors
   */
  private createMinimalFallback(): void {
    console.warn("CoralAsset: Creating minimal fallback model");
    
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "CoralFallback";
    
    // Create a simple coral shape
    const geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xFF7F50 });
    
    const simpleCoral = new THREE.Mesh(geometry, material);
    simpleCoral.position.y = 0.4; // Half height
    this.mesh.add(simpleCoral);
    
    // Create simple collision sphere
    const collisionGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.mesh.add(this.collisionSphere);
    
    // Set userData for identification
    this.mesh.userData = {
      type: 'obstacle',
      name: 'coral',
      assetInstance: this,
      isDangerous: false
    };
  }

  /**
   * Update animation for coral
   * Implements subtle swaying and color pulsing for more lively appearance
   */
  public updateAnimation(deltaTime: number): void {
    // Skip if no mesh
    if (!this.mesh) return;
    
    // Update animation time
    this.animationTime += deltaTime;
    
    // Apply subtle animation to branches
    this.branches.forEach((branch, index) => {
      // Unique phase for each branch
      const phaseOffset = index * 0.2;
      
      // Subtle swaying movement
      const swayAmount = 0.005;
      
      // Apply subtle rotation to simulate underwater current
      branch.rotation.x = Math.sin(this.animationTime * 0.3 + phaseOffset) * swayAmount;
      branch.rotation.z = Math.cos(this.animationTime * 0.4 + phaseOffset) * swayAmount;
      
      // Subtle emission pulsing if material supports it
      if (branch.material instanceof THREE.MeshStandardMaterial) {
        const baseMaterial = branch.material;
        
        // Get base emissive intensity from material's userData (store if not present)
        if (baseMaterial.userData.baseEmissiveIntensity === undefined) {
          baseMaterial.userData.baseEmissiveIntensity = baseMaterial.emissiveIntensity;
        }
        
        // Pulse emissive intensity
        const baseIntensity = baseMaterial.userData.baseEmissiveIntensity;
        baseMaterial.emissiveIntensity = baseIntensity * (0.9 + Math.sin(this.animationTime * 0.2 + phaseOffset) * 0.1);
      }
    });
  }
  
  /**
   * Reset the coral to its initial state
   */
  public reset(): void {
    this.animationTime = 0;
    
    // Reset any animation state
    this.branches.forEach(branch => {
      branch.rotation.set(0, 0, 0);
      
      // Reset emissive intensity if available
      if (branch.material instanceof THREE.MeshStandardMaterial && 
          branch.material.userData.baseEmissiveIntensity !== undefined) {
        branch.material.emissiveIntensity = branch.material.userData.baseEmissiveIntensity;
      }
    });
  }
  
  /**
   * Returns the coral mesh group
   * Creates the mesh if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }

  /**
   * Disposes of all resources used by this asset
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
      this.branches = [];
    }
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionSphere;
  }
  
  /**
   * Get coral configuration with defaults as fallback
   */
  public get config(): CoralConfig {
    // Default configuration
    const defaultConfig: CoralConfig = {
      visuals: {
        mainColor: 0xFF7F50, // Coral orange
        emissiveColor: 0xFF7F50,
        emissiveIntensity: 0.15,
        roughness: 0.7,
        metalness: 0.05,
        patternColor: 0xFF6B35 // Slightly darker accent
      }
    };
    
    try {
      return configSystem.getObstaclesConfig()?.coral || defaultConfig;
    } catch (error) {
      console.warn("CoralAsset: Could not get coral config, using defaults", error);
      return defaultConfig;
    }
  }
}