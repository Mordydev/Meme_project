import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import { CollisionSystem, Collidable } from '../../core/CollisionSystem';
import eventBus from '../../core/EventSystem';

// Obstacle types
export type ObstacleType = 'shark' | 'jellyfish' | 'pufferfish' | 'clam' | 'rock';

// Obstacle definition
interface ObstacleDefinition {
  type: ObstacleType;
  speed: number;
  hitRadius: number;
  lanes: Array<'LEFT' | 'CENTER' | 'RIGHT'>;
  yOffset: number;
  rotationSpeed: number;
  scale: number;
  canExpand?: boolean; // For pufferfish
  colorOptions?: Array<number>; // For color variations
}

// Lane positions (must match Character.ts)
const LANE_POSITIONS = {
  LEFT: -2,
  CENTER: 0,
  RIGHT: 2
};

// Obstacle definitions
const OBSTACLE_DEFINITIONS: Record<ObstacleType, ObstacleDefinition> = {
  shark: {
    type: 'shark',
    speed: 0.5,
    hitRadius: 1.2,
    lanes: ['LEFT', 'CENTER', 'RIGHT'],
    yOffset: 0,
    rotationSpeed: 0.2,
    scale: 1.0,
    colorOptions: [0x7a7a7a, 0x93939f]
  },
  jellyfish: {
    type: 'jellyfish',
    speed: 0.3,
    hitRadius: 0.7,
    lanes: ['LEFT', 'CENTER', 'RIGHT'],
    yOffset: 1.0, // Jellyfish float higher in the water
    rotationSpeed: 0.1,
    scale: 0.7,
    colorOptions: [0xec99eb, 0xf064d8, 0xb4a7d6]
  },
  pufferfish: {
    type: 'pufferfish',
    speed: 0.2,
    hitRadius: 0.5,
    lanes: ['LEFT', 'CENTER', 'RIGHT'],
    yOffset: 0,
    rotationSpeed: 0.15,
    scale: 0.6,
    canExpand: true,
    colorOptions: [0xf9ce89, 0xfece00, 0xfdab3c]
  },
  clam: {
    type: 'clam',
    speed: 0, // Stationary
    hitRadius: 0.6,
    lanes: ['LEFT', 'CENTER', 'RIGHT'],
    yOffset: -1.5, // Clams sit on the ocean floor
    rotationSpeed: 0,
    scale: 0.8,
    colorOptions: [0xd8d3ca, 0xb1a599, 0xc2b9ae]
  },
  rock: {
    type: 'rock',
    speed: 0, // Stationary
    hitRadius: 0.8,
    lanes: ['LEFT', 'CENTER', 'RIGHT'],
    yOffset: -1.2, // Rocks sit on the ocean floor
    rotationSpeed: 0,
    scale: 1.0,
    colorOptions: [0x5c6c77, 0x2d3a43, 0x3a4a54]
  }
};

// Obstacle class
export class Obstacle implements Collidable {
  mesh: THREE.Group;
  collider: THREE.Sphere;
  type: string;
  isActive: boolean = true;
  definition: ObstacleDefinition;
  lane: 'LEFT' | 'CENTER' | 'RIGHT';
  isExpanded: boolean = false; // For pufferfish
  
  constructor(scene: THREE.Scene, definition: ObstacleDefinition, lane: 'LEFT' | 'CENTER' | 'RIGHT', zPosition: number) {
    this.definition = definition;
    this.type = definition.type;
    this.lane = lane;
    
    // Create mesh
    this.mesh = this.createObstacleMesh(definition);
    
    // Position based on lane
    const xPos = LANE_POSITIONS[lane];
    const yPos = definition.yOffset;
    this.mesh.position.set(xPos, yPos, zPosition);
    
    // Set up collider
    this.collider = new THREE.Sphere(
      new THREE.Vector3(xPos, yPos, zPosition),
      definition.hitRadius * definition.scale
    );
    
    // Add to scene
    scene.add(this.mesh);
    
    // Special setup for pufferfish
    if (definition.type === 'pufferfish' && definition.canExpand) {
      // Set up detection zone for expansion
      const detectionRadius = 5;
      const detectionSphere = new THREE.Sphere(
        new THREE.Vector3(xPos, yPos, zPosition),
        detectionRadius
      );
      
      // Listen for player proximity to trigger expansion
      eventBus.on('player-position', (position: THREE.Vector3) => {
        if (!this.isActive || this.isExpanded) return;
        
        // Check if player is within detection radius
        const distance = detectionSphere.center.distanceTo(position);
        if (distance < detectionRadius) {
          this.expand();
        }
      });
    }
  }
  
  // Update obstacle position and state
  update(deltaTime: number, playerSpeed: number) {
    if (!this.isActive) return;
    
    // Move obstacle toward player (moving backward relative to player)
    this.mesh.position.z += (this.definition.speed + playerSpeed) * deltaTime;
    
    // Update collider position
    this.collider.center.set(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z
    );
    
    // Rotate obstacle for animation effect
    if (this.definition.rotationSpeed > 0) {
      this.mesh.rotation.y += this.definition.rotationSpeed * deltaTime;
    }
    
    // Remove obstacle if it's too far behind the player
    if (this.mesh.position.z > 20) {
      this.isActive = false;
      eventBus.emit('obstacle-removed', { type: this.type, position: this.mesh.position.toArray() });
    }
  }
  
  // Create simple obstacle mesh (to be replaced with proper models)
  private createObstacleMesh(definition: ObstacleDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Choose a color variation
    const colorIndex = Math.floor(Math.random() * (definition.colorOptions?.length || 1));
    const color = definition.colorOptions?.[colorIndex] || 0xffffff;
    
    // Create mesh based on obstacle type
    switch (definition.type) {
      case 'shark':
        group.add(this.createSharkMesh(color));
        break;
      case 'jellyfish':
        group.add(this.createJellyfishMesh(color));
        break;
      case 'pufferfish':
        group.add(this.createPufferfishMesh(color));
        break;
      case 'clam':
        group.add(this.createClamMesh(color));
        break;
      case 'rock':
        group.add(this.createRockMesh(color));
        break;
    }
    
    // Apply scale
    group.scale.set(
      definition.scale,
      definition.scale,
      definition.scale
    );
    
    return group;
  }
  
  // Shark mesh
  private createSharkMesh(color: number): THREE.Mesh {
    // Simplified shark with elongated body
    const bodyGeometry = new THREE.ConeGeometry(0.5, 2.5, 8);
    bodyGeometry.rotateX(Math.PI / 2);
    
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Shark fin
    const finGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
    finGeometry.rotateZ(Math.PI / 2);
    const fin = new THREE.Mesh(finGeometry, bodyMaterial);
    fin.position.set(0, 0.5, 0);
    
    // Combine
    body.add(fin);
    
    return body;
  }
  
  // Jellyfish mesh
  private createJellyfishMesh(color: number): THREE.Mesh {
    // Dome for jellyfish body
    const domeGeometry = new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7
    });
    
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    
    // Tentacles (simplified as cylinders)
    const tentacleMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.6
    });
    
    // Add 8 tentacles around the dome
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tentacleGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 4);
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      
      tentacle.position.set(
        Math.sin(angle) * 0.3,
        -0.4,
        Math.cos(angle) * 0.3
      );
      
      // Rotate tentacle to hang down
      tentacle.rotation.x = Math.PI / 2;
      
      dome.add(tentacle);
    }
    
    return dome;
  }
  
  // Pufferfish mesh
  private createPufferfishMesh(color: number): THREE.Mesh {
    // Pufferfish body
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Spikes (simplified as cones)
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Add 12 spikes around the body
    for (let i = 0; i < 12; i++) {
      const phi = Math.acos(-1 + (2 * i) / 12);
      const theta = Math.sqrt(12 * Math.PI) * phi;
      
      const spikeGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      // Position spike on sphere surface
      spike.position.set(
        0.5 * Math.sin(phi) * Math.cos(theta),
        0.5 * Math.sin(phi) * Math.sin(theta),
        0.5 * Math.cos(phi)
      );
      
      // Orient spike outward from center
      spike.lookAt(0, 0, 0);
      spike.rotateX(Math.PI);
      
      body.add(spike);
    }
    
    return body;
  }
  
  // Clam mesh
  private createClamMesh(color: number): THREE.Mesh {
    // Clam shell
    const shellGeometry = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI);
    shellGeometry.scale(1, 0.5, 1);
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const bottomShell = new THREE.Mesh(shellGeometry, shellMaterial);
    
    // Top shell
    const topShellGeometry = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI);
    topShellGeometry.scale(1, 0.5, 1);
    topShellGeometry.rotateX(Math.PI);
    const topShell = new THREE.Mesh(topShellGeometry, shellMaterial);
    topShell.position.set(0, 0.1, 0);
    
    // Combine
    bottomShell.add(topShell);
    
    return bottomShell;
  }
  
  // Rock mesh
  private createRockMesh(color: number): THREE.Mesh {
    // Random rock geometry
    const vertices = 8;
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    
    // Add random noise to vertices for natural look
    const positionAttribute = rockGeometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      const noise = 0.2 * Math.random();
      positionAttribute.setXYZ(
        i,
        x * (1 + noise),
        y * (1 + noise),
        z * (1 + noise)
      );
    }
    
    rockGeometry.computeVertexNormals();
    
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.1
    });
    
    return new THREE.Mesh(rockGeometry, rockMaterial);
  }
  
  // Expand pufferfish
  expand() {
    if (this.definition.type !== 'pufferfish' || this.isExpanded) return;
    
    // Scale up the pufferfish
    this.mesh.scale.multiplyScalar(1.8);
    
    // Increase hit radius
    this.collider.radius *= 1.8;
    
    // Mark as expanded
    this.isExpanded = true;
    
    // Play expansion sound effect (to be implemented)
    eventBus.emit('sound-effect', { type: 'pufferfish-expand' });
  }
  
  // Clean up resources
  dispose() {
    this.isActive = false;
    
    // Remove from scene
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    // Dispose of geometries and materials
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
  }
}

// Obstacle manager class
export class ObstacleManager {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private collisionSystem: CollisionSystem;
  private obstacles: Obstacle[] = [];
  private spawnDistance: number = -30; // Distance ahead to spawn obstacles
  private minSpacing: number = 10; // Minimum spacing between obstacles
  private difficultyLevel: number = 1;
  
  constructor(scene: THREE.Scene, assetManager: AssetManager, collisionSystem: CollisionSystem) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.collisionSystem = collisionSystem;
    
    // Listen for obstacle removal
    eventBus.on('obstacle-removed', (data) => {
      this.removeObstacle(data);
    });
  }
  
  // Update obstacle manager
  update(deltaTime: number, playerZ: number, playerSpeed: number) {
    // Update all active obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.isActive) {
        obstacle.update(deltaTime, playerSpeed);
      }
    });
    
    // Remove inactive obstacles
    this.cleanupInactiveObstacles();
    
    // Generate new obstacles if needed
    this.generateObstacles(playerZ);
    
    // Update difficulty level based on player progress
    this.updateDifficulty(playerZ);
  }
  
  // Generate obstacles
  private generateObstacles(playerZ: number) {
    // Get the furthest obstacle z position
    let furthestZ = playerZ + this.spawnDistance;
    this.obstacles.forEach(obstacle => {
      if (obstacle.isActive && obstacle.mesh.position.z < furthestZ) {
        furthestZ = obstacle.mesh.position.z;
      }
    });
    
    // Add more obstacles if needed
    const targetZ = playerZ + this.spawnDistance;
    if (furthestZ > targetZ + this.minSpacing) {
      // Determine number of obstacles to spawn based on difficulty
      const obstacleCount = Math.min(5, Math.floor(this.difficultyLevel / 2) + 1);
      
      for (let i = 0; i < obstacleCount; i++) {
        const z = furthestZ - (i * this.minSpacing * (1 + Math.random() * 0.5));
        if (z > targetZ + 100) continue; // Don't spawn too far ahead
        
        this.spawnRandomObstacle(z);
      }
    }
  }
  
  // Spawn a random obstacle
  private spawnRandomObstacle(zPosition: number) {
    // Choose a random obstacle type based on difficulty
    const obstacleTypes: ObstacleType[] = ['rock', 'clam', 'jellyfish', 'pufferfish'];
    if (this.difficultyLevel >= 3) {
      obstacleTypes.push('shark');
    }
    
    const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as ObstacleType;
    const definition = OBSTACLE_DEFINITIONS[randomType];
    
    // Choose random lane(s) for the obstacle
    const availableLanes = [...definition.lanes];
    
    // Determine how many lanes to occupy (based on difficulty)
    let laneCount = 1;
    if (this.difficultyLevel >= 5 && Math.random() < 0.3) {
      laneCount = 2; // Sometimes spawn 2-lane obstacles at higher difficulties
    }
    
    // Ensure at least one lane is always open
    if (laneCount >= availableLanes.length) {
      laneCount = availableLanes.length - 1;
    }
    
    // Spawn obstacles in selected lanes
    for (let i = 0; i < laneCount; i++) {
      if (availableLanes.length === 0) break;
      
      // Choose a random lane
      const laneIndex = Math.floor(Math.random() * availableLanes.length);
      const lane = availableLanes[laneIndex];
      
      // Remove chosen lane to avoid duplicates
      availableLanes.splice(laneIndex, 1);
      
      // Create and add obstacle
      const obstacle = new Obstacle(this.scene, definition, lane, zPosition);
      this.obstacles.push(obstacle);
      
      // Add to collision system
      this.collisionSystem.addObstacle(obstacle);
    }
  }
  
  // Remove an obstacle
  private removeObstacle(data: any) {
    const obstacle = this.obstacles.find(o => 
      o.type === data.type && 
      o.mesh.position.x === data.position[0] &&
      o.mesh.position.y === data.position[1] && 
      o.mesh.position.z === data.position[2]
    );
    
    if (obstacle) {
      obstacle.isActive = false;
    }
  }
  
  // Clean up inactive obstacles
  private cleanupInactiveObstacles() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (!this.obstacles[i].isActive) {
        // Remove from collision system
        this.collisionSystem.removeObstacle(this.obstacles[i]);
        
        // Dispose of resources
        this.obstacles[i].dispose();
        
        // Remove from array
        this.obstacles.splice(i, 1);
      }
    }
  }
  
  // Update difficulty level based on player progress
  private updateDifficulty(playerZ: number) {
    // Increase difficulty every 500 units of distance
    this.difficultyLevel = 1 + Math.floor(Math.abs(playerZ) / 500);
    
    // Cap difficulty at level 10
    if (this.difficultyLevel > 10) {
      this.difficultyLevel = 10;
    }
  }
  
  // Clear all obstacles
  clear() {
    this.obstacles.forEach(obstacle => {
      obstacle.dispose();
    });
    this.obstacles = [];
  }
  
  // Clean up resources
  dispose() {
    this.clear();
    
    // Remove event listeners
    eventBus.off('obstacle-removed', this.removeObstacle);
  }
}