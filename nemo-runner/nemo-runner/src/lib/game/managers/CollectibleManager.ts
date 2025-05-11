// src/lib/game/managers/CollectibleManager.ts
import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';
import { ClamAsset } from '../assets/obstacles/ClamAsset';

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
  private debug = false; // Enable to log spawn info

  private patterns: Array<(lane: number, startZ: number, type: 'bubble' | 'coin') => THREE.Vector3[]> = [
    this.linePattern, this.wavePattern, this.clusterPattern, this.obviousPattern
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

  private spawnPattern(playerZ: number, forceObvious: boolean = false): void {
    const type = Math.random() < 0.5 ? 'bubble' : 'coin'; // 50% bubbles, 50% coins
    
    // Use obvious pattern if forced, otherwise random pattern
    const patternFn = forceObvious ? 
                      this.obviousPattern : 
                      this.patterns[Math.floor(Math.random() * this.patterns.length)];
    
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const startZ = playerZ - (configSystem.get('collectibles')?.spawnDistanceAhead || 20); // Closer spawn for better visibility

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

        if (this.debug) {
          const pos = new THREE.Vector3();
          pos.setFromMatrixPosition(instance.matrix);
          console.log(`CollectibleManager: Spawned ${type} at x:${pos.x.toFixed(1)}, y:${pos.y.toFixed(1)}, z:${pos.z.toFixed(1)}`);
        }
      }
    });

    if (this.debug || positions.length === 0) {
      console.log(`CollectibleManager: Spawned ${type} pattern with ${positions.length} items.`);
    }
  }
  
  // --- Example Pattern Functions ---
  private linePattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const count = type === 'bubble' ? 8 : 5;
    const spacing = 1.2; // Increased spacing for better visibility
    
    // Raise the height slightly above player's eye level for better visibility
    let yPos = -0.3; // Slightly higher than player's normal position
    
    // Offset the height for bubble vs coin
    if (type === 'bubble') {
      yPos = -0.25; // Bubbles float higher
    }
    
    for (let i = 0; i < count; i++) {
      positions.push(new THREE.Vector3(lane * configSystem.getPlayerLaneWidth(), yPos, startZ - i * spacing));
    }
    return positions;
  }

  private wavePattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const count = type === 'bubble' ? 10 : 6;
    const amplitude = 0.5; // Increased for more noticeable wave
    const frequency = 0.5;
    
    // Raise the height for better visibility
    let yPos = -0.3; // Slightly higher than player's normal position
    
    // Offset the height for bubble vs coin
    if (type === 'bubble') {
      yPos = -0.25; // Bubbles float higher
    }
    
    for (let i = 0; i < count; i++) {
      const xOffset = Math.sin(i * frequency) * amplitude;
      positions.push(new THREE.Vector3(lane * configSystem.getPlayerLaneWidth() + xOffset, yPos, startZ - i * 0.9)); // Increased spacing
    }
    return positions;
  }

  private clusterPattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const count = type === 'bubble' ? 5 : 3;
    const radius = 0.7; // Increased radius for more spread
    
    // Raise the height for better visibility
    let yPos = -0.3; // Slightly higher than player's normal position
    
    // Offset the height for bubble vs coin
    if (type === 'bubble') {
      yPos = -0.25; // Bubbles float higher
    }
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        positions.push(new THREE.Vector3(
            lane * configSystem.getPlayerLaneWidth() + Math.cos(angle) * radius,
            yPos + Math.sin(angle) * radius * 0.5, // Vertical spread
            startZ - Math.random() * 2.0 // More spread out in Z
        ));
    }
    return positions;
  }

  // A very obvious pattern with larger items in all lanes - SUPER VISIBLE version
  private obviousPattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const laneWidth = configSystem.getPlayerLaneWidth();
    
    // Create collectibles in all three lanes
    const spacing = 1.5; // Tighter spacing to create more density
    const count = 8; // More items for better visibility
    
    // Higher position for guaranteed visibility - right at player eye level
    const yPos = type === 'bubble' ? 0.0 : -0.1; // Almost at center of screen
    
    // Put collectibles in all lanes directly in front of player
    for (let i = 0; i < count; i++) {
      // Center lane - ALWAYS have items here
      positions.push(new THREE.Vector3(0, yPos, startZ - i * spacing));
      
      // Left and right lanes - alternate for visual pattern
      if (i % 3 === 0) { // Every 3rd position
        // Add to BOTH side lanes for maximum visibility
        positions.push(new THREE.Vector3(-laneWidth, yPos, startZ - i * spacing));
        positions.push(new THREE.Vector3(laneWidth, yPos, startZ - i * spacing));
      } else if (i % 3 === 1) {
        // Left lane only
        positions.push(new THREE.Vector3(-laneWidth, yPos, startZ - i * spacing));
      } else {
        // Right lane only
        positions.push(new THREE.Vector3(laneWidth, yPos, startZ - i * spacing));
      }
    }
    
    console.log(`CollectibleManager: Obvious pattern created with ${positions.length} ${type}s starting at z=${startZ}`);
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

          if (spinSpeed > 0 && instance.type === 'coin') {
              // Coins face the camera (X rotation = 90 degrees) for better visibility
              const faceCamera = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI / 2);

              // Add spin around Z axis (now facing up since coin is rotated)
              const spinRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), instance.hoverTime * 2);
              quaternion.copy(faceCamera);
              quaternion.multiply(spinRotation);
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
                const collectedPosition = new THREE.Vector3();
                new THREE.Vector3().setFromMatrixPosition(dataArray[i].matrix.clone(), collectedPosition);

                // Get information before deactivating
                const collectedType = dataArray[i].type;
                scoreValue = dataArray[i].scoreValue;

                // Deactivate the collectible
                dataArray[i].isActive = false;
                const hiddenMatrix = new THREE.Matrix4().setPosition(0, -1000, 0); // Move off-screen
                instancesMesh.setMatrixAt(i, hiddenMatrix);
                instancesMesh.instanceMatrix.needsUpdate = true;

                // Log collection with more info
                console.log(`CollectibleManager: Collected ${collectedType} id: ${instanceId}, value: ${scoreValue}, at position: ${collectedPosition.x.toFixed(1)}, ${collectedPosition.y.toFixed(1)}, ${collectedPosition.z.toFixed(1)}`);

                // Add visual feedback at collection spot (will be implemented later)
                // this.playCollectionEffect(collectedPosition, collectedType);

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
    
    // Force immediate spawn on reset
    this.spawnTimer = 0;
    console.log("CollectibleManager: Reset. Will spawn collectibles immediately.");
    
    // Force multiple obvious patterns to ensure player sees collectibles
    setTimeout(() => {
      try {
        // Get player Z position
        // @ts-ignore - using window.__gameEngine as a way to get player position
        const playerZ = window.__gameEngine?.playerController?.mesh?.position?.z || 0;
        
        // Spawn first pattern - using the forceObvious parameter
        this.spawnPattern(playerZ, true); // Force obvious pattern
        
        // Force a second pattern a little further ahead
        setTimeout(() => {
          // Force more patterns 1 second later to ensure visibility
          const updatedPlayerZ = window.__gameEngine?.playerController?.mesh?.position?.z || 0;
          this.spawnPattern(updatedPlayerZ, true); // Force another obvious pattern
          
          // And one more specifically for coins
          setTimeout(() => {
            const finalZ = window.__gameEngine?.playerController?.mesh?.position?.z || 0;
            this.spawnPattern(finalZ, true); // One final pattern
            console.log("CollectibleManager: Third pattern spawned for maximum visibility");
          }, 1000);
          
          console.log("CollectibleManager: Second pattern spawned for maximum visibility");
        }, 1000);
        
        console.log("CollectibleManager: First forced pattern spawned");
      } catch (e) {
        console.error("CollectibleManager: Error during forced initial spawn:", e);
      }
    }, 500); // Short delay to ensure the game is properly set up
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