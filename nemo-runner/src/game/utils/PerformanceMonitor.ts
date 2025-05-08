import { detectDeviceCapabilities } from './DeviceUtils';
import eventBus from '../core/EventSystem';
import * as THREE from 'three';

export type PerformanceMetrics = {
  fps: number;
  frameTime: number;
  averageFrameTime: number;
  memoryUsage: { jsHeapSizeLimit?: number; totalJSHeapSize?: number; usedJSHeapSize?: number } | null;
  gpuInfo: string | null;
  longFrames: number;
  longTasksPerSecond: number;
  drawCallsPerFrame: number | null;
  trianglesPerFrame: number | null;
};

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

export type PerformanceThresholds = {
  targetFps: number;
  acceptableFps: number;
  criticalFps: number;
  maxFrameTime: number;
  maxLongFramesPerSecond: number;
  maxLongTasksPerSecond: number;
};

/**
 * Monitors game performance and provides adaptive quality adjustments.
 * Tracks FPS, frame times, memory usage, and other performance metrics.
 * Emits events when performance changes significantly to allow systems to adapt.
 */
export class PerformanceMonitor {
  // Singleton instance
  private static instance: PerformanceMonitor;

  // Performance metrics
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    averageFrameTime: 16.67,
    memoryUsage: null,
    gpuInfo: null,
    longFrames: 0,
    longTasksPerSecond: 0,
    drawCallsPerFrame: null,
    trianglesPerFrame: null
  };

  // Performance thresholds based on quality level
  private thresholds: PerformanceThresholds = {
    targetFps: 60,
    acceptableFps: 45,
    criticalFps: 30,
    maxFrameTime: 33.33, // ~30fps
    maxLongFramesPerSecond: 5,
    maxLongTasksPerSecond: 2
  };

  // Quality settings
  private quality: QualityLevel = 'medium';
  private autoAdjustQuality: boolean = true;
  private qualityChangeThrottleTime: number = 5000; // ms
  private lastQualityChangeTime: number = 0;

  // Monitoring settings
  private enabled: boolean = true;
  private monitoringStartTime: number = 0;
  private frameCount: number = 0;
  private frameTimeHistory: number[] = [];
  private frameTimeHistorySize: number = 60; // 1 second at 60fps
  private longFrameThreshold: number = 33.33; // ms (frames longer than 33.33ms are considered "long" ~30fps)
  private longFrameCount: number = 0;
  private longTaskCount: number = 0;
  private lastPerformanceReport: number = 0;
  private performanceReportInterval: number = 1000; // 1 second
  private rafId: number | null = null;

  // THREE.js renderer reference for collecting stats (optional)
  private renderer: THREE.WebGLRenderer | null = null;

  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    this.initializeMonitoring();
    
    // Initialize based on device capabilities
    const deviceCapabilities = detectDeviceCapabilities();
    this.setInitialQualityFromDeviceCapabilities(deviceCapabilities);
    
    // Apply initial thresholds based on quality
    this.updateThresholds();
    
    // Initialize tracking variables
    this.lastLongFrameTime = performance.now();
    this.consecutiveGoodFrames = 0;
    
    // Register for events
    eventBus.on('renderer-initialized', this.handleRendererInitialized.bind(this));
    
    // Register for cleanup
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring performance
   */
  public start(): void {
    if (!this.enabled) {
      this.enabled = true;
      this.monitoringStartTime = performance.now();
      this.frameCount = 0;
      this.frameTimeHistory = [];
      this.longFrameCount = 0;
      this.longTaskCount = 0;
      this.lastPerformanceReport = 0;
      this.startFrameMonitoring();
      
      console.log('PerformanceMonitor: Started monitoring');
    }
  }

  /**
   * Stop monitoring performance
   */
  public stop(): void {
    this.enabled = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    console.log('PerformanceMonitor: Stopped monitoring');
  }

  /**
   * Set the renderer to collect additional stats
   */
  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    console.log('PerformanceMonitor: Renderer set for additional stats collection');
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current quality level
   */
  public getQuality(): QualityLevel {
    return this.quality;
  }

  /**
   * Manually set quality level
   */
  public setQuality(quality: QualityLevel): void {
    if (this.quality !== quality) {
      this.quality = quality;
      this.updateThresholds();
      this.lastQualityChangeTime = performance.now();
      
      // Emit quality change event
      eventBus.emit('performance-quality-change', { 
        quality: this.quality,
        reason: 'manual',
        metrics: this.getMetrics() 
      });
      
      console.log(`PerformanceMonitor: Quality level set to ${quality}`);
    }
  }

  /**
   * Set whether quality should automatically adjust based on performance
   */
  public setAutoAdjustQuality(autoAdjust: boolean): void {
    this.autoAdjustQuality = autoAdjust;
    console.log(`PerformanceMonitor: Auto-adjust quality ${autoAdjust ? 'enabled' : 'disabled'}`);
  }

  /**
   * Report a long task (e.g. expensive computation)
   */
  public reportLongTask(): void {
    this.longTaskCount++;
  }

  /**
   * Check if there are severe performance issues
   * Centralizes the determination of severe performance issues
   * @returns Object with boolean indicating severe issues and the reason
   */
  public hasSeverePerformanceIssues(): { severe: boolean; reason?: string } {
    // Check for severe performance issues based on metrics
    if (this.metrics.fps < 20) {
      return { 
        severe: true, 
        reason: `Critical FPS drop (${this.metrics.fps.toFixed(1)} FPS)` 
      };
    }
    
    if (this.metrics.longFrames > 10) {
      return { 
        severe: true, 
        reason: `Excessive long frames (${this.metrics.longFrames} per second)` 
      };
    }
    
    if (this.metrics.averageFrameTime > 50) {
      return { 
        severe: true, 
        reason: `Very high average frame time (${this.metrics.averageFrameTime.toFixed(1)}ms)` 
      };
    }
    
    // Check for moderate performance issues
    if (this.metrics.fps < 30 || this.metrics.longFrames > 5) {
      return {
        severe: false,
        reason: `Moderate performance issues (${this.metrics.fps.toFixed(1)} FPS, ${this.metrics.longFrames} long frames)`
      };
    }
    
    // No performance issues detected
    return { severe: false };
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    eventBus.off('renderer-initialized', this.handleRendererInitialized);
    window.removeEventListener('beforeunload', this.cleanup);
    console.log('PerformanceMonitor: Cleaned up resources');
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Start monitoring frame times
    this.startFrameMonitoring();
    
    // Set up long task observer if available
    this.setupLongTaskObserver();
    
    // Collect initial memory usage if available
    this.collectMemoryUsage();
    
    // Attempt to collect GPU info if available
    this.collectGpuInfo();
    
    console.log('PerformanceMonitor: Monitoring initialized');
  }

  /**
   * Start monitoring frame times
   */
  private startFrameMonitoring(): void {
    let lastFrameTime = performance.now();
    
    const frameMonitorLoop = (timestamp: number) => {
      if (!this.enabled) return;
      
      // Calculate time since last frame
      const currentFrameTime = timestamp;
      const frameDelta = currentFrameTime - lastFrameTime;
      lastFrameTime = currentFrameTime;
      
      // Skip the first frame (may be abnormally long due to initialization)
      if (this.frameCount > 0) {
        // Add to rolling history
        this.frameTimeHistory.push(frameDelta);
        if (this.frameTimeHistory.length > this.frameTimeHistorySize) {
          this.frameTimeHistory.shift();
        }
        
        // Check if this is a long frame
        if (frameDelta > this.longFrameThreshold) {
          this.longFrameCount++;
        }
        
        // Collect WebGL renderer stats if available
        if (this.renderer) {
          this.collectRendererStats();
        }
      }
      
      // Increment frame count
      this.frameCount++;
      
      // Report performance periodically
      const timeSinceLastReport = currentFrameTime - this.lastPerformanceReport;
      if (timeSinceLastReport >= this.performanceReportInterval) {
        this.reportPerformance(timeSinceLastReport);
        this.lastPerformanceReport = currentFrameTime;
        
        // Reset counters
        this.longFrameCount = 0;
        this.longTaskCount = 0;
      }
      
      // Continue monitoring
      this.rafId = requestAnimationFrame(frameMonitorLoop);
    };
    
    // Start the monitoring loop
    this.rafId = requestAnimationFrame(frameMonitorLoop);
  }

  /**
   * Set up observer for long tasks (if available)
   */
  private setupLongTaskObserver(): void {
    // Check if the PerformanceObserver API is available and supports longtask
    if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
      try {
        // First check if the browser actually supports the 'longtask' entry type
        // by testing with a temporary observer
        let longTaskSupported = false;
        try {
          const testObserver = new PerformanceObserver(() => {});
          testObserver.observe({ entryTypes: ['longtask'] });
          testObserver.disconnect();
          longTaskSupported = true;
        } catch (e) {
          console.warn('PerformanceMonitor: Long task entries not supported by this browser');
          return;
        }
        
        if (longTaskSupported) {
          const observer = new PerformanceObserver((list) => {
            try {
              const entries = list.getEntries();
              for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (entry && entry.entryType === 'longtask') {
                  this.longTaskCount++;
                }
              }
            } catch (error) {
              console.warn('PerformanceMonitor: Error processing long task entries:', error);
            }
          });
          
          // Start observing longtask entries
          observer.observe({ entryTypes: ['longtask'] });
          console.log('PerformanceMonitor: Long task observer enabled');
        }
      } catch (error) {
        console.warn('PerformanceMonitor: Long task observer setup failed:', error);
      }
    } else {
      console.warn('PerformanceMonitor: PerformanceObserver API not available');
    }
  }

  /**
   * Collect memory usage stats (if available)
   */
  private collectMemoryUsage(): void {
    try {
      if (performance && 'memory' in performance && (performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          this.metrics.memoryUsage = {
            jsHeapSizeLimit: typeof memoryInfo.jsHeapSizeLimit === 'number' ? memoryInfo.jsHeapSizeLimit : undefined,
            totalJSHeapSize: typeof memoryInfo.totalJSHeapSize === 'number' ? memoryInfo.totalJSHeapSize : undefined,
            usedJSHeapSize: typeof memoryInfo.usedJSHeapSize === 'number' ? memoryInfo.usedJSHeapSize : undefined
          };
          return;
        }
      }
      this.metrics.memoryUsage = null;
    } catch (error) {
      console.warn('PerformanceMonitor: Could not collect memory usage:', error);
      this.metrics.memoryUsage = null;
    }
  }

  /**
   * Collect GPU info (if available)
   */
  private collectGpuInfo(): void {
    // Try to get GPU info from WebGL context
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        // Cast to WebGLRenderingContext to access WebGL-specific methods
        const webgl = gl as WebGLRenderingContext;
        
        const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendorInfo = debugInfo.UNMASKED_VENDOR_WEBGL;
          const rendererInfo = debugInfo.UNMASKED_RENDERER_WEBGL;
          
          if (vendorInfo && rendererInfo) {
            const vendor = webgl.getParameter(vendorInfo);
            const renderer = webgl.getParameter(rendererInfo);
            this.metrics.gpuInfo = `${vendor} - ${renderer}`;
          } else {
            this.metrics.gpuInfo = 'GPU info parameters not available';
          }
        } else {
          this.metrics.gpuInfo = 'WEBGL_debug_renderer_info not available';
        }
      } else {
        this.metrics.gpuInfo = 'WebGL not available';
      }
    } catch (error) {
      console.warn('PerformanceMonitor: Could not collect GPU info:', error);
      this.metrics.gpuInfo = null;
    }
  }

  /**
   * Collect stats from the THREE.js renderer
   */
  private collectRendererStats(): void {
    if (!this.renderer || !this.renderer.info) return;
    
    try {
      const info = this.renderer.info;
      
      // Get render info
      if (info.render) {
        this.metrics.drawCallsPerFrame = info.render.calls || 0;
        this.metrics.trianglesPerFrame = info.render.triangles || 0;
      }
    } catch (error) {
      console.warn('PerformanceMonitor: Error collecting renderer stats:', error);
    }
  }

  /**
   * Report performance metrics
   */
  private reportPerformance(interval: number): void {
    // Calculate FPS
    this.metrics.fps = Math.round((this.frameCount * 1000) / interval);
    
    // Calculate average frame time
    let totalFrameTime = 0;
    for (const time of this.frameTimeHistory) {
      totalFrameTime += time;
    }
    
    // Handle cases where frameTimeHistory might be empty
    if (this.frameTimeHistory.length > 0) {
      this.metrics.averageFrameTime = totalFrameTime / this.frameTimeHistory.length;
      this.metrics.frameTime = this.frameTimeHistory[this.frameTimeHistory.length - 1];
    } else {
      // Default to 60fps frame time if no history
      this.metrics.averageFrameTime = 16.67;
      this.metrics.frameTime = 16.67;
    }
    
    // Calculate long frames per second
    this.metrics.longFrames = this.longFrameCount;
    
    // Calculate long tasks per second
    this.metrics.longTasksPerSecond = this.longTaskCount;
    
    // Collect current memory usage
    this.collectMemoryUsage();
    
    // Check for severe performance issues and emit appropriate events
    const performanceStatus = this.hasSeverePerformanceIssues();
    if (performanceStatus.severe) {
      // Emit severe performance warning
      console.warn(`PerformanceMonitor: ${performanceStatus.reason}`);
      eventBus.emit('severe-performance-warning', { 
        metrics: this.getMetrics(),
        reason: performanceStatus.reason
      });
    } else if (performanceStatus.reason) {
      // Emit moderate performance warning (not severe but has reason)
      console.log(`PerformanceMonitor: ${performanceStatus.reason}`);
      eventBus.emit('moderate-performance-warning', {
        metrics: this.getMetrics(),
        reason: performanceStatus.reason
      });
    }
    
    // Emit regular performance update event
    eventBus.emit('performance-update', { 
      metrics: this.getMetrics(),
      quality: this.quality
    });
    
    // Check if quality adjustment is needed
    if (this.autoAdjustQuality) {
      this.checkQualityAdjustment();
    }
  }

  // Track time since the last long frame for stricter upgrade conditions
  private lastLongFrameTime: number = 0;
  // Track consecutive good performance frames
  private consecutiveGoodFrames: number = 0;
  
  /**
   * Check if quality needs to be adjusted based on performance
   */
  private checkQualityAdjustment(): void {
    // Don't adjust quality too frequently
    const now = performance.now();
    if (now - this.lastQualityChangeTime < this.qualityChangeThrottleTime) {
      return;
    }
    
    // Check if we need to reduce quality
    if (
      this.metrics.fps < this.thresholds.criticalFps ||
      this.metrics.averageFrameTime > this.thresholds.maxFrameTime ||
      this.metrics.longFrames > this.thresholds.maxLongFramesPerSecond
    ) {
      // Reset consecutive good frames count when performance issues are detected
      this.consecutiveGoodFrames = 0;
      this.reduceQuality();
      return;
    }
    
    // Update long frame tracking
    if (this.metrics.longFrames > 0) {
      this.lastLongFrameTime = now;
      this.consecutiveGoodFrames = 0; // Reset consecutive good frames on any long frame
    } else {
      // If no long frames in this report, increment the consecutive good frames counter
      this.consecutiveGoodFrames++;
    }
    
    // More conservative approach to quality increases
    // Only increase quality if:
    // 1. Performance is consistently good for multiple reporting intervals
    // 2. No long frames in the last 10 seconds
    // 3. FPS and frame time are well above target thresholds
    const MIN_CONSECUTIVE_GOOD_FRAMES = 5; // Require 5 seconds of good performance
    const MIN_TIME_SINCE_LAST_LONG_FRAME = 10000; // 10 seconds
    const timeSinceLastLongFrame = now - this.lastLongFrameTime;
    
    if (
      this.consecutiveGoodFrames >= MIN_CONSECUTIVE_GOOD_FRAMES &&
      timeSinceLastLongFrame > MIN_TIME_SINCE_LAST_LONG_FRAME &&
      this.metrics.fps > this.thresholds.targetFps * 1.2 &&
      this.metrics.averageFrameTime < this.thresholds.maxFrameTime * 0.5 &&
      this.metrics.longFrames === 0
    ) {
      this.increaseQuality();
      // Reset consecutive frames after increasing quality
      this.consecutiveGoodFrames = 0;
    }
  }

  /**
   * Reduce quality level
   */
  private reduceQuality(): void {
    let newQuality: QualityLevel = this.quality;
    
    // Step down one level
    if (this.quality === 'ultra') {
      newQuality = 'high';
    } else if (this.quality === 'high') {
      newQuality = 'medium';
    } else if (this.quality === 'medium') {
      newQuality = 'low';
    }
    
    // Only emit event if quality actually changed
    if (newQuality !== this.quality) {
      this.quality = newQuality;
      this.updateThresholds();
      this.lastQualityChangeTime = performance.now();
      
      // Emit quality change event
      eventBus.emit('performance-quality-change', { 
        quality: this.quality,
        reason: 'performance_reduction',
        metrics: this.getMetrics() 
      });
      
      console.log(`PerformanceMonitor: Reduced quality to ${this.quality} due to performance issues`, this.metrics);
    }
  }

  /**
   * Increase quality level
   */
  private increaseQuality(): void {
    let newQuality: QualityLevel = this.quality;
    
    // Step up one level
    if (this.quality === 'low') {
      newQuality = 'medium';
    } else if (this.quality === 'medium') {
      newQuality = 'high';
    } else if (this.quality === 'high') {
      newQuality = 'ultra';
    }
    
    // Only emit event if quality actually changed
    if (newQuality !== this.quality) {
      this.quality = newQuality;
      this.updateThresholds();
      this.lastQualityChangeTime = performance.now();
      
      // Emit quality change event
      eventBus.emit('performance-quality-change', { 
        quality: this.quality,
        reason: 'performance_improvement',
        metrics: this.getMetrics() 
      });
      
      console.log(`PerformanceMonitor: Increased quality to ${this.quality} due to good performance`, this.metrics);
    }
  }

  /**
   * Set initial quality level based on device capabilities
   */
  private setInitialQualityFromDeviceCapabilities(deviceCapabilities: any): void {
    if (deviceCapabilities.highEnd) {
      this.quality = 'high';
    } else if (deviceCapabilities.midRange) {
      this.quality = 'medium';
    } else {
      this.quality = 'low';
    }
    
    console.log(`PerformanceMonitor: Initial quality set to ${this.quality} based on device capabilities`);
  }

  /**
   * Update performance thresholds based on quality level
   */
  private updateThresholds(): void {
    // Set target FPS and thresholds based on quality level
    switch (this.quality) {
      case 'ultra':
        this.thresholds.targetFps = 60;
        this.thresholds.acceptableFps = 55;
        this.thresholds.criticalFps = 45;
        this.thresholds.maxFrameTime = 20; // ~50fps
        this.thresholds.maxLongFramesPerSecond = 1;
        this.thresholds.maxLongTasksPerSecond = 1;
        break;
        
      case 'high':
        this.thresholds.targetFps = 60;
        this.thresholds.acceptableFps = 50;
        this.thresholds.criticalFps = 40;
        this.thresholds.maxFrameTime = 25; // ~40fps
        this.thresholds.maxLongFramesPerSecond = 2;
        this.thresholds.maxLongTasksPerSecond = 1;
        break;
        
      case 'medium':
        this.thresholds.targetFps = 60;
        this.thresholds.acceptableFps = 45;
        this.thresholds.criticalFps = 30;
        this.thresholds.maxFrameTime = 33.33; // ~30fps
        this.thresholds.maxLongFramesPerSecond = 3;
        this.thresholds.maxLongTasksPerSecond = 2;
        break;
        
      case 'low':
        this.thresholds.targetFps = 45;
        this.thresholds.acceptableFps = 30;
        this.thresholds.criticalFps = 24;
        this.thresholds.maxFrameTime = 41.67; // ~24fps
        this.thresholds.maxLongFramesPerSecond = 5;
        this.thresholds.maxLongTasksPerSecond = 3;
        break;
    }
  }

  /**
   * Handle renderer initialization event
   */
  private handleRendererInitialized(data: { success: boolean, renderer?: THREE.WebGLRenderer }): void {
    if (data.success && data.renderer) {
      this.setRenderer(data.renderer);
    }
  }
}

// Export singleton getter
export function getPerformanceMonitor(): PerformanceMonitor {
  return PerformanceMonitor.getInstance();
}

// Export helper function to report long tasks
export function reportLongTask(): void {
  PerformanceMonitor.getInstance().reportLongTask();
}