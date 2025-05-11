'use client'; // This is a client component

import React, { useRef, useEffect, useState } from 'react';
import { GameEngine, GameState } from '@/lib/game/GameEngine'; // Adjust path if needed

export default function GameCanvas() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null); // Ref for GameEngine instance
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!canvasMountRef.current) {
      const errMsg = "GameCanvas: Canvas mount point not available.";
      console.error(errMsg);
      setError(errMsg);
      setIsLoading(false);
      return;
    }

    // Ensure only one engine instance is created
    if (gameEngineRef.current) {
        console.log("GameCanvas: Engine already exists, skipping re-initialization.");
        setIsLoading(false); // Already loaded
        return;
    }
    
    // Clear previous content if any (e.g., from HMR or previous errors)
    while (canvasMountRef.current.firstChild) {
        canvasMountRef.current.removeChild(canvasMountRef.current.firstChild);
    }

    try {
      console.log("GameCanvas: Initializing GameEngine...");
      const engine = new GameEngine(canvasMountRef.current!, {
        // Callback for score updates
        onScoreUpdate: (score) => setScore(score),
        onGameOver: () => {
          console.log("GameCanvas: Received onGameOver callback.");
          setIsGameOver(true);
        }
      });
      // Expose for debug helpers
      // @ts-ignore
      window.__gameEngine = engine;
      gameEngineRef.current = engine;

      engine.initialize();
      engine.start();
      setIsLoading(false);
      console.log("GameCanvas: GameEngine started.");

      const handleResize = () => engine.handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        console.log("GameCanvas: Cleaning up GameEngine...");
        window.removeEventListener('resize', handleResize);
        if (gameEngineRef.current) {
          // Unregister score callback
          if (gameEngineRef.current.getScoringSystem()) {
            gameEngineRef.current.getScoringSystem().unregisterScoreUpdateCallback(setScore);
          }
          gameEngineRef.current.dispose();
          gameEngineRef.current = null; // Clear the ref
        }
        // The GameEngine's dispose should handle removing the canvas child
        console.log("GameCanvas: Cleanup complete.");
        setIsGameOver(false);
      };
    } catch (e: any) {
      const errMsg = `GameCanvas: Failed to initialize GameEngine: ${e.message}`;
      console.error(errMsg, e);
      setError(errMsg);
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  const handleRestart = () => {
    if (gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.GAME_OVER) {
      console.log("GameCanvas: Restarting game...");
      gameEngineRef.current.resetGame();
      gameEngineRef.current.start();
      setIsGameOver(false);
    } else if (gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.READY) {
      gameEngineRef.current.start();
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '20px' }}>
          Loading 3D Scene...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'red', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
          Error: {error}
        </div>
      )}
      <div ref={canvasMountRef} style={{ width: '100%', height: '100%' }} />

      {/* Score Display */}
      {!isLoading && !error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px'
        }}>
          Score: {score}
        </div>
      )}

      {isGameOver && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
          padding: '20px', borderRadius: '10px', textAlign: 'center'
        }}>
          <h2>Game Over!</h2>
          <p style={{ fontSize: '20px', marginBottom: '15px' }}>Final Score: {score}</p>
          <button
            onClick={handleRestart}
            style={{ padding: '10px 20px', marginTop: '10px', fontSize: '16px', cursor: 'pointer' }}
          >
            Restart
          </button>
        </div>
      )}
      {gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.READY && !isGameOver && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <button onClick={handleRestart} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>Start Game</button>
        </div>
      )}
    </div>
  );
} 