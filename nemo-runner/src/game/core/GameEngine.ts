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
      this.collisionSystem = new CollisionSystem(this.player);
      
      // Initialize obstacle manager
      this.obstacleManager = new ObstacleManager(
        this.scene, 
        this.assetManager, 
        this.collisionSystem
      );
      
      // Initialize collectible manager
      this.collectibleManager = new CollectibleManager(
        this.scene, 
        this.assetManager,
        this.deviceCapabilities
      );
      
      // Initialize power-up effects
      this.powerUpEffects = new PowerUpEffects(this.scene);
      if (this.player.mesh) {
        this.powerUpEffects.setCharacter(this.player.mesh);
      }
      
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
      gameStateManager.setState('MENU');
    }
  }
  
  /**
   * Load required game assets
   */
  private async loadAssets(): Promise<void> {
    // Report asset loading progress
    const reportProgress = (loaded: number, total: number) => {
      const progress = Math.floor((loaded / total) * 100);
      eventBus.emit('asset-loading-progress', { progress, loaded, total });
    };
    
    // Setup loading progress tracking
    let assetsLoaded = 0;
    const totalAssets = 6; // Adjust based on actual asset count
    
    // Add asset loading sequences here
    // For each asset, increment assetsLoaded and report progress
    try {
      // Only simulate asset loading to avoid issues
      // In a real implementation, we would use proper asset loading
      await new Promise(resolve => setTimeout(resolve, 300));
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      // Simulate loading other assets for now
      // In a real implementation, replace with actual asset loading
      await new Promise(resolve => setTimeout(resolve, 300));
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      // Complete asset loading
      reportProgress(totalAssets, totalAssets);
    } catch (error) {
      console.error('Asset loading failed:', error);
      throw error;
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
        // Start background music if first time entering PLAYING state
        if (from === 'READY') {
          this.audioManager.playSoundEffect('game-start');
          
          // Explicitly signal the game to start character movement
          eventBus.emit('game-start-movement', { startTime: Date.now() });
          console.log('Emitting game-start-movement event from GameEngine');
        }
        
        // Resume game loop if it was paused
        if (from === 'PAUSED') {
          this.gameLoop.resume();
        }
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
    if (this.player.mesh) {
      this.obstacleManager.update(0, this.player.mesh.position.z, 0);
    }
    
    // Clear collectibles
    this.collectibleManager.clear();
    
    // Reset camera based on fixed approach
    if (this.fixedCameraMode && this.player.mesh) {
      // Reset camera with consistent parameters
      this.cameraDistance = 8;
      this.cameraHeight = 2.0;
      
      // Set camera to fixed position
      this.camera.position.set(
        this.cameraCenterOffset, 
        this.cameraHeight, 
        this.player.mesh.position.z + this.cameraDistance
      );
      
      // Look ahead along path
      this.camera.lookAt(
        this.cameraCenterOffset,
        this.lookAtOffsetY,
        this.player.mesh.position.z - 10
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
    if (this.player.mesh) {
      this.environment.update(this.player.mesh.position, this.camera, fixedTimeStep);
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
    
    // Only proceed with position-dependent updates if mesh exists
    if (this.player.mesh) {
      // Emit player position for obstacle triggers
      eventBus.emit('player-position', this.player.mesh.position);
      
      // Update obstacles
      this.obstacleManager.update(deltaTime, this.player.mesh.position.z, this.playerSpeed * deltaTime);
      
      // Update collectibles
      this.collectibleManager.update(deltaTime, this.player.mesh.position, this.playerSpeed);
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
    if (this.fixedCameraMode && this.player.mesh) {
      // FIXED CAMERA APPROACH:
      // In this mode, the camera stays directly behind the player's forward path
      // It only follows in Z direction, completely ignoring lane changes
      // This prevents ANY zoom effect since the perspective never changes
      
      // Simply maintain a fixed Z offset behind the player
      this.camera.position.z = this.player.mesh.position.z + this.cameraDistance;
      
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
        this.player.mesh.position.z - 10 // Look AHEAD of player
      );
    } else if (this.player.mesh) {
      // DYNAMIC CAMERA APPROACH (Original logic - not used)
      // Note: This is preserved but not used since fixed approach is better
      
      // Keep camera behind player at a consistent distance
      const targetCameraZ = this.player.mesh.position.z + this.cameraDistance;
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
      this.camera.lookAt(0, 0, this.player.mesh.position.z - 10);
    }
  }
  
  /**
   * Render the scene
   */
  private render(interpolation: number): void {
    // Different render effects based on game state
    const time = performance.now() * 0.001;
    
    if (gameStateManager.state === 'PLAYING' || gameStateManager.state === 'PAUSED') {
      if (this.fixedCameraMode) {
        // FIXED CAMERA MODE EFFECTS
        // Much subtler effects that don't affect camera position or look direction
        
        // Apply a VERY subtle camera roll for underwater feeling
        // This only affects rotation around Z axis, not position or direction
        const subtleRoll = Math.sin(time * 0.2) * 0.002; // Extremely minor roll
        this.camera.rotation.z = subtleRoll;
        
        // The fixed camera approach maintains the same exact perspective
        // regardless of the player's lane position
      }
      else {
        // DYNAMIC CAMERA MODE EFFECTS - not used but preserved
        const wobbleAmplitude = 0.03;
        this.cameraHeight = 2.0 + Math.sin(time * 0.5) * wobbleAmplitude;
        
        if (this.player?.mesh) {
          const targetTilt = this.player.mesh.position.x * -0.005;
          this.camera.rotation.z = THREE.MathUtils.lerp(
            this.camera.rotation.z,
            targetTilt + Math.sin(time * 0.2) * 0.003,
            0.03
          );
        }
      }
    } else {
      // MENU STATE CAMERA
      // For the menu, we want more dramatic effects
      
      // Subtle camera movement for menu
      this.camera.position.y = 2.0 + Math.sin(time * 0.2) * 0.1;
      this.camera.rotation.z = Math.sin(time * 0.1) * 0.02;
      
      // Slowly rotate camera in menu
      if (gameStateManager.state === 'MENU') {
        this.camera.position.x = Math.sin(time * 0.1) * 3;
        this.camera.position.z = Math.cos(time * 0.1) * 3 + 10;
        this.camera.lookAt(0, 0, 0);
      }
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
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
   * Initialize renderer
   */
  private setupRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: this.deviceCapabilities.highEnd || this.deviceCapabilities.midRange, 
      powerPreference: 'high-performance',
      alpha: false
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = Math.min(
      window.devicePixelRatio, 
      this.deviceCapabilities.highEnd ? 2 : 1.5
    );
    renderer.setPixelRatio(pixelRatio);
    
    // Apply quality settings based on device capabilities
    applyQualitySettings(renderer, this.deviceCapabilities);
    
    return renderer;
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
   * Clean up and dispose resources
   */
  dispose(): void {
    // Stop the game loop
    this.gameLoop.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    eventBus.off('game-state-change', this.handleGameStateChange.bind(this));
    
    // Safely remove other event listeners by providing empty callback
    const noop = () => {};
    eventBus.off('character-lane-change', noop); // Clean up the lane change listener
    eventBus.off('lane-change-complete', noop); // Clean up the completion listener
    
    // Clean up game entities
    if (this.isInitialized) {
      this.player.dispose();
      this.obstacleManager.dispose();
      this.collectibleManager.dispose();
      this.powerUpEffects.dispose();
      this.environment.dispose();
      this.waterEffects.dispose();
    }
    
    // Clean up ThreeJS resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        }
      }
    });
    
    this.renderer.dispose();
    
    // Clean up audio system
    this.audioManager.dispose();
    
    // Clean up asset manager
    this.assetManager.dispose();
    
    // Clean up input handler
    this.inputHandler.cleanup();
  }
}

// Exported function to initialize the game
let gameInstance: GameEngine | null = null;

export function initGame(canvas: HTMLCanvasElement) {
  // Create game instance
  gameInstance = new GameEngine(canvas);
  
  // Start initialization process, but don't auto-start the game
  // We'll stay in MENU state until user explicitly starts the game
  gameInstance.initialize();
  
  // Ensure we're in MENU state (not auto-starting)
  setTimeout(() => {
    if (gameInstance && gameStateManager.state === 'READY') {
      console.log('Forcing state to MENU instead of auto-starting');
      gameStateManager.setState('MENU');
    }
  }, 2000); // Add a safety timeout to catch any automatic transitions
  
  // Return cleanup function
  return function cleanup() {
    if (gameInstance) {
      gameInstance.dispose();
      gameInstance = null;
    }
  };
}