import * as THREE from 'three';
import { getPerformanceMonitor } from '../PerformanceMonitor';
import { getQualityAdjuster } from '../QualityAdjuster';
import eventBus from '../../core/EventSystem';

/**
 * Benchmark scenario stage types
 */
export type BenchmarkStage = 
  'empty' | 
  'simple' | 
  'medium' | 
  'complex' | 
  'extreme' | 
  'water' | 
  'particles' | 
  'shadows' | 
  'postprocessing';

/**
 * Benchmark stage configuration
 */
export interface StageConfig {
  name: string;
  duration: number; // milliseconds
  setup: (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => void;
  teardown: (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => void;
  description: string;
}

/**
 * Benchmark scenario result
 */
export interface BenchmarkScenarioResult {
  stageResults: {
    stage: string;
    avgFps: number;
    minFps: number;
    maxFrameTime: number;
    longFrames: number;
  }[];
  summary: {
    bottlenecks: string[];
    averageFps: number;
    worstStage: string;
    recommendedQuality: string;
    passed: boolean;
  };
}

/**
 * BenchmarkScenario class for advanced game performance testing
 * Creates realistic game scenarios to test performance in real-world conditions
 */
export class BenchmarkScenario {
  private static instance: BenchmarkScenario;
  
  // Benchmark status
  private running: boolean = false;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private stages: Map<BenchmarkStage, StageConfig> = new Map();
  private currentStage: BenchmarkStage | null = null;
  private progressCallback: ((progress: number, stage: string) => void) | null = null;
  private resultCallback: ((result: BenchmarkScenarioResult) => void) | null = null;
  
  // Benchmark data
  private startTime: number = 0;
  private stageStartTime: number = 0;
  private stageResults: Map<string, {
    frames: number;
    frameTimes: number[];
    longFrames: number;
    maxFrameTime: number;
  }> = new Map();
  private rafId: number | null = null;
  private animationObjects: THREE.Object3D[] = [];
  
  private constructor() {
    this.initializeStages();
  }
  
  /**
   * Get the BenchmarkScenario singleton instance
   */
  public static getInstance(): BenchmarkScenario {
    if (!BenchmarkScenario.instance) {
      BenchmarkScenario.instance = new BenchmarkScenario();
    }
    return BenchmarkScenario.instance;
  }
  
  /**
   * Initialize benchmark stages
   */
  private initializeStages(): void {
    // Empty stage (baseline)
    this.stages.set('empty', {
      name: 'Baseline',
      duration: 2000,
      description: 'Testing baseline rendering performance',
      setup: (scene, renderer) => {
        // Just a simple scene with a camera
        const light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);
        this.animationObjects.push(light);
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
      }
    });
    
    // Simple stage (few objects)
    this.stages.set('simple', {
      name: 'Simple Scene',
      duration: 3000,
      description: 'Testing performance with basic objects',
      setup: (scene, renderer) => {
        // Add simple objects
        for (let i = 0; i < 10; i++) {
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
          scene.add(cube);
          this.animationObjects.push(cube);
        }
        
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);
        this.animationObjects.push(light);
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
      }
    });
    
    // Medium complexity
    this.stages.set('medium', {
      name: 'Medium Complexity',
      duration: 4000,
      description: 'Testing performance with moderate game scene',
      setup: (scene, renderer) => {
        // Add medium complexity objects
        for (let i = 0; i < 20; i++) {
          // Mix of different geometries
          let geometry;
          const type = i % 3;
          if (type === 0) {
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
          } else if (type === 1) {
            geometry = new THREE.BoxGeometry(1, 1, 1);
          } else {
            geometry = new THREE.ConeGeometry(0.5, 1, 16);
          }
          
          const material = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff,
            roughness: 0.7,
            metalness: 0.3
          });
          
          const obj = new THREE.Mesh(geometry, material);
          obj.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
          scene.add(obj);
          this.animationObjects.push(obj);
        }
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        this.animationObjects.push(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        this.animationObjects.push(directionalLight);
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
      }
    });
    
    // Complex scene
    this.stages.set('complex', {
      name: 'Complex Scene',
      duration: 5000,
      description: 'Testing performance with complex game scene',
      setup: (scene, renderer) => {
        // Add complex objects
        for (let i = 0; i < 50; i++) {
          // Mix of different complex geometries
          let geometry;
          const type = i % 4;
          if (type === 0) {
            geometry = new THREE.TorusKnotGeometry(0.5, 0.2, 64, 32);
          } else if (type === 1) {
            geometry = new THREE.OctahedronGeometry(0.7, 2);
          } else if (type === 2) {
            geometry = new THREE.IcosahedronGeometry(0.7, 1);
          } else {
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
          }
          
          const material = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff,
            roughness: Math.random(),
            metalness: Math.random()
          });
          
          const obj = new THREE.Mesh(geometry, material);
          obj.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
          scene.add(obj);
          this.animationObjects.push(obj);
        }
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        this.animationObjects.push(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        this.animationObjects.push(directionalLight);
        
        // Add a few point lights
        for (let i = 0; i < 3; i++) {
          const pointLight = new THREE.PointLight(0xffffff * Math.random(), 1, 10);
          pointLight.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
          scene.add(pointLight);
          this.animationObjects.push(pointLight);
        }
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
      }
    });
    
    // Extreme test
    this.stages.set('extreme', {
      name: 'Extreme Load Test',
      duration: 5000,
      description: 'Testing performance under extreme load',
      setup: (scene, renderer) => {
        // Create many objects to really stress the GPU
        for (let i = 0; i < 100; i++) {
          const geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 32);
          const material = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff,
            roughness: 0.5,
            metalness: 0.5
          });
          
          const obj = new THREE.Mesh(geometry, material);
          obj.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30 - 10);
          obj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          obj.scale.multiplyScalar(0.5 + Math.random());
          scene.add(obj);
          this.animationObjects.push(obj);
        }
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        this.animationObjects.push(ambientLight);
        
        // Add several point lights
        for (let i = 0; i < 8; i++) {
          const pointLight = new THREE.PointLight(0xffffff * Math.random(), 1, 10);
          pointLight.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
          scene.add(pointLight);
          this.animationObjects.push(pointLight);
        }
        
        // Enable shadows for this test
        renderer.shadowMap.enabled = true;
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
        
        // Disable shadows
        renderer.shadowMap.enabled = false;
      }
    });
    
    // Particles test
    this.stages.set('particles', {
      name: 'Particle Effects',
      duration: 4000,
      description: 'Testing performance with particle systems',
      setup: (scene, renderer) => {
        // Create particle systems
        for (let i = 0; i < 5; i++) {
          const particleCount = 2000;
          const particles = new THREE.BufferGeometry();
          const positions = new Float32Array(particleCount * 3);
          const colors = new Float32Array(particleCount * 3);
          
          for (let j = 0; j < particleCount; j++) {
            // Random positions in a sphere
            const radius = 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[j * 3 + 2] = radius * Math.cos(phi);
            
            // Random colors
            colors[j * 3] = Math.random();
            colors[j * 3 + 1] = Math.random();
            colors[j * 3 + 2] = Math.random();
          }
          
          particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          
          const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
          });
          
          const particleSystem = new THREE.Points(particles, particleMaterial);
          particleSystem.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
          scene.add(particleSystem);
          this.animationObjects.push(particleSystem);
        }
        
        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        this.animationObjects.push(ambientLight);
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
      }
    });
    
    // Shadows test
    this.stages.set('shadows', {
      name: 'Shadow Testing',
      duration: 4000,
      description: 'Testing performance with shadow mapping',
      setup: (scene, renderer) => {
        // Enable shadows
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create a floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.8, 
          metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        scene.add(floor);
        this.animationObjects.push(floor);
        
        // Add shadow-casting objects
        for (let i = 0; i < 20; i++) {
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff
          });
          
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set((Math.random() - 0.5) * 15, (Math.random() * 5) - 2, (Math.random() - 0.5) * 15);
          cube.castShadow = true;
          cube.receiveShadow = true;
          scene.add(cube);
          this.animationObjects.push(cube);
        }
        
        // Add shadow-casting lights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        
        // Configure shadow properties for the light
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 30;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        
        scene.add(directionalLight);
        this.animationObjects.push(directionalLight);
        
        // Add ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        this.animationObjects.push(ambientLight);
      },
      teardown: (scene, renderer) => {
        // Remove all objects
        this.animationObjects.forEach(obj => scene.remove(obj));
        this.animationObjects = [];
        
        // Disable shadows
        renderer.shadowMap.enabled = false;
      }
    });
  }
  
  /**
   * Run a benchmark scenario
   * @param stages Array of stages to run in sequence
   * @param progressCallback Optional callback for progress updates
   * @param resultCallback Optional callback for benchmark results
   */
  public runScenario(
    stages: BenchmarkStage[],
    progressCallback?: (progress: number, stage: string) => void,
    resultCallback?: (result: BenchmarkScenarioResult) => void
  ): void {
    // Check if already running
    if (this.running) {
      console.warn('BenchmarkScenario: Benchmark is already running');
      return;
    }
    
    // Validate stages
    const validStages = stages.filter(stage => this.stages.has(stage));
    if (validStages.length === 0) {
      console.error('BenchmarkScenario: No valid stages provided');
      return;
    }
    
    // Initialize
    this.running = true;
    this.progressCallback = progressCallback || null;
    this.resultCallback = resultCallback || null;
    this.stageResults = new Map();
    this.startTime = performance.now();
    
    // Setup benchmark environment
    this.setupEnvironment();
    
    // Run first stage
    this.runStage(validStages, 0);
  }
  
  /**
   * Run a specific benchmark stage
   * @param stages Array of stages to run
   * @param index Current stage index
   */
  private runStage(stages: BenchmarkStage[], index: number): void {
    if (!this.running || !this.scene || !this.renderer) {
      this.cleanup();
      return;
    }
    
    // Check if we've completed all stages
    if (index >= stages.length) {
      this.completeBenchmark();
      return;
    }
    
    // Get current stage
    const stageName = stages[index];
    const stageConfig = this.stages.get(stageName);
    
    if (!stageConfig) {
      console.error(`BenchmarkScenario: Invalid stage "${stageName}"`);
      this.runStage(stages, index + 1);
      return;
    }
    
    // Update current stage
    this.currentStage = stageName;
    this.stageStartTime = performance.now();
    
    // Initialize stage results
    this.stageResults.set(stageName, {
      frames: 0,
      frameTimes: [],
      longFrames: 0,
      maxFrameTime: 0
    });
    
    // Set up stage
    stageConfig.setup(this.scene, this.renderer);
    
    // Update progress
    this.updateProgress(stages, index);
    
    // Start measuring
    console.log(`BenchmarkScenario: Starting stage "${stageConfig.name}" (${stageName})`);
    this.startMeasuring();
    
    // Schedule next stage after duration
    setTimeout(() => {
      this.stopMeasuring();
      stageConfig.teardown(this.scene!, this.renderer!);
      this.runStage(stages, index + 1);
    }, stageConfig.duration);
  }
  
  /**
   * Update progress callback
   */
  private updateProgress(stages: BenchmarkStage[], currentIndex: number): void {
    if (!this.progressCallback || !this.currentStage) return;
    
    // Calculate overall progress
    const progress = Math.round((currentIndex / stages.length) * 100);
    
    // Get stage config
    const stageConfig = this.stages.get(this.currentStage);
    if (!stageConfig) return;
    
    // Call progress callback
    this.progressCallback(progress, stageConfig.name);
  }
  
  /**
   * Setup benchmark environment
   */
  private setupEnvironment(): void {
    // Create container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '1px'; // Make it effectively invisible
    container.style.height = '1px';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.opacity = '0';
    document.body.appendChild(container);
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 15;
    
    // Create renderer with default settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: false
    });
    this.renderer.setSize(512, 512); // Small size for testing
    container.appendChild(this.renderer.domElement);
  }
  
  /**
   * Start measuring performance
   */
  private startMeasuring(): void {
    if (!this.scene || !this.camera || !this.renderer || !this.currentStage) return;
    
    const stageData = this.stageResults.get(this.currentStage);
    if (!stageData) return;
    
    let lastFrameTime = performance.now();
    let rotationSpeed = 0.005;
    
    const animate = () => {
      if (!this.running || !this.currentStage) return;
      
      // Measure frame time
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;
      
      // Update stage data
      stageData.frames++;
      stageData.frameTimes.push(frameTime);
      
      // Track max frame time and long frames
      if (frameTime > stageData.maxFrameTime) {
        stageData.maxFrameTime = frameTime;
      }
      
      if (frameTime > 33.33) { // Frame longer than 30fps threshold
        stageData.longFrames++;
      }
      
      // Animate objects
      this.animationObjects.forEach(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.rotation.x += rotationSpeed;
          obj.rotation.y += rotationSpeed;
        } else if (obj instanceof THREE.Points) {
          obj.rotation.y += rotationSpeed * 0.5;
        }
      });
      
      // Slowly rotate camera
      if (this.camera) {
        this.camera.position.x = Math.sin(now * 0.0005) * 15;
        this.camera.position.z = Math.cos(now * 0.0005) * 15;
        this.camera.lookAt(0, 0, 0);
      }
      
      // Render
      this.renderer!.render(this.scene!, this.camera!);
      
      // Continue animation loop
      this.rafId = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    this.rafId = requestAnimationFrame(animate);
  }
  
  /**
   * Stop measuring performance
   */
  private stopMeasuring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Complete the benchmark and report results
   */
  private completeBenchmark(): void {
    // Generate results
    const results = this.generateResults();
    
    // Call result callback if provided
    if (this.resultCallback) {
      this.resultCallback(results);
    }
    
    // Log results
    console.log('BenchmarkScenario: Completed benchmark', results);
    
    // Emit benchmark event
    eventBus.emit('scenario-benchmark-completed', results);
    
    // Clean up
    this.cleanup();
  }
  
  /**
   * Generate benchmark results
   */
  private generateResults(): BenchmarkScenarioResult {
    // Process stage results
    const stageResults = Array.from(this.stageResults.entries()).map(([stage, data]) => {
      // Calculate average FPS
      let avgFps = 60; // Default
      let minFps = 60;
      
      if (data.frameTimes.length > 0) {
        const totalTime = data.frameTimes.reduce((sum, time) => sum + time, 0);
        avgFps = 1000 / (totalTime / data.frameTimes.length);
        
        // Calculate minimum FPS from maximum frame time
        minFps = 1000 / Math.max(...data.frameTimes);
      }
      
      return {
        stage,
        avgFps,
        minFps,
        maxFrameTime: data.maxFrameTime,
        longFrames: data.longFrames
      };
    });
    
    // Find the worst performing stage
    let worstStage = '';
    let worstFps = 9999;
    let totalFps = 0;
    let bottlenecks: string[] = [];
    
    stageResults.forEach(result => {
      totalFps += result.avgFps;
      
      // Check if this is the worst stage
      if (result.avgFps < worstFps) {
        worstFps = result.avgFps;
        worstStage = result.stage;
      }
      
      // Check for potential bottlenecks
      if (result.longFrames > 10) {
        bottlenecks.push(`High long frame count in ${result.stage}`);
      }
      
      if (result.avgFps < 30) {
        bottlenecks.push(`Low FPS in ${result.stage}`);
      }
    });
    
    // Calculate average FPS across all stages
    const averageFps = stageResults.length > 0 ? totalFps / stageResults.length : 60;
    
    // Determine recommended quality level
    let recommendedQuality: string;
    
    if (
      averageFps >= 55 && 
      stageResults.every(result => result.minFps >= 30) &&
      bottlenecks.length === 0
    ) {
      recommendedQuality = 'ultra';
    } else if (
      averageFps >= 45 && 
      stageResults.every(result => result.minFps >= 25)
    ) {
      recommendedQuality = 'high';
    } else if (
      averageFps >= 35 && 
      stageResults.every(result => result.minFps >= 20)
    ) {
      recommendedQuality = 'medium';
    } else {
      recommendedQuality = 'low';
    }
    
    // Check if benchmark passes overall requirements
    const passed = averageFps >= 30 && stageResults.every(result => result.minFps >= 20);
    
    // Create result object
    return {
      stageResults,
      summary: {
        bottlenecks,
        averageFps,
        worstStage,
        recommendedQuality,
        passed
      }
    };
  }
  
  /**
   * Clean up benchmark resources
   */
  private cleanup(): void {
    // Stop measuring
    this.stopMeasuring();
    
    // Clean up Three.js resources
    if (this.renderer) {
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.remove();
      }
      this.renderer.dispose();
      this.renderer = null;
    }
    
    // Clean up scene objects
    if (this.scene) {
      this.animationObjects.forEach(obj => {
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
      
      this.scene = null;
      this.animationObjects = [];
    }
    
    this.camera = null;
    this.running = false;
    this.currentStage = null;
  }
  
  /**
   * Cancel a running benchmark
   */
  public cancelBenchmark(): void {
    if (!this.running) return;
    
    this.running = false;
    this.cleanup();
    console.log('BenchmarkScenario: Cancelled benchmark');
  }
}

/**
 * Get the benchmark scenario singleton
 */
export function getBenchmarkScenario(): BenchmarkScenario {
  return BenchmarkScenario.getInstance();
}

/**
 * Run a full benchmark scenario and return a promise with the result
 */
export function runBenchmarkScenario(
  progressCallback?: (progress: number, stage: string) => void
): Promise<BenchmarkScenarioResult> {
  return new Promise((resolve) => {
    const benchmarkScenario = getBenchmarkScenario();
    benchmarkScenario.runScenario(
      ['empty', 'simple', 'medium', 'complex', 'extreme', 'particles', 'shadows'],
      progressCallback,
      resolve
    );
  });
}

/**
 * Run a quick benchmark scenario with fewer stages
 */
export function runQuickBenchmarkScenario(
  progressCallback?: (progress: number, stage: string) => void
): Promise<BenchmarkScenarioResult> {
  return new Promise((resolve) => {
    const benchmarkScenario = getBenchmarkScenario();
    benchmarkScenario.runScenario(
      ['empty', 'medium', 'complex'],
      progressCallback,
      resolve
    );
  });
}