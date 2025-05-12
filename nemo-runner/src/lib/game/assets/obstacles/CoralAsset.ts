import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
// import { configSystem } from '../../core/ConfigurationSystem'; // If needed for size variations

export class CoralAsset {
  private shaderManager: ShaderManager;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public createMesh(): THREE.Group {
    // Simple procedural coral: a few stacked/rotated scaled spheres or cylinders
    // This is a VERY basic representation. We'll improve this significantly later.
    const coralGroup = new THREE.Group();
    coralGroup.name = "CoralObstacle";

    const numBranches = Math.floor(Math.random() * 3) + 2; // 2 to 4 branches
    const baseColor = new THREE.Color(0xff6347); // Tomato red/orange

    for (let i = 0; i < numBranches; i++) {
      const branchHeight = Math.random() * 1 + 0.5; // 0.5 to 1.5
      const branchRadius = Math.random() * 0.2 + 0.1; // 0.1 to 0.3

      const geometry = new THREE.CylinderGeometry(branchRadius * 0.7, branchRadius, branchHeight, 8);
      const material = this.shaderManager.getMaterial('obstacle_coral')
                        || new THREE.MeshPhongMaterial({ color: baseColor.clone().offsetHSL(Math.random() * 0.1 - 0.05, 0, 0) });

      const branchMesh = new THREE.Mesh(geometry, material);

      branchMesh.position.y = branchHeight / 2 - 0.5; // Sit on the ground (assuming ground at y=-0.5 for player center y=0)
                                                        // Adjust if player/floor Y levels are different

      // Random rotation and slight offset for a more organic look
      branchMesh.rotation.x = (Math.random() - 0.5) * Math.PI * 0.2;
      branchMesh.rotation.z = (Math.random() - 0.5) * Math.PI * 0.2;
      branchMesh.position.x = (Math.random() - 0.5) * 0.3;
      branchMesh.position.z = (Math.random() - 0.5) * 0.3;

      coralGroup.add(branchMesh);
    }

    // Add a collision sphere to make it easier to calculate collisions
    // This is a transparent sphere that encompasses the entire coral
    const box = new THREE.Box3().setFromObject(coralGroup);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Calculate a radius that will encompass all the coral branches
    // Use a reasonable size that matches the visual appearance
    const collisionRadius = Math.max(size.x, size.y, size.z) * 1.2; // 20% larger than visual size

    // Create an invisible collision sphere
    const sphere = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      visible: false // Invisible in normal gameplay
    });
    const collisionSphere = new THREE.Mesh(sphere, sphereMaterial);
    collisionSphere.name = "CoralCollisionSphere";

    coralGroup.add(collisionSphere);

    // Set a userData property for type identification in collision detection
    coralGroup.userData = {
      type: 'obstacle',
      name: 'coral',
      assetInstance: this // Store reference to this instance
    };

    // Store reference to this group for later use in getCollisionObject
    this._lastCreatedGroup = coralGroup;

    return coralGroup; // Return as Group
  }

  /**
   * Reset the coral to its initial state
   * Since coral has no animation or state, this is a no-op
   */
  public reset(): void {
    // Nothing to reset for static coral
  }

  /**
   * Dispose of any resources
   */
  public dispose(): void {
    // Nothing to dispose of here, the meshes are managed by the scene
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    // Function to find the collision sphere in a group
    const findCollisionSphere = (group: THREE.Group): THREE.Mesh | null => {
      const collisionSphere = group.getObjectByName("CoralCollisionSphere") as THREE.Mesh;
      if (collisionSphere && collisionSphere instanceof THREE.Mesh) {
        return collisionSphere;
      }
      return null;
    };

    // If we have a reference to a specific coral group, use that
    if (this._lastCreatedGroup) {
      const collisionSphere = findCollisionSphere(this._lastCreatedGroup);
      if (collisionSphere) {
        return collisionSphere;
      }

      // If no specific collision object, use the first mesh found
      let firstMesh: THREE.Mesh | null = null;
      this._lastCreatedGroup.traverse(child => {
        if (child instanceof THREE.Mesh && !firstMesh && child.name !== "CoralCollisionSphere") {
          firstMesh = child;
        }
      });

      if (firstMesh) {
        return firstMesh;
      }
    }

    // Fallback to a new simple collision sphere if nothing else is available
    const geometry = new THREE.SphereGeometry(0.6, 8, 8);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    return new THREE.Mesh(geometry, material);
  }

  // Store reference to last created group
  private _lastCreatedGroup?: THREE.Group;
} 