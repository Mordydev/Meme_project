'use client';

/**
 * Layout stability utilities for reducing Cumulative Layout Shift (CLS)
 * and improving user experience during page load
 */

// Reserve space for dynamic content to prevent layout shifts
export function createPlaceholder({
  width,
  height,
  className = '',
}: {
  width: string | number;
  height: string | number;
  className?: string;
}) {
  // Normalize dimensions to CSS values
  const normalizedWidth = typeof width === 'number' ? `${width}px` : width;
  const normalizedHeight = typeof height === 'number' ? `${height}px` : height;
  
  return {
    className: `placeholder ${className}`,
    style: {
      width: normalizedWidth,
      height: normalizedHeight,
      display: 'block',
    },
  };
}

// Create proper aspect ratio for media containers
export function createAspectRatioContainer({
  ratio = 16 / 9,
  className = '',
}: {
  ratio?: number;
  className?: string;
}) {
  const paddingBottom = `${(1 / ratio) * 100}%`;
  
  return {
    className: `aspect-ratio-container ${className}`,
    style: {
      position: 'relative',
      width: '100%',
      paddingBottom,
    },
  };
}

// Create skeleton loaders with proper dimensions
export function createSkeletonLoader({
  width,
  height,
  variant = 'rectangle',
  className = '',
}: {
  width: string | number;
  height: string | number;
  variant?: 'rectangle' | 'circle' | 'text';
  className?: string;
}) {
  // Normalize dimensions to CSS values
  const normalizedWidth = typeof width === 'number' ? `${width}px` : width;
  const normalizedHeight = typeof height === 'number' ? `${height}px` : height;
  
  // Set border radius based on variant
  let borderRadius = '4px'; // Default for rectangle
  if (variant === 'circle') {
    borderRadius = '50%';
  } else if (variant === 'text') {
    borderRadius = '2px';
  }
  
  return {
    className: `skeleton-loader ${variant} ${className}`,
    style: {
      width: normalizedWidth,
      height: normalizedHeight,
      borderRadius,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
  };
}

// Function to create CSS for common skeleton animations
export function addSkeletonStyles() {
  if (typeof document === 'undefined') return;
  
  // Only add if not already present
  if (document.getElementById('skeleton-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = `
    @keyframes pulse {
      0% {
        opacity: 0.6;
      }
      50% {
        opacity: 0.8;
      }
      100% {
        opacity: 0.6;
      }
    }
    
    .skeleton-loader {
      display: block;
      background-color: rgba(255, 255, 255, 0.1);
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    /* Prefer CSS containment for better layout stability */
    .skeleton-loader, .placeholder {
      contain: layout paint size;
    }
  `;
  
  document.head.appendChild(style);
}

// Function to prevent layout shifts when loading dynamic content
export function preventLayoutShift() {
  if (typeof document === 'undefined') return;
  
  // Add CSS to help prevent layout shifts
  const style = document.createElement('style');
  style.textContent = `
    /* Set explicit width/height for media */
    img, video {
      max-width: 100%;
      height: auto;
    }
    
    /* Prevent layout shifts from font loading */
    html {
      font-display: optional;
    }
    
    /* Prevent layout shifts from automatic scrollbar appearance */
    html {
      scrollbar-gutter: stable;
    }
    
    /* Pre-set size for typical UI controls */
    button, .btn {
      min-height: 44px;
      min-width: 44px;
    }
  `;
  
  document.head.appendChild(style);
}

// Detect and report layout shifts
export function monitorLayoutShifts(callback?: (cls: number) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
  
  try {
    // Create a Performance Observer to track CLS
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          const clsValue = (entry as any).value;
          if (callback) callback(clsValue);
        }
      }
    });
    
    // Start observing layout shift entries
    observer.observe({ type: 'layout-shift', buffered: true });
    
    return () => observer.disconnect();
  } catch (error) {
    console.warn('Layout shift monitoring not supported', error);
    return () => {};
  }
}
