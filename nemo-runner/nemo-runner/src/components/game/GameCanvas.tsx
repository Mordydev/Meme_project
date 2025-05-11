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
          fontSize: '32px', // Larger font
          fontWeight: 'bold',
          backgroundColor: 'rgba(0,0,0,0.7)', // More opaque background
          padding: '12px 20px', // More padding
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(255,255,255,0.3)', // Subtle glow
          border: '2px solid rgba(255,255,255,0.3)', // Border for visibility
          zIndex: 100 // Ensure it's on top
        }}>
          Score: {score}
        </div>
      )}

      {isGameOver && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '30px',
          borderRadius: '20px',
          textAlign: 'center',
          border: '3px solid rgba(255,255,255,0.4)',
          boxShadow: '0 0 30px rgba(0,0,0,0.8)',
          minWidth: '300px'
        }}>
          <h2 style={{ fontSize: '36px', margin: '0 0 20px 0' }}>Game Over!</h2>
          <div style={{
            fontSize: '28px',
            margin: '25px 0',
            padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '10px',
            fontWeight: 'bold'
          }}>
            Final Score: <span style={{ color: '#ffcc00' }}>{score}</span>
          </div>
          <button
            onClick={handleRestart}
            style={{
              padding: '12px 30px',
              margin: '20px 0 10px 0',
              fontSize: '20px',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: '0.3s'
            }}
          >
            Restart
          </button>
        </div>
      )}
      {gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.READY && !isGameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 0 30px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          <h2 style={{ color: 'white', marginTop: 0, textAlign: 'center' }}>Nemo Runner</h2>
          <button
            onClick={handleRestart}
            style={{
              padding: '15px 30px',
              fontSize: '22px',
              cursor: 'pointer',
              backgroundColor: '#4169E1', // Royal Blue
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: '0.3s'
            }}
          >
            Start Game
          </button>
          <p style={{ color: 'white', textAlign: 'center', marginBottom: 0 }}>Collect bubbles and coins for points!</p>
        </div>
      )}
    </div>
  );
} 