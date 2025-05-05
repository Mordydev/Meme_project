'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import * as THREE from 'three';
import { SplashEffect } from '@/lib/game-engine/EnvironmentParticles';

interface CollisionSystemProps {
  playerRef: React.RefObject<THREE.Group>;
  obstacleManagerRef: React.RefObject<any>; // This would ideally be typed more specifically
  collectiblesSystemRef?: React.RefObject<any>;
  powerUpSystemRef?: React.RefObject<any>;
  levelManagerRef?: React.RefObject<any>;
}

export default function CollisionSystem({
  playerRef,
  obstacleManagerRef,
  collectiblesSystemRef,
  powerUpSystemRef,
  levelManagerRef
}: CollisionSystemProps) {
  const { state, decreaseLives, addScore } = useGame();
  const isPlaying = state === GameState.PLAYING;
  
  // Player collision properties
  const playerHitboxRadius = 0.5; // Adjust based on player model size
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const invulnerabilityDuration = 1500; // ms
  const invulnerabilityRef = useRef(false);
  const lastCollisionTime = useRef(0);
  const playerFlashRef = useRef<THREE.Group | null>(null);
  
  // Visual feedback for collisions
  const flashRef = useRef<THREE.Mesh | null>(null);
  
  // Splash effect for surface collisions
  const [showSplash, setShowSplash] = useState(false);
  const splashPositionRef = useRef(new THREE.Vector3());
  
  // Update the invulnerability ref when the state changes
  useEffect(() => {
    invulnerabilityRef.current = isInvulnerable;
  }, [isInvulnerable]);
  
  // Create a flash effect mesh for collision feedback
  useEffect(() => {
    if (!playerRef.current) return;
    
    // Create a group for flash effect
    const flashGroup = new THREE.Group();
    flashGroup.visible = false;
    playerRef.current.add(flashGroup);
    playerFlashRef.current = flashGroup;
    
    // Create a mesh for the flash effect
    const geometry = new THREE.SphereGeometry(playerHitboxRadius * 1.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
    });
    const flash = new THREE.Mesh(geometry, material);
    flashGroup.add(flash);
    flashRef.current = flash;
    
    return () => {
      if (playerRef.current && playerFlashRef.current) {
        playerRef.current.remove(playerFlashRef.current);
      }
    };
  }, [playerRef, playerHitboxRadius]);
  
  // Handle collision with obstacles
  const handleObstacleCollision = (obstacle: any) => {
    if (invulnerabilityRef.current) return;
    
    // Flash effect
    if (playerFlashRef.current) {
      playerFlashRef.current.visible = true;
      setTimeout(() => {
        if (playerFlashRef.current) {
          playerFlashRef.current.visible = false;
        }
      }, 300);
    }
    
    // Apply damage
    decreaseLives();
    
    // Set invulnerability
    setIsInvulnerable(true);
    lastCollisionTime.current = Date.now();
    
    // Reset invulnerability after duration
    setTimeout(() => {
      setIsInvulnerable(false);
    }, invulnerabilityDuration);
  };
  
  // Handle collision with collectibles
  const handleCollectibleCollision = (collectible: any) => {
    // Flash effect - different color for collectibles
    if (flashRef.current) {
      const material = flashRef.current.material as THREE.MeshBasicMaterial;
      const originalColor = material.color.clone();
      material.color.set(0x00ff00);
      playerFlashRef.current!.visible = true;
      
      setTimeout(() => {
        if (flashRef.current) {
          const material = flashRef.current.material as THREE.MeshBasicMaterial;
          material.color.copy(originalColor);
          playerFlashRef.current!.visible = false;
        }
      }, 150);
    }
    
    // Add score
    addScore(collectible.value);
    
    // Mark as collected (actual removal handled by CollectiblesSystem)
    collectible.collected = true;
  };
  
  // Handle collision with power-ups
  const handlePowerUpCollision = (powerUp: any) => {
    // Flash effect - different color for power-ups
    if (flashRef.current) {
      const material = flashRef.current.material as THREE.MeshBasicMaterial;
      const originalColor = material.color.clone();
      material.color.set(0x00ffff);
      playerFlashRef.current!.visible = true;
      
      setTimeout(() => {
        if (flashRef.current) {
          const material = flashRef.current.material as THREE.MeshBasicMaterial;
          material.color.copy(originalColor);
          playerFlashRef.current!.visible = false;
        }
      }, 150);
    }
    
    // Mark as collected (actual activation handled by PowerUpSystem)
    powerUp.collected = true;
  };
  
  // Check for player hitting surface
  const checkSurfaceCollision = (playerPosition: THREE.Vector3) => {
    // Simple surface check at y=8
    const surfaceY = 8; 
    const margin = 0.3;
    
    if (playerPosition.y > surfaceY - margin) {
      // Only show splash if not already visible
      if (!showSplash) {
        // Clone position at water level
        splashPositionRef.current.copy(playerPosition);
        splashPositionRef.current.y = surfaceY;
        
        setShowSplash(true);
      }
    }
  };
  
  // Handle splash effect completion
  const handleSplashComplete = () => {
    setShowSplash(false);
  };
  
  // Update function for collision detection
  useFrame(() => {
    if (!isPlaying || !playerRef.current) return;
    
    // Get player position for collision detection
    const playerPosition = new THREE.Vector3();
    playerRef.current.getWorldPosition(playerPosition);
    
    // Check for obstacle collisions using obstacle manager
    if (obstacleManagerRef.current) {
      const collidedObstacle = obstacleManagerRef.current.checkCollisions(
        playerPosition,
        playerHitboxRadius
      );
      
      if (collidedObstacle && !invulnerabilityRef.current) {
        handleObstacleCollision(collidedObstacle);
      }
    }
    
    // Check for collectible collisions from level manager
    if (levelManagerRef?.current) {
      const collidedCollectible = levelManagerRef.current.checkCollectibleCollisions(
        playerPosition,
        playerHitboxRadius / 2 // Smaller hitbox for collectibles for better precision
      );
      
      if (collidedCollectible) {
        handleCollectibleCollision(collidedCollectible);
      }
      
      // Check for power-up collisions from level manager
      const collidedPowerUp = levelManagerRef.current.checkPowerUpCollisions(
        playerPosition,
        playerHitboxRadius / 2 // Smaller hitbox for power-ups for better precision
      );
      
      if (collidedPowerUp) {
        handlePowerUpCollision(collidedPowerUp);
        
        // Activate power-up via the power-up system
        if (powerUpSystemRef?.current?.activatePowerUp) {
          powerUpSystemRef.current.activatePowerUp(collidedPowerUp.type);
        }
      }
    }
    
    // Legacy collectible and power-up systems support (if level manager not used)
    if (!levelManagerRef?.current) {
      // Check for collectible collisions if system ref is provided
      if (collectiblesSystemRef?.current) {
        collectiblesSystemRef.current.checkCollisions(
          playerPosition,
          playerHitboxRadius / 2, // Smaller hitbox for collectibles for better precision
          (collectible: any) => handleCollectibleCollision(collectible)
        );
      }
      
      // Check for power-up collisions if system ref is provided
      if (powerUpSystemRef?.current) {
        powerUpSystemRef.current.checkCollisions(
          playerPosition,
          playerHitboxRadius / 2, // Smaller hitbox for power-ups for better precision
          (powerUp: any) => handlePowerUpCollision(powerUp)
        );
      }
    }
    
    // Check for surface collision (water splash)
    checkSurfaceCollision(playerPosition);
    
    // Update invulnerability visual effects
    if (invulnerabilityRef.current && playerRef.current) {
      const timeSinceCollision = Date.now() - lastCollisionTime.current;
      const blinkPeriod = 200; // ms
      const shouldShowPlayer = Math.floor(timeSinceCollision / blinkPeriod) % 2 === 0;
      
      // Make player blink during invulnerability
      if (playerRef.current.visible !== shouldShowPlayer) {
        playerRef.current.visible = shouldShowPlayer;
      }
      
      // If invulnerability is about to end, ensure player is visible
      if (timeSinceCollision > invulnerabilityDuration - 200 && !playerRef.current.visible) {
        playerRef.current.visible = true;
      }
    }
  });
  
  // Reset when game state changes
  useEffect(() => {
    if (state === GameState.MENU) {
      setIsInvulnerable(false);
      if (playerRef.current) {
        playerRef.current.visible = true;
      }
      if (playerFlashRef.current) {
        playerFlashRef.current.visible = false;
      }
    }
  }, [state, playerRef]);
  
  return (
    <>
      {/* Render splash effect when needed */}
      {showSplash && (
        <SplashEffect 
          position={splashPositionRef.current} 
          onComplete={handleSplashComplete} 
        />
      )}
    </>
  );
}