import * as THREE from 'three';
import { RenderManager } from './core/RenderManager';
import { CameraManager } from './core/CameraManager';
import { PlayerController } from './managers/PlayerController';
import { InputHandler } from './core/InputHandler';
import { ShaderManager, ShaderProgramSource } from './services/ShaderManager';
import { LightingManager } from './services/LightingManager';
import { VisualEffectsService } from './services/VisualEffectsService';
import { ProceduralAssetFactory } from './assets/ProceduralAssetFactory';
import { EnvironmentManager } from './managers/EnvironmentManager';
import { ObstacleManager } from './managers/ObstacleManager';
import { CollisionDetectionSystem } from './core/CollisionDetectionSystem';
import { CollectibleManager } from './managers/CollectibleManager';
import { ScoringSystem } from './managers/ScoringSystem';
import { PowerUpManager } from './managers/PowerUpManager';
import { DifficultyManager } from './managers/DifficultyManager';
import { vertexShaderSource as testPatternVertex } from './shaders/test/testPattern.vert';
import { fragmentShaderSource as testPatternFragment } from './shaders/test/testPattern.frag';

// Import the types from PowerUpManager
import { ActivePowerUpInfo, PowerUpType } from './managers/PowerUpManager';

// Export them for use in GameCanvas
export type { ActivePowerUpInfo, PowerUpType };

interface GameEngineCallbacks {
  onScoreUpdate?: (score: number) => void;
  onLivesUpdate?: (lives: number) => void;
  onGameOver?: () => void;
  onActivePowerUpsUpdate?: (activePowerUps: ActivePowerUpInfo[]) => void; // New callback for power-up UI
}

export enum GameState {
  LOADING,
  READY,
  PLAYING,
  PAUSED,
  GAME_OVER,
}

export class GameEngine {
  private mountElement: HTMLDivElement;
  private callbacks: GameEngineCallbacks;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private renderManager!: RenderManager;
  private cameraManager!: CameraManager;

  private playerController!: PlayerController;
  private inputHandler!: InputHandler;

  private shaderManager!: ShaderManager;
  private lightingManager!: LightingManager;
  private visualEffectsService!: VisualEffectsService;
  private assetFactory!: ProceduralAssetFactory;
  private environmentManager!: EnvironmentManager;
  private obstacleManager!: ObstacleManager;
  private collectibleManager!: CollectibleManager;
  private powerUpManager!: PowerUpManager;
  private scoringSystem!: ScoringSystem;
  private collisionSystem!: CollisionDetectionSystem;
  private difficultyManager!: DifficultyManager;

  private animationFrameId?: number;
  private isRunning: boolean = false;
  private lastTimestamp: number = 0;
  private currentState: GameState = GameState.LOADING;

  private contextLostHandler: ((event: WebGLContextEvent) => void) | null = null;
  private contextRestoredHandler: ((event: WebGLContextEvent) => void) | null = null;

  constructor(mountElement: HTMLDivElement, callbacks: GameEngineCallbacks = {}) {
    this.mountElement = mountElement;
    this.callbacks = callbacks;
  }

  public async initialize(): Promise<void> {
    try {
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a2b3c);

      // Camera
      const aspectRatio = this.mountElement.clientWidth / this.mountElement.clientHeight;
      this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance", // Prefer higher performance
        preserveDrawingBuffer: false // Better performance
      });
      this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.mountElement.appendChild(this.renderer.domElement);

      // Set up WebGL context loss/restore handlers
      this.setupWebGLContextHandlers();

      this.renderManager = new RenderManager(this.scene, this.camera, this.renderer);

      // ShaderManager for assets and lighting effects
      this.shaderManager = new ShaderManager();

      // LightingManager for scene lighting, fog, and underwater effects
      this.lightingManager = new LightingManager(this.scene, this.shaderManager);
      this.renderManager.linkLightingManager(this.lightingManager);

      // Visual Effects Service for particles and post-processing
      this.visualEffectsService = new VisualEffectsService();
      this.visualEffectsService.linkCameraManager(this.cameraManager);
      this.visualEffectsService.linkGameEngine(this);
      this.visualEffectsService.initializeParticlesAndPostProcessing(
        this.scene, 
        this.shaderManager, 
        this.renderManager
      );

      // Register the test pattern shader
      this.shaderManager.registerShader({
        name: 'testPatternShader',
        vertexShaderSource: testPatternVertex,
        fragmentShaderSource: testPatternFragment,
        defaultUniforms: () => ({ // Function to return fresh uniform objects
          uBaseColor: { value: new THREE.Color(0x00ffff) }, // Cyan base color
        }),
        materialParameters: {
          transparent: false,
          side: THREE.FrontSide
        }
      });

      this.assetFactory = new ProceduralAssetFactory(this.shaderManager);

      // Link the LightingManager to the SeafloorAsset for caustic effects
      this.assetFactory.seafloorAsset.linkLightingManager(this.lightingManager);

      // EnvironmentManager
      this.environmentManager = new EnvironmentManager(this.scene, this.assetFactory);
      await this.environmentManager.initialize();
      this.assetFactory
        .getWaterSurfaceAsset()
        .linkLightingManager(this.lightingManager);

      // Player Controller
      this.playerController = new PlayerController(this.scene, this.assetFactory, this);

      // CameraManager (after playerController)
      this.cameraManager = new CameraManager(this.camera, this.playerController);
      
      // Update CameraManager link for VisualEffectsService since it was created after CameraManager
      this.visualEffectsService.linkCameraManager(this.cameraManager);

      // Notify UI of initial lives count
      this.callbacks.onLivesUpdate?.(this.playerController.lives);

      // Input Handler
      this.inputHandler = new InputHandler(this.playerController);
      this.inputHandler.initialize();

      // ObstacleManager
      this.obstacleManager = new ObstacleManager(this.scene, this.assetFactory);

      // Link PlayerController to ObstacleManager for proximity-based behaviors
      this.obstacleManager.linkPlayerController(this.playerController);
      // Link VisualEffectsService to ObstacleManager for particle effects
      this.obstacleManager.linkVisualEffectsService(this.visualEffectsService);

      // ScoringSystem and CollectibleManager
      this.scoringSystem = new ScoringSystem();

      // Register callback for score updates if provided
      if (this.callbacks.onScoreUpdate) {
        this.scoringSystem.registerScoreUpdateCallback(this.callbacks.onScoreUpdate);
      }

      this.collectibleManager = new CollectibleManager(this.scene, this.assetFactory);

      // Link PlayerController to CollectibleManager (for magnet effect)
      this.collectibleManager.linkPlayerController(this.playerController);
      // Link GameEngine to CollectibleManager (for VFX)
      this.collectibleManager.linkGameEngine(this);

      // PowerUpManager (after config system and asset factory)
      // Fix: Remove the third parameter - PowerUpManager only takes scene and assetFactory
      this.powerUpManager = new PowerUpManager(this.scene, this.assetFactory);

      // Link PowerUpManager with other managers (critical for power-up functionality)
      this.powerUpManager.linkManagers(
        this.playerController,
        this.scoringSystem,
        this.collectibleManager
      );

      // DifficultyManager controls game difficulty progression
      this.difficultyManager = new DifficultyManager(this);

      // CollisionDetectionSystem
      this.collisionSystem = new CollisionDetectionSystem(
        this.playerController,
        this.obstacleManager,
        this.collectibleManager,
        this.scoringSystem,
        () => this.gameOver(),
        this, // Pass reference to game engine for state checking
        this.powerUpManager // Pass the power-up manager
      );

      // Recreate obstacle pool to ensure all obstacles have the latest updates (collision spheres)
      this.obstacleManager.recreatePool();

      this.currentState = GameState.READY;
      console.log("GameEngine: Initialized successfully. State: READY");
    } catch (error) {
      console.error("GameEngine: Initialization failed.", error);
      throw error;
    }
  }

  public start(): void {
    if (this.currentState !== GameState.READY && this.currentState !== GameState.GAME_OVER && this.currentState !== GameState.PAUSED) return;
    if (this.currentState === GameState.GAME_OVER) {
      this.resetGame();
    }
    this.isRunning = true;
    this.currentState = GameState.PLAYING;
    this.lastTimestamp = performance.now();
    if (!this.animationFrameId) {
      this.gameLoop();
    }
    console.log("GameEngine: Started. State: PLAYING");
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    console.log("GameEngine: Stopped.");
  }

  private async gameLoop(timestamp: number = performance.now()): Promise<void> {
    if (!this.isRunning) {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
      return;
    }
    const deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(deltaTime, 0.1);
    if (this.currentState === GameState.PLAYING) {
      this.inputHandler.update(dt);
      this.playerController.update(dt);

      // Get current distance for difficulty scaling
      const currentDistance = this.scoringSystem.totalDistanceTraveled;

      // Update difficulty based on player's distance
      this.difficultyManager.update(dt, currentDistance);

      const elapsedTime = timestamp / 1000;
      await this.environmentManager.update(
        dt,
        this.playerController.mesh.position.z,
        elapsedTime
      );
      this.obstacleManager.update(dt, this.playerController.mesh.position.z);
      this.collectibleManager.update(dt, this.playerController.mesh.position.z);

      // Update lighting and caustic effects
      this.lightingManager.update(dt, timestamp / 1000);
      
      // Update visual effects (particles and post-processing)
      this.visualEffectsService.update(dt, timestamp / 1000, this.playerController.mesh.position);

      // Update forward speed for power-ups
      this.powerUpManager.setGameSpeed(this.playerController.getForwardSpeed());
      // Fix: Pass player's Z position to powerUpManager.update
      this.powerUpManager.update(dt, this.playerController.mesh.position.z);

      // Update score based on distance
      const distanceTraveled = dt * this.playerController.getForwardSpeed();
      this.scoringSystem.update(dt, distanceTraveled);

      // Update UI with active power-ups
      if (this.callbacks.onActivePowerUpsUpdate) {
        const activePowerUps = this.powerUpManager.getActiveEffectsForUI();
        this.callbacks.onActivePowerUpsUpdate(activePowerUps);
      }

      // Update shader global uniforms (time, resolution)
      this.shaderManager.update(
        dt,                             // deltaTime
        timestamp / 1000,               // elapsedTime in seconds
        this.mountElement.clientWidth,  // screenWidth
        this.mountElement.clientHeight   // screenHeight
      );

      this.collisionSystem.checkCollisions();
    }
    this.cameraManager.update(dt);
    this.renderManager.render();
    if (this.currentState === GameState.PLAYING || this.currentState === GameState.PAUSED) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    } else if (this.currentState === GameState.GAME_OVER) {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
      console.log("GameEngine: Loop stopped due to GAME_OVER state.");
    }
  }

  public handleResize(): void {
    if (!this.renderer || !this.cameraManager) return;
    const width = this.mountElement.clientWidth;
    const height = this.mountElement.clientHeight;

    this.cameraManager.handleResize(width / height);
    this.renderer.setSize(width, height);
    console.log("GameEngine: Handled resize via managers.");
  }

  /**
   * Sets up WebGL context loss/restore event handlers on the renderer's canvas
   */
  private setupWebGLContextHandlers(): void {
    if (!this.renderer || !this.renderer.domElement) {
      console.warn("GameEngine: Cannot set up WebGL context handlers - renderer not initialized");
      return;
    }

    // Remove any existing handlers to prevent duplicates
    this.removeWebGLContextHandlers();

    // Create new bound handlers
    this.contextLostHandler = (event: WebGLContextEvent) => {
      event.preventDefault(); // This is important - allows context to be restored
      console.warn("GameEngine: WebGL context lost");

      this.isRunning = false;
      this.currentState = GameState.PAUSED;

      // Cancel animation frame to stop rendering attempts
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = undefined;
      }
    };

    this.contextRestoredHandler = (event: WebGLContextEvent) => {
      console.log("GameEngine: WebGL context restored, reinitializing renderer");

      try {
        // Recreate all WebGL-dependent objects
        this.recreateAfterContextLoss();

        // Resume game loop if the game was running before
        if (this.currentState === GameState.PAUSED) {
          this.currentState = GameState.PLAYING;
          this.isRunning = true;
          this.gameLoop();
        }
      } catch (error) {
        console.error("GameEngine: Failed to recover from context loss:", error);
      }
    };

    // Add the handlers to the canvas
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLostHandler, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.contextRestoredHandler, false);

    console.log("GameEngine: WebGL context handlers set up");
  }

  /**
   * Removes WebGL context event handlers
   */
  private removeWebGLContextHandlers(): void {
    if (this.renderer && this.renderer.domElement) {
      if (this.contextLostHandler) {
        this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLostHandler);
      }

      if (this.contextRestoredHandler) {
        this.renderer.domElement.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
      }
    }

    this.contextLostHandler = null;
    this.contextRestoredHandler = null;
  }

  /**
   * Handler for shader-related errors
   * This is called by RenderManager when it detects shader compilation issues
   */
  public handleShaderError(): void {
    console.warn("GameEngine: Handling shader error, attempting to recover");

    // If we're already handling a recovery, don't trigger another one
    if (this._isRecovering) return;

    // Trigger a full WebGL context and shader program reset
    this.resetRendererAndShaders();
  }

  /**
   * Reset the renderer and all shader programs
   * This can be triggered by handleShaderError or manually if needed
   */
  private _isRecovering: boolean = false;

  // Make this method public so it can be called directly during Fast Refresh
  public resetRendererAndShaders(): Promise<void> {
    if (this._isRecovering) {
      console.log("GameEngine: Already recovering, skipping new request");
      return Promise.resolve(); // Return resolved promise if already recovering
    }
    
    this._isRecovering = true;
    console.log("GameEngine: Resetting renderer and shader programs");

    // Return a promise that resolves when recovery is complete
    return new Promise<void>((resolve) => {
      // Schedule the recovery to happen in the next frame
      // This gives the current render loop a chance to finish
      setTimeout(() => {
        this.recreateAfterContextLoss(true)
          .then(() => {
            console.log("GameEngine: Reset completed successfully");
            this._isRecovering = false;
            resolve();
          })
          .catch(error => {
            console.error("GameEngine: Error during recovery:", error);
            this._isRecovering = false;
            resolve(); // Still resolve the promise to avoid hanging
          });
      }, 0);
    });
  }

  /**
   * Safely destroys and recreates the WebGL context and renderer using a fresh canvas
   * with proper timing to prevent "Cannot read properties of null (reading 'precision')" errors
   * @param forceShaderReset Whether to force shader program cache reset
   * @returns Promise that resolves when recreation is complete
   */
  private recreateAfterContextLoss(forceShaderReset: boolean = false): Promise<void> {
    if (!this.mountElement) {
      console.error("GameEngine: Cannot recreate after context loss - mount element missing");
      return Promise.reject(new Error("Mount element missing"));
    }

    console.log("GameEngine: Recreating WebGL context with safe approach");

    // First pause the game loop to avoid rendering during recreation
    const wasRunning = this.isRunning;
    this.isRunning = false;

    // Create a promise chain for proper async sequencing
    return new Promise<void>((resolve, reject) => {
      try {
        let oldCanvas: HTMLCanvasElement | null = null;
        if (this.renderer) {
          // Step 1: Save reference to current canvas dimensions
          oldCanvas = this.renderer.domElement;
        }
        
        const canvasWidth = oldCanvas ? oldCanvas.width : this.mountElement.clientWidth;
        const canvasHeight = oldCanvas ? oldCanvas.height : this.mountElement.clientHeight;
        const canvasStyleWidth = oldCanvas?.style.width || '100%';
        const canvasStyleHeight = oldCanvas?.style.height || '100%';
        
        // Fully dispose the old renderer and associated resources
        if (this.renderer) {
          try {
            console.log("GameEngine: Disposing old renderer completely");
            
            // First reset state to avoid errors
            if (this.renderer.state) {
              this.renderer.state.reset();
            }
            
            // CRITICAL: Dispose renderer without forcing context loss
            this.renderer.dispose();
            this.renderer = null;
          } catch (disposeError) {
            console.warn("GameEngine: Error during renderer disposal:", disposeError);
            // Continue despite errors - we'll create a fresh context
          }
        }
        
        // Remove any existing canvas elements first to ensure clean slate
        if (oldCanvas && oldCanvas.parentElement) {
          try {
            oldCanvas.parentElement.removeChild(oldCanvas);
          } catch (e) {
            console.warn("GameEngine: Error removing old canvas:", e);
          }
        }
        
        // Wait a longer period to ensure browser has fully cleaned up WebGL resources
        // This is critical for avoiding "Cannot read properties of null (reading 'precision')" errors
        console.log("GameEngine: Waiting for browser to fully clean up WebGL resources");
        setTimeout(() => {
          try {
            // Create a completely fresh canvas
            const freshCanvas = document.createElement('canvas');
            freshCanvas.width = canvasWidth;
            freshCanvas.height = canvasHeight;
            freshCanvas.style.width = canvasStyleWidth;
            freshCanvas.style.height = canvasStyleHeight;
            
            // Append to mount element
            this.mountElement?.appendChild(freshCanvas);
            
            // Wait a bit more before creating the renderer
            // This ensures browser has fully initialized the new canvas
            setTimeout(() => {
              try {
                // Now create a new renderer with the fresh canvas
                console.log("GameEngine: Creating new WebGLRenderer with fresh canvas");
                
                // Use safest initialization options for compatibility
                this.renderer = new THREE.WebGLRenderer({
                  canvas: freshCanvas,
                  antialias: true,
                  powerPreference: "default", // Less aggressive than "high-performance"
                  alpha: true,
                  preserveDrawingBuffer: false
                });
                
                // Configure the new renderer
                if (this.mountElement) {
                  this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
                  this.renderer.setPixelRatio(window.devicePixelRatio);
                }
                
                // Always reset shader cache when recreating renderer
                if (this.shaderManager) {
                  console.log("GameEngine: Resetting shader program cache");
                  try {
                    this.shaderManager.resetProgramCache();
                  } catch (shaderError) {
                    console.warn("GameEngine: Error resetting shader cache:", shaderError);
                  }
                }
                
                // Update RenderManager with new renderer
                if (this.renderManager) {
                  this.renderManager.updateRenderer(this.renderer);
                }
                
                // Reinitialize WebGL context handlers
                this.setupWebGLContextHandlers();
                
                // Force a redraw of all objects with new shaders
                if (this.scene) {
                  this.scene.traverse((object) => {
                    if (object instanceof THREE.Mesh && object.material) {
                      if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                          mat.needsUpdate = true;
                        });
                      } else {
                        object.material.needsUpdate = true;
                      }
                    }
                  });
                }
                
                // Wait a bit more for everything to stabilize before resuming
                setTimeout(() => {
                  // Resume game loop if it was running before
                  if (wasRunning) {
                    console.log("GameEngine: Resuming game loop");
                    this.isRunning = true;
                    if (!this.animationFrameId) {
                      this.gameLoop();
                    }
                  }
                  
                  console.log("GameEngine: Successfully recovered from WebGL context loss");
                  this._isRecovering = false;
                  resolve();
                }, 150);
              } catch (error) {
                console.error("GameEngine: Failed to create new renderer:", error);
                this._isRecovering = false;
                reject(error);
              }
            }, 150); // Wait before creating renderer
          } catch (error) {
            console.error("GameEngine: Error creating fresh canvas:", error);
            this._isRecovering = false;
            reject(error);
          }
        }, 500); // Longer delay after disposing old renderer
      } catch (error) {
        console.error("GameEngine: Fatal error during context recreation:", error);
        this._isRecovering = false;
        reject(error);
      }
    });
  }

  public dispose(): void {
    this.stop();

    // Remove WebGL context handlers
    this.removeWebGLContextHandlers();

    if (this.inputHandler) this.inputHandler.dispose();
    if (this.playerController) this.playerController.dispose();
    if (this.environmentManager) this.environmentManager.dispose();
    if (this.obstacleManager) this.obstacleManager.dispose();
    if (this.collectibleManager) this.collectibleManager.dispose();
    if (this.powerUpManager) this.powerUpManager.dispose();
    if (this.scoringSystem) this.scoringSystem.dispose();
    if (this.collisionSystem) this.collisionSystem.dispose();
    if (this.difficultyManager) this.difficultyManager.dispose();
    if (this.visualEffectsService) this.visualEffectsService.dispose();
    if (this.lightingManager) this.lightingManager.dispose();
    if (this.assetFactory) this.assetFactory.dispose();
    if (this.shaderManager) this.shaderManager.dispose();
    if (this.renderManager) this.renderManager.dispose();
    if (this.cameraManager) this.cameraManager.dispose();

    // Dispose renderer last
    if (this.renderer) {
      this.renderer.dispose();

      // Explicitly clean up renderer's WebGL context
      const gl = this.renderer.getContext();
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          try {
            loseContext.loseContext();
          } catch (e) {
            console.warn("GameEngine: Could not force context loss during disposal:", e);
          }
        }
      }
    }

    if (this.mountElement && this.renderer) {
      if (this.mountElement.contains(this.renderer.domElement)) {
        this.mountElement.removeChild(this.renderer.domElement);
      }
    }

    console.log("GameEngine: Disposed.");
  }

  public gameOver(): void {
    if (this.currentState === GameState.GAME_OVER) return;
    this.currentState = GameState.GAME_OVER;
    this.isRunning = false;
    console.log("GameEngine: GAME OVER!");
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver();
    }
  }

  public async resetGame(): Promise<void> {
    console.log("GameEngine: Resetting game...");

    // Reset all game managers
    this.playerController.reset();
    this.obstacleManager.reset();
    await this.environmentManager.reset(this.playerController.mesh.position.z);
    this.collectibleManager.reset();
    
    // Reset the VisualEffectsService
    this.visualEffectsService.reset();

    // Reset the PowerUpManager instead of recreating it
    this.powerUpManager.reset();

    // CRITICAL: Explicitly reset the camera to the player's new position
    // This ensures the camera follows the player after restart
    this.cameraManager.reset(this.playerController);
    
    // CRITICAL FIX: Recreate the CollisionDetectionSystem to ensure it has fresh references
    // This is needed so collisions with power-ups work after restart
    this.collisionSystem = new CollisionDetectionSystem(
      this.playerController,
      this.obstacleManager,
      this.collectibleManager,
      this.scoringSystem,
      () => this.gameOver(),
      this,
      this.powerUpManager
    );

    // Reset the difficulty to the starting level
    this.difficultyManager.reset();

    this.scoringSystem.reset();
    this.lastTimestamp = performance.now();
    this.currentState = GameState.READY;

    // Clear active power-ups in the UI
    if (this.callbacks.onActivePowerUpsUpdate) {
      this.callbacks.onActivePowerUpsUpdate([]);
    }

    console.log("GameEngine: Game reset complete with camera explicitly repositioned.");
  }

  public getCurrentState(): GameState {
    return this.currentState;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getScoringSystem(): ScoringSystem {
    return this.scoringSystem;
  }

  public getPlayerController(): PlayerController {
    return this.playerController;
  }

  public getObstacleManager(): ObstacleManager {
    return this.obstacleManager;
  }
  
  public getCollectibleManager(): CollectibleManager {
    return this.collectibleManager;
  }

  public getDifficultyManager(): DifficultyManager {
    return this.difficultyManager;
  }

  /**
   * Get direct access to the ShaderManager
   * This is used for Fast Refresh recovery to reset shader programs
   */
  public getShaderManager(): ShaderManager {
    return this.shaderManager;
  }

  /**
   * Get the VisualEffectsService for external use
   */
  public getVisualEffectsService(): VisualEffectsService {
    return this.visualEffectsService;
  }

  /**
   * Get callback functions for use by PlayerController and other systems
   */
  public getCallbacks(): GameEngineCallbacks {
    return this.callbacks;
  }

  /**
   * Get PowerUpManager for use by PlayerController and other systems
   */
  public getPowerUpManager(): PowerUpManager {
    return this.powerUpManager;
  }

  /**
   * Get CameraManager for use by PlayerController reset
   */
  public getCameraManager(): CameraManager {
    return this.cameraManager;
  }
}