import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
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
  public getAsset<T = any>(id: string): T | null {
    const assetInfo = this.assets.get(id);
    
    if (!assetInfo || !assetInfo.loaded) {
      console.warn(`Asset ${id} not found or not loaded.`);
      return null;
    }
    
    return assetInfo.asset as T;
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
        error => reject(error)
      );
    });
  }
  
  /**
   * Load a 3D model asset
   * @param path Path to the model file
   * @returns Promise that resolves with the loaded model
   */
  private loadModel(path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        gltf => resolve(gltf),
        undefined, // onProgress is not used
        error => reject(error)
      );
    });
  }
  
  /**
   * Load an audio asset
   * @param path Path to the audio file
   * @returns Promise that resolves with the loaded audio buffer
   */
  private loadAudio(path: string): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        buffer => resolve(buffer),
        undefined, // onProgress is not used
        error => reject(error)
      );
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
      });
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clear asset cache
    this.assets.forEach(assetInfo => {
      if (assetInfo.loaded) {
        if (assetInfo.type === 'texture' && assetInfo.asset instanceof THREE.Texture) {
          assetInfo.asset.dispose();
        } else if (assetInfo.type === 'model' && assetInfo.asset.scene) {
          // Clean up scene from GLTF
          assetInfo.asset.scene.traverse((object: any) => {
            if (object instanceof THREE.Mesh) {
              if (object.geometry) {
                object.geometry.dispose();
              }
              
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach((material: THREE.Material) => material.dispose());
                } else {
                  object.material.dispose();
                }
              }
            }
          });
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
    
    // Collectible models
    this.registerAsset('collectible_bubble', 'model', '/assets/models/collectibles/bubble.glb');
    this.registerAsset('collectible_powerup', 'model', '/assets/models/collectibles/powerup.glb');
    
    // Shaders
    this.registerAsset('shader_water_vertex', 'shader', '/assets/shaders/water_vertex.glsl');
    this.registerAsset('shader_water_fragment', 'shader', '/assets/shaders/water_fragment.glsl');
    this.registerAsset('shader_caustics_vertex', 'shader', '/assets/shaders/caustics_vertex.glsl');
    this.registerAsset('shader_caustics_fragment', 'shader', '/assets/shaders/caustics_fragment.glsl');
    
    // Audio
    this.registerAsset('audio_background', 'audio', '/assets/audio/underwater_ambient.mp3');
    this.registerAsset('audio_collect', 'audio', '/assets/audio/collect.mp3');
    this.registerAsset('audio_collision', 'audio', '/assets/audio/collision.mp3');
    this.registerAsset('audio_powerup', 'audio', '/assets/audio/powerup.mp3');
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