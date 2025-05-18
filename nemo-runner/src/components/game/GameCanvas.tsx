'use client'; // This is a client component

import React, { useRef, useEffect, useState, memo } from 'react';
import { GameEngine, GameState, ActivePowerUpInfo, PowerUpType } from '@/lib/game/GameEngine'; // Adjust path if needed
import { configSystem } from '@/lib/game/core/ConfigurationSystem';

// Define icons and colors for power-ups
const powerUpIcons: Record<PowerUpType, string> = {
  shield: '🛡️',
  magnet: '🧲',
  doublescore: '2✖️'
};

const powerUpColors: Record<PowerUpType, string> = {
  shield: '#00ccff', // Cyan
  magnet: '#ff69b4', // Pink
  doublescore: '#ffd700' // Gold
};

// Create a component for the active power-ups display
interface ActivePowerUpsDisplayProps {
  activePowerUps: ActivePowerUpInfo[];
}

const ActivePowerUpsDisplay: React.FC<ActivePowerUpsDisplayProps> = memo(({ activePowerUps }) => {
  if (activePowerUps.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 100,
    }}>
      {activePowerUps.map(powerUp => (
        <div key={powerUp.type} style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px 15px',
          borderRadius: '10px',
          border: `3px solid ${powerUpColors[powerUp.type] || '#ffffff'}`,
          boxShadow: `0 0 15px ${powerUpColors[powerUp.type] || '#ffffff'}`, // Add glow
          animation: 'fadeIn 0.3s',
        }}>
          {/* Power-up icon with label */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: '12px'
          }}>
            <span style={{
              fontSize: '32px',
              marginBottom: '2px',
              filter: 'drop-shadow(0 0 5px white)'
            }}>
              {powerUpIcons[powerUp.type]}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: powerUpColors[powerUp.type] || 'white',
              textTransform: 'uppercase',
              textShadow: '0 0 3px black'
            }}>
              {powerUp.type === 'doublescore' ? 'DOUBLE SCORE' : powerUp.type.toUpperCase()}
            </span>
          </div>

          {/* Timer bar */}
          <div style={{
            width: '120px',
            height: '12px',
            backgroundColor: '#333',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid white'
          }}>
            <div style={{
              width: `${powerUp.remainingNormalizedTime * 100}%`,
              height: '100%',
              backgroundColor: powerUpColors[powerUp.type] || '#00ff00',
              borderRadius: '5px',
              transition: 'width 0.1s linear', // Smooth transition for the bar
              boxShadow: 'inset 0 0 5px white'
            }}></div>
          </div>
        </div>
      ))}
    </div>
  );
});
ActivePowerUpsDisplay.displayName = 'ActivePowerUpsDisplay';

// Create a component for game overlay (score, active power-ups, game over UI)
interface GameOverlayProps {
  score: number;
  isGameOver: boolean;
  activePowerUps: ActivePowerUpInfo[];
  onRestart: () => void;
  lives: number; // Add lives prop
}

const GameOverlay: React.FC<GameOverlayProps> = memo(({ score, isGameOver, activePowerUps, onRestart, lives }) => {
  return (
    <>
      {/* Score and Lives Display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(255,255,255,0.3)',
        border: '2px solid rgba(255,255,255,0.3)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
        }}>
          Score: {score}
          {activePowerUps.some(p => p.type === 'doublescore') && (
            <span style={{
              marginLeft: '10px',
              color: powerUpColors.doublescore,
              backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker background for contrast
              borderRadius: '5px',
              padding: '2px 10px', // Adjusted padding
              fontSize: '24px',
              fontWeight: 'bold',
              animation: 'pulse 1s infinite ease-in-out', // Smoother pulse
              border: `1px solid ${powerUpColors.doublescore}`, // Add a border
              boxShadow: `0 0 8px ${powerUpColors.doublescore}` // Add glow
            }}>
              ×2
            </span>
          )}
        </div>

        {/* Lives */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>
          Lives: <span style={{ color: lives === 1 ? '#ff3333' : '#66ff66' }}>{
            // Display heart emojis based on lives count
            Array(lives).fill('❤️').join(' ')
          }</span>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.7; transform: scale(1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Active Power-Ups Display */}
      {!isGameOver && <ActivePowerUpsDisplay activePowerUps={activePowerUps} />}

      {/* Game Over UI */}
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
            onClick={onRestart}
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
    </>
  );
});
GameOverlay.displayName = 'GameOverlay';

export default function GameCanvas() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null); // Ref for GameEngine instance
  const isHotReloadingRef = useRef<boolean>(false); // Track React Fast Refresh
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(
    configSystem.getPlayerInitialLives?.() ?? 3
  ); // Track player lives
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUpInfo[]>([]);
  const [screenFlash, setScreenFlash] = useState<{color: string, duration: number, key: number} | null>(null);

  // This effect runs on every render to detect Fast Refresh
  useEffect(() => {
    // If we already have a game engine, this might be a Fast Refresh
    if (gameEngineRef.current && !isHotReloadingRef.current) {
      console.log("GameCanvas: Fast Refresh detected, marking hot reload state");
      isHotReloadingRef.current = true;

      // Reset shader program cache to avoid "Cannot set properties of undefined" errors
      // that happen during Fast Refresh - but delay to let React finish its work
      setTimeout(() => {
        try {
          // The safest approach is to do a full renderer recreation on each Fast Refresh
          if (window.__gameEngine && typeof (window.__gameEngine as any).resetRendererAndShaders === 'function') {
            console.log("GameCanvas: Performing complete WebGL context reset after Fast Refresh");
            (window.__gameEngine as any).resetRendererAndShaders()
              .then(() => console.log("GameCanvas: Fast Refresh recovery completed successfully"))
              .catch((e: any) => console.warn("GameCanvas: Fast Refresh recovery failed:", e));
          } else {
            console.warn("GameCanvas: Cannot find resetRendererAndShaders method - Fast Refresh may cause WebGL errors");
          }
        } catch (e) {
          console.warn("GameCanvas: Error initiating Fast Refresh recovery:", e);
        }
      }, 250); // Longer delay to ensure React has completed its work
    }

    // Mark that we're not hot reloading after a longer delay
    // This helps distinguish between initial mount and actual hot reload
    const timerId = setTimeout(() => {
      isHotReloadingRef.current = false;
    }, 1500); // Longer delay to ensure recovery completes

    return () => clearTimeout(timerId);
  });

  // Main initialization effect (runs once)
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

      // Create error recovery handler
      const handleWebGLError = () => {
        // Only show error if we weren't already loading or had an error
        if (!isLoading && !error) {
          setError("WebGL context error occurred. Attempting to recover...");

          // Allow time for the recovery process
          setTimeout(() => {
            if (gameEngineRef.current) {
              // Check if engine is still valid
              if (gameEngineRef.current.getCurrentState() === GameState.PAUSED) {
                // If paused due to context loss, try to restart
                gameEngineRef.current.start();
                setError(null); // Clear error if restart succeeds
              }
            } else {
              setError("WebGL context could not be recovered. Please refresh the page.");
            }
          }, 2000);
        }
      };

      const engine = new GameEngine(canvasMountRef.current!, {
        // Callbacks for UI updates
        onScoreUpdate: (score) => setScore(score),
        onLivesUpdate: (livesCount) => setLives(livesCount),
        onGameOver: () => {
          console.log("GameCanvas: Received onGameOver callback.");
          setIsGameOver(true);
          setActivePowerUps([]); // Clear power-ups on game over
        },
        onActivePowerUpsUpdate: (powerUps) => setActivePowerUps(powerUps)
      });

      // Expose for debug helpers
      // @ts-ignore
      window.__gameEngine = engine;
      gameEngineRef.current = engine;

      // Add WebGL context error listeners to the canvas
      const canvas = canvasMountRef.current.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('webglcontextlost', handleWebGLError, false);
        canvas.addEventListener('webglcontexterror', handleWebGLError, false);
      }

      // Set up screen flash callback for hit effects
      const vfxService = engine.getVisualEffectsService?.();
      if (vfxService) {
        vfxService.setFlashCallback((color: string, duration: number) => {
          setScreenFlash({ color, duration, key: Date.now() }); // Use key for unique state updates
          setTimeout(() => setScreenFlash(null), duration);
        });
      }

      engine.initialize();
      engine.start();
      setIsLoading(false);
      console.log("GameCanvas: GameEngine started.");

      const handleResize = () => {
        if (gameEngineRef.current) {
          gameEngineRef.current.handleResize();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        // Check if this cleanup is due to Fast Refresh or actual unmount
        const isFastRefresh = isHotReloadingRef.current;

        console.log(`GameCanvas: Cleaning up GameEngine... (Fast Refresh: ${isFastRefresh})`);

        // Always remove event listeners
        window.removeEventListener('resize', handleResize);

        // Remove WebGL context event listeners
        if (canvas) {
          canvas.removeEventListener('webglcontextlost', handleWebGLError);
          canvas.removeEventListener('webglcontexterror', handleWebGLError);
        }

        if (gameEngineRef.current) {
          // During Fast Refresh, we don't want to fully dispose the engine
          // This prevents the ThreeJS "Cannot set properties of undefined" errors
          if (isFastRefresh) {
            console.log("GameCanvas: Fast Refresh detected during cleanup, preserving engine");

            // Only pause the game loop, don't dispose
            if (gameEngineRef.current.getCurrentState() === GameState.PLAYING) {
              // Just stop the animation loop
              gameEngineRef.current.stop();
            }

            // During Fast Refresh cleanup, don't attempt any WebGL operations at all
            // We'll simply preserve the engine reference and let the Fast Refresh detection effect
            // handle the proper WebGL state reset AFTER React has completed its work
            console.log("GameCanvas: Fast Refresh cleanup - preserving engine reference only");

            // Don't try to modify any WebGL state here - this is critical to prevent
            // "Cannot read properties of null (reading 'precision')" errors

            // The strategy is:
            // 1. During cleanup - just stop the game loop, don't touch WebGL
            // 2. After React re-renders - completely rebuild WebGL renderer with proper timing
            // 3. This prevents race conditions with React's reconciliation
          } else {
            // Full disposal for actual unmount
            console.log("GameCanvas: Full cleanup - not a Fast Refresh");

            // Unregister score callback
            if (gameEngineRef.current.getScoringSystem()) {
              gameEngineRef.current.getScoringSystem().unregisterScoreUpdateCallback(setScore);
            }

            try {
              // For full component unmount, perform proper cleanup
              gameEngineRef.current.dispose();
            } catch (disposeError) {
              console.warn("GameCanvas: Error during engine disposal:", disposeError);
            }

            gameEngineRef.current = null; // Clear the ref
          }
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
      setActivePowerUps([]); // Clear power-ups on restart
    } else if (gameEngineRef.current && gameEngineRef.current.getCurrentState() === GameState.READY) {
      gameEngineRef.current.start();
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#0C6B9C' }}>
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

      {/* Screen Flash Effect for Hits */}
      {screenFlash && (
        <div
          key={screenFlash.key}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: screenFlash.color,
            zIndex: 200, // Above all game elements
            pointerEvents: 'none', // Click through
            animation: `flashFade ${screenFlash.duration}ms ease-out`,
          }}
        />
      )}

      {/* Game Overlay with Score, Lives, and Power-Ups */}
      {!isLoading && !error && (
        <GameOverlay
          score={score}
          isGameOver={isGameOver}
          activePowerUps={activePowerUps}
          onRestart={handleRestart}
          lives={lives} // Pass lives to overlay
        />
      )}

      {/* Start Game UI */}
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
          <div style={{ color: 'white', textAlign: 'center', marginTop: '15px' }}>
            <p style={{ marginBottom: '5px' }}>Collect bubbles and coins for points!</p>
            <p style={{ marginBottom: '0px' }}>Look for power-ups: 🛡️ Shield, 🧲 Magnet, 2✖️ Double Score</p>
          </div>
        </div>
      )}
    </div>
  );
} 