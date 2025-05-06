'use client';

import { useEffect, useRef } from 'react';
import styles from '@/styles/Game.module.css';
import { initGame } from '@/game/core/GameEngine';
import GameStateDisplay from './GameStateDisplay';
import GameUI from './GameUI';
import EnhancedUI from './EnhancedUI';
import LoadingScreen from './LoadingScreen';
import AudioControls from './AudioControls';
import DebugUI from './DebugUI';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize game and get cleanup function
    const cleanup = initGame(canvasRef.current);
    
    // Clean up resources when component unmounts
    return () => {
      cleanup();
    };
  }, []);
  
  return (
    <div className={styles.gameContainer}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <EnhancedUI />
      {/* Original UI components - may be hidden depending on game state */}
      <GameUI />
      <GameStateDisplay initialState="MENU" />
      <LoadingScreen />
      
      {/* Always visible components - we'll only keep audio controls here */}
      <div className={styles.audioControlsContainer} style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 5000 }}>
        <AudioControls />
      </div>
      
      {/* Debug UI that always shows score and pause button */}
      <DebugUI />
    </div>
  );
}