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
import { getRenderingInitializer } from './RenderingInitializer';
import { getPerformanceMonitor, reportLongTask } from '../utils/PerformanceMonitor';
import { getQualityAdjuster, applyQualitySettings as applyQualityToEntity } from '../utils/QualityAdjuster';
import { initPerformanceDiagnostics } from '../utils/diagnostics';
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
  
  // Camera properties
  private cameraDistance: number = 8; // Fixed distance from player origin
  private cameraHeight: number = 2.0; // Fixed camera height
  private lookAtOffsetY: number = 0; // Look slightly ahead/below
  private cameraLerpFactor: number = 2.0; // Smooth camera movement factor
  
  // Fixed camera parameters
  private fixedCameraMode: boolean = true; // Use fixed approach
  private cameraCenterOffset: number = 0; // Fixed offset toward center
  
  // Rendering debug flags
  private renderErrorLogged = false;
  private renderErrorCount = 0;
  private lastRenderErrorTime = 0;
  private renderCount = 0;
  
  /**
   * Initialize the game engine with pre-initialized components
   * @param options - Initialized components and system options
   */
  constructor(options: {
    // Core rendering system (provided by RenderingInitializer)
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    
    // Core services
    assetManager: AssetManager;
    audioManager: AudioManager;
    
    // Device capabilities (from RenderingInitializer)
    deviceCapabilities: ReturnType<typeof detectDeviceCapabilities>;
    gameSettings: ReturnType<typeof configureGameSettings>;
  }) {
    // Store provided core components
    this.renderer = options.renderer;
    this.scene = options.scene;
    this.camera = options.camera;
    this.assetManager = options.assetManager;
    this.audioManager = options.audioManager;
    this.deviceCapabilities = options.deviceCapabilities;
    this.gameSettings = options.gameSettings;

    // Initialize input handler (internal to GameEngine)
    this.inputHandler = new InputHandler();
    
    // Set up game loop with empty functions initially
    this.gameLoop = new GameLoop({
      updateFn: () => {},
      fixedUpdateFn: () => {},
      renderFn: () => {},
      fixedTimeStep: 1/60 // 60 fps physics
    });
    
    // Register event listeners
    eventBus.on('game-state-change', this.handleGameStateChange.bind(this));
    eventBus.on('performance-quality-change', this.handleQualityChange.bind(this));
    eventBus.on('performance-update', this.handlePerformanceUpdate.bind(this));
    
    // Setup window resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Apply quality settings to game loop
    this.applyQualitySettingsToGameLoop();
    
    // Log initialization success
    console.log('GameEngine: Successfully initialized with pre-initialized components');
  }
  
  /**
   * Apply quality settings to game loop based on current quality level
   */
  private applyQualitySettingsToGameLoop(): void {
    const qualityAdjuster = getQualityAdjuster();
    const qualityPreset = qualityAdjuster.getQualityPreset();
    
    // Adjust fixed time step based on quality level
    // Lower quality = slightly fewer physics updates to improve performance
    if (qualityPreset.animationFrameSkip > 0) {
      const newTimeStep = (1/60) * (qualityPreset.animationFrameSkip + 1);
      this.gameLoop.setFixedTimeStep(newTimeStep);
      console.log(`GameEngine: Adjusted physics time step to ${newTimeStep.toFixed(4)}s based on quality settings`);
    }
  }
  
  /**
   * Fully initialize game systems with pre-initialized components
   * No longer loads assets or initializes audio - those are handled by GameStartController
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isLoading) return;
    
    // Set internal loading flag but don't change global game state
    this.isLoading = true;
    console.log('GameEngine: Starting internal systems initialization (using pre-initialized components)');
    
    try {
      // Skip asset loading and audio initialization - already done by GameStartController
      // These components should be injected through the constructor
      if (!this.assetManager || !this.audioManager || !this.renderer || !this.camera || !this.scene) {
        throw new Error('GameEngine: Initialization failed - required components not provided');
      }
      
      console.log('GameEngine: Using pre-initialized assets and audio systems');
      
      // Get quality settings from QualityAdjuster
      const qualityAdjuster = getQualityAdjuster();
      const qualityPreset = qualityAdjuster.getQualityPreset();
      const qualityLevel = qualityAdjuster.getQuality();
      
      console.log(`GameEngine: Initializing with quality level: ${qualityLevel}`);
      
      // Initialize environment with quality awareness
      this.environment = new ProceduralEnvironment(
        this.scene,
        this.renderer,
        this.assetManager
      );
      
      // Configure environment to use direct procedural generation (no asset loading)
      this.environment.setIgnoreAssets(true);
      
      // Apply quality settings to environment
      applyQualityToEntity(this.environment, (preset) => {
        // Adjust environment details based on quality preset
        this.environment.setDetailLevel(preset.entityDetailLevel);
        this.environment.setMaxDecorations(preset.maxDecorations);
        
        console.log(`GameEngine: Applied environment quality settings - Detail: ${preset.entityDetailLevel}, Max Decorations: ${preset.maxDecorations}`);
      });
      
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
      
      // Apply quality settings to obstacle manager
      applyQualityToEntity(this.obstacleManager, (preset) => {
        // Apply quality settings to obstacle manager
        this.obstacleManager.setMaxObstacles(preset.maxObstacles);
        this.obstacleManager.setSpawnRate(preset.obstacleSpawnRate);
        this.obstacleManager.setUseSimplifiedColliders(preset.useSimplifiedColliders);
        this.obstacleManager.setDetailLevel(preset.entityDetailLevel);
        
        console.log(`GameEngine: Applied obstacle quality settings - Max: ${preset.maxObstacles}, Detail: ${preset.entityDetailLevel}`);
      });
      
      // Initialize collectible manager
      this.collectibleManager = new CollectibleManager(
        this.scene, 
        this.assetManager,
        this.deviceCapabilities
      );
      
      // Apply quality settings to collectible manager
      applyQualityToEntity(this.collectibleManager, (preset) => {
        // Apply quality settings to collectible manager
        this.collectibleManager.setMaxCollectibles(preset.maxCollectibles);
        this.collectibleManager.setDetailLevel(preset.entityDetailLevel);
        this.collectibleManager.setMaxParticles(preset.maxParticles / 5); // Use a portion of the total particle budget
        
        console.log(`GameEngine: Applied collectible quality settings - Max: ${preset.maxCollectibles}, Particles: ${preset.maxParticles / 5}`);
      });
      
      // Initialize power-up effects
      this.powerUpEffects = new PowerUpEffects(this.scene);
      
      // For now, the player is enough since PowerUpEffects needs the mesh property
      // We'll need to update this if we continue refactoring to fully decouple mesh
      this.powerUpEffects.setCharacter(this.player as any);
      
      // Set up game loop with proper update functions
      this.gameLoop.setUpdateFn(this.updateGame.bind(this));
      this.gameLoop.setFixedUpdateFn(this.updatePhysics.bind(this));
      // Render function delegates to RenderingInitializer
      this.gameLoop.setRenderFn(this.render.bind(this));
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      this.isLoading = false;
      
      // Initialize performance diagnostics
      initPerformanceDiagnostics({
        enableLogging: true,
        sampleInterval: 10000 // Sample every 10 seconds
      });
      console.log('GameEngine: Performance diagnostics initialized');
      
      // Start the game loop (even in menu state)
      this.gameLoop.start();
      
      // DO NOT transition to any state after initialization
      // GameStartController now solely controls the game state during initialization
      // This ensures we don't override the MENU state that GameStartController sets
    } catch (error) {
      console.error('Game initialization failed:', error);
      this.isLoading = false;
      
      // Ensure we display a message to the user
      alert('Game initialization failed. Please try refreshing the page.');
      
      // Don't try to modify the state here
      // Log the error but let GameStartController manage the game state
      // This prevents race conditions where both components try to set the state
      console.log('GameEngine: Not modifying game state after error, GameStartController will manage state transitions');
    }
  }
  
  /**
   * Load required game assets
   */
  private async loadAssets(): Promise<void> {
    // Check if asset manager is properly initialized
    if (!this.assetManager) {
      console.warn('GameEngine: Cannot load assets - asset manager not initialized');
      
      // Emit a 100% progress event to ensure the loading screen doesn't get stuck
      eventBus.emit('asset-loading-progress', { 
        progress: 100, 
        loaded: 100, 
        total: 100 
      });
      
      return;
    }
    
    // Report asset loading progress
    const progressHandler = (progress: number) => {
      if (this.assetManager) {
        const progressInfo = this.assetManager.getLoadingProgress();
        eventBus.emit('asset-loading-progress', { 
          progress: Math.floor(progress * 100), 
          loaded: progressInfo.completed, 
          total: progressInfo.total 
        });
      } else {
        // Fallback if asset manager becomes unavailable
        eventBus.emit('asset-loading-progress', { 
          progress: Math.floor(progress * 100), 
          loaded: 1, 
          total: 1 
        });
      }
    };
    
    try {
      // No need to register core assets again since we already did in the constructor
      // This avoids duplicating registrations
      console.log('Loading essential assets with procedurally generated placeholders...');
      
      // Since assets are already marked as procedurally generated, 
      // loadAll will just mark them as loaded without attempting to fetch files
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
        // Start menu music with safety check
        if (this.audioManager) {
          this.audioManager.stopBackgroundMusic();
          this.audioManager.playBackgroundMusic();
        }
        
        // Reset camera to menu position with safety check
        if (this.camera) {
          this.camera.position.set(0, 2.0, 10);
          this.camera.lookAt(0, 0, 0);
        }
        
        // Clear game elements if coming from game over
        if (from === 'GAME_OVER') {
          this.resetGame();
        }
        break;
        
      case 'LOADING':
        // GameStartController now manages initialization
        // We'll only track this state change but not trigger initialization
        console.log('GameEngine: LOADING state detected, GameStartController should manage initialization');
        break;
        
      case 'READY':
        // Play countdown sound with safety check
        if (this.audioManager) {
          this.audioManager.playSoundEffect('countdown');
        }
        
        // Prepare for gameplay and reset camera
        this.prepareGame();
        
        // Make sure camera is properly set for gameplay
        if (this.fixedCameraMode) {
          // Reset fixed camera parameters
          this.cameraDistance = 8;
          this.cameraHeight = 2.0;
          this.cameraCenterOffset = 0;
          this.lookAtOffsetY = 0;
          
          // Position camera if player and mesh exist
          if (this.player && this.player.mesh) {
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
          } else {
            // Fallback camera position if player mesh is not available
            this.camera.position.set(
              this.cameraCenterOffset,
              this.cameraHeight,
              this.cameraDistance
            );
            
            // Look ahead
            this.camera.lookAt(
              this.cameraCenterOffset,
              this.lookAtOffsetY,
              -10
            );
          }
        }
        break;
        
      case 'PLAYING':
        // Start background music if coming from another state
        if (from === 'READY' || from === 'MENU' || from === 'LOADING') {
          if (this.audioManager) {
            this.audioManager.playSoundEffect('game-start');
          }
          
          // No need to emit game-start-movement here
          // This is now handled by GameStateManager.handleStateSpecifics
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
        // Play game over sound with safety check
        if (this.audioManager) {
          this.audioManager.playSoundEffect('game-over');
        }
        break;
    }
  }
  
  /**
   * Prepare the game for playing - called when entering READY state
   */
  private prepareGame(): void {
    // Safety check for player initialization
    if (!this.player) {
      console.warn('GameEngine: Cannot prepare game - player not initialized');
      return;
    }
    
    // Reset player position
    this.player.resetPosition();
    
    // Safety check for obstacle manager
    if (!this.obstacleManager) {
      console.warn('GameEngine: Cannot prepare game - obstacle manager not initialized');
      return;
    }
    
    // Generate initial obstacles
    this.obstacleManager.clear();
    
    // Safely get player position
    try {
      const playerPosition = this.player.getPosition();
      if (playerPosition) {
        // Update with full position vector, even in setup
        this.obstacleManager.update(0, playerPosition, 0);
      } else {
        console.warn('GameEngine: Cannot initialize obstacles - player position is undefined');
      }
    } catch (error) {
      console.error('GameEngine: Error getting player position for obstacle initialization:', error);
    }
    
    // Safety check for collectible manager
    if (!this.collectibleManager) {
      console.warn('GameEngine: Cannot prepare game - collectible manager not initialized');
      return;
    }
    
    // Clear collectibles
    this.collectibleManager.clear();
    
    // Reset camera based on fixed approach
    try {
      // Get fresh player position
      const playerPos = this.player ? this.player.getPosition() : null;
      
      if (this.fixedCameraMode && playerPos) {
        // Reset camera with consistent parameters
        this.cameraDistance = 8;
        this.cameraHeight = 2.0;
        
        // Set camera to fixed position
        this.camera.position.set(
          this.cameraCenterOffset, 
          this.cameraHeight, 
          playerPos.z + this.cameraDistance
        );
        
        // Look ahead along path
        this.camera.lookAt(
          this.cameraCenterOffset,
          this.lookAtOffsetY,
          playerPos.z - 10
        );
      } else {
        // Legacy camera reset or fallback if player position is undefined
        this.camera.position.set(0, 3, 10);
        this.camera.lookAt(0, 0, 0);
      }
    } catch (error) {
      console.error('GameEngine: Error resetting camera position:', error);
      
      // Ensure camera is reset to a safe position in case of errors
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
    
    // Safety check for player existence
    if (!this.player) {
      console.warn('GameEngine: Cannot update game - player is undefined');
      return;
    }
    
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
      if (this.obstacleManager) {
        this.obstacleManager.update(deltaTime, playerPos, this.playerSpeed * deltaTime);
      }
      
      // Update collectibles
      if (this.collectibleManager) {
        this.collectibleManager.update(deltaTime, playerPos, this.playerSpeed);
      }
    }
    
    // Update power-up effects
    if (this.powerUpEffects) {
      this.powerUpEffects.update(deltaTime);
    }
    
    // Update distance in game state manager
    gameStateManager.updateDistance(this.playerSpeed * deltaTime);
    
    // Move the camera to follow the player
    this.updateCamera(deltaTime);
  }
  
  /**
   * Update camera position to follow player
   */
  private updateCamera(deltaTime: number): void {
    // Ensure player exists
    if (!this.player) {
      console.warn('GameEngine: Cannot update camera - player is undefined');
      return;
    }
    
    try {
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
      } else {
        // If for some reason we don't have a valid player position, use fallback
        console.warn('GameEngine: Player position is undefined, using fallback camera position');
        
        // Set reasonable defaults for camera
        this.camera.position.set(
          this.cameraCenterOffset,
          this.cameraHeight,
          this.cameraDistance
        );
        
        // Look ahead
        this.camera.lookAt(
          this.cameraCenterOffset,
          this.lookAtOffsetY,
          -10
        );
      }
    } catch (error) {
      console.error('GameEngine: Error updating camera:', error);
      
      // Set safe fallback camera position
      this.camera.position.set(0, 2.0, 10);
      this.camera.lookAt(0, 0, 0);
    }
  }
  
  /**
   * Delegate rendering to RenderingInitializer
   */
  private render(interpolation: number): void {
    // Get the rendering initializer instance
    const renderingInitializer = getRenderingInitializer();
    
    // Delegate rendering to RenderingInitializer
    if (this.renderer && this.scene && this.camera) {
      // Add debug count to track rendering (remove in production)
      if (!this.renderCount) {
        this.renderCount = 0;
        console.log('GameEngine: First render call with delegated rendering');
      }
      
      // Log every 100 frames for testing
      this.renderCount++;
      if (this.renderCount % 100 === 0) {
        console.log(`GameEngine: Rendering frame ${this.renderCount} with delegated rendering`);
      }
      
      renderingInitializer.render(
        this.renderer,
        this.scene,
        this.camera,
        gameStateManager.state
      );
    } else {
      // Only log this error once to prevent console spam
      if (!this.renderErrorLogged) {
        console.warn('Cannot render: renderer, scene, or camera is null');
        this.renderErrorLogged = true;
        
        // After 5 seconds, allow logging again in case the issue persists
        setTimeout(() => {
          this.renderErrorLogged = false;
        }, 5000);
      }
    }
  }
  
  /**
   * Handle renderer recovery
   */
  private handleRendererRecovery(): void {
    if (this.renderer) {
      try {
        // Since we can't access the private recovery method, 
        // we'll handle recovery inline
        console.log('GameEngine: Attempting manual renderer recovery');
        
        // Force a new render call
        if (this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
        
        // Reset error tracking
        this.renderErrorCount = 0;
        this.renderErrorLogged = false;
      } catch (recoveryError) {
        console.error('Failed to recover renderer:', recoveryError);
      }
    }
  }
  
  // Emergency optimizations have been removed in favor of the centralized quality system
  
  /**
   * Handle quality change events from PerformanceMonitor
   */
  private handleQualityChange(data: { quality: string, reason: string }): void {
    console.log(`GameEngine: Quality changed to ${data.quality} due to ${data.reason}`);
    
    // Apply new quality settings to game loop
    this.applyQualitySettingsToGameLoop();
    
    // Quality settings for entities are applied automatically through registered handlers
    // from applyQualityToEntity() calls during initialization
  }
  
  /**
   * Handle performance update events from the centralized PerformanceMonitor
   */
  private handlePerformanceUpdate(data: { metrics: any }): void {
    // No need to check for performance issues here anymore
    // PerformanceMonitor now handles this and emits appropriate events
    
    // We could log performance metrics to server/analytics here if needed
  }
  
  // Flag removed: emergencyOptimizationsApplied
  
  // The emergency optimization function has been removed in favor of:
  // 1. Centralized performance monitoring in PerformanceMonitor
  // 2. Using QualityAdjuster to handle quality level changes
  // 3. Having game entities adapt to quality settings through their handlers
  
  // Systems now listen for 'performance-quality-change' and 'quality-settings-changed' events
  // to adapt their settings, which is a cleaner and more maintainable approach.
  
  // If special handling is needed for severe performance events, systems should
  // listen for the 'severe-performance-warning' event emitted by PerformanceMonitor.
  
  /**
   * Handle window resize by delegating to RenderingInitializer
   */
  private handleResize(): void {
    // Delegate resize handling to RenderingInitializer
    if (this.renderer && this.camera) {
      const renderingInitializer = getRenderingInitializer();
      renderingInitializer.handleResize(this.renderer, this.camera);
    }
  }
  
  /**
   * Reset game to initial state
   */
  private resetGame(): void {
    // Safety check for player initialization
    if (!this.player) {
      console.warn('GameEngine: Cannot reset game - player not initialized');
      return;
    }
    
    // Reset player position
    this.player.resetPosition();
    
    // Safety check for managers
    if (!this.obstacleManager || !this.collectibleManager) {
      console.warn('GameEngine: Cannot reset game - managers not fully initialized');
      return;
    }
    
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
      
      // Apply these settings to the camera if player and mesh exists
      if (this.player && this.player.mesh) {
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
      } else {
        // Fallback camera position if player mesh is not available
        this.camera.position.set(
          this.cameraCenterOffset,
          this.cameraHeight,
          this.cameraDistance
        );
        
        // Look ahead
        this.camera.lookAt(
          this.cameraCenterOffset,
          this.lookAtOffsetY,
          -10
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
      
      // Reset player position if player exists
      if (this.player) {
        this.player.resetPosition();
      }
      
      // Reset obstacles
      this.obstacleManager.clear();
      if (this.player && this.player.mesh) {
        this.obstacleManager.update(0, this.player.mesh.position, 0);
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
  
  // These methods are now handled by RenderingInitializer
  
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
        const boundHandleQualityChange = this.handleQualityChange.bind(this);
        const boundHandlePerformanceUpdate = this.handlePerformanceUpdate.bind(this);
        
        eventBus.off('game-state-change', boundHandleGameStateChange);
        eventBus.off('performance-quality-change', boundHandleQualityChange);
        eventBus.off('performance-update', boundHandlePerformanceUpdate);
        
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
          'game-update',
          'emergency-performance-mode'
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
            if (gl) {
              // Type check to ensure gl has getExtension method
              const context = gl as WebGLRenderingContext;
              if (typeof context.getExtension === 'function') {
                const ext = context.getExtension('WEBGL_lose_context');
                if (ext) {
                  console.log('GameEngine: Successfully forcing WebGL context loss...');
                  ext.loseContext();
                } else {
                  console.log('GameEngine: WEBGL_lose_context extension not available');
                }
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
        
      // Dispose common texture maps
      if (material.map) material.map.dispose();
      if (material.bumpMap) material.bumpMap.dispose();
      if (material.alphaMap) material.alphaMap.dispose();
      if (material.lightMap) material.lightMap.dispose();
      
      // Handle specific material types that have special maps
      if (material instanceof THREE.MeshStandardMaterial || 
          material instanceof THREE.MeshPhysicalMaterial) {
        if (material.normalMap) material.normalMap.dispose();
        if (material.roughnessMap) material.roughnessMap.dispose();
        if (material.metalnessMap) material.metalnessMap.dispose();
        if (material.aoMap) material.aoMap.dispose();
        if (material.emissiveMap) material.emissiveMap.dispose();
        if (material.displacementMap) material.displacementMap.dispose();
      }
      
      // MeshPhongMaterial has some of the same maps as MeshStandardMaterial
      if (material instanceof THREE.MeshPhongMaterial) {
        if (material.normalMap) material.normalMap.dispose();
        if (material.emissiveMap) material.emissiveMap.dispose();
        if (material.displacementMap) material.displacementMap.dispose();
      }
      
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
    // Use type guards to ensure the envMap property exists and has a dispose method
    if ('envMap' in material && 
        material.envMap && 
        material.envMap instanceof THREE.Texture) {
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

export async function initGame(
  canvas: HTMLCanvasElement,
  // Accept pre-initialized components instead of creating them
  components: {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    assetManager: AssetManager;
    audioManager: AudioManager;
    deviceCapabilities: ReturnType<typeof detectDeviceCapabilities>;
    gameSettings: ReturnType<typeof configureGameSettings>;
  }
) {
  const currentInstanceId = ++instanceId;
  console.log(`[Game Instance ${currentInstanceId}] initGame called with pre-initialized components`);

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
  console.log(`[Game Instance ${currentInstanceId}] Starting GameEngine initialization with pre-initialized components`);
  
  try {
    // Mark the canvas for future reference - canvas tracking still needed for cleanup
    (canvas as any).__webGLContextCreated = true;
    
    // Create new game instance with pre-initialized components
    console.log(`[Game Instance ${currentInstanceId}] Creating GameEngine instance with pre-initialized components`);
    gameInstance = new GameEngine({
      renderer: components.renderer,
      scene: components.scene,
      camera: components.camera,
      assetManager: components.assetManager,
      audioManager: components.audioManager,
      deviceCapabilities: components.deviceCapabilities,
      gameSettings: components.gameSettings
    });
    console.log(`[Game Instance ${currentInstanceId}] GameEngine instance created successfully`);
    currentCanvasRef = canvas;
    
    // Initialize GameEngine logic only - no more asset loading or audio init
    console.log(`[Game Instance ${currentInstanceId}] Initializing GameEngine internal game systems...`);
    await gameInstance.initialize();
    
    console.log(`[Game Instance ${currentInstanceId}] GameEngine fully initialized.`);
  } catch (error) {
    console.error(`[Game Instance ${currentInstanceId}] Error during GameEngine initialization:`, error);
    gameInstance = null;
    currentCanvasRef = null;
    throw error; // Re-throw for better error handling
  } finally {
    isInitializing = false;
  }
  
  // Return cleanup function
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