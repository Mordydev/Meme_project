import * as THREE from 'three';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import eventBus from './EventSystem';
import { detectDeviceCapabilities, configureGameSettings } from '../utils/DeviceUtils';
import gameStateManager from './GameStateManager';
import { getPerformanceMonitor } from '../utils/PerformanceMonitor';
import { getQualityAdjuster } from '../utils/QualityAdjuster';

/**
 * RenderingInitializer handles initialization, asset loading, and renderer setup
 * to make the GameEngine more modular and improve error handling.
 * 
 * This class addresses specific error issues:
 * 1. WebGL renderer creation errors
 * 2. Audio manager initialization errors
 * 3. Asset loading errors
 */
export class RenderingInitializer {
  // Core components
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private assetManager: AssetManager;
  private audioManager: AudioManager;
  
  // Device and game settings
  private deviceCapabilities: ReturnType<typeof detectDeviceCapabilities>;
  private gameSettings: ReturnType<typeof configureGameSettings>;
  
  // State tracking
  private isInitializing: boolean = false;
  private isInitialized: boolean = false;
  private renderErrorCount: number = 0;
  private lastRenderErrorTime: number = 0;
  private renderErrorLogged: boolean = false;

  /**
   * Create a new RenderingInitializer
   */
  constructor() {
    // Detect device capabilities
    this.deviceCapabilities = detectDeviceCapabilities();
    this.gameSettings = configureGameSettings(this.deviceCapabilities);
    
    // Initialize asset manager
    this.assetManager = new AssetManager();
    this.assetManager.registerCoreAssets();
    
    // Initialize audio manager
    this.audioManager = AudioManager.getInstance();
    this.audioManager.setAssetManager(this.assetManager);
  }

  /**
   * Initialize the renderer, scene, and camera
   * @param canvas Canvas element to render to
   * @returns The initialized renderer, scene, and camera
   */
  public initializeRenderingSystem(canvas: HTMLCanvasElement): {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
  } {
    if (this.isInitializing) {
      throw new Error('Rendering system initialization already in progress');
    }
    
    this.isInitializing = true;
    
    try {
      // Create renderer with error handling
      this.renderer = this.setupRenderer(canvas);
      
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x75c2f6); // Sky blue background
      
      // Create camera
      this.camera = this.setupCamera();
      
      // Initialize performance monitoring and quality adjustment
      if (this.renderer) {
        // Get singletons
        const performanceMonitor = getPerformanceMonitor();
        const qualityAdjuster = getQualityAdjuster();
        
        // Initialize monitor with renderer for stats collection
        performanceMonitor.setRenderer(this.renderer);
        performanceMonitor.start();
        
        // Initialize quality adjuster with renderer for settings application
        qualityAdjuster.setRenderer(this.renderer);
        
        // Emit event to notify systems that performance monitoring is ready
        eventBus.emit('performance-monitoring-ready', {
          qualityLevel: qualityAdjuster.getQuality(),
          qualityPreset: qualityAdjuster.getQualityPreset()
        });
        
        console.log('RenderingInitializer: Performance monitoring and quality adjustment initialized');
      }
      
      // Mark as initialized
      this.isInitialized = true;
      this.isInitializing = false;
      
      return {
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera
      };
    } catch (error) {
      this.isInitializing = false;
      console.error('Failed to initialize rendering system:', error);
      throw error;
    }
  }

  /**
   * Load assets required for the game
   * @param progressHandler Callback for asset loading progress
   */
  public async loadAssets(progressHandler?: (progress: number) => void): Promise<void> {
    try {
      console.log('Loading essential assets with procedurally generated placeholders...');
      
      // Since assets are already marked as procedurally generated in the constructor, 
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
   * Initialize the audio system
   */
  public async initializeAudio(): Promise<void> {
    if (!this.camera) {
      throw new Error('Cannot initialize audio: Camera not initialized');
    }
    
    try {
      // Initialize audio system
      await this.audioManager.initialize(this.camera);
      
      // Load sound effects
      await this.audioManager.loadSoundEffects();
    } catch (error) {
      console.error('Audio initialization failed:', error);
      
      // Continue without audio rather than blocking the game
      console.log('Continuing without audio...');
    }
  }

  /**
   * Set up scene lighting
   * @param scene Scene to add lighting to
   */
  public setupLighting(scene: THREE.Scene): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light (sun rays through water)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = this.gameSettings.shadowQuality !== 'off';
    scene.add(directionalLight);
  }

  /**
   * Handle window resize
   * @param renderer Renderer to resize
   * @param camera Camera to update
   */
  public handleResize(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Render the scene with comprehensive error handling and performance monitoring
   * @param renderer WebGL renderer
   * @param scene Scene to render
   * @param camera Camera for the view
   * @param gameState Current game state
   */
  public render(
    renderer: THREE.WebGLRenderer, 
    scene: THREE.Scene, 
    camera: THREE.PerspectiveCamera,
    gameState: string
  ): void {
    // Record render start time for performance measurements
    const renderStartTime = performance.now();
    
    // Complete safety check at the very beginning
    try {
      // Check if we have the essential components
      if (!renderer || !scene || !camera) {
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
      
      // Check for potential performance issues using centralized logic
      const performanceMonitor = getPerformanceMonitor();
      
      // Let the performance monitor determine if there are severe issues
      // This replaces the direct threshold check with centralized logic
      const performanceStatus = performanceMonitor.hasSeverePerformanceIssues();
      
      // We don't need to log or emit events here anymore since that's handled
      // in the PerformanceMonitor's reportPerformance method
      // We just need to check the status in case we need to apply specific renderer-level adjustments
      if (performanceStatus.severe) {
        // We could add renderer-specific optimizations here if needed
        // But we're removing explicit emergency optimizations in favor of QualityAdjuster
      }
      
      // Pre-check for invalid state
      if (!gameStateManager) {
        console.warn('GameStateManager is not initialized, skipping render');
        return;
      }
      
      // Apply camera effects based on game state
      this.applyCameraEffects(camera, gameState);
      
      // Final verification before rendering
      if (renderer && scene && camera &&
          renderer.render && typeof renderer.render === 'function') {
        try {
          // Perform the actual rendering
          renderer.render(scene, camera);
          
          // Successful render, reset error tracking
          this.renderErrorLogged = false;
          
          // Measure render time for performance monitoring
          const renderEndTime = performance.now();
          const renderDuration = renderEndTime - renderStartTime;
          
          // Report long render time if it exceeds threshold (16.67ms = 60fps)
          if (renderDuration > 16.67) {
            const performanceMonitor = getPerformanceMonitor();
            
            // Only report as a "long task" if it's significantly longer than a frame
            if (renderDuration > 33.33) { // >33.33ms = <30fps
              performanceMonitor.reportLongTask();
            }
          }
        } catch (renderError) {
          // Track this error
          this.lastRenderErrorTime = now;
          this.renderErrorCount++;
          
          // Check specifically for "trim" related errors which indicate a UI component issue
          const errorString = String(renderError);
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
            this.attemptRendererRecovery(renderer);
          }
        }
      } else {
        console.warn('Render method unavailable on renderer');
      }
    } catch (fatalError) {
      // Last resort catch - this should never happen but will prevent the game from crashing
      console.error('Fatal error in render method:', fatalError);
      
      // Report the long task for performance monitoring
      try {
        getPerformanceMonitor().reportLongTask();
      } catch (e) {
        // Ignore errors in performance reporting during a fatal error
      }
    }
  }

  /**
   * Apply camera effects based on game state
   * @param camera Camera to apply effects to
   * @param gameState Current game state
   */
  private applyCameraEffects(camera: THREE.PerspectiveCamera, gameState: string): void {
    try {
      const time = performance.now() * 0.001;
      
      if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        // FIXED CAMERA MODE EFFECTS
        // Very subtle effects that don't affect camera position or look direction
        try {
          // Apply a VERY subtle camera roll for underwater feeling
          // This only affects rotation around Z axis, not position or direction
          const subtleRoll = Math.sin(time * 0.2) * 0.002; // Extremely minor roll
          if (camera && camera.rotation) {
            camera.rotation.z = subtleRoll;
          }
        } catch (effectError) {
          console.warn('Error applying camera effects:', effectError);
        }
      } else {
        // MENU STATE CAMERA
        // For the menu, we want more dramatic effects
        try {
          if (camera && camera.position && camera.rotation) {
            // Subtle camera movement for menu
            camera.position.y = 2.0 + Math.sin(time * 0.2) * 0.1;
            camera.rotation.z = Math.sin(time * 0.1) * 0.02;
            
            // Slowly rotate camera in menu
            if (gameState === 'MENU') {
              camera.position.x = Math.sin(time * 0.1) * 3;
              camera.position.z = Math.cos(time * 0.1) * 3 + 10;
              
              // Make sure vector is valid before lookAt
              if (camera.lookAt && typeof camera.lookAt === 'function') {
                camera.lookAt(0, 0, 0);
              }
            }
          }
        } catch (menuEffectError) {
          console.warn('Error applying menu camera effects:', menuEffectError);
        }
      }
    } catch (error) {
      console.warn('Error applying camera effects:', error);
    }
  }

  /**
   * Attempt to recover from renderer issues by recreating it
   * @param renderer Renderer to recover
   */
  private attemptRendererRecovery(renderer: THREE.WebGLRenderer): void {
    console.log('Attempting renderer recovery...');
    
    try {
      // Cache the current canvas
      const canvas = renderer.domElement;
      
      // Dispose current renderer
      try {
        // Get WebGL context and force loss to free up GPU resources
        const gl = renderer.getContext();
        if (gl && 'getExtension' in gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            console.log('Forcing WebGL context loss for recovery...');
            ext.loseContext();
          }
        }
        
        renderer.dispose();
      } catch (disposeError) {
        console.warn('Error disposing old renderer:', disposeError);
      }
      
      // Create a new renderer with minimal options
      console.log('Creating new renderer...');
      const newRenderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: false,
        alpha: false,
        precision: 'lowp',
        powerPreference: 'default'
      });
      
      // Set basic properties
      newRenderer.setSize(window.innerWidth, window.innerHeight);
      newRenderer.setPixelRatio(1.0); // Use safest value
      
      // Replace the old renderer
      this.renderer = newRenderer;
      
      // Reset error tracking
      this.renderErrorCount = 0;
      this.renderErrorLogged = false;
      
      console.log('Renderer recovery complete');
    } catch (recoveryError) {
      console.error('Failed to recover renderer:', recoveryError);
    }
  }

  /**
   * Initialize renderer with extensive error handling and canvas dimension awareness
   * @param canvas Canvas element to render to
   * @returns Initialized WebGL renderer
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
              
              // We can't directly modify the WebGL context's antialias property
              // Antialias should be set through the renderer options instead
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
   * @returns Perspective camera for the game
   */
  private setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60, // FOV - consistent value for racing games
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Position camera for menu state
    camera.position.set(0, 2.0, 10);
    camera.lookAt(0, 0, 0);
    
    return camera;
  }

  /**
   * Get the asset manager instance
   * @returns AssetManager instance
   */
  public getAssetManager(): AssetManager {
    return this.assetManager;
  }

  /**
   * Get the audio manager instance
   * @returns AudioManager instance
   */
  public getAudioManager(): AudioManager {
    return this.audioManager;
  }

  /**
   * Get device capabilities
   */
  public getDeviceCapabilities() {
    return this.deviceCapabilities;
  }

  /**
   * Get game settings
   */
  public getGameSettings() {
    return this.gameSettings;
  }

  /**
   * Clean up and dispose resources
   */
  public dispose(): void {
    // First stop performance monitoring
    try {
      console.log('RenderingInitializer: Stopping performance monitoring...');
      const performanceMonitor = getPerformanceMonitor();
      performanceMonitor.stop();
      performanceMonitor.cleanup();
      
      const qualityAdjuster = getQualityAdjuster();
      qualityAdjuster.cleanup();
    } catch (error) {
      console.warn('Error cleaning up performance monitoring:', error);
    }
    
    if (this.renderer) {
      try {
        // Force context loss to clean up WebGL resources
        const gl = this.renderer.getContext();
        if (gl && 'getExtension' in gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            console.log('Forcing WebGL context loss for cleanup...');
            ext.loseContext();
          }
        }
        
        this.renderer.dispose();
        this.renderer = null;
      } catch (error) {
        console.warn('Error disposing renderer:', error);
      }
    }

    // Clear scene
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }

    // Clear camera
    this.camera = null;

    // Reset state
    this.isInitialized = false;
    this.isInitializing = false;
    this.renderErrorCount = 0;
    this.lastRenderErrorTime = 0;
    this.renderErrorLogged = false;
  }
}

// Singleton instance
let renderingInitializerInstance: RenderingInitializer | null = null;

/**
 * Get or create the RenderingInitializer instance
 * @returns RenderingInitializer instance
 */
export function getRenderingInitializer(): RenderingInitializer {
  if (!renderingInitializerInstance) {
    renderingInitializerInstance = new RenderingInitializer();
  }
  return renderingInitializerInstance;
}