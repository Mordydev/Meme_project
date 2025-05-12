import * as THREE from 'three';

/**
 * Represents a magnet power-up asset in the game
 */
export class MagnetPowerUpAsset {
  private mesh: THREE.Mesh;
  private animationSpeed: number = 0.02;
  private animationAmplitude: number = 0.1;
  private initialY: number;
  private glowEffect: THREE.PointLight;
  private active: boolean = true;

  /**
   * Creates a new magnet power-up asset
   * @param position The initial position of the power-up
   */
  constructor(position: THREE.Vector3) {
    // Create the magnet power-up geometry (a horseshoe shape)
    const magnet = new THREE.Group();
    
    // Create main body of the magnet (a horseshoe)
    const torusGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 24, Math.PI);
    
    // Create magnet material with red/purple glow effect
    const material = new THREE.MeshStandardMaterial({
      color: 0xcc2299,
      emissive: 0x990066,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.2
    });

    // Create the horseshoe part of the magnet
    const horseshoe = new THREE.Mesh(torusGeometry, material);
    horseshoe.rotation.x = Math.PI / 2;
    magnet.add(horseshoe);
    
    // Add small cylinder ends to the magnet
    const endGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.15, 8);
    
    // Left end
    const leftEnd = new THREE.Mesh(endGeometry, material);
    leftEnd.position.set(-0.3, 0, 0.3);
    leftEnd.rotation.x = Math.PI / 2;
    magnet.add(leftEnd);
    
    // Right end
    const rightEnd = new THREE.Mesh(endGeometry, material);
    rightEnd.position.set(0.3, 0, 0.3);
    rightEnd.rotation.x = Math.PI / 2;
    magnet.add(rightEnd);
    
    // Create a container mesh to hold everything
    const container = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.mesh = new THREE.Mesh(container, new THREE.MeshBasicMaterial({ visible: false }));
    this.mesh.add(magnet);

    // Set position
    this.mesh.position.copy(position);
    this.initialY = position.y;
    
    // Add glow effect using point light
    this.glowEffect = new THREE.PointLight(0xcc2299, 1, 2);
    this.glowEffect.position.copy(position);
    this.mesh.add(this.glowEffect);

    // Set user data for collision detection
    this.mesh.userData = {
      type: 'powerup',
      subtype: 'magnet',
      collider: true
    };
  }

  /**
   * Gets the 3D mesh representing the magnet power-up
   * @returns The THREE.Mesh object
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Updates the magnet power-up animation
   * @param deltaTime Time since last update
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Animate the magnet power-up with floating motion
    this.mesh.position.y = this.initialY + Math.sin(Date.now() * this.animationSpeed) * this.animationAmplitude;
    
    // Rotate the magnet power-up
    this.mesh.rotation.y += deltaTime * 1.2;
    
    // Pulse the glow effect
    const pulseIntensity = 0.8 + 0.4 * Math.sin(Date.now() * 0.004);
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
    // Dispose of all geometries and materials in the group
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Remove from parent if it has one
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}