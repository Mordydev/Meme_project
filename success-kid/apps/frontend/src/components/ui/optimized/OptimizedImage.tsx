'use client';

/**
 * Optimized Image Component
 * 
 * High-performance image component with advanced optimization features:
 * - Responsive image loading with srcset and sizes
 * - Modern format support (WebP, AVIF) with fallbacks
 * - Lazy loading with blur placeholders
 * - Art direction support
 * - Intelligent loading priority based on viewport position
 */
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  getResponsiveImageProps, 
  getOptimalQuality, 
  isLCPCandidate 
} from '@/lib/optimization/image-optimization';
import { cn } from '@/lib/utils';
import { reportResourcePerformance } from '@/lib/optimization/performance-monitoring';

export interface OptimizedImageProps {
  /** Image source URL */
  src: string;
  
  /** Alternative text for accessibility */
  alt: string;
  
  /** Width of the image in pixels */
  width: number;
  
  /** Height of the image in pixels */
  height?: number;
  
  /** CSS class names */
  className?: string;
  
  /** Whether to fill container dimensions */
  fill?: boolean;
  
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  
  /** Object position style */
  objectPosition?: string;
  
  /** Whether to prioritize loading */
  priority?: boolean;
  
  /** Whether to enable blur placeholder */
  blur?: boolean;
  
  /** Whether to add rounded corners */
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  
  /** CSS styles */
  style?: React.CSSProperties;
  
  /** Whether to qualify as an LCP image */
  isLCP?: boolean;
  
  /** Aspect ratio */
  aspectRatio?: string;
  
  /** Image sizes attribute */
  sizes?: string;
  
  /** Whether to lazy load */
  loading?: 'lazy' | 'eager';
  
  /** Media queries for art direction */
  media?: Record<string, { width: number; height?: number }>;
  
  /** Quality setting (1-100) */
  quality?: number;
  
  /** onClick handler */
  onClick?: () => void;
  
  /** onLoad handler */
  onLoad?: () => void;
  
  /** onError handler */
  onError?: () => void;
}

/**
 * Optimized Image Component
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  priority = false,
  blur = true,
  rounded = false,
  style,
  isLCP,
  aspectRatio,
  sizes,
  loading,
  media,
  quality,
  onClick,
  onLoad,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isHighDensity, setIsHighDensity] = useState(false);
  const [connectionType, setConnectionType] = useState<string | undefined>(undefined);
  
  // Format class name based on rounded prop
  const roundedClass = rounded
    ? rounded === true
      ? 'rounded'
      : `rounded-${rounded}`
    : '';
  
  // Get base size options for responsive images
  const sizeVariants = [
    { width: width, height },
    { width: Math.floor(width * 1.5), height: height ? Math.floor(height * 1.5) : undefined },
    { width: width * 2, height: height ? height * 2 : undefined },
  ];
  
  // Set up connection and display detection
  useEffect(() => {
    // Check for high-density display
    setIsHighDensity(window.devicePixelRatio > 1);
    
    // Check for connection type if available
    if ('connection' in navigator && (navigator as any).connection) {
      setConnectionType((navigator as any).connection.effectiveType);
      
      // Listen for connection changes
      const updateConnectionType = () => {
        setConnectionType((navigator as any).connection.effectiveType);
      };
      
      (navigator as any).connection.addEventListener('change', updateConnectionType);
      
      return () => {
        (navigator as any).connection.removeEventListener('change', updateConnectionType);
      };
    }
  }, []);
  
  // Calculate optimal quality based on device and connection
  const optimalQuality = quality ?? getOptimalQuality({
    isHighDensity,
    connection: connectionType as any,
  });
  
  // Determine if image is likely an LCP candidate
  const shouldPrioritize = priority || isLCP || (imageRef.current && isLCPCandidate({
    top: imageRef.current.getBoundingClientRect().top,
    width: imageRef.current.offsetWidth,
    height: imageRef.current.offsetHeight,
  }));
  
  // Set loading strategy
  const loadingStrategy = loading ?? (shouldPrioritize ? 'eager' : 'lazy');
  
  // Handle image load
  const handleLoad = () => {
    setLoaded(true);
    
    // Report resource performance
    if (imageRef.current) {
      reportResourcePerformance(imageRef.current);
    }
    
    // Call custom onLoad handler if provided
    if (onLoad) {
      onLoad();
    }
  };
  
  // Handle image error
  const handleError = () => {
    // Call custom onError handler if provided
    if (onError) {
      onError();
    }
  };
  
  // Render the optimized image
  return (
    <div 
      className={cn(
        'overflow-hidden', 
        aspectRatio ? `aspect-[${aspectRatio}]` : '',
        roundedClass,
        className
      )}
      style={{
        ...style,
        position: fill ? 'relative' : 'static',
      }}
      ref={imageRef}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height || Math.floor(width * (aspectRatio ? eval(aspectRatio) : 9/16))}
        className={cn(
          'transition-opacity duration-300',
          !loaded && blur ? 'opacity-0' : 'opacity-100',
          roundedClass
        )}
        style={{
          objectFit,
          objectPosition,
        }}
        fill={fill}
        priority={shouldPrioritize}
        loading={loadingStrategy}
        quality={optimalQuality}
        sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        placeholder={blur ? 'blur' : undefined}
        blurDataURL={blur ? `data:image/svg+xml;base64,${Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height || Math.floor(width * 0.5625)}" viewBox="0 0 ${width} ${height || Math.floor(width * 0.5625)}" fill="none">
            <rect width="${width}" height="${height || Math.floor(width * 0.5625)}" fill="#e1e1e1"/>
          </svg>`
        ).toString('base64')}` : undefined}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
