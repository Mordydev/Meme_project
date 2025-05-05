'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';
import CoralReefZone from './environments/CoralReefZone';
import OpenOceanZone from './environments/OpenOceanZone';
import DeepSeaZone from './environments/DeepSeaZone';
import { EnvironmentZoneRef } from './environments/CoralReefZone';
import { useEnvironmentStore, EnvironmentZone } from '@/lib/game-engine/EnvironmentManager';
import AmbientAudioSystem from './audio/AmbientAudioSystem';
import EnvironmentAudioEffects from './audio/EnvironmentAudioEffects';
import { AudioProvider } from '@/lib/game-engine/AudioContext';

// Lane configuration (must match Player.tsx)
const LANES = {
  LEFT: -2.5,
  CENTER: 0,
  RIGHT: 2.5
};

// Environment zones with enum values
enum EnhancedEnvironmentZone {
  CORAL_REEF = 'CORAL_REEF',
  OPEN_OCEAN = 'OPEN_OCEAN',
  DEEP_SEA = 'DEEP_SEA',
  SHIPWRECK = 'SHIPWRECK',
  EAST_AUSTRALIAN_CURRENT = 'EAST_AUSTRALIAN_CURRENT'
}

// Zone transition distance thresholds
const ZONE_TRANSITIONS = {
  [EnhancedEnvironmentZone.CORAL_REEF]: 0,
  [EnhancedEnvironmentZone.OPEN_OCEAN]: 1000,
  [EnhancedEnvironmentZone.SHIPWRECK]: 2000,
  [EnhancedEnvironmentZone.EAST_AUSTRALIAN_CURRENT]: 3000,
  [EnhancedEnvironmentZone.DEEP_SEA]: 4000
};

// AmbientLife System
class AmbientLifeSystem {
  // Fish schools, bubbles, and other ambient elements
  private fishSchools: THREE.InstancedMesh[];
  private bubbleSystems: THREE.Points[];
  private ambientParticles: THREE.Points;
  private scene: THREE.Group;
  private currentZone: string;
  private time: number = 0;

  constructor(scene: THREE.Group) {
    this.scene = scene;
    this.fishSchools = [];
    this.bubbleSystems = [];
    this.currentZone = EnhancedEnvironmentZone.CORAL_REEF;
    this.ambientParticles = this.createAmbientParticles();
    
    this.scene.add(this.ambientParticles);
    this.createFishSchools();
    this.createBubbleSystems();
  }

  private createAmbientParticles(): THREE.Points {
    // Create particles for plankton, dust, etc.
    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Generate random particles in a large volume
    const color1 = new THREE.Color('#FFFFFF');
    const color2 = new THREE.Color('#A0D1FF');
    
    for (let i = 0; i < particleCount; i++) {
      // Position in a large box in front of the player
      positions[i * 3] = (Math.random() - 0.5) * 40; // X: across lanes
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // Y: vertical spread
      positions[i * 3 + 2] = -Math.random() * 100; // Z: depth of field
      
      // Random sizes for variety
      sizes[i] = 0.05 + Math.random() * 0.05;
      
      // Colors varying between white and light blue
      const mixFactor = Math.random();
      const particleColor = color1.clone().lerp(color2, mixFactor);
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create a particle material with custom texture
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // Attempt to create a soft particle look
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/textures/particle_soft.png', (texture) => {
      particleMaterial.map = texture;
      particleMaterial.needsUpdate = true;
    });
    
    return new THREE.Points(particleGeometry, particleMaterial);
  }
  
  private createFishSchools() {
    // Create several fish schools with instanced meshes
    // Small fish school
    const smallFishGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.5);
    const smallFishMaterial = new THREE.MeshStandardMaterial({ 
      color: '#80C2FF',
      emissive: '#203040',
      metalness: 0.3,
      roughness: 0.7
    });
    
    // Create instance attributes for transformation
    const smallFishCount = 150;
    const smallFishSchool = new THREE.InstancedMesh(
      smallFishGeometry,
      smallFishMaterial,
      smallFishCount
    );
    
    // Set initial positions for small fish
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < smallFishCount; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 15;
      const z = -Math.random() * 80 - 10;
      
      // Random scale for variety
      const scale = 0.8 + Math.random() * 0.4;
      
      // Random rotation for natural look
      const rotationY = Math.random() * Math.PI * 2;
      
      matrix.makeRotationY(rotationY);
      matrix.setPosition(x, y, z);
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      
      smallFishSchool.setMatrixAt(i, matrix);
    }
    
    smallFishSchool.instanceMatrix.needsUpdate = true;
    this.scene.add(smallFishSchool);
    this.fishSchools.push(smallFishSchool);
    
    // Medium fish school with different color
    const mediumFishGeometry = new THREE.BoxGeometry(0.3, 0.12, 0.7);
    const mediumFishMaterial = new THREE.MeshStandardMaterial({ 
      color: '#FFD880', 
      emissive: '#402010',
      metalness: 0.4,
      roughness: 0.6
    });
    
    const mediumFishCount = 80;
    const mediumFishSchool = new THREE.InstancedMesh(
      mediumFishGeometry,
      mediumFishMaterial,
      mediumFishCount
    );
    
    // Set initial positions for medium fish
    for (let i = 0; i < mediumFishCount; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 20 + 5; // Higher up
      const z = -Math.random() * 100 - 20;
      
      // Random scale for variety
      const scale = 0.9 + Math.random() * 0.3;
      
      // Random rotation for natural look
      const rotationY = Math.random() * Math.PI * 2;
      
      matrix.makeRotationY(rotationY);
      matrix.setPosition(x, y, z);
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      
      mediumFishSchool.setMatrixAt(i, matrix);
    }
    
    mediumFishSchool.instanceMatrix.needsUpdate = true;
    this.scene.add(mediumFishSchool);
    this.fishSchools.push(mediumFishSchool);
  }
  
  private createBubbleSystems() {
    // Create bubble columns from the ocean floor
    const bubbleGeometry = new THREE.BufferGeometry();
    const bubbleCount = 300;
    
    const positions = new Float32Array(bubbleCount * 3);
    const sizes = new Float32Array(bubbleCount);
    const bubbleSpeeds = new Float32Array(bubbleCount);
    
    // Create random bubble positions in columns
    for (let i = 0; i < bubbleCount; i++) {
      // Create clusters of bubbles at certain points
      const columnIndex = Math.floor(Math.random() * 8);
      const columnX = (columnIndex - 4) * 5 + (Math.random() - 0.5) * 3;
      
      positions[i * 3] = columnX;
      positions[i * 3 + 1] = -2 + Math.random() * 20; // Height varying up to 20 units from floor
      positions[i * 3 + 2] = -Math.random() * 100 - 10; // Along path
      
      // Random sizes
      sizes[i] = 0.1 + Math.random() * 0.3;
      
      // Random speeds
      bubbleSpeeds[i] = 0.5 + Math.random() * 1.5;
    }
    
    bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bubbleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Custom attribute for speed
    bubbleGeometry.setAttribute('speed', new THREE.BufferAttribute(bubbleSpeeds, 1));
    
    // Create bubble material
    const bubbleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // Load bubble texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/textures/bubble.png', (texture) => {
      bubbleMaterial.map = texture;
      bubbleMaterial.needsUpdate = true;
    });
    
    const bubbleSystem = new THREE.Points(bubbleGeometry, bubbleMaterial);
    this.scene.add(bubbleSystem);
    this.bubbleSystems.push(bubbleSystem);
  }
  
  update(delta: number, playerPosition: THREE.Vector3) {
    this.time += delta;
    
    // Update ambient particles
    if (this.ambientParticles && this.ambientParticles.geometry) {
      const positions = this.ambientParticles.geometry.attributes.position;
      
      // Slowly move particles and reset them when they move past the player
      for (let i = 0; i < positions.count; i++) {
        // Move forward at varying speeds
        positions.setZ(i, positions.getZ(i) + delta * 2);
        
        // Add gentle current effect
        positions.setX(i, positions.getX(i) + Math.sin(this.time * 0.5 + i * 0.1) * delta * 0.3);
        positions.setY(i, positions.getY(i) + Math.cos(this.time * 0.3 + i * 0.05) * delta * 0.2);
        
        // Reset particles that have passed the player
        if (positions.getZ(i) > 5) {
          positions.setX(i, (Math.random() - 0.5) * 40);
          positions.setY(i, (Math.random() - 0.5) * 20);
          positions.setZ(i, -Math.random() * 100 - 10);
        }
      }
      
      positions.needsUpdate = true;
    }
    
    // Update fish schools
    this.fishSchools.forEach((school, index) => {
      const count = school.count;
      const matrix = new THREE.Matrix4();
      
      for (let i = 0; i < count; i++) {
        school.getMatrixAt(i, matrix);
        
        // Extract position from matrix
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(matrix);
        
        // Extract rotation from matrix
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(matrix);
        rotation.setFromQuaternion(quaternion);
        
        // Extract scale from matrix
        const scale = new THREE.Vector3();
        scale.setFromMatrixScale(matrix);
        
        // Update fish positions - they swim in a school pattern
        // Add sinusoidal movement to create fish swimming pattern
        const swimSpeed = 3 + index * 0.5; // Different speeds for different schools
        position.z += delta * swimSpeed;
        
        // Create schooling behavior by calculating weighted center for small groups
        const schoolCenter = new THREE.Vector3(
          (Math.sin(this.time * 0.2 + index) * 10),
          (Math.cos(this.time * 0.3 + index) * 6) + Math.sin(this.time * 0.7) * 3,
          -50 + Math.sin(this.time * 0.1) * 20
        );
        
        // Move each fish based on distance from center
        const distanceToCenter = position.distanceTo(schoolCenter);
        const directionToCenter = new THREE.Vector3().subVectors(schoolCenter, position).normalize();
        
        // If far from center, move toward it, but maintain some randomness
        if (distanceToCenter > 15) {
          position.add(directionToCenter.multiplyScalar(delta * 5));
        } else {
          // Add some random movement when near the center
          position.x += (Math.sin(this.time + i * 0.5) * delta);
          position.y += (Math.cos(this.time + i * 0.7) * delta);
        }
        
        // Determine direction of movement
        const prevPosition = position.clone();
        const direction = new THREE.Vector3().subVectors(position, prevPosition).normalize();
        
        // Update rotation to face movement direction
        if (direction.length() > 0.01) {
          // Calculate target rotation based on movement
          const targetRotation = Math.atan2(direction.x, direction.z);
          // Smoothly interpolate current rotation
          rotation.y = targetRotation;
        }
        
        // Have fish swim in a slightly wavy pattern
        const wiggle = Math.sin(this.time * 10 + i) * 0.1;
        rotation.z = wiggle * 0.2;
        
        // Reset fish that have gone too far
        if (position.z > 10) {
          position.z = -Math.random() * 100 - 10;
          position.x = (Math.random() - 0.5) * 40;
          position.y = (Math.random() - 0.5) * 15;
        }
        
        // Create new matrix
        const newMatrix = new THREE.Matrix4();
        const quat = new THREE.Quaternion().setFromEuler(rotation);
        
        newMatrix.compose(position, quat, scale);
        school.setMatrixAt(i, newMatrix);
      }
      
      school.instanceMatrix.needsUpdate = true;
    });
    
    // Update bubble systems
    this.bubbleSystems.forEach(bubbleSystem => {
      const positions = bubbleSystem.geometry.attributes.position;
      const speeds = bubbleSystem.geometry.attributes.speed;
      
      for (let i = 0; i < positions.count; i++) {
        // Move bubbles upward at their individual speeds
        const speed = speeds.getX(i);
        positions.setY(i, positions.getY(i) + delta * speed);
        
        // Add gentle side-to-side motion
        positions.setX(i, positions.getX(i) + Math.sin(this.time * 2 + i) * delta * 0.1);
        
        // Reset bubbles that have gone too high
        if (positions.getY(i) > 20) {
          positions.setY(i, -2);
          // Reset to a random column
          const columnIndex = Math.floor(Math.random() * 8);
          const columnX = (columnIndex - 4) * 5 + (Math.random() - 0.5) * 3;
          positions.setX(i, columnX);
        }
      }
      
      positions.needsUpdate = true;
    });
    
    // Update zone-specific ambient life based on current zone
    switch (this.currentZone) {
      case EnhancedEnvironmentZone.CORAL_REEF:
        // More colorful particles, active fish
        this.updateCoralReefAmbience(delta);
        break;
      case EnhancedEnvironmentZone.OPEN_OCEAN:
        // Larger schools, more sparse distribution
        this.updateOpenOceanAmbience(delta);
        break;
      case EnhancedEnvironmentZone.DEEP_SEA:
        // Darker, bioluminescent effects
        this.updateDeepSeaAmbience(delta);
        break;
      case EnhancedEnvironmentZone.SHIPWRECK:
        // Dust particles, treasure effects
        this.updateShipwreckAmbience(delta);
        break;
      case EnhancedEnvironmentZone.EAST_AUSTRALIAN_CURRENT:
        // Fast-moving particles, current streams
        this.updateEACambience(delta);
        break;
    }
  }
  
  private updateCoralReefAmbience(delta: number) {
    // Brighter particles, more vibrant fish in coral reef
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.PointsMaterial) {
      this.ambientParticles.material.opacity = 0.7;
    }
    
    // More active fish schools
    this.fishSchools.forEach(school => {
      if (school.material instanceof THREE.MeshStandardMaterial) {
        school.material.emissiveIntensity = 0.3;
      }
    });
  }
  
  private updateOpenOceanAmbience(delta: number) {
    // More sparse particles in open ocean
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.PointsMaterial) {
      this.ambientParticles.material.opacity = 0.5;
    }
    
    // Fish schools more clustered
    this.fishSchools.forEach(school => {
      if (school.material instanceof THREE.MeshStandardMaterial) {
        school.material.emissiveIntensity = 0.2;
      }
    });
  }
  
  private updateDeepSeaAmbience(delta: number) {
    // Darker with bioluminescent particles
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.PointsMaterial) {
      this.ambientParticles.material.opacity = 0.4;
    }
    
    // Subtle glowing fish
    this.fishSchools.forEach(school => {
      if (school.material instanceof THREE.MeshStandardMaterial) {
        school.material.emissiveIntensity = 0.7;
      }
    });
  }
  
  private updateShipwreckAmbience(delta: number) {
    // Dust particles for shipwreck zone
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.PointsMaterial) {
      this.ambientParticles.material.opacity = 0.6;
      this.ambientParticles.material.size = 0.15;
    }
  }
  
  private updateEACambience(delta: number) {
    // Fast-moving particles for EAC
    if (this.ambientParticles && this.ambientParticles.material instanceof THREE.PointsMaterial) {
      this.ambientParticles.material.opacity = 0.8;
      this.ambientParticles.material.size = 0.2;
    }
  }
  
  setZone(zone: string) {
    this.currentZone = zone;
  }
}

// Enhanced underwater scene with more interactive elements
export default function UnderwaterScene() {
  const { state, speed, increaseDistance, distance } = useGame();
  const isPlaying = state === GameState.PLAYING;
  const { scene, camera } = useThree();
  
  // State for player position (to be passed from Player component)
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0));
  
  // Environment store hooks
  const updateEnvironmentDistance = useEnvironmentStore(state => state.updateDistance);
  const setTransitionProgress = useEnvironmentStore(state => state.setTransitionProgress);
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  const resetEnvironment = useEnvironmentStore(state => state.reset);
  const zoneParameters = useEnvironmentStore(state => state.getInterpolatedParameters());
  
  // References to environment zones
  const coralReefRef = useRef<EnvironmentZoneRef>(null);
  const openOceanRef = useRef<EnvironmentZoneRef>(null);
  const deepSeaRef = useRef<EnvironmentZoneRef>(null);
  
  // Ambient life system reference
  const ambientLifeRef = useRef<AmbientLifeSystem | null>(null);
  
  // Zone milestone celebration state
  const [showZoneMilestone, setShowZoneMilestone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  
  // Scene references
  const fogRef = useRef<THREE.Fog | null>(null);
  const sceneRef = useRef<THREE.Group>(null);
  
  // Transition timer
  const transitionTimerRef = useRef<number>(0);
  const transitionDuration = 3; // seconds for transition
  
  // Time of day cycle
  const timeOfDayRef = useRef(0); // 0-1 representing day cycle
  const dayDuration = 240; // seconds for a complete day cycle
  const dayTimeRef = useRef(0);
  
  // Weather effects state
  const [weatherIntensity, setWeatherIntensity] = useState(0); // 0-1 for weather intensity
  const weatherTimerRef = useRef(0);
  const weatherDuration = 120; // seconds for weather cycle
  
  // Initialize ambient life system
  useEffect(() => {
    if (sceneRef.current && !ambientLifeRef.current) {
      ambientLifeRef.current = new AmbientLifeSystem(sceneRef.current);
      ambientLifeRef.current.setZone(EnhancedEnvironmentZone.CORAL_REEF);
    }
    
    return () => {
      // Clean up resources
      ambientLifeRef.current = null;
    };
  }, []);
  
  // Reset environment when game state changes
  useEffect(() => {
    if (state === GameState.MENU || state === GameState.GAME_OVER) {
      resetEnvironment();
      transitionTimerRef.current = 0;
      dayTimeRef.current = 0;
      weatherTimerRef.current = 0;
      setWeatherIntensity(0);
    }
  }, [state, resetEnvironment]);
  
  // Update environment based on player distance
  useEffect(() => {
    if (isPlaying) {
      updateEnvironmentDistance(distance);
      
      // Check for zone milestone crossings
      const zoneKeys = Object.keys(ZONE_TRANSITIONS);
      for (let i = 1; i < zoneKeys.length; i++) {
        const zoneKey = zoneKeys[i];
        const threshold = ZONE_TRANSITIONS[zoneKey as keyof typeof ZONE_TRANSITIONS];
        
        // If we just crossed the threshold, show milestone celebration
        if (distance >= threshold && distance - speed * 0.1 < threshold) {
          setNewZoneName(zoneKey.replace(/_/g, ' '));
          setShowZoneMilestone(true);
          
          // Hide milestone after 3 seconds
          setTimeout(() => {
            setShowZoneMilestone(false);
          }, 3000);
          
          // Update ambient life system zone
          if (ambientLifeRef.current) {
            ambientLifeRef.current.setZone(zoneKey);
          }
        }
      }
    }
  }, [distance, isPlaying, updateEnvironmentDistance, speed]);
  
  // Lane visual guides with improved visuals
  const createLaneGuides = () => {
    return (
      <group>
        {/* Left lane marker */}
        <mesh position={[LANES.LEFT, -1.9, -40]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 100]} />
          <meshStandardMaterial 
            color="#75C2F6" 
            transparent={true} 
            opacity={0.3}
            emissive="#75C2F6"
            emissiveIntensity={0.5}
          />
        </mesh>
        
        {/* Center lane marker */}
        <mesh position={[LANES.CENTER, -1.9, -40]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 100]} />
          <meshStandardMaterial 
            color="#75C2F6" 
            transparent={true} 
            opacity={0.3}
            emissive="#75C2F6"
            emissiveIntensity={0.5}
          />
        </mesh>
        
        {/* Right lane marker */}
        <mesh position={[LANES.RIGHT, -1.9, -40]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 100]} />
          <meshStandardMaterial 
            color="#75C2F6" 
            transparent={true} 
            opacity={0.3}
            emissive="#75C2F6"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    );
  };
  
  // Weather effects system
  const createWeatherEffects = () => {
    if (weatherIntensity <= 0.1) return null;
    
    return (
      <group>
        {/* Current/water flow particles */}
        <points>
          <bufferGeometry>
            <float32BufferAttribute 
              attach="attributes-position" 
              count={1000} 
              array={new Float32Array(3000).map((_, i) => {
                if (i % 3 === 0) return (Math.random() - 0.5) * 50; // x
                if (i % 3 === 1) return (Math.random() - 0.5) * 30; // y
                return -Math.random() * 100; // z
              })} 
              itemSize={3} 
            />
          </bufferGeometry>
          <pointsMaterial 
            size={0.2} 
            color="#FFFFFF" 
            transparent
            opacity={0.3 * weatherIntensity}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    );
  };
  
  // Time of day system - affects lighting
  const updateTimeOfDay = (delta: number) => {
    // Update time cycle (day/night)
    dayTimeRef.current += delta;
    if (dayTimeRef.current > dayDuration) {
      dayTimeRef.current = 0;
    }
    
    // Calculate time of day (0-1)
    timeOfDayRef.current = (dayTimeRef.current / dayDuration) % 1;
    
    // Update lighting based on time of day
    const scene = sceneRef.current?.parent;
    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) {
          // Adjust light intensity based on time of day
          // Brightest at noon (0.5), darkest at midnight (0 or 1)
          const timeIntensity = 1 - Math.abs(timeOfDayRef.current - 0.5) * 1.2;
          const finalIntensity = Math.max(0.3, timeIntensity * zoneParameters.lightIntensity);
          object.intensity = finalIntensity;
          
          // Adjust light color based on time of day
          // Morning/evening has warmer light, noon has neutral light
          if (timeOfDayRef.current < 0.25 || timeOfDayRef.current > 0.75) {
            // Dawn/dusk - warmer light
            object.color.setHSL(0.05, 0.7, 0.5); // Orange-ish
          } else if (timeOfDayRef.current < 0.45 || timeOfDayRef.current > 0.55) {
            // Morning/afternoon - slightly warm light
            object.color.setHSL(0.1, 0.5, 0.6); // Yellow-ish
          } else {
            // Noon - neutral light
            object.color.setHSL(0.2, 0.2, 0.7); // White-ish
          }
        }
        
        if (object instanceof THREE.AmbientLight) {
          // Ambient light also changes but less dramatically
          const ambientIntensity = 0.3 + Math.sin(Math.PI * timeOfDayRef.current) * 0.3;
          object.intensity = ambientIntensity * zoneParameters.ambientIntensity;
        }
      });
    }
  };
  
  // Weather system - changes over time and affects visuals
  const updateWeather = (delta: number) => {
    // Update weather cycle
    weatherTimerRef.current += delta;
    if (weatherTimerRef.current > weatherDuration) {
      weatherTimerRef.current = 0;
      
      // Randomly determine if there will be weather
      if (Math.random() < 0.3) { // 30% chance of weather
        setWeatherIntensity(0.5 + Math.random() * 0.5); // 0.5-1.0 intensity
      } else {
        setWeatherIntensity(0); // Clear weather
      }
    }
    
    // Gradually adjust weather intensity for smooth transitions
    if (weatherIntensity > 0) {
      // Weather effects like strong currents or visibility changes
      const scene = sceneRef.current?.parent;
      if (scene && 'fog' in scene && scene.fog instanceof THREE.FogExp2) {
        // Reduce visibility during strong weather
        scene.fog.density = zoneParameters.fogDensity * (1 + weatherIntensity * 0.3);
      }
    }
  };
  
  // Handle zone transitions and environment updates
  useFrame((state, delta) => {
    if (!isPlaying) return;
    
    // Update distance based on speed
    increaseDistance(speed * delta * 10);
    
    // Update environment parameters based on current zone
    const scene = state.scene;
    
    // Apply zone parameters
    if (scene.fog) {
      scene.fog.color.set(zoneParameters.fogColor);
      (scene.fog as THREE.FogExp2).density = zoneParameters.fogDensity;
    }
    
    scene.background = new THREE.Color(zoneParameters.backgroundColor);
    
    // Find the directional light and update it
    scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) {
        object.color.set(zoneParameters.lightColor);
        object.intensity = zoneParameters.lightIntensity;
      }
      if (object instanceof THREE.AmbientLight) {
        object.color.set(zoneParameters.ambientColor);
        object.intensity = zoneParameters.ambientIntensity;
      }
    });
    
    // Handle zone transitions
    if (isTransitioning) {
      transitionTimerRef.current += delta;
      const progress = Math.min(1, transitionTimerRef.current / transitionDuration);
      setTransitionProgress(progress);
      
      // Reset transition timer when complete
      if (progress >= 1) {
        transitionTimerRef.current = 0;
      }
    }
    
    // Update time of day cycle
    updateTimeOfDay(delta);
    
    // Update weather effects
    updateWeather(delta);
    
    // Animate environment elements
    if (coralReefRef.current) {
      coralReefRef.current.update(delta);
    }
    
    if (openOceanRef.current) {
      openOceanRef.current.update(delta);
    }
    
    if (deepSeaRef.current) {
      deepSeaRef.current.update(delta);
    }
    
    // Update ambient life
    if (ambientLifeRef.current) {
      // Use an estimated player position
      const playerPos = new THREE.Vector3(camera.position.x, camera.position.y - 2, 0);
      ambientLifeRef.current.update(delta, playerPos);
    }
  });
  
  return (
    <AudioProvider>
      <group ref={sceneRef}>
        {/* Lane guides */}
        {createLaneGuides()}
        
        {/* Weather effects */}
        {createWeatherEffects()}
        
        {/* Audio Systems */}
        <AmbientAudioSystem />
        <EnvironmentAudioEffects />
        
        {/* Environment Zones */}
        <CoralReefZone 
          ref={coralReefRef} 
          active={currentZone === EnvironmentZone.CORAL_REEF || isTransitioning} 
        />
        
        <OpenOceanZone 
          ref={openOceanRef} 
          active={currentZone === EnvironmentZone.OPEN_OCEAN || isTransitioning} 
        />
        
        <DeepSeaZone 
          ref={deepSeaRef} 
          active={currentZone === EnvironmentZone.DEEP_SEA || isTransitioning} 
        />
        
        {/* Zone milestone notification - shown when entering a new zone */}
        {showZoneMilestone && (
          <group position={[0, 0, -10]} scale={[1, 1, 1]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[10, 2]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
            <sprite position={[0, 0, 0.1]} scale={[9, 1.8, 1]}>
              <spriteMaterial 
                map={new THREE.CanvasTexture((() => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 512;
                  canvas.height = 128;
                  const context = canvas.getContext('2d')!;
                  context.fillStyle = '#FFFFFF';
                  context.font = 'bold 48px Arial';
                  context.textAlign = 'center';
                  context.textBaseline = 'middle';
                  context.fillText(`ENTERING ${newZoneName}`, 256, 64);
                  return canvas;
                })())}
                transparent
                opacity={0.9}
              />
            </sprite>
          </group>
        )}
        
        {/* Ocean floor with enhanced detail */}
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200, 50, 50]} />
          <meshStandardMaterial 
            color={zoneParameters.fogColor || '#2D7A9C'} 
            roughness={0.8}
            metalness={0.1}
            displacementScale={0.5}
            displacementBias={-0.2}
          />
        </mesh>
      </group>
    </AudioProvider>
  );
}