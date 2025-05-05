'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';

// Simple player model (clownfish-inspired)
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
  
  // Movement state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });
  
  // Camera and viewport
  const { camera, viewport } = useThree();
  
  // Setup key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setKeys(prev => ({ ...prev, [e.key]: true }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setKeys(prev => ({ ...prev, [e.key]: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Use refs for velocity and position to avoid React state in animation loop
  const velocityRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  
  // Initialize refs with state values
  useEffect(() => {
    positionRef.current = { ...position };
    velocityRef.current = { ...velocity };
  }, []);
  
  // Handle movement and animation
  useFrame((_, delta) => {
    if (!isPlaying || !playerGroup.current) return;
    
    // Calculate acceleration based on input
    const acceleration = { x: 0, y: 0 };
    const accelerationRate = 40; // Units per second
    
    if (keys.ArrowUp) acceleration.y += accelerationRate;
    if (keys.ArrowDown) acceleration.y -= accelerationRate;
    if (keys.ArrowLeft) acceleration.x -= accelerationRate;
    if (keys.ArrowRight) acceleration.x += accelerationRate;
    
    // Apply acceleration to velocity
    velocityRef.current.x += acceleration.x * delta;
    velocityRef.current.y += acceleration.y * delta;
    
    // Apply drag (water resistance)
    const drag = 0.92;
    velocityRef.current.x *= drag;
    velocityRef.current.y *= drag;
    
    // Apply velocity to position
    positionRef.current.x += velocityRef.current.x * delta;
    positionRef.current.y += velocityRef.current.y * delta;
    
    // Clamp position to keep fish on screen
    // Using viewport bounds with margin
    const margin = 1;
    const bounds = {
      xMin: -viewport.width / 2 + margin,
      xMax: viewport.width / 2 - margin,
      yMin: -viewport.height / 2 + margin,
      yMax: viewport.height / 2 - margin,
    };
    
    const clampedX = Math.max(bounds.xMin, Math.min(bounds.xMax, positionRef.current.x));
    const clampedY = Math.max(bounds.yMin, Math.min(bounds.yMax, positionRef.current.y));
    
    if (clampedX !== positionRef.current.x || clampedY !== positionRef.current.y) {
      positionRef.current.x = clampedX;
      positionRef.current.y = clampedY;
      velocityRef.current.x = 0;
      velocityRef.current.y = 0; // Stop at bounds
    }
    
    // Update React state occasionally for components that need it
    // This prevents the infinite loop by not updating state every frame
    if (Math.abs(position.x - positionRef.current.x) > 0.1 || 
        Math.abs(position.y - positionRef.current.y) > 0.1) {
      setPosition({
        x: positionRef.current.x,
        y: positionRef.current.y
      });
      setVelocity({
        x: velocityRef.current.x,
        y: velocityRef.current.y
      });
    }
    
    // Update player group position - use positionRef for animation, not React state
    playerGroup.current.position.x = positionRef.current.x;
    playerGroup.current.position.y = positionRef.current.y;
    
    // Rotate player based on movement direction
    if (Math.abs(velocityRef.current.x) > 0.01 || Math.abs(velocityRef.current.y) > 0.01) {
      const targetRotation = Math.atan2(velocityRef.current.x, velocityRef.current.y);
      playerGroup.current.rotation.z = -targetRotation * 0.5; // Less dramatic tilt
    } else {
      // Return to neutral position when still
      playerGroup.current.rotation.z *= 0.9;
    }
    
    // Animate tail and fins
    if (tailRef.current) {
      // Faster tail wag when moving faster
      const speed = Math.sqrt(velocityRef.current.x * velocityRef.current.x + velocityRef.current.y * velocityRef.current.y);
      const wagSpeed = 5 + speed * 2; // Base + velocity factor
      tailRef.current.rotation.y = Math.sin(Date.now() * 0.01 * wagSpeed) * 0.3;
    }
    
    if (finTopRef.current && finBottomRef.current) {
      const finWagSpeed = 3; // Slower than tail
      finTopRef.current.rotation.y = Math.sin(Date.now() * 0.01 * finWagSpeed) * 0.2;
      finBottomRef.current.rotation.y = Math.sin(Date.now() * 0.01 * finWagSpeed + 1) * 0.2;
    }
    
    // Update camera to follow player
    camera.position.x = positionRef.current.x * 0.5; // Partial follow
    camera.position.y = positionRef.current.y * 0.5 + 2; // Keep camera above player
    camera.lookAt(new THREE.Vector3(positionRef.current.x, positionRef.current.y, -10));
  });
  
  return (
    <group ref={playerGroup} position={[0, 0, 0]}>
      {/* Fish body (orange-white clownfish style) */}
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[0.5, 32, 16]} />
        <meshStandardMaterial color="#FF7E00" />
      </mesh>
      
      {/* White stripes (simplified) */}
      <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.35, 0.08, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.35, 0.08, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Tail */}
      <mesh ref={tailRef} position={[-0.6, 0, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.6, 16, 1]} />
        <meshStandardMaterial color="#FF7E00" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.3, 0.15, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[0.3, 0.15, 0.3]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      <mesh position={[0.3, -0.15, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[0.3, -0.15, 0.3]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Fins */}
      <mesh ref={finTopRef} position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 8]}>
        <coneGeometry args={[0.2, 0.4, 16, 1]} />
        <meshStandardMaterial color="#FF7E00" />
      </mesh>
      
      <mesh ref={finBottomRef} position={[0, -0.4, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <coneGeometry args={[0.2, 0.4, 16, 1]} />
        <meshStandardMaterial color="#FF7E00" />
      </mesh>
      
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