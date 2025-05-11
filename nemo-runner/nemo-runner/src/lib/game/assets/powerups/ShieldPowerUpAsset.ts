import * as THREE from 'three';

/**
 * Represents a shield power-up asset in the game
 */
export class ShieldPowerUpAsset {
  private mesh: THREE.Mesh;
  private animationSpeed: number = 0.02;
  private animationAmplitude: number = 0.1;
  private initialY: number;
  private glowEffect: THREE.PointLight;
  private active: boolean = true;

  /**
   * Creates a new shield power-up asset
   * @param position The initial position of the power-up
   */
  constructor(position: THREE.Vector3) {
    // Create the shield power-up geometry (a simple sphere)
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    // Create shield material with blue glow effect
    const material = new THREE.MeshStandardMaterial({
      color: 0x00a0ff,
      emissive: 0x0044ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });

    // Create the mesh and set its position
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.initialY = position.y;

    // Add glow effect using point light
    this.glowEffect = new THREE.PointLight(0x00a0ff, 1, 2);
    this.glowEffect.position.copy(position);
    this.mesh.add(this.glowEffect);

    // Set user data for collision detection
    this.mesh.userData = {
      type: 'powerup',
      subtype: 'shield',
      collider: true
    };
  }

  /**
   * Gets the 3D mesh representing the shield power-up
   * @returns The THREE.Mesh object
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Updates the shield power-up animation
   * @param deltaTime Time since last update
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Animate the shield power-up with floating motion
    this.mesh.position.y = this.initialY + Math.sin(Date.now() * this.animationSpeed) * this.animationAmplitude;
    
    // Rotate the shield power-up
    this.mesh.rotation.y += deltaTime * 1.5;
    
    // Pulse the glow effect
    const pulseIntensity = 0.8 + 0.4 * Math.sin(Date.now() * 0.003);
    this.glowEffect.intensity = pulseIntensity;
  }

  /**
   * Collects the power-up (called when player collects it)
   */
  collect(): void {
    this.active = false;
    this.mesh.visible = false;
    
    // Disable collision detection
    this.mesh.userData.collider = false;
  }

  /**
   * Checks if the power-up is still active (not collected)
   * @returns True if the power-up is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Resets the power-up to its initial state
   */
  reset(): void {
    this.active = true;
    this.mesh.visible = true;
    this.mesh.userData.collider = true;
  }

  /**
   * Disposes of the power-up resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    
    // Remove from parent if it has one
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}