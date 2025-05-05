import * as THREE from 'three';

// Device capability detection
export function detectDeviceCapabilities() {
  const capabilities = {
    highEnd: false,
    midRange: false,
    lowEnd: true, // Default to low-end
    mobile: false
  };
  
  // Check for mobile
  capabilities.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Check GPU/system performance
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          
          // Detect high-end GPUs
          const highEndGPUPatterns = [
            'NVIDIA', 'RTX', 'GTX', 'Radeon Pro', 'AMD Radeon', 'Vega',
            'Intel Iris', 'Apple GPU', 'Apple M1', 'Apple M2'
          ];
          
          // Detect mid-range GPUs
          const midRangeGPUPatterns = [
            'Intel UHD', 'Intel HD', 'Iris', 'Mobile Intel',
            'AMD Radeon', 'Vega', 'Mali-G', 'Adreno 6'
          ];
          
          // Test for high-end
          if (highEndGPUPatterns.some(pattern => renderer.includes(pattern))) {
            capabilities.highEnd = true;
            capabilities.midRange = false;
            capabilities.lowEnd = false;
          } 
          // Test for mid-range
          else if (midRangeGPUPatterns.some(pattern => renderer.includes(pattern))) {
            capabilities.highEnd = false;
            capabilities.midRange = true;
            capabilities.lowEnd = false;
          }
          
          // Additional heuristics: test for WebGL2 support
          if (document.createElement('canvas').getContext('webgl2')) {
            // If WebGL2 is supported, upgrade by one level (low->mid or mid->high)
            if (capabilities.lowEnd) {
              capabilities.lowEnd = false;
              capabilities.midRange = true;
            } else if (capabilities.midRange) {
              capabilities.midRange = false;
              capabilities.highEnd = true;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error detecting GPU capabilities:', error);
    }
  }
  
  return capabilities;
}

// Apply quality settings to renderer based on device capabilities
export function applyQualitySettings(
  renderer: THREE.WebGLRenderer,
  capabilities: ReturnType<typeof detectDeviceCapabilities>
) {
  if (capabilities.highEnd) {
    // High-end settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
  } else if (capabilities.midRange) {
    // Mid-range settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
  } else {
    // Low-end settings
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.NoToneMapping;
  }
  
  // Mobile-specific optimizations
  if (capabilities.mobile) {
    // Further reduce quality on mobile
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    // Force low-end settings on mobile low-end devices
    if (capabilities.lowEnd) {
      renderer.shadowMap.enabled = false;
      renderer.toneMapping = THREE.NoToneMapping;
    }
  }
  
  return renderer;
}

// Configure game settings based on device capabilities
export function configureGameSettings(capabilities: ReturnType<typeof detectDeviceCapabilities>) {
  if (capabilities.lowEnd) {
    // Low quality settings
    return {
      particles: 'minimal',
      shadowQuality: 'off',
      drawDistance: 'short',
      waterQuality: 'simple',
      maxObstacles: 10,
      fxQuality: 'low'
    };
  } else if (capabilities.midRange) {
    // Medium quality settings
    return {
      particles: 'medium',
      shadowQuality: 'basic',
      drawDistance: 'medium',
      waterQuality: 'animated',
      maxObstacles: 20,
      fxQuality: 'medium'
    };
  } else {
    // High quality settings
    return {
      particles: 'high',
      shadowQuality: 'advanced',
      drawDistance: 'far',
      waterQuality: 'realistic',
      maxObstacles: 30,
      fxQuality: 'high'
    };
  }
}