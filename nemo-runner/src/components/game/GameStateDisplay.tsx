'use client';

import { useEffect, useState } from 'react';
import gameStateManager, { GameState } from '@/game/core/GameStateManager';
import styles from '@/styles/GameUI.module.css';
import AudioControls from './AudioControls';

interface GameStateDisplayProps {
  initialState?: GameState;
}

/**
 * GameStateDisplay - A component for displaying and transitioning between game states
 * 
 * This component shows:
 * - Current game state with appropriate visuals
 * - Transition effects between states
 * - State-specific UI elements (countdown, game over display, etc.)
 * - High score notifications
 */
export default function GameStateDisplay({ initialState = 'MENU' }: GameStateDisplayProps) {
  const [currentState, setCurrentState] = useState<GameState>(initialState);
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Listen for state changes
  useEffect(() => {
    const handleStateChange = (data: { from: GameState; to: GameState; data: any }) => {
      setPreviousState(data.from);
      setCurrentState(data.to);
      setIsTransitioning(true);
      
      // Start countdown if entering READY state
      if (data.to === 'READY') {
        setCountdown(3);
      }
      
      // Update score on GAME_OVER
      if (data.to === 'GAME_OVER') {
        setScore(data.data.score);
        setHighScore(data.data.highScore);
        setIsNewHighScore(data.data.score > data.data.highScore);
      }
      
      // Transition animation timing
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    };

    // Subscribe to state changes
    eventBus.on('game-state-change', handleStateChange);
    
    // Get initial state from manager
    setCurrentState(gameStateManager.state);
    setHighScore(gameStateManager.stateData.highScore);
    
    // Cleanup
    return () => {
      eventBus.off('game-state-change', handleStateChange);
    };
  }, []);
  
  // Handle countdown timer for READY state
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    
    if (currentState === 'READY' && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [currentState, countdown]);

  // Render based on current state
  const renderStateContent = () => {
    switch (currentState) {
      case 'MENU':
        return (
          <div className={styles.menuState}>
            <h1 className={styles.gameTitle}>NEMO Runner</h1>
            <button 
              className={styles.startButton}
              onClick={() => gameStateManager.startGame()}
            >
              Start Game
            </button>
            {highScore > 0 && (
              <div className={styles.highScoreDisplay}>
                High Score: {highScore}
              </div>
            )}
          </div>
        );
        
      case 'READY':
        return (
          <div className={styles.readyState}>
            <div className={styles.countdown}>
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            <div className={styles.readyInstructions}>
              Get ready to swim!
            </div>
          </div>
        );
        
      case 'PLAYING':
        // Minimal UI during gameplay - the HUD will be handled by GameUI component
        return null;
        
      case 'PAUSED':
        return (
          <div className={styles.pausedState}>
            <h2>Game Paused</h2>
            <div className={styles.pauseButtons}>
              <button 
                className={styles.resumeButton}
                onClick={() => gameStateManager.resumeGame()}
              >
                Resume
              </button>
              <button 
                className={styles.quitButton}
                onClick={() => gameStateManager.setState('MENU')}
              >
                Quit
              </button>
            </div>
          </div>
        );
        
      case 'GAME_OVER':
        return (
          <div className={styles.gameOverState}>
            <h2>Game Over</h2>
            
            <div className={styles.scoreDisplay}>
              <div className={styles.finalScore}>Score: {score}</div>
              {isNewHighScore && (
                <div className={styles.newHighScore}>New High Score!</div>
              )}
              <div className={styles.highScore}>High Score: {highScore}</div>
            </div>
            
            <div className={styles.gameOverButtons}>
              <button 
                className={styles.restartButton}
                onClick={() => gameStateManager.startGame()}
              >
                Play Again
              </button>
              <button 
                className={styles.menuButton}
                onClick={() => gameStateManager.setState('MENU')}
              >
                Main Menu
              </button>
            </div>
          </div>
        );
        
      case 'LOADING':
        return (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Loading...</div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Apply transition classes
  const getStateClasses = () => {
    let classes = styles.gameStateDisplay;
    
    if (isTransitioning) {
      classes += ' ' + styles.transitioning;
    }
    
    classes += ' ' + styles[`state${currentState}`];
    
    return classes;
  };

  return (
    <div className={getStateClasses()}>
      {renderStateContent()}
      
      {/* Always render audio controls in all game states */}
      {currentState !== 'PLAYING' && <AudioControls />}
    </div>
  );
}

// Get access to eventBus
import eventBus from '@/game/core/EventSystem';