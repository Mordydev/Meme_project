import * as THREE from 'three';
import eventBus from './EventSystem';
import InputHandler from './InputHandler';
import { GameLoop } from './GameLoop';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import { CollisionSystem } from './CollisionSystem';
import { Character } from '../entities/character/Character';
import { ObstacleManager } from '../entities/obstacles/ObstacleManager';
import { CollectibleManager } from '../entities/collectibles/CollectibleManager';
import { PowerUpEffects } from '../entities/collectibles/PowerUpEffects';
import { ProceduralEnvironment } from '../entities/environment/ProceduralEnvironment';
import { detectDeviceCapabilities, applyQualitySettings, configureGameSettings } from '../utils/DeviceUtils';
import gameStateManager, { GameState } from './GameStateManager';
import { WaterEffects } from '../entities/environment/WaterEffects';
// Import obstacle types
import { Obstacle } from '../entities/obstacles/Obstacle';
import { Shark } from '../entities/obstacles/Shark';
import { Jellyfish } from '../entities/obstacles/Jellyfish';
import { Pufferfish } from '../entities/obstacles/Pufferfish';
import { Clam } from '../entities/obstacles/Clam';

/**
 * Class to manage the overall game engine and systems integration
 */
export class GameEngine {
  // Core systems
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private assetManager: AssetManager;
  private audioManager: AudioManager;
  private gameLoop: GameLoop;
  private inputHandler: InputHandler;
  private deviceCapabilities: ReturnType<typeof detectDeviceCapabilities>;
  private gameSettings: ReturnType<typeof configureGameSettings>;
  
  // Game entities
  private player!: Character; // Initialized in initialize()
  private collisionSystem!: CollisionSystem;
  private obstacleManager!: ObstacleManager;
  private collectibleManager!: CollectibleManager;
  private powerUpEffects!: PowerUpEffects;
  private environment!: ProceduralEnvironment;
  private waterEffects!: WaterEffects;
  
  // Game state
  private playerSpeed = 10;
  private isInitialized = false;
  private isLoading = false;
  
  /**
   * Initialize the game engine
   */
  constructor(canvas: HTMLCanvasElement) {
    // Detect device capabilities
    this.deviceCapabilities = detectDeviceCapabilities();
    this.gameSettings = configureGameSettings(this.deviceCapabilities);
    
    // Set up Three.js
    this.renderer = this.setupRenderer(canvas);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x75c2f6); // Sky blue background
    this.camera = this.setupCamera();
    
    // Initialize asset manager
    this.assetManager = new AssetManager();
    
    // Initialize audio manager
    this.audioManager = AudioManager.getInstance();
    
    // Initialize input handler
    this.inputHandler = new InputHandler();
    
    // Set up game loop with empty functions initially
    this.gameLoop = new GameLoop({
      updateFn: () => {},
      fixedUpdateFn: () => {},
      renderFn: () => {},
      fixedTimeStep: 1/60 // 60 fps physics
    });
    
    // Register game state change listener
    eventBus.on('game-state-change', this.handleGameStateChange.bind(this));
    
    // Setup window resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Start in MENU state (early init is complete)
    gameStateManager.setState('MENU');
  }
  
  /**
   * Fully initialize game systems after asset loading
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isLoading) return;
    
    // Set loading state
    this.isLoading = true;
    gameStateManager.setState('LOADING');
    
    try {
      // Preload essential assets
      await this.loadAssets();
      
      // Initialize audio
      await this.audioManager.initialize(this.camera);
      // Set the AssetManager for the AudioManager
      this.audioManager.setAssetManager(this.assetManager);
      await this.audioManager.loadSoundEffects();
      
      // Add lighting 
      this.setupLighting();
      
      // Initialize environment
      const environmentQuality = this.deviceCapabilities.highEnd ? 'high' : 
                              this.deviceCapabilities.midRange ? 'medium' : 'low';
      this.environment = new ProceduralEnvironment(
        this.scene,
        this.renderer,
        this.assetManager
      );
      
      // Initialize water effects (now integrated with ProceduralEnvironment)
      // We'll keep the reference to be compatible with existing code
      this.waterEffects = this.environment.getWaterEffects();
      
      // Initialize player character
      this.player = new Character(this.scene, this.assetManager);
      
      // Initialize collision system
      this.collisionSystem = new CollisionSystem(this.player, false, this.scene);
      
      // Initialize obstacle manager with shared device capabilities
      this.obstacleManager = new ObstacleManager(
        this.scene, 
        this.collisionSystem,
        this.assetManager,
        this.deviceCapabilities // Pass in device capabilities to avoid creating new WebGL contexts
      );
      
      // Initialize collectible manager
      this.collectibleManager = new CollectibleManager(
        this.scene, 
        this.assetManager,
        this.deviceCapabilities
      );
      
      // Initialize power-up effects
      this.powerUpEffects = new PowerUpEffects(this.scene);
      
      // For now, the player is enough since PowerUpEffects needs the mesh property
      // We'll need to update this if we continue refactoring to fully decouple mesh
      this.powerUpEffects.setCharacter(this.player as any);
      
      // Set up game loop with proper update functions
      this.gameLoop.setUpdateFn(this.updateGame.bind(this));
      this.gameLoop.setFixedUpdateFn(this.updatePhysics.bind(this));
      this.gameLoop.setRenderFn(this.render.bind(this));
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      this.isLoading = false;
      
      // Start the game loop (even in menu state)
      this.gameLoop.start();
      
      // Move to READY state after initialization is complete
      // This will be handled by the LoadingScreen component
      // No need to explicitly call setState here as the LoadingScreen will transition
    } catch (error) {
      console.error('Game initialization failed:', error);
      this.isLoading = false;
      
      // Ensure we display a message to the user
      alert('Game initialization failed. Please try refreshing the page.');
      
      // Try to recover by going to the MENU state
      try {
        gameStateManager.setState('MENU');
      } catch (stateError) {
        console.error('Failed to transition to MENU state after error:', stateError);
      }
    }
  }
  
  /**
   * Load required game assets
   */
  private async loadAssets(): Promise<void> {
    // Report asset loading progress
    const progressHandler = (progress: { completed: number, total: number, progress: number }) => {
      eventBus.emit('asset-loading-progress', { 
        progress: Math.floor(progress.progress * 100), 
        loaded: progress.completed, 
        total: progress.total 
      });
    };
    
    try {
      // Register necessary assets first
      console.log('Registering game assets...');
      
      // Register audio assets
      this.assetManager.registerAsset('audio_background', 'audio', '/assets/audio/music_background.mp3');
      this.assetManager.registerAsset('audio_collect', 'audio', '/assets/audio/collect.mp3');
      this.assetManager.registerAsset('audio_collision', 'audio', '/assets/audio/collision.mp3');
      this.assetManager.registerAsset('audio_powerup', 'audio', '/assets/audio/powerup.mp3');
      
      // Register character assets
      this.assetManager.registerAsset('character_nemo', 'model', '/assets/models/nemo.glb');
      
      // Register environment decoration assets
      this.assetManager.registerAsset('decoration_coralRock', 'model', '/assets/models/coral_rock.glb');
      this.assetManager.registerAsset('decoration_floatingPlankton', 'model', '/assets/models/plankton.glb');
      this.assetManager.registerAsset('decoration_seaAnemone', 'model', '/assets/models/sea_anemone.glb');
      this.assetManager.registerAsset('decoration_bubbleStream', 'model', '/assets/models/bubble_stream.glb');
      this.assetManager.registerAsset('decoration_coralCluster', 'model', '/assets/models/coral_cluster.glb');
      this.assetManager.registerAsset('decoration_schoolOfFish', 'model', '/assets/models/fish_school.glb');
      
      // Let the asset manager know we're going to ignore these assets for now
      // They'll be procedurally generated in code instead
      this.assetManager.setIgnoreAssets([
        'character_nemo',
        'decoration_coralRock', 
        'decoration_floatingPlankton',
        'decoration_seaAnemone',
        'decoration_bubbleStream',
        'decoration_coralCluster',
        'decoration_schoolOfFish'
      ]);
      
      // Since we're using procedural generation, we'll skip loading these assets directly
      // and just load audio assets
      console.log('Loading essential assets...');
      await this.assetManager.loadAll(progressHandler);

      console.log('Asset loading complete!');
      
      // Emit a final 100% progress event to ensure the loading screen completes
      eventBus.emit('asset-loading-progress', { 
        progress: 100, 
        loaded: 100, 
        total: 100 
      });
    } catch (error) {
      console.error('Asset loading failed:', error);
      
      // Even if loading fails, emit a 100% progress event to ensure we don't get stuck
      eventBus.emit('asset-loading-progress', { 
        progress: 100, 
        loaded: 100, 
        total: 100 
      });
      
      // Continue with the game using placeholder assets
      console.log('Continuing with placeholder assets...');
    }
  }
  
  /**
   * Set up scene lighting
   */
  private setupLighting(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light (sun rays through water)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = this.gameSettings.shadowQuality !== 'off';
    this.scene.add(directionalLight);
  }
  
  /**
   * Handle game state changes
   */
  private handleGameStateChange(data: { from: GameState; to: GameState }): void {
    const { from, to } = data;
    
    // Handle transitions between states
    switch (to) {
      case 'MENU':
        // Start menu music
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playBackgroundMusic();
        
        // Reset camera to menu position
        this.camera.position.set(0, 2.0, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Clear game elements if coming from game over
        if (from === 'GAME_OVER') {
          this.resetGame();
        }
        break;
        
      case 'LOADING':
        // Only initialize once
        if (!this.isInitialized && !this.isLoading) {
          this.initialize();
        }
        break;
        
      case 'READY':
        // Play countdown sound
        this.audioManager.playSoundEffect('countdown');
        
        // Prepare for gameplay and reset camera
        this.prepareGame();
        
        // Make sure camera is properly set for gameplay
        if (this.fixedCameraMode) {
          // Reset fixed camera parameters
          this.cameraDistance = 8;
          this.cameraHeight = 2.0;
          this.cameraCenterOffset = 0;
          this.lookAtOffsetY = 0;
          
          // Position camera if mesh exists
          if (this.player.mesh) {
            this.camera.position.set(
              this.cameraCenterOffset,
              this.cameraHeight,
              this.player.mesh.position.z + this.cameraDistance
            );
            
            // Look ahead
            this.camera.lookAt(
              this.cameraCenterOffset,
              this.lookAtOffsetY,
              this.player.mesh.position.z - 10
            );
          }
        }
        break;
        
      case 'PLAYING':
        // Start background music if coming from another state
        if (from === 'READY' || from === 'MENU' || from === 'LOADING') {
          this.audioManager.playSoundEffect('game-start');
          
          // Explicitly signal the game to start character movement
          // Send multiple events for redundancy to ensure character movement starts
          console.log('Emitting game-start-movement event from GameEngine');
          eventBus.emit('game-start-movement', { startTime: Date.now() });
          
          // Add a couple delayed events for extra reliability
          for (let delay of [200, 500]) {
            setTimeout(() => {
              console.log(`Emitting game-start-movement event with ${delay}ms delay`);
              eventBus.emit('game-start-movement', { startTime: Date.now(), delayed: true });
            }, delay);
          }
        } else {
          // Even if coming from another state, emit game-start-movement for safety
          console.log('Emitting game-start-movement event for ALL transitions to PLAYING');
          eventBus.emit('game-start-movement', { startTime: Date.now() });
        }
        
        // Always make sure the game loop is running when in PLAYING state
        this.gameLoop.resume();
        
        // Force an initial game update to kick-start the game loop
        this.updateGame(1/60);
        this.updatePhysics(1/60);
        
        break;
        
      case 'PAUSED':
        // Pause game loop
        this.gameLoop.pause();
        break;
        
      case 'GAME_OVER':
        // Play game over sound
        this.audioManager.playSoundEffect('game-over');
        break;
    }
  }
  
  /**
   * Prepare the game for playing - called when entering READY state
   */
  private prepareGame(): void {
    // Reset player position
    this.player.resetPosition();
    
    // Generate initial obstacles
    this.obstacleManager.clear();
    const playerPosition = this.player.getPosition();
    if (playerPosition) {
      this.obstacleManager.update(0, playerPosition.z, 0);
    }
    
    // Clear collectibles
    this.collectibleManager.clear();
    
    // Reset camera based on fixed approach
    // Reuse the same playerPosition variable
    if (this.fixedCameraMode && playerPosition) {
      // Reset camera with consistent parameters
      this.cameraDistance = 8;
      this.cameraHeight = 2.0;
      
      // Set camera to fixed position
      this.camera.position.set(
        this.cameraCenterOffset, 
        this.cameraHeight, 
        playerPosition.z + this.cameraDistance
      );
      
      // Look ahead along path
      this.camera.lookAt(
        this.cameraCenterOffset,
        this.lookAtOffsetY,
        playerPosition.z - 10
      );
    } else {
      // Legacy camera reset
      this.camera.position.set(0, 3, 10);
      this.camera.lookAt(0, 0, 0);
    }
  }
  
  /**
   * Update physics with fixed timestep
   */
  private updatePhysics(fixedTimeStep: number): void {
    if (gameStateManager.state !== 'PLAYING') return;
    
    // Update environment with player position and camera
    const playerPos = this.player.getPosition();
    if (playerPos) {
      this.environment.update(playerPos, this.camera, fixedTimeStep);
    }
    
    // We no longer need to update water effects separately as it's handled by the environment
    // The reference is kept for backward compatibility
    
    // Emit game update event for bubble animations and other timed effects
    eventBus.emit('game-update', fixedTimeStep);
    
    // Update collision detection
    this.collisionSystem.update();
  }
  
  /**
   * Update game state
   */
  private updateGame(deltaTime: number): void {
    if (gameStateManager.state !== 'PLAYING') return;
    
    // Handle input
    const input = this.inputHandler.getInput();
    
    // Update player character
    this.player.update(deltaTime, input);
    
    // Only proceed with position-dependent updates
    const playerPos = this.player.getPosition();
    if (playerPos) {
      // Emit player position for obstacle triggers
      eventBus.emit('player-position', playerPos);
      
      // Update obstacles
      this.obstacleManager.update(deltaTime, playerPos.z, this.playerSpeed * deltaTime);
      
      // Update collectibles
      this.collectibleManager.update(deltaTime, playerPos, this.playerSpeed);
    }
    
    // Update power-up effects
    this.powerUpEffects.update(deltaTime);
    
    // Update distance in game state manager
    gameStateManager.updateDistance(this.playerSpeed * deltaTime);
    
    // Move the camera to follow the player
    this.updateCamera(deltaTime);
  }
  
  // Camera properties
  private cameraDistance: number = 8; // Fixed distance from player origin
  private cameraHeight: number = 2.0; // Fixed camera height
  private lookAtOffsetY: number = 0; // Look slightly ahead/below
  private cameraLerpFactor: number = 2.0; // Smooth camera movement factor
  
  // Fixed camera parameters
  private fixedCameraMode: boolean = true; // Use fixed approach
  private cameraCenterOffset: number = 0; // Fixed offset toward center
  
  /**
   * Update camera position to follow player
   */
  private updateCamera(deltaTime: number): void {
    // Get current player position
    const playerPos = this.player.getPosition();
    if (this.fixedCameraMode && playerPos) {
      // FIXED CAMERA APPROACH:
      // In this mode, the camera stays directly behind the player's forward path
      // It only follows in Z direction, completely ignoring lane changes
      // This prevents ANY zoom effect since the perspective never changes
      
      // Simply maintain a fixed Z offset behind the player
      this.camera.position.z = playerPos.z + this.cameraDistance;
      
      // Keep the camera at a FIXED X position (center line)
      this.camera.position.x = this.cameraCenterOffset; // Usually 0 for center
      
      // Maintain fixed height
      this.camera.position.y = this.cameraHeight;
      
      // Look ahead at a fixed point along the forward path
      // This is CRITICAL - we look at a point directly ahead,
      // NOT at the player, to prevent zoom effects
      this.camera.lookAt(
        this.cameraCenterOffset, // Look at center lane
        this.lookAtOffsetY,      // Slight Y offset for better angle
        playerPos.z - 10 // Look AHEAD of player
      );
    } else if (playerPos) {
      // DYNAMIC CAMERA APPROACH (Original logic - not used)
      // Note: This is preserved but not used since fixed approach is better
      
      // Keep camera behind player at a consistent distance
      const targetCameraZ = playerPos.z + this.cameraDistance;
      this.camera.position.z = THREE.MathUtils.lerp(
        this.camera.position.z, 
        targetCameraZ, 
        deltaTime * 2
      );
      
      // Fixed camera at center
      this.camera.position.x = 0;
      
      // Fixed height
      this.camera.position.y = this.cameraHeight;
      
      // Look directly ahead (not at player)
      this.camera.lookAt(0, 0, playerPos.z - 10);
    }
  }
  
  // Flag to prevent recursive render error logging
  private renderErrorLogged = false;
  private renderErrorCount = 0;
  private lastRenderErrorTime = 0;
  
  /**
   * Render the scene with comprehensive error handling
   */
  private render(interpolation: number): void {
    // Complete safety check at the very beginning
    try {
      // Check if we have the essential components
      if (!this.renderer || !this.scene || !this.camera) {
        // Only log this error once to prevent console spam
        if (!this.renderErrorLogged) {
          console.warn('Cannot render: renderer, scene, or camera is null');
          this.renderErrorLogged = true;
          
          // After 5 seconds, allow logging again in case the issue persists
          setTimeout(() => {
            this.renderErrorLogged = false;
          }, 5000);
        }
        return;
      }
      
      // Track render errors to prevent infinite loops
      const now = Date.now();
      if (now - this.lastRenderErrorTime > 5000) {
        // Reset error count after 5 seconds of no errors
        this.renderErrorCount = 0;
      }
      
      // If we've had too many render errors in a short time, disable rendering temporarily
      if (this.renderErrorCount > 10) {
        if (now - this.lastRenderErrorTime < 5000) {
          // Too many errors in a short period, skip rendering
          return;
        } else {
          // It's been a while, reset error count and try again
          this.renderErrorCount = 0;
        }
      }
      
      // Pre-check for invalid state
      if (!gameStateManager) {
        console.warn('GameStateManager is not initialized, skipping render');
        return;
      }
      
      // Safety wrapper for rendering
      try {
        // Get time for effects
        const time = performance.now() * 0.001;
        
        // Apply camera effects based on game state
        // Different effects for different states
        if (gameStateManager.state === 'PLAYING' || gameStateManager.state === 'PAUSED') {
          if (this.fixedCameraMode) {
            // FIXED CAMERA MODE EFFECTS
            // Much subtler effects that don't affect camera position or look direction
            
            try {
              // Apply a VERY subtle camera roll for underwater feeling
              // This only affects rotation around Z axis, not position or direction
              const subtleRoll = Math.sin(time * 0.2) * 0.002; // Extremely minor roll
              if (this.camera && this.camera.rotation) {
                this.camera.rotation.z = subtleRoll;
              }
            } catch (effectError) {
              console.warn('Error applying camera effects:', effectError);
            }
          }
          else {
            // DYNAMIC CAMERA MODE EFFECTS - not used but preserved
            try {
              const wobbleAmplitude = 0.03;
              this.cameraHeight = 2.0 + Math.sin(time * 0.5) * wobbleAmplitude;
              
              const playerPos = this.player?.getPosition();
              if (this.player && playerPos && this.camera && this.camera.rotation) {
                const targetTilt = playerPos.x * -0.005;
                this.camera.rotation.z = THREE.MathUtils.lerp(
                  this.camera.rotation.z,
                  targetTilt + Math.sin(time * 0.2) * 0.003,
                  0.03
                );
              }
            } catch (dynamicEffectError) {
              console.warn('Error applying dynamic camera effects:', dynamicEffectError);
            }
          }
        } else {
          // MENU STATE CAMERA
          // For the menu, we want more dramatic effects
          try {
            if (this.camera && this.camera.position && this.camera.rotation) {
              // Subtle camera movement for menu
              this.camera.position.y = 2.0 + Math.sin(time * 0.2) * 0.1;
              this.camera.rotation.z = Math.sin(time * 0.1) * 0.02;
              
              // Slowly rotate camera in menu
              if (gameStateManager.state === 'MENU') {
                this.camera.position.x = Math.sin(time * 0.1) * 3;
                this.camera.position.z = Math.cos(time * 0.1) * 3 + 10;
                
                // Make sure vector is valid before lookAt
                if (this.camera.lookAt && typeof this.camera.lookAt === 'function') {
                  this.camera.lookAt(0, 0, 0);
                }
              }
            }
          } catch (menuEffectError) {
            console.warn('Error applying menu camera effects:', menuEffectError);
          }
        }
        
        // Final verification before rendering
        if (this.renderer && this.scene && this.camera &&
            this.renderer.render && typeof this.renderer.render === 'function') {
          try {
            // Perform the actual rendering
            this.renderer.render(this.scene, this.camera);
            
            // Successful render, reset error tracking
            this.renderErrorLogged = false;
          } catch (renderError) {
            // Track this error
            this.lastRenderErrorTime = now;
            this.renderErrorCount++;
            
            // Check specifically for "trim" related errors which indicate a UI component issue
            const errorString = renderError.toString();
            if (errorString.includes('trim') || errorString.includes('Cannot read properties of null')) {
              // This is likely coming from a UI component rather than an actual rendering issue
              // Force a state transition to eliminate the error by clearing any problematic UI
              if (this.renderErrorCount === 1) {
                console.error('Detected UI component error. Attempting to recover:', renderError);
                
                try {
                  // Emit state change event to force UI components to re-render with safe defaults
                  if (gameStateManager && gameStateManager.state) {
                    const currentState = gameStateManager.state;
                    setTimeout(() => {
                      // Emit same state with additional data to refresh UI
                      eventBus.emit('game-state-change', {
                        from: currentState,
                        to: currentState,
                        data: {
                          ...gameStateManager.stateData,
                          // Ensure environment has a safe value
                          environment: {
                            current: 'reef'
                          }
                        },
                        refresh: true
                      });
                    }, 100);
                  }
                } catch (recoveryError) {
                  console.warn('Failed UI recovery attempt:', recoveryError);
                }
              }
            }
            
            // Only log periodically to avoid console spam 
            if (this.renderErrorCount === 1 || this.renderErrorCount % 10 === 0) {
              console.error(`Render error (${this.renderErrorCount}):`, renderError);
            }
            
            // If we've hit a critical number of errors, try to recover
            if (this.renderErrorCount === 20) {
              console.warn('Critical render error count reached, attempting recovery...');
              this.attemptRendererRecovery();
            }
          }
        } else {
          console.warn('Render method unavailable on renderer');
        }
      } catch (outerError) {
        console.error('Unexpected error in render method:', outerError);
      }
    } catch (fatalError) {
      // Last resort catch - this should never happen but will prevent the game from crashing
      console.error('Fatal error in render method:', fatalError);
    }
  }
  
  /**
   * Attempt to recover from renderer issues by recreating it
   */
  private attemptRendererRecovery(): void {
    console.log('Attempting renderer recovery...');
    try {
      // Cache the current canvas
      const canvas = this.renderer.domElement;
      
      // Dispose current renderer
      try {
        // Get WebGL context and force loss to free up GPU resources
        const gl = this.renderer.getContext();
        if (gl && 'getExtension' in gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            console.log('Forcing WebGL context loss for recovery...');
            ext.loseContext();
          }
        }
        
        this.renderer.dispose();
      } catch (disposeError) {
        console.warn('Error disposing old renderer:', disposeError);
      }
      
      // Create a new renderer with minimal options
      console.log('Creating new renderer...');
      this.renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: false,
        alpha: false,
        precision: 'lowp',
        powerPreference: 'default'
      });
      
      // Set basic properties
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(1.0); // Use safest value
      
      // Reset error tracking
      this.renderErrorCount = 0;
      this.renderErrorLogged = false;
      
      console.log('Renderer recovery complete');
    } catch (recoveryError) {
      console.error('Failed to recover renderer:', recoveryError);
    }
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Reset game to initial state
   */
  private resetGame(): void {
    // Reset player position
    this.player.resetPosition();
    
    // Clear obstacles and collectibles
    this.obstacleManager.clear();
    this.collectibleManager.clear();
    
    // Reset camera to initial values for menu state
    // We explicitly reset all camera parameters to prevent any lingering values
    if (gameStateManager.state === 'MENU') {
      // Menu camera
      this.camera.position.set(0, 2.0, 10);
      this.camera.lookAt(0, 0, 0);
    } else {
      // Game camera reset with fixed approach
      this.cameraDistance = 8;
      this.cameraHeight = 2.0;
      this.cameraCenterOffset = 0;
      this.lookAtOffsetY = 0;
      
      // Apply these settings to the camera if mesh exists
      if (this.player.mesh) {
        this.camera.position.set(
          this.cameraCenterOffset,
          this.cameraHeight,
          this.player.mesh.position.z + this.cameraDistance
        );
        
        // Look straight ahead
        this.camera.lookAt(
          this.cameraCenterOffset,
          this.lookAtOffsetY,
          this.player.mesh.position.z - 10
        );
      }
    }
  }
  
  /**
   * Set up game event listeners
   */
  private setupEventListeners(): void {
    // Handle player hitting obstacles
    eventBus.on('player-hit', () => {
      // Let the game state manager handle lives and game over
      gameStateManager.playerHit();
    });
    
    // Handle collectible collection
    eventBus.on('collect', (data: { type: string, points?: number }) => {
      // Calculate points based on collectible type
      let points = 0;
      if (data.points) {
        points = data.points;
      } else if (data.type === 'bubble') {
        points = 10;
      } else if (data.type.startsWith('powerup_')) {
        points = 25;
      }
      
      // Update score
      gameStateManager.updateScore(points);
    });
    
    // Handle power-up collection
    eventBus.on('powerup-collected', (data: { type: string, duration: number }) => {
      // Activate power-up in game state manager
      gameStateManager.activatePowerup(data.type, data.duration);
      
      // Apply power-up effects to game entities
      this.applyPowerupEffects(data.type, true);
    });
    
    // Handle power-up deactivation
    eventBus.on('powerup-deactivated', (data: { type: string }) => {
      // Remove power-up effects from game entities
      this.applyPowerupEffects(data.type, false);
    });
    
    // Handle environment changes
    eventBus.on('environment-change-complete', (data: { type: string }) => {
      // Update game state
      gameStateManager.stateData.environment.current = data.type;
    });
    
    // Handle game restart event
    eventBus.on('game-restart', () => {
      // Reset the game to initial state
      this.resetGame();
      
      // Reset player position
      this.player.resetPosition();
      
      // Reset obstacles
      this.obstacleManager.clear();
      if (this.player.mesh) {
        this.obstacleManager.update(0, this.player.mesh.position.z, 0);
      }
      
      // Reset collectibles
      this.collectibleManager.clear();
    });
    
    // Handle pause toggle from keyboard/touch input
    eventBus.on('toggle-pause', () => {
      console.log('Received toggle-pause event, current state:', gameStateManager.state);
      
      // Toggle between playing and paused states
      if (gameStateManager.state === 'PLAYING') {
        gameStateManager.pauseGame();
      } else if (gameStateManager.state === 'PAUSED') {
        gameStateManager.resumeGame();
      }
    });
    
    // With fixed camera approach, these events don't need to do anything
    // but we'll keep them for potential future use
    eventBus.on('character-lane-change', (data: { 
      position: THREE.Vector3, 
      progress: number, 
      direction: 'LEFT' | 'RIGHT' | null,
      fromLane: string,
      toLane: string
    }) => {
      // In fixed camera mode, we don't adjust camera at all during lane changes
      // This completely eliminates zoom issues
      if (!this.fixedCameraMode) {
        // Only used in dynamic camera mode
        this.cameraLerpFactor = 1.0;
        this.cameraDistance = 5;
      }
    });
    
    // Lane change completion event
    eventBus.on('lane-change-complete', (data: {
      finalLane: string,
      position: THREE.Vector3
    }) => {
      // In fixed camera mode, we don't need to reset parameters
      // The camera always stays in the same position
      if (!this.fixedCameraMode) {
        // Only used in dynamic camera mode
        this.cameraLerpFactor = 2.0;
        this.cameraDistance = 5;
      }
    });
  }
  
  /**
   * Apply or remove power-up effects to game entities
   */
  private applyPowerupEffects(type: string, active: boolean): void {
    switch (type) {
      case 'powerup_shield':
        // Visual shield effect handled by PowerUpEffects component
        break;
        
      case 'powerup_magnet':
        // Set attraction in collectible manager
        this.collectibleManager.setAttractionEnabled(active);
        break;
        
      case 'powerup_speed':
        // Set speed multiplier for player
        this.player.setSpeedMultiplier(active ? 1.5 : 1.0);
        break;
        
      case 'powerup_score':
        // Score multiplier handled by game state manager
        break;
        
      case 'powerup_time':
        // Slow down obstacles
        this.obstacleManager.setTimeScale(active ? 0.5 : 1.0);
        break;
    }
    
    // Note: Visual effects are now handled by PowerUpEffects class
  }
  
  /**
   * Initialize renderer with extensive error handling and canvas dimension awareness
   */
  private setupRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    try {
      // Check if the canvas is valid
      if (!canvas) {
        throw new Error('Canvas is null or undefined');
      }
      
      // Check that the canvas is attached to the DOM
      if (!canvas.parentElement) {
        console.warn('Canvas is not attached to DOM, rendering may fail');
      }
      
      // Use clientWidth and clientHeight for accurate canvas dimensions
      const clientWidth = canvas.clientWidth;
      const clientHeight = canvas.clientHeight;
      
      console.log(`Setting up renderer with canvas client dimensions: ${clientWidth}x${clientHeight}`);
      
      // If the canvas already has our tracking flag, let's try to clear any existing context
      if ((canvas as any).__webGLContextCreated) {
        console.warn('Canvas already has a tracking flag, trying to prep it for reuse');
        
        // Try to help release the previous context
        try {
          // We're in a tricky situation - we can't properly check for a context without creating one
          // Let's use a timeout to give the browser time to release any previous context
          const startWait = Date.now();
          while (Date.now() - startWait < 100) {
            // Short wait - just burn some CPU cycles to give the browser time
          }
        } catch (e) {
          console.warn('Error during context release delay:', e);
        }
      }
      
      // Create renderer with minimal settings - better to try once with good settings than retry with lower ones
      let renderer: THREE.WebGLRenderer;
      
      try {
        console.log('Creating renderer with optimized settings for this device type');
        
        // Create a single set of options based on device capabilities
        const options: THREE.WebGLRendererParameters = {
          canvas: canvas,
          // Use basics that should work on all devices
          antialias: this.deviceCapabilities.highEnd || this.deviceCapabilities.midRange,
          alpha: false, // No transparency needed for better performance
          precision: this.deviceCapabilities.highEnd ? 'highp' : this.deviceCapabilities.midRange ? 'mediump' : 'lowp',
          powerPreference: this.deviceCapabilities.highEnd ? 'high-performance' : 'default',
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false, // Don't fail on low-end devices
          depth: true,
          stencil: false,
          logarithmicDepthBuffer: false
        };
        
        // Make a safe copy of options without the canvas for logging
        const logOptions = { ...options };
        delete logOptions.canvas; // Remove canvas to avoid circular reference
        console.log('Creating WebGL renderer with options:', JSON.stringify(logOptions, null, 2));
        
        // Update the tracking flag before creating the context
        (canvas as any).__webGLContextCreated = true;
        
        // Create the renderer
        renderer = new THREE.WebGLRenderer(options);
        console.log('WebGL renderer created successfully');
      } catch (rendererCreationError) {
        console.error('Critical error creating renderer:', rendererCreationError);
        
        // Add small delay before trying minimal settings
        const startWait = Date.now();
        while (Date.now() - startWait < 100) {
          // Short wait
        }
        
        // Try again with absolute minimal settings
        try {
          console.log('Retrying with absolute minimal settings');
          
          const minimalOptions: THREE.WebGLRendererParameters = {
            canvas: canvas,
            antialias: false,
            alpha: false,
            precision: 'lowp',
            powerPreference: 'default',
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          };
          
          renderer = new THREE.WebGLRenderer(minimalOptions);
          console.log('Minimal renderer created successfully on second attempt');
        } catch (secondError) {
          console.error('Critical error creating even minimal renderer:', secondError);
          throw new Error('Failed to create WebGL renderer: ' + rendererCreationError + ' - Second attempt: ' + secondError);
        }
      }
      
      try {
        // IMPORTANT: Get accurate dimensions from clientWidth/clientHeight
        // This fixes the "300x150" default size problem
        console.log('Setting renderer size based on client dimensions');
        
        // Use clientWidth/Height directly, with fallbacks
        const width = clientWidth || 800;
        const height = clientHeight || 600;
        
        // Set size with updateStyle=false to avoid resize loops
        console.log(`Setting renderer size to ${width}x${height}`);
        renderer.setSize(width, height, false);
        
        // Verify the size was set correctly
        const actualWidth = renderer.domElement.width;
        const actualHeight = renderer.domElement.height;
        console.log(`Renderer size after setSize: ${actualWidth}x${actualHeight}`);
        
        // If there's a significant discrepancy, try one more time with a delay
        if (Math.abs(actualWidth - width) > 50 || Math.abs(actualHeight - height) > 50) {
          console.warn(`Size discrepancy detected! Will retry setting size in 100ms. Expected: ${width}x${height}, Got: ${actualWidth}x${actualHeight}`);
          
          // Queue a resize after a short delay
          setTimeout(() => {
            try {
              const updatedWidth = canvas.clientWidth || 800;
              const updatedHeight = canvas.clientHeight || 600;
              console.log(`Retrying size with ${updatedWidth}x${updatedHeight}`);
              renderer.setSize(updatedWidth, updatedHeight, false);
            } catch (e) {
              console.warn('Delayed size setting failed:', e);
            }
          }, 100);
        }
      } catch (sizeError) {
        console.warn('Error setting renderer size:', sizeError);
        // Fallback size
        try {
          renderer.setSize(800, 600, false);
        } catch (fallbackSizeError) {
          console.error('Error setting fallback size:', fallbackSizeError);
        }
      }
      
      try {
        // Set a safe pixel ratio of 1 first
        renderer.setPixelRatio(1);
        
        // Now try to set a better pixel ratio based on device capabilities
        if (window.devicePixelRatio) {
          // Use a more conservative approach for pixel ratio based on device capabilities
          let targetPixelRatio = 1.0;
          
          if (this.deviceCapabilities) {
            if (this.deviceCapabilities.highEnd) {
              targetPixelRatio = Math.min(window.devicePixelRatio, 2.0);
            } else if (this.deviceCapabilities.midRange) {
              targetPixelRatio = Math.min(window.devicePixelRatio, 1.5);
            } else {
              targetPixelRatio = 1.0; // Low-end devices stick to 1.0
            }
          } else {
            // If we don't have device capabilities detection, use a conservative approach
            targetPixelRatio = Math.min(window.devicePixelRatio, 1.5);
          }
          
          console.log(`Setting pixel ratio to: ${targetPixelRatio} (device ratio: ${window.devicePixelRatio})`);
          renderer.setPixelRatio(targetPixelRatio);
        }
      } catch (pixelRatioError) {
        console.warn('Error setting pixel ratio:', pixelRatioError);
      }
      
      // Only apply additional settings if the basic renderer is working
      try {
        console.log('Applying additional renderer settings');
        
        // Basic safe settings
        renderer.shadowMap.enabled = false;
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        
        // Apply device-specific settings if available, with individual try/catch
        if (this.deviceCapabilities) {
          console.log('Applying device-specific settings');
          
          // Each setting in its own try/catch to ensure one failure doesn't break everything
          if (this.deviceCapabilities.highEnd) {
            try {
              // Enable high-quality settings for high-end devices
              renderer.shadowMap.enabled = true;
              renderer.shadowMap.type = THREE.PCFSoftShadowMap;
              
              // Enable antialias for high-end devices
              renderer.getContext().antialias = true;
            } catch (highEndError) {
              console.warn('Error setting high-end renderer settings:', highEndError);
            }
            
            try {
              renderer.outputColorSpace = THREE.SRGBColorSpace;
            } catch (colorSpaceError) {
              console.warn('Error setting color space:', colorSpaceError);
            }
            
            try {
              renderer.toneMapping = THREE.ACESFilmicToneMapping;
              renderer.toneMappingExposure = 1.0;
            } catch (toneMappingError) {
              console.warn('Error setting tone mapping:', toneMappingError);
            }
          } 
          else if (this.deviceCapabilities.midRange) {
            try {
              // Mid-range devices get some enhanced features
              renderer.shadowMap.enabled = true;
              renderer.shadowMap.type = THREE.PCFShadowMap;
            } catch (shadowError) {
              console.warn('Error setting shadow settings:', shadowError);
            }
            
            try {
              renderer.outputColorSpace = THREE.SRGBColorSpace;
            } catch (colorSpaceError) {
              console.warn('Error setting color space:', colorSpaceError);
            }
            
            try {
              renderer.toneMapping = THREE.ReinhardToneMapping;
            } catch (toneMappingError) {
              console.warn('Error setting tone mapping:', toneMappingError);
            }
          }
          // Low-end devices keep the minimal settings
        }
      } catch (settingsError) {
        console.warn('Error applying additional settings:', settingsError);
      }
      
      console.log('Renderer setup complete successfully');
      return renderer;
    } catch (criticalError) {
      console.error('CRITICAL ERROR in setupRenderer:', criticalError);
      
      // This is truly our last resort - try with a CSS-based fallback approach
      try {
        console.error('WebGL initialization failed completely, attempting CSS-based fallback');
        
        // Check one more time if canvas is valid
        if (!canvas || typeof canvas !== 'object') {
          throw new Error('Canvas is invalid for emergency fallback');
        }
        
        // Try a trick - create a second canvas element as a backup
        const backupCanvas = document.createElement('canvas');
        backupCanvas.width = canvas.width || 800;
        backupCanvas.height = canvas.height || 600;
        
        // Try to copy the canvas properties to preserve sizing
        backupCanvas.style.cssText = canvas.style.cssText;
        backupCanvas.className = canvas.className;
        
        // Replace the provided canvas with our new one in the DOM if possible
        if (canvas.parentNode) {
          console.log('Replacing canvas with backup canvas in the DOM');
          canvas.parentNode.insertBefore(backupCanvas, canvas);
          canvas.parentNode.removeChild(canvas);
        }
        
        // Clear any WebGL flags on both canvases
        delete (canvas as any).__webGLContextCreated;
        delete (canvas as any).__gameInitAttempted;
        delete (backupCanvas as any).__webGLContextCreated;
        delete (backupCanvas as any).__gameInitAttempted;
        
        // Create a minimal renderer on the backup canvas with one last attempt
        console.warn('Creating emergency fallback renderer on backup canvas');
        
        // Try with the absolute minimum settings
        const fallbackRenderer = new THREE.WebGLRenderer({ 
          canvas: backupCanvas, 
          antialias: false,
          alpha: false,
          precision: 'lowp',
          powerPreference: 'default',
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          depth: false,
          stencil: false,
          logarithmicDepthBuffer: false
        });
        
        // Use width/height from the element itself
        const fallbackWidth = backupCanvas.clientWidth || 800;
        const fallbackHeight = backupCanvas.clientHeight || 600;
        console.log(`Setting fallback renderer size to ${fallbackWidth}x${fallbackHeight}`);
        fallbackRenderer.setSize(fallbackWidth, fallbackHeight, false);
        
        // Mark our backup canvas as used
        (backupCanvas as any).__webGLContextCreated = true;
        
        return fallbackRenderer;
      } catch (emergencyError) {
        // If we get here, there's nothing more we can do
        console.error('Emergency fallback renderer completely failed:', emergencyError);
        
        // Throw a very descriptive error so UI can show a proper fallback message
        throw new Error('WebGL rendering is not available on this system. Please check your browser settings or try a different browser.');
      }
    }
  }
  
  /**
   * Initialize camera
   */
  private setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60, // FOV - consistent value for racing games
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Initialize our fixed camera properties
    this.cameraHeight = 2.0;
    this.cameraDistance = 8; // Increased for better view
    this.cameraCenterOffset = 0;
    this.lookAtOffsetY = 0;
    
    // Position the camera with our fixed approach
    camera.position.set(
      this.cameraCenterOffset, 
      this.cameraHeight, 
      10 // Initial Z position
    );
    
    // Set the camera to look ahead along the path
    camera.lookAt(
      this.cameraCenterOffset, 
      this.lookAtOffsetY, 
      0 // Look ahead
    );
    
    return camera;
  }
  
  /**
   * Clean up and dispose resources with enhanced WebGL context management
   */
  dispose(): void {
    console.log('GameEngine: Starting comprehensive disposal of all resources...');
    
    try {
      // Stop the game loop first to prevent further rendering attempts
      console.log('GameEngine: Stopping game loop...');
      this.gameLoop.stop();
      
      // Mark as not initialized immediately to prevent any new rendering attempts
      this.isInitialized = false;
      
      // Remove all event listeners
      try {
        console.log('GameEngine: Removing event listeners...');
        
        // Use bind with a stored reference for proper removal
        const boundHandleResize = this.handleResize.bind(this);
        window.removeEventListener('resize', boundHandleResize);
        
        // Unsubscribe from all event bus events
        const boundHandleGameStateChange = this.handleGameStateChange.bind(this);
        eventBus.off('game-state-change', boundHandleGameStateChange);
        
        // Create a comprehensive list of events to clean up
        const eventsToCleanup = [
          'character-lane-change', 
          'lane-change-complete',
          'player-hit',
          'collect',
          'powerup-collected',
          'powerup-deactivated',
          'environment-change-complete',
          'game-restart',
          'toggle-pause',
          'game-start-movement',
          'player-position',
          'game-update'
        ];
        
        // Clean up all events - use function.prototype to target all handlers
        eventsToCleanup.forEach(event => {
          console.log(`GameEngine: Unsubscribing from event: ${event}`);
          eventBus.off(event);
        });
      } catch (eventError) {
        console.warn('GameEngine: Error cleaning up event listeners:', eventError);
      }
      
      // Capture the canvas reference before disposal
      const canvasElement = this.renderer ? this.renderer.domElement : null;
      
      // Clean up game entities with error handling - dispose in reverse order of creation
      if (this.isInitialized) {
        try {
          console.log('GameEngine: Disposing game entities...');
          
          // Dispose each entity with individual try/catch blocks - in reverse dependency order
          try { this.waterEffects.dispose(); } catch (e) { console.warn('Error disposing water effects:', e); }
          try { this.environment.dispose(); } catch (e) { console.warn('Error disposing environment:', e); }
          try { this.powerUpEffects.dispose(); } catch (e) { console.warn('Error disposing power-ups:', e); }
          try { this.collectibleManager.dispose(); } catch (e) { console.warn('Error disposing collectibles:', e); }
          try { this.obstacleManager.dispose(); } catch (e) { console.warn('Error disposing obstacles:', e); }
          try { this.player.dispose(); } catch (e) { console.warn('Error disposing player:', e); }
        } catch (entityError) {
          console.warn('GameEngine: Error during entity disposal:', entityError);
        }
      }
      
      // Clean up ThreeJS resources with error handling
      try {
        console.log('GameEngine: Disposing ThreeJS scene resources...');
        
        if (this.scene) {
          // Dispose all materials and geometries from the scene
          this.scene.traverse((object) => {
            try {
              if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                  object.geometry.dispose();
                }
                
                if (object.material) {
                  if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                      // Dispose all texture maps
                      this.disposeAllMaterialTextures(material);
                      material.dispose();
                    });
                  } else {
                    // Dispose all texture maps
                    this.disposeAllMaterialTextures(object.material);
                    object.material.dispose();
                  }
                }
              }
            } catch (objectError) {
              console.warn('GameEngine: Error disposing object:', objectError);
            }
          });
          
          // Clear the ThreeJS Scene to help garbage collection
          while(this.scene.children.length > 0) { 
            this.scene.remove(this.scene.children[0]); 
          }
          
          // Clear scene references
          this.scene = null as any;
        }
      } catch (sceneError) {
        console.warn('GameEngine: Error cleaning up scene:', sceneError);
      }
      
      // Dispose of the renderer and WebGL context
      try {
        if (this.renderer) {
          console.log('GameEngine: Disposing WebGL renderer and forcing context loss...');
          
          // Store the renderer and clear the reference before disposal
          const renderer = this.renderer;
          const domElement = renderer.domElement;
          this.renderer = null as any;
          
          // Clear tracking flag from canvas to allow future initialization
          if (domElement) {
            console.log('GameEngine: Clearing WebGL context tracking flags from canvas');
            delete (domElement as any).__webGLContextCreated;
            delete (domElement as any).__gameInitAttempted;
          }
          
          // Force context loss to clean up WebGL resources
          try {
            // Get WebGL context and force loss to free up GPU resources
            const gl = renderer.getContext();
            if (gl && typeof gl.getExtension === 'function') {
              const ext = gl.getExtension('WEBGL_lose_context');
              if (ext) {
                console.log('GameEngine: Successfully forcing WebGL context loss...');
                ext.loseContext();
              } else {
                console.log('GameEngine: WEBGL_lose_context extension not available');
              }
            }
          } catch (contextLossError) {
            console.warn('GameEngine: Error forcing context loss:', contextLossError);
          }
          
          // Now dispose the renderer
          try {
            console.log('GameEngine: Calling renderer.dispose()...');
            renderer.dispose();
          } catch (rendererDisposeError) {
            console.warn('GameEngine: Error calling renderer.dispose():', rendererDisposeError);
          }
          
          // Clear all references to canvas and context
          try {
            // Set renderer properties to null to help garbage collection
            renderer.setAnimationLoop(null);
            
            // Clear context references
            if (canvasElement) {
              console.log('GameEngine: Cleaning up canvas and context references');
              try {
                // Attempt to manually reset the canvas
                // In some cases, this helps trigger garbage collection of WebGL resources
                const ctx2d = canvasElement.getContext('2d');
                if (ctx2d) {
                  ctx2d.clearRect(0, 0, canvasElement.width, canvasElement.height);
                }
              } catch (canvasResetError) {
                console.warn('GameEngine: Error resetting canvas:', canvasResetError);
              }
            }
          } catch (referenceCleanupError) {
            console.warn('GameEngine: Error clearing references:', referenceCleanupError);
          }
        }
      } catch (rendererError) {
        console.warn('GameEngine: Error disposing renderer:', rendererError);
      }
      
      // Clean up camera
      if (this.camera) {
        // Remove all camera references
        this.camera = null as any;
      }
      
      // Clean up subsystems
      try {
        console.log('GameEngine: Disposing subsystems...');
        this.audioManager.dispose();
        this.assetManager.dispose();
        this.inputHandler.cleanup();
        
        // Clear references
        this.audioManager = null as any;
        this.assetManager = null as any;
        this.inputHandler = null as any;
      } catch (subsystemError) {
        console.warn('GameEngine: Error disposing subsystems:', subsystemError);
      }
      
      console.log('GameEngine: Disposal complete');
      
      // Final hint to garbage collector
      setTimeout(() => {
        if (typeof global !== 'undefined' && global.gc) {
          try {
            global.gc();
          } catch (e) {
            // Ignore errors in garbage collection
          }
        }
      }, 100);
    } catch (error) {
      console.error('GameEngine: Fatal error during disposal:', error);
    }
  }
  
  /**
   * Helper method to dispose all textures from a material
   */
  private disposeAllMaterialTextures(material: THREE.Material): void {
    if (!material) return;
    
    // Handle various material types
    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial ||
        material instanceof THREE.MeshLambertMaterial ||
        material instanceof THREE.MeshPhongMaterial) {
        
      // Dispose standard texture maps
      if (material.map) material.map.dispose();
      if (material.normalMap) material.normalMap.dispose();
      if (material.bumpMap) material.bumpMap.dispose();
      if (material.roughnessMap) material.roughnessMap.dispose();
      if (material.metalnessMap) material.metalnessMap.dispose();
      if (material.aoMap) material.aoMap.dispose();
      if (material.emissiveMap) material.emissiveMap.dispose();
      if (material.displacementMap) material.displacementMap.dispose();
      if (material.alphaMap) material.alphaMap.dispose();
      if (material.lightMap) material.lightMap.dispose();
      
      // Additional maps for specific material types
      if (material instanceof THREE.MeshPhysicalMaterial) {
        if (material.clearcoatMap) material.clearcoatMap.dispose();
        if (material.clearcoatRoughnessMap) material.clearcoatRoughnessMap.dispose();
        if (material.clearcoatNormalMap) material.clearcoatNormalMap.dispose();
        if (material.sheenRoughnessMap) material.sheenRoughnessMap.dispose();
        if (material.sheenColorMap) material.sheenColorMap.dispose();
        if (material.transmissionMap) material.transmissionMap.dispose();
        if (material.thicknessMap) material.thicknessMap.dispose();
      }
      
      if (material instanceof THREE.MeshPhongMaterial) {
        if (material.specularMap) material.specularMap.dispose();
      }
    } else if (material instanceof THREE.MeshBasicMaterial) {
      if (material.map) material.map.dispose();
      if (material.alphaMap) material.alphaMap.dispose();
      if (material.specularMap) material.specularMap.dispose();
    } else if (material instanceof THREE.ShaderMaterial) {
      // Clean up any textures in the uniforms
      if (material.uniforms) {
        Object.values(material.uniforms).forEach(uniform => {
          if (uniform && uniform.value instanceof THREE.Texture) {
            uniform.value.dispose();
          }
        });
      }
    }
    
    // Clean up environment maps which apply to most material types
    if ('envMap' in material && material.envMap) {
      material.envMap.dispose();
    }
  }
}

// Exported function to initialize the game
// Use a singleton pattern to prevent multiple instances
let gameInstance: GameEngine | null = null;
let currentCanvasRef: HTMLCanvasElement | null = null;
let isInitializing = false;
let instanceId = 0;

export function initGame(canvas: HTMLCanvasElement) {
  const currentInstanceId = ++instanceId;
  console.log(`[Game Instance ${currentInstanceId}] Init called with canvas:`, canvas);

  if (!canvas) {
    console.error(`[Game Instance ${currentInstanceId}] Canvas is null or undefined!`);
    return function cleanup() {
      console.warn(`[Game Instance ${currentInstanceId}] Cleanup called for invalid canvas.`);
    };
  }

  // Check if we're being asked to initialize with the same canvas
  if (gameInstance && currentCanvasRef === canvas) {
    console.warn(`[Game Instance ${currentInstanceId}] Attempted to re-initialize on the same canvas. This might indicate React StrictMode double-render or improper cleanup.`);
    
    // Return the existing cleanup function since we're not creating a new instance
    return function cleanup() {
      console.log(`[Game Instance ${currentInstanceId}] Cleanup called for same-canvas re-initialization`);
      
      if (gameInstance && currentCanvasRef === canvas) {
        console.log(`[Game Instance ${currentInstanceId}] Disposing game instance from same-canvas cleanup`);
        gameInstance.dispose();
        gameInstance = null;
        currentCanvasRef = null;
      }
    };
  }
  
  // If we have an instance with a different canvas, we need to dispose it
  if (gameInstance) {
    console.log(`[Game Instance ${currentInstanceId}] Disposing existing game instance with different canvas`);
    
    try {
      // Properly dispose the existing instance to clean up all WebGL contexts
      gameInstance.dispose();
      
      // Force garbage collection hint by nullifying the instance
      gameInstance = null;
      currentCanvasRef = null;
      
      // Add a small delay to ensure complete WebGL context cleanup
      const startDispose = Date.now();
      console.log(`[Game Instance ${currentInstanceId}] Waiting for WebGL context cleanup...`);
      
      // Wait a moment to allow the renderer to fully dispose
      const disposeDelay = 100; // Increased to 100ms for better cleanup
      while (Date.now() - startDispose < disposeDelay) {
        // Busy wait to ensure synchronous execution
      }
    } catch (error) {
      console.error(`[Game Instance ${currentInstanceId}] Error disposing previous game instance:`, error);
    }
  }
  
  // Prevent concurrent initialization
  if (isInitializing) {
    console.log(`[Game Instance ${currentInstanceId}] Another initialization is in progress, waiting...`);
    
    // Return a cleanup function that does nothing, as we're not creating a new instance
    return function cleanup() {
      console.log(`[Game Instance ${currentInstanceId}] Cleanup called for aborted initialization`);
    };
  }
  
  isInitializing = true;
  console.log(`[Game Instance ${currentInstanceId}] Starting initialization with dimensions: ${canvas.clientWidth}x${canvas.clientHeight}`);
  
  try {
    // IMPORTANT: Instead of actually trying to get a WebGL context (which creates one),
    // we check for a special flag on the canvas to see if it's been used before
    try {
      // Use a safer approach that doesn't create a WebGL context
      if ((canvas as any).__webGLContextCreated) {
        console.error(`[Game Instance ${currentInstanceId}] Canvas seems to have a previous WebGL context based on our tracking`);
      } else {
        console.log(`[Game Instance ${currentInstanceId}] Canvas doesn't appear to have a previous WebGL context`);
        // Mark the canvas for future reference
        (canvas as any).__webGLContextCreated = true;
      }
    } catch (contextTestError) {
      console.warn(`[Game Instance ${currentInstanceId}] Error checking for previous WebGL context:`, contextTestError);
    }
    
    // Create new game instance
    gameInstance = new GameEngine(canvas);
    currentCanvasRef = canvas;
    
    // Start initialization process, but don't auto-start the game
    // We'll stay in MENU state until user explicitly starts the game
    gameInstance.initialize();
    
    // Ensure we're in MENU state (not auto-starting)
    setTimeout(() => {
      if (gameInstance && gameStateManager.state === 'READY') {
        console.log(`[Game Instance ${currentInstanceId}] Forcing state to MENU instead of auto-starting`);
        gameStateManager.setState('MENU');
      }
    }, 2000); // Add a safety timeout to catch any automatic transitions
  } catch (error) {
    console.error(`[Game Instance ${currentInstanceId}] Error during game initialization:`, error);
    gameInstance = null;
    currentCanvasRef = null;
  } finally {
    isInitializing = false;
  }
  
  // Return cleanup function with instance tracking
  return function cleanup() {
    console.log(`[Game Instance ${currentInstanceId}] Cleanup called for canvas:`, canvas);
    
    if (gameInstance && currentCanvasRef === canvas) {
      try {
        console.log(`[Game Instance ${currentInstanceId}] Disposing game instance`);
        gameInstance.dispose();
        gameInstance = null;
        currentCanvasRef = null;
      } catch (error) {
        console.error(`[Game Instance ${currentInstanceId}] Error during cleanup:`, error);
        // Force clearing references even if disposal failed
        gameInstance = null;
        currentCanvasRef = null;
      }
    } else if (gameInstance && currentCanvasRef !== canvas) {
      console.warn(`[Game Instance ${currentInstanceId}] Cleanup called for different canvas than current instance. Not disposing.`);
    } else {
      console.log(`[Game Instance ${currentInstanceId}] No game instance to dispose.`);
    }
  };
}