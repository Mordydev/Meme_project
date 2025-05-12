import * as THREE from 'three';

/**
 * Represents a double score power-up asset in the game
 */
export class DoubleScorePowerUpAsset {
  private mesh: THREE.Mesh;
  private animationSpeed: number = 0.02;
  private animationAmplitude: number = 0.1;
  private initialY: number;
  private glowEffect: THREE.PointLight;
  private active: boolean = true;

  /**
   * Creates a new double score power-up asset
   * @param position The initial position of the power-up
   */
  constructor(position: THREE.Vector3) {
    // Create a group to hold the double score visual components
    const scoreGroup = new THREE.Group();
    
    // Create the double score power-up geometry (a star shape)
    const starGeometry = this.createStarGeometry();
    
    // Create double score material with gold/yellow glow effect
    const material = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xff9900,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });

    // Create the star mesh
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.scale.set(0.6, 0.6, 0.15);
    scoreGroup.add(starMesh);
    
    // Add a "2x" text indicator (using a second small star behind it)
    const secondStarMesh = new THREE.Mesh(starGeometry, material);
    secondStarMesh.scale.set(0.4, 0.4, 0.1);
    secondStarMesh.position.z = -0.1;
    secondStarMesh.rotation.z = Math.PI / 10; // Slightly rotated
    scoreGroup.add(secondStarMesh);

    // Create a container mesh to hold everything
    const container = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.mesh = new THREE.Mesh(container, new THREE.MeshBasicMaterial({ visible: false }));
    this.mesh.add(scoreGroup);

    // Set position
    this.mesh.position.copy(position);
    this.initialY = position.y;
    
    // Add glow effect using point light
    this.glowEffect = new THREE.PointLight(0xffcc00, 1, 2);
    this.glowEffect.position.copy(position);
    this.mesh.add(this.glowEffect);

    // Set user data for collision detection
    this.mesh.userData = {
      type: 'powerup',
      subtype: 'doublescore',
      collider: true
    };
  }

  /**
   * Creates a star-shaped geometry for the double score power-up
   * @returns The star geometry
   */
  private createStarGeometry(): THREE.BufferGeometry {
    const vertices = [];
    const numPoints = 5; // 5-pointed star
    const outerRadius = 0.5;
    const innerRadius = 0.2;
    
    // Create the star points
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / numPoints) * i;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      vertices.push(new THREE.Vector3(x, y, 0));
    }
    
    // Create the star shape
    const starShape = new THREE.Shape();
    starShape.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      starShape.lineTo(vertices[i].x, vertices[i].y);
    }
    starShape.lineTo(vertices[0].x, vertices[0].y);
    
    // Create extruded geometry from the star shape
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3
    };
    
    return new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  }

  /**
   * Gets the 3D mesh representing the double score power-up
   * @returns The THREE.Mesh object
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Updates the double score power-up animation
   * @param deltaTime Time since last update
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Animate the double score power-up with floating motion
    this.mesh.position.y = this.initialY + Math.sin(Date.now() * this.animationSpeed) * this.animationAmplitude;
    
    // Rotate the double score power-up
    this.mesh.rotation.y += deltaTime * 1.0;
    
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