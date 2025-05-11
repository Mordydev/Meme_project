import * as THREE from 'three';

export type MaterialType = 'player_default' | 'obstacle_rock' | 'obstacle_clam' | 'collectible_bubble' | 'collectible_coin' | 'environment_water' | 'obstacle_coral' | 'powerup_shield' | 'powerup_magnet' | 'powerup_doublescore';

export class ShaderManager {
  private materials: Map<MaterialType, THREE.Material>;

  constructor() {
    this.materials = new Map();
    this.initializeDefaultMaterials();
    console.log("ShaderManager: Initialized.");
  }

  private initializeDefaultMaterials(): void {
    // For now, these are basic materials. Later they will be custom shaders.
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500 }); // Orange
    this.materials.set('player_default', playerMaterial);

    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Grey
    this.materials.set('obstacle_rock', rockMaterial);

    const clamMaterial = new THREE.MeshPhongMaterial({ color: 0xe0d1b0, shininess: 60 }); // Sandy beige with shine
    this.materials.set('obstacle_clam', clamMaterial);

    const waterFloorMaterial = new THREE.MeshPhongMaterial({ color: 0x335599, side: THREE.DoubleSide }); // Darker blue for floor
    this.materials.set('environment_water', waterFloorMaterial);

    const coralMaterial = new THREE.MeshPhongMaterial({ color: 0xff7f50 }); // Coral color
    this.materials.set('obstacle_coral', coralMaterial);

    // Collectible materials - good visibility without being extreme
    const bubbleMaterial = new THREE.MeshPhongMaterial({
      color: 0x66ccff, // Bright blue-cyan for visibility
      transparent: true,
      opacity: 0.8, // More opaque for better visibility while still transparent
      shininess: 90,
      emissive: 0x112233, // Subtle inner glow
      emissiveIntensity: 0.4 // Moderate glow
    });
    this.materials.set('collectible_bubble', bubbleMaterial);

    const coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Gold
      metalness: 0.7,
      roughness: 0.3, // Fairly shiny without being extreme
      emissive: 0x554400, // Subtle gold glow
      emissiveIntensity: 0.3 // Moderate glow
    });
    this.materials.set('collectible_coin', coinMaterial);

    // Power-up materials
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x00a0ff, // Bright blue
      emissive: 0x0044ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });
    this.materials.set('powerup_shield', shieldMaterial);

    const magnetMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc2299, // Purple/magenta
      emissive: 0x990066,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.2
    });
    this.materials.set('powerup_magnet', magnetMaterial);

    const doubleScoreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00, // Gold/yellow
      emissive: 0xff9900,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    this.materials.set('powerup_doublescore', doubleScoreMaterial);

    // Add more placeholders as needed
    console.log("ShaderManager: Default materials initialized.");
  }

  public getMaterial(type: MaterialType): THREE.Material | undefined {
    if (!this.materials.has(type)) {
        console.warn(`ShaderManager: Material type "${type}" not found. Creating a fallback basic material.`);
        // Fallback for undefined materials during development
        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }); // Magenta wireframe
        this.materials.set(type, fallbackMaterial);
        return fallbackMaterial;
    }
    return this.materials.get(type);
  }

  // Later: methods to load GLSL shaders, create ShaderMaterials, manage uniforms

  public dispose(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
    console.log("ShaderManager: Disposed materials.");
  }
} 