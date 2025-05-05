'use client';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader, AudioLoader, Group, Texture, Object3D, RepeatWrapping, LinearFilter, NearestFilter } from 'three';
import { QualityLevel } from './QualityManager';

export enum AssetType {
  MODEL,
  TEXTURE,
  AUDIO
}

// Define different texture resolutions based on quality settings
export enum TextureResolution {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

interface AssetInfo {
  type: AssetType;
  url: string;
  loaded: boolean;
  data: Group | Texture | ArrayBuffer | null;
  priority: number;
  textureQuality?: QualityLevel; // Track the quality level of the texture
  onLoad?: (asset: any) => void;
  onError?: (error: Error) => void;
}

export default class AssetManager {
  private assets: Map<string, AssetInfo> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private totalAssets: number = 0;
  private loadedAssets: number = 0;
  private modelLoader: GLTFLoader;
  private textureLoader: TextureLoader;
  private audioLoader: AudioLoader;
  private progressCallback?: (progress: number) => void;
  private currentTextureQuality: QualityLevel = QualityLevel.MEDIUM;

  constructor() {
    this.modelLoader = new GLTFLoader();
    this.textureLoader = new TextureLoader();
    this.audioLoader = new AudioLoader();
  }
  
  // New method to set the texture quality level
  setTextureQuality(quality: QualityLevel): void {
    if (this.currentTextureQuality !== quality) {
      this.currentTextureQuality = quality;
      // Reload textures that are already loaded but at a different quality
      this.reloadTexturesIfNeeded();
    }
  }
  
  // Helper to reload textures at new quality settings
  private reloadTexturesIfNeeded(): void {
    for (const [key, info] of this.assets.entries()) {
      if (info.type === AssetType.TEXTURE && info.loaded && info.textureQuality !== this.currentTextureQuality) {
        // Unload current texture
        this.unloadAsset(key);
        // Load at new quality setting
        this.loadAsset(key);
      }
    }
  }
  
  // Helper to get texture URL with quality suffix
  private getTextureUrlForQuality(baseUrl: string): string {
    // Extract path and extension
    const lastDotIndex = baseUrl.lastIndexOf('.');
    if (lastDotIndex === -1) return baseUrl;
    
    const path = baseUrl.substring(0, lastDotIndex);
    const extension = baseUrl.substring(lastDotIndex);
    
    // Add quality suffix based on current quality setting
    switch (this.currentTextureQuality) {
      case QualityLevel.LOW:
        return `${path}_${TextureResolution.LOW}${extension}`;
      case QualityLevel.MEDIUM:
        return `${path}_${TextureResolution.MEDIUM}${extension}`;
      case QualityLevel.HIGH:
      default:
        return baseUrl; // High quality is the default (no suffix)
    }
  }

  setProgressCallback(callback: (progress: number) => void): void {
    this.progressCallback = callback;
  }

  getProgress(): number {
    if (this.totalAssets === 0) return 1;
    return this.loadedAssets / this.totalAssets;
  }

  registerAsset(
    key: string, 
    url: string, 
    type: AssetType, 
    priority: number = 1,
    onLoad?: (asset: any) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.assets.has(key)) {
      this.assets.set(key, {
        type,
        url,
        loaded: false,
        data: null,
        priority,
        onLoad,
        onError
      });
      this.totalAssets++;
    }
  }

  async preloadAssets(): Promise<void> {
    // Sort assets by priority (higher first)
    const sortedAssets = Array.from(this.assets.entries())
      .filter(([_, info]) => !info.loaded)
      .sort((a, b) => b[1].priority - a[1].priority);

    // Load assets in priority order
    for (const [key, info] of sortedAssets) {
      try {
        await this.loadAsset(key);
      } catch (error) {
        console.error(`Failed to preload asset: ${key}`, error);
      }
    }
  }

  async loadAsset(key: string): Promise<any> {
    const info = this.assets.get(key);
    
    if (!info) {
      throw new Error(`Asset not registered: ${key}`);
    }

    if (info.loaded && info.data) {
      return info.data;
    }

    if (!this.loadingPromises.has(key)) {
      const loadPromise = new Promise<any>((resolve, reject) => {
        const handleLoad = (data: any) => {
          info.loaded = true;
          info.data = data;
          this.loadedAssets++;
          
          if (this.progressCallback) {
            this.progressCallback(this.getProgress());
          }
          
          if (info.onLoad) {
            info.onLoad(data);
          }
          
          resolve(data);
        };

        const handleError = (error: Error) => {
          console.error(`Error loading asset: ${key}`, error);
          
          if (info.onError) {
            info.onError(error);
          }
          
          reject(error);
        };

        switch (info.type) {
          case AssetType.MODEL:
            this.modelLoader.load(
              info.url, 
              gltf => handleLoad(gltf.scene),
              undefined, 
              handleError
            );
            break;
            
          case AssetType.TEXTURE:
            // Get quality-appropriate URL for textures
            const textureUrl = this.getTextureUrlForQuality(info.url);
            
            // Load the texture with appropriate settings
            this.textureLoader.load(
              textureUrl,
              texture => {
                // Apply texture settings based on quality
                texture.anisotropy = this.currentTextureQuality === QualityLevel.LOW ? 1 : 
                                    (this.currentTextureQuality === QualityLevel.MEDIUM ? 4 : 16);
                
                // Use appropriate filtering based on quality
                if (this.currentTextureQuality === QualityLevel.LOW) {
                  texture.minFilter = NearestFilter;
                  texture.magFilter = NearestFilter;
                } else {
                  texture.minFilter = LinearFilter;
                  texture.magFilter = LinearFilter;
                }
                
                // Enable wrapping for any textures that need it
                texture.wrapS = RepeatWrapping;
                texture.wrapT = RepeatWrapping;
                
                // Mark the texture with its quality level
                info.textureQuality = this.currentTextureQuality;
                
                // Handle the loaded texture
                handleLoad(texture);
              },
              undefined,
              handleError
            );
            break;
            
          case AssetType.AUDIO:
            this.audioLoader.load(
              info.url,
              handleLoad,
              undefined,
              handleError
            );
            break;
            
          default:
            reject(new Error(`Unsupported asset type for: ${key}`));
        }
      });
      
      this.loadingPromises.set(key, loadPromise);
    }
    
    return this.loadingPromises.get(key);
  }

  getAsset(key: string): Group | Texture | ArrayBuffer | null {
    const info = this.assets.get(key);
    
    if (!info || !info.loaded) {
      return null;
    }
    
    return info.data;
  }

  getAssetClone(key: string): Object3D | null {
    const asset = this.getAsset(key);
    
    if (asset instanceof Group) {
      return asset.clone();
    }
    
    return null;
  }

  unloadAsset(key: string): void {
    const info = this.assets.get(key);
    
    if (info && info.loaded && info.data) {
      // Dispose of textures or geometries if needed
      if (info.data instanceof Texture) {
        info.data.dispose();
      }
      
      info.loaded = false;
      info.data = null;
      this.loadingPromises.delete(key);
      this.loadedAssets--;
      
      if (this.progressCallback) {
        this.progressCallback(this.getProgress());
      }
    }
  }

  unloadAll(): void {
    for (const key of this.assets.keys()) {
      this.unloadAsset(key);
    }
  }
}