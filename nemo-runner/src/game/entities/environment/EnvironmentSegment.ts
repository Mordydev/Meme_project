import * as THREE from 'three';
import { EnvironmentTheme, EnvironmentType } from './EnvironmentTypes';
import { DecorationDefinition, getDecorationsForEnvironment } from './DecorationDefinitions';

/**
 * Environment segment representing a portion of the underwater environment
 */
export class EnvironmentSegment {
  mesh: THREE.Group;
  decorations: THREE.Group;
  bounds: THREE.Box3;
  isActive: boolean = true;
  segmentLength: number;
  segmentType: EnvironmentType;
  
  constructor(
    scene: THREE.Scene,
    theme: EnvironmentTheme,
    position: THREE.Vector3,
    segmentLength: number,
    segmentWidth: number,
    createDecorations: boolean = true
  ) {
    this.segmentType = theme.type;
    this.segmentLength = segmentLength;
    
    // Create segment mesh
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    
    // Create floor geometry
    const floorGeometry = new THREE.PlaneGeometry(segmentWidth, segmentLength, 20, 20);
    
    // Apply some noise to the floor
    if (floorGeometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = floorGeometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        // Y is up in Three.js, but we're creating a horizontal plane so we want to perturb Z
        const y = Math.random() * 0.3 - 0.15;
        positions[i * 3 + 2] = y;
      }
      floorGeometry.attributes.position.needsUpdate = true;
      floorGeometry.computeVertexNormals();
    }
    
    // Create floor material
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: theme.floorColor,
      roughness: theme.floorRoughness,
      metalness: theme.floorMetalness,
      side: THREE.DoubleSide
    });
    
    // Create floor mesh
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2; // Rotate to be horizontal
    floor.position.y = -2; // Position below the camera
    
    // Add floor to segment
    this.mesh.add(floor);
    
    // Create decorations group
    this.decorations = new THREE.Group();
    this.mesh.add(this.decorations);
    
    // Add segment to scene
    scene.add(this.mesh);
    
    // Create bounding box
    this.bounds = new THREE.Box3().setFromObject(this.mesh);
    
    // Add decorations if needed
    if (createDecorations) {
      this.addDecorations(theme);
    }
  }
  
  /**
   * Add decorations to the segment based on the environment theme
   * @param theme The environment theme to use for generating decorations
   */
  private addDecorations(theme: EnvironmentTheme): void {
    // Filter decorations for current environment type
    const availableDecorations = getDecorationsForEnvironment(theme.type);
    
    if (availableDecorations.length === 0) return;
    
    // Calculate total probability weight
    const totalWeight = availableDecorations.reduce((sum, def) => sum + def.probability, 0);
    
    // Calculate number of decorations based on density and segment size
    const decorationCount = Math.floor(theme.decorationDensity * this.segmentLength / 10);
    
    // This method would normally call the ProceduralEnvironment's createDecoration method
    // Since we're modularizing, we'll leave this as a stub
    // Actual implementation will happen in ProceduralEnvironment
  }
  
  /**
   * Update the segment for animations etc.
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void {
    // Here we would animate elements like seaweed, jellyfish, etc.
  }
  
  /**
   * Dispose of segment resources
   */
  dispose(): void {
    // Remove from scene (should be done by parent)
    
    // Dispose of geometries and materials
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        }
      }
    });
  }
  
  /**
   * Check if this segment is visible to the camera
   * @param camera The camera to check visibility against
   * @returns True if the segment is visible to the camera
   */
  isVisibleToCamera(camera: THREE.Camera): boolean {
    // Create a frustum from the camera
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    // Check if the segment's bounding box is in the frustum
    return frustum.intersectsBox(this.bounds);
  }
}