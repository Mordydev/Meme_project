import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';

export class BubbleAsset {
  private shaderManager: ShaderManager;
  public scoreValue = 25; // Points for collecting a bubble - increased for more reward

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  // Note: For instanced rendering, we typically define ONE geometry and ONE material.
  // The CollectibleManager will use these to create an InstancedMesh.
  // This class primarily defines those shared resources.

  public getGeometry(): THREE.SphereGeometry {
    // Bubbles are spheres - increased size for better visibility
    return new THREE.SphereGeometry(0.35, 12, 12); // Larger radius, better detail
  }

  public getMaterial(): THREE.Material {
    // Later, a custom shader for a nice bubble effect (refraction, iridescence)
    const material = this.shaderManager.getMaterial('collectible_bubble')
                    || new THREE.MeshPhongMaterial({ 
                        color: 0xadd8e6, // Light blue
                        transparent: true, 
                        opacity: 0.6,
                        emissive: 0x224466, // Slight inner glow
                        shininess: 80,
                     });
    return material;
  }
}