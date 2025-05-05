'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';

// Interface for particle settings
interface ParticleSettings {
  count: number;
  size: [number, number]; // Min and max sizes
  speed: [number, number]; // Min and max speeds
  color: string;
  opacity: number;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
  drift: [number, number, number]; // [x, y, z] drift direction
  texture?: string;
}

// Particle system settings for each zone
const zoneParticleSettings: Record<EnvironmentZone, ParticleSettings[]> = {
  [EnvironmentZone.CORAL_REEF]: [
    {
      // Plankton particles
      count: 1000,
      size: [0.03, 0.08],
      speed: [0.2, 0.5],
      color: '#FFFFFF',
      opacity: 0.5,
      spreadX: 30,
      spreadY: 15,
      spreadZ: 30,
      drift: [0.1, 0.05, 0],
      texture: 'bubble_particle.png'
    },
    {
      // Small bubbles
      count: 100,
      size: [0.05, 0.15],
      speed: [0.5, 1.5],
      color: '#FFFFFF',
      opacity: 0.6,
      spreadX: 30,
      spreadY: 10,
      spreadZ: 30,
      drift: [0, 1, 0],
      texture: 'bubble_particle.png'
    },
    {
      // Light rays particles
      count: 200,
      size: [0.1, 0.3],
      speed: [0.1, 0.3],
      color: '#75C2F6',
      opacity: 0.3,
      spreadX: 25,
      spreadY: 15,
      spreadZ: 25,
      drift: [0, -0.05, 0],
      texture: 'light_particle.png'
    }
  ],
  [EnvironmentZone.OPEN_OCEAN]: [
    {
      // Sparse plankton
      count: 500,
      size: [0.02, 0.06],
      speed: [0.1, 0.3],
      color: '#FFFFFF',
      opacity: 0.4,
      spreadX: 40,
      spreadY: 25,
      spreadZ: 40,
      drift: [0.2, 0, 0],
      texture: 'bubble_particle.png'
    },
    {
      // Occasional bubbles
      count: 50,
      size: [0.05, 0.2],
      speed: [0.8, 1.2],
      color: '#FFFFFF',
      opacity: 0.5,
      spreadX: 40,
      spreadY: 20,
      spreadZ: 40,
      drift: [0, 1, 0],
      texture: 'bubble_particle.png'
    },
    {
      // Subtle light rays
      count: 100,
      size: [0.2, 0.5],
      speed: [0.05, 0.15],
      color: '#4A6A82',
      opacity: 0.2,
      spreadX: 40,
      spreadY: 25,
      spreadZ: 40,
      drift: [0, -0.02, 0],
      texture: 'light_particle.png'
    }
  ],
  [EnvironmentZone.DEEP_SEA]: [
    {
      // Deep sea dust
      count: 300,
      size: [0.01, 0.04],
      speed: [0.05, 0.2],
      color: '#203040',
      opacity: 0.3,
      spreadX: 40,
      spreadY: 25,
      spreadZ: 40,
      drift: [0.05, 0.02, 0],
      texture: 'bubble_particle.png'
    },
    {
      // Bioluminescent particles
      count: 200,
      size: [0.04, 0.1],
      speed: [0.1, 0.3],
      color: '#5CFFFF',
      opacity: 0.7,
      spreadX: 40,
      spreadY: 25,
      spreadZ: 40,
      drift: [0, 0, 0],
      texture: 'glow_particle.png'
    },
    {
      // Volcanic vent particles
      count: 80,
      size: [0.05, 0.15],
      speed: [0.3, 0.8],
      color: '#787878',
      opacity: 0.4,
      spreadX: 40,
      spreadY: 5,
      spreadZ: 40,
      drift: [0, 0.5, 0],
      texture: 'smoke_particle.png'
    }
  ]
};

// Interpolate particle settings between zones
const interpolateParticleSettings = (
  fromSettings: ParticleSettings[],
  toSettings: ParticleSettings[],
  progress: number
): ParticleSettings[] => {
  // Early return if arrays are empty
  if (fromSettings.length === 0 || toSettings.length === 0) {
    return fromSettings.length > 0 ? fromSettings : toSettings;
  }
  
  // Match settings by type (assuming same array order for simplicity)
  return fromSettings.map((fromSetting, index) => {
    // Use from setting if no corresponding to setting
    if (index >= toSettings.length) return fromSetting;
    
    const toSetting = toSettings[index];
    
    // Interpolate number values
    const interpolate = (from: number, to: number) => from + (to - from) * progress;
    const interpolateArray = (from: number[], to: number[]) => 
      from.map((val, i) => interpolate(val, to[i]));
    
    // Create new interpolated settings
    return {
      count: Math.round(interpolate(fromSetting.count, toSetting.count)),
      size: interpolateArray(fromSetting.size, toSetting.size) as [number, number],
      speed: interpolateArray(fromSetting.speed, toSetting.speed) as [number, number],
      color: fromSetting.color, // Keep from color until transition is complete
      opacity: interpolate(fromSetting.opacity, toSetting.opacity),
      spreadX: interpolate(fromSetting.spreadX, toSetting.spreadX),
      spreadY: interpolate(fromSetting.spreadY, toSetting.spreadY),
      spreadZ: interpolate(fromSetting.spreadZ, toSetting.spreadZ),
      drift: interpolateArray(fromSetting.drift, toSetting.drift) as [number, number, number],
      texture: fromSetting.texture // Keep from texture until transition is complete
    };
  });
};

/**
 * Component for a single particle system
 */
interface ParticleSystemProps {
  settings: ParticleSettings;
  followCamera?: boolean;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  settings, 
  followCamera = false 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(null);
  const velocitiesRef = useRef<Float32Array>(null);
  const sizesRef = useRef<Float32Array>(null);
  const textureLoader = new THREE.TextureLoader();
  
  // Load texture if specified
  const texture = useMemo(() => {
    if (!settings.texture) return null;
    return textureLoader.load(`/textures/particles/${settings.texture}`);
  }, [settings.texture]);
  
  // Get camera for following
  const cameraPosition = useRef(new THREE.Vector3());
  
  // Initialize particle system
  useEffect(() => {
    if (!pointsRef.current) return;
    
    // Create positions and velocities arrays
    const positions = new Float32Array(settings.count * 3);
    const velocities = new Float32Array(settings.count * 3);
    const sizes = new Float32Array(settings.count);
    
    // Initialize particles with random positions and velocities
    for (let i = 0; i < settings.count; i++) {
      const i3 = i * 3;
      
      // Position
      positions[i3] = (Math.random() - 0.5) * settings.spreadX;
      positions[i3 + 1] = (Math.random() - 0.5) * settings.spreadY;
      positions[i3 + 2] = (Math.random() - 0.5) * settings.spreadZ;
      
      // Velocity
      const speed = settings.speed[0] + Math.random() * (settings.speed[1] - settings.speed[0]);
      velocities[i3] = settings.drift[0] * speed;
      velocities[i3 + 1] = settings.drift[1] * speed;
      velocities[i3 + 2] = settings.drift[2] * speed;
      
      // Size
      sizes[i] = settings.size[0] + Math.random() * (settings.size[1] - settings.size[0]);
    }
    
    // Store references
    positionsRef.current = positions;
    velocitiesRef.current = velocities;
    sizesRef.current = sizes;
    
    // Update geometry
    pointsRef.current.geometry.setAttribute(
      'position', 
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    // Update sizes if using different sizes
    pointsRef.current.geometry.setAttribute(
      'size', 
      new THREE.Float32BufferAttribute(sizes, 1)
    );
    
  }, [settings]);
  
  // Animate particles
  useFrame((state, delta) => {
    if (!pointsRef.current || !positionsRef.current || !velocitiesRef.current) return;
    
    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    
    // Follow camera if needed
    if (followCamera) {
      state.camera.getWorldPosition(cameraPosition.current);
    }
    
    // Update positions
    for (let i = 0; i < settings.count; i++) {
      const i3 = i * 3;
      
      // Update position based on velocity
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;
      
      // Reset particles that go out of bounds
      const bounds = {
        x: settings.spreadX / 2,
        y: settings.spreadY / 2,
        z: settings.spreadZ / 2
      };
      
      let resetParticle = false;
      
      // Check X bounds
      if (positions[i3] < -bounds.x || positions[i3] > bounds.x) {
        resetParticle = true;
      }
      
      // Check Y bounds
      if (positions[i3 + 1] < -bounds.y || positions[i3 + 1] > bounds.y) {
        resetParticle = true;
      }
      
      // Check Z bounds
      if (positions[i3 + 2] < -bounds.z || positions[i3 + 2] > bounds.z) {
        resetParticle = true;
      }
      
      // Reset particle to a new random position
      if (resetParticle) {
        positions[i3] = (Math.random() - 0.5) * settings.spreadX;
        positions[i3 + 1] = (Math.random() - 0.5) * settings.spreadY;
        positions[i3 + 2] = (Math.random() - 0.5) * settings.spreadZ;
        
        // If following camera, place particles around camera
        if (followCamera) {
          positions[i3] += cameraPosition.current.x;
          positions[i3 + 1] += cameraPosition.current.y;
          positions[i3 + 2] += cameraPosition.current.z;
        }
      }
    }
    
    // Update geometry
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={settings.count}
          array={new Float32Array(settings.count * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={settings.count}
          array={new Float32Array(settings.count)}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={settings.size[1]}
        color={settings.color}
        transparent
        opacity={settings.opacity}
        depthWrite={false}
        sizeAttenuation
        vertexColors={false}
        map={texture}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/**
 * Component to manage all environment particles
 */
export const EnvironmentParticles: React.FC = () => {
  // Get current environment parameters
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const previousZone = useEnvironmentStore(state => state.previousZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  const transitionProgress = useEnvironmentStore(state => state.transitionProgress);
  
  // Get current particle settings based on zone (with transition handling)
  const particleSettings = useMemo(() => {
    const currentSettings = zoneParticleSettings[currentZone];
    
    // If not transitioning or no previous zone, return current settings
    if (!isTransitioning || !previousZone) {
      return currentSettings;
    }
    
    // Get previous settings and interpolate
    const previousSettings = zoneParticleSettings[previousZone];
    return interpolateParticleSettings(previousSettings, currentSettings, transitionProgress);
    
  }, [currentZone, previousZone, isTransitioning, transitionProgress]);
  
  return (
    <group>
      {particleSettings.map((settings, index) => (
        <ParticleSystem
          key={`${currentZone}_particle_${index}`}
          settings={settings}
          followCamera={false}
        />
      ))}
    </group>
  );
};

/**
 * Component for particles that follow the camera
 */
export const CameraParticles: React.FC = () => {
  // Use consistent particle settings but make them follow camera
  const settings: ParticleSettings = {
    count: 500,
    size: [0.02, 0.06],
    speed: [0.1, 0.3],
    color: '#FFFFFF',
    opacity: 0.3,
    spreadX: 20,
    spreadY: 20,
    spreadZ: 20,
    drift: [0, 0, 0],
    texture: 'bubble_particle.png'
  };
  
  return <ParticleSystem settings={settings} followCamera={true} />;
};

/**
 * Effect for creating splash particles when player hits surface
 */
export const SplashEffect: React.FC<{
  position: THREE.Vector3;
  onComplete: () => void;
}> = ({ position, onComplete }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const lifeRef = useRef<Float32Array | null>(null);
  const startTimeRef = useRef(Date.now());
  const duration = 2000; // Effect duration in ms
  
  // Splash particle settings
  const count = 100;
  const settings = {
    size: 0.1,
    color: '#FFFFFF',
    opacity: 0.8,
    texture: 'splash_particle.png'
  };
  
  // Initialize splash particles
  useEffect(() => {
    if (!pointsRef.current) return;
    
    // Create arrays
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifeRemaining = new Float32Array(count);
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position (all start at the splash point)
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
      
      // Velocity (random direction with upward bias)
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = 1 + Math.random() * 4; // Upward bias
      velocities[i3 + 2] = Math.sin(angle) * speed;
      
      // Life remaining (different for each particle)
      lifeRemaining[i] = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    }
    
    // Store references
    positionsRef.current = positions;
    velocitiesRef.current = velocities;
    lifeRef.current = lifeRemaining;
    
    // Update geometry
    pointsRef.current.geometry.setAttribute(
      'position', 
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    // Reset start time
    startTimeRef.current = Date.now();
    
    // Cleanup when effect completes
    return () => {
      onComplete();
    };
  }, [position, onComplete]);
  
  // Animate splash
  useFrame((_, delta) => {
    if (
      !pointsRef.current || 
      !positionsRef.current || 
      !velocitiesRef.current || 
      !lifeRef.current
    ) return;
    
    // Check if effect duration has elapsed
    const now = Date.now();
    if (now - startTimeRef.current > duration) {
      onComplete();
      return;
    }
    
    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    const lifeRemaining = lifeRef.current;
    
    // Gravity effect
    const gravity = -9.8 * delta;
    
    // Update particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Update life
      lifeRemaining[i] -= delta * 0.5; // Decrease life
      
      // Skip dead particles
      if (lifeRemaining[i] <= 0) continue;
      
      // Update velocity (apply gravity)
      velocities[i3 + 1] += gravity;
      
      // Update position
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;
      
      // Bounce off water surface
      if (positions[i3 + 1] < position.y && velocities[i3 + 1] < 0) {
        velocities[i3 + 1] *= -0.3; // Lose energy on bounce
        positions[i3 + 1] = position.y; // Set to surface level
      }
    }
    
    // Update opacity based on life
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, 1 - (now - startTimeRef.current) / duration);
    
    // Update geometry
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  // Create a texture loader
  const textureLoader = new THREE.TextureLoader();
  const texture = useMemo(() => {
    if (!settings.texture) return null;
    return textureLoader.load(`/textures/particles/${settings.texture}`);
  }, [settings.texture]);
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={settings.size}
        color={settings.color}
        transparent
        opacity={settings.opacity}
        depthWrite={false}
        sizeAttenuation
        map={texture}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default EnvironmentParticles;