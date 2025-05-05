'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { extend, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, ShaderPass, RenderPass } from 'three-stdlib';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';

// Extend Three.js with necessary components
extend({ EffectComposer, ShaderPass, RenderPass });

// Underwater shader for post-processing
const UnderwaterShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'time': { value: 0 },
    'distortionStrength': { value: 0.03 },
    'distortionScale': { value: 20.0 },
    'waterColor': { value: new THREE.Color('#0c6b9c') },
    'waterColorStrength': { value: 0.2 },
    'vignetteStrength': { value: 0.5 }
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float distortionStrength;
    uniform float distortionScale;
    uniform vec3 waterColor;
    uniform float waterColorStrength;
    uniform float vignetteStrength;
    
    varying vec2 vUv;
    
    // Simple hash function
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // Simplex noise from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
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
    
    // Water caustics effect
    float causticEffect(vec2 uv, float time) {
      float scale = distortionScale;
      vec2 p = uv * scale;
      float noise1 = snoise(p + vec2(time * 0.2, time * 0.3));
      float noise2 = snoise(p * 1.5 + vec2(time * -0.1, time * 0.2));
      return (noise1 + noise2) * 0.5;
    }
    
    void main() {
      // Calculate distortion
      float noise = causticEffect(vUv, time);
      vec2 distortedUv = vUv + vec2(
        distortionStrength * sin(noise * 10.0),
        distortionStrength * cos(noise * 10.0)
      );
      
      // Sample texture with distortion
      vec4 texColor = texture2D(tDiffuse, distortedUv);
      
      // Apply water color tinting
      texColor.rgb = mix(texColor.rgb, waterColor, waterColorStrength);
      
      // Add slight caustics effect
      float caustics = pow(0.5 + 0.5 * causticEffect(vUv, time), 2.0);
      texColor.rgb += waterColor * caustics * 0.05;
      
      // Vignette effect (darker edges)
      vec2 uvCenter = vUv - 0.5;
      float vignette = 1.0 - dot(uvCenter, uvCenter) * vignetteStrength;
      texColor.rgb *= vignette;
      
      gl_FragColor = texColor;
    }
  `
};

// Zone-specific environment effects
const zoneEffects = {
  [EnvironmentZone.CORAL_REEF]: {
    distortionStrength: 0.02,
    distortionScale: 15.0,
    waterColor: new THREE.Color('#0c6b9c'),
    waterColorStrength: 0.15,
    vignetteStrength: 0.4,
    godraysStrength: 0.6,
    fogDensity: 0.02,
    fogColor: '#0c6b9c',
    ambientIntensity: 0.4,
    directionalIntensity: 0.8
  },
  [EnvironmentZone.OPEN_OCEAN]: {
    distortionStrength: 0.01,
    distortionScale: 10.0,
    waterColor: new THREE.Color('#0a4d7a'),
    waterColorStrength: 0.2,
    vignetteStrength: 0.3,
    godraysStrength: 0.4,
    fogDensity: 0.01,
    fogColor: '#0a4d7a',
    ambientIntensity: 0.3,
    directionalIntensity: 0.7
  },
  [EnvironmentZone.DEEP_SEA]: {
    distortionStrength: 0.01,
    distortionScale: 8.0,
    waterColor: new THREE.Color('#041e31'),
    waterColorStrength: 0.3,
    vignetteStrength: 0.7,
    godraysStrength: 0.1,
    fogDensity: 0.03,
    fogColor: '#041e31',
    ambientIntensity: 0.2,
    directionalIntensity: 0.4
  }
};

/**
 * Component to manage water post-processing effects
 */
export const WaterEffects: React.FC = () => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer>();
  const shaderRef = useRef<ShaderPass>();
  const timeRef = useRef(0);
  
  // Get current environment parameters
  const zoneParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  
  // Initial setup of the effect composer
  useEffect(() => {
    const renderPass = new RenderPass(scene, camera);
    const underwaterPass = new ShaderPass(UnderwaterShader);
    
    const composer = new EffectComposer(gl);
    
    // Set pixel ratio to match the renderer for high DPI displays
    const pixelRatio = gl.getPixelRatio();
    composer.setPixelRatio(pixelRatio);
    
    composer.addPass(renderPass);
    composer.addPass(underwaterPass);
    
    composerRef.current = composer;
    shaderRef.current = underwaterPass;
    
    // Set up initial uniforms
    if (shaderRef.current) {
      updateShaderUniforms();
    }
    
    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera]);
  
  // Update composer when size changes
  useEffect(() => {
    if (composerRef.current) {
      // Set size AND pixel ratio to ensure proper resolution
      composerRef.current.setSize(size.width, size.height);
      composerRef.current.setPixelRatio(gl.getPixelRatio());
    }
  }, [size, gl]);
  
  // Update shader uniforms based on current zone parameters
  const updateShaderUniforms = () => {
    if (!shaderRef.current) return;
    
    // Get the current color from zone parameters
    const waterColor = new THREE.Color(zoneParams.fogColor);
    
    // Determine effect strength based on the zone
    const currentZone = useEnvironmentStore.getState().currentZone;
    const effects = zoneEffects[currentZone];
    
    // Update shader uniforms
    shaderRef.current.uniforms.waterColor.value = waterColor;
    shaderRef.current.uniforms.distortionStrength.value = effects.distortionStrength;
    shaderRef.current.uniforms.distortionScale.value = effects.distortionScale;
    shaderRef.current.uniforms.waterColorStrength.value = effects.waterColorStrength;
    shaderRef.current.uniforms.vignetteStrength.value = effects.vignetteStrength;
  };
  
  // Animation and rendering
  useFrame((_, delta) => {
    // Update time uniform
    timeRef.current += delta;
    
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value = timeRef.current;
      
      // Update other uniforms if transitioning
      if (isTransitioning) {
        updateShaderUniforms();
      }
    }
    
    // Render with composer instead of default renderer
    if (composerRef.current) {
      composerRef.current.render();
    }
    
    // Return true to indicate we've handled the rendering
    return true;
  }, 1); // Priority 1 to override default rendering
  
  return null;
};

/**
 * Component for light shafts / god rays effect
 */
export const GodRaysEffect: React.FC = () => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  // Get current environment parameters
  const zoneParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  const currentZone = useEnvironmentStore(state => state.currentZone);
  
  // Animation for god rays
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    
    const time = performance.now() * 0.001;
    
    // Subtle movement of light direction
    lightRef.current.position.x = Math.sin(time * 0.1) * 2;
    lightRef.current.position.y = 20 + Math.sin(time * 0.2) * 5;
    lightRef.current.position.z = -30 + Math.cos(time * 0.15) * 5;
    
    // Pulsing intensity
    const baseIntensity = zoneEffects[currentZone].directionalIntensity;
    const pulseAmount = zoneEffects[currentZone].godraysStrength * 0.3;
    lightRef.current.intensity = baseIntensity + Math.sin(time * 0.5) * pulseAmount;
  });
  
  return (
    <group>
      {/* Directional light for god rays effect */}
      <directionalLight
        ref={lightRef}
        color={zoneParams.lightColor}
        intensity={zoneEffects[currentZone].directionalIntensity}
        position={[0, 20, -30]}
        castShadow
      />
      
      {/* Ambient light for general scene illumination */}
      <ambientLight 
        color={zoneParams.ambientColor} 
        intensity={zoneEffects[currentZone].ambientIntensity} 
      />
    </group>
  );
};

/**
 * Component for water caustics effect on ocean floor
 */
export const CausticsEffect: React.FC = () => {
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture[]>([]);
  const textureIndexRef = useRef(0);
  const timeRef = useRef(0);
  
  // Only visible in coral reef and partially in open ocean
  const isVisible = 
    currentZone === EnvironmentZone.CORAL_REEF || 
    currentZone === EnvironmentZone.OPEN_OCEAN;
  
  const intensity = currentZone === EnvironmentZone.CORAL_REEF ? 1.0 : 0.4;
  
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
        opacity={0.3 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

/**
 * Component for dynamic water surface (for when player is near surface)
 */
export const WaterSurface: React.FC<{ position?: [number, number, number] }> = ({ 
  position = [0, 8, 0] 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Only visible in coral reef and open ocean
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isVisible = 
    currentZone === EnvironmentZone.CORAL_REEF || 
    currentZone === EnvironmentZone.OPEN_OCEAN;
  
  // Animate water surface
  useFrame((_, delta) => {
    if (!meshRef.current || !isVisible) return;
    
    const time = performance.now() * 0.001;
    
    // Get the material and update the displacement scale
    const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
    
    // Animate displacement map offset
    if (material.displacementMap) {
      material.displacementMap.offset.x = Math.sin(time * 0.2) * 0.05;
      material.displacementMap.offset.y = time * 0.05;
    }
    
    // Animate normal map offset for wave motion
    if (material.normalMap) {
      material.normalMap.offset.x = time * 0.02;
      material.normalMap.offset.y = time * 0.03;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200, 50, 50]} />
      <meshPhysicalMaterial
        color={currentZone === EnvironmentZone.CORAL_REEF ? '#0c6b9c' : '#0a4d7a'}
        transparent={true}
        opacity={0.8}
        metalness={0.1}
        roughness={0.2}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
        transmission={0.9}
        ior={1.33} // Water IOR
        displacementScale={3}
        displacementBias={-1.5}
      />
    </mesh>
  );
};

/**
 * Main component that brings all environment effects together
 */
export const EnvironmentEffects: React.FC = () => {
  // Get environment parameters
  const environmentParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  
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
      {/* Original effects */}
      <GodRaysEffect />
      <CausticsEffect />
      <WaterSurface />
      <WaterEffects />
      
      {/* Enhanced lighting */}
      <directionalLight
        ref={directionalLightRef}
        position={[0, 10, 5]}
        intensity={environmentParams.lightIntensity}
        color={environmentParams.lightColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Additional ambient light for general illumination */}
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
      
      {/* Volume light shafts - light rays through water */}
      <spotLight
        position={[10, 15, -5]}
        angle={0.3}
        penumbra={0.9}
        intensity={0.8}
        color="#A7C5FF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
};

export default EnvironmentEffects;