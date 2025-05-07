import * as THREE from 'three';
import eventBus from '../core/EventSystem';
import { getPerformanceMonitor, QualityLevel } from './PerformanceMonitor';

/**
 * Quality preset for different quality levels
 */
export type QualityPreset = {
  // Rendering settings
  pixelRatio: number;
  shadowMapEnabled: boolean;
  shadowMapType: THREE.ShadowMapType;
  outputColorSpace: THREE.ColorSpace;
  toneMapping: THREE.ToneMapping;
  antialias: boolean;
  
  // Game entities settings
  maxParticles: number;
  maxDecorations: number;
  entityDetailLevel: number;
  effectQuality: number;
  
  // Post-processing
  enablePostProcessing: boolean;
  enableBloom: boolean;
  enableAmbientOcclusion: boolean;
  
  // Game-specific settings
  viewDistance: number;
  maxObstacles: number;
  maxCollectibles: number;
  obstacleSpawnRate: number;
  useSimplifiedColliders: boolean;
  animationFrameSkip: number;
};

/**
 * Static quality presets for different quality levels
 */
const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    pixelRatio: 0.75,
    shadowMapEnabled: false,
    shadowMapType: THREE.BasicShadowMap,
    outputColorSpace: THREE.LinearSRGBColorSpace,
    toneMapping: THREE.NoToneMapping,
    antialias: false,
    
    maxParticles: 100,
    maxDecorations: 50,
    entityDetailLevel: 1,
    effectQuality: 1,
    
    enablePostProcessing: false,
    enableBloom: false,
    enableAmbientOcclusion: false,
    
    viewDistance: 100,
    maxObstacles: 5,
    maxCollectibles: 20,
    obstacleSpawnRate: 0.5,
    useSimplifiedColliders: true,
    animationFrameSkip: 2
  },
  medium: {
    pixelRatio: 1.0,
    shadowMapEnabled: true,
    shadowMapType: THREE.PCFShadowMap,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ReinhardToneMapping,
    antialias: true,
    
    maxParticles: 200,
    maxDecorations: 100,
    entityDetailLevel: 2,
    effectQuality: 2,
    
    enablePostProcessing: true,
    enableBloom: false,
    enableAmbientOcclusion: false,
    
    viewDistance: 150,
    maxObstacles: 10,
    maxCollectibles: 30,
    obstacleSpawnRate: 0.75,
    useSimplifiedColliders: false,
    animationFrameSkip: 1
  },
  high: {
    pixelRatio: 1.5,
    shadowMapEnabled: true,
    shadowMapType: THREE.PCFSoftShadowMap,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    antialias: true,
    
    maxParticles: 500,
    maxDecorations: 200,
    entityDetailLevel: 3,
    effectQuality: 3,
    
    enablePostProcessing: true,
    enableBloom: true,
    enableAmbientOcclusion: false,
    
    viewDistance: 200,
    maxObstacles: 15,
    maxCollectibles: 40,
    obstacleSpawnRate: 1.0,
    useSimplifiedColliders: false,
    animationFrameSkip: 0
  },
  ultra: {
    pixelRatio: 2.0,
    shadowMapEnabled: true,
    shadowMapType: THREE.PCFSoftShadowMap,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    antialias: true,
    
    maxParticles: 1000,
    maxDecorations: 300,
    entityDetailLevel: 4,
    effectQuality: 4,
    
    enablePostProcessing: true,
    enableBloom: true,
    enableAmbientOcclusion: true,
    
    viewDistance: 250,
    maxObstacles: 20,
    maxCollectibles: 50,
    obstacleSpawnRate: 1.25,
    useSimplifiedColliders: false,
    animationFrameSkip: 0
  }
};

/**
 * Adaptive quality adjuster that applies quality settings based on performance.
 * Listens for performance quality change events and applies appropriate settings.
 * Provides API for systems to check what quality settings they should use.
 */
export class QualityAdjuster {
  // Singleton instance
  private static instance: QualityAdjuster;
  
  // Current quality setting
  private currentQuality: QualityLevel = 'medium';
  private currentPreset: QualityPreset;
  
  // References to key game components
  private renderer: THREE.WebGLRenderer | null = null;
  
  // Quality change handlers
  private qualityChangeHandlers: Set<(quality: QualityLevel, preset: QualityPreset) => void> = new Set();
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    // Get initial quality from performance monitor
    const performanceMonitor = getPerformanceMonitor();
    this.currentQuality = performanceMonitor.getQuality();
    this.currentPreset = { ...QUALITY_PRESETS[this.currentQuality] };
    
    // Listen for quality change events
    eventBus.on('performance-quality-change', this.handleQualityChange.bind(this));
    
    console.log(`QualityAdjuster: Initialized with ${this.currentQuality} quality`);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): QualityAdjuster {
    if (!QualityAdjuster.instance) {
      QualityAdjuster.instance = new QualityAdjuster();
    }
    return QualityAdjuster.instance;
  }
  
  /**
   * Set the WebGL renderer to adjust
   */
  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    
    // Apply current quality settings to the renderer
    this.applyRendererSettings();
    
    console.log('QualityAdjuster: Renderer set, applied quality settings');
  }
  
  /**
   * Get current quality level
   */
  public getQuality(): QualityLevel {
    return this.currentQuality;
  }
  
  /**
   * Get current quality preset
   */
  public getQualityPreset(): QualityPreset {
    return { ...this.currentPreset };
  }
  
  /**
   * Set quality level manually 
   */
  public setQuality(quality: QualityLevel): void {
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      this.currentPreset = { ...QUALITY_PRESETS[quality] };
      
      // Apply new settings
      this.applyQualitySettings();
      
      // Set quality in performance monitor
      getPerformanceMonitor().setQuality(quality);
      
      console.log(`QualityAdjuster: Manually set quality to ${quality}`);
    }
  }
  
  /**
   * Register a handler for quality change events
   */
  public registerQualityChangeHandler(handler: (quality: QualityLevel, preset: QualityPreset) => void): void {
    this.qualityChangeHandlers.add(handler);
  }
  
  /**
   * Unregister a quality change handler
   */
  public unregisterQualityChangeHandler(handler: (quality: QualityLevel, preset: QualityPreset) => void): void {
    this.qualityChangeHandlers.delete(handler);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    eventBus.off('performance-quality-change', this.handleQualityChange);
    this.qualityChangeHandlers.clear();
    this.renderer = null;
    console.log('QualityAdjuster: Cleaned up resources');
  }
  
  /**
   * Handle quality change events from the performance monitor
   */
  private handleQualityChange(data: { quality: QualityLevel, reason: string }): void {
    console.log(`QualityAdjuster: Quality change to ${data.quality} due to ${data.reason}`);
    
    // Update current quality
    this.currentQuality = data.quality;
    this.currentPreset = { ...QUALITY_PRESETS[data.quality] };
    
    // Apply new settings
    this.applyQualitySettings();
  }
  
  /**
   * Apply quality settings to all relevant components
   */
  private applyQualitySettings(): void {
    // Apply renderer settings
    this.applyRendererSettings();
    
    // Notify handlers
    this.notifyQualityChangeHandlers();
    
    // Emit global event
    eventBus.emit('quality-settings-changed', {
      quality: this.currentQuality,
      preset: this.getQualityPreset()
    });
  }
  
  /**
   * Apply settings to the THREE.js renderer
   */
  private applyRendererSettings(): void {
    if (!this.renderer) return;
    
    const preset = this.currentPreset;
    
    try {
      // Set pixel ratio (with device pixel ratio cap)
      const devicePixelRatio = window.devicePixelRatio || 1;
      const actualPixelRatio = Math.min(preset.pixelRatio, devicePixelRatio);
      this.renderer.setPixelRatio(actualPixelRatio);
      
      // Set shadow map settings
      this.renderer.shadowMap.enabled = preset.shadowMapEnabled;
      this.renderer.shadowMap.type = preset.shadowMapType;
      
      // Set color space and tone mapping
      this.renderer.outputColorSpace = preset.outputColorSpace;
      this.renderer.toneMapping = preset.toneMapping;
      
      // We can't change antialias after renderer creation, but log it
      const context = this.renderer.getContext();
      if (context) {
        const attributes = context.getContextAttributes();
        if (attributes && attributes.antialias !== preset.antialias) {
          console.log(`QualityAdjuster: Cannot change antialias setting after renderer creation. Current: ${attributes.antialias}, Desired: ${preset.antialias}`);
        }
      }
      
      console.log(`QualityAdjuster: Applied renderer settings for ${this.currentQuality} quality`);
    } catch (error) {
      console.error('QualityAdjuster: Error applying renderer settings:', error);
    }
  }
  
  /**
   * Notify all registered handlers about quality change
   */
  private notifyQualityChangeHandlers(): void {
    const quality = this.currentQuality;
    const preset = this.getQualityPreset();
    
    // Call each handler with the current quality and preset
    this.qualityChangeHandlers.forEach(handler => {
      try {
        handler(quality, preset);
      } catch (error) {
        console.error('QualityAdjuster: Error in quality change handler:', error);
      }
    });
  }
}

/**
 * Get the quality adjuster singleton
 */
export function getQualityAdjuster(): QualityAdjuster {
  return QualityAdjuster.getInstance();
}

/**
 * Apply quality settings to an entity/system
 * Returns a function to unregister the handler
 */
export function applyQualitySettings(
  entity: any,
  applySettings: (preset: QualityPreset) => void
): () => void {
  const qualityAdjuster = getQualityAdjuster();
  
  // Apply current settings immediately
  applySettings(qualityAdjuster.getQualityPreset());
  
  // Create handler for future changes
  const handler = (_quality: QualityLevel, preset: QualityPreset) => {
    applySettings(preset);
  };
  
  // Register handler
  qualityAdjuster.registerQualityChangeHandler(handler);
  
  // Return function to unregister
  return () => qualityAdjuster.unregisterQualityChangeHandler(handler);
}