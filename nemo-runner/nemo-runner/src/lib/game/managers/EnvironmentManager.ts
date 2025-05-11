import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
// import { PlayerController } from './PlayerController'; // Will need later for player position

interface EnvironmentSegment {
  mesh: THREE.Mesh;
  isActive: boolean;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  // private playerController: PlayerController; // To track player's Z position

  private segments: EnvironmentSegment[] = [];
  private segmentPoolSize = 5; // Number of segments to pool
  private segmentLength = 20; // Must match SeafloorAsset.segmentLength or get from asset
  private lastSegmentZ = 0; // Z position of the front edge of the furthest segment

  private visibleSegmentsFront = 2; // How many segments to keep ahead of player
  private visibleSegmentsBehind = 1; // How many segments to keep behind player

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory /*, playerController: PlayerController */) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    // this.playerController = playerController;

    // Get segmentLength from the assetFactory's public getter
    this.segmentLength = assetFactory.seafloorSegmentLength;

    this.initializeSegments();
    console.log("EnvironmentManager: Initialized.");
  }

  private initializeSegments(): void {
    for (let i = 0; i < this.segmentPoolSize; i++) {
      const mesh = this.assetFactory.createSeafloorSegmentMesh();
      mesh.visible = false; // Initially hide
      this.scene.add(mesh);
      this.segments.push({ mesh, isActive: false });
    }
    // Position initial segments
    for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
        this.spawnSegmentAhead(true); // true to force spawn at specific positions
    }
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
      console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
    } else {
      console.warn("EnvironmentManager: No inactive segments available to spawn!");
    }
  }

  // Recycles segments that are too far behind the player
  private recycleSegments(playerZ: number): void {
    const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1)); // Point beyond which segments are recycled

    this.segments.forEach(segment => {
      if (segment.isActive) {
        // A segment's "front" edge (closest to player when behind) is its position.z + segmentLength/2
        const segmentFrontEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
        if (segmentFrontEdgeZ > recycleThreshold) {
          segment.isActive = false;
          segment.mesh.visible = false;
          console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
        }
      }
    });
  }


  public update(deltaTime: number, playerZ: number): void {
    // Check if we need to spawn new segments ahead
    // If the player is approaching the "end" of the visible segments
    const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * this.visibleSegmentsFront) - (this.segmentLength * 0.5) ;
    if (playerZ < spawnTriggerZ) {
      this.spawnSegmentAhead();
    }

    // Check if we need to recycle segments behind
    this.recycleSegments(playerZ);
  }

  public dispose(): void {
    this.segments.forEach(segment => {
      segment.mesh.geometry.dispose();
      if (Array.isArray(segment.mesh.material)) {
        segment.mesh.material.forEach(m => m.dispose());
      } else {
        segment.mesh.material.dispose();
      }
      this.scene.remove(segment.mesh);
    });
    this.segments = [];
    console.log("EnvironmentManager: Disposed.");
  }

  public reset(initialPlayerZ: number = 0): void {
    this.segments.forEach(segment => {
      segment.isActive = false;
      segment.mesh.visible = false;
    });
    this.lastSegmentZ = initialPlayerZ + this.segmentLength;
    for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
      this.spawnSegmentAhead(true);
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