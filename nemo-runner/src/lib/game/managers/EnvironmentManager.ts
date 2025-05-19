import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';
// import { PlayerController } from './PlayerController'; // Will need later for player position

interface EnvironmentSegment {
  mesh: THREE.Group;
  seafloor: THREE.Mesh;
  decorations: THREE.Object3D[];
  isActive: boolean;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  // private playerController: PlayerController; // To track player's Z position

  private segments: EnvironmentSegment[] = [];
  private segmentPoolSize = 5; // Number of segments to pool
  private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
  private segmentWidth = 10;
  private lastSegmentZ = 0; // Z position of the front edge of the furthest segment

  private visibleSegmentsFront = 2; // How many segments to keep ahead of player
  private visibleSegmentsBehind = 1; // How many segments to keep behind player

  private waterSurface?: WaterSurfaceAsset;

  private pebblePool: THREE.Mesh[] = [];
  private rockPool: THREE.Mesh[] = [];
  private clamPool: THREE.Group[] = [];
  private kelpPool: THREE.Group[] = [];

  private pebblePoolSize = 50;
  private rockPoolSize = 20;
  private clamPoolSize = 10;
  private kelpPoolSize = 20;

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    // this.playerController = playerController;

    // Get segmentLength from the assetFactory's public getter
    this.segmentLength = assetFactory.seafloorSegmentLength;
    this.segmentWidth = assetFactory.seafloorAsset.segmentWidth;
  }

  public async initialize(): Promise<void> {
    await this.initializeSegments();
    this.initializeDecorationPools();
    this.initializeWaterSurface();
    console.log("EnvironmentManager: Initialized.");
  }

  private async initializeSegments(): Promise<void> {
    for (let i = 0; i < this.segmentPoolSize; i++) {
      const floor = await this.assetFactory.createSeafloorSegmentMesh();
      const group = new THREE.Group();
      group.add(floor);
      group.visible = false; // Initially hide
      this.scene.add(group);
      this.segments.push({ mesh: group, seafloor: floor, decorations: [], isActive: false });
    }
    // Position initial segments
    for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
        this.spawnSegmentAhead(true); // true to force spawn at specific positions
    }
  }

  private initializeDecorationPools(): void {
    // Initialize pebbles
    for (let i = 0; i < this.pebblePoolSize; i++) {
      const pebble = this.assetFactory.getPebbleMesh();
      pebble.visible = false;
      pebble.userData.decorationType = 'pebble';
      this.scene.add(pebble);
      this.pebblePool.push(pebble);
    }

    // Initialize rocks
    for (let i = 0; i < this.rockPoolSize; i++) {
      const rock = this.assetFactory.getSmallRockMesh();
      rock.visible = false;
      rock.userData.decorationType = 'rock';
      this.scene.add(rock);
      this.rockPool.push(rock);
    }

    // Initialize clams
    for (let i = 0; i < this.clamPoolSize; i++) {
      const clam = this.assetFactory.getClamDecorMesh();
      clam.visible = false;
      clam.userData.decorationType = 'clam';
      this.scene.add(clam);
      this.clamPool.push(clam);
    }

    // Initialize kelp decorations
    for (let i = 0; i < this.kelpPoolSize; i++) {
      const kelp = this.assetFactory.getKelpMesh();
      kelp.visible = false;
      kelp.userData.decorationType = 'kelp';
      this.scene.add(kelp);
      this.kelpPool.push(kelp);
    }
  }

  private initializeWaterSurface(): void {
    this.waterSurface = this.assetFactory.getWaterSurfaceAsset();
    const mesh = this.waterSurface.getMesh();
    mesh.position.y = 10;
    this.scene.add(mesh);
  }

  /** Disposes a material and any textures referenced on it */
  private disposeMaterial(material: THREE.Material): void {
    const mat = material as any;
    for (const key of Object.keys(mat)) {
      const value = mat[key];
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    }
    material.dispose();
  }

  /** Fully dispose of a mesh or group and remove it from the scene */
  private disposeObject(object: THREE.Object3D): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        const material = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) {
          material.forEach(m => this.disposeMaterial(m));
        } else if (material) {
          this.disposeMaterial(material);
        }
      }
    });
    this.scene.remove(object);
  }

  /**
   * Dispose all decoration objects currently stored in pools and empty them
   */
  private clearDecorationPools(): void {
    this.pebblePool.forEach(p => this.disposeObject(p));
    this.rockPool.forEach(r => this.disposeObject(r));
    this.clamPool.forEach(c => this.disposeObject(c));
    this.kelpPool.forEach(k => this.disposeObject(k));

    this.pebblePool = [];
    this.rockPool = [];
    this.clamPool = [];
    this.kelpPool = [];
  }
  
  // Helper to get an inactive segment from the pool
  private getInactiveSegment(): EnvironmentSegment | undefined {
    return this.segments.find(seg => !seg.isActive);
  }

  // Spawns a segment at the front of the current environment path
  private spawnSegmentAhead(initialSpawn = false): void {
    const segment = this.getInactiveSegment();
    if (segment) {
      segment.isActive = true;
      segment.mesh.visible = true;
      
      // Position new segment ahead of the last one
      // The plane's origin is at its center. We want to place them edge-to-edge.
      // If lastSegmentZ is the Z of the *center* of the furthest segment:
      // segment.mesh.position.z = this.lastSegmentZ - this.segmentLength;
      // this.lastSegmentZ = segment.mesh.position.z;

      // If lastSegmentZ tracks the "front" edge (further Z for player) of the last segment:
      if (initialSpawn && this.segments.filter(s => s.isActive).length <=1 ) { // First segment
        segment.mesh.position.z = 0 - (this.segmentLength / 2);
        this.lastSegmentZ = 0 - this.segmentLength; // Front edge of this segment
      } else {
        segment.mesh.position.z = this.lastSegmentZ - (this.segmentLength / 2);
        this.lastSegmentZ -= this.segmentLength; // Update front edge tracker
      }

      // Y position for the floor (can be configurable)
      segment.mesh.position.y = -1; // Example: player is at y=0, floor is below

      segment.decorations = [];
      this.spawnDecorations(segment);
      
      console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
    } else {
      console.warn("EnvironmentManager: No inactive segments available to spawn!");
    }
  }

  private spawnDecorations(segment: EnvironmentSegment): void {
    const decoConfig = configSystem.getSeafloorConfig().decorations;

    if (!decoConfig) {
      return;
    }

    // Spawn pebbles
    const pebbleSettings = decoConfig.pebbles;
    const pebbleCount = pebbleSettings.spawnCount;
    for (let i = 0; i < pebbleCount && this.pebblePool.length > 0; i++) {
      const pebble = this.pebblePool.pop()!;
      const scale = THREE.MathUtils.randFloat(pebbleSettings.scaleMin, pebbleSettings.scaleMax);
      pebble.scale.setScalar(scale);
      this.placeDecoration(pebble, segment);
      segment.decorations.push(pebble);
    }

    // Spawn rocks
    const rockSettings = decoConfig.smallRocks;
    const rockCount = rockSettings.spawnCount;
    for (let i = 0; i < rockCount && this.rockPool.length > 0; i++) {
      const rock = this.rockPool.pop()!;
      const scale = THREE.MathUtils.randFloat(rockSettings.scaleMin, rockSettings.scaleMax);
      rock.scale.setScalar(scale);
      this.placeDecoration(rock, segment);
      segment.decorations.push(rock);
    }

    // Spawn clams
    const clamSettings = decoConfig.clams;
    const clamCount = clamSettings.spawnCount;
    for (let i = 0; i < clamCount && this.clamPool.length > 0; i++) {
      const clam = this.clamPool.pop()!;
      const scale = THREE.MathUtils.randFloat(clamSettings.scaleMin, clamSettings.scaleMax);
      clam.scale.setScalar(scale);
      this.placeDecoration(clam, segment);
      segment.decorations.push(clam);
    }

    // Spawn kelp
    const kelpSettings = decoConfig.kelp;
    const kelpCount = kelpSettings.spawnCount;
    for (let i = 0; i < kelpCount && this.kelpPool.length > 0; i++) {
      const kelp = this.kelpPool.pop()!;
      const scale = THREE.MathUtils.randFloat(kelpSettings.scaleMin, kelpSettings.scaleMax);
      kelp.scale.setScalar(scale);
      this.placeDecoration(kelp, segment);
      segment.decorations.push(kelp);
    }
  }

  private placeDecoration(obj: THREE.Object3D, segment: EnvironmentSegment): void {
    obj.position.x = THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.8);
    obj.position.y = segment.mesh.position.y;
    obj.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength);
    obj.rotation.y = Math.random() * Math.PI * 2;
    obj.visible = true;
  }

  // Recycles segments that are too far behind the player
  private recycleSegments(playerZ: number): void {
    const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 2)); // Increased buffer

    this.segments.forEach(segment => {
      if (segment.isActive) {
        // A segment's far edge (farthest from the player when behind)
        // is its position.z + segmentLength/2
        const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
        if (segmentFarEdgeZ > recycleThreshold) {
          segment.isActive = false;
          segment.mesh.visible = false;

          // Return decorations to pools
          segment.decorations.forEach(obj => {
            obj.visible = false;
            switch (obj.userData.decorationType) {
              case 'pebble':
                this.pebblePool.push(obj as THREE.Mesh);
                break;
              case 'rock':
                this.rockPool.push(obj as THREE.Mesh);
                break;
              case 'clam':
                this.clamPool.push(obj as THREE.Group);
                break;
              case 'kelp':
                this.kelpPool.push(obj as THREE.Group);
                break;
            }
          });
          segment.decorations = [];
          console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
        }
      }
    });
  }


  public async update(deltaTime: number, playerZ: number, elapsedTime: number): Promise<void> {
    // Check if we need to spawn new segments ahead
    // If the player is approaching the "end" of the visible segments
    const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
    if (playerZ < spawnTriggerZ) {
      this.spawnSegmentAhead();
    }

    // Check if we need to recycle segments behind
    this.recycleSegments(playerZ);

    // Update water surface
    this.waterSurface?.update(deltaTime, elapsedTime);
  }

  public dispose(): void {
    this.segments.forEach(segment => {
      this.disposeObject(segment.seafloor);
      this.scene.remove(segment.mesh);
      segment.decorations.forEach(obj => this.disposeObject(obj));
    });
    this.segments = [];

    this.waterSurface?.dispose();

    // Dispose decoration pools
    this.clearDecorationPools();

    console.log("EnvironmentManager: Disposed.");
  }

  public async reset(initialPlayerZ: number = 0): Promise<void> {
    // Remove and dispose any active decorations
    this.segments.forEach(segment => {
      segment.isActive = false;
      segment.mesh.visible = false;

      segment.decorations.forEach(obj => {
        this.disposeObject(obj);
      });
      segment.decorations = [];
    });

    // Clear existing pooled decorations and recreate them
    this.clearDecorationPools();
    this.initializeDecorationPools();
    this.lastSegmentZ = initialPlayerZ + this.segmentLength;
    for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
      this.spawnSegmentAhead(true);
    }
    if (this.waterSurface) {
      this.waterSurface.getMesh().position.z = initialPlayerZ - 20;
    }
    console.log("EnvironmentManager: Reset.");
  }

  /**
   * Gets the configuration system used by the game
   * @returns The configuration system
   */
  public getConfigSystem(): ConfigurationSystem {
    return configSystem;
  }
}