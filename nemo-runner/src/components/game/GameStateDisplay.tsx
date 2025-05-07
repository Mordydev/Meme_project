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
      console.log(`State change: ${data.from} -> ${data.to}`);
      
      // Apply transition effect: First set transition to true to fade out current state
      setIsTransitioning(true);
      
      // Update data based on to state
      if (data.to === 'READY') {
        setCountdown(3);
        console.log('Setting countdown to 3 for READY state');
      }
      
      if (data.to === 'GAME_OVER') {
        setScore(data.data.score);
        setHighScore(data.data.highScore);
        setIsNewHighScore(data.data.score > data.data.highScore);
      }
      
      // Special case for READY to PLAYING transition - make it immediate
      if (data.from === 'READY' && data.to === 'PLAYING') {
        console.log('Immediate transition from READY to PLAYING');
        setPreviousState(data.from);
        setCurrentState(data.to);
        setIsTransitioning(false);
      } else {
        // For all other transitions, use the fade effect
        // After current state fades out, change to the new state and fade it in
        console.log('Starting transition with fade effect');
        setTimeout(() => {
          setPreviousState(data.from);
          setCurrentState(data.to);
          
          // Allow a little time for the DOM to update before starting fade-in
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        }, 300);
      }
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
  
  // Enhanced countdown timer for READY state with reliable transition
  useEffect(() => {
    // Use an array of timeouts for better cleanup
    const timeouts: NodeJS.Timeout[] = [];
    
    // Define a more robust countdown sequence
    const startCountdown = () => {
      console.log('GameStateDisplay: Starting enhanced countdown from 3');
      setCountdown(3);
      
      // Comprehensive sequence with multiple movement triggers
      // Stage 1: Show "3"
      timeouts.push(setTimeout(() => {
        console.log('GameStateDisplay: Countdown: 3');
        setCountdown(3);
        
        // Stage 2: Show "2"
        timeouts.push(setTimeout(() => {
          console.log('GameStateDisplay: Countdown: 2');
          setCountdown(2);
          
          // Stage 3: Show "1"
          timeouts.push(setTimeout(() => {
            console.log('GameStateDisplay: Countdown: 1');
            setCountdown(1);
            
            // Stage 4: Show "GO!"
            timeouts.push(setTimeout(() => {
              console.log('GameStateDisplay: Countdown: GO!');
              setCountdown(0);
              
              // Emit pre-movement event to prepare systems
              console.log('GameStateDisplay: Emitting pre-movement event');
              eventBus.emit('game-pre-movement', { 
                startTime: Date.now(),
                stage: 'pre-movement'
              });
              
              // Stage 5: Transition to PLAYING after showing GO
              timeouts.push(setTimeout(() => {
                console.log('GameStateDisplay: AUTO-STARTING GAME FROM TIMEOUT');
                
                // ENHANCED CRITICAL SEQUENCE: More robust with even more redundancy
                
                // We'll emit the same event many times with increasing force to ensure the movement starts
                const emitStartMovement = (triggerName: string, force: number = 1) => {
                  console.log(`GameStateDisplay: Movement trigger "${triggerName}" with force ${force}`);
                  
                  // Emit with detailed metadata for debugging
                  eventBus.emit('game-start-movement', { 
                    startTime: Date.now(),
                    trigger: triggerName,
                    force: force,
                    gameState: gameStateManager.state
                  });
                  
                  // Also emit alternate event type as backup
                  eventBus.emit('game-start', { 
                    startTime: Date.now(),
                    trigger: triggerName,
                    force: force
                  });
                  
                  // Bonus: direct DOM access to broadcast a custom event as ultimate backup
                  try {
                    const customEvent = new CustomEvent('nemo-game-start-movement', {
                      detail: { timestamp: Date.now(), trigger: triggerName, force: force }
                    });
                    document.dispatchEvent(customEvent);
                  } catch (e) {
                    // Ignore errors in custom event dispatch
                  }
                };
                
                // 1. First movement trigger BEFORE state change
                emitStartMovement('first-before-state-change', 1);
                
                // 2. Set state to PLAYING - CRITICAL STEP!
                console.log('GameStateDisplay: Setting state to PLAYING');
                gameStateManager.setState('PLAYING');
                
                // 3. Second movement trigger immediately AFTER state change
                emitStartMovement('second-after-state-change', 2);
                
                // 4. Third movement trigger with very slight delay (20ms)
                timeouts.push(setTimeout(() => {
                  emitStartMovement('third-20ms-delay', 3);
                }, 20));
                
                // 5. Fourth movement trigger (50ms)
                timeouts.push(setTimeout(() => {
                  emitStartMovement('fourth-50ms-delay', 4);
                }, 50));
                
                // 6. Fifth movement trigger (100ms)
                timeouts.push(setTimeout(() => {
                  emitStartMovement('fifth-100ms-delay', 5);
                }, 100));
                
                // 7. Sixth movement trigger (200ms)
                timeouts.push(setTimeout(() => {
                  emitStartMovement('sixth-200ms-delay', 6);
                }, 200));
                
                // 8. Final failsafe with longer delay (500ms)
                timeouts.push(setTimeout(() => {
                  console.log('GameStateDisplay: FINAL failsafe movement trigger with 500ms delay');
                  
                  // Verify we're still in PLAYING state
                  if (gameStateManager.state === 'PLAYING') {
                    emitStartMovement('final-500ms-failsafe', 10);
                    
                    // Direct verification of character movement
                    eventBus.emit('verify-character-movement', {
                      timestamp: Date.now(),
                      force: 10
                    });
                    
                    // Add one more final check after a slight pause
                    setTimeout(() => {
                      // Double-check game state one last time
                      if (gameStateManager.state === 'PLAYING') {
                        console.log('GameStateDisplay: Ultimate last chance movement trigger');
                        emitStartMovement('ultimate-last-chance', 20);
                      }
                    }, 100);
                  } else {
                    console.warn(`GameStateDisplay: Not in PLAYING state at 500ms failsafe! Current state: ${gameStateManager.state}`);
                    // Try to force state to PLAYING as a last resort
                    console.log('GameStateDisplay: EMERGENCY forcing state to PLAYING');
                    gameStateManager.setState('PLAYING');
                    
                    // Then try movement again
                    emitStartMovement('emergency-state-fix', 15);
                  }
                }, 500));
              }, 1000)); // Wait 1 second after showing GO
            }, 1000)); // 1 second for countdown 1
          }, 1000)); // 1 second for countdown 2
        }, 1000)); // 1 second for countdown 3
      }, 0)); // Start immediately
    };
    
    // Only start the countdown sequence when we first enter READY state
    if (currentState === 'READY' && countdown === 3) {
      console.log('GameStateDisplay: Detected READY state, starting enhanced countdown sequence');
      startCountdown();
    }
    
    // Clean up function - clear all timeouts
    return () => {
      console.log(`GameStateDisplay: Cleaning up ${timeouts.length} countdown timeouts`);
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [currentState]); // Only depend on currentState to prevent re-triggering

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
          <div className={styles.readyState}>
            <div className={styles.countdown}>
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            <div className={styles.readyInstructions}>
              {countdown > 0 ? 'Get ready to swim!' : 'Here we go!'}
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

  // Immediately hide the display when we reach PLAYING state
  // We handle this through CSS visibility to avoid potential React rendering issues
  useEffect(() => {
    if (currentState === 'PLAYING') {
      // Force hide via direct DOM manipulation as a failsafe
      const element = document.querySelector(`.${styles.gameStateDisplay}`);
      if (element) {
        (element as HTMLElement).style.display = 'none';
      }
    }
  }, [currentState]);
  
  // Don't render in PLAYING state to avoid wasting resources
  if (currentState === 'PLAYING') {
    console.log('GameStateDisplay - Not rendering due to PLAYING state');
    return null;
  }
  
  console.log('GameStateDisplay is rendering with state:', currentState);
  
  return (
    <div className={getStateClasses()}>
      {renderStateContent()}
    </div>
  );
}

// Get access to eventBus
import eventBus from '@/game/core/EventSystem';