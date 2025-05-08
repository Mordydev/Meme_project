'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/GameUI.module.css';
import gameStateManager, { GameState } from '@/game/core/GameStateManager';

/**
 * LoadingScreen - Displays a loading screen during state transitions
 * 
 * Features:
 * - Progress bar for asset loading
 * - Tips and hints during loading
 * - Smooth transitions between game states
 */
export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  // Game tips that appear during loading
  const gameTips = [
    "Collect bubbles to increase your score!",
    "Shield power-ups protect you from one hit.",
    "Magnets attract nearby bubbles to you.",
    "Each environment has unique obstacles and collectibles.",
    "Watch out for pufferfish, they expand when you get close!",
    "Tap with two fingers to pause the game on mobile.",
    "Press 'P' to pause the game on desktop.",
    "The deeper you go, the more challenging it becomes!",
    "Some obstacles can be destroyed with power-ups.",
    "Look for hidden paths between obstacles."
  ];
  
  useEffect(() => {
    // Failsafe timeout reference
    let failsafeTimeout: NodeJS.Timeout | null = null;
    
    // Show loading screen when game enters LOADING state
    const handleGameStateChange = (data: { from: GameState; to: GameState }) => {
      // Clear any existing failsafe timeout
      if (failsafeTimeout) {
        clearTimeout(failsafeTimeout);
        failsafeTimeout = null;
      }
      
      if (data.to === 'LOADING') {
        // Choose a random tip
        const randomTip = gameTips[Math.floor(Math.random() * gameTips.length)];
        setCurrentTip(randomTip);
        setProgress(0);
        setIsVisible(true);
        
        // Add a log-only failsafe timeout to detect possible stuck states
        // without forcing state transitions
        failsafeTimeout = setTimeout(() => {
          console.log('LoadingScreen: Failsafe timeout triggered');
          if (gameStateManager.state === 'LOADING') {
            console.warn('LoadingScreen: Still in LOADING state after timeout. No longer forcing state change.');
          }
        }, 10000); // 10 second timeout for logging only
      } else {
        setIsVisible(false);
      }
    };
    
    // Handle asset loading progress updates
    const handleLoadingProgress = (data: { progress: number }) => {
      setProgress(data.progress);
      
      // If loading is complete (100%), just update the UI
      // The state transition will be handled by GameStartController
      if (data.progress >= 100) {
        console.log('LoadingScreen: Loading complete (100%)');
        // Optional visual fade-out can remain, but no state change
        setTimeout(() => {
          if (gameStateManager.state === 'LOADING') {
            // Only log that we're waiting for state change
            console.log('LoadingScreen: Awaiting state change from LOADING');
          }
        }, 1000);
      }
      
      // Update tip every 25% of progress
      if (data.progress % 25 === 0) {
        const randomTip = gameTips[Math.floor(Math.random() * gameTips.length)];
        setCurrentTip(randomTip);
      }
    };
    
    // Subscribe to events
    eventBus.on('game-state-change', handleGameStateChange);
    eventBus.on('asset-loading-progress', handleLoadingProgress);
    
    // Set initial state based on game state manager
    setIsVisible(gameStateManager.state === 'LOADING');
    
    // Cleanup
    return () => {
      eventBus.off('game-state-change', handleGameStateChange);
      eventBus.off('asset-loading-progress', handleLoadingProgress);
      
      // Clean up failsafe timeout if it exists
      if (failsafeTimeout) {
        clearTimeout(failsafeTimeout);
        failsafeTimeout = null;
      }
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <h2>Loading...</h2>
        
        <div className={styles.loadingBar}>
          <div 
            className={styles.loadingBarFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className={styles.loadingProgress}>
          {Math.floor(progress)}%
        </div>
        
        <div className={styles.loadingTip}>
          <span className={styles.tipLabel}>TIP:</span> {currentTip}
        </div>
      </div>
    </div>
  );
}

// Import for event bus
import eventBus from '@/game/core/EventSystem';