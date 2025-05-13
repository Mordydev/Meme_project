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
  private seafloorMaterial: THREE.Material | null = null;

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

    // Use cached material if it exists to prevent shader recompilation issues
    if (!this.seafloorMaterial) {
      try {
        // Create basic material with simple blue color - no shaders
        this.seafloorMaterial = new THREE.MeshStandardMaterial({
          color: 0x335599,
          side: THREE.DoubleSide,
          roughness: 0.8,
          metalness: 0.2
        });
        console.log("SeafloorAsset: Created fallback standard material for seafloor");
      } catch (error) {
        console.warn("SeafloorAsset: Error creating material, using most basic fallback", error);
        // Ultimate fallback - if even MeshStandardMaterial fails
        this.seafloorMaterial = new THREE.MeshBasicMaterial({
          color: 0x335599,
          side: THREE.DoubleSide
        });
      }
    }

    const mesh = new THREE.Mesh(geometry, this.seafloorMaterial);
    mesh.name = "SeafloorSegment";
    mesh.receiveShadow = true;

    return mesh;
  }

  /**
   * Disposes material resources to prevent memory leaks
   */
  public dispose(): void {
    if (this.seafloorMaterial) {
      this.seafloorMaterial.dispose();
      this.seafloorMaterial = null;
    }
  }
} 