import * as THREE from 'three';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { detectDeviceCapabilities } from '../../utils/DeviceUtils';
import eventBus from '../../core/EventSystem';

/**
 * Configuration for pufferfish obstacles
 */
export interface PufferfishConfig extends ObstacleConfig {
  // Inflation speed when triggered
  inflationSpeed?: number;
  // Deflation speed when returning to normal
  deflationSpeed?: number;
  // Trigger radius for inflation
  triggerRadius?: number;
  // Maximum inflation size multiplier
  maxInflation?: number;
  // Duration to stay inflated in seconds
  inflationDuration?: number;
  // Color variation (0-1 for main color hue)
  colorVariation?: number;
  // Rotation speed when idle
  rotationSpeed?: number;
}

/**
 * Pufferfish obstacle that inflates when the player gets close
 */
export class Pufferfish extends Obstacle {
  // Inflation properties
  private inflationSpeed: number = 2.0;
  private deflationSpeed: number = 1.0;
  private currentInflation: number = 0.0;
  private maxInflation: number = 2.5;
  private triggerRadius: number = 4.0;
  private inflationDuration: number = 3.0;
  private inflationTimer: number = 0;
  
  // Movement and animation
  private rotationSpeed: number = 0.5;
  private bobSpeed: number = 0.3;
  private bobHeight: number = 0.2;
  private bobPhase: number = 0;
  private spinPhase: number = 0;
  private animationTime: number = 0;
  
  // Visual properties
  private colorHue: number = 0.12; // Orange-yellow default
  private bodyMaterial: THREE.Material | null = null;
  private spikeMaterials: THREE.Material[] = [];
  
  // Shader-based materials for high quality
  private bodyShaderMaterial: THREE.ShaderMaterial | null = null;
  private spikeShaderMaterials: THREE.ShaderMaterial[] = [];
  private spotColor: THREE.Color = new THREE.Color(0x704214); // Darker brown spots
  
  // Mesh components
  private body: THREE.Mesh | null = null;
  private spikes: THREE.Group | null = null;
  private eyes: THREE.Group | null = null;
  
  // State tracking
  private isInflating: boolean = false;
  private isDeflating: boolean = false;
  private fullyInflated: boolean = false;
  
  // Visual quality tracking
  private deviceCapabilities = detectDeviceCapabilities();
  // quality is declared in parent class as protected
  
  /**
   * Create a pufferfish obstacle
   */
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    super(scene, qualityLevel);
    
    this.quality = qualityLevel;
    this.obstacleType = 'pufferfish';
    
    // Create pufferfish mesh
    this.mesh = this.createPufferfishMesh();
    
    // Create spherical collider
    this.collider = new THREE.Sphere(new THREE.Vector3(), 0.5);
    
    // Set random animation phase offsets
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spinPhase = Math.random() * Math.PI * 2;
    
    // Add shadow casting
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = false;
      }
    });
  }
  
  /**
   * Create pufferfish mesh based on quality level
   */
  private createPufferfishMesh(): THREE.Group {
    // Create main group
    const pufferfishGroup = new THREE.Group();
    pufferfishGroup.name = 'pufferfish';
    
    // Determine detail level based on quality
    const segments = this.quality === 'high' ? 24 : 
                    this.quality === 'medium' ? 16 : 12;
    const spikeCount = this.quality === 'high' ? 24 : 
                      this.quality === 'medium' ? 16 : 10;
    
    // Create body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Create body geometry - use IcosahedronGeometry for more even distribution in high quality
    const bodyGeometry = this.quality === 'high' 
      ? new THREE.IcosahedronGeometry(0.5, 2) // More even distribution for inflation
      : new THREE.SphereGeometry(0.5, segments, segments);
    
    // Create body material
    let bodyMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      // High-quality shader-based material for inflation effect
      bodyMaterial = this.createPufferfishShaderMaterial();
      this.bodyShaderMaterial = bodyMaterial as THREE.ShaderMaterial;
    } else if (this.quality === 'medium') {
      // Medium-quality material with detailed properties
      bodyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.8, 0.7),
        roughness: 0.7,
        metalness: 0.1,
        flatShading: false
      });
    } else {
      // Simpler material for low quality
      bodyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.8, 0.7),
        flatShading: true
      });
    }
    
    this.bodyMaterial = bodyMaterial;
    
    // Create body mesh
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.name = 'body_mesh';
    bodyGroup.add(this.body);
    
    // Create spikes
    this.spikes = new THREE.Group();
    this.spikes.name = 'spikes';
    
    // Create spike material
    let spikeMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      // High-quality shader-based material for spike animation
      spikeMaterial = this.createSpikeShaderMaterial();
    } else {
      // Standard material for medium/low quality
      spikeMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.5, 0.5),
        roughness: 0.8,
        metalness: 0.1
      });
    }
    
    this.spikeMaterials.push(spikeMaterial);
    
    // Generate spikes in a fibonacci pattern for even distribution
    for (let i = 0; i < spikeCount; i++) {
      // Use golden ratio for even distribution on sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / spikeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      
      // Calculate position on unit sphere
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      // Create spike
      const spike = this.createSpike(spikeMaterial);
      
      // Position on sphere
      spike.position.set(x * 0.5, y * 0.5, z * 0.5);
      
      // Orient spike to point outward from center
      spike.lookAt(x * 2, y * 2, z * 2);
      
      // Adjust rotation to align spike
      spike.rotateX(Math.PI / 2);
      
      // Add to spikes group
      this.spikes.add(spike);
    }
    
    bodyGroup.add(this.spikes);
    
    // Create eyes
    this.eyes = new THREE.Group();
    this.eyes.name = 'eyes';
    
    // Add two eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.3, 0.2, 0.35);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.3, 0.2, 0.35);
    
    // Add white highlights for high and medium quality
    if (this.quality !== 'low') {
      const highlightGeometry = new THREE.SphereGeometry(0.03, 6, 6);
      const highlightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      
      const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      leftHighlight.position.set(0.33, 0.23, 0.38);
      
      const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      rightHighlight.position.set(-0.27, 0.23, 0.38);
      
      this.eyes.add(leftHighlight);
      this.eyes.add(rightHighlight);
    }
    
    this.eyes.add(leftEye);
    this.eyes.add(rightEye);
    
    bodyGroup.add(this.eyes);
    
    // Add details for high quality
    if (this.quality === 'high') {
      // Add mouth
      const mouthGeometry = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const mouthMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x411d00,
        side: THREE.BackSide
      });
      
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.scale.set(0.5, 0.3, 0.5);
      mouth.position.set(0, -0.1, 0.45);
      mouth.rotation.x = Math.PI;
      
      bodyGroup.add(mouth);
      
      // Add fins
      const finMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(this.colorHue, 0.6, 0.6),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Top fin
      const topFinGeometry = this.createFinGeometry(0.25, 0.15);
      const topFin = new THREE.Mesh(topFinGeometry, finMaterial);
      topFin.position.set(0, 0.5, 0);
      topFin.rotation.x = Math.PI / 2;
      
      // Side fins
      const leftFinGeometry = this.createFinGeometry(0.2, 0.12);
      const leftFin = new THREE.Mesh(leftFinGeometry, finMaterial);
      leftFin.position.set(0.5, 0, 0);
      leftFin.rotation.z = Math.PI / 2;
      
      const rightFinGeometry = this.createFinGeometry(0.2, 0.12);
      const rightFin = new THREE.Mesh(rightFinGeometry, finMaterial);
      rightFin.position.set(-0.5, 0, 0);
      rightFin.rotation.z = -Math.PI / 2;
      
      // Tail fin
      const tailFinGeometry = this.createFinGeometry(0.2, 0.15);
      const tailFin = new THREE.Mesh(tailFinGeometry, finMaterial);
      tailFin.position.set(0, 0, -0.5);
      tailFin.rotation.y = Math.PI;
      
      bodyGroup.add(topFin);
      bodyGroup.add(leftFin);
      bodyGroup.add(rightFin);
      bodyGroup.add(tailFin);
    }
    
    // Add body to main group
    pufferfishGroup.add(bodyGroup);
    
    return pufferfishGroup;
  }
  
  /**
   * Create a fin geometry
   */
  private createFinGeometry(height: number, width: number): THREE.BufferGeometry {
    // Create a triangular shape for a fin
    const finShape = new THREE.Shape();
    
    finShape.moveTo(0, 0);
    finShape.lineTo(width, 0);
    finShape.lineTo(0, height);
    finShape.lineTo(0, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.02,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  }
  
  /**
   * Create a shader material for the pufferfish body with inflation effect
   */
  private createPufferfishShaderMaterial(): THREE.ShaderMaterial {
    // Create base color from hue
    const bodyColor = new THREE.Color().setHSL(this.colorHue, 0.8, 0.7);
    
    // Vertex shader for inflation effect
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      
      uniform float uTime;
      uniform float uInflationFactor; // 0.0 = deflated, 1.0 = inflated
      uniform float uMaxInflationAmount; // How much the radius increases
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        vec3 baseNormal = normal; // Store original normal
        
        // --- Inflation Deformation ---
        // Simple radial expansion based on inflation factor
        float inflation = uInflationFactor * uMaxInflationAmount;
        // Displace vertex along its normal
        pos += normal * inflation; 
        
        // Add subtle wobble/pulsation even when inflated/deflated
        float wobbleFreq = 3.0;
        float wobbleAmp = 0.02 * (1.0 + uInflationFactor); // Slightly more wobble when inflated
        float wobble = sin(uTime * wobbleFreq + position.y * 2.0) * wobbleAmp;
        pos += normal * wobble;
        
        // --- Final Position & Normal ---
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        
        // Compute normal for lighting
        vNormal = normalize(normalMatrix * baseNormal);
        
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;
    
    // Fragment shader for spot pattern and lighting
    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      
      uniform float uTime;
      uniform float uInflationFactor;
      uniform vec3 uColorBody;
      uniform vec3 uColorSpots;
      
      // Simple hash function for noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Simple noise function
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        // Smooth interpolation
        f = f * f * (3.0 - 2.0 * f);
        
        // Sample 4 corners
        float a = hash(i + vec2(0.0, 0.0));
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        // Bilinear interpolation
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Fractal Brownian Motion (multiple noise layers)
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        // Add 4 octaves of noise
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        vec3 normal = normalize(vNormal);
        
        // Spot pattern - use scaled position that stretches as fish inflates
        vec2 pos = vWorldPosition.xz * (1.5 + uInflationFactor * 0.5);
        float spots = fbm(pos); // Get noise pattern
        
        // Create sharper spots using smoothstep
        spots = smoothstep(0.4, 0.45, spots) - smoothstep(0.6, 0.65, spots); 
        
        // Mix body and spot colors
        vec3 baseColor = mix(uColorBody, uColorSpots, spots * 0.8);
        
        // Add subtle color variation based on inflation
        baseColor = mix(baseColor, baseColor * 1.1 + vec3(0.05), uInflationFactor * 0.3);
        
        // Simple lighting
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Add some ambient lighting
        vec3 litColor = baseColor * (diff * 0.7 + 0.3);
        
        // Output final color
        gl_FragColor = vec4(litColor, 1.0);
      }
    `;
    
    // Create shader material
    return new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uInflationFactor: { value: 0.0 },
        uMaxInflationAmount: { value: this.maxInflation },
        uColorBody: { value: bodyColor },
        uColorSpots: { value: this.spotColor }
      }
    });
  }
  
  /**
   * Create a shader material for the pufferfish spikes with inflation effect
   */
  private createSpikeShaderMaterial(): THREE.ShaderMaterial {
    // Create color from hue
    const spikeColor = new THREE.Color().setHSL(this.colorHue, 0.5, 0.5);
    
    // Vertex shader for spike scaling
    const vertexShader = `
      varying vec3 vNormal;
      
      uniform float uInflationFactor; // 0.0 = deflated, 1.0 = inflated
      
      void main() {
        // Get base position and normal
        vec3 pos = position;
        vNormal = normalize(normalMatrix * normal);
        
        // Scale spike based on inflation factor - spikes appear as fish inflates
        // Use ease-in function for more natural appearance
        float scale = smoothstep(0.2, 0.8, uInflationFactor);
        
        // Apply scale to position
        vec3 scaledPos = pos * scale;
        
        // For very small scale, hide spike completely to avoid z-fighting
        if (scale < 0.01) {
          gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPos, 1.0);
        }
      }
    `;
    
    // Fragment shader for spike color
    const fragmentShader = `
      varying vec3 vNormal;
      
      uniform vec3 uColor;
      uniform float uInflationFactor;
      
      void main() {
        // Simple lighting
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Calculate final color with lighting
        vec3 finalColor = uColor * (diff * 0.7 + 0.3);
        
        // Output final color
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    // Create shader material and store reference for updating
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uInflationFactor: { value: 0.0 },
        uColor: { value: spikeColor }
      }
    });
    
    // Store in array for easy updates
    this.spikeShaderMaterials.push(material);
    
    return material;
  }
  
  /**
   * Create a spike mesh
   */
  private createSpike(material: THREE.Material): THREE.Mesh {
    // Create spike geometry based on quality
    let spikeGeometry: THREE.BufferGeometry;
    
    if (this.quality === 'high') {
      // Detailed spike for high quality
      spikeGeometry = new THREE.ConeGeometry(0.04, 0.15, 8);
    } else if (this.quality === 'medium') {
      // Simpler spike for medium quality
      spikeGeometry = new THREE.ConeGeometry(0.04, 0.15, 6);
    } else {
      // Very simple spike for low quality
      spikeGeometry = new THREE.ConeGeometry(0.04, 0.15, 4);
    }
    
    return new THREE.Mesh(spikeGeometry, material);
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(config: PufferfishConfig): void {
    super.initialize(config);
    
    // Set pufferfish-specific properties
    this.inflationSpeed = config.inflationSpeed || 2.0;
    this.deflationSpeed = config.deflationSpeed || 1.0;
    this.triggerRadius = config.triggerRadius || 4.0;
    this.maxInflation = config.maxInflation || 2.5;
    this.inflationDuration = config.inflationDuration || 3.0;
    this.rotationSpeed = config.rotationSpeed || 0.5;
    
    // Set color variation if specified
    if (config.colorVariation !== undefined) {
      this.setColor(config.colorVariation);
    }
    
    // Reset inflation state
    this.currentInflation = 0.0;
    this.isInflating = false;
    this.isDeflating = false;
    this.fullyInflated = false;
    this.inflationTimer = 0;
    
    // Start in idle state
    this.state = 'idle';
  }
  
  /**
   * Set color variation for the pufferfish
   */
  private setColor(hue: number): void {
    // Update color hue (0-1 range)
    this.colorHue = Math.max(0, Math.min(1, hue));
    
    // Create colors
    const bodyColor = new THREE.Color().setHSL(this.colorHue, 0.8, 0.7);
    const spikeColor = new THREE.Color().setHSL(this.colorHue, 0.5, 0.5);
    
    // Update spot color - derived from body color but darker
    this.spotColor.setHSL(this.colorHue, 0.7, 0.4);
    
    // For high quality, update shader uniforms
    if (this.quality === 'high') {
      // Update body shader material
      if (this.bodyShaderMaterial && this.bodyShaderMaterial.uniforms) {
        this.bodyShaderMaterial.uniforms.uColorBody.value = bodyColor;
        this.bodyShaderMaterial.uniforms.uColorSpots.value = this.spotColor;
      }
      
      // Update spike shader materials
      this.spikeShaderMaterials.forEach(material => {
        if (material.uniforms && material.uniforms.uColor) {
          material.uniforms.uColor.value = spikeColor;
        }
      });
    } else {
      // For medium/low quality, update standard materials
      
      // Update body material
      if (this.bodyMaterial && 'color' in this.bodyMaterial) {
        (this.bodyMaterial as any).color.copy(bodyColor);
      }
      
      // Update spike materials
      this.spikeMaterials.forEach(material => {
        if ('color' in material) {
          (material as any).color.copy(spikeColor);
        }
      });
    }
  }
  
  /**
   * Update obstacle state
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    super.update(deltaTime, playerPosition, gameSpeed);
    
    // Update animation phases
    this.bobPhase += deltaTime * this.bobSpeed * this.timeScale;
    this.spinPhase += deltaTime * this.rotationSpeed * this.timeScale;
    
    // Apply bobbing motion
    const bobOffset = Math.sin(this.bobPhase) * this.bobHeight;
    this.mesh.position.y = this.position.y + bobOffset;
    
    // Apply spinning (if not fully inflated)
    if (!this.fullyInflated) {
      this.mesh.rotation.y = this.spinPhase;
    }
    
    // Update based on current state
    switch (this.state) {
      case 'idle':
        this.updateIdle(deltaTime, playerPosition, gameSpeed);
        break;
      case 'active':
        this.updateActive(deltaTime, playerPosition, gameSpeed);
        break;
      case 'triggered':
        this.updateTriggered(deltaTime, playerPosition, gameSpeed);
        break;
      case 'cooldown':
        this.updateCooldown(deltaTime, playerPosition, gameSpeed);
        break;
    }
    
    // Update inflation/deflation
    this.updateInflation(deltaTime);
    
    // Update collider based on current inflation
    this.updateCollider();
  }
  
  /**
   * Update collider to match current inflation
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Sphere) {
      // Update radius based on current inflation
      const baseRadius = 0.5;
      const inflatedRadius = baseRadius * (1 + this.currentInflation);
      
      this.collider.radius = inflatedRadius;
      this.collider.center.copy(this.mesh.position);
    }
  }
  
  /**
   * Update idle state behavior - minimal animation
   */
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Transition to active when player is nearby
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < 50) {
      this.state = 'active';
    }
  }
  
  /**
   * Update active state behavior - normal swimming and player detection
   */
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Check if player is close enough to trigger inflation
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (distanceToPlayer < this.triggerRadius && !this.isInflating && !this.fullyInflated) {
      // Player is close, start inflation
      this.startInflation();
      this.state = 'triggered';
      
      // Play inflation sound
      eventBus.emit('play-sound', { name: 'pufferfish-inflate', volume: 0.5 });
    }
  }
  
  /**
   * Update triggered state behavior - inflation and maintaining inflated state
   */
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Handle inflation timer when fully inflated
    if (this.fullyInflated) {
      this.inflationTimer -= deltaTime;
      
      // Begin deflation after timer expires
      if (this.inflationTimer <= 0) {
        this.startDeflation();
        this.state = 'cooldown';
      }
    }
  }
  
  /**
   * Update cooldown state behavior - deflation and return to active state
   */
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Return to active state when fully deflated
    if (this.currentInflation <= 0) {
      this.state = 'active';
    }
  }
  
  /**
   * Start inflation process
   */
  private startInflation(): void {
    this.isInflating = true;
    this.isDeflating = false;
    this.fullyInflated = false;
  }
  
  /**
   * Start deflation process
   */
  private startDeflation(): void {
    this.isInflating = false;
    this.isDeflating = true;
    this.fullyInflated = false;
    
    // Play deflation sound
    eventBus.emit('play-sound', { name: 'pufferfish-deflate', volume: 0.4 });
  }
  
  /**
   * Update inflation/deflation animation
   */
  private updateInflation(deltaTime: number): void {
    // Update animation time
    this.animationTime += deltaTime;
    
    // Handle inflation
    if (this.isInflating) {
      // Increase inflation value
      this.currentInflation += this.inflationSpeed * deltaTime;
      
      // Check if fully inflated
      if (this.currentInflation >= this.maxInflation) {
        this.currentInflation = this.maxInflation;
        this.isInflating = false;
        this.fullyInflated = true;
        this.inflationTimer = this.inflationDuration;
        
        // Play fully inflated sound
        eventBus.emit('play-sound', { name: 'pufferfish-inflated', volume: 0.4 });
      }
    }
    // Handle deflation
    else if (this.isDeflating) {
      // Decrease inflation value
      this.currentInflation -= this.deflationSpeed * deltaTime;
      
      // Check if fully deflated
      if (this.currentInflation <= 0) {
        this.currentInflation = 0;
        this.isDeflating = false;
      }
    }
    
    // High-quality shader-based animation
    if (this.quality === 'high') {
      // Update body shader uniforms
      if (this.bodyShaderMaterial && this.bodyShaderMaterial.uniforms) {
        // Update time and inflation factor
        this.bodyShaderMaterial.uniforms.uTime.value = this.animationTime;
        this.bodyShaderMaterial.uniforms.uInflationFactor.value = this.currentInflation / this.maxInflation;
      }
      
      // Update spike shader uniforms
      this.spikeShaderMaterials.forEach(material => {
        if (material.uniforms) {
          material.uniforms.uInflationFactor.value = this.currentInflation / this.maxInflation;
        }
      });
      
      // Still need to update eyes position for high quality
      if (this.eyes) {
        const eyeScale = 1 + this.currentInflation * 0.5; // Eyes grow less than body
        this.eyes.scale.set(eyeScale, eyeScale, eyeScale);
        
        // Move eyes to stay on the surface
        this.eyes.children.forEach(eye => {
          const direction = new THREE.Vector3()
            .copy(eye.position)
            .normalize();
          
          const distance = 0.5 * (1 + this.currentInflation * 0.8);
          eye.position.copy(direction.multiplyScalar(distance));
        });
      }
    } else {
      // Medium/low quality uses simpler scaling animation
      
      // Apply inflation scale to mesh
      if (this.body) {
        const scale = 1 + this.currentInflation;
        this.body.scale.set(scale, scale, scale);
      }
      
      // Apply inflation effect to spikes - they extend outward
      if (this.spikes) {
        this.spikes.children.forEach((spike, i) => {
          // Get original position (normalized direction from center)
          const direction = new THREE.Vector3()
            .copy(spike.position)
            .normalize();
          
          // Calculate new position based on inflation
          const distance = 0.5 * (1 + this.currentInflation);
          spike.position.copy(direction.multiplyScalar(distance));
          
          // Point outward from center
          spike.lookAt(spike.position.clone().multiplyScalar(2));
          spike.rotateX(Math.PI / 2);
        });
      }
      
      // Adjust eyes position when inflated
      if (this.eyes) {
        const eyeScale = 1 + this.currentInflation * 0.5; // Eyes grow less than body
        this.eyes.scale.set(eyeScale, eyeScale, eyeScale);
        
        // Move eyes to stay on the surface
        this.eyes.children.forEach(eye => {
          const direction = new THREE.Vector3()
            .copy(eye.position)
            .normalize();
          
          const distance = 0.5 * (1 + this.currentInflation * 0.8);
          eye.position.copy(direction.multiplyScalar(distance));
        });
      }
    }
  }
  
  /**
   * Collision response
   */
  public onCollision(): void {
    super.onCollision();
    
    // If not already inflating or inflated, trigger inflation
    if (!this.isInflating && !this.fullyInflated) {
      this.startInflation();
      this.state = 'triggered';
      
      // Play inflation sound
      eventBus.emit('play-sound', { name: 'pufferfish-inflate', volume: 0.6 });
    }
  }
  
  /**
   * Reset for object pooling reuse
   */
  public reset(): void {
    super.reset();
    
    // Reset inflation state
    this.currentInflation = 0;
    this.isInflating = false;
    this.isDeflating = false;
    this.fullyInflated = false;
    this.inflationTimer = 0;
    
    // Reset animation phases
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spinPhase = Math.random() * Math.PI * 2;
    
    // Reset scale
    if (this.body) {
      this.body.scale.set(1, 1, 1);
    }
    
    // Reset spike positions
    if (this.spikes) {
      this.spikes.children.forEach((spike, i) => {
        // Get direction from center (unit vector)
        const phi = Math.acos(1 - 2 * (i + 0.5) / this.spikes!.children.length);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
        
        // Calculate position on unit sphere
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        
        // Position on sphere surface
        spike.position.set(x * 0.5, y * 0.5, z * 0.5);
        
        // Orient spike to point outward
        spike.lookAt(x * 2, y * 2, z * 2);
        spike.rotateX(Math.PI / 2);
      });
    }
    
    // Reset eye positions
    if (this.eyes) {
      this.eyes.scale.set(1, 1, 1);
      
      // Only reset if there are at least two eyes
      if (this.eyes.children.length >= 2) {
        // Left eye
        this.eyes.children[0].position.set(0.3, 0.2, 0.35);
        
        // Right eye
        this.eyes.children[1].position.set(-0.3, 0.2, 0.35);
        
        // Reset highlights if they exist
        if (this.eyes.children.length >= 4) {
          this.eyes.children[2].position.set(0.33, 0.23, 0.38);
          this.eyes.children[3].position.set(-0.27, 0.23, 0.38);
        }
      }
    }
  }
}