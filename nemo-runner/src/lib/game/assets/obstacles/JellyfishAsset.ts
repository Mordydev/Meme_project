import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

export class JellyfishAsset {
  private shaderManager: ShaderManager;
  
  // Animation state
  private driftPhase: number = 0;
  private verticalBobPhase: number = 0;
  private tentacles: THREE.Mesh[] = [];
  private tentacleBasePositions: THREE.Vector3[] = [];
  
  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public createMesh(): THREE.Group {
    const jellyfishGroup = new THREE.Group();
    jellyfishGroup.name = "JellyfishObstacle";

    // Get jellyfish config
    const config = this.config;
    
    // Create the bell/dome (main body)
    const bell = this.createBell(config.bodyRadius);
    jellyfishGroup.add(bell);
    
    // Create tentacles
    this.tentacles = [];
    this.tentacleBasePositions = [];
    this.createTentacles(jellyfishGroup, config.bodyRadius, config.tentacleCount, config.tentacleLength);
    
    // Create inner glow (a smaller, brighter sphere inside the bell)
    const innerGlow = this.createInnerGlow(config.bodyRadius * 0.7);
    innerGlow.position.y = -config.bodyRadius * 0.2; // Position slightly below center of bell
    jellyfishGroup.add(innerGlow);

    // Create collision sphere that encompasses jellyfish body and tentacles
    // The collision needs to account for the full extent of the tentacles
    const collisionRadius = config.bodyRadius + config.tentacleLength * 0.8;
    
    const collisionSphere = new THREE.Mesh(
      new THREE.SphereGeometry(collisionRadius, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    collisionSphere.name = "JellyfishCollisionSphere";
    
    // Position the collision sphere to better cover the tentacles
    // (slightly lower than the bell to prioritize tentacle area)
    collisionSphere.position.y = -config.tentacleLength * 0.3;
    jellyfishGroup.add(collisionSphere);

    // Set userData for type identification and asset instance reference
    jellyfishGroup.userData = { 
      type: 'obstacle', 
      name: 'jellyfish',
      assetInstance: this,
      // Store animation params for easier access
      driftSpeed: config.driftSpeed,
      driftAmplitude: config.driftAmplitude,
      verticalBobAmplitude: config.verticalBobAmplitude,
      verticalBobSpeed: config.verticalBobSpeed
    };

    return jellyfishGroup;
  }

  private createBell(radius: number): THREE.Mesh {
    // Create a hemisphere for the bell (top part of jellyfish)
    const bellGeometry = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Create a material with some translucency
    let bellMaterial;
    const customMaterial = this.shaderManager.getMaterial('obstacle_jellyfish');
    
    if (customMaterial) {
      bellMaterial = customMaterial;
    } else {
      // Fallback material if custom shader not available
      bellMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88CCFF,          // Light blue color
        transparent: true,
        opacity: 0.7,
        transmission: 0.3,        // Translucent quality
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0x113355,       // Subtle blue glow
        emissiveIntensity: 0.3
      });
    }
    
    const bell = new THREE.Mesh(bellGeometry, bellMaterial);
    
    // Slightly bell-shaped deformation
    bell.scale.y = 0.8; // Flatten it a bit
    
    // Tilt edges outward
    const edges = this.createBellEdges(radius);
    bell.add(edges);
    
    return bell;
  }

  private createBellEdges(radius: number): THREE.Mesh {
    // Create a torus for the bell edges
    const edgeGeometry = new THREE.TorusGeometry(radius * 0.95, radius * 0.05, 16, 32);
    
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x77BBFF,           // Slightly different tint
      transparent: true,
      opacity: 0.75,
      roughness: 0.3,
      metalness: 0.1
    });
    
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = Math.PI / 2; // Orient horizontally
    edge.position.y = -radius * 0.05; // Position at the bottom rim of the bell
    
    return edge;
  }

  private createInnerGlow(radius: number): THREE.Mesh {
    // Create a sphere for the inner glow
    const glowGeometry = new THREE.SphereGeometry(radius, 16, 16);
    
    const glowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xAADDFF,          // Brighter blue
      transparent: true,
      opacity: 0.6,
      emissive: 0x4488DD,       // Stronger emissive for glow effect
      emissiveIntensity: 0.7,
      roughness: 0.1
    });
    
    return new THREE.Mesh(glowGeometry, glowMaterial);
  }

  private createTentacles(group: THREE.Group, bodyRadius: number, count: number, length: number): void {
    const tentacleMaterial = new THREE.MeshPhongMaterial({
      color: 0x77AADD,          // Blue tint
      transparent: true,
      opacity: 0.8,
      emissive: 0x224477,
      emissiveIntensity: 0.3,
      shininess: 70
    });

    // Create tentacles evenly distributed around the bell
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * bodyRadius * 0.8;
      const z = Math.sin(angle) * bodyRadius * 0.8;

      // Create curved path for more realistic tentacle using TubeGeometry
      // Create a natural curve for the tentacle with slight randomization
      const curvePoints = [];
      const segments = 8; // More segments = smoother curve
      const randomFactor = 0.2; // How much random variation in the curve

      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        // Start at bell bottom and curve downward with increasing randomness
        const segmentX = x + (Math.random() - 0.5) * bodyRadius * randomFactor * t * 2;
        const segmentY = -bodyRadius - (length * t);
        const segmentZ = z + (Math.random() - 0.5) * bodyRadius * randomFactor * t * 2;

        curvePoints.push(new THREE.Vector3(segmentX, segmentY, segmentZ));
      }

      // Create a smooth curve from the points
      const curve = new THREE.CatmullRomCurve3(curvePoints);

      // Create tube geometry along the curve - tapered by adjusting radius
      const tentacleGeometry = new THREE.TubeGeometry(
        curve,               // Path curve
        12,                  // Tube segments
        bodyRadius * 0.05 * (1 - 0.7 * (0/segments)), // Starting radius (thicker at top)
        8,                   // Radial segments (roundness of tube)
        false                // Closed curve?
      );

      // To create taper effect, we need to modify the vertices directly
      // Get all the vertices
      const positions = tentacleGeometry.attributes.position;

      // Loop through each ring of vertices
      for (let v = 0; v < positions.count; v++) {
        // Get the vertex position
        const x = positions.getX(v);
        const y = positions.getY(v);
        const z = positions.getZ(v);

        // Calculate which segment this vertex belongs to (0 = top, 1 = bottom)
        // This is approximate - would need more complex logic for perfect tapering
        const vPos = new THREE.Vector3(x, y, z);
        let nearestPointOnCurve = curve.getPointAt(0);
        let minDist = vPos.distanceTo(nearestPointOnCurve);
        let segmentT = 0;

        // Find closest point on curve to determine segment position (t)
        const samples = 20;
        for (let s = 0; s <= samples; s++) {
          const t = s / samples;
          const point = curve.getPointAt(t);
          const dist = vPos.distanceTo(point);
          if (dist < minDist) {
            minDist = dist;
            nearestPointOnCurve = point;
            segmentT = t;
          }
        }

        // Scale vertices based on segment position
        // Thicker at top (t=0), thinner at bottom (t=1)
        const scale = 1 - (segmentT * 0.7); // Taper to 30% of original size

        // Apply scaling relative to the curve center
        const direction = new THREE.Vector3(x, y, z).sub(nearestPointOnCurve).normalize();
        const distance = vPos.distanceTo(nearestPointOnCurve);
        const scaledDistance = distance * scale;

        // Set the new position
        const newPos = nearestPointOnCurve.clone().add(direction.multiplyScalar(scaledDistance));
        positions.setXYZ(v, newPos.x, newPos.y, newPos.z);
      }

      // Make sure Three.js knows the geometry has been updated
      positions.needsUpdate = true;
      tentacleGeometry.computeVertexNormals();

      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);

      // Store the base position and curve for animation
      this.tentacleBasePositions.push(new THREE.Vector3(x, -bodyRadius, z));
      this.tentacles.push(tentacle);

      group.add(tentacle);
    }
  }

  /**
   * Updates the jellyfish animation
   * @param deltaTime Time in seconds since last update
   * @param jellyfishMesh The jellyfish mesh to update
   */
  public updateAnimation(deltaTime: number, jellyfishMesh: THREE.Group): void {
    if (!jellyfishMesh || this.tentacles.length === 0) return;

    const config = this.config;
    
    // Update drift phases
    this.driftPhase += deltaTime * config.driftSpeed;
    this.verticalBobPhase += deltaTime * config.verticalBobSpeed;
    
    // Apply horizontal drifting motion
    const horizontalOffset = Math.sin(this.driftPhase) * config.driftAmplitude;
    jellyfishMesh.position.x += horizontalOffset * deltaTime;
    
    // Apply vertical bobbing motion
    const verticalOffset = Math.sin(this.verticalBobPhase) * config.verticalBobAmplitude;
    jellyfishMesh.position.y += verticalOffset * deltaTime;
    
    // Update tentacle animations
    this.animateTentacles(deltaTime, config.tentacleSway);
  }

  /**
   * Animates the tentacles with a swaying motion using shader-based techniques and geometry manipulation
   */
  private animateTentacles(deltaTime: number, swayFactor: number): void {
    for (let i = 0; i < this.tentacles.length; i++) {
      const tentacle = this.tentacles[i];
      const basePos = this.tentacleBasePositions[i];

      // Calculate phase offset for each tentacle for varied movement
      const uniquePhase = this.driftPhase + i * (Math.PI / this.tentacles.length);

      // Get geometry for vertex manipulation
      const geometry = tentacle.geometry as THREE.BufferGeometry;

      // Only proceed if this is a TubeGeometry with position attribute
      if (geometry.attributes.position) {
        const positions = geometry.attributes.position;
        const originalPositions = geometry.userData.originalPositions;

        // Store original positions if not already saved (only do this once)
        if (!originalPositions) {
          // Clone original positions to use as reference
          const origPos = new Float32Array(positions.array.length);
          for (let j = 0; j < positions.array.length; j++) {
            origPos[j] = positions.array[j];
          }
          geometry.userData.originalPositions = origPos;
        }

        // Get original positions reference
        const origPos = geometry.userData.originalPositions;

        // Apply wave motion to vertices
        for (let v = 0; v < positions.count; v++) {
          // Get the original vertex position
          const originalX = origPos[v * 3];
          const originalY = origPos[v * 3 + 1];
          const originalZ = origPos[v * 3 + 2];

          // Calculate normalized position along tentacle (0 = top, 1 = bottom)
          // This is an approximation - for perfect results would need curve parameterization
          const verticalPosition = Math.abs(originalY + basePos.y) / (tentacle.geometry as any).parameters?.path.getLength();

          // More effect at bottom of tentacle than at top
          const effectStrength = Math.pow(verticalPosition, 2.0) * swayFactor;

          // Calculate wave based on phase, position, and time
          const waveX = Math.sin(uniquePhase + verticalPosition * 10) * effectStrength * 0.2;
          const waveZ = Math.cos(uniquePhase * 0.7 + verticalPosition * 8) * effectStrength * 0.2;

          // Apply wave to position
          positions.setXYZ(
            v,
            originalX + waveX,
            originalY, // Keep Y position unchanged
            originalZ + waveZ
          );
        }

        // Update the geometry
        positions.needsUpdate = true;
      } else {
        // Fallback for non-TubeGeometry tentacles
        // Apply simpler swaying motion using rotation
        const swayX = Math.sin(uniquePhase) * swayFactor * 0.1;
        const swayZ = Math.cos(uniquePhase * 0.7) * swayFactor * 0.1;

        // Update rotation to create swaying effect
        tentacle.rotation.x = swayX;
        tentacle.rotation.z = swayZ;

        // Slightly adjust tentacle position for a more fluid effect
        const posOffset = 0.03 * swayFactor;
        tentacle.position.x = basePos.x + Math.sin(uniquePhase * 1.2) * posOffset;
        tentacle.position.z = basePos.z + Math.cos(uniquePhase * 0.8) * posOffset;
      }
    }
  }

  /**
   * Determines if the jellyfish is dangerous
   * All parts of the jellyfish are dangerous, especially the tentacles
   */
  public isDangerous(): boolean {
    // Jellyfish are always dangerous, particularly their tentacles
    return true;
  }

  /**
   * Ensure the jellyfish stays within the lane and horizontal bounds
   * @param jellyfishMesh The jellyfish mesh to check/adjust
   * @param laneWidth Width of a game lane
   * @param xBoundary Horizontal boundary of the game world
   */
  public constrainPosition(jellyfishMesh: THREE.Group, laneWidth: number, xBoundary: number): void {
    // Get jellyfish config
    const config = this.config;
    
    // Check if jellyfish is drifting too far and reverse direction if needed
    if (Math.abs(jellyfishMesh.position.x) > xBoundary - config.bodyRadius) {
      // Adjust position to be within bounds
      const sign = Math.sign(jellyfishMesh.position.x);
      jellyfishMesh.position.x = (xBoundary - config.bodyRadius) * sign;
      
      // Reset drift phase to move in opposite direction
      this.driftPhase = Math.sign(jellyfishMesh.position.x) * Math.PI/2;
    }
  }

  /**
   * Resets the jellyfish to its initial state
   */
  public reset(): void {
    this.driftPhase = 0;
    this.verticalBobPhase = 0;
    // Reset any other animation state here
  }

  /**
   * Disposes of any resources used by this asset
   */
  public dispose(): void {
    // Nothing to dispose of currently, as geometries and materials
    // are managed by ObstacleManager and scene
  }

  /**
   * Return the jellyfish configuration
   */
  public get config() {
    // Provide default values in case config is not available
    const defaultConfig = {
      bodyRadius: 0.4,
      tentacleCount: 8,
      tentacleLength: 1.2,
      tentacleSway: 0.7,
      driftSpeed: 0.8,
      driftAmplitude: 0.5,
      verticalBobAmplitude: 0.2,
      verticalBobSpeed: 0.6
    };

    try {
      return configSystem.getObstaclesConfig().jellyfish || defaultConfig;
    } catch (error) {
      console.warn("JellyfishAsset: Could not get jellyfish config, using defaults", error);
      return defaultConfig;
    }
  }

  /**
   * Returns the main bell collision object for this asset
   */
  public getBellCollisionObject(): THREE.Mesh {
    // Get the bell part for collision - this would be the main body
    const jellyfishGroup = this.tentacles[0]?.parent;
    if (jellyfishGroup) {
      // If we have a specific collision sphere, return that
      const collisionSphere = jellyfishGroup.getObjectByName("JellyfishCollisionSphere") as THREE.Mesh;
      if (collisionSphere) {
        return collisionSphere;
      }
    }

    // Fallback to the first mesh in the jellyfish group (should be the bell)
    let bellMesh: THREE.Mesh | null = null;
    if (jellyfishGroup) {
      jellyfishGroup.traverse(child => {
        if (child instanceof THREE.Mesh && !bellMesh && child.name !== "JellyfishCollisionSphere") {
          bellMesh = child;
        }
      });
    }

    return bellMesh as THREE.Mesh;
  }

  /**
   * Returns the tentacle collision objects for this asset
   */
  public getTentacleCollisionObjects(): THREE.Mesh[] {
    // In this simple implementation, we're just returning the tentacle meshes themselves
    return this.tentacles;
  }

  /**
   * Returns the main collision object for the whole jellyfish
   */
  public getCollisionObject(): THREE.Mesh {
    return this.getBellCollisionObject();
  }
}