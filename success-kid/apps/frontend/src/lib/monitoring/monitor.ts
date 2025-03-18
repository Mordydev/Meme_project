'use client';

import { 
  PerformanceMetrics, 
  CoreWebVitals,
  DeviceTier
} from '@/lib/performance/types';
import {
  createEmptyMetrics,
  detectDeviceTier,
  getMemoryUsage,
  getNavigationTiming,
  getNetworkInformation,
  measureFps
} from '@/lib/performance/metrics';
import errorTrackingService from './error-tracking';

/**
 * Monitoring events for analytics
 */
export interface MonitoringEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  properties?: Record<string, any>;
}

/**
 * User interaction tracking
 */
export interface UserInteraction {
  type: 'click' | 'view' | 'scroll' | 'input' | 'custom';
  target: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Frontend monitoring service
 * Collects performance metrics, user behavior, and application health data
 */
class MonitoringService {
  private static METRICS_INTERVAL = 60000; // 1 minute
  private static USER_INACTIVE_THRESHOLD = 300000; // 5 minutes
  
  private metricsInterval: NodeJS.Timeout | null = null;
  private lastUserActivity: number = Date.now();
  private sessionId: string = '';
  private currentMetrics: PerformanceMetrics = createEmptyMetrics();
  private eventBuffer: MonitoringEvent[] = [];
  private interactionBuffer: UserInteraction[] = [];
  private isInitialized = false;
  private bufferSize = 50;
  private flushInterval: NodeJS.Timeout | null = null;
  private analyticsEndpoint = '/api/v1/analytics';
  
  private onMetricsListeners: Array<(metrics: PerformanceMetrics) => void> = [];
  
  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Initialize monitoring in browser environment
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }
  
  /**
   * Initialize monitoring service
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    // Generate new session ID
    this.sessionId = this.generateSessionId();
    
    // Start collecting metrics periodically
    this.startMetricsCollection();
    
    // Track user activity
    this.setupActivityTracking();
    
    // Set up buffer flushing
    this.setupBufferFlushing();
    
    // Track web vitals
    this.setupWebVitalsTracking();
    
    this.isInitialized = true;
  }
  
  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect initial metrics
    this.collectMetrics();
    
    // Set up interval for continuous collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, MonitoringService.METRICS_INTERVAL);
  }
  
  /**
   * Set up user activity tracking
   */
  private setupActivityTracking(): void {
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };
    
    // Track various user interactions
    window.addEventListener('click', updateActivity);
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);
  }
  
  /**
   * Set up buffer flushing at intervals
   */
  private setupBufferFlushing(): void {
    this.flushInterval = setInterval(() => {
      this.flushBuffers();
    }, 10000); // Flush every 10 seconds
  }
  
  /**
   * Set up Web Vitals tracking
   */
  private setupWebVitalsTracking(): void {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
        // Core Web Vitals
        onCLS(metric => {
          this.updateWebVital('CLS', metric.value);
        });
        
        onFID(metric => {
          this.updateWebVital('FID', metric.value);
        });
        
        onLCP(metric => {
          this.updateWebVital('LCP', metric.value);
        });
        
        // Additional metrics
        onTTFB(metric => {
          this.recordEvent('performance', 'web-vital', 'TTFB', metric.value);
        });
        
        onINP(metric => {
          this.updateWebVital('INP', metric.value);
        });
      }).catch(error => {
        errorTrackingService.captureError(error, { 
          component: 'MonitoringService', 
          tags: { function: 'setupWebVitalsTracking' }
        });
      });
    }
  }
  
  /**
   * Update a Web Vital metric
   */
  private updateWebVital(name: keyof CoreWebVitals, value: number): void {
    const webVitals = { ...this.currentMetrics.coreWebVitals };
    webVitals[name] = value;
    this.currentMetrics = { ...this.currentMetrics, coreWebVitals: webVitals };
    
    // Track as an event
    this.recordEvent('performance', 'web-vital', name, value);
    
    // Notify metrics listeners
    this.notifyMetricsListeners();
  }
  
  /**
   * Notify metrics listeners
   */
  private notifyMetricsListeners(): void {
    for (const listener of this.onMetricsListeners) {
      try {
        listener(this.currentMetrics);
      } catch (error) {
        console.error('Error in metrics listener:', error);
      }
    }
  }
  
  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Measure FPS (if visible)
      let fps = null;
      if (document.visibilityState === 'visible') {
        fps = await measureFps(1000);
      }
      
      // Update metrics
      this.currentMetrics = {
        ...this.currentMetrics,
        fps,
        memory: getMemoryUsage(),
        navigation: getNavigationTiming(),
        network: getNetworkInformation(),
        deviceTier: detectDeviceTier(),
        timestamp: Date.now()
      };
      
      // Notify listeners
      this.notifyMetricsListeners();
      
      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance metrics:', this.currentMetrics);
      }
    } catch (error) {
      errorTrackingService.captureError(error as Error, { 
        component: 'MonitoringService', 
        tags: { function: 'collectMetrics' }
      });
    }
  }
  
  /**
   * Record an event for analytics
   */
  recordEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    const event: MonitoringEvent = {
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      properties
    };
    
    // Add to buffer
    if (this.eventBuffer.length >= this.bufferSize) {
      this.eventBuffer.shift(); // Remove oldest event
    }
    this.eventBuffer.push(event);
    
    // If buffer is getting full, flush it
    if (this.eventBuffer.length >= this.bufferSize * 0.8) {
      this.flushBuffers();
    }
  }
  
  /**
   * Track a user interaction
   */
  trackInteraction(
    type: UserInteraction['type'],
    target: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const interaction: UserInteraction = {
      type,
      target,
      timestamp: Date.now(),
      duration,
      metadata
    };
    
    // Add to buffer
    if (this.interactionBuffer.length >= this.bufferSize) {
      this.interactionBuffer.shift(); // Remove oldest interaction
    }
    this.interactionBuffer.push(interaction);
    
    // Update last activity time
    this.lastUserActivity = Date.now();
  }
  
  /**
   * Check if user is active
   */
  isUserActive(): boolean {
    return (Date.now() - this.lastUserActivity) < MonitoringService.USER_INACTIVE_THRESHOLD;
  }
  
  /**
   * Register metrics listener
   */
  onMetricsUpdate(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.onMetricsListeners.push(listener);
    
    // Return unregister function
    return () => {
      const index = this.onMetricsListeners.indexOf(listener);
      if (index !== -1) {
        this.onMetricsListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Flush event and interaction buffers to server
   */
  private flushBuffers(): void {
    // Only flush if there's data
    if (this.eventBuffer.length === 0 && this.interactionBuffer.length === 0) {
      return;
    }
    
    // Prepare data
    const data = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      events: [...this.eventBuffer],
      interactions: [...this.interactionBuffer],
      metrics: this.currentMetrics,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // Clear buffers (copy references first to avoid race conditions)
    const eventsToSend = [...this.eventBuffer];
    const interactionsToSend = [...this.interactionBuffer];
    this.eventBuffer = [];
    this.interactionBuffer = [];
    
    // Send data to server
    try {
      fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      }).catch(error => {
        // If sending fails, put back in buffer
        this.eventBuffer = [...eventsToSend, ...this.eventBuffer];
        this.interactionBuffer = [...interactionsToSend, ...this.interactionBuffer];
        
        // Truncate if too large
        if (this.eventBuffer.length > this.bufferSize) {
          this.eventBuffer = this.eventBuffer.slice(-this.bufferSize);
        }
        if (this.interactionBuffer.length > this.bufferSize) {
          this.interactionBuffer = this.interactionBuffer.slice(-this.bufferSize);
        }
        
        console.error('Failed to send monitoring data:', error);
      });
    } catch (error) {
      console.error('Error in flushBuffers:', error);
    }
  }
  
  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.currentMetrics;
  }
  
  /**
   * Clean up resources when component unmounts
   */
  cleanup(): void {
    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining data
    this.flushBuffers();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

export default monitoringService;