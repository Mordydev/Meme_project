import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';

export class CoinAsset {
  private shaderManager: ShaderManager;
  public scoreValue = 100; // Points for collecting a coin - increased for more reward

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public getGeometry(): THREE.CylinderGeometry {
    // Increased radius from original 0.25 to 0.35 for better visibility
    return new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16); // Better detail with more segments
  }

  public getMaterial(): THREE.Material {
    // Use the material from shader manager or create one with good visibility
    const material = this.shaderManager.getMaterial('collectible_coin')
                    || new THREE.MeshStandardMaterial({
                        color: 0xffd700, // Gold
                        metalness: 0.7,
                        roughness: 0.3,  // Make it shinier
                        emissive: 0x554400, // Slight glow
                        emissiveIntensity: 0.3
                     });
    return material;
  }
}