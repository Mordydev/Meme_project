import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { JellyfishConfig } from '../../config/gameConfig';

export class JellyfishAsset {
  public mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  private bellMesh!: THREE.Mesh;
  private innerGlowMesh!: THREE.Mesh;
  private bellEdgeMesh!: THREE.Mesh;
  private tentacles: THREE.Mesh[] = [];
  
  // Animation state
  private animationTime: number = 0;
  private driftPhase: number = Math.random() * Math.PI * 2;
  private verticalBobPhase: number = Math.random() * Math.PI * 2;
  
  constructor(shaderManager?: ShaderManager) {
    // We accept shaderManager parameter for backward compatibility
    // but we don't use it in our implementation
  }

  /**
   * Creates the complete jellyfish with enhanced geometry and StandardMaterial
   * @returns The jellyfish mesh (THREE.Group)
   */
  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group that contains all parts
      this.mesh = new THREE.Group();
      this.mesh.name = "JellyfishObstacle_StdMat";
      
      // Get jellyfish config
      const config = this.config;
      const visualConf = config.visuals || {};
      const tentacleVisualConf = config.tentacleVisuals || visualConf;
      
      // Create the bell (main body)
      this.createBell(config.bodyRadius, visualConf);
      
      // Create the bell edge rim
      this.createBellEdges(config.bodyRadius, visualConf);
      
      // Create inner glow effect
      this.createInnerGlow(config.bodyRadius * 0.7, visualConf);
      
      // Create tentacles
      this.createTentacles(
        config.bodyRadius, 
        config.tentacleCount, 
        config.tentacleLength, 
        tentacleVisualConf
      );
      
      // Create collision mesh
      this.createCollisionMesh(config.bodyRadius, config.tentacleLength);
      
      // Set userData for identification
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'jellyfish',
        assetInstance: this,
        isDangerous: true
      };
      
      return this.mesh;
    } catch (error) {
      console.error("JellyfishAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }

  /**
   * Creates the main bell (dome) of the jellyfish
   */
  private createBell(radius: number, visualConf: any): void {
    // Create a more detailed hemisphere for the bell
    const bellGeometry = new THREE.SphereGeometry(
      radius,      // Radius
      32,          // Width segments (increased for smoother curve)
      24,          // Height segments (increased for smoother curve)
      0,           // Phi start
      Math.PI * 2, // Phi length (full circle)
      0,           // Theta start (top)
      Math.PI * 0.75 // Theta length (3/4 of a sphere for bell shape)
    );
    
    // Deform the geometry to create a more appealing bell shape
    const positions = bellGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      // Get normalized height (0 at top, 1 at bottom)
      const y = positions[i + 1];
      const normalizedHeight = 1 - (y + radius) / (2 * radius);
      
      if (normalizedHeight > 0.5) {
        // Flare out the bottom half of the bell slightly
        const flareAmount = (normalizedHeight - 0.5) * 0.2;
        positions[i] *= (1 + flareAmount);     // X - widen
        positions[i + 2] *= (1 + flareAmount); // Z - widen
      }
      
      // Flatten the bell vertically slightly
      positions[i + 1] *= 0.8;
    }
    
    // Update geometry after modifications
    bellGeometry.attributes.position.needsUpdate = true;
    bellGeometry.computeVertexNormals();
    
    // Create material with MeshStandardMaterial using config properties
    const bellMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xADD8E6),
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6),
      emissiveIntensity: visualConf.emissiveIntensity || 0.4,
      roughness: visualConf.roughness || 0.1,
      metalness: visualConf.metalness || 0.05,
      transparent: true,
      opacity: visualConf.opacity || 0.6,
      transmission: visualConf.transmission || 0.7, // Key for jellyfish translucency
      side: THREE.DoubleSide
    });
    
    // Create mesh
    this.bellMesh = new THREE.Mesh(bellGeometry, bellMaterial);
    this.bellMesh.name = "JellyfishBell";
    this.mesh.add(this.bellMesh);
  }

  /**
   * Creates the edge rim of the bell
   */
  private createBellEdges(radius: number, visualConf: any): void {
    // Create a torus for the bell edges
    const edgeGeometry = new THREE.TorusGeometry(
      radius * 0.95, // Radius of the torus ring
      radius * 0.06, // Thickness of the torus
      16,           // Radial segments
      48            // Tubular segments (increased for smoother curve)
    );
    
    // Create material with slightly different properties
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xADD8E6).multiplyScalar(0.9), // Slightly darker
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6).multiplyScalar(0.9),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.4) * 0.8,
      roughness: (visualConf.roughness || 0.1) * 1.2, // Slightly rougher
      metalness: visualConf.metalness || 0.05,
      transparent: true,
      opacity: (visualConf.opacity || 0.6) * 1.1, // Slightly more opaque
      side: THREE.DoubleSide
    });
    
    // Create mesh
    this.bellEdgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
    this.bellEdgeMesh.name = "JellyfishBellEdge";
    this.bellEdgeMesh.rotation.x = Math.PI / 2; // Orient horizontally
    this.bellEdgeMesh.position.y = -radius * 0.45; // Position at the bottom rim of the bell
    this.mesh.add(this.bellEdgeMesh);
  }

  /**
   * Creates a glowing inner part of the jellyfish
   */
  private createInnerGlow(radius: number, visualConf: any): void {
    // Create a sphere for the inner glow
    const glowGeometry = new THREE.SphereGeometry(radius, 24, 20);
    
    // Create material with enhanced emissive properties
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xADD8E6).multiplyScalar(1.2), // Brighter
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6).multiplyScalar(1.2),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.4) * 1.5, // More intense glow
      roughness: (visualConf.roughness || 0.1) * 0.8, // Smoother
      metalness: (visualConf.metalness || 0.05) * 0.5, // Less metallic
      transparent: true,
      opacity: (visualConf.opacity || 0.6) * 0.8, // More transparent
      side: THREE.FrontSide
    });
    
    // Create mesh
    this.innerGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.innerGlowMesh.name = "JellyfishInnerGlow";
    this.innerGlowMesh.position.y = -radius * 0.2; // Position slightly below center of bell
    this.mesh.add(this.innerGlowMesh);
  }

  /**
   * Creates tentacles with enhanced geometry and CPU-based animation
   */
  private createTentacles(
    bodyRadius: number, 
    count: number, 
    length: number, 
    visualConf: any
  ): void {
    // Clear previous tentacles if any
    this.tentacles = [];
    
    // Create material for tentacles
    const tentacleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x88CCFF),
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0x88CCFF).multiplyScalar(0.8),
      emissiveIntensity: visualConf.emissiveIntensity || 0.3,
      roughness: visualConf.roughness || 0.3,
      metalness: visualConf.metalness || 0.0,
      transparent: true,
      opacity: visualConf.opacity || 0.5,
      side: THREE.DoubleSide
    });
    
    // Create tentacles evenly distributed around the bell
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * bodyRadius * 0.8;
      const z = Math.sin(angle) * bodyRadius * 0.8;
      
      // Create a tentacle with multiple segments for articulated animation
      this.createTentacle(
        i,
        new THREE.Vector3(x, -bodyRadius * 0.5, z),
        length,
        tentacleMaterial.clone() // Clone material to allow individual animation effects
      );
    }
  }

  /**
   * Creates a single tentacle with multiple segments for CPU animation
   */
  private createTentacle(
    index: number,
    startPosition: THREE.Vector3,
    length: number,
    material: THREE.Material
  ): void {
    // Create a curved path for a more natural tentacle shape
    const curvePoints = [];
    const segments = 12; // More segments = smoother curve and more animation points
    
    // Add some randomization to make each tentacle unique
    const randomX = (Math.random() - 0.5) * 0.1;
    const randomZ = (Math.random() - 0.5) * 0.1;
    
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      // Create a natural curve that gets more random toward the bottom
      const segmentX = startPosition.x + randomX * t * length;
      const segmentY = startPosition.y - (length * t);
      const segmentZ = startPosition.z + randomZ * t * length;
      
      curvePoints.push(new THREE.Vector3(segmentX, segmentY, segmentZ));
    }
    
    // Create a smooth curve from the points
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    // Create a tapered tube for the tentacle
    const radiusSegments = 8; // Cross-sectional detail
    
    // Create custom geometry function for tapering
    function getTentacleRadius(t: number) {
      // t=0 is top of tentacle, t=1 is bottom
      return 0.05 * (1 - t * 0.9) * startPosition.length(); // Taper to 10% of original width
    }
    
    // Create tube geometry along the curve
    const tentacleGeometry = new THREE.TubeGeometry(
      curve,
      segments * 2, // More tube segments for smoother animation
      getTentacleRadius(0), // Start radius (will be modified)
      radiusSegments,
      false // not closed
    );
    
    // Apply tapering by modifying the vertices
    const positions = tentacleGeometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    
    // We need to determine the t-value (0-1 along curve) for each vertex ring
    // This is approximate since TubeGeometry doesn't directly expose this
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      
      // Get vertex position
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      const point = new THREE.Vector3(x, y, z);
      
      // Find closest point on curve to determine t value (normalized position along tentacle)
      let closestT = 0;
      let minDist = Infinity;
      
      for (let t = 0; t <= 1; t += 0.05) {
        const curvePoint = curve.getPointAt(t);
        const dist = point.distanceTo(curvePoint);
        if (dist < minDist) {
          minDist = dist;
          closestT = t;
        }
      }
      
      // Store t-value in the geometry's userData for animation
      if (!tentacleGeometry.userData.tValues) {
        tentacleGeometry.userData.tValues = new Float32Array(vertexCount);
      }
      tentacleGeometry.userData.tValues[i] = closestT;
      
      // Apply scaling based on closest t-value - save original positions for animation
      if (!tentacleGeometry.userData.originalPositions) {
        tentacleGeometry.userData.originalPositions = new Float32Array(positions.length);
        for (let j = 0; j < positions.length; j++) {
          tentacleGeometry.userData.originalPositions[j] = positions[j];
        }
      }
    }
    
    // Create the tentacle mesh
    const tentacleMesh = new THREE.Mesh(tentacleGeometry, material);
    tentacleMesh.name = `JellyfishTentacle_${index}`;
    
    // Store for animation
    this.tentacles.push(tentacleMesh);
    this.mesh.add(tentacleMesh);
  }

  /**
   * Creates a collision mesh for the entire jellyfish
   */
  private createCollisionMesh(bodyRadius: number, tentacleLength: number): void {
    // Create a collision sphere that encompasses the main body and part of the tentacles
    const collisionRadius = bodyRadius + tentacleLength * 0.6;
    
    const collisionGeometry = new THREE.SphereGeometry(collisionRadius, 12, 8);
    const collisionMaterial = new THREE.MeshBasicMaterial({ 
      visible: false // Invisible collision mesh
    });
    
    this.collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionMesh.name = "JellyfishCollider";
    
    // Position the collision sphere to cover both bell and tentacles
    this.collisionMesh.position.y = -tentacleLength * 0.3;
    this.mesh.add(this.collisionMesh);
  }

  /**
   * Creates a minimal fallback jellyfish model in case of errors
   */
  private createMinimalFallback(): void {
    console.warn("JellyfishAsset: Creating minimal fallback model");
    
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "JellyfishFallback";
    
    // Create simple body (hemisphere)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0x88CCFF,
      transparent: true,
      opacity: 0.7
    });
    
    this.bellMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bellMesh.scale.y = 0.8; // Flatten slightly
    this.mesh.add(this.bellMesh);
    
    // Create simple tentacles (just cylinders)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 0.3;
      const z = Math.sin(angle) * 0.3;
      
      const tentacleGeometry = new THREE.CylinderGeometry(0.03, 0.01, 0.8, 4);
      const tentacleMaterial = new THREE.MeshBasicMaterial({
        color: 0x77AADD,
        transparent: true,
        opacity: 0.6
      });
      
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      tentacle.position.set(x, -0.5, z);
      tentacle.rotation.x = Math.PI / 2; // Orient downward
      
      this.tentacles.push(tentacle);
      this.mesh.add(tentacle);
    }
    
    // Create simple collision mesh
    const collisionGeometry = new THREE.SphereGeometry(0.6, 8, 6);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionMesh.position.y = -0.3;
    this.mesh.add(this.collisionMesh);
    
    // Set userData for identification
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'jellyfish',
      assetInstance: this,
      isDangerous: true
    };
  }

  /**
   * Updates the jellyfish animation
   */
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const config = this.config;
    
    // Skip if no mesh
    if (!this.mesh) return;
    
    // Get animation parameters from config
    const visualConf = config.visuals || {};
    const animSpeed = visualConf.animationSpeed !== undefined ? visualConf.animationSpeed : 0.5;
    
    // Update drift phases
    this.driftPhase += deltaTime * config.driftSpeed;
    this.verticalBobPhase += deltaTime * config.verticalBobSpeed;
    
    // Apply horizontal drifting motion
    const horizontalOffset = Math.sin(this.driftPhase) * config.driftAmplitude;
    this.mesh.position.x += horizontalOffset * deltaTime;
    
    // Apply vertical bobbing motion
    const verticalOffset = Math.sin(this.verticalBobPhase) * config.verticalBobAmplitude;
    this.mesh.position.y += verticalOffset * deltaTime;
    
    // Bell pulsing animation (subtle scale and emissive changes)
    if (this.bellMesh && this.bellMesh.material instanceof THREE.MeshStandardMaterial) {
      // Bell pulsing through scale
      const pulseFactor = 0.95 + Math.sin(this.animationTime * animSpeed * 1.2) * 0.05;
      this.bellMesh.scale.set(pulseFactor, pulseFactor * 0.8, pulseFactor);
      
      // Bell pulsing through emissive intensity
      this.bellMesh.material.emissiveIntensity = 
        (visualConf.emissiveIntensity || 0.4) * 
        (0.85 + Math.sin(this.animationTime * animSpeed * 1.5) * 0.15);
    }
    
    // Inner glow animation (scale and intensity)
    if (this.innerGlowMesh && this.innerGlowMesh.material instanceof THREE.MeshStandardMaterial) {
      // Offset phase from bell for more organic look
      const innerGlowPhase = this.animationTime * animSpeed * 1.7 + Math.PI / 3;
      const glowFactor = 0.9 + Math.sin(innerGlowPhase) * 0.1;
      
      this.innerGlowMesh.scale.set(glowFactor, glowFactor, glowFactor);
      this.innerGlowMesh.material.emissiveIntensity = 
        (visualConf.emissiveIntensity || 0.4) * 1.5 * 
        (0.8 + Math.sin(innerGlowPhase) * 0.2);
    }
    
    // Bell edge (rim) animation
    if (this.bellEdgeMesh) {
      // Subtle vertical bobbing relative to the bell
      this.bellEdgeMesh.position.y = 
        -config.bodyRadius * 0.45 + 
        Math.sin(this.animationTime * animSpeed * 0.8) * 0.02;
    }
    
    // Animate each tentacle
    this.animateTentacles(deltaTime, config.tentacleSway, animSpeed);
  }

  /**
   * Animates the tentacles with CPU-based animation
   */
  private animateTentacles(deltaTime: number, swayFactor: number, animSpeed: number): void {
    for (let i = 0; i < this.tentacles.length; i++) {
      const tentacle = this.tentacles[i];
      const geometry = tentacle.geometry as THREE.BufferGeometry;
      
      // Phase offset for each tentacle to create varied movement
      const phaseOffset = i * (Math.PI / this.tentacles.length);
      
      if (geometry.userData.originalPositions && geometry.userData.tValues) {
        // Advanced vertex-based animation for tube geometry tentacles
        const positions = geometry.attributes.position.array as Float32Array;
        const origPositions = geometry.userData.originalPositions as Float32Array;
        const tValues = geometry.userData.tValues as Float32Array;
        
        // Apply wave motion to vertices
        for (let v = 0; v < positions.length / 3; v++) {
          const idx = v * 3;
          
          // Get original position
          const originalX = origPositions[idx];
          const originalY = origPositions[idx + 1];
          const originalZ = origPositions[idx + 2];
          
          // Get t value (position along tentacle 0-1)
          const t = tValues[v];
          
          // More effect at bottom of tentacle than at top
          const effectStrength = Math.pow(t, 2.0) * swayFactor;
          
          // Calculate wave based on time, position, and phase offset
          const wavePhaseX = this.animationTime * animSpeed * 3 + phaseOffset;
          const wavePhaseZ = this.animationTime * animSpeed * 2.5 + phaseOffset + Math.PI / 4;
          
          const waveX = Math.sin(wavePhaseX + t * 8) * effectStrength * 0.2;
          const waveZ = Math.cos(wavePhaseZ + t * 6) * effectStrength * 0.2;
          
          // Apply wave to position
          positions[idx] = originalX + waveX;
          positions[idx + 1] = originalY; // Keep Y position unchanged
          positions[idx + 2] = originalZ + waveZ;
        }
        
        // Update the geometry
        geometry.attributes.position.needsUpdate = true;
      } else {
        // Fallback animation for simple tentacles (uses rotation)
        const uniquePhase = this.animationTime * animSpeed * 2 + phaseOffset;
        
        // Swaying motion
        tentacle.rotation.x = Math.sin(uniquePhase) * 0.2 * swayFactor;
        tentacle.rotation.z = Math.cos(uniquePhase * 0.7) * 0.2 * swayFactor;
      }
      
      // If material has emissive properties, add subtle intensity variations
      if (tentacle.material instanceof THREE.MeshStandardMaterial) {
        const baseIntensity = tentacle.material.userData.baseEmissiveIntensity;
        
        // Store original emissive intensity if not already saved
        if (baseIntensity === undefined) {
          tentacle.material.userData.baseEmissiveIntensity = tentacle.material.emissiveIntensity;
        }
        
        // Subtle emissive pulsing with offset from phase
        const pulsePhase = this.animationTime * animSpeed * 1.3 + phaseOffset;
        const savedBaseIntensity = tentacle.material.userData.baseEmissiveIntensity || 0.3;
        
        tentacle.material.emissiveIntensity = 
          savedBaseIntensity * (0.8 + Math.sin(pulsePhase) * 0.2);
      }
    }
  }

  /**
   * Constrains jellyfish position within boundaries
   */
  public constrainPosition(laneWidth: number, xBoundary: number): void {
    // Skip if no mesh
    if (!this.mesh) return;
    
    const config = this.config;
    
    // Check if jellyfish is drifting too far and reverse direction if needed
    if (Math.abs(this.mesh.position.x) > xBoundary - config.bodyRadius) {
      // Adjust position to be within bounds
      const sign = Math.sign(this.mesh.position.x);
      this.mesh.position.x = (xBoundary - config.bodyRadius) * sign;
      
      // Reset drift phase to move in opposite direction
      this.driftPhase = Math.sign(this.mesh.position.x) * Math.PI/2;
    }
  }

  /**
   * Returns the jellyfish mesh group
   * Creates the mesh if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }
  
  /**
   * Returns the main collision object for the jellyfish
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionMesh;
  }
  
  /**
   * Returns the main bell collision object for the jellyfish
   * Required by CollisionDetectionSystem for jellyfish-specific collision
   */
  public getBellCollisionObject(): THREE.Mesh {
    // Return the bell mesh for collision
    return this.bellMesh || this.collisionMesh;
  }
  
  /**
   * Returns the tentacle collision objects for this asset
   * Required by CollisionDetectionSystem for jellyfish-specific collision
   */
  public getTentacleCollisionObjects(): THREE.Mesh[] {
    // Return the tentacle meshes for collision
    return this.tentacles;
  }
  
  /**
   * Determines if the jellyfish is dangerous to the player
   */
  public isDangerous(): boolean {
    return true;
  }
  
  /**
   * Resets the jellyfish animation state
   */
  public reset(): void {
    this.animationTime = 0;
    this.driftPhase = Math.random() * Math.PI * 2;
    this.verticalBobPhase = Math.random() * Math.PI * 2;
  }
  
  /**
   * Disposes of all resources used by this asset
   */
  public dispose(): void {
    // Clean up geometries and materials
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
    this.tentacles = [];
  }
  
  /**
   * Get jellyfish configuration with defaults as a fallback
   */
  public get config(): JellyfishConfig {
    // Provide default values in case config is not available
    const defaultConfig: JellyfishConfig = {
      bodyRadius: 0.4,
      tentacleCount: 8,
      tentacleLength: 1.2,
      tentacleSway: 0.7,
      driftSpeed: 0.8,
      driftAmplitude: 0.5,
      verticalBobAmplitude: 0.2,
      verticalBobSpeed: 0.6,
      visuals: {
        mainColor: 0xADD8E6,
        emissiveColor: 0xADD8E6,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.05,
        opacity: 0.6,
        transmission: 0.7,
        animationSpeed: 0.5
      },
      tentacleVisuals: {
        mainColor: 0x88CCFF,
        emissiveColor: 0x88CCFF,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        opacity: 0.5,
        animationSpeed: 0.8
      }
    };

    try {
      return configSystem.getObstaclesConfig().jellyfish || defaultConfig;
    } catch (error) {
      console.warn("JellyfishAsset: Could not get jellyfish config, using defaults", error);
      return defaultConfig;
    }
  }
}