import { getPerformanceMonitor, PerformanceMetrics } from '../PerformanceMonitor';
import { getQualityAdjuster } from '../QualityAdjuster';
import eventBus from '../../core/EventSystem';

/**
 * Performance event that can be logged
 */
export interface PerformanceEvent {
  timestamp: number;
  type: 'warning' | 'quality-change' | 'severe-issue' | 'frame-drop' | 'optimization';
  data: any;
  metrics: PerformanceMetrics;
}

/**
 * Performance report data for analysis
 */
export interface PerformanceReport {
  sessionId: string;
  startTime: number;
  duration: number;
  averageFps: number;
  minFps: number;
  events: PerformanceEvent[];
  qualityChanges: number;
  warningCount: number;
  severeIssueCount: number;
  recommendations: string[];
}

/**
 * Logs detailed performance telemetry for analysis and quality tuning
 * Provides methods to capture, analyze, and report performance issues
 */
export class PerformanceLogger {
  private static instance: PerformanceLogger;
  
  private sessionId: string;
  private startTime: number = 0;
  private isLogging: boolean = false;
  private events: PerformanceEvent[] = [];
  private sampleInterval: number = 5000; // Sample performance every 5 seconds by default
  private intervalId: number | null = null;
  private warningThreshold: number = 3; // Number of warnings before triggering analysis
  private recentWarnings: number = 0;
  
  // Tracking data for analysis
  private fpsHistory: number[] = [];
  private qualityChangeCount: number = 0;
  private warningCount: number = 0;
  private severeIssueCount: number = 0;
  
  private constructor() {
    this.sessionId = this.generateSessionId();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }
  
  /**
   * Start logging performance data
   * @param sampleInterval Optional interval in ms between periodic samples
   */
  public start(sampleInterval?: number): void {
    if (this.isLogging) return;
    
    this.isLogging = true;
    this.startTime = performance.now();
    this.events = [];
    this.fpsHistory = [];
    this.qualityChangeCount = 0;
    this.warningCount = 0;
    this.severeIssueCount = 0;
    this.recentWarnings = 0;
    
    if (sampleInterval && sampleInterval >= 1000) {
      this.sampleInterval = sampleInterval;
    }
    
    // Register event listeners
    eventBus.on('performance-update', this.handlePerformanceUpdate.bind(this));
    eventBus.on('performance-quality-change', this.handleQualityChange.bind(this));
    eventBus.on('severe-performance-warning', this.handleSevereWarning.bind(this));
    eventBus.on('moderate-performance-warning', this.handleModerateWarning.bind(this));
    eventBus.on('aggressive-quality-reduction', this.handleAggressiveReduction.bind(this));
    
    // Start periodic sampling
    if (typeof window !== 'undefined') {
      this.intervalId = window.setInterval(
        this.capturePerformanceSample.bind(this), 
        this.sampleInterval
      );
    }
    
    console.log(`PerformanceLogger: Started logging (session: ${this.sessionId})`);
  }
  
  /**
   * Stop logging performance data
   */
  public stop(): PerformanceReport {
    if (!this.isLogging) {
      return this.generateReport();
    }
    
    this.isLogging = false;
    
    // Remove event listeners
    eventBus.off('performance-update', this.handlePerformanceUpdate);
    eventBus.off('performance-quality-change', this.handleQualityChange);
    eventBus.off('severe-performance-warning', this.handleSevereWarning);
    eventBus.off('moderate-performance-warning', this.handleModerateWarning);
    eventBus.off('aggressive-quality-reduction', this.handleAggressiveReduction);
    
    // Stop interval
    if (this.intervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log(`PerformanceLogger: Stopped logging (session: ${this.sessionId})`);
    
    return this.generateReport();
  }
  
  /**
   * Log a manual performance event
   */
  public logEvent(type: string, data: any): void {
    if (!this.isLogging) return;
    
    const metrics = getPerformanceMonitor().getMetrics();
    
    this.events.push({
      timestamp: performance.now(),
      type: type as any,
      data,
      metrics
    });
  }
  
  /**
   * Get the current performance report
   */
  public getReport(): PerformanceReport {
    return this.generateReport();
  }
  
  /**
   * Check if performance logging is currently active
   */
  public isActive(): boolean {
    return this.isLogging;
  }
  
  /**
   * Handle performance update events
   */
  private handlePerformanceUpdate(data: { metrics: PerformanceMetrics }): void {
    // Store FPS history for analysis
    this.fpsHistory.push(data.metrics.fps);
    
    // Keep history at a reasonable size
    if (this.fpsHistory.length > 100) {
      this.fpsHistory.shift();
    }
    
    // Only log significant FPS drops
    if (data.metrics.fps < 30 && data.metrics.longFrames > 3) {
      this.events.push({
        timestamp: performance.now(),
        type: 'frame-drop',
        data: { fps: data.metrics.fps, longFrames: data.metrics.longFrames },
        metrics: data.metrics
      });
    }
  }
  
  /**
   * Handle quality change events
   */
  private handleQualityChange(data: { quality: string, reason: string, metrics: PerformanceMetrics }): void {
    this.qualityChangeCount++;
    
    this.events.push({
      timestamp: performance.now(),
      type: 'quality-change',
      data: { quality: data.quality, reason: data.reason },
      metrics: data.metrics
    });
    
    // Reset recent warnings on quality reduction
    if (data.reason === 'performance_reduction') {
      this.recentWarnings = 0;
    }
  }
  
  /**
   * Handle severe performance warning events
   */
  private handleSevereWarning(data: { metrics: PerformanceMetrics, reason: string }): void {
    this.severeIssueCount++;
    this.warningCount++;
    this.recentWarnings++;
    
    this.events.push({
      timestamp: performance.now(),
      type: 'severe-issue',
      data: { reason: data.reason },
      metrics: data.metrics
    });
    
    // Check if we need to trigger analysis
    if (this.recentWarnings >= this.warningThreshold) {
      this.analyzeRecentPerformance();
      this.recentWarnings = 0;
    }
  }
  
  /**
   * Handle moderate performance warning events
   */
  private handleModerateWarning(data: { metrics: PerformanceMetrics, reason: string }): void {
    this.warningCount++;
    this.recentWarnings++;
    
    this.events.push({
      timestamp: performance.now(),
      type: 'warning',
      data: { reason: data.reason },
      metrics: data.metrics
    });
    
    // Check if we need to trigger analysis
    if (this.recentWarnings >= this.warningThreshold) {
      this.analyzeRecentPerformance();
      this.recentWarnings = 0;
    }
  }
  
  /**
   * Handle aggressive quality reduction events
   */
  private handleAggressiveReduction(data: { quality: string, preset: any, reason: string }): void {
    const metrics = getPerformanceMonitor().getMetrics();
    
    this.events.push({
      timestamp: performance.now(),
      type: 'optimization',
      data: { quality: data.quality, reason: data.reason, aggressive: true },
      metrics
    });
    
    // Reset recent warnings
    this.recentWarnings = 0;
  }
  
  /**
   * Capture a regular performance sample
   */
  private capturePerformanceSample(): void {
    if (!this.isLogging) return;
    
    const metrics = getPerformanceMonitor().getMetrics();
    const quality = getQualityAdjuster().getQuality();
    
    // Only log periodic samples if they show significant variation
    // or if we don't have many events yet
    const shouldLog = 
      this.events.length < 10 || 
      metrics.fps < 45 || 
      metrics.longFrames > 0;
    
    if (shouldLog) {
      this.events.push({
        timestamp: performance.now(),
        type: 'frame-drop',
        data: { fps: metrics.fps, quality, periodic: true },
        metrics
      });
    }
  }
  
  /**
   * Analyze recent performance issues and recommend optimizations
   */
  private analyzeRecentPerformance(): void {
    // Get performance monitor and quality adjuster
    const performanceMonitor = getPerformanceMonitor();
    const qualityAdjuster = getQualityAdjuster();
    
    // Get current metrics and quality
    const metrics = performanceMonitor.getMetrics();
    const currentQuality = qualityAdjuster.getQuality();
    
    // Find patterns in recent events
    const recentEvents = this.events.slice(-20); // Look at last 20 events
    const recentFps = this.fpsHistory.slice(-10); // Last 10 FPS readings
    
    // Calculate average recent FPS
    const avgFps = recentFps.reduce((sum, fps) => sum + fps, 0) / recentFps.length;
    
    // Check if there are spikes in frame times
    const hasSpikes = recentEvents.some(e => 
      e.metrics.frameTime > 50 && e.metrics.averageFrameTime < 30
    );
    
    // Check if memory usage is increasing (if available)
    let memoryPressure = false;
    const memoryEvents = recentEvents
      .filter(e => e.metrics.memoryUsage?.usedJSHeapSize)
      .map(e => e.metrics.memoryUsage?.usedJSHeapSize);
    
    if (memoryEvents.length >= 3) {
      // Check if memory usage is consistently increasing
      let increasing = true;
      for (let i = 1; i < memoryEvents.length; i++) {
        if (memoryEvents[i]! <= memoryEvents[i-1]!) {
          increasing = false;
          break;
        }
      }
      
      // If memory is consistently increasing and high, flag it
      if (increasing && memoryEvents[memoryEvents.length-1]! > 300_000_000) {
        memoryPressure = true;
      }
    }
    
    // Generate optimization recommendations
    const recommendations: string[] = [];
    
    if (avgFps < 30 && currentQuality !== 'low') {
      recommendations.push('Consider more aggressive quality reduction');
    }
    
    if (hasSpikes) {
      recommendations.push('Performance spikes detected - check for garbage collection or background tasks');
    }
    
    if (memoryPressure) {
      recommendations.push('Memory pressure detected - memory leak or high resource usage possible');
    }
    
    if (recommendations.length > 0) {
      console.warn('PerformanceLogger: Analysis recommendations:', recommendations);
      
      // Log the analysis
      this.events.push({
        timestamp: performance.now(),
        type: 'optimization',
        data: { 
          recommendations, 
          avgFps,
          hasSpikes,
          memoryPressure
        },
        metrics
      });
      
      // Emit analysis event
      eventBus.emit('performance-analysis', {
        recommendations,
        metrics,
        currentQuality,
        avgFps
      });
    }
  }
  
  /**
   * Generate a performance report
   */
  private generateReport(): PerformanceReport {
    // Calculate metrics
    let avgFps = 60;
    let minFps = 60;
    
    if (this.fpsHistory.length > 0) {
      const totalFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0);
      avgFps = totalFps / this.fpsHistory.length;
      minFps = Math.min(...this.fpsHistory);
    }
    
    // Generate recommendations based on all logged data
    const recommendations: string[] = [];
    
    // Check for quality oscillation (too many changes)
    if (this.qualityChangeCount > 5 && this.events.length > 0) {
      const duration = (performance.now() - this.startTime) / 1000;
      const changesPerMinute = (this.qualityChangeCount / duration) * 60;
      
      if (changesPerMinute > 2) {
        recommendations.push('Quality fluctuating too frequently - consider more conservative thresholds');
      }
    }
    
    // Check for persistent issues
    if (this.severeIssueCount > 3 && avgFps < 40) {
      recommendations.push('Persistent severe issues - consider lower baseline quality or more aggressive optimizations');
    }
    
    // Create report
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: performance.now() - this.startTime,
      averageFps: avgFps,
      minFps,
      events: this.events,
      qualityChanges: this.qualityChangeCount,
      warningCount: this.warningCount,
      severeIssueCount: this.severeIssueCount,
      recommendations
    };
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.floor(Math.random() * 10000000).toString(36);
    return `perf_${timestamp}_${randomPart}`;
  }
}

/**
 * Get the performance logger singleton
 */
export function getPerformanceLogger(): PerformanceLogger {
  return PerformanceLogger.getInstance();
}

/**
 * Start performance logging
 */
export function startPerformanceLogging(sampleInterval?: number): void {
  getPerformanceLogger().start(sampleInterval);
}

/**
 * Stop performance logging and get the report
 */
export function stopPerformanceLogging(): PerformanceReport {
  return getPerformanceLogger().stop();
}