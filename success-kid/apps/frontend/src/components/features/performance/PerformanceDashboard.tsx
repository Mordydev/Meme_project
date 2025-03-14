'use client';

import React, { useState, useEffect } from 'react';
import { usePerformance } from '@/lib/performance/context';
import performanceMonitor from '@/lib/performance/metrics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

/**
 * Performance Dashboard Component
 * 
 * Provides a visualization of current performance metrics and settings
 * for monitoring and adjusting performance optimization features.
 */
export default function PerformanceDashboard() {
  const {
    isMonitoringEnabled,
    toggleMonitoring,
    webVitals,
    performanceBudget,
    networkInfo,
    isPerformanceMode,
    setPerformanceMode,
  } = usePerformance();
  
  const [componentMetrics, setComponentMetrics] = useState<Record<string, any>>({});
  const [resourceMetrics, setResourceMetrics] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string>('web-vitals');
  
  // Get component and resource metrics
  useEffect(() => {
    if (!isMonitoringEnabled) return;
    
    // Update metrics every second
    const interval = setInterval(() => {
      // Get component metrics
      const componentData = Object.fromEntries(
        Array.from(performanceMonitor.getAllComponentMetrics())
      );
      setComponentMetrics(componentData);
      
      // Get resource metrics
      setResourceMetrics({
        jsSize: performanceMonitor.getJSBundleSize(),
        cssSize: performanceMonitor.getCSSSize(),
        imageSize: performanceMonitor.getImageSize(),
        resources: performanceMonitor.getResourceTimings().slice(0, 10),
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isMonitoringEnabled]);
  
  // Helper function to get status based on budget
  const getMetricStatus = (metric: string, value: number | null) => {
    if (value === null) return 'neutral';
    
    switch (metric) {
      case 'LCP':
        return value <= performanceBudget.maxLCP ? 'success' : 'error';
      case 'FCP':
        return value <= performanceBudget.maxFCP ? 'success' : 'error';
      case 'CLS':
        return value <= performanceBudget.maxCLS ? 'success' : 'error';
      case 'TTI':
        return value <= performanceBudget.maxTTI ? 'success' : 'error';
      case 'INP':
        return value <= performanceBudget.maxINP ? 'success' : 'error';
      default:
        return 'neutral';
    }
  };
  
  // Format ms value
  const formatMs = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}ms`;
  };
  
  // Format KB value
  const formatKB = (value: number) => {
    return `${value.toFixed(1)}KB`;
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Performance Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="mr-2">Network:</span>
            <Badge variant={networkInfo.isOnline ? 'success' : 'error'}>
              {networkInfo.isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge variant="neutral" className="ml-2">
              {networkInfo.effectiveType}
            </Badge>
            {networkInfo.saveData && (
              <Badge variant="warning" className="ml-2">
                Data Saver
              </Badge>
            )}
          </div>
          <Button
            variant={isMonitoringEnabled ? 'primary' : 'outline'}
            onClick={() => toggleMonitoring()}
            size="sm"
          >
            {isMonitoringEnabled ? 'Monitoring On' : 'Monitoring Off'}
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="bg-secondary/10 p-3 rounded-md">
          <h3 className="text-sm font-medium mb-2">Performance Mode</h3>
          <div className="flex gap-2">
            <Button
              variant={isPerformanceMode === 'high' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPerformanceMode('high')}
            >
              High Quality
            </Button>
            <Button
              variant={isPerformanceMode === 'balanced' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPerformanceMode('balanced')}
            >
              Balanced
            </Button>
            <Button
              variant={isPerformanceMode === 'data-saving' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPerformanceMode('data-saving')}
            >
              Data Saving
            </Button>
          </div>
        </div>
      </div>
      
      <TabGroup selectedIndex={activeTab === 'web-vitals' ? 0 : activeTab === 'components' ? 1 : 2} onChange={(index) => 
        setActiveTab(index === 0 ? 'web-vitals' : index === 1 ? 'components' : 'resources')
      }>
        <TabList className="mb-4">
          <Tab>Core Web Vitals</Tab>
          <Tab>Component Performance</Tab>
          <Tab>Resources</Tab>
        </TabList>
        
        <TabPanels>
          {/* Web Vitals Panel */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(webVitals).map(([key, value]) => (
                <Card key={key} className="p-4">
                  <h3 className="text-sm font-medium text-neutral-500">{key}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-semibold">
                      {key === 'CLS' ? (value !== null ? value.toFixed(3) : 'N/A') : formatMs(value)}
                    </span>
                    <Badge
                      variant={getMetricStatus(key, value)}
                      className="ml-2"
                    >
                      {getMetricStatus(key, value) === 'success' ? 'Good' : 
                       getMetricStatus(key, value) === 'error' ? 'Poor' : 'Measuring'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    {key === 'LCP' && `Target: ${formatMs(performanceBudget.maxLCP)}`}
                    {key === 'FCP' && `Target: ${formatMs(performanceBudget.maxFCP)}`}
                    {key === 'CLS' && `Target: ${performanceBudget.maxCLS}`}
                    {key === 'TTI' && `Target: ${formatMs(performanceBudget.maxTTI)}`}
                    {key === 'INP' && `Target: ${formatMs(performanceBudget.maxINP)}`}
                    {['FID', 'TTFB'].includes(key) && 'No target set'}
                  </p>
                </Card>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Resource Budgets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-neutral-500">JavaScript Size</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-semibold">
                      {formatKB(resourceMetrics.jsSize || 0)}
                    </span>
                    <Badge
                      variant={(resourceMetrics.jsSize || 0) <= performanceBudget.maxJSSize ? 'success' : 'error'}
                      className="ml-2"
                    >
                      {(resourceMetrics.jsSize || 0) <= performanceBudget.maxJSSize ? 'Under Budget' : 'Over Budget'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Budget: {formatKB(performanceBudget.maxJSSize)}
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-neutral-500">CSS Size</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-semibold">
                      {formatKB(resourceMetrics.cssSize || 0)}
                    </span>
                    <Badge
                      variant={(resourceMetrics.cssSize || 0) <= performanceBudget.maxCSSSize ? 'success' : 'error'}
                      className="ml-2"
                    >
                      {(resourceMetrics.cssSize || 0) <= performanceBudget.maxCSSSize ? 'Under Budget' : 'Over Budget'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Budget: {formatKB(performanceBudget.maxCSSSize)}
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-neutral-500">Image Size</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-semibold">
                      {formatKB(resourceMetrics.imageSize || 0)}
                    </span>
                    <Badge
                      variant={(resourceMetrics.imageSize || 0) <= performanceBudget.maxImageSize ? 'success' : 'error'}
                      className="ml-2"
                    >
                      {(resourceMetrics.imageSize || 0) <= performanceBudget.maxImageSize ? 'Under Budget' : 'Over Budget'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Budget: {formatKB(performanceBudget.maxImageSize)}
                  </p>
                </Card>
              </div>
            </div>
          </TabPanel>
          
          {/* Components Panel */}
          <TabPanel>
            <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Render Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Render Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Last Render
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {Object.entries(componentMetrics).length > 0 ? (
                    Object.entries(componentMetrics).map(([id, data]: [string, any]) => {
                      const budget = performanceBudget.componentBudgets[id];
                      const isOverBudget = budget && (
                        data.renderTime > budget.maxRenderTime ||
                        data.renderCount > budget.maxRenderCount
                      );
                      
                      return (
                        <tr key={id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {data.renderTime.toFixed(2)}ms
                            {budget && (
                              <span className="text-xs text-neutral-400 ml-2">
                                (Budget: {budget.maxRenderTime}ms)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {data.renderCount}
                            {budget && (
                              <span className="text-xs text-neutral-400 ml-2">
                                (Budget: {budget.maxRenderCount})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(data.lastRenderTimestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={isOverBudget ? 'error' : 'success'}
                              className="ml-2"
                            >
                              {isOverBudget ? 'Over Budget' : 'Good'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                        No component metrics available yet. Interact with the application to generate data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPanel>
          
          {/* Resources Panel */}
          <TabPanel>
            <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Load Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {resourceMetrics.resources?.length > 0 ? (
                    resourceMetrics.resources.map((resource: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                          <div className="truncate max-w-xs">
                            {resource.resourceName.split('/').pop()}
                          </div>
                          <div className="text-xs text-neutral-400 truncate max-w-xs">
                            {resource.resourceName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {resource.initiatorType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {(resource.transferSize / 1024).toFixed(1)}KB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {(resource.responseEnd - resource.startTime).toFixed(1)}ms
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">
                        No resource metrics available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
