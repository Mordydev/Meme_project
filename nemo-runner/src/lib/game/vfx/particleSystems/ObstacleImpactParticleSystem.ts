import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';

/**
 * Placeholder particle system for obstacle impact effects.
 * Real implementation lives in later project steps.
 */
export class ObstacleImpactParticleSystem {
  public points: THREE.Points;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, _shaderManager: ShaderManager) {
    this.scene = scene;
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff });
    this.points = new THREE.Points(geometry, material);
    this.points.visible = false;
    this.scene.add(this.points);
  }

  emit(_position: THREE.Vector3, _normal?: THREE.Vector3, _color?: THREE.Color): void {
    // Placeholder for actual emission logic
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
