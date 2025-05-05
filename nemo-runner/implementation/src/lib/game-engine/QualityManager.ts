'use client';

import { create } from 'zustand';

// Quality levels for different aspects of the game
export enum QualityLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

// Different aspects of the game that can have quality settings
export interface QualitySettings {
  // Rendering quality
  particleDensity: QualityLevel;   // Controls number of particles
  viewDistance: QualityLevel;      // Controls how far ahead we generate content
  shadowQuality: QualityLevel;     // Controls shadow resolution and type
  geometryDetail: QualityLevel;    // Controls mesh complexity
  textureQuality: QualityLevel;    // Controls texture resolution
  postProcessing: QualityLevel;    // Controls effects like bloom, ambient occlusion, etc.
  
  // Physics and gameplay quality
  obstacleCount: QualityLevel;     // Controls density of obstacles
  cullDistance: QualityLevel;      // Controls how aggressively we cull objects
  poolSize: QualityLevel;          // Controls size of object pools
}

// Device capability classification
export enum DeviceCapability {
  LOW_END,     // Mobile devices, older computers
  MID_RANGE,   // Average laptops, mid-range phones
  HIGH_END     // Gaming PCs, high-end phones
}

// Performance metrics used to adjust quality
export interface PerformanceMetrics {
  frameRate: number;          // Current FPS
  averageFrameTime: number;   // Average time per frame in ms
  memoryUsage: number;        // Memory usage in MB if available
  lastAdaptationTime: number; // When we last adapted quality
  unstableFrames: number;     // Count of frames below target
}

// Store interface
interface QualityState {
  // Current settings
  settings: QualitySettings;
  autoAdapt: boolean;
  targetFrameRate: number;
  detectedCapability: DeviceCapability;
  
  // Performance tracking
  metrics: PerformanceMetrics;
  
  // Methods
  setQuality: (aspect: keyof QualitySettings, level: QualityLevel) => void;
  setAllQuality: (level: QualityLevel) => void;
  setAutoAdapt: (enabled: boolean) => void;
  setTargetFrameRate: (fps: number) => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  detectDeviceCapability: () => DeviceCapability;
  adaptQuality: () => void;
}

// Default quality presets based on device capability
const QUALITY_PRESETS: Record<DeviceCapability, QualitySettings> = {
  [DeviceCapability.LOW_END]: {
    particleDensity: QualityLevel.LOW,
    viewDistance: QualityLevel.LOW,
    shadowQuality: QualityLevel.LOW,
    geometryDetail: QualityLevel.LOW,
    textureQuality: QualityLevel.MEDIUM, // Keep decent textures for visual quality
    postProcessing: QualityLevel.LOW,
    obstacleCount: QualityLevel.MEDIUM, // Keep decent gameplay
    cullDistance: QualityLevel.LOW,     // Aggressive culling
    poolSize: QualityLevel.LOW,         // Smaller pools
  },
  [DeviceCapability.MID_RANGE]: {
    particleDensity: QualityLevel.MEDIUM,
    viewDistance: QualityLevel.MEDIUM,
    shadowQuality: QualityLevel.MEDIUM,
    geometryDetail: QualityLevel.MEDIUM,
    textureQuality: QualityLevel.MEDIUM,
    postProcessing: QualityLevel.MEDIUM,
    obstacleCount: QualityLevel.MEDIUM,
    cullDistance: QualityLevel.MEDIUM,
    poolSize: QualityLevel.MEDIUM,
  },
  [DeviceCapability.HIGH_END]: {
    particleDensity: QualityLevel.HIGH,
    viewDistance: QualityLevel.HIGH,
    shadowQuality: QualityLevel.HIGH,
    geometryDetail: QualityLevel.HIGH,
    textureQuality: QualityLevel.HIGH,
    postProcessing: QualityLevel.HIGH,
    obstacleCount: QualityLevel.HIGH,
    cullDistance: QualityLevel.HIGH,
    poolSize: QualityLevel.HIGH,
  }
};

// Create the quality store
export const useQualityStore = create<QualityState>((set, get) => ({
  settings: { ...QUALITY_PRESETS[DeviceCapability.MID_RANGE] }, // Default to mid-range
  autoAdapt: true,
  targetFrameRate: 60,
  detectedCapability: DeviceCapability.MID_RANGE,
  
  metrics: {
    frameRate: 60,
    averageFrameTime: 16.67,
    memoryUsage: 0,
    lastAdaptationTime: 0,
    unstableFrames: 0,
  },
  
  // Set quality for a specific aspect
  setQuality: (aspect, level) => set(state => ({
    settings: {
      ...state.settings,
      [aspect]: level
    }
  })),
  
  // Set all quality settings to the same level
  setAllQuality: (level) => set({
    settings: {
      particleDensity: level,
      viewDistance: level,
      shadowQuality: level,
      geometryDetail: level,
      textureQuality: level,
      postProcessing: level,
      obstacleCount: level,
      cullDistance: level,
      poolSize: level,
    }
  }),
  
  // Toggle automatic quality adaptation
  setAutoAdapt: (enabled) => set({ autoAdapt: enabled }),
  
  // Set target frame rate
  setTargetFrameRate: (fps) => set({ targetFrameRate: fps }),
  
  // Update performance metrics
  updateMetrics: (metrics) => set(state => ({ 
    metrics: { ...state.metrics, ...metrics } 
  })),
  
  // Detect device capability based on browser/device properties
  detectDeviceCapability: () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return DeviceCapability.MID_RANGE;
    
    // Get information about the system
    const userAgent = navigator.userAgent;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4; // in GB, available in Chrome
    const isLowEndExperience = (navigator as any).connection?.saveData || false;
    
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Advanced GPU detection using WebGL context
    let gpuPower = 1;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
                 canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          // Check for high-end GPUs keywords
          if (/NVIDIA|RTX|GTX|Radeon|AMD|Adreno 6|Adreno 7|Apple GPU/i.test(renderer)) {
            gpuPower = 2;
          }
          // Check for low-end GPU keywords
          if (/Intel|HD Graphics|Adreno 3|Mali-T/i.test(renderer)) {
            gpuPower = 0;
          }
        }
      }
    } catch (e) {
      console.warn("Could not detect GPU capabilities");
    }
    
    // Calculate a combined score (0-10) based on all factors
    let score = 0;
    // CPU: 0-3 points
    score += Math.min(cpuCores / 2, 3);
    // Memory: 0-3 points
    score += Math.min(memory / 2, 3);
    // GPU: 0-3 points
    score += gpuPower * 1.5;
    // Mobile penalty: -2 points
    if (isMobile) score -= 2;
    // Data saver/low-end experience penalty: -1 point
    if (isLowEndExperience) score -= 1;
    
    // Determine capability based on score
    let capability: DeviceCapability;
    if (score < 4) {
      capability = DeviceCapability.LOW_END;
    } else if (score < 7) {
      capability = DeviceCapability.MID_RANGE;
    } else {
      capability = DeviceCapability.HIGH_END;
    }
    
    // Update the detected capability
    set({ detectedCapability: capability });
    
    return capability;
  },
  
  // Adapt quality settings based on performance metrics
  adaptQuality: () => {
    const state = get();
    
    // Skip if auto-adapt is disabled
    if (!state.autoAdapt) return;
    
    // Check if we need to wait before adapting again (once per 8 seconds - increased from 5 to be less aggressive)
    const now = performance.now();
    const timeSinceLastAdaptation = now - state.metrics.lastAdaptationTime;
    if (timeSinceLastAdaptation < 8000) return;
    
    // Get current metrics
    const { frameRate, unstableFrames } = state.metrics;
    const { targetFrameRate } = state;
    
    // Define thresholds - less aggressive settings
    const lowPerformanceThreshold = targetFrameRate * 0.65; // e.g., 39 FPS if target is 60 (was 0.8)
    const highPerformanceThreshold = targetFrameRate * 0.9; // e.g., 54 FPS if target is 60 (was 0.95)
    
    // Count unstable frames
    let newUnstableFrames = unstableFrames;
    if (frameRate < lowPerformanceThreshold) {
      newUnstableFrames += 1;
    } else if (frameRate > highPerformanceThreshold) {
      newUnstableFrames = Math.max(0, newUnstableFrames - 1);
    }
    
    // Update unstable frames count
    set(state => ({
      metrics: {
        ...state.metrics,
        unstableFrames: newUnstableFrames,
        lastAdaptationTime: now
      }
    }));
    
    // Adapt quality if needed (require more consecutive unstable frames - increased from 3 to 5)
    if (newUnstableFrames >= 5) {
      // Performance is consistently poor, reduce quality
      const currentSettings = state.settings;
      
      // Define quality reduction order (prioritize visual effects over gameplay elements)
      // Modified to keep visual quality higher
      const reductionOrder: (keyof QualitySettings)[] = [
        'postProcessing',        // First to reduce - post-processing
        'particleDensity',       // Particle density can be reduced
        'shadowQuality',         // Shadows can be simplified
        'viewDistance',          // Reduce view distance to improve performance
        'geometryDetail',        // Reduce geometry detail only if necessary
        'cullDistance',          // Adjust culling 
        'obstacleCount',         // Gameplay elements reduced last
        'textureQuality',        // Textures kept high quality longer
        'poolSize'               // Technical optimization
      ];
      
      // Find the first quality setting that can be reduced
      for (const aspect of reductionOrder) {
        if (currentSettings[aspect] > QualityLevel.LOW) {
          // Reduce this aspect by one level
          get().setQuality(aspect, currentSettings[aspect] - 1 as QualityLevel);
          // Reset unstable frames count after making an adjustment
          set(state => ({
            metrics: { ...state.metrics, unstableFrames: 0 }
          }));
          console.log(`Reduced ${aspect} quality to improve performance`);
          break;
        }
      }
    } else if (frameRate > targetFrameRate * 1.3 && newUnstableFrames === 0) {
      // Performance is excellent, we might be able to increase quality
      // (Only if we've been stable for a while - threshold increased from 1.2 to 1.3)
      
      const currentSettings = state.settings;
      
      // Define quality increase order (reverse priority)
      // Modified to prioritize visual improvements first
      const increaseOrder: (keyof QualitySettings)[] = [
        'textureQuality',        // Increase texture quality first
        'geometryDetail',        // Then geometry detail for better visuals
        'shadowQuality',         // Then shadows for better realism
        'particleDensity',       // Then particle effects
        'viewDistance',          // Then view distance for better visibility
        'postProcessing',        // Then post-processing visual effects
        'obstacleCount',         // Then gameplay elements
        'cullDistance', 
        'poolSize'
      ];
      
      // Find the first quality setting that can be increased
      for (const aspect of increaseOrder) {
        if (currentSettings[aspect] < QualityLevel.HIGH) {
          // Increase this aspect by one level
          get().setQuality(aspect, currentSettings[aspect] + 1 as QualityLevel);
          // Reset unstable frames after making an adjustment
          set(state => ({
            metrics: { ...state.metrics, unstableFrames: 0, lastAdaptationTime: now }
          }));
          console.log(`Increased ${aspect} quality`);
          break;
        }
      }
    }
  }
}));

// Utility function to get value based on quality level
export function getQualityValue(level: QualityLevel, lowValue: number, medValue: number, highValue: number): number {
  switch (level) {
    case QualityLevel.LOW:
      return lowValue;
    case QualityLevel.MEDIUM:
      return medValue;
    case QualityLevel.HIGH:
      return highValue;
    default:
      return medValue;
  }
}

// Initialize quality settings on application start
export function initializeQuality() {
  const state = useQualityStore.getState();
  const capability = state.detectDeviceCapability();
  
  // Set initial quality preset based on detected device capability
  const qualityPreset = QUALITY_PRESETS[capability];
  Object.keys(qualityPreset).forEach(aspect => {
    state.setQuality(aspect as keyof QualitySettings, qualityPreset[aspect as keyof QualitySettings]);
  });
  
  console.log(`Initialized quality settings for ${DeviceCapability[capability]} device`);
  
  return capability;
}