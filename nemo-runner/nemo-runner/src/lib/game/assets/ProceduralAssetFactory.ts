import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../services/ShaderManager';
import { SeafloorAsset } from './environment/SeafloorAsset';
import { CoralAsset } from './obstacles/CoralAsset';

export class ProceduralAssetFactory {
  private shaderManager: ShaderManager;
  private seafloorAssetGenerator: SeafloorAsset;
  private coralAssetGenerator: CoralAsset;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
    this.coralAssetGenerator = new CoralAsset(this.shaderManager);
    console.log("ProceduralAssetFactory: Initialized.");
  }

  public createPlayerMesh(): THREE.Mesh {
    // Placeholder geometry, will become procedural later
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = this.shaderManager.getMaterial('player_default') || new THREE.MeshBasicMaterial({color: 0xff0000}); // Fallback
    
    const mesh = new THREE.Mesh(geometry, material);
    // Set initial properties, name, userData etc. if needed
    mesh.name = "PlayerPlaceholder";
    return mesh;
  }

  public createSeafloorSegmentMesh(): THREE.Mesh {
    return this.seafloorAssetGenerator.createMesh();
  }

  public createObstacleMesh(type: 'coral'): THREE.Mesh {
    switch (type) {
      case 'coral':
        return this.coralAssetGenerator.createMesh();
      default:
        console.warn(`ProceduralAssetFactory: Unknown obstacle type "${type}". Creating fallback.`);
        // Fallback simple mesh
        const geometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { type: 'obstacle', name: 'unknown' };
        return mesh;
    }
  }

  // Later: createObstacleMesh(type), createCollectibleMesh(type), etc.

  public dispose(): void {
    // This factory itself might not hold disposable resources if meshes are managed elsewhere,
    // but good to have the method.
    console.log("ProceduralAssetFactory: Disposed.");
  }

  public get seafloorSegmentLength(): number {
    return this.seafloorAssetGenerator.segmentLength;
  }

  public get seafloorAsset(): SeafloorAsset {
    return this.seafloorAssetGenerator;
  }
} 