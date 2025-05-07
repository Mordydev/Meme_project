import * as THREE from 'three';
// Import proper loaders instead of stubs
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

type GLTF = {
  scene: THREE.Group;
  scenes: THREE.Group[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: object;
};

import { detectDeviceCapabilities } from '../utils/DeviceUtils';
import eventBus from './EventSystem';

// Asset types
export type AssetType = 'model' | 'texture' | 'audio' | 'shader';

// Asset information interface
interface AssetInfo {
  id: string;
  type: AssetType;
  path: string;
  loaded: boolean;
  asset: any; // The loaded asset
  dependencies?: string[]; // IDs of other assets this one depends on
}

/**
 * Asset Manager for handling loading and caching of game assets
 */
export class AssetManager {
  // Asset storage by ID
  private assets: Map<string, AssetInfo> = new Map();
  
  // Loaders
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private audioLoader: THREE.AudioLoader;
  
  // Loading state
  private loadingTotal: number = 0;
  private loadingComplete: number = 0;
  private isLoading: boolean = false;
  
  // Device capabilities for adaptive loading
  private deviceCapabilities = detectDeviceCapabilities();
  
  constructor() {
    // Initialize loaders
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.audioLoader = new THREE.AudioLoader();
    
    // Set up DRACO loader for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    // Configure loaders
    this.textureLoader.setCrossOrigin('anonymous');
    this.audioLoader.setCrossOrigin('anonymous');
  }
  
  /**
   * Register an asset to be loaded
   * @param id Unique identifier for the asset
   * @param type Asset type (model, texture, audio, shader)
   * @param path Path to the asset file
   * @param dependencies Optional array of asset IDs this asset depends on
   */
  public registerAsset(id: string, type: AssetType, path: string, dependencies?: string[]): void {
    if (this.assets.has(id)) {
      console.warn(`Asset ${id} already registered.`);
      return;
    }
    
    this.assets.set(id, {
      id,
      type,
      path,
      loaded: false,
      asset: null,
      dependencies
    });
  }
  
  /**
   * Register multiple assets at once
   * @param assetInfos Array of asset information objects
   */
  public registerAssets(assetInfos: { id: string, type: AssetType, path: string, dependencies?: string[] }[]): void {
    for (const info of assetInfos) {
      this.registerAsset(info.id, info.type, info.path, info.dependencies);
    }
  }
  
  /**
   * Load a specific asset by ID
   * @param id Asset identifier
   * @returns Promise that resolves when the asset is loaded
   */
  public async loadAsset(id: string): Promise<any> {
    const assetInfo = this.assets.get(id);
    
    if (!assetInfo) {
      throw new Error(`Asset ${id} not registered.`);
    }
    
    if (assetInfo.loaded) {
      return assetInfo.asset;
    }
    
    // Load dependencies first if any
    if (assetInfo.dependencies && assetInfo.dependencies.length > 0) {
      await Promise.all(assetInfo.dependencies.map(depId => this.loadAsset(depId)));
    }
    
    // Load the asset based on its type
    try {
      switch (assetInfo.type) {
        case 'texture':
          assetInfo.asset = await this.loadTexture(assetInfo.path);
          break;
        case 'model':
          assetInfo.asset = await this.loadModel(assetInfo.path);
          break;
        case 'audio':
          assetInfo.asset = await this.loadAudio(assetInfo.path);
          break;
        case 'shader':
          assetInfo.asset = await this.loadShader(assetInfo.path);
          break;
        default:
          throw new Error(`Unknown asset type: ${assetInfo.type}`);
      }
      
      assetInfo.loaded = true;
      return assetInfo.asset;
    } catch (error) {
      console.error(`Error loading asset ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Load all registered assets
   * @param progressCallback Optional callback for loading progress updates
   * @returns Promise that resolves when all assets are loaded
   */
  public async loadAll(progressCallback?: (progress: number) => void): Promise<void> {
    if (this.isLoading) {
      throw new Error('Asset loading already in progress.');
    }
    
    this.isLoading = true;
    this.loadingTotal = this.assets.size;
    this.loadingComplete = 0;
    
    try {
      // Start loading all assets
      const loadPromises = Array.from(this.assets.keys()).map(async (id) => {
        await this.loadAsset(id);
        this.loadingComplete++;
        
        // Update progress
        const progress = this.loadingComplete / this.loadingTotal;
        if (progressCallback) {
          progressCallback(progress);
        }
        
        // Emit loading progress event
        eventBus.emit('assets-loading-progress', {
          completed: this.loadingComplete,
          total: this.loadingTotal,
          progress
        });
      });
      
      await Promise.all(loadPromises);
      
      // Loading complete
      this.isLoading = false;
      eventBus.emit('assets-loading-complete', {
        totalAssets: this.loadingTotal
      });
    } catch (error) {
      this.isLoading = false;
      console.error('Error loading assets:', error);
      eventBus.emit('assets-loading-error', { error });
      throw error;
    }
  }
  
  /**
   * Get a loaded asset by ID
   * @param id Asset identifier
   * @returns The loaded asset or null if not found/loaded
   */
  /**
   * Get a loaded asset by ID with improved error handling
   * @param id Asset identifier
   * @returns The loaded asset or null if not found/loaded
   */
  public getAsset<T = any>(id: string): T | null {
    const assetInfo = this.assets.get(id);
    
    // Define a list of known decoration types that are expected to be missing
    // and therefore don't need logging - this reduces console spam
    const knownMissingDecorations = [
      'decoration_shipPart', 'decoration_treasure', 'decoration_anchor', 
      'decoration_shipHull', 'decoration_barrel', 'decoration_floatingDebris',
      'decoration_bioluminescentCoral', 'decoration_deepsea_vent', 
      'decoration_crystalFormation', 'decoration_glowingPlant'
    ];
    
    if (!assetInfo || !assetInfo.loaded) {
      const isKnownMissingDecoration = knownMissingDecorations.includes(id);
      
      // Categorize the asset to determine logging behavior
      const isDecoration = id.startsWith('decoration_');
      const isRegistered = this.assets.has(id);
      
      // Only log warnings for important assets, not for decorations or known missing items
      if (!isRegistered && !isDecoration && !isKnownMissingDecoration) {
        // For critical non-decoration assets, show a warning
        console.warn(`Asset ${id} not found or not registered.`);
      } else if (!isRegistered && !isKnownMissingDecoration) {
        // For unknown decorations that aren't in our known-missing list, just log (not warn)
        console.log(`Using placeholder for ${id}`);
      }
      // For known missing decorations, don't log at all
      
      return null;
    }
    
    // For loaded assets, perform a quick validation before returning
    // This helps catch corrupted or partially loaded assets
    try {
      if (typeof assetInfo.asset === 'object' && assetInfo.asset !== null) {
        // Basic existence check passed, do extra validation for models
        if (assetInfo.type === 'model' && 
            (!assetInfo.asset.scene || typeof assetInfo.asset.scene !== 'object')) {
          console.warn(`Asset ${id} is loaded but has invalid scene structure`);
          return null;
        }
      }
      
      return assetInfo.asset as T;
    } catch (error) {
      console.warn(`Error validating asset ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Check if an asset is loaded
   * @param id Asset identifier
   * @returns True if the asset is loaded
   */
  public isAssetLoaded(id: string): boolean {
    const assetInfo = this.assets.get(id);
    return assetInfo ? assetInfo.loaded : false;
  }
  
  /**
   * Set assets to be ignored by the loading system
   * Used for assets that will be procedurally generated instead of loaded
   * @param assetIds Array of asset IDs to ignore
   */
  public setIgnoreAssets(assetIds: string[]): void {
    for (const id of assetIds) {
      const assetInfo = this.assets.get(id);
      if (assetInfo) {
        // Mark as already loaded
        assetInfo.loaded = true;
        assetInfo.asset = null; // Will be generated procedurally
        console.log(`Asset ${id} marked as procedurally generated`);
      }
    }
  }
  
  /**
   * Get loading progress information
   * @returns Object with loading progress information
   */
  public getLoadingProgress(): { completed: number, total: number, progress: number } {
    return {
      completed: this.loadingComplete,
      total: this.loadingTotal,
      progress: this.loadingTotal > 0 ? this.loadingComplete / this.loadingTotal : 1
    };
  }
  
  // Private asset loading methods
  
  /**
   * Load a texture asset
   * @param path Path to the texture file
   * @returns Promise that resolves with the loaded texture
   */
  private loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      try {
        this.textureLoader.load(
          path,
          texture => {
            // Configure texture based on type and device capabilities
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            // Apply anisotropic filtering on higher-end devices
            if (this.deviceCapabilities.highEnd || this.deviceCapabilities.midRange) {
              const renderer = new THREE.WebGLRenderer(); // Just to access capabilities
              const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
              renderer.dispose();
              
              texture.anisotropy = maxAnisotropy;
            }
            
            resolve(texture);
          },
          undefined, // onProgress is not used
          error => {
            console.warn(`Failed to load texture ${path}, using placeholder:`, error);
            // Create a fallback texture
            const canvas = document.createElement('canvas');
            canvas.width = 4;
            canvas.height = 4;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = 'magenta';
              ctx.fillRect(0, 0, 2, 2);
              ctx.fillRect(2, 2, 2, 2);
              ctx.fillStyle = 'black';
              ctx.fillRect(2, 0, 2, 2);
              ctx.fillRect(0, 2, 2, 2);
            }
            const placeholderTexture = new THREE.CanvasTexture(canvas);
            placeholderTexture.wrapS = THREE.RepeatWrapping;
            placeholderTexture.wrapT = THREE.RepeatWrapping;
            resolve(placeholderTexture);
          }
        );
      } catch (error) {
        console.warn(`Error in texture loader setup for ${path}:`, error);
        // Create a fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'magenta';
          ctx.fillRect(0, 0, 4, 4);
        }
        const placeholderTexture = new THREE.CanvasTexture(canvas);
        placeholderTexture.wrapS = THREE.RepeatWrapping;
        placeholderTexture.wrapT = THREE.RepeatWrapping;
        resolve(placeholderTexture);
      }
    });
  }
  
  /**
   * Load a 3D model asset
   * @param path Path to the model file
   * @returns Promise that resolves with the loaded model
   */
  private loadModel(path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      try {
        this.gltfLoader.load(
          path,
          gltf => resolve(gltf),
          undefined, // onProgress is not used
          error => {
            console.warn(`Failed to load model ${path}, using placeholder:`, error);
            
            // Create a placeholder model
            const placeholderGroup = new THREE.Group();
            const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
            const placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
            const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
            placeholderGroup.add(placeholderMesh);
            
            // Match the GLTF interface structure
            const placeholderGLTF: GLTF = {
              scene: placeholderGroup,
              scenes: [placeholderGroup],
              animations: [],
              cameras: [],
              asset: {}
            };
            
            resolve(placeholderGLTF);
          }
        );
      } catch (error) {
        console.warn(`Error in model loader setup for ${path}:`, error);
        
        // Create a placeholder model
        const placeholderGroup = new THREE.Group();
        const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
        const placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
        const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
        placeholderGroup.add(placeholderMesh);
        
        // Match the GLTF interface structure
        const placeholderGLTF: GLTF = {
          scene: placeholderGroup,
          scenes: [placeholderGroup],
          animations: [],
          cameras: [],
          asset: {}
        };
        
        resolve(placeholderGLTF);
      }
    });
  }
  
  /**
   * Load an audio asset
   * @param path Path to the audio file
   * @returns Promise that resolves with the loaded audio buffer
   */
  private loadAudio(path: string): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      try {
        this.audioLoader.load(
          path,
          buffer => resolve(buffer),
          undefined, // onProgress is not used
          error => {
            console.warn(`Failed to load audio ${path}, creating silent buffer:`, error);
            
            // Create a silent audio buffer (0.1 second of silence)
            try {
              const sampleRate = 44100;
              const emptyBuffer = new AudioContext().createBuffer(2, Math.floor(sampleRate * 0.1), sampleRate);
              resolve(emptyBuffer);
            } catch (bufferError) {
              console.error('Failed to create empty audio buffer:', bufferError);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.warn(`Error in audio loader setup for ${path}:`, error);
        
        try {
          // Create a silent audio buffer (0.1 second of silence)
          const sampleRate = 44100;
          const emptyBuffer = new AudioContext().createBuffer(2, Math.floor(sampleRate * 0.1), sampleRate);
          resolve(emptyBuffer);
        } catch (bufferError) {
          console.error('Failed to create empty audio buffer:', bufferError);
          reject(error);
        }
      }
    });
  }
  
  /**
   * Load a shader asset
   * @param path Path to the shader file
   * @returns Promise that resolves with the loaded shader text
   */
  private loadShader(path: string): Promise<string> {
    return fetch(path)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load shader: ${response.statusText}`);
        }
        return response.text();
      })
      .catch(error => {
        console.warn(`Failed to load shader ${path}, using placeholder:`, error);
        
        // Return basic placeholder shader that renders magenta color
        return `
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // Magenta for error
          }
        `;
      });
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clear asset cache
    this.assets.forEach(assetInfo => {
      if (assetInfo.loaded && assetInfo.asset) {
        try {
          if (assetInfo.type === 'texture' && assetInfo.asset instanceof THREE.Texture) {
            assetInfo.asset.dispose();
          } else if (assetInfo.type === 'model' && assetInfo.asset && assetInfo.asset.scene) {
            // Clean up scene from GLTF
            assetInfo.asset.scene.traverse((object: any) => {
              if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                  object.geometry.dispose();
                }
                
                if (object.material) {
                  if (Array.isArray(object.material)) {
                    object.material.forEach((material: THREE.Material) => {
                      if (material) material.dispose();
                    });
                  } else {
                    object.material.dispose();
                  }
                }
              }
            });
          }
        } catch (error) {
          console.warn(`Error disposing asset ${assetInfo.id}:`, error);
        }
      }
    });
    
    // Clear asset map
    this.assets.clear();
  }
  
  /**
   * Register core game assets
   */
  public registerCoreAssets(): void {
    // ========================================================
    // Mark all these assets as procedurally generated instead of trying to load them
    // This will avoid 404 errors for files that don't exist yet
    // ========================================================
    
    // Character assets
    this.registerAsset('character_nemo', 'model', '/assets/models/character/nemo.glb');
    
    // Environment textures
    this.registerAsset('water_caustics', 'texture', '/assets/textures/environment/caustics.jpg');
    this.registerAsset('water_normal', 'texture', '/assets/textures/environment/water_normal.jpg');
    this.registerAsset('sand_texture', 'texture', '/assets/textures/environment/sand.jpg');
    this.registerAsset('coral_texture', 'texture', '/assets/textures/environment/coral.jpg');
    
    // Obstacle models
    this.registerAsset('obstacle_shark', 'model', '/assets/models/obstacles/shark.glb');
    this.registerAsset('obstacle_jellyfish', 'model', '/assets/models/obstacles/jellyfish.glb');
    this.registerAsset('obstacle_pufferfish', 'model', '/assets/models/obstacles/pufferfish.glb');
    this.registerAsset('obstacle_clam', 'model', '/assets/models/obstacles/clam.glb');
    this.registerAsset('obstacle_coral', 'model', '/assets/models/obstacles/coral.glb');
    
    // Collectible models
    this.registerAsset('collectible_bubble', 'model', '/assets/models/collectibles/bubble.glb');
    this.registerAsset('collectible_powerup', 'model', '/assets/models/collectibles/powerup.glb');
    
    // Shaders
    this.registerAsset('shader_water_vertex', 'shader', '/assets/shaders/water_vertex.glsl');
    this.registerAsset('shader_water_fragment', 'shader', '/assets/shaders/water_fragment.glsl');
    this.registerAsset('shader_caustics_vertex', 'shader', '/assets/shaders/caustics_vertex.glsl');
    this.registerAsset('shader_caustics_fragment', 'shader', '/assets/shaders/caustics_fragment.glsl');
    this.registerAsset('shader_bubble_vertex', 'shader', '/assets/shaders/bubble_vertex.glsl');
    this.registerAsset('shader_bubble_fragment', 'shader', '/assets/shaders/bubble_fragment.glsl');
    
    // Audio assets - comprehensive set
    // Background music
    this.registerAsset('audio_background', 'audio', '/assets/audio/background.mp3');
    this.registerAsset('audio_background_underwater', 'audio', '/assets/audio/background_underwater.mp3');
    this.registerAsset('audio_background_intense', 'audio', '/assets/audio/background_intense.mp3');
    
    // Sound effects
    this.registerAsset('audio_collect', 'audio', '/assets/audio/collect.mp3');
    this.registerAsset('audio_collision', 'audio', '/assets/audio/collision.mp3');
    this.registerAsset('audio_powerup', 'audio', '/assets/audio/powerup.mp3');
    this.registerAsset('audio_game_start', 'audio', '/assets/audio/game_start.mp3');
    this.registerAsset('audio_game_over', 'audio', '/assets/audio/game_over.mp3');
    this.registerAsset('audio_shield', 'audio', '/assets/audio/shield.mp3');
    this.registerAsset('audio_speed', 'audio', '/assets/audio/speed.mp3');
    this.registerAsset('audio_lane_change', 'audio', '/assets/audio/lane_change.mp3');
    this.registerAsset('audio_countdown', 'audio', '/assets/audio/countdown.mp3');
    this.registerAsset('audio_jump', 'audio', '/assets/audio/jump.mp3');
    this.registerAsset('audio_dive', 'audio', '/assets/audio/dive.mp3');
    this.registerAsset('audio_menu', 'audio', '/assets/audio/menu.mp3');
    
    // Environment assets
    this.registerAsset('environment_reef', 'model', '/assets/models/environment/reef.glb');
    this.registerAsset('environment_deep_sea', 'model', '/assets/models/environment/deep_sea.glb');
    this.registerAsset('environment_open_ocean', 'model', '/assets/models/environment/open_ocean.glb');
    
    // Mark all assets as procedurally generated to avoid 404 errors
    const allAssetIds = Array.from(this.assets.keys());
    this.setIgnoreAssets(allAssetIds);
  }
  
  /**
   * Create a simple placeholder for an asset while loading
   * @param type Type of asset to create placeholder for
   * @returns Placeholder asset
   */
  public createPlaceholder(type: AssetType): any {
    switch (type) {
      case 'model':
        // Simple cube placeholder
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00, wireframe: true });
        const mesh = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(mesh);
        return { scene: group };
      
      case 'texture':
        // Checkerboard texture
        const placeholderTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=');
        placeholderTexture.repeat.set(10, 10);
        placeholderTexture.wrapS = THREE.RepeatWrapping;
        placeholderTexture.wrapT = THREE.RepeatWrapping;
        return placeholderTexture;
      
      default:
        return null;
    }
  }
}