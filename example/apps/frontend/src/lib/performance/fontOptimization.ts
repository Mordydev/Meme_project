'use client';

/**
 * Font optimization utilities for improving web performance
 * Focuses on reducing layout shifts and optimizing font loading
 */

// Preload critical fonts to improve LCP
export function preloadCriticalFonts() {
  if (typeof document === 'undefined') return;
  
  // List of critical fonts to preload
  // Adjust based on your font stack and critical UI elements
  const criticalFonts = [
    { family: 'Knockout', weight: '700', style: 'normal', display: 'swap' },
    { family: 'Inter', weight: '400', style: 'normal', display: 'swap' },
    { family: 'Inter', weight: '600', style: 'normal', display: 'swap' },
  ];
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2'; // Adjust based on your font format
    link.href = `/fonts/${font.family.toLowerCase()}-${font.weight}${font.style !== 'normal' ? `-${font.style}` : ''}.woff2`;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  });
}

// Add font-display CSS properties to improve perceived performance
export function fontDisplayOptimization() {
  if (typeof document === 'undefined') return;
  
  // Add font-display: swap to all font faces
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap !important;
    }
    
    /* Apply system font fallbacks first */
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    /* Once fonts load, use them */
    .fonts-loaded body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .fonts-loaded h1, .fonts-loaded h2, .fonts-loaded h3, .fonts-loaded h4, .fonts-loaded h5, .fonts-loaded h6 {
      font-family: 'Knockout', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
  `;
  
  document.head.appendChild(style);
}

// Font loading optimization component
export function optimizeFontLoading() {
  if (typeof document === 'undefined') return;
  
  // Font loading with Font Face Observer pattern
  const FontFaceObserver = require('fontfaceobserver');
  
  // Load primary fonts
  const inter = new FontFaceObserver('Inter');
  const knockout = new FontFaceObserver('Knockout');
  
  // Set a maximum timeout for font loading (3 seconds)
  const timeout = 3000;
  
  // Apply fonts-loaded class when both fonts are loaded
  Promise.all([
    inter.load(null, timeout),
    knockout.load(null, timeout)
  ])
    .then(() => {
      document.documentElement.classList.add('fonts-loaded');
    })
    .catch(error => {
      console.warn('Font loading failed:', error);
      // Add class anyway to use system fonts if loading fails
      document.documentElement.classList.add('fonts-loaded');
    });
}

// Generate optimized font CSS
export function generateOptimizedFontCSS(fontStack: string[]) {
  // Creating a fallback stack with system fonts
  const systemFonts = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';
  
  // Combine custom fonts with system fallbacks
  return [...fontStack, ...systemFonts.split(', ')].join(', ');
}
