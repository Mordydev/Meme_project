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
  
  // Log for debugging purposes
  useEffect(() => {
    console.log("ScoreDisplay rendered. Score:", score, "DisplayScore:", displayScore);
  }, [score, displayScore]);
  
  return (
    <div className={styles.scoreDisplay} style={{
      // Inline styles to ensure visibility
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      padding: '15px 25px',
      borderRadius: '20px',
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
      transform: 'translateX(-50%)',
      position: 'absolute',
      top: '20px',
      left: '50%',
      zIndex: 9999
    }}>
      <div className={styles.scoreLabel} style={{ 
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '1rem'
      }}>SCORE</div>
      <p className={styles.scoreValue} style={{ 
        color: animateScore ? '#ffd700' : 'white',
        transform: animateScore ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s ease',
        fontSize: '2.5rem',
        margin: '0',
        fontWeight: 'bold'
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
  
  // Log for debugging
  useEffect(() => {
    console.log("DistanceMeter rendered with distance:", distance);
  }, [distance]);
  
  return (
    <div style={{
      position: 'absolute', 
      bottom: '30px', 
      left: '50%', 
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '60%',
      maxWidth: '400px'
    }}>
      <div style={{
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '5px',
        padding: '5px 15px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '15px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
      }}>
        {Math.floor(distance)}m
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
      }}>
        <div 
          style={{ 
            height: '100%',
            backgroundColor: '#ff7e00',
            width: `${progress}%`,
            transition: 'width 0.3s ease-out',
            borderRadius: '4px'
          }} 
        />
      </div>
    </div>
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

// Game controls for mobile and desktop
export function GameControls({ onPause }: { onPause: () => void }) {
  // Log for debugging
  useEffect(() => {
    console.log("GameControls component rendered");
  }, []);
  
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <button 
        onClick={onPause}
        aria-label="Pause Game"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid rgba(255, 255, 255, 0.9)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)',
          fontSize: '1rem',
          fontWeight: 'bold',
          pointerEvents: 'auto'
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>⏸️</span>
        <span>Pause</span>
      </button>
      <div style={{
        color: 'white', 
        fontSize: '0.8rem', 
        marginTop: '5px',
        textShadow: '0 0 5px black'
      }}>
        ESC or P to pause
      </div>
    </div>
  );
}