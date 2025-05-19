import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';

interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3; // Used for wandering
  lifetime: number; // Can be infinite or fade in/out
  maxLifetime: number;
  baseScale: number;
  currentScale: number;
  baseAlpha: number;
  alpha: number;
  color: THREE.Color;
  wanderTarget: THREE.Vector3;
  wanderTheta: number;
}

export class DustParticleSystem {
  private particles: DustParticle[] = [];
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  public points!: THREE.Points;
  private poolSize: number;
  private shaderManager: ShaderManager;
  private scene: THREE.Scene;
  private centerPosition: THREE.Vector3 = new THREE.Vector3(); // Center around which dust appears
  private spawnAreaSize: THREE.Vector3 = new THREE.Vector3(30, 10, 40);
  private spawnAreaHalf: THREE.Vector3 = this.spawnAreaSize.clone().multiplyScalar(0.5);

  // Attribute buffers
  private positions!: Float32Array;
  private scales!: Float32Array;
  private alphas!: Float32Array;
  private colors!: Float32Array;

  constructor(scene: THREE.Scene, shaderManager: ShaderManager, poolSize: number) {
    this.scene = scene;
    this.shaderManager = shaderManager;
    this.poolSize = poolSize;
    this.initialize();
  }

  private initialize(): void {
    const visuals = configSystem.get('visuals') as any;
    const cfg = visuals.ambientDust ?? {};
    if (cfg.spawnAreaSize) {
      this.spawnAreaSize.set(cfg.spawnAreaSize.x, cfg.spawnAreaSize.y, cfg.spawnAreaSize.z);
      this.spawnAreaHalf.copy(this.spawnAreaSize).multiplyScalar(0.5);
    }

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.poolSize * 3);
    this.scales = new Float32Array(this.poolSize);
    this.alphas = new Float32Array(this.poolSize);
    this.colors = new Float32Array(this.poolSize * 3);

    // Initialize particles randomly within the spawn volume
    for (let i = 0; i < this.poolSize; i++) {
      const pos = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(this.spawnAreaSize.x),
        THREE.MathUtils.randFloatSpread(this.spawnAreaSize.y),
        THREE.MathUtils.randFloatSpread(this.spawnAreaSize.z)
      ).add(this.centerPosition);
      this.positions[i * 3] = pos.x;
      this.positions[i * 3 + 1] = pos.y;
      this.positions[i * 3 + 2] = pos.z;
      const scale = THREE.MathUtils.randFloat(0.5, 1.5);
      const alpha = THREE.MathUtils.randFloat(0.1, 0.5); // Dust is subtle
      this.scales[i] = scale;
      this.alphas[i] = alpha;
      const greyValue = THREE.MathUtils.randFloat(0.6, 0.9);
      this.colors[i * 3] = greyValue;
      this.colors[i * 3 + 1] = greyValue;
      this.colors[i * 3 + 2] = greyValue;

      // Initialize particle object state
      this.particles[i] = {
        position: pos.clone(),
        velocity: new THREE.Vector3(),
        lifetime: Infinity, // Dust persists
        maxLifetime: Infinity,
        baseScale: scale,
        currentScale: scale,
        baseAlpha: alpha,
        alpha: alpha,
        color: new THREE.Color(greyValue, greyValue, greyValue),
        wanderTarget: new THREE.Vector3(),
        wanderTheta: Math.random() * Math.PI * 2
      };
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));

    // Use ShaderManager to get the material
    this.material = this.shaderManager.createShaderMaterial('dustShader', {
      uBaseColor: { value: new THREE.Color(0xffffff) },
      uBaseSize: { value: visuals.dustSize },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
      uOpacity: { value: 0.7 }, // Overall opacity for dust cloud
    });

    if (!this.material) {
      console.error("DustParticleSystem: Failed to create dustShader. Using fallback PointsMaterial.");
      this.material = new THREE.PointsMaterial({ 
        size: 0.05, 
        color: 0xaaaaaa, 
        transparent: true, 
        opacity: 0.3 
      }) as any;
    } else {
      this.material.transparent = true;
      this.material.depthWrite = false;
      this.material.blending = THREE.NormalBlending; // Normal blending for dust
    }

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = "DustParticles";
    this.scene.add(this.points);
  }

  // Simple wander behavior
  private updateWander(particle: DustParticle, dt: number, speed: number): void {
    particle.wanderTheta += THREE.MathUtils.randFloatSpread(0.5) * dt; // Change direction slowly
    const wanderForce = new THREE.Vector3(
      Math.cos(particle.wanderTheta),
      Math.sin(particle.wanderTheta),
      Math.cos(particle.wanderTheta * 0.5)
    ); // Simple 3D wander
    wanderForce.multiplyScalar(speed * dt);
    particle.position.add(wanderForce);

    // Wrap particles when leaving volume
    if (particle.position.x > this.centerPosition.x + this.spawnAreaHalf.x) {
      particle.position.x -= this.spawnAreaSize.x;
    } else if (particle.position.x < this.centerPosition.x - this.spawnAreaHalf.x) {
      particle.position.x += this.spawnAreaSize.x;
    }
    if (particle.position.y > this.centerPosition.y + this.spawnAreaHalf.y) {
      particle.position.y -= this.spawnAreaSize.y;
    } else if (particle.position.y < this.centerPosition.y - this.spawnAreaHalf.y) {
      particle.position.y += this.spawnAreaSize.y;
    }
    if (particle.position.z > this.centerPosition.z + this.spawnAreaHalf.z) {
      particle.position.z -= this.spawnAreaSize.z;
    } else if (particle.position.z < this.centerPosition.z - this.spawnAreaHalf.z) {
      particle.position.z += this.spawnAreaSize.z;
    }
  }

  private updateBufferAttributes(index: number, particle: DustParticle): void {
    this.positions[index * 3] = particle.position.x;
    this.positions[index * 3 + 1] = particle.position.y;
    this.positions[index * 3 + 2] = particle.position.z;
    this.scales[index] = particle.currentScale;
    this.alphas[index] = particle.alpha;
    // Color doesn't change per frame for dust typically
  }

  public update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    const visuals = configSystem.get('visuals') as any;
    const cfg = visuals.ambientDust ?? {};
    if (cfg.enabled === false || visuals.enableParticles === false || !visuals.dustEnabled) {
      if (this.points.visible) this.points.visible = false;
      return;
    }
    if (!this.points.visible) this.points.visible = true;

    if (playerPosition) {
      // Keep the dust cloud generally around the player
      this.centerPosition.copy(playerPosition);
      this.points.position.copy(this.centerPosition);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const speed = THREE.MathUtils.randFloat(cfg.speedMin ?? visuals.dustWanderSpeed, cfg.speedMax ?? visuals.dustWanderSpeed);
      this.updateWander(p, deltaTime, speed);

      // Subtle twinkle
      p.alpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(p.wanderTheta * 0.5));
      p.currentScale = p.baseScale * (0.8 + 0.2 * Math.sin(p.wanderTheta * 0.5));

      this.updateBufferAttributes(i, p);
    }

    // Mark geometry attributes for GPU update
    this.geometry.attributes.position.needsUpdate = true;
    // Scale and alpha might change if dust fades in/out
    // this.geometry.attributes.aScale.needsUpdate = true;
    // this.geometry.attributes.aAlpha.needsUpdate = true;

    // Update material uniforms if using ShaderMaterial and not fallback material
    if (this.material.type === 'ShaderMaterial' && this.material.uniforms) {
      if (this.material.uniforms.uBaseSize) {
        this.material.uniforms.uBaseSize.value = visuals.dustSize;
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