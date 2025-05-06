import * as THREE from 'three';

// Device capability information type
export interface DeviceCapabilities {
  highEnd: boolean;    // High-end device
  midRange: boolean;   // Mid-range device
  lowEnd: boolean;     // Low-end device
  mobile: boolean;     // Mobile device
  desktop: boolean;    // Desktop device
  pixelRatio: number;  // Device pixel ratio
  maxTextureSize: number; // Maximum texture size
  webGL2Support: boolean; // WebGL 2.0 support
}

// Quality settings type
export interface QualitySettings {
  particles: 'high' | 'medium' | 'minimal';
  shadowQuality: 'high' | 'medium' | 'low' | 'off';
  waterQuality: 'reflective' | 'animated' | 'simple';
  drawDistance: 'far' | 'medium' | 'short';
  postProcessing: boolean;
  antialiasing: boolean;
}

/**
 * Detect device capabilities to adjust game settings accordingly
 * @returns Device capability information
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Default capabilities (assume low-end until proven otherwise)
  const capabilities: DeviceCapabilities = {
    highEnd: false,
    midRange: false,
    lowEnd: true,  // Default to low-end
    mobile: false,
    desktop: true,
    pixelRatio: 1,
    maxTextureSize: 2048,
    webGL2Support: false
  };
  
  // Check for mobile device
  capabilities.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  capabilities.desktop = !capabilities.mobile;
  
  // Get device pixel ratio (capped to avoid performance issues)
  capabilities.pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  
  // Detect WebGL capabilities
  try {
    // Create temporary canvas for WebGL detection
    const canvas = document.createElement('canvas');
    
    // Try WebGL 2 first
    const gl2 = canvas.getContext('webgl2');
    
    if (gl2) {
      capabilities.webGL2Support = true;
      
      // Get maximum texture size
      capabilities.maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE);
      
      // Check for other capabilities that would indicate a higher-end GPU
      const maxTextureUnits = gl2.getParameter(gl2.MAX_TEXTURE_IMAGE_UNITS);
      const maxVaryings = gl2.getParameter(gl2.MAX_VARYING_VECTORS);
      
      // Check for renderer information
      const debugInfo = gl2.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = gl2.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        
        console.log(`GPU: ${renderer} (${vendor})`);
        
        // Categorize based on GPU name/vendor
        // This is a heuristic and could be expanded/improved
        const isHighEnd = 
          /RTX|Radeon Pro|Quadro|GTX 1080|GTX 1070|GTX 980|AMD Radeon RX 6|AMD Radeon RX 5/i.test(renderer) || 
          maxTextureUnits > 24;
        
        const isMidRange = 
          /GTX 1060|GTX 1050|GTX 970|GTX 960|AMD Radeon RX/i.test(renderer) ||
          maxTextureUnits > 16;
        
        if (isHighEnd) {
          capabilities.highEnd = true;
          capabilities.midRange = false;
          capabilities.lowEnd = false;
        } else if (isMidRange) {
          capabilities.highEnd = false;
          capabilities.midRange = true;
          capabilities.lowEnd = false;
        }
      } else {
        // If we can't get specific GPU info, try to classify based on available features
        if (capabilities.maxTextureSize >= 8192 && maxTextureUnits >= 24 && maxVaryings >= 16) {
          capabilities.highEnd = true;
          capabilities.midRange = false;
          capabilities.lowEnd = false;
        } else if (capabilities.maxTextureSize >= 4096 && maxTextureUnits >= 16) {
          capabilities.highEnd = false;
          capabilities.midRange = true;
          capabilities.lowEnd = false;
        }
      }
    } else {
      // Try WebGL 1 fallback
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (gl) {
        // Get maximum texture size
        capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // WebGL 1 device is considered at most mid-range
        capabilities.highEnd = false;
        
        // Check if it might be mid-range
        if (capabilities.maxTextureSize >= 4096) {
          capabilities.midRange = true;
          capabilities.lowEnd = false;
        }
      }
    }
  } catch (e) {
    console.warn('Error detecting WebGL capabilities:', e);
    // Keep default capabilities (low-end)
  }
  
  // Mobile-specific adjustments
  if (capabilities.mobile) {
    // High-end mobile
    if (capabilities.highEnd) {
      capabilities.highEnd = false;
      capabilities.midRange = true;
      capabilities.lowEnd = false;
    } 
    // Mid-range mobile becomes low-end for 3D performance
    else if (capabilities.midRange) {
      capabilities.midRange = false;
      capabilities.lowEnd = true;
    }
  }
  
  // Log detected capabilities
  console.log('Device capabilities:', capabilities);
  
  return capabilities;
}

/**
 * Configure game quality settings based on detected device capabilities
 * @param capabilities Device capability information
 * @returns Quality settings for game rendering and effects
 */
export function configureGameSettings(capabilities: DeviceCapabilities): QualitySettings {
  // Base settings
  const settings: QualitySettings = {
    particles: 'minimal',
    shadowQuality: 'off',
    waterQuality: 'simple',
    drawDistance: 'short',
    postProcessing: false,
    antialiasing: false
  };
  
  // Apply settings based on device capabilities
  if (capabilities.highEnd) {
    settings.particles = 'high';
    settings.shadowQuality = 'high';
    settings.waterQuality = 'reflective';
    settings.drawDistance = 'far';
    settings.postProcessing = true;
    settings.antialiasing = true;
  } else if (capabilities.midRange) {
    settings.particles = 'medium';
    settings.shadowQuality = 'medium';
    settings.waterQuality = 'animated';
    settings.drawDistance = 'medium';
    settings.postProcessing = true;
    settings.antialiasing = true;
  } else {
    // Low-end settings (defaults)
    // Mobile-specific adjustments
    if (capabilities.mobile) {
      settings.particles = 'minimal';
      settings.drawDistance = 'short';
    }
  }
  
  // Log configured settings
  console.log('Game quality settings:', settings);
  
  return settings;
}

/**
 * Apply quality settings to a Three.js renderer
 * @param renderer Three.js WebGLRenderer instance
 * @param capabilities Device capability information
 */
export function applyQualitySettings(renderer: THREE.WebGLRenderer, capabilities: DeviceCapabilities): void {
  // Set pixel ratio based on device (but cap it to avoid performance issues)
  const pixelRatio = Math.min(capabilities.pixelRatio, capabilities.highEnd ? 2 : capabilities.midRange ? 1.5 : 1);
  renderer.setPixelRatio(pixelRatio);
  
  // Configure renderer based on device capability
  if (capabilities.highEnd) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
  } else if (capabilities.midRange) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Basic PCF for mid-range
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ReinhardToneMapping; // Less expensive tone mapping
  } else {
    // Low-end settings
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // Skip sRGB conversion for performance
    renderer.toneMapping = THREE.NoToneMapping; // No tone mapping for performance
  }
}