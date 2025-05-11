import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';

export class CoinAsset {
  private shaderManager: ShaderManager;
  public scoreValue = 50; // Points for collecting a coin

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public getGeometry(): THREE.CylinderGeometry {
    // Coins are thin cylinders
    return new THREE.CylinderGeometry(0.25, 0.25, 0.05, 12); // Radius, height, segments
  }

  public getMaterial(): THREE.Material {
    const material = this.shaderManager.getMaterial('collectible_coin')
                    || new THREE.MeshStandardMaterial({ // StandardMaterial for metallic look
                        color: 0xffd700, // Gold
                        metalness: 0.8,
                        roughness: 0.3,
                     });
    return material;
  }
}