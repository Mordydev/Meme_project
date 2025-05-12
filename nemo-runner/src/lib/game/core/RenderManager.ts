import * as THREE from 'three';

export class RenderManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  /**
   * Updates the renderer reference after WebGL context loss/restoration
   * @param newRenderer The new WebGLRenderer instance
   */
  public updateRenderer(newRenderer: THREE.WebGLRenderer): void {
    if (!newRenderer) {
      console.error("RenderManager: Cannot update renderer - new renderer is undefined");
      return;
    }

    this.renderer = newRenderer;
    console.log("RenderManager: Renderer reference updated");
  }

  public render(): void {
    try {
      // Add safety checks to avoid "Cannot set properties of undefined" error
      if (!this.renderer) {
        console.error("RenderManager: Renderer is undefined");
        return;
      }

      if (!this.scene) {
        console.error("RenderManager: Scene is undefined");
        return;
      }

      if (!this.camera) {
        console.error("RenderManager: Camera is undefined");
        return;
      }

      // Check if renderer's WebGL context is still valid
      if (!this.renderer.domElement ||
          !this.renderer.domElement.isConnected ||
          this.renderer.domElement.parentElement === null) {
        console.error("RenderManager: Renderer's canvas is not in DOM");
        return;
      }

      // Check if any of the renderer's crucial internal properties are undefined
      if (!this.renderer.info || !this.renderer.properties) {
        console.error("RenderManager: Renderer internal state is invalid");
        return;
      }

      // Only render if all required objects are defined and valid
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("RenderManager: Error during rendering", error);
    }
  }

  // Properly dispose resources and clear references
  public dispose(): void {
    // Clear references to prevent memory leaks
    // and prevent errors after disposal
    this.scene = null as any;
    this.camera = null as any;
    this.renderer = null as any;
    console.log("RenderManager: Disposed and cleared references.");
  }
} 