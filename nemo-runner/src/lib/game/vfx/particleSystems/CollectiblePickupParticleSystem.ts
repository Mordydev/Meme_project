import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';

// Local interface mirroring planned ParticleEffectConfig
interface ParticleEffectConfig {
  enabled: boolean;
  poolSize: number;
  particleSizeMin: number;
  particleSizeMax: number;
  color1: number | string;
  color2?: number | string;
  opacityStart?: number;
  opacityEnd?: number;
  textureUrl?: string;
  lifetimeMin: number;
  lifetimeMax: number;
  speedMin: number;
  speedMax: number;
  gravity?: number;
  spreadAngle?: number;
  emissionRate?: number;
  burstCount?: number;
  initialRotation?: boolean;
  rotationSpeed?: number;
}

interface SparkleParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  currentSize: number;
  baseSize: number;
  alpha: number;
  color: THREE.Color;
  rotation: number;
  rotationSpeed: number;
  isActive: boolean;
}

export class CollectiblePickupParticleSystem {
  private scene: THREE.Scene;
  private shaderManager: ShaderManager;
  private config: Readonly<ParticleEffectConfig>;

  private particles: SparkleParticle[] = [];
  public points!: THREE.Points;
  private positions!: Float32Array;
  private alphas!: Float32Array;
  private sizes!: Float32Array;
  private colors!: Float32Array;
  private rotations!: Float32Array;
  private poolPointer = 0;

  constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.config = (configSystem.get('visuals') as any).collectibleSparks as ParticleEffectConfig;
    if (!this.config || !this.config.enabled) return;
    this.initPoints();
  }

  private initPoints(): void {
    const poolSize = this.config.poolSize;
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(poolSize * 3);
    this.alphas = new Float32Array(poolSize);
    this.sizes = new Float32Array(poolSize);
    this.colors = new Float32Array(poolSize * 3);
    this.rotations = new Float32Array(poolSize);

    for (let i = 0; i < poolSize; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.alphas[i] = 0;
      this.sizes[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

    const material = this.shaderManager.createShaderMaterial('sparkleShader', {
      uBaseColor: { value: new THREE.Color(this.config.color1) },
      uBaseSize: { value: 1.0 },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
      uUseTexture: { value: false },
    });

    if (!material) {
      console.error('CollectiblePickupParticleSystem: sparkleShader failed, using fallback.');
      this.points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ size: 0.1, color: 0xffff00, transparent: true, opacity: 0.7 })
      ) as any;
    } else {
      this.points = new THREE.Points(geometry, material);
    }

    this.points.name = 'CollectibleSparks';
    this.points.visible = this.config.enabled;
    this.scene.add(this.points);

    for (let i = 0; i < poolSize; i++) {
      this.particles.push({
        position: new THREE.Vector3(0, -9999, 0),
        velocity: new THREE.Vector3(),
        lifetime: 0,
        maxLifetime: 0,
        currentSize: 0,
        baseSize: 0,
        alpha: 0,
        color: new THREE.Color(),
        rotation: 0,
        rotationSpeed: 0,
        isActive: false,
      });
    }
  }

  public emit(origin: THREE.Vector3, particleColor?: THREE.Color): void {
    if (!this.config.enabled || !this.points) return;
    const count = Math.min(this.config.burstCount || 10, this.config.poolSize);

    for (let i = 0; i < count; i++) {
      const idx = this.poolPointer;
      const p = this.particles[idx];
      p.isActive = true;
      p.position.copy(origin);
      p.maxLifetime = THREE.MathUtils.randFloat(this.config.lifetimeMin, this.config.lifetimeMax);
      p.lifetime = p.maxLifetime;
      p.baseSize = THREE.MathUtils.randFloat(this.config.particleSizeMin, this.config.particleSizeMax);
      p.currentSize = p.baseSize;
      p.alpha = this.config.opacityStart !== undefined ? this.config.opacityStart : 1.0;

      const speed = THREE.MathUtils.randFloat(this.config.speedMin, this.config.speedMax);
      const angle = Math.random() * (this.config.spreadAngle ?? 360) * (Math.PI / 180);
      const ySpeed = Math.sin(Math.random() * Math.PI * 0.5) * speed;
      const xzSpeed = Math.cos(Math.random() * Math.PI * 0.5) * speed;
      p.velocity.set(Math.cos(angle) * xzSpeed, ySpeed, Math.sin(angle) * xzSpeed);

      p.color.copy(particleColor || new THREE.Color(this.config.color1));
      if (this.config.color2 && Math.random() > 0.5) {
        p.color.lerp(new THREE.Color(this.config.color2), Math.random() * 0.5);
      }
      p.rotation = this.config.initialRotation ? Math.random() * Math.PI * 2 : 0;
      p.rotationSpeed = this.config.rotationSpeed ? THREE.MathUtils.randFloatSpread(this.config.rotationSpeed) : 0;

      this.positions[idx * 3] = p.position.x;
      this.positions[idx * 3 + 1] = p.position.y;
      this.positions[idx * 3 + 2] = p.position.z;
      this.alphas[idx] = p.alpha;
      this.sizes[idx] = p.currentSize;
      this.colors[idx * 3] = p.color.r;
      this.colors[idx * 3 + 1] = p.color.g;
      this.colors[idx * 3 + 2] = p.color.b;
      this.rotations[idx] = p.rotation;

      this.poolPointer = (this.poolPointer + 1) % this.config.poolSize;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.aAlpha.needsUpdate = true;
    this.points.geometry.attributes.aScale.needsUpdate = true;
    this.points.geometry.attributes.aColor.needsUpdate = true;
    this.points.geometry.attributes.aRotation.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    if (!this.config.enabled || !this.points) return;
    let needsUpdate = false;
    for (let i = 0; i < this.config.poolSize; i++) {
      const p = this.particles[i];
      if (!p.isActive) continue;
      needsUpdate = true;
      p.lifetime -= deltaTime;
      if (p.lifetime <= 0) {
        p.isActive = false;
        this.alphas[i] = 0;
        this.sizes[i] = 0;
        this.positions[i * 3 + 1] = -9999;
        continue;
      }

      p.position.addScaledVector(p.velocity, deltaTime);
      p.velocity.y -= (this.config.gravity ?? 0) * deltaTime;
      p.velocity.multiplyScalar(1.0 - 3.0 * deltaTime);

      const lifeRatio = p.lifetime / p.maxLifetime;
      p.alpha = (this.config.opacityStart ?? 1.0) * lifeRatio;
      p.currentSize = p.baseSize * lifeRatio;
      p.rotation += p.rotationSpeed * deltaTime;

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;
      this.alphas[i] = p.alpha;
      this.sizes[i] = p.currentSize;
      this.rotations[i] = p.rotation;
      this.colors[i * 3] = p.color.r;
      this.colors[i * 3 + 1] = p.color.g;
      this.colors[i * 3 + 2] = p.color.b;
    }

    if (needsUpdate) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.aAlpha.needsUpdate = true;
      this.points.geometry.attributes.aScale.needsUpdate = true;
      this.points.geometry.attributes.aColor.needsUpdate = true;
      this.points.geometry.attributes.aRotation.needsUpdate = true;
    }

    if (
      this.points.material instanceof THREE.ShaderMaterial &&
      (this.points.material.uniforms as any).uTime
    ) {
      (this.points.material.uniforms as any).uTime.value += deltaTime;
    }
  }

  public reset(): void {
    for (let i = 0; i < this.config.poolSize; i++) {
      this.particles[i].isActive = false;
      this.alphas[i] = 0;
      this.sizes[i] = 0;
      this.positions[i * 3 + 1] = -9999;
    }
    if (this.points) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.aAlpha.needsUpdate = true;
      this.points.geometry.attributes.aScale.needsUpdate = true;
    }
  }

  public dispose(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      if (this.points.material instanceof THREE.Material) {
        this.points.material.dispose();
      }
    }
    this.particles = [];
  }
}
