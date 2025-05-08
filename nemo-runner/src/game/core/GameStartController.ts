import * as THREE from 'three';
import eventBus from './EventSystem';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import { detectDeviceCapabilities, configureGameSettings } from '../utils/DeviceUtils';
import gameStateManager from './GameStateManager';

/**
 * Manages the initialization and startup sequence of the game
 * Handles renderer creation, asset loading, and audio initialization
 */
export class GameStartController {
  // Core systems
  private renderer: THREE.WebGLRenderer | null = null;
  private assetManager: AssetManager | null = null;
  private audioManager: AudioManager | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private scene: THREE.Scene | null = null;
  
  // Game engine cleanup function
  private gameEngineCleanup: (() => void) | null = null;
  
  // State tracking
  private isInitializing: boolean = false;
  private isInitialized: boolean = false;
  private rendererInitialized: boolean = false;
  private assetsLoaded: boolean = false;
  private audioInitialized: boolean = false;
  
  // Countdown handling
  private countdownInterval: NodeJS.Timeout | null = null; // Use Interval for countdown
  private countdownValue: number = 3;
  
  // Device capabilities
  private deviceCapabilities: ReturnType<typeof detectDeviceCapabilities>;
  private gameSettings: ReturnType<typeof configureGameSettings>;
  
  // Canvas reference for cleanup
  private canvasElement: HTMLCanvasElement | null = null;
  
  constructor() {
    // Detect device capabilities
    this.deviceCapabilities = detectDeviceCapabilities();
    this.gameSettings = configureGameSettings(this.deviceCapabilities);
    
    // Set up event listeners
    eventBus.on('asset-loading-complete', this.handleAssetsLoaded.bind(this));
    eventBus.on('audio-initialized', this.handleAudioInitialized.bind(this));
    eventBus.on('renderer-initialized', this.handleRendererInitialized.bind(this));
  }
  
  /**
   * Initialize all rendering systems needed for the game
   * This is the main entry point for starting the game setup
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    if (this.isInitializing || this.isInitialized) {
      console.log('GameStartController: Already initializing or initialized');
      return false;
    }
    
    this.isInitializing = true;
    this.canvasElement = canvas;
    console.log('GameStartController: Starting initialization');
    
    try {
      // 1. Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x75c2f6); // Sky blue background
      
      // 2. Set up camera
      this.camera = this.setupCamera();
      
      // 3. Create renderer
      await this.initializeRenderer(canvas);
      
      // 4. Initialize asset manager
      await this.initializeAssetManager();
      
      // 5. Initialize audio manager
      await this.initializeAudioManager();
      
      // Check if all systems are ready
      if (this.checkAllSystemsReady()) {
        // All systems are ready, emit event
        console.log('GameStartController: All core systems ready, getting components');
        
        // Get the components to pass to GameEngine
        const components = this.getComponents();
        
        // Emit all-systems-ready event with the components data
        console.log('GameStartController: Emitting all-systems-ready event');
        eventBus.emit('all-systems-ready', components);
        
        // Ensure final state is MENU after all prerequisites are ready
        console.log('GameStartController: Initialization sequence complete, setting state to MENU');
        if (gameStateManager.state !== 'MENU') { // Only set if not already MENU
            gameStateManager.setState('MENU');
        }
      }
      
      return true;
    } catch (error) {
      console.error('GameStartController: Initialization failed:', error);
      this.isInitializing = false;
      return false;
    }
  }
  
  /**
   * Get essential game components after initialization
   */
  public getComponents() {
    if (!this.isInitialized) {
      console.warn('GameStartController: Components requested before initialization');
    }
    
    return {
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      assetManager: this.assetManager,
      audioManager: this.audioManager,
      deviceCapabilities: this.deviceCapabilities,
      gameSettings: this.gameSettings
    };
  }
  
  /**
   * Initialize the WebGL renderer with extensive error handling
   */
  private async initializeRenderer(canvas: HTMLCanvasElement): Promise<void> {
    if (!canvas) {
      throw new Error('GameStartController: Canvas is null or undefined');
    }
    
    // Check for server-side rendering environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('GameStartController: Running in SSR environment, deferring renderer creation');
      this.rendererInitialized = false;
      return;
    }
    
    console.log('GameStartController: Setting up renderer');
    
    try {
      // Check that the canvas is attached to the DOM
      if (!canvas.parentElement) {
        console.warn('Canvas is not attached to DOM, rendering may fail');
      }
      
      // Get client dimensions for accurate sizing
      const clientWidth = canvas.clientWidth || window.innerWidth;
      const clientHeight = canvas.clientHeight || window.innerHeight;
      console.log(`Setting up renderer with canvas dimensions: ${clientWidth}x${clientHeight}`);
      
      // Clear any existing WebGL context flag
      delete (canvas as any).__webGLContextCreated;
      
      // Ensure THREE.js is available
      if (typeof THREE === 'undefined' || !THREE.WebGLRenderer) {
        console.error('THREE.js or THREE.WebGLRenderer is not available');
        this.rendererInitialized = false;
        return;
      }
      
      // Try creating the renderer with optimized settings
      try {
        const options: THREE.WebGLRendererParameters = {
          canvas: canvas,
          antialias: this.deviceCapabilities.highEnd || this.deviceCapabilities.midRange,
          alpha: false,
          precision: this.deviceCapabilities.highEnd ? 'highp' : 
                    this.deviceCapabilities.midRange ? 'mediump' : 'lowp',
          powerPreference: this.deviceCapabilities.highEnd ? 'high-performance' : 'default',
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          depth: true,
          stencil: false,
          logarithmicDepthBuffer: false
        };
        
        // Mark canvas as having WebGL context
        (canvas as any).__webGLContextCreated = true;
        
        // Create renderer with try-catch to catch any unexpected errors
        try {
          this.renderer = new THREE.WebGLRenderer(options);
          console.log('GameStartController: WebGL renderer created successfully');
        } catch (e) {
          // Handle the unknown error type safely
          const errorMessage = e instanceof Error ? e.message : String(e);
          throw new Error(`WebGLRenderer creation failed: ${errorMessage}`);
        }
      } catch (rendererError) {
        console.error('Error creating renderer:', rendererError);
        
        // Try again with minimal settings
        try {
          console.log('Retrying with minimal settings');
          
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
          
          // Create renderer with try-catch to catch any unexpected errors
          try {
            this.renderer = new THREE.WebGLRenderer(minimalOptions);
            console.log('Minimal renderer created successfully on second attempt');
          } catch (e) {
            // Handle the unknown error type safely
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Minimal WebGLRenderer creation failed: ${errorMessage}`);
          }
        } catch (secondError) {
          console.error('Critical error creating even minimal renderer:', secondError);
          
          // Try with a backup canvas as last resort
          try {
            console.warn('WebGL initialization failed completely, attempting with backup canvas');
            
            // Create a backup canvas
            const backupCanvas = document.createElement('canvas');
            backupCanvas.width = clientWidth;
            backupCanvas.height = clientHeight;
            backupCanvas.style.cssText = canvas.style.cssText;
            backupCanvas.className = canvas.className;
            
            // Replace the original canvas if possible
            if (canvas.parentNode) {
              canvas.parentNode.insertBefore(backupCanvas, canvas);
              canvas.parentNode.removeChild(canvas);
              this.canvasElement = backupCanvas;
            }
            
            // Try with absolute minimal settings
            try {
              this.renderer = new THREE.WebGLRenderer({
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
              
              console.log('Created renderer with backup canvas');
            } catch (e) {
              // Handle the unknown error type safely
              const errorMessage = e instanceof Error ? e.message : String(e);
              throw new Error(`Backup WebGLRenderer creation failed: ${errorMessage}`);
            }
          } catch (finalError) {
            console.error('All renderer creation attempts failed:', finalError);
            throw new Error('WebGL rendering is not available on this system');
          }
        }
      }
      
      // Configure renderer
      this.configureRenderer(clientWidth, clientHeight);
      
      // Emit event to signal renderer is ready
      this.rendererInitialized = true;
      eventBus.emit('renderer-initialized', { success: true });
      
    } catch (error) {
      console.error('GameStartController: Failed to initialize renderer:', error);
      this.rendererInitialized = false;
      eventBus.emit('renderer-initialized', { success: false, error });
      throw error;
    }
  }
  
  /**
   * Configure the renderer with appropriate settings
   */
  private configureRenderer(width: number, height: number): void {
    if (!this.renderer) return;
    
    try {
      // Set size
      this.renderer.setSize(width, height, false);
      
      // Set pixel ratio based on device capabilities
      let targetPixelRatio = 1.0;
      if (window.devicePixelRatio) {
        if (this.deviceCapabilities.highEnd) {
          targetPixelRatio = Math.min(window.devicePixelRatio, 2.0);
        } else if (this.deviceCapabilities.midRange) {
          targetPixelRatio = Math.min(window.devicePixelRatio, 1.5);
        }
        this.renderer.setPixelRatio(targetPixelRatio);
      }
      
      // Configure shadow maps
      this.renderer.shadowMap.enabled = false;
      if (this.deviceCapabilities.highEnd) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } else if (this.deviceCapabilities.midRange) {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
      }
      
      // Configure color space and tone mapping
      this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      this.renderer.toneMapping = THREE.NoToneMapping;
      
      if (this.deviceCapabilities.highEnd) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
      } else if (this.deviceCapabilities.midRange) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
      }
      
    } catch (error) {
      console.warn('Error configuring renderer:', error);
    }
  }
  
  /**
   * Initialize the asset manager and load essential assets
   */
  private async initializeAssetManager(): Promise<void> {
    try {
      console.log('GameStartController: Initializing asset manager');
      
      // Create asset manager
      this.assetManager = new AssetManager();
      this.assetManager.registerCoreAssets();
      
      // Load assets with progress tracking
      const progressHandler = (progress: number) => {
        if (this.assetManager) {
          const progressInfo = this.assetManager.getLoadingProgress();
          eventBus.emit('asset-loading-progress', {
            progress: Math.floor(progress * 100),
            loaded: progressInfo.completed,
            total: progressInfo.total
          });
        } else {
          // Fallback if asset manager is not available
          eventBus.emit('asset-loading-progress', {
            progress: Math.floor(progress * 100),
            loaded: 0,
            total: 1
          });
        }
      };
      
      try {
        await this.assetManager.loadAll(progressHandler);
        console.log('GameStartController: Asset loading complete');
      } catch (loadError) {
        console.error('Asset loading failed:', loadError);
        // Continue with placeholder assets
        console.log('Continuing with placeholder assets');
      }
      
      // Emit final progress event
      eventBus.emit('asset-loading-progress', {
        progress: 100,
        loaded: 100,
        total: 100
      });
      
      // Signal assets are loaded
      this.assetsLoaded = true;
      eventBus.emit('asset-loading-complete', { success: true });
      
    } catch (error) {
      console.error('GameStartController: Failed to initialize asset manager:', error);
      this.assetsLoaded = false;
      eventBus.emit('asset-loading-complete', { success: false, error });
      throw error;
    }
  }
  
  /**
   * Initialize audio manager with error handling
   */
  private async initializeAudioManager(): Promise<void> {
    try {
      console.log('GameStartController: Initializing audio manager');
      
      // Initialize audio manager
      this.audioManager = AudioManager.getInstance();
      
      // Connect to asset manager
      if (this.assetManager) {
        this.audioManager.setAssetManager(this.assetManager);
      }
      
      // Initialize audio with camera
      if (this.camera) {
        await this.audioManager.initialize(this.camera);
        await this.audioManager.loadSoundEffects();
      }
      
      console.log('GameStartController: Audio initialization complete');
      this.audioInitialized = true;
      eventBus.emit('audio-initialized', { success: true });
      
    } catch (error) {
      console.error('GameStartController: Failed to initialize audio:', error);
      
      // Create a new instance as fallback
      try {
        console.log('Attempting to create fallback audio manager');
        this.audioManager = AudioManager.getInstance(true); // Force new instance
        
        if (this.assetManager) {
          this.audioManager.setAssetManager(this.assetManager);
        }
        
        // Use simplified initialization
        if (this.camera) {
          this.audioManager.initializeFallback(this.camera);
        }
        
        this.audioInitialized = true;
        eventBus.emit('audio-initialized', { success: true, fallback: true });
      } catch (fallbackError) {
        console.error('Audio fallback also failed:', fallbackError);
        this.audioInitialized = false;
        eventBus.emit('audio-initialized', { success: false, error });
        // Don't throw - we can continue without audio
      }
    }
  }
  
  /**
   * Initialize camera with proper settings
   */
  private setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Set initial position
    camera.position.set(0, 2.0, 10);
    camera.lookAt(0, 0, 0);
    
    return camera;
  }
  
  /**
   * Handle asset loading completion event
   */
  private handleAssetsLoaded(data: { success: boolean }): void {
    this.assetsLoaded = data.success;
    this.checkAllSystemsReady();
  }
  
  /**
   * Handle audio initialization completion event
   */
  private handleAudioInitialized(data: { success: boolean }): void {
    this.audioInitialized = data.success;
    this.checkAllSystemsReady();
  }
  
  /**
   * Handle renderer initialization completion event
   */
  private handleRendererInitialized(data: { success: boolean }): void {
    this.rendererInitialized = data.success;
    this.checkAllSystemsReady();
  }
  
  /**
   * Check if all required systems are ready
   * @returns {boolean} True if all systems are ready, false otherwise
   */
  private checkAllSystemsReady(): boolean {
    if (this.rendererInitialized && this.assetsLoaded && this.audioInitialized) {
      console.log('GameStartController: All core systems are ready');
      this.isInitialized = true;
      this.isInitializing = false;
      return true;
    }
    return false;
  }
  
  /**
   * Public method called by UI to start the game sequence
   */
  public requestStartGame(): void {
    // Ensure GameStateManager is available
    if (!gameStateManager) {
      console.error("GameStartController: GameStateManager not available for requestStartGame");
      return;
    }

    if (this.isInitialized && gameStateManager.state === 'MENU') {
      console.log('GameStartController: Start game requested from UI');
      this.startCountdownSequence();
    } else {
      console.warn("GameStartController: Cannot start game from current state:", gameStateManager.state);
    }
  }

  /**
   * Handle the countdown sequence from READY to PLAYING
   */
  private startCountdownSequence(): void {
    // Initial validation
    if (!this.isInitialized) {
      console.warn("GameStartController: Cannot start countdown, not initialized.");
      return;
    }
    
    // Ensure GameStateManager is available
    if (!gameStateManager) {
      console.error("GameStartController: GameStateManager not available for startCountdownSequence");
      return;
    }
    
    // Check if countdown is already in progress
    if (this.countdownInterval) {
      console.warn("GameStartController: Countdown already in progress.");
      return;
    }
    
    // Check state *before* starting interval
    if (gameStateManager.state === 'PLAYING') {
      console.warn("GameStartController: Cannot start countdown, game is already in PLAYING state.");
      return;
    }
    
    console.log('GameStartController: Starting countdown sequence from 3');

    // Clear any existing countdown timer (defensive)
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    // Set state to READY to start the countdown (only if not already READY)
    if (gameStateManager.state !== 'READY') {
      console.log("GameStartController: Setting state to READY for countdown");
      gameStateManager.setState('READY');
    } else {
      console.log("GameStartController: Already in READY state, continuing with countdown");
    }

    // Start countdown from 3
    this.countdownValue = 3;
    eventBus.emit('countdown-update', { count: this.countdownValue });
    eventBus.emit('play-sound', { name: 'countdown' });

    // Track if transition timeout has been set to prevent duplicates
    let transitionTimeoutSet = false;

    this.countdownInterval = setInterval(() => {
      // Add more detailed logging with current state
      console.log(`GameStartController: Countdown tick. Value: ${this.countdownValue}, State: ${gameStateManager.state}`);
      
      this.countdownValue--;
      eventBus.emit('countdown-update', { count: this.countdownValue });

      if (this.countdownValue > 0) {
        // Play tick sound
        eventBus.emit('play-sound', { name: 'countdown' });
      } else if (this.countdownValue === 0) {
        console.log("GameStartController: Displaying GO!");
        // Schedule state transition *after* GO is displayed
        if (!transitionTimeoutSet) { // Ensure timeout is set only once
          transitionTimeoutSet = true;
          console.log('GameStartController: Scheduling transition to PLAYING after GO! display (800ms delay)');
          setTimeout(() => {
            if (gameStateManager) { // Check if manager exists
              // ** CRITICAL TRANSITION **
              console.log(`GameStartController: Countdown complete, transitioning to PLAYING`);
              gameStateManager.setState('PLAYING'); // Final state change
            }
          }, 800); // Delay after showing GO!
        }
      } else if (this.countdownValue < 0) {
        // Interval should stop *after* scheduling the transition
        console.log("GameStartController: Countdown finished, clearing interval.");
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        // Do not set state here, it's handled by the setTimeout above
      }
    }, 1000); // Run every 1 second
  }
  
  /**
   * Clean up and dispose resources
   */
  public dispose(): void {
    console.log('GameStartController: Disposing resources');
    
    // Clear countdown timer
    if (this.countdownInterval) {
      console.log('GameStartController: Clearing countdown interval during disposal');
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    // Also clear any lingering transition timeouts
    // This is a best practice even though we can't access the specific timeout ID
    console.log('GameStartController: Ensuring any transition timeouts are garbage collected');
    
    // Clean up event listeners with better logging
    console.log('GameStartController: Removing event listeners');
    eventBus.off('asset-loading-complete', this.handleAssetsLoaded);
    eventBus.off('audio-initialized', this.handleAudioInitialized);
    eventBus.off('renderer-initialized', this.handleRendererInitialized);
    
    // Also remove any other lingering listeners
    eventBus.off('countdown-update'); // In case other components subscribed
    
    // Dispose renderer
    if (this.renderer) {
      try {
        console.log('GameStartController: Disposing renderer');
        // Force WebGL context loss
        const gl = this.renderer.getContext();
        if (gl && 'getExtension' in gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            console.log('GameStartController: Forcing WebGL context loss');
            ext.loseContext();
          }
        }
        
        this.renderer.dispose();
        this.renderer = null;
      } catch (error) {
        console.warn('GameStartController: Error disposing renderer:', error);
      }
    }
    
    // Dispose audio manager
    if (this.audioManager) {
      console.log('GameStartController: Disposing audio manager');
      this.audioManager.dispose();
      this.audioManager = null;
    }
    
    // Dispose asset manager
    if (this.assetManager) {
      console.log('GameStartController: Disposing asset manager');
      this.assetManager.dispose();
      this.assetManager = null;
    }
    
    // Clear canvas reference
    if (this.canvasElement) {
      console.log('GameStartController: Clearing canvas reference');
      delete (this.canvasElement as any).__webGLContextCreated;
      this.canvasElement = null;
    }
    
    // Clear camera and scene
    this.camera = null;
    this.scene = null;
    
    // Call GameEngine cleanup if it exists
    if (this.gameEngineCleanup) {
      console.log('GameStartController: Calling GameEngine cleanup function');
      try {
        this.gameEngineCleanup();
      } catch (gameEngineCleanupError) {
        console.error('GameStartController: Error during GameEngine cleanup:', gameEngineCleanupError);
      }
      this.gameEngineCleanup = null;
    }
    
    // Reset state with explicit logging
    console.log('GameStartController: Resetting internal state flags');
    this.isInitialized = false;
    this.isInitializing = false;
    this.rendererInitialized = false;
    this.assetsLoaded = false;
    this.audioInitialized = false;
    
    console.log('GameStartController: Disposal complete');
  }
}

// Export singleton instance
const gameStartController = new GameStartController();
export default gameStartController;