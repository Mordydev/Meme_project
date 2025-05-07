import * as THREE from 'three';
import { optimizeGeometry } from '../../utils/DeviceUtils';
import { lerp } from '../../utils/MathUtils';
import { EnvironmentTheme } from './EnvironmentTypes';

/**
 * WaterEffects - Manages underwater visual effects
 * 
 * This class creates and manages underwater visual effects:
 * - Caustics (light patterns on ocean floor)
 * - Water surface ripples
 * - Ambient particles (floating dust/plankton)
 * - Light rays
 * - Bubble system with Fresnel-based shader effects
 * 
 * Features:
 * - Performance-optimized instanced mesh rendering for bubbles
 * - Quality settings for different device capabilities
 * - Shader-based animations and visual effects
 * - Dynamic bubble emission system for interactive effects
 */
export class WaterEffects {
  private scene: THREE.Scene;
  private causticsMesh: THREE.Mesh;
  private causticsMaterial: THREE.ShaderMaterial;
  private ambientParticles: THREE.Points;
  private lightRays: THREE.Group;
  private surfaceRipples: THREE.Mesh | null = null;
  private bubbleSystem: THREE.InstancedMesh | null = null;
  private bubbleUniforms: { [key: string]: THREE.IUniform } = {};
  private bubbleVisibility: Float32Array | null = null;
  private bubbleSpeeds: Float32Array | null = null;
  private quality: 'low' | 'medium' | 'high';
  private currentWaterColor: THREE.Color = new THREE.Color(0x2a8e82);
  private currentWaterOpacity: number = 0.7;

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
      
      // Create bubble system
      this.bubbleSystem = this.createBubbleSystem();
      this.scene.add(this.bubbleSystem);
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
      
      // Update bubble system if it exists
      if (this.bubbleSystem) {
        this.updateBubbleSystem(deltaTime, playerPosition);
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
   * Creates the bubble system using instanced mesh for performance
   */
  private createBubbleSystem(): THREE.InstancedMesh {
    // Determine bubble count based on quality
    const bubbleCount = this.quality === 'high' ? 200 : 
                        this.quality === 'medium' ? 100 : 50;
                        
    // Create bubble geometry - simple sphere
    const bubbleGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    
    // Create bubble shader material with Fresnel effect
    const bubbleVertexShader = `
      uniform float uTime;
      attribute float scale;
      attribute float speed;
      attribute float wobbleOffset;
      attribute float visibility;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vVisibility;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Scale the bubble
        vec3 pos = position * scale;
        
        // Add slight wobble effect for more organic look
        float wobble = sin(uTime * 2.0 + wobbleOffset) * 0.05;
        pos.x += wobble * position.y;
        
        // Set instance position
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Pass instance position to fragment shader for Fresnel effect
        vPosition = mvPosition.xyz;
        
        // Pass visibility to fragment shader
        vVisibility = visibility;
      }
    `;
    
    const bubbleFragmentShader = `
      uniform float uTime;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vVisibility;
      
      void main() {
        // Discard if not visible
        if (vVisibility < 0.5) discard;
        
        // Direction from camera to fragment (view direction)
        vec3 viewDir = normalize(-vPosition);
        
        // Fresnel effect (stronger at grazing angles)
        float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.0);
        
        // Base bubble color (nearly transparent)
        vec3 bubbleColor = vec3(0.8, 0.9, 1.0);
        
        // Rainbow effect on the edges
        vec3 rainbowEdge = vec3(
          0.5 + 0.5 * sin(uTime + vUv.y * 5.0),
          0.5 + 0.5 * sin(uTime + vUv.y * 5.0 + 2.0),
          0.5 + 0.5 * sin(uTime + vUv.y * 5.0 + 4.0)
        );
        
        // Highlight the edges with the fresnel effect
        vec3 finalColor = mix(bubbleColor, rainbowEdge, fresnel * 0.3);
        
        // Set opacity based on fresnel (more transparent in center, more opaque at edges)
        float opacity = 0.2 + fresnel * 0.5;
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `;
    
    // Create uniforms for the shader
    this.bubbleUniforms = {
      uTime: { value: 0 }
    };
    
    const bubbleMaterial = new THREE.ShaderMaterial({
      vertexShader: bubbleVertexShader,
      fragmentShader: bubbleFragmentShader,
      uniforms: this.bubbleUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    // Create instanced mesh for bubbles
    const bubbleSystem = new THREE.InstancedMesh(
      bubbleGeometry,
      bubbleMaterial,
      bubbleCount
    );
    
    // Set initial bubble attributes
    const dummy = new THREE.Object3D();
    const scales = new Float32Array(bubbleCount);
    const speeds = new Float32Array(bubbleCount);
    const wobbleOffsets = new Float32Array(bubbleCount);
    this.bubbleVisibility = new Float32Array(bubbleCount);
    this.bubbleSpeeds = speeds;
    
    // Set instance attributes for each bubble
    bubbleGeometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1));
    bubbleGeometry.setAttribute('speed', new THREE.InstancedBufferAttribute(speeds, 1));
    bubbleGeometry.setAttribute('wobbleOffset', new THREE.InstancedBufferAttribute(wobbleOffsets, 1));
    bubbleGeometry.setAttribute('visibility', new THREE.InstancedBufferAttribute(this.bubbleVisibility, 1));
    
    // Initialize bubble positions and attributes
    for (let i = 0; i < bubbleCount; i++) {
      // Random position in a volume
      const x = (Math.random() - 0.5) * 30;
      const y = Math.random() * 5;
      const z = (Math.random() - 0.5) * 100;
      
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      bubbleSystem.setMatrixAt(i, dummy.matrix);
      
      // Set bubble attributes
      scales[i] = 0.5 + Math.random() * 1.0; // Random size
      speeds[i] = 0.2 + Math.random() * 0.3; // Random speed
      wobbleOffsets[i] = Math.random() * Math.PI * 2; // Random wobble phase
      this.bubbleVisibility[i] = Math.random() > 0.5 ? 1.0 : 0.0; // Random initial visibility
    }
    
    // Update the instanced attributes
    bubbleGeometry.attributes.scale.needsUpdate = true;
    bubbleGeometry.attributes.speed.needsUpdate = true;
    bubbleGeometry.attributes.wobbleOffset.needsUpdate = true;
    bubbleGeometry.attributes.visibility.needsUpdate = true;
    
    // Update instance matrices
    bubbleSystem.instanceMatrix.needsUpdate = true;
    
    return bubbleSystem;
  }
  
  /**
   * Updates bubble system - animates bubbles rising
   */
  private updateBubbleSystem(deltaTime: number, playerPosition: THREE.Vector3) {
    if (!this.bubbleSystem || !this.bubbleVisibility || !this.bubbleSpeeds) return;
    
    // Update time uniform for bubble shader
    if (this.bubbleUniforms.uTime) {
      this.bubbleUniforms.uTime.value += deltaTime;
    }
    
    const dummy = new THREE.Object3D();
    const visibilityAttr = this.bubbleSystem.geometry.attributes.visibility as THREE.InstancedBufferAttribute;
    
    // Get current matrix for each bubble
    for (let i = 0; i < this.bubbleSystem.count; i++) {
      // Skip bubbles that aren't visible
      if (this.bubbleVisibility[i] < 0.5) continue;
      
      this.bubbleSystem.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      
      // Move bubble upward based on its speed
      dummy.position.y += this.bubbleSpeeds[i] * deltaTime;
      
      // Add slight horizontal drift
      dummy.position.x += Math.sin(this.bubbleUniforms.uTime.value * 0.2 + i * 0.1) * 0.01 * deltaTime;
      
      // If bubble rises too high, reset it to the bottom
      if (dummy.position.y > 10) {
        dummy.position.y = -1;
        dummy.position.x = (Math.random() - 0.5) * 30;
        dummy.position.z = playerPosition.z + (Math.random() - 0.5) * 50;
        
        // Randomize visibility
        this.bubbleVisibility[i] = Math.random() > 0.3 ? 1.0 : 0.0;
        visibilityAttr.setX(i, this.bubbleVisibility[i]);
      }
      
      // If bubble is too far behind the player, move it ahead
      if (Math.abs(dummy.position.z - playerPosition.z) > 60) {
        dummy.position.z = playerPosition.z + (Math.random() - 0.5) * 40;
      }
      
      // Update matrix for this instance
      dummy.updateMatrix();
      this.bubbleSystem.setMatrixAt(i, dummy.matrix);
    }
    
    // Mark instance attributes as needing updates
    this.bubbleSystem.instanceMatrix.needsUpdate = true;
    visibilityAttr.needsUpdate = true;
  }
  
  /**
   * Set the visibility of specific bubbles
   */
  setBubbleVisibility(index: number, visible: boolean) {
    if (!this.bubbleVisibility || index >= this.bubbleVisibility.length) return;
    
    this.bubbleVisibility[index] = visible ? 1.0 : 0.0;
    
    // Update the visibility attribute
    const visibilityAttr = this.bubbleSystem?.geometry.attributes.visibility as THREE.InstancedBufferAttribute;
    if (visibilityAttr) {
      visibilityAttr.setX(index, this.bubbleVisibility[index]);
      visibilityAttr.needsUpdate = true;
    }
  }
  
  /**
   * Emits a burst of bubbles at a specific position (e.g., for character movement)
   */
  emitBubbleBurst(position: THREE.Vector3, count: number = 5) {
    if (!this.bubbleSystem || !this.bubbleVisibility) return;
    
    const dummy = new THREE.Object3D();
    const visibilityAttr = this.bubbleSystem.geometry.attributes.visibility as THREE.InstancedBufferAttribute;
    
    // Find invisible bubbles to repurpose
    let emitted = 0;
    for (let i = 0; i < this.bubbleSystem.count && emitted < count; i++) {
      if (this.bubbleVisibility[i] < 0.5) {
        // Set position near the emission point with slight randomness
        this.bubbleSystem.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        dummy.position.set(
          position.x + (Math.random() - 0.5) * 0.5,
          position.y + (Math.random() - 0.5) * 0.5,
          position.z + (Math.random() - 0.5) * 0.5
        );
        
        // Make bubble visible
        this.bubbleVisibility[i] = 1.0;
        visibilityAttr.setX(i, 1.0);
        
        // Update matrix
        dummy.updateMatrix();
        this.bubbleSystem.setMatrixAt(i, dummy.matrix);
        
        emitted++;
      }
    }
    
    if (emitted > 0) {
      // Update instance matrices
      this.bubbleSystem.instanceMatrix.needsUpdate = true;
      visibilityAttr.needsUpdate = true;
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
      
      // Remove bubble system for low quality
      if (this.bubbleSystem && this.bubbleSystem.parent) {
        this.scene.remove(this.bubbleSystem);
        this.bubbleSystem.geometry.dispose();
        if (this.bubbleSystem.material instanceof THREE.Material) {
          this.bubbleSystem.material.dispose();
        }
        this.bubbleSystem = null;
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
      
      // Handle bubble system
      if (!this.bubbleSystem) {
        this.bubbleSystem = this.createBubbleSystem();
        this.scene.add(this.bubbleSystem);
      } else {
        // Adjust bubble count based on quality
        const targetCount = quality === 'high' ? 200 : 100;
        if (this.bubbleSystem.count !== targetCount) {
          // Remove existing bubble system
          this.scene.remove(this.bubbleSystem);
          this.bubbleSystem.geometry.dispose();
          if (this.bubbleSystem.material instanceof THREE.Material) {
            this.bubbleSystem.material.dispose();
          }
          
          // Create new bubble system with appropriate count
          this.bubbleSystem = this.createBubbleSystem();
          this.scene.add(this.bubbleSystem);
        }
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
  
  /**
   * Updates water effects based on the environment theme
   */
  updateTheme(theme: EnvironmentTheme, transitionProgress: number = 1.0): void {
    // Update water color and opacity using theme values
    const targetWaterColor = new THREE.Color(theme.waterColor || theme.backgroundColor);
    const targetWaterOpacity = theme.waterOpacity || 0.7; // Default to 0.7 if not specified
    
    if (transitionProgress < 1.0) {
      // Interpolate between current and target colors
      const tempColor = new THREE.Color();
      tempColor.r = lerp(this.currentWaterColor.r, targetWaterColor.r, transitionProgress);
      tempColor.g = lerp(this.currentWaterColor.g, targetWaterColor.g, transitionProgress);
      tempColor.b = lerp(this.currentWaterColor.b, targetWaterColor.b, transitionProgress);
      
      // Interpolate opacity
      const opacity = lerp(this.currentWaterOpacity, targetWaterOpacity, transitionProgress);
      
      // Update caustics
      if (this.causticsMaterial && this.causticsMaterial.fragmentShader) {
        // We're not directly modifying the shader here, but in a real implementation
        // we might update uniform values that control the water appearance
      }
      
      // Update ambient particles color
      if (this.ambientParticles && this.ambientParticles.material instanceof THREE.ShaderMaterial) {
        // In a real implementation, we'd update particle colors based on the theme
      }
      
      // Update light rays if they exist
      if (this.quality !== 'low' && this.lightRays) {
        this.lightRays.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
            // Update ray colors based on the theme
          }
        });
      }
      
      // Update surface ripples if they exist
      if (this.surfaceRipples && this.surfaceRipples.material instanceof THREE.ShaderMaterial) {
        // Update ripple color and opacity
      }
    } else {
      // If transition is complete, just set the final values
      this.currentWaterColor = targetWaterColor.clone();
      this.currentWaterOpacity = targetWaterOpacity;
    }
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
    
    // Clean up bubble system
    if (this.bubbleSystem) {
      if (this.bubbleSystem.geometry) {
        this.bubbleSystem.geometry.dispose();
      }
      if (this.bubbleSystem.material instanceof THREE.Material) {
        this.bubbleSystem.material.dispose();
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
    if (this.bubbleSystem && this.bubbleSystem.parent) {
      this.scene.remove(this.bubbleSystem);
    }
  }
}