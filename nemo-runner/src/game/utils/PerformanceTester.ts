import { getPerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor';
import eventBus from '../core/EventSystem';

/**
 * Performance test scenario
 */
export interface PerformanceTestScenario {
  name: string;
  setupFn: () => void;
  cleanupFn: () => void;
  durationMs: number;
}

/**
 * Performance test result
 */
export interface PerformanceTestResult {
  scenarioName: string;
  metrics: PerformanceMetrics;
  success: boolean;
  targetFps: number;
  actualFps: number;
  longFrames: number;
  longTasks: number;
  memoryIncreaseKb: number;
}

/**
 * Utility class for performance testing different game scenarios
 * Helps developers identify performance bottlenecks and validate optimizations
 */
export class PerformanceTester {
  // Static instance
  private static instance: PerformanceTester;
  
  // Testing state
  private isTestRunning: boolean = false;
  private currentTest: PerformanceTestScenario | null = null;
  private testStartTime: number = 0;
  private testEndTime: number = 0;
  private testResults: PerformanceTestResult[] = [];
  private initialMemory: number = 0;
  private currentMemory: number = 0;
  
  // Test scenarios
  private testScenarios: Map<string, PerformanceTestScenario> = new Map();
  
  // Default test parameters
  private defaultTestDuration: number = 10000; // 10 seconds
  private targetFps: number = 60;
  
  /**
   * Private constructor
   */
  private constructor() {
    this.registerDefaultScenarios();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceTester {
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }
  
  /**
   * Register a test scenario
   */
  public registerScenario(scenario: PerformanceTestScenario): void {
    this.testScenarios.set(scenario.name, scenario);
    console.log(`PerformanceTester: Registered scenario "${scenario.name}"`);
  }
  
  /**
   * Run a specific test scenario
   */
  public async runTest(scenarioName: string): Promise<PerformanceTestResult> {
    if (this.isTestRunning) {
      throw new Error('A performance test is already running');
    }
    
    // Find the scenario
    const scenario = this.testScenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Unknown test scenario: ${scenarioName}`);
    }
    
    // Start test
    this.isTestRunning = true;
    this.currentTest = scenario;
    this.testStartTime = performance.now();
    console.log(`PerformanceTester: Starting test "${scenario.name}" for ${scenario.durationMs}ms`);
    
    try {
      // Reset performance monitor
      const performanceMonitor = getPerformanceMonitor();
      
      // Capture initial metrics
      this.initialMemory = this.getCurrentMemoryUsage();
      
      // Notify UI that test is starting
      eventBus.emit('performance-test-start', {
        scenarioName: scenario.name,
        durationMs: scenario.durationMs
      });
      
      // Set up test
      scenario.setupFn();
      
      // Wait for test duration
      await new Promise<void>((resolve) => {
        const testTimeout = setTimeout(() => {
          // Test complete
          clearTimeout(testTimeout);
          resolve();
        }, scenario.durationMs);
      });
      
      // Test complete
      this.testEndTime = performance.now();
      
      // Capture final metrics
      const finalMetrics = { ...performanceMonitor.getMetrics() };
      this.currentMemory = this.getCurrentMemoryUsage();
      
      // Calculate memory increase in KB
      const memoryIncreaseKb = this.initialMemory > 0 && this.currentMemory > 0 
        ? (this.currentMemory - this.initialMemory) / 1024 
        : 0;
      
      // Clean up test
      scenario.cleanupFn();
      
      // Create test result
      const result: PerformanceTestResult = {
        scenarioName: scenario.name,
        metrics: finalMetrics,
        success: finalMetrics.fps >= this.targetFps * 0.9, // Success if at least 90% of target FPS
        targetFps: this.targetFps,
        actualFps: finalMetrics.fps,
        longFrames: finalMetrics.longFrames,
        longTasks: finalMetrics.longTasksPerSecond,
        memoryIncreaseKb
      };
      
      // Store result
      this.testResults.push(result);
      
      // Notify UI that test is complete
      eventBus.emit('performance-test-complete', {
        result
      });
      
      // Log result
      this.logTestResult(result);
      
      // Reset state
      this.isTestRunning = false;
      this.currentTest = null;
      
      return result;
    } catch (error) {
      console.error(`PerformanceTester: Error during test "${scenario.name}":`, error);
      
      // Clean up test
      try {
        scenario.cleanupFn();
      } catch (cleanupError) {
        console.error('PerformanceTester: Error during test cleanup:', cleanupError);
      }
      
      // Reset state
      this.isTestRunning = false;
      this.currentTest = null;
      
      // Re-throw error
      throw error;
    }
  }
  
  /**
   * Run all registered test scenarios
   */
  public async runAllTests(): Promise<PerformanceTestResult[]> {
    if (this.isTestRunning) {
      throw new Error('A performance test is already running');
    }
    
    // Clear previous results
    this.testResults = [];
    
    // Notify UI that tests are starting
    eventBus.emit('performance-test-suite-start', {
      scenarioCount: this.testScenarios.size
    });
    
    try {
      // Run each test sequentially
      for (const [name, scenario] of this.testScenarios.entries()) {
        await this.runTest(name);
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Notify UI that all tests are complete
      eventBus.emit('performance-test-suite-complete', {
        results: [...this.testResults]
      });
      
      // Log summary
      console.log('PerformanceTester: All tests complete');
      this.logTestSummary();
      
      return [...this.testResults];
    } catch (error) {
      console.error('PerformanceTester: Error running all tests:', error);
      
      // Notify UI that tests failed
      let errorMessage: string;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'Unknown error during tests';
      }
      
      eventBus.emit('performance-test-suite-error', {
        error: errorMessage
      });
      
      throw error;
    }
  }
  
  /**
   * Get all test results
   */
  public getTestResults(): PerformanceTestResult[] {
    return [...this.testResults];
  }
  
  /**
   * Clear test results
   */
  public clearTestResults(): void {
    this.testResults = [];
    console.log('PerformanceTester: Test results cleared');
  }
  
  /**
   * Set target FPS for tests
   */
  public setTargetFps(fps: number): void {
    this.targetFps = fps;
    console.log(`PerformanceTester: Target FPS set to ${fps}`);
  }
  
  /**
   * Check if any tests are currently running
   */
  public isRunningTests(): boolean {
    return this.isTestRunning;
  }
  
  /**
   * Get current memory usage in bytes
   */
  private getCurrentMemoryUsage(): number {
    try {
      if (performance && 'memory' in performance && (performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo && typeof memoryInfo.usedJSHeapSize === 'number') {
          return memoryInfo.usedJSHeapSize || 0;
        }
      }
    } catch (e) {
      console.warn('PerformanceTester: Error getting memory usage:', e);
    }
    return 0;
  }
  
  /**
   * Log test result to console
   */
  private logTestResult(result: PerformanceTestResult): void {
    console.log(`
=== Performance Test Result: ${result.scenarioName} ===
Status: ${result.success ? 'PASS ✅' : 'FAIL ❌'}
Target FPS: ${result.targetFps}
Actual FPS: ${result.actualFps.toFixed(2)}
Long Frames: ${result.longFrames}
Long Tasks: ${result.longTasks}
Memory Increase: ${result.memoryIncreaseKb.toFixed(2)} KB
===================================================
`);
  }
  
  /**
   * Log summary of all test results
   */
  private logTestSummary(): void {
    console.log(`
===============================================
Performance Test Summary (${this.testResults.length} tests)
===============================================
Passed: ${this.testResults.filter(r => r.success).length}
Failed: ${this.testResults.filter(r => !r.success).length}
===============================================

Results:
${this.testResults.map(r => `${r.scenarioName}: ${r.success ? 'PASS' : 'FAIL'} (${r.actualFps.toFixed(2)} FPS)`).join('\n')}
===============================================
`);
  }
  
  /**
   * Register default test scenarios
   */
  private registerDefaultScenarios(): void {
    // Basic idle scenario - just running the game with minimal activity
    this.registerScenario({
      name: 'idle',
      setupFn: () => {
        eventBus.emit('performance-test-setup', { scenario: 'idle' });
      },
      cleanupFn: () => {
        eventBus.emit('performance-test-cleanup', { scenario: 'idle' });
      },
      durationMs: this.defaultTestDuration
    });
    
    // Heavy load scenario - many obstacles and effects
    this.registerScenario({
      name: 'heavy-load',
      setupFn: () => {
        eventBus.emit('performance-test-setup', { 
          scenario: 'heavy-load',
          params: {
            obstacleCount: 30,
            collectibleCount: 50,
            effectsEnabled: true
          }
        });
      },
      cleanupFn: () => {
        eventBus.emit('performance-test-cleanup', { scenario: 'heavy-load' });
      },
      durationMs: this.defaultTestDuration
    });
    
    // Memory stress test - rapidly create and dispose objects
    this.registerScenario({
      name: 'memory-stress',
      setupFn: () => {
        eventBus.emit('performance-test-setup', { 
          scenario: 'memory-stress',
          params: {
            createAndDisposeFrequency: 10 // Create/dispose objects every 10ms
          }
        });
      },
      cleanupFn: () => {
        eventBus.emit('performance-test-cleanup', { scenario: 'memory-stress' });
        
        // Force garbage collection if available
        if (typeof global !== 'undefined' && global.gc) {
          try {
            global.gc();
          } catch (e) {
            // Ignore GC errors
          }
        }
      },
      durationMs: this.defaultTestDuration
    });
  }
}

/**
 * Get the performance tester instance
 */
export function getPerformanceTester(): PerformanceTester {
  return PerformanceTester.getInstance();
}

/**
 * Run a specific performance test
 */
export async function runPerformanceTest(scenarioName: string): Promise<PerformanceTestResult> {
  return getPerformanceTester().runTest(scenarioName);
}

/**
 * Run all performance tests
 */
export async function runAllPerformanceTests(): Promise<PerformanceTestResult[]> {
  return getPerformanceTester().runAllTests();
}