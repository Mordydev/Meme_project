import * as THREE from 'three';
import { Obstacle } from './Obstacle';
import { DeviceCapabilities } from '../../utils/DeviceUtils';
import { NoiseGenerator } from '../../utils/NoiseGenerator';

/**
 * Coral obstacle implementation with procedural generation
 */
export class Coral extends Obstacle {
  // Animation properties
  private animationSpeed: number = 0;
  private animationAmplitude: number = 0;
  private baseRotation: THREE.Euler = new THREE.Euler();
  private animationOffset: number = 0;
  
  // Debug visualization flag
  private showCollider: boolean = false;
  
  // Noise generator for procedural generation
  private static noiseGenerator: NoiseGenerator = new NoiseGenerator(Math.PI * 2020); // Consistent seed
  
  constructor(
    position: THREE.Vector3,
    deviceCapabilities?: DeviceCapabilities,
    options: any = {}
  ) {
    // Extract the scene from options if provided
    const scene = options.scene || null;
    
    // Determine quality level with fallback
    const qualityLevel = !deviceCapabilities ? 'medium' :
                     (deviceCapabilities.highEnd ? 'high' : 
                     (deviceCapabilities.midRange ? 'medium' : 'low'));
    
    // Call parent constructor with scene and quality level
    super(scene, qualityLevel);
    
    // Set obstacle-specific properties
    this.obstacleType = 'coral';
    this.position.copy(position);
    
    // Set up collider
    this.collider = new THREE.Sphere(new THREE.Vector3().copy(position), 0.6);
    
    // Create mesh with procedural geometry
    this.mesh = this.createCoralMesh(qualityLevel);
    this.mesh.position.copy(position);
    
    // Add slight rotation for variety
    this.mesh.rotation.y = Math.random() * Math.PI * 2;
    
    // Set up animations and finalize
    this.setupAnimations();
    this.addToScene();
  }
  
  /**
   * Create procedural coral mesh using organic branching
   */
  private createCoralMesh(qualityLevel: 'high' | 'medium' | 'low'): THREE.Group {
    // Create a group to hold all parts
    const coralGroup = new THREE.Group();
    coralGroup.name = 'coral_obstacle';
    
    // Create base (stem) geometry
    const baseHeight = 1.5 + Math.random() * 0.5;
    const baseRadius = 0.2 + Math.random() * 0.15;
    const baseGeometry = this.createCoralBranchGeometry(baseRadius, baseHeight, 12);
    
    // Material with subtle variations in color and roughness
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xfa7a7a),
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true,
    });
    
    // Adjust color based on a random hue variation
    const hueShift = (Math.random() - 0.5) * 0.2;
    baseMaterial.color.offsetHSL(hueShift, 0.1, 0);
    
    // Create base mesh and add to group
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = baseHeight / 2;
    coralGroup.add(baseMesh);
    
    // Determine count of details based on quality level
    const branchCount = qualityLevel === 'low' ? 3 : 
                       (qualityLevel === 'medium' ? 5 : 7);
    
    // Add branches
    for (let i = 0; i < branchCount; i++) {
      this.addCoralBranch(
        coralGroup, 
        baseMesh, 
        baseHeight, 
        baseRadius, 
        baseMaterial.color.clone(),
        qualityLevel
      );
    }
    
    // Add small decorative pieces with level-appropriate detail
    const detailCount = qualityLevel === 'low' ? 8 : 
                       (qualityLevel === 'medium' ? 15 : 25);
    
    for (let i = 0; i < detailCount; i++) {
      this.addCoralDetail(coralGroup, baseHeight, baseMaterial.color.clone());
    }
    
    // Create collision sphere to visualize the collider (removed in production)
    if (this.showCollider) {
      const colliderGeometry = new THREE.SphereGeometry(0.6, 16, 12);
      const colliderMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      const colliderMesh = new THREE.Mesh(colliderGeometry, colliderMaterial);
      coralGroup.add(colliderMesh);
    }
    
    return coralGroup;
  }
  
  /**
   * Create procedural branch geometry
   */
  private createCoralBranchGeometry(
    radius: number, 
    height: number, 
    segments: number
  ): THREE.BufferGeometry {
    // Create a cylinder as the base geometry
    const geometry = new THREE.CylinderGeometry(
      radius * 0.8,  // Top radius (slightly tapered)
      radius,        // Bottom radius
      height,        // Height
      segments,      // Radial segments
      4,             // Height segments
      false          // Open-ended
    );
    
    // Apply noise to vertex positions for organic look
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Skip bottom vertices to keep base flat
      if (vertex.y > -height / 2 + 0.05) {
        // Apply noise based on position using NoiseGenerator
        const noiseAmount = 0.1 * Math.min(1, vertex.y / (height / 2) + 0.5);
        const noiseCoord = new THREE.Vector3(vertex.x * 10, vertex.y * 10, vertex.z * 10);
        const noise = Coral.noiseGenerator.noise3D(
          noiseCoord.x, noiseCoord.y, noiseCoord.z
        ) * noiseAmount;
        
        // More noise higher up the branch
        const heightFactor = (vertex.y + height / 2) / height;
        const radialNoiseCoord = new THREE.Vector3(vertex.x * 15, 0, vertex.z * 15);
        const radialNoise = Coral.noiseGenerator.noise2D(
          radialNoiseCoord.x, radialNoiseCoord.z
        ) * noiseAmount * heightFactor;
        
        // Apply the noise
        vertex.x += noise + radialNoise * vertex.x;
        vertex.z += noise + radialNoise * vertex.z;
        
        // Add slight bend
        const bendFactor = heightFactor * heightFactor * 0.2;
        vertex.x += bendFactor * (Math.random() - 0.5);
        vertex.z += bendFactor * (Math.random() - 0.5);
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Update geometry
    geometry.computeVertexNormals();
    positions.needsUpdate = true;
    
    return geometry;
  }
  
  /**
   * Add a branch to the coral structure
   */
  private addCoralBranch(
    parent: THREE.Group, 
    baseMesh: THREE.Mesh, 
    baseHeight: number, 
    baseRadius: number,
    baseColor: THREE.Color,
    qualityLevel: 'high' | 'medium' | 'low'
  ): void {
    // Determine branch parameters
    const branchHeight = baseHeight * (0.4 + Math.random() * 0.5);
    const branchRadius = baseRadius * (0.3 + Math.random() * 0.4);
    const segments = Math.max(6, Math.floor(8 * branchRadius / baseRadius));
    
    // Create branch geometry
    const branchGeometry = this.createCoralBranchGeometry(branchRadius, branchHeight, segments);
    
    // Vary the color slightly from the base
    const branchMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().offsetHSL(
        (Math.random() - 0.5) * 0.1,  // Slight hue variation
        Math.random() * 0.2,          // Saturation variation
        (Math.random() - 0.5) * 0.2   // Lightness variation
      ),
      roughness: 0.7 + Math.random() * 0.2,
      metalness: 0.1 + Math.random() * 0.2,
      flatShading: true
    });
    
    // Create branch mesh
    const branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);
    
    // Position branch along the base mesh's height
    const heightPosition = Math.random() * 0.7 + 0.2; // 20%-90% of base height
    const angle = Math.random() * Math.PI * 2;
    const radialDistance = baseRadius * 0.8;
    
    branchMesh.position.set(
      Math.cos(angle) * radialDistance,
      baseHeight * heightPosition,
      Math.sin(angle) * radialDistance
    );
    
    // Rotate branch outward from center
    const outwardAngle = Math.atan2(branchMesh.position.z, branchMesh.position.x);
    branchMesh.rotation.x = (Math.random() - 0.5) * 0.5;
    branchMesh.rotation.z = -outwardAngle + (Math.random() - 0.5) * 0.5;
    branchMesh.rotation.y = (Math.random() - 0.5) * 0.5;
    
    // Add to parent
    parent.add(branchMesh);
    
    // Recursively add sub-branches (but limited for performance)
    // Only add sub-branches for medium and high quality levels
    if (branchRadius > baseRadius * 0.2 && Math.random() < 0.7 && qualityLevel !== 'low') {
      const subBranchCount = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < subBranchCount; i++) {
        this.addCoralBranch(
          parent, 
          branchMesh, 
          branchHeight, 
          branchRadius, 
          branchMaterial.color.clone(),
          qualityLevel
        );
      }
    }
  }
  
  /**
   * Add small decorative detail to coral
   */
  private addCoralDetail(
    parent: THREE.Group, 
    baseHeight: number, 
    baseColor: THREE.Color
  ): void {
    // Choose a detail type
    const detailType = Math.floor(Math.random() * 3);
    let detailGeometry: THREE.BufferGeometry;
    let scale = 0.15 + Math.random() * 0.2;
    
    switch (detailType) {
      case 0: // Small sphere
        detailGeometry = new THREE.SphereGeometry(scale, 8, 6);
        break;
      case 1: // Small cone
        detailGeometry = new THREE.ConeGeometry(scale, scale * 2, 8);
        break;
      case 2: // Small cylinder
        detailGeometry = new THREE.CylinderGeometry(
          scale * 0.5, scale, scale * 1.5, 8, 1
        );
        break;
      default: // Fallback to sphere if somehow detailType is out of range
        detailGeometry = new THREE.SphereGeometry(scale, 8, 6);
        break;
    }
    
    // Create slightly more saturated material for details
    const detailMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().offsetHSL(
        (Math.random() - 0.5) * 0.2,  // More hue variation than branches
        0.1 + Math.random() * 0.3,    // Higher saturation
        (Math.random() - 0.5) * 0.3   // More lightness variation
      ),
      roughness: 0.6,
      metalness: 0.2,
      flatShading: true
    });
    
    // Create detail mesh
    const detailMesh = new THREE.Mesh(detailGeometry, detailMaterial);
    
    // Position randomly on the coral structure
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.3 + Math.random() * 0.6;
    const height = Math.random() * baseHeight * 0.9;
    
    detailMesh.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    
    // Random rotation
    detailMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    // Add to parent
    parent.add(detailMesh);
  }
  
  /**
   * Add the coral to the scene
   */
  private addToScene(): void {
    if (this.scene && this.mesh && !this.mesh.parent) {
      this.scene.add(this.mesh);
    }
  }
  
  /**
   * Set up gentle swaying animation
   */
  protected setupAnimations(): void {
    // Use different animation patterns for corals
    this.animationSpeed = 0.3 + Math.random() * 0.3;
    this.animationAmplitude = 0.02 + Math.random() * 0.03;
    this.baseRotation = this.mesh.rotation.clone();
    this.animationOffset = Math.random() * Math.PI * 2;
  }
  
  /**
   * Update coral animations
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    super.update(deltaTime, playerPosition, gameSpeed);
    
    if (this.mesh) {
      // Add subtle swaying motion
      const time = performance.now() * 0.001;
      
      // Gentle side-to-side sway
      this.mesh.rotation.z = this.baseRotation.z + 
        Math.sin(time * this.animationSpeed + this.animationOffset) * this.animationAmplitude;
      
      // Subtle forward/backward sway
      this.mesh.rotation.x = this.baseRotation.x + 
        Math.sin(time * this.animationSpeed * 0.7 + this.animationOffset) * this.animationAmplitude * 0.5;
    }
  }
  
  /**
   * Update collider to match current position
   */
  protected updateCollider(): void {
    if (this.collider instanceof THREE.Sphere) {
      this.collider.center.copy(this.position);
    }
  }
  
  /**
   * Update idle state behavior
   */
  protected updateIdle(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Basic idle state for coral - it mostly stays still
  }
  
  /**
   * Update active state behavior
   */
  protected updateActive(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Coral doesn't have much active behavior, it's mostly passive
  }
  
  /**
   * Update triggered state behavior
   */
  protected updateTriggered(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Coral reaction to collision
  }
  
  /**
   * Update cooldown state behavior
   */
  protected updateCooldown(deltaTime: number, playerPosition: THREE.Vector3, gameSpeed: number): void {
    // Return to normal state after interaction
  }
}