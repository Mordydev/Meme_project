import * as THREE from 'three';

export type MaterialType = 'player_default' | 'obstacle_rock' | 'collectible_bubble' | 'environment_water' | 'obstacle_coral';

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

    const waterFloorMaterial = new THREE.MeshPhongMaterial({ color: 0x335599, side: THREE.DoubleSide }); // Darker blue for floor
    this.materials.set('environment_water', waterFloorMaterial);

    const coralMaterial = new THREE.MeshPhongMaterial({ color: 0xff7f50 }); // Coral color
    this.materials.set('obstacle_coral', coralMaterial);

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