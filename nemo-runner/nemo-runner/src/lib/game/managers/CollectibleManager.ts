// src/lib/game/managers/CollectibleManager.ts
import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';

interface CollectibleInstanceData {
  id: number; // Unique ID for this instance
  type: 'bubble' | 'coin';
  matrix: THREE.Matrix4; // World matrix for this instance
  isActive: boolean;
  baseY: number; // For hover animation
  hoverTime: number; // For hover animation
  scoreValue: number;
  // Bounding sphere in local space (center is origin, radius is asset's radius)
  // This will be transformed by 'matrix' for world space collision check
  localBoundingSphere: THREE.Sphere; 
}

const MAX_BUBBLES = 100; // Max instances for bubbles
const MAX_COINS = 50;   // Max instances for coins

export class CollectibleManager {
  private scene: THREE.Scene;
  private assetFactory: ProceduralAssetFactory;

  private bubbleInstances!: THREE.InstancedMesh;
  private coinInstances!: THREE.InstancedMesh;

  private bubbleData: CollectibleInstanceData[] = [];
  private coinData: CollectibleInstanceData[] = [];
  private nextInstanceId = 0;

  private spawnTimer = 0;
  private spawnInterval = 1.5; // seconds, from config later

  private patterns: Array<(lane: number, startZ: number, type: 'bubble' | 'coin') => THREE.Vector3[]> = [
    this.linePattern, this.wavePattern, this.clusterPattern
  ];

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.initializeInstancedMeshes();
    this.resetTimeToNextSpawn();
    console.log("CollectibleManager: Initialized.");
  }

  private initializeInstancedMeshes(): void {
    const bubbleGeom = this.assetFactory.getCollectibleGeometry('bubble');
    const bubbleMat = this.assetFactory.getCollectibleMaterial('bubble');
    this.bubbleInstances = new THREE.InstancedMesh(bubbleGeom, bubbleMat, MAX_BUBBLES);
    this.bubbleInstances.name = "BubbleInstances";
    this.bubbleInstances.userData.collectibleType = 'bubble'; // For collision system
    this.scene.add(this.bubbleInstances);

    for (let i = 0; i < MAX_BUBBLES; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0); // Initially hidden
      this.bubbleInstances.setMatrixAt(i, matrix);
      this.bubbleData.push({ 
        id: this.nextInstanceId++, 
        type: 'bubble', 
        matrix, 
        isActive: false, 
        baseY: 0, 
        hoverTime: Math.random() * Math.PI * 2,
        scoreValue: this.assetFactory.getCollectibleScoreValue('bubble'),
        localBoundingSphere: new THREE.Sphere(
          new THREE.Vector3(), 
          (bubbleGeom as THREE.SphereGeometry).parameters.radius
        )
      });
    }
    this.bubbleInstances.instanceMatrix.needsUpdate = true;

    const coinGeom = this.assetFactory.getCollectibleGeometry('coin');
    const coinMat = this.assetFactory.getCollectibleMaterial('coin');
    this.coinInstances = new THREE.InstancedMesh(coinGeom, coinMat, MAX_COINS);
    this.coinInstances.name = "CoinInstances";
    this.coinInstances.userData.collectibleType = 'coin';
    this.scene.add(this.coinInstances);

    for (let i = 0; i < MAX_COINS; i++) {
      const matrix = new THREE.Matrix4().setPosition(0, -1000, 0);
      this.coinInstances.setMatrixAt(i, matrix);
      this.coinData.push({ 
        id: this.nextInstanceId++, 
        type: 'coin', 
        matrix, 
        isActive: false, 
        baseY: 0, 
        hoverTime: Math.random() * Math.PI * 2,
        scoreValue: this.assetFactory.getCollectibleScoreValue('coin'),
        // Cylinder radius for coin
        localBoundingSphere: new THREE.Sphere(
          new THREE.Vector3(), 
          (coinGeom as THREE.CylinderGeometry).parameters.radiusTop
        ) 
      });
    }
    this.coinInstances.instanceMatrix.needsUpdate = true;
  }
  
  private resetTimeToNextSpawn(): void {
    this.spawnInterval = (configSystem.get('collectibles')?.spawnIntervalMin || 1.0) + 
                          Math.random() * ((configSystem.get('collectibles')?.spawnIntervalMax || 2.5) - 
                                         (configSystem.get('collectibles')?.spawnIntervalMin || 1.0));
    this.spawnTimer = this.spawnInterval;
  }

  private getInactiveInstance(type: 'bubble' | 'coin'): [CollectibleInstanceData | undefined, number] {
    const dataArray = type === 'bubble' ? this.bubbleData : this.coinData;
    for (let i = 0; i < dataArray.length; i++) {
      if (!dataArray[i].isActive) return [dataArray[i], i];
    }
    return [undefined, -1];
  }

  private spawnPattern(playerZ: number): void {
    const type = Math.random() < 0.7 ? 'bubble' : 'coin'; // 70% bubbles, 30% coins
    const patternFn = this.patterns[Math.floor(Math.random() * this.patterns.length)];
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const startZ = playerZ - (configSystem.get('collectibles')?.spawnDistanceAhead || 25); // Spawn ahead

    const positions = patternFn.call(this, lane, startZ, type); // Use .call to bind 'this' if pattern methods use it

    positions.forEach(pos => {
      const [instance, index] = this.getInactiveInstance(type);
      if (instance && index !== -1) {
        instance.isActive = true;
        instance.baseY = pos.y; // Store base Y for hover
        instance.hoverTime = Math.random() * Math.PI * 2; // Randomize hover start
        
        if (type === 'coin') {
          // Add slight random rotation for coins
          const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
          const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(randomRotation);
          instance.matrix.multiplyMatrices(new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z), rotationMatrix);
        } else {
          instance.matrix.setPosition(pos.x, pos.y, pos.z);
        }

        const instancesMesh = type === 'bubble' ? this.bubbleInstances : this.coinInstances;
        instancesMesh.setMatrixAt(index, instance.matrix);
        instancesMesh.instanceMatrix.needsUpdate = true;
      }
    });
    console.log(`CollectibleManager: Spawned ${type} pattern with ${positions.length} items.`);
  }
  
  // --- Example Pattern Functions ---
  private linePattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const count = type === 'bubble' ? 8 : 5;
    const spacing = 0.8;
    const yPos = configSystem.get('player')?.normalYPosition || -0.45; // Spawn at player's normal height
    for (let i = 0; i < count; i++) {
      positions.push(new THREE.Vector3(lane * configSystem.getPlayerLaneWidth(), yPos, startZ - i * spacing));
    }
    return positions;
  }

  private wavePattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const count = type === 'bubble' ? 10 : 6;
    const amplitude = 0.3;
    const frequency = 0.5;
    const yPos = configSystem.get('player')?.normalYPosition || -0.45;
    for (let i = 0; i < count; i++) {
      const xOffset = Math.sin(i * frequency) * amplitude;
      positions.push(new THREE.Vector3(lane * configSystem.getPlayerLaneWidth() + xOffset, yPos, startZ - i * 0.7));
    }
    return positions;
  }

  private clusterPattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const count = type === 'bubble' ? 5 : 3;
    const radius = 0.5;
    const yPos = configSystem.get('player')?.normalYPosition || -0.45;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        positions.push(new THREE.Vector3(
            lane * configSystem.getPlayerLaneWidth() + Math.cos(angle) * radius,
            yPos + Math.sin(angle) * radius * 0.5, // Slight vertical spread
            startZ - Math.random() * 1.5 // Spread out in Z
        ));
    }
    return positions;
  }

  public update(deltaTime: number, playerZ: number): void {
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0) {
      this.spawnPattern(playerZ);
      this.resetTimeToNextSpawn();
    }

    // Update animations (hovering, spinning for coins) and recycle
    const recycleZ = playerZ + 10; // Recycle if 10 units behind player
    let bubbleMatrixNeedsUpdate = false;
    let coinMatrixNeedsUpdate = false;

    [this.bubbleData, this.coinData].forEach((dataArray, typeIndex) => {
      const instancesMesh = typeIndex === 0 ? this.bubbleInstances : this.coinInstances;
      const hoverAmplitude = typeIndex === 0 ? 0.1 : 0.05; // Bubbles hover more
      const hoverSpeed = typeIndex === 0 ? 2 : 1.5;
      const spinSpeed = typeIndex === 0 ? 0 : 2; // Coins spin

      for (let i = 0; i < dataArray.length; i++) {
        const instance = dataArray[i];
        if (instance.isActive) {
          // Recycle
          const currentPos = new THREE.Vector3().setFromMatrixPosition(instance.matrix);
          if (currentPos.z > recycleZ) {
            instance.isActive = false;
            instance.matrix.setPosition(0, -1000, 0); // Hide it
            if (typeIndex === 0) bubbleMatrixNeedsUpdate = true; else coinMatrixNeedsUpdate = true;
            continue;
          }

          // Animation
          instance.hoverTime += deltaTime * hoverSpeed;
          const hoverOffset = Math.sin(instance.hoverTime) * hoverAmplitude;
          
          // Decompose matrix to apply hover and spin
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          instance.matrix.decompose(position, quaternion, scale);
          
          position.y = instance.baseY + hoverOffset; // Apply hover to base Y

          if (spinSpeed > 0 && instance.type === 'coin') { // Coins spin around Y axis
              const deltaRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), spinSpeed * deltaTime);
              quaternion.multiplyQuaternions(deltaRotation, quaternion);
          }
          
          instance.matrix.compose(position, quaternion, scale);
          
          if (typeIndex === 0) bubbleMatrixNeedsUpdate = true; else coinMatrixNeedsUpdate = true;
        }
      }
    });

    if (bubbleMatrixNeedsUpdate) this.bubbleInstances.instanceMatrix.needsUpdate = true;
    if (coinMatrixNeedsUpdate) this.coinInstances.instanceMatrix.needsUpdate = true;
  }

  // Called by CollisionDetectionSystem when a collectible is hit
  public handleCollectibleHit(instanceId: number): number | null {
    let scoreValue = null;
    const findAndDeactivate = (dataArray: CollectibleInstanceData[], instancesMesh: THREE.InstancedMesh) => {
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].id === instanceId && dataArray[i].isActive) {
                dataArray[i].isActive = false;
                scoreValue = dataArray[i].scoreValue;
                const hiddenMatrix = new THREE.Matrix4().setPosition(0, -1000, 0); // Move off-screen
                instancesMesh.setMatrixAt(i, hiddenMatrix);
                instancesMesh.instanceMatrix.needsUpdate = true;
                console.log(`CollectibleManager: Collected ${dataArray[i].type} id: ${instanceId}, value: ${scoreValue}`);
                return true; // Found and deactivated
            }
        }
        return false;
    };

    if (findAndDeactivate(this.bubbleData, this.bubbleInstances)) {
        // It was a bubble
    } else if (findAndDeactivate(this.coinData, this.coinInstances)) {
        // It was a coin
    }
    return scoreValue;
  }

  // Getters for CollisionDetectionSystem
  public getBubbleData(): readonly CollectibleInstanceData[] { 
    return this.bubbleData; 
  }
  
  public getBubbleInstances(): THREE.InstancedMesh { 
    return this.bubbleInstances; 
  }
  
  public getCoinData(): readonly CollectibleInstanceData[] { 
    return this.coinData; 
  }
  
  public getCoinInstances(): THREE.InstancedMesh { 
    return this.coinInstances; 
  }

  public reset(): void {
    [this.bubbleData, this.coinData].forEach((dataArray, typeIndex) => {
      const instancesMesh = typeIndex === 0 ? this.bubbleInstances : this.coinInstances;
      dataArray.forEach((instance, i) => {
        instance.isActive = false;
        instance.matrix.setPosition(0, -1000, 0);
        instancesMesh.setMatrixAt(i, instance.matrix);
      });
      instancesMesh.instanceMatrix.needsUpdate = true;
    });
    this.resetTimeToNextSpawn();
    console.log("CollectibleManager: Reset.");
  }

  public dispose(): void {
    this.bubbleInstances.geometry.dispose();
    (this.bubbleInstances.material as THREE.Material).dispose();
    this.scene.remove(this.bubbleInstances);

    this.coinInstances.geometry.dispose();
    (this.coinInstances.material as THREE.Material).dispose();
    this.scene.remove(this.coinInstances);

    this.bubbleData = [];
    this.coinData = [];
    console.log("CollectibleManager: Disposed.");
  }
}