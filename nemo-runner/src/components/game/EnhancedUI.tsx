'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/GameUI.module.css';
import gameStateManager from '@/game/core/GameStateManager';
import eventBus from '@/game/core/EventSystem';

/**
 * EnhancedUI - Visual enhancements layer for the game UI
 * 
 * This component adds purely visual elements that enhance the game experience:
 * - Environmental particle effects (bubbles, dust)
 * - Visual screen effects (vignette, flash)
 * - Transition effects for state changes
 * - Damage overlay when player is hit
 */
export default function EnhancedUI() {
  const [currentEffect, setCurrentEffect] = useState<string | null>(null);
  const [effectIntensity, setEffectIntensity] = useState(0);
  const [environmentType, setEnvironmentType] = useState('reef');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    // Handle environment change events
    const handleEnvironmentChange = (data: any) => {
      setIsTransitioning(true);
      setTimeout(() => {
        setEnvironmentType(data.to);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500);
      }, 500);
    };
    
    // Handle player hit event for damage overlay effect
    const handlePlayerHit = () => {
      setCurrentEffect('damage');
      setEffectIntensity(1.0);
      
      // Fade out the damage effect
      const fadeInterval = setInterval(() => {
        setEffectIntensity(prev => {
          const newValue = prev - 0.05;
          if (newValue <= 0) {
            clearInterval(fadeInterval);
            setCurrentEffect(null);
            return 0;
          }
          return newValue;
        });
      }, 50);
    };
    
    // Handle power-up activated events for specific visual effects
    const handlePowerupActivated = (data: { type: string }) => {
      if (data.type === 'powerup_shield') {
        setCurrentEffect('shield');
        setEffectIntensity(0.3);
      } else if (data.type === 'powerup_time') {
        setCurrentEffect('slowmo');
        setEffectIntensity(0.5);
      }
    };
    
    // Handle power-up deactivated to remove effects
    const handlePowerupDeactivated = (data: { type: string }) => {
      if (
        (data.type === 'powerup_shield' && currentEffect === 'shield') ||
        (data.type === 'powerup_time' && currentEffect === 'slowmo')
      ) {
        setCurrentEffect(null);
        setEffectIntensity(0);
      }
    };
    
    // Handle game state changes for transition effects
    const handleGameStateChange = (data: any) => {
      if (data.to === 'PLAYING' && data.from === 'PAUSED') {
        // Resume effect
        setCurrentEffect('resume');
        setEffectIntensity(0.8);
        
        setTimeout(() => {
          setCurrentEffect(null);
        }, 500);
      } else if (data.to === 'GAME_OVER') {
        // Game over effect
        setCurrentEffect('gameover');
        setEffectIntensity(1.0);
        
        setTimeout(() => {
          setEffectIntensity(0.5);
        }, 1000);
      }
    };
    
    // Subscribe to events
    eventBus.on('environment-change', handleEnvironmentChange);
    eventBus.on('player-hit', handlePlayerHit);
    eventBus.on('powerup-activated', handlePowerupActivated);
    eventBus.on('powerup-deactivated', handlePowerupDeactivated);
    eventBus.on('game-state-change', handleGameStateChange);
    
    // Set initial environment based on game state
    setEnvironmentType(gameStateManager.stateData.environment.current);
    
    // Cleanup
    return () => {
      eventBus.off('environment-change', handleEnvironmentChange);
      eventBus.off('player-hit', handlePlayerHit);
      eventBus.off('powerup-activated', handlePowerupActivated);
      eventBus.off('powerup-deactivated', handlePowerupDeactivated);
      eventBus.off('game-state-change', handleGameStateChange);
    };
  }, [currentEffect]);
  
  // Function to get appropriate class for current effect
  const getEffectClass = () => {
    if (!currentEffect) return '';
    
    switch (currentEffect) {
      case 'damage': return styles.damageEffect;
      case 'shield': return styles.shieldEffect;
      case 'slowmo': return styles.slowmoEffect;
      case 'resume': return styles.resumeEffect;
      case 'gameover': return styles.gameoverEffect;
      default: return '';
    }
  };
  
  // Function to get environment class
  const getEnvironmentClass = () => {
    switch (environmentType) {
      case 'reef': return styles.reefEnvironment;
      case 'openOcean': return styles.openOceanEnvironment;
      case 'deepSea': return styles.deepSeaEnvironment;
      case 'shipwreck': return styles.shipwreckEnvironment;
      case 'kelpForest': return styles.kelpForestEnvironment;
      default: return '';
    }
  };
  
  return (
    <>
      {/* Environmental tint based on current environment */}
      <div 
        className={`${styles.environmentTint} ${getEnvironmentClass()} ${isTransitioning ? styles.environmentTransition : ''}`}
      />
      
      {/* Screen effects for different game states and events */}
      {currentEffect && (
        <div 
          className={`${styles.screenEffect} ${getEffectClass()}`}
          style={{ opacity: effectIntensity }}
        />
      )}
      
      {/* Vignette effect for depth/immersion */}
      <div className={styles.vignette} />
      
      {/* Ambient bubbles that float up (purely decorative) */}
      <div className={styles.ambientBubbles}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i} 
            className={styles.ambientBubble}
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${5 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 15}s`,
              width: `${5 + Math.random() * 15}px`,
              height: `${5 + Math.random() * 15}px`,
              opacity: 0.1 + Math.random() * 0.3
            }}
          />
        ))}
      </div>
    </>
  );
}