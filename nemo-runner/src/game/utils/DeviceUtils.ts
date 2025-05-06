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

/**
 * Optimize model asset based on device capabilities
 * @param model The 3D model to optimize
 * @param capabilities Device capability information
 */
export function optimizeModelAsset(
  model: THREE.Object3D, 
  capabilities: DeviceCapabilities
): THREE.Object3D {
  // Skip for null models
  if (!model) return model;
  
  // Apply appropriate level of detail and materials based on device tier
  model.traverse((object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BufferGeometry) {
      if (capabilities.highEnd) {
        // High-end - full quality, no geometry optimization needed
      } else if (capabilities.midRange) {
        // Mid-range - slight geometry simplification
        object.geometry = optimizeGeometry(object.geometry, 0.8);
      } else {
        // Low-end - significant geometry simplification
        object.geometry = optimizeGeometry(object.geometry, 0.5);
      }
    }
  });
  
  // Apply materials based on device tier
  if (capabilities.highEnd) {
    // High-end - use full quality
    applyModelMaterials(model, 'high');
  } else if (capabilities.midRange) {
    // Mid-range - simplify materials
    applyModelMaterials(model, 'medium');
  } else {
    // Low-end - simplified materials 
    applyModelMaterials(model, 'low');
  }
  
  return model;
}

/**
 * Apply materials appropriate for the given quality level
 * @param model The 3D model to apply materials to
 * @param quality The quality level ('high', 'medium', or 'low')
 */
export function applyModelMaterials(
  model: THREE.Object3D,
  quality: 'high' | 'medium' | 'low'
): void {
  model.traverse((object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh) {
      // Keep reference to original maps
      let originalMaps: {
        map?: THREE.Texture | undefined,
        normalMap?: THREE.Texture | undefined,
        roughnessMap?: THREE.Texture | undefined,
        metalnessMap?: THREE.Texture | undefined,
        aoMap?: THREE.Texture | undefined,
        emissiveMap?: THREE.Texture | undefined
      } = {};
      
      // Store original material's maps
      if (object.material instanceof THREE.MeshStandardMaterial) {
        originalMaps.map = object.material.map || undefined;
        originalMaps.normalMap = object.material.normalMap || undefined;
        originalMaps.roughnessMap = object.material.roughnessMap || undefined;
        originalMaps.metalnessMap = object.material.metalnessMap || undefined;
        originalMaps.aoMap = object.material.aoMap || undefined;
        originalMaps.emissiveMap = object.material.emissiveMap || undefined;
      }
      
      // Apply new material based on quality
      switch (quality) {
        case 'high':
          // Keep or upgrade to MeshPhysicalMaterial for high-end
          if (!(object.material instanceof THREE.MeshPhysicalMaterial)) {
            const oldMaterial = object.material;
            const color = oldMaterial instanceof THREE.MeshStandardMaterial 
              ? oldMaterial.color.clone() 
              : new THREE.Color(0xffffff);
            
            object.material = new THREE.MeshPhysicalMaterial({
              color: color,
              roughness: oldMaterial instanceof THREE.MeshStandardMaterial ? oldMaterial.roughness : 0.7,
              metalness: oldMaterial instanceof THREE.MeshStandardMaterial ? oldMaterial.metalness : 0.2,
              // Copy maps from original material
              map: originalMaps.map,
              normalMap: originalMaps.normalMap,
              roughnessMap: originalMaps.roughnessMap,
              metalnessMap: originalMaps.metalnessMap,
              aoMap: originalMaps.aoMap,
              emissiveMap: originalMaps.emissiveMap
            });
          }
          break;
          
        case 'medium':
          // Convert to MeshStandardMaterial for mid-range
          if (!(object.material instanceof THREE.MeshStandardMaterial) || 
              object.material instanceof THREE.MeshPhysicalMaterial) {
            const oldMaterial = object.material;
            const color = oldMaterial instanceof THREE.MeshStandardMaterial 
              ? oldMaterial.color.clone() 
              : new THREE.Color(0xffffff);
            
            object.material = new THREE.MeshStandardMaterial({
              color: color,
              roughness: oldMaterial instanceof THREE.MeshStandardMaterial ? oldMaterial.roughness : 0.7,
              metalness: oldMaterial instanceof THREE.MeshStandardMaterial ? oldMaterial.metalness : 0.2,
              // Only keep essential maps for medium quality
              map: originalMaps.map,
              normalMap: originalMaps.normalMap,
              // Skip less important maps for performance
              emissiveMap: originalMaps.emissiveMap
            });
          }
          break;
          
        case 'low':
          // Convert to simpler MeshLambertMaterial for low-end
          const oldMaterial = object.material;
          const color = oldMaterial instanceof THREE.MeshStandardMaterial 
            ? oldMaterial.color.clone() 
            : new THREE.Color(0xffffff);
          
          object.material = new THREE.MeshLambertMaterial({
            color: color,
            map: originalMaps.map,
            // No advanced maps for low quality
          });
          break;
      }
    }
  });
}

/**
 * Optimize geometry to reduce polygon count based on simplification factor
 * @param geometry The geometry to optimize
 * @param simplificationFactor Factor from 0 to 1 indicating how much to preserve (1 = keep all)
 * @returns The optimized geometry
 */
export function optimizeGeometry(geometry: THREE.BufferGeometry, simplificationFactor: number): THREE.BufferGeometry {
  // Ensure simplification factor is in valid range
  simplificationFactor = Math.max(0.1, Math.min(1, simplificationFactor));
  
  // If simplification factor is 1, don't modify geometry
  if (simplificationFactor >= 0.99) return geometry;
  
  // For simplicity in this implementation, we'll only apply simplification
  // to geometries that use triangle indices (most common case)
  if (geometry.index) {
    const indices = geometry.index.array;
    const vertexCount = geometry.attributes.position.count;
    
    // Skip tiny geometries or those without enough indices
    if (vertexCount < 10 || indices.length < 30) return geometry;
    
    // Very simple decimation - keep every nth triangle
    // For a production implementation, use a proper decimation algorithm
    const stride = Math.floor(1 / simplificationFactor);
    if (stride <= 1) return geometry; // No simplification needed
    
    // Create new indices array with fewer triangles
    const newIndicesCount = Math.floor(indices.length / stride) * 3;
    const newIndices = new Uint32Array(newIndicesCount);
    
    // Keep every nth triangle (each triangle is 3 indices)
    let writeIndex = 0;
    for (let i = 0; i < indices.length; i += 3 * stride) {
      if (i + 2 < indices.length && writeIndex + 2 < newIndicesCount) {
        newIndices[writeIndex] = indices[i];
        newIndices[writeIndex + 1] = indices[i + 1];
        newIndices[writeIndex + 2] = indices[i + 2];
        writeIndex += 3;
      }
    }
    
    // Replace geometry indices with simplified version
    geometry.setIndex(new THREE.BufferAttribute(newIndices, 1));
    
    // Force update
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  return geometry;
}