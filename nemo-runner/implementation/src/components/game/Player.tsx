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

const Player = forwardRef<THREE.Group, {}>((props, ref) => {
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
  
  // Touch refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  
  // Setup key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          moveLaneLeft();
          break;
        case 'ArrowRight':
          moveLaneRight();
          break;
        case 'ArrowUp':
          jump();
          break;
        case 'ArrowDown':
          dive();
          break;
      }
    };
    
    // Handle touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isPlaying) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      
      // Determine if it's a horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 50) {
          moveLaneRight();
        } else if (deltaX < -50) {
          moveLaneLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 50) {
          dive();
        } else if (deltaY < -50) {
          jump();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPlaying, currentLane]);
  
  // Lane movement functions
  const moveLaneLeft = () => {
    if (currentLane === 'CENTER') {
      setCurrentLane('LEFT');
      setTargetX(LANES.LEFT);
    } else if (currentLane === 'RIGHT') {
      setCurrentLane('CENTER');
      setTargetX(LANES.CENTER);
    }
  };
  
  const moveLaneRight = () => {
    if (currentLane === 'CENTER') {
      setCurrentLane('RIGHT');
      setTargetX(LANES.RIGHT);
    } else if (currentLane === 'LEFT') {
      setCurrentLane('CENTER');
      setTargetX(LANES.CENTER);
    }
  };
  
  // Vertical movement functions
  const jump = () => {
    if (verticalStateRef.current === 'NORMAL') {
      setVerticalState('JUMPING');
      verticalStateRef.current = 'JUMPING';
      setVerticalProgress(0);
      verticalProgressRef.current = 0;
      setTargetY(JUMP_HEIGHT);
    }
  };
  
  const dive = () => {
    if (verticalStateRef.current === 'NORMAL') {
      setVerticalState('DIVING');
      verticalStateRef.current = 'DIVING';
      setVerticalProgress(0);
      verticalProgressRef.current = 0;
      setTargetY(DIVE_DEPTH);
    }
  };
  
  // Camera and viewport
  const { camera } = useThree();
  
  // Animation frame update
  useFrame((_, delta) => {
    if (!isPlaying || !playerGroup.current) return;
    
    // Lane movement animation (horizontal)
    const lerpFactor = Math.min(1, delta * 10); // Smooth transition speed
    currentXRef.current = THREE.MathUtils.lerp(
      currentXRef.current, 
      targetX, 
      lerpFactor
    );
    
    // Vertical movement (jump/dive)
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
          // Parabolic jump
          const jumpProgress = verticalProgressRef.current;
          // Use sin curve for smooth up and down
          currentYRef.current = Math.sin(jumpProgress * Math.PI) * JUMP_HEIGHT;
        } else if (verticalStateRef.current === 'DIVING') {
          // Quick dive down and slow return
          const diveProgress = verticalProgressRef.current;
          if (diveProgress < 0.3) {
            // Quick dive down (0-30% of animation)
            currentYRef.current = diveProgress / 0.3 * DIVE_DEPTH;
          } else {
            // Slow return (30-100% of animation)
            currentYRef.current = DIVE_DEPTH * (1 - (diveProgress - 0.3) / 0.7);
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
    
    // Add tilt based on lane change direction
    const xDiff = targetX - currentXRef.current;
    if (Math.abs(xDiff) > 0.1) {
      // Tilt in the direction of movement
      playerGroup.current.rotation.z = -xDiff * 0.2;
    } else {
      // Return to neutral rotation
      playerGroup.current.rotation.z = THREE.MathUtils.lerp(
        playerGroup.current.rotation.z,
        0,
        lerpFactor * 2
      );
    }
    
    // Animate tail and fins - faster during lane changes and jumps/dives
    const actionSpeed = Math.abs(xDiff) + 
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
    
    // Camera follows player smoothly
    camera.position.x = currentXRef.current * 0.5;
    camera.position.y = currentYRef.current * 0.5 + 2;
    camera.lookAt(new THREE.Vector3(currentXRef.current, currentYRef.current, -10));
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
      
      {/* Hitbox visualization (normally invisible) */}
      {/* <mesh position={[0, 0, 0]} visible={false}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color="#FF0000" wireframe={true} />
      </mesh> */}
    </group>
  );
});

Player.displayName = 'Player';

export default Player;