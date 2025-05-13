import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../services/ShaderManager';
import { SeafloorAsset } from './environment/SeafloorAsset';
import { CoralAsset } from './obstacles/CoralAsset';
import { RockAsset } from './obstacles/RockAsset';
import { ClamAsset } from './obstacles/ClamAsset';
import { PufferfishAsset } from './obstacles/PufferfishAsset';
import { JellyfishAsset } from './obstacles/JellyfishAsset';
import { SharkAsset } from './obstacles/SharkAsset';
import { SeaTurtleAsset } from './obstacles/SeaTurtleAsset';
import { KelpWallAsset } from './obstacles/KelpWallAsset';
import { SchoolOfFishAsset } from './obstacles/SchoolOfFishAsset';
import { BubbleAsset } from './collectibles/BubbleAsset';
import { CoinAsset } from './collectibles/CoinAsset';
import { ShieldPowerUpAsset } from './powerups/ShieldPowerUpAsset';
import { MagnetPowerUpAsset } from './powerups/MagnetPowerUpAsset';
import { DoubleScorePowerUpAsset } from './powerups/DoubleScorePowerUpAsset';

// Define a union type for all obstacle asset classes
export type ObstacleAssetType = CoralAsset | RockAsset | ClamAsset | PufferfishAsset | JellyfishAsset | SharkAsset | SeaTurtleAsset | KelpWallAsset | SchoolOfFishAsset;
export type AnyObstacleTypeString = 'coral' | 'rock' | 'clam' | 'pufferfish' | 'jellyfish' | 'shark' | 'seaTurtle' | 'kelpWall' | 'schoolOfFish';

export class ProceduralAssetFactory {
  private shaderManager: ShaderManager;
  private seafloorAssetGenerator: SeafloorAsset;
  private coralAssetGenerator: CoralAsset;
  private rockAssetGenerator: RockAsset;
  private clamAssetGenerator: ClamAsset;
  private pufferfishAssetGenerator: PufferfishAsset;
  private jellyfishAssetGenerator: JellyfishAsset;
  private bubbleAssetGenerator: BubbleAsset;
  private coinAssetGenerator: CoinAsset;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
    this.coralAssetGenerator = new CoralAsset(this.shaderManager);
    this.rockAssetGenerator = new RockAsset(this.shaderManager);
    this.clamAssetGenerator = new ClamAsset(this.shaderManager);
    this.pufferfishAssetGenerator = new PufferfishAsset(this.shaderManager);
    this.jellyfishAssetGenerator = new JellyfishAsset(this.shaderManager);
    this.bubbleAssetGenerator = new BubbleAsset(this.shaderManager);
    this.coinAssetGenerator = new CoinAsset(this.shaderManager);
    console.log("ProceduralAssetFactory: Initialized with new obstacles.");
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

  public createObstacleMesh(type: AnyObstacleTypeString): THREE.Mesh | THREE.Group {
    switch (type) {
      case 'coral':
        return this.coralAssetGenerator.createMesh();
      case 'rock':
        return this.rockAssetGenerator.createMesh();
      case 'clam':
        return this.clamAssetGenerator.createMesh();
      case 'pufferfish':
        return this.pufferfishAssetGenerator.createMesh();
      case 'jellyfish':
        return this.jellyfishAssetGenerator.createMesh();
      case 'shark':
      case 'seaTurtle':
      case 'kelpWall':
      case 'schoolOfFish':
        // These obstacles implement getMesh() instead of createMesh()
        // Use createObstacle() for these types which returns both mesh and asset instance
        console.warn(`ProceduralAssetFactory: Obstacle type "${type}" uses getMesh() not createMesh(). Use createObstacle() instead.`);
        const { mesh } = this.createObstacle(type);
        return mesh;
      default:
        console.warn(`ProceduralAssetFactory: Unknown obstacle type "${type}". Creating fallback.`);
        // Fallback simple mesh
        const geometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const fallbackMesh = new THREE.Mesh(geometry, material);
        fallbackMesh.userData = { type: 'obstacle', name: 'unknown' };
        return fallbackMesh;
    }
  }

  /**
   * Creates an obstacle and returns both the mesh and the asset instance
   * @param type The type of obstacle to create
   * @returns Object containing both the mesh and the asset instance
   */
  public createObstacle(type: AnyObstacleTypeString): { mesh: THREE.Mesh | THREE.Group, asset: ObstacleAssetType } {
    let asset: ObstacleAssetType;
    let mesh: THREE.Mesh | THREE.Group;

    switch (type) {
      case 'coral':
        asset = new CoralAsset(this.shaderManager);
        mesh = asset.createMesh();
        break;
      case 'rock':
        asset = new RockAsset(this.shaderManager);
        mesh = asset.createMesh();
        break;
      case 'clam':
        asset = new ClamAsset(this.shaderManager);
        mesh = asset.createMesh();
        break;
      case 'pufferfish':
        asset = new PufferfishAsset(this.shaderManager);
        mesh = asset.createMesh();
        break;
      case 'jellyfish':
        asset = new JellyfishAsset(this.shaderManager);
        mesh = asset.createMesh();
        break;
      case 'shark':
        asset = new SharkAsset(this.shaderManager);
        mesh = asset.getMesh();
        break;
      case 'seaTurtle':
        asset = new SeaTurtleAsset(this.shaderManager);
        mesh = asset.getMesh();
        break;
      case 'kelpWall':
        asset = new KelpWallAsset(this.shaderManager);
        mesh = asset.getMesh();
        break;
      case 'schoolOfFish':
        asset = new SchoolOfFishAsset(this.shaderManager);
        mesh = asset.getMesh();
        break;
      default:
        console.warn(`ProceduralAssetFactory: Unknown obstacle type "${type}". Creating fallback rock.`);
        asset = new RockAsset(this.shaderManager);
        mesh = asset.createMesh();
        // Ensure userData is set for fallback
        mesh.userData = { ...mesh.userData, type: 'obstacle', name: 'unknown_fallback_rock' };
    }

    // Ensure userData.assetInstance is set if not done by the asset itself
    if (mesh.userData) {
      mesh.userData.assetInstance = asset;
      // Ensure name and type are also set correctly
      mesh.userData.name = type;
      mesh.userData.type = 'obstacle';
    } else {
      mesh.userData = { type: 'obstacle', name: type, assetInstance: asset };
    }

    return { mesh, asset };
  }

  // Later: createObstacleMesh(type), createCollectibleMesh(type), etc.

  public dispose(): void {
    // Make sure to dispose any asset generators that have their own dispose methods
    // This is critical for assets that hold their own materials or WebGL resources
    if (this.seafloorAssetGenerator && typeof this.seafloorAssetGenerator.dispose === 'function') {
      this.seafloorAssetGenerator.dispose();
    }

    // Add dispose calls for any other asset generators that implement dispose()
    // For future maintenance

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
    let powerUpAsset: ShieldPowerUpAsset | MagnetPowerUpAsset | DoubleScorePowerUpAsset;

    switch (type) {
      case 'shield':
        powerUpAsset = new ShieldPowerUpAsset(position);
        break;
      case 'magnet':
        powerUpAsset = new MagnetPowerUpAsset(position);
        break;
      case 'doublescore':
        powerUpAsset = new DoubleScorePowerUpAsset(position);
        break;
      default:
        console.warn(`ProceduralAssetFactory: Unknown power-up type "${type}". Creating shield as fallback.`);
        powerUpAsset = new ShieldPowerUpAsset(position);
    }

    // Ensure the mesh has proper userData for type identification by collision system
    const mesh = powerUpAsset.getMesh();
    if (mesh) {
      mesh.userData = {
        ...mesh.userData,
        type: 'powerup',
        subtype: type,
        assetInstance: powerUpAsset
      };
    }

    return powerUpAsset;
  }
} 