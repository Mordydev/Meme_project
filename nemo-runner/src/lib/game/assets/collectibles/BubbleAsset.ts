import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';

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
    // Increased radius from original 0.2/0.35 to 0.4 for better visibility
    return new THREE.SphereGeometry(0.4, 12, 10); // Better detail with more segments
  }

  public getMaterial(): THREE.Material {
    // Use the material from shader manager or create one with good visibility
    const material = this.shaderManager.getMaterial('collectible_bubble')
                    || new THREE.MeshPhongMaterial({
                        color: 0x66ccff, // Bright blue
                        transparent: true,
                        opacity: 0.8,    // More opaque than original for visibility
                        emissive: 0x112233,
                        shininess: 90,
                     });
    return material;
  }
}