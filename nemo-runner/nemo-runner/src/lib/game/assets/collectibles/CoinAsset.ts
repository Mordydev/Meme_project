import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';

export class CoinAsset {
  private shaderManager: ShaderManager;
  public scoreValue = 100; // Points for collecting a coin - increased for more reward

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
  }

  public getGeometry(): THREE.CylinderGeometry {
    // Coins are thin cylinders - increased size for better visibility
    return new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16); // Larger radius, better detail
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