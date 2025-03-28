/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing image loading and display
 * to improve performance and user experience.
 */

/**
 * Image size variant
 */
export type ImageSizeVariant = {
  /** Width of image variant in pixels */
  width: number;
  
  /** Height of image variant in pixels (optional for responsive) */
  height?: number;
  
  /** Quality of image variant (1-100) */
  quality?: number;
}

/**
 * Responsive image configuration
 */
export interface ResponsiveImageConfig {
  /** Base image URL */
  src: string;
  
  /** Alternative text for accessibility */
  alt: string;
  
  /** Size variants for responsive loading */
  sizes: ImageSizeVariant[];
  
  /** Image formats to generate (webp, avif, etc.) */
  formats?: Array<'webp' | 'avif' | 'jpg' | 'png'>;
  
  /** Media queries for art direction */
  media?: Record<string, ImageSizeVariant>;
  
  /** Whether to lazy load the image */
  lazyLoad?: boolean;
  
  /** Whether to prioritize loading (for LCP images) */
  priority?: boolean;
  
  /** Whether to blur while loading */
  blur?: boolean;
}

/**
 * Generate srcSet attribute for responsive images
 * 
 * @param baseSrc Base image URL
 * @param sizes Array of size variants
 * @param format Image format (webp, avif, etc.)
 * @returns Formatted srcSet attribute value
 */
export function generateSrcSet(
  baseSrc: string,
  sizes: ImageSizeVariant[],
  format?: string
): string {
  // Sort sizes by width
  const sortedSizes = [...sizes].sort((a, b) => a.width - b.width);
  
  // Generate srcSet entries
  const srcSetEntries = sortedSizes.map(size => {
    // Build URL with width parameter
    let url = `${baseSrc}?w=${size.width}`;
    
    // Add height if specified
    if (size.height) {
      url += `&h=${size.height}`;
    }
    
    // Add quality if specified
    if (size.quality) {
      url += `&q=${size.quality}`;
    }
    
    // Add format if specified
    if (format) {
      url += `&fm=${format}`;
    }
    
    // Return formatted srcSet entry
    return `${url} ${size.width}w`;
  });
  
  return srcSetEntries.join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * 
 * @param breakpoints Breakpoint configurations
 * @returns Formatted sizes attribute value
 */
export function generateSizes(
  breakpoints: Record<string, string> = {}
): string {
  // Default sizes if no breakpoints provided
  if (Object.keys(breakpoints).length === 0) {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
  
  // Generate sizes entries
  const sizesEntries = Object.entries(breakpoints).map(([breakpoint, size]) => {
    return `${breakpoint} ${size}`;
  });
  
  // Add default size for unspecified breakpoints
  sizesEntries.push('100vw');
  
  return sizesEntries.join(', ');
}

/**
 * Get placeholder color for LQIP (Low Quality Image Placeholder)
 * 
 * In a real implementation, this would extract the dominant color from the image.
 * For this example, we're returning a neutral gray placeholder.
 * 
 * @param src Image URL
 * @returns CSS color value for placeholder
 */
export function getPlaceholderColor(src: string): string {
  // In a real implementation, extract dominant color from image
  // For now, return a neutral gray
  return '#e1e1e1';
}

/**
 * Generate blur data URL for progressive loading
 * 
 * In a real implementation, this would generate a tiny base64 version of the image.
 * For this example, we're returning a data URL for a simple SVG placeholder.
 * 
 * @param width Image width
 * @param height Image height
 * @param color Placeholder color (optional)
 * @returns Base64 data URL for placeholder
 */
export function generateBlurDataURL(
  width: number,
  height: number,
  color: string = '#e1e1e1'
): string {
  // Create a simple SVG rectangle with the given dimensions and color
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`;
  
  // Convert to base64
  const base64 = Buffer.from(svg).toString('base64');
  
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Check if image is a potential LCP (Largest Contentful Paint) candidate
 * 
 * @param position Image position info
 * @returns Whether image should be prioritized
 */
export function isLCPCandidate(position: {
  /** Position from top of page (px) */
  top: number;
  
  /** Image width (px) */
  width: number;
  
  /** Image height (px) */
  height: number;
}): boolean {
  // If image is in the top 500px of the page and relatively large
  return position.top < 500 && position.width * position.height > 40000;
}

/**
 * Calculate appropriate image quality based on device and connection
 * 
 * @param context Image display context
 * @returns Optimal quality (1-100)
 */
export function getOptimalQuality(context: {
  /** Whether image is for a high-density display */
  isHighDensity: boolean;
  
  /** Network connection type if available */
  connection?: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
}): number {
  // Base quality
  let quality = 80;
  
  // Adjust for high-density displays
  if (context.isHighDensity) {
    quality += 5; // Higher quality for high-density displays
  }
  
  // Adjust for network conditions
  if (context.connection) {
    switch (context.connection) {
      case 'slow-2g':
      case '2g':
        quality = Math.min(quality, 60); // Lower quality for very slow connections
        break;
      case '3g':
        quality = Math.min(quality, 75); // Moderate quality for 3G
        break;
      // Keep default for 4G or faster
    }
  }
  
  return quality;
}

/**
 * Generate responsive picture element props for optimal image loading
 * 
 * @param config Responsive image configuration
 * @returns Props for responsive picture element
 */
export function getResponsiveImageProps(config: ResponsiveImageConfig): {
  /** Props for picture element sources */
  sources: Array<{
    type: string;
    srcSet: string;
    sizes: string;
    media?: string;
  }>;
  
  /** Props for fallback img element */
  img: {
    src: string;
    alt: string;
    width: number;
    height?: number;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    sizes: string;
    srcSet: string;
    style?: Record<string, string>;
    onLoad?: string;
  };
} {
  // Set defaults
  const formats = config.formats || ['webp', 'jpg'];
  const sizes = config.sizes || [
    { width: 640 },
    { width: 750 },
    { width: 828 },
    { width: 1080 },
    { width: 1200 },
    { width: 1920 }
  ];
  const lazyLoad = config.lazyLoad !== false;
  const priority = config.priority || false;
  
  // Get the largest size for default
  const largestSize = [...sizes].sort((a, b) => b.width - a.width)[0];
  
  // Generate sizes attribute
  const sizesAttr = generateSizes();
  
  // Generate sources for different formats
  const sources = formats.map(format => {
    // Skip the last format which will be the fallback
    if (format === formats[formats.length - 1]) {
      return null;
    }
    
    return {
      type: `image/${format}`,
      srcSet: generateSrcSet(config.src, sizes, format),
      sizes: sizesAttr
    };
  }).filter(Boolean);
  
  // Add media queries if specified
  if (config.media) {
    Object.entries(config.media).forEach(([mediaQuery, size]) => {
      formats.forEach(format => {
        if (format !== formats[formats.length - 1]) {
          sources.push({
            type: `image/${format}`,
            srcSet: generateSrcSet(config.src, [size], format),
            sizes: '100vw',
            media: mediaQuery
          });
        }
      });
    });
  }
  
  // Generate fallback image props
  const fallbackFormat = formats[formats.length - 1];
  const img = {
    src: `${config.src}?w=${largestSize.width}${
      largestSize.height ? `&h=${largestSize.height}` : ''
    }${fallbackFormat !== 'jpg' ? `&fm=${fallbackFormat}` : ''}`,
    alt: config.alt,
    width: largestSize.width,
    height: largestSize.height,
    loading: priority ? 'eager' : (lazyLoad ? 'lazy' : 'eager'),
    decoding: 'async',
    sizes: sizesAttr,
    srcSet: generateSrcSet(config.src, sizes, fallbackFormat)
  };
  
  // Add blur placeholder if requested
  if (config.blur) {
    const placeholderColor = getPlaceholderColor(config.src);
    const blurDataUrl = generateBlurDataURL(largestSize.width, largestSize.height || 100, placeholderColor);
    
    return {
      sources: sources as any,
      img: {
        ...img,
        style: {
          backgroundColor: placeholderColor,
          transition: 'background-color 0.5s ease'
        },
        onLoad: "this.style.backgroundColor='transparent'"
      }
    };
  }
  
  return {
    sources: sources as any,
    img: img as any
  };
}

/**
 * Create optimized image URL with parameters
 * 
 * @param src Base image URL
 * @param params Image parameters
 * @returns Optimized image URL
 */
export function optimizeImageUrl(
  src: string,
  params: {
    /** Width in pixels */
    width?: number;
    
    /** Height in pixels */
    height?: number;
    
    /** Quality (1-100) */
    quality?: number;
    
    /** Format (webp, avif, jpg, png) */
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    
    /** Fit mode (cover, contain, fill, etc.) */
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  }
): string {
  // Start with base URL
  let url = src;
  
  // Add query parameter separator if needed
  if (!url.includes('?')) {
    url += '?';
  } else if (!url.endsWith('&') && !url.endsWith('?')) {
    url += '&';
  }
  
  // Add parameters
  const queryParams: string[] = [];
  
  if (params.width) {
    queryParams.push(`w=${params.width}`);
  }
  
  if (params.height) {
    queryParams.push(`h=${params.height}`);
  }
  
  if (params.quality) {
    queryParams.push(`q=${params.quality}`);
  }
  
  if (params.format) {
    queryParams.push(`fm=${params.format}`);
  }
  
  if (params.fit) {
    queryParams.push(`fit=${params.fit}`);
  }
  
  return url + queryParams.join('&');
}
