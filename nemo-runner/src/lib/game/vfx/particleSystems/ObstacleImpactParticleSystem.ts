import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';

interface ParticleArrays {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  sizes: Float32Array;
  baseSizes: Float32Array;
  colors: Float32Array;
  rotations: Float32Array;
  rotationSpeeds: Float32Array;
}

export class ObstacleImpactParticleSystem {
  private points?: THREE.Points;
  private arrays?: ParticleArrays;
  private geometry?: THREE.BufferGeometry;
  private material?: THREE.ShaderMaterial | THREE.PointsMaterial;
  private poolSize = 0;
  private poolPointer = 0;

  constructor(private scene: THREE.Scene, private shaderManager: ShaderManager) {
    const cfg = configSystem.get('visuals').obstacleImpactDebris;
    this.poolSize = cfg.poolSize;
    if (!cfg.enabled) return;
    this.initGeometry();
  }

  private initGeometry(): void {
    const cfg = configSystem.get('visuals').obstacleImpactDebris;
    const g = new THREE.BufferGeometry();
    this.arrays = {
      positions: new Float32Array(this.poolSize * 3),
      velocities: new Float32Array(this.poolSize * 3),
      lifetimes: new Float32Array(this.poolSize),
      maxLifetimes: new Float32Array(this.poolSize),
      sizes: new Float32Array(this.poolSize),
      baseSizes: new Float32Array(this.poolSize),
      colors: new Float32Array(this.poolSize * 3),
      rotations: new Float32Array(this.poolSize),
      rotationSpeeds: new Float32Array(this.poolSize)
    };

    for (let i = 0; i < this.poolSize; i++) {
      this.arrays.positions[i * 3 + 1] = -9999;
      this.arrays.lifetimes[i] = 0;
    }

    g.setAttribute('position', new THREE.BufferAttribute(this.arrays.positions, 3));
    g.setAttribute('aScale', new THREE.BufferAttribute(this.arrays.sizes, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.arrays.colors, 3));
    g.setAttribute('aRotation', new THREE.BufferAttribute(this.arrays.rotations, 1));

    const mat = this.shaderManager.createShaderMaterial('impactDebrisShader', {
      uBaseColor: { value: new THREE.Color(cfg.color1) },
      uBaseSize: { value: 1.0 },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 }
    });

    if (!mat) {
      console.error('ObstacleImpactParticleSystem: impactDebrisShader failed');
      this.material = new THREE.PointsMaterial({ color: 0x888888, size: 0.1, transparent: true });
    } else {
      this.material = mat;
      this.material.transparent = true;
      this.material.depthWrite = false;
    }

    this.geometry = g;
    this.points = new THREE.Points(g, this.material);
    this.points.name = 'ObstacleImpactDebris';
    this.points.visible = cfg.enabled;
    this.scene.add(this.points);
  }

  public emit(origin: THREE.Vector3, impactNormal?: THREE.Vector3, particleColor?: THREE.Color): void {
    if (!this.arrays || !this.points) return;
    const cfg = configSystem.get('visuals').obstacleImpactDebris;
    const count = cfg.burstCount;

    for (let i = 0; i < count; i++) {
      const idx = this.poolPointer;
      const life = THREE.MathUtils.randFloat(cfg.lifetimeMin, cfg.lifetimeMax);
      const speed = THREE.MathUtils.randFloat(cfg.speedMin, cfg.speedMax);

      let dir = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      ).normalize();
      if (impactNormal) {
        dir.reflect(impactNormal.clone().normalize()).multiplyScalar(0.6).add(dir.multiplyScalar(0.4)).normalize();
      }

      this.arrays.positions[idx * 3] = origin.x;
      this.arrays.positions[idx * 3 + 1] = origin.y;
      this.arrays.positions[idx * 3 + 2] = origin.z;
      this.arrays.velocities[idx * 3] = dir.x * speed;
      this.arrays.velocities[idx * 3 + 1] = dir.y * speed;
      this.arrays.velocities[idx * 3 + 2] = dir.z * speed;
      this.arrays.lifetimes[idx] = life;
      this.arrays.maxLifetimes[idx] = life;
      const size = THREE.MathUtils.randFloat(cfg.particleSizeMin, cfg.particleSizeMax);
      this.arrays.baseSizes[idx] = size;
      this.arrays.sizes[idx] = size;
      const color = particleColor ? particleColor.clone() : new THREE.Color(cfg.color1);
      if (!particleColor && cfg.color2 && Math.random() > 0.5) {
        color.lerp(new THREE.Color(cfg.color2), Math.random());
      }
      this.arrays.colors[idx * 3] = color.r;
      this.arrays.colors[idx * 3 + 1] = color.g;
      this.arrays.colors[idx * 3 + 2] = color.b;
      this.arrays.rotations[idx] = cfg.initialRotation ? Math.random() * Math.PI * 2 : 0;
      this.arrays.rotationSpeeds[idx] = cfg.rotationSpeed ? THREE.MathUtils.randFloatSpread(cfg.rotationSpeed) : 0;

      this.poolPointer = (this.poolPointer + 1) % this.poolSize;
    }

    this.geometry!.attributes.position.needsUpdate = true;
    this.geometry!.attributes.aScale.needsUpdate = true;
    this.geometry!.attributes.aColor.needsUpdate = true;
    this.geometry!.attributes.aRotation.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    if (!this.arrays || !this.points) return;
    const cfg = configSystem.get('visuals').obstacleImpactDebris;
    let needsUpdate = false;

    for (let i = 0; i < this.poolSize; i++) {
      if (this.arrays.lifetimes[i] <= 0) continue;
      this.arrays.lifetimes[i] -= deltaTime;
      if (this.arrays.lifetimes[i] <= 0) {
        this.arrays.positions[i * 3 + 1] = -9999;
        this.arrays.sizes[i] = 0;
        needsUpdate = true;
        continue;
      }

      this.arrays.positions[i * 3] += this.arrays.velocities[i * 3] * deltaTime;
      this.arrays.positions[i * 3 + 1] += this.arrays.velocities[i * 3 + 1] * deltaTime;
      this.arrays.positions[i * 3 + 2] += this.arrays.velocities[i * 3 + 2] * deltaTime;
      this.arrays.velocities[i * 3 + 1] -= (cfg.gravity ?? 0) * deltaTime;
      const drag = 1 - 2 * deltaTime;
      this.arrays.velocities[i * 3] *= drag;
      this.arrays.velocities[i * 3 + 1] *= drag;
      this.arrays.velocities[i * 3 + 2] *= drag;

      const ratio = this.arrays.lifetimes[i] / this.arrays.maxLifetimes[i];
      this.arrays.sizes[i] = this.arrays.baseSizes[i] * ratio;
      this.arrays.rotations[i] += this.arrays.rotationSpeeds[i] * deltaTime;

      needsUpdate = true;
    }

    if (needsUpdate) {
      this.geometry!.attributes.position.needsUpdate = true;
      this.geometry!.attributes.aScale.needsUpdate = true;
      this.geometry!.attributes.aRotation.needsUpdate = true;
    }
  }

  public reset(): void {
    if (!this.arrays) return;
    for (let i = 0; i < this.poolSize; i++) {
      this.arrays.positions[i * 3 + 1] = -9999;
      this.arrays.lifetimes[i] = 0;
      this.arrays.sizes[i] = 0;
    }
    this.geometry?.attributes.position.needsUpdate && (this.geometry.attributes.position.needsUpdate = true);
    this.geometry?.attributes.aScale.needsUpdate && (this.geometry.attributes.aScale.needsUpdate = true);
  }

  public dispose(): void {
    if (this.points) this.scene.remove(this.points);
    this.geometry?.dispose();
    this.material?.dispose();
  }
}