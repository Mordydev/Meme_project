'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePerformanceConfig } from '../../hooks/usePerformanceConfig';
import { getOptimizedImageSrc } from '../../lib/performance/performance-optimizations';

interface OptimizedImageProps {
  src: string;
  alt: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  className?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onClick?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  size = 'medium',
  className = '',
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onClick
}: OptimizedImageProps) {
  const performanceConfig = usePerformanceConfig();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageRef.current || !performanceConfig.lazyLoadOptions.enabled || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${performanceConfig.lazyLoadOptions.distance}px`,
        threshold: 0.01
      }
    );

    observer.observe(imageRef.current);

    return () => {
      observer.disconnect();
    };
  }, [performanceConfig.lazyLoadOptions.enabled, performanceConfig.lazyLoadOptions.distance, priority]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const { 
    src: optimizedSrc,
    srcSet,
    sizes,
    loading,
    width,
    height
  } = getOptimizedImageSrc(src, performanceConfig, size);

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: 'var(--image-aspect-ratio, 16/9)' }}
      onClick={onClick}
    >
      {(isInView || priority) && (
        <>
          {/* Blur placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          {/* Optimized image */}
          <Image
            src={optimizedSrc}
            alt={alt}
            fill={true}
            sizes={sizes}
            priority={priority}
            loading={priority ? 'eager' : loading}
            style={{
              objectFit,
              objectPosition,
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onLoad={handleImageLoad}
            unoptimized={false} // Let Next.js optimize the image
          />
        </>
      )}
    </div>
  );
}
