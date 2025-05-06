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
import AudioControls from './AudioControls';

export default function GameUI() {
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('MENU');
  const [environment, setEnvironment] = useState('reef');
  const [activePowerUps, setActivePowerUps] = useState<Array<{ type: string, remainingTime: number, duration: number }>>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  useEffect(() => {
    // Subscribe to game events to update UI
    const unsubscribe = subscribeToGameEvents({
      onScoreChange: (newScore) => setScore(newScore),
      onDistanceChange: (newDistance) => setDistance(newDistance),
      onGameStateChange: (newState) => {
        setGameState(newState);
        
        // Show countdown when starting game
        if (newState === 'PLAYING' && gameState === 'MENU') {
          startCountdown();
        }
      },
    });
    
    // Handle environment changes through event bus
    const handleEnvironmentChange = (data: any) => {
      // Environment will be fully changed when transition completes
    };
    
    const handleEnvironmentChangeComplete = (data: any) => {
      setEnvironment(data.type);
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
  
  // Start countdown when game begins
  const startCountdown = () => {
    setCountdown(3);
    
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
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
  
  // Let GameStateDisplay component handle the menu, paused, and game over states
  // This component will only render active gameplay UI elements
  if (gameState !== 'PLAYING') {
    return null;
  }
  
  return (
    <div className={styles.gameUI}>
      {/* Score display */}
      <ScoreDisplay score={score} />
      
      {/* Distance meter */}
      <DistanceMeter distance={distance} maxDistance={2000} />
      
      {/* Environment indicator */}
      <EnvironmentIndicator type={environment} />
      
      {/* Power-up indicators */}
      <PowerUpIndicators activePowerUps={activePowerUps} />
      
      {/* Health/Lives display */}
      <HealthDisplay initialLives={3} />
      
      {/* Game controls (for mobile) */}
      <GameControls onPause={handlePause} />
      
      {/* Audio controls */}
      <AudioControls />
      
      {/* Countdown (if active) */}
      <Countdown value={countdown || 0} visible={countdown !== null} />
    </div>
  );
}