import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

export class SeafloorAsset {
  private shaderManager: ShaderManager;
  public segmentWidth: number;
  public segmentLength: number; // Depth along Z

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    // Dimensions for a single seafloor segment
    // Could also come from configSystem if more complex
    this.segmentWidth = configSystem.getWorldXBoundary() * 2 + configSystem.getPlayerLaneWidth() * 3; // Rough estimate
    this.segmentLength = 20; // Example length
  }

  public createMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength);
    // Rotate plane to be horizontal
    geometry.rotateX(-Math.PI / 2);

    // For now, a simple material. Later, this will be a custom shader for sand, caustics, etc.
    const material = this.shaderManager.getMaterial('environment_water')
                    || new THREE.MeshPhongMaterial({ color: 0x335599, side: THREE.DoubleSide }); // Fallback blue

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "SeafloorSegment";
    // Position it so its "front" edge (positive Z for plane) is at Z=0 when segment is placed
    // This might need adjustment based on how segments are positioned by EnvironmentManager
    // For now, let's assume the center of the segment is what's positioned.
    return mesh;
  }
} 