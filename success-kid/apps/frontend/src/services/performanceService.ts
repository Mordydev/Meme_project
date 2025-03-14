'use client';

import performanceMonitor from '@/lib/performance/metrics';

/**
 * Performance Service
 * 
 * Provides methods for reporting performance metrics to the server
 * and configuring performance monitoring.
 */
class PerformanceService {
  private static instance: PerformanceService;
  private reportingInterval: NodeJS.Timeout | null = null;
  private reportingEnabled: boolean = false;
  private metricsBuffer: any[] = [];
  private readonly BUFFER_SIZE = 50;
  private readonly REPORT_INTERVAL = 60000; // 1 minute
  
  private constructor() {
    // Initialize with default settings
    if (typeof window !== 'undefined') {
      // Detect network conditions for adaptive monitoring
      this.configureAdaptiveReporting();
      
      // Listen for page unload to send final metrics
      window.addEventListener('beforeunload', this.flushMetrics);
    }
  }
  
  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }
  
  /**
   * Start metrics reporting to the server
   */
  public startReporting(intervalMs: number = this.REPORT_INTERVAL): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
    
    this.reportingEnabled = true;
    
    // Set up the reporting interval
    this.reportingInterval = setInterval(async () => {
      await this.reportMetrics();
    }, intervalMs);
    
    console.log(`Performance reporting started (interval: ${intervalMs}ms)`);
  }
  
  /**
   * Stop metrics reporting
   */
  public stopReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
    
    this.reportingEnabled = false;
    console.log('Performance reporting stopped');
  }
  
  /**
   * Configure adaptive reporting based on network conditions
   */
  private configureAdaptiveReporting(): void {
    if (typeof navigator === 'undefined') return;
    
    // Check for network information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        // Adjust reporting frequency based on connection type
        const adjustReporting = () => {
          const effectiveType = connection.effectiveType;
          const saveData = connection.saveData;
          
          if (saveData) {
            // In data saver mode, report less frequently
            this.startReporting(5 * 60 * 1000); // 5 minutes
          } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            // On slow connections, report less frequently
            this.startReporting(3 * 60 * 1000); // 3 minutes
          } else if (effectiveType === '3g') {
            // On medium connections, use standard interval
            this.startReporting(this.REPORT_INTERVAL);
          } else {
            // On fast connections, report more frequently
            this.startReporting(30 * 1000); // 30 seconds
          }
        };
        
        // Listen for connection changes
        connection.addEventListener('change', adjustReporting);
        
        // Initial setup
        adjustReporting();
      }
    }
  }
  
  /**
   * Add metrics to the reporting buffer
   */
  public addMetrics(metrics: any): void {
    if (!this.reportingEnabled) return;
    
    this.metricsBuffer.push({
      ...metrics,
      timestamp: Date.now()
    });
    
    // If buffer reaches threshold, flush immediately
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushMetrics();
    }
  }
  
  /**
   * Report current web vitals to the server
   */
  public reportWebVitals(): void {
    if (!this.reportingEnabled) return;
    
    const webVitals = performanceMonitor.getCoreWebVitals();
    
    this.addMetrics({
      type: 'webVitals',
      data: webVitals,
      url: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    });
  }
  
  /**
   * Report performance event to the server
   */
  public reportEvent(category: string, action: string, value?: number): void {
    if (!this.reportingEnabled) return;
    
    this.addMetrics({
      type: 'event',
      category,
      action,
      value,
      url: typeof window !== 'undefined' ? window.location.pathname : ''
    });
  }
  
  /**
   * Report all component metrics to the server
   */
  public reportComponentMetrics(): void {
    if (!this.reportingEnabled) return;
    
    const componentMetrics = Object.fromEntries(
      Array.from(performanceMonitor.getAllComponentMetrics())
    );
    
    this.addMetrics({
      type: 'components',
      data: componentMetrics,
      url: typeof window !== 'undefined' ? window.location.pathname : ''
    });
  }
  
  /**
   * Report resource metrics to the server
   */
  public reportResourceMetrics(): void {
    if (!this.reportingEnabled || typeof window === 'undefined') return;
    
    this.addMetrics({
      type: 'resources',
      jsSize: performanceMonitor.getJSBundleSize(),
      cssSize: performanceMonitor.getCSSSize(),
      imageSize: performanceMonitor.getImageSize(),
      resources: performanceMonitor.getResourceTimings().slice(0, 20),
      url: window.location.pathname
    });
  }
  
  /**
   * Report all currently collected metrics to the server
   */
  private async reportMetrics(): Promise<void> {
    await this.flushMetrics();
    
    // Collect and report current metrics
    this.reportWebVitals();
    this.reportComponentMetrics();
    this.reportResourceMetrics();
  }
  
  /**
   * Flush metrics buffer to the server
   */
  public flushMetrics = async (): Promise<void> => {
    if (this.metricsBuffer.length === 0) return;
    
    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];
      
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          clientInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            language: typeof navigator !== 'undefined' ? navigator.language : '',
            screenSize: typeof window !== 'undefined' ? 
              `${window.screen.width}x${window.screen.height}` : '',
            viewportSize: typeof window !== 'undefined' ? 
              `${window.innerWidth}x${window.innerHeight}` : '',
            connection: typeof navigator !== 'undefined' && 'connection' in navigator ? 
              (navigator as any).connection.effectiveType : 'unknown',
            timestamp: Date.now()
          }
        }),
        // Use keepalive to allow the request to complete even if the page is unloading
        keepalive: true
      });
      
      if (!response.ok) {
        console.error('Failed to report performance metrics', await response.text());
      }
    } catch (error) {
      console.error('Error reporting performance metrics:', error);
      
      // Add back to buffer to retry next time
      // But keep buffer size in check
      if (this.metricsBuffer.length + this.BUFFER_SIZE/2 < this.BUFFER_SIZE) {
        this.metricsBuffer.push(...this.metricsBuffer.slice(0, this.BUFFER_SIZE/2));
      }
    }
  };
}

export default PerformanceService.getInstance();
