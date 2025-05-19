import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';

interface BubbleParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number; // Time remaining
  maxLifetime: number;
  scale: number;
  alpha: number;
  rotation: number; // Optional
  color: THREE.Color;
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

    const config = configSystem.get('visuals');
    const bubbleConfig = config.playerTrailBubbles;
    const lifetime = THREE.MathUtils.randFloat(bubbleConfig.lifetimeMin, bubbleConfig.lifetimeMax);
    const particle: BubbleParticle = {
      position: origin.clone().add(new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.1), // Slight horizontal spread at spawn
        0,
        THREE.MathUtils.randFloatSpread(0.1)
      )),
      // Velocity: upward with slight horizontal drift/wobble
      velocity: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.05),
        THREE.MathUtils.randFloat(bubbleConfig.speedMin, bubbleConfig.speedMax),
        THREE.MathUtils.randFloatSpread(0.05)
      ),
      lifetime: lifetime,
      maxLifetime: lifetime,
      scale: THREE.MathUtils.randFloat(bubbleConfig.particleSizeMin, bubbleConfig.particleSizeMax),
      alpha: bubbleConfig.opacityStart || 1.0,
      rotation: THREE.MathUtils.randFloat(0, Math.PI * 2),
      color: new THREE.Color(bubbleConfig.color1 || 0xffffff),
    };
    this.particles[targetIndex] = particle;

    // Immediately update buffer for the spawned particle
    this.updateBufferAttributes(targetIndex, particle);
  }


  private updateBufferAttributes(index: number, particle: BubbleParticle): void {
    this.positions[index * 3] = particle.position.x;
    this.positions[index * 3 + 1] = particle.position.y;
    this.positions[index * 3 + 2] = particle.position.z;
    this.scales[index] = particle.scale;
    this.alphas[index] = particle.alpha;
    this.colors[index * 3] = particle.color.r;
    this.colors[index * 3 + 1] = particle.color.g;
    this.colors[index * 3 + 2] = particle.color.b;
    this.rotations[index] = particle.rotation;
  }

  public update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    const config = configSystem.get('visuals');
    const bubbleConfig = config.playerTrailBubbles;
    if (!config.enableParticles || !bubbleConfig.enabled) {
      if (this.points.visible) this.points.visible = false;
      return;
    }
    if (!this.points.visible) this.points.visible = true;

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

      // Update position
      p.position.addScaledVector(p.velocity, deltaTime);

      // Simple wobble
      p.position.x += Math.sin(p.lifetime * 5.0 + i) * 0.01;

      // Apply gravity (negative makes bubbles rise)
      if (bubbleConfig.gravity) {
        p.velocity.y += bubbleConfig.gravity * deltaTime;
      }

      // Update alpha (fade out near end of life)
      const lifetimeRatio = p.lifetime / p.maxLifetime;
      p.alpha = THREE.MathUtils.lerp(
        bubbleConfig.opacityEnd || 0,
        bubbleConfig.opacityStart || 1,
        lifetimeRatio
      );

      // Update buffer attributes
      this.updateBufferAttributes(i, p);
    }

    // Spawn new particles periodically based on player position
    if (playerPosition && bubbleConfig.emissionRate) {
      const emissionChance = bubbleConfig.emissionRate * deltaTime / 60; // Convert rate to chance per frame
      if (Math.random() < emissionChance) {
        const spawnX = playerPosition.x + THREE.MathUtils.randFloatSpread(config.bubbleSpawnAreaX);
        // Approximate seafloor height (would be better to query from environment manager)
        const seafloorY = -1.0; 
        const spawnPos = new THREE.Vector3(spawnX, seafloorY - config.bubbleSpawnDepth, playerPosition.z);
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
        this.material.uniforms.uBaseSize.value = bubbleConfig.particleSizeMax;
      }
      if (this.material.uniforms.uPixelRatio) {
        this.material.uniforms.uPixelRatio.value = 
          typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      }
    }
  }

  /**
   * Emit bubbles at a specific position (used for VFX triggers)
   * @param position The position to emit bubbles from
   * @param count Number of bubbles to emit
   */
  public emit(
    position: THREE.Vector3,
    count: number = configSystem.get('visuals').playerTrailBubbles.burstCount ?? 5
  ): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle(position);
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