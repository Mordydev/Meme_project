'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, ShaderPass, RenderPass, UnrealBloomPass } from 'three-stdlib';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';

// Extend Three.js with necessary components
extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass });

// Define an expanded zone enum to match UnderwaterScene.tsx
enum EnhancedEnvironmentZone {
  CORAL_REEF = 'CORAL_REEF',
  OPEN_OCEAN = 'OPEN_OCEAN',
  DEEP_SEA = 'DEEP_SEA',
  SHIPWRECK = 'SHIPWRECK',
  EAST_AUSTRALIAN_CURRENT = 'EAST_AUSTRALIAN_CURRENT'
}

// Improved underwater shader for post-processing - reduced distortion for better clarity
const EnhancedUnderwaterShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'time': { value: 0 },
    'distortionStrength': { value: 0.01 }, // Reduced from 0.03
    'distortionScale': { value: 10.0 }, // Reduced from 20.0
    'waterColor': { value: new THREE.Color('#0c6b9c') },
    'waterColorStrength': { value: 0.15 }, // Reduced from 0.2
    'vignetteStrength': { value: 0.3 }, // Reduced from 0.5
    'causticStrength': { value: 0.2 }, // Reduced from 0.3
    'refractionRatio': { value: 0.3 }, // Reduced from 0.5
    'aberrationStrength': { value: 0.003 }, // Reduced from 0.01
    'blurStrength': { value: 0.01 }, // Reduced from 0.02
    'depthColor': { value: new THREE.Color('#041e31') },
    'sunPosition': { value: new THREE.Vector3(0, 20, -30) },
    'playerPosition': { value: new THREE.Vector3(0, 0, 0) },
    'volumeLightIntensity': { value: 0.2 } // Reduced from 0.3
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float distortionStrength;
    uniform float distortionScale;
    uniform vec3 waterColor;
    uniform vec3 depthColor;
    uniform float waterColorStrength;
    uniform float vignetteStrength;
    uniform float causticStrength;
    uniform float refractionRatio;
    uniform float aberrationStrength;
    uniform float blurStrength;
    uniform vec3 sunPosition;
    uniform vec3 playerPosition;
    uniform float volumeLightIntensity;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    // Improved hash function
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    // Improved Simplex noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                              dot(x12.zw, x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    // Fractal Brownian Motion for more complex noise
    float fbm(vec2 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < octaves; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    // Complex water caustics effect
    float causticEffect(vec2 uv, float time) {
      float scale = distortionScale;
      vec2 p = uv * scale;
      
      // Combine multiple noise layers at different scales and speeds
      float noise1 = snoise(p + vec2(time * 0.2, time * 0.3));
      float noise2 = snoise(p * 1.5 + vec2(time * -0.1, time * 0.2));
      float noise3 = snoise(p * 2.5 + vec2(time * 0.15, time * -0.15));
      
      // Create sharper caustics with power function
      float caustic = (noise1 + noise2 * 0.8 + noise3 * 0.4) * 0.4;
      return pow(0.5 + 0.5 * caustic, 2.0);
    }
    
    // Underwater volume light scattering approximation
    float volumeLight(vec2 uv, vec3 sunPos, vec3 playerPos, float time) {
      // Convert sun position to screen space
      vec2 sunUV = vec2(0.5, 0.3); // Approximation, would be better with actual projection
      
      // Direction from pixel to sun
      vec2 toSun = sunUV - uv;
      float distToSun = length(toSun);
      
      // Create animated rays using noise
      float rays = 0.0;
      float rayWidth = 0.1;
      float rayFrequency = 20.0;
      
      for (int i = 0; i < 6; i++) {
        float angle = float(i) / 6.0 * 3.14159 * 2.0 + time * 0.05;
        vec2 rayDir = vec2(cos(angle), sin(angle));
        float ray = smoothstep(rayWidth, 0.0, abs(dot(normalize(toSun), rayDir) - 0.5));
        rays += ray * (0.5 + 0.5 * sin(distToSun * rayFrequency + time));
      }
      
      // Apply distance falloff
      return rays * smoothstep(0.8, 0.0, distToSun) * volumeLightIntensity;
    }
    
    // Chromatic aberration effect
    vec4 chromaticAberration(sampler2D tex, vec2 uv, float strength) {
      float aberration = strength;
      
      vec2 distFromCenter = uv - 0.5;
      float distSquared = dot(distFromCenter, distFromCenter);
      vec2 direction = normalize(distFromCenter) * aberration * distSquared;
      
      // Sample different color channels with different offsets
      float r = texture2D(tex, uv - direction).r;
      float g = texture2D(tex, uv).g;
      float b = texture2D(tex, uv + direction).b;
      
      return vec4(r, g, b, 1.0);
    }
    
    // Depth-based fog effect
    vec3 applyDepthFog(vec3 color, float depth, vec3 fogColor) {
      // Simulate depth with distance from center and bottom of screen
      float centerDist = length(vUv - vec2(0.5, 0.5));
      float bottomDist = 1.0 - vUv.y;
      
      float depthFactor = centerDist * 0.7 + bottomDist * 0.3;
      depthFactor = pow(depthFactor, 1.5);
      
      return mix(color, fogColor, depthFactor * 0.3);
    }
    
    void main() {
      // Calculate simplified distortion for better clarity
      float noise = fbm(vUv * distortionScale, 2); // Reduced octaves for simpler pattern
      float caustics = causticEffect(vUv, time);
      
      // Apply minimal distortion for clearer water movement
      vec2 distortedUv = vUv + vec2(
        distortionStrength * sin(noise * 5.0 + time * 0.1), // Reduced frequency and speed
        distortionStrength * cos(noise * 4.0 + time * 0.15) // Reduced frequency and speed
      );
      
      // Apply very subtle chromatic aberration for cleaner underwater refraction
      vec4 texColor = chromaticAberration(tDiffuse, distortedUv, aberrationStrength);
      
      // Add subtle caustics effect
      texColor.rgb += waterColor * caustics * causticStrength * 0.7; // Reduced intensity
      
      // Apply lighter depth-based color absorption for better visibility
      texColor.rgb = applyDepthFog(texColor.rgb, length(vWorldPosition) * 0.7, depthColor); // Reduced depth effect
      
      // Apply lighter water color tinting for better clarity
      texColor.rgb = mix(texColor.rgb, waterColor, waterColorStrength * 0.8); // Reduced intensity
      
      // Reduced volume light scattering (god rays) for better clarity
      float volumeScatter = volumeLight(vUv, sunPosition, playerPosition, time) * 0.7; // Reduced intensity
      texColor.rgb += waterColor * volumeScatter;
      
      // Lighter vignette effect (less darkening at edges)
      vec2 uvCenter = vUv - 0.5;
      float vignette = 1.0 - dot(uvCenter, uvCenter) * (vignetteStrength * 0.7); // Reduced vignette
      texColor.rgb *= vignette;
      
      // Almost eliminate blur for clearer water
      float blurNoise = snoise(vUv * 10.0 + time * 0.05) * (blurStrength * 0.5); // Reduced blur
      texColor.rgb += blurNoise * waterColor;
      
      gl_FragColor = texColor;
    }
  `
};

// Zone-specific environment effects with improved clarity - reduced distortion and fog
const zoneEffects = {
  [EnhancedEnvironmentZone.CORAL_REEF]: {
    distortionStrength: 0.005, // Reduced from 0.02
    distortionScale: 8.0, // Reduced from 15.0
    waterColor: new THREE.Color('#0c7db6'), // Brightened color for better visibility
    waterColorStrength: 0.1, // Reduced from 0.15
    vignetteStrength: 0.2, // Reduced from 0.4
    godraysStrength: 0.4, // Reduced from 0.6
    causticStrength: 0.3, // Reduced from 0.5
    refractionRatio: 0.2, // Reduced from 0.4
    aberrationStrength: 0.002, // Reduced from 0.008
    blurStrength: 0.005, // Reduced from 0.015
    fogDensity: 0.008, // Reduced from 0.02
    fogColor: '#0c7db6', // Brightened color
    depthColor: '#0a5a8c', // Brightened color
    ambientIntensity: 0.6, // Increased from 0.4
    directionalIntensity: 1.0, // Increased from 0.8
    volumeLightIntensity: 0.2 // Reduced from 0.35
  },
  [EnhancedEnvironmentZone.OPEN_OCEAN]: {
    distortionStrength: 0.004, // Reduced from 0.01
    distortionScale: 6.0, // Reduced from 10.0
    waterColor: new THREE.Color('#0a5f94'), // Brightened color
    waterColorStrength: 0.12, // Reduced from 0.2
    vignetteStrength: 0.15, // Reduced from 0.3
    godraysStrength: 0.3, // Reduced from 0.4
    causticStrength: 0.2, // Reduced from 0.3
    refractionRatio: 0.15, // Reduced from 0.3
    aberrationStrength: 0.002, // Reduced from 0.005
    blurStrength: 0.004, // Reduced from 0.01
    fogDensity: 0.006, // Reduced from 0.01
    fogColor: '#0a5f94', // Brightened color
    depthColor: '#054066', // Brightened color
    ambientIntensity: 0.5, // Increased from 0.3
    directionalIntensity: 0.9, // Increased from 0.7
    volumeLightIntensity: 0.2 // Reduced from 0.3
  },
  [EnhancedEnvironmentZone.DEEP_SEA]: {
    distortionStrength: 0.003, // Reduced from 0.01
    distortionScale: 5.0, // Reduced from 8.0
    waterColor: new THREE.Color('#072a45'), // Brightened from #041e31
    waterColorStrength: 0.15, // Reduced from 0.3
    vignetteStrength: 0.4, // Reduced from 0.7
    godraysStrength: 0.08, // Reduced from 0.1
    causticStrength: 0.06, // Reduced from 0.1
    refractionRatio: 0.1, // Reduced from 0.2
    aberrationStrength: 0.001, // Reduced from 0.003
    blurStrength: 0.01, // Reduced from 0.03
    fogDensity: 0.015, // Reduced from 0.03
    fogColor: '#072a45', // Brightened color
    depthColor: '#031628', // Brightened color
    ambientIntensity: 0.35, // Increased from 0.2
    directionalIntensity: 0.6, // Increased from 0.4
    volumeLightIntensity: 0.08 // Reduced from 0.1
  },
  [EnhancedEnvironmentZone.SHIPWRECK]: {
    distortionStrength: 0.005, // Reduced from 0.015
    distortionScale: 6.0, // Reduced from 12.0
    waterColor: new THREE.Color('#0a4d78'), // Brightened from #0a3b5c
    waterColorStrength: 0.12, // Reduced from 0.25
    vignetteStrength: 0.25, // Reduced from 0.5
    godraysStrength: 0.2, // Reduced from 0.3
    causticStrength: 0.25, // Reduced from 0.4
    refractionRatio: 0.15, // Reduced from 0.35
    aberrationStrength: 0.002, // Reduced from 0.006
    blurStrength: 0.006, // Reduced from 0.02
    fogDensity: 0.01, // Reduced from 0.025
    fogColor: '#0a4d78', // Brightened color
    depthColor: '#063a56', // Brightened from #062c42
    ambientIntensity: 0.5, // Increased from 0.3
    directionalIntensity: 0.8, // Increased from 0.6
    volumeLightIntensity: 0.15 // Reduced from 0.25
  },
  [EnhancedEnvironmentZone.EAST_AUSTRALIAN_CURRENT]: {
    distortionStrength: 0.006, // Reduced from 0.03
    distortionScale: 7.0, // Reduced from 18.0
    waterColor: new THREE.Color('#1098d8'), // Brightened from #1087c2
    waterColorStrength: 0.1, // Reduced from 0.18
    vignetteStrength: 0.15, // Reduced from 0.35
    godraysStrength: 0.3, // Reduced from 0.5
    causticStrength: 0.3, // Reduced from 0.6
    refractionRatio: 0.2, // Reduced from 0.45
    aberrationStrength: 0.003, // Reduced from 0.01
    blurStrength: 0.004, // Reduced from 0.01
    fogDensity: 0.007, // Reduced from 0.015
    fogColor: '#1098d8', // Brightened color
    depthColor: '#0c6aa3', // Brightened from #0c5a8a
    ambientIntensity: 0.55, // Increased from 0.35
    directionalIntensity: 1.0, // Increased from 0.8
    volumeLightIntensity: 0.2 // Reduced from 0.4
  }
};

// Helper to get the effect parameters for the current zone, with fallback
function getZoneEffects(zoneName: string): any {
  // Check if we have specific effects for this zone
  if (zoneName in zoneEffects) {
    return zoneEffects[zoneName as keyof typeof zoneEffects];
  }
  
  // Map standard zones to enhanced zones for compatibility
  switch(zoneName) {
    case EnvironmentZone.CORAL_REEF:
      return zoneEffects[EnhancedEnvironmentZone.CORAL_REEF];
    case EnvironmentZone.OPEN_OCEAN:
      return zoneEffects[EnhancedEnvironmentZone.OPEN_OCEAN];
    case EnvironmentZone.DEEP_SEA:
      return zoneEffects[EnhancedEnvironmentZone.DEEP_SEA];
    default:
      return zoneEffects[EnhancedEnvironmentZone.CORAL_REEF]; // Default
  }
}

/**
 * Enhanced component to manage water post-processing effects
 */
export const WaterEffects: React.FC = () => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer>(null);
  const shaderRef = useRef<ShaderPass>(null);
  const bloomPassRef = useRef<UnrealBloomPass>(null);
  const timeRef = useRef(0);
  const sunPositionRef = useRef(new THREE.Vector3(0, 20, -30));
  
  // Get current environment parameters
  const zoneParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  
  // Create a more sophisticated render pipeline with multiple effects
  useEffect(() => {
    // Create a custom render target with RGBA format for better quality
    const renderTarget = new THREE.WebGLRenderTarget(
      size.width, 
      size.height, 
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        colorSpace: 'srgb', // Updated from deprecated sRGBEncoding
        samples: gl.capabilities.isWebGL2 ? 4 : 0 // Use MSAA if available
      }
    );
    
    // Set up the render passes
    const renderPass = new RenderPass(scene, camera);
    
    // Create bloom pass for glow effects (especially useful for bioluminescence in deep sea)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.2,   // strength
      0.5,   // radius
      0.7    // threshold
    );
    
    // Create our enhanced underwater shader pass
    const underwaterPass = new ShaderPass(EnhancedUnderwaterShader);
    
    // Create and configure the composer
    const composer = new EffectComposer(gl, renderTarget);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    composer.setSize(size.width, size.height);
    
    // Add all passes in order
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(underwaterPass);
    
    // Store references for updates
    composerRef.current = composer;
    bloomPassRef.current = bloomPass;
    shaderRef.current = underwaterPass;
    
    // Initialize shader uniforms
    if (shaderRef.current) {
      updateShaderUniforms();
    }
    
    return () => {
      // Clean up resources
      renderTarget.dispose();
      composer.dispose();
    };
  }, [gl, scene, camera, size]);
  
  // Update composer when size changes
  useEffect(() => {
    if (composerRef.current) {
      // Set size AND pixel ratio to ensure proper resolution
      composerRef.current.setSize(size.width, size.height);
      composerRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }, [size, gl]);
  
  // Update sun position to follow time of day
  const updateSunPosition = (time: number) => {
    const angle = time * 0.05 % (Math.PI * 2);
    const radius = 50;
    
    sunPositionRef.current.x = Math.sin(angle) * radius;
    sunPositionRef.current.y = Math.cos(angle) * radius + 20;
    sunPositionRef.current.z = -30;
    
    if (shaderRef.current && shaderRef.current.uniforms.sunPosition) {
      shaderRef.current.uniforms.sunPosition.value = sunPositionRef.current;
    }
  };
  
  // Update shader uniforms based on current zone parameters
  const updateShaderUniforms = () => {
    if (!shaderRef.current) return;
    
    // Get the zone effects for the current zone
    const effects = getZoneEffects(currentZone);
    
    // Get the player position
    const playerPosition = new THREE.Vector3(0, 0, 0);
    if (camera) {
      playerPosition.copy(camera.position);
      playerPosition.z = 0; // Keep z at origin for consistent effects
    }
    
    // Update all shader uniforms
    const uniforms = shaderRef.current.uniforms;
    
    // Basic water properties
    uniforms.waterColor.value = new THREE.Color(zoneParams.fogColor || effects.waterColor);
    uniforms.depthColor.value = new THREE.Color(effects.depthColor);
    uniforms.waterColorStrength.value = effects.waterColorStrength;
    
    // Distortion properties
    uniforms.distortionStrength.value = effects.distortionStrength;
    uniforms.distortionScale.value = effects.distortionScale;
    
    // Visual effects
    uniforms.vignetteStrength.value = effects.vignetteStrength;
    uniforms.causticStrength.value = effects.causticStrength;
    uniforms.refractionRatio.value = effects.refractionRatio;
    uniforms.aberrationStrength.value = effects.aberrationStrength;
    uniforms.blurStrength.value = effects.blurStrength;
    
    // Lighting
    uniforms.volumeLightIntensity.value = effects.volumeLightIntensity;
    uniforms.playerPosition.value = playerPosition;
    
    // Update bloom settings based on zone
    if (bloomPassRef.current) {
      // Stronger bloom in deep sea for bioluminescence
      if (currentZone === EnvironmentZone.DEEP_SEA) {
        bloomPassRef.current.strength = 0.5;
        bloomPassRef.current.radius = 0.7;
        bloomPassRef.current.threshold = 0.2;
      } else {
        bloomPassRef.current.strength = 0.2;
        bloomPassRef.current.radius = 0.5;
        bloomPassRef.current.threshold = 0.7;
      }
    }
  };
  
  // Animation and rendering
  useFrame((_, delta) => {
    // Update time uniform
    timeRef.current += delta;
    
    if (shaderRef.current) {
      // Update time uniform for animations
      shaderRef.current.uniforms.time.value = timeRef.current;
      
      // Update sun position for god rays
      updateSunPosition(timeRef.current);
      
      // Update other uniforms if transitioning
      if (isTransitioning) {
        updateShaderUniforms();
      }
    }
    
    // Render with composer instead of default renderer
    if (composerRef.current) {
      composerRef.current.render(delta);
    }
    
    // Return true to indicate we've handled the rendering
    return true;
  }, 1); // Priority 1 to override default rendering
  
  return null;
};

/**
 * Enhanced component for light shafts / god rays effect
 */
export const GodRaysEffect: React.FC = () => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const shaftMeshRef = useRef<THREE.Mesh>(null);
  
  // Get current environment parameters
  const zoneParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  const currentZone = useEnvironmentStore(state => state.currentZone);
  
  // Get zone effects using our helper
  const effects = useMemo(() => getZoneEffects(currentZone), [currentZone]);
  
  // Create light shaft material
  const shaftMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(zoneParams.lightColor).multiplyScalar(1.5) },
        intensity: { value: effects.godraysStrength }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDepth;
        
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = viewMatrix * worldPosition;
          vDepth = -viewPosition.z;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float intensity;
        
        varying vec2 vUv;
        varying float vDepth;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          // Calculate ray opacity based on center distance
          vec2 center = vec2(0.5, 0.0);
          float dist = length(vUv - center) * 2.0;
          
          // Create ray effect with noise
          float ray = smoothstep(1.0, 0.0, dist);
          
          // Add dynamic noise
          float noiseValue = noise(vUv * 10.0 + time * 0.01);
          ray *= 0.6 + 0.4 * noiseValue;
          
          // Apply vertical falloff
          float verticalFalloff = (1.0 - vUv.y);
          ray *= verticalFalloff;
          
          // Add depth attenuation
          float depthFalloff = smoothstep(100.0, 10.0, vDepth);
          
          gl_FragColor = vec4(color, ray * intensity * depthFalloff);
        }
      `
    });
  }, [zoneParams.lightColor, effects.godraysStrength]);
  
  // Animation for god rays
  useFrame((_, delta) => {
    // Update light position and intensity
    if (lightRef.current) {
      const time = performance.now() * 0.001;
      
      // Subtle movement of light direction
      lightRef.current.position.x = Math.sin(time * 0.1) * 2;
      lightRef.current.position.y = 20 + Math.sin(time * 0.2) * 5;
      lightRef.current.position.z = -30 + Math.cos(time * 0.15) * 5;
      
      // Pulsing intensity
      const baseIntensity = effects.directionalIntensity;
      const pulseAmount = effects.godraysStrength * 0.3;
      lightRef.current.intensity = baseIntensity + Math.sin(time * 0.5) * pulseAmount;
      
      // Update light shaft position and material
      if (shaftMeshRef.current) {
        // Position light shaft under the light
        shaftMeshRef.current.position.copy(lightRef.current.position);
        shaftMeshRef.current.position.y = 10; // Lower position for better visibility
        
        // Update shaft material
        const material = shaftMeshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value = time;
      }
    }
  });
  
  return (
    <group>
      {/* Directional light for god rays effect */}
      <directionalLight
        ref={lightRef}
        color={zoneParams.lightColor}
        intensity={effects.directionalIntensity}
        position={[0, 20, -30]}
        castShadow
      />
      
      {/* Visualized god rays using custom shader */}
      <mesh ref={shaftMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5, 20, 40, 32, 5, true]} />
        <primitive object={shaftMaterial} attach="material" />
      </mesh>
      
      {/* Ambient light for general scene illumination */}
      <ambientLight 
        color={zoneParams.ambientColor} 
        intensity={effects.ambientIntensity} 
      />
    </group>
  );
};

/**
 * Enhanced component for water caustics effect on ocean floor
 */
export const CausticsEffect: React.FC = () => {
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture[]>([]);
  const textureIndexRef = useRef(0);
  const timeRef = useRef(0);
  
  // Get zone effects using our helper
  const effects = getZoneEffects(currentZone);
  
  // Different intensities based on zone
  let intensity = 0;
  let isVisible = true;
  
  switch (currentZone) {
    case EnvironmentZone.CORAL_REEF:
      intensity = 1.0;
      break;
    case EnvironmentZone.OPEN_OCEAN:
      intensity = 0.6;
      break;
    case EnvironmentZone.DEEP_SEA:
      intensity = 0.2;
      break;
    default:
      // Handle string comparison for enhanced zones
      const zoneString = String(currentZone);
      if (zoneString === 'CORAL_REEF') {
        intensity = 1.0;
      } else if (zoneString === 'OPEN_OCEAN') {
        intensity = 0.6;
      } else if (zoneString === 'SHIPWRECK') {
        intensity = 0.7;
      } else if (zoneString === 'EAST_AUSTRALIAN_CURRENT') {
        intensity = 0.8;
      } else if (zoneString === 'DEEP_SEA') {
        intensity = 0.2;
      } else {
        isVisible = false;
      }
  }
  
  // Load caustics textures
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    
    // Load sequence of 32 caustics textures
    for (let i = 1; i <= 32; i++) {
      const paddedIndex = i.toString().padStart(2, '0');
      const texture = textureLoader.load(`/textures/caustics/caustics_${paddedIndex}.jpg`);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      textures.push(texture);
    }
    
    textureRef.current = textures;
    
    return () => {
      textures.forEach(texture => texture.dispose());
    };
  }, []);
  
  // Animate caustics
  useFrame((_, delta) => {
    if (!meshRef.current || textureRef.current.length === 0 || !isVisible) return;
    
    timeRef.current += delta;
    
    // Update texture every 1/24 seconds (approx 24fps)
    if (timeRef.current > 1/24) {
      timeRef.current = 0;
      textureIndexRef.current = (textureIndexRef.current + 1) % textureRef.current.length;
      
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.map = textureRef.current[textureIndexRef.current];
      material.needsUpdate = true;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -1.95, 0]}
      scale={[100, 100, 1]}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshBasicMaterial 
        map={textureRef.current[0]} 
        transparent={true} 
        opacity={0.3 * intensity * effects.causticStrength}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

/**
 * Enhanced component for dynamic water surface with realistic waves
 */
export const WaterSurface: React.FC<{ position?: [number, number, number] }> = ({ 
  position = [0, 8, 0] 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentZone = useEnvironmentStore(state => state.currentZone);
  
  // Get zone effects using our helper
  const effects = getZoneEffects(currentZone);
  
  // Only visible in certain zones
  const zoneString = String(currentZone);
  const isVisible = (
    currentZone === EnvironmentZone.CORAL_REEF || 
    currentZone === EnvironmentZone.OPEN_OCEAN ||
    zoneString === 'CORAL_REEF' || 
    zoneString === 'OPEN_OCEAN' ||
    zoneString === 'EAST_AUSTRALIAN_CURRENT'
  );
  
  // Create water surface material with custom shader
  const waterMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(effects.waterColor) },
        resolution: { value: new THREE.Vector2(1024, 1024) }
      },
      vertexShader: `
        uniform float time;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // Wave function
        float wave(vec2 position, float time, float frequency, float amplitude, float speedFactor) {
          float wave = sin(position.x * frequency + time * speedFactor) * 
                      cos(position.y * frequency * 0.8 + time * speedFactor * 0.9) * 
                      amplitude;
          return wave;
        }
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          // Create multiple wave layers for realistic ocean surface
          float elevation = 
            wave(position.xy, time, 0.05, 0.8, 1.0) +
            wave(position.xy, time, 0.1, 0.4, 1.5) +
            wave(position.xy, time, 0.2, 0.2, 2.0);
          
          // Create displaced position
          vec3 newPosition = position;
          newPosition.z += elevation;
          
          // Calculate normal based on wave derivatives (simplified)
          vec3 tangent = normalize(vec3(1.0, 0.0, 
            wave(position.xy + vec2(0.01, 0.0), time, 0.05, 0.8, 1.0) - 
            wave(position.xy - vec2(0.01, 0.0), time, 0.05, 0.8, 1.0)));
          
          vec3 bitangent = normalize(vec3(0.0, 1.0, 
            wave(position.xy + vec2(0.0, 0.01), time, 0.05, 0.8, 1.0) - 
            wave(position.xy - vec2(0.0, 0.01), time, 0.05, 0.8, 1.0)));
          
          vNormal = normalize(cross(tangent, bitangent));
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform vec2 resolution;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Lighting based on normal
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
          float diff = max(dot(vNormal, lightDir), 0.0);
          
          // Specular highlight
          vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
          vec3 reflectDir = reflect(-lightDir, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
          
          // Fresnel effect for edge highlights
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          
          // Water opacity based on view angle
          float opacity = 0.7 + fresnel * 0.3;
          
          // Final color
          vec3 diffuseColor = color * (0.2 + diff * 0.8);
          vec3 specularColor = vec3(1.0, 1.0, 1.0) * spec * 0.5;
          vec3 fresnelColor = color * 1.5 * fresnel;
          
          vec3 finalColor = diffuseColor + specularColor + fresnelColor;
          
          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    return material;
  }, [effects.waterColor]);
  
  // Animate water surface
  useFrame((_, delta) => {
    if (!meshRef.current || !isVisible) return;
    
    const time = performance.now() * 0.001;
    
    // Update shader uniforms
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.time.value = time * 0.5;
  });
  
  if (!isVisible) return null;
  
  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200, 64, 64]} />
      <primitive object={waterMaterial} attach="material" />
    </mesh>
  );
};

/**
 * WaterParticleSystem for bubbles, plankton, and other particles
 */
export const WaterParticleSystem: React.FC = () => {
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const meshRef = useRef<THREE.Points>(null);
  
  // Get zone effects
  const effects = getZoneEffects(currentZone);
  
  // Create particle material with custom shader
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(effects.waterColor) },
        size: { value: 3.0 },
        scale: { value: window.innerHeight / 2 }
      },
      vertexShader: `
        uniform float time;
        uniform float size;
        uniform float scale;
        
        attribute float particleSize;
        attribute float particleSpeed;
        attribute vec3 particleInitialPosition;
        
        varying vec2 vUv;
        varying float vSize;
        
        void main() {
          vUv = uv;
          vSize = particleSize;
          
          // Calculate particle motion
          // Apply different motion patterns to different particles based on their properties
          vec3 p = particleInitialPosition;
          
          // Vertical rising motion (based on particle speed attribute)
          p.y += time * particleSpeed * 0.5;
          
          // Gentle horizontal drift
          p.x += sin(time * 0.5 + p.y * 0.2) * 0.3;
          
          // Circular motion
          float angle = time * 0.1 * (particleSize + 0.5);
          p.x += sin(angle) * 0.2 * particleSize;
          p.z += cos(angle) * 0.2 * particleSize;
          
          // Reset particles that have risen too high
          if (p.y > 20.0) {
            p.y = -5.0;
          }
          
          // Project to screen
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = size * particleSize * scale / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        
        varying vec2 vUv;
        varying float vSize;
        
        void main() {
          // Calculate distance from center of point (for circle shape)
          vec2 coords = gl_PointCoord - 0.5;
          float dist = length(coords);
          
          // Discard pixels outside the circle
          if (dist > 0.5) discard;
          
          // Create soft edge
          float alpha = smoothstep(0.5, 0.4, dist);
          
          // Create a bubble-like gradient
          float gradient = smoothstep(0.5, 0.2, dist);
          vec3 bubbleColor = mix(color * 2.0, color, gradient);
          
          // Add a shimmer effect
          float shimmer = sin(time * 2.0 + vSize * 20.0) * 0.1 + 0.9;
          
          gl_FragColor = vec4(bubbleColor * shimmer, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, [effects.waterColor]);
  
  // Create particle geometry with custom attributes
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 300;
    
    // Create positions and custom particle attributes
    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Random initial positions in a wide area
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Store initial positions for animation reference
      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;
      
      // Random sizes and speeds for variation
      sizes[i] = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
      speeds[i] = Math.random() * 0.8 + 0.4; // 0.4 to 1.2
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('particleInitialPosition', new THREE.BufferAttribute(initialPositions, 3));
    geometry.setAttribute('particleSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('particleSpeed', new THREE.BufferAttribute(speeds, 1));
    
    return geometry;
  }, []);
  
  // Animate particles
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const time = performance.now() * 0.001;
    
    // Update shader uniforms for animation
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.time.value = time;
  });
  
  return (
    <points ref={meshRef}>
      <primitive object={particleGeometry} attach="geometry" />
      <primitive object={particleMaterial} attach="material" />
    </points>
  );
};

/**
 * Enhanced main component that brings all environment effects together
 */
export const EnvironmentEffects: React.FC = () => {
  // Get environment parameters
  const environmentParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  const currentZone = useEnvironmentStore(state => state.currentZone);
  
  // Get zone effects
  const effects = getZoneEffects(currentZone);
  
  // Lighting references
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // Update lights based on environment
  useFrame(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.color.set(environmentParams.lightColor);
      directionalLightRef.current.intensity = environmentParams.lightIntensity;
    }
    
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(environmentParams.ambientColor);
      ambientLightRef.current.intensity = environmentParams.ambientIntensity;
    }
  });

  return (
    <>
      {/* Enhanced visual effects */}
      <GodRaysEffect />
      <CausticsEffect />
      <WaterSurface />
      <WaterParticleSystem />
      <WaterEffects />
      
      {/* Enhanced lighting system */}
      <directionalLight
        ref={directionalLightRef}
        position={[0, 10, 5]}
        intensity={environmentParams.lightIntensity}
        color={environmentParams.lightColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <ambientLight 
        ref={ambientLightRef} 
        intensity={environmentParams.ambientIntensity} 
        color={environmentParams.ambientColor}
      />
      
      {/* Player-following light for better visibility */}
      <pointLight
        ref={pointLightRef}
        position={[0, 2, 5]}
        intensity={0.5}
        color="#FFFFFF"
        distance={10}
        decay={2}
      />
      
      {/* Zone-specific lighting effects */}
      {(currentZone === EnvironmentZone.DEEP_SEA || String(currentZone) === 'DEEP_SEA') && (
        // Bioluminescent spots in deep sea
        <>
          <pointLight position={[-8, 3, -15]} intensity={0.6} color="#00FFFF" distance={15} decay={2} />
          <pointLight position={[12, -2, -25]} intensity={0.4} color="#0088FF" distance={10} decay={2} />
          <pointLight position={[5, 4, -20]} intensity={0.3} color="#7744FF" distance={8} decay={2.5} />
        </>
      )}
      
      {(String(currentZone) === 'SHIPWRECK') && (
        // Atmospheric lighting for shipwreck zone
        <>
          <spotLight
            position={[-5, 5, -15]}
            angle={0.5}
            penumbra={0.8}
            intensity={0.7}
            color="#E8D8B0"
            distance={30}
            castShadow
          />
          <pointLight position={[8, -3, -20]} intensity={0.3} color="#4488FF" distance={12} decay={2.2} />
        </>
      )}
      
      {(String(currentZone) === 'EAST_AUSTRALIAN_CURRENT') && (
        // Dynamic lighting for EAC
        <>
          <pointLight 
            position={[0, 0, -10]} 
            intensity={0.6} 
            color="#40A0FF" 
            distance={20} 
            decay={1.5} 
          />
        </>
      )}
    </>
  );
};

export default EnvironmentEffects;