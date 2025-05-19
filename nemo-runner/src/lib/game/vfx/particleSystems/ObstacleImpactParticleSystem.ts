import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';

interface DebrisParticle {
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

export class ObstacleImpactParticleSystem {
  private scene: THREE.Scene;
  private shaderManager: ShaderManager;
  private config: any;

  private particles: DebrisParticle[] = [];
  private geometry!: THREE.BufferGeometry;
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
    this.config = (configSystem.get('visuals') as any).obstacleImpactDebris || { enabled: false, poolSize: 0 };
    if (!this.config.enabled) return;
    this.initPoints();
  }

  private initPoints(): void {
    const poolSize = this.config.poolSize || 50;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(poolSize * 3);
    this.alphas = new Float32Array(poolSize);
    this.sizes = new Float32Array(poolSize);
    this.colors = new Float32Array(poolSize * 3);
    this.rotations = new Float32Array(poolSize);

    for (let i = 0; i < poolSize; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -9999;
      this.positions[i * 3 + 2] = 0;
      this.alphas[i] = 0;
      this.sizes[i] = 0;
      this.rotations[i] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

    const material = this.shaderManager.createShaderMaterial('impactDebrisShader', {
      uBaseColor: { value: new THREE.Color(this.config.color1 || 0xffffff) },
      uBaseSize: { value: 1.0 },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
    });

    if (!material) {
      console.error('ObstacleImpactParticleSystem: impactDebrisShader failed, using fallback.');
      this.points = new THREE.Points(
        this.geometry,
        new THREE.PointsMaterial({ size: 0.05, color: 0x888888, transparent: true, opacity: 0.7 })
      );
    } else {
      this.points = new THREE.Points(this.geometry, material);
      (material as THREE.ShaderMaterial).transparent = true;
      (material as THREE.ShaderMaterial).depthWrite = false;
    }

    this.points.name = 'ObstacleImpactDebris';
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

  public emit(origin: THREE.Vector3, impactNormal?: THREE.Vector3, particleColor?: THREE.Color): void {
    if (!this.config.enabled || !this.points) return;
    const count = this.config.burstCount || 15;

    for (let i = 0; i < count; i++) {
      const index = this.poolPointer;
      const p = this.particles[index];
      p.isActive = true;
      p.position.copy(origin);
      p.maxLifetime = THREE.MathUtils.randFloat(this.config.lifetimeMin || 0.4, this.config.lifetimeMax || 1.0);
      p.lifetime = p.maxLifetime;
      p.baseSize = THREE.MathUtils.randFloat(this.config.particleSizeMin || 0.05, this.config.particleSizeMax || 0.15);
      p.currentSize = p.baseSize;
      p.alpha = this.config.opacityStart !== undefined ? this.config.opacityStart : 0.8;

      const speed = THREE.MathUtils.randFloat(this.config.speedMin || 1, this.config.speedMax || 2);
      let direction = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      ).normalize();

      if (impactNormal) {
        direction
          .reflect(impactNormal.clone().normalize())
          .multiplyScalar(0.6)
          .add(direction.multiplyScalar(0.4))
          .normalize();
      }
      p.velocity.copy(direction).multiplyScalar(speed);

      p.color.set(particleColor || this.config.color1 || 0xffffff);
      if (this.config.color2 && Math.random() > 0.5) {
        p.color.lerp(new THREE.Color(this.config.color2), Math.random() * 0.7);
      }
      p.rotation = this.config.initialRotation ? Math.random() * Math.PI * 2 : 0;
      p.rotationSpeed = this.config.rotationSpeed ? THREE.MathUtils.randFloatSpread(this.config.rotationSpeed) : 0;

      this.positions[index * 3] = p.position.x;
      this.positions[index * 3 + 1] = p.position.y;
      this.positions[index * 3 + 2] = p.position.z;
      this.sizes[index] = p.currentSize;
      this.alphas[index] = p.alpha;
      this.colors[index * 3] = p.color.r;
      this.colors[index * 3 + 1] = p.color.g;
      this.colors[index * 3 + 2] = p.color.b;
      this.rotations[index] = p.rotation;

      this.poolPointer = (this.poolPointer + 1) % this.particles.length;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aScale.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aRotation.needsUpdate = true;
  }

  public update(deltaTime: number): void {
    if (!this.config.enabled || !this.points) return;
    let needsUpdate = false;
    for (let i = 0; i < this.particles.length; i++) {
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
      if (this.config.gravity) {
        p.velocity.y -= this.config.gravity * deltaTime;
      }
      p.velocity.multiplyScalar(1.0 - 2.0 * deltaTime);

      const lifeRatio = p.lifetime / p.maxLifetime;
      p.alpha = lifeRatio * (this.config.opacityStart !== undefined ? this.config.opacityStart : 0.8);
      p.currentSize = p.baseSize * lifeRatio;
      p.rotation += p.rotationSpeed * deltaTime;

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;
      this.alphas[i] = p.alpha;
      this.sizes[i] = p.currentSize;
      this.colors[i * 3] = p.color.r;
      this.colors[i * 3 + 1] = p.color.g;
      this.colors[i * 3 + 2] = p.color.b;
      this.rotations[i] = p.rotation;
    }

    if (needsUpdate) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.aScale.needsUpdate = true;
      this.geometry.attributes.aAlpha.needsUpdate = true;
      this.geometry.attributes.aColor.needsUpdate = true;
      this.geometry.attributes.aRotation.needsUpdate = true;
    }
  }

  public dispose(): void {
    if (this.points) {
      this.scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    const mat = this.points?.material as THREE.Material;
    if (mat) mat.dispose();
  }
}
