import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { ClamConfig } from '../../config/gameConfig';

export class ClamAsset {
  private shaderManager: ShaderManager;
  public isOpen: boolean = false; // State for animation
  public animationTime: number = 0;
  private cycleDuration: number = 3; // Default opening/closing cycle duration

  // Keep references to clam parts for animation
  private clamGroup?: THREE.Group;
  private topShell?: THREE.Mesh;
  private bottomShell?: THREE.Mesh;
  private hinge?: THREE.Mesh;
  private pearl?: THREE.Mesh;
  private innerTexture?: THREE.Mesh;
  
  // Track the last updated group for collision
  private _lastUpdatedGroup?: THREE.Group;

  // Configuration
  private config: ClamConfig;
  private openingSpeed: number;
  private closingSpeed: number;
  private openingAngle: number;
  private detectionRadius: number;

  constructor(shaderManager: ShaderManager) {
    // We still need the ShaderManager parameter for backward compatibility
    // but we don't actually use it anymore for rendering
    this.shaderManager = shaderManager;
    
    // Get configuration from the system
    this.config = configSystem.get('obstacles.clam') as ClamConfig || {};
    this.openingSpeed = this.config.openingSpeed || 0.8;
    this.closingSpeed = this.config.closingSpeed || 1.2;
    this.openingAngle = (this.config.openingAngle || 35) * Math.PI / 180; // Convert to radians
    this.detectionRadius = this.config.detectionRadius || 3.0;
  }

  /**
   * Creates an enhanced clam mesh with detailed shells and pearl
   */
  public createMesh(): THREE.Group {
    try {
      // Create main group for the clam
      this.clamGroup = new THREE.Group();
      this.clamGroup.name = "ClamObstacle";
      
      // Store metadata for animations
      this.clamGroup.userData = { 
        type: 'obstacle', 
        name: 'clam', 
        assetInstance: this, // Store reference to this instance for animation updates
        isOpen: false,
        isDangerous: false
      };

      // Get clam visual configuration from config system
      const visualConf = this.config.visuals || {};
      
      // Create the detailed shells
      this.createShells(visualConf);
      
      // Create the hinge that connects the shells
      this.createHinge(visualConf);
      
      // Create a pearl inside the clam
      this.createPearl();
      
      // Create inner textures for the interior of the shells
      this.createInnerTexture(visualConf);
      
      // Create collision sphere for collision detection
      this.createCollisionSphere();
      
      // Initial state: closed
      if (this.topShell) {
        this.topShell.rotation.x = 0; // Closed
      }
      this.isOpen = false;

      return this.clamGroup;
    } catch (error) {
      console.error("ClamAsset: Error creating enhanced clam:", error);
      return this.createFallbackClam();
    }
  }

  /**
   * Create enhanced shell geometries with more realistic shape and details
   */
  private createShells(visualConf: any): void {
    if (!this.clamGroup) return;
    
    const shellRadius = 0.6;
    const shellDepth = 0.8;
    
    // Create top and bottom shells with more complex shape
    // We'll use lathe geometry for a more shell-like appearance
    const shellPoints = [];
    const shellSegments = 20; // Higher detail
    
    // Create shell profile for lathe geometry
    for (let i = 0; i <= shellSegments; i++) {
      const t = i / shellSegments;
      // Create curved profile with ridges
      const x = shellRadius * Math.pow(Math.sin(t * Math.PI), 0.7);
      let y = shellDepth * Math.pow(Math.cos(t * Math.PI * 0.5), 1.2) * 0.5;
      
      // Add some variation for ridges on the shell
      const ridgeFactor = Math.sin(t * Math.PI * 8) * 0.04;
      y += ridgeFactor;
      
      shellPoints.push(new THREE.Vector2(x, y));
    }
    
    // Create lathe geometries for top and bottom shells
    const topShellGeom = new THREE.LatheGeometry(shellPoints, 32);
    const bottomShellGeom = topShellGeom.clone();
    
    // Create shell materials with pixar-style StandardMaterial
    const mainColor = new THREE.Color(visualConf.mainColor || 0xE0D1B0); // Shell beige
    
    // Outer shell material with pixar-like qualities
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: visualConf.roughness !== undefined ? visualConf.roughness : 0.4,
      metalness: visualConf.metalness !== undefined ? visualConf.metalness : 0.15,
      clearcoat: visualConf.clearcoat !== undefined ? visualConf.clearcoat : 0.3,
      clearcoatRoughness: visualConf.clearcoatRoughness !== undefined ? visualConf.clearcoatRoughness : 0.2,
      side: THREE.DoubleSide
    });
    
    // Apply some displacement to make the shell surface more interesting
    this.applyShellDisplacement(topShellGeom);
    this.applyShellDisplacement(bottomShellGeom);
    
    // Create meshes
    this.topShell = new THREE.Mesh(topShellGeom, shellMaterial.clone());
    this.bottomShell = new THREE.Mesh(bottomShellGeom, shellMaterial.clone());
    
    // Give the bottom shell a slightly different color tint
    if (this.bottomShell.material instanceof THREE.MeshStandardMaterial) {
      this.bottomShell.material.color.set(
        mainColor.clone().multiplyScalar(0.9)
      );
    }
    
    // Position and rotate shells appropriately to form a clam
    this.topShell.position.set(0, shellRadius * 0.3, 0);
    this.topShell.rotation.x = Math.PI; // Flip top shell
    this.topShell.rotation.z = Math.PI; // Rotate to create mirror image
    
    this.bottomShell.position.set(0, -shellRadius * 0.3, 0);
    
    // Name the shells for easier reference during animation
    this.topShell.name = "TopShell";
    this.bottomShell.name = "BottomShell";
    
    // Add shells to the group
    this.clamGroup.add(this.topShell);
    this.clamGroup.add(this.bottomShell);
  }
  
  /**
   * Apply displacement to shell geometry for a more natural look
   */
  private applyShellDisplacement(geometry: THREE.BufferGeometry): void {
    try {
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Add growth rings and natural ridges to the shell
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i+1];
        const z = positions[i+2];
        
        // Calculate distance from center for radial effects
        const dist = Math.sqrt(x*x + z*z);
        const angle = Math.atan2(z, x);
        
        // Add growth rings
        const ringEffect = Math.sin(dist * 15) * 0.015;
        
        // Add radial ridges
        const ridgeEffect = Math.sin(angle * 12) * 0.015;
        
        // Apply displacement
        const displacement = ringEffect + ridgeEffect;
        
        const normal = new THREE.Vector3(x, y, z).normalize();
        positions[i] += normal.x * displacement;
        positions[i+1] += normal.y * displacement;
        positions[i+2] += normal.z * displacement;
      }
      
      // Update geometry after modifications
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    } catch (error) {
      console.error("ClamAsset: Error applying shell displacement:", error);
    }
  }
  
  /**
   * Create the hinge that connects the shells
   */
  private createHinge(visualConf: any): void {
    if (!this.clamGroup) return;
    
    // Create a cylindrical hinge to connect the shells
    const hingeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    
    // Rotate the hinge to align with the shells
    hingeGeometry.rotateZ(Math.PI / 2);
    
    // Create hinge material with slightly darker color than shells
    const shellColor = new THREE.Color(visualConf.mainColor || 0xE0D1B0);
    const hingeMaterial = new THREE.MeshStandardMaterial({
      color: shellColor.clone().multiplyScalar(0.8), // Darker than shell
      roughness: 0.6,
      metalness: 0.1
    });
    
    // Create hinge mesh
    this.hinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
    this.hinge.name = "ClamHinge";
    this.hinge.position.set(0, 0, -0.5); // Position at the back of the shells
    
    this.clamGroup.add(this.hinge);
  }
  
  /**
   * Create a pearl inside the clam
   */
  private createPearl(): void {
    if (!this.clamGroup) return;
    
    // Create the pearl with high detail
    const pearlGeometry = new THREE.SphereGeometry(0.2, 32, 24);
    
    // Create pearlescent material with pixar-style StandardMaterial
    const pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.05, // Very smooth
      metalness: 0.7,  // High metalness for pearl look
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.2, // Subtle glow
      envMapIntensity: 1.2,   // Enhance reflections
      clearcoat: 0.8,         // Strong clearcoat for wet shine
      clearcoatRoughness: 0.1 // Smooth clearcoat
    });
    
    // Create pearl mesh
    this.pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
    this.pearl.name = "ClamPearl";
    this.pearl.position.set(0, -0.1, 0); // Position slightly below center
    this.pearl.visible = false; // Hidden when clam is closed
    
    this.clamGroup.add(this.pearl);
  }
  
  /**
   * Create interior texture for the shells
   */
  private createInnerTexture(visualConf: any): void {
    if (!this.clamGroup || !this.topShell || !this.bottomShell) return;
    
    // Create a flat disc for the inner texture of the shells
    const innerTextureGeom = new THREE.CircleGeometry(0.5, 24);
    
    // Create material for inner shell with pearlescent quality
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFAF0E6, // Lighter than outer shell
      roughness: 0.2,   // Smoother than outer shell
      metalness: 0.3,   // More metallic for pearly look
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.1, // Subtle glow
      clearcoat: 0.6,   // Strong clearcoat for wet shine
      clearcoatRoughness: 0.1 // Smooth clearcoat
    });
    
    // Create mesh for top shell interior
    const topInnerTexture = new THREE.Mesh(innerTextureGeom, innerMaterial.clone());
    topInnerTexture.name = "TopShellInner";
    topInnerTexture.position.set(0, -0.01, 0); // Just below top shell inner surface
    topInnerTexture.rotation.x = Math.PI; // Face down
    this.topShell.add(topInnerTexture);
    
    // Create mesh for bottom shell interior
    const bottomInnerTexture = new THREE.Mesh(innerTextureGeom, innerMaterial.clone());
    bottomInnerTexture.name = "BottomShellInner";
    bottomInnerTexture.position.set(0, 0.01, 0); // Just above bottom shell inner surface
    this.bottomShell.add(bottomInnerTexture);
    
    this.innerTexture = topInnerTexture; // Save reference to one of the textures
  }
  
  /**
   * Create collision sphere for detection
   */
  private createCollisionSphere(): void {
    if (!this.clamGroup) return;
    
    // Create slightly larger collision sphere than visual representation
    const collisionRadius = 0.7; // Slightly larger than the shell
    const sphereGeom = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      visible: false // Invisible in normal gameplay
    });
    
    const collisionSphere = new THREE.Mesh(sphereGeom, sphereMaterial);
    collisionSphere.name = "ClamCollisionSphere";
    this.clamGroup.add(collisionSphere);
  }

  /**
   * Creates a fallback simple clam in case the detailed one fails
   */
  private createFallbackClam(): THREE.Group {
    console.warn("ClamAsset: Using fallback clam model");
    
    // Create simple group
    const fallbackGroup = new THREE.Group();
    fallbackGroup.name = "ClamObstacleFallback";
    
    // Store metadata
    fallbackGroup.userData = { 
      type: 'obstacle', 
      name: 'clam', 
      assetInstance: this
    };
    
    // Create simple shells using basic sphere geometry
    const shellRadius = 0.6;
    const shellDetail = 8;
    
    // Create top and bottom shells - just use spheres
    const topShellGeom = new THREE.SphereGeometry(shellRadius, shellDetail, shellDetail);
    const bottomShellGeom = new THREE.SphereGeometry(shellRadius, shellDetail, shellDetail);

    // Scale the spheres to make them more shell-like
    topShellGeom.scale(1.2, 0.7, 1.2);
    bottomShellGeom.scale(1.2, 0.5, 1.2);

    // Basic material for fallback
    const material = new THREE.MeshStandardMaterial({ color: 0xE0D1B0 }); // Sandy beige

    const topShell = new THREE.Mesh(topShellGeom, material.clone());
    const bottomShell = new THREE.Mesh(bottomShellGeom, material.clone());
    
    // Give the bottom shell a slightly different color
    if (bottomShell.material instanceof THREE.MeshStandardMaterial) {
      bottomShell.material.color.set(0xD2B48C);
    }

    // Position shells to form a clam shape
    bottomShell.position.y = -shellRadius * 0.3;
    topShell.position.y = shellRadius * 0.3;
    
    // Name the shells for easier reference during animation
    topShell.name = "TopShell";
    bottomShell.name = "BottomShell";

    fallbackGroup.add(topShell);
    fallbackGroup.add(bottomShell);
    
    // Initial state: closed
    topShell.rotation.x = 0; // Closed
    
    // Add a collision sphere for collision detection
    const collisionRadius = shellRadius * 1.2; // Slightly larger than the shell
    const sphereGeom = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      visible: false // Invisible in normal gameplay
    });
    const collisionSphere = new THREE.Mesh(sphereGeom, sphereMaterial);
    collisionSphere.name = "ClamCollisionSphere";
    fallbackGroup.add(collisionSphere);
    
    // Save references
    this.clamGroup = fallbackGroup;
    this.topShell = topShell;
    this.bottomShell = bottomShell;
    
    return fallbackGroup;
  }

  /**
   * Returns the clam mesh, creating it if it doesn't exist
   */
  public getMesh(): THREE.Group {
    if (!this.clamGroup) {
      return this.createMesh();
    }
    return this.clamGroup;
  }

  /**
   * Update animation - this will be called by ObstacleManager
   */
  public updateAnimation(deltaTime: number, clamGroupMesh: THREE.Group): void {
    // Store reference to the most recently updated group for getCollisionObject
    this._lastUpdatedGroup = clamGroupMesh;

    // Update animation time
    this.animationTime += deltaTime;
    
    // Find the top shell by name
    const topShell = clamGroupMesh.getObjectByName("TopShell") as THREE.Mesh;
    if (!topShell) return;
    
    // Find the pearl (if it exists)
    const pearl = clamGroupMesh.getObjectByName("ClamPearl") as THREE.Mesh;
    
    // Calculate animation progress
    const progress = (this.animationTime % this.cycleDuration) / this.cycleDuration;
    
    // Apply smooth open/close animation with configurable properties
    // Use sine wave for smooth motion
    const targetAngle = Math.sin(progress * Math.PI * 2 - Math.PI/2);
    const normalizedAnimation = (targetAngle + 1) / 2; // 0 to 1 to 0
    
    // Apply different speeds for opening and closing
    let currentAngle;
    if (normalizedAnimation > 0.5) {
      // Opening phase - use opening speed
      currentAngle = normalizedAnimation * this.openingAngle;
    } else {
      // Closing phase - use closing speed
      currentAngle = normalizedAnimation * this.openingAngle;
    }
    
    // Set top shell rotation with the calculated angle
    topShell.rotation.x = -currentAngle;
    
    // Update isOpen state - consider it open if more than 30% open
    const wasOpen = this.isOpen;
    this.isOpen = normalizedAnimation > 0.3;
    
    // Toggle pearl visibility based on open state
    if (pearl) {
      pearl.visible = this.isOpen;
      
      // Add a subtle pulsing glow effect when open
      if (this.isOpen && pearl.material instanceof THREE.MeshStandardMaterial) {
        // Pulse the emissive intensity
        const pulseIntensity = 0.2 + Math.sin(this.animationTime * 5) * 0.1;
        pearl.material.emissiveIntensity = pulseIntensity;
      }
    }
    
    // For more visual interest, also animate the scale of the pearl slightly
    if (pearl && this.isOpen) {
      const pulseScale = 1.0 + Math.sin(this.animationTime * 3) * 0.05;
      pearl.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // Store the open state in the userData for collision system
    clamGroupMesh.userData.isOpen = this.isOpen;
    clamGroupMesh.userData.isDangerous = this.isOpen;
    
    // Play a snap effect when changing state
    if (wasOpen !== this.isOpen) {
      this.playSnapEffect(clamGroupMesh, this.isOpen);
    }
  }
  
  /**
   * Play a visual snap effect when the clam opens or closes
   */
  private playSnapEffect(clamGroup: THREE.Group, isOpening: boolean): void {
    // Find the shells
    const topShell = clamGroup.getObjectByName("TopShell") as THREE.Mesh;
    const bottomShell = clamGroup.getObjectByName("BottomShell") as THREE.Mesh;
    
    if (!topShell || !bottomShell) return;
    
    // Briefly scale the shells for a snapping effect
    const scaleFactor = isOpening ? 1.05 : 0.95;
    
    // Apply scale animation
    const originalScale = new THREE.Vector3(1, 1, 1);
    const targetScale = new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor);
    
    // This is a simple approach; in a more robust solution, you'd use a proper tween library
    // or animation system to handle the scaling over time
    setTimeout(() => {
      if (topShell && bottomShell) {
        topShell.scale.copy(originalScale);
        bottomShell.scale.copy(originalScale);
      }
    }, 100);
    
    topShell.scale.copy(targetScale);
    bottomShell.scale.copy(targetScale);
    
    // If the clam is opening, make the pearl pulse stronger briefly
    if (isOpening) {
      const pearl = clamGroup.getObjectByName("ClamPearl") as THREE.Mesh;
      if (pearl && pearl.material instanceof THREE.MeshStandardMaterial) {
        const originalIntensity = pearl.material.emissiveIntensity;
        pearl.material.emissiveIntensity = 0.6; // Stronger glow
        
        setTimeout(() => {
          if (pearl && pearl.material instanceof THREE.MeshStandardMaterial) {
            pearl.material.emissiveIntensity = originalIntensity;
          }
        }, 200);
      }
    }
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    // Function to find the collision sphere in the clam group
    const findCollisionSphere = (group: THREE.Group): THREE.Mesh | null => {
      const collisionSphere = group.getObjectByName("ClamCollisionSphere") as THREE.Mesh;
      if (collisionSphere && collisionSphere instanceof THREE.Mesh) {
        return collisionSphere;
      }
      return null;
    };

    // If this update is called with a specific clam group, use that
    const getMeshFromRecent = (group: THREE.Group | undefined): THREE.Mesh | null => {
      if (group) {
        return findCollisionSphere(group) || null;
      }
      return null;
    };

    // Find the first mesh if no specific collision object
    const getFallbackMesh = (group: THREE.Group): THREE.Mesh | null => {
      let firstMesh: THREE.Mesh | null = null;
      group.traverse(child => {
        if (child instanceof THREE.Mesh && !firstMesh && child.name !== "ClamCollisionSphere") {
          firstMesh = child;
        }
      });
      return firstMesh;
    };

    // Try to find the collision sphere in the most recent mesh
    const recentGroup = this._lastUpdatedGroup;
    const collisionSphere = getMeshFromRecent(recentGroup) ||
                          (recentGroup ? getFallbackMesh(recentGroup) : null);

    // Fallback to a new simple collision sphere if nothing else is available
    if (!collisionSphere) {
      const geometry = new THREE.SphereGeometry(0.6, 8, 8);
      const material = new THREE.MeshBasicMaterial({ visible: false });
      return new THREE.Mesh(geometry, material);
    }

    return collisionSphere;
  }

  /**
   * Reset the clam to its initial state
   */
  public reset(): void {
    this.isOpen = false;
    this.animationTime = 0;

    // If we have a reference to the last group, reset its rotation
    if (this._lastUpdatedGroup) {
      const topShell = this._lastUpdatedGroup.getObjectByName("TopShell") as THREE.Mesh;
      const pearl = this._lastUpdatedGroup.getObjectByName("ClamPearl") as THREE.Mesh;
      
      if (topShell) {
        topShell.rotation.x = 0; // Reset to closed position
      }
      
      if (pearl) {
        pearl.visible = false; // Hide pearl when reset
      }
      
      // Reset userData
      this._lastUpdatedGroup.userData.isOpen = false;
      this._lastUpdatedGroup.userData.isDangerous = false;
    }
  }

  /**
   * Dispose of any resources
   */
  public dispose(): void {
    // Dispose all meshes and materials
    if (this.clamGroup) {
      this.clamGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    }
    
    // Clear references
    this.clamGroup = undefined;
    this.topShell = undefined;
    this.bottomShell = undefined;
    this.hinge = undefined;
    this.pearl = undefined;
    this.innerTexture = undefined;
    this._lastUpdatedGroup = undefined;
  }
}