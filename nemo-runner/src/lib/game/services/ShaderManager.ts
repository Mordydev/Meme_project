// src/lib/game/services/ShaderManager.ts
import * as THREE from 'three';
import NoiseGLSL from '../shaders/common/noise.glsl'; // Import our chunks
import UtilsGLSL from '../shaders/common/utils.glsl'; // Import our chunks
import { vertexShaderSource as clownfishVertex } from '../shaders/character/clownfish.vert';
import { fragmentShaderSource as clownfishFragment } from '../shaders/character/clownfish.frag';
import { configSystem } from '../core/ConfigurationSystem';

export type MaterialType = 'player_default' | 'obstacle_rock' | 'obstacle_clam' | 'collectible_bubble' | 'collectible_coin' | 'environment_water' | 'obstacle_coral' | 'powerup_shield' | 'powerup_magnet' | 'powerup_doublescore' | 'obstacle_pufferfish' | 'obstacle_jellyfish' | 'obstacle_shark' | 'obstacle_seaturtle_shell' | 'obstacle_seaturtle_skin' | 'obstacle_kelpwall' | 'obstacle_schooloffish_fish';

// Interface for shader source code before processing
export interface ShaderProgramSource {
  name: string;
  vertexShaderSource: string;
  fragmentShaderSource: string;
  defaultUniforms?: () => THREE.ShaderMaterialParameters['uniforms']; // Function to get fresh uniforms
  materialParameters?: Partial<Omit<THREE.ShaderMaterialParameters, 'vertexShader' | 'fragmentShader' | 'uniforms'>>;
}

// Cache for compiled materials to avoid recompilation
interface CachedMaterial {
    material: THREE.ShaderMaterial;
    sourceKey: string; // Key based on shader name and custom uniforms structure
}

export class ShaderManager {
  private materials: Map<MaterialType, THREE.Material>; // For backward compatibility
  private shaderSources: Map<string, ShaderProgramSource> = new Map();
  private shaderChunks: Map<string, string> = new Map();
  private materialCache: Map<string, CachedMaterial> = new Map();
  private coreChunksRegistered = false;

  public globalUniforms: {
    uTime: THREE.IUniform<number>;
    uResolution: THREE.IUniform<THREE.Vector2>;
  };

  constructor() {
    // Initialize backward compatibility materials
    this.materials = new Map();
    this.initializeDefaultMaterials();

    // Initialize global uniforms for all shaders
    try {
      // Create uniforms with initial default values - protect against undefined window
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

      this.globalUniforms = {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(screenWidth, screenHeight) },
      };
    } catch (error) {
      console.warn('ShaderManager: Error initializing global uniforms', error);
      // Safe fallback if anything fails
      this.globalUniforms = {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      };
    }

    // Register built-in GLSL chunks
    this.registerCoreChunks();
    
    // Register particle and post-processing shaders
    this.registerParticleShaders();
    
    // Register clownfish shader
    this.registerClownfishShader();
    
    console.log('ShaderManager: Initialized with basic materials and shader systems.');
  }
  
  /**
   * Register particle and post-processing shaders
   * 
   * This is now a synchronous method that imports shaders directly
   * to ensure registration happens immediately rather than in a Promise
   */
  /**
   * Register clownfish shader for player character
   */
  private registerClownfishShader(): void {
    try {
      const playerCfg = configSystem.get('player'); // For default animation params

      this.registerShader({
        name: 'clownfishShader',
        vertexShaderSource: clownfishVertex,
        fragmentShaderSource: clownfishFragment,
        defaultUniforms: () => ({ // Ensure fresh objects
          uBaseColor: { value: new THREE.Color(playerCfg.clownFishBaseColor) },
          uStripeColor: { value: new THREE.Color(playerCfg.clownFishStripeColor) },
          uStripeEdgeColor: { value: new THREE.Color(playerCfg.clownFishStripeEdgeColor) },
          uFinAccentColor: { value: new THREE.Color(playerCfg.clownFishFinAccentColor) },
          uEyePupilColor: { value: new THREE.Color(playerCfg.eyePupilColor) },
          uEyeIrisColor: { value: new THREE.Color(playerCfg.eyeIrisColor) },
          uEyeHighlightColor: { value: new THREE.Color(playerCfg.eyeHighlightColor) },
          // Animation uniforms
          uTime: { value: 0.0 },
          uPlayerSpeed: { value: 0.0 }, 
          uIsTurning: { value: 0.0 },
          uTurnDirection: { value: 0.0 },
          uTailFinFrequency: { value: playerCfg.tailFinFrequency },
          uTailFinAmplitude: { value: playerCfg.tailFinAmplitude },
          uPectoralFinFrequency: { value: playerCfg.pectoralFinFrequency },
          uPectoralFinAmplitude: { value: playerCfg.pectoralFinAmplitude },
          uEmissiveIntensity: { value: 0.5 }, // Default emission strength for visibility
        }),
        materialParameters: {
          fog: true, // Character should be affected by scene fog
          lights: true, // Character should react to scene lights
          side: THREE.DoubleSide, // Use DoubleSide for both body and fins
          transparent: false, // Changed to false for better visibility
          depthWrite: true, // Enable depth writing
          glslVersion: THREE.GLSL3, // Explicitly use GLSL 3.0
          emissive: 0xffbb00, // Add default emissive color
          emissiveIntensity: 0.5, // With medium intensity
          defines: {
            GLSL3: true // Define GLSL3 for the shader to adapt
          }
        }
      });
      console.log('ShaderManager: Registered clownfishShader.');
    } catch (error) {
      console.error("ShaderManager: Error registering clownfish shader:", error);
    }
  }

  private registerParticleShaders(): void {
    try {
      // Import shader sources directly
      const { particleVertexShader } = require('../vfx/shaders/particle.vert');
      const { bubbleFragmentShader } = require('../vfx/shaders/bubble.frag');
      const { dustFragmentShader } = require('../vfx/shaders/dust.frag');
      const { sparkleFragmentShader } = require('../vfx/shaders/sparkle.frag');
      const { impactDebrisFragmentShader } = require('../vfx/shaders/impact_debris.frag');
      
      // Register bubble shader immediately
      this.registerShader({
        name: 'bubbleShader',
        vertexShaderSource: particleVertexShader,
        fragmentShaderSource: bubbleFragmentShader,
        defaultUniforms: () => ({
          uBaseColor: { value: new THREE.Color(0xffffff) },
          uBaseSize: { value: 0.05 },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
          uTime: { value: 0.0 },
          uUseTexture: { value: false },
        }),
        materialParameters: {
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }
      });
      console.log("ShaderManager: Registered bubbleShader");
      
      // Register dust shader immediately
      this.registerShader({
        name: 'dustShader',
        vertexShaderSource: particleVertexShader,
        fragmentShaderSource: dustFragmentShader,
        defaultUniforms: () => ({
          uBaseColor: { value: new THREE.Color(0xffffff) },
          uBaseSize: { value: 0.03 },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
          uTime: { value: 0.0 },
          uOpacity: { value: 0.7 },
        }),
        materialParameters: {
          transparent: true,
          depthWrite: false,
          blending: THREE.NormalBlending,
        }
      });
      console.log("ShaderManager: Registered dustShader");
      
      // Register sparkle shader for collectible particles
      this.registerShader({
        name: 'sparkleShader',
        vertexShaderSource: particleVertexShader,
        fragmentShaderSource: sparkleFragmentShader,
        defaultUniforms: () => ({
          uBaseColor: { value: new THREE.Color(0xffffff) },
          uBaseSize: { value: 0.08 },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
        }),
        materialParameters: {
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }
      });
      console.log("ShaderManager: Registered sparkleShader");
      
      // Register impact debris shader
      this.registerShader({
        name: 'impactDebrisShader',
        vertexShaderSource: particleVertexShader,
        fragmentShaderSource: impactDebrisFragmentShader,
        defaultUniforms: () => ({
          uBaseColor: { value: new THREE.Color(0xaaaaaa) },
          uBaseSize: { value: 0.1 },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
          uTime: { value: 0.0 },
        }),
        materialParameters: {
          transparent: true,
          depthWrite: false,
          blending: THREE.NormalBlending,
        }
      });
      console.log("ShaderManager: Registered impactDebrisShader");
      
    } catch (error) {
      console.error("ShaderManager: Error registering particle shaders:", error);
    }
  }

  private initializeDefaultMaterials(): void {
    // For now, these are basic materials. Later they will be custom shaders.
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500 }); // Orange
    this.materials.set('player_default', playerMaterial);

    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Grey
    this.materials.set('obstacle_rock', rockMaterial);

    const clamMaterial = new THREE.MeshPhongMaterial({ color: 0xe0d1b0, shininess: 60 }); // Sandy beige with shine
    this.materials.set('obstacle_clam', clamMaterial);

    const waterFloorMaterial = new THREE.MeshPhongMaterial({ color: 0x335599, side: THREE.DoubleSide }); // Darker blue for floor
    this.materials.set('environment_water', waterFloorMaterial);

    const coralMaterial = new THREE.MeshPhongMaterial({ color: 0xff7f50 }); // Coral color
    this.materials.set('obstacle_coral', coralMaterial);

    // New obstacle materials for pufferfish and jellyfish with improved shaders
    const pufferfishMaterial = new THREE.MeshPhongMaterial({
      color: 0xEC9F0F,        // Mustard yellow (#EC9F0F)
      emissive: 0x552200,     // Subtle emissive glow
      emissiveIntensity: 0.2,
      specular: 0xFFFFFF,     // White specular highlights
      shininess: 40,          // Moderately shiny
      name: 'PufferfishMaterial'
    });
    this.materials.set('obstacle_pufferfish', pufferfishMaterial);

    const jellyfishMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88CCFF,             // Light blue
      transparent: true,
      opacity: 0.7,
      transmission: 0.3,           // Translucent quality
      roughness: 0.1,              // Very smooth
      metalness: 0.1,              // Slight metallic look
      emissive: 0x113355,          // Subtle blue glow
      emissiveIntensity: 0.4,
      clearcoat: 0.5,              // Slight clearcoat for "wet" appearance
      clearcoatRoughness: 0.2,
      ior: 1.2,                    // Refraction index
      reflectivity: 0.3,
      iridescence: 0.2,            // Slight rainbow effect
      iridescenceIOR: 1.5,
      sheen: 0.1,                  // Slight fabric-like sheen
      sheenRoughness: 0.2,
      sheenColor: new THREE.Color(0xAAFFFF),
      name: 'JellyfishMaterial'
    });
    this.materials.set('obstacle_jellyfish', jellyfishMaterial);

    // Collectible materials - good visibility without being extreme
    const bubbleMaterial = new THREE.MeshPhongMaterial({
      color: 0x66ccff, // Bright blue-cyan for visibility
      transparent: true,
      opacity: 0.8, // More opaque for better visibility while still transparent
      shininess: 90,
      emissive: 0x112233, // Subtle inner glow
      emissiveIntensity: 0.4 // Moderate glow
    });
    this.materials.set('collectible_bubble', bubbleMaterial);

    const coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Gold
      metalness: 0.7,
      roughness: 0.3, // Fairly shiny without being extreme
      emissive: 0x554400, // Subtle gold glow
      emissiveIntensity: 0.3 // Moderate glow
    });
    this.materials.set('collectible_coin', coinMaterial);

    // Power-up materials
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x00a0ff, // Bright blue
      emissive: 0x0044ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });
    this.materials.set('powerup_shield', shieldMaterial);

    const magnetMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc2299, // Purple/magenta
      emissive: 0x990066,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.2
    });
    this.materials.set('powerup_magnet', magnetMaterial);

    const doubleScoreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00, // Gold/yellow
      emissive: 0xff9900,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    this.materials.set('powerup_doublescore', doubleScoreMaterial);

    // Shark material
    const sharkMaterial = new THREE.MeshPhongMaterial({
      color: 0x505868, // Dark blue-grey
      specular: 0x333333,
      shininess: 20,
      name: 'SharkMaterial'
    });
    this.materials.set('obstacle_shark', sharkMaterial);

    // Sea Turtle materials
    const seaTurtleShellMaterial = new THREE.MeshPhongMaterial({
      color: 0x8FBC8F, // Dark sea green
      specular: 0x333333,
      shininess: 30,
      name: 'SeaTurtleShellMaterial'
    });
    this.materials.set('obstacle_seaturtle_shell', seaTurtleShellMaterial);

    const seaTurtleSkinMaterial = new THREE.MeshPhongMaterial({
      color: 0x556B2F, // Dark olive green
      specular: 0x222222,
      shininess: 10,
      name: 'SeaTurtleSkinMaterial'
    });
    this.materials.set('obstacle_seaturtle_skin', seaTurtleSkinMaterial);

    // Kelp Wall material
    const kelpWallMaterial = new THREE.MeshPhongMaterial({
      color: 0x2E8B57, // SeaGreen
      side: THREE.DoubleSide, // Visible from both sides
      transparent: true,
      opacity: 0.75,
      name: 'KelpWallMaterial'
    });
    this.materials.set('obstacle_kelpwall', kelpWallMaterial);

    // School of Fish material
    const schoolOfFishMaterial = new THREE.MeshPhongMaterial({
      color: 0xB0C4DE, // LightSteelBlue
      shininess: 60,
      name: 'SchoolOfFishMaterial'
    });
    this.materials.set('obstacle_schooloffish_fish', schoolOfFishMaterial);

    console.log("ShaderManager: Default materials initialized for backward compatibility.");
  }

  private registerCoreChunks(): void {
    if (this.coreChunksRegistered) return;
    try {
      // Check if THREE.ShaderChunk exists before using it
      if (!THREE.ShaderChunk) {
        console.error("ShaderManager: THREE.ShaderChunk is undefined. This may cause shader compilation errors.");
        THREE.ShaderChunk = {}; // Create empty object as fallback
      }

      // Only register a chunk if it doesn't already exist to avoid the "already registered" warnings
      // Use a helper function to register only if not exists
      const registerIfNotExists = (name: string, source: string) => {
        if (!this.shaderChunks.has(name)) {
          this.registerChunk(name, source);
        }
      };

      // Register chunks from imported GLSL modules - only if they don't already exist
      registerIfNotExists('random2D', NoiseGLSL.random2D);
      registerIfNotExists('noise2D', NoiseGLSL.noise2D); // Depends on random2D
      registerIfNotExists('PI', UtilsGLSL.PI);
      registerIfNotExists('saturate', UtilsGLSL.saturate);
      this.coreChunksRegistered = true;
      console.log('ShaderManager: Registered core GLSL chunks:', Array.from(this.shaderChunks.keys()));
    } catch (error) {
      console.error("ShaderManager: Error registering core chunks:", error);
    }
  }

  public registerChunk(name: string, source: string): void {
    try {
      if (!name || typeof name !== 'string') {
        console.error(`ShaderManager: Invalid chunk name: ${name}`);
        return;
      }

      if (!source || typeof source !== 'string') {
        console.error(`ShaderManager: Invalid chunk source for "${name}"`);
        return;
      }

      if (this.shaderChunks.has(name)) {
        const existing = this.shaderChunks.get(name);
        if (existing === source) {
          console.log(`ShaderManager: Chunk "${name}" already registered, skipping.`);
          return;
        }
        console.warn(`ShaderManager: Chunk "${name}" is already registered. Overwriting.`);
      }

      this.shaderChunks.set(name, source);

      // Also register with THREE.js ShaderChunk for compatibility with THREE.js material system
      // Make sure THREE.ShaderChunk exists
      if (!THREE.ShaderChunk) {
        console.warn("ShaderManager: THREE.ShaderChunk is undefined. Creating empty object.");
        THREE.ShaderChunk = {};
      }

      THREE.ShaderChunk[name] = source;
    } catch (error) {
      console.error(`ShaderManager: Error registering chunk "${name}":`, error);
    }
  }

  public registerShader(programSource: ShaderProgramSource): void {
    if (this.shaderSources.has(programSource.name)) {
      console.warn(`ShaderManager: Shader program "${programSource.name}" is already registered. Overwriting.`);
    }
    this.shaderSources.set(programSource.name, programSource);
    console.log(`ShaderManager: Registered shader "${programSource.name}".`);
  }
  
  private preprocessShader(source: string, processingHistory: Set<string> = new Set()): string {
    try {
      // Check if this shader uses THREE.js built-in chunks
      if (source.includes('#include <') && (
          source.includes('#include <common>') ||
          source.includes('#include <lights_pars_begin>') ||
          source.includes('#include <fog_pars_fragment>') ||
          source.includes('#include <bsdfs>') ||
          source.includes('#include <tonemapping_fragment>') ||
          source.includes('#include <colorspace_fragment>') ||
          source.includes('#include <fog_fragment>')
      )) {
        // If it includes THREE.js chunks, don't try to process them ourselves
        // Add a marker to prevent double processing
        if (!source.includes('// THREE.js chunks handled by THREE.js shader system')) {
          source = "// THREE.js chunks handled by THREE.js shader system\n" + source;
          console.log("ShaderManager: Found THREE.js includes, letting THREE.js handle them");
        }
        return source; // Let THREE.js handle its own includes
      }

      const includeRegex = /^[ \t]*#include\s+<([\w./]+)>/gm;
      let match;
      let processedSource = source;

      // Track unprocessed includes to avoid infinite loop
      const unprocessedIncludes = new Set<string>();

      // First pass: Check all required chunks and log warnings
      while ((match = includeRegex.exec(source)) !== null) {
        const chunkName = match[1];

        if (!this.shaderChunks.has(chunkName)) {
          console.warn(`ShaderManager: Shader chunk "${chunkName}" not found for #include directive.`);
          unprocessedIncludes.add(chunkName);
        }
      }

      // Reset regex
      includeRegex.lastIndex = 0;

      // Second pass: Process the includes
      while ((match = includeRegex.exec(source)) !== null) {
        const chunkName = match[1];

        // Skip processing if this is an unresolved include
        if (unprocessedIncludes.has(chunkName)) {
          // Replace with empty placeholder to avoid errors
          processedSource = processedSource.replace(
            match[0],
            `// PLACEHOLDER for missing chunk "${chunkName}"\n// Functions and variables from this chunk won't be available`
          );
          continue;
        }

        // Protect against circular dependencies
        if (processingHistory.has(chunkName)) {
          console.warn(`ShaderManager: Circular dependency detected for chunk "${chunkName}". Skipping.`);
          continue;
        }

        processingHistory.add(chunkName);

        const chunkSource = this.shaderChunks.get(chunkName);
        if (chunkSource) {
          // Recursively preprocess the chunk itself
          const processedChunk = this.preprocessShader(chunkSource, new Set(processingHistory)); // Pass a copy of history
          processedSource = processedSource.replace(match[0], `// ---- Start #include <${chunkName}> ----\n${processedChunk}\n// ---- End #include <${chunkName}> ----`);
        } else {
          // This shouldn't happen due to the first pass, but just in case
          processedSource = processedSource.replace(match[0], `// ERROR: Shader chunk "${chunkName}" not found.`);
        }

        processingHistory.delete(chunkName); // Remove from history for this path
      }

      return processedSource;
    } catch (error) {
      console.error("ShaderManager: Error preprocessing shader:", error);
      // Return original source if processing fails, to avoid breaking everything
      return source;
    }
  }

  public createShaderMaterial(
    shaderName: string,
    instanceUniformsOverrides?: THREE.ShaderMaterialParameters['uniforms'],
    instanceMaterialParams?: Partial<Omit<THREE.ShaderMaterialParameters, 'vertexShader' | 'fragmentShader' | 'uniforms'>>
  ): THREE.ShaderMaterial | null {
    try {
      // Validate input parameters
      if (!shaderName || typeof shaderName !== 'string') {
        console.error(`ShaderManager: Invalid shader name: ${shaderName}`);
        return null;
      }

      const programSource = this.shaderSources.get(shaderName);
      if (!programSource) {
        console.error(`ShaderManager: Shader source "${shaderName}" not found.`);
        return null;
      }

      // Validate shader source
      if (!programSource.vertexShaderSource || !programSource.fragmentShaderSource) {
        console.error(`ShaderManager: Incomplete shader source for "${shaderName}".`);
        return null;
      }

      // Process the shaders
      const processedVertexShader = this.preprocessShader(programSource.vertexShaderSource);
      const processedFragmentShader = this.preprocessShader(programSource.fragmentShaderSource);

      // Create an empty, safe uniform object as a fallback
      const safeDefaultUniforms = {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(1, 1) }
      };

      // Create uniforms safely
      let finalUniforms: THREE.ShaderMaterialParameters['uniforms'] = { ...safeDefaultUniforms };

      try {
        // Get default uniforms with safe fallback
        let defaultUniforms = {};
        if (programSource.defaultUniforms) {
          try {
            defaultUniforms = programSource.defaultUniforms() || {};

            // Validate each uniform has a valid value property
            Object.entries(defaultUniforms).forEach(([key, uniform]) => {
              const typedUniform = uniform as THREE.IUniform<any>;
              if (typedUniform.value === undefined || typedUniform.value === null) {
                console.warn(`ShaderManager: Uniform "${key}" in "${shaderName}" has undefined value. Setting default.`);
                typedUniform.value = null; // Ensure value exists, even if null
              }
            });
          } catch (uniformError) {
            console.warn(`ShaderManager: Error creating default uniforms for "${shaderName}":`, uniformError);
          }
        }

        // Clone uniforms with safety checks
        let clonedGlobalUniforms = { ...safeDefaultUniforms };
        let clonedDefaultUniforms = {};
        let clonedInstanceUniforms = {};

        try {
          if (this.globalUniforms && Object.keys(this.globalUniforms).length > 0) {
            clonedGlobalUniforms = THREE.UniformsUtils.clone(this.globalUniforms);
          }
        } catch (error) {
          console.warn("ShaderManager: Failed to clone global uniforms, using safe defaults", error);
        }

        try {
          if (Object.keys(defaultUniforms).length > 0) {
            clonedDefaultUniforms = THREE.UniformsUtils.clone(defaultUniforms);
          }
        } catch (error) {
          console.warn("ShaderManager: Failed to clone default uniforms", error);
        }

        try {
          if (instanceUniformsOverrides && Object.keys(instanceUniformsOverrides).length > 0) {
            clonedInstanceUniforms = THREE.UniformsUtils.clone(instanceUniformsOverrides);
          }
        } catch (error) {
          console.warn("ShaderManager: Failed to clone instance uniforms", error);
        }

        // Merge uniforms safely
        finalUniforms = { ...safeDefaultUniforms };

        // Helper to safely merge uniform objects
        const safelyMergeUniforms = (target: any, source: any) => {
          if (!source || typeof source !== 'object') return;

          Object.keys(source).forEach(key => {
            if (source[key] !== undefined) {
              // Always ensure the uniform has a valid structure
              if (!target[key]) target[key] = { value: null };

              // Only set the value if it's a valid uniform object
              if (source[key].value !== undefined) {
                target[key] = source[key];
              } else {
                console.warn(`ShaderManager: Uniform "${key}" has invalid structure. Creating default.`);
                target[key] = { value: source[key] }; // Wrap primitive values if needed
              }
            }
          });
        };

        // First apply global uniforms
        safelyMergeUniforms(finalUniforms, clonedGlobalUniforms);

        // Then apply default uniforms
        safelyMergeUniforms(finalUniforms, clonedDefaultUniforms);

        // Finally apply instance-specific uniforms
        safelyMergeUniforms(finalUniforms, clonedInstanceUniforms);

      } catch (uniformsError) {
        console.warn(`ShaderManager: Error processing uniforms for "${shaderName}":`, uniformsError);
        // Fallback to safe default uniforms
        finalUniforms = { ...safeDefaultUniforms };
      }

      // Create the material with default params that can be overridden
      // Detect if this is a shader that uses THREE.js built-in chunks or gl_FragColor
      // WebGL 1.0 shaders use gl_FragColor, WebGL 2.0 uses custom output variables
      const usesLegacyShaderSyntax = processedFragmentShader.includes('gl_FragColor');
      const usesThreeChunks = processedVertexShader.includes('// THREE.js chunks handled') || 
                              processedFragmentShader.includes('// THREE.js chunks handled');
                           
      // Default parameters with correct GLSL version based on shader content
      const defaultMaterialParams = {
        vertexShader: processedVertexShader,
        fragmentShader: processedFragmentShader,
        uniforms: finalUniforms,
        lights: false,
        transparent: false,
        side: THREE.FrontSide,
        // Use WebGL 1.0 for shaders that use gl_FragColor, WebGL 2.0 for others
        glslVersion: usesLegacyShaderSyntax ? THREE.GLSL1 : THREE.GLSL3,
        defines: {
          USE_THREE_CHUNKS: usesThreeChunks,
          // Add GLSL3 define for WebGL 2.0 shaders so the shader can adapt
          GLSL3: !usesLegacyShaderSyntax
        }
      };
      
      // Log the GLSL version being used for this shader
      console.log(`ShaderManager: Created material for "${shaderName}" using ${
        usesLegacyShaderSyntax ? 'GLSL1 (WebGL 1.0)' : 'GLSL3 (WebGL 2.0)'
      }`);
      

      // Add program source material parameters
      const materialParams = {
        ...defaultMaterialParams,
        ...(programSource.materialParameters || {}),
        ...(instanceMaterialParams || {})
      };
      
      // Log success or potential issues with material creation
      if (materialParams.vertexShader.includes('#include <') || materialParams.fragmentShader.includes('#include <')) {
        console.log(`ShaderManager: ${shaderName} uses THREE.js includes, ensuring proper handling`);
      }

      // Create the material
      const material = new THREE.ShaderMaterial(materialParams);

      // Set name for debugging
      material.name = shaderName;

      // Verify the material is valid
      if (!material.vertexShader || !material.fragmentShader) {
        console.error(`ShaderManager: Created material for "${shaderName}" has missing shaders.`);
        return null;
      }

      console.log(`ShaderManager: Successfully created material for "${shaderName}"`);
      return material;
    } catch (error) {
      console.error(`ShaderManager: Error creating material for "${shaderName}":`, error);
      return null;
    }
  }

  public update(deltaTime: number, elapsedTime: number, screenWidth: number, screenHeight: number): void {
    // Update global uniforms that all shaders can access
    // Safely handle update in case objects are undefined
    try {
      if (this.globalUniforms.uTime && this.globalUniforms.uTime.value !== undefined) {
        this.globalUniforms.uTime.value = elapsedTime;
      }

      if (this.globalUniforms.uResolution && this.globalUniforms.uResolution.value) {
        this.globalUniforms.uResolution.value.set(screenWidth, screenHeight);
      }
    } catch (error) {
      console.warn("ShaderManager: Error updating global uniforms", error);
    }
  }
  
  // For backward compatibility with existing code
  public getMaterial(type: MaterialType): THREE.Material | undefined {
    if (!this.materials.has(type)) {
        console.warn(`ShaderManager: Material type "${type}" not found. Creating a fallback basic material.`);
        // Fallback for undefined materials during development
        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }); // Magenta wireframe
        this.materials.set(type, fallbackMaterial);
        return fallbackMaterial;
    }
    return this.materials.get(type);
  }

  /**
   * Reset the internal shader program cache.
   * This is useful when shader errors occur, allowing clean recompilation.
   */
  /**
   * Thoroughly resets the shader program cache to handle WebGL context recreation
   * and prevent "Cannot set properties of undefined (setting 'value')" errors
   */
  public resetProgramCache(): void {
    try {
      console.log('ShaderManager: Starting complete program cache reset...');

      // First, attempt to fully dispose each material and its WebGL resources
      this.materialCache.forEach((cached, key) => {
        try {
          if (cached.material) {
            // Mark for recompilation
            cached.material.needsUpdate = true;

            // Safely clear uniform values to prevent stale references
            if (cached.material.uniforms) {
              Object.keys(cached.material.uniforms).forEach(uniformKey => {
                try {
                  const uniform = cached.material.uniforms[uniformKey];
                  if (!uniform) return;

                  // Handle different uniform types properly
                  if (uniform.value !== null && typeof uniform.value === 'object') {
                    // THREE.js objects
                    if (typeof uniform.value.dispose === 'function') {
                      try { uniform.value.dispose(); } catch (e) { /* ignore */ }
                    }

                    // Try to clone if possible, or safely set to null or default value
                    if (typeof uniform.value.clone === 'function') {
                      try {
                        uniform.value = uniform.value.clone();
                      } catch (e) {
                        console.warn(`ShaderManager: Error cloning uniform ${uniformKey}, creating fresh object`, e);

                        // Create appropriate fresh default based on common THREE.js types
                        if (uniform.value instanceof THREE.Vector2) {
                          uniform.value = new THREE.Vector2(0, 0);
                        } else if (uniform.value instanceof THREE.Vector3) {
                          uniform.value = new THREE.Vector3(0, 0, 0);
                        } else if (uniform.value instanceof THREE.Vector4) {
                          uniform.value = new THREE.Vector4(0, 0, 0, 0);
                        } else if (uniform.value instanceof THREE.Matrix3) {
                          uniform.value = new THREE.Matrix3();
                        } else if (uniform.value instanceof THREE.Matrix4) {
                          uniform.value = new THREE.Matrix4();
                        } else if (uniform.value instanceof THREE.Color) {
                          uniform.value = new THREE.Color(0xffffff);
                        } else if (uniform.value instanceof THREE.Texture) {
                          uniform.value = null; // Textures need special handling
                        } else {
                          // Last resort
                          uniform.value = null;
                        }
                      }
                    } else {
                      // For non-THREE.js objects that don't have clone
                      if (Array.isArray(uniform.value)) {
                        uniform.value = [...uniform.value]; // Create a fresh array copy
                      } else {
                        // For other objects, create a fresh empty object
                        uniform.value = {};
                      }
                    }
                  } else if (typeof uniform.value === 'number') {
                    // Numbers can stay as-is
                  } else if (typeof uniform.value === 'boolean') {
                    // Booleans can stay as-is
                  } else {
                    // For other primitive types or null/undefined
                    uniform.value = null;
                  }
                } catch (uniformError) {
                  console.warn(`ShaderManager: Error processing uniform ${uniformKey}`, uniformError);
                  // Set to null as a fallback
                  try { cached.material.uniforms[uniformKey].value = null; } catch (e) { /* ignore */ }
                }
              });
            }

            // Dispose the material and all its WebGL resources
            try {
              cached.material.dispose();
            } catch (disposeError) {
              console.warn(`ShaderManager: Error disposing material for ${key}`, disposeError);
            }

            // Clear material reference
            cached.material = null;
          }
        } catch (materialError) {
          console.warn(`ShaderManager: Error processing cached material`, materialError);
        }
      });

      // Clear the cache entirely
      this.materialCache.clear();

      // Reset any internal state that might be tied to old WebGL context
      this.globalUniforms.uTime.value = 0.0;

      // Reset basic materials too as they might be linked to the broken context
      try {
        console.log("ShaderManager: Reinitializing basic materials...");
        
        // Dispose all materials in both systems
        this.materials.forEach(material => {
          try { material.dispose(); } catch(e) { /* Ignore */ }
        });
        this.materials.clear();
        
        // Re-initialize with fresh materials
        this.initializeDefaultMaterials();
      } catch (basicMaterialsError) {
        console.warn("ShaderManager: Error reinitializing basic materials:", basicMaterialsError);
      }

      // Force THREE.ShaderChunk to refresh in case any chunks were tainted
      try {
        // Re-register core chunks to ensure they're fresh
        this.coreChunksRegistered = false;
        this.registerCoreChunks();
      } catch (chunkError) {
        console.warn("ShaderManager: Error re-registering chunks:", chunkError);
      }

      // Trigger safety flag to use simple fallbacks for any subsequent shader creations
      try {
        // Create a global flag to indicate we're in recovery mode
        // This will signal player and other assets to use fallbacks more aggressively
        (window as any).__shaderSystemRecoveryMode = true;
        
        // Set a timer to clear the recovery mode after a delay
        setTimeout(() => {
          (window as any).__shaderSystemRecoveryMode = false;
          console.log("ShaderManager: Exited recovery mode");
        }, 5000); // 5 seconds should be enough for all assets to reinitialize
      } catch (flagError) {
        console.warn("ShaderManager: Error setting recovery flag:", flagError);
      }

      console.log('ShaderManager: Program cache reset completed successfully.');
    } catch (error) {
      console.error('ShaderManager: Error during program cache reset:', error);
    }
  }

  public createBubbleParticleMaterial(): THREE.ShaderMaterial {
    // Create shader for bubbles with simple fallback if import fails
    try {
      // Simple fallback vertex shader inline
      const particleVertexShader = `
        attribute float aScale;
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aRotation;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRotation;
        varying vec2 vUv;
        
        uniform float uBaseSize;
        uniform float uPixelRatio;
        
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vRotation = aRotation;
          vUv = uv;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uBaseSize * aScale * (100.0 / -mvPosition.z) * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;
      
      // Simple fallback fragment shader inline
      const bubbleFragmentShader = `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          float bubble = 1.0 - smoothstep(0.35, 0.5, dist);
          if (bubble < 0.01) discard;
          gl_FragColor = vec4(vColor, bubble * vAlpha);
        }
      `;
      
      return new THREE.ShaderMaterial({
        uniforms: {
          ...this.globalUniforms,
          uBaseSize: { value: 0.5 },
          uBaseColor: { value: new THREE.Color(0xffffff) },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 }
        },
        vertexShader: particleVertexShader,
        fragmentShader: bubbleFragmentShader || `
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            float circle = 1.0 - smoothstep(0.4, 0.5, dist);
            if (circle < 0.01) discard;
            gl_FragColor = vec4(vColor, circle * vAlpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    } catch (error) {
      console.error('ShaderManager: Failed to create bubble particle material', error);
      // Fallback to simple material
      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      return material as any;
    }
  }

  public createSparkleParticleMaterial(): THREE.ShaderMaterial {
    try {
      // Reuse same vertex shader
      const particleVertexShader = `
        attribute float aScale;
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aRotation;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRotation;
        varying vec2 vUv;
        
        uniform float uBaseSize;
        uniform float uPixelRatio;
        
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vRotation = aRotation;
          vUv = uv;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uBaseSize * aScale * (100.0 / -mvPosition.z) * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;
      
      // Custom sparkle shader with star shape
      const sparkleFragmentShader = `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv) * 2.0;
          float spike = max(1.0 - abs(uv.x * 2.0), 1.0 - abs(uv.y * 2.0));
          float mask = max(1.0 - dist, spike);
          if (mask < 0.01) discard;
          gl_FragColor = vec4(vColor, mask * vAlpha);
        }
      `;
      
      return new THREE.ShaderMaterial({
        uniforms: {
          ...this.globalUniforms,
          uBaseSize: { value: 0.5 },
          uBaseColor: { value: new THREE.Color(0xffffff) },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 }
        },
        vertexShader: particleVertexShader,
        fragmentShader: sparkleFragmentShader || `
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv) * 2.0;
            float spike = max(1.0 - abs(uv.x * 2.0), 1.0 - abs(uv.y * 2.0));
            float mask = max(1.0 - dist, spike);
            if (mask < 0.01) discard;
            gl_FragColor = vec4(vColor, mask * vAlpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    } catch (error) {
      console.error('ShaderManager: Failed to create sparkle particle material', error);
      // Fallback to simple material
      const material = new THREE.PointsMaterial({
        color: 0xffff00,
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      return material as any;
    }
  }

  public createDebrisParticleMaterial(): THREE.ShaderMaterial {
    try {
      // Reuse same vertex shader
      const particleVertexShader = `
        attribute float aScale;
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aRotation;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRotation;
        varying vec2 vUv;
        
        uniform float uBaseSize;
        uniform float uPixelRatio;
        
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vRotation = aRotation;
          vUv = uv;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uBaseSize * aScale * (100.0 / -mvPosition.z) * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `;
      
      // Custom debris shader with rough shape
      const impactDebrisShader = `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRotation;
        
        uniform vec3 uBaseColor;
        uniform float uTime;
        
        void main() {
          vec2 uv = gl_PointCoord;
          vec2 centered = uv - vec2(0.5);
          float dist = length(centered);
          
          float angle = atan(centered.y, centered.x);
          float roughness = sin(angle * 5.0) * 0.1 + cos(angle * 7.0) * 0.05;
          float shape = 1.0 - smoothstep(0.35 + roughness, 0.5, dist);
          
          if (shape * vAlpha < 0.01) discard;
          
          vec3 color = vColor * uBaseColor;
          gl_FragColor = vec4(color, shape * vAlpha);
        }
      `;
      
      return new THREE.ShaderMaterial({
        uniforms: {
          ...this.globalUniforms,
          uBaseSize: { value: 0.5 },
          uBaseColor: { value: new THREE.Color(0xaaaaaa) },
          uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 }
        },
        vertexShader: particleVertexShader,
        fragmentShader: impactDebrisShader || `
          varying vec3 vColor;
          varying float vAlpha;
          
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            float roughShape = 1.0 - smoothstep(0.35, 0.5, dist);
            if (roughShape < 0.01) discard;
            gl_FragColor = vec4(vColor, roughShape * vAlpha);
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false
      });
    } catch (error) {
      console.error('ShaderManager: Failed to create debris particle material', error);
      // Fallback to simple material
      const material = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true
      });
      return material as any;
    }
  }

  public dispose(): void {
    // Dispose all materials in both systems
    this.materials.forEach(material => material.dispose());
    this.materials.clear();

    this.materialCache.forEach(cached => cached.material.dispose());
    this.materialCache.clear();

    this.shaderSources.clear();
    this.shaderChunks.clear();
    console.log('ShaderManager: Disposed all materials, shaders, and chunks.');
  }
}