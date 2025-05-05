'use client';

import { useState, useEffect } from 'react';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import QualitySettings from './QualitySettings';
import AuthModal from '@/components/auth/AuthModal';
import { isAuthenticated, mockUserSession } from '@/lib/auth/clerkClient';

interface GameUIProps {
  isPlaying: boolean;
  onStartGame: () => void;
}

export default function GameUI({ isPlaying, onStartGame }: GameUIProps) {
  const { state, score, resetGame, changeState } = useGame();
  const [showControls, setShowControls] = useState(false);
  const [showQualitySettings, setShowQualitySettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Handle pause with ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state === GameState.PLAYING) {
          changeState(GameState.PAUSED);
        } else if (state === GameState.PAUSED) {
          changeState(GameState.PLAYING);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, changeState]);
  
  // Check authentication status on mount
  useEffect(() => {
    setIsSignedIn(isAuthenticated());
  }, []);

  if (state === GameState.PLAYING) {
    return null; // HUD is rendered separately during gameplay
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-blue-900/90 p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
        {state === GameState.MENU && (
          <>
            <h1 className="text-4xl font-bold text-white mb-6">NEMO Runner</h1>
            <p className="text-blue-100 mb-8">
              Navigate through beautiful underwater environments, avoid obstacles, and collect bubbles to achieve the highest score!
            </p>
            <div className="flex flex-col space-y-4">
              <button
                onClick={onStartGame}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300 text-lg font-medium"
              >
                Start Game
              </button>
              <button
                onClick={() => setShowControls(!showControls)}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors duration-300"
              >
                {showControls ? 'Hide Controls' : 'Show Controls'}
              </button>
              <button
                onClick={() => setShowQualitySettings(true)}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors duration-300"
              >
                Quality Settings
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className={`px-8 py-3 ${
                  isSignedIn 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white rounded-full transition-colors duration-300`}
              >
                {isSignedIn ? 'Account Settings' : 'Sign In / Register'}
              </button>
            </div>

            {showControls && (
              <div className="mt-6 p-4 bg-blue-800/50 rounded-lg text-left">
                <h3 className="text-xl font-bold text-blue-100 mb-2">Controls:</h3>
                <ul className="text-blue-200 space-y-2">
                  <li>⬆️ Up Arrow: Move up</li>
                  <li>⬇️ Down Arrow: Move down</li>
                  <li>⬅️ Left Arrow: Move left</li>
                  <li>➡️ Right Arrow: Move right</li>
                  <li>Space: Activate power-up</li>
                  <li>ESC: Pause game</li>
                </ul>
              </div>
            )}
            
            {isSignedIn && (
              <div className="mt-6 text-center text-blue-200">
                <p>Welcome back, {mockUserSession.username}!</p>
                <p className="text-green-400">You have 10 games available today.</p>
              </div>
            )}
          </>
        )}

        {state === GameState.PAUSED && (
          <>
            <h2 className="text-3xl font-bold text-white mb-6">Game Paused</h2>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => changeState(GameState.PLAYING)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300"
              >
                Resume Game
              </button>
              <button
                onClick={() => setShowQualitySettings(true)}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors duration-300"
              >
                Quality Settings
              </button>
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-300"
              >
                Quit Game
              </button>
            </div>
          </>
        )}

        {state === GameState.GAME_OVER && (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
            <p className="text-2xl text-blue-100 mb-6">Score: {score}</p>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  resetGame();
                  onStartGame();
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300"
              >
                Play Again
              </button>
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors duration-300"
              >
                Main Menu
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Quality Settings Dialog */}
      <QualitySettings
        isVisible={showQualitySettings}
        onClose={() => setShowQualitySettings(false)}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isVisible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={() => setIsSignedIn(true)}
      />
    </div>
  );
}