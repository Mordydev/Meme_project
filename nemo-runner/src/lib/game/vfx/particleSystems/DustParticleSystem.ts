import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { randomPointInSphere } from '../../utils/mathUtils';

interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3; // Used for wandering
  lifetime: number; // Can be infinite or fade in/out
  maxLifetime: number;
  scale: number;
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
  private spawnRadius: number = 15; // Radius around center

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
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.poolSize * 3);
    this.scales = new Float32Array(this.poolSize);
    this.alphas = new Float32Array(this.poolSize);
    this.colors = new Float32Array(this.poolSize * 3);

    // Initialize particles randomly within a sphere
    for (let i = 0; i < this.poolSize; i++) {
      const pos = randomPointInSphere(this.spawnRadius).add(this.centerPosition);
      this.positions[i * 3] = pos.x;
      this.positions[i * 3 + 1] = pos.y;
      this.positions[i * 3 + 2] = pos.z;
      this.scales[i] = THREE.MathUtils.randFloat(0.5, 1.5);
      this.alphas[i] = THREE.MathUtils.randFloat(0.1, 0.5); // Dust is subtle
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
        scale: this.scales[i],
        alpha: this.alphas[i],
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
      uBaseSize: { value: configSystem.get('visuals').dustSize },
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
      }) as THREE.ShaderMaterial;
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

    // Keep particles within bounds (wrap around or clamp)
    if (particle.position.distanceTo(this.centerPosition) > this.spawnRadius * 1.2) {
      // Simple wrap around
      particle.position.sub(this.centerPosition).multiplyScalar(-0.9).add(this.centerPosition);
    }
  }

  private updateBufferAttributes(index: number, particle: DustParticle): void {
    this.positions[index * 3] = particle.position.x;
    this.positions[index * 3 + 1] = particle.position.y;
    this.positions[index * 3 + 2] = particle.position.z;
    this.scales[index] = particle.scale;
    this.alphas[index] = particle.alpha;
    // Color doesn't change per frame for dust typically
  }

  public update(deltaTime: number, playerPosition?: THREE.Vector3): void {
    const config = configSystem.get('visuals');
    if (!config.dustEnabled) {
      if (this.points.visible) this.points.visible = false;
      return;
    }
    if (!this.points.visible) this.points.visible = true;

    if (playerPosition) {
      // Keep the dust cloud generally around the player
      this.centerPosition.copy(playerPosition);
      this.points.position.copy(this.centerPosition); // Move the whole Points object
      // Individual particle positions are relative to this center now
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      // Dust particles wander slowly
      this.updateWander(p, deltaTime, config.dustWanderSpeed);

      // Update buffer attributes (only position changes frequently)
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
        this.material.uniforms.uBaseSize.value = config.dustSize;
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