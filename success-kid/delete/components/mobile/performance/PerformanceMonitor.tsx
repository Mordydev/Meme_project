'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

export interface PerformanceMetrics {
  fps: number;
  memory: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  } | null;
  coreWebVitals: {
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
    inp: number | null; // Interaction to Next Paint
  };
  deviceTier: 'low' | 'medium' | 'high' | 'unknown';
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null;
}

export interface PerformanceMonitorProps {
  children: ReactNode;
  onMetricsChange?: (metrics: PerformanceMetrics) => void;
  enablePerfMode?: boolean;
  monitoringFrequency?: number;
  className?: string;
  onPerformanceIssue?: (issue: { type: string; metrics: Partial<PerformanceMetrics> }) => void;
  thresholds?: {
    lowFps: number;
    highCls: number;
    highLcp: number;
    highInp: number;
    memoryUsage: number; // Percentage
  };
}

/**
 * Component that monitors performance metrics and provides feedback on
 * performance issues.
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  onMetricsChange,
  enablePerfMode = false,
  monitoringFrequency = 5000, // 5 seconds
  className,
  onPerformanceIssue,
  thresholds = {
    lowFps: 30,
    highCls: 0.1,
    highLcp: 2500,
    highInp: 200,
    memoryUsage: 90,
  },
}) => {
  const { isMobile } = useViewport();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: null,
    coreWebVitals: {
      lcp: null,
      fid: null,
      cls: null,
      inp: null,
    },
    deviceTier: 'unknown',
    connection: null,
  });
  const [showPerfOverlay, setShowPerfOverlay] = useState(enablePerfMode);
  
  // Set up performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if Performance API is available
    if (!('performance' in window)) return;
    
    // Detect device tier based on hardware
    const detectDeviceTier = (): 'low' | 'medium' | 'high' | 'unknown' => {
      // Use navigator.hardwareConcurrency as a proxy for device capability
      const cores = navigator.hardwareConcurrency || 0;
      
      // Check if device is mobile
      if (isMobile) {
        if (cores <= 2) return 'low';
        if (cores <= 4) return 'medium';
        return 'high';
      } else {
        if (cores <= 2) return 'low';
        if (cores <= 6) return 'medium';
        return 'high';
      }
    };
    
    // Initialize metrics
    const initialMetrics: PerformanceMetrics = {
      fps: 60, // Assume 60fps initially
      memory: null,
      coreWebVitals: {
        lcp: null,
        fid: null,
        cls: null,
        inp: null,
      },
      deviceTier: detectDeviceTier(),
      connection: null,
    };
    
    setMetrics(initialMetrics);
    
    // Get connection info
    const updateConnectionInfo = () => {
      const connection = 
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      
      if (connection) {
        setMetrics(prev => ({
          ...prev,
          connection: {
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false,
          },
        }));
      }
    };
    
    // Update connection info initially
    updateConnectionInfo();
    
    // Set up FPS monitoring
    let frameCount = 0;
    let lastFrameTime = performance.now();
    let frameId: number;
    
    const measureFps = (timestamp: number) => {
      frameCount++;
      
      // Calculate FPS every second
      const elapsed = timestamp - lastFrameTime;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        
        setMetrics(prev => ({
          ...prev,
          fps,
        }));
        
        // Check for performance issues
        if (fps < thresholds.lowFps) {
          onPerformanceIssue?.({
            type: 'low_fps',
            metrics: { fps },
          });
        }
        
        frameCount = 0;
        lastFrameTime = timestamp;
      }
      
      frameId = requestAnimationFrame(measureFps);
    };
    
    // Start FPS monitoring
    frameId = requestAnimationFrame(measureFps);
    
    // Memory monitoring (Chrome only)
    const memoryInterval = setInterval(() => {
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        
        setMetrics(prev => ({
          ...prev,
          memory: {
            jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
            totalJSHeapSize: memoryInfo.totalJSHeapSize,
            usedJSHeapSize: memoryInfo.usedJSHeapSize,
          },
        }));
        
        // Check for memory issues
        const memoryUsagePercent = 
          (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        
        if (memoryUsagePercent > thresholds.memoryUsage) {
          onPerformanceIssue?.({
            type: 'high_memory_usage',
            metrics: { memory: {
              jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
              totalJSHeapSize: memoryInfo.totalJSHeapSize,
              usedJSHeapSize: memoryInfo.usedJSHeapSize,
            } },
          });
        }
      }
    }, monitoringFrequency);
    
    // Web Vitals monitoring
    const observeWebVitals = () => {
      // Largest Contentful Paint
      let lcpObserver: PerformanceObserver;
      try {
        lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          const lcp = lastEntry.startTime;
          
          setMetrics(prev => ({
            ...prev,
            coreWebVitals: {
              ...prev.coreWebVitals,
              lcp,
            },
          }));
          
          // Check for LCP issues
          if (lcp > thresholds.highLcp) {
            onPerformanceIssue?.({
              type: 'high_lcp',
              metrics: { coreWebVitals: { lcp } },
            });
          }
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP observation not supported
      }
      
      // First Input Delay
      let fidObserver: PerformanceObserver;
      try {
        fidObserver = new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0];
          const fid = firstInput.processingStart - firstInput.startTime;
          
          setMetrics(prev => ({
            ...prev,
            coreWebVitals: {
              ...prev.coreWebVitals,
              fid,
            },
          }));
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID observation not supported
      }
      
      // Cumulative Layout Shift
      let clsObserver: PerformanceObserver;
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      
      try {
        clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          
          entries.forEach(entry => {
            // Only count layout shifts without recent user input
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              clsEntries.push(entry);
            }
          });
          
          setMetrics(prev => ({
            ...prev,
            coreWebVitals: {
              ...prev.coreWebVitals,
              cls: clsValue,
            },
          }));
          
          // Check for CLS issues
          if (clsValue > thresholds.highCls) {
            onPerformanceIssue?.({
              type: 'high_cls',
              metrics: { coreWebVitals: { cls: clsValue } },
            });
          }
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS observation not supported
      }
      
      // INP (Interaction to Next Paint)
      let inpObserver: PerformanceObserver;
      
      try {
        inpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          let totalDelay = 0;
          
          if (entries.length > 0) {
            // Calculate the average interaction delay
            entries.forEach(entry => {
              totalDelay += (entry as any).duration;
            });
            
            const inp = totalDelay / entries.length;
            
            setMetrics(prev => ({
              ...prev,
              coreWebVitals: {
                ...prev.coreWebVitals,
                inp,
              },
            }));
            
            // Check for INP issues
            if (inp > thresholds.highInp) {
              onPerformanceIssue?.({
                type: 'high_inp',
                metrics: { coreWebVitals: { inp } },
              });
            }
          }
        });
        
        inpObserver.observe({ type: 'event', durationThreshold: 16, buffered: true });
      } catch (e) {
        // INP observation not supported
      }
      
      return () => {
        lcpObserver?.disconnect();
        fidObserver?.disconnect();
        clsObserver?.disconnect();
        inpObserver?.disconnect();
      };
    };
    
    // Start Web Vitals monitoring
    const cleanupWebVitals = observeWebVitals();
    
    // Call onMetricsChange callback when metrics update
    const metricsInterval = setInterval(() => {
      onMetricsChange?.(metrics);
    }, monitoringFrequency);
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(memoryInterval);
      clearInterval(metricsInterval);
      cleanupWebVitals();
    };
  }, [
    isMobile,
    onMetricsChange,
    onPerformanceIssue,
    monitoringFrequency,
    thresholds,
    metrics,
  ]);
  
  // Toggle performance overlay (for development)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle overlay with Ctrl+Shift+P
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShowPerfOverlay(prev => !prev);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div 
      className={cn(
        'performance-monitored',
        className
      )}
    >
      {children}
      
      {/* Performance metrics overlay (only visible in dev mode) */}
      {showPerfOverlay && (
        <div className="fixed bottom-0 left-0 bg-black/80 text-white p-2 text-xs z-50 font-mono">
          <div>FPS: {metrics.fps}</div>
          {metrics.memory && (
            <div>
              Mem: {Math.round(metrics.memory.usedJSHeapSize / 1024 / 1024)}MB / 
              {Math.round(metrics.memory.jsHeapSizeLimit / 1024 / 1024)}MB
            </div>
          )}
          <div>Device: {metrics.deviceTier}</div>
          {metrics.connection && (
            <div>
              Net: {metrics.connection.effectiveType} ({metrics.connection.downlink}Mbps)
            </div>
          )}
          <div>
            Vitals: LCP={metrics.coreWebVitals.lcp?.toFixed(0) || 'N/A'}ms, 
            CLS={metrics.coreWebVitals.cls?.toFixed(3) || 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;