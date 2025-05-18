import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem, ConfigurationSystem } from '../core/ConfigurationSystem';
import { LightingManager } from '../services/LightingManager';
import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';
import { KelpWallAsset } from '../assets/obstacles/KelpWallAsset'; // Used for decorative kelp
import { ShaderManager } from '../services/ShaderManager';
import { KelpWallObstacleConfig } from '../config/gameConfig';

interface EnvironmentSegment {
  mesh: THREE.Mesh; // Seafloor mesh
  isActive: boolean;
  kelpClusters: THREE.Group[]; // Kelp associated with this segment
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
  private kelpPool: { asset: KelpWallAsset, mesh: THREE.Group }[] = [];
  private kelpPoolSize = 20; // Max kelp clusters in the pool
  private decorativeKelpConfig: Partial<KelpWallObstacleConfig>; // For less dense kelp

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory, lightingManager: LightingManager, shaderManager: ShaderManager) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.lightingManager = lightingManager;
    this.shaderManager = shaderManager;

    const seafloorAsset = assetFactory.seafloorAsset; // Get the instantiated SeafloorAsset
    this.segmentLength = seafloorAsset.segmentLength;
    this.segmentWidth = seafloorAsset.segmentWidth;

    // Config for less dense, decorative kelp clusters
    this.decorativeKelpConfig = {
        strandCountMin: 1,
        strandCountMax: 3,
        segmentWidthCoverage: 0.3, // Smaller footprint
        baseScaleY: THREE.MathUtils.randFloat(1.5, 3.0), // Varied height for decoration
        visuals: {
            ...configSystem.getObstaclesConfig().kelpWall.visuals, // Base visuals
            opacity: 0.7,
            transmission: 0.6,
        }
    };
    // initialize() is now async and called from GameEngine
  }

  public async initialize(): Promise<void> {
    this.initializeSegments();
    this.initializeWaterSurface();
    this.initializeKelpPool();
    console.log("EnvironmentManager: Initialized with seafloor, water surface, and kelp pool.");
  }

  private initializeSegments(): void {
    for (let i = 0; i < this.segmentPoolSize; i++) {
      const mesh = this.assetFactory.createSeafloorSegmentMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.segments.push({ mesh, isActive: false, kelpClusters: [] });
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
  
  private initializeKelpPool(): void {
    if (!configSystem.get('visuals').kelp.enabled) return;
    for (let i = 0; i < this.kelpPoolSize; i++) {
        const kelpAsset = this.assetFactory.createKelpWallAsset();
        // Potentially override parts of its config for decorative purposes if KelpWallAsset allows
        // For now, we assume KelpWallAsset can be used as is, or we create a new type of KelpAsset.
        // As per step7.md, we enhance KelpWallAsset. We will create it and then scale/position.
        const kelpMesh = kelpAsset.getMesh();
        kelpMesh.visible = false;
        this.scene.add(kelpMesh);
        this.kelpPool.push({ asset: kelpAsset, mesh: kelpMesh });
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

      // Clean up old kelp from this reused segment
      segment.kelpClusters.forEach(clusterMesh => {
        const pooledItem = this.kelpPool.find(p => p.mesh === clusterMesh);
        if (!pooledItem) { // If somehow not in pool, find its asset and add back
             const assetInstance = clusterMesh.userData.assetInstance as KelpWallAsset;
             if (assetInstance) this.kelpPool.push({asset: assetInstance, mesh: clusterMesh });
        }
        clusterMesh.visible = false;
      });
      segment.kelpClusters = [];
      this.spawnKelpOnSegment(segment);

    } else {
      console.warn("EnvironmentManager: No inactive segments available to spawn!");
    }
  }

  private spawnKelpOnSegment(segment: EnvironmentSegment): void {
    if (!configSystem.get('visuals').kelp.enabled || this.kelpPool.length === 0) return;

    const numClusters = THREE.MathUtils.randInt(this.decorativeKelpConfig.strandCountMin || 1, this.decorativeKelpConfig.strandCountMax || 3);

    for (let i = 0; i < numClusters; i++) {
        if (this.kelpPool.length === 0) break; 
        const kelpItem = this.kelpPool.pop()!;
        const kelpClusterMesh = kelpItem.mesh;
        const kelpAssetInstance = kelpItem.asset;
        
        kelpClusterMesh.position.x = segment.mesh.position.x + THREE.MathUtils.randFloatSpread(this.segmentWidth * 0.9);
        kelpClusterMesh.position.y = segment.mesh.position.y; 
        kelpClusterMesh.position.z = segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength * 0.9);
        kelpClusterMesh.rotation.y = Math.random() * Math.PI * 2;
        
        // Apply decorative scaling if needed - this assumes KelpWallAsset mesh is a Group
        const scaleFactor = THREE.MathUtils.randFloat(0.5, 1.0); // Make decorative kelp smaller
        kelpClusterMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

        kelpClusterMesh.visible = true;
        
        kelpAssetInstance.reset?.(); 
        segment.kelpClusters.push(kelpClusterMesh);
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
          segment.kelpClusters.forEach(clusterMesh => {
            clusterMesh.visible = false;
            // Add back to pool if not already there by some mistake
            if (!this.kelpPool.find(p => p.mesh === clusterMesh)) {
                const assetInstance = clusterMesh.userData.assetInstance as KelpWallAsset;
                if (assetInstance) this.kelpPool.push({asset: assetInstance, mesh: clusterMesh});
            }
          });
          segment.kelpClusters = []; 
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

    this.segments.forEach(seg => {
        if (seg.isActive) {
            seg.kelpClusters.forEach(clusterMesh => {
                const assetInstance = clusterMesh.userData.assetInstance as KelpWallAsset; // KelpWallAsset stores itself in mesh.userData.assetInstance
                if (assetInstance) {
                    assetInstance.updateAnimation?.(deltaTime);
                }
            });
        }
    });
  }

  public async reset(initialPlayerZ: number = 0): Promise<void> {
    this.segments.forEach(segment => {
      segment.isActive = false;
      segment.mesh.visible = false;
      segment.kelpClusters.forEach(clusterMesh => {
        clusterMesh.visible = false;
        if (!this.kelpPool.find(p => p.mesh === clusterMesh)) {
            const assetInstance = clusterMesh.userData.assetInstance as KelpWallAsset;
            if (assetInstance) this.kelpPool.push({asset: assetInstance, mesh: clusterMesh});
        }
      });
      segment.kelpClusters = [];
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
      segment.kelpClusters.forEach(clusterMesh => {
         // Kelp assets are disposed when the pool is cleared
         this.scene.remove(clusterMesh);
      });
    });
    this.segments = [];

    this.waterSurface?.dispose();
    this.scene.remove(this.waterSurface?.getMesh() as THREE.Mesh); // Ensure mesh is removed

    this.kelpPool.forEach(kelpItem => {
        kelpItem.asset.dispose(); 
        this.scene.remove(kelpItem.mesh);
    });
    this.kelpPool = [];
    console.log("EnvironmentManager: Disposed.");
  }

  public getConfigSystem(): ConfigurationSystem {
    return configSystem;
  }
} 