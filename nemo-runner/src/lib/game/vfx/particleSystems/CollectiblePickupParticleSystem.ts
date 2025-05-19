import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';

/**
 * Placeholder particle system for collectible pickup effects.
 * Real implementation lives in later project steps.
 */
export class CollectiblePickupParticleSystem {
  public points: THREE.Points;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, _shaderManager: ShaderManager) {
    this.scene = scene;
    // Minimal geometry/material so the class can be instantiated without errors
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({ size: 0.1, color: 0xffff00 });
    this.points = new THREE.Points(geometry, material);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  emit(_position: THREE.Vector3, _color?: THREE.Color): void {
    // Placeholder – actual particle spawning implemented in full version
  }

  update(_dt: number): void {
    // Placeholder update
  }

  reset(): void {
    // Placeholder reset logic
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    if (this.points.material instanceof THREE.Material) {
      this.points.material.dispose();
    }
  }
}
