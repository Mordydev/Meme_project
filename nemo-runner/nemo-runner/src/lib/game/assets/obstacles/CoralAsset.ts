import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
// import { configSystem } from '../../core/ConfigurationSystem'; // If needed for size variations

export class CoralAsset {
  private shaderManager: ShaderManager;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public createMesh(): THREE.Mesh {
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
    coralGroup.userData = { type: 'obstacle', name: 'coral' };

    return coralGroup as THREE.Mesh; // Casting for simplicity, ideally Group for complex obstacles
  }
} 