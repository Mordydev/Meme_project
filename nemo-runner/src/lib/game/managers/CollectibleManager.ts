// src/lib/game/managers/CollectibleManager.ts
import * as THREE from 'three';
import { ProceduralAssetFactory } from '../assets/ProceduralAssetFactory';
import { configSystem } from '../core/ConfigurationSystem';
import { ClamAsset } from '../assets/obstacles/ClamAsset';
import { PlayerController } from './PlayerController';

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

  // Magnet power-up properties
  private isMagnetActive: boolean = false;
  private magnetAttractionRadius: number = 0;
  private magnetAttractionSpeed: number = 15; // Increased speed for more obvious effect
  private playerController?: PlayerController; // To get player position

  private patterns: Array<(lane: number, startZ: number, type: 'bubble' | 'coin') => THREE.Vector3[]> = [
    this.linePattern, this.wavePattern, this.clusterPattern, this.obviousPattern
  ];

  constructor(scene: THREE.Scene, assetFactory: ProceduralAssetFactory) {
    this.scene = scene;
    this.assetFactory = assetFactory;
    this.initializeInstancedMeshes();
    this.resetTimeToNextSpawn();
    this.debug = false; // Disable debug logging for production
    console.log("CollectibleManager: Initialized.");
  }

  private initializeInstancedMeshes(): void {
    // Get geometries and materials from asset factory
    const bubbleGeom = this.assetFactory.getCollectibleGeometry('bubble');
    const bubbleMat = this.assetFactory.getCollectibleMaterial('bubble');

    // Create the bubble instanced mesh
    this.bubbleInstances = new THREE.InstancedMesh(bubbleGeom, bubbleMat, MAX_BUBBLES);
    this.bubbleInstances.name = "BubbleInstances";
    this.bubbleInstances.userData.collectibleType = 'bubble'; // For collision system
    this.bubbleInstances.frustumCulled = false; // Critical: Prevent culling of off-screen instances
    this.scene.add(this.bubbleInstances);

    // Initialize bubble instances
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

    // Create coin instances
    const coinGeom = this.assetFactory.getCollectibleGeometry('coin');
    const coinMat = this.assetFactory.getCollectibleMaterial('coin');

    this.coinInstances = new THREE.InstancedMesh(coinGeom, coinMat, MAX_COINS);
    this.coinInstances.name = "CoinInstances";
    this.coinInstances.userData.collectibleType = 'coin';
    this.coinInstances.frustumCulled = false; // Critical: Prevent culling of off-screen instances
    this.scene.add(this.coinInstances);

    // Initialize coin instances
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

  /**
   * Links the player controller to allow access to player position for magnet effect
   */
  public linkPlayerController(playerController: PlayerController): void {
    this.playerController = playerController;
  }

  /**
   * Sets the magnet power-up state
   * @param isActive Whether the magnet power-up is active
   */
  public setMagnetActive(isActive: boolean): void {
    this.isMagnetActive = isActive;
    if (isActive) {
      this.magnetAttractionRadius = configSystem.getPowerUpsConfig().magnet.attractionRadius;
      console.log("CollectibleManager: Magnet ACTIVE, radius:", this.magnetAttractionRadius);
    } else {
      this.magnetAttractionRadius = 0;
      console.log("CollectibleManager: Magnet DEACTIVE");
    }
  }

  private getInactiveInstance(type: 'bubble' | 'coin'): [CollectibleInstanceData | undefined, number] {
    const dataArray = type === 'bubble' ? this.bubbleData : this.coinData;
    for (let i = 0; i < dataArray.length; i++) {
      if (!dataArray[i].isActive) return [dataArray[i], i];
    }
    return [undefined, -1];
  }

  private spawnPattern(playerZ: number, forceObvious: boolean = false): void {
    // Choose type with coin being more rare (this can be overridden by reset method)
    const type = Math.random() < 0.75 ? 'bubble' : 'coin'; // 75% bubbles, 25% coins

    // Use obvious pattern if forced, otherwise random pattern
    const patternFn = forceObvious ?
                     this.obviousPattern :
                     this.patterns[Math.floor(Math.random() * this.patterns.length)];

    // Random lane selection
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

    // Spawn ahead of player at reasonable distance
    const spawnDistanceAhead = configSystem.get('collectibles')?.spawnDistanceAhead || 15;
    const startZ = playerZ - spawnDistanceAhead;

    const positions = patternFn.call(this, lane, startZ, type);

    if (positions.length === 0) {
        console.warn("CollectibleManager: Pattern function returned no positions.");
        return;
    }

    positions.forEach(pos => {
      const [instance, index] = this.getInactiveInstance(type);
      if (instance && index !== -1) {
        instance.isActive = true;
        instance.baseY = pos.y; // Store base Y for hover
        instance.hoverTime = Math.random() * Math.PI * 2; // Randomize hover start
        
        // Position the instance using matrix composition for consistency
        const positionVec = new THREE.Vector3(pos.x, pos.y, pos.z);
        const quaternion = new THREE.Quaternion(); // Default no rotation
        const scaleVec = new THREE.Vector3(1, 1, 1);

        if (type === 'coin') {
          // Add random Y-axis rotation for coins
          const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
          quaternion.setFromEuler(randomRotation);
        }

        // Use compose to set position, rotation, and scale
        instance.matrix.compose(positionVec, quaternion, scaleVec);

        // Set the matrix in the instanced mesh
        const instancesMesh = type === 'bubble' ? this.bubbleInstances : this.coinInstances;
        instancesMesh.setMatrixAt(index, instance.matrix);

      }
    });

    // Ensure instance matrices are updated
    this.bubbleInstances.instanceMatrix.needsUpdate = true;
    this.coinInstances.instanceMatrix.needsUpdate = true;
  }
  
  // --- Example Pattern Functions ---
  private linePattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    // Fewer items with randomization for variety
    const count = type === 'bubble' ?
                  (Math.floor(Math.random() * 3) + 3) : // Bubbles: 3-5
                  (Math.floor(Math.random() * 2) + 2);  // Coins: 2-3

    const spacing = 1.5; // Increased spacing for better gameplay

    // Position at eye level for good visibility
    let yPos = -0.3; // Default height

    // Slight height difference between types
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
    // Fewer items with randomization
    const count = type === 'bubble' ?
                  (Math.floor(Math.random() * 3) + 4) : // Bubbles: 4-6
                  (Math.floor(Math.random() * 2) + 3);  // Coins: 3-4

    const amplitude = 0.6; // Increased wave amplitude
    const frequency = 0.6; // Higher frequency for more waves

    // Position at eye level for good visibility
    let yPos = -0.3; // Default height

    // Slight difference between types
    if (type === 'bubble') {
      yPos = -0.25; // Bubbles float higher
    }

    for (let i = 0; i < count; i++) {
      const xOffset = Math.sin(i * frequency) * amplitude;
      positions.push(new THREE.Vector3(lane * configSystem.getPlayerLaneWidth() + xOffset, yPos, startZ - i * 1.2)); // More spacing
    }
    return positions;
  }

  private clusterPattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    // Fewer items with randomization
    const count = type === 'bubble' ?
                  (Math.floor(Math.random() * 3) + 2) : // Bubbles: 2-4
                  (Math.floor(Math.random() * 2) + 1);  // Coins: 1-2

    const radius = 0.8; // Increased radius for better spread

    // Position at eye level for good visibility
    let yPos = -0.3; // Default height

    // Slight difference between types
    if (type === 'bubble') {
      yPos = -0.25; // Bubbles float higher
    }

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        positions.push(new THREE.Vector3(
            lane * configSystem.getPlayerLaneWidth() + Math.cos(angle) * radius,
            yPos + Math.sin(angle) * radius * 0.4, // Vertical spread
            startZ - Math.random() * 3.0 // More spread out in Z
        ));
    }
    return positions;
  }

  // A pattern that appears in all lanes for tutorial/visibility purposes
  private obviousPattern(lane: number, startZ: number, type: 'bubble' | 'coin'): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const laneWidth = configSystem.getPlayerLaneWidth();

    // Create collectibles in all three lanes with good spacing
    const spacing = 2.0; // More spacing for better visibility and gameplay
    const count = 5; // Reduced count for balance

    // Position at player eye level for guaranteed visibility
    const yPos = type === 'bubble' ? -0.1 : -0.2; // Slightly different heights

    // Put collectibles in all lanes at optimal heights with alternating pattern
    for (let i = 0; i < count; i++) {
      // Alternate which lane gets the collectible based on position
      if (i % 3 === 0) {
        // Center lane
        positions.push(new THREE.Vector3(0, yPos, startZ - i * spacing));
      } else if (i % 3 === 1) {
        // Left lane
        positions.push(new THREE.Vector3(-laneWidth, yPos, startZ - i * spacing));
      } else {
        // Right lane
        positions.push(new THREE.Vector3(laneWidth, yPos, startZ - i * spacing));
      }

      // For the first position, add to all lanes to create an obvious pattern
      if (i === 0) {
        positions.push(new THREE.Vector3(-laneWidth, yPos, startZ));
        positions.push(new THREE.Vector3(laneWidth, yPos, startZ));
      }
    }

    return positions;
  }

  public update(deltaTime: number, playerZ: number): void {
    this.spawnTimer -= deltaTime;

    // Spawn pattern when timer expires
    if (this.spawnTimer <= 0) {
      this.spawnPattern(playerZ);
      this.resetTimeToNextSpawn();
    }

    // Update animations (hovering, spinning for coins) and recycle
    const recycleZ = playerZ + 10; // Recycle if 10 units behind player
    let bubbleMatrixNeedsUpdate = false;
    let coinMatrixNeedsUpdate = false;

    // Get player position for magnet effect
    const playerPosition = this.playerController?.mesh?.position;

    [this.bubbleData, this.coinData].forEach((dataArray, typeIndex) => {
      const instancesMesh = typeIndex === 0 ? this.bubbleInstances : this.coinInstances;
      const hoverAmplitude = typeIndex === 0 ? 0.1 : 0.05; // Bubbles hover more
      const hoverSpeed = typeIndex === 0 ? 2 : 1.5;
      const spinSpeed = typeIndex === 0 ? 0 : 2; // Coins spin

      for (let i = 0; i < dataArray.length; i++) {
        const instance = dataArray[i];
        if (instance.isActive) {
          // Get current position
          const currentPos = new THREE.Vector3().setFromMatrixPosition(instance.matrix);

          // Recycle if too far behind player
          if (currentPos.z > recycleZ) {
            instance.isActive = false;
            instance.matrix.setPosition(0, -1000, 0); // Hide it
            if (typeIndex === 0) bubbleMatrixNeedsUpdate = true; else coinMatrixNeedsUpdate = true;
            continue;
          }

          // Decompose matrix for animation/movement
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          instance.matrix.decompose(position, quaternion, scale);

          // Magnet Logic: Move towards player if active and in range
          if (this.isMagnetActive && playerPosition) {
            const distanceToPlayer = position.distanceTo(playerPosition);
            if (distanceToPlayer < this.magnetAttractionRadius && distanceToPlayer > 0.1) { // Don't attract if too close
              // Calculate attraction direction
              const direction = new THREE.Vector3().subVectors(playerPosition, position).normalize();

              // Apply stronger movement for more obvious effect
              position.addScaledVector(direction, this.magnetAttractionSpeed * deltaTime);

              // Add visual effect to attracted collectibles - make them spin faster and pulse
              if (instance.type === 'coin') {
                // Make coins spin faster when attracted
                const spinFactor = 5; // 5x normal spin speed
                const spinRotation = new THREE.Quaternion().setFromAxisAngle(
                  new THREE.Vector3(0, 0, 1),
                  instance.hoverTime * spinFactor
                );
                const faceCamera = new THREE.Quaternion().setFromAxisAngle(
                  new THREE.Vector3(1, 0, 0),
                  Math.PI / 2
                );
                quaternion.copy(faceCamera).multiply(spinRotation);
              } else {
                // Make bubbles scale slightly when attracted
                const pulseScale = 1.0 + 0.2 * Math.sin(instance.hoverTime * 8);
                scale.set(pulseScale, pulseScale, pulseScale);
              }

              // Update the matrix with new position, rotation and scale
              instance.matrix.compose(position, quaternion, scale);
              if (typeIndex === 0) bubbleMatrixNeedsUpdate = true; else coinMatrixNeedsUpdate = true;
              continue; // Skip normal hover/spin animation
            }
          }

          // Normal Animation (Hovering, Spinning) if not being magnetically attracted
          instance.hoverTime += deltaTime * hoverSpeed;
          const hoverOffset = Math.sin(instance.hoverTime) * hoverAmplitude;
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

    const findAndDeactivate = (dataArray: CollectibleInstanceData[], instancesMesh: THREE.InstancedMesh, type: 'bubble' | 'coin') => {
        for (let i = 0; i < dataArray.length; i++) {
            const instance = dataArray[i];
            if (instance.id === instanceId && instance.isActive) {
                scoreValue = instance.scoreValue;

                // Deactivate the collectible
                instance.isActive = false;
                const hiddenMatrix = new THREE.Matrix4().setPosition(0, -1000, 0);
                instancesMesh.setMatrixAt(i, hiddenMatrix);
                instancesMesh.instanceMatrix.needsUpdate = true;

                return true; // Found and deactivated
            }
        }
        return false;
    };

    // Process collection silently (game UI will show score updates)
    findAndDeactivate(this.bubbleData, this.bubbleInstances, 'bubble') ||
    findAndDeactivate(this.coinData, this.coinInstances, 'coin');

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
    console.log("CollectibleManager: Resetting collectibles...");

    // Reset all instances to inactive
    [this.bubbleData, this.coinData].forEach((dataArray, typeIndex) => {
      const instancesMesh = typeIndex === 0 ? this.bubbleInstances : this.coinInstances;
      const typeName = typeIndex === 0 ? "bubble" : "coin";

      dataArray.forEach((instance, i) => {
        instance.isActive = false;
        instance.matrix.setPosition(0, -1000, 0); // Move off-screen
        instancesMesh.setMatrixAt(i, instance.matrix);
      });

      instancesMesh.instanceMatrix.needsUpdate = true;
    });

    // Reset magnet state
    this.setMagnetActive(false);

    // Force immediate spawn on reset
    this.spawnTimer = 0;
    console.log("CollectibleManager: Reset completed. Will spawn collectibles immediately.");

    // CRITICAL: Forced spawning of collectibles for immediate visibility
    setTimeout(() => {
      try {
        // Get player Z position
        const playerZ = window.__gameEngine?.playerController?.mesh?.position?.z || 0;

        // CRITICAL: Immediate spawn of multiple patterns for guaranteed visibility
        this.spawnPattern(playerZ - 5, true); // Very close obvious pattern
        this.spawnPattern(playerZ - 10, true); // Second pattern

        // Force both bubble and coin patterns with known types
        const forceBubble = () => {
          const originalRandom = Math.random;
          Math.random = () => 0.5; // This ensures bubble (< 0.8)
          this.spawnPattern(playerZ - 15, true);
          Math.random = originalRandom; // Restore random
        };

        const forceCoin = () => {
          const originalRandom = Math.random;
          Math.random = () => 0.9; // This ensures coin (>= 0.8)
          this.spawnPattern(playerZ - 20, true);
          Math.random = originalRandom; // Restore random
        };

        // Execute both forced patterns
        forceBubble();
        forceCoin();
      } catch (e) {
        console.error("CollectibleManager: Error during forced initial spawn:", e);
      }
    }, 300); // Reduced delay for faster appearance
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