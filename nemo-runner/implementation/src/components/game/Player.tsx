'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';
import ClownFish from './models/ClownFish';

// Lane configuration
const LANES = {
  LEFT: -2.5,
  CENTER: 0,
  RIGHT: 2.5
};

// Jump/dive configuration
const JUMP_HEIGHT = 3;
const DIVE_DEPTH = -1.5;
const BASE_HEIGHT = 0;
const VERTICAL_DURATION = 0.5; // seconds

// Movement physics parameters
const LANE_CHANGE_SMOOTHING = 0.15; // Lower = more responsive, higher = more inertia
const REACTION_TIME = 0.08; // Slight delay for natural feeling
const COYOTE_TIME = 0.1; // Forgiveness window for actions

// Particle system for bubble trail
class BubbleTrailSystem {
  particles: THREE.Vector3[];
  sizes: number[];
  lifetimes: number[];
  maxParticles: number;
  emissionRate: number;
  lastEmitTime: number;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  points: THREE.Points;

  constructor(maxParticles: number = 100) {
    this.particles = [];
    this.sizes = [];
    this.lifetimes = [];
    this.maxParticles = maxParticles;
    this.emissionRate = 5; // particles per frame
    this.lastEmitTime = 0;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));

    // Load bubble texture
    const textureLoader = new THREE.TextureLoader();
    const bubbleTexture = textureLoader.load('/textures/bubble.png'); 

    this.material = new THREE.PointsMaterial({
      size: 0.5,
      map: bubbleTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  emit(position: THREE.Vector3, velocity: number, direction: THREE.Vector3) {
    // Limit emission rate
    if (performance.now() - this.lastEmitTime < 16 / this.emissionRate) return;
    this.lastEmitTime = performance.now();

    // Calculate bubble position with slight randomness
    const particlePos = position.clone().add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      )
    );

    // Add velocity-based offset
    particlePos.add(direction.clone().multiplyScalar(-0.3));

    // Size based on velocity
    const size = 0.1 + Math.random() * 0.2 + velocity * 0.1;
    
    // Add new particle
    this.particles.push(particlePos);
    this.sizes.push(size);
    this.lifetimes.push(1.0); // Full lifetime

    // Limit max particles
    if (this.particles.length > this.maxParticles) {
      this.particles.shift();
      this.sizes.shift();
      this.lifetimes.shift();
    }

    this.updateGeometry();
  }

  update(delta: number) {
    // Update particle lifetimes and positions
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.lifetimes[i] -= delta * 0.8;
      
      // Move particles slightly upward and random horizontal
      this.particles[i].y += delta * 0.5;
      this.particles[i].x += (Math.random() - 0.5) * delta * 0.2;
      
      // Remove dead particles
      if (this.lifetimes[i] <= 0) {
        this.particles.splice(i, 1);
        this.sizes.splice(i, 1);
        this.lifetimes.splice(i, 1);
      }
    }

    this.updateGeometry();
  }

  updateGeometry() {
    const positions: number[] = [];
    const sizes: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      positions.push(p.x, p.y, p.z);
      
      // Size fades with lifetime
      sizes.push(this.sizes[i] * this.lifetimes[i]);
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  get mesh() {
    return this.points;
  }
}

export interface PlayerState {
  hasShield: boolean;
  isInvincible: boolean;
  activePowerUps: string[];
}

interface PlayerProps {
  onCollision?: () => void;
}

const Player = forwardRef<THREE.Group, PlayerProps>((props, ref) => {
  const { state, speed } = useGame();
  const isPlaying = state === GameState.PLAYING;
  
  // Player refs
  const playerGroup = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const finTopRef = useRef<THREE.Mesh>(null);
  const finBottomRef = useRef<THREE.Mesh>(null);
  
  // Expose the player group ref to parent components
  useImperativeHandle(ref, () => playerGroup.current!);
  
  // Lane state
  const [currentLane, setCurrentLane] = useState('CENTER');
  const [targetX, setTargetX] = useState(LANES.CENTER);
  const [currentX, setCurrentX] = useState(LANES.CENTER);
  
  // Vertical movement state
  const [verticalState, setVerticalState] = useState('NORMAL'); // NORMAL, JUMPING, DIVING
  const [verticalProgress, setVerticalProgress] = useState(0);
  const [targetY, setTargetY] = useState(BASE_HEIGHT);
  const [currentY, setCurrentY] = useState(BASE_HEIGHT);
  
  // Internal refs for animation
  const currentXRef = useRef(LANES.CENTER);
  const currentYRef = useRef(BASE_HEIGHT);
  const verticalProgressRef = useRef(0);
  const verticalStateRef = useRef('NORMAL');
  const lastInputTimeRef = useRef(0);
  const inputBufferRef = useRef<{action: string, time: number} | null>(null);
  
  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    hasShield: false,
    isInvincible: false,
    activePowerUps: []
  });
  
  // Visual effect states
  const [showNearMissEffect, setShowNearMissEffect] = useState(false);
  const bubbleTrailRef = useRef<BubbleTrailSystem | null>(null);
  const { scene } = useThree();
  
  // Initialize bubble trail system
  useEffect(() => {
    // Create bubble trail system
    bubbleTrailRef.current = new BubbleTrailSystem(100);
    
    if (playerGroup.current && bubbleTrailRef.current) {
      playerGroup.current.add(bubbleTrailRef.current.mesh);
    }
    
    return () => {
      // Clean up bubble trail system
      if (playerGroup.current && bubbleTrailRef.current) {
        playerGroup.current.remove(bubbleTrailRef.current.mesh);
      }
    };
  }, []);
  
  // Touch refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  
  // Process input buffer for more responsive controls
  const processInputBuffer = () => {
    if (!inputBufferRef.current) return;
    
    // If we're within the reaction time window, process the input
    if (performance.now() - inputBufferRef.current.time < REACTION_TIME * 1000) {
      const action = inputBufferRef.current.action;
      
      switch (action) {
        case 'LEFT':
          moveLaneLeft();
          break;
        case 'RIGHT':
          moveLaneRight();
          break;
        case 'JUMP':
          jump();
          break;
        case 'DIVE':
          dive();
          break;
      }
      
      // Clear the buffer
      inputBufferRef.current = null;
    }
  };
  
  // Setup key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      lastInputTimeRef.current = performance.now();
      
      switch (e.key) {
        case 'ArrowLeft':
          inputBufferRef.current = { action: 'LEFT', time: performance.now() };
          break;
        case 'ArrowRight':
          inputBufferRef.current = { action: 'RIGHT', time: performance.now() };
          break;
        case 'ArrowUp':
          inputBufferRef.current = { action: 'JUMP', time: performance.now() };
          break;
        case 'ArrowDown':
          inputBufferRef.current = { action: 'DIVE', time: performance.now() };
          break;
        case ' ':
          activatePowerUp();
          break;
      }
    };
    
    // Handle touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      lastInputTimeRef.current = performance.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPlaying) return;
      
      // Prevent default to avoid scrolling while playing
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isPlaying) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      
      // More sensitive touch controls with adaptive threshold
      const threshold = Math.min(window.innerWidth * 0.05, 30); // 5% of screen width up to 30px
      
      // Check if it's a tap (minimal movement)
      const isTap = Math.abs(deltaX) < threshold / 2 && Math.abs(deltaY) < threshold / 2;
      
      if (isTap) {
        // Handle tap as power-up activation
        activatePowerUp();
        return;
      }
      
      // Determine if it's a horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold) {
          inputBufferRef.current = { action: 'RIGHT', time: performance.now() };
        } else if (deltaX < -threshold) {
          inputBufferRef.current = { action: 'LEFT', time: performance.now() };
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold) {
          inputBufferRef.current = { action: 'DIVE', time: performance.now() };
        } else if (deltaY < -threshold) {
          inputBufferRef.current = { action: 'JUMP', time: performance.now() };
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPlaying]);
  
  // Lane movement functions with improved physics
  const moveLaneLeft = () => {
    // Already at left lane, can't move further
    if (currentLane === 'LEFT') return;
    
    // Moving from center to left
    if (currentLane === 'CENTER') {
      setCurrentLane('LEFT');
      setTargetX(LANES.LEFT);
    } 
    // Moving from right to center
    else if (currentLane === 'RIGHT') {
      setCurrentLane('CENTER');
      setTargetX(LANES.CENTER);
    }
    
    // Play movement sound
    // playSwishSound();
  };
  
  const moveLaneRight = () => {
    // Already at right lane, can't move further
    if (currentLane === 'RIGHT') return;
    
    // Moving from center to right
    if (currentLane === 'CENTER') {
      setCurrentLane('RIGHT');
      setTargetX(LANES.RIGHT);
    } 
    // Moving from left to center
    else if (currentLane === 'LEFT') {
      setCurrentLane('CENTER');
      setTargetX(LANES.CENTER);
    }
    
    // Play movement sound
    // playSwishSound();
  };
  
  // Vertical movement functions with improved physics
  const jump = () => {
    // Check if already jumping or within coyote time of a previous action
    if (verticalStateRef.current === 'NORMAL' || 
        (verticalStateRef.current === 'DIVING' && verticalProgressRef.current < COYOTE_TIME)) {
      
      setVerticalState('JUMPING');
      verticalStateRef.current = 'JUMPING';
      setVerticalProgress(0);
      verticalProgressRef.current = 0;
      setTargetY(JUMP_HEIGHT);
      
      // Play jump sound
      // playJumpSound();
    }
  };
  
  const dive = () => {
    // Check if already diving or within coyote time of a previous action
    if (verticalStateRef.current === 'NORMAL' || 
        (verticalStateRef.current === 'JUMPING' && verticalProgressRef.current < COYOTE_TIME)) {
      
      setVerticalState('DIVING');
      verticalStateRef.current = 'DIVING';
      setVerticalProgress(0);
      verticalProgressRef.current = 0;
      setTargetY(DIVE_DEPTH);
      
      // Play dive sound
      // playDiveSound();
    }
  };
  
  // Power-up activation function
  const activatePowerUp = () => {
    // Check if we have any power-ups
    if (playerState.activePowerUps.length > 0) {
      // Implement power-up logic here
      console.log('Activating power-up:', playerState.activePowerUps[0]);
      
      // Remove the used power-up
      setPlayerState(prev => ({
        ...prev,
        activePowerUps: prev.activePowerUps.slice(1)
      }));
      
      // Play power-up sound
      // playPowerUpSound();
    }
  };
  
  // Add a shield power-up (demonstration)
  const addShield = () => {
    setPlayerState(prev => ({
      ...prev,
      hasShield: true
    }));
  };
  
  // Make player temporarily invincible (demonstration)
  const makeInvincible = (duration: number = 3) => {
    setPlayerState(prev => ({
      ...prev,
      isInvincible: true
    }));
    
    // Reset after duration
    setTimeout(() => {
      setPlayerState(prev => ({
        ...prev,
        isInvincible: false
      }));
    }, duration * 1000);
  };
  
  // Trigger near-miss effect (demonstration)
  const triggerNearMissEffect = () => {
    setShowNearMissEffect(true);
    setTimeout(() => setShowNearMissEffect(false), 500);
  };
  
  // Camera and viewport
  const { camera } = useThree();
  
  // Animation frame update
  useFrame((_, delta) => {
    if (!isPlaying || !playerGroup.current) return;
    
    // Process input buffer for more responsive controls
    processInputBuffer();
    
    // Calculate current velocity for effects
    const prevX = currentXRef.current;
    const prevY = currentYRef.current;
    
    // Lane movement animation (horizontal) with improved physics
    const lerpSpeed = 1 - Math.pow(1 - LANE_CHANGE_SMOOTHING, delta * 60);
    currentXRef.current = THREE.MathUtils.lerp(
      currentXRef.current, 
      targetX, 
      lerpSpeed
    );
    
    // Calculate actual velocity for effects
    const velocityX = (currentXRef.current - prevX) / delta;
    const velocityY = (currentYRef.current - prevY) / delta;
    const totalVelocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    
    // Vertical movement (jump/dive) with improved physics
    if (verticalStateRef.current !== 'NORMAL') {
      // Update progress
      verticalProgressRef.current += delta / VERTICAL_DURATION;
      
      if (verticalProgressRef.current >= 1) {
        // Complete the jump/dive
        verticalStateRef.current = 'NORMAL';
        setVerticalState('NORMAL');
        verticalProgressRef.current = 0;
        setVerticalProgress(0);
        currentYRef.current = BASE_HEIGHT;
        setTargetY(BASE_HEIGHT);
      } else {
        // Animation progress
        if (verticalStateRef.current === 'JUMPING') {
          // Improved parabolic jump with natural easing
          const jumpProgress = verticalProgressRef.current;
          // Use sin curve for smooth up and down with slight asymmetry
          currentYRef.current = Math.sin(jumpProgress * Math.PI) * JUMP_HEIGHT * 
                               (1 - Math.pow(jumpProgress - 0.5, 2) * 0.2); // Extra height at peak
        } else if (verticalStateRef.current === 'DIVING') {
          // Improved dive with better physics
          const diveProgress = verticalProgressRef.current;
          if (diveProgress < 0.3) {
            // Quick dive down (0-30% of animation) with acceleration
            const eased = diveProgress / 0.3;
            currentYRef.current = DIVE_DEPTH * eased * eased; // Quadratic ease-in
          } else {
            // Slow return (30-100% of animation) with deceleration
            const eased = (diveProgress - 0.3) / 0.7;
            currentYRef.current = DIVE_DEPTH * (1 - eased * eased); // Quadratic ease-out
          }
        }
      }
      
      // Update React state occasionally for components that need it
      if (Math.abs(verticalProgress - verticalProgressRef.current) > 0.1) {
        setVerticalProgress(verticalProgressRef.current);
      }
    }
    
    // Update position
    playerGroup.current.position.x = currentXRef.current;
    playerGroup.current.position.y = currentYRef.current;
    
    // Update React state occasionally for components that need it
    if (Math.abs(currentX - currentXRef.current) > 0.1) {
      setCurrentX(currentXRef.current);
    }
    
    if (Math.abs(currentY - currentYRef.current) > 0.1) {
      setCurrentY(currentYRef.current);
    }
    
    // Add tilt based on lane change direction with improved physics
    const xDiff = targetX - currentXRef.current;
    if (Math.abs(xDiff) > 0.05) {
      // Calculate tilt angle based on velocity and direction
      const tiltAngle = -xDiff * 0.2 - velocityX * 0.01;
      
      // Apply tilt with natural easing
      playerGroup.current.rotation.z = THREE.MathUtils.lerp(
        playerGroup.current.rotation.z,
        tiltAngle,
        lerpSpeed * 1.5
      );
      
      // Add slight yaw/rotation based on direction
      playerGroup.current.rotation.y = THREE.MathUtils.lerp(
        playerGroup.current.rotation.y,
        xDiff * 0.1,
        lerpSpeed
      );
    } else {
      // Return to neutral rotation with natural easing
      playerGroup.current.rotation.z = THREE.MathUtils.lerp(
        playerGroup.current.rotation.z,
        0,
        lerpSpeed * 1.2
      );
      
      playerGroup.current.rotation.y = THREE.MathUtils.lerp(
        playerGroup.current.rotation.y,
        0,
        lerpSpeed
      );
    }
    
    // Animate tail and fins - faster during lane changes and jumps/dives
    const actionSpeed = Math.abs(velocityX) * 0.1 + 
                       Math.abs(velocityY) * 0.1 + 
                       (verticalStateRef.current !== 'NORMAL' ? 2 : 0);
    
    if (tailRef.current) {
      const wagSpeed = 5 + actionSpeed * 3;
      tailRef.current.rotation.y = Math.sin(Date.now() * 0.01 * wagSpeed) * 0.3;
    }
    
    if (finTopRef.current && finBottomRef.current) {
      const finWagSpeed = 3 + actionSpeed * 2;
      finTopRef.current.rotation.y = Math.sin(Date.now() * 0.01 * finWagSpeed) * 0.2;
      finBottomRef.current.rotation.y = Math.sin(Date.now() * 0.01 * finWagSpeed + 1) * 0.2;
    }
    
    // Update bubble trail effect
    if (bubbleTrailRef.current) {
      // Update existing particles
      bubbleTrailRef.current.update(delta);
      
      // Emit new particles based on velocity
      if (totalVelocity > 5 || verticalStateRef.current !== 'NORMAL') {
        const emissionCount = Math.ceil(totalVelocity * 0.2) + 
                             (verticalStateRef.current !== 'NORMAL' ? 2 : 0);
        
        // Get player position and create a direction vector
        const playerPos = new THREE.Vector3(
          playerGroup.current.position.x,
          playerGroup.current.position.y,
          playerGroup.current.position.z
        );
        
        // Create direction vector based on movement
        const direction = new THREE.Vector3(velocityX, velocityY, 0).normalize();
        
        // Emit particles
        for (let i = 0; i < emissionCount; i++) {
          bubbleTrailRef.current.emit(playerPos, totalVelocity, direction);
        }
      }
    }
    
    // Camera follows player with improved dynamics
    // Calculate camera target position based on player position and movement
    const camTargetX = currentXRef.current * 0.7; // Reduced influence for smoother follow
    const camTargetY = currentYRef.current * 0.5 + 2;
    
    // Apply inertia to camera movement
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, delta * 3);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, delta * 3);
    
    // Add subtle camera rotation based on player movement
    const camRotX = velocityY * -0.01;
    const camRotY = velocityX * -0.01;
    
    // Look slightly ahead of player based on velocity
    camera.lookAt(new THREE.Vector3(
      currentXRef.current + velocityX * 0.1,
      currentYRef.current + velocityY * 0.1,
      -10
    ));
  });
  
  // Determine current action state based on player movement
  const getActionState = () => {
    const xDiff = targetX - currentXRef.current;
    
    if (verticalStateRef.current === 'JUMPING') {
      return 'jumping';
    } else if (verticalStateRef.current === 'DIVING') {
      return 'diving';
    } else if (Math.abs(xDiff) > 0.1) {
      return 'turning';
    } else {
      // Default swimming state
      return 'idle';
    }
  };

  // Calculate action speed based on movement
  const getActionSpeed = () => {
    const xDiff = targetX - currentXRef.current;
    const baseSpeed = 1;
    const movementFactor = Math.abs(xDiff) * 2;
    const verticalFactor = verticalStateRef.current !== 'NORMAL' ? 1.5 : 1;
    
    return baseSpeed + movementFactor + (verticalFactor - 1);
  };

  return (
    <group ref={playerGroup} position={[0, 0, 0]}>
      {/* Import the enhanced ClownFish model */}
      <ClownFish 
        actionState={getActionState()}
        actionSpeed={getActionSpeed()}
      />
      
      {/* Shield effect when active */}
      {playerState.hasShield && (
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshPhysicalMaterial 
            color="#75C2F6"
            transparent={true}
            opacity={0.3}
            roughness={0.2}
            metalness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.2}
            envMapIntensity={1.5}
          />
        </mesh>
      )}
      
      {/* Invincibility effect */}
      {playerState.isInvincible && (
        <mesh>
          <sphereGeometry args={[1.0, 16, 16]} />
          <meshBasicMaterial 
            color="#FFFFFF"
            transparent={true}
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          >
            <color attach="color" args={["#FFFFFF"]} />
          </meshBasicMaterial>
        </mesh>
      )}
      
      {/* Near miss effect */}
      {showNearMissEffect && (
        <mesh>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial 
            color="#FF5A5F"
            transparent={true}
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Hitbox visualization (normally invisible) */}
      {/* <mesh position={[0, 0, 0]} visible={false}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#FF0000" wireframe={true} opacity={0.5} transparent={true} />
      </mesh> */}
    </group>
  );
});

Player.displayName = 'Player';

export default Player;