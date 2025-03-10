'use client';

/**
 * Image optimization utilities for improving Largest Contentful Paint (LCP)
 * and reducing Cumulative Layout Shift (CLS)
 */

// Priority preloading for critical images
export function preloadCriticalImage(src: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  
  document.head.appendChild(link);
}

// Generate proper image size props based on responsive rules
export function getResponsiveImageProps(
  src: string,
  {
    width,
    height,
    priority = false,
    sizes = '100vw',
  }: {
    width: number;
    height: number;
    priority?: boolean;
    sizes?: string;
  }
) {
  return {
    src,
    width,
    height,
    sizes,
    priority,
    // Always include width/height to prevent layout shift
    style: {
      width: '100%',
      height: 'auto',
      aspectRatio: `${width} / ${height}`,
    },
  };
}

// Calculate correct aspect ratio placeholder for images
export function getImagePlaceholder({
  width,
  height,
  bgColor = '#1f1f1f',
}: {
  width: number;
  height: number;
  bgColor?: string;
}) {
  const aspectRatio = height / width;
  
  // Create a tiny SVG placeholder with the correct aspect ratio
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" />
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  
  return {
    aspectRatio,
    placeholder: `data:image/svg+xml;base64,${base64}`,
    width,
    height,
  };
}

// Calculate optimal srcset for images
export function calculateSrcSet(src: string, width: number) {
  // Quick utility to modify URLs with width parameter
  const addWidth = (url: string, w: number) => {
    // This example assumes a URL structure that supports width parameters
    // Adjust based on your actual image service
    const hasParams = url.includes('?');
    return `${url}${hasParams ? '&' : '?'}w=${w}`;
  };
  
  // Create srcset with various widths based on the original
  // Common responsive breakpoints
  const widths = [320, 640, 960, 1280, 1600, 1920].filter(w => w <= width * 2);
  
  if (widths.length === 0 || width === 0) {
    return { srcSet: '', sizes: '100vw' };
  }
  
  const srcSet = widths
    .map(w => `${addWidth(src, w)} ${w}w`)
    .join(', ');
  
  // Default sizes attribute can be overridden when using this utility
  const sizes = '(max-width: 768px) 100vw, 50vw';
  
  return { srcSet, sizes };
}

// Lazy load non-critical images
export function shouldLazyLoad(image: {
  isCritical?: boolean;
  viewport?: 'above' | 'below' | 'all';
}) {
  const { isCritical = false, viewport = 'all' } = image;
  
  // Critical images should never be lazy loaded
  if (isCritical) return false;
  
  // For server-side rendering, defer to client-side decision
  if (typeof window === 'undefined') return true;
  
  // For above-the-fold content, don't lazy load
  if (viewport === 'above') return false;
  
  // Always lazy load below-the-fold content
  return true;
}
