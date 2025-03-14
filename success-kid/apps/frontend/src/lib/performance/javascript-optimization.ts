'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import performanceMonitor from './metrics';

/**
 * Types for JavaScript optimization
 */
export interface LazyComponentProps {
  component: () => Promise<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  props?: Record<string, any>;
  onLoad?: () => void;
}

export interface BundleAnalysisItem {
  name: string;
  size: number;
  type: 'component' | 'library' | 'utility';
  path: string;
}

export interface BundleAnalysis {
  totalSize: number;
  components: BundleAnalysisItem[];
  libraries: BundleAnalysisItem[];
  utilities: BundleAnalysisItem[];
}

export interface DependencyNode {
  name: string;
  size: number;
  dependencies: DependencyNode[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  root: string;
}

export interface Optimization {
  type: 'splitting' | 'removal' | 'replacement' | 'reduction';
  target: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Lazy component loader with performance tracking
 */
export function LazyComponentLoader({
  component,
  fallback = <div className="animate-pulse bg-gray-100 rounded-md min-h-24" />,
  onError,
  props = {},
  onLoad
}: LazyComponentProps) {
  const [loadStartTime] = useState<number>(performance.now());
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadComponent = async () => {
      try {
        // Dynamically import the component
        const importedComponent = await component();
        const loadTime = performance.now() - loadStartTime;
        
        // Track performance
        performanceMonitor.trackEvent('lazyload', 'componentLoaded', loadTime);
        
        // If still mounted, update state
        if (isMounted) {
          setComponent(() => importedComponent.default || importedComponent);
          if (onLoad) onLoad();
        }
      } catch (err) {
        console.error('Error loading component:', err);
        
        // Track error
        performanceMonitor.trackEvent('lazyload', 'error', performance.now() - loadStartTime);
        
        if (isMounted) {
          setError(err as Error);
          if (onError) onError(err as Error);
        }
      }
    };
    
    loadComponent();
    
    return () => {
      isMounted = false;
    };
  }, [component, loadStartTime, onError, onLoad]);
  
  if (error) {
    return (
      <div className="p-4 border-l-4 border-alert bg-alert/10 text-alert">
        <h3 className="font-semibold">Error loading component</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  if (!Component) return <>{fallback}</>;
  
  return <Component {...props} />;
}

/**
 * Create a lazy-loaded component with Suspense
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: { chunkName?: string } = {}
) {
  // Start tracking the load
  const startTime = performance.now();
  
  // Create the lazy component
  const LazyComponent = lazy(() => {
    return importFunc().then(module => {
      // Track the load time
      const loadTime = performance.now() - startTime;
      performanceMonitor.trackEvent('lazyload', options.chunkName || 'unknown', loadTime);
      return module;
    }).catch(error => {
      // Track the error
      performanceMonitor.trackEvent('lazyload', 'error', performance.now() - startTime);
      throw error;
    });
  });
  
  // Return a wrapper that includes Suspense with a default fallback
  return function LazyComponentWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-md min-h-24" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Dynamic import with performance tracking
 */
export function trackableImport<T>(importFunc: () => Promise<T>, name: string): Promise<T> {
  const startTime = performance.now();
  
  return importFunc()
    .then(module => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.trackEvent('import', name, loadTime);
      return module;
    })
    .catch(error => {
      performanceMonitor.trackEvent('import', 'error', performance.now() - startTime);
      throw error;
    });
}

/**
 * Function to analyze bundle composition (mocked implementation)
 * In a real implementation, this would be integrated with Webpack Bundle Analyzer
 * and would provide actual data about the bundle composition
 */
export function analyzeBundle(): BundleAnalysis {
  // This is a mock implementation
  // In production, this would be replaced with data from webpack-bundle-analyzer
  // or a similar tool integrated into the build process
  
  return {
    totalSize: 950,  // in KB
    components: [
      { name: 'Button', size: 15, type: 'component', path: 'components/ui/button.tsx' },
      { name: 'Card', size: 12, type: 'component', path: 'components/ui/card.tsx' },
      // ... more components
    ],
    libraries: [
      { name: 'react', size: 120, type: 'library', path: 'node_modules/react' },
      { name: 'framer-motion', size: 95, type: 'library', path: 'node_modules/framer-motion' },
      // ... more libraries
    ],
    utilities: [
      { name: 'date-helpers', size: 25, type: 'utility', path: 'lib/date-helpers.ts' },
      { name: 'format-utils', size: 18, type: 'utility', path: 'lib/format-utils.ts' },
      // ... more utilities
    ]
  };
}

/**
 * Function to get dependency graph (mocked implementation)
 */
export function getDependencyGraph(): DependencyGraph {
  // This is a mock implementation
  // In production, this would be replaced with actual dependency graph data
  
  return {
    root: 'app',
    nodes: [
      {
        name: 'app',
        size: 250,
        dependencies: [
          {
            name: 'react',
            size: 120,
            dependencies: []
          },
          {
            name: 'components',
            size: 350,
            dependencies: [
              {
                name: 'ui',
                size: 200,
                dependencies: []
              },
              {
                name: 'layout',
                size: 150,
                dependencies: []
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Function to get component sizes (mocked implementation)
 */
export function getComponentSizes(): Record<string, number> {
  // This is a mock implementation
  // In production, this would be integrated with build tools
  
  return {
    'Button': 15,
    'Card': 12,
    'PointsDisplay': 35,
    'MilestoneTracker': 48,
    'UserProfile': 62
  };
}

/**
 * Function to suggest optimizations (mocked implementation)
 */
export function suggestOptimizations(): Optimization[] {
  // This is a mock implementation
  // In production, this would analyze actual bundle data
  
  return [
    {
      type: 'splitting',
      target: 'dashboard',
      description: 'Split dashboard components into separate chunks',
      potentialSavings: 120,
      effort: 'medium'
    },
    {
      type: 'removal',
      target: 'unused-icons',
      description: 'Remove unused icon imports from design system',
      potentialSavings: 85,
      effort: 'low'
    },
    {
      type: 'replacement',
      target: 'date-fns',
      description: 'Replace date-fns with lighter alternative for basic date formatting',
      potentialSavings: 45,
      effort: 'medium'
    }
  ];
}

/**
 * Tree-shakable utility to prevent importing entire libraries
 */
export const utilities = {
  formatDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  },
  
  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  },
  
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  
  truncateText: (text: string, length: number): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
};

/**
 * Safely get nested properties without causing errors
 * (prevents common runtime errors that impact performance)
 */
export function getNestedValue<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current === undefined ? defaultValue : current;
}

/**
 * Helper to create proper dependency arrays for useEffect/useMemo
 * Prevents common issues with dependency arrays that cause excessive rerenders
 */
export function createDependencyArray(deps: any[]): any[] {
  // Filter out functions that might change identity
  // and replace with stable versions of their dependencies
  return deps.filter(dep => 
    typeof dep !== 'function' && 
    dep !== undefined && 
    dep !== null
  );
}
