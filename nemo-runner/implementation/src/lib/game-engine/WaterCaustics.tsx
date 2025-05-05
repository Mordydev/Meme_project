'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';

// Water caustics effect for underwater scene
export function WaterCaustics() {
  const { scene, camera } = useThree();
  const environmentParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  const currentZone = useEnvironmentStore(state => state.currentZone);
  
  // References for the caustics planes
  const causticsRef = useRef<THREE.Mesh>(null);
  
  // Create caustics texture
  const causticTextures = useMemo(() => {
    const textures = [];
    // Load several caustic textures for animation
    for (let i = 1; i <= 5; i++) {
      const texture = new THREE.TextureLoader().load(`/assets/caustics/caustics${i}.jpg`);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      textures.push(texture);
    }
    return textures;
  }, []);
  
  // Create material with animated caustics
  const causticsMaterial = useMemo(() => {
    // Create a custom shader material for caustics
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        causticTex: { value: causticTextures[0] },
        color: { value: new THREE.Color(0x2380bb) },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        intensity: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform sampler2D causticTex;
        uniform vec3 color;
        uniform float intensity;
        
        varying vec2 vUv;
        
        void main() {
          // Animate the UVs for moving caustics
          vec2 uv = vUv;
          uv.x += time * 0.05;
          uv.y += time * 0.03;
          
          // Sample the caustic texture
          vec4 caustics = texture2D(causticTex, uv);
          
          // Create final caustic color with intensity control
          gl_FragColor = vec4(color * caustics.rgb * intensity, caustics.a * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }, [causticTextures]);
  
  // Update caustics based on environment
  useEffect(() => {
    // Adjust caustic intensity and color based on environment zone
    if (causticsMaterial.uniforms) {
      switch(currentZone) {
        case EnvironmentZone.CORAL_REEF:
          causticsMaterial.uniforms.intensity.value = 0.7;
          causticsMaterial.uniforms.color.value = new THREE.Color(0x4aa8ff);
          break;
        case EnvironmentZone.OPEN_OCEAN:
          causticsMaterial.uniforms.intensity.value = 0.5;
          causticsMaterial.uniforms.color.value = new THREE.Color(0x2380bb);
          break;
        case EnvironmentZone.DEEP_SEA:
          causticsMaterial.uniforms.intensity.value = 0.1;
          causticsMaterial.uniforms.color.value = new THREE.Color(0x0a3060);
          break;
      }
    }
  }, [currentZone, causticsMaterial]);
  
  // Animate the caustics
  useFrame((_, delta) => {
    if (causticsMaterial.uniforms) {
      // Update time uniform for animation
      causticsMaterial.uniforms.time.value += delta;
      
      // Cycle through different caustic textures every few seconds
      const textureIndex = Math.floor(causticsMaterial.uniforms.time.value * 0.5) % causticTextures.length;
      causticsMaterial.uniforms.causticTex.value = causticTextures[textureIndex];
      
      // Position caustics to follow camera
      if (causticsRef.current) {
        causticsRef.current.position.x = camera.position.x;
        causticsRef.current.position.z = camera.position.z;
      }
    }
  });
  
  return (
    <group>
      {/* Main caustics plane above the scene */}
      <mesh ref={causticsRef} position={[0, 10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <primitive object={causticsMaterial} attach="material" />
      </mesh>
      
      {/* Additional caustics planes for complete coverage */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <primitive object={causticsMaterial} attach="material" />
      </mesh>
    </group>
  );
}