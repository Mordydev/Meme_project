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
import { ProceduralEnvironment } from '../entities/environment/ProceduralEnvironment';
import { detectDeviceCapabilities, applyQualitySettings, configureGameSettings } from '../utils/DeviceUtils';
import gameStateManager, { GameState } from './GameStateManager';
import { WaterEffects } from '../entities/environment/WaterEffects';

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
  private player: Character;
  private collisionSystem: CollisionSystem;
  private obstacleManager: ObstacleManager;
  private collectibleManager: CollectibleManager;
  private environment: ProceduralEnvironment;
  private waterEffects: WaterEffects;
  
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
      await this.audioManager.loadSoundEffects();
      
      // Add lighting 
      this.setupLighting();
      
      // Initialize environment
      const environmentQuality = this.deviceCapabilities.highEnd ? 'high' : 
                              this.deviceCapabilities.midRange ? 'medium' : 'low';
      this.environment = new ProceduralEnvironment(
        this.scene, 
        this.assetManager, 
        environmentQuality as 'low' | 'medium' | 'high'
      );
      
      // Initialize water effects
      this.waterEffects = new WaterEffects(
        this.scene,
        environmentQuality as 'low' | 'medium' | 'high'
      );
      
      // Initialize player character
      this.player = new Character(this.scene, this.assetManager);
      
      // Initialize collision system
      this.collisionSystem = new CollisionSystem(this.player);
      
      // Initialize obstacle manager
      this.obstacleManager = new ObstacleManager(
        this.scene, 
        this.assetManager, 
        this.collisionSystem,
        this.gameSettings
      );
      
      // Initialize collectible manager
      this.collectibleManager = new CollectibleManager(
        this.scene, 
        this.assetManager,
        this.gameSettings
      );
      
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
      // Example asset loading with progress reporting
      await this.assetManager.loadModel('character', '/models/fish.glb');
      assetsLoaded++;
      reportProgress(assetsLoaded, totalAssets);
      
      await this.assetManager.loadTexture('bubble', '/textures/bubble.png');
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
        
        // Prepare for gameplay
        this.prepareGame();
        break;
        
      case 'PLAYING':
        // Start background music if first time entering PLAYING state
        if (from === 'READY') {
          this.audioManager.playSoundEffect('game-start');
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
    this.obstacleManager.update(0, this.player.mesh.position.z, 0);
    
    // Clear collectibles
    this.collectibleManager.clear();
    
    // Reset camera
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Update physics with fixed timestep
   */
  private updatePhysics(fixedTimeStep: number): void {
    if (gameStateManager.state !== 'PLAYING') return;
    
    // Update environment with player position
    this.environment.update(fixedTimeStep, this.player.mesh.position.z);
    
    // Update water effects
    this.waterEffects.update(fixedTimeStep, this.player.mesh.position);
    
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
    
    // Emit player position for obstacle triggers
    eventBus.emit('player-position', this.player.mesh.position);
    
    // Update obstacles
    this.obstacleManager.update(deltaTime, this.player.mesh.position.z, this.playerSpeed * deltaTime);
    
    // Update collectibles
    this.collectibleManager.update(deltaTime, this.player.mesh.position.z);
    
    // Update distance in game state manager
    gameStateManager.updateDistance(this.playerSpeed * deltaTime);
    
    // Move the camera to follow the player
    this.updateCamera(deltaTime);
  }
  
  /**
   * Update camera position to follow player
   */
  private updateCamera(deltaTime: number): void {
    // Move camera forward
    this.camera.position.z -= this.playerSpeed * deltaTime;
    
    // Keep camera behind player
    const targetCameraZ = this.player.mesh.position.z + 5;
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCameraZ, deltaTime * 2);
    
    // Adjust camera look target
    this.camera.lookAt(
      this.player.mesh.position.x, 
      this.player.mesh.position.y, 
      this.player.mesh.position.z
    );
  }
  
  /**
   * Render the scene
   */
  private render(interpolation: number): void {
    // Different render effects based on game state
    const time = performance.now() * 0.001;
    
    if (gameStateManager.state === 'PLAYING' || gameStateManager.state === 'PAUSED') {
      // Render wobble effect for underwater feel
      this.camera.position.y = Math.sin(time * 0.5) * 0.05 + 2.0;
      this.camera.rotation.z = Math.sin(time * 0.2) * 0.01;
    } else {
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
    
    // Reset camera position for menu
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 0, 0);
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
  }
  
  /**
   * Apply or remove power-up effects to game entities
   */
  private applyPowerupEffects(type: string, active: boolean): void {
    switch (type) {
      case 'powerup_shield':
        // Visual shield effect handled by HealthDisplay component
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
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Position the camera
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);
    
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
    
    // Clean up game entities
    if (this.isInitialized) {
      this.player.dispose();
      this.obstacleManager.dispose();
      this.collectibleManager.dispose();
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
  
  // Start initialization process
  gameInstance.initialize();
  
  // Return cleanup function
  return function cleanup() {
    if (gameInstance) {
      gameInstance.dispose();
      gameInstance = null;
    }
  };
}