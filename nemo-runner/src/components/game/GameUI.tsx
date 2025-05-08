'use client';

import { useState, useEffect, useCallback } from 'react';
import eventBus, { subscribeToGameEvents } from '@/game/core/EventSystem';
import gameStateManager from '@/game/core/GameStateManager';
import styles from '@/styles/GameUI.module.css';
import { 
  ScoreDisplay, 
  DistanceMeter, 
  EnvironmentIndicator, 
  PowerUpIndicators,
  Countdown,
  GameControls
} from './GameElements';
import HealthDisplay from './HealthDisplay';

export default function GameUI() {
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'READY' | 'LOADING'>('MENU');
  const [environment, setEnvironment] = useState<string>('reef'); // Explicitly type this as string
  const [activePowerUps, setActivePowerUps] = useState<Array<{ type: string, remainingTime: number, duration: number }>>([]);
  // No longer need countdown state in GameUI
  
  useEffect(() => {
    console.log("GameUI mounted - setting up event listeners");
    
    // Subscribe to game events to update UI
    const unsubscribe = subscribeToGameEvents({
      onScoreChange: (newScore) => {
        console.log("Score changed:", newScore);
        setScore(newScore);
      },
      onDistanceChange: (newDistance) => {
        console.log("Distance changed:", newDistance);
        setDistance(newDistance);
      },
      onGameStateChange: (newState) => {
        console.log("Game state changed to:", newState);
        setGameState(newState);
        
        // No longer handling countdown here
      },
    });
    
    // Handle environment changes through event bus
    const handleEnvironmentChange = (data: any) => {
      // Environment will be fully changed when transition completes
    };
    
    const handleEnvironmentChangeComplete = (data: any) => {
      // Add safety check to ensure data.type is a valid string
      if (data && typeof data.type === 'string') {
        setEnvironment(data.type);
      } else {
        console.warn('Invalid environment data received:', data);
        // Fall back to default environment
        setEnvironment('reef');
      }
    };
    
    // Handle power-up activation
    const handlePowerUpActivation = (data: any) => {
      const { type, duration } = data;
      
      setActivePowerUps(prev => [
        ...prev,
        { type, remainingTime: duration, duration }
      ]);
      
      // Set up timer to update remaining time
      const timerId = setInterval(() => {
        setActivePowerUps(prev => {
          // Find and update the power-up
          const updated = prev.map(p => {
            if (p.type === type) {
              return { ...p, remainingTime: Math.max(0, p.remainingTime - 1) };
            }
            return p;
          });
          
          // Remove expired power-ups (should match server-side timer)
          return updated.filter(p => p.remainingTime > 0);
        });
      }, 1000);
      
      // Clean up timer after duration
      setTimeout(() => {
        clearInterval(timerId);
      }, duration * 1000 + 100); // Small buffer for cleanup
    };
    
    // Handle power-up deactivation (backup cleanup)
    const handlePowerUpDeactivation = (data: any) => {
      const { type } = data;
      
      setActivePowerUps(prev => 
        prev.filter(p => p.type !== type)
      );
    };
    
    // Change event listeners from window to eventBus
    eventBus.on('environment-change', handleEnvironmentChange);
    eventBus.on('environment-change-complete', handleEnvironmentChangeComplete);
    eventBus.on('powerup-activated', handlePowerUpActivation);
    eventBus.on('powerup-deactivated', handlePowerUpDeactivation);
    
    return () => {
      unsubscribe();
      eventBus.off('environment-change', handleEnvironmentChange);
      eventBus.off('environment-change-complete', handleEnvironmentChangeComplete);
      eventBus.off('powerup-activated', handlePowerUpActivation);
      eventBus.off('powerup-deactivated', handlePowerUpDeactivation);
    };
  }, [gameState]);
  
  // Remove countdown functionality from GameUI
  // The countdown is now handled by GameStartController and displayed by GameStateDisplay
  
  // Handle pause button click
  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      gameStateManager.pauseGame();
    }
  }, [gameState]);
  
  // Handle keyboard events for game control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          gameStateManager.pauseGame();
        } else if (gameState === 'PAUSED') {
          gameStateManager.resumeGame();
        }
      } else if (e.key === ' ' && gameState === 'MENU') {
        gameStateManager.startGame();
      } else if (e.key === 'r' && gameState === 'GAME_OVER') {
        gameStateManager.startGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);
  
  // Add log before the conditional return
  console.log(`GameUI render check: Current local gameState is ${gameState}`);

  // Let GameStateDisplay component handle the menu, paused, game over, and ready states
  // This component will only render active gameplay UI elements while in PLAYING state
  if (gameState !== 'PLAYING') {
    console.log(`GameUI: Skipping render because local state is not PLAYING.`);
    return null;
  }
  
  // Log state for debugging
  console.log(`GameUI: Rendering HUD elements because local state is PLAYING.`);
  
  return (
    <div className={styles.gameUI}>
      {/* Score display */}
      <ScoreDisplay score={score} />
      
      {/* Distance meter */}
      <DistanceMeter distance={distance} maxDistance={2000} />
      
      {/* Environment indicator with safety check */}
      <EnvironmentIndicator type={environment || 'reef'} />
      
      {/* Power-up indicators */}
      <PowerUpIndicators activePowerUps={activePowerUps} />
      
      {/* Health/Lives display */}
      <HealthDisplay initialLives={3} />
      
      {/* Game controls (for mobile) */}
      <GameControls onPause={handlePause} />
      
      {/* No longer showing countdown here - it's handled by GameStateDisplay */}
    </div>
  );
}