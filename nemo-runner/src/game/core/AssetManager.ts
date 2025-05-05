import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Asset types
type AssetType = 'texture' | 'model' | 'audio' | 'json';

// Asset definition
interface AssetDefinition {
  type: AssetType;
  path: string;
  name: string;
}

export class AssetManager {
  private loaded: Record<string, any> = {};
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private audioLoader: THREE.AudioLoader;
  private dracoLoader: DRACOLoader;
  private jsonLoader: { load: (path: string, onLoad: (response: any) => void) => void };
  
  constructor() {
    // Initialize loaders
    this.textureLoader = new THREE.TextureLoader();
    
    // Setup DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    
    // Setup GLTF loader
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    // Audio loader
    this.audioLoader = new THREE.AudioLoader();
    
    // Simple JSON loader
    this.jsonLoader = {
      load: (path, onLoad) => {
        fetch(path)
          .then(response => response.json())
          .then(onLoad)
          .catch(error => {
            console.error(`Error loading JSON from ${path}:`, error);
          });
      }
    };
  }
  
  /**
   * Load a single asset
   */
  async load(assetDefinition: AssetDefinition): Promise<any> {
    const { type, path, name } = assetDefinition;
    const key = name || path;
    
    // Return cached asset if already loaded
    if (this.loaded[key]) return this.loaded[key];
    
    let asset: any;
    
    switch (type) {
      case 'texture':
        asset = await this.loadTexture(path);
        break;
      case 'model':
        asset = await this.loadModel(path);
        break;
      case 'audio':
        asset = await this.loadAudio(path);
        break;
      case 'json':
        asset = await this.loadJson(path);
        break;
      default:
        throw new Error(`Unknown asset type: ${type}`);
    }
    
    // Cache the loaded asset
    this.loaded[key] = asset;
    return asset;
  }
  
  /**
   * Preload multiple assets
   */
  async preload(assetList: AssetDefinition[]): Promise<void> {
    await Promise.all(assetList.map(asset => this.load(asset)));
  }
  
  /**
   * Get a previously loaded asset
   */
  get(nameOrPath: string): any {
    if (!this.loaded[nameOrPath]) {
      console.warn(`Asset not loaded: ${nameOrPath}`);
      return null;
    }
    return this.loaded[nameOrPath];
  }
  
  /**
   * Clear specific assets from cache
   */
  unload(names: string[]): void {
    names.forEach(name => {
      if (this.loaded[name]) {
        // Dispose Three.js resources if applicable
        const asset = this.loaded[name];
        if (asset instanceof THREE.Texture) {
          asset.dispose();
        } else if (asset.scene instanceof THREE.Scene) {
          // GLTF model
          asset.scene.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              if (object.material instanceof THREE.Material) {
                object.material.dispose();
              } else if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              }
            }
          });
        }
        delete this.loaded[name];
      }
    });
  }
  
  /**
   * Clear all assets from cache
   */
  unloadAll(): void {
    Object.keys(this.loaded).forEach(key => {
      this.unload([key]);
    });
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.unloadAll();
    this.dracoLoader.dispose();
  }
  
  // Private loaders
  private loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        texture => {
          resolve(texture);
        },
        undefined, // onProgress not supported
        error => {
          console.error(`Error loading texture ${path}:`, error);
          reject(error);
        }
      );
    });
  }
  
  private loadModel(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        gltf => {
          resolve(gltf);
        },
        undefined, // onProgress not supported
        error => {
          console.error(`Error loading model ${path}:`, error);
          reject(error);
        }
      );
    });
  }
  
  private loadAudio(path: string): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        buffer => {
          resolve(buffer);
        },
        undefined, // onProgress not supported
        error => {
          console.error(`Error loading audio ${path}:`, error);
          reject(error);
        }
      );
    });
  }
  
  private loadJson(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.jsonLoader.load(
        path,
        json => {
          resolve(json);
        }
      );
    });
  }
}