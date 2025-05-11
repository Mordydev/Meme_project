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

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Dispose might be needed later if it holds its own resources
  public dispose(): void {
    console.log("RenderManager: Disposed (no specific resources held in this basic version).");
  }
} 