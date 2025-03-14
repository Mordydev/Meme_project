'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import performanceMonitor from './metrics';

/**
 * Asset optimization types
 */
export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallback?: string;
  lowQualityPlaceholder?: boolean;
  lazyLoadingThreshold?: number;
}

export interface FontOptimizerProps {
  fonts: FontDefinition[];
  strategy?: 'swap' | 'optional' | 'block' | 'fallback';
  preloadFonts?: string[];
  disableLayoutShift?: boolean;
  children: React.ReactNode;
}

export interface FontDefinition {
  family: string;
  weight?: string | number;
  style?: string;
  display?: 'swap' | 'optional' | 'block' | 'fallback';
  preload?: boolean;
  url?: string;
  variable?: string;
}

/**
 * Optimized Image component with performance tracking
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  quality = 80,
  priority = false,
  loading = 'lazy',
  fallback,
  lowQualityPlaceholder = false,
  lazyLoadingThreshold = 300,
  className,
  style,
  ...rest
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const loadingStartTimeRef = useRef<number>(0);

  // Set image formats based on browser support
  const imageFormats = detectImageFormats();

  // Determine best image format
  const getOptimizedSrc = (originalSrc: string): string => {
    // If we're using Next.js Image component, it will handle format conversion
    // This is mostly for external images that might not be optimized
    if (originalSrc.startsWith('data:') || originalSrc.includes('?')) {
      return originalSrc;
    }

    // Check if URL already has an image optimization service
    if (originalSrc.includes('.cdn.com') || originalSrc.includes('/cdn-cgi/image/')) {
      return originalSrc;
    }

    // For absolute URLs that aren't from our domain, return as is
    if (originalSrc.startsWith('http') && !originalSrc.includes(window.location.host)) {
      return originalSrc;
    }

    // Otherwise, assume it's a local image that Next.js Image can handle
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);

  // Start measuring load time
  useEffect(() => {
    loadingStartTimeRef.current = performance.now();
    return () => {
      // Track unmounted images for debugging
      if (!isLoaded && !error) {
        performanceMonitor.trackEvent('image', 'unmounted-before-load', loadingStartTimeRef.current > 0 ? performance.now() - loadingStartTimeRef.current : 0);
      }
    };
  }, [isLoaded, error]);

  // Use intersection observer for more efficient lazy loading
  useEffect(() => {
    if (loading !== 'lazy' || !imageRef.current || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Preload the image when it's close to viewport
            const img = new Image();
            img.src = optimizedSrc;
            observer.disconnect();
          }
        });
      },
      { rootMargin: `${lazyLoadingThreshold}px` }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [optimizedSrc, loading, priority, lazyLoadingThreshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    
    // Measure and report loading time
    if (loadingStartTimeRef.current > 0) {
      const loadTime = performance.now() - loadingStartTimeRef.current;
      performanceMonitor.trackEvent('image', 'loaded', loadTime);
    }
  };

  const handleError = () => {
    setError(true);
    performanceMonitor.trackEvent('image', 'error', 0);
  };

  return (
    <div 
      className={`relative ${className || ''}`}
      style={{ ...style }}
      ref={imageRef}
    >
      {/* Low quality placeholder if enabled */}
      {lowQualityPlaceholder && !isLoaded && !error && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ 
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Next.js Image component with optimization */}
      <Image
        src={error && fallback ? fallback : optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.2s',
          ...style
        }}
        {...rest}
      />
    </div>
  );
}

/**
 * Font Optimizer component
 */
export function FontOptimizer({
  fonts,
  strategy = 'swap',
  preloadFonts = [],
  disableLayoutShift = true,
  children
}: FontOptimizerProps) {
  useEffect(() => {
    // Measure font loading performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const fontResources = performance
        .getEntriesByType('resource')
        .filter(({ name }) => name.includes('.woff') || name.includes('.woff2') || name.includes('.ttf'));
      
      if (fontResources.length > 0) {
        const totalFontSize = fontResources.reduce((sum, resource: any) => sum + (resource.encodedBodySize || 0), 0) / 1024;
        const maxDuration = Math.max(...fontResources.map(resource => resource.duration));
        
        performanceMonitor.trackEvent('font', 'loaded', maxDuration);
        performanceMonitor.trackEvent('font', 'size', totalFontSize);
      }
    }
  }, []);

  // Font display strategy - helps control FOUT/FOIT
  const getFontDisplayStrategy = (font: FontDefinition): string => {
    return font.display || strategy;
  };

  return (
    <>
      {/* Font preload links */}
      {typeof window !== 'undefined' && (
        <style jsx global>{`
          /* Font optimization */
          ${disableLayoutShift ? `
          html {
            font-display: ${strategy};
          }
          ` : ''}

          /* Custom font definitions */
          ${fonts.map(font => `
          @font-face {
            font-family: '${font.family}';
            font-weight: ${font.weight || 'normal'};
            font-style: ${font.style || 'normal'};
            font-display: ${getFontDisplayStrategy(font)};
            ${font.url ? `src: url('${font.url}') format('woff2');` : ''}
          }
          `).join('\n')}
        `}</style>
      )}
      {children}
    </>
  );
}

/**
 * Provides resource hints for faster loading
 */
export function ResourceHints({ resources }: { resources: Array<{ url: string, hint: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch', as?: string }> }) {
  return (
    <>
      {resources.map((resource, index) => {
        if (resource.hint === 'preload') {
          return (
            <link 
              key={index}
              rel="preload" 
              href={resource.url} 
              as={resource.as || 'script'} 
            />
          );
        } else if (resource.hint === 'prefetch') {
          return (
            <link 
              key={index}
              rel="prefetch" 
              href={resource.url} 
            />
          );
        } else if (resource.hint === 'preconnect') {
          return (
            <link 
              key={index}
              rel="preconnect" 
              href={resource.url} 
              crossOrigin="anonymous"
            />
          );
        } else if (resource.hint === 'dns-prefetch') {
          return (
            <link 
              key={index}
              rel="dns-prefetch" 
              href={resource.url} 
            />
          );
        }
        return null;
      })}
    </>
  );
}

/**
 * Helper function to detect supported image formats
 */
function detectImageFormats(): string[] {
  if (typeof document === 'undefined') {
    return ['webp', 'jpg'];
  }

  const formats = ['jpg', 'png']; // Default formats

  // Check for WebP support
  const webpTest = document.createElement('canvas');
  if (webpTest.getContext && webpTest.getContext('2d')) {
    if (webpTest.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      formats.unshift('webp');
    }
  }

  // Check for AVIF support
  const avifTest = new Image();
  avifTest.onload = () => {
    if (avifTest.width > 0 && avifTest.height > 0) {
      formats.unshift('avif');
    }
  };
  avifTest.onerror = () => {
    // AVIF not supported
  };
  avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';

  return formats;
}

/**
 * Lazy-loaded media component
 */
export function LazyMedia({ 
  children, 
  threshold = 300 
}: { 
  children: React.ReactNode, 
  threshold?: number 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={containerRef}>
      {isVisible ? children : <div className="bg-gray-200 animate-pulse" style={{ height: '200px' }} />}
    </div>
  );
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(images: string[]): void {
  if (typeof document === 'undefined') return;
  
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    performanceMonitor.trackEvent('image', 'preload', 0);
  });
}

/**
 * Asynchronously load script
 */
export function loadScript(src: string, async = true, defer = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }
    
    // Check if script already exists
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    
    script.onload = () => {
      performanceMonitor.trackEvent('script', 'loaded', 0);
      resolve();
    };
    
    script.onerror = () => {
      performanceMonitor.trackEvent('script', 'error', 0);
      reject(new Error(`Failed to load script: ${src}`));
    };
    
    document.body.appendChild(script);
  });
}
