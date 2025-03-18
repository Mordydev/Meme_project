'use client';

import { 
  detectDeviceCapabilities, 
  getOptimalImageQuality, 
  getAnimationSettings 
} from './device-capabilities';

/**
 * Performance configuration object
 */
export interface PerformanceConfig {
  imageSizes: {
    thumbnail: number;
    small: number;
    medium: number;
    large: number;
  };
  imageQuality: number;
  imageFormat: 'webp' | 'jpeg' | 'png';
  lazyLoadOptions: {
    enabled: boolean;
    distance: number;
  };
  animations: {
    enabled: boolean;
    complexity: 'none' | 'minimal' | 'reduced' | 'full';
    frameThrottling: number | null;
  };
  infiniteScroll: {
    enabled: boolean;
    itemsPerPage: number;
    maxPages: number | null;
  };
  prefetching: {
    enabled: boolean;
    routes: boolean;
    data: boolean;
  };
  caching: {
    defaultTTL: number; // in seconds
    staticContentTTL: number;
    dynamicDataTTL: number;
  };
}

/**
 * Generate performance configuration based on device capabilities
 * 
 * @param reducedMotion Whether user prefers reduced motion
 * @param highContrastMode Whether user prefers high contrast
 * @returns Performance configuration object
 */
export function generatePerformanceConfig(
  reducedMotion: boolean = false,
  highContrastMode: boolean = false
): PerformanceConfig {
  // Detect device capabilities
  const capabilities = detectDeviceCapabilities();
  
  // Get image quality settings
  const imageSettings = getOptimalImageQuality(
    capabilities.tier,
    capabilities.connectionType
  );
  
  // Get animation settings
  const animationSettings = getAnimationSettings(
    capabilities.tier,
    reducedMotion,
    capabilities.batteryLevel
  );
  
  // Determine items per page based on device tier and connection
  let itemsPerPage = 20; // default
  if (capabilities.tier === 'low' || capabilities.connectionType === 'slow-2g' || capabilities.connectionType === '2g') {
    itemsPerPage = 10;
  } else if (capabilities.tier === 'high' && capabilities.connectionType !== '3g') {
    itemsPerPage = 30;
  }
  
  // Configure prefetching based on connection type
  const enablePrefetching = capabilities.connectionType !== 'slow-2g' && 
                           capabilities.connectionType !== '2g';
                           
  // Generate complete performance configuration
  const config: PerformanceConfig = {
    imageSizes: {
      thumbnail: Math.min(120 * capabilities.devicePixelRatio, 200),
      small: Math.min(320 * capabilities.devicePixelRatio, 600),
      medium: Math.min(640 * capabilities.devicePixelRatio, 1000),
      large: imageSettings.maxWidth
    },
    imageQuality: imageSettings.quality,
    imageFormat: imageSettings.format,
    lazyLoadOptions: {
      enabled: true,
      distance: imageSettings.lazyLoadDistance
    },
    animations: {
      enabled: animationSettings.enabled,
      complexity: animationSettings.complexity,
      frameThrottling: animationSettings.frameThrottling
    },
    infiniteScroll: {
      enabled: capabilities.tier !== 'low',
      itemsPerPage,
      maxPages: capabilities.tier === 'low' ? 5 : null
    },
    prefetching: {
      enabled: enablePrefetching,
      routes: enablePrefetching,
      data: capabilities.tier === 'high' && enablePrefetching
    },
    caching: {
      defaultTTL: 300, // 5 minutes
      staticContentTTL: 3600, // 1 hour
      dynamicDataTTL: capabilities.connectionType === '4g' ? 60 : 300 // 1 min for 4G, 5 min for slower
    }
  };

  return config;
}

/**
 * Apply performance optimizations to the application
 * 
 * @param config Performance configuration
 */
export function applyPerformanceOptimizations(config: PerformanceConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Set CSS variables for image sizes (can be used in CSS)
  document.documentElement.style.setProperty('--thumbnail-size', `${config.imageSizes.thumbnail}px`);
  document.documentElement.style.setProperty('--small-image-size', `${config.imageSizes.small}px`);
  document.documentElement.style.setProperty('--medium-image-size', `${config.imageSizes.medium}px`);
  document.documentElement.style.setProperty('--large-image-size', `${config.imageSizes.large}px`);
  
  // Set animation related CSS variables
  document.documentElement.style.setProperty(
    '--animation-enabled', 
    config.animations.enabled ? '1' : '0'
  );
  
  document.documentElement.style.setProperty(
    '--animation-complexity', 
    config.animations.complexity
  );
  
  // Apply frame throttling if specified
  if (config.animations.frameThrottling) {
    // Implement a simple frame throttling mechanism (in a real app, this would be more sophisticated)
    const targetFps = config.animations.frameThrottling;
    const frameTime = 1000 / targetFps;
    
    // This is a simplified approach and would need to be carefully implemented in a real app
    // to avoid causing more issues than it solves
    console.log(`Setting frame throttling to target ${targetFps}fps`);
  }
}

/**
 * Get optimal image source attributes for a given image
 * 
 * @param originalSrc Original image source
 * @param config Performance configuration
 * @param size Desired image size
 * @returns Object with src, srcSet and sizes attributes
 */
export function getOptimizedImageSrc(
  originalSrc: string,
  config: PerformanceConfig,
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
): {
  src: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
} {
  // This is a simplified implementation that would be replaced with actual image optimization logic
  // In a real app, this would likely use a CDN with image optimization capabilities
  
  // Determine the base width for this size
  const width = config.imageSizes[size];
  
  // In a real implementation, we would transform the URL to include optimization parameters
  // For this example, we'll just return the original with a mock parameter
  const optimizedSrc = `${originalSrc}?width=${width}&quality=${config.imageQuality}&format=${config.imageFormat}`;
  
  // In a full implementation, we'd generate a proper srcSet with multiple resolutions
  const srcSet = `
    ${originalSrc}?width=${width / 2}&quality=${config.imageQuality}&format=${config.imageFormat} ${width / 2}w,
    ${originalSrc}?width=${width}&quality=${config.imageQuality}&format=${config.imageFormat} ${width}w,
    ${originalSrc}?width=${width * 2}&quality=${config.imageQuality}&format=${config.imageFormat} ${width * 2}w
  `.trim();
  
  // Determine loading attribute based on size and lazyload settings
  const loading = config.lazyLoadOptions.enabled && size !== 'thumbnail' ? 'lazy' : 'eager';
  
  return {
    src: optimizedSrc,
    srcSet,
    sizes: `(max-width: 768px) 100vw, ${width}px`,
    loading,
    width
  };
}

/**
 * Prefetch critical resources based on performance configuration
 * 
 * @param routes Array of routes to prefetch
 * @param config Performance configuration
 */
export function prefetchCriticalResources(
  routes: string[] = [],
  config: PerformanceConfig
): void {
  if (typeof window === 'undefined' || !config.prefetching.enabled) {
    return;
  }
  
  // Prefetch routes if enabled
  if (config.prefetching.routes && routes.length > 0) {
    // In Next.js, this would use Router.prefetch
    // For this example, we'll use link prefetching
    for (const route of routes) {
      const linkElement = document.createElement('link');
      linkElement.rel = 'prefetch';
      linkElement.href = route;
      document.head.appendChild(linkElement);
    }
  }
  
  // Prefetch critical API data if enabled
  if (config.prefetching.data) {
    // In a real app, this would prefetch critical API endpoints
    // This is just a placeholder
    console.log('Prefetching critical API data');
  }
}
