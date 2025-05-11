import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../services/ShaderManager';
import { SeafloorAsset } from './environment/SeafloorAsset';
import { CoralAsset } from './obstacles/CoralAsset';
import { RockAsset } from './obstacles/RockAsset';
import { ClamAsset } from './obstacles/ClamAsset';
import { BubbleAsset } from './collectibles/BubbleAsset';
import { CoinAsset } from './collectibles/CoinAsset';
import { ShieldPowerUpAsset } from './powerups/ShieldPowerUpAsset';
import { MagnetPowerUpAsset } from './powerups/MagnetPowerUpAsset';
import { DoubleScorePowerUpAsset } from './powerups/DoubleScorePowerUpAsset';

export class ProceduralAssetFactory {
  private shaderManager: ShaderManager;
  private seafloorAssetGenerator: SeafloorAsset;
  private coralAssetGenerator: CoralAsset;
  private rockAssetGenerator: RockAsset;
  private clamAssetGenerator: ClamAsset;
  private bubbleAssetGenerator: BubbleAsset;
  private coinAssetGenerator: CoinAsset;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
    this.coralAssetGenerator = new CoralAsset(this.shaderManager);
    this.rockAssetGenerator = new RockAsset(this.shaderManager);
    this.clamAssetGenerator = new ClamAsset(this.shaderManager);
    this.bubbleAssetGenerator = new BubbleAsset(this.shaderManager);
    this.coinAssetGenerator = new CoinAsset(this.shaderManager);
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

  public createObstacleMesh(type: 'coral' | 'rock' | 'clam'): THREE.Mesh | THREE.Group {
    switch (type) {
      case 'coral':
        return this.coralAssetGenerator.createMesh();
      case 'rock':
        return this.rockAssetGenerator.createMesh();
      case 'clam':
        return this.clamAssetGenerator.createMesh();
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

  // Methods for collectibles - used by CollectibleManager for instanced rendering
  public getCollectibleGeometry(type: 'bubble' | 'coin'): THREE.BufferGeometry {
    return type === 'bubble'
      ? this.bubbleAssetGenerator.getGeometry()
      : this.coinAssetGenerator.getGeometry();
  }

  public getCollectibleMaterial(type: 'bubble' | 'coin'): THREE.Material {
    return type === 'bubble'
      ? this.bubbleAssetGenerator.getMaterial()
      : this.coinAssetGenerator.getMaterial();
  }

  public getCollectibleScoreValue(type: 'bubble' | 'coin'): number {
    return type === 'bubble'
      ? this.bubbleAssetGenerator.scoreValue
      : this.coinAssetGenerator.scoreValue;
  }

  /**
   * Creates a power-up mesh of the specified type at the given position
   * @param type The type of power-up to create
   * @param position The position of the power-up
   * @returns The power-up asset
   */
  public createPowerUpAsset(type: 'shield' | 'magnet' | 'doublescore', position: THREE.Vector3): ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset {
    switch (type) {
      case 'shield':
        return new ShieldPowerUpAsset(position);
      case 'magnet':
        return new MagnetPowerUpAsset(position);
      case 'doublescore':
        return new DoubleScorePowerUpAsset(position);
      default:
        console.warn(`ProceduralAssetFactory: Unknown power-up type "${type}". Creating shield as fallback.`);
        return new ShieldPowerUpAsset(position);
    }
  }
} 