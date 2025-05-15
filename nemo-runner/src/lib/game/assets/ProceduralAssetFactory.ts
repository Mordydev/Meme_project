import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../services/ShaderManager';
import { IObstacleAsset } from './IObstacleAsset';
import { AssetHelpers } from './AssetHelpers';
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
import { ClownfishAsset } from './character/ClownfishAsset';

// Define a type that implements the IObstacleAsset interface for type safety
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

  public createSeafloorSegmentMesh(): THREE.Mesh {
    return this.seafloorAssetGenerator.createMesh();
  }

  /**
   * Creates a mesh for an obstacle type using standardized approach
   * @deprecated Use createObstacle() instead for consistent handling of assets
   */
  public createObstacleMesh(type: AnyObstacleTypeString): THREE.Mesh | THREE.Group {
    console.log(`ProceduralAssetFactory: createObstacleMesh is deprecated. Use createObstacle for ${type}`);
    // Simply delegate to createObstacle for all types to ensure consistent handling
    const { mesh } = this.createObstacle(type);
    return mesh;
  }

  /**
   * Creates an obstacle and returns both the mesh and the asset instance
   * Standardized approach for all obstacle types with enhanced visibility enforcement
   * 
   * @param type The type of obstacle to create
   * @returns Object containing both the mesh and the asset instance
   */
  public createObstacle(type: AnyObstacleTypeString): { mesh: THREE.Group, asset: ObstacleAssetType } {
    console.log(`ProceduralAssetFactory: Creating obstacle of type ${type}`);
    let asset: ObstacleAssetType;
    let mesh: THREE.Group;

    try {
      // Create the appropriate asset based on obstacle type
      switch (type) {
        case 'coral':
          console.log(`Creating coral obstacle with standardized approach`);
          asset = new CoralAsset(this.shaderManager);
          break;
        case 'rock':
          asset = new RockAsset(this.shaderManager);
          break;
        case 'clam':
          asset = new ClamAsset(this.shaderManager);
          break;
        case 'pufferfish':
          asset = new PufferfishAsset(this.shaderManager);
          break;
        case 'jellyfish':
          asset = new JellyfishAsset(this.shaderManager);
          break;
        case 'shark':
          console.log("ProceduralAssetFactory: Creating shark with GUARANTEED visibility");
          asset = new SharkAsset(this.shaderManager);
          break;
        case 'seaTurtle':
          console.log("ProceduralAssetFactory: Creating sea turtle with standardized approach");
          asset = new SeaTurtleAsset(this.shaderManager);
          break;
        case 'kelpWall':
          asset = new KelpWallAsset(this.shaderManager);
          break;
        case 'schoolOfFish':
          asset = new SchoolOfFishAsset(this.shaderManager);
          break;
        default:
          console.warn(`ProceduralAssetFactory: Unknown obstacle type "${type}". Creating fallback rock.`);
          asset = new RockAsset(this.shaderManager);
      }
      
      // First try to use createMesh, then fall back to getMesh for consistency
      let tempMesh: THREE.Group | undefined;
      
      try {
        if (typeof asset.createMesh === 'function') {
          console.log(`Using createMesh() for ${type}`);
          tempMesh = asset.createMesh();
        } else if (typeof asset.getMesh === 'function') {
          console.log(`Using getMesh() for ${type}`);
          tempMesh = asset.getMesh();
        } else {
          throw new Error(`Asset for ${type} has neither createMesh nor getMesh method`);
        }
        
        // Check if the asset method actually returned a valid mesh
        if (!tempMesh) {
          console.error(`${type} asset returned undefined mesh - using fallback`);
          throw new Error(`${type} asset did not create a valid mesh`);
        }
        
        // Ensure what we got is a THREE.Group
        if (!(tempMesh instanceof THREE.Group)) {
          // If it's a Mesh or other Object3D, wrap it in a Group
          console.log(`${type} asset returned ${tempMesh.constructor.name} - wrapping in Group`);
          const wrapperGroup = new THREE.Group();
          wrapperGroup.add(tempMesh);
          mesh = wrapperGroup;
        } else {
          mesh = tempMesh;
        }
        
      } catch (e) {
        console.error(`Error creating mesh for ${type}:`, e);
        throw e; // Re-throw to trigger the fallback in outer catch block
      }

      // Set appropriate render order for different obstacle types
      switch (type) {
        case 'shark':
          // Higher render order for sharks, but no material overrides
          mesh.renderOrder = 1000;
          console.log("Setting high render order for shark");
          break;
        case 'seaTurtle':
          // High render order but below sharks
          mesh.renderOrder = 900;
          console.log("Setting high render order for sea turtle");
          break;
        case 'coral':
          // High render order for coral to ensure visibility
          mesh.renderOrder = 800;
          
          // Enhance coral's emissive glow for better visibility (but don't override entire material)
          mesh.traverse(child => {
            if (child instanceof THREE.Mesh && 
                !child.name.includes("Collision") && 
                !child.name.includes("Collider")) {
                  
              // Tweak emissive properties if it's a MeshStandardMaterial
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xFF6347); // Tomato red emissive
                child.material.emissiveIntensity = 0.3; // Stronger emissive
                child.material.needsUpdate = true;
              }
            }
          });
          break;
        case 'jellyfish':
          // Higher render order for transparent jellyfish
          mesh.renderOrder = 850;
          break;
        default:
          // Default render order for other obstacles
          mesh.renderOrder = 500;
      }
      
      // Apply standard visibility enforcement to all obstacle types
      // Each asset is now responsible for its own proper material setup
      AssetHelpers.ensureVisibility(mesh);
        
      // Set standard userData
      if (!mesh.userData) {
        mesh.userData = {};
      }
        
      // Use helper to set consistent userData
      AssetHelpers.setStandardUserData(
        mesh,
        type,
        asset.isDangerous ? asset.isDangerous() : true,
        asset
      );
        
      console.log(`ProceduralAssetFactory: Created ${type} obstacle successfully:`, {
        children: mesh.children.length,
        visible: mesh.visible,
        type: mesh.userData.name
      });
      
    } catch (error) {
      console.error(`ProceduralAssetFactory: Error creating ${type} obstacle:`, error);
      
      // Create a standardized emergency fallback for all obstacle types
      // This creates something GUARANTEED to be visible and work for collisions
      const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
      
      // Use different colors for different obstacles to help identify issues
      let fallbackColor: number;
      switch (type) {
        case 'shark': fallbackColor = 0xFF00FF; break; // Magenta for shark
        case 'seaTurtle': fallbackColor = 0x00FF00; break; // Green for turtles
        case 'coral': fallbackColor = 0xFF6347; break; // Tomato for coral
        default: fallbackColor = 0xFF0000; // Red for others
      }
      
      const fallbackMaterial = new THREE.MeshBasicMaterial({ 
        color: fallbackColor,
        wireframe: false,
        side: THREE.DoubleSide, // Render both sides
        transparent: false,  // No transparency
        depthTest: true,
        depthWrite: true
      });
      
      mesh = new THREE.Group();
      mesh.name = `${type}EmergencyFallback`;
      
      // Create primary visible mesh - Use BoxGeometry for guaranteed rendering
      const mainMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      mainMesh.name = `${type}FallbackMesh`;
      mainMesh.renderOrder = 2000; // Super high render order for fallbacks
      mesh.add(mainMesh);
      
      // Create invisible collision mesh slightly larger than visible mesh
      const collisionMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      collisionMesh.name = `${type}FallbackCollisionMesh`;
      mesh.add(collisionMesh);
      
      // Create the asset based on type for consistent interface
      switch (type) {
        case 'shark':
          asset = new SharkAsset(this.shaderManager);
          break;
        case 'seaTurtle':
          asset = new SeaTurtleAsset(this.shaderManager);
          break;
        case 'kelpWall':
          asset = new KelpWallAsset(this.shaderManager);
          break;
        case 'schoolOfFish':
          asset = new SchoolOfFishAsset(this.shaderManager);
          break;
        case 'coral':
          asset = new CoralAsset(this.shaderManager);
          break;
        default:
          // Generic fallback for unknown types
          asset = new RockAsset(this.shaderManager);
      }
      
      // Set the mesh in the asset to retain consistent interface
      if ('setMesh' in asset && typeof asset.setMesh === 'function') {
        try {
          asset.setMesh(mesh);
        } catch (e) {
          console.warn(`Failed to call setMesh on ${type} asset:`, e);
        }
      }
      
      // Double-ensure the fallback is visible
      mesh.visible = true;
      mesh.traverse(child => {
        if (child instanceof THREE.Mesh && !child.name.includes('Collision')) {
          child.visible = true;
          // Ensure material is visible and rendering correctly
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.visible = true;
                mat.needsUpdate = true;
                mat.side = THREE.DoubleSide;
              });
            } else {
              child.material.visible = true;
              child.material.needsUpdate = true;
              child.material.side = THREE.DoubleSide;
            }
          }
        }
      });
      
      // Set standard userData for the fallback
      mesh.userData = { 
        type: 'obstacle', 
        name: type, 
        isDangerous: true,
        isFallback: true,
        isEmergencyFallback: true,
        // Add asset instance last to avoid circular reference issues
        assetInstance: asset
      };
      
      console.log(`ProceduralAssetFactory: Created EMERGENCY FALLBACK for ${type} with high visibility`);
    }

    return { mesh, asset };
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

  // Removed redundant shark creation methods that were bypassing the standard asset creation flow
  // All sharks are now created through the standard asset class for consistency
}