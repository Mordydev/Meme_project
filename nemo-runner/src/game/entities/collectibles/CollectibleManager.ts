import * as THREE from 'three';
import eventBus from '../../core/EventSystem';
import { AssetManager } from '../../core/AssetManager';
import { DeviceCapabilities } from '../../utils/DeviceUtils';

export enum CollectibleType {
  BUBBLE = 'bubble',
  POWERUP_SHIELD = 'powerup_shield',
  POWERUP_MAGNET = 'powerup_magnet',
  POWERUP_SPEED = 'powerup_speed',
  POWERUP_SCORE = 'powerup_score',
  POWERUP_TIME = 'powerup_time'
}

export enum PatternType {
  LINE,
  CURVE,
  ZIGZAG,
  CIRCLE,
  WAVE,
  SPIRAL,
  RANDOM
}

interface Collectible {
  mesh: THREE.Mesh | THREE.InstancedMesh;
  type: CollectibleType;
  active: boolean;
  value: number;
  position: THREE.Vector3;
  collider: THREE.Sphere;
  instanceId?: number; // For instanced mesh implementation
}

interface PowerUpConfig {
  duration: number; // Duration in seconds
  color: THREE.Color;
  value: number;
}

interface PowerUpEffect {
  type: CollectibleType;
  startTime: number;
  duration: number;
  active: boolean;
}

export class CollectibleManager {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private deviceCapabilities: DeviceCapabilities;
  
  private collectibles: Collectible[] = [];
  private activeEffects: PowerUpEffect[] = [];
  private effectCallbacks: Map<CollectibleType, () => void> = new Map();
  
  private collectiblePoolSize = 100;
  private bubbleInstancedMesh: THREE.InstancedMesh | null = null;
  private powerupMeshes: Map<CollectibleType, THREE.Mesh> = new Map();
  
  // Attraction system for magnet power-up
  private isAttractionEnabled = false;
  private magneticPullTarget: THREE.Vector3 | null = null;
  
  private bubbleMaterial: THREE.ShaderMaterial | null = null;
  private powerupMaterials: Map<CollectibleType, THREE.ShaderMaterial> = new Map();
  
  private visibilityAttribute: THREE.InstancedBufferAttribute | null = null;
  private offsetAttribute: THREE.InstancedBufferAttribute | null = null;
  private bubbleGeometry: THREE.IcosahedronGeometry | null = null;
  
  private currentTime = 0;
  private readonly BUBBLE_SIZE = 0.2;
  private readonly POWERUP_SIZE = 0.5;
  private readonly LANE_WIDTH = 2.0;
  private readonly SPAWN_DISTANCE = 100;
  private readonly DESPAWN_DISTANCE = -10;
  
  private powerUpConfigs: Map<CollectibleType, PowerUpConfig> = new Map();
  
  constructor(
    scene: THREE.Scene,
    assetManager: AssetManager,
    deviceCapabilities: DeviceCapabilities
  ) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.deviceCapabilities = deviceCapabilities;
    
    this.initPowerUpConfigs();
    this.initCollectibleSystem();
    this.initEventListeners();
  }
  
  private initPowerUpConfigs() {
    this.powerUpConfigs.set(CollectibleType.POWERUP_SHIELD, {
      duration: 15,
      color: new THREE.Color(0x00BFFF),
      value: 50
    });
    
    this.powerUpConfigs.set(CollectibleType.POWERUP_MAGNET, {
      duration: 10,
      color: new THREE.Color(0xFF4500),
      value: 50
    });
    
    this.powerUpConfigs.set(CollectibleType.POWERUP_SPEED, {
      duration: 8,
      color: new THREE.Color(0xFFD700),
      value: 50
    });
    
    this.powerUpConfigs.set(CollectibleType.POWERUP_SCORE, {
      duration: 12,
      color: new THREE.Color(0xDA70D6),
      value: 50
    });
    
    this.powerUpConfigs.set(CollectibleType.POWERUP_TIME, {
      duration: 5,
      color: new THREE.Color(0xAFEEEE),
      value: 50
    });
  }
  
  private initCollectibleSystem() {
    this.createBubbleSystem();
    this.createPowerUpMeshes();
  }
  
  private createBubbleSystem() {
    // Create bubble geometry
    this.bubbleGeometry = new THREE.IcosahedronGeometry(this.BUBBLE_SIZE, 1);
    
    // Create bubble material with custom shader
    this.bubbleMaterial = this.createBubbleMaterial();
    
    // Create instanced mesh for bubbles
    this.bubbleInstancedMesh = new THREE.InstancedMesh(
      this.bubbleGeometry,
      this.bubbleMaterial,
      this.collectiblePoolSize
    );
    
    this.bubbleInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.bubbleInstancedMesh);
    
    // Create instance attributes for visibility and animation offsets
    const visibilityArray = new Float32Array(this.collectiblePoolSize);
    const offsetArray = new Float32Array(this.collectiblePoolSize);
    
    for (let i = 0; i < this.collectiblePoolSize; i++) {
      visibilityArray[i] = 0.0; // Initially all invisible
      offsetArray[i] = Math.random() * 10.0; // Random animation offset
      
      // Create collectible objects for tracking
      this.collectibles.push({
        mesh: this.bubbleInstancedMesh,
        type: CollectibleType.BUBBLE,
        active: false,
        value: 10, // Default bubble value
        position: new THREE.Vector3(0, 0, 0),
        collider: new THREE.Sphere(new THREE.Vector3(0, 0, 0), this.BUBBLE_SIZE),
        instanceId: i
      });
    }
    
    // Add instance attributes to geometry
    this.visibilityAttribute = new THREE.InstancedBufferAttribute(visibilityArray, 1);
    this.offsetAttribute = new THREE.InstancedBufferAttribute(offsetArray, 1);
    this.bubbleGeometry.setAttribute('aVisible', this.visibilityAttribute);
    this.bubbleGeometry.setAttribute('aOffset', this.offsetAttribute);
    
    // Configure instance matrix
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.collectiblePoolSize; i++) {
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      this.bubbleInstancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.bubbleInstancedMesh.instanceMatrix.needsUpdate = true;
  }
  
  private createBubbleMaterial(): THREE.ShaderMaterial {
    const vertexShader = `
      attribute float aVisible;   // Instance attribute: 1.0 visible, 0.0 hidden
      attribute float aOffset;    // Instance attribute: Random offset for animations

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vFresnelFactor;
      varying float vVisibility;  // Pass visibility to fragment shader

      uniform float uTime;
      uniform float uWobbleFrequency;
      uniform float uWobbleAmplitude;

      void main() {
          vVisibility = aVisible; // Pass visibility flag
          if (vVisibility < 0.5) { // If hidden, collapse the vertex
               gl_Position = vec4(0.0, 0.0, 0.0, 1.0); 
               return; // Early exit for hidden bubbles
          }

          vec3 pos = position;

          // Vertex Wobble Animation
          float timeOffset = uTime * uWobbleFrequency + aOffset * 10.0;
          float wobbleX = sin(timeOffset + pos.y * 2.0) * uWobbleAmplitude;
          float wobbleY = cos(timeOffset * 0.8 + pos.x * 1.5) * uWobbleAmplitude * 0.5; 
          pos.x += wobbleX;
          pos.y += wobbleY;

          // Standard calculations
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          vec3 transformedNormal = normalMatrix * normal;
          vNormal = normalize(transformedNormal);

          // Fresnel calculation
          vec3 viewVector = normalize(mvPosition.xyz); 
          vFresnelFactor = pow(1.0 + dot(viewVector, transformedNormal), 3.0);

          gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vFresnelFactor;
      varying float vVisibility;

      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform float uOpacity;

      // Simple Specular Highlight Calculation
      float calculateSpecular(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess) {
          vec3 halfwayDir = normalize(lightDir + viewDir);
          float specAngle = max(dot(normal, halfwayDir), 0.0);
          return pow(specAngle, shininess);
      }

      void main() {
           if (vVisibility < 0.5) discard; // Discard fragment if bubble is hidden

          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel Effect for Edges
          float fresnel = smoothstep(0.0, 1.0, vFresnelFactor) * 0.8 + 0.2;

          // Simulated Specular Highlight
          vec3 lightDirection = normalize(vec3(0.8, 0.8, 0.5));
          float specular = calculateSpecular(normal, viewDir, lightDirection, 20.0);
          vec3 specularColor = vec3(1.0) * specular * fresnel * 1.5;

          // Base Color & Final Combination
          vec3 base = uBaseColor * 0.5;
          vec3 finalColor = base + specularColor * 0.8;

          // Opacity
          float finalOpacity = uOpacity * fresnel;

          gl_FragColor = vec4(finalColor, finalOpacity);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uBaseColor: { value: new THREE.Color(0xADD8E6) }, // Light blue tint
        uOpacity: { value: 0.6 },
        uWobbleFrequency: { value: 2.0 },
        uWobbleAmplitude: { value: 0.05 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
  }
  
  private createPowerUpMeshes() {
    // Common powerup shader
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vFresnelFactor;
      varying vec2 vUv;

      uniform float uTime;
      uniform float uBobFrequency;
      uniform float uBobAmplitude;

      void main() {
          vUv = uv;
          vec3 pos = position;

          // Simple Bobbing Animation
          pos.y += sin(uTime * uBobFrequency + position.x * 0.5) * uBobAmplitude;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          vec3 transformedNormal = normalize(normalMatrix * normal);
          vNormal = transformedNormal;

          // Fresnel Calculation
          vec3 viewVector = normalize(mvPosition.xyz); 
          vFresnelFactor = pow(1.0 + dot(viewVector, transformedNormal), 2.0);

          gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vFresnelFactor;
      varying vec2 vUv;

      uniform float uTime;
      uniform vec3 uGlowColor;
      uniform float uPulseFrequency;
      uniform float uPulseIntensity;
      uniform float uBaseIntensity;
      uniform float uFresnelIntensity;

      float hashFS(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      
      float noiseFS(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f*f*(3.0-2.0*f); 
        float a = hashFS(i+vec2(0.,0.));
        float b = hashFS(i+vec2(1.,0.));
        float c = hashFS(i+vec2(0.,1.));
        float d = hashFS(i+vec2(1.,1.));
        return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
      }

      void main() {
          // Pulsating Glow
          float pulse = sin(uTime * uPulseFrequency) * 0.5 + 0.5;
          float glow = uBaseIntensity + pulse * uPulseIntensity;

          // Fresnel Edge Glow
          float fresnel = smoothstep(0.0, 1.0, vFresnelFactor) * uFresnelIntensity;

          // Subtle Noise/Texture
          float energyNoise = noiseFS(vUv * 3.0 + vec2(0.0, uTime * 0.5));
          vec3 noiseColor = uGlowColor * (1.0 + energyNoise * 0.1);

          // Combine
          vec3 finalColor = noiseColor * glow * (1.0 + fresnel);

          // Opacity
          float finalOpacity = 0.8 + fresnel * 0.2;

          gl_FragColor = vec4(finalColor, finalOpacity);
      }
    `;
    
    // Create power-ups for each type
    this.powerUpConfigs.forEach((config, type) => {
      if (type !== CollectibleType.BUBBLE) {
        // Create material
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0.0 },
            uGlowColor: { value: config.color },
            uPulseFrequency: { value: 2.5 },
            uPulseIntensity: { value: 0.5 },
            uBaseIntensity: { value: 0.6 },
            uFresnelIntensity: { value: 0.5 },
            uBobFrequency: { value: 1.5 + Math.random() * 0.4 },
            uBobAmplitude: { value: 0.08 + Math.random() * 0.04 }
          },
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        
        // Create geometry based on power-up type
        let geometry: THREE.BufferGeometry;
        
        switch (type) {
          case CollectibleType.POWERUP_SPEED:
            // Chevron/Arrow shape (simplify for game)
            geometry = new THREE.IcosahedronGeometry(this.POWERUP_SIZE, 1);
            break;
          case CollectibleType.POWERUP_MAGNET:
            // Horseshoe shape (simplify for game)
            geometry = new THREE.IcosahedronGeometry(this.POWERUP_SIZE, 1);
            break;
          case CollectibleType.POWERUP_SCORE:
            // Diamond/gem shape
            geometry = new THREE.OctahedronGeometry(this.POWERUP_SIZE, 0);
            break;
          case CollectibleType.POWERUP_TIME:
            // Clock face (simplify to cylinder)
            geometry = new THREE.CylinderGeometry(this.POWERUP_SIZE, this.POWERUP_SIZE, 0.15, 16);
            break;
          case CollectibleType.POWERUP_SHIELD:
          default:
            // Bubble shield
            geometry = new THREE.IcosahedronGeometry(this.POWERUP_SIZE, 2);
            break;
        }
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false; // Initially hidden
        this.scene.add(mesh);
        
        // Store material and mesh
        this.powerupMaterials.set(type, material);
        this.powerupMeshes.set(type, mesh);
      }
    });
  }
  
  private initEventListeners() {
    // Listen for collision events (implemented in CollisionSystem)
    eventBus.on('collision:collectible', (data: { collectible: Collectible }) => {
      this.collectCollectible(data.collectible);
    });
  }
  
  /**
   * Update all collectibles
   * @param deltaTime Time since last frame in seconds
   * @param playerSpeed Current player speed
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, playerSpeed: number): void {
    this.currentTime += deltaTime;
    
    // Update bubble shader uniforms
    if (this.bubbleMaterial) {
      this.bubbleMaterial.uniforms.uTime.value = this.currentTime;
    }
    
    // Update power-up shader uniforms
    this.powerupMaterials.forEach((material) => {
      material.uniforms.uTime.value = this.currentTime;
    });
    
    // Update active collectibles positions
    const dummy = new THREE.Object3D();
    let bubbleUpdateNeeded = false;
    
    this.collectibles.forEach((collectible) => {
      if (collectible.active) {
        // Move collectible based on player speed
        collectible.position.z -= playerSpeed * deltaTime;
        
        // Update collider position
        collectible.collider.center.copy(collectible.position);
        
        // Check if out of bounds
        if (collectible.position.z < this.DESPAWN_DISTANCE) {
          this.deactivateCollectible(collectible);
        } else {
          // Update mesh position
          if (collectible.type === CollectibleType.BUBBLE) {
            if (collectible.instanceId !== undefined) {
              dummy.position.copy(collectible.position);
              dummy.updateMatrix();
              if (this.bubbleInstancedMesh) {
                this.bubbleInstancedMesh.setMatrixAt(collectible.instanceId, dummy.matrix);
                bubbleUpdateNeeded = true;
              }
            }
          } else {
            const mesh = this.powerupMeshes.get(collectible.type);
            if (mesh) {
              mesh.position.copy(collectible.position);
            }
          }
          
          // Check for magnet effect
          if (this.isPowerUpActive(CollectibleType.POWERUP_MAGNET)) {
            const distanceToPlayer = collectible.position.distanceTo(playerPosition);
            if (distanceToPlayer < 5.0) { // Magnet effect radius
              const direction = new THREE.Vector3().subVectors(playerPosition, collectible.position);
              direction.normalize();
              
              // Move towards player faster when closer
              const magnetStrength = THREE.MathUtils.mapLinear(
                distanceToPlayer, 
                0, 5.0, 
                5.0, 1.0
              );
              
              collectible.position.add(direction.multiplyScalar(magnetStrength * deltaTime));
            }
          }
        }
      }
    });
    
    // Update instance matrix if needed
    if (bubbleUpdateNeeded && this.bubbleInstancedMesh) {
      this.bubbleInstancedMesh.instanceMatrix.needsUpdate = true;
    }
    
    // Update active power-up effects
    this.updatePowerUpEffects(deltaTime);
  }
  
  private updatePowerUpEffects(deltaTime: number): void {
    const expiredEffects: PowerUpEffect[] = [];
    
    this.activeEffects.forEach((effect) => {
      if (effect.active) {
        // Check if effect has expired
        if (this.currentTime - effect.startTime >= effect.duration) {
          effect.active = false;
          expiredEffects.push(effect);
          
          // Emit event for effect expiration
          eventBus.emit('powerup:expired', { type: effect.type });
        }
      }
    });
    
    // Remove expired effects
    expiredEffects.forEach((effect) => {
      const index = this.activeEffects.indexOf(effect);
      if (index !== -1) {
        this.activeEffects.splice(index, 1);
      }
    });
  }
  
  /**
   * Spawn a new collectible
   * @param type Type of collectible to spawn
   * @param position Position to spawn at
   */
  public spawnCollectible(type: CollectibleType, position: THREE.Vector3): void {
    // Find an inactive collectible of the requested type or create one if needed
    let collectible = this.findInactiveCollectible(type);
    
    if (collectible) {
      collectible.active = true;
      collectible.position.copy(position);
      collectible.collider.center.copy(position);
      
      if (type === CollectibleType.BUBBLE) {
        if (collectible.instanceId !== undefined && this.visibilityAttribute) {
          this.visibilityAttribute.setX(collectible.instanceId, 1.0); // Make visible
          this.visibilityAttribute.needsUpdate = true;
        }
      } else {
        const mesh = this.powerupMeshes.get(type);
        if (mesh) {
          mesh.visible = true;
          mesh.position.copy(position);
        }
      }
    }
  }
  
  private findInactiveCollectible(type: CollectibleType): Collectible | undefined {
    return this.collectibles.find(
      (c) => !c.active && (
        type === CollectibleType.BUBBLE ? 
        c.type === CollectibleType.BUBBLE : 
        c.type === type || !this.powerupMeshes.has(c.type)
      )
    );
  }
  
  private deactivateCollectible(collectible: Collectible): void {
    collectible.active = false;
    
    if (collectible.type === CollectibleType.BUBBLE) {
      if (collectible.instanceId !== undefined && this.visibilityAttribute) {
        this.visibilityAttribute.setX(collectible.instanceId, 0.0); // Make invisible
        this.visibilityAttribute.needsUpdate = true;
      }
    } else {
      const mesh = this.powerupMeshes.get(collectible.type);
      if (mesh) {
        mesh.visible = false;
      }
    }
  }
  
  /**
   * Handle collectible collection
   * @param collectible The collectible that was collected
   */
  private collectCollectible(collectible: Collectible): void {
    if (!collectible.active) return;
    
    // Deactivate collectible
    this.deactivateCollectible(collectible);
    
    // Handle different collectible types
    if (collectible.type === CollectibleType.BUBBLE) {
      // Add score
      eventBus.emit('player:score', { 
        points: collectible.value * (this.isPowerUpActive(CollectibleType.POWERUP_SCORE) ? 2 : 1)
      });
    } else {
      // Activate power-up
      this.activatePowerUp(collectible.type);
      
      // Add score
      const config = this.powerUpConfigs.get(collectible.type);
      if (config) {
        eventBus.emit('player:score', { 
          points: config.value * (this.isPowerUpActive(CollectibleType.POWERUP_SCORE) ? 2 : 1)
        });
      }
    }
    
    // Emit collection event
    eventBus.emit('collectible:collected', { type: collectible.type });
  }
  
  /**
   * Activate a power-up effect
   * @param type Power-up type to activate
   */
  private activatePowerUp(type: CollectibleType): void {
    const config = this.powerUpConfigs.get(type);
    if (!config) return;
    
    // Check if this power-up is already active
    const existingEffect = this.activeEffects.find(effect => effect.type === type && effect.active);
    
    if (existingEffect) {
      // Extend duration if already active
      existingEffect.startTime = this.currentTime;
    } else {
      // Add new effect
      this.activeEffects.push({
        type,
        startTime: this.currentTime,
        duration: config.duration,
        active: true
      });
    }
    
    // Emit power-up activation event
    eventBus.emit('powerup:activated', { 
      type, 
      duration: config.duration 
    });
  }
  
  /**
   * Check if a specific power-up is currently active
   * @param type Power-up type to check
   * @returns True if power-up is active, false otherwise
   */
  public isPowerUpActive(type: CollectibleType): boolean {
    return this.activeEffects.some(effect => effect.type === type && effect.active);
  }
  
  /**
   * Get remaining duration of an active power-up
   * @param type Power-up type to check
   * @returns Remaining duration in seconds, or 0 if not active
   */
  public getPowerUpRemainingTime(type: CollectibleType): number {
    const effect = this.activeEffects.find(e => e.type === type && e.active);
    if (!effect) return 0;
    
    const elapsed = this.currentTime - effect.startTime;
    return Math.max(0, effect.duration - elapsed);
  }
  
  /**
   * Spawn a pattern of collectibles
   * @param patternType Pattern type to spawn
   * @param baseZ Base Z position (distance)
   * @param difficulty Game difficulty (0-1)
   */
  public spawnPattern(patternType: PatternType, baseZ: number, difficulty: number): void {
    // Choose a pattern based on passed parameter or randomly
    const pattern = patternType === PatternType.RANDOM ? 
      Math.floor(Math.random() * (PatternType.RANDOM)) : 
      patternType;
    
    switch (pattern) {
      case PatternType.LINE:
        this.spawnLinePattern(baseZ, difficulty);
        break;
      case PatternType.CURVE:
        this.spawnCurvePattern(baseZ, difficulty);
        break;
      case PatternType.ZIGZAG:
        this.spawnZigzagPattern(baseZ, difficulty);
        break;
      case PatternType.CIRCLE:
        this.spawnCirclePattern(baseZ, difficulty);
        break;
      case PatternType.WAVE:
        this.spawnWavePattern(baseZ, difficulty);
        break;
      case PatternType.SPIRAL:
        this.spawnSpiralPattern(baseZ, difficulty);
        break;
      default:
        this.spawnLinePattern(baseZ, difficulty);
        break;
    }
    
    // Occasionally spawn a power-up (based on difficulty and randomness)
    if (Math.random() < 0.1 + difficulty * 0.1) {
      this.spawnRandomPowerUp(baseZ + Math.random() * 10);
    }
  }
  
  private spawnLinePattern(baseZ: number, difficulty: number): void {
    const count = 5 + Math.floor(difficulty * 5); // 5-10 bubbles based on difficulty
    const spacing = 1.0;
    const laneOffset = (Math.random() - 0.5) * this.LANE_WIDTH;
    
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        laneOffset,
        1.0 + (Math.random() - 0.5) * 0.5, // Slight vertical variation
        baseZ + i * spacing
      );
      
      this.spawnCollectible(CollectibleType.BUBBLE, position);
    }
  }
  
  private spawnCurvePattern(baseZ: number, difficulty: number): void {
    const count = 8 + Math.floor(difficulty * 7); // 8-15 bubbles based on difficulty
    const spacing = 1.0;
    const amplitude = this.LANE_WIDTH * 0.8;
    const frequency = Math.PI / (count * 0.5);
    
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        Math.sin(i * frequency) * amplitude,
        1.0 + (Math.random() - 0.5) * 0.5, // Slight vertical variation
        baseZ + i * spacing
      );
      
      this.spawnCollectible(CollectibleType.BUBBLE, position);
    }
  }
  
  private spawnZigzagPattern(baseZ: number, difficulty: number): void {
    const count = 10 + Math.floor(difficulty * 10); // 10-20 bubbles based on difficulty
    const spacing = 1.0;
    const amplitude = this.LANE_WIDTH * 0.8;
    let side = Math.random() > 0.5 ? 1 : -1;
    
    for (let i = 0; i < count; i++) {
      if (i % 5 === 0) side *= -1; // Change direction every 5 bubbles
      
      const position = new THREE.Vector3(
        side * amplitude,
        1.0 + (Math.random() - 0.5) * 0.5, // Slight vertical variation
        baseZ + i * spacing
      );
      
      this.spawnCollectible(CollectibleType.BUBBLE, position);
    }
  }
  
  private spawnCirclePattern(baseZ: number, difficulty: number): void {
    const count = 12; // Fixed count for circle
    const radius = this.LANE_WIDTH * 0.6;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        1.0 + Math.sin(angle) * radius * 0.5, // Elliptical shape
        baseZ + i * 0.5 // Slightly diagonal
      );
      
      this.spawnCollectible(CollectibleType.BUBBLE, position);
    }
  }
  
  private spawnWavePattern(baseZ: number, difficulty: number): void {
    const count = 15 + Math.floor(difficulty * 10); // 15-25 bubbles based on difficulty
    const xSpacing = this.LANE_WIDTH / 4;
    const zSpacing = 1.0;
    const rows = 5;
    
    for (let row = 0; row < rows; row++) {
      const rowOffset = (row - (rows - 1) / 2) * xSpacing;
      
      for (let i = 0; i < count / rows; i++) {
        const position = new THREE.Vector3(
          rowOffset + Math.sin(i * 0.5) * xSpacing,
          1.0 + (Math.random() - 0.5) * 0.5, // Slight vertical variation
          baseZ + i * zSpacing
        );
        
        this.spawnCollectible(CollectibleType.BUBBLE, position);
      }
    }
  }
  
  private spawnSpiralPattern(baseZ: number, difficulty: number): void {
    const count = 20; // Fixed count for spiral
    const maxRadius = this.LANE_WIDTH * 0.7;
    const zSpacing = 0.8;
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 6; // 3 full rotations
      const radius = t * maxRadius;
      
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        1.0 + Math.sin(angle) * radius * 0.3, // Elliptical shape
        baseZ + i * zSpacing
      );
      
      this.spawnCollectible(CollectibleType.BUBBLE, position);
    }
  }
  
  private spawnRandomPowerUp(baseZ: number): void {
    // Select random power-up type
    const powerupTypes = Object.values(CollectibleType)
      .filter(type => type !== CollectibleType.BUBBLE);
    
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)] as CollectibleType;
    
    // Random position within lane bounds
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * this.LANE_WIDTH,
      1.0 + (Math.random() - 0.5) * 0.5, // Slight vertical variation
      baseZ
    );
    
    this.spawnCollectible(randomType, position);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Dispose of geometries
    if (this.bubbleGeometry) {
      this.bubbleGeometry.dispose();
    }
    
    // Dispose of materials
    if (this.bubbleMaterial) {
      this.bubbleMaterial.dispose();
    }
    
    this.powerupMaterials.forEach((material) => {
      material.dispose();
    });
    
    // Remove meshes from scene
    if (this.bubbleInstancedMesh) {
      this.scene.remove(this.bubbleInstancedMesh);
    }
    
    this.powerupMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    
    // Clear arrays
    this.collectibles = [];
    this.activeEffects = [];
    this.powerupMeshes.clear();
    this.powerupMaterials.clear();
  }
  
  /**
   * Clear all collectibles and power-ups
   */
  clear(): void {
    // Deactivate all collectibles
    this.collectibles.forEach(collectible => {
      this.deactivateCollectible(collectible);
    });
    
    // Clear active effects
    this.activeEffects = [];
    
    // Reset attraction state
    this.isAttractionEnabled = false;
    this.magneticPullTarget = null;
  }
  
  /**
   * Enable or disable magnetic attraction for the bubble magnet power-up
   */
  setAttractionEnabled(enabled: boolean): void {
    this.isAttractionEnabled = enabled;
    if (!enabled) {
      this.magneticPullTarget = null;
    }
  }
}