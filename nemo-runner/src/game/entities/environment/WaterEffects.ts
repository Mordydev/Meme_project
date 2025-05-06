import * as THREE from 'three';
import { optimizeGeometry } from '../../utils/DeviceUtils';

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
  private surfaceRipples: THREE.Mesh | null = null;
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
    
    // Apply geometry optimization to particle systems
    if (this.quality !== 'high') {
      this.ambientParticles.geometry = optimizeGeometry(this.ambientParticles.geometry, 
        this.quality === 'medium' ? 0.8 : 0.5);
    }
    
    // Create light rays if quality allows
    this.lightRays = this.createLightRays();
    if (this.quality !== 'low') {
      this.scene.add(this.lightRays);
      
      // Create surface ripples (medium and high quality only)
      this.surfaceRipples = this.createSurfaceRipples();
      this.scene.add(this.surfaceRipples);
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
      
      // Voronoi cellular noise - creates more realistic caustics patterns
      float voronoi(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        float minDist = 1.0;
        
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            // Convert hash output to vec2 by using it twice with offsets
            float h = hash(i + neighbor);
            vec2 point = vec2(h, hash(i + neighbor + vec2(42.0, 17.0))) * 0.5 + 0.5;
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
          }
        }
        
        return minDist;
      }
      
      void main() {
        // Scale UVs for better caustics density
        vec2 scaledUv = vUv * 5.0;
        
        // Create moving caustics with multiple layers of noise
        float caustics1 = fbm(scaledUv + uTime * 0.05);
        float caustics2 = fbm(scaledUv * 1.2 - uTime * 0.06);
        
        // Add voronoi cellular noise for more realistic water caustics patterns
        float cellNoise = voronoi(scaledUv * 1.5 + vec2(uTime * 0.04, uTime * 0.02));
        cellNoise = pow(1.0 - cellNoise, 2.0); // Invert and sharpen
        
        // Combine noise layers with different weights
        float caustics = smoothstep(0.4, 0.6, caustics1 * caustics2);
        caustics = max(caustics, cellNoise * 0.7); // Blend with cellular noise
        
        // Create more defined caustic edges with contrast
        caustics = smoothstep(0.3, 0.7, caustics);
        
        // Apply color
        vec3 baseColor = vec3(0.2, 0.5, 0.9); // Blue underwater color
        vec3 causticColor = vec3(1.0, 1.0, 0.9); // Slight yellow for caustics
        
        vec3 finalColor = mix(baseColor * 0.5, causticColor, caustics * 0.7);
        
        // Add subtle color variation based on position and time
        finalColor += vec3(0.05, 0.05, 0.1) * sin(scaledUv.x * 10.0 + uTime);
        
        // Apply intensity based on noise pattern
        gl_FragColor = vec4(finalColor, 0.7);
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
      
      // Adjust light ray positions to follow player
      if (Math.abs(this.lightRays.position.z - playerPosition.z) > 20) {
        this.lightRays.position.z = playerPosition.z;
        
        // Randomize some ray positions for more variety
        this.lightRays.children.forEach((child, index) => {
          if (index % 3 === 0) { // Only update every third ray for performance
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 30;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            child.position.set(x, 5, 0); // Local position relative to group
            
            // Angle ray towards player with variation
            child.lookAt(0, -5 + Math.random() * 10, 0);
            
            // Small random rotation for variety
            child.rotation.z = (Math.random() - 0.5) * 0.5;
          }
        });
      }
      
      // Update surface ripples
      if (this.surfaceRipples && this.surfaceRipples.material instanceof THREE.ShaderMaterial) {
        // Update time uniform for ripple shader
        this.surfaceRipples.material.uniforms.uTime.value += deltaTime;
        
        // Position surface ripples above player
        this.surfaceRipples.position.z = playerPosition.z;
      }
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
      
      // Remove surface ripples for low quality
      if (this.surfaceRipples && this.surfaceRipples.parent) {
        this.scene.remove(this.surfaceRipples);
      }
    } else {
      // Add light rays for medium and high quality
      if (!this.lightRays.parent) {
        this.scene.add(this.lightRays);
      }
      
      // Handle surface ripples
      if (!this.surfaceRipples) {
        this.surfaceRipples = this.createSurfaceRipples();
      }
      
      if (this.surfaceRipples && !this.surfaceRipples.parent) {
        this.scene.add(this.surfaceRipples);
      }
      
      // Adjust light ray detail based on quality
      if (quality === 'high') {
        // More light rays for high quality
        while (this.lightRays.children.length < 15) {
          const newRay = this.createLightRay();
          this.lightRays.add(newRay);
        }
      } else {
        // Fewer light rays for medium quality
        while (this.lightRays.children.length > 8) {
          const lastChild = this.lightRays.children[this.lightRays.children.length - 1];
          this.lightRays.remove(lastChild);
          
          if (lastChild instanceof THREE.Mesh) {
            if (lastChild.geometry) lastChild.geometry.dispose();
            if (lastChild.material instanceof THREE.Material) lastChild.material.dispose();
          }
        }
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
   * Creates a single light ray (helper for quality adjustment)
   */
  private createLightRay(): THREE.Mesh {
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
    
    ray.position.set(x, 5, 0);
    
    // Angle ray towards center with variation
    ray.lookAt(0, -5 + Math.random() * 10, 0);
    
    // Small random rotation for variety
    ray.rotation.z = (Math.random() - 0.5) * 0.5;
    
    return ray;
  }

  /**
   * Clean up resources
   */
  /**
   * Creates water surface ripples effect
   */
  private createSurfaceRipples(): THREE.Mesh {
    const width = 60;
    const length = 100;
    
    // Create a plane for the water surface
    const geometry = new THREE.PlaneGeometry(width, length, 32, 32);
    
    // Ripple shader material
    const rippleVertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      // Wave function for ripples
      float wave(vec2 position, float time, float frequency, float amplitude, float speed, float sharpness) {
        float phase = time * speed;
        float theta = dot(position, vec2(cos(phase), sin(phase)));
        return pow(0.5 + 0.5 * sin(theta * frequency), sharpness) * amplitude;
      }
      
      void main() {
        vUv = uv;
        
        // Base position
        vec3 pos = position;
        
        // Apply multiple wave patterns for realistic ripples
        float time = uTime * 0.5;
        
        // First wave set - larger
        float wave1 = wave(position.xz * 0.1, time, 4.0, 0.2, 0.3, 1.0);
        
        // Second wave set - medium
        float wave2 = wave(position.xz * 0.15, time + 10.0, 6.0, 0.1, 0.5, 2.0);
        
        // Third wave set - smaller, faster
        float wave3 = wave(position.xz * 0.3, time + 30.0, 10.0, 0.05, 1.0, 3.0);
        
        // Combine waves
        pos.y += wave1 + wave2 + wave3;
        
        // Compute normal based on wave gradients
        // Simple finite difference approximation
        float delta = 0.01;
        float dx = wave1 + wave2 + wave3;
        float dy = wave(position.xz * 0.1 + vec2(delta, 0.0), time, 4.0, 0.2, 0.3, 1.0) +
                  wave(position.xz * 0.15 + vec2(delta, 0.0), time + 10.0, 6.0, 0.1, 0.5, 2.0) +
                  wave(position.xz * 0.3 + vec2(delta, 0.0), time + 30.0, 10.0, 0.05, 1.0, 3.0) - dx;
                  
        float dz = wave(position.xz * 0.1 + vec2(0.0, delta), time, 4.0, 0.2, 0.3, 1.0) +
                  wave(position.xz * 0.15 + vec2(0.0, delta), time + 10.0, 6.0, 0.1, 0.5, 2.0) +
                  wave(position.xz * 0.3 + vec2(0.0, delta), time + 30.0, 10.0, 0.05, 1.0, 3.0) - dx;
        
        vNormal = normalize(vec3(-dy/delta, 1.0, -dz/delta));
        
        // Final position
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const rippleFragmentShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        // Water color
        vec3 baseColor = vec3(0.2, 0.5, 0.9);
        
        // Basic lighting
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Fresnel effect for water surface
        float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 5.0);
        
        // Combine colors with fresnel
        vec3 color = mix(baseColor, vec3(1.0), fresnel * 0.7);
        
        // Add some time-based variation
        color += vec3(0.05) * sin(vUv.x * 10.0 + uTime * 0.5);
        
        gl_FragColor = vec4(color, 0.8); // Semi-transparent
      }
    `;
    
    const material = new THREE.ShaderMaterial({
      vertexShader: rippleVertexShader,
      fragmentShader: rippleFragmentShader,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Horizontal plane
    mesh.position.y = 8; // Above the game area
    
    return mesh;
  }
  
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
    
    // Clean up surface ripples
    if (this.surfaceRipples) {
      if (this.surfaceRipples.geometry) {
        this.surfaceRipples.geometry.dispose();
      }
      if (this.surfaceRipples.material instanceof THREE.Material) {
        this.surfaceRipples.material.dispose();
      }
    }
    
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
    if (this.surfaceRipples && this.surfaceRipples.parent) {
      this.scene.remove(this.surfaceRipples);
    }
  }
}