import * as THREE from 'three';

/**
 * WaterEffects - Manages underwater visual effects
 * 
 * This class creates and manages underwater visual effects:
 * - Caustics (light patterns on ocean floor)
 * - Water surface ripples
 * - Ambient particles (floating dust/plankton)
 * - Light rays
 */
export class WaterEffects {
  private scene: THREE.Scene;
  private causticsMesh: THREE.Mesh;
  private causticsMaterial: THREE.ShaderMaterial;
  private ambientParticles: THREE.Points;
  private lightRays: THREE.Group;
  private quality: 'low' | 'medium' | 'high';

  constructor(scene: THREE.Scene, quality: 'low' | 'medium' | 'high' = 'medium') {
    this.scene = scene;
    this.quality = quality;
    
    // Create underwater caustics
    const { mesh, material } = this.createCaustics();
    this.causticsMesh = mesh;
    this.causticsMaterial = material;
    this.scene.add(this.causticsMesh);
    
    // Create ambient particles
    this.ambientParticles = this.createAmbientParticles();
    this.scene.add(this.ambientParticles);
    
    // Create light rays if quality allows
    this.lightRays = this.createLightRays();
    if (this.quality !== 'low') {
      this.scene.add(this.lightRays);
    }
  }

  /**
   * Creates caustics effect (light patterns on ocean floor)
   */
  private createCaustics(): { mesh: THREE.Mesh, material: THREE.ShaderMaterial } {
    // Caustics shader material
    const causticsVertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const causticsFragmentShader = `
      uniform float uTime;
      varying vec2 vUv;
      
      // Simple hash function
      float hash(vec2 p) {
        float h = dot(p, vec2(127.1, 311.7));	
        return fract(sin(h) * 43758.5453123);
      }
      
      // 2D noise function
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      // FBM (Fractal Brownian Motion)
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 3.0;
        
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        // Scale UVs for better caustics density
        vec2 scaledUv = vUv * 5.0;
        
        // Create moving caustics with multiple layers of noise
        float caustics1 = fbm(scaledUv + uTime * 0.05);
        float caustics2 = fbm(scaledUv * 1.2 - uTime * 0.06);
        
        // Combine noise layers with different weights
        float caustics = smoothstep(0.4, 0.6, caustics1 * caustics2);
        
        // Apply color
        vec3 baseColor = vec3(0.2, 0.5, 0.9); // Blue underwater color
        vec3 causticColor = vec3(1.0, 1.0, 0.9); // Slight yellow for caustics
        
        vec3 finalColor = mix(baseColor * 0.5, causticColor, caustics * 0.5);
        
        // Apply intensity based on noise pattern
        gl_FragColor = vec4(finalColor, 0.6);
      }
    `;
    
    const material = new THREE.ShaderMaterial({
      vertexShader: causticsVertexShader,
      fragmentShader: causticsFragmentShader,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    // Create a plane for the caustics
    const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    mesh.position.y = -1.95; // Just above the ocean floor
    mesh.renderOrder = 1; // Render after the floor
    
    return { mesh, material };
  }

  /**
   * Creates ambient particles floating in the water
   */
  private createAmbientParticles(): THREE.Points {
    // Determine particles count based on quality
    const particleCount = this.quality === 'high' ? 2000 : 
                          this.quality === 'medium' ? 1000 : 
                          500;
    
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    
    const color1 = new THREE.Color(0xffffff); // White
    const color2 = new THREE.Color(0x88ccff); // Light blue
    
    // Create particles in a large volume around the player's path
    for (let i = 0; i < particleCount; i++) {
      // Position in a volume that extends ahead of the player
      const x = (Math.random() - 0.5) * 40;
      const y = Math.random() * 4; // Keep above the floor
      const z = (Math.random() - 0.5) * 100; // Extend far ahead and behind
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random sizes, smaller on average for better performance
      sizes[i] = Math.random() * 0.3 + 0.05;
      
      // Mix between two colors
      const mixFactor = Math.random();
      const particleColor = new THREE.Color().lerpColors(color1, color2, mixFactor);
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Particle shader material
    const particleVertexShader = `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const particleFragmentShader = `
      varying vec3 vColor;
      
      void main() {
        // Create circular particle
        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (r > 0.5) discard;
        
        // Fade out towards the edges
        float alpha = 1.0 - smoothstep(0.3, 0.5, r);
        
        gl_FragColor = vec4(vColor, alpha * 0.6);
      }
    `;
    
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    return new THREE.Points(particleGeometry, particleMaterial);
  }

  /**
   * Creates light rays effect
   */
  private createLightRays(): THREE.Group {
    const group = new THREE.Group();
    
    // Skip on low quality
    if (this.quality === 'low') return group;
    
    // Determine ray count based on quality
    const rayCount = this.quality === 'high' ? 15 : 8;
    
    for (let i = 0; i < rayCount; i++) {
      // Create ray geometry
      const height = 10 + Math.random() * 10;
      const width = 0.5 + Math.random() * 1.5;
      
      const rayGeometry = new THREE.PlaneGeometry(width, height, 1, 4);
      
      // Light ray shader material
      const rayMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec2 vUv;
          
          void main() {
            // Create gradient from bottom to top
            float gradient = smoothstep(0.0, 0.8, vUv.y);
            
            // Add some variation along the ray
            float variation = sin(vUv.y * 10.0 + uTime * 0.5) * 0.1 + 0.9;
            
            // Calculate final alpha
            float alpha = (1.0 - gradient) * variation * 0.3;
            
            // Light ray color
            vec3 rayColor = vec3(1.0, 1.0, 0.9);
            
            gl_FragColor = vec4(rayColor, alpha);
          }
        `,
        uniforms: {
          uTime: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      
      // Position ray randomly
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      ray.position.set(x, 5, z);
      
      // Angle ray towards center with variation
      ray.lookAt(0, -5 + Math.random() * 10, 0);
      
      // Small random rotation for variety
      ray.rotation.z = (Math.random() - 0.5) * 0.5;
      
      group.add(ray);
    }
    
    return group;
  }

  /**
   * Update water effects with time
   */
  update(deltaTime: number, playerPosition: THREE.Vector3) {
    // Update caustics shader time
    if (this.causticsMaterial.uniforms) {
      this.causticsMaterial.uniforms.uTime.value += deltaTime;
    }
    
    // Update light ray materials
    if (this.quality !== 'low') {
      this.lightRays.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          child.material.uniforms.uTime.value += deltaTime;
        }
      });
    }
    
    // Move caustics with player
    this.causticsMesh.position.z = playerPosition.z;
    
    // Update ambient particles
    this.updateAmbientParticles(deltaTime, playerPosition);
  }

  /**
   * Updates ambient particles positions
   */
  private updateAmbientParticles(deltaTime: number, playerPosition: THREE.Vector3) {
    if (this.ambientParticles.geometry instanceof THREE.BufferGeometry) {
      const positionAttribute = this.ambientParticles.geometry.attributes.position;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        // Get current position
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        // Calculate position relative to player
        const relZ = z - playerPosition.z;
        
        // If particle is too far behind, move it ahead
        if (relZ < -50) {
          positionAttribute.setZ(i, playerPosition.z + 50 + Math.random() * 10);
        } 
        
        // Apply gentle swaying motion
        const time = performance.now() * 0.001;
        const newX = x + Math.sin(time * 0.2 + i * 0.1) * 0.01 * deltaTime;
        const newY = y + Math.cos(time * 0.3 + i * 0.05) * 0.01 * deltaTime;
        
        positionAttribute.setX(i, newX);
        positionAttribute.setY(i, newY);
      }
      
      positionAttribute.needsUpdate = true;
    }
  }

  /**
   * Set the visual quality of water effects
   */
  setQuality(quality: 'low' | 'medium' | 'high') {
    // Only update if quality changed
    if (this.quality === quality) return;
    
    this.quality = quality;
    
    // Update light rays
    if (quality === 'low') {
      if (this.lightRays.parent) {
        this.scene.remove(this.lightRays);
      }
    } else {
      if (!this.lightRays.parent) {
        this.scene.add(this.lightRays);
      }
    }
    
    // Recreate ambient particles with new count
    this.scene.remove(this.ambientParticles);
    this.ambientParticles.geometry.dispose();
    if (this.ambientParticles.material instanceof THREE.Material) {
      this.ambientParticles.material.dispose();
    }
    
    this.ambientParticles = this.createAmbientParticles();
    this.scene.add(this.ambientParticles);
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Clean up caustics
    if (this.causticsMesh.geometry) {
      this.causticsMesh.geometry.dispose();
    }
    if (this.causticsMaterial) {
      this.causticsMaterial.dispose();
    }
    
    // Clean up ambient particles
    if (this.ambientParticles.geometry) {
      this.ambientParticles.geometry.dispose();
    }
    if (this.ambientParticles.material instanceof THREE.Material) {
      this.ambientParticles.material.dispose();
    }
    
    // Clean up light rays
    this.lightRays.traverse(object => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    // Remove from scene
    if (this.causticsMesh.parent) {
      this.scene.remove(this.causticsMesh);
    }
    if (this.ambientParticles.parent) {
      this.scene.remove(this.ambientParticles);
    }
    if (this.lightRays.parent) {
      this.scene.remove(this.lightRays);
    }
  }
}