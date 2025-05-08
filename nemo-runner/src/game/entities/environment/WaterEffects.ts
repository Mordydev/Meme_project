import * as THREE from 'three';
import { optimizeGeometry } from '../../utils/DeviceUtils';
import { lerp } from '../../utils/MathUtils';
import { EnvironmentTheme } from './EnvironmentTypes';
import { ShaderLibrary, createShaderWithLibrary } from '../../utils/ShaderLibrary';

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
    // Caustics shader material - using the ShaderLibrary
    const causticsVertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const causticsFragmentShader = `
      uniform float uTime;
      uniform vec3 uWaterColor;
      uniform float uWaterIntensity;
      varying vec2 vUv;
      
      // Include noise functions from ShaderLibrary
      #include <noise>
      
      // Include water functions from ShaderLibrary
      #include <water>
      
      // Include transition utilities
      #include <transition>
      
      // Define the color conversion functions inline since they're missing from the ShaderLibrary
      // Helper for HSL to RGB conversion
      float hue2rgb(float p, float q, float t) {
        if (t < 0.0) t += 1.0;
        if (t > 1.0) t -= 1.0;
        if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.0/2.0) return q;
        if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
        return p;
      }

      // Convert RGB to HSL
      vec3 rgbToHsl(vec3 color) {
        float r = color.r;
        float g = color.g;
        float b = color.b;
        
        float max_val = max(max(r, g), b);
        float min_val = min(min(r, g), b);
        float h, s, l = (max_val + min_val) / 2.0;

        if (max_val == min_val) {
          h = s = 0.0; // Achromatic
        } else {
          float d = max_val - min_val;
          s = l > 0.5 ? d / (2.0 - max_val - min_val) : d / (max_val + min_val);
          
          if (max_val == r) {
            h = (g - b) / d + (g < b ? 6.0 : 0.0);
          } else if (max_val == g) {
            h = (b - r) / d + 2.0;
          } else { // max_val == b
            h = (r - g) / d + 4.0;
          }
          
          h /= 6.0;
        }

        return vec3(h, s, l);
      }

      // Convert HSL to RGB
      vec3 hslToRgb(vec3 hsl) {
        float h = hsl.x;
        float s = hsl.y;
        float l = hsl.z;
        
        float r, g, b;

        if (s == 0.0) {
          r = g = b = l; // Achromatic
        } else {
          float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
          float p = 2.0 * l - q;
          r = hue2rgb(p, q, h + 1.0/3.0);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1.0/3.0);
        }

        return vec3(r, g, b);
      }
      
      // Simple color gradient helper
      vec3 colorGradient(vec3 color1, vec3 color2, float t) {
        return mix(color1, color2, t);
      }
      
      void main() {
        // Scale UVs for better caustics density
        vec2 scaledUv = vUv * 5.0;
        
        // Use fbm from noise library for layered noise
        float caustics1 = fbm(scaledUv + vec2(uTime * 0.05, uTime * 0.07), 4, 0.5);
        float caustics2 = fbm(scaledUv * 1.2 - vec2(uTime * 0.06, uTime * 0.03), 4, 0.5);
        
        // Use caustics function from water library
        float waterCaustics = caustics(scaledUv, uTime, 1.5);
        
        // Combine noise layers with different weights
        float causticsMix = smoothstep(0.4, 0.6, caustics1 * caustics2);
        causticsMix = max(causticsMix, waterCaustics * 0.7); // Blend with water caustics
        
        // Use smootherstep from transition library for better defined edges
        causticsMix = smootherstep(0.3, 0.7, causticsMix, 0.8);
        
        // Apply theme-based color - using uniform if available, fallback to default
        vec3 baseColor = vec3(0.2, 0.5, 0.9); // Default blue underwater color
        if (length(uWaterColor) > 0.1) {
          baseColor = uWaterColor;
        }
        
        // Generate dynamic caustic color based on base color
        vec3 causticColor;
        
        // Use HSL manipulation for better caustic coloring
        // Convert base color to HSL
        vec3 baseHSL = rgbToHsl(baseColor);
        
        // Create a complementary color by shifting hue and increasing lightness
        vec3 causticHSL = vec3(
          mod(baseHSL.x + 0.5, 1.0), // Complementary hue
          max(0.0, baseHSL.y - 0.2),  // Slightly less saturated
          min(0.95, baseHSL.z + 0.6)  // Much brighter
        );
        
        // Convert back to RGB
        causticColor = hslToRgb(causticHSL);
        
        // Apply intensity adjustments from theme
        float intensity = 1.0;
        if (uWaterIntensity > 0.0) {
          intensity = uWaterIntensity;
        }
        
        // Use color gradient for better blending
        vec3 finalColor = mix(baseColor * 0.5, causticColor, causticsMix * 0.7 * intensity);
        
        // Add subtle color variation based on position and time
        finalColor += vec3(0.05, 0.05, 0.1) * sin(scaledUv.x * 10.0 + uTime) * intensity;
        
        // Apply intensity based on noise pattern
        gl_FragColor = vec4(finalColor, 0.7);
      }
    `;
    
    // Process the shaders to include library chunks
    const processedShaders = createShaderWithLibrary(causticsVertexShader, causticsFragmentShader);
    
    const material = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaterColor: { value: new THREE.Color(0.2, 0.5, 0.9) }, // Default water color
        uWaterIntensity: { value: 1.0 } // Default intensity
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
    
    // Particle shader material using ShaderLibrary
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
      uniform vec3 uParticleColor;
      uniform float uParticleSize;
      varying vec3 vColor;
      
      // Custom smootherstep function 
      float smootherstep(float edge0, float edge1, float x, float smoothness) {
        float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        // Adjust power based on smoothness (higher = smoother transition)
        float power = max(2.0, 2.0 / smoothness);
        return pow(t, power) * (1.0 - pow(1.0 - t, power));
      }
      
      // Custom transition mask function
      float transitionMask(float value, float lower, float upper, float smoothness) {
        float lowerSoft = max(0.0, lower - smoothness * 0.5);
        float upperSoft = min(1.0, upper + smoothness * 0.5);
        return smoothstep(lowerSoft, lower, value) - smoothstep(upper, upperSoft, value);
      }
      
      void main() {
        // Create circular particle
        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (r > 0.5) discard;
        
        // Fade out towards the edges using transition function for smoother falloff
        float alpha = 1.0 - transitionMask(r, 0.3, 0.5, 0.8);
        
        // Use theme color if provided
        vec3 finalColor = vColor;
        if (length(uParticleColor) > 0.1) {
          finalColor = mix(vColor, uParticleColor, 0.5);
        }
        
        // Apply size adjustment if provided
        float sizeAdjust = uParticleSize > 0.0 ? uParticleSize : 1.0;
        
        gl_FragColor = vec4(finalColor, alpha * 0.6 * sizeAdjust);
      }
    `;
    
    // Process the shaders to include library chunks
    const processedShaders = createShaderWithLibrary(particleVertexShader, particleFragmentShader);
    
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uParticleColor: { value: new THREE.Color(0xffffff) },
        uParticleSize: { value: 1.0 }
      },
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
      
      // Light ray shader material using ShaderLibrary
      const rayVertexShader = `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      
      const rayFragmentShader = `
        uniform float uTime;
        varying vec2 vUv;
        
        // Custom transition mask function
        float transitionMask(float value, float lower, float upper, float smoothness) {
          float lowerSoft = max(0.0, lower - smoothness * 0.5);
          float upperSoft = min(1.0, upper + smoothness * 0.5);
          return smoothstep(lowerSoft, lower, value) - smoothstep(upper, upperSoft, value);
        }
        
        // Simple oscillation function
        float oscillate(float time, float speed, float amplitude, float offset) {
          return sin(time * speed + offset) * amplitude;
        }
        
        void main() {
          // Create gradient from bottom to top with smooth transition
          float gradient = transitionMask(vUv.y, 0.0, 0.8, 0.7);
          
          // Add some variation along the ray using oscillation
          float variation = oscillate(uTime, 0.5, 0.1, vUv.y * 10.0) + 0.9;
          
          // Calculate final alpha
          float alpha = (1.0 - gradient) * variation * 0.3;
          
          // Light ray color
          vec3 rayColor = vec3(1.0, 1.0, 0.9);
          
          gl_FragColor = vec4(rayColor, alpha);
        }
      `;
      
      // Process the shaders to include library chunks
      const processedShaders = createShaderWithLibrary(rayVertexShader, rayFragmentShader);
      
      const rayMaterial = new THREE.ShaderMaterial({
        vertexShader: processedShaders.vertexShader,
        fragmentShader: processedShaders.fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uRayColor: { value: new THREE.Color(1.0, 1.0, 0.9) },
          uIntensity: { value: 1.0 }
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
    
    // Create bubble shader material with Fresnel effect using ShaderLibrary
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
      
      // Oscillation function for smooth animation
      float oscillate(float time, float frequency, float amplitude, float offset) {
        return amplitude * sin(time * frequency + offset);
      }
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Scale the bubble
        vec3 pos = position * scale;
        
        // Use oscillate function for wobble
        float wobble = oscillate(uTime, 2.0, 0.05, wobbleOffset);
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
      
      // Custom fresnel calculation
      float calculateFresnel(vec3 normal, vec3 viewDir, float power) {
        return pow(1.0 - clamp(dot(normalize(normal), normalize(viewDir)), 0.0, 1.0), power);
      }
      
      // Helper for HSL conversion
      float hue2rgb(float p, float q, float t) {
        if (t < 0.0) t += 1.0;
        if (t > 1.0) t -= 1.0;
        if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.0/2.0) return q;
        if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
        return p;
      }
      
      // HSL to RGB conversion
      vec3 hslToRgb(float h, float s, float l) {
        float r, g, b;
        
        if (s == 0.0) {
          r = g = b = l; // Achromatic
        } else {
          float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
          float p = 2.0 * l - q;
          r = hue2rgb(p, q, h + 1.0/3.0);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1.0/3.0);
        }
        
        return vec3(r, g, b);
      }
      
      // Gradient between two colors
      vec3 colorGradient(vec3 colorA, vec3 colorB, float t) {
        return mix(colorA, colorB, t);
      }
      
      void main() {
        // Discard if not visible
        if (vVisibility < 0.5) discard;
        
        // Direction from camera to fragment (view direction)
        vec3 viewDir = normalize(-vPosition);
        
        // Use fresnel calculation
        float fresnel = calculateFresnel(vNormal, viewDir, 3.0);
        
        // Base bubble color (nearly transparent)
        vec3 bubbleColor = vec3(0.8, 0.9, 1.0);
        
        // Generate rainbow colors using HSL to RGB conversion
        float h = (uTime * 0.1 + vUv.y * 0.5) * 0.1;
        vec3 rainbowEdge = hslToRgb(h, 0.7, 0.5);
        
        // Use colorGradient for better blending
        vec3 finalColor = colorGradient(bubbleColor, rainbowEdge, fresnel * 0.3);
        
        // Set opacity based on fresnel (more transparent in center, more opaque at edges)
        float opacity = 0.2 + fresnel * 0.5;
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `;
    
    // Process the shaders to include library chunks
    const processedShaders = createShaderWithLibrary(bubbleVertexShader, bubbleFragmentShader);
    
    // Create uniforms for the shader
    this.bubbleUniforms = {
      uTime: { value: 0 }
    };
    
    const bubbleMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
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
    
    // Light ray shader material using ShaderLibrary
    const rayVertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const rayFragmentShader = `
      uniform float uTime;
      uniform vec3 uRayColor;
      uniform float uIntensity;
      varying vec2 vUv;
      
      // Simple oscillation function
      float oscillate(float time, float speed, float amplitude, float offset) {
        return sin(time * speed + offset) * amplitude;
      }
      
      // Custom smootherstep function 
      float smootherstep(float edge0, float edge1, float x, float smoothness) {
        float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        // Adjust power based on smoothness (higher = smoother transition)
        float power = max(2.0, 2.0 / smoothness);
        return pow(t, power) * (1.0 - pow(1.0 - t, power));
      }
      
      // Create a smooth mask for transitions
      float transitionMask(float value, float start, float end, float smoothness) {
        return smootherstep(start, end, value, smoothness);
      }
      
      void main() {
        // Create gradient from bottom to top with smooth transition
        float gradient = transitionMask(vUv.y, 0.0, 0.8, 0.7);
        
        // Add some variation along the ray using oscillation function
        float variation = oscillate(uTime, 0.5, 0.1, vUv.y * 10.0) + 0.9;
        
        // Calculate final alpha
        float intensity = uIntensity > 0.0 ? uIntensity : 1.0;
        float alpha = (1.0 - gradient) * variation * 0.3 * intensity;
        
        // Light ray color - use uniform if provided, otherwise use default
        vec3 rayColor = vec3(1.0, 1.0, 0.9);
        if (length(uRayColor) > 0.1) {
          rayColor = uRayColor;
        }
        
        gl_FragColor = vec4(rayColor, alpha);
      }
    `;
    
    // Process the shaders to include library chunks
    const processedShaders = createShaderWithLibrary(rayVertexShader, rayFragmentShader);
    
    const rayMaterial = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
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
    
    // Ripple shader material using ShaderLibrary
    const rippleVertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      // Include animation utilities
      #include <animation>
      
      // Include water utilities
      #include <water>
      
      void main() {
        vUv = uv;
        
        // Base position
        vec3 pos = position;
        
        // Apply multiple wave patterns for realistic ripples
        float time = uTime * 0.5;
        
        // Use waveDisplace from animation library for vertex displacement
        vec3 displacedPos = waveDisplace(position, normalize(normal), time, 0.1, 0.2);
        pos = displacedPos;
        
        // Get water normal from our library function
        vec3 waterNorm = waterNormal(position.xz * 0.2, time, 5.0);
        vNormal = normalize(normalMatrix * waterNorm);
        
        // Final position
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const rippleFragmentShader = `
      uniform float uTime;
      uniform vec3 uWaterColor;
      uniform float uWaterOpacity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      // Custom fresnel calculation
      float calculateFresnel(vec3 normal, vec3 viewDir, float power) {
        return pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), power);
      }
      
      // Custom smootherstep function 
      float smootherstep(float edge0, float edge1, float x, float smoothness) {
        float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        // Adjust power based on smoothness (higher = smoother transition)
        float power = max(2.0, 2.0 / smoothness);
        return pow(t, power) * (1.0 - pow(1.0 - t, power));
      }
      
      // Simple oscillation function
      float oscillate(float time, float speed, float amplitude, float offset) {
        return sin(time * speed + offset) * amplitude;
      }
      
      // Helper for HSL conversion
      float hue2rgb(float p, float q, float t) {
        if (t < 0.0) t += 1.0;
        if (t > 1.0) t -= 1.0;
        if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.0/2.0) return q;
        if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
        return p;
      }
      
      // HSL to RGB conversion
      vec3 hslToRgb(vec3 hsl) {
        float h = hsl.x;
        float s = hsl.y;
        float l = hsl.z;
        
        float r, g, b;
      
        if (s == 0.0) {
          r = g = b = l; // Achromatic
        } else {
          float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
          float p = 2.0 * l - q;
          r = hue2rgb(p, q, h + 1.0/3.0);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1.0/3.0);
        }
      
        return vec3(r, g, b);
      }
      
      // Create a smooth mask for transitions
      float transitionMask(float value, float start, float end, float smoothness) {
        return smootherstep(start, end, value, smoothness);
      }
      
      void main() {
        // Water color - use uniform if provided, otherwise use default
        vec3 baseColor = vec3(0.2, 0.5, 0.9);
        if (length(uWaterColor) > 0.1) {
          baseColor = uWaterColor;
        }
        
        // Use normalized viewDir
        vec3 viewDir = normalize(vViewPosition);
        
        // Calculate fresnel effect
        float fresnel = calculateFresnel(vNormal, viewDir, 5.0);
        
        // Use smootherstep for better blending
        fresnel = smootherstep(0.0, 1.0, fresnel, 0.7);
        
        // Combine colors with fresnel
        vec3 color = mix(baseColor, vec3(1.0), fresnel * 0.7);
        
        // Add some time-based variation
        float timeVar = oscillate(uTime, 0.5, 0.05, vUv.x * 10.0);
        color += vec3(timeVar);
        
        // Use opacity from uniform if provided
        float opacity = 0.8;
        if (uWaterOpacity > 0.0) {
          opacity = uWaterOpacity;
        }
        
        gl_FragColor = vec4(color, opacity);
      }
    `;
    
    // Process shaders with library
    const processedShaders = createShaderWithLibrary(rippleVertexShader, rippleFragmentShader);
    
    const material = new THREE.ShaderMaterial({
      vertexShader: processedShaders.vertexShader,
      fragmentShader: processedShaders.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaterColor: { value: new THREE.Color(0.2, 0.5, 0.9) },
        uWaterOpacity: { value: 0.8 }
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
   * Updates water effects based on the environment theme with enhanced visual effects
   * @param theme The target environment theme
   * @param transitionProgress The transition progress (0-1)
   */
  updateTheme(theme: EnvironmentTheme, transitionProgress: number = 1.0): void {
    // Update water color and opacity using theme values with fallbacks
    const targetWaterColor = new THREE.Color(theme.waterColor || theme.backgroundColor);
    const targetWaterOpacity = theme.waterOpacity || 0.7; // Default to 0.7 if not specified
    
    // Calculate color for the current transition state
    const transitionColor = new THREE.Color();
    transitionColor.r = lerp(this.currentWaterColor.r, targetWaterColor.r, transitionProgress);
    transitionColor.g = lerp(this.currentWaterColor.g, targetWaterColor.g, transitionProgress);
    transitionColor.b = lerp(this.currentWaterColor.b, targetWaterColor.b, transitionProgress);
    
    // Interpolate opacity
    const opacity = lerp(this.currentWaterOpacity, targetWaterOpacity, transitionProgress);
    
    // Update caustics with theme-specific adjustments
    if (this.causticsMaterial) {
      // Add theme-specific uniforms if they don't exist
      if (!this.causticsMaterial.uniforms.uWaterColor) {
        this.causticsMaterial.uniforms.uWaterColor = { value: new THREE.Color() };
      }
      
      if (!this.causticsMaterial.uniforms.uWaterIntensity) {
        this.causticsMaterial.uniforms.uWaterIntensity = { value: 1.0 };
      }
      
      // Update uniforms with transition values
      this.causticsMaterial.uniforms.uWaterColor.value = transitionColor;
      
      // Adjust caustics intensity based on environment type
      let causticsIntensity = 1.0;
      
      // Different environment types have different caustics intensities
      switch (theme.type) {
        case 'reef':
          causticsIntensity = 1.2; // Brighter caustics in shallow reef
          break;
        case 'openOcean':
          causticsIntensity = 0.8; // Moderate caustics in open ocean
          break;
        case 'deepSea':
          causticsIntensity = 0.4; // Very subtle caustics in deep sea
          break;
        case 'shipwreck':
          causticsIntensity = 0.6; // Muted caustics around shipwrecks
          break;
        case 'kelpForest':
          causticsIntensity = 0.9; // Filtered caustics in kelp forest
          break;
      }
      
      // Apply interpolated intensity
      const currentIntensity = this.causticsMaterial.uniforms.uWaterIntensity.value;
      this.causticsMaterial.uniforms.uWaterIntensity.value = 
        lerp(currentIntensity, causticsIntensity, transitionProgress);
      
      // Update caustics material color
      if (this.causticsMaterial.uniforms.uWaterColor) {
        this.causticsMaterial.uniforms.uWaterColor.value = transitionColor;
      }
    }
    
    // Update ambient particles with theme-specific colors and behavior
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.ShaderMaterial) {
      // Add uniforms for theme-based particle appearance if they don't exist
      if (!this.ambientParticles.material.uniforms.uParticleColor) {
        this.ambientParticles.material.uniforms.uParticleColor = { value: new THREE.Color() };
      }
      
      if (!this.ambientParticles.material.uniforms.uParticleSize) {
        this.ambientParticles.material.uniforms.uParticleSize = { value: 1.0 };
      }
      
      // Set theme-specific particle properties
      let particleColor: THREE.Color;
      let particleSize = 1.0;
      
      switch (theme.type) {
        case 'reef':
          particleColor = new THREE.Color(0xffffff); // Bright particulates in reef
          particleSize = 1.2;
          break;
        case 'openOcean':
          particleColor = new THREE.Color(0xaaddff); // Blueish particulates in open ocean
          particleSize = 1.0;
          break;
        case 'deepSea':
          particleColor = new THREE.Color(0x445566); // Dark particulates in deep sea
          particleSize = 0.8;
          break;
        case 'shipwreck':
          particleColor = new THREE.Color(0xccccaa); // Murky particulates near shipwrecks
          particleSize = 1.1;
          break;
        case 'kelpForest':
          particleColor = new THREE.Color(0xaaffaa); // Greenish particulates in kelp forest
          particleSize = 1.0;
          break;
        default:
          particleColor = new THREE.Color(0xffffff);
          particleSize = 1.0;
      }
      
      // Adjust particle count based on theme's particleDensity
      const geometry = this.ambientParticles.geometry;
      if (geometry.attributes.size) {
        const sizes = geometry.attributes.size.array;
        const baseSize = particleSize * (theme.particleDensity || 1.0);
        
        // Update particle sizes
        for (let i = 0; i < sizes.length; i++) {
          // Get original random size
          const originalSize = sizes[i];
          // Apply theme-specific scaling but keep the randomness
          const randomFactor = originalSize / 0.2; // Normalize based on default size
          sizes[i] = baseSize * (0.1 + randomFactor * 0.15);
        }
        
        geometry.attributes.size.needsUpdate = true;
      }
      
      // Update particle material color
      if (this.ambientParticles.material.uniforms.uParticleColor) {
        // Interpolate between current and target particle color
        const currentColor = this.ambientParticles.material.uniforms.uParticleColor.value;
        this.ambientParticles.material.uniforms.uParticleColor.value = new THREE.Color().lerpColors(
          currentColor,
          particleColor,
          transitionProgress
        );
      }
    }
    
    // Update light rays if they exist
    if (this.quality !== 'low' && this.lightRays) {
      this.lightRays.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          // Add ray color uniform if it doesn't exist
          if (!child.material.uniforms.uRayColor) {
            child.material.uniforms.uRayColor = { value: new THREE.Color(1, 1, 0.9) };
          }
          
          // Set theme-specific ray colors
          let rayColor: THREE.Color;
          let rayIntensity = 1.0;
          
          switch (theme.type) {
            case 'reef':
              rayColor = new THREE.Color(1, 1, 0.9); // Bright yellow-white in reef
              rayIntensity = 1.2;
              break;
            case 'openOcean':
              rayColor = new THREE.Color(0.8, 0.9, 1.0); // Blueish in open ocean
              rayIntensity = 1.0;
              break;
            case 'deepSea':
              rayColor = new THREE.Color(0.3, 0.4, 0.6); // Very dark blue in deep sea
              rayIntensity = 0.5;
              break;
            case 'shipwreck':
              rayColor = new THREE.Color(0.7, 0.7, 0.6); // Muted gold in shipwreck
              rayIntensity = 0.8;
              break;
            case 'kelpForest':
              rayColor = new THREE.Color(0.7, 0.9, 0.7); // Greenish in kelp forest
              rayIntensity = 0.9;
              break;
            default:
              rayColor = new THREE.Color(1, 1, 0.9);
              rayIntensity = 1.0;
          }
          
          // Update ray color with transition
          const currentColor = child.material.uniforms.uRayColor.value;
          child.material.uniforms.uRayColor.value = new THREE.Color().lerpColors(
            currentColor,
            rayColor,
            transitionProgress
          );
          
          // Adjust blending mode based on environment
          const material = child.material as THREE.ShaderMaterial;
          if (theme.type === 'deepSea' || theme.type === 'shipwreck') {
            material.blending = THREE.AdditiveBlending;
            material.blendSrc = THREE.OneFactor;
            material.blendDst = THREE.OneFactor;
          } else {
            material.blending = THREE.AdditiveBlending;
            material.blendSrc = THREE.SrcAlphaFactor;
            material.blendDst = THREE.OneFactor;
          }
          
          // Adjust ray visibility
          const visibilityScale = theme.type === 'deepSea' ? 0.3 : 1.0;
          child.visible = theme.type !== 'deepSea' || Math.random() < 0.3;
          
          // Adjust ray intensity
          if (child.material.uniforms.uIntensity) {
            child.material.uniforms.uIntensity.value = rayIntensity;
          }
        }
      });
    }
    
    // Update surface ripples if they exist
    if (this.surfaceRipples && this.surfaceRipples.material instanceof THREE.ShaderMaterial) {
      // Add ripple color uniform if it doesn't exist
      if (!this.surfaceRipples.material.uniforms.uWaterColor) {
        this.surfaceRipples.material.uniforms.uWaterColor = { value: new THREE.Color() };
      }
      
      if (!this.surfaceRipples.material.uniforms.uWaterOpacity) {
        this.surfaceRipples.material.uniforms.uWaterOpacity = { value: 0.8 };
      }
      
      // Update ripple color with theme-specific colors
      this.surfaceRipples.material.uniforms.uWaterColor.value = transitionColor;
      
      // Adjust ripple visibility based on depth
      let rippleOpacity = 0.8;
      let rippleHeight = 8;
      
      // Different environments have different surface appearances
      switch (theme.type) {
        case 'reef':
          rippleOpacity = 0.8; // Clearer surface in reef
          rippleHeight = 6; // Lower surface for brighter environment
          break;
        case 'openOcean':
          rippleOpacity = 0.7; // Standard open ocean
          rippleHeight = 8;
          break;
        case 'deepSea':
          rippleOpacity = 0.2; // Almost invisible in deep sea
          rippleHeight = 15; // Much higher to simulate depth
          break;
        case 'shipwreck':
          rippleOpacity = 0.5; // Murky in shipwreck
          rippleHeight = 10;
          break;
        case 'kelpForest':
          rippleOpacity = 0.6; // Filtered in kelp forest
          rippleHeight = 7;
          break;
      }
      
      // Update opacity with transition
      const currentOpacity = this.surfaceRipples.material.uniforms.uWaterOpacity.value;
      this.surfaceRipples.material.uniforms.uWaterOpacity.value = 
        lerp(currentOpacity, rippleOpacity, transitionProgress);
      
      // Update ripple height
      const targetY = rippleHeight;
      this.surfaceRipples.position.y = lerp(this.surfaceRipples.position.y, targetY, transitionProgress);
    }
    
    // Update bubble system based on theme
    if (this.bubbleSystem && this.bubbleSystem.material instanceof THREE.ShaderMaterial) {
      // Adjust bubble visibility and behavior based on environment
      let bubbleDensity = 1.0;
      
      switch (theme.type) {
        case 'reef':
          bubbleDensity = 1.0; // Normal bubbles in reef
          break;
        case 'openOcean':
          bubbleDensity = 0.7; // Fewer bubbles in open ocean
          break;
        case 'deepSea':
          bubbleDensity = 0.3; // Very few bubbles in deep sea
          break;
        case 'shipwreck':
          bubbleDensity = 1.2; // More bubbles around shipwrecks (organic decay)
          break;
        case 'kelpForest':
          bubbleDensity = 1.1; // Slightly more bubbles in kelp (photosynthesis)
          break;
      }
      
      // Adjust bubble visibility based on density
      if (this.bubbleVisibility) {
        const visibilityAttribute = this.bubbleSystem.geometry.getAttribute('visibility');
        
        if (visibilityAttribute) {
          for (let i = 0; i < this.bubbleVisibility.length; i++) {
            // Only adjust bubbles that are currently invisible and randomize which ones we make visible
            if (this.bubbleVisibility[i] < 0.5 && Math.random() < transitionProgress) {
              // Use the theme density to determine how many bubbles to show
              this.bubbleVisibility[i] = Math.random() < bubbleDensity ? 1.0 : 0.0;
              (visibilityAttribute as THREE.BufferAttribute).setX(i, this.bubbleVisibility[i]);
            }
          }
          
          (visibilityAttribute as THREE.BufferAttribute).needsUpdate = true;
        }
      }
    }
    
    // Store the final values when transition is complete
    if (transitionProgress >= 1.0) {
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
  
  /**
   * Disable non-essential visual effects for performance
   */
  public disableNonEssentialEffects(): void {
    // Hide light rays
    if (this.lightRays) {
      this.lightRays.visible = false;
    }
    
    // Hide surface ripples
    if (this.surfaceRipples) {
      this.surfaceRipples.visible = false;
    }
    
    // Reduce bubble count
    if (this.bubbleSystem && this.bubbleVisibility) {
      // Set most bubbles to invisible (0 visibility)
      for (let i = 0; i < this.bubbleVisibility.length; i++) {
        // Keep only 10% of bubbles
        if (Math.random() > 0.1) {
          this.bubbleVisibility[i] = 0;
        }
      }
      
      // Update the instance attribute
      const visibilityAttribute = this.bubbleSystem.geometry.getAttribute('instanceVisibility');
      if (visibilityAttribute) {
        (visibilityAttribute as THREE.BufferAttribute).needsUpdate = true;
      }
    }
    
    // Reduce ambient particles
    if (this.ambientParticles) {
      // Either hide completely or reduce opacity
      this.ambientParticles.visible = false;
    }
    
    console.log('WaterEffects: Disabled non-essential effects for performance');
  }
}