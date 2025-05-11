import * as THREE from 'three';
import { RenderManager } from './core/RenderManager';
import { CameraManager } from './core/CameraManager';
import { PlayerController } from './managers/PlayerController';
import { InputHandler } from './core/InputHandler';
import { ShaderManager } from './services/ShaderManager';
import { ProceduralAssetFactory } from './assets/ProceduralAssetFactory';
import { EnvironmentManager } from './managers/EnvironmentManager';
import { ObstacleManager } from './managers/ObstacleManager';
import { CollisionDetectionSystem } from './core/CollisionDetectionSystem';
import { CollectibleManager } from './managers/CollectibleManager';
import { ScoringSystem } from './managers/ScoringSystem';

interface GameEngineCallbacks {
  onScoreUpdate?: (score: number) => void;
  onLivesUpdate?: (lives: number) => void;
  onGameOver?: () => void;
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
  private assetFactory!: ProceduralAssetFactory;
  private environmentManager!: EnvironmentManager;
  private obstacleManager!: ObstacleManager;
  private collectibleManager!: CollectibleManager;
  private scoringSystem!: ScoringSystem;
  private collisionSystem!: CollisionDetectionSystem;

  private animationFrameId?: number;
  private isRunning: boolean = false;
  private lastTimestamp: number = 0;
  private currentState: GameState = GameState.LOADING;

  constructor(mountElement: HTMLDivElement, callbacks: GameEngineCallbacks = {}) {
    this.mountElement = mountElement;
    this.callbacks = callbacks;
  }

  public initialize(): void {
    try {
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a2b3c);

      // Camera
      const aspectRatio = this.mountElement.clientWidth / this.mountElement.clientHeight;
      this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.mountElement.appendChild(this.renderer.domElement);

      this.renderManager = new RenderManager(this.scene, this.camera, this.renderer);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5).normalize();
      this.scene.add(directionalLight);

      // ShaderManager and AssetFactory
      this.shaderManager = new ShaderManager();
      this.assetFactory = new ProceduralAssetFactory(this.shaderManager);

      // EnvironmentManager
      this.environmentManager = new EnvironmentManager(this.scene, this.assetFactory);

      // Player Controller
      this.playerController = new PlayerController(this.scene, this.assetFactory);

      // CameraManager (after playerController)
      this.cameraManager = new CameraManager(this.camera, this.playerController);

      // Input Handler
      this.inputHandler = new InputHandler(this.playerController);
      this.inputHandler.initialize();

      // ObstacleManager
      this.obstacleManager = new ObstacleManager(this.scene, this.assetFactory);

      // ScoringSystem and CollectibleManager
      this.scoringSystem = new ScoringSystem();

      // Register callback for score updates if provided
      if (this.callbacks.onScoreUpdate) {
        this.scoringSystem.registerScoreUpdateCallback(this.callbacks.onScoreUpdate);
      }

      this.collectibleManager = new CollectibleManager(this.scene, this.assetFactory);

      // CollisionDetectionSystem
      this.collisionSystem = new CollisionDetectionSystem(
        this.playerController,
        this.obstacleManager,
        this.collectibleManager,
        this.scoringSystem,
        () => this.gameOver(),
        this // Pass reference to game engine for state checking
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

  private gameLoop(timestamp: number = performance.now()): void {
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
      this.environmentManager.update(dt, this.playerController.mesh.position.z);
      this.obstacleManager.update(dt, this.playerController.mesh.position.z);
      this.collectibleManager.update(dt, this.playerController.mesh.position.z);

      // Update score based on distance
      const distanceTraveled = dt * this.playerController.getForwardSpeed();
      this.scoringSystem.update(dt, distanceTraveled);

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

  public dispose(): void {
    this.stop();
    if (this.inputHandler) this.inputHandler.dispose();
    if (this.playerController) this.playerController.dispose();
    if (this.environmentManager) this.environmentManager.dispose();
    if (this.obstacleManager) this.obstacleManager.dispose();
    if (this.collectibleManager) this.collectibleManager.dispose();
    if (this.scoringSystem) this.scoringSystem.dispose();
    if (this.collisionSystem) this.collisionSystem.dispose();
    if (this.assetFactory) this.assetFactory.dispose();
    if (this.shaderManager) this.shaderManager.dispose();
    if (this.renderManager) this.renderManager.dispose();
    if (this.cameraManager) this.cameraManager.dispose();
    if (this.renderer) {
      this.renderer.dispose();
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

  public resetGame(): void {
    console.log("GameEngine: Resetting game...");
    this.playerController.reset();
    this.obstacleManager.reset();
    this.environmentManager.reset(this.playerController.mesh.position.z);
    this.collectibleManager.reset();
    this.scoringSystem.reset();
    this.lastTimestamp = performance.now();
    this.currentState = GameState.READY;
    console.log("GameEngine: Game reset.");
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
} 