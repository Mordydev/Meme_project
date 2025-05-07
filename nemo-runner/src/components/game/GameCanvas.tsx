'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from '@/styles/Game.module.css';
import { initGame } from '@/game/core/GameEngine';
import gameStartController from '@/game/core/GameStartController';
import GameStateDisplay from './GameStateDisplay';
import GameUI from './GameUI';
import EnhancedUI from './EnhancedUI';
import LoadingScreen from './LoadingScreen';
import AudioControls from './AudioControls';
import DebugUI from './DebugUI';
import eventBus from '@/game/core/EventSystem';
import { safeEnvironmentData, safeGameStateData, safeNoOp } from '@/game/utils/SafeDefaults';

// Maximum number of initialization retries
const MAX_INIT_RETRIES = 3;

// Global singleton tracker to ensure only one GameCanvas initializes WebGL
// This prevents multiple instances from competing for WebGL contexts
let globalInitialized = false;

// Use memo to prevent re-rendering that could cause multiple initializations
export default React.memo(function GameCanvas() {
  // Use state for canvas reference to force re-render when recreating it
  const [canvasKey, setCanvasKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<string>('MENU');
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Track component mount state to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Track initialization retries and errors
  const initRetries = useRef(0);
  const [criticalError, setCriticalError] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  // Add an initialization lock to prevent multiple simultaneous attempts
  const isInitializing = useRef(false);
  
  // Always show GameStateDisplay initially, but remove it permanently once we're in playing state
  const [hasEnteredPlayingState, setHasEnteredPlayingState] = useState(false);
  
  // Function to recreate canvas entirely with a new DOM element
  const recreateCanvas = useCallback(() => {
    console.log('GameCanvas: Recreating canvas element to clear WebGL context');
    
    // Clear any flags on the existing canvas
    if (canvasRef.current) {
      // Clear all custom properties
      delete (canvasRef.current as any).__gameInitAttempted;
      delete (canvasRef.current as any).__webGLContextCreated;
      
      // Try to manually lose context if possible
      try {
        const gl = canvasRef.current.getContext('webgl') || canvasRef.current.getContext('experimental-webgl');
        if (gl) {
          // Type check to ensure gl has getExtension method
          const context = gl as WebGLRenderingContext;
          if (typeof context.getExtension === 'function') {
            const ext = context.getExtension('WEBGL_lose_context');
            if (ext) {
              console.log('GameCanvas: Successfully forcing WebGL context loss before recreating canvas');
              ext.loseContext();
            }
          }
        }
      } catch (e) {
        console.warn('GameCanvas: Error forcing context loss before recreation:', e);
      }
    }
    
    // Force React to create a new canvas element by updating key
    // This is the safest approach to completely clear WebGL context
    setCanvasKey(prev => prev + 1);
  }, []);
  
  // Emergency fallback UI when WebGL isn't available
  const activateFallbackMode = useCallback(() => {
    console.warn('GameCanvas: Activating fallback mode due to WebGL initialization failures');
    
    setFallbackMode(true);
    
    // Send synthetic environment data for UI components to avoid 'trim' errors
    setTimeout(() => {
      try {
        eventBus.emit('game-state-change', {
          from: 'LOADING',
          to: 'MENU',
          data: safeGameStateData,
          fallbackMode: true
        });
        
        eventBus.emit('environment-change-complete', {
          type: 'reef', 
          progress: 1
        });
      } catch (e) {
        console.error('Error emitting fallback events:', e);
      }
    }, 100);
    
    return safeNoOp;
  }, []);
  
  // Initialize game with error handling, retries, and React Strict Mode awareness
  const initializeGame = useCallback(async () => {
    console.log('GameCanvas: Initializing game...');
    
    // Only log exact dimensions once at the start of initialization
    if (canvasRef.current) {
      console.log(`GameCanvas: Initial canvas dimensions: ${canvasRef.current.clientWidth}x${canvasRef.current.clientHeight}`);
    }
    
    // Check global initialization flag to prevent multiple instances
    if (globalInitialized) {
      console.warn('GameCanvas: Another instance already initialized WebGL. Activating fallback mode.');
      return activateFallbackMode();
    }
    
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing.current) {
      console.log('GameCanvas: Initialization already in progress, skipping this attempt');
      return;
    }
    
    // Set initialization lock
    isInitializing.current = true;
    
    if (!canvasRef.current) {
      console.error('GameCanvas: Canvas reference is null during initialization');
      isInitializing.current = false;
      return activateFallbackMode();
    }
    
    try {
      // Count retry attempts
      initRetries.current += 1;
      console.log(`GameCanvas: Initialization attempt ${initRetries.current} of ${MAX_INIT_RETRIES}`);
      
      // If we've exceeded retries, activate fallback mode
      if (initRetries.current > MAX_INIT_RETRIES) {
        console.error('GameCanvas: Maximum initialization retries exceeded, activating fallback mode');
        setCriticalError(true);
        isInitializing.current = false;
        return activateFallbackMode();
      }
      
      // Run cleanup first if there's an existing game instance
      if (cleanupRef.current) {
        console.log('GameCanvas: Running existing cleanup before re-initialization');
        try {
          cleanupRef.current();
        } catch (cleanupError) {
          console.warn('GameCanvas: Error during cleanup:', cleanupError);
        }
        cleanupRef.current = null;
      }
      
      // Add a flag to the canvas to detect React StrictMode double-render
      // This helps prevent initializing twice in development mode
      if (canvasRef.current) {
        if ((canvasRef.current as any).__gameInitAttempted) {
          console.warn('GameCanvas: React StrictMode double initialization detected. This initialization will be skipped.');
          isInitializing.current = false;
          return;
        }
        
        // Mark this canvas as having attempted initialization
        (canvasRef.current as any).__gameInitAttempted = true;
      }
      
      // For React 18+ in development mode, it's better NOT to recreate the canvas on every init,
      // as this can cause issues with StrictMode's double-effect execution
      // Instead, we'll rely on GameEngine's improved singleton handling
      
      // Measure canvas dimensions again to ensure it's fully initialized
      // This helps prevent the "300x150" default size problem
      if (canvasRef.current) {
        console.log(`GameCanvas: Pre-init canvas dimensions check: ${canvasRef.current.clientWidth}x${canvasRef.current.clientHeight}`);
        
        // Force a style-based dimension if it seems to be using default dimensions
        if (canvasRef.current.clientWidth <= 300 && canvasRef.current.clientHeight <= 150) {
          console.warn('GameCanvas: Canvas dimensions look like default (300x150), applying explicit styles');
          // Force dimensions based on parent container
          canvasRef.current.style.width = '100%';
          canvasRef.current.style.height = '100%';
        }
      }
      
      try {
        // Get the canvas element
        const canvas = canvasRef.current;
        
        if (!canvas) {
          throw new Error('Canvas is null after all checks - this should never happen');
        }
        
        // Initialize game systems first
        console.log('GameCanvas: Initializing game systems with GameStartController...');
        
        // Log dimensions once more right before initialization
        console.log(`GameCanvas: Final canvas dimensions for init: ${canvas.clientWidth}x${canvas.clientHeight}`);
        
        // First use the GameStartController to initialize core systems
        try {
          const initializePromise = gameStartController.initialize(canvas);
          
          // Listen for all-systems-ready event to know when to proceed
          const allSystemsReadyHandler = () => {
            console.log('GameCanvas: All systems ready, continuing with game initialization');
            
            // Now initialize game with the prepared canvas
            initGame(canvas).then(cleanup => {
              cleanupRef.current = cleanup;
            });
          };
          
          // Add the event listener the standard way instead of using once()
          eventBus.on('all-systems-ready', allSystemsReadyHandler);
          
          // Set up a timeout to ensure we don't get stuck waiting for the event
          const timeoutId = setTimeout(() => {
            // Clean up the event listener to prevent duplicate handlers
            eventBus.off('all-systems-ready', allSystemsReadyHandler);
            
            // If cleanup is still not set, proceed with initialization
            if (!cleanupRef.current && isMounted.current) {
              console.log('GameCanvas: Timeout - proceeding with game initialization anyway');
              initGame(canvas).then(cleanup => {
                if (isMounted.current) {
                  cleanupRef.current = cleanup;
                }
              });
            }
          }, 5000);
          
          // Wait for initialization to complete
          await initializePromise;
          
          // Clear the timeout since initialization completed
          clearTimeout(timeoutId);
        } catch (startControllerError) {
          console.error('Error initializing game systems:', startControllerError);
          throw startControllerError; // Re-throw to trigger retry logic
        }
        
        console.log('GameCanvas: Game initialized successfully');
        
        // Set global initialization flag
        globalInitialized = true;
        
        // Reset retry counter on success
        initRetries.current = 0;
        
        // Release initialization lock
        isInitializing.current = false;
      } catch (initError) {
        console.error('GameCanvas: Error initializing game:', initError);
        
        // Special handling for WebGL context errors
        const errorString = String(initError);
        const isWebGLContextError = 
          errorString.includes('WebGL context') || 
          errorString.includes('existing context') ||
          errorString.includes('WebGL');
        
        if (isWebGLContextError) {
          console.warn('GameCanvas: WebGL context error detected - will try recreation approach');
          
          // For WebGL context errors, recreate canvas and try again
          if (initRetries.current < MAX_INIT_RETRIES) {
            // Release lock before retry
            isInitializing.current = false;
            
            // CRITICAL: Recreate the canvas element entirely as a last resort for WebGL context errors
            console.log('GameCanvas: Recreating canvas for WebGL context error recovery');
            recreateCanvas();
            
            // Try again after a longer delay to ensure DOM updates and GC runs
            setTimeout(async () => {
              if (isMounted.current) {
                console.log('GameCanvas: Retrying after canvas recreation');
                await initializeGame();
              }
            }, 1000);
          } else {
            console.error('GameCanvas: Maximum initialization retries exceeded, activating fallback mode');
            setCriticalError(true);
            isInitializing.current = false;
            activateFallbackMode();
          }
        } else {
          // For other errors, retry without canvas recreation
          if (initRetries.current < MAX_INIT_RETRIES) {
            console.log(`GameCanvas: Retrying initialization (${initRetries.current}/${MAX_INIT_RETRIES})...`);
            
            // Release lock before retry
            isInitializing.current = false;
            
            setTimeout(async () => {
              if (isMounted.current) {
                await initializeGame();
              }
            }, 500);
          } else {
            console.error('GameCanvas: Maximum initialization retries exceeded, activating fallback mode');
            setCriticalError(true);
            isInitializing.current = false;
            activateFallbackMode();
          }
        }
      }
    } catch (error) {
      console.error('GameCanvas: Critical error during initialization:', error);
      setCriticalError(true);
      isInitializing.current = false;
      return activateFallbackMode();
    }
  }, [activateFallbackMode, recreateCanvas]);
  
  // Handle game state changes
  const handleStateChange = useCallback((data: { from: string; to: string; }) => {
    if (!isMounted.current) return;
    
    console.log('GameCanvas received state change:', data.from, '->', data.to);
    setGameState(data.to);
    
    // Check for error conditions that might require reinitializing the game
    if (data.to === 'ERROR') {
      console.log('GameCanvas: Error state detected, attempting to reinitialize game');
      // Small delay to ensure previous instance is fully cleaned up
      setTimeout(async () => {
        if (isMounted.current) {
          await initializeGame();
        }
      }, 100);
    }
  }, [initializeGame]);
  
  // Main initialization effect with improved context handling
  useEffect(() => {
    console.log('GameCanvas: Component mounted');
    isMounted.current = true;
    
    // Important: Check canvas reference before doing anything else
    if (!canvasRef.current) {
      console.error('GameCanvas: Canvas reference is null on mount!');
      return;
    }
    
    console.log('GameCanvas: Got valid canvas on mount with dimensions:', 
      canvasRef.current.clientWidth, 'x', canvasRef.current.clientHeight);
    
    // Store canvas dimension in dataset for easier debugging
    canvasRef.current.dataset.width = canvasRef.current.clientWidth.toString();
    canvasRef.current.dataset.height = canvasRef.current.clientHeight.toString();
    
    // Initialize game with a small delay to ensure canvas is fully set up
    // This helps avoid the "300x150" default dimension problem
    const initTimeout = setTimeout(async () => {
      if (isMounted.current) {
        console.log('GameCanvas: Delayed initialization starting...');
        await initializeGame();
      }
    }, 50); // Small delay to ensure canvas is ready
    
    // Subscribe to game state changes
    eventBus.on('game-state-change', handleStateChange);
    
    // Setup WebGL context lost/restored handlers with improved error handling
    const handleContextLost = (event: WebGLContextEvent) => {
      console.log('GameCanvas: WebGL context lost', event);
      event.preventDefault(); // Allow context restoration
      
      // Add a visual indicator for context loss
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const indicator = document.createElement('div');
          indicator.id = 'webgl-context-lost-indicator';
          indicator.style.position = 'absolute';
          indicator.style.top = '20px';
          indicator.style.left = '20px';
          indicator.style.backgroundColor = 'rgba(255,0,0,0.7)';
          indicator.style.color = 'white';
          indicator.style.padding = '10px';
          indicator.style.borderRadius = '5px';
          indicator.textContent = 'WebGL context lost. Attempting to recover...';
          parent.appendChild(indicator);
        }
      }
    };
    
    const handleContextRestored = (event: WebGLContextEvent) => {
      console.log('GameCanvas: WebGL context restored', event);
      
      // Remove the visual indicator
      const indicator = document.getElementById('webgl-context-lost-indicator');
      if (indicator && indicator.parentElement) {
        indicator.parentElement.removeChild(indicator);
      }
      
      // Reinitialize the game when context is restored, if still mounted
      if (isMounted.current) {
        console.log('GameCanvas: Reinitializing game after context restore');
        // Use an async IIFE to handle the async call
        (async () => {
          await initializeGame();
        })();
      }
    };
    
    if (canvasRef.current) {
      console.log('GameCanvas: Adding WebGL context event listeners');
      canvasRef.current.addEventListener('webglcontextlost', handleContextLost as EventListener);
      canvasRef.current.addEventListener('webglcontextrestored', handleContextRestored as EventListener);
    }
    
    // Clean up everything when component unmounts
    return () => {
      console.log('GameCanvas: Component unmounting, cleaning up resources');
      
      // Mark component as unmounted immediately
      isMounted.current = false;
      
      // Clear initialization timeout if it hasn't fired yet
      clearTimeout(initTimeout);
      
      // Unsubscribe from events first to prevent new event handling during cleanup
      console.log('GameCanvas: Unsubscribing from events');
      eventBus.off('game-state-change', handleStateChange);
      
      // Remove WebGL context handlers
      if (canvasRef.current) {
        console.log('GameCanvas: Removing WebGL context event listeners');
        canvasRef.current.removeEventListener('webglcontextlost', handleContextLost as EventListener);
        canvasRef.current.removeEventListener('webglcontextrestored', handleContextRestored as EventListener);
        
        // IMPORTANT: Clear tracking flags first
        try {
          console.log('GameCanvas: Clearing WebGL context tracking flags');
          delete (canvasRef.current as any).__gameInitAttempted;
          delete (canvasRef.current as any).__webGLContextCreated;
          
          // We now AVOID getting the WebGL context directly here, because:
          // 1. If there's already a context, we'll get it but may not properly identify it
          // 2. If there's no context, we'll create one, causing problems for future initialization
          // 3. The cleanup function from initGame should have already properly cleaned up the WebGL context
          
          // Instead, we rely on the cleanup function in GameEngine to handle WebGL context cleanup
          console.log('GameCanvas: Relying on GameEngine cleanup for WebGL context disposal');
        } catch (e) {
          console.warn('GameCanvas: Error clearing context tracking flags:', e);
        }
      }
      
      // Run game cleanup with proper error handling
      if (cleanupRef.current) {
        console.log('GameCanvas: Running game cleanup function');
        try {
          cleanupRef.current();
        } catch (error) {
          console.error('GameCanvas: Error during game cleanup:', error);
        } finally {
          cleanupRef.current = null;
        }
      } else {
        console.log('GameCanvas: No cleanup function to run');
      }
      
      // Clean up the GameStartController
      try {
        console.log('GameCanvas: Disposing GameStartController');
        if (gameStartController) {
          gameStartController.dispose();
        }
      } catch (controllerError) {
        console.error('GameCanvas: Error disposing GameStartController:', controllerError);
      }
      
      // Clean up any event listeners that might have been added
      try {
        eventBus.off('all-systems-ready');
      } catch (eventCleanupError) {
        console.warn('GameCanvas: Error cleaning up event listeners:', eventCleanupError);
      }
      
      // Final cleanup: remove any remaining WebGL context lost indicators
      const indicator = document.getElementById('webgl-context-lost-indicator');
      if (indicator && indicator.parentElement) {
        indicator.parentElement.removeChild(indicator);
      }
      
      console.log('GameCanvas: Cleanup complete');
    };
  }, [initializeGame, handleStateChange]);
  
  // Track when player has entered playing state
  useEffect(() => {
    if (gameState === 'PLAYING' && !hasEnteredPlayingState && isMounted.current) {
      // Once we've entered playing state, mark it so we never show the state display again
      // Add a small delay to ensure the state transition is complete
      const timer = setTimeout(() => {
        if (isMounted.current) {
          console.log('GameCanvas: Marking playing state entered after delay');
          setHasEnteredPlayingState(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, hasEnteredPlayingState]);
  
  // Only show GameStateDisplay when we've never entered playing state
  const showStateDisplay = !hasEnteredPlayingState;
  
  // Add error boundary behavior
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('GameCanvas: Unhandled error caught:', event.error);
      setHasError(true);
      
      // Attempt recovery
      setTimeout(async () => {
        if (isMounted.current) {
          console.log('GameCanvas: Attempting recovery from error');
          setHasError(false);
          await initializeGame();
        }
      }, 1000);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [initializeGame]);
  
  // Show error or fallback UI when WebGL isn't available or initialization fails repeatedly
  if (criticalError || hasError) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.errorMessage}>
          <h2>Game Error</h2>
          <p>{criticalError ? 
            "Unable to initialize WebGL. Your browser may not support 3D graphics or has reached WebGL context limits." : 
            "Something went wrong. Attempting to recover..."}</p>
          {!criticalError && (
            <button onClick={async () => {
              setHasError(false);
              initRetries.current = 0;
              await initializeGame();
            }}>Restart Game</button>
          )}
          {criticalError && (
            <div>
              <p>Try closing other browser tabs or restarting your browser to free up resources.</p>
              <button onClick={() => window.location.reload()}>Reload Page</button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Fallback mode shows limited UI without WebGL
  if (fallbackMode) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.fallbackContainer}>
          <h2>Nemo Runner</h2>
          <p>Limited functionality mode - WebGL initialization failed</p>
          
          {/* Minimal UI that doesn't depend on WebGL */}
          <GameUI />
          {showStateDisplay && <GameStateDisplay initialState="MENU" />}
          
          <div style={{marginTop: '20px'}}>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal rendering with WebGL
  return (
    <div className={styles.gameContainer}>
      {/* Use key to force canvas recreation when needed */}
      <canvas key={`canvas-${canvasKey}`} ref={canvasRef} className={styles.canvas} />
      <EnhancedUI />
      {/* Original UI components - may be hidden depending on game state */}
      <GameUI />
      {showStateDisplay && <GameStateDisplay initialState="MENU" />}
      <LoadingScreen />
      
      {/* Always visible components - we'll only keep audio controls here */}
      <div className={styles.audioControlsContainer} style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 5000 }}>
        <AudioControls />
      </div>
      
      {/* Debug UI that always shows score and pause button */}
      <DebugUI />
    </div>
  );
});  // Close the React.memo function