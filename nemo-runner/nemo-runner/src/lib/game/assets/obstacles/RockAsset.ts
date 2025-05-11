import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
// import { configSystem } from '../../core/ConfigurationSystem';

export class RockAsset {
  private shaderManager: ShaderManager;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public createMesh(): THREE.Mesh {
    // Procedural rock: displaced icosphere or box, or a combination
    const rockHeight = (Math.random() * 0.5 + 0.5) * 0.8; // 0.4 to 0.8 units high (often shorter than player jump)
    const rockWidth = Math.random() * 0.5 + 0.8;  // 0.8 to 1.3 units wide
    const rockDepth = Math.random() * 0.5 + 0.8;  // 0.8 to 1.3 units deep

    // Using a BoxGeometry and displacing vertices for a jagged look
    const geometry = new THREE.BoxGeometry(rockWidth, rockHeight, rockDepth, 3, 3, 3); // More segments for displacement
    const positions = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const v = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
      const noiseFactor = 0.15; // How jagged
      // Displace vertices outwards based on their normal, scaled by noise
      // A more sophisticated approach would use 3D noise
      const displacement = Math.random() * noiseFactor;
      v.x += (Math.random() - 0.5) * displacement * rockWidth;
      v.y += (Math.random() - 0.5) * displacement * rockHeight * 0.5; // Less Y displacement
      v.z += (Math.random() - 0.5) * displacement * rockDepth;
      positions[i] = v.x;
      positions[i+1] = v.y;
      positions[i+2] = v.z;
    }
    geometry.computeVertexNormals(); // Recalculate normals after displacement

    const material = this.shaderManager.getMaterial('obstacle_rock')
                    || new THREE.MeshPhongMaterial({ color: 0x777777 }); // Fallback grey

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "RockObstacle";
    mesh.userData = { type: 'obstacle', name: 'rock' };
    
    // Add a collision sphere that's invisible for collision detection
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Calculate a reasonable radius for collision
    const collisionRadius = Math.max(size.x, size.y, size.z) * 0.6; // 60% of bounding size for tighter collisions
    
    // Create an invisible collision sphere
    const sphere = new THREE.SphereGeometry(collisionRadius, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      visible: false // Invisible in normal gameplay
    });
    const collisionSphere = new THREE.Mesh(sphere, sphereMaterial);
    collisionSphere.name = "RockCollisionSphere";
    
    mesh.add(collisionSphere);
    
    return mesh;
  }
}