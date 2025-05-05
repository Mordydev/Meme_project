'use client';

import { useEffect, useRef } from 'react';
import styles from '@/styles/Game.module.css';
import { initGame } from '@/game/core/GameEngine';

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
  
  return <canvas ref={canvasRef} className={styles.canvas} />;
}