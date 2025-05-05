'use client';

import { useGame, GameState } from '@/lib/game-engine/GameContext';
import { useEffect, useState, useRef } from 'react';
import { PowerUpType, PowerUp } from './PowerUpSystem';
import { EnvironmentZone } from '@/lib/game-engine/EnvironmentManager';

// Define power-up display properties
const powerUpDisplayProps = {
  [PowerUpType.SHIELD]: {
    color: '#00FFFF',
    icon: '🛡️',
    label: 'Shield'
  },
  [PowerUpType.SPEED_BOOST]: {
    color: '#FF5A5F',
    icon: '⚡',
    label: 'Speed'
  },
  [PowerUpType.BUBBLE_MAGNET]: {
    color: '#FFD700',
    icon: '🧲',
    label: 'Magnet'
  },
  [PowerUpType.TIME_SLOW]: {
    color: '#9C59B6',
    icon: '⏱️',
    label: 'Slow'
  },
  [PowerUpType.SCORE_MULTIPLIER]: {
    color: '#3EC483',
    icon: '✖️',
    label: 'Multiplier'
  }
};

// Environment zone display properties
const environmentZoneProps = {
  [EnvironmentZone.CORAL_REEF]: {
    color: '#0c6b9c',
    icon: '🪸',
    label: 'Coral Reef'
  },
  [EnvironmentZone.OPEN_OCEAN]: {
    color: '#0a4d7a',
    icon: '🌊',
    label: 'Open Ocean'
  },
  [EnvironmentZone.DEEP_SEA]: {
    color: '#041e31',
    icon: '🦑',
    label: 'Deep Sea'
  }
};

// Power-up display component
function PowerUpDisplay({ powerUp }: { powerUp: PowerUp }) {
  const [remainingPercentage, setRemainingPercentage] = useState(1);
  
  // Update remaining time
  useEffect(() => {
    const updateTimer = () => {
      setRemainingPercentage(powerUp.getRemainingPercentage());
    };
    
    // Update every 100ms
    const interval = setInterval(updateTimer, 100);
    updateTimer(); // Initial update
    
    return () => clearInterval(interval);
  }, [powerUp]);
  
  const displayProps = powerUpDisplayProps[powerUp.type];
  
  return (
    <div className="relative w-12 h-12 mx-1">
      {/* Background circular progress */}
      <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          stroke="#FFFFFF33" 
          strokeWidth="4" 
          fill="none" 
        />
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          stroke={displayProps.color} 
          strokeWidth="4" 
          fill="none" 
          strokeDasharray={`${2 * Math.PI * 20}`}
          strokeDashoffset={`${2 * Math.PI * 20 * (1 - remainingPercentage)}`}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      
      {/* Power-up icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="text-xl">{displayProps.icon}</span>
          <span className="text-[8px] mt-[-2px] text-white font-bold">
            {Math.ceil(powerUp.getRemainingTime())}s
          </span>
        </div>
      </div>
    </div>
  );
}

interface GameHUDProps {
  powerUpSystemRef?: React.RefObject<any>;
}

export default function GameHUD({ powerUpSystemRef }: GameHUDProps) {
  const { 
    state, 
    score, 
    distance, 
    lives, 
    multiplier, 
    speed, 
    difficultyLevel,
    environmentZone,
    isEnvironmentTransitioning
  } = useGame();
  
  const [displayScore, setDisplayScore] = useState(score);
  const [displayDistance, setDisplayDistance] = useState(distance);
  const [activePowerUps, setActivePowerUps] = useState<PowerUp[]>([]);
  
  // Animate score changes
  useEffect(() => {
    if (score !== displayScore) {
      const diff = score - displayScore;
      const step = Math.max(1, Math.floor(diff / 10));
      
      const interval = setInterval(() => {
        setDisplayScore(prev => {
          const next = prev + step;
          return next > score ? score : next;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [score, displayScore]);
  
  // Animate distance changes
  useEffect(() => {
    if (distance !== displayDistance) {
      const diff = distance - displayDistance;
      const step = Math.max(1, Math.floor(diff / 5));
      
      const interval = setInterval(() => {
        setDisplayDistance(prev => {
          const next = prev + step;
          return next > distance ? distance : next;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [distance, displayDistance]);
  
  // Poll for active power-ups
  useEffect(() => {
    const updatePowerUps = () => {
      if (powerUpSystemRef?.current && powerUpSystemRef.current.getActivePowerUps) {
        setActivePowerUps(powerUpSystemRef.current.getActivePowerUps());
      }
    };
    
    const interval = setInterval(updatePowerUps, 200);
    return () => clearInterval(interval);
  }, [powerUpSystemRef]);
  
  // Don't render if not playing
  if (state !== GameState.PLAYING) {
    return null;
  }
  
  // Get environment zone properties
  const zoneProps = environmentZoneProps[environmentZone];
  
  return (
    <div className="absolute inset-x-0 top-0 p-4 pointer-events-none">
      <div className="container mx-auto flex justify-between items-start">
        {/* Score Display */}
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded-lg">
          <div className="text-3xl font-bold text-white">
            {displayScore.toLocaleString()}
          </div>
          <div className="text-sm text-blue-200">
            Score {multiplier > 1 ? `(${multiplier}x)` : ''}
          </div>
        </div>
        
        {/* Distance Display */}
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded-lg">
          <div className="text-3xl font-bold text-white">
            {Math.floor(displayDistance).toLocaleString()}m
          </div>
          <div className="text-sm text-blue-200">
            Distance
          </div>
        </div>
        
        {/* Lives Display */}
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded-lg">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full ${i < lives ? 'bg-orange-500' : 'bg-gray-700'}`}
              ></div>
            ))}
          </div>
          <div className="text-sm text-blue-200 text-right">
            Lives
          </div>
        </div>
      </div>
      
      {/* Environment zone indicator (top center) */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm p-2 px-4 rounded-full flex items-center ${isEnvironmentTransitioning ? 'animate-pulse' : ''}`}>
        <div 
          className="w-3 h-3 rounded-full mr-2 transition-colors duration-500" 
          style={{ backgroundColor: zoneProps.color }}
        ></div>
        <span className="text-lg mr-1">{zoneProps.icon}</span>
        <span className="text-white font-bold text-sm">{zoneProps.label}</span>
        {isEnvironmentTransitioning && 
          <span className="text-blue-200 text-xs ml-2 animate-pulse">(Transitioning)</span>
        }
      </div>
      
      {/* Speed and difficulty indicators (bottom left) */}
      <div className="absolute bottom-4 left-4 flex flex-col items-start gap-3">
        <div>
          <div className="text-sm text-blue-200 font-bold mb-1">
            SPEED
          </div>
          <div className="flex items-center">
            <div className="h-2 w-32 bg-black/30 backdrop-blur-sm rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-300" 
                style={{ width: `${(speed / 5) * 100}%` }}
              />
            </div>
            <div className="ml-2 text-white text-sm font-bold">
              {speed.toFixed(1)}×
            </div>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-blue-200 font-bold mb-1">
            DIFFICULTY
          </div>
          <div className="flex items-center">
            <div className="h-2 w-32 bg-black/30 backdrop-blur-sm rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500" 
                style={{ width: `${(difficultyLevel / 5) * 100}%` }}
              />
            </div>
            <div className="ml-2 text-white text-sm font-bold">
              Level {difficultyLevel}
            </div>
          </div>
        </div>
      </div>
      
      {/* Power-up indicators (bottom right) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end">
        <div className="text-sm text-blue-200 font-bold mb-1">
          POWER-UPS
        </div>
        <div className="flex">
          {activePowerUps.length > 0 ? (
            // Display active power-ups
            activePowerUps.map((powerUp, index) => (
              <PowerUpDisplay key={`${powerUp.type}-${index}`} powerUp={powerUp} />
            ))
          ) : (
            // Empty state
            <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center opacity-50">
              <span className="text-white text-xs">None</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}