import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem, ConfigurationSystem } from '../core/ConfigurationSystem';
import { LightingManager } from '../services/LightingManager';
import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';
import { ShellAsset } from '../assets/environment/ShellAsset';
import { PebbleAsset } from '../assets/environment/PebbleAsset';
import { ShaderManager } from '../services/ShaderManager';
import { PebbleVisualConfig, ShellsVisualConfig } from '../config/gameConfig';

interface EnvironmentSegment {
  mesh: THREE.Mesh; // Seafloor mesh
  isActive: boolean;
  pebbleClusters: THREE.Group[]; // Pebbles associated with this segment
  shells: THREE.Mesh[]; // Shells on this segment
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;
  private lightingManager: LightingManager; 
  private shaderManager: ShaderManager; // Needed for WaterSurfaceAsset

  private segments: EnvironmentSegment[] = [];
  private segmentPoolSize = 5;
  private segmentLength!: number;
  private segmentWidth!: number; // Added to help place kelp
  private lastSegmentZ = 0;

  private visibleSegmentsFront = 2;
  private visibleSegmentsBehind = 1;

  private waterSurface?: WaterSurfaceAsset;
  private pebblePool: { asset: PebbleAsset, mesh: THREE.Group }[] = [];
  private pebblePoolSize = 30; // Max pebble clusters (adjust as needed)
  private pebbleConfig: PebbleVisualConfig;
  private shellPool: { asset: ShellAsset, mesh: THREE.Mesh }[] = [];
  private shellPoolSize = 30; // Adjust based on typical countPerSegment * segmentPoolSize
  private shellConfig: ShellsVisualConfig;

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, lightingManager: LightingManager, shaderManager: ShaderManager) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.lightingManager = lightingManager;
    this.shaderManager = shaderManager;

    const seafloorAsset = assetFactory.seafloorAsset; // Get the instantiated SeafloorAsset
    this.segmentLength = seafloorAsset.segmentLength;
    this.segmentWidth = seafloorAsset.segmentWidth;

    this.pebbleConfig = configSystem.get('visuals').pebbles;
    this.shellConfig = configSystem.get('visuals').shells;
    this.shellPoolSize = (this.shellConfig.countPerSegment || 3) * this.segmentPoolSize * 2; // Pre-allocate enough for a couple of cycles
    // initialize() is now async and called from GameEngine
  }

  public async initialize(): Promise<void> {
    this.initializeSegments();
    this.initializeWaterSurface();
    this.initializePebblePool();
    this.initializeShellPool();
    console.log("EnvironmentManager: Initialized with seafloor, water surface, pebble pool, and shell pool.");
  }

  private initializeSegments(): void {
    for (let i = 0; i < this.segmentPoolSize; i++) {
      const mesh = this.assetFactory.createSeafloorSegmentMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.segments.push({ mesh, isActive: false, pebbleClusters: [], shells: [] });
    }
    // Initial spawn relative to Z=0, player likely starts at Z=0 or slightly ahead.
    // lastSegmentZ should be set up so the first spawnSegmentAhead places segment 0 correctly.
    this.lastSegmentZ = (this.visibleSegmentsBehind +1) * this.segmentLength; // Start spawning from positive Z if player is at 0
    for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind; i++) {
        this.spawnSegmentAhead(true); 
    }
  }

  private initializeWaterSurface(): void {
    if (configSystem.get('visuals').waterSurface.enabled) {
        this.waterSurface = this.assetFactory.createWaterSurfaceAsset();
        const surfaceMesh = this.waterSurface.getMesh();
        if (surfaceMesh) {
            surfaceMesh.position.y = configSystem.get('camera').offset.y + 5; // Example: 5 units above camera's typical height relative to player
            this.scene.add(surfaceMesh);
        }
    }
  }
  
  private initializePebblePool(): void {
    if (!this.pebbleConfig.enabled) return;
    for (let i = 0; i < this.pebblePoolSize; i++) {
        const pebbleAsset = this.assetFactory.createPebbleAsset();
        const pebbleMesh = pebbleAsset.getMesh();
        pebbleMesh.visible = false;
        this.scene.add(pebbleMesh);
        this.pebblePool.push({ asset: pebbleAsset, mesh: pebbleMesh });
    }
  }

  private initializeShellPool(): void {
    if (!this.shellConfig.enabled) return;
    for (let i = 0; i < this.shellPoolSize; i++) {
        const shellAsset = this.assetFactory.createShellAsset(); // Uses default size from config initially
        const shellMesh = shellAsset.getMesh();
        shellMesh.visible = false;
        this.scene.add(shellMesh);
        this.shellPool.push({ asset: shellAsset, mesh: shellMesh });
    }
  }

  private getInactiveSegment(): EnvironmentSegment | undefined {
    return this.segments.find(seg => !seg.isActive);
  }

  private spawnSegmentAhead(/* initialSpawn = false */): void {
    const segment = this.getInactiveSegment();
    if (segment) {
      segment.isActive = true;
      segment.mesh.visible = true;
      
      // Segments are spawned moving towards negative Z
      segment.mesh.position.z = this.lastSegmentZ - (this.segmentLength / 2);
      this.lastSegmentZ -= this.segmentLength;

      segment.mesh.position.y = -1.0; // Configurable floor Y
      // console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);

      this.spawnPebblesOnSegment(segment);
      this.spawnShellsOnSegment(segment);

    } else {
      console.warn("EnvironmentManager: No inactive segments available to spawn!");
    }
  }

  private spawnPebblesOnSegment(segment: EnvironmentSegment): void {
    if (!this.pebbleConfig.enabled || this.pebblePool.length === 0) return;

    const numPebbleClusters = THREE.MathUtils.randInt(1, this.pebbleConfig.countMax > 0 ? 3 : 0); // Spawn 1-3 clusters per segment if enabled

    for (let i = 0; i < numPebbleClusters; i++) {
        if (this.pebblePool.length === 0) break; // No more pebbles in pool
        const pebbleItem = this.pebblePool.pop()!;
        const pebbleMesh = pebbleItem.mesh;

        pebbleMesh.position.x = segment.mesh.position.x + THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.9);
        pebbleMesh.position.y = segment.mesh.position.y + 0.02; // Slightly above seafloor base
        pebbleMesh.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength * 0.9);
        pebbleMesh.rotation.y = Math.random() * Math.PI * 2;

        pebbleMesh.visible = true;

        segment.pebbleClusters.push(pebbleMesh);
    }
  }

  private spawnShellsOnSegment(segment: EnvironmentSegment): void {
    if (!this.shellConfig.enabled || this.shellPool.length === 0) return;

    const numToSpawn = this.shellConfig.countPerSegment || 0;

    for (let i = 0; i < numToSpawn; i++) {
        if (this.shellPool.length === 0) break; // No more shells in pool
        const shellItem = this.shellPool.pop()!;
        const shellMesh = shellItem.mesh;

        shellMesh.position.x = segment.mesh.position.x + THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.9);
        shellMesh.position.y = segment.mesh.position.y + 0.05; // Slightly above seafloor base, ensure visible
        shellMesh.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength * 0.9);
        shellMesh.rotation.y = Math.random() * Math.PI * 2; // Random orientation
        shellMesh.rotation.x = THREE.MathUtils.randFloatSpread(0.2); // Slight tilt
        shellMesh.rotation.z = THREE.MathUtils.randFloatSpread(0.2); // Slight tilt

        let scale = this.shellConfig.size;
        if (this.shellConfig.sizeVariation) {
            scale *= (1 + THREE.MathUtils.randFloatSpread(this.shellConfig.sizeVariation));
        }
        shellMesh.scale.set(scale, scale, scale);

        shellMesh.visible = true;
        segment.shells.push(shellMesh);
    }
  }

  private recycleSegments(playerZ: number): void {
    const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 1.5)); 

    this.segments.forEach(segment => {
      if (segment.isActive) {
        const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
        if (segmentFarEdgeZ > recycleThreshold) {
          segment.isActive = false;
          segment.mesh.visible = false;
          // console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
          segment.pebbleClusters.forEach(mesh => {
            mesh.visible = false;
            if (!this.pebblePool.find(p => p.mesh === mesh)) {
                const assetInstance = mesh.userData.assetInstance as PebbleAsset;
                if (assetInstance) this.pebblePool.push({ asset: assetInstance, mesh });
            }
          });
          segment.pebbleClusters = [];
          segment.shells.forEach(shellMesh => {
            shellMesh.visible = false;
            // Add back to pool if not already there
            if (!this.shellPool.find(p => p.mesh === shellMesh)) {
                const assetInstance = shellMesh.userData.assetInstance as ShellAsset;
                if (assetInstance) this.shellPool.push({ asset: assetInstance, mesh: shellMesh });
            }
          });
          segment.shells = [];
        }
      }
    });
  }

  public async update(deltaTime: number, playerZ: number, elapsedTime: number): Promise<void> {
    const spawnTriggerZ = this.lastSegmentZ + (this.segmentLength * (this.visibleSegmentsFront - 0.5)) ;
    if (playerZ < spawnTriggerZ) {
      this.spawnSegmentAhead();
    }
    this.recycleSegments(playerZ);

    this.waterSurface?.update(deltaTime, elapsedTime);
    if (this.waterSurface && this.waterSurface.getMesh()) {
        // Keep water surface Z aligned with player, but far ahead
        this.waterSurface.getMesh()!.position.z = playerZ - 100; // Example: 100 units ahead of player
    }
  }

  public async reset(initialPlayerZ: number = 0): Promise<void> {
    this.segments.forEach(segment => {
      segment.isActive = false;
      segment.mesh.visible = false;
      segment.pebbleClusters.forEach(p => {
         this.scene.remove(p);
      });
      segment.pebbleClusters = [];
      segment.shells.forEach(shellMesh => {
         this.scene.remove(shellMesh);
      });
    });
    
    this.lastSegmentZ = initialPlayerZ + (this.visibleSegmentsBehind +1) * this.segmentLength; 
    for (let i = 0; i < this.visibleSegmentsFront + this.visibleSegmentsBehind +1; i++) {
        this.spawnSegmentAhead(true);
    }
    if (this.waterSurface && this.waterSurface.getMesh()) {
        this.waterSurface.getMesh()!.position.z = initialPlayerZ - 100; 
    }
    console.log("EnvironmentManager: Reset.");
  }

  public async dispose(): Promise<void> {
    this.segments.forEach(segment => {
      segment.mesh.geometry?.dispose();
      if (segment.mesh.material instanceof THREE.Material) {
        segment.mesh.material.dispose();
      } else if (Array.isArray(segment.mesh.material)) {
        segment.mesh.material.forEach(m => m.dispose());
      }
      this.scene.remove(segment.mesh);
      segment.pebbleClusters.forEach(p => {
         this.scene.remove(p);
      });
      segment.shells.forEach(shellMesh => {
         this.scene.remove(shellMesh);
      });
    });
    this.segments = [];

    this.waterSurface?.dispose();
    this.scene.remove(this.waterSurface?.getMesh() as THREE.Mesh); // Ensure mesh is removed

    this.pebblePool.forEach(item => {
        item.asset.dispose();
        this.scene.remove(item.mesh);
    });
    this.pebblePool = [];
    this.shellPool.forEach(item => {
        item.asset.dispose();
        this.scene.remove(item.mesh);
    });
    this.shellPool = [];
    console.log("EnvironmentManager: Disposed.");
  }

  public getConfigSystem(): ConfigurationSystem {
    return configSystem;
  }
} 