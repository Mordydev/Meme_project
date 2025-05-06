'use client';

import { useState, useEffect } from 'react';
import eventBus from '@/game/core/EventSystem';
import gameStateManager from '@/game/core/GameStateManager';

/**
 * Debug UI component that will always display score and pause button
 * regardless of game state
 */
export default function DebugUI() {
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    console.log("DebugUI mounted - setting up event listeners");
    
    // Listen for score updates
    const handleScoreChange = (newScore: number) => {
      console.log("DebugUI: Score changed:", newScore);
      setScore(newScore);
    };
    
    // Listen for distance updates
    const handleDistanceChange = (newDistance: number) => {
      console.log("DebugUI: Distance changed:", newDistance);
      setDistance(newDistance);
    };
    
    // Subscribe to events
    eventBus.on('score-change', handleScoreChange);
    eventBus.on('distance-change', handleDistanceChange);
    
    // Cleanup
    return () => {
      eventBus.off('score-change', handleScoreChange);
      eventBus.off('distance-change', handleDistanceChange);
    };
  }, []);
  
  // Handle pause button click
  const handlePause = () => {
    console.log("DebugUI: Pause button clicked, current state:", gameStateManager.state);
    if (gameStateManager.state === 'PLAYING') {
      gameStateManager.pauseGame();
    } else if (gameStateManager.state === 'PAUSED') {
      gameStateManager.resumeGame();
    }
  };
  
  return (
    <>
      {/* Score Display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '3px solid gold',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '20px',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        zIndex: 10000,
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
        minWidth: '120px',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '0.8rem', marginBottom: '5px', color: 'gold' }}>SCORE</div>
        {score.toLocaleString()}
      </div>
      
      {/* Distance Display */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '5px 15px',
        borderRadius: '15px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        zIndex: 10000,
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
        pointerEvents: 'none'
      }}>
        {Math.floor(distance)}m
      </div>
      
      {/* Pause Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        pointerEvents: 'auto'
      }}>
        <button 
          onClick={handlePause}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '3px solid rgba(255, 255, 255, 0.9)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            pointerEvents: 'auto'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>⏸️</span>
          <span>PAUSE</span>
        </button>
        <div style={{
          color: 'white',
          textAlign: 'center',
          fontSize: '0.8rem',
          marginTop: '5px',
          textShadow: '0 0 5px black'
        }}>
          ESC or P to pause
        </div>
      </div>
    </>
  );
}