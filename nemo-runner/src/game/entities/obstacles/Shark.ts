import * as THREE from 'three';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { detectDeviceCapabilities } from '../../utils/DeviceUtils';
import eventBus from '../../core/EventSystem';

/**
 * Configuration for shark obstacles
 */
export interface SharkConfig extends ObstacleConfig {
  // Patrol pattern points (if applicable)
  patrolPoints?: THREE.Vector3[];
  // Patrol movement speed
  patrolSpeed?: number;
  // Detection radius for player
  detectionRadius?: number;
  // Chase speed when player is detected
  chaseSpeed?: number;
  // Whether this shark can chase the player
  canChase?: boolean;
  // Maximum chase duration in seconds
  maxChaseDuration?: number;
  // Attack cooldown in seconds
  attackCooldown?: number;
}

/**
 * Predatory shark obstacle with patrol and chase behavior
 */
export class Shark extends Obstacle {
  // Patrol behavior
  private patrolPoints: THREE.Vector3[] = [];
  private currentPatrolIndex: number = 0;
  private patrolSpeed: number = 5;
  
  // Chase behavior
  private detectionRadius: number = 10;
  private chaseSpeed: number = 8;
  private isChasing: boolean = false;
  private canChase: boolean = true;
  private chaseStartTime: number = 0;
  private chaseDuration: number = 5;
  private isCoolingDown: boolean = false;
  private attackCooldown: number = 2;
  private cooldownTimer: number = 0;
  
  // Target position for movement
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  
  // Animation and visual effects
  private mixer: THREE.AnimationMixer;
  private swimAction: THREE.AnimationAction | null = null;
  private chaseAction: THREE.AnimationAction | null = null;
  private attackAction: THREE.AnimationAction | null = null;
  private finRotation: number = 0;
  private tailRotation: number = 0;
  
  // Shader-based animation properties
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private animationTime: number = 0;
  private waveFrequency: number = 2.0;
  private waveAmplitude: number = 0.1;
  
  // Visual quality tracking
  private deviceCapabilities = detectDeviceCapabilities();
  // quality is declared in parent class as protected
  
  // Body parts references for animation
  private bodyMesh: THREE.Object3D | null = null;
  private tailMesh: THREE.Object3D | null = null;
  private dorsalFinMesh: THREE.Object3D | null = null;
  private leftFinMesh: THREE.Object3D | null = null;
  private rightFinMesh: THREE.Object3D | null = null;
  private jawMesh: THREE.Object3D | null = null;
  
  /**
   * Create a shark obstacle
   */
  constructor(scene: THREE.Scene, qualityLevel: 'high' | 'medium' | 'low') {
    super(scene, qualityLevel);
    
    this.quality = qualityLevel;
    this.obstacleType = 'shark';
    
    // Create the shark mesh
    this.mesh = this.createSharkMesh();
    
    // Set up animation mixer
    this.mixer = new THREE.AnimationMixer(this.mesh);
    
    // Identify body parts for animation
    this.identifyBodyParts();
    
    // Set up animations
    this.setupAnimations();
    
    // Create collider - elongated box for the shark's body
    this.collider = new THREE.Box3(
      new THREE.Vector3(-0.8, -0.6, -3.5),
      new THREE.Vector3(0.8, 0.6, 3.5)
    );
    
    // Add shadow casting
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = false;
      }
    });
  }
  
  /**
   * Identify the shark's body parts for animation
   */
  private identifyBodyParts(): void {
    // Find components by name in the mesh hierarchy
    this.mesh.traverse((object) => {
      const name = object.name.toLowerCase();
      
      if (name.includes('body')) {
        this.bodyMesh = object;
      } else if (name.includes('tail')) {
        this.tailMesh = object;
      } else if (name.includes('dorsal') || name.includes('top_fin')) {
        this.dorsalFinMesh = object;
      } else if (name.includes('left_fin') || name.includes('fin_l')) {
        this.leftFinMesh = object;
      } else if (name.includes('right_fin') || name.includes('fin_r')) {
        this.rightFinMesh = object;
      } else if (name.includes('jaw') || name.includes('mouth')) {
        this.jawMesh = object;
      }
    });
    
    // If we didn't find parts by name, use index-based fallback for the placeholder model
    if (this.mesh.children.length > 0 && !this.bodyMesh) {
      // Simple hierarchy - first child is usually the body
      this.bodyMesh = this.mesh.children[0];
      
      // If there are multiple children, make some assumptions
      if (this.mesh.children.length > 1) {
        this.dorsalFinMesh = this.mesh.children[1]; // Assuming second child is dorsal fin
      }
      
      if (this.mesh.children.length > 2) {
        this.tailMesh = this.mesh.children[2]; // Assuming third child is tail
      }
    }
  }
  
  /**
   * Create shark mesh based on quality level
   */
  private createSharkMesh(): THREE.Group {
    // Create shark group
    const sharkGroup = new THREE.Group();
    sharkGroup.name = 'shark';
    
    // Determine detail level based on quality
    const segmentDetail = this.quality === 'high' ? 16 : 
                          this.quality === 'medium' ? 12 : 8;
    
    // Create body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Main body shape
    const bodyGeometry = new THREE.CapsuleGeometry(
      0.8, // radius
      4.0, // length
      segmentDetail, // radial segments
      segmentDetail  // height segments
    );
    
    // Materials - more detailed for higher quality
    let bodyMaterial: THREE.Material;
    
    if (this.quality === 'high') {
      // For high quality, use shader-based material for undulation and countershading
      bodyMaterial = this.createSharkShaderMaterial();
    } else if (this.quality === 'medium') {
      // For medium quality, use standard material with better properties
      bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x505a64, // Shark grey
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 0.4,
        flatShading: false
      });
    } else {
      // Simpler material for low quality
      bodyMaterial = new THREE.MeshLambertMaterial({
        color: 0x505a64,
        flatShading: true
      });
    }
    
    // Create the body mesh
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Align horizontally
    body.name = 'body_mesh';
    bodyGroup.add(body);
    
    // Create head with more detail
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Create eye highlights if high quality
    const highlightGeometry = new THREE.SphereGeometry(0.04, 6, 6);
    const highlightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.5, 0.4, -1.6);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.5, 0.4, -1.6);
    
    // Add eye highlights for better visual quality
    if (this.quality !== 'low') {
      const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      leftHighlight.position.set(0.53, 0.43, -1.65);
      
      const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      rightHighlight.position.set(-0.47, 0.43, -1.65);
      
      headGroup.add(leftHighlight);
      headGroup.add(rightHighlight);
    }
    
    headGroup.add(leftEye);
    headGroup.add(rightEye);
    
    // Create jaw for animation
    const jawGroup = new THREE.Group();
    jawGroup.name = 'jaw';
    
    const jawGeometry = new THREE.BoxGeometry(0.9, 0.3, 1.0);
    const jawMaterial = new THREE.MeshStandardMaterial({
      color: 0x505a64,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const jaw = new THREE.Mesh(jawGeometry, jawMaterial);
    jaw.position.set(0, -0.3, -1.8);
    
    // Add teeth for high and medium quality
    if (this.quality !== 'low') {
      const teethCount = this.quality === 'high' ? 8 : 6;
      const teethGeometry = new THREE.ConeGeometry(0.05, 0.1, 3);
      const teethMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
      
      for (let i = 0; i < teethCount; i++) {
        const tooth = new THREE.Mesh(teethGeometry, teethMaterial);
        const angle = (i / teethCount) * Math.PI * 0.6 - Math.PI * 0.3;
        
        tooth.position.set(
          Math.sin(angle) * 0.4,
          0.05,
          -1.9 + Math.cos(angle) * 0.2
        );
        tooth.rotation.x = Math.PI;
        
        jawGroup.add(tooth);
      }
    }
    
    jawGroup.add(jaw);
    headGroup.add(jawGroup);
    bodyGroup.add(headGroup);
    
    // Create tail
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    
    const tailGeometry = new THREE.BoxGeometry(0.1, 1.2, 1.5);
    tailGeometry.translate(0, 0, 1.0); // Offset for better pivot point
    
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, 2.0); // Position at back of shark
    
    // Create tail fins
    const tailFinGeometry = new THREE.BufferGeometry();
    
    // Create a triangular shape for the tail fin
    const vertices = new Float32Array([
      0.0, 0.0, 0.0,    // center point
      0.0, 1.0, -0.5,   // top tip
      0.0, -1.0, -0.5   // bottom tip
    ]);
    
    const indices = [0, 1, 2];
    
    tailFinGeometry.setIndex(indices);
    tailFinGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    tailFinGeometry.computeVertexNormals();
    
    const tailFin = new THREE.Mesh(tailFinGeometry, bodyMaterial);
    tailFin.position.set(0, 0, 2.5);
    tailFin.scale.set(1.8, 1.8, 1.8);
    
    tailGroup.add(tail);
    tailGroup.add(tailFin);
    bodyGroup.add(tailGroup);
    
    // Create fins
    // Dorsal fin
    const dorsalFinGroup = new THREE.Group();
    dorsalFinGroup.name = 'dorsal_fin';
    
    const dorsalFinGeometry = this.createFinGeometry(1.2, 0.8);
    const dorsalFin = new THREE.Mesh(dorsalFinGeometry, bodyMaterial);
    dorsalFin.rotation.x = Math.PI / 2;
    dorsalFin.position.set(0, 0.8, 0);
    
    dorsalFinGroup.add(dorsalFin);
    bodyGroup.add(dorsalFinGroup);
    
    // Side fins
    const leftFinGroup = new THREE.Group();
    leftFinGroup.name = 'left_fin';
    
    const sideFinGeometry = this.createFinGeometry(0.8, 0.4);
    
    const leftFin = new THREE.Mesh(sideFinGeometry, bodyMaterial);
    leftFin.rotation.order = 'YXZ';
    leftFin.rotation.y = Math.PI / 2;
    leftFin.rotation.x = Math.PI / 4;
    leftFin.position.set(0.8, -0.2, -0.5);
    
    leftFinGroup.add(leftFin);
    bodyGroup.add(leftFinGroup);
    
    const rightFinGroup = new THREE.Group();
    rightFinGroup.name = 'right_fin';
    
    const rightFin = new THREE.Mesh(sideFinGeometry, bodyMaterial);
    rightFin.rotation.order = 'YXZ';
    rightFin.rotation.y = -Math.PI / 2;
    rightFin.rotation.x = Math.PI / 4;
    rightFin.position.set(-0.8, -0.2, -0.5);
    
    rightFinGroup.add(rightFin);
    bodyGroup.add(rightFinGroup);
    
    // Add body to main group
    sharkGroup.add(bodyGroup);
    
    return sharkGroup;
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
      depth: 0.1,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  }
  
  /**
   * Set up animation clips
   */
  private setupAnimations(): void {
    // Only set up complex animations for high and medium quality
    if (this.quality === 'low') {
      return;
    }
    
    // Create swim animation
    const swimTrack = this.createSwimAnimation();
    if (swimTrack.length > 0) {
      const swimClip = new THREE.AnimationClip('swim', 2.0, swimTrack);
      this.swimAction = this.mixer.clipAction(swimClip);
      this.swimAction.play();
    }
    
    // Create chase animation (faster swimming)
    const chaseTrack = this.createChaseAnimation();
    if (chaseTrack.length > 0) {
      const chaseClip = new THREE.AnimationClip('chase', 1.0, chaseTrack);
      this.chaseAction = this.mixer.clipAction(chaseClip);
    }
    
    // Create attack animation
    const attackTrack = this.createAttackAnimation();
    if (attackTrack.length > 0) {
      const attackClip = new THREE.AnimationClip('attack', 1.0, attackTrack);
      this.attackAction = this.mixer.clipAction(attackClip);
    }
  }
  
  /**
   * Create swimming animation tracks
   */
  private createSwimAnimation(): THREE.KeyframeTrack[] {
    const tracks: THREE.KeyframeTrack[] = [];
    
    // Tail animation - side to side
    if (this.tailMesh) {
      const tailKeys = [
        0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0
      ];
      
      const tailValues = [
        0, 0, 0,           // Center
        0, 0, 0.2,         // Right
        0, 0, 0,           // Center
        0, 0, -0.2,        // Left
        0, 0, 0,           // Center
        0, 0, 0.2,         // Right
        0, 0, 0,           // Center
        0, 0, -0.2,        // Left
        0, 0, 0            // Center
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.tailMesh.name}.quaternion`,
        tailKeys,
        tailValues
      ));
    }
    
    // Side fins animation - gentle up and down
    if (this.leftFinMesh) {
      const leftFinKeys = [0.0, 1.0, 2.0];
      const leftFinValues = [
        0, 0, 0,           // Normal
        0, 0.1, 0,         // Slightly up
        0, 0, 0            // Normal
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.leftFinMesh.name}.quaternion`,
        leftFinKeys,
        leftFinValues
      ));
    }
    
    if (this.rightFinMesh) {
      const rightFinKeys = [0.0, 1.0, 2.0];
      const rightFinValues = [
        0, 0, 0,           // Normal
        0, -0.1, 0,        // Slightly down (opposite of left)
        0, 0, 0            // Normal
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.rightFinMesh.name}.quaternion`,
        rightFinKeys,
        rightFinValues
      ));
    }
    
    // Body animation - subtle roll
    if (this.bodyMesh) {
      const bodyKeys = [0.0, 1.0, 2.0];
      const bodyValues = [
        0, 0, 0,           // Normal
        0, 0, 0.05,        // Slight roll
        0, 0, 0            // Normal
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.bodyMesh.name}.quaternion`,
        bodyKeys,
        bodyValues
      ));
    }
    
    return tracks;
  }
  
  /**
   * Create chase animation tracks (faster swimming)
   */
  private createChaseAnimation(): THREE.KeyframeTrack[] {
    const tracks: THREE.KeyframeTrack[] = [];
    
    // Tail animation - faster side to side
    if (this.tailMesh) {
      const tailKeys = [
        0.0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0
      ];
      
      const tailValues = [
        0, 0, 0,           // Center
        0, 0, 0.3,         // Right
        0, 0, 0,           // Center
        0, 0, -0.3,        // Left
        0, 0, 0,           // Center
        0, 0, 0.3,         // Right
        0, 0, 0,           // Center
        0, 0, -0.3,        // Left
        0, 0, 0            // Center
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.tailMesh.name}.quaternion`,
        tailKeys,
        tailValues
      ));
    }
    
    // Side fins animation - more pronounced during chase
    if (this.leftFinMesh) {
      const leftFinKeys = [0.0, 0.5, 1.0];
      const leftFinValues = [
        0, 0, 0,           // Normal
        0, 0.2, -0.1,      // Tilted for turning
        0, 0, 0            // Normal
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.leftFinMesh.name}.quaternion`,
        leftFinKeys,
        leftFinValues
      ));
    }
    
    if (this.rightFinMesh) {
      const rightFinKeys = [0.0, 0.5, 1.0];
      const rightFinValues = [
        0, 0, 0,           // Normal
        0, -0.2, 0.1,      // Tilted for turning (opposite)
        0, 0, 0            // Normal
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.rightFinMesh.name}.quaternion`,
        rightFinKeys,
        rightFinValues
      ));
    }
    
    // Body animation - more aggressive stance
    if (this.bodyMesh) {
      const bodyKeys = [0.0, 0.5, 1.0];
      const bodyValues = [
        0, 0.05, 0,        // Slightly nose down
        0, 0.05, 0.08,     // Nose down with roll
        0, 0.05, 0         // Back to nose down
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.bodyMesh.name}.quaternion`,
        bodyKeys,
        bodyValues
      ));
    }
    
    return tracks;
  }
  
  /**
   * Create attack animation tracks
   */
  private createAttackAnimation(): THREE.KeyframeTrack[] {
    const tracks: THREE.KeyframeTrack[] = [];
    
    // Jaw animation for attack
    if (this.jawMesh) {
      const jawKeys = [0.0, 0.2, 0.8, 1.0];
      const jawValues = [
        0, 0, 0,           // Closed
        -0.5, 0, 0,        // Open
        -0.5, 0, 0,        // Stay open
        0, 0, 0            // Close
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.jawMesh.name}.quaternion`,
        jawKeys,
        jawValues
      ));
    }
    
    // Body lunge forward
    if (this.bodyMesh) {
      const bodyKeys = [0.0, 0.3, 0.8, 1.0];
      const bodyPosValues = [
        0, 0, 0,           // Normal
        0, 0, -1.0,        // Lunge forward
        0, 0, -1.0,        // Hold
        0, 0, 0            // Back to normal
      ];
      
      tracks.push(new THREE.VectorKeyframeTrack(
        `${this.bodyMesh.name}.position`,
        bodyKeys,
        bodyPosValues
      ));
      
      // Add body tilt for attack
      const bodyRotKeys = [0.0, 0.2, 0.8, 1.0];
      const bodyRotValues = [
        0, 0, 0,           // Normal
        0.2, 0, 0,         // Tilt down to attack
        0.2, 0, 0,         // Hold
        0, 0, 0            // Back to normal
      ];
      
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${this.bodyMesh.name}.quaternion`,
        bodyRotKeys,
        bodyRotValues
      ));
    }
    
    return tracks;
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(config: SharkConfig): void {
    super.initialize(config);
    
    // Set patrol points if provided
    if (config.patrolPoints && config.patrolPoints.length > 0) {
      this.patrolPoints = config.patrolPoints.map(point => point.clone());
    } else {
      // Create default patrol if none provided
      this.patrolPoints = [
        new THREE.Vector3(this.position.x - 8, this.position.y, this.position.z - 4),
        new THREE.Vector3(this.position.x + 8, this.position.y, this.position.z + 4)
      ];
    }
    
    // Set shark-specific parameters
    this.patrolSpeed = config.patrolSpeed || 5;
    this.detectionRadius = config.detectionRadius || 10;
    this.chaseSpeed = config.chaseSpeed || 8;
    this.canChase = config.canChase !== undefined ? config.canChase : true;
    this.chaseDuration = config.maxChaseDuration || 5;
    this.attackCooldown = config.attackCooldown || 2;
    
    // Reset state
    this.isChasing = false;
    this.isCoolingDown = false;
    this.cooldownTimer = 0;
    this.currentPatrolIndex = 0;
    
    // Start in patrol state
    this.state = 'idle';
    
    // Start swimming animation
    if (this.swimAction) {
      this.swimAction.reset().play();
    }
  }
  
  /**
   * Reset shark for reuse from pool
   */
  public reset(): void {
    super.reset();
    
    // Stop all animations
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    // Reset state variables
    this.isChasing = false;
    this.isCoolingDown = false;
    this.cooldownTimer = 0;
    this.currentPatrolIndex = 0;
    
    // Reset jaw if it exists
    if (this.jawMesh) {
      this.jawMesh.rotation.set(0, 0, 0);
    }
  }
  
  /**
   * Create a shader-based material for the shark body with undulation and countershading
   */
  private createSharkShaderMaterial(): THREE.ShaderMaterial {
    // Vertex shader for body undulation
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vCountershadeFactor; // For countershading effect
      varying float vBodyZ; // Normalized position along body length
      
      uniform float uTime;
      uniform float uWaveFrequency;
      uniform float uWaveAmplitude;
      uniform float uBodyLength;
      
      void main() {
        // Get original position
        vec3 pos = position;
        
        // Calculate normalized position along the shark body (z-axis)
        // Assuming the shark's body is along z-axis before rotation
        vBodyZ = (position.z + uBodyLength * 0.5) / uBodyLength; // 0 (tail) to 1 (head)
        
        // Apply undulation wave along the body - stronger at the tail
        float undulationFactor = 1.0 - vBodyZ; // More movement at tail (lower z)
        float wave = sin(uTime * uWaveFrequency + vBodyZ * 5.0) * uWaveAmplitude;
        
        // Apply wave to x-position, scaled by undulation factor
        pos.x += wave * undulationFactor * 1.5;
        
        // Transform to world space
        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Transform normal to world space for lighting
        vNormal = normalize(normalMatrix * normal);
        
        // Calculate countershading factor based on normal's Y component in world space
        vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vCountershadeFactor = smoothstep(-0.2, 0.6, worldNormal.y); // Y component ranges from -1 (bottom) to 1 (top)
        
        // Final position
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;
    
    // Fragment shader for countershading effect (darker top, lighter bottom)
    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vCountershadeFactor;
      varying float vBodyZ;
      
      uniform vec3 uTopColor; // Dark color for top (countershading)
      uniform vec3 uBottomColor; // Light color for bottom (countershading)
      
      void main() {
        // Basic lighting
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5)); // Light from top-right
        float diffuse = max(dot(normal, lightDir), 0.0);
        
        // Apply countershading - mix between top and bottom colors
        vec3 baseColor = mix(uBottomColor, uTopColor, vCountershadeFactor);
        
        // Add subtle darkening toward the head
        baseColor *= mix(1.0, 0.9, pow(vBodyZ, 3.0));
        
        // Apply lighting with ambient term
        vec3 finalColor = baseColor * (diffuse * 0.6 + 0.4);
        
        // Output final color
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    // Create shader material
    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uTopColor: { value: new THREE.Color(0x404c55) }, // Darker gray-blue for top
        uBottomColor: { value: new THREE.Color(0x909ca5) }, // Lighter gray-white for bottom
        uWaveFrequency: { value: this.waveFrequency },
        uWaveAmplitude: { value: this.waveAmplitude },
        uBodyLength: { value: 4.0 } // Length of shark body
      }
    });
    
    return this.shaderMaterial;
  }

  /**
   * Update shark state and animation
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    super.update(deltaTime, playerPosition, gameSpeed);
    
    // Update shader animation time if using shader material
    if (this.shaderMaterial && this.shaderMaterial.uniforms) {
      this.animationTime += deltaTime;
      this.shaderMaterial.uniforms.uTime.value = this.animationTime;
      
      // Adjust wave parameters based on state
      if (this.state === 'triggered' && this.isChasing) {
        // Faster, more intense undulation during chase
        this.shaderMaterial.uniforms.uWaveFrequency.value = 
          THREE.MathUtils.lerp(this.shaderMaterial.uniforms.uWaveFrequency.value, 4.0, deltaTime * 2);
        this.shaderMaterial.uniforms.uWaveAmplitude.value = 
          THREE.MathUtils.lerp(this.shaderMaterial.uniforms.uWaveAmplitude.value, 0.15, deltaTime * 2);
      } else {
        // Normal undulation during patrol
        this.shaderMaterial.uniforms.uWaveFrequency.value = 
          THREE.MathUtils.lerp(this.shaderMaterial.uniforms.uWaveFrequency.value, this.waveFrequency, deltaTime * 2);
        this.shaderMaterial.uniforms.uWaveAmplitude.value = 
          THREE.MathUtils.lerp(this.shaderMaterial.uniforms.uWaveAmplitude.value, this.waveAmplitude, deltaTime * 2);
      }
    }
    
    // Update the mixer for animations
    if (this.mixer) {
      this.mixer.update(deltaTime * this.timeScale);
    }
    
    // Check if we're in cooldown
    if (this.isCoolingDown) {
      this.cooldownTimer -= deltaTime;
      if (this.cooldownTimer <= 0) {
        this.isCoolingDown = false;
        this.state = 'idle';
      }
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
    
    // Manual animation fallbacks for low quality or if animation system fails
    this.updateFallbackAnimation(deltaTime);
    
    // Update mesh position and rotation to match obstacle
    this.mesh.position.copy(this.position);
    
    // Update collider to match position
    this.updateCollider();
  }
  
  /**
   * Update collider position
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Box3) {
      // Get the size of the box
      const size = new THREE.Vector3(
        this.collider.max.x - this.collider.min.x,
        this.collider.max.y - this.collider.min.y,
        this.collider.max.z - this.collider.min.z
      );
      
      // Compute new min and max from current position
      const halfSize = size.clone().multiplyScalar(0.5);
      
      // Account for shark's current rotation
      const worldHalfSize = new THREE.Vector3(
        halfSize.x * Math.abs(Math.cos(this.rotation.y)) + halfSize.z * Math.abs(Math.sin(this.rotation.y)),
        halfSize.y,
        halfSize.z * Math.abs(Math.cos(this.rotation.y)) + halfSize.x * Math.abs(Math.sin(this.rotation.y))
      );
      
      this.collider.min.copy(this.position).sub(worldHalfSize);
      this.collider.max.copy(this.position).add(worldHalfSize);
    }
  }
  
  /**
   * Update shark in idle state
   */
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Transition to active state when the player gets close enough
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // Enter active state when player is nearby
    if (distanceToPlayer < 50) {
      this.state = 'active';
      
      // Start regular swimming animation
      if (this.swimAction && !this.swimAction.isRunning()) {
        this.swimAction.reset().play();
      }
    }
  }
  
  /**
   * Update shark in active state (patrol behavior)
   */
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Check if player is in detection radius
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    if (this.canChase && distanceToPlayer < this.detectionRadius) {
      // Player detected - transition to chase state
      this.state = 'triggered';
      this.isChasing = true;
      this.chaseStartTime = performance.now() / 1000; // Convert to seconds
      
      // Play chase animation
      this.transitionToAnimation('chase');
      
      // Emit sound effect for shark detection
      eventBus.emit('play-sound', { name: 'shark-detect', volume: 0.6 });
      
      return;
    }
    
    // Continue patrol behavior
    this.updatePatrol(deltaTime, gameSpeed);
  }
  
  /**
   * Update shark in triggered state (player chase)
   */
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    if (this.isChasing) {
      // Calculate chase duration
      const currentTime = performance.now() / 1000;
      const chaseDuration = currentTime - this.chaseStartTime;
      
      // Check if chase should time out
      if (chaseDuration >= this.chaseDuration) {
        this.endChase();
        return;
      }
      
      // Calculate direction to player
      this.targetPosition.copy(playerPosition);
      const direction = new THREE.Vector3()
        .subVectors(this.targetPosition, this.position)
        .normalize();
      
      // Calculate forward direction based on current rotation
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.mesh.quaternion);
      
      // Gradually rotate towards player
      const targetRotation = Math.atan2(direction.x, direction.z);
      let currentRotation = this.rotation.y;
      
      // Normalize angles
      while (targetRotation - currentRotation > Math.PI) currentRotation += Math.PI * 2;
      while (targetRotation - currentRotation < -Math.PI) currentRotation -= Math.PI * 2;
      
      // Rotate toward target with smooth interpolation
      const rotationSpeed = 2.0 * deltaTime; // Adjust for responsive turning
      this.rotation.y = currentRotation + Math.min(
        rotationSpeed,
        Math.max(-rotationSpeed, targetRotation - currentRotation)
      );
      
      // Apply rotation to mesh
      this.mesh.rotation.y = this.rotation.y;
      
      // Move toward player with adjusted speed
      const moveDistance = this.chaseSpeed * deltaTime * this.timeScale;
      
      // Forward movement based on current rotation
      const moveDirection = new THREE.Vector3(
        Math.sin(this.rotation.y), 
        0, 
        Math.cos(this.rotation.y)
      );
      
      // Apply movement
      this.position.add(moveDirection.multiplyScalar(-moveDistance));
      
      // Check if close enough to player to attack
      const attackDistance = 4.0;
      if (this.position.distanceTo(playerPosition) < attackDistance) {
        this.attack();
      }
      
      // Check if shark has lost track of player
      const maxChaseDistance = this.detectionRadius * 1.5;
      if (this.position.distanceTo(playerPosition) > maxChaseDistance) {
        this.endChase();
      }
    }
  }
  
  /**
   * End the chase behavior
   */
  private endChase(): void {
    this.isChasing = false;
    this.state = 'cooldown';
    
    // Transition back to swim animation
    this.transitionToAnimation('swim');
    
    // Start cooldown timer
    this.isCoolingDown = true;
    this.cooldownTimer = this.attackCooldown;
  }
  
  /**
   * Execute attack behavior
   */
  private attack(): void {
    // Play attack animation
    this.transitionToAnimation('attack');
    
    // Emit attack event
    eventBus.emit('shark-attack', {
      position: this.position.clone(),
      rotation: this.rotation.clone()
    });
    
    // Play attack sound
    eventBus.emit('play-sound', { name: 'shark-attack', volume: 0.7 });
    
    // End chase after attack
    this.endChase();
  }
  
  /**
   * Update shark in cooldown state
   */
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Gradually move back to patrol path
    this.updatePatrol(deltaTime * 0.5, gameSpeed);
    
    // Cooldown timer is managed in main update
  }
  
  /**
   * Update patrol behavior
   */
  private updatePatrol(deltaTime: number, gameSpeed: number): void {
    // Skip patrol if no points
    if (this.patrolPoints.length < 2) {
      return;
    }
    
    // Get current target patrol point
    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    
    // Calculate direction to target
    const direction = new THREE.Vector3()
      .subVectors(targetPoint, this.position)
      .normalize();
    
    // Calculate distance to move
    const moveDistance = this.patrolSpeed * deltaTime * this.timeScale;
    
    // Check if we'll reach the target point
    const distanceToTarget = this.position.distanceTo(targetPoint);
    
    if (distanceToTarget <= moveDistance) {
      // Reached point, move to next patrol point
      this.position.copy(targetPoint);
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      // Move toward target point
      this.position.add(direction.multiplyScalar(moveDistance));
    }
    
    // Update rotation to face direction of movement
    if (direction.length() > 0.001) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      
      // Smooth rotation
      let currentRotation = this.rotation.y;
      
      // Normalize angles
      while (targetRotation - currentRotation > Math.PI) currentRotation += Math.PI * 2;
      while (targetRotation - currentRotation < -Math.PI) currentRotation -= Math.PI * 2;
      
      // Apply smooth rotation
      this.rotation.y = THREE.MathUtils.lerp(
        currentRotation,
        targetRotation,
        deltaTime * 2
      );
      
      // Apply rotation to mesh
      this.mesh.rotation.y = this.rotation.y;
    }
  }
  
  /**
   * Transition between animations with crossfade
   */
  private transitionToAnimation(animName: string, duration: number = 0.4): void {
    let targetAction: THREE.AnimationAction | null = null;
    
    switch (animName) {
      case 'swim':
        targetAction = this.swimAction;
        break;
      case 'chase':
        targetAction = this.chaseAction;
        break;
      case 'attack':
        targetAction = this.attackAction;
        break;
    }
    
    if (!targetAction || !this.mixer) {
      return;
    }
    
    // Stop all current actions with fadeOut
    this.mixer.clipAction('swim')?.fadeOut(duration);
    this.mixer.clipAction('chase')?.fadeOut(duration);
    this.mixer.clipAction('attack')?.fadeOut(duration);
    
    // Start target action with fadeIn
    if (animName === 'attack') {
      // For attack, play once and then return to previous state
      targetAction.setLoop(THREE.LoopOnce, 1);
      targetAction.clampWhenFinished = true;
      
      // Set up callback to return to swim animation when attack finishes
      const onFinish = (e: any) => {
        if (e.action === targetAction) {
          this.mixer?.removeEventListener('finished', onFinish);
          this.transitionToAnimation('swim');
        }
      };
      
      this.mixer.addEventListener('finished', onFinish);
    } else {
      targetAction.setLoop(THREE.LoopRepeat, Infinity);
    }
    
    targetAction.reset().fadeIn(duration).play();
  }
  
  /**
   * Fallback animation for when the animation system isn't available
   */
  private updateFallbackAnimation(deltaTime: number): void {
    // Only use fallback if animations aren't running
    if (this.mixer && 
        (this.swimAction?.isRunning() || 
         this.chaseAction?.isRunning() || 
         this.attackAction?.isRunning())) {
      return;
    }
    
    // Animate tail
    if (this.tailMesh) {
      const frequency = this.isChasing ? 5.0 : 2.0;
      const amplitude = this.isChasing ? 0.3 : 0.2;
      
      this.tailRotation += deltaTime * frequency;
      this.tailMesh.rotation.y = Math.sin(this.tailRotation) * amplitude;
    }
    
    // Animate fins
    if (this.leftFinMesh && this.rightFinMesh) {
      const finFrequency = 1.0;
      const finAmplitude = 0.1;
      
      this.finRotation += deltaTime * finFrequency;
      this.leftFinMesh.rotation.x = Math.sin(this.finRotation) * finAmplitude;
      this.rightFinMesh.rotation.x = Math.sin(this.finRotation + Math.PI) * finAmplitude;
    }
    
    // Animate jaw for attack
    if (this.jawMesh && this.state === 'triggered' && Math.random() < 0.02) {
      // Occasionally open and close mouth during chase
      const jawAction = (jawOpen: boolean) => {
        if (this.jawMesh) {
          this.jawMesh.rotation.x = jawOpen ? -0.5 : 0;
        }
      };
      
      // Open jaw
      jawAction(true);
      
      // Close jaw after a short delay
      setTimeout(() => jawAction(false), 200);
    }
  }
  
  /**
   * Collision response - called when player collides with shark
   */
  public onCollision(): void {
    super.onCollision();
    
    // Trigger attack animation on collision
    this.transitionToAnimation('attack');
    
    // Play attack sound
    eventBus.emit('play-sound', { name: 'shark-attack', volume: 0.8 });
  }
}