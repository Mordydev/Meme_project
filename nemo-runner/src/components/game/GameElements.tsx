'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/GameElements.module.css';

// Score display component
export function ScoreDisplay({ score }: { score: number }) {
  const [animateScore, setAnimateScore] = useState(false);
  const [displayScore, setDisplayScore] = useState(score);
  
  // Animate score changes
  useEffect(() => {
    if (score !== displayScore) {
      setAnimateScore(true);
      
      // Gradually update displayed score
      const diff = score - displayScore;
      const step = Math.max(1, Math.ceil(Math.abs(diff) / 10));
      const direction = diff > 0 ? 1 : -1;
      
      const interval = setInterval(() => {
        setDisplayScore(prev => {
          const next = prev + step * direction;
          
          // Check if we've reached or passed the target
          if ((direction > 0 && next >= score) || (direction < 0 && next <= score)) {
            clearInterval(interval);
            setAnimateScore(false);
            return score;
          }
          
          return next;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [score, displayScore]);
  
  return (
    <div className={styles.scoreDisplay}>
      <p className={styles.scoreValue} style={{ 
        color: animateScore ? '#ffd700' : 'white',
        transform: animateScore ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s ease'
      }}>
        {displayScore.toLocaleString()}
      </p>
    </div>
  );
}

// Distance meter component
export function DistanceMeter({ distance, maxDistance = 2000 }: { distance: number, maxDistance?: number }) {
  // Calculate progress for the meter (0-100%)
  const progress = Math.min(100, (distance / maxDistance) * 100);
  
  return (
    <>
      <div className={styles.distanceValue}>{Math.floor(distance)}m</div>
      <div className={styles.distanceMeter}>
        <div 
          className={styles.distanceFill} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}

// Environment indicator component
export function EnvironmentIndicator({ type }: { type: string }) {
  // Format the environment name for display
  const formatEnvironmentName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };
  
  // Determine the appropriate class based on environment type
  const getEnvironmentClass = () => {
    switch (type) {
      case 'reef': return styles.reef;
      case 'openOcean': return styles.openOcean;
      case 'deepSea': return styles.deepSea;
      case 'shipwreck': return styles.shipwreck;
      case 'kelpForest': return styles.kelpForest;
      default: return '';
    }
  };
  
  return (
    <div className={`${styles.currentEnvironment} ${getEnvironmentClass()}`}>
      {formatEnvironmentName(type)}
    </div>
  );
}

// Power-up indicators component
export function PowerUpIndicators({ 
  activePowerUps 
}: { 
  activePowerUps: Array<{ type: string, remainingTime: number, duration: number }> 
}) {
  if (activePowerUps.length === 0) return null;
  
  return (
    <div className={styles.powerUpIndicator}>
      {activePowerUps.map((powerUp, index) => (
        <PowerUpItem key={index} powerUp={powerUp} />
      ))}
    </div>
  );
}

// Individual power-up item component
function PowerUpItem({ 
  powerUp 
}: { 
  powerUp: { type: string, remainingTime: number, duration: number } 
}) {
  // Format power-up name
  const formatPowerUpName = (type: string) => {
    // Remove 'powerup_' prefix and capitalize
    return type.replace('powerup_', '')
      .replace(/^./, str => str.toUpperCase());
  };
  
  // Calculate timer percentage
  const timerPercentage = (powerUp.remainingTime / powerUp.duration) * 100;
  
  // Get class based on power-up type
  const getPowerUpClass = () => {
    switch (powerUp.type) {
      case 'powerup_shield': return styles.powerUpShield;
      case 'powerup_magnet': return styles.powerUpMagnet;
      case 'powerup_speed': return styles.powerUpSpeed;
      case 'powerup_score': return styles.powerUpScore;
      case 'powerup_time': return styles.powerUpTime;
      default: return '';
    }
  };
  
  return (
    <div className={`${styles.powerUp} ${getPowerUpClass()}`}>
      <div className={styles.powerUpIcon}></div>
      <span>{formatPowerUpName(powerUp.type)}</span>
      <div className={styles.powerUpTimer}>
        <div 
          className={styles.powerUpTimerFill} 
          style={{ width: `${timerPercentage}%` }}
        />
      </div>
    </div>
  );
}

// Countdown component for game start
export function Countdown({ value, visible }: { value: number, visible: boolean }) {
  if (!visible) return null;
  
  return (
    <div className={styles.countdown}>
      {value}
    </div>
  );
}

// Game controls for mobile devices
export function GameControls({ onPause }: { onPause: () => void }) {
  return (
    <div className={styles.gameControls}>
      <button className={styles.controlButton} onClick={onPause}>
        ⏸️
      </button>
    </div>
  );
}