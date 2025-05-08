import * as THREE from 'three';
import { getDeviceCapabilities, DeviceCapabilities } from '../DeviceUtils';
import { getPerformanceMonitor, PerformanceMetrics } from '../PerformanceMonitor';
import { getQualityAdjuster, QualityPreset } from '../QualityAdjuster';
import eventBus from '../../core/EventSystem';

/**
 * Benchmark result containing device information and performance metrics
 */
export interface BenchmarkResult {
  // Device information
  device: {
    capabilities: DeviceCapabilities;
    userAgent: string;
    screenSize: { width: number; height: number };
    gpuInfo: string | null;
    memoryInfo: { jsHeapSizeLimit?: number; totalJSHeapSize?: number; usedJSHeapSize?: number } | null;
  };
  
  // Benchmark metrics
  metrics: {
    initialFps: number;
    stableFps: number;
    stressTestFps: number;
    recoveryFps: number;
    averageFrameTime: number;
    longFramesCount: number;
    maxFrameTime: number;
    qualityLevel: string;
    finalRecommendedQuality: string;
  };
  
  // Test information
  testInfo: {
    duration: number;
    passed: boolean;
    bottlenecks: string[];
    timestamp: number;
  };
}

/**
 * DeviceBenchmark class for testing and analyzing device performance
 * Runs standardized tests to determine optimal quality settings
 */
export class DeviceBenchmark {
  private static instance: DeviceBenchmark;
  
  // Benchmark status
  private running: boolean = false;
  private progressCallback: ((progress: number, stage: string) => void) | null = null;
  private resultCallback: ((result: BenchmarkResult) => void) | null = null;
  
  // Test scene
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private testObjects: THREE.Object3D[] = [];
  
  // Benchmark data
  private startTime: number = 0;
  private benchmarkDuration: number = 15000; // 15 seconds by default
  private currentStage: string = '';
  private stageStartTime: number = 0;
  private frameTimeData: number[] = [];
  private stressTestData: number[] = [];
  private recoveryData: number[] = [];
  private bottlenecks: string[] = [];
  private rafId: number | null = null;
  
  // Performance metrics
  private initialFps: number = 0;
  private stableFps: number = 0;
  private stressTestFps: number = 0;
  private recoveryFps: number = 0;
  private maxFrameTime: number = 0;
  private longFramesCount: number = 0;
  private finalRecommendedQuality: string = '';
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the DeviceBenchmark singleton instance
   */
  public static getInstance(): DeviceBenchmark {
    if (!DeviceBenchmark.instance) {
      DeviceBenchmark.instance = new DeviceBenchmark();
    }
    return DeviceBenchmark.instance;
  }
  
  /**
   * Start the device benchmark tests
   * @param progressCallback Optional callback to report progress (0-100)
   * @param resultCallback Optional callback to receive the result
   * @param duration Optional test duration in milliseconds
   */
  public runBenchmark(
    progressCallback?: (progress: number, stage: string) => void,
    resultCallback?: (result: BenchmarkResult) => void,
    duration?: number
  ): void {
    // Check if already running
    if (this.running) {
      console.warn('DeviceBenchmark: Benchmark is already running');
      return;
    }
    
    this.running = true;
    this.progressCallback = progressCallback || null;
    this.resultCallback = resultCallback || null;
    
    if (duration && duration > 5000) {
      this.benchmarkDuration = duration;
    }
    
    // Initialize benchmark
    this.initialize();
    
    // Start benchmark
    this.startTime = performance.now();
    this.runBenchmarkStage('initialization');
    
    console.log('DeviceBenchmark: Started benchmark tests');
  }
  
  /**
   * Cancel the running benchmark
   */
  public cancelBenchmark(): void {
    if (!this.running) return;
    
    // Cleanup resources
    this.cleanup();
    this.running = false;
    console.log('DeviceBenchmark: Benchmark cancelled');
  }
  
  /**
   * Get a summary of the last benchmark result
   */
  public getSummary(): string {
    if (!this.finalRecommendedQuality) {
      return 'No benchmark results available';
    }
    
    const summary = `
      Device Performance Summary:
      - Stable FPS: ${this.stableFps.toFixed(1)}
      - Stress Test FPS: ${this.stressTestFps.toFixed(1)}
      - Recovery FPS: ${this.recoveryFps.toFixed(1)}
      - Long Frames: ${this.longFramesCount}
      - Recommended Quality: ${this.finalRecommendedQuality}
      ${this.bottlenecks.length > 0 ? `- Bottlenecks: ${this.bottlenecks.join(', ')}` : ''}
    `.trim();
    
    return summary;
  }
  
  /**
   * Initialize benchmark environment
   */
  private initialize(): void {
    // Reset data
    this.frameTimeData = [];
    this.stressTestData = [];
    this.recoveryData = [];
    this.bottlenecks = [];
    this.initialFps = 0;
    this.stableFps = 0;
    this.stressTestFps = 0;
    this.recoveryFps = 0;
    this.maxFrameTime = 0;
    this.longFramesCount = 0;
    this.finalRecommendedQuality = '';
    
    // Initialize a test renderer if needed
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '1px'; // Make it effectively invisible
    container.style.height = '1px';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    document.body.appendChild(container);
    
    // Create a minimal Three.js scene for testing
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 5;
    
    // Create renderer with default settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(256, 256); // Small size for testing
    container.appendChild(this.renderer.domElement);
  }
  
  /**
   * Run a specific benchmark stage
   */
  private runBenchmarkStage(stage: string): void {
    if (!this.running) return;
    
    this.currentStage = stage;
    this.stageStartTime = performance.now();
    
    // Update progress
    this.updateProgress();
    
    switch (stage) {
      case 'initialization':
        // Create test scene during initialization
        this.setupTestScene();
        
        // Wait a short time for initialization to complete
        setTimeout(() => {
          this.runBenchmarkStage('baseline');
        }, 500);
        break;
        
      case 'baseline':
        // Measure baseline performance (simple scene)
        this.startMeasuring();
        
        // Move to next stage after 3 seconds
        setTimeout(() => {
          this.captureBaselineMetrics();
          this.runBenchmarkStage('stress');
        }, 3000);
        break;
        
      case 'stress':
        // Add complex stress test objects
        this.setupStressTest();
        
        // Measure for 5 seconds
        setTimeout(() => {
          this.captureStressTestMetrics();
          this.runBenchmarkStage('recovery');
        }, 5000);
        break;
        
      case 'recovery':
        // Remove stress test objects
        this.cleanupStressTest();
        
        // Measure recovery for 3 seconds
        setTimeout(() => {
          this.captureRecoveryMetrics();
          this.runBenchmarkStage('analysis');
        }, 3000);
        break;
        
      case 'analysis':
        // Stop measuring
        this.stopMeasuring();
        
        // Analyze results and recommend optimal settings
        this.analyzeResults();
        
        // Complete benchmark
        this.completeBenchmark();
        break;
        
      default:
        console.warn(`DeviceBenchmark: Unknown stage "${stage}"`);
        break;
    }
  }
  
  /**
   * Set up test scene with appropriate geometry and materials
   */
  private setupTestScene(): void {
    if (!this.scene) return;
    
    // Clear existing objects
    this.testObjects.forEach(obj => this.scene?.remove(obj));
    this.testObjects = [];
    
    // Add basic test objects (cube and sphere)
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    cube.position.x = -1.5;
    this.scene.add(cube);
    this.testObjects.push(cube);
    
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5, metalness: 0.5 })
    );
    sphere.position.x = 1.5;
    this.scene.add(sphere);
    this.testObjects.push(sphere);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    this.testObjects.push(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    this.testObjects.push(directionalLight);
  }
  
  /**
   * Set up complex geometries and effects for stress testing
   */
  private setupStressTest(): void {
    if (!this.scene || !this.renderer) return;
    
    // Add complex geometries to stress the GPU
    for (let i = 0; i < 25; i++) {
      const geom = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 32);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.5,
        metalness: 0.7,
      });
      
      const knot = new THREE.Mesh(geom, material);
      knot.position.x = (Math.random() - 0.5) * 8;
      knot.position.y = (Math.random() - 0.5) * 8;
      knot.position.z = (Math.random() - 0.5) * 5 - 2;
      
      this.scene.add(knot);
      this.testObjects.push(knot);
    }
    
    // Add some point lights (expensive)
    for (let i = 0; i < 5; i++) {
      const pointLight = new THREE.PointLight(0xffffff, 1, 10);
      pointLight.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      );
      this.scene.add(pointLight);
      this.testObjects.push(pointLight);
    }
    
    // Enable shadows for stress test
    this.renderer.shadowMap.enabled = true;
  }
  
  /**
   * Clean up stress test objects
   */
  private cleanupStressTest(): void {
    if (!this.scene || !this.renderer) return;
    
    // Remove stress test objects but keep baseline objects
    const baselineCount = 4; // cube, sphere, ambient light, directional light
    
    while (this.testObjects.length > baselineCount) {
      const obj = this.testObjects.pop();
      if (obj) {
        this.scene.remove(obj);
      }
    }
    
    // Disable shadows for recovery test
    this.renderer.shadowMap.enabled = false;
  }
  
  /**
   * Start measuring frame times
   */
  private startMeasuring(): void {
    if (!this.scene || !this.camera || !this.renderer) return;
    
    let lastFrameTime = performance.now();
    
    const animate = () => {
      if (!this.running) return;
      
      // Measure frame time
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;
      
      // Skip first frame as it might be abnormally long
      if (this.frameTimeData.length > 0) {
        // Track max frame time
        if (frameTime > this.maxFrameTime) {
          this.maxFrameTime = frameTime;
        }
        
        // Count long frames (> 33.33ms, i.e., below 30fps)
        if (frameTime > 33.33) {
          this.longFramesCount++;
        }
        
        // Store frame time based on current stage
        if (this.currentStage === 'baseline') {
          this.frameTimeData.push(frameTime);
        } else if (this.currentStage === 'stress') {
          this.stressTestData.push(frameTime);
        } else if (this.currentStage === 'recovery') {
          this.recoveryData.push(frameTime);
        }
      }
      
      // Animate test objects
      this.testObjects.forEach((obj, i) => {
        if (obj instanceof THREE.Mesh) {
          obj.rotation.x += 0.01;
          obj.rotation.y += 0.01;
        }
      });
      
      // Render
      this.renderer?.render(this.scene!, this.camera!);
      
      // Continue loop
      this.rafId = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    this.rafId = requestAnimationFrame(animate);
  }
  
  /**
   * Stop measuring frame times
   */
  private stopMeasuring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Capture baseline performance metrics
   */
  private captureBaselineMetrics(): void {
    if (this.frameTimeData.length === 0) return;
    
    // Calculate average FPS from frame times
    const totalTime = this.frameTimeData.reduce((sum, time) => sum + time, 0);
    const averageFrameTime = totalTime / this.frameTimeData.length;
    this.initialFps = 1000 / averageFrameTime;
    this.stableFps = this.initialFps;
    
    console.log(`DeviceBenchmark: Baseline - ${this.initialFps.toFixed(1)} FPS (${averageFrameTime.toFixed(2)}ms)`);
  }
  
  /**
   * Capture stress test performance metrics
   */
  private captureStressTestMetrics(): void {
    if (this.stressTestData.length === 0) return;
    
    // Calculate average FPS from frame times
    const totalTime = this.stressTestData.reduce((sum, time) => sum + time, 0);
    const averageFrameTime = totalTime / this.stressTestData.length;
    this.stressTestFps = 1000 / averageFrameTime;
    
    console.log(`DeviceBenchmark: Stress Test - ${this.stressTestFps.toFixed(1)} FPS (${averageFrameTime.toFixed(2)}ms)`);
    
    // Check for significant performance drop during stress test
    if (this.stressTestFps < this.initialFps * 0.6) {
      this.bottlenecks.push('GPU/Rendering limited');
    }
  }
  
  /**
   * Capture recovery performance metrics
   */
  private captureRecoveryMetrics(): void {
    if (this.recoveryData.length === 0) return;
    
    // Calculate average FPS from frame times
    const totalTime = this.recoveryData.reduce((sum, time) => sum + time, 0);
    const averageFrameTime = totalTime / this.recoveryData.length;
    this.recoveryFps = 1000 / averageFrameTime;
    
    console.log(`DeviceBenchmark: Recovery - ${this.recoveryFps.toFixed(1)} FPS (${averageFrameTime.toFixed(2)}ms)`);
    
    // Check if recovery is significantly worse than initial
    if (this.recoveryFps < this.initialFps * 0.9) {
      this.bottlenecks.push('Possible memory pressure');
    }
  }
  
  /**
   * Analyze benchmark results and determine optimal quality settings
   */
  private analyzeResults(): void {
    // Calculate average frame time across all tests
    const allFrameTimes = [...this.frameTimeData, ...this.stressTestData, ...this.recoveryData];
    let averageFrameTime = 16.67; // Default to 60fps
    
    if (allFrameTimes.length > 0) {
      const totalTime = allFrameTimes.reduce((sum, time) => sum + time, 0);
      averageFrameTime = totalTime / allFrameTimes.length;
    }
    
    // Determine optimal quality preset based on performance metrics
    let recommendedQuality: string;
    
    if (
      this.stableFps >= 55 && 
      this.stressTestFps >= 40 && 
      this.longFramesCount <= 5 &&
      this.maxFrameTime < 50
    ) {
      recommendedQuality = 'ultra';
    } else if (
      this.stableFps >= 50 && 
      this.stressTestFps >= 30 && 
      this.longFramesCount <= 10 &&
      this.maxFrameTime < 60
    ) {
      recommendedQuality = 'high';
    } else if (
      this.stableFps >= 40 && 
      this.stressTestFps >= 25 && 
      this.longFramesCount <= 20 &&
      this.maxFrameTime < 80
    ) {
      recommendedQuality = 'medium';
    } else {
      recommendedQuality = 'low';
      
      // Identify potential CPU bottleneck
      if (this.longFramesCount > 30) {
        this.bottlenecks.push('CPU limited');
      }
    }
    
    this.finalRecommendedQuality = recommendedQuality;
    
    console.log(`DeviceBenchmark: Analysis complete - Recommended quality: ${recommendedQuality}`);
    
    // Apply recommended quality if possible
    try {
      getQualityAdjuster().setQuality(recommendedQuality as any);
    } catch (error) {
      console.warn('DeviceBenchmark: Could not apply recommended quality:', error);
    }
  }
  
  /**
   * Complete the benchmark and notify with results
   */
  private completeBenchmark(): void {
    // Create benchmark result
    const deviceCapabilities = getDeviceCapabilities();
    const performanceMetrics = getPerformanceMonitor().getMetrics();
    
    const result: BenchmarkResult = {
      device: {
        capabilities: deviceCapabilities,
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        gpuInfo: performanceMetrics.gpuInfo,
        memoryInfo: performanceMetrics.memoryUsage
      },
      metrics: {
        initialFps: this.initialFps,
        stableFps: this.stableFps,
        stressTestFps: this.stressTestFps,
        recoveryFps: this.recoveryFps,
        averageFrameTime: this.frameTimeData.reduce((sum, time) => sum + time, 0) / this.frameTimeData.length,
        longFramesCount: this.longFramesCount,
        maxFrameTime: this.maxFrameTime,
        qualityLevel: getQualityAdjuster().getQuality(),
        finalRecommendedQuality: this.finalRecommendedQuality
      },
      testInfo: {
        duration: performance.now() - this.startTime,
        passed: this.stableFps >= 30, // Test passes if stable FPS is at least 30
        bottlenecks: this.bottlenecks,
        timestamp: Date.now()
      }
    };
    
    // Emit benchmark completed event
    eventBus.emit('benchmark-completed', result);
    
    // Call result callback if provided
    if (this.resultCallback) {
      this.resultCallback(result);
    }
    
    // Update progress to 100%
    if (this.progressCallback) {
      this.progressCallback(100, 'complete');
    }
    
    // Cleanup and finish
    this.cleanup();
    this.running = false;
    console.log('DeviceBenchmark: Benchmark completed');
  }
  
  /**
   * Update progress based on current stage
   */
  private updateProgress(): void {
    if (!this.progressCallback) return;
    
    const stageDurations = {
      initialization: 0.1, // 10%
      baseline: 0.2,       // 20%
      stress: 0.4,         // 40% 
      recovery: 0.2,       // 20%
      analysis: 0.1        // 10%
    };
    
    const stages = ['initialization', 'baseline', 'stress', 'recovery', 'analysis'];
    const currentStageIndex = stages.indexOf(this.currentStage);
    
    if (currentStageIndex === -1) return;
    
    // Calculate base progress from completed stages
    let progress = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      progress += stageDurations[stages[i] as keyof typeof stageDurations] * 100;
    }
    
    // Add progress from current stage
    const now = performance.now();
    const elapsed = now - this.stageStartTime;
    
    // Estimate current stage duration
    let stageDuration = 500; // Default 500ms
    if (this.currentStage === 'baseline') stageDuration = 3000;
    if (this.currentStage === 'stress') stageDuration = 5000;
    if (this.currentStage === 'recovery') stageDuration = 3000;
    if (this.currentStage === 'analysis') stageDuration = 1000;
    
    // Calculate current stage progress (0-1)
    const stageProgress = Math.min(1, elapsed / stageDuration);
    
    // Add current stage contribution
    progress += stageProgress * stageDurations[this.currentStage as keyof typeof stageDurations] * 100;
    
    // Call progress callback
    this.progressCallback(Math.min(99, Math.floor(progress)), this.currentStage);
  }
  
  /**
   * Clean up benchmark resources
   */
  private cleanup(): void {
    // Cancel animation frame if running
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Clean up Three.js resources
    if (this.renderer) {
      // Remove renderer from DOM
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.remove();
      }
      
      // Dispose renderer
      this.renderer.dispose();
      this.renderer = null;
    }
    
    // Dispose geometries and materials
    this.testObjects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(material => material.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    
    // Clear arrays
    this.testObjects = [];
    this.scene = null;
    this.camera = null;
  }
}

/**
 * Get the device benchmark singleton
 */
export function getDeviceBenchmark(): DeviceBenchmark {
  return DeviceBenchmark.getInstance();
}

/**
 * Run a device benchmark and return a promise with the result
 */
export function runDeviceBenchmark(
  progressCallback?: (progress: number, stage: string) => void,
  duration?: number
): Promise<BenchmarkResult> {
  return new Promise((resolve) => {
    const benchmark = getDeviceBenchmark();
    benchmark.runBenchmark(progressCallback, resolve, duration);
  });
}