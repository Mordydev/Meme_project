/**
 * Dynamic Import Utilities
 * 
 * Helper functions for efficient dynamic imports and component loading.
 * Implements recommended patterns for code splitting and lazy loading.
 */
import { ComponentType, lazy, Suspense, ReactNode } from 'react';
import dynamic from 'next/dynamic';

/**
 * Configuration for dynamic imports
 */
export interface DynamicImportConfig {
  /** Component to show while loading */
  loading?: ComponentType | null;
  /** Whether to SSR the component */
  ssr?: boolean;
  /** Timeout for preloading in milliseconds */
  preloadTimeout?: number;
  /** Custom error component */
  errorComponent?: ComponentType<{ error: Error }>;
}

/**
 * Dynamically import a component with sensible defaults
 */
export function dynamicImport<P>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  config: DynamicImportConfig = {}
): ComponentType<P> {
  const {
    loading,
    ssr = true,
    preloadTimeout = 3000, // Default 3s timeout for preloading
  } = config;

  return dynamic(importFn, {
    loading,
    ssr,
  });
}

/**
 * Preload a component before it's needed (useful for hover preloading)
 */
export function preloadComponent(
  importFn: () => Promise<any>,
  timeout: number = 3000
): void {
  // Start loading after a short delay
  const timeoutId = setTimeout(() => {
    importFn().catch(err => {
      console.warn('Error preloading component:', err);
    });
  }, 20);

  // Cancel if it takes too long (avoid wasting resources)
  setTimeout(() => {
    clearTimeout(timeoutId);
  }, timeout);
}

/**
 * Dynamic component with React.lazy and Suspense
 */
export function lazyComponent<P>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null
): (props: P) => JSX.Element {
  const LazyComponent = lazy(importFn);

  return function LazyComponentWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Load multiple components in parallel and only render when all are ready
 */
export function parallelLoad(
  components: Record<string, () => Promise<{ default: ComponentType<any> }>>,
  fallback: ReactNode = null
): (props: Record<string, any>) => JSX.Element {
  // Convert each import function to a lazy component
  const lazyComponents = Object.entries(components).reduce(
    (acc, [key, importFn]) => ({
      ...acc,
      [key]: lazy(importFn),
    }),
    {} as Record<string, ComponentType<any>>
  );

  return function ParallelLoadWrapper(props: Record<string, any>) {
    return (
      <Suspense fallback={fallback}>
        {Object.entries(lazyComponents).map(([key, Component]) => (
          <Component key={key} {...props[key]} />
        ))}
      </Suspense>
    );
  };
}

/**
 * Common dynamic import patterns
 */
export const DynamicImports = {
  // Charts & Data Visualization (heavy components)
  LineChart: dynamicImport(() => import('@/components/charts/LineChart'), {
    loading: () => <div className="animate-pulse bg-gray-200 rounded h-64 w-full" />,
  }),
  
  BarChart: dynamicImport(() => import('@/components/charts/BarChart'), {
    loading: () => <div className="animate-pulse bg-gray-200 rounded h-64 w-full" />,
  }),
  
  PieChart: dynamicImport(() => import('@/components/charts/PieChart'), {
    loading: () => <div className="animate-pulse bg-gray-200 rounded h-64 w-full" />,
  }),
  
  // Complex interactive components
  RichTextEditor: dynamicImport(() => import('@/components/editors/RichTextEditor'), {
    ssr: false, // Client-side only
    loading: () => <div className="animate-pulse bg-gray-100 rounded h-32 w-full" />,
  }),
  
  DataTable: dynamicImport(() => import('@/components/tables/DataTable'), {
    loading: () => <div className="animate-pulse bg-gray-100 rounded h-96 w-full" />,
  }),
  
  // Modals and Dialogs
  ConfirmationDialog: dynamicImport(() => import('@/components/modals/ConfirmationDialog'), {
    ssr: false,
  }),
  
  FullScreenModal: dynamicImport(() => import('@/components/modals/FullScreenModal'), {
    ssr: false,
  }),
  
  // Media components
  MediaGallery: dynamicImport(() => import('@/components/media/MediaGallery'), {
    loading: () => <div className="animate-pulse bg-gray-200 rounded h-80 w-full" />,
  }),
  
  VideoPlayer: dynamicImport(() => import('@/components/media/VideoPlayer'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800 rounded h-64 w-full" />,
  }),
};

export default DynamicImports;
