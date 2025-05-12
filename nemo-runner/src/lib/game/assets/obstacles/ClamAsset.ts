import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';

export class ClamAsset {
  private shaderManager: ShaderManager;
  public isOpen: boolean = false; // State for animation
  public animationTime: number = 0;
  public cycleDuration: number = 3; // Opens and closes every 3 seconds

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public createMesh(): THREE.Group { // Clams are often two halves, so use a Group
    const clamGroup = new THREE.Group();
    clamGroup.name = "ClamObstacle";
    
    // Create the clam asset instance and store it in userData for animations
    clamGroup.userData = { 
      type: 'obstacle', 
      name: 'clam', 
      assetInstance: this // Store reference to this instance for animation updates
    };

    // Placeholder: Two scaled spheres to represent clam shells
    const shellRadius = 0.6;
    const shellDetail = 8;
    
    // Create top and bottom shells - just use spheres for now
    const topShellGeom = new THREE.SphereGeometry(shellRadius, shellDetail, shellDetail);
    const bottomShellGeom = new THREE.SphereGeometry(shellRadius, shellDetail, shellDetail);

    // Scale the spheres to make them more shell-like
    topShellGeom.scale(1.2, 0.7, 1.2);
    bottomShellGeom.scale(1.2, 0.5, 1.2);

    const material = this.shaderManager.getMaterial('obstacle_clam')
                    || new THREE.MeshPhongMaterial({ color: 0xe0d1b0 }); // Sandy beige

    const topShell = new THREE.Mesh(topShellGeom, material.clone());
    const bottomShell = new THREE.Mesh(bottomShellGeom, material.clone());
    
    // Give the bottom shell a slightly different color
    if (bottomShell.material instanceof THREE.MeshPhongMaterial) {
      bottomShell.material.color.set(0xd2b48c);
    }

    // Position shells to form a clam shape
    bottomShell.position.y = -shellRadius * 0.3;
    topShell.position.y = shellRadius * 0.3;
    
    // Name the shells for easier reference during animation
    topShell.name = "TopShell";
    bottomShell.name = "BottomShell";

    clamGroup.add(topShell);
    clamGroup.add(bottomShell);
    
    // Initial state: closed
    topShell.rotation.x = 0; // Closed
    this.isOpen = false;

    // Add a collision sphere for collision detection
    const collisionRadius = shellRadius * 1.2; // Slightly larger than the shell
    const sphereGeom = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      visible: false // Invisible in normal gameplay
    });
    const collisionSphere = new THREE.Mesh(sphereGeom, sphereMaterial);
    collisionSphere.name = "ClamCollisionSphere";
    clamGroup.add(collisionSphere);

    return clamGroup;
  }

  // Update animation - this will be called by ObstacleManager
  public updateAnimation(deltaTime: number, clamGroupMesh: THREE.Group): void {
    // Store reference to the most recently updated group for getCollisionObject
    this._lastUpdatedGroup = clamGroupMesh;

    this.animationTime += deltaTime;
    const progress = (this.animationTime % this.cycleDuration) / this.cycleDuration;
    const openAngle = Math.PI / 3; // How much the clam opens (60 degrees)

    // Find the top shell by name
    const topShell = clamGroupMesh.getObjectByName("TopShell") as THREE.Mesh;
    if (topShell) {
      // Smooth open/close using sine wave over the full cycle
      // Opens from 0 to -openAngle and back to 0
      const currentAngle = (Math.sin(progress * Math.PI * 2 - Math.PI/2) + 1) / 2; // 0 to 1 to 0
      topShell.rotation.x = -currentAngle * openAngle;

      // Update isOpen state - consider it open if more than 30% open
      this.isOpen = currentAngle > 0.3;

      // Also store the open state in the userData for collision system
      clamGroupMesh.userData.isOpen = this.isOpen;
      clamGroupMesh.userData.isDangerous = this.isOpen;
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
      if (topShell) {
        topShell.rotation.x = 0; // Reset to closed position
      }
    }
  }

  /**
   * Dispose of any resources
   */
  public dispose(): void {
    // Nothing to dispose of here, the meshes are managed by the scene
  }

  // Track the last updated group for easier access
  private _lastUpdatedGroup?: THREE.Group;
}