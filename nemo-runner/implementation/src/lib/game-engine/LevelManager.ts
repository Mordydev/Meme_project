'use client';

import * as THREE from 'three';
import { Vector3 } from 'three';
import ProceduralGenerator, { CollectibleType, PowerUpType } from './ProceduralGenerator';
import ObstacleManager, { ObstacleType } from './ObstacleManager';
import { useDifficultyStore } from './DifficultyManager';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';

// Interface for collectibles
export interface Collectible {
  object: THREE.Object3D;
  position: Vector3;
  type: CollectibleType;
  value: number;
  collected: boolean;
  hitboxRadius: number;
}

// Interface for power-ups
export interface PowerUp {
  object: THREE.Object3D;
  position: Vector3;
  type: PowerUpType;
  collected: boolean;
  hitboxRadius: number;
}

export default class LevelManager {
  private proceduralGenerator: ProceduralGenerator;
  private obstacleManager: ObstacleManager;
  private scene: THREE.Object3D | null = null;
  
  // Collectibles management
  private collectibles: Collectible[] = [];
  private collectiblePools: Map<CollectibleType, THREE.Object3D[]> = new Map();
  private collectibleBatchSize = 20; // Pre-generate this many objects per type
  
  // Power-ups management
  private powerUps: PowerUp[] = [];
  private powerUpPools: Map<PowerUpType, THREE.Object3D[]> = new Map();
  private powerUpBatchSize = 5; // Pre-generate this many objects per type
  
  // Environment management
  private currentZone: EnvironmentZone = EnvironmentZone.CORAL_REEF;
  
  // Game state
  private playerPosition: Vector3 = new Vector3();
  private lastGeneratedDistance: number = 0;
  private readonly generationDistance: number = 50; // Distance ahead to generate
  private readonly cullDistance: number = 30; // Increased from 20 to 30
  
  // Optimization: Reusable objects
  private tempVector = new Vector3();
  private playerSphere = new THREE.Sphere();
  private tempSphere = new THREE.Sphere();
  private activeCollectibles: Collectible[] = [];
  private activePowerUps: PowerUp[] = [];
  
  // Optimization: Shared geometries and materials
  private collectibleGeometries: Map<CollectibleType, THREE.SphereGeometry> = new Map();
  private collectibleMaterials: Map<CollectibleType, THREE.Material> = new Map();
  private powerUpGeometries: Map<string, THREE.BufferGeometry> = new Map();
  private powerUpMaterials: Map<string, THREE.Material> = new Map();
  
  // Mesh counts for reporting
  private activeMeshCount = 0;
  private pooledMeshCount = 0;
  
  constructor(obstacleManager: ObstacleManager) {
    this.proceduralGenerator = new ProceduralGenerator();
    this.obstacleManager = obstacleManager;
    this.initSharedGeometries();
  }
  
  // Initialize shared geometries and materials
  private initSharedGeometries(): void {
    // Collectible geometries
    this.collectibleGeometries.set(
      CollectibleType.SMALL_BUBBLE, 
      new THREE.SphereGeometry(0.3, 16, 16)
    );
    this.collectibleGeometries.set(
      CollectibleType.MEDIUM_BUBBLE, 
      new THREE.SphereGeometry(0.5, 16, 16)
    );
    this.collectibleGeometries.set(
      CollectibleType.LARGE_BUBBLE, 
      new THREE.SphereGeometry(0.7, 16, 16)
    );
    this.collectibleGeometries.set(
      CollectibleType.GOLDEN_BUBBLE, 
      new THREE.SphereGeometry(0.6, 16, 16)
    );
    
    // Collectible materials
    this.collectibleMaterials.set(
      CollectibleType.SMALL_BUBBLE,
      new THREE.MeshStandardMaterial({
        color: '#5DADE2',
        transparent: true,
        opacity: 0.7,
        metalness: 0.3,
        roughness: 0.2
      })
    );
    this.collectibleMaterials.set(
      CollectibleType.MEDIUM_BUBBLE,
      new THREE.MeshStandardMaterial({
        color: '#3498DB',
        transparent: true,
        opacity: 0.7,
        metalness: 0.4,
        roughness: 0.2
      })
    );
    this.collectibleMaterials.set(
      CollectibleType.LARGE_BUBBLE,
      new THREE.MeshStandardMaterial({
        color: '#2E86C1',
        transparent: true,
        opacity: 0.7,
        metalness: 0.5,
        roughness: 0.2
      })
    );
    this.collectibleMaterials.set(
      CollectibleType.GOLDEN_BUBBLE,
      new THREE.MeshStandardMaterial({
        color: '#F1C40F',
        emissive: '#F39C12',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        metalness: 0.8,
        roughness: 0.1
      })
    );
    
    // Power-up shared geometries
    this.powerUpGeometries.set(
      'sphere',
      new THREE.SphereGeometry(0.7, 16, 16)
    );
    this.powerUpGeometries.set(
      'octahedron',
      new THREE.OctahedronGeometry(0.7, 0)
    );
    this.powerUpGeometries.set(
      'torus',
      new THREE.TorusGeometry(0.5, 0.2, 16, 16)
    );
    this.powerUpGeometries.set(
      'cylinder',
      new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16)
    );
    this.powerUpGeometries.set(
      'torusKnot',
      new THREE.TorusKnotGeometry(0.5, 0.2, 64, 8)
    );
    
    // Power-up glow geometry
    this.powerUpGeometries.set(
      'glow',
      new THREE.SphereGeometry(1.2, 16, 16)
    );
    
    // Power-up materials (only shared properties)
    const powerUpMaterialBase = {
      transparent: true,
      opacity: 0.9,
      metalness: 0.7,
      roughness: 0.3
    };
    
    // Shield material
    this.powerUpMaterials.set(
      'shield',
      new THREE.MeshStandardMaterial({
        ...powerUpMaterialBase,
        color: '#00FFFF',
        emissive: '#00CCCC',
        emissiveIntensity: 0.5
      })
    );
    
    // Speed boost material
    this.powerUpMaterials.set(
      'speedBoost',
      new THREE.MeshStandardMaterial({
        ...powerUpMaterialBase,
        color: '#FF5A5F',
        emissive: '#CC4A4F',
        emissiveIntensity: 0.5
      })
    );
    
    // Bubble magnet material
    this.powerUpMaterials.set(
      'bubbleMagnet',
      new THREE.MeshStandardMaterial({
        ...powerUpMaterialBase,
        color: '#FFD700',
        emissive: '#D4AF37',
        emissiveIntensity: 0.5
      })
    );
    
    // Time slow material
    this.powerUpMaterials.set(
      'timeSlow',
      new THREE.MeshStandardMaterial({
        ...powerUpMaterialBase,
        color: '#9C59B6',
        emissive: '#8E44AD',
        emissiveIntensity: 0.5
      })
    );
    
    // Score multiplier material
    this.powerUpMaterials.set(
      'scoreMultiplier',
      new THREE.MeshStandardMaterial({
        ...powerUpMaterialBase,
        color: '#3EC483',
        emissive: '#2ECC71',
        emissiveIntensity: 0.5
      })
    );
    
    // Glow material (shared)
    this.powerUpMaterials.set(
      'glow',
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      })
    );
  }
  
  setScene(scene: THREE.Object3D): void {
    this.scene = scene;
    this.obstacleManager.setScene(scene);
    
    // Pre-generate object pools
    this.initializeObjectPools();
  }
  
  private initializeObjectPools(): void {
    // Initialize collectible pools
    this.initializeCollectiblePools();
    
    // Initialize power-up pools
    this.initializePowerUpPools();
  }
  
  private initializeCollectiblePools(): void {
    // Initialize pool for each collectible type
    const types = [
      CollectibleType.SMALL_BUBBLE,
      CollectibleType.MEDIUM_BUBBLE,
      CollectibleType.LARGE_BUBBLE,
      CollectibleType.GOLDEN_BUBBLE
    ];
    
    for (const type of types) {
      // Create empty array if not exists
      if (!this.collectiblePools.has(type)) {
        this.collectiblePools.set(type, []);
      }
      
      // Pre-generate objects for the pool
      const poolArray = this.collectiblePools.get(type)!;
      
      // Fill the pool with initial objects
      for (let i = 0; i < this.collectibleBatchSize; i++) {
        poolArray.push(this.createCollectibleMesh(type));
      }
      
      this.pooledMeshCount += this.collectibleBatchSize;
    }
  }
  
  private initializePowerUpPools(): void {
    // Initialize pool for each power-up type
    const types = [
      PowerUpType.SHIELD,
      PowerUpType.SPEED_BOOST,
      PowerUpType.BUBBLE_MAGNET,
      PowerUpType.TIME_SLOW,
      PowerUpType.SCORE_MULTIPLIER
    ];
    
    for (const type of types) {
      // Create empty array if not exists
      if (!this.powerUpPools.has(type)) {
        this.powerUpPools.set(type, []);
      }
      
      // Pre-generate objects for the pool
      const poolArray = this.powerUpPools.get(type)!;
      
      // Fill the pool with initial objects
      for (let i = 0; i < this.powerUpBatchSize; i++) {
        poolArray.push(this.createPowerUpMesh(type));
      }
      
      this.pooledMeshCount += this.powerUpBatchSize;
    }
  }
  
  // Create collectible mesh for the given type with optimized reuse of geometries
  private createCollectibleMesh(type: CollectibleType): THREE.Object3D {
    const group = new THREE.Group();
    
    // Get shared geometry and material
    const geometry = this.collectibleGeometries.get(type)!;
    const material = this.collectibleMaterials.get(type)!;
    
    const bubble = new THREE.Mesh(geometry, material);
    group.add(bubble);
    
    // Add special effects for golden bubble
    if (type === CollectibleType.GOLDEN_BUBBLE) {
      const glowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: '#F39C12',
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
    }
    
    return group;
  }
  
  // Create power-up mesh for the given type with optimized reuse
  private createPowerUpMesh(type: PowerUpType): THREE.Object3D {
    const group = new THREE.Group();
    
    // Use shared geometries and materials based on type
    let mainGeometry, mainMaterial, mainMesh;
    
    switch (type) {
      case PowerUpType.SHIELD:
        mainGeometry = this.powerUpGeometries.get('sphere')!;
        mainMaterial = this.powerUpMaterials.get('shield')!;
        mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        
        // Add outer shield effect
        const shieldEffect = new THREE.Mesh(
          new THREE.SphereGeometry(1.0, 16, 16),
          new THREE.MeshBasicMaterial({
            color: '#00FFFF',
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
          })
        );
        group.add(shieldEffect);
        break;
        
      case PowerUpType.SPEED_BOOST:
        mainGeometry = this.powerUpGeometries.get('octahedron')!;
        mainMaterial = this.powerUpMaterials.get('speedBoost')!;
        mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        
        // Add streak effect
        const streak = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
          new THREE.MeshBasicMaterial({
            color: '#FF5A5F',
            transparent: true,
            opacity: 0.5
          })
        );
        streak.rotation.z = Math.PI / 3;
        group.add(streak);
        break;
        
      case PowerUpType.BUBBLE_MAGNET:
        mainGeometry = this.powerUpGeometries.get('torus')!;
        mainMaterial = this.powerUpMaterials.get('bubbleMagnet')!;
        mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        
        // Add magnet poles (reuse box geometry)
        const poleGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const poleMaterial = new THREE.MeshBasicMaterial({ color: '#FFD700' });
        
        const pole1 = new THREE.Mesh(poleGeometry, poleMaterial);
        pole1.position.y = 0.5;
        
        const pole2 = new THREE.Mesh(poleGeometry, poleMaterial);
        pole2.position.y = -0.5;
        
        group.add(pole1);
        group.add(pole2);
        break;
        
      case PowerUpType.TIME_SLOW:
        mainGeometry = this.powerUpGeometries.get('cylinder')!;
        mainMaterial = this.powerUpMaterials.get('timeSlow')!;
        mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        
        // Add clock hands (reuse box geometry)
        const handMaterial = new THREE.MeshBasicMaterial({ color: '#9C59B6' });
        
        const hand1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.5, 0.05),
          handMaterial
        );
        hand1.position.z = 0.15;
        hand1.position.y = 0.2;
        
        const hand2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.3, 0.05),
          handMaterial
        );
        hand2.position.z = 0.15;
        hand2.position.y = 0.1;
        hand2.rotation.z = Math.PI / 2;
        
        group.add(hand1);
        group.add(hand2);
        break;
        
      case PowerUpType.SCORE_MULTIPLIER:
        mainGeometry = this.powerUpGeometries.get('torusKnot')!;
        mainMaterial = this.powerUpMaterials.get('scoreMultiplier')!;
        mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
        
        // Add multiplier symbol
        const multiplierText = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5, 0.5),
          new THREE.MeshBasicMaterial({
            color: '#FFFFFF',
            transparent: true,
            opacity: 0.9
          })
        );
        multiplierText.position.z = 0.5;
        
        group.add(multiplierText);
        break;
    }
    
    group.add(mainMesh);
    
    // Add common glow effect with shared geometry
    const glowGeometry = this.powerUpGeometries.get('glow')!;
    const glowMaterial = this.powerUpMaterials.get('glow')!.clone();
    if ((glowMaterial as THREE.MeshStandardMaterial).color) {
      (glowMaterial as THREE.MeshStandardMaterial).color.set(this.getPowerUpColor(type));
    }
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    return group;
  }
  
  private getPowerUpColor(type: PowerUpType): string {
    switch (type) {
      case PowerUpType.SHIELD:
        return '#00FFFF';
      case PowerUpType.SPEED_BOOST:
        return '#FF5A5F';
      case PowerUpType.BUBBLE_MAGNET:
        return '#FFD700';
      case PowerUpType.TIME_SLOW:
        return '#9C59B6';
      case PowerUpType.SCORE_MULTIPLIER:
        return '#3EC483';
      default:
        return '#FFFFFF';
    }
  }
  
  private getCollectibleFromPool(type: CollectibleType): THREE.Object3D {
    if (!this.collectiblePools.has(type)) {
      this.collectiblePools.set(type, []);
    }
    
    const pool = this.collectiblePools.get(type)!;
    
    if (pool.length > 0) {
      this.pooledMeshCount--;
      return pool.pop()!;
    }
    
    // If pool is empty, create and add a batch of new objects
    for (let i = 0; i < this.collectibleBatchSize - 1; i++) {
      pool.push(this.createCollectibleMesh(type));
      this.pooledMeshCount++;
    }
    
    return this.createCollectibleMesh(type);
  }
  
  private getPowerUpFromPool(type: PowerUpType): THREE.Object3D {
    if (!this.powerUpPools.has(type)) {
      this.powerUpPools.set(type, []);
    }
    
    const pool = this.powerUpPools.get(type)!;
    
    if (pool.length > 0) {
      this.pooledMeshCount--;
      return pool.pop()!;
    }
    
    // If pool is empty, create and add a batch of new objects
    for (let i = 0; i < this.powerUpBatchSize - 1; i++) {
      pool.push(this.createPowerUpMesh(type));
      this.pooledMeshCount++;
    }
    
    return this.createPowerUpMesh(type);
  }
  
  private returnCollectibleToPool(collectible: Collectible): void {
    if (!this.scene) return;
    
    // Remove from scene
    this.scene.remove(collectible.object);
    
    // Reset object state
    collectible.object.visible = true;
    collectible.object.position.set(0, 0, 0);
    collectible.object.rotation.set(0, 0, 0);
    
    // Add to pool
    if (!this.collectiblePools.has(collectible.type)) {
      this.collectiblePools.set(collectible.type, []);
    }
    
    const pool = this.collectiblePools.get(collectible.type)!;
    pool.push(collectible.object);
    this.pooledMeshCount++;
  }
  
  private returnPowerUpToPool(powerUp: PowerUp): void {
    if (!this.scene) return;
    
    // Remove from scene
    this.scene.remove(powerUp.object);
    
    // Reset object state
    powerUp.object.visible = true;
    powerUp.object.position.set(0, 0, 0);
    powerUp.object.rotation.set(0, 0, 0);
    
    // Add to pool
    if (!this.powerUpPools.has(powerUp.type)) {
      this.powerUpPools.set(powerUp.type, []);
    }
    
    const pool = this.powerUpPools.get(powerUp.type)!;
    pool.push(powerUp.object);
    this.pooledMeshCount++;
  }
  
  private spawnCollectible(type: CollectibleType, position: Vector3, value: number): Collectible {
    if (!this.scene) return null!;
    
    const object = this.getCollectibleFromPool(type);
    
    // Position the collectible using tempVector to avoid new Vector3
    object.position.copy(position);
    
    // Add to scene
    this.scene.add(object);
    this.activeMeshCount++;
    
    // Get hitbox radius based on type
    let hitboxRadius = 0.3;
    switch (type) {
      case CollectibleType.SMALL_BUBBLE:
        hitboxRadius = 0.3;
        break;
      case CollectibleType.MEDIUM_BUBBLE:
        hitboxRadius = 0.5;
        break;
      case CollectibleType.LARGE_BUBBLE:
        hitboxRadius = 0.7;
        break;
      case CollectibleType.GOLDEN_BUBBLE:
        hitboxRadius = 0.6;
        break;
    }
    
    // Create collectible instance
    const collectible: Collectible = {
      object,
      position: object.position,
      type,
      value,
      collected: false,
      hitboxRadius
    };
    
    this.collectibles.push(collectible);
    
    return collectible;
  }
  
  private spawnPowerUp(type: PowerUpType, position: Vector3): PowerUp {
    if (!this.scene) return null!;
    
    const object = this.getPowerUpFromPool(type);
    
    // Position the power-up using existing position object
    object.position.copy(position);
    
    // Add to scene
    this.scene.add(object);
    this.activeMeshCount++;
    
    // Create power-up instance
    const powerUp: PowerUp = {
      object,
      position: object.position,
      type,
      collected: false,
      hitboxRadius: 1.0 // Standard hitbox size for all power-ups
    };
    
    this.powerUps.push(powerUp);
    
    return powerUp;
  }
  
  // Generate level elements based on player position - optimized
  generateLevel(distance: number, playerPosition: Vector3): void {
    if (!this.scene) return;
    
    this.playerPosition.copy(playerPosition);
    
    // Update environment zone in procedural generator
    this.proceduralGenerator.setEnvironmentZone(this.currentZone);
    
    // Update difficulty level in procedural generator
    this.proceduralGenerator.setDifficultyLevel(useDifficultyStore.getState().currentLevel);
    
    // Only generate new elements if player has moved a sufficient distance
    if (distance > this.lastGeneratedDistance + 5) {
      this.lastGeneratedDistance = distance;
      
      // Get elements to spawn in the active range
      const elements = this.proceduralGenerator.getElementsInRange(distance, this.generationDistance);
      
      // Spawn obstacles - use tempVector to avoid creating new vectors
      for (const obstacle of elements.obstacles) {
        // Transform position from procedural space to world space
        this.tempVector.set(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.position.z - distance
        );
        
        this.obstacleManager.spawnObstacle(obstacle.type, this.tempVector);
      }
      
      // Spawn collectibles - use tempVector to avoid creating new vectors
      for (const collectible of elements.collectibles) {
        // Transform position from procedural space to world space
        this.tempVector.set(
          collectible.position.x,
          collectible.position.y,
          collectible.position.z - distance
        );
        
        this.spawnCollectible(collectible.type, this.tempVector, collectible.value);
      }
      
      // Spawn power-ups - use tempVector to avoid creating new vectors
      for (const powerUp of elements.powerUps) {
        // Transform position from procedural space to world space
        this.tempVector.set(
          powerUp.position.x,
          powerUp.position.y,
          powerUp.position.z - distance
        );
        
        this.spawnPowerUp(powerUp.type, this.tempVector);
      }
    }
    
    // Update procedural generator
    this.proceduralGenerator.update(distance);
  }
  
  update(deltaTime: number, distance: number, playerPosition: Vector3): void {
    if (!this.scene) return;
    
    // Update environment zone from the store
    this.currentZone = useEnvironmentStore.getState().currentZone;
    
    // Generate level elements
    this.generateLevel(distance, playerPosition);
    
    // Update obstacles
    this.obstacleManager.update(deltaTime, playerPosition, distance);
    
    // Optimization: Only process visible collectibles
    this.updateVisibleCollectibles(deltaTime, playerPosition);
    
    // Optimization: Only process visible power-ups
    this.updateVisiblePowerUps(deltaTime, playerPosition);
    
    // Remove collected or far away items
    this.cullObjects(playerPosition);
  }
  
  private updateVisibleCollectibles(deltaTime: number, playerPosition: Vector3): void {
    // Clear the active collectibles array
    this.activeCollectibles.length = 0;
    
    // Filter for only nearby collectibles (within 50 units of player)
    const cullRadiusSq = 50 * 50;
    
    for (const collectible of this.collectibles) {
      if (collectible.collected) continue;
      
      // Compute squared distance to player
      const dx = collectible.object.position.x - playerPosition.x;
      const dy = collectible.object.position.y - playerPosition.y;
      const dz = collectible.object.position.z - playerPosition.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      
      // Skip if too far
      if (distSq > cullRadiusSq) continue;
      
      // Add to active array
      this.activeCollectibles.push(collectible);
      
      // Animate active collectibles
      // Subtle floating motion
      const time = performance.now() * 0.001;
      collectible.object.position.y += Math.sin(time * 2 + collectible.object.position.x) * 0.01 * deltaTime;
      
      // Gentle rotation
      collectible.object.rotation.y += deltaTime * 0.5;
      
      // No need to update position reference as it's already a reference to object.position
    }
  }
  
  private updateVisiblePowerUps(deltaTime: number, playerPosition: Vector3): void {
    // Clear the active power-ups array
    this.activePowerUps.length = 0;
    
    // Filter for only nearby power-ups (within 50 units of player)
    const cullRadiusSq = 50 * 50;
    
    for (const powerUp of this.powerUps) {
      if (powerUp.collected) continue;
      
      // Compute squared distance to player
      const dx = powerUp.object.position.x - playerPosition.x;
      const dy = powerUp.object.position.y - playerPosition.y;
      const dz = powerUp.object.position.z - playerPosition.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      
      // Skip if too far
      if (distSq > cullRadiusSq) continue;
      
      // Add to active array
      this.activePowerUps.push(powerUp);
      
      // Animate active power-ups
      // Floating motion
      const time = performance.now() * 0.001;
      powerUp.object.position.y += Math.sin(time * 1.5 + powerUp.object.position.x) * 0.02 * deltaTime;
      
      // Rotation
      powerUp.object.rotation.y += deltaTime * 1.0;
      powerUp.object.rotation.x = Math.sin(time * 0.5) * 0.2;
      
      // No need to update position reference as it's already a reference to object.position
    }
  }
  
  private cullObjects(playerPosition: Vector3): void {
    // Optimized culling with single pass - unroll loops for better performance
    
    // Cull collectibles from back of array to avoid shifting indices
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i];
      
      // Immediately remove if collected
      if (collectible.collected) {
        this.returnCollectibleToPool(collectible);
        this.collectibles.splice(i, 1);
        this.activeMeshCount--;
        continue;
      }
      
      // Check distance more efficiently
      const dz = collectible.object.position.z - playerPosition.z;
      
      // If too far behind player
      if (dz > this.cullDistance) {
        this.returnCollectibleToPool(collectible);
        this.collectibles.splice(i, 1);
        this.activeMeshCount--;
      }
    }
    
    // Cull power-ups from back of array to avoid shifting indices
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      
      // Immediately remove if collected
      if (powerUp.collected) {
        this.returnPowerUpToPool(powerUp);
        this.powerUps.splice(i, 1);
        this.activeMeshCount--;
        continue;
      }
      
      // Check distance more efficiently
      const dz = powerUp.object.position.z - playerPosition.z;
      
      // If too far behind player
      if (dz > this.cullDistance) {
        this.returnPowerUpToPool(powerUp);
        this.powerUps.splice(i, 1);
        this.activeMeshCount--;
      }
    }
  }
  
  checkCollectibleCollisions(playerPosition: Vector3, playerRadius: number): Collectible | null {
    // Optimization: Use pre-allocated sphere for the player
    this.playerSphere.center.copy(playerPosition);
    this.playerSphere.radius = playerRadius;
    
    // Check only active collectibles (nearby ones we're animating)
    for (const collectible of this.activeCollectibles) {
      if (collectible.collected) continue;
      
      // Check for collision with collectible using spheres
      this.tempSphere.center.copy(collectible.position);
      this.tempSphere.radius = collectible.hitboxRadius;
      
      if (this.playerSphere.intersectsSphere(this.tempSphere)) {
        // Mark as collected
        collectible.collected = true;
        return collectible;
      }
    }
    
    return null;
  }
  
  checkPowerUpCollisions(playerPosition: Vector3, playerRadius: number): PowerUp | null {
    // Optimization: Use pre-allocated sphere for the player
    this.playerSphere.center.copy(playerPosition);
    this.playerSphere.radius = playerRadius;
    
    // Check only active power-ups (nearby ones we're animating)
    for (const powerUp of this.activePowerUps) {
      if (powerUp.collected) continue;
      
      // Check for collision with power-up using spheres
      this.tempSphere.center.copy(powerUp.position);
      this.tempSphere.radius = powerUp.hitboxRadius;
      
      if (this.playerSphere.intersectsSphere(this.tempSphere)) {
        // Mark as collected
        powerUp.collected = true;
        return powerUp;
      }
    }
    
    return null;
  }
  
  reset(): void {
    // Clear all level elements
    this.clearAllObjects();
    
    // Reset generator
    this.proceduralGenerator.reset();
    
    // Reset obstacle manager
    this.obstacleManager.reset();
    
    // Reset state
    this.lastGeneratedDistance = 0;
    this.currentZone = EnvironmentZone.CORAL_REEF;
    this.activeMeshCount = 0;
    
    // Clear active arrays
    this.activeCollectibles.length = 0;
    this.activePowerUps.length = 0;
  }
  
  private clearAllObjects(): void {
    // Return all collectibles to pool
    for (const collectible of this.collectibles) {
      this.returnCollectibleToPool(collectible);
    }
    this.collectibles = [];
    
    // Return all power-ups to pool
    for (const powerUp of this.powerUps) {
      this.returnPowerUpToPool(powerUp);
    }
    this.powerUps = [];
    
    this.activeMeshCount = 0;
  }
  
  // Get memory usage statistics
  getMemoryStats(): { active: number, pooled: number } {
    return {
      active: this.activeMeshCount,
      pooled: this.pooledMeshCount
    };
  }
  
  // Clean up resources
  dispose(): void {
    // Clear all active objects
    this.clearAllObjects();
    
    // Clear object pools and release references
    this.collectiblePools.clear();
    this.powerUpPools.clear();
    
    // Dispose of shared geometries
    for (const geometry of this.collectibleGeometries.values()) {
      geometry.dispose();
    }
    this.collectibleGeometries.clear();
    
    for (const geometry of this.powerUpGeometries.values()) {
      geometry.dispose();
    }
    this.powerUpGeometries.clear();
    
    // Dispose of shared materials
    for (const material of this.collectibleMaterials.values()) {
      material.dispose();
    }
    this.collectibleMaterials.clear();
    
    for (const material of this.powerUpMaterials.values()) {
      material.dispose();
    }
    this.powerUpMaterials.clear();
    
    // Reset counters
    this.activeMeshCount = 0;
    this.pooledMeshCount = 0;
    
    // Clean up procedural generator
    this.proceduralGenerator.dispose();
  }
}