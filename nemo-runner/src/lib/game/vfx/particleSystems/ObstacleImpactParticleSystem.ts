import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

export class ObstacleImpactParticleSystem {
  private points?: THREE.Points;
  private positions?: Float32Array;
  private lifetimes: number[] = [];
  private poolSize: number = 0;
  private geometry?: THREE.BufferGeometry;
  private material?: THREE.Material;

  constructor(private scene: THREE.Scene, private shaderManager: ShaderManager) {
    const cfg = (configSystem.get('visuals') as any).obstacleImpactDebris || { enabled: false, poolSize: 60 };
    this.poolSize = cfg.poolSize || 60;
    if (!cfg.enabled) return;
    this.initialize();
  }

  private initialize(): void {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.poolSize * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.PointsMaterial({ color: 0x888888, size: 0.1, transparent: true });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'ObstacleImpactDebris';
    this.scene.add(this.points);
    for (let i = 0; i < this.poolSize; i++) {
      this.positions[i*3+1] = -9999;
      this.lifetimes[i] = 0;
    }
  }

  public emit(
    origin: THREE.Vector3,
    normal?: THREE.Vector3,
    color?: THREE.Color,
    count: number = 15
  ): void {
    if (!this.positions || !this.points) return;
    if (color && this.material instanceof THREE.PointsMaterial) {
      (this.material as THREE.PointsMaterial).color.copy(color);
    }
    for (let c = 0; c < count; c++) {
      const index = c % this.poolSize;
      this.positions[index*3] = origin.x;
      this.positions[index*3+1] = origin.y;
      this.positions[index*3+2] = origin.z;
      this.lifetimes[index] = 0.6;
    }
    this.geometry!.attributes.position.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    if (!this.positions || !this.points) return;
    let needsUpdate = false;
    for (let i = 0; i < this.poolSize; i++) {
      if (this.lifetimes[i] > 0) {
        this.lifetimes[i] -= deltaTime;
        this.positions[i*3+1] += -deltaTime; // fall slightly
        if (this.lifetimes[i] <= 0) this.positions[i*3+1] = -9999;
        needsUpdate = true;
      }
    }
    if (needsUpdate) this.geometry!.attributes.position.needsUpdate = true;
  }

  public reset(): void {
    if (!this.positions) return;
    for (let i = 0; i < this.poolSize; i++) {
      this.positions[i*3+1] = -9999;
      this.lifetimes[i] = 0;
    }
    if (this.geometry) this.geometry.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    if (this.points) this.scene.remove(this.points);
    this.geometry?.dispose();
    (this.material as any)?.dispose?.();
  }
}