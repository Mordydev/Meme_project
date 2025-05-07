import * as THREE from 'three';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { getDeviceCapabilities } from '../../utils/DeviceUtils';
import eventBus from '../../core/EventSystem';
import { ShaderLibrary, createShaderWithLibrary } from '../../utils/ShaderLibrary';
import { ObstacleUtils } from './ObstacleUtils';

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
  
  // Quality level for device capability
  private qualityLevel: number = 1; // Default to medium quality
  
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
    
    try {
      // Create the shark mesh
      this.mesh = this.createSharkMesh();
      
      // Set up animation mixer
      this.mixer = new THREE.AnimationMixer(this.mesh);
      
      // Identify body parts for animation
      this.identifyBodyParts();
      
      // Set up animations
      this.setupAnimations();
      
      // Add shadow casting
      this.mesh.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
    } catch (error) {
      // Handle mesh creation failure with a visible placeholder
      console.error('Error creating shark mesh:', error);
      
      try {
        // Try to use the PlaceholderGenerator if available
        const { PlaceholderGenerator } = require('../../utils/PlaceholderGenerator');
        this.mesh = PlaceholderGenerator.createEntityPlaceholder('shark');
        
        // Create a minimal mixer for the placeholder
        this.mixer = new THREE.AnimationMixer(this.mesh);
      } catch (placeholderError) {
        // Use ObstacleUtils error placeholder
        console.error('Error creating shark placeholder:', placeholderError);
        this.mesh = ObstacleUtils.createErrorPlaceholder('shark');
        
        // Create a minimal mixer for the fallback
        this.mixer = new THREE.AnimationMixer(this.mesh);
      }
    }
    
    // Create collider - elongated box for the shark's body
    this.collider = new THREE.Box3(
      new THREE.Vector3(-0.8, -0.6, -3.5),
      new THREE.Vector3(0.8, 0.6, 3.5)
    );
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
    
    // Get LOD level based on device capability
    const lodLevel = ObstacleUtils.getLODLevel(this.qualityLevel);
    
    // Determine detail level based on LOD
    const segmentDetail = lodLevel === 0 ? 16 : 
                          lodLevel === 1 ? 12 : 8;
    
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
    
    // Use ObstacleUtils to optimize geometry based on quality level
    const optimizedBodyGeometry = ObstacleUtils.optimizeGeometry(bodyGeometry, this.qualityLevel);
    
    // Materials - use materials caching from ObstacleUtils
    let bodyMaterial: THREE.Material;
    
    if (lodLevel === 0) {
      // For high quality, use shader-based material for undulation and countershading
      bodyMaterial = this.createSharkShaderMaterial();
    } else {
      // For medium and low quality, use cached materials
      const materialKey = `shark_body_${lodLevel}`;
      
      bodyMaterial = ObstacleUtils.getMaterial(materialKey, () => {
        if (lodLevel === 1) {
          // Medium quality
          return ObstacleUtils.createStandardMaterial(
            '#505a64', // Shark grey
            {
              roughness: 0.8,
              metalness: 0.1
            },
            this.qualityLevel
          );
        } else {
          // Low quality
          return ObstacleUtils.createStandardMaterial(
            '#505a64',
            {
              roughness: 0.9,
              metalness: 0.0
            },
            this.qualityLevel
          );
        }
      });
    }
    
    // Create the body mesh
    const body = new THREE.Mesh(optimizedBodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Align horizontally
    body.name = 'body_mesh';
    bodyGroup.add(body);
    
    // Create head with more detail
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    
    // Add eyes - use shared geometries and materials
    const eyeGeometryKey = `eye_geometry_${lodLevel}`;
    const eyeGeometry = ObstacleUtils.getGeometry(eyeGeometryKey, () => {
      return new THREE.SphereGeometry(0.12, 8, 8);
    });
    
    const eyeMaterialKey = 'eye_material';
    const eyeMaterial = ObstacleUtils.getMaterial(eyeMaterialKey, () => {
      return new THREE.MeshBasicMaterial({ color: 0x000000 });
    });
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.5, 0.4, -1.6);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.5, 0.4, -1.6);
    
    // Add eye highlights for better visual quality in medium/high
    if (lodLevel < 2) {
      const highlightGeometryKey = `highlight_geometry_${lodLevel}`;
      const highlightGeometry = ObstacleUtils.getGeometry(highlightGeometryKey, () => {
        return new THREE.SphereGeometry(0.04, 6, 6);
      });
      
      const highlightMaterialKey = 'highlight_material';
      const highlightMaterial = ObstacleUtils.getMaterial(highlightMaterialKey, () => {
        return new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.7
        });
      });
      
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
    
    const jawGeometryKey = `jaw_geometry_${lodLevel}`;
    const jawGeometry = ObstacleUtils.getGeometry(jawGeometryKey, () => {
      return new THREE.BoxGeometry(0.9, 0.3, 1.0);
    });
    
    const jawMaterialKey = 'jaw_material';
    const jawMaterial = ObstacleUtils.getMaterial(jawMaterialKey, () => {
      return ObstacleUtils.createStandardMaterial(
        '#505a64',
        {
          roughness: 0.8,
          metalness: 0.1
        },
        this.qualityLevel
      );
    });
    
    const jaw = new THREE.Mesh(jawGeometry, jawMaterial);
    jaw.position.set(0, -0.3, -1.8);
    
    // Add teeth for high and medium quality
    if (lodLevel < 2) {
      const teethCount = lodLevel === 0 ? 8 : 6;
      
      const teethGeometryKey = `teeth_geometry_${lodLevel}`;
      const teethGeometry = ObstacleUtils.getGeometry(teethGeometryKey, () => {
        return new THREE.ConeGeometry(0.05, 0.1, 3);
      });
      
      const teethMaterialKey = 'teeth_material';
      const teethMaterial = ObstacleUtils.getMaterial(teethMaterialKey, () => {
        return new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
      });
      
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
    
    const tailGeometryKey = `tail_geometry_${lodLevel}`;
    const tailGeometry = ObstacleUtils.getGeometry(tailGeometryKey, () => {
      const geom = new THREE.BoxGeometry(0.1, 1.2, 1.5);
      geom.translate(0, 0, 1.0); // Offset for better pivot point
      return geom;
    });
    
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, 2.0); // Position at back of shark
    
    // Create tail fins - simplified for lower quality levels
    const tailFinGeometryKey = `tail_fin_geometry_${lodLevel}`;
    const tailFinGeometry = ObstacleUtils.getGeometry(tailFinGeometryKey, () => {
      // Create a triangular shape for the tail fin
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0.0, 0.0, 0.0,    // center point
        0.0, 1.0, -0.5,   // top tip
        0.0, -1.0, -0.5   // bottom tip
      ]);
      
      const indices = [0, 1, 2];
      
      geom.setIndex(indices);
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();
      return geom;
    }) as THREE.BufferGeometry;
    
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
    
    // Side fins - reuse geometry for both fins
    const sideFinGeometry = this.createFinGeometry(0.8, 0.4);
    
    // Left fin
    const leftFinGroup = new THREE.Group();
    leftFinGroup.name = 'left_fin';
    
    const leftFin = new THREE.Mesh(sideFinGeometry, bodyMaterial);
    leftFin.rotation.order = 'YXZ';
    leftFin.rotation.y = Math.PI / 2;
    leftFin.rotation.x = Math.PI / 4;
    leftFin.position.set(0.8, -0.2, -0.5);
    
    leftFinGroup.add(leftFin);
    bodyGroup.add(leftFinGroup);
    
    // Right fin - reuse the same geometry
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
      #include <animation>
      #include <transition>
      
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;
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
        
        // Use the oscillate function from the animation library
        float wave = oscillate(uTime, uWaveFrequency, uWaveAmplitude, vBodyZ * 5.0);
        
        // Apply wave to x-position, scaled by undulation factor
        pos.x += wave * undulationFactor * 1.5;
        
        // Transform to world space
        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Calculate view position for lighting
        vec4 mvPosition = viewMatrix * worldPosition;
        vViewPosition = -mvPosition.xyz;
        
        // Transform normal to world space for lighting
        vNormal = normalize(normalMatrix * normal);
        
        // Calculate countershading factor based on normal's Y component in world space
        vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vCountershadeFactor = transitionMask(worldNormal.y, -0.2, 0.6, 0.8); // Using transition library function
        
        // Final position
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Fragment shader for countershading effect (darker top, lighter bottom)
    const fragmentShader = `
      #include <lighting>
      #include <color>
      
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;
      varying float vCountershadeFactor;
      varying float vBodyZ;
      
      uniform vec3 uTopColor; // Dark color for top (countershading)
      uniform vec3 uBottomColor; // Light color for bottom (countershading)
      
      void main() {
        // Get normalized vectors for lighting
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5)); // Light from top-right
        
        // Apply countershading - mix between top and bottom colors
        vec3 baseColor = mix(uBottomColor, uTopColor, vCountershadeFactor);
        
        // Add subtle darkening toward the head
        baseColor *= mix(1.0, 0.9, pow(vBodyZ, 3.0));
        
        // Calculate lighting using the shader library function
        vec3 lightColor = vec3(1.0, 1.0, 0.95);
        float specularPower = 64.0;
        float specularIntensity = 0.15;
        
        vec3 litColor = calculateLighting(
          normal,
          viewDir,
          lightDir,
          lightColor,
          baseColor,
          specularPower,
          specularIntensity
        );
        
        // Add ambient light
        litColor = litColor * 0.65 + baseColor * 0.35;
        
        // Output final color
        gl_FragColor = vec4(litColor, 1.0);
      }
    `;
    
    // Process the shaders with the library
    const processedShaders = createShaderWithLibrary(vertexShader, fragmentShader);
    
    // Create shader material
    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
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
    
    // Calculate distance to player for LOD and animation optimization
    const distanceToPlayer = this.position.distanceTo(playerPosition);
    
    // Update shader animation time if using shader material - only for high quality and when visible
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
    
    // Use optimized animation updates based on distance and quality
    if (this.mixer) {
      // Only update animation when necessary based on distance and quality
      if (ObstacleUtils.shouldUpdateAnimation(this.mixer, distanceToPlayer, this.qualityLevel)) {
        this.mixer.update(deltaTime * this.timeScale);
      }
    }
    
    // Check if we're in cooldown
    if (this.isCoolingDown) {
      this.cooldownTimer -= deltaTime;
      if (this.cooldownTimer <= 0) {
        this.isCoolingDown = false;
        this.state = 'idle';
      }
    }
    
    // Update based on current state - only if within active range
    // This prevents unnecessary computation for far-away obstacles
    if (distanceToPlayer < 100 || this.state === 'triggered' || this.isChasing) {
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
      // Only update fallback animations for nearby sharks or when in triggered state
      if (distanceToPlayer < 50 || this.state === 'triggered' || this.isChasing) {
        this.updateFallbackAnimation(deltaTime);
      }
    }
    
    // Update mesh position and rotation to match obstacle
    this.mesh.position.copy(this.position);
    
    // Update collider to match position
    this.updateCollider();
  }
  
  // Static halfSize vector for reuse across all shark instances
  private static halfSize = new THREE.Vector3(0.8, 0.6, 3.5);
  
  /**
   * Update collider position with optimized implementation
   * Uses the centralized ObstacleUtils for maximum efficiency
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Box3) {
      // Use ObstacleUtils to update the box collider
      // This eliminates redundant vector allocations and calculations
      ObstacleUtils.updateBoxCollider(
        this.collider,
        this.position,
        Shark.halfSize,
        this.rotation.y
      );
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