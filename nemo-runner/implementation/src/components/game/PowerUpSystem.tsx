'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';

export enum PowerUpType {
  SHIELD = 'SHIELD',
  SPEED_BOOST = 'SPEED_BOOST',
  BUBBLE_MAGNET = 'BUBBLE_MAGNET',
  TIME_SLOW = 'TIME_SLOW',
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER'
}

interface PowerUpDefinition {
  type: PowerUpType;
  duration: number;  // Duration in seconds
  color: string;
  emissiveColor: string;
  scale: number;
  probability: number; // 0-1 probability of spawning this type
  onActivate: (game: ReturnType<typeof useGame>) => void;
  onDeactivate: (game: ReturnType<typeof useGame>) => void;
}

export class PowerUp {
  public object: THREE.Mesh;
  public type: PowerUpType;
  public collected: boolean = false;
  public hitbox: THREE.Sphere;
  public definition: PowerUpDefinition;
  public startTime: number = 0;
  public endTime: number = 0;
  public active: boolean = false;

  constructor(object: THREE.Mesh, definition: PowerUpDefinition) {
    this.object = object;
    this.type = definition.type;
    this.definition = definition;
    this.hitbox = new THREE.Sphere(
      new THREE.Vector3().copy(object.position),
      definition.scale
    );
  }

  update(): void {
    // Update hitbox position to match object
    this.hitbox.center.copy(this.object.position);
  }

  activate(game: ReturnType<typeof useGame>): void {
    this.active = true;
    this.startTime = performance.now();
    this.endTime = this.startTime + (this.definition.duration * 1000);
    this.definition.onActivate(game);
  }

  deactivate(game: ReturnType<typeof useGame>): void {
    this.active = false;
    this.definition.onDeactivate(game);
  }

  getRemainingTime(): number {
    if (!this.active) return 0;
    const now = performance.now();
    return Math.max(0, (this.endTime - now) / 1000);
  }

  getRemainingPercentage(): number {
    if (!this.active) return 0;
    const now = performance.now();
    const total = this.definition.duration * 1000;
    const elapsed = now - this.startTime;
    return Math.max(0, Math.min(1, (total - elapsed) / total));
  }
}

// Define the interface for methods we want to expose
export interface PowerUpSystemRef {
  checkCollisions: (
    playerPosition: THREE.Vector3, 
    playerRadius: number, 
    onCollect?: (powerUp: PowerUp) => void
  ) => void;
  getActivePowerUps: () => PowerUp[];
  hasActivePowerUp: (type: PowerUpType) => boolean;
  getRemainingTime: (type: PowerUpType) => number;
}

const PowerUpSystem = forwardRef<PowerUpSystemRef, {}>((props, ref) => {
  const game = useGame();
  const { state, speed, setMultiplier } = game;
  const isPlaying = state === GameState.PLAYING;
  
  // Power-ups refs
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activePowerUpsRef = useRef<PowerUp[]>([]);
  const sceneRef = useRef<THREE.Group>(null);
  
  // Pooling system for power-ups
  const objectPools = useRef<Map<PowerUpType, THREE.Mesh[]>>(new Map());
  
  // Define power-up types
  const powerUpDefinitions = useRef<Map<PowerUpType, PowerUpDefinition>>(new Map());
  
  // Particle system for collection effects
  const particleSystem = useRef<THREE.Points | null>(null);
  const particleCount = 20;
  const particlesGeometry = useRef<THREE.BufferGeometry | null>(null);
  const particlePositions = useRef<Float32Array | null>(null);
  const particleVelocities = useRef<Float32Array | null>(null);
  const particleColors = useRef<Float32Array | null>(null);
  const particleLifetimes = useRef<Float32Array | null>(null);
  const activeParticles = useRef<boolean[]>([]);
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    checkCollisions: (
      playerPosition: THREE.Vector3, 
      playerRadius: number,
      onCollect?: (powerUp: PowerUp) => void
    ) => {
      // Create a sphere for the player
      const playerSphere = new THREE.Sphere(playerPosition, playerRadius);
      
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const powerUp = powerUpsRef.current[i];
        
        if (powerUp.collected) continue;
        
        // Update power-up
        powerUp.update();
        
        // Check for collision
        if (playerSphere.intersectsSphere(powerUp.hitbox)) {
          // Collect the power-up
          powerUp.collected = true;
          
          // Activate the power-up
          powerUp.activate(game);
          
          // Add to active power-ups
          activePowerUpsRef.current.push(powerUp);
          
          // Trigger collection effect
          const powerUpPos = powerUp.object.position.clone();
          triggerCollectionEffect(powerUpPos, powerUp.type);
          
          // Call the onCollect callback if provided
          if (onCollect) {
            onCollect(powerUp);
          }
          
          // Remove from scene
          returnPowerUpToPool(powerUp);
          powerUpsRef.current.splice(i, 1);
        }
      }
    },
    getActivePowerUps: () => {
      return [...activePowerUpsRef.current];
    },
    hasActivePowerUp: (type: PowerUpType) => {
      return activePowerUpsRef.current.some(p => p.type === type);
    },
    getRemainingTime: (type: PowerUpType) => {
      const powerUp = activePowerUpsRef.current.find(p => p.type === type);
      return powerUp ? powerUp.getRemainingTime() : 0;
    }
  }));
  
  // Setup particle system for collection effects
  const setupParticleSystem = () => {
    if (!sceneRef.current) return;
    
    // Create geometry and buffers for particles
    particlesGeometry.current = new THREE.BufferGeometry();
    
    // Position buffer (3 values per particle - x, y, z)
    particlePositions.current = new Float32Array(particleCount * 3);
    
    // Color buffer (4 values per particle - r, g, b, a)
    particleColors.current = new Float32Array(particleCount * 4);
    
    // Velocity buffer (3 values per particle - vx, vy, vz)
    particleVelocities.current = new Float32Array(particleCount * 3);
    
    // Lifetime buffer (1 value per particle)
    particleLifetimes.current = new Float32Array(particleCount);
    
    // Initialize all particles as inactive
    activeParticles.current = Array(particleCount).fill(false);
    
    // Initialize all positions off-screen
    for (let i = 0; i < particleCount; i++) {
      particlePositions.current[i * 3] = 0;
      particlePositions.current[i * 3 + 1] = 0;
      particlePositions.current[i * 3 + 2] = -100; // Far behind camera
      
      // Set default colors (white)
      particleColors.current[i * 4] = 1;
      particleColors.current[i * 4 + 1] = 1;
      particleColors.current[i * 4 + 2] = 1;
      particleColors.current[i * 4 + 3] = 0; // Start invisible
    }
    
    // Set attributes
    particlesGeometry.current.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions.current, 3)
    );
    
    particlesGeometry.current.setAttribute(
      'color',
      new THREE.BufferAttribute(particleColors.current, 4)
    );
    
    // Create material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    
    // Create particle system
    particleSystem.current = new THREE.Points(particlesGeometry.current, particleMaterial);
    sceneRef.current.add(particleSystem.current);
  };
  
  // Initialize power-up definitions
  useEffect(() => {
    powerUpDefinitions.current.set(PowerUpType.SHIELD, {
      type: PowerUpType.SHIELD,
      duration: 15,
      color: '#00FFFF',
      emissiveColor: '#00FFFF',
      scale: 0.8,
      probability: 0.3,
      onActivate: (game) => {
        console.log('Shield activated');
        // Shield effect (implemented in collision system)
      },
      onDeactivate: (game) => {
        console.log('Shield deactivated');
      }
    });
    
    powerUpDefinitions.current.set(PowerUpType.SPEED_BOOST, {
      type: PowerUpType.SPEED_BOOST,
      duration: 8,
      color: '#FF5A5F',
      emissiveColor: '#FF5A5F',
      scale: 0.8,
      probability: 0.2,
      onActivate: (game) => {
        console.log('Speed boost activated');
        // Store original values to restore later
        const origSpeed = game.speed;
        
        // Apply speed boost
        game.increaseSpeed(2);
        
        // Effect will be reversed in onDeactivate
      },
      onDeactivate: (game) => {
        console.log('Speed boost deactivated');
        // Reset speed to normal
        // Note: this is simplified; a better approach would be to track original values
        game.increaseSpeed(-2);
      }
    });
    
    powerUpDefinitions.current.set(PowerUpType.BUBBLE_MAGNET, {
      type: PowerUpType.BUBBLE_MAGNET,
      duration: 12,
      color: '#FFD700',
      emissiveColor: '#FFD700',
      scale: 0.8,
      probability: 0.15,
      onActivate: (game) => {
        console.log('Bubble magnet activated');
        // Bubble magnet effect (implemented in collectibles system)
      },
      onDeactivate: (game) => {
        console.log('Bubble magnet deactivated');
      }
    });
    
    powerUpDefinitions.current.set(PowerUpType.TIME_SLOW, {
      type: PowerUpType.TIME_SLOW,
      duration: 5,
      color: '#9C59B6',
      emissiveColor: '#9C59B6',
      scale: 0.8,
      probability: 0.1,
      onActivate: (game) => {
        console.log('Time slow activated');
        // Time slow effect (adjust obstacle speed)
      },
      onDeactivate: (game) => {
        console.log('Time slow deactivated');
      }
    });
    
    powerUpDefinitions.current.set(PowerUpType.SCORE_MULTIPLIER, {
      type: PowerUpType.SCORE_MULTIPLIER,
      duration: 10,
      color: '#3EC483',
      emissiveColor: '#3EC483',
      scale: 0.8,
      probability: 0.25,
      onActivate: (game) => {
        console.log('Score multiplier activated');
        game.setMultiplier(2);
      },
      onDeactivate: (game) => {
        console.log('Score multiplier deactivated');
        game.setMultiplier(1);
      }
    });
    
    // Initialize particle system
    if (sceneRef.current && !particleSystem.current) {
      setupParticleSystem();
    }
  }, []);
  
  // Create a power-up mesh
  const createPowerUpMesh = (type: PowerUpType): THREE.Mesh => {
    const definition = powerUpDefinitions.current.get(type)!;
    
    // Base geometry for the power-up
    const geometry = new THREE.IcosahedronGeometry(definition.scale, 1);
    const material = new THREE.MeshStandardMaterial({
      color: definition.color,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.8,
      emissive: definition.emissiveColor,
      emissiveIntensity: 0.5,
    });
    
    return new THREE.Mesh(geometry, material);
  };
  
  // Get a power-up from the pool or create a new one
  const getPowerUpFromPool = (type: PowerUpType): THREE.Mesh => {
    if (!objectPools.current.has(type)) {
      objectPools.current.set(type, []);
    }
    
    const pool = objectPools.current.get(type)!;
    
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    return createPowerUpMesh(type);
  };
  
  // Return a power-up to the pool
  const returnPowerUpToPool = (powerUp: PowerUp): void => {
    if (!sceneRef.current) return;
    
    // Remove from scene
    sceneRef.current.remove(powerUp.object);
    
    // Add to pool
    if (!objectPools.current.has(powerUp.type)) {
      objectPools.current.set(powerUp.type, []);
    }
    
    const pool = objectPools.current.get(powerUp.type)!;
    pool.push(powerUp.object);
  };
  
  // Spawn a power-up
  const spawnPowerUp = (
    type: PowerUpType, 
    position: THREE.Vector3
  ): PowerUp => {
    if (!sceneRef.current) return null!;
    
    const definition = powerUpDefinitions.current.get(type)!;
    const object = getPowerUpFromPool(type);
    
    // Position the power-up
    object.position.copy(position);
    
    // Add to scene
    sceneRef.current.add(object);
    
    // Create power-up instance
    const powerUp = new PowerUp(object, definition);
    
    powerUpsRef.current.push(powerUp);
    
    return powerUp;
  };
  
  // Generate power-ups randomly
  const generatePowerUps = (): void => {
    if (!isPlaying) return;
    
    // Base spawn distance
    const spawnDistance = 30;
    
    // Base spawn chance (adjust for difficulty)
    const spawnChance = 0.01 + (speed * 0.001);
    
    if (Math.random() < spawnChance) {
      // Determine power-up type based on probabilities
      const rand = Math.random();
      let cumulativeProbability = 0;
      let selectedType = PowerUpType.SHIELD;
      
      for (const [type, definition] of powerUpDefinitions.current.entries()) {
        cumulativeProbability += definition.probability;
        if (rand < cumulativeProbability) {
          selectedType = type;
          break;
        }
      }
      
      // Determine position
      const xPos = (Math.random() * 16) - 8; // Range from -8 to 8
      const yPos = (Math.random() * 8) - 4;  // Range from -4 to 4
      const zPos = -spawnDistance;
      
      // Spawn the power-up
      spawnPowerUp(
        selectedType,
        new THREE.Vector3(xPos, yPos, zPos)
      );
    }
  };
  
  // Trigger collection effect with particles
  const triggerCollectionEffect = (position: THREE.Vector3, type: PowerUpType): void => {
    if (!particlePositions.current || !particleColors.current || 
        !particleVelocities.current || !particleLifetimes.current) {
      return;
    }
    
    // Get color based on power-up type
    let color = new THREE.Color('#FFFFFF');
    
    // Set color based on power-up type
    switch (type) {
      case PowerUpType.SHIELD:
        color = new THREE.Color('#00FFFF');
        break;
      case PowerUpType.SPEED_BOOST:
        color = new THREE.Color('#FF5A5F');
        break;
      case PowerUpType.BUBBLE_MAGNET:
        color = new THREE.Color('#FFD700');
        break;
      case PowerUpType.TIME_SLOW:
        color = new THREE.Color('#9C59B6');
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        color = new THREE.Color('#3EC483');
        break;
    }
    
    // Spawn particles at collection position
    let particlesToSpawn = 15; // More particles for power-ups
    for (let i = 0; i < particleCount; i++) {
      if (!activeParticles.current[i] && particlesToSpawn > 0) {
        // Set particle active
        activeParticles.current[i] = true;
        
        // Set position to collection point
        particlePositions.current[i * 3] = position.x;
        particlePositions.current[i * 3 + 1] = position.y;
        particlePositions.current[i * 3 + 2] = position.z;
        
        // Set random velocity (burst outward)
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4; // Faster particles for power-ups
        
        particleVelocities.current[i * 3] = Math.sin(angle) * Math.cos(elevation) * speed;
        particleVelocities.current[i * 3 + 1] = Math.sin(elevation) * speed;
        particleVelocities.current[i * 3 + 2] = Math.cos(angle) * Math.cos(elevation) * speed;
        
        // Set color
        particleColors.current[i * 4] = color.r;
        particleColors.current[i * 4 + 1] = color.g;
        particleColors.current[i * 4 + 2] = color.b;
        particleColors.current[i * 4 + 3] = 1.0; // Start fully opaque
        
        // Set lifetime
        particleLifetimes.current[i] = 1.5; // Longer lifetime for power-ups
        
        particlesToSpawn--;
      }
    }
    
    // Update particle geometry attributes
    if (particlesGeometry.current) {
      particlesGeometry.current.attributes.position.needsUpdate = true;
      particlesGeometry.current.attributes.color.needsUpdate = true;
    }
  };
  
  // Update particles
  const updateParticles = (delta: number): void => {
    if (!particlePositions.current || !particleColors.current || 
        !particleVelocities.current || !particleLifetimes.current ||
        !particlesGeometry.current) {
      return;
    }
    
    for (let i = 0; i < particleCount; i++) {
      if (activeParticles.current[i]) {
        // Update position based on velocity
        particlePositions.current[i * 3] += particleVelocities.current[i * 3] * delta;
        particlePositions.current[i * 3 + 1] += particleVelocities.current[i * 3 + 1] * delta;
        particlePositions.current[i * 3 + 2] += particleVelocities.current[i * 3 + 2] * delta;
        
        // Apply gravity (slight pull downward)
        particleVelocities.current[i * 3 + 1] -= 1.0 * delta;
        
        // Update lifetime
        particleLifetimes.current[i] -= delta;
        
        // Update opacity based on lifetime
        particleColors.current[i * 4 + 3] = particleLifetimes.current[i];
        
        // Deactivate if lifetime expired
        if (particleLifetimes.current[i] <= 0) {
          activeParticles.current[i] = false;
          particlePositions.current[i * 3 + 2] = -100; // Move off-screen
          particleColors.current[i * 4 + 3] = 0; // Make invisible
        }
      }
    }
    
    // Update particle geometry attributes
    particlesGeometry.current.attributes.position.needsUpdate = true;
    particlesGeometry.current.attributes.color.needsUpdate = true;
  };
  
  // Update function
  useFrame((_, delta) => {
    if (!isPlaying) return;
    
    // Generate new power-ups
    generatePowerUps();
    
    // Move power-ups towards player
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const powerUp = powerUpsRef.current[i];
      
      // Move power-up forward (toward player)
      powerUp.object.position.z += speed * delta * 10;
      
      // Remove power-ups that have passed the player
      if (powerUp.object.position.z > 10) {
        returnPowerUpToPool(powerUp);
        powerUpsRef.current.splice(i, 1);
      }
      
      // Add some gentle movement and rotation
      const time = performance.now() * 0.001;
      const floatHeight = Math.sin(time + i) * 0.1;
      powerUp.object.position.y += floatHeight * delta;
      
      // Rotate the power-up
      powerUp.object.rotation.y += delta * 2;
      powerUp.object.rotation.x += delta * 0.5;
    }
    
    // Update active power-ups
    const now = performance.now();
    for (let i = activePowerUpsRef.current.length - 1; i >= 0; i--) {
      const powerUp = activePowerUpsRef.current[i];
      
      // Check if power-up has expired
      if (now >= powerUp.endTime) {
        // Deactivate power-up
        powerUp.deactivate(game);
        
        // Remove from active power-ups
        activePowerUpsRef.current.splice(i, 1);
      }
    }
    
    // Update particles
    updateParticles(delta);
  });
  
  // Reset all power-ups
  const reset = (): void => {
    // Deactivate all active power-ups
    for (const powerUp of activePowerUpsRef.current) {
      powerUp.deactivate(game);
    }
    
    // Return all power-ups to pool
    for (const powerUp of powerUpsRef.current) {
      returnPowerUpToPool(powerUp);
    }
    
    // Clear arrays
    powerUpsRef.current = [];
    activePowerUpsRef.current = [];
    
    // Reset particles
    if (particlePositions.current && particleColors.current && 
        particlesGeometry.current) {
      for (let i = 0; i < particleCount; i++) {
        activeParticles.current[i] = false;
        particlePositions.current[i * 3 + 2] = -100; // Move off-screen
        particleColors.current[i * 4 + 3] = 0; // Make invisible
      }
      
      particlesGeometry.current.attributes.position.needsUpdate = true;
      particlesGeometry.current.attributes.color.needsUpdate = true;
    }
  };
  
  // Reset when game state changes
  useEffect(() => {
    if (state === GameState.MENU) {
      reset();
    }
  }, [state]);
  
  // Initialize particle system when scene ref is ready
  useEffect(() => {
    if (sceneRef.current && !particleSystem.current) {
      setupParticleSystem();
    }
  }, [sceneRef.current]);
  
  return (
    <group ref={sceneRef}>
      {/* This component doesn't render anything directly - it manages power-ups and particles */}
    </group>
  );
});

PowerUpSystem.displayName = "PowerUpSystem";

export default PowerUpSystem;

// Utility hook to get active power-ups
export function useActivePowerUps() {
  const [activePowerUps, setActivePowerUps] = useState<PowerUp[]>([]);
  
  // This would need to be connected to the actual PowerUpSystem
  // For now, it's just a placeholder
  
  return {
    activePowerUps,
    hasActivePowerUp: (type: PowerUpType) => {
      return activePowerUps.some(p => p.type === type);
    },
    getRemainingTime: (type: PowerUpType) => {
      const powerUp = activePowerUps.find(p => p.type === type);
      return powerUp ? powerUp.getRemainingTime() : 0;
    }
  };
}