'use client';

import { useState } from 'react';
import PerformanceDebugUI from './PerformanceDebugUI';
import gameStateManager from '@/game/core/GameStateManager';

/**
 * Developer debug UI component that shows performance metrics and debugging tools
 * Only appears when enabled via URL parameter or localStorage setting
 */
export default function DevDebugUI() {
  const [showPerformanceUI, setShowPerformanceUI] = useState(false);
  const [showGameStateUI, setShowGameStateUI] = useState(false);
  
  // Toggle performance UI
  const togglePerformanceUI = () => {
    setShowPerformanceUI(!showPerformanceUI);
  };
  
  // Toggle game state UI
  const toggleGameStateUI = () => {
    setShowGameStateUI(!showGameStateUI);
  };
  
  // Force game state
  const setGameState = (state: string) => {
    switch (state) {
      case 'MENU':
        gameStateManager.transitionToMenu();
        break;
      case 'READY':
        gameStateManager.prepareGame();
        break;
      case 'PLAYING':
        gameStateManager.startGame();
        break;
      case 'PAUSED':
        gameStateManager.pauseGame();
        break;
      case 'GAME_OVER':
        gameStateManager.gameOver();
        break;
    }
  };
  
  return (
    <div style={{
      position: 'absolute',
      top: '100px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #444',
      color: 'white',
      borderRadius: '10px',
      padding: '10px',
      zIndex: 10001,
      maxWidth: '350px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#88f' }}>
        Developer Tools
      </h2>
      
      {/* Debug tool buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '5px',
        marginBottom: '10px'
      }}>
        <button 
          onClick={togglePerformanceUI}
          style={{
            backgroundColor: showPerformanceUI ? '#2a6' : '#333',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showPerformanceUI ? 'Hide Performance Debug' : 'Show Performance Debug'}
        </button>
        
        <button 
          onClick={toggleGameStateUI}
          style={{
            backgroundColor: showGameStateUI ? '#2a6' : '#333',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showGameStateUI ? 'Hide Game State Debug' : 'Show Game State Debug'}
        </button>
      </div>
      
      {/* Game state controls */}
      <div style={{ 
        display: showGameStateUI ? 'block' : 'none',
        marginBottom: '10px' 
      }}>
        <h3 style={{ margin: '5px 0', fontSize: '1rem', color: '#f88' }}>
          Game State
        </h3>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '5px'
        }}>
          <button 
            onClick={() => setGameState('MENU')}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Menu
          </button>
          
          <button 
            onClick={() => setGameState('READY')}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Ready
          </button>
          
          <button 
            onClick={() => setGameState('PLAYING')}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Playing
          </button>
          
          <button 
            onClick={() => setGameState('PAUSED')}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Paused
          </button>
          
          <button 
            onClick={() => setGameState('GAME_OVER')}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Game Over
          </button>
        </div>
        
        <div style={{ 
          marginTop: '10px',
          fontSize: '0.9rem'
        }}>
          Current State: <span style={{ color: '#8f8' }}>{gameStateManager.state}</span>
        </div>
      </div>
      
      {/* Performance debug UI */}
      {showPerformanceUI && <PerformanceDebugUI visible={true} />}
    </div>
  );
}