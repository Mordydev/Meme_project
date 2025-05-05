import * as THREE from 'three';
import { Collidable } from '../../core/CollisionSystem';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';

// Collectible types
export type CollectibleType = 'bubble' | 'powerup_shield' | 'powerup_magnet' | 'powerup_speed' | 'powerup_score' | 'powerup_time';

// Collectible definition
interface CollectibleDefinition {
  type: CollectibleType;
  value: number; // Score or power-up duration
  scale: number;
  color: number;
  emissive: number;
  opacity: number;
  rotationSpeed: number;
  hoverAmplitude: number;
  hoverSpeed: number;
  animateScale: boolean;
  spawnProbability: number; // Relative to other collectibles
}

// Lane positions (must match Character.ts)
const LANE_POSITIONS = {
  LEFT: -2,
  CENTER: 0,
  RIGHT: 2
};

// Collection patterns
enum PatternType {
  LINE,
  CURVE,
  ZIGZAG,
  CIRCLE,
  WAVE,
  SPIRAL,
  RANDOM
}

// Collectible definitions
const COLLECTIBLE_DEFINITIONS: Record<CollectibleType, CollectibleDefinition> = {
  bubble: {
    type: 'bubble',
    value: 10,
    scale: 0.3,
    color: 0xbfdfff,
    emissive: 0x3399ff,
    opacity: 0.7,
    rotationSpeed: 0.2,
    hoverAmplitude: 0.1,
    hoverSpeed: 1.0,
    animateScale: false,
    spawnProbability: 1.0
  },
  powerup_shield: {
    type: 'powerup_shield',
    value: 15, // Duration in seconds
    scale: 0.5,
    color: 0x00ffff,
    emissive: 0x00ffff,
    opacity: 0.8,
    rotationSpeed: 1.0,
    hoverAmplitude: 0.2,
    hoverSpeed: 0.8,
    animateScale: true,
    spawnProbability: 0.1
  },
  powerup_magnet: {
    type: 'powerup_magnet',
    value: 10, // Duration in seconds
    scale: 0.5,
    color: 0xff00ff,
    emissive: 0xff00ff,
    opacity: 0.8,
    rotationSpeed: 1.0,
    hoverAmplitude: 0.2,
    hoverSpeed: 0.8,
    animateScale: true,
    spawnProbability: 0.1
  },
  powerup_speed: {
    type: 'powerup_speed',
    value: 8, // Duration in seconds
    scale: 0.5,
    color: 0xff9900,
    emissive: 0xff6600,
    opacity: 0.8,
    rotationSpeed: 1.5,
    hoverAmplitude: 0.3,
    hoverSpeed: 1.2,
    animateScale: true,
    spawnProbability: 0.1
  },
  powerup_score: {
    type: 'powerup_score',
    value: 12, // Duration in seconds
    scale: 0.5,
    color: 0xffd700,
    emissive: 0xffd700,
    opacity: 0.8,
    rotationSpeed: 1.2,
    hoverAmplitude: 0.2,
    hoverSpeed: 1.0,
    animateScale: true,
    spawnProbability: 0.1
  },
  powerup_time: {
    type: 'powerup_time',
    value: 5, // Duration in seconds
    scale: 0.5,
    color: 0x00ff00,
    emissive: 0x00ff00,
    opacity: 0.8,
    rotationSpeed: 0.8,
    hoverAmplitude: 0.15,
    hoverSpeed: 0.7,
    animateScale: true,
    spawnProbability: 0.05
  }
};

// Collectible class
export class Collectible implements Collidable {
  mesh: THREE.Mesh;
  collider: THREE.Sphere;
  type: string;
  isActive: boolean = true;
  definition: CollectibleDefinition;
  originalY: number;
  creationTime: number;
  
  constructor(scene: THREE.Scene, definition: CollectibleDefinition, position: THREE.Vector3) {
    this.definition = definition;
    this.type = definition.type;
    this.originalY = position.y;
    this.creationTime = performance.now();
    
    // Create mesh
    this.mesh = this.createCollectibleMesh(definition);
    this.mesh.position.copy(position);
    
    // Set up collider
    this.collider = new THREE.Sphere(
      new THREE.Vector3(position.x, position.y, position.z),
      definition.scale * 0.9 // Slightly smaller than visual size
    );
    
    // Add to scene
    scene.add(this.mesh);
  }
  
  // Create collectible mesh
  private createCollectibleMesh(definition: CollectibleDefinition): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    
    if (definition.type === 'bubble') {
      // Bubbles are spheres
      geometry = new THREE.SphereGeometry(definition.scale, 16, 16);
    } else {
      // Power-ups are more complex shapes
      switch (definition.type) {
        case 'powerup_shield':
          // Shield is a torus
          geometry = new THREE.TorusGeometry(definition.scale * 0.7, definition.scale * 0.2, 16, 32);
          break;
        case 'powerup_magnet':
          // Magnet is a horseshoe shape (U shape)
          geometry = this.createMagnetGeometry(definition.scale);
          break;
        case 'powerup_speed':
          // Speed is an arrow shape
          geometry = this.createArrowGeometry(definition.scale);
          break;
        case 'powerup_score':
          // Score is a star shape
          geometry = this.createStarGeometry(definition.scale);
          break;
        case 'powerup_time':
          // Time is a clock/hourglass shape
          geometry = this.createHourglassGeometry(definition.scale);
          break;
        default:
          // Default is an octahedron
          geometry = new THREE.OctahedronGeometry(definition.scale, 0);
      }
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: definition.color,
      emissive: definition.emissive,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: definition.opacity
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  // Create magnet geometry
  private createMagnetGeometry(scale: number): THREE.BufferGeometry {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-scale, -scale, 0),
      new THREE.Vector3(-scale, scale, 0),
      new THREE.Vector3(0, scale * 1.2, 0),
      new THREE.Vector3(scale, scale, 0),
      new THREE.Vector3(scale, -scale, 0)
    ]);
    
    return new THREE.TubeGeometry(curve, 32, scale * 0.2, 12, false);
  }
  
  // Create arrow geometry
  private createArrowGeometry(scale: number): THREE.BufferGeometry {
    const arrowShape = new THREE.Shape();
    
    // Draw arrow shape
    arrowShape.moveTo(0, scale);
    arrowShape.lineTo(scale * 0.5, 0);
    arrowShape.lineTo(scale * 0.2, 0);
    arrowShape.lineTo(scale * 0.2, -scale);
    arrowShape.lineTo(-scale * 0.2, -scale);
    arrowShape.lineTo(-scale * 0.2, 0);
    arrowShape.lineTo(-scale * 0.5, 0);
    arrowShape.lineTo(0, scale);
    
    const extrudeSettings = {
      depth: scale * 0.2,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
  }
  
  // Create star geometry
  private createStarGeometry(scale: number): THREE.BufferGeometry {
    const starShape = new THREE.Shape();
    const innerRadius = scale * 0.4;
    const outerRadius = scale;
    const numPoints = 5;
    const angleStep = Math.PI / numPoints;
    
    // Draw star shape
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * angleStep;
      
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      
      if (i === 0) {
        starShape.moveTo(x, y);
      } else {
        starShape.lineTo(x, y);
      }
    }
    
    starShape.closePath();
    
    const extrudeSettings = {
      depth: scale * 0.2,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  }
  
  // Create hourglass geometry
  private createHourglassGeometry(scale: number): THREE.BufferGeometry {
    // For simplicity, using two cones attached at their tips
    const topCone = new THREE.ConeGeometry(scale * 0.7, scale, 16);
    topCone.translate(0, scale * 0.5, 0);
    
    const bottomCone = new THREE.ConeGeometry(scale * 0.7, scale, 16);
    bottomCone.rotateX(Math.PI);
    bottomCone.translate(0, -scale * 0.5, 0);
    
    // Merge geometries
    const hourglassGeometry = new THREE.BufferGeometry();
    
    // Get position data from both cones
    const topPositions = topCone.getAttribute('position').array;
    const bottomPositions = bottomCone.getAttribute('position').array;
    
    // Create merged positions array
    const positions = new Float32Array(topPositions.length + bottomPositions.length);
    positions.set(topPositions, 0);
    positions.set(bottomPositions, topPositions.length);
    
    hourglassGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create merged normals
    const topNormals = topCone.getAttribute('normal').array;
    const bottomNormals = bottomCone.getAttribute('normal').array;
    
    const normals = new Float32Array(topNormals.length + bottomNormals.length);
    normals.set(topNormals, 0);
    normals.set(bottomNormals, topNormals.length);
    
    hourglassGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    // Create merged uvs if needed
    if (topCone.getAttribute('uv')) {
      const topUvs = topCone.getAttribute('uv').array;
      const bottomUvs = bottomCone.getAttribute('uv').array;
      
      const uvs = new Float32Array(topUvs.length + bottomUvs.length);
      uvs.set(topUvs, 0);
      uvs.set(bottomUvs, topUvs.length);
      
      hourglassGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }
    
    // Create indices for faces
    const topIndices = topCone.getIndex().array;
    const bottomIndices = bottomCone.getIndex().array;
    
    const indices = new Uint16Array(topIndices.length + bottomIndices.length);
    indices.set(topIndices, 0);
    
    // Adjust indices for bottom cone to account for offset in vertices
    const topVertexCount = topPositions.length / 3;
    for (let i = 0; i < bottomIndices.length; i++) {
      indices[topIndices.length + i] = bottomIndices[i] + topVertexCount;
    }
    
    hourglassGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    // Compute vertex normals for smooth shading
    hourglassGeometry.computeVertexNormals();
    
    return hourglassGeometry;
  }
  
  // Update collectible animation
  update(deltaTime: number) {
    if (!this.isActive) return;
    
    const time = performance.now() * 0.001;
    const elapsedTime = (performance.now() - this.creationTime) * 0.001;
    
    // Rotate collectible
    this.mesh.rotation.y += this.definition.rotationSpeed * deltaTime;
    
    // Hover animation
    const hoverOffset = Math.sin(elapsedTime * this.definition.hoverSpeed) * this.definition.hoverAmplitude;
    this.mesh.position.y = this.originalY + hoverOffset;
    
    // Update collider position
    this.collider.center.copy(this.mesh.position);
    
    // Scale animation for power-ups
    if (this.definition.animateScale) {
      const scaleFactor = 1 + Math.sin(elapsedTime * 2) * 0.1;
      this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }
  
  // Clean up resources
  dispose() {
    this.isActive = false;
    
    // Remove from scene
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    // Dispose of geometries and materials
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }
    
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    } else if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(material => material.dispose());
    }
  }
}

// Collectible manager class
export class CollectibleManager {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private collectibles: Collectible[] = [];
  private minZ: number = -100; // Start generating beyond this distance
  private maxZ: number = 10;   // Stop generating before this point
  private patternInterval: number = 20; // Distance between pattern starts
  private lastPatternZ: number = 0;
  private difficultyLevel: number = 1;
  private activePowerUps: Set<CollectibleType> = new Set();
  
  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    
    // Listen for collectible collection
    eventBus.on('collect', (data) => {
      this.handleCollectibleCollected(data);
    });
  }
  
  // Update collectibles
  update(deltaTime: number, playerZ: number) {
    // Update existing collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i];
      
      if (collectible.isActive) {
        collectible.update(deltaTime);
        
        // Remove if too far behind
        if (collectible.mesh.position.z > playerZ + this.maxZ) {
          collectible.dispose();
          this.collectibles.splice(i, 1);
        }
      } else {
        // Clean up inactive collectibles
        this.collectibles.splice(i, 1);
      }
    }
    
    // Generate new collectibles if needed
    if (this.lastPatternZ > playerZ + this.minZ) {
      this.generateCollectiblePattern(playerZ);
    }
    
    // Update difficulty level
    this.updateDifficulty(playerZ);
  }
  
  // Generate a collectible pattern
  private generateCollectiblePattern(playerZ: number) {
    // Choose a random pattern type with weights adjusted for difficulty
    const patternTypes = [
      PatternType.LINE,
      PatternType.CURVE,
      PatternType.ZIGZAG,
      PatternType.CIRCLE,
      PatternType.WAVE,
      PatternType.SPIRAL,
      PatternType.RANDOM
    ];
    
    // For simplicity in a real implementation, we would weight these based on difficulty
    // For now, we'll just select randomly
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    
    // Choose a pattern z position
    const patternZ = playerZ + this.minZ - Math.random() * 20; // Some randomness
    this.lastPatternZ = patternZ - this.patternInterval;
    
    // Choose lane(s) for the pattern
    const lanes = ['LEFT', 'CENTER', 'RIGHT'];
    const lanePositions = [LANE_POSITIONS.LEFT, LANE_POSITIONS.CENTER, LANE_POSITIONS.RIGHT];
    
    // Generate collectible pattern
    switch (patternType) {
      case PatternType.LINE:
        this.generateLinePattern(patternZ);
        break;
      case PatternType.CURVE:
        this.generateCurvePattern(patternZ);
        break;
      case PatternType.ZIGZAG:
        this.generateZigzagPattern(patternZ);
        break;
      case PatternType.CIRCLE:
        this.generateCirclePattern(patternZ);
        break;
      case PatternType.WAVE:
        this.generateWavePattern(patternZ);
        break;
      case PatternType.SPIRAL:
        this.generateSpiralPattern(patternZ);
        break;
      case PatternType.RANDOM:
        this.generateRandomPattern(patternZ);
        break;
    }
    
    // Chance to spawn a power-up
    if (Math.random() < 0.1 * this.difficultyLevel) {
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const laneX = LANE_POSITIONS[lane as keyof typeof LANE_POSITIONS];
      const powerupZ = patternZ - 15; // Place power-up before pattern
      
      this.spawnPowerUp(laneX, 0, powerupZ);
    }
  }
  
  // Generate line pattern
  private generateLinePattern(startZ: number) {
    // Choose a lane
    const lanes = ['LEFT', 'CENTER', 'RIGHT'];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const x = LANE_POSITIONS[lane as keyof typeof LANE_POSITIONS];
    
    // Generate a line of 10-15 bubbles
    const count = 10 + Math.floor(Math.random() * 6);
    const spacing = 1.5;
    
    for (let i = 0; i < count; i++) {
      const z = startZ - i * spacing;
      const y = 0; // Standard height
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Generate curve pattern
  private generateCurvePattern(startZ: number) {
    // Choose start and end lanes
    const lanes = ['LEFT', 'CENTER', 'RIGHT'];
    const startLaneIndex = Math.floor(Math.random() * 3);
    let endLaneIndex = Math.floor(Math.random() * 3);
    
    // Make sure end lane is different
    while (endLaneIndex === startLaneIndex) {
      endLaneIndex = Math.floor(Math.random() * 3);
    }
    
    const startX = LANE_POSITIONS[lanes[startLaneIndex] as keyof typeof LANE_POSITIONS];
    const endX = LANE_POSITIONS[lanes[endLaneIndex] as keyof typeof LANE_POSITIONS];
    
    // Generate a curve of 15-20 bubbles
    const count = 15 + Math.floor(Math.random() * 6);
    const spacing = 1.5;
    
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const t = progress; // Linear interpolation
      
      // Cubic bezier curve from start to end lane
      const tSquared = t * t;
      const tCubed = tSquared * t;
      const a = -2 * tCubed + 3 * tSquared;
      
      const x = startX + (endX - startX) * a;
      const z = startZ - i * spacing;
      const y = Math.sin(progress * Math.PI) * 0.5; // Slight vertical curve
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Generate zigzag pattern
  private generateZigzagPattern(startZ: number) {
    // Generate a zigzag between left and right lanes
    const count = 15 + Math.floor(Math.random() * 6);
    const spacing = 1.5;
    
    for (let i = 0; i < count; i++) {
      const segment = Math.floor(i / 5); // Change direction every 5 collectibles
      const isEvenSegment = segment % 2 === 0;
      
      // Start position, alternating between left and right
      const startX = isEvenSegment ? LANE_POSITIONS.LEFT : LANE_POSITIONS.RIGHT;
      const endX = isEvenSegment ? LANE_POSITIONS.RIGHT : LANE_POSITIONS.LEFT;
      
      // Position within segment (0 to 1)
      const segmentProgress = (i % 5) / 4;
      
      // Linear interpolation within segment
      const x = startX + (endX - startX) * segmentProgress;
      const z = startZ - i * spacing;
      const y = 0; // Standard height
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Generate circle pattern
  private generateCirclePattern(startZ: number) {
    // Generate collectibles in a circle
    const count = 12 + Math.floor(Math.random() * 6); // 12-17 collectibles
    const radius = 2.0; // Match lane width
    const y = 0; // Standard height
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = startZ - Math.sin(angle) * radius;
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Generate wave pattern
  private generateWavePattern(startZ: number) {
    // Generate collectibles in a sine wave
    const count = 20 + Math.floor(Math.random() * 10); // 20-29 collectibles
    const spacing = 1.2;
    const amplitude = 2.0; // Match lane width
    const frequency = 0.1; // Controls wave tightness
    
    for (let i = 0; i < count; i++) {
      const z = startZ - i * spacing;
      const x = Math.sin(i * frequency * Math.PI) * amplitude;
      const y = 0; // Standard height
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Generate spiral pattern
  private generateSpiralPattern(startZ: number) {
    // Generate collectibles in a spiral pattern
    const count = 20 + Math.floor(Math.random() * 10); // 20-29 collectibles
    const spacing = 0.8;
    const maxRadius = 2.0; // Match lane width
    
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const angle = progress * Math.PI * 4; // 2 full rotations
      const radius = progress * maxRadius;
      
      const x = Math.cos(angle) * radius;
      const z = startZ - i * spacing - Math.sin(angle) * radius;
      const y = i * 0.1; // Gradually rise
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Generate random pattern
  private generateRandomPattern(startZ: number) {
    // Generate a random assortment of collectibles
    const count = 15 + Math.floor(Math.random() * 10); // 15-24 collectibles
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 6; // -3 to 3 range
      const y = (Math.random() - 0.5) * 2; // -1 to 1 range
      const z = startZ - Math.random() * 30; // Spread over 30 units
      
      this.spawnCollectible('bubble', x, y, z);
    }
  }
  
  // Spawn a single collectible
  private spawnCollectible(type: CollectibleType, x: number, y: number, z: number) {
    const definition = COLLECTIBLE_DEFINITIONS[type];
    const position = new THREE.Vector3(x, y, z);
    
    const collectible = new Collectible(this.scene, definition, position);
    this.collectibles.push(collectible);
    
    return collectible;
  }
  
  // Spawn a random power-up
  private spawnPowerUp(x: number, y: number, z: number) {
    // Get all power-up types
    const powerUpTypes: CollectibleType[] = [
      'powerup_shield',
      'powerup_magnet',
      'powerup_speed',
      'powerup_score',
      'powerup_time'
    ];
    
    // Calculate probability weights
    const weights = powerUpTypes.map(type => COLLECTIBLE_DEFINITIONS[type].spawnProbability);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    // Select a power-up based on weights
    const random = Math.random() * totalWeight;
    let sum = 0;
    let selectedType: CollectibleType = 'powerup_shield'; // Default
    
    for (let i = 0; i < powerUpTypes.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        selectedType = powerUpTypes[i];
        break;
      }
    }
    
    // Spawn the power-up
    return this.spawnCollectible(selectedType, x, y, z);
  }
  
  // Handle collectible collected event
  private handleCollectibleCollected(data: any) {
    const { type, position } = data;
    
    // Find the collectible
    const collectible = this.collectibles.find(c => 
      c.type === type && 
      c.mesh.position.x === position[0] && 
      c.mesh.position.y === position[1] && 
      c.mesh.position.z === position[2]
    );
    
    if (!collectible) return;
    
    // Mark as inactive
    collectible.isActive = false;
    
    // Handle power-up activation
    if (type.startsWith('powerup_')) {
      const powerupType = type as CollectibleType;
      this.activatePowerUp(powerupType, collectible.definition.value);
    }
    
    // Emit collection effect event
    eventBus.emit('collectible-effect', {
      type,
      position: collectible.mesh.position.toArray(),
      value: collectible.definition.value
    });
  }
  
  // Activate a power-up
  private activatePowerUp(type: CollectibleType, duration: number) {
    // Add to active power-ups
    this.activePowerUps.add(type);
    
    // Emit power-up activation event
    eventBus.emit('powerup-activated', {
      type,
      duration
    });
    
    // Schedule power-up deactivation
    setTimeout(() => {
      this.deactivatePowerUp(type);
    }, duration * 1000);
  }
  
  // Deactivate a power-up
  private deactivatePowerUp(type: CollectibleType) {
    // Remove from active power-ups
    this.activePowerUps.delete(type);
    
    // Emit power-up deactivation event
    eventBus.emit('powerup-deactivated', {
      type
    });
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
  
  // Get active power-ups
  getActivePowerUps(): CollectibleType[] {
    return Array.from(this.activePowerUps);
  }
  
  // Check if a specific power-up is active
  isPowerUpActive(type: CollectibleType): boolean {
    return this.activePowerUps.has(type);
  }
  
  // Clear all collectibles
  clear() {
    this.collectibles.forEach(collectible => {
      collectible.dispose();
    });
    
    this.collectibles = [];
    this.activePowerUps.clear();
  }
  
  // Clean up resources
  dispose() {
    this.clear();
    
    // Remove event listeners
    eventBus.off('collect', this.handleCollectibleCollected);
  }
}