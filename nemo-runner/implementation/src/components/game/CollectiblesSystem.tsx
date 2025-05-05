'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';

export enum CollectibleType {
  SMALL_BUBBLE = 'SMALL_BUBBLE',
  MEDIUM_BUBBLE = 'MEDIUM_BUBBLE',
  LARGE_BUBBLE = 'LARGE_BUBBLE',
  GOLDEN_BUBBLE = 'GOLDEN_BUBBLE',
  POWER_UP = 'POWER_UP'
}

interface CollectibleDefinition {
  type: CollectibleType;
  points: number;
  radius: number;
  color: string;
  opacity: number;
  probability: number; // 0-1 probability of spawning this type
}

export class Collectible {
  public object: THREE.Mesh;
  public type: CollectibleType;
  public points: number;
  public collected: boolean = false;
  public hitbox: THREE.Sphere;

  constructor(object: THREE.Mesh, type: CollectibleType, points: number, radius: number) {
    this.object = object;
    this.type = type;
    this.points = points;
    this.hitbox = new THREE.Sphere(
      new THREE.Vector3().copy(object.position),
      radius
    );
  }

  update(): void {
    // Update hitbox position to match object
    this.hitbox.center.copy(this.object.position);
  }
}

// Define the interface for methods we want to expose
export interface CollectiblesSystemRef {
  checkCollisions: (playerPosition: THREE.Vector3, playerRadius: number, onCollect?: (collectible: Collectible) => void) => void;
}

const CollectiblesSystem = forwardRef<CollectiblesSystemRef, {}>((props, ref) => {
  const { state, speed, addScore } = useGame();
  const isPlaying = state === GameState.PLAYING;
  
  // Collectibles refs
  const collectiblesRef = useRef<Collectible[]>([]);
  const sceneRef = useRef<THREE.Group>(null);
  
  // Pooling system for collectibles
  const objectPools = useRef<Map<CollectibleType, THREE.Mesh[]>>(new Map());
  
  // Collectible definitions
  const collectibleDefinitions = useRef<Map<CollectibleType, CollectibleDefinition>>(new Map());
  
  // Particle system for collection effects
  const particleSystem = useRef<THREE.Points | null>(null);
  const particleCount = 20;
  const particlesGeometry = useRef<THREE.BufferGeometry | null>(null);
  const particlePositions = useRef<Float32Array | null>(null);
  const particleVelocities = useRef<Float32Array | null>(null);
  const particleColors = useRef<Float32Array | null>(null);
  const particleLifetimes = useRef<Float32Array | null>(null);
  const activeParticles = useRef<boolean[]>([]);
  
  // Initialize collectible definitions
  useEffect(() => {
    collectibleDefinitions.current.set(CollectibleType.SMALL_BUBBLE, {
      type: CollectibleType.SMALL_BUBBLE,
      points: 10,
      radius: 0.3,
      color: '#FFFFFF',
      opacity: 0.5,
      probability: 0.7
    });
    
    collectibleDefinitions.current.set(CollectibleType.MEDIUM_BUBBLE, {
      type: CollectibleType.MEDIUM_BUBBLE,
      points: 25,
      radius: 0.5,
      color: '#FFFFFF',
      opacity: 0.6,
      probability: 0.2
    });
    
    collectibleDefinitions.current.set(CollectibleType.LARGE_BUBBLE, {
      type: CollectibleType.LARGE_BUBBLE,
      points: 50,
      radius: 0.7,
      color: '#FFFFFF',
      opacity: 0.7,
      probability: 0.08
    });
    
    collectibleDefinitions.current.set(CollectibleType.GOLDEN_BUBBLE, {
      type: CollectibleType.GOLDEN_BUBBLE,
      points: 100,
      radius: 0.6,
      color: '#FFD700',
      opacity: 0.8,
      probability: 0.02
    });
    
    // Initialize particle system for collection effects
    if (sceneRef.current && !particleSystem.current) {
      setupParticleSystem();
    }
  }, []);
  
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
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    checkCollisions: (
      playerPosition: THREE.Vector3, 
      playerRadius: number,
      onCollect?: (collectible: Collectible) => void
    ) => {
      // Create a sphere for the player
      const playerSphere = new THREE.Sphere(playerPosition, playerRadius);
      
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const collectible = collectiblesRef.current[i];
        
        if (collectible.collected) continue;
        
        // Update collectible
        collectible.update();
        
        // Check for collision
        if (playerSphere.intersectsSphere(collectible.hitbox)) {
          // Collect the collectible
          collectible.collected = true;
          
          // Award points
          addScore(collectible.points);
          
          // Trigger collection effect
          const collectiblePos = collectible.object.position.clone();
          triggerCollectionEffect(collectiblePos, collectible.type);
          
          // Call the onCollect callback if provided
          if (onCollect) {
            onCollect(collectible);
          }
          
          // Remove collectible
          returnCollectibleToPool(collectible);
          collectiblesRef.current.splice(i, 1);
        }
      }
    }
  }));
  
  // Create a collectible mesh
  const createCollectibleMesh = (type: CollectibleType): THREE.Mesh => {
    const definition = collectibleDefinitions.current.get(type)!;
    
    const geometry = new THREE.SphereGeometry(definition.radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: definition.color,
      transparent: true,
      opacity: definition.opacity,
      roughness: 0.1,
      metalness: 0.8,
      emissive: definition.color,
      emissiveIntensity: 0.3,
    });
    
    return new THREE.Mesh(geometry, material);
  };
  
  // Get a collectible from the pool or create a new one
  const getCollectibleFromPool = (type: CollectibleType): THREE.Mesh => {
    if (!objectPools.current.has(type)) {
      objectPools.current.set(type, []);
    }
    
    const pool = objectPools.current.get(type)!;
    
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    return createCollectibleMesh(type);
  };
  
  // Return a collectible to the pool
  const returnCollectibleToPool = (collectible: Collectible): void => {
    if (!sceneRef.current) return;
    
    // Remove from scene
    sceneRef.current.remove(collectible.object);
    
    // Add to pool
    if (!objectPools.current.has(collectible.type)) {
      objectPools.current.set(collectible.type, []);
    }
    
    const pool = objectPools.current.get(collectible.type)!;
    pool.push(collectible.object);
  };
  
  // Spawn a collectible
  const spawnCollectible = (
    type: CollectibleType, 
    position: THREE.Vector3
  ): Collectible => {
    if (!sceneRef.current) return null!;
    
    const definition = collectibleDefinitions.current.get(type)!;
    const object = getCollectibleFromPool(type);
    
    // Position the collectible
    object.position.copy(position);
    
    // Add to scene
    sceneRef.current.add(object);
    
    // Create collectible instance
    const collectible = new Collectible(
      object, 
      type, 
      definition.points, 
      definition.radius
    );
    
    collectiblesRef.current.push(collectible);
    
    return collectible;
  };
  
  // Generate collectible patterns
  const generateCollectibles = (): void => {
    if (!isPlaying) return;
    
    // Base spawn distance
    const spawnDistance = 30;
    
    // Base spawn chance (adjust for difficulty)
    const spawnChance = 0.05 + (speed * 0.01);
    
    if (Math.random() < spawnChance) {
      // Determine collectible type based on probabilities
      const rand = Math.random();
      let cumulativeProbability = 0;
      let selectedType = CollectibleType.SMALL_BUBBLE;
      
      for (const [type, definition] of collectibleDefinitions.current.entries()) {
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
      
      // Spawn the collectible
      spawnCollectible(
        selectedType,
        new THREE.Vector3(xPos, yPos, zPos)
      );
      
      // Sometimes spawn collectibles in patterns
      if (Math.random() < 0.3) {
        const patternType = Math.floor(Math.random() * 4);
        const count = Math.floor(Math.random() * 5) + 3; // 3-7 collectibles
        
        switch (patternType) {
          case 0: // Horizontal line
            for (let i = 1; i < count; i++) {
              spawnCollectible(
                selectedType,
                new THREE.Vector3(xPos + i, yPos, zPos)
              );
            }
            break;
            
          case 1: // Vertical line
            for (let i = 1; i < count; i++) {
              spawnCollectible(
                selectedType,
                new THREE.Vector3(xPos, yPos + i, zPos)
              );
            }
            break;
            
          case 2: // Circle
            for (let i = 1; i < count; i++) {
              const angle = (i / count) * Math.PI * 2;
              const radius = 2;
              spawnCollectible(
                selectedType,
                new THREE.Vector3(
                  xPos + Math.cos(angle) * radius,
                  yPos + Math.sin(angle) * radius,
                  zPos
                )
              );
            }
            break;
            
          case 3: // Zigzag
            for (let i = 1; i < count; i++) {
              spawnCollectible(
                selectedType,
                new THREE.Vector3(
                  xPos + i,
                  yPos + (i % 2 === 0 ? 1 : -1),
                  zPos
                )
              );
            }
            break;
        }
      }
    }
  };
  
  // Trigger collection effect with particles
  const triggerCollectionEffect = (position: THREE.Vector3, type: CollectibleType): void => {
    if (!particlePositions.current || !particleColors.current || 
        !particleVelocities.current || !particleLifetimes.current) {
      return;
    }
    
    // Get color based on collectible type
    let color = new THREE.Color('#FFFFFF');
    if (type === CollectibleType.GOLDEN_BUBBLE) {
      color = new THREE.Color('#FFD700');
    } else if (type === CollectibleType.POWER_UP) {
      color = new THREE.Color('#00FFFF');
    }
    
    // Spawn particles at collection position
    let particlesToSpawn = 10;
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
        const speed = 2 + Math.random() * 3;
        
        particleVelocities.current[i * 3] = Math.sin(angle) * Math.cos(elevation) * speed;
        particleVelocities.current[i * 3 + 1] = Math.sin(elevation) * speed;
        particleVelocities.current[i * 3 + 2] = Math.cos(angle) * Math.cos(elevation) * speed;
        
        // Set color
        particleColors.current[i * 4] = color.r;
        particleColors.current[i * 4 + 1] = color.g;
        particleColors.current[i * 4 + 2] = color.b;
        particleColors.current[i * 4 + 3] = 1.0; // Start fully opaque
        
        // Set lifetime
        particleLifetimes.current[i] = 1.0; // 1 second
        
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
    
    // Generate new collectibles
    generateCollectibles();
    
    // Move collectibles towards player
    for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
      const collectible = collectiblesRef.current[i];
      
      // Move collectible forward (toward player)
      collectible.object.position.z += speed * delta * 10;
      
      // Remove collectibles that have passed the player
      if (collectible.object.position.z > 10) {
        returnCollectibleToPool(collectible);
        collectiblesRef.current.splice(i, 1);
      }
      
      // Add some gentle movement
      const time = performance.now() * 0.001;
      const floatHeight = Math.sin(time + i) * 0.1;
      collectible.object.position.y += floatHeight * delta;
      
      // Make collectibles spin gently
      collectible.object.rotation.y += delta * 1;
      collectible.object.rotation.x += delta * 0.5;
    }
    
    // Update particles
    updateParticles(delta);
  });
  
  // Reset the collectibles system
  const reset = (): void => {
    // Return all collectibles to pool
    for (const collectible of collectiblesRef.current) {
      returnCollectibleToPool(collectible);
    }
    
    // Clear collectibles array
    collectiblesRef.current = [];
    
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
      {/* This component doesn't render anything directly - it manages collectibles and particles */}
    </group>
  );
});

CollectiblesSystem.displayName = "CollectiblesSystem";

export default CollectiblesSystem;