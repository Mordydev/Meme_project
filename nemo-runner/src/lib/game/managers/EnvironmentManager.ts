import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { ConfigurationSystem, configSystem } from '../core/ConfigurationSystem';
import { WaterSurfaceAsset } from '../assets/environment/WaterSurfaceAsset';
// import { PlayerController } from './PlayerController'; // Will need later for player position

interface DecorationRef {
  type: 'pebble' | 'rock' | 'clam' | 'kelp' | 'starfish';
  index: number;
}

interface DecorationInstanceData {
  id: number;
  matrix: THREE.Matrix4;
  isActive: boolean;
}

interface EnvironmentSegment {
  mesh: THREE.Group;
  seafloor: THREE.Mesh;
  decorations: DecorationRef[];
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

  private pebbleInstances!: THREE.InstancedMesh;
  private rockInstances!: THREE.InstancedMesh;
  private clamInstances!: THREE.InstancedMesh;
  private kelpInstances!: THREE.InstancedMesh;
  private starfishInstances!: THREE.InstancedMesh;

  private pebbleData: DecorationInstanceData[] = [];
  private rockData: DecorationInstanceData[] = [];
  private clamData: DecorationInstanceData[] = [];
  private kelpData: DecorationInstanceData[] = [];
  private starfishData: DecorationInstanceData[] = [];

  private pebblePoolSize = 50;
  private rockPoolSize = 20;
  private clamPoolSize = 10;
  private kelpPoolSize = 20;
  private starfishPoolSize = 15;

  private nextInstanceId = 0;

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
    if (process.env.NODE_ENV !== 'production') {
      console.log("EnvironmentManager: Initialized.");
    }
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
    // Helper to convert complex groups to a single geometry with material array
    const mergeGroup = (group: THREE.Group): { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] } => {
      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];
      group.updateMatrixWorld(true);
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          const geom = child.geometry.clone();
          geom.applyMatrix4(child.matrix);
          geometries.push(geom);
          materials.push(child.material as THREE.Material);
        }
      });
      const geometry = mergeGeometries(geometries, true) as THREE.BufferGeometry;
      return { geometry, material: materials };
    };

    // Pebbles
    const pebbleMesh = this.assetFactory.getPebbleMesh();
    const pebbleGeom = pebbleMesh.geometry.clone();
    const pebbleMat = (pebbleMesh.material as THREE.Material).clone();
    this.pebbleInstances = new THREE.InstancedMesh(pebbleGeom, pebbleMat, this.pebblePoolSize);
    this.pebbleInstances.frustumCulled = false;
    this.scene.add(this.pebbleInstances);
    for (let i = 0; i < this.pebblePoolSize; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
      this.pebbleInstances.setMatrixAt(i, matrix);
      this.pebbleData.push({ id: this.nextInstanceId++, matrix, isActive: false });
    }
    this.pebbleInstances.instanceMatrix.needsUpdate = true;

    // Rocks
    const rockMesh = this.assetFactory.getSmallRockMesh();
    const rockGeom = rockMesh.geometry.clone();
    const rockMat = (rockMesh.material as THREE.Material).clone();
    this.rockInstances = new THREE.InstancedMesh(rockGeom, rockMat, this.rockPoolSize);
    this.rockInstances.frustumCulled = false;
    this.scene.add(this.rockInstances);
    for (let i = 0; i < this.rockPoolSize; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
      this.rockInstances.setMatrixAt(i, matrix);
      this.rockData.push({ id: this.nextInstanceId++, matrix, isActive: false });
    }
    this.rockInstances.instanceMatrix.needsUpdate = true;

    // Clams
    const clamGroup = this.assetFactory.getClamDecorMesh();
    const clamMerged = mergeGroup(clamGroup);
    this.clamInstances = new THREE.InstancedMesh(clamMerged.geometry, clamMerged.material, this.clamPoolSize);
    this.clamInstances.frustumCulled = false;
    this.scene.add(this.clamInstances);
    for (let i = 0; i < this.clamPoolSize; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
      this.clamInstances.setMatrixAt(i, matrix);
      this.clamData.push({ id: this.nextInstanceId++, matrix, isActive: false });
    }
    this.clamInstances.instanceMatrix.needsUpdate = true;

    // Kelp
    const kelpGroup = this.assetFactory.getKelpMesh();
    const kelpMerged = mergeGroup(kelpGroup);
    this.kelpInstances = new THREE.InstancedMesh(kelpMerged.geometry, kelpMerged.material, this.kelpPoolSize);
    this.kelpInstances.frustumCulled = false;
    this.scene.add(this.kelpInstances);
    for (let i = 0; i < this.kelpPoolSize; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
      this.kelpInstances.setMatrixAt(i, matrix);
      this.kelpData.push({ id: this.nextInstanceId++, matrix, isActive: false });
    }
    this.kelpInstances.instanceMatrix.needsUpdate = true;

    // Starfish
    const starfishMesh = this.assetFactory.getStarfishMesh();
    const starfishGeom = starfishMesh.geometry.clone();
    const starfishMat = (starfishMesh.material as THREE.Material).clone();
    this.starfishInstances = new THREE.InstancedMesh(starfishGeom, starfishMat, this.starfishPoolSize);
    this.starfishInstances.frustumCulled = false;
    this.scene.add(this.starfishInstances);
    for (let i = 0; i < this.starfishPoolSize; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
      this.starfishInstances.setMatrixAt(i, matrix);
      this.starfishData.push({ id: this.nextInstanceId++, matrix, isActive: false });
    }
    this.starfishInstances.instanceMatrix.needsUpdate = true;
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
    if (this.pebbleInstances) {
      this.pebbleInstances.geometry.dispose();
      const mat = this.pebbleInstances.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
      this.scene.remove(this.pebbleInstances);
    }
    if (this.rockInstances) {
      this.rockInstances.geometry.dispose();
      const mat = this.rockInstances.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
      this.scene.remove(this.rockInstances);
    }
    if (this.clamInstances) {
      this.clamInstances.geometry.dispose();
      const mat = this.clamInstances.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
      this.scene.remove(this.clamInstances);
    }
    if (this.kelpInstances) {
      this.kelpInstances.geometry.dispose();
      const mat = this.kelpInstances.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
      this.scene.remove(this.kelpInstances);
    }
    if (this.starfishInstances) {
      this.starfishInstances.geometry.dispose();
      const mat = this.starfishInstances.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach(m => m.dispose()); else mat.dispose();
      this.scene.remove(this.starfishInstances);
    }

    this.pebbleData = [];
    this.rockData = [];
    this.clamData = [];
    this.kelpData = [];
    this.starfishData = [];
  }
  
  // Helper to get an inactive segment from the pool
  private getInactiveSegment(): EnvironmentSegment | undefined {
    return this.segments.find(seg => !seg.isActive);
  }

  private getInactiveInstance(dataArray: DecorationInstanceData[]): [DecorationInstanceData | undefined, number] {
    for (let i = 0; i < dataArray.length; i++) {
      if (!dataArray[i].isActive) return [dataArray[i], i];
    }
    return [undefined, -1];
  }

  private getDataAndMesh(type: DecorationRef['type']): [DecorationInstanceData[], THREE.InstancedMesh | null] {
    switch (type) {
      case 'pebble':
        return [this.pebbleData, this.pebbleInstances || null];
      case 'rock':
        return [this.rockData, this.rockInstances || null];
      case 'clam':
        return [this.clamData, this.clamInstances || null];
      case 'kelp':
        return [this.kelpData, this.kelpInstances || null];
      case 'starfish':
      default:
        return [this.starfishData, this.starfishInstances || null];
    }
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

      // Adjust texture transform so sand appears continuous across segments
      this.updateSeafloorTexture(segment);

      segment.decorations = [];
      this.spawnDecorations(segment);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`EnvironmentManager: Spawned segment at Z: ${segment.mesh.position.z}`);
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("EnvironmentManager: No inactive segments available to spawn!");
      }
    }
  }

  private spawnDecorations(segment: EnvironmentSegment): void {
    const seafloorCfg = configSystem.getSeafloorConfig();
    const decoConfig = seafloorCfg.decorations;
    const margin = seafloorCfg.decorationSideMargin ?? configSystem.get('player').laneWidth;

    if (!decoConfig) {
      return;
    }

    const place = (settings: { scaleMin: number; scaleMax: number; spawnCount: number },
                   dataArray: DecorationInstanceData[],
                   mesh: THREE.InstancedMesh,
                   type: DecorationRef['type']) => {
      if (!mesh || !mesh.instanceMatrix) {
        console.warn(`InstancedMesh for ${type} not properly initialized`);
        return;
      }
      
      const halfWidth = this.segmentWidth / 2;
      const xMin = this.segmentWidth / 4;
      const xMax = Math.max(xMin, halfWidth - margin);

      for (let i = 0; i < settings.spawnCount; i++) {
        const [inst, index] = this.getInactiveInstance(dataArray);
        if (!inst) break;
        inst.isActive = true;

        const scaleVal = THREE.MathUtils.randFloat(settings.scaleMin, settings.scaleMax);
        const side = Math.random() < 0.5 ? -1 : 1;
        const xPos = THREE.MathUtils.randFloat(xMin, xMax) * side;
        const pos = new THREE.Vector3(
          xPos,
          segment.mesh.position.y,
          segment.mesh.position.z + THREE.MathUtils.randFloatSpread(this.segmentLength)
        );
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
        const scale = new THREE.Vector3(scaleVal, scaleVal, scaleVal);
        inst.matrix.compose(pos, quat, scale);
        mesh.setMatrixAt(index, inst.matrix);
        segment.decorations.push({ type, index });
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    // Only place decorations if instance meshes are initialized
    if (this.pebbleInstances && decoConfig.pebbles) place(decoConfig.pebbles, this.pebbleData, this.pebbleInstances, 'pebble');
    if (this.rockInstances && decoConfig.smallRocks) place(decoConfig.smallRocks, this.rockData, this.rockInstances, 'rock');
    if (this.clamInstances && decoConfig.clams) place(decoConfig.clams, this.clamData, this.clamInstances, 'clam');
    if (this.kelpInstances && decoConfig.kelp) place(decoConfig.kelp, this.kelpData, this.kelpInstances, 'kelp');
    if (this.starfishInstances && decoConfig.starfish) place(decoConfig.starfish, this.starfishData, this.starfishInstances, 'starfish');
  }

  /**
   * Offsets the sand texture so each segment lines up seamlessly.
   */
  private updateSeafloorTexture(segment: EnvironmentSegment): void {
    const config = configSystem.getSeafloorConfig();
    const mat = segment.seafloor.material as THREE.MeshStandardMaterial;

    const repeatX = this.segmentWidth / config.textureScale;
    const repeatY = this.segmentLength / config.textureScale;
    const offsetX = (-this.segmentWidth / 2) / config.textureScale;
    const offsetY = (segment.mesh.position.z - this.segmentLength / 2) / config.textureScale;

    if (mat.map) {
      mat.map.repeat.set(repeatX, repeatY);
      mat.map.offset.set(offsetX, offsetY);
      mat.map.needsUpdate = true;
    }
    if (mat.bumpMap) {
      mat.bumpMap.repeat.set(repeatX, repeatY);
      mat.bumpMap.offset.set(offsetX, offsetY);
      mat.bumpMap.needsUpdate = true;
    }
  }



  // Recycles segments that are too far behind the player
  private recycleSegments(playerZ: number): void {
    const recycleThreshold = playerZ + (this.segmentLength * (this.visibleSegmentsBehind + 2)); // Increased buffer

    this.segments.forEach(segment => {
      if (segment.isActive) {
        const segmentFarEdgeZ = segment.mesh.position.z + this.segmentLength / 2;
        if (segmentFarEdgeZ > recycleThreshold) {
          segment.isActive = false;
          segment.mesh.visible = false;

          const updateNeeded: Record<DecorationRef['type'], boolean> = { pebble: false, rock: false, clam: false, kelp: false, starfish: false };

          segment.decorations.forEach(ref => {
            const [dataArray, mesh] = this.getDataAndMesh(ref.type);
            if (mesh && dataArray[ref.index]) {
              const inst = dataArray[ref.index];
              inst.isActive = false;
              inst.matrix.setPosition(0, -1000, 0);
              mesh.setMatrixAt(ref.index, inst.matrix);
              updateNeeded[ref.type] = true;
            }
          });

          if (updateNeeded.pebble && this.pebbleInstances) this.pebbleInstances.instanceMatrix.needsUpdate = true;
          if (updateNeeded.rock && this.rockInstances) this.rockInstances.instanceMatrix.needsUpdate = true;
          if (updateNeeded.clam && this.clamInstances) this.clamInstances.instanceMatrix.needsUpdate = true;
          if (updateNeeded.kelp && this.kelpInstances) this.kelpInstances.instanceMatrix.needsUpdate = true;
          if (updateNeeded.starfish && this.starfishInstances) this.starfishInstances.instanceMatrix.needsUpdate = true;

          segment.decorations = [];
          if (process.env.NODE_ENV !== 'production') {
            console.log(`EnvironmentManager: Recycled segment at Z: ${segment.mesh.position.z}`);
          }
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
    });
    this.segments = [];

    this.waterSurface?.dispose();

    // Dispose decoration pools
    this.clearDecorationPools();

    if (process.env.NODE_ENV !== 'production') {
      console.log("EnvironmentManager: Disposed.");
    }
  }

  public async reset(initialPlayerZ: number = 0): Promise<void> {
    // Remove and dispose any active decorations
    this.segments.forEach(segment => {
      segment.isActive = false;
      segment.mesh.visible = false;
      segment.decorations.forEach(ref => {
        const [dataArray, mesh] = this.getDataAndMesh(ref.type);
        if (mesh && dataArray[ref.index]) {
          const inst = dataArray[ref.index];
          inst.isActive = false;
          inst.matrix.setPosition(0, -1000, 0);
          mesh.setMatrixAt(ref.index, inst.matrix);
        }
      });
      segment.decorations = [];
    });

    if (this.pebbleInstances) this.pebbleInstances.instanceMatrix.needsUpdate = true;
    if (this.rockInstances) this.rockInstances.instanceMatrix.needsUpdate = true;
    if (this.clamInstances) this.clamInstances.instanceMatrix.needsUpdate = true;
    if (this.kelpInstances) this.kelpInstances.instanceMatrix.needsUpdate = true;
    if (this.starfishInstances) this.starfishInstances.instanceMatrix.needsUpdate = true;

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
    if (process.env.NODE_ENV !== 'production') {
      console.log("EnvironmentManager: Reset.");
    }
  }

  /**
   * Gets the configuration system used by the game
   * @returns The configuration system
   */
  public getConfigSystem(): ConfigurationSystem {
    return configSystem;
  }
}