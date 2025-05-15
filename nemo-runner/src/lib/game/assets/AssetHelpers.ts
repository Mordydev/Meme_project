import * as THREE from 'three';

/**
 * Shared utility functions for all asset classes
 */
export class AssetHelpers {
  /**
   * Ensures visibility of a mesh and all its visible children
   * Applies to all mesh children except those with "Collision" or "Collider" in their name
   * @param group The THREE.Object3D or THREE.Group to ensure visibility for
   */
  public static ensureVisibility(group: THREE.Object3D): void {
    if (!group) return;
    
    // Set top-level visibility
    group.visible = true;
    
    // Traverse and set visibility for all children
    group.traverse(child => {
      // Skip collision meshes which should remain invisible
      if (child instanceof THREE.Mesh && 
          !child.name.includes("Collision") && 
          !child.name.includes("Collider")) {
        
        // Set mesh visibility
        child.visible = true;
        
        // Also ensure material visibility
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat) {
                mat.visible = true;
                mat.needsUpdate = true;
              }
            });
          } else {
            child.material.visible = true;
            child.material.needsUpdate = true;
          }
        }
      }
    });
  }
  
  /**
   * Manually computes a valid bounding sphere for a geometry
   * Handles NaN values and ensures a valid bounding sphere is always set
   * @param geometry The BufferGeometry to compute a bounding sphere for
   */
  public static computeCorrectBoundingSphere(geometry: THREE.BufferGeometry): void {
    // Get position attribute
    const positionAttribute = geometry.getAttribute('position');
    
    if (!positionAttribute) {
      // If no position attribute, add a default bounding sphere
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
      return;
    }
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    const positions = positionAttribute.array;
    const itemSize = positionAttribute.itemSize;
    
    // Find min/max for each axis, skipping NaN values
    for (let i = 0; i < positions.length; i += itemSize) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Skip NaN values
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
    }
    
    // Handle case where there are no valid vertices or all were NaN
    if (!isFinite(minX)) {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
      return;
    }
    
    // Calculate center of bounding box
    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );
    
    // Calculate radius as distance from center to corner
    const corner = new THREE.Vector3(maxX, maxY, maxZ);
    const radius = center.distanceTo(corner);
    
    // Set bounding sphere directly
    geometry.boundingSphere = new THREE.Sphere(center, radius);
  }
  
  /**
   * Sets standard userData for an obstacle mesh
   * @param mesh The mesh to set userData for
   * @param type The type of obstacle (e.g., 'shark', 'coral')
   * @param isDangerous Whether the obstacle is dangerous to the player
   * @param assetInstance The asset instance that created this mesh
   */
  public static setStandardUserData(
    mesh: THREE.Object3D,
    type: string,
    isDangerous: boolean,
    assetInstance: any
  ): void {
    if (!mesh) return;
    
    // Initialize userData if not present
    if (!mesh.userData) {
      mesh.userData = {};
    }
    
    // Set standard properties
    mesh.userData.type = 'obstacle';
    mesh.userData.name = type;
    mesh.userData.isDangerous = isDangerous;
    
    // Add any additional metadata for debugging
    mesh.userData.properties = {
      created: new Date().toISOString(),
      interfaceVersion: '1.0'
    };
    
    // Add asset instance reference last to avoid circular reference issues
    mesh.userData.assetInstance = assetInstance;
  }
}