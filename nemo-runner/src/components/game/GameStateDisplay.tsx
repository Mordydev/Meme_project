'use client';

import { useEffect, useState } from 'react';
import gameStateManager, { GameState } from '@/game/core/GameStateManager';
import gameStartController from '@/game/core/GameStartController'; // Import the controller
import styles from '@/styles/GameUI.module.css';
import eventBus from '@/game/core/EventSystem'; // Import eventBus

interface GameStateDisplayProps {
  initialState?: GameState;
}

export default function GameStateDisplay({ initialState = 'MENU' }: GameStateDisplayProps) {
  const [currentState, setCurrentState] = useState<GameState>(initialState);
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState(3); // Initialize countdown state
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Listen for state changes from GameStateManager
  useEffect(() => {
    const handleStateChange = (data: { from: GameState; to: GameState; data: any }) => {
      console.log(`GameStateDisplay: State change detected: ${data.from} -> ${data.to}`);
      
      // Start transition animation
      setIsTransitioning(true);

      // Update score/highscore if transitioning to GAME_OVER
      if (data.to === 'GAME_OVER') {
        setScore(data.data.score);
        setHighScore(data.data.highScore);
        setIsNewHighScore(data.data.score > data.data.highScore);
      }

      // Specific transition handling based on state changes
      let fadeOutDelay = 300;
      let fadeInDelay = 300;
      
      // Special case: READY -> PLAYING should be quicker
      if (data.from === 'READY' && data.to === 'PLAYING') {
        fadeOutDelay = 100; // Faster fade out
      }
      
      // Special case: MENU -> READY should be smoother
      if (data.from === 'MENU' && data.to === 'READY') {
        fadeOutDelay = 400; // Slightly longer fade out
        fadeInDelay = 400; // Slightly longer fade in
      }
      
      // Two-phase transition: First phase - fade out current state
      setTimeout(() => {
        setPreviousState(data.from);
        setCurrentState(data.to);
        
        // Second phase - fade in new state
        setTimeout(() => {
          setIsTransitioning(false);
        }, fadeInDelay);
      }, fadeOutDelay);
    };

    eventBus.on('game-state-change', handleStateChange);

    // Set initial state from manager
    setCurrentState(gameStateManager.state);
    setHighScore(gameStateManager.stateData.highScore);

    return () => {
      eventBus.off('game-state-change', handleStateChange);
    };
  }, []);

  // Listen for countdown updates from GameStartController
  useEffect(() => {
    const handleCountdownUpdate = (data: { count: number }) => {
      console.log(`GameStateDisplay: Received countdown update: ${data.count}`);
      // Update the countdown state only if we are in the READY state
      if (currentState === 'READY') {
         setCountdown(data.count);
      }
    };

    eventBus.on('countdown-update', handleCountdownUpdate);

    return () => {
      eventBus.off('countdown-update', handleCountdownUpdate);
    };
  }, [currentState]); // Re-subscribe if currentState changes, though usually not needed

  // Render based on current state
  const renderStateContent = () => {
    switch (currentState) {
      case 'MENU':
        return (
          <div className={styles.menuState}>
            {/* ... (Menu content remains the same) ... */}
             <button
                className={styles.startButton}
                onClick={() => {
                  console.log("GameStateDisplay: Start Game button clicked");
                  // *** FIX: Call GameStartController to initiate countdown ***
                  gameStartController.requestStartGame();
                }}
              >
                Start Game
              </button>
            {/* ... (Rest of Menu content) ... */}
          </div>
        );

      case 'READY':
        console.log("GameStateDisplay rendering READY state with countdown:", countdown)
        return (
          <div className={styles.readyState}>
            <div className={`${styles.countdown} ${countdown <= 0 ? styles.go : ''}`}>
              {/* Display countdown value from state */}
              {countdown > 0 ? countdown : 'GO!'}
            </div>
             <div className={styles.readyInstructions}>
               {countdown > 0 ? 'Get ready...' : ''}
             </div>
          </div>
        );

       case 'PLAYING':
         // This component is not rendered during PLAYING state as GameCanvas controls visibility
         // We could return null here, but parent visibility control is better
         console.log("GameStateDisplay rendering PLAYING state view (parent should hide this)")
         return (
           <div className={styles.playingState}>
              {/* Empty container for PLAYING state - parent should hide this */}
           </div>
         );

      case 'PAUSED':
         return (
           <div className={styles.pausedState}>
              {/* ... Pause menu content ... */}
               <button
                 className={styles.resumeButton}
                 onClick={() => {
                   // Resume game via GameStateManager
                   if (gameStateManager) {
                     gameStateManager.resumeGame();
                   } else {
                     console.error("GameStateManager not available for resume");
                   }
                 }}
               >
                 Resume Game
               </button>
              {/* ... Other pause buttons ... */}
           </div>
         );

      case 'GAME_OVER':
        return (
           <div className={styles.gameOverState}>
             {/* ... Game Over content ... */}
             <button
               className={styles.restartButton}
               onClick={() => {
                 // Use GameStateManager to restart
                 if (gameStateManager) {
                   gameStateManager.startGame();
                 } else {
                   console.error("GameStateManager not available for restart");
                 }
               }}
               aria-label="Play Again"
             >
               Play Again
             </button>
             {/* ... Other game over buttons ... */}
           </div>
        );

      case 'LOADING':
         // This component is not rendered during LOADING state as GameCanvas controls visibility
         // We could return null here, but parent visibility control is better
         console.log("GameStateDisplay rendering LOADING state view (parent should hide this)")
         return (
           <div className={styles.loadingState}>
              {/* Empty container for LOADING state - parent should hide this */}
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
      classes += ` ${styles.transitioning}`;
    }
    // Add state-specific class for styling if needed
    classes += ` ${styles[`state${currentState}`]}`;
    return classes;
  };

   // No longer need to check PLAYING or LOADING state here
   // The parent component (GameCanvas) controls visibility
   // This component is only rendered when needed

  return (
    <div className={getStateClasses()}>
      {renderStateContent()}
    </div>
  );
}