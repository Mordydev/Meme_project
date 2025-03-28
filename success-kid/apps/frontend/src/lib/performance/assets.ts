/**
 * Asset Optimization
 * Utilities for optimizing assets like images, fonts, and other resources
 */

import { ImageOptimizationOptions, ResourceHint } from './types';
import { getNetworkInformation } from './metrics';

/**
 * Default image optimization options
 */
export const DEFAULT_IMAGE_OPTIONS: ImageOptimizationOptions = {
  quality: 75,
  format: 'auto',
  placeholder: 'blur',
  loading: 'lazy',
  sizes: '100vw',
  breakpoints: [640, 750, 828, 1080, 1200, 1920],
};

/**
 * Determines optimal image quality based on network conditions
 */
export function getOptimalImageQuality(): number {
  const networkInfo = getNetworkInformation();
  
  // Default quality for unknown network
  if (!networkInfo) return DEFAULT_IMAGE_OPTIONS.quality;
  
  // Adjust quality based on connection type
  switch (networkInfo.effectiveType) {
    case '4g':
      return 80;
    case '3g':
      return 70;
    case '2g':
    case 'slow-2g':
      return 60;
    default:
      return 75;
  }
}

/**
 * Determines optimal image format based on browser support
 */
export function getOptimalImageFormat(): 'webp' | 'avif' | 'jpg' | 'png' {
  if (typeof window === 'undefined') return 'webp';
  
  // Check for AVIF support
  const avifSupport = 
    document.createElement('canvas')
    .toDataURL('image/avif').indexOf('data:image/avif') === 0;
  
  if (avifSupport) return 'avif';
  
  // Check for WebP support
  const webpSupport = 
    document.createElement('canvas')
    .toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  if (webpSupport) return 'webp';
  
  // Fallback to JPG
  return 'jpg';
}

/**
 * Creates a responsive srcSet for an image
 */
export function createResponsiveSrcSet(
  src: string,
  breakpoints: number[] = DEFAULT_IMAGE_OPTIONS.breakpoints,
  format: string = getOptimalImageFormat()
): string {
  const baseUrl = new URL(src, typeof window !== 'undefined' ? window.location.href : undefined);
  
  // Get path without extension
  const urlParts = baseUrl.pathname.split('.');
  const extension = urlParts.pop();
  const pathWithoutExtension = urlParts.join('.');
  
  // Create srcSet with different widths
  return breakpoints
    .map(width => {
      // Create URL with width and format
      const url = new URL(baseUrl.toString());
      url.pathname = `${pathWithoutExtension}.${format}`;
      url.searchParams.set('w', width.toString());
      
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
}

/**
 * Calculates image dimensions to maintain aspect ratio and prevent layout shift
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  const width = Math.min(containerWidth, originalWidth);
  const height = Math.round(width / aspectRatio);
  
  return { width, height };
}

/**
 * Generates color placeholder from image (simplified version)
 */
export function generateColorPlaceholder(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve('#f0f0f0'); // Default gray for SSR
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('#f0f0f0');
          return;
        }
        
        // Draw image at 1x1 to get average color
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        
        // Get pixel data
        const pixelData = ctx.getImageData(0, 0, 1, 1).data;
        
        // Convert to hex
        const hex = '#' + 
          ('00' + pixelData[0].toString(16)).slice(-2) +
          ('00' + pixelData[1].toString(16)).slice(-2) +
          ('00' + pixelData[2].toString(16)).slice(-2);
        
        resolve(hex);
      } catch (e) {
        resolve('#f0f0f0');
      }
    };
    
    img.onerror = () => {
      resolve('#f0f0f0');
    };
    
    img.src = imageUrl;
  });
}

/**
 * Prioritize loading critical fonts
 */
export function optimizeFontLoading(): void {
  if (typeof window === 'undefined' || !document.fonts) return;
  
  // Add font preloading for critical fonts
  const fontPreloads: Array<{ family: string; url: string; weight?: string; display?: string }> = [
    { 
      family: 'Montserrat', 
      url: '/fonts/montserrat-v25-latin-700.woff2', 
      weight: '700',
      display: 'swap'
    },
    { 
      family: 'Inter', 
      url: '/fonts/inter-v12-latin-regular.woff2',
      weight: '400',
      display: 'swap'
    }
  ];
  
  fontPreloads.forEach(font => {
    // Create preload link
    const linkEl = document.createElement('link');
    linkEl.rel = 'preload';
    linkEl.href = font.url;
    linkEl.as = 'font';
    linkEl.type = 'font/woff2';
    linkEl.crossOrigin = 'anonymous';
    
    // Append to head
    document.head.appendChild(linkEl);
    
    // Add font-face to ensure it's used
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${font.family}';
        font-weight: ${font.weight || '400'};
        font-display: ${font.display || 'swap'};
        src: url('${font.url}') format('woff2');
      }
    `;
    
    document.head.appendChild(style);
  });
}

/**
 * Add resource hints to improve resource loading
 */
export function addResourceHints(hints: ResourceHint[]): void {
  if (typeof window === 'undefined') return;
  
  hints.forEach(hint => {
    const linkEl = document.createElement('link');
    linkEl.rel = hint.type;
    linkEl.href = hint.href;
    
    if (hint.as) linkEl.setAttribute('as', hint.as);
    if (hint.crossOrigin) linkEl.crossOrigin = hint.crossOrigin;
    if (hint.media) linkEl.media = hint.media;
    
    document.head.appendChild(linkEl);
  });
}

/**
 * Default critical resource hints for the application
 */
export const DEFAULT_RESOURCE_HINTS: ResourceHint[] = [
  // Core API endpoint
  { type: 'preconnect', href: '/api' },
  
  // External services (example)
  { type: 'preconnect', href: 'https://images.unsplash.com', crossOrigin: 'anonymous' },
  
  // Critical assets
  { type: 'preload', href: '/fonts/montserrat-v25-latin-700.woff2', as: 'font', crossOrigin: 'anonymous' },
  { type: 'preload', href: '/fonts/inter-v12-latin-regular.woff2', as: 'font', crossOrigin: 'anonymous' },
];

/**
 * Determines which resources to preload based on the current route
 */
export function getRouteSpecificResourceHints(route: string): ResourceHint[] {
  // Base hints that apply to all routes
  const hints: ResourceHint[] = [...DEFAULT_RESOURCE_HINTS];
  
  // Add route-specific hints
  if (route.includes('/market')) {
    hints.push(
      { type: 'preload', href: '/api/market/price', as: 'fetch' },
      { type: 'preload', href: '/api/market/stats', as: 'fetch' }
    );
  } else if (route.includes('/profile')) {
    hints.push(
      { type: 'preload', href: '/api/users', as: 'fetch' }
    );
  } else if (route.includes('/community')) {
    hints.push(
      { type: 'preload', href: '/api/content', as: 'fetch' }
    );
  }
  
  return hints;
}

/**
 * Generates optimal responsive image attributes
 */
export function getResponsiveImageAttributes(
  src: string,
  width: number,
  height: number,
  options: Partial<ImageOptimizationOptions> = {}
): {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  loading: 'lazy' | 'eager';
  placeholder?: string;
} {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  const format = opts.format === 'auto' ? getOptimalImageFormat() : opts.format;
  
  return {
    src,
    srcSet: createResponsiveSrcSet(src, opts.breakpoints, format),
    sizes: opts.sizes,
    width,
    height,
    loading: opts.loading,
    placeholder: opts.placeholder === 'blur' ? 'blur' : undefined,
  };
}

/**
 * Optimizes CSS loading to reduce render blocking
 */
export function optimizeCssLoading(): void {
  if (typeof window === 'undefined') return;
  
  // Find all stylesheets
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  
  links.forEach(link => {
    // Skip critical CSS
    if (link.hasAttribute('data-critical')) return;
    
    // Make non-critical CSS async
    link.setAttribute('media', 'print');
    link.setAttribute('onload', "this.media='all'");
  });
}
