'use client';

import { useEffect, useState } from 'react';
import gameStateManager, { GameState } from '@/game/core/GameStateManager';
import styles from '@/styles/GameUI.module.css';

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
      // Apply transition effect: First set transition to true to fade out current state
      setIsTransitioning(true);
      
      // Update data based on to state
      if (data.to === 'READY') {
        setCountdown(3);
      }
      
      if (data.to === 'GAME_OVER') {
        setScore(data.data.score);
        setHighScore(data.data.highScore);
        setIsNewHighScore(data.data.score > data.data.highScore);
      }
      
      // After current state fades out, change to the new state and fade it in
      setTimeout(() => {
        setPreviousState(data.from);
        setCurrentState(data.to);
        
        // Allow a little time for the DOM to update before starting fade-in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
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
    
    if (currentState === 'READY') {
      if (countdown > 0) {
        countdownInterval = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else if (countdown === 0) {
        // When countdown reaches 0 (GO!), wait 1 second and force transition to PLAYING
        const goToPlayingTimeout = setTimeout(() => {
          console.log('Forcing transition to PLAYING state after GO!');
          gameStateManager.setState('PLAYING');
        }, 1000);
        
        return () => {
          clearTimeout(goToPlayingTimeout);
        };
      }
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
            <div className={styles.logoContainer}>
              <h1 className={styles.gameTitle}>NEMO Runner</h1>
              <div className={styles.tagline}>Swim through the ocean!</div>
            </div>
            
            <div className={styles.menuButtons}>
              <button 
                className={styles.startButton}
                onClick={() => gameStateManager.startGame()}
              >
                Start Game
              </button>
              
              <button 
                className={styles.menuOptionButton}
                onClick={() => {
                  // We would normally set a state like 'setShowSettings(true)'
                  // For simplicity, we'll just alert for now
                  alert("Settings would open here");
                }}
              >
                Settings
              </button>
              
              <button 
                className={styles.menuOptionButton}
                onClick={() => {
                  // We would normally set a state like 'setShowControls(true)'
                  alert("Controls guide would show here");
                }}
              >
                How to Play
              </button>
            </div>
            
            {highScore > 0 && (
              <div className={styles.highScoreDisplay}>
                <div className={styles.highScoreTitle}>Best Score</div>
                <div className={styles.highScoreValue}>{highScore}</div>
              </div>
            )}
            
            <div className={styles.versionInfo}>
              v0.1.0 - Alpha
            </div>
          </div>
        );
        
      case 'READY':
        return (
          <div className={styles.readyState} onClick={() => countdown === 0 && gameStateManager.setState('PLAYING')}>
            <div className={styles.countdown}>
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            <div className={styles.readyInstructions}>
              {countdown > 0 ? 'Get ready to swim!' : 'Tap to start!'}
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
            
            <div className={styles.pauseScore}>
              <div className={styles.pauseScoreLabel}>Current Score</div>
              <div className={styles.pauseScoreValue}>{score}</div>
            </div>
            
            <div className={styles.pauseButtons}>
              <button 
                className={styles.resumeButton}
                onClick={() => gameStateManager.resumeGame()}
              >
                Resume Game
              </button>
              
              <button 
                className={styles.restartButton}
                onClick={() => {
                  // Restart the game
                  eventBus.emit('game-restart');
                  gameStateManager.startGame();
                }}
              >
                Restart
              </button>
              
              <button 
                className={styles.settingsButton}
                onClick={() => {
                  // We would normally set a state like 'setShowSettings(true)'
                  alert("Settings would open here");
                }}
              >
                Settings
              </button>
              
              <button 
                className={styles.quitButton}
                onClick={() => gameStateManager.setState('MENU')}
              >
                Quit to Menu
              </button>
            </div>
            
            <div className={styles.pauseTip}>
              <span className={styles.tipLabel}>Tip:</span> Press ESC or P to resume the game
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
                onClick={() => {
                  // Reset necessary game state before restarting
                  eventBus.emit('game-restart');
                  gameStateManager.startGame();
                }}
                aria-label="Play Again"
              >
                Play Again
              </button>
              <button 
                className={styles.menuButton}
                onClick={() => {
                  // Clean transition to menu
                  gameStateManager.setState('MENU');
                }}
                aria-label="Main Menu"
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
    
    // Add transitioning class when state is changing
    if (isTransitioning) {
      classes += ' ' + styles.transitioning;
    }
    
    // Add state-specific class
    if (currentState) {
      classes += ' ' + styles[`state${currentState}`];
    }
    
    return classes;
  };

  // Don't render anything in PLAYING state to avoid blocking GameUI
  if (currentState === 'PLAYING') {
    return null;
  }
  
  return (
    <div className={getStateClasses()}>
      {renderStateContent()}
    </div>
  );
}

// Get access to eventBus
import eventBus from '@/game/core/EventSystem';