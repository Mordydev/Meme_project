'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/GameElements.module.css';
import gameStateManager from '@/game/core/GameStateManager';
import eventBus from '@/game/core/EventSystem';

interface HealthDisplayProps {
  initialLives?: number;
}

/**
 * HealthDisplay component renders the player's lives/shields
 * 
 * Features:
 * - Visual representation of remaining lives
 * - Animation when lives are gained or lost
 * - Shield effect when player has shield powerup
 */
export default function HealthDisplay({ initialLives = 3 }: HealthDisplayProps) {
  const [lives, setLives] = useState(initialLives);
  const [hasShield, setHasShield] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'gain' | 'loss' | null>(null);

  useEffect(() => {
    // Get initial lives from game state
    setLives(gameStateManager.stateData.lives);

    // Listen for life changes
    const handleLifeLost = (newLives: number) => {
      // Only animate if we're actually losing a life
      if (newLives < lives) {
        setAnimationType('loss');
        setIsAnimating(true);
        
        // Reset animation after it completes
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationType(null);
        }, 600);
      }
      
      setLives(newLives);
    };

    // Listen for shield activation/deactivation
    const handlePowerupActivated = (data: { type: string }) => {
      if (data.type === 'powerup_shield') {
        setHasShield(true);
      }
    };

    const handlePowerupDeactivated = (data: { type: string }) => {
      if (data.type === 'powerup_shield') {
        setHasShield(false);
      }
    };

    // Shield hit effect
    const handleShieldHit = () => {
      // Flash the shield
      setIsAnimating(true);
      setAnimationType('loss');
      
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
        setHasShield(false);
      }, 600);
    };

    // Extra life gained
    const handleExtraLife = () => {
      setAnimationType('gain');
      setIsAnimating(true);
      setLives(prev => prev + 1);
      
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
      }, 600);
    };

    // Subscribe to events
    eventBus.on('life-lost', handleLifeLost);
    eventBus.on('powerup-activated', handlePowerupActivated);
    eventBus.on('powerup-deactivated', handlePowerupDeactivated);
    eventBus.on('shield-hit', handleShieldHit);
    eventBus.on('extra-life', handleExtraLife);

    // Cleanup
    return () => {
      eventBus.off('life-lost', handleLifeLost);
      eventBus.off('powerup-activated', handlePowerupActivated);
      eventBus.off('powerup-deactivated', handlePowerupDeactivated);
      eventBus.off('shield-hit', handleShieldHit);
      eventBus.off('extra-life', handleExtraLife);
    };
  }, [lives]);

  // Only show during gameplay
  if (gameStateManager.state !== 'PLAYING') {
    return null;
  }

  return (
    <div className={`${styles.healthDisplay} ${isAnimating ? styles[`health${animationType}`] : ''}`}>
      {Array.from({ length: lives }).map((_, index) => (
        <div 
          key={index} 
          className={`${styles.healthBubble} ${hasShield && index === lives - 1 ? styles.shieldBubble : ''}`}
        />
      ))}
    </div>
  );
}