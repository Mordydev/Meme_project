'use client';

import React, { useEffect, useRef } from 'react';
import { monitoringService } from '@/lib/monitoring';

interface PerformanceMonitorProps {
  children: React.ReactNode;
  componentName: string;
  trackRenders?: boolean;
  trackInteractions?: boolean;
}

/**
 * Component for monitoring performance of specific UI sections
 * 
 * Tracks render time and optionally user interactions within a component.
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  children,
  componentName,
  trackRenders = true,
  trackInteractions = false,
}) => {
  const renderStartTimeRef = useRef<[number, number]>(process.hrtime());
  
  // Track initial render time
  useEffect(() => {
    if (!trackRenders) return;
    
    const [seconds, nanoseconds] = process.hrtime(renderStartTimeRef.current);
    const renderTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
    
    // Record render time
    monitoringService.recordEvent('component', 'render', componentName, renderTimeMs);
    
    // If render time is excessive, log a warning
    if (renderTimeMs > 100) {
      console.warn(`Slow render detected: ${componentName} took ${renderTimeMs.toFixed(2)}ms to render`);
    }
  }, [componentName, trackRenders]);
  
  // Set up interaction tracking
  useEffect(() => {
    if (!trackInteractions) return;
    
    // Create a container ref for the component
    const containerRef = document.getElementById(`performance-monitor-${componentName}`);
    if (!containerRef) return;
    
    // Track interactions within this component
    const handleInteraction = (event: Event) => {
      let target = event.target as HTMLElement;
      let targetId = target.id || '';
      let targetClass = target.className || '';
      
      // Try to find a more meaningful identifier
      while (target && (!targetId && !targetClass) && target !== containerRef) {
        target = target.parentElement as HTMLElement;
        if (target) {
          targetId = target.id || '';
          targetClass = target.className || '';
        }
      }
      
      const elementIdentifier = targetId || targetClass || 'unknown';
      monitoringService.trackInteraction(
        'click', 
        `${componentName}:${elementIdentifier}`,
        undefined,
        { event: event.type }
      );
    };
    
    // Add event listeners
    containerRef.addEventListener('click', handleInteraction, { capture: true });
    
    // Cleanup
    return () => {
      containerRef.removeEventListener('click', handleInteraction, { capture: true });
    };
  }, [componentName, trackInteractions]);
  
  // Wrap children in a div for interaction tracking
  if (trackInteractions) {
    return (
      <div id={`performance-monitor-${componentName}`} data-monitoring-component={componentName}>
        {children}
      </div>
    );
  }
  
  // Otherwise, just return children without wrapper
  return <>{children}</>;
};

export default PerformanceMonitor;