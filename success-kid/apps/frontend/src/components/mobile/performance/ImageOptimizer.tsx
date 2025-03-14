'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { useNetwork } from '@/hooks/useNetwork';
import { useViewport } from '@/hooks/useViewport';

export interface ImageQualityTier {
  width: number;
  quality: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

export interface ImageOptimizationSettings {
  high: ImageQualityTier;
  medium: ImageQualityTier;
  low: ImageQualityTier;
}

export interface ImageOptimizerProps extends Omit<ImageProps, 'quality'> {
  lowQualityPlaceholder?: string;
  placeholderSize?: number;
  lazyBoundary?: string;
  qualitySettings?: Partial<ImageOptimizationSettings>;
  loadingStrategy?: 'eager' | 'lazy' | 'progressive';
  className?: string;
  containerClassName?: string;
  fadeInDuration?: number;
  dataSaver?: boolean;
  optimizationDisabled?: boolean;
}

/**
 * Component that optimizes image loading based on device capabilities,
 * network conditions, and user preferences.
 */
export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  lowQualityPlaceholder,
  placeholderSize = 10,
  lazyBoundary = '200px',
  qualitySettings,
  loadingStrategy = 'progressive',
  className,
  containerClassName,
  fadeInDuration = 300,
  dataSaver = false,
  optimizationDisabled = false,
  priority = false,
  ...props
}) => {
  const network = useNetwork();
  const { isMobile } = useViewport();
  const [loaded, setLoaded] = useState(false);
  const [useLowQuality, setUseLowQuality] = useState(false);
  const [useProgressive, setUseProgressive] = useState(loadingStrategy === 'progressive');
  
  // Default quality settings
  const defaultQualitySettings: ImageOptimizationSettings = {
    high: { width: Number(width) || 0, quality: 90, format: 'webp' },
    medium: { width: Number(width) * 0.75 || 0, quality: 75, format: 'webp' },
    low: { width: Number(width) * 0.5 || 0, quality: 60, format: 'webp' },
  };
  
  // Merge default and provided settings
  const settings = {
    high: { ...defaultQualitySettings.high, ...qualitySettings?.high },
    medium: { ...defaultQualitySettings.medium, ...qualitySettings?.medium },
    low: { ...defaultQualitySettings.low, ...qualitySettings?.low },
  };
  
  // Determine quality tier based on network conditions and user preferences
  useEffect(() => {
    // Skip optimization if explicitly disabled or priority is set
    if (optimizationDisabled || priority) {
      setUseLowQuality(false);
      setUseProgressive(false);
      return;
    }
    
    // Use low quality settings in these cases:
    const shouldUseLowQuality = 
      // User has data saver enabled
      (network.saveData || dataSaver) ||
      // Connection is poor or offline
      (network.downlink > 0 && network.downlink < 1.5) ||
      network.connectionType === '2g' ||
      network.connectionType === 'slow' ||
      // Effective connection type indicates slow connection
      network.effectiveConnectionType === '2g' ||
      network.effectiveConnectionType === 'slow-2g';
    
    setUseLowQuality(shouldUseLowQuality);
    
    // Only use progressive loading for slow connections and if strategy allows
    setUseProgressive(
      loadingStrategy === 'progressive' &&
      (shouldUseLowQuality || !network.isOnline)
    );
  }, [
    network.saveData,
    network.downlink,
    network.connectionType,
    network.effectiveConnectionType,
    network.isOnline,
    dataSaver,
    optimizationDisabled,
    loadingStrategy,
    priority,
  ]);
  
  // Get appropriate quality settings
  const getQualitySettings = () => {
    if (useLowQuality) return settings.low;
    if (isMobile) return settings.medium;
    return settings.high;
  };
  
  const qualityTier = getQualitySettings();
  
  // Handle image load completion
  const handleLoad = () => {
    setLoaded(true);
  };
  
  // Responsive sizing
  const calculateSizes = () => {
    if (props.sizes) return props.sizes;
    
    // Default responsive sizes if not specified
    return isMobile
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : '(max-width: 1024px) 50vw, 33vw';
  };
  
  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={{ 
        width: props.fill ? '100%' : undefined,
        height: props.fill ? '100%' : undefined,
      }}
    >
      {/* Low quality placeholder for progressive loading */}
      {useProgressive && lowQualityPlaceholder && !loaded && (
        <div
          className="absolute inset-0 bg-center bg-cover filter blur-md scale-110"
          style={{
            backgroundImage: `url(${lowQualityPlaceholder})`,
            opacity: loaded ? 0 : 1,
            transition: `opacity ${fadeInDuration}ms ease-out`,
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <Image
        src={src}
        alt={alt}
        width={qualityTier.width || undefined}
        height={height}
        quality={qualityTier.quality}
        className={cn(
          useProgressive && 'transition-opacity duration-300',
          useProgressive && !loaded && 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        loading={priority ? undefined : (loadingStrategy === 'eager' ? 'eager' : 'lazy')}
        priority={priority}
        sizes={calculateSizes()}
        lazyBoundary={lazyBoundary}
        {...props}
      />
    </div>
  );
};

export default ImageOptimizer;