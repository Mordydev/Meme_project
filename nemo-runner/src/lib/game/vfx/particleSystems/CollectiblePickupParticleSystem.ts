import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { ParticleEffectConfig } from '../../config/gameConfig';

interface SparkleParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  scale: number;
  alpha: number;
  color: THREE.Color;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

export class CollectiblePickupParticleSystem {
  private scene: THREE.Scene;
  private shaderManager: ShaderManager;
  private config: Readonly<ParticleEffectConfig>;
  private particles: SparkleParticle[] = [];
  public points!: THREE.Points;
  private positions!: Float32Array;
  private alphas!: Float32Array;
  private scales!: Float32Array;
  private colors!: Float32Array;
  private rotations!: Float32Array;
  private poolPointer = 0;
  private lastPixelRatio: number = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  constructor(scene: THREE.Scene, shaderManager: ShaderManager) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.config = configSystem.get('visuals').collectibleSparks;
    if (!this.config.enabled) return;
    this.init();
  }

  private init(): void {
    const poolSize = this.config.poolSize;
    this.positions = new Float32Array(poolSize * 3);
    this.alphas = new Float32Array(poolSize);
    this.scales = new Float32Array(poolSize);
    this.colors = new Float32Array(poolSize * 3);
    this.rotations = new Float32Array(poolSize);

    for (let i = 0; i < poolSize; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.alphas[i] = 0;
      this.scales[i] = 0;
      this.rotations[i] = 0;
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        lifetime: 0,
        maxLifetime: 0,
        scale: 0,
        alpha: 0,
        color: new THREE.Color(),
        rotation: 0,
        rotationSpeed: 0,
        active: false,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

    const material = this.shaderManager.createShaderMaterial('sparkleShader', {
      uBaseColor: { value: new THREE.Color(this.config.color1) },
      uBaseSize: { value: 1.0 },
      uPixelRatio: { value: this.lastPixelRatio },
      uUseTexture: { value: false },
    });

    if (!material) {
      this.points = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.1,
        color: 0xffff00,
        transparent: true,
        opacity: 0.7,
      }));
    } else {
      material.transparent = true;
      material.depthWrite = false;
      material.blending = THREE.AdditiveBlending;
      this.points = new THREE.Points(geometry, material);
    }

    this.points.name = 'CollectibleSparks';
    this.points.visible = this.config.enabled;
    this.scene.add(this.points);
  }

  public emit(origin: THREE.Vector3, color?: THREE.Color): void {
    if (!this.config.enabled) return;
    const count = this.config.burstCount || 10;

    for (let i = 0; i < count; i++) {
      const p = this.particles[this.poolPointer];
      p.active = true;
      p.position.copy(origin);
      p.maxLifetime = THREE.MathUtils.randFloat(this.config.lifetimeMin, this.config.lifetimeMax);
      p.lifetime = p.maxLifetime;
      p.scale = THREE.MathUtils.randFloat(this.config.particleSizeMin, this.config.particleSizeMax);
      p.alpha = this.config.opacityStart ?? 1;

      const speed = THREE.MathUtils.randFloat(this.config.speedMin, this.config.speedMax);
      const angle = Math.random() * (this.config.spreadAngle || 360) * (Math.PI / 180);
      const ySpeed = Math.sin(Math.random() * Math.PI * 0.5) * speed;
      const xz = Math.cos(Math.random() * Math.PI * 0.5) * speed;
      p.velocity.set(Math.cos(angle) * xz, ySpeed, Math.sin(angle) * xz);

      p.color.copy(color || new THREE.Color(this.config.color1));
      if (this.config.color2 && Math.random() > 0.5) {
        p.color.lerp(new THREE.Color(this.config.color2), Math.random() * 0.5);
      }

      p.rotation = this.config.initialRotation ? Math.random() * Math.PI * 2 : 0;
      p.rotationSpeed = this.config.rotationSpeed
        ? THREE.MathUtils.randFloatSpread(this.config.rotationSpeed)
        : 0;

      this.poolPointer = (this.poolPointer + 1) % this.config.poolSize;
    }
  }

  public update(deltaTime: number): void {
    if (!this.config.enabled) return;

    let needsUpdate = false;
    for (let i = 0; i < this.config.poolSize; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      needsUpdate = true;
      p.lifetime -= deltaTime;
      if (p.lifetime <= 0) {
        p.active = false;
        this.alphas[i] = 0;
        this.scales[i] = 0;
        this.positions[i * 3 + 1] = -9999;
        continue;
      }

      p.position.addScaledVector(p.velocity, deltaTime);
      if (this.config.gravity) {
        p.velocity.y -= this.config.gravity * deltaTime;
      }
      const lifeRatio = p.lifetime / p.maxLifetime;
      p.alpha = THREE.MathUtils.lerp(this.config.opacityEnd ?? 0, this.config.opacityStart ?? 1, lifeRatio);
      p.scale = p.scale * lifeRatio;
      p.rotation += p.rotationSpeed * deltaTime;

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;
      this.alphas[i] = p.alpha;
      this.scales[i] = p.scale;
      this.colors[i * 3] = p.color.r;
      this.colors[i * 3 + 1] = p.color.g;
      this.colors[i * 3 + 2] = p.color.b;
      this.rotations[i] = p.rotation;
    }

    if (needsUpdate) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.aAlpha.needsUpdate = true;
      this.points.geometry.attributes.aScale.needsUpdate = true;
      this.points.geometry.attributes.aColor.needsUpdate = true;
      this.points.geometry.attributes.aRotation.needsUpdate = true;
    }

    if (this.points.material instanceof THREE.ShaderMaterial && this.points.material.uniforms) {
      if (typeof window !== 'undefined') {
        const pr = window.devicePixelRatio;
        if (pr !== this.lastPixelRatio && this.points.material.uniforms.uPixelRatio) {
          this.points.material.uniforms.uPixelRatio.value = pr;
          this.lastPixelRatio = pr;
        }
      }
    }
  }

  public reset(): void {
    for (let i = 0; i < this.config.poolSize; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.alphas[i] = 0;
      this.scales[i] = 0;
      this.particles[i].active = false;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.aAlpha.needsUpdate = true;
    this.points.geometry.attributes.aScale.needsUpdate = true;
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    if (this.points.material instanceof THREE.Material) {
      this.points.material.dispose();
    }
  }
}
