import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SharkConfig } from '../../config/gameConfig';

export class SharkAsset {
  private shaderManager: ShaderManager;
  private mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  private tailFin!: THREE.Mesh;
  private animationTime: number = 0;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.createMesh();
  }

  /**
   * Returns configuration for the shark obstacle
   */
  public get config(): Readonly<SharkConfig> {
    // Provide default values in case config is not available
    const defaultConfig: SharkConfig = {
      patrolSpeed: 1.5,
      patrolRangeX: 2.4,
      baseScale: 1.0
    };

    try {
      return configSystem.getObstaclesConfig().shark || defaultConfig;
    } catch (error) {
      console.warn("SharkAsset: Could not get shark config, using defaults", error);
      return defaultConfig;
    }
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "SharkObstacle";
    
    const bodyMaterial = this.shaderManager.getMaterial('obstacle_shark') ||
      new THREE.MeshPhongMaterial({
        color: 0x505868, // Dark blue-grey
        specular: 0x333333,
        shininess: 20,
      });

    // Body (elongated capsule or cylinder)
    const bodyLength = 1.8 * (this.config.baseScale || 1);
    const bodyRadius = 0.35 * (this.config.baseScale || 1);
    const bodyGeom = new THREE.CapsuleGeometry(bodyRadius, bodyLength - 2 * bodyRadius, 8, 16);
    // Orient horizontally: rotate around X by 90 degrees
    bodyGeom.rotateX(Math.PI / 2); 
    const body = new THREE.Mesh(bodyGeom, bodyMaterial);
    this.mesh.add(body);

    // Dorsal Fin (Triangular Prism or custom shape)
    const dorsalFinShape = new THREE.Shape();
    const dfHeight = 0.5 * (this.config.baseScale || 1);
    const dfBase = 0.3 * (this.config.baseScale || 1);
    dorsalFinShape.moveTo(0, 0);
    dorsalFinShape.lineTo(-dfBase / 2, 0);
    dorsalFinShape.lineTo(0, dfHeight);
    dorsalFinShape.lineTo(dfBase / 2, 0);
    dorsalFinShape.lineTo(0, 0);
    const dfExtrudeSettings = { depth: 0.08 * (this.config.baseScale || 1), bevelEnabled: false };
    const dorsalFinGeom = new THREE.ExtrudeGeometry(dorsalFinShape, dfExtrudeSettings);
    const dorsalFin = new THREE.Mesh(dorsalFinGeom, bodyMaterial);
    dorsalFin.position.set(0, bodyRadius * 0.8, -bodyLength * 0.1); // On top, slightly back
    dorsalFin.rotation.y = Math.PI; // To make it face forward if extrude direction is Z
    this.mesh.add(dorsalFin);

    // Pectoral Fins (simplified flat shapes)
    const pectoralFinShape = new THREE.Shape();
    const pfLength = 0.4 * (this.config.baseScale || 1);
    const pfWidth = 0.2 * (this.config.baseScale || 1);
    pectoralFinShape.moveTo(0,0); 
    pectoralFinShape.lineTo(pfLength, pfWidth/2);
    pectoralFinShape.lineTo(pfLength*0.8, 0); 
    pectoralFinShape.lineTo(pfLength, -pfWidth/2); 
    pectoralFinShape.lineTo(0,0);
    const pfExtrudeSettings = { depth: 0.05 * (this.config.baseScale || 1), bevelEnabled: false };
    const pectoralFinGeom = new THREE.ExtrudeGeometry(pectoralFinShape, pfExtrudeSettings);
    
    const pectoralFinL = new THREE.Mesh(pectoralFinGeom, bodyMaterial);
    pectoralFinL.position.set(bodyRadius * 0.7, -bodyRadius * 0.3, -bodyLength * 0.05);
    pectoralFinL.rotation.z = -Math.PI / 6; // Angled slightly down
    pectoralFinL.rotation.y = -Math.PI / 5; // Angled slightly out/forward
    this.mesh.add(pectoralFinL);

    const pectoralFinR = pectoralFinL.clone();
    pectoralFinR.position.x *= -1;
    pectoralFinR.rotation.y *= -1;
    this.mesh.add(pectoralFinR);
    
    // Tail Fin (Vertical, forked shape)
    const tailFinShape = new THREE.Shape();
    const tfHeight = 0.6 * (this.config.baseScale || 1);
    const tfWidth = 0.4 * (this.config.baseScale || 1);
    tailFinShape.moveTo(0,0); // Center point of attachment
    tailFinShape.lineTo(tfWidth * 0.3, tfHeight * 0.5); // Upper tip
    tailFinShape.lineTo(tfWidth * 0.2, 0); // Notch
    tailFinShape.lineTo(tfWidth * 0.3, -tfHeight * 0.4); // Lower tip (shorter)
    tailFinShape.lineTo(0,0);
    const tfExtrudeSettings = { depth: 0.06 * (this.config.baseScale || 1), bevelEnabled: false };
    const tailFinGeom = new THREE.ExtrudeGeometry(tailFinShape, tfExtrudeSettings);
    this.tailFin = new THREE.Mesh(tailFinGeom, bodyMaterial);
    this.tailFin.name = "SharkTailFin";
    this.tailFin.position.set(0, 0, bodyLength / 2 + tfExtrudeSettings.depth / 2); // Attach to back of body
    // Tail fin is typically vertical, ExtrudeGeometry default is along Z.
    this.tailFin.rotation.y = Math.PI / 2; // Rotate to align with shark body if needed
    this.mesh.add(this.tailFin);

    // Add eyes
    const eyeRadius = bodyRadius * 0.12;
    const eyePositionZ = -bodyLength * 0.35;
    const eyePositionY = bodyRadius * 0.3;
    const eyePositionX = bodyRadius * 0.6;
    
    // Left eye
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(eyeRadius, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x000000 }) // Black
    );
    leftEye.position.set(-eyePositionX, eyePositionY, eyePositionZ);
    this.mesh.add(leftEye);
    
    // Right eye
    const rightEye = leftEye.clone();
    rightEye.position.set(eyePositionX, eyePositionY, eyePositionZ);
    this.mesh.add(rightEye);

    // Add a simple mouth (curved line)
    const mouthShape = new THREE.Shape();
    const mouthWidth = bodyRadius * 0.6;
    const mouthCurve = bodyRadius * 0.2;
    mouthShape.moveTo(-mouthWidth, 0);
    mouthShape.quadraticCurveTo(0, -mouthCurve, mouthWidth, 0);
    const mouthGeom = new THREE.ShapeGeometry(mouthShape);
    const mouth = new THREE.Mesh(
      mouthGeom,
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    mouth.position.set(0, -bodyRadius * 0.2, eyePositionZ + bodyRadius * 0.1);
    mouth.rotation.x = Math.PI / 2;
    this.mesh.add(mouth);
    
    // Simplified Collision Mesh (a slightly larger capsule encompassing the shark)
    const collisionGeom = new THREE.CapsuleGeometry(
      bodyRadius * 1.1, 
      bodyLength * 1.0 - 2 * bodyRadius * 1.1, 
      6, 12
    );
    collisionGeom.rotateX(Math.PI/2); // Align with body
    const collisionMat = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: true, 
      color: 0xff00ff
    });
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "SharkCollisionShape";
    this.mesh.add(this.collisionMesh); // Add as child for easier transform inheritance

    // Set userData
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'shark', 
      assetInstance: this,
      isDangerous: true
    };
  }
  
  /**
   * Updates the shark animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    
    // Simple side-to-side tail sway
    const swingFrequency = 5; // Oscillations per second
    const swingAmplitude = 0.3; // Maximum swing angle in radians
    
    if (this.tailFin) {
      this.tailFin.rotation.y = Math.PI / 2 + Math.sin(this.animationTime * swingFrequency) * swingAmplitude;
    }
  }

  /**
   * Returns the main shark mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionMesh;
  }

  /**
   * Determines if the shark is dangerous (always true)
   */
  public isDangerous(): boolean {
    return true; // Shark is always dangerous
  }

  /**
   * Resets the shark to its initial state
   */
  public reset(): void {
    this.animationTime = 0;
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}