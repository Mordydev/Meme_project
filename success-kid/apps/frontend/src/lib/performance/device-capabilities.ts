'use client';

/**
 * Device capability information
 */
export interface DeviceCapabilities {
  tier: 'low' | 'mid' | 'high';
  memory: number | null;
  cores: number | null;
  connectionType: string | null;
  devicePixelRatio: number;
  touchEnabled: boolean;
  batteryOptimization: boolean;
  hasBatteryInfo: boolean;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
}

/**
 * Detect device capabilities to optimize performance
 * 
 * @returns Device capability information
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    // Default to mid-tier for SSR
    return {
      tier: 'mid',
      memory: null,
      cores: null,
      connectionType: null,
      devicePixelRatio: 1,
      touchEnabled: false,
      batteryOptimization: false,
      hasBatteryInfo: false,
      batteryLevel: null,
      batteryCharging: null
    };
  }

  // Detect available memory
  const memory = (navigator as any).deviceMemory || null;
  
  // Detect CPU cores
  const cores = navigator.hardwareConcurrency || null;
  
  // Detect connection type
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
                    
  const connectionType = connection ? connection.effectiveType : null;
  
  // Get device pixel ratio
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Detect touch capability
  const touchEnabled = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      (navigator as any).msMaxTouchPoints > 0;
                      
  // Default to battery optimization based on device detection
  let batteryOptimization = false;
  let hasBatteryInfo = false;
  let batteryLevel = null;
  let batteryCharging = null;
  
  // Determine device tier based on available information
  let tier: 'low' | 'mid' | 'high' = 'mid';
  
  // If we have memory information, use that for tier detection
  if (memory) {
    if (memory <= 2) {
      tier = 'low';
    } else if (memory <= 4) {
      tier = 'mid';
    } else {
      tier = 'high';
    }
  } 
  // Otherwise, try to use CPU cores
  else if (cores) {
    if (cores <= 2) {
      tier = 'low';
    } else if (cores <= 4) {
      tier = 'mid';
    } else {
      tier = 'high';
    }
  }
  
  // Consider connection type
  if (connectionType === 'slow-2g' || connectionType === '2g') {
    // Downgrade tier for very slow connections
    if (tier !== 'low') {
      tier = 'low';
    }
    
    // Enable battery optimization for slow connections
    batteryOptimization = true;
  }
  
  // Check for battery API
  if ('getBattery' in navigator) {
    // Note: This would need to be handled asynchronously in real usage
    // For this implementation, we'll just set hasBatteryInfo
    hasBatteryInfo = true;
  }

  return {
    tier,
    memory,
    cores,
    connectionType,
    devicePixelRatio,
    touchEnabled,
    batteryOptimization,
    hasBatteryInfo,
    batteryLevel,
    batteryCharging
  };
}

/**
 * Get battery information asynchronously if available
 * 
 * @returns Promise resolving to battery information object
 */
export async function getBatteryInfo(): Promise<{
  available: boolean;
  level: number | null;
  charging: boolean | null;
  chargingTime: number | null;
  dischargingTime: number | null;
}> {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return {
      available: false,
      level: null,
      charging: null,
      chargingTime: null,
      dischargingTime: null
    };
  }

  try {
    const battery = await (navigator as any).getBattery();
    
    return {
      available: true,
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime !== Infinity ? battery.chargingTime : null,
      dischargingTime: battery.dischargingTime !== Infinity ? battery.dischargingTime : null
    };
  } catch (error) {
    console.error('Error accessing battery information:', error);
    
    return {
      available: false,
      level: null,
      charging: null,
      chargingTime: null,
      dischargingTime: null
    };
  }
}

/**
 * Get optimal image quality based on device capabilities
 * 
 * @param deviceTier Device tier ('low', 'mid', 'high')
 * @param connectionType Connection type (4g, 3g, etc.)
 * @returns Image quality settings object
 */
export function getOptimalImageQuality(
  deviceTier: 'low' | 'mid' | 'high' = 'mid',
  connectionType: string | null = null
): {
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
  maxWidth: number;
  lazyLoadDistance: number;
} {
  // Default values
  let format: 'webp' | 'jpeg' | 'png' = 'webp';
  let quality = 80;
  let maxWidth = 1200;
  let lazyLoadDistance = 300;
  
  // Adjust based on device tier
  switch (deviceTier) {
    case 'low':
      quality = 60;
      maxWidth = 800;
      lazyLoadDistance = 100;
      break;
    case 'mid':
      quality = 75;
      maxWidth = 1200;
      lazyLoadDistance = 300;
      break;
    case 'high':
      quality = 85;
      maxWidth = 1600;
      lazyLoadDistance = 500;
      break;
  }
  
  // Further adjust based on connection type
  if (connectionType) {
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        quality = Math.min(quality, 50);
        maxWidth = Math.min(maxWidth, 600);
        lazyLoadDistance = 50;
        break;
      case '3g':
        quality = Math.min(quality, 65);
        maxWidth = Math.min(maxWidth, 1000);
        lazyLoadDistance = 200;
        break;
      // 4g and better use defaults
    }
  }
  
  return {
    format,
    quality,
    maxWidth,
    lazyLoadDistance
  };
}

/**
 * Get animation settings based on device capabilities
 * 
 * @param deviceTier Device tier
 * @param reducedMotion Whether user prefers reduced motion
 * @param batteryLevel Battery level (0-1) if available
 * @returns Animation settings object
 */
export function getAnimationSettings(
  deviceTier: 'low' | 'mid' | 'high' = 'mid',
  reducedMotion: boolean = false,
  batteryLevel: number | null = null
): {
  enabled: boolean;
  complexity: 'none' | 'minimal' | 'reduced' | 'full';
  frameThrottling: number | null;
} {
  // Default to enabled
  let enabled = true;
  
  // Default complexity based on tier
  let complexity: 'none' | 'minimal' | 'reduced' | 'full' = 'full';
  
  // Default no frame throttling
  let frameThrottling: number | null = null;
  
  // Disable animations if user prefers reduced motion
  if (reducedMotion) {
    enabled = false;
    complexity = 'none';
  } else {
    // Adjust based on device tier
    switch (deviceTier) {
      case 'low':
        complexity = 'minimal';
        frameThrottling = 30; // Target 30fps
        break;
      case 'mid':
        complexity = 'reduced';
        frameThrottling = null; // No throttling
        break;
      case 'high':
        complexity = 'full';
        frameThrottling = null; // No throttling
        break;
    }
    
    // Further adjust based on battery level if available
    if (batteryLevel !== null && batteryLevel <= 0.2) {
      // Low battery, reduce animations
      if (complexity === 'full') complexity = 'reduced';
      if (complexity === 'reduced') complexity = 'minimal';
      
      // Enable frame throttling for low battery
      if (frameThrottling === null) {
        frameThrottling = 30;
      }
    }
  }
  
  return {
    enabled,
    complexity,
    frameThrottling
  };
}
