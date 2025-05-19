import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';

interface BubbleParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number; // Time remaining
  maxLifetime: number;
  baseScale: number;
  currentScale: number;
  alpha: number;
  rotation: number; // Optional
  color: THREE.Color;
  wobbleOffset: number;
}

export class BubbleParticleSystem {
  private particles: BubbleParticle[] = [];
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  public points!: THREE.Points;
  private poolSize: number;
  private shaderManager: ShaderManager;
  private scene: THREE.Scene;

  // Attribute buffers
  private positions!: Float32Array;
  private scales!: Float32Array;
  private alphas!: Float32Array;
  private colors!: Float32Array;
  private rotations!: Float32Array;
  private emissionAccumulator: number = 0;

  constructor(scene: THREE.Scene, shaderManager: ShaderManager, poolSize: number) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.poolSize = poolSize;
    this.initialize();
  }

  private initialize(): void {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.poolSize * 3);
    this.scales = new Float32Array(this.poolSize);
    this.alphas = new Float32Array(this.poolSize);
    this.colors = new Float32Array(this.poolSize * 3);
    this.rotations = new Float32Array(this.poolSize);

    // Initialize with placeholder values (particles are "dead" initially)
    for (let i = 0; i < this.poolSize; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -9999; // Start offscreen
      this.positions[i * 3 + 2] = 0;
      this.scales[i] = 0;
      this.alphas[i] = 0;
      this.colors[i * 3] = 1;
      this.colors[i * 3 + 1] = 1;
      this.colors[i * 3 + 2] = 1;
      this.rotations[i] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));

    // Use ShaderManager to get the material
    this.material = this.shaderManager.createShaderMaterial('bubbleShader', {
      uBaseColor: { value: new THREE.Color(0xffffff) }, // White base tint for bubbles
      uBaseSize: { value: configSystem.get('visuals').bubbleSize },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
      uUseTexture: { value: false },
    });

    if (!this.material) {
      console.error("BubbleParticleSystem: Failed to create bubbleShader. Using fallback PointsMaterial.");
      this.material = new THREE.PointsMaterial({ 
        size: 0.1, 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.5 
      }) as any; // Fallback
    } else {
      this.material.transparent = true;
      this.material.depthWrite = false; // Common for transparent particles
      this.material.blending = THREE.AdditiveBlending; // Makes bubbles look more watery
    }

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = "BubbleParticles";
    this.scene.add(this.points);
  }

  private spawnParticle(origin: THREE.Vector3): void {
    // Find a "dead" particle (or overwrite oldest)
    let targetIndex = this.particles.findIndex(p => p.lifetime <= 0);
    if (targetIndex === -1 && this.particles.length < this.poolSize) {
      // Add new particle if pool is not full
      targetIndex = this.particles.length;
      this.particles.push({} as BubbleParticle); // Placeholder
    } else if (targetIndex === -1) {
      // Pool is full, overwrite the first particle (simple strategy)
      targetIndex = 0;
    }

    if (targetIndex >= this.poolSize) return; // Should not happen if pool logic is correct

    const visuals = configSystem.get('visuals') as any;
    const cfg = visuals.playerTrailBubbles ?? {};
    const sizeMin = cfg.particleSizeMin ?? visuals.bubbleSize * 0.6;
    const sizeMax = cfg.particleSizeMax ?? visuals.bubbleSize * 1.2;
    const lifetime = THREE.MathUtils.randFloat(cfg.lifetimeMin ?? 0.8, cfg.lifetimeMax ?? 2.0);
    const speedMin = cfg.speedMin ?? visuals.bubbleBaseSpeed;
    const speedMax = cfg.speedMax ?? visuals.bubbleBaseSpeed + 0.1;
    const particle: BubbleParticle = {
      position: origin.clone().add(new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.1),
        0,
        THREE.MathUtils.randFloatSpread(0.1)
      )),
      velocity: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.05),
        THREE.MathUtils.randFloat(speedMin, speedMax),
        THREE.MathUtils.randFloatSpread(0.05)
      ),
      lifetime: lifetime,
      maxLifetime: lifetime,
      baseScale: THREE.MathUtils.randFloat(sizeMin, sizeMax),
      currentScale: 1,
      alpha: 0.0,
      rotation: THREE.MathUtils.randFloat(0, Math.PI * 2),
      color: new THREE.Color(1, 1, 1),
      wobbleOffset: Math.random() * Math.PI * 2,
    };
    // Set initial visible scale and alpha
    particle.currentScale = particle.baseScale;
    particle.alpha = 0;
    this.particles[targetIndex] = particle;

    // Immediately update buffer for the spawned particle
    this.updateBufferAttributes(targetIndex, particle);
  }

  private updateBufferAttributes(index: number, particle: BubbleParticle): void {
    this.positions[index * 3] = particle.position.x;
    this.positions[index * 3 + 1] = particle.position.y;
    this.positions[index * 3 + 2] = particle.position.z;
    this.scales[index] = particle.currentScale;
    this.alphas[index] = particle.alpha;
    this.colors[index * 3] = particle.color.r;
    this.colors[index * 3 + 1] = particle.color.g;
    this.colors[index * 3 + 2] = particle.color.b;
    this.rotations[index] = particle.rotation;
  }

  /** Emit one or more particles at the given origin */
  public emit(origin: THREE.Vector3, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle(origin);
    }
  }

  public update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    const visuals = configSystem.get('visuals') as any;
    const cfg = visuals.playerTrailBubbles ?? {};
    if (cfg.enabled === false || visuals.enableParticles === false || !visuals.bubblesEnabled) {
      if (this.points.visible) this.points.visible = false;
      return;
    }
    if (!this.points.visible) this.points.visible = true;

    const gravity = cfg.gravity ?? -0.08;
    const wobbleSpeed = cfg.wobbleSpeed ?? 5.0;
    const wobbleAmplitude = cfg.wobbleAmplitude ?? 0.02;

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= deltaTime;

      if (p.lifetime <= 0) {
        // "Kill" particle - hide it by setting alpha/scale to 0 and moving offscreen
        if (this.alphas[i] > 0) { // Only update if it wasn't already dead
          this.alphas[i] = 0;
          this.scales[i] = 0;
          this.positions[i * 3 + 1] = -9999; // Move offscreen
          this.geometry.attributes.aAlpha.needsUpdate = true;
          this.geometry.attributes.aScale.needsUpdate = true;
          this.geometry.attributes.position.needsUpdate = true;
        }
        continue; // Skip further updates for dead particles
      }

      // Update velocity (gravity upward)
      p.velocity.y += gravity * -1 * deltaTime;

      // Update position
      p.position.addScaledVector(p.velocity, deltaTime);

      // Horizontal wobble
      const lifeElapsed = p.maxLifetime - p.lifetime;
      p.position.x += Math.sin(lifeElapsed * wobbleSpeed + p.wobbleOffset) * wobbleAmplitude * deltaTime;

      // Scale growth then shrink
      const lifeRatio = THREE.MathUtils.clamp(1 - p.lifetime / p.maxLifetime, 0, 1);
      p.currentScale = p.baseScale * (0.5 + 0.5 * Math.sin(lifeRatio * Math.PI));

      // Alpha fade in then out
      if (lifeRatio < 0.2) {
        p.alpha = THREE.MathUtils.lerp(0, 1, lifeRatio / 0.2);
      } else if (lifeRatio > 0.8) {
        p.alpha = THREE.MathUtils.lerp(1, 0, (lifeRatio - 0.8) / 0.2);
      } else {
        p.alpha = 1;
      }

      // Update buffer attributes
      this.updateBufferAttributes(i, p);
    }

    // Spawn new particles based on emissionRate
    if (playerPosition) {
      const emissionRate = cfg.emissionRate ?? 10;
      this.emissionAccumulator += emissionRate * deltaTime;
      const spawnXSpread = visuals.bubbleSpawnAreaX ?? 10;
      const spawnDepth = visuals.bubbleSpawnDepth ?? 0.1;
      while (this.emissionAccumulator >= 1) {
        this.emissionAccumulator -= 1;
        const spawnX = playerPosition.x + THREE.MathUtils.randFloatSpread(spawnXSpread);
        const seafloorY = -1.0;
        const spawnPos = new THREE.Vector3(spawnX, seafloorY - spawnDepth, playerPosition.z);
        this.spawnParticle(spawnPos);
      }
    }

    // Mark geometry attributes for GPU update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aScale.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aRotation.needsUpdate = true;

    // Update material uniforms if using ShaderMaterial and not fallback material
    if (this.material.type === 'ShaderMaterial' && this.material.uniforms) {
      if (this.material.uniforms.uBaseSize) {
        this.material.uniforms.uBaseSize.value = visuals.bubbleSize;
      }
      if (this.material.uniforms.uPixelRatio) {
        this.material.uniforms.uPixelRatio.value =
          typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      }
    }
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    if (this.material instanceof THREE.Material) {
      this.material.dispose();
    }
  }
}