'use client';

import { useState, useEffect } from 'react';
import { subscribeToGameEvents } from '@/game/core/EventSystem';
import styles from '@/styles/GameUI.module.css';
import { 
  ScoreDisplay, 
  DistanceMeter, 
  EnvironmentIndicator, 
  PowerUpIndicators,
  Countdown,
  GameControls
} from './GameElements';

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
    
    // Handle environment changes
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
    
    // Subscribe to additional events
    window.addEventListener('environment-change', handleEnvironmentChange);
    window.addEventListener('environment-change-complete', handleEnvironmentChangeComplete);
    window.addEventListener('powerup-activated', handlePowerUpActivation);
    window.addEventListener('powerup-deactivated', handlePowerUpDeactivation);
    
    return () => {
      unsubscribe();
      window.removeEventListener('environment-change', handleEnvironmentChange);
      window.removeEventListener('environment-change-complete', handleEnvironmentChangeComplete);
      window.removeEventListener('powerup-activated', handlePowerUpActivation);
      window.removeEventListener('powerup-deactivated', handlePowerUpDeactivation);
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
  const handlePause = () => {
    if (gameState === 'PLAYING') {
      window.dispatchEvent(new CustomEvent('game-pause'));
    }
  };
  
  if (gameState === 'MENU') {
    return (
      <div className={styles.menuOverlay}>
        <div className={styles.menuContent}>
          <h2>NEMO Runner</h2>
          <p>Use arrow keys to move, avoid obstacles, collect bubbles!</p>
          <div className={styles.controls}>
            <div className={styles.controlItem}>
              <span className={styles.key}>↑</span>
              <span>Jump</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.key}>↓</span>
              <span>Dive</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.key}>←</span>
              <span>Move Left</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.key}>→</span>
              <span>Move Right</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.key}>P</span>
              <span>Pause</span>
            </div>
          </div>
          <button 
            className={styles.playButton}
            onClick={() => {
              // Trigger game start
              window.dispatchEvent(new CustomEvent('game-start'));
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
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
      
      {/* Game controls (for mobile) */}
      <GameControls onPause={handlePause} />
      
      {/* Countdown (if active) */}
      <Countdown value={countdown || 0} visible={countdown !== null} />
      
      {/* Pause overlay */}
      {gameState === 'PAUSED' && (
        <div className={styles.pauseOverlay}>
          <div className={styles.pauseContent}>
            <h2>Game Paused</h2>
            <div className={styles.pauseStats}>
              <p>Score: {score}</p>
              <p>Distance: {distance}m</p>
            </div>
            <button 
              className={styles.resumeButton}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('game-resume'));
              }}
            >
              Resume
            </button>
          </div>
        </div>
      )}
      
      {/* Game over overlay */}
      {gameState === 'GAME_OVER' && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverContent}>
            <h2>Game Over</h2>
            <div className={styles.finalStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Score</span>
                <span className={styles.statValue}>{score}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Distance</span>
                <span className={styles.statValue}>{distance}m</span>
              </div>
            </div>
            <button 
              className={styles.restartButton}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('game-restart'));
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}