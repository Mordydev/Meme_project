import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../services/ShaderManager';
import { SeafloorAsset } from './environment/SeafloorAsset';
import { WaterSurfaceAsset } from './environment/WaterSurfaceAsset';
import { PebbleAsset } from './environment/PebbleAsset';
import { SmallRockAsset } from './environment/SmallRockAsset';
import { ClamDecorAsset } from './environment/ClamDecorAsset';
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
import { ClownfishAsset } from './character/ClownfishAsset';

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
  private clownfishAssetGenerator: ClownfishAsset; // Add clownfish asset generator
  private waterSurfaceAsset?: WaterSurfaceAsset;
  private pebbleAssetGenerator?: PebbleAsset;
  private smallRockAssetGenerator?: SmallRockAsset;
  private clamDecorAssetGenerator?: ClamDecorAsset;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    
    // Initialize asset generators
    this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
    
    // Initialize updated assets that don't need ShaderManager
    try {
      this.rockAssetGenerator = new RockAsset();
      this.coralAssetGenerator = new CoralAsset();
      this.clamAssetGenerator = new ClamAsset();
      this.jellyfishAssetGenerator = new JellyfishAsset();
      this.pufferfishAssetGenerator = new PufferfishAsset(); // Corrected initialization
    } catch (error) {
      console.error("Error initializing updated asset generators:", error);
      // Create empty placeholders if initialization fails
      // These will be created on-demand in createObstacle
      this.rockAssetGenerator = null as any;
      this.coralAssetGenerator = null as any;
      this.clamAssetGenerator = null as any;
      this.jellyfishAssetGenerator = null as any;
      this.pufferfishAssetGenerator = null as any; // Also ensure placeholder on error
    }
    
    // Assets still using ShaderManager
    // We use any to bypass type checking since we're in a transition period
    // this.pufferfishAssetGenerator = new PufferfishAsset(this.shaderManager as any); // This line is now handled above
    this.bubbleAssetGenerator = new BubbleAsset(this.shaderManager);
    this.coinAssetGenerator = new CoinAsset(this.shaderManager);
    this.clownfishAssetGenerator = new ClownfishAsset(this.shaderManager);
    
    console.log("ProceduralAssetFactory: Initialized with new obstacles and clownfish player.");
  }

  public createPlayerMesh(): THREE.Group {
    // Create or retrieve a clownfish asset and return its mesh
    return this.clownfishAssetGenerator.getMesh();
  }
  
  /**
   * Creates a new clownfish asset instance
   * @returns A new ClownfishAsset instance
   */
  public createClownfishAsset(): ClownfishAsset {
    return new ClownfishAsset(this.shaderManager);
  }

  public async createSeafloorSegmentMesh(): Promise<THREE.Mesh> {
    // Create a new instance of SeafloorAsset if needed to avoid potential issues
    if (!this.seafloorAssetGenerator) {
      this.seafloorAssetGenerator = new SeafloorAsset(this.shaderManager);
    }
    // Create and return the mesh
    const mesh = await this.seafloorAssetGenerator.createMesh();
    return mesh;
  }

  public createObstacleMesh(type: AnyObstacleTypeString): THREE.Mesh | THREE.Group {
    try {
      switch (type) {
        case 'coral':
          // Ensure we have a valid generator
          if (!this.coralAssetGenerator) {
            this.coralAssetGenerator = new CoralAsset();
          }
          return this.coralAssetGenerator.getMesh();
        case 'rock':
          // Ensure we have a valid generator
          if (!this.rockAssetGenerator) {
            this.rockAssetGenerator = new RockAsset();
          }
          return this.rockAssetGenerator.getMesh();
        case 'clam':
          // Ensure we have a valid generator
          if (!this.clamAssetGenerator) {
            this.clamAssetGenerator = new ClamAsset();
          }
          return this.clamAssetGenerator.getMesh();
        case 'jellyfish':
          // Ensure we have a valid generator
          if (!this.jellyfishAssetGenerator) {
            this.jellyfishAssetGenerator = new JellyfishAsset();
          }
          return this.jellyfishAssetGenerator.getMesh();
        case 'pufferfish':
          // Corrected Pufferfish handling for the new minimal asset
          const pufferfishAssetInstance = new PufferfishAsset(); // No args
          return pufferfishAssetInstance.getMesh(); // Get the already created mesh
        case 'shark':
        case 'seaTurtle':
        case 'kelpWall':
        case 'schoolOfFish':
          // These use the createObstacle method which returns both mesh and asset
          console.warn(`ProceduralAssetFactory: Obstacle type "${type}" should use createObstacle() instead.`);
          const { mesh } = this.createObstacle(type);
          return mesh;
        default:
          console.warn(`ProceduralAssetFactory: Unknown obstacle type "${type}". Creating fallback rock.`);
          // Ensure we have a valid rock generator for fallback
          if (!this.rockAssetGenerator) {
            this.rockAssetGenerator = new RockAsset();
          }
          return this.rockAssetGenerator.getMesh();
      }
    } catch (error) {
      console.error(`Error creating obstacle mesh of type ${type}:`, error);
      // Create a fallback empty group
      const fallbackGroup = new THREE.Group();
      fallbackGroup.name = `fallback_${type}`;
      fallbackGroup.userData = { type: 'obstacle', name: 'unknown_fallback' };
      return fallbackGroup;
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

    try {
      switch (type) {
        case 'coral':
          // Use updated CoralAsset without ShaderManager
          asset = new CoralAsset();
          mesh = asset.getMesh();
          break;
        case 'rock':
          // Use updated RockAsset without ShaderManager
          asset = new RockAsset();
          mesh = asset.getMesh();
          break;
        case 'clam':
          // Use updated ClamAsset without ShaderManager
          asset = new ClamAsset();
          mesh = asset.getMesh();
          break;
        case 'jellyfish':
          // Use updated JellyfishAsset without ShaderManager
          asset = new JellyfishAsset();
          mesh = asset.getMesh();
          break;
        case 'pufferfish':
          // Corrected Pufferfish handling for the new minimal asset
          asset = new PufferfishAsset(); // No args
          mesh = asset.getMesh();      // Get the already created mesh
          break;
        case 'shark':
          asset = new SharkAsset(); // No args
          mesh = asset.getMesh();
          break;
        case 'seaTurtle':
          asset = new SeaTurtleAsset(); // No args
          mesh = asset.getMesh();
          break;
        case 'kelpWall':
          asset = new KelpWallAsset(); // No args
          mesh = asset.getMesh();
          break;
        case 'schoolOfFish':
          asset = new SchoolOfFishAsset(); // No args
          mesh = asset.getMesh();
          break;
        default:
          console.warn(`ProceduralAssetFactory: Unknown obstacle type "${type}". Creating fallback rock.`);
          asset = new RockAsset();
          mesh = asset.getMesh();
          // Ensure userData is set for fallback
          if (mesh) {
            mesh.userData = { ...mesh.userData, type: 'obstacle', name: 'unknown_fallback_rock' };
          }
      }
    } catch (error) {
      console.error(`Error creating obstacle of type ${type}:`, error);
      // Fallback to basic rock if there's an error
      asset = new RockAsset();
      try {
        mesh = asset.getMesh();
      } catch (e) {
        // If even the fallback fails, create an empty group
        console.error("Even fallback rock creation failed:", e);
        mesh = new THREE.Group();
        mesh.name = `emergency_fallback_${type}`;
      }
      
      if (mesh) {
        mesh.userData = { ...mesh.userData, type: 'obstacle', name: 'error_fallback_rock' };
      }
    }

    // Ensure mesh exists before trying to access userData
    if (!mesh) {
      console.error(`Failed to create mesh for obstacle type ${type}`);
      // Create a fallback empty group
      mesh = new THREE.Group();
      mesh.name = `fallback_${type}`;
    }
    
    // Initialize userData if it doesn't exist
    if (!mesh.userData) {
      mesh.userData = {};
    }
    
    // Set required properties on userData
    mesh.userData.assetInstance = asset;
    mesh.userData.name = type;
    mesh.userData.type = 'obstacle';

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

  public getSeafloorAssetGenerator(): SeafloorAsset {
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

  public getWaterSurfaceAsset(): WaterSurfaceAsset {
    if (!this.waterSurfaceAsset) {
      this.waterSurfaceAsset = new WaterSurfaceAsset(this.shaderManager);
    }
    return this.waterSurfaceAsset;
  }

  public getPebbleMesh(): THREE.Mesh {
    if (!this.pebbleAssetGenerator) {
      this.pebbleAssetGenerator = new PebbleAsset();
    }
    return this.pebbleAssetGenerator.getMesh();
  }

  public getSmallRockMesh(): THREE.Mesh {
    if (!this.smallRockAssetGenerator) {
      this.smallRockAssetGenerator = new SmallRockAsset();
    }
    return this.smallRockAssetGenerator.getMesh();
  }

  public getClamDecorMesh(): THREE.Group {
    if (!this.clamDecorAssetGenerator) {
      this.clamDecorAssetGenerator = new ClamDecorAsset();
    }
    return this.clamDecorAssetGenerator.getMesh();
  }

  /**
   * Exposes the internal ShaderManager instance
   */
  public getShaderManager(): ShaderManager {
    return this.shaderManager;
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