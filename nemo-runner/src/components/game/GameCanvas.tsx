'use client';

import { useEffect, useRef } from 'react';
import styles from '@/styles/Game.module.css';
import { initGame } from '@/game/core/GameEngine';
import GameStateDisplay from './GameStateDisplay';
import GameUI from './GameUI';
import EnhancedUI from './EnhancedUI';
import LoadingScreen from './LoadingScreen';

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
      <GameUI />
      <GameStateDisplay initialState="MENU" />
      <LoadingScreen />
    </div>
  );
}