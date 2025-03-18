'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface PerformanceMetrics {
  // Core web vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  inp: number | null; // Interaction to Next Paint
  fid: number | null; // First Input Delay
  
  // Additional metrics
  ttfb: number | null; // Time to First Byte
  domLoad: number | null; // DOM Content Loaded
  pageLoad: number | null; // Window Load
  
  // Runtime metrics
  fps: number | null; // Frames Per Second
  memory: number | null; // Memory Usage (in MB)
  jsHeapSize: number | null; // JS Heap Size (in MB)
  
  // Resource metrics
  resourceCount: number | null; // Number of resources
  resourceSize: number | null; // Total resource size (in KB)
  
  // Network metrics
  downlink: number | null; // Downlink speed (in Mbps)
  rtt: number | null; // Round Trip Time (in ms)
  
  // Device info
  devicePixelRatio: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenWidth: number;
  screenHeight: number;
}

export interface PerformanceMonitorProps {
  showOverlay?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  refreshRate?: number; // in ms
  enableResourceMonitoring?: boolean;
  className?: string;
  onMetricsChange?: (metrics: PerformanceMetrics) => void;
}

/**
 * A component that monitors various performance metrics
 * for diagnosing performance issues across different devices.
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showOverlay = true,
  position = 'bottom-right',
  refreshRate = 1000,
  enableResourceMonitoring = true,
  className,
  onMetricsChange,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    inp: null,
    fid: null,
    ttfb: null,
    domLoad: null,
    pageLoad: null,
    fps: null,
    memory: null,
    jsHeapSize: null,
    resourceCount: null,
    resourceSize: null,
    downlink: null,
    rtt: null,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    deviceType: 'desktop',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Frame rate calculation
  const frameRef = useRef<{ 
    lastFrameTime: number;
    frameCount: number;
    lastFpsUpdateTime: number;
    fps: number;
  }>({
    lastFrameTime: 0,
    frameCount: 0,
    lastFpsUpdateTime: 0,
    fps: 60,
  });
  
  // Measure Core Web Vitals
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;
    
    // Get device type
    const deviceType = (() => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    })();
    
    // Core Web Vitals measurement
    if ('performance' in window) {
      // FCP measurement
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const fcp = entries[0].startTime;
          setMetrics(prev => ({ ...prev, fcp }));
        }
      });
      
      fcpObserver.observe({ type: 'paint', buffered: true });
      
      // LCP measurement
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          setMetrics(prev => ({ ...prev, lcp }));
        }
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // CLS measurement
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach(entry => {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            const impact = (entry as any).value;
            clsValue += impact;
            clsEntries.push(entry);
            
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          }
        });
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // FID measurement (First Input Delay)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0];
          const fid = (firstInput as any).processingStart - firstInput.startTime;
          setMetrics(prev => ({ ...prev, fid }));
        }
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
      
      // TTFB measurement
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        const ttfb = navEntry.responseStart;
        const domLoad = navEntry.domContentLoadedEventEnd;
        const pageLoad = navEntry.loadEventEnd;
        
        setMetrics(prev => ({ 
          ...prev, 
          ttfb,
          domLoad,
          pageLoad,
          deviceType,
        }));
      }
      
      // Resource monitoring
      if (enableResourceMonitoring) {
        const updateResourceMetrics = () => {
          const resources = performance.getEntriesByType('resource');
          const resourceCount = resources.length;
          const resourceSize = resources.reduce((total, resource) => 
            total + (resource as PerformanceResourceTiming).transferSize, 0) / 1024;
          
          setMetrics(prev => ({ ...prev, resourceCount, resourceSize }));
        };
        
        // Initial measurement
        updateResourceMetrics();
        
        // Set up observer for future resources
        const resourceObserver = new PerformanceObserver(() => {
          updateResourceMetrics();
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        
        // Clean up
        return () => {
          resourceObserver.disconnect();
        };
      }
    }
  }, [enableResourceMonitoring]);
  
  // FPS & memory measurement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let animationFrameId: number;
    let intervalId: NodeJS.Timeout;
    
    // FPS measurement
    const measureFps = (timestamp: number) => {
      if (!frameRef.current.lastFrameTime) {
        frameRef.current.lastFrameTime = timestamp;
        frameRef.current.lastFpsUpdateTime = timestamp;
      }
      
      // Increment frame count
      frameRef.current.frameCount++;
      
      // If it's been a second since the last FPS update
      if (timestamp - frameRef.current.lastFpsUpdateTime >= 1000) {
        // Calculate FPS
        const fps = Math.round(
          (frameRef.current.frameCount * 1000) / (timestamp - frameRef.current.lastFpsUpdateTime)
        );
        
        frameRef.current.fps = fps;
        
        // Reset frame count and update time
        frameRef.current.frameCount = 0;
        frameRef.current.lastFpsUpdateTime = timestamp;
      }
      
      frameRef.current.lastFrameTime = timestamp;
      animationFrameId = requestAnimationFrame(measureFps);
    };
    
    // Start FPS measurement
    animationFrameId = requestAnimationFrame(measureFps);
    
    // Periodically update metrics
    intervalId = setInterval(() => {
      // Get memory info if available
      let memory = null;
      let jsHeapSize = null;
      
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        memory = Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024));
        jsHeapSize = Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024));
      }
      
      // Get network info if available
      let downlink = null;
      let rtt = null;
      
      if (navigator.connection) {
        downlink = (navigator.connection as any).downlink;
        rtt = (navigator.connection as any).rtt;
      }
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        fps: frameRef.current.fps,
        memory,
        jsHeapSize,
        downlink,
        rtt,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      }));
    }, refreshRate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
    };
  }, [refreshRate]);
  
  // Call onMetricsChange when metrics change
  useEffect(() => {
    onMetricsChange?.(metrics);
  }, [metrics, onMetricsChange]);
  
  // Helper function to format metric values
  const formatMetric = (value: number | null, unit: string, decimalPlaces = 0) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(decimalPlaces)} ${unit}`;
  };
  
  // Get color class based on metric value
  const getMetricColor = (value: number | null, thresholds: [number, number]) => {
    if (value === null) return 'text-gray-400';
    if (value <= thresholds[0]) return 'text-green-600';
    if (value <= thresholds[1]) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Get inverted color class for some metrics (where lower is worse)
  const getInvertedMetricColor = (value: number | null, thresholds: [number, number]) => {
    if (value === null) return 'text-gray-400';
    if (value >= thresholds[1]) return 'text-green-600';
    if (value >= thresholds[0]) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Position class mapping
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };
  
  if (!showOverlay) return null;
  
  return (
    <div
      className={cn(
        'performance-monitor fixed z-50 bg-black bg-opacity-80 text-white',
        'rounded-lg overflow-hidden shadow-lg backdrop-blur-sm',
        positionClasses[position],
        isCollapsed ? 'w-10 h-10' : 'w-64',
        className
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 z-10"
      >
        {isCollapsed ? '+' : '−'}
      </button>
      
      {/* Collapsed view (just FPS) */}
      {isCollapsed && (
        <div className="w-full h-full flex items-center justify-center text-lg font-mono">
          {metrics.fps ?? '--'}
        </div>
      )}
      
      {/* Expanded view (all metrics) */}
      {!isCollapsed && (
        <div className="p-3 font-mono text-xs">
          <div className="font-bold text-center mb-2 pb-1 border-b border-gray-700">
            Performance Metrics
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {/* Core Web Vitals */}
            <div className="text-gray-400">FCP:</div>
            <div className={getMetricColor(metrics.fcp, [1800, 3000])}>
              {formatMetric(metrics.fcp, 'ms')}
            </div>
            
            <div className="text-gray-400">LCP:</div>
            <div className={getMetricColor(metrics.lcp, [2500, 4000])}>
              {formatMetric(metrics.lcp, 'ms')}
            </div>
            
            <div className="text-gray-400">CLS:</div>
            <div className={getMetricColor(metrics.cls, [0.1, 0.25])}>
              {metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'}
            </div>
            
            <div className="text-gray-400">FID:</div>
            <div className={getMetricColor(metrics.fid, [100, 300])}>
              {formatMetric(metrics.fid, 'ms')}
            </div>
            
            {/* Performance metrics */}
            <div className="col-span-2 mt-1 mb-1 border-t border-gray-700"></div>
            
            <div className="text-gray-400">FPS:</div>
            <div className={getInvertedMetricColor(metrics.fps, [30, 50])}>
              {formatMetric(metrics.fps, '', 0)}
            </div>
            
            <div className="text-gray-400">TTFB:</div>
            <div className={getMetricColor(metrics.ttfb, [800, 1800])}>
              {formatMetric(metrics.ttfb, 'ms')}
            </div>
            
            <div className="text-gray-400">DOM Load:</div>
            <div className="text-gray-200">
              {formatMetric(metrics.domLoad, 'ms')}
            </div>
            
            <div className="text-gray-400">Memory:</div>
            <div className="text-gray-200">
              {formatMetric(metrics.memory, 'MB')}
            </div>
            
            {/* Resource metrics */}
            {enableResourceMonitoring && (
              <>
                <div className="text-gray-400">Resources:</div>
                <div className="text-gray-200">
                  {metrics.resourceCount !== null ? metrics.resourceCount : 'N/A'}
                </div>
                
                <div className="text-gray-400">Size:</div>
                <div className="text-gray-200">
                  {formatMetric(metrics.resourceSize, 'KB', 0)}
                </div>
              </>
            )}
            
            {/* Network metrics */}
            <div className="text-gray-400">Downlink:</div>
            <div className="text-gray-200">
              {formatMetric(metrics.downlink, 'Mbps', 1)}
            </div>
            
            {/* Device metrics */}
            <div className="col-span-2 mt-1 mb-1 border-t border-gray-700"></div>
            
            <div className="text-gray-400">Device:</div>
            <div className="text-gray-200">
              {metrics.deviceType} ({metrics.devicePixelRatio}x)
            </div>
            
            <div className="text-gray-400">Screen:</div>
            <div className="text-gray-200">
              {metrics.screenWidth}×{metrics.screenHeight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;