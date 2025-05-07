import * as THREE from 'three';
import { EnvironmentTheme } from './EnvironmentTypes';

/**
 * Manages the creation and updating of skyboxes for different environments
 */
export class SkyboxManager {
  private scene: THREE.Scene;
  private skyboxMesh?: THREE.Mesh;
  private currentTheme: EnvironmentTheme;
  
  constructor(scene: THREE.Scene, initialTheme: EnvironmentTheme) {
    this.scene = scene;
    this.currentTheme = initialTheme;
    this.createSkybox();
  }
  
  /**
   * Creates skybox for the environment
   */
  private createSkybox(): void {
    // Create simple gradient skybox
    const vertexShader = `
      varying vec3 vWorldPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(0.0, min(1.0, pow(max(0.0, h), exponent)));
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: this.currentTheme.skyColorTop || new THREE.Color(0x6cc7fa) },
      bottomColor: { value: this.currentTheme.skyColorBottom || new THREE.Color(0x0c4a6e) },
      offset: { value: 10 },
      exponent: { value: 0.6 }
    };
    
    const skyMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.BackSide,
      fog: false
    });
    
    const skyGeometry = new THREE.SphereGeometry(450, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.skyboxMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyboxMesh);
  }
  
  /**
   * Updates the skybox to match a new environment theme
   * @param newTheme The new environment theme
   * @param transitionProgress Progress of theme transition (0-1)
   * @param previousTheme Optional previous theme for transitions
   */
  public updateSkybox(
    newTheme: EnvironmentTheme,
    transitionProgress: number = 1.0,
    previousTheme?: EnvironmentTheme
  ): void {
    if (!this.skyboxMesh) return;
    
    // Get the material from the skybox mesh
    const material = this.skyboxMesh.material as THREE.ShaderMaterial;
    
    if (!material || !material.uniforms) return;
    
    // Update uniforms for theme
    if (previousTheme && transitionProgress < 1.0) {
      // For transitions, interpolate between themes
      const prevTopColor = previousTheme.skyColorTop !== undefined ? 
        new THREE.Color(previousTheme.skyColorTop) : new THREE.Color(0x6cc7fa);
      const newTopColor = newTheme.skyColorTop !== undefined ? 
        new THREE.Color(newTheme.skyColorTop) : new THREE.Color(0x6cc7fa);
      const topColor = new THREE.Color().copy(prevTopColor).lerp(newTopColor, transitionProgress);
      
      const prevBottomColor = previousTheme.skyColorBottom !== undefined ? 
        new THREE.Color(previousTheme.skyColorBottom) : new THREE.Color(0x0c4a6e);
      const newBottomColor = newTheme.skyColorBottom !== undefined ? 
        new THREE.Color(newTheme.skyColorBottom) : new THREE.Color(0x0c4a6e);
      const bottomColor = new THREE.Color().copy(prevBottomColor).lerp(newBottomColor, transitionProgress);
      
      material.uniforms.topColor.value = topColor;
      material.uniforms.bottomColor.value = bottomColor;
    } else {
      // For immediate changes
      material.uniforms.topColor.value = newTheme.skyColorTop || new THREE.Color(0x6cc7fa);
      material.uniforms.bottomColor.value = newTheme.skyColorBottom || new THREE.Color(0x0c4a6e);
    }
    
    // Store current theme
    this.currentTheme = newTheme;
  }
  
  /**
   * Position the skybox relative to the camera
   * @param cameraPosition Camera position vector
   */
  public updatePosition(cameraPosition: THREE.Vector3): void {
    if (this.skyboxMesh) {
      this.skyboxMesh.position.copy(cameraPosition);
    }
  }
  
  /**
   * Dispose of skybox resources
   */
  public dispose(): void {
    if (this.skyboxMesh) {
      this.scene.remove(this.skyboxMesh);
      
      if (this.skyboxMesh.geometry) {
        this.skyboxMesh.geometry.dispose();
      }
      
      if (this.skyboxMesh.material) {
        if (Array.isArray(this.skyboxMesh.material)) {
          this.skyboxMesh.material.forEach(material => material.dispose());
        } else {
          this.skyboxMesh.material.dispose();
        }
      }
    }
  }
}