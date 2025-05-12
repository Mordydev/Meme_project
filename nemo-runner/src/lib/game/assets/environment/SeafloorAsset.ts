import * as THREE from 'three';
import { ShaderManager, MaterialType } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { LightingManager } from '../../services/LightingManager';

export class SeafloorAsset {
  private shaderManager: ShaderManager;
  private lightingManager: LightingManager | null = null;
  public segmentWidth: number;
  public segmentLength: number; // Depth along Z
  private useCaustics: boolean;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    // Dimensions for a single seafloor segment
    // Could also come from configSystem if more complex
    this.segmentWidth = configSystem.getWorldXBoundary() * 2 + configSystem.getPlayerLaneWidth() * 3; // Rough estimate
    this.segmentLength = 20; // Example length
    this.useCaustics = configSystem.get('visuals').enableCaustics;
  }

  /**
   * Links the LightingManager to enable caustic effects on seafloor
   * @param lightingManager The game's LightingManager instance
   */
  public linkLightingManager(lightingManager: LightingManager): void {
    this.lightingManager = lightingManager;
    console.log("SeafloorAsset: Linked with LightingManager for caustic effects");
  }

  /**
   * Creates a seafloor segment mesh with proper material and shaders
   */
  public createMesh(): THREE.Mesh {
    // If we have a LightingManager and caustics are enabled, use it to create the seafloor
    if (this.lightingManager && this.useCaustics) {
      return this.lightingManager.createCausticSeafloor(this.segmentWidth, this.segmentLength);
    }

    // Otherwise, use the legacy approach
    const geometry = new THREE.PlaneGeometry(this.segmentWidth, this.segmentLength, 32, 32);
    // Rotate plane to be horizontal
    geometry.rotateX(-Math.PI / 2);

    // Check if we have a seafloor shader in the ShaderManager
    let material: THREE.Material | null = null;

    try {
      // First try to use the seafloorShader
      material = this.shaderManager.createShaderMaterial('seafloorShader');
    } catch (error) {
      // If that fails, fall back to basic materials
      console.warn("SeafloorAsset: Custom seafloor shader not available, using fallback material");
    }

    // If no shader material, use the basic material
    if (!material) {
      material = this.shaderManager.getMaterial('environment_water')
                || new THREE.MeshPhongMaterial({
                    color: 0x335599,
                    side: THREE.DoubleSide,
                    flatShading: false,
                });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "SeafloorSegment";

    return mesh;
  }
} 