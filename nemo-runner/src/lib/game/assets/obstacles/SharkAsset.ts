import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { AssetHelpers } from '../AssetHelpers';
import { IObstacleAsset, BaseObstacleConfig } from '../IObstacleAsset';

/**
 * Improved SharkAsset with proper materials and robust geometry
 * Implements the standard IObstacleAsset interface
 */
export class SharkAsset implements IObstacleAsset {
  private _mesh: THREE.Group | null = null;
  private _collisionMesh: THREE.Mesh | null = null;
  private _animationTime: number = 0;
  private _tailFin: THREE.Mesh | null = null;
  private _body: THREE.Mesh | null = null;
  private _config: BaseObstacleConfig;
  
  /**
   * Constructor takes shaderManager parameter for interface consistency with other assets
   */
  constructor(shaderManager?: ShaderManager) {
    // Load configurations - Use the obstacles config from the configSystem
    // The configSystem doesn't have a direct getConfig method as shown in the error,
    // so we access the obstacles data directly
    const obstaclesConfig = configSystem.getObstaclesConfig();
    
    // Default visual settings if config is unavailable
    this._config = {
      visuals: {
        mainColor: obstaclesConfig?.shark?.visuals?.mainColor || 0x2F5A8B,      // Deep blue for shark body
        accentColor: obstaclesConfig?.shark?.visuals?.patternColor || 0x4C6A8F,  // Lighter blue for fins
        roughness: obstaclesConfig?.shark?.visuals?.roughness || 0.7,           // Slightly rough texture
        metalness: obstaclesConfig?.shark?.visuals?.metalness || 0.1,           // Low metalness
        emissiveColor: obstaclesConfig?.shark?.visuals?.emissiveColor || 0x000000,  // No emissive glow
        emissiveIntensity: obstaclesConfig?.shark?.visuals?.emissiveIntensity || 0,  // No emissive intensity
        animationSpeed: obstaclesConfig?.shark?.tailWaveSpeed || 2.0,           // Animation speed
        animationAmplitude: 0.25                                                // Range of motion
      }
    };
    
    console.log('SharkAsset: Created with proper materials and configs');
  }

  /**
   * Creates a shark mesh using properly configured MeshStandardMaterial for Pixar-style look
   * Method name matches other obstacle types for consistency
   */
  public createMesh(): THREE.Group {
    try {
      // Create top-level group for the shark
      const sharkGroup = new THREE.Group();
      sharkGroup.name = "SharkObstacle";
      
      // Create properly configured MeshStandardMaterial for Pixar-style look
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: this._config.visuals?.mainColor || 0x2F5A8B,        // Deep blue
        roughness: this._config.visuals?.roughness || 0.7,         // Slightly rough
        metalness: this._config.visuals?.metalness || 0.1,         // Low metalness
        emissive: new THREE.Color(this._config.visuals?.emissiveColor || 0x000000),
        emissiveIntensity: this._config.visuals?.emissiveIntensity || 0,
        side: THREE.DoubleSide,
        flatShading: false                                         // Smooth shading
      });
      
      const finMaterial = new THREE.MeshStandardMaterial({
        color: this._config.visuals?.accentColor || 0x4C6A8F,      // Lighter blue
        roughness: (this._config.visuals?.roughness || 0.7) - 0.1, // Slightly smoother
        metalness: this._config.visuals?.metalness || 0.1,
        emissive: new THREE.Color(this._config.visuals?.emissiveColor || 0x000000),
        emissiveIntensity: this._config.visuals?.emissiveIntensity || 0,
        side: THREE.DoubleSide
      });
      
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,   // Black
        roughness: 0.3,    // Glossy eyes
        metalness: 0.2,    // Slight sheen
        side: THREE.FrontSide
      });
      
      // Create improved shark body with better geometry
      const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.5, 16, 8);
      bodyGeometry.rotateX(Math.PI / 2); // Orient horizontally
      
      // Check for NaN values in geometry before creating mesh
      const positions = bodyGeometry.getAttribute('position').array;
      let hasNaN = false;
      for (let i = 0; i < positions.length; i++) {
        if (isNaN(positions[i])) {
          positions[i] = 0; // Replace NaN with 0
          hasNaN = true;
        }
      }
      
      if (hasNaN) {
        console.warn("SharkAsset: Fixed NaN values in body geometry");
        bodyGeometry.getAttribute('position').needsUpdate = true;
      }
      
      // Compute vertex normals for proper lighting
      bodyGeometry.computeVertexNormals();
      
      this._body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      this._body.name = "SharkBody";
      this._body.castShadow = true;
      this._body.receiveShadow = true;
      sharkGroup.add(this._body);
      
      // Add dorsal fin with improved geometry
      const dorsalFinGeometry = new THREE.ConeGeometry(0.3, 0.5, 8);
      dorsalFinGeometry.rotateZ(Math.PI); // Point upward
      dorsalFinGeometry.computeVertexNormals();
      
      const dorsalFin = new THREE.Mesh(dorsalFinGeometry, finMaterial);
      dorsalFin.name = "SharkDorsalFin";
      dorsalFin.position.set(0, 0.4, 0); // Top of shark
      dorsalFin.castShadow = true;
      sharkGroup.add(dorsalFin);
      
      // Add tail fin with better geometry
      const tailFinGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.3, 2, 4, 2);
      tailFinGeometry.computeVertexNormals();
      this._tailFin = new THREE.Mesh(tailFinGeometry, finMaterial);
      this._tailFin.name = "SharkTailFin";
      this._tailFin.position.set(0, 0, 0.9); // Back of shark
      this._tailFin.castShadow = true;
      sharkGroup.add(this._tailFin);
      
      // Add side fins with improved geometry
      const sideFinGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
      sideFinGeometry.rotateZ(Math.PI / 2); // Orient sideways
      sideFinGeometry.computeVertexNormals();
      
      // Left fin
      const leftFin = new THREE.Mesh(sideFinGeometry, finMaterial);
      leftFin.name = "SharkLeftFin";
      leftFin.position.set(-0.4, -0.1, -0.2);
      leftFin.castShadow = true;
      sharkGroup.add(leftFin);
      
      // Right fin
      const rightFin = new THREE.Mesh(sideFinGeometry.clone(), finMaterial.clone());
      rightFin.name = "SharkRightFin";
      rightFin.position.set(0.4, -0.1, -0.2);
      rightFin.castShadow = true;
      sharkGroup.add(rightFin);
      
      // Add eyes with improved geometry
      const eyeGeometry = new THREE.SphereGeometry(0.06, 12, 8);
      eyeGeometry.computeVertexNormals();
      
      // Left eye
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.name = "SharkLeftEye";
      leftEye.position.set(-0.2, 0.1, -0.7);
      sharkGroup.add(leftEye);
      
      // Right eye
      const rightEye = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial.clone());
      rightEye.name = "SharkRightEye";
      rightEye.position.set(0.2, 0.1, -0.7);
      sharkGroup.add(rightEye);
      
      // Add subtle teeth to the mouth area (optional detail)
      const teethGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
      const teethMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.5,
        metalness: 0.1
      });
      
      // Add a few teeth for detail
      for (let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(teethGeometry.clone(), teethMaterial);
        tooth.name = `SharkTooth${i}`;
        // Position teeth in a slight curve at the front of shark mouth
        const angle = (i - 2.5) * 0.15;
        tooth.position.set(Math.sin(angle) * 0.1, -0.05 + Math.cos(angle) * 0.02, -0.75);
        sharkGroup.add(tooth);
      }
      
      // Add collision mesh (slightly larger than body for better collision detection)
      // Use a simple capsule for reliability
      const collisionGeometry = new THREE.CapsuleGeometry(0.5, 1.8, 8, 4);
      collisionGeometry.rotateX(Math.PI / 2);
      
      const collisionMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        wireframe: true,
        visible: false // Hide in production, can be made visible for debugging
      });
      
      this._collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
      this._collisionMesh.name = "SharkCollisionMesh";
      sharkGroup.add(this._collisionMesh);
      
      // Store mesh reference
      this._mesh = sharkGroup;
      
      // Set standard userData for collision system using helper
      AssetHelpers.setStandardUserData(
        sharkGroup,
        'shark',
        true, // Sharks are always dangerous
        this
      );
      
      // Add shark-specific properties
      sharkGroup.userData.isShark = true; // Explicit flag for shark type checking
      sharkGroup.userData.source = 'SharkAsset.createMesh';
      
      // Explicitly ensure all meshes are visible (except collision)
      AssetHelpers.ensureVisibility(sharkGroup);
      
      // Manually enforce material visibility on all children
      sharkGroup.traverse(child => {
        if (child instanceof THREE.Mesh && 
            !child.name.includes("Collision") &&
            child.material) {
          // Ensure material is visible and has correct settings
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.visible = true;
              mat.needsUpdate = true;
              mat.side = THREE.DoubleSide; // Ensure both sides are visible
            });
          } else {
            child.material.visible = true;
            child.material.needsUpdate = true;
            child.material.side = THREE.DoubleSide;
          }
        }
      });
      
      // Make shark slightly bigger and more impressive
      sharkGroup.scale.set(1.2, 1.2, 1.2);
      
      console.log("SharkAsset: Created Pixar-style shark with MeshStandardMaterial");
      return sharkGroup;
    }
    catch (error) {
      console.error("SharkAsset: Error creating shark mesh:", error);
      return this.createMinimalFallback();
    }
  }
  
  /**
   * Create a minimal fallback shark in case the main creation fails
   * Still uses MeshStandardMaterial but with simpler, guaranteed-to-work geometry
   */
  private createMinimalFallback(): THREE.Group {
    console.warn("SharkAsset: Creating minimal fallback shark");
    
    const fallbackGroup = new THREE.Group();
    fallbackGroup.name = "SharkFallback";
    
    // Use simpler but still standard material
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F5A8B,   // Blue
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Super simple shark body - just a capsule
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.5, 8, 4);
    bodyGeometry.rotateX(Math.PI / 2);
    
    this._body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this._body.name = "SharkBodyFallback";
    fallbackGroup.add(this._body);
    
    // Simple fins - just boxes
    const finMaterial = new THREE.MeshStandardMaterial({
      color: 0x4C6A8F,
      roughness: 0.7,
      metalness: 0.1
    });
    
    // Dorsal fin
    const dorsalFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.4, 0.3),
      finMaterial
    );
    dorsalFin.position.set(0, 0.4, 0);
    fallbackGroup.add(dorsalFin);
    
    // Tail fin
    this._tailFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.5, 0.3),
      finMaterial
    );
    this._tailFin.position.set(0, 0, 0.9);
    fallbackGroup.add(this._tailFin);
    
    // Create collision mesh
    const collisionGeometry = new THREE.CapsuleGeometry(0.5, 1.8, 8, 4);
    collisionGeometry.rotateX(Math.PI / 2);
    
    const collisionMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      wireframe: true,
      visible: false
    });
    
    this._collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this._collisionMesh.name = "SharkCollisionMeshFallback";
    fallbackGroup.add(this._collisionMesh);
    
    // Store mesh reference
    this._mesh = fallbackGroup;
    
    // Set standard userData
    AssetHelpers.setStandardUserData(
      fallbackGroup,
      'shark',
      true,
      this
    );
    
    fallbackGroup.userData.isShark = true;
    fallbackGroup.userData.isFallback = true;
    
    // Ensure visibility
    AssetHelpers.ensureVisibility(fallbackGroup);
    
    return fallbackGroup;
  }
  
  /**
   * For consistency with other assets, also implement getMesh
   * This matches the pattern used in other obstacle assets
   */
  public getMesh(): THREE.Group {
    if (!this._mesh) {
      return this.createMesh();
    }
    return this._mesh;
  }
  
  /**
   * Returns the collision mesh for collision detection
   */
  public getCollisionObject(): THREE.Object3D {
    if (!this._mesh) {
      this.createMesh();
    }
    
    // Return collision mesh if it exists
    if (this._collisionMesh) {
      return this._collisionMesh;
    }
    
    // If collision mesh isn't available for some reason, return the main mesh as fallback
    return this._mesh!;
  }
  
  /**
   * Updates shark animations with improved, natural movement
   */
  public updateAnimation(deltaTime: number): void {
    if (!this._mesh || !this._tailFin) return;
    
    this._animationTime += deltaTime;
    
    // Get animation parameters from config
    const baseSpeed = this._config.visuals?.animationSpeed || 2.0;
    const baseAmplitude = this._config.visuals?.animationAmplitude || 0.25;
    
    // More natural fish swimming: tail swishes faster than body undulates
    const tailSwingFrequency = 2.5 * baseSpeed; // Oscillations per second
    const tailSwingAmplitude = 0.35 * baseAmplitude; // Maximum swing angle in radians
    
    // Add minor variations to make movement less robotic
    const bodyUndulateFrequency = 1.2 * baseSpeed;
    const bodyUndulateAmplitude = 0.15 * baseAmplitude;
    
    // Subtle vertical bobbing
    const verticalBobFrequency = 0.8 * baseSpeed;
    const verticalBobAmplitude = 0.02 * baseAmplitude;
    
    // Calculate animations with phase variations
    const tailSwing = Math.sin(this._animationTime * tailSwingFrequency) * tailSwingAmplitude;
    const bodyUndulate = Math.sin(this._animationTime * bodyUndulateFrequency) * bodyUndulateAmplitude;
    const verticalBob = Math.sin(this._animationTime * verticalBobFrequency) * verticalBobAmplitude;
    
    // Apply animations to parts
    this._tailFin.rotation.y = tailSwing;
    
    if (this._body) {
      // Subtle body undulation
      this._body.rotation.y = bodyUndulate;
      
      // Tiny amount of pitch (up/down) on body
      this._body.rotation.x = verticalBob * 0.5;
    }
    
    // Apply vertical bob to entire shark group
    if (this._mesh) {
      this._mesh.position.y = verticalBob;
    }
  }
  
  /**
   * Allows other systems to set the mesh if needed
   * This provides backward compatibility with legacy code
   */
  public setMesh(mesh: THREE.Group): void {
    // Store the provided mesh
    this._mesh = mesh;
    
    // Find the collision mesh and critical parts
    mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.name.includes("Collision")) {
          this._collisionMesh = child;
        } else if (child.name.includes("Body")) {
          this._body = child;
        } else if (child.name.includes("TailFin")) {
          this._tailFin = child;
        }
      }
    });
    
    // If collision mesh isn't found, create one
    if (!this._collisionMesh) {
      const collisionGeometry = new THREE.CapsuleGeometry(0.5, 1.8, 8, 4);
      collisionGeometry.rotateX(Math.PI / 2);
      
      const collisionMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        wireframe: true,
        visible: false
      });
      
      this._collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
      this._collisionMesh.name = "SharkCollisionMeshCreated";
      this._mesh.add(this._collisionMesh);
    }
    
    // Update materials to MeshStandardMaterial if they're MeshBasicMaterial
    mesh.traverse(child => {
      if (child instanceof THREE.Mesh && 
          !child.name.includes("Collision") &&
          child.material) {
        
        // Check and update material
        if (child.material instanceof THREE.MeshBasicMaterial) {
          const oldMaterial = child.material;
          const color = oldMaterial.color.getHex();
          
          // Replace with StandardMaterial
          const newMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1,
            side: oldMaterial.side
          });
          
          // Transfer any other properties that make sense
          if (oldMaterial.map) newMaterial.map = oldMaterial.map;
          
          // Dispose of old material and set new one
          oldMaterial.dispose();
          child.material = newMaterial;
          console.log(`SharkAsset: Upgraded material for ${child.name} to MeshStandardMaterial`);
        }
      }
    });
    
    // Ensure userData is set up properly
    if (!mesh.userData) {
      mesh.userData = {};
    }
    
    // Set standard userData for collision detection using helper
    AssetHelpers.setStandardUserData(
      mesh,
      'shark',
      true, // Always dangerous
      this
    );
    
    // Add shark-specific properties
    mesh.userData.isShark = true;
    
    // Ensure visibility using standard helper
    AssetHelpers.ensureVisibility(mesh);
  }
  
  /**
   * Sharks are always dangerous
   */
  public isDangerous(): boolean {
    return true;
  }
  
  /**
   * Reset the shark to initial state
   */
  public reset(): void {
    this._animationTime = 0;
    
    if (this._mesh) {
      this._mesh.position.set(0, 0, 0);
      this._mesh.rotation.set(0, 0, 0);
    }
    
    if (this._tailFin) {
      this._tailFin.rotation.set(0, 0, 0);
    }
    
    if (this._body) {
      this._body.rotation.set(0, 0, 0);
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this._mesh) {
      this._mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m) m.dispose();
            });
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    }
    
    // Clear references
    this._mesh = null;
    this._collisionMesh = null;
    this._tailFin = null;
    this._body = null;
  }
}