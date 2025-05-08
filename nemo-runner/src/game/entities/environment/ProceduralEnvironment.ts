import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';
import { detectDeviceCapabilities, DeviceCapabilities } from '../../utils/DeviceUtils';
import { WaterEffects } from './WaterEffects';
import { EnvironmentSegment } from './EnvironmentSegment';
import { 
  EnvironmentTheme, 
  EnvironmentType, 
  ENVIRONMENT_THEMES, 
  applyEnvironmentTheme,
  lerpThemes
} from './EnvironmentTypes';
import { 
  DecorationDefinition, 
  getDecorationsForEnvironment 
} from './DecorationDefinitions';
import { NoiseGenerator } from '../../utils/NoiseGenerator';
import { SkyboxManager } from './SkyboxManager';
import { GroundSystem } from './GroundSystem';
import { DecorationFactory } from './DecorationFactory';

/**
 * ProceduralEnvironment is responsible for generating and managing the underwater environment
 * It creates segments of terrain with decorations and handles the transitions between environment types
 */
export class ProceduralEnvironment {
  private scene: THREE.Scene;
  private segments: EnvironmentSegment[] = [];
  private segmentLength: number = 100;
  private segmentWidth: number = 40;
  private visibleSegments: number = 3;
  private maxSegments: number = 10; // Maximum number of segments to keep in memory
  private currentTheme: EnvironmentTheme;
  private previousTheme: EnvironmentTheme | null = null;
  private nextThemeChange: number = 0;
  private totalDistance: number = 0;
  private waterEffects: WaterEffects;
  private themeTransitionProgress: number = 1.0; // 1.0 means fully transitioned
  private renderer: THREE.WebGLRenderer;
  private deviceCapabilities: DeviceCapabilities;
  private assetManager?: AssetManager;
  
  // Extracted components
  private skyboxManager: SkyboxManager;
  private groundSystem: GroundSystem;
  private decorationFactory: DecorationFactory;
  private noiseGenerator: NoiseGenerator;
  
  // Performance optimization
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraViewMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Quality settings
  private detailLevel: number = 2; // Default to medium detail (1-3)
  private maxDecorations: number = 100; // Default decoration count
  
  constructor(
    scene: THREE.Scene, 
    renderer: THREE.WebGLRenderer,
    assetManager?: AssetManager
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.assetManager = assetManager;
    this.currentTheme = ENVIRONMENT_THEMES.reef; // Start with reef environment
    
    // Initialize device capabilities
    this.deviceCapabilities = detectDeviceCapabilities();
    
    // Initialize noise generator
    this.noiseGenerator = new NoiseGenerator(Math.random());
    
    // Initialize skybox
    this.skyboxManager = new SkyboxManager(scene, this.currentTheme);
    
    // Initialize ground system
    this.groundSystem = new GroundSystem(scene, this.deviceCapabilities, this.currentTheme);
    
    // Initialize decoration factory
    this.decorationFactory = new DecorationFactory(scene, this.deviceCapabilities, assetManager);
    
    // Initialize with a few segments
    for (let i = 0; i < this.visibleSegments; i++) {
      this.createSegment(new THREE.Vector3(0, 0, i * this.segmentLength));
    }
    
    // Create water effects
    // Use the already detected capabilities from constructor
    const quality = this.deviceCapabilities.highEnd ? 'high' : 
                 this.deviceCapabilities.midRange ? 'medium' : 'low';
    this.waterEffects = new WaterEffects(scene, quality);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for environment interaction
   */
  private setupEventListeners(): void {
    // Listen for player position events to trigger environment transitions
    eventBus.on('player-position', this.checkEnvironmentTransition.bind(this));
    
    // Listen for collectibles that might trigger environmental changes
    eventBus.on('collect', (data: { type: string, position: THREE.Vector3 }) => {
      // Special collectibles might trigger environment changes
      if (data.type === 'environment_change') {
        this.queueEnvironmentChange();
      }
    });
  }
  
  /**
   * Check if an environment transition is needed
   */
  private checkEnvironmentTransition(playerPosition: THREE.Vector3): void {
    // Check distance for theme change
    if (Math.abs(playerPosition.z) > this.nextThemeChange && this.themeTransitionProgress >= 1.0) {
      this.queueEnvironmentChange();
    }
  }
  
  /**
   * Queue an environment change to occur
   */
  private queueEnvironmentChange(): void {
    // Select a new environment theme different from current
    const availableThemes = Object.values(ENVIRONMENT_THEMES).filter(
      theme => theme.type !== this.currentTheme.type
    );
    
    if (availableThemes.length === 0) return;
    
    // Randomly select a new theme
    const newTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
    
    // Start theme transition
    this.previousTheme = this.currentTheme;
    this.currentTheme = newTheme;
    this.themeTransitionProgress = 0.0;
    
    // Set next theme change to be further ahead
    this.nextThemeChange = Math.abs(this.totalDistance) + 500 + Math.random() * 500;
    
    // Emit event about environment changing
    eventBus.emit('environment-change-start', {
      from: this.previousTheme.type,
      to: this.currentTheme.type
    });
  }
  
  /**
   * Update environment based on player position with enhanced transitions
   * @param playerPosition Player's position
   * @param camera Camera to use for frustum culling
   * @param deltaTime Time since last update
   */
  public update(
    playerPosition: THREE.Vector3,
    camera: THREE.Camera,
    deltaTime: number
  ): void {
    // Update total distance
    this.totalDistance = playerPosition.z;
    
    // Check for theme change conditions before transition
    if (this.themeTransitionProgress >= 1.0) {
      this.checkEnvironmentTransition(playerPosition);
    }
    
    // Update theme transition if in progress
    if (this.themeTransitionProgress < 1.0 && this.previousTheme) {
      // Adaptive transition speed based on theme difference
      // More drastic changes (like reef to deep sea) transition slower
      const transitionSpeed = this.calculateTransitionSpeed(this.previousTheme, this.currentTheme);
      
      // Update transition progress
      this.themeTransitionProgress = Math.min(1.0, this.themeTransitionProgress + deltaTime * transitionSpeed);
      
      // Update theme-dependent elements
      this.updateThemeTransition(this.themeTransitionProgress);
      
      // Emit completion event when transition is done
      if (this.themeTransitionProgress >= 1.0) {
        eventBus.emit('environment-change-complete', {
          type: this.currentTheme.type
        });
      }
    }
    
    // Check if new segments need to be created ahead of the player
    this.checkSegmentCreation(playerPosition);
    
    // Update frustum for culling
    this.updateFrustum(camera);
    
    // Show or hide segments based on visibility
    this.cullSegments(playerPosition);
    
    // Update water effects with intensity based on theme 
    this.waterEffects.update(deltaTime, playerPosition);
    
    // Update ground system
    this.groundSystem.update(playerPosition);
    
    // Update skybox position
    this.skyboxManager.updatePosition(camera.position);
  }
  
  /**
   * Calculate the appropriate transition speed based on theme difference
   * @param fromTheme The starting theme
   * @param toTheme The target theme
   * @returns Transition speed factor
   */
  private calculateTransitionSpeed(fromTheme: EnvironmentTheme, toTheme: EnvironmentTheme): number {
    // Base transition speed
    const baseSpeed = 0.2;
    
    // Calculate color difference between themes as a measure of visual difference
    const fromColor = new THREE.Color(fromTheme.backgroundColor);
    const toColor = new THREE.Color(toTheme.backgroundColor);
    
    // Calculate color distance (simplified)
    const colorDifference = Math.sqrt(
      Math.pow(fromColor.r - toColor.r, 2) +
      Math.pow(fromColor.g - toColor.g, 2) +
      Math.pow(fromColor.b - toColor.b, 2)
    );
    
    // Calculate fog density difference
    const fogDifference = Math.abs(fromTheme.fogDensity - toTheme.fogDensity);
    
    // Calculate light difference
    const lightDifference = Math.abs(fromTheme.lightIntensity - toTheme.lightIntensity);
    
    // Combined difference factor (normalized to 0-1 range)
    const totalDifference = (colorDifference + fogDifference * 10 + lightDifference) / 3;
    
    // Adjust speed based on difference - more different themes transition more slowly
    const speedFactor = 1.0 - Math.min(0.7, totalDifference);
    
    return baseSpeed * speedFactor;
  }
  
  /**
   * Update theme transition effects with enhanced transitions
   * @param progress Transition progress (0-1)
   */
  private updateThemeTransition(progress: number): void {
    if (!this.previousTheme) return;
    
    // Use eased progress for smoother transitions
    // Apply cubic ease-in-out function for natural transition feeling
    const easedProgress = this.easeInOutCubic(progress);
    
    // Update skybox colors with eased progress
    this.skyboxManager.updateSkybox(this.currentTheme, easedProgress, this.previousTheme);
    
    // Update ground colors with eased progress
    this.groundSystem.updateTheme(this.currentTheme, easedProgress, this.previousTheme);
    
    // Update water effects with eased progress
    this.waterEffects.updateTheme(this.currentTheme, easedProgress);
    
    // Apply fog transition using eased progress
    this.updateFogTransition(easedProgress);
    
    // Apply scene lighting transition
    this.updateLightingTransition(easedProgress);
    
    // Emit transition progress event for UI and other systems
    eventBus.emit('environment-transition-progress', {
      from: this.previousTheme.type,
      to: this.currentTheme.type,
      progress: easedProgress
    });
  }
  
  /**
   * Apply cubic ease-in-out function for smoother transitions
   * @param t Linear progress (0-1)
   * @returns Eased progress (0-1)
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Update fog during theme transition
   * @param progress Transition progress (0-1)
   */
  private updateFogTransition(progress: number): void {
    if (!this.previousTheme || !this.scene.fog) return;
    
    // Get fog parameters
    const currentFog = this.currentTheme.fogColor;
    const currentDensity = this.currentTheme.fogDensity;
    
    const previousFog = this.previousTheme.fogColor;
    const previousDensity = this.previousTheme.fogDensity;
    
    // Create interpolated color
    const currentColor = new THREE.Color(currentFog);
    const previousColor = new THREE.Color(previousFog);
    
    // Interpolate between colors
    const interpolatedColor = previousColor.clone().lerp(currentColor, progress);
    
    // Interpolate fog density
    const interpolatedDensity = 
      previousDensity + (currentDensity - previousDensity) * progress;
    
    // Apply to scene fog
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color = interpolatedColor;
      this.scene.fog.density = interpolatedDensity;
    } else {
      // If fog type changes, create new fog
      this.scene.fog = new THREE.FogExp2(interpolatedColor, interpolatedDensity);
    }
    
    // Also update background color for consistent look
    this.scene.background = interpolatedColor;
  }
  
  /**
   * Update lighting during theme transition
   * @param progress Transition progress (0-1)
   */
  private updateLightingTransition(progress: number): void {
    if (!this.previousTheme) return;
    
    // Find all lights in the scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        // Adjust light intensity based on theme transition
        const previousIntensity = this.previousTheme!.lightIntensity;
        const currentIntensity = this.currentTheme.lightIntensity;
        
        // Interpolate light intensity
        const interpolatedIntensity = 
          previousIntensity + (currentIntensity - previousIntensity) * progress;
        
        object.intensity = interpolatedIntensity;
        
        // If it's a directional or hemisphere light, may also want to adjust color
        if (object instanceof THREE.DirectionalLight || 
            object instanceof THREE.HemisphereLight) {
          
          // Use decoration colors as approximate light colors
          const previousColor = new THREE.Color(this.previousTheme!.decorationColor || 0xffffff);
          const currentColor = new THREE.Color(this.currentTheme.decorationColor || 0xffffff);
          
          // Interpolate color
          object.color.copy(previousColor).lerp(currentColor, progress);
        }
      }
    });
  }
  
  /**
   * Update the view frustum for culling
   */
  private updateFrustum(camera: THREE.Camera): void {
    // Update the camera view frustum for culling
    camera.updateMatrixWorld();
    this.cameraViewMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewMatrix);
  }
  
  /**
   * Create a new environment segment with obstacle integration
   * @param position Segment position
   * @returns Created segment
   */
  private createSegment(position: THREE.Vector3): EnvironmentSegment {
    // Create segment with current theme and pass device capabilities to prevent creating new WebGL contexts
    const segment = new EnvironmentSegment(
      this.scene,
      this.currentTheme,
      position,
      this.segmentLength,
      this.segmentWidth,
      false, // We'll handle decorations separately
      this.deviceCapabilities // Pass our cached capabilities to avoid creating new WebGL contexts
    );
    
    // Add to segments list
    this.segments.push(segment);
    
    // Keep segments list at maximum size
    if (this.segments.length > this.maxSegments) {
      // Remove oldest segment
      const oldestSegment = this.segments.shift();
      if (oldestSegment) {
        oldestSegment.dispose();
      }
    }
    
    // Add decorations to the segment, considering obstacle placement
    this.addDecorationsToSegment(segment);
    
    // Add ground details using the ground system
    const floorMeshes: THREE.Mesh[] = [];
    segment.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name.includes('floor')) {
        floorMeshes.push(obj);
      }
    });
    
    if (floorMeshes.length > 0) {
      this.groundSystem.populateRegion(
        segment.mesh.position,
        this.segmentWidth,
        this.segmentLength,
        floorMeshes
      );
    }
    
    // Register lane safety info to avoid obstacle/decoration conflicts
    this.registerSafeZones(segment);
    
    return segment;
  }
  
  /**
   * Registers decoration locations as safe zones to prevent obstacle collision
   * This helps integrate the procedural environment with the obstacle system
   * @param segment The segment to register safe zones for
   */
  private registerSafeZones(segment: EnvironmentSegment): void {
    try {
      // We use an event to communicate with the obstacle manager
      // This allows for loose coupling between systems
      
      // Collect decoration positions that need clearance
      const safeZones: Array<{
        position: THREE.Vector3;
        radius: number;
      }> = [];
      
      // Analyze segment decorations to identify important decoration clusters
      segment.decorations.children.forEach(decoration => {
        // Skip very small decorations
        if (decoration.scale.x < 0.5 || !decoration.visible) return;
        
        // Get world position
        const worldPos = new THREE.Vector3();
        decoration.getWorldPosition(worldPos);
        
        // Calculate bounding box (approximate)
        let radius = 0.5; // Default radius
        
        // If it's a group or has children, use a larger radius
        if (decoration instanceof THREE.Group && decoration.children.length > 0) {
          radius = 1.0; // Larger radius for groups
          
          // If it's a larger decoration, use an even larger radius
          if (decoration.scale.x > 1.5 || decoration.scale.y > 1.5) {
            radius = 2.0;
          }
        }
        
        // Add to safe zones
        safeZones.push({
          position: worldPos,
          radius: radius
        });
      });
      
      // If we have safe zones to register, emit an event with the data
      if (safeZones.length > 0) {
        // Only use a subset of zones to avoid over-restricting obstacle placement
        // Focus on the largest decorations (sort by radius)
        const sortedZones = safeZones.sort((a, b) => b.radius - a.radius);
        
        // Take the top N zones
        const topZones = sortedZones.slice(0, Math.min(5, sortedZones.length));
        
        // Emit event with zone data for the obstacle manager to consume
        eventBus.emit('environment-safe-zones-update', {
          segmentZ: segment.mesh.position.z,
          segmentLength: this.segmentLength,
          safeZones: topZones
        });
      }
    } catch (error) {
      console.warn('Error registering safe zones:', error);
    }
  }
  
  /**
   * Add decorations to a segment with comprehensive error handling and enhanced clustering
   * @param segment Segment to add decorations to
   */
  private addDecorationsToSegment(segment: EnvironmentSegment): void {
    try {
      // Maximum attempts to create this segment's decorations before giving up
      const MAX_SEGMENT_ATTEMPTS = 3;
      let segmentAttempts = 0;
      
      while (segmentAttempts < MAX_SEGMENT_ATTEMPTS) {
        try {
          // Get decorations for the current environment type with fallbacks
          let availableDecorations = getDecorationsForEnvironment(this.currentTheme.type);
          
          // If we don't get any decorations, try to get basic rocks as a last resort
          if (availableDecorations.length === 0) {
            // Get just rock decorations which are simplest and most reliable
            availableDecorations = getDecorationsForEnvironment('reef')
              .filter(def => def.type.includes('rock'));
            
            // If still no decorations, just return without adding any
            if (availableDecorations.length === 0) return;
          }
          
          // Calculate total probability weight with safety checks
          const totalWeight = availableDecorations.reduce((sum, def) => sum + Math.max(0, def.probability || 0.1), 0);
          
          // Calculate reasonable number of decorations based on density and device capabilities
          // Significantly reduce numbers for lower-end devices
          const maxDecorations = Math.min(
            Math.floor((this.currentTheme.decorationDensity || 1) * this.segmentLength / 10),
            this.deviceCapabilities.highEnd ? 40 : 
            this.deviceCapabilities.midRange ? 25 : 12
          );
          
          // Track successful decorations to limit retries
          let successfulDecorations = 0;
          const MAX_FAILURES_PER_SEGMENT = 5;
          let consecutiveFailures = 0;
          
          // Create decoration clusters instead of individual placements
          const clusterCount = Math.ceil(maxDecorations / 5); // Approximately 5 decorations per cluster
          const clustersCreated = this.createDecorationClusters(
            segment,
            clusterCount,
            availableDecorations,
            totalWeight
          );
          
          if (clustersCreated > 0) {
            successfulDecorations += clustersCreated * 3; // Approximate count
            // If cluster creation was successful, we're done with this segment
            break;
          }
          
          // Fallback to individual decoration placement if clustering failed
          for (let i = 0; i < maxDecorations; i++) {
            // Break out if we've had too many consecutive failures
            if (consecutiveFailures >= MAX_FAILURES_PER_SEGMENT) {
              console.log(`Reached maximum consecutive decoration failures (${MAX_FAILURES_PER_SEGMENT}), stopping decoration creation for this segment`);
              break;
            }
            
            try {
              // Select a decoration type based on probability
              const randomValue = Math.random() * totalWeight;
              let cumulativeWeight = 0;
              let selectedDecoration: DecorationDefinition | null = null;
              
              for (const decoration of availableDecorations) {
                cumulativeWeight += (decoration.probability || 0.1);
                if (randomValue <= cumulativeWeight) {
                  selectedDecoration = decoration;
                  break;
                }
              }
              
              // Fallback to rocks if we couldn't select a decoration
              if (!selectedDecoration) {
                // Find a rock decoration as they're simplest
                selectedDecoration = availableDecorations.find(d => d.type.includes('rock')) || 
                                    availableDecorations[0];
              }
              
              // Generate position using improved distribution method
              const position = this.generateNaturalPosition(segment, selectedDecoration);
              
              // Only proceed if we got a valid position
              if (position) {
                try {
                  // Use decoration factory to create the decoration
                  const decoration = this.decorationFactory.createDecoration(
                    selectedDecoration,
                    position,
                    this.currentTheme
                  );
                  
                  // Add to segment if created and valid
                  if (decoration) {
                    // Verify the decoration has a valid position
                    const isValidPosition = !isNaN(decoration.position.x) && 
                                          !isNaN(decoration.position.y) && 
                                          !isNaN(decoration.position.z);
                                          
                    if (isValidPosition) {
                      segment.decorations.add(decoration);
                      successfulDecorations++;
                      consecutiveFailures = 0; // Reset failure counter on success
                    } else {
                      console.log(`Invalid decoration position: ${decoration.position.x}, ${decoration.position.y}, ${decoration.position.z}`);
                      consecutiveFailures++;
                    }
                  } else {
                    consecutiveFailures++;
                  }
                } catch (decorationError) {
                  // Log but continue - we want to be robust against single decoration failures
                  console.log(`Error creating decoration ${selectedDecoration.type}: ${decorationError}`);
                  consecutiveFailures++;
                  continue;
                }
              } else {
                // No valid position found
                consecutiveFailures++;
              }
            } catch (loopError) {
              // Log but continue to the next decoration
              console.log(`Error in decoration loop: ${loopError}`);
              consecutiveFailures++;
              continue;
            }
          }
          
          // If we've successfully added at least some decorations, or this is our last attempt, we're done
          if (successfulDecorations > 0 || segmentAttempts === MAX_SEGMENT_ATTEMPTS - 1) {
            break;
          }
          
          // Otherwise try again with a different configuration
          segmentAttempts++;
        } catch (attemptError) {
          console.warn(`Error on decoration segment attempt ${segmentAttempts + 1}: ${attemptError}`);
          segmentAttempts++;
        }
      }
    } catch (error) {
      // Log but don't let decoration errors stop the whole game
      console.warn(`Error adding decorations to segment: ${error}`);
      
      // Continue the game without decorations if necessary
      try {
        // Try to add just a few very basic rock decorations as a last resort
        for (let i = 0; i < 5; i++) {
          try {
            // Create a basic rock - using a known-safe decoration type
            const rockDef = {
              type: 'rock1',
              scale: 1.0,
              yOffset: -1.8,
              rotationVariance: Math.PI * 2,
              scaleVariance: 0.4,
              canFloatAboveGround: false,
              environmentTypes: ['reef'],
              probability: 1.0
            };
            
            // Generate random position
            const x = (Math.random() - 0.5) * this.segmentWidth;
            const z = segment.mesh.position.z + Math.random() * this.segmentLength;
            const position = new THREE.Vector3(x, 0, z);
            
            // Try to create the decoration
            const decoration = this.decorationFactory.createPlaceholderDecoration('rock1');
            decoration.position.copy(position);
            
            // Add to segment
            segment.decorations.add(decoration);
          } catch (rockError) {
            // Just continue - we're in super-failsafe mode here
            continue;
          }
        }
      } catch (failsafeError) {
        // At this point, we just give up on decorations entirely
        console.error(`Complete decoration failure: ${failsafeError}`);
      }
    }
  }
  
  /**
   * Generate a natural position for a decoration based on noise and decoration type
   * This creates more realistic, less uniform placements
   * @param segment The segment to add decoration to
   * @param definition The decoration definition
   * @returns Position vector or null if no suitable position found
   */
  private generateNaturalPosition(
    segment: EnvironmentSegment,
    definition: DecorationDefinition
  ): THREE.Vector3 | null {
    try {
      // Base position within segment
      const segmentZ = segment.mesh.position.z;
      
      // Different decoration types have different placement preferences
      const isFloating = definition.canFloatAboveGround;
      const isRock = definition.type.includes('rock');
      const isCoral = definition.type.includes('coral');
      const isVegetation = definition.type.includes('weed') || 
                         definition.type.includes('kelp') || 
                         definition.type.includes('grass');
      
      // Try several times to find a good position
      const MAX_POSITION_ATTEMPTS = 5;
      
      for (let attempt = 0; attempt < MAX_POSITION_ATTEMPTS; attempt++) {
        // Generate base random position
        let x = (Math.random() - 0.5) * this.segmentWidth;
        let z = segmentZ + Math.random() * this.segmentLength;
        
        // Use main noise field for base distribution
        const baseNoise = this.noiseGenerator.noise2D(x * 0.05, z * 0.05);
        
        // Use secondary noise field for type-specific distribution
        const detailNoise = this.noiseGenerator.noise2D(x * 0.2, z * 0.2);
        
        // Each type has different noise thresholds for placement
        let canPlace = false;
        
        if (isFloating) {
          // Floating items are more evenly distributed but with some clustering
          canPlace = baseNoise > -0.3;
        } else if (isRock) {
          // Rocks tend to form in specific areas
          canPlace = baseNoise > 0.1 || detailNoise > 0.4;
        } else if (isCoral) {
          // Coral grows in clusters in specific areas
          canPlace = baseNoise > 0.2 || detailNoise > 0.5;
        } else if (isVegetation) {
          // Vegetation tends to grow in patches
          canPlace = baseNoise > -0.1 && detailNoise > 0;
        } else {
          // Default placement logic
          canPlace = baseNoise > -0.2;
        }
        
        if (canPlace) {
          // Apply some clustering within the valid zones
          // Move slightly toward nearest high-value noise point
          const nudgeAmount = 0.15; // How much to nudge toward clusters
          const baseNoiseGradient = {
            x: this.noiseGenerator.noise2D((x + 0.1) * 0.05, z * 0.05) - baseNoise,
            z: this.noiseGenerator.noise2D(x * 0.05, (z + 0.1) * 0.05) - baseNoise
          };
          
          // Nudge toward higher noise values (clusters)
          x += baseNoiseGradient.x * this.segmentWidth * nudgeAmount;
          z += baseNoiseGradient.z * this.segmentLength * nudgeAmount;
          
          // Create y position - floating items have different heights
          let y = 0;
          if (isFloating) {
            // Varied height for floating items
            const heightVariation = 1.5; // Maximum height variation
            y = (baseNoise + 1) * heightVariation;
          }
          
          // Keep within segment bounds
          x = Math.max(-this.segmentWidth/2, Math.min(this.segmentWidth/2, x));
          
          return new THREE.Vector3(x, y, z);
        }
      }
      
      // After several attempts, if no good position was found, fall back to basic random
      if (Math.random() < 0.3) { // Only place 30% of fallback positions to avoid overcrowding
        return new THREE.Vector3(
          (Math.random() - 0.5) * this.segmentWidth,
          definition.canFloatAboveGround ? Math.random() * 1.5 : 0,
          segmentZ + Math.random() * this.segmentLength
        );
      }
      
      return null; // No suitable position found
    } catch (error) {
      console.log(`Error generating natural position: ${error}`);
      return null;
    }
  }
  
  /**
   * Create decoration clusters in the segment
   * @param segment Segment to add decorations to
   * @param clusterCount Number of clusters to create
   * @param availableDecorations Available decoration definitions
   * @param totalWeight Total probability weight
   * @returns Number of successful clusters created
   */
  private createDecorationClusters(
    segment: EnvironmentSegment,
    clusterCount: number,
    availableDecorations: DecorationDefinition[],
    totalWeight: number
  ): number {
    let successfulClusters = 0;
    
    try {
      for (let c = 0; c < clusterCount; c++) {
        // Find a central position for the cluster
        const segmentZ = segment.mesh.position.z;
        const centerX = (Math.random() - 0.5) * this.segmentWidth * 0.8; // Keep away from edges
        const centerZ = segmentZ + Math.random() * this.segmentLength;
        
        // Use noise to determine if this is a valid cluster location
        const locationNoise = this.noiseGenerator.noise2D(centerX * 0.03, centerZ * 0.03);
        
        // Only place clusters in favorable noise locations
        if (locationNoise < 0) continue;
        
        // Generate a cluster theme - randomly choose a primary decoration type
        // This makes clusters more natural (like a coral cluster or rock formation)
        let clusterTheme: string;
        
        const themeRoll = Math.random();
        if (themeRoll < 0.3) {
          clusterTheme = 'rock';
        } else if (themeRoll < 0.6) {
          clusterTheme = 'coral';
        } else if (themeRoll < 0.8) {
          clusterTheme = 'vegetation';
        } else {
          clusterTheme = 'mixed';
        }
        
        // Filter decorations that match the cluster theme
        const primaryDecorations = availableDecorations.filter(def => {
          if (clusterTheme === 'rock' && def.type.includes('rock')) return true;
          if (clusterTheme === 'coral' && def.type.includes('coral')) return true;
          if (clusterTheme === 'vegetation' && 
              (def.type.includes('weed') || def.type.includes('kelp') || def.type.includes('grass'))) {
            return true;
          }
          return clusterTheme === 'mixed'; // All decorations for mixed clusters
        });
        
        // If no matching decorations, skip this cluster
        if (primaryDecorations.length === 0) continue;
        
        // Determine cluster size based on noise value (higher noise = bigger cluster)
        const clusterSize = 3 + Math.floor(locationNoise * 5);
        let successfulPlacements = 0;
        
        // Fill the cluster with decorations
        for (let i = 0; i < clusterSize; i++) {
          try {
            // Select a decoration, prioritizing the cluster theme
            let selectedDecoration: DecorationDefinition;
            
            if (i === 0 || Math.random() < 0.8) {
              // 80% chance to use cluster theme decoration type (100% for first item)
              selectedDecoration = primaryDecorations[Math.floor(Math.random() * primaryDecorations.length)];
            } else {
              // 20% chance for variety with any decoration type
              const randomValue = Math.random() * totalWeight;
              let cumulativeWeight = 0;
              
              selectedDecoration = availableDecorations[0]; // Fallback
              for (const decoration of availableDecorations) {
                cumulativeWeight += (decoration.probability || 0.1);
                if (randomValue <= cumulativeWeight) {
                  selectedDecoration = decoration;
                  break;
                }
              }
            }
            
            // Generate a position within the cluster
            const radius = (i === 0) ? 0 : 1 + Math.random() * 3; // First item at center, others in radius
            const angle = Math.random() * Math.PI * 2;
            
            const x = centerX + Math.cos(angle) * radius;
            const z = centerZ + Math.sin(angle) * radius;
            
            // Ensure it's within segment bounds
            if (x < -this.segmentWidth/2 || x > this.segmentWidth/2) continue;
            
            // Determine height based on decoration type
            const y = selectedDecoration.canFloatAboveGround ? Math.random() * 1.5 : 0;
            
            const position = new THREE.Vector3(x, y, z);
            
            // Create the decoration
            const decoration = this.decorationFactory.createDecoration(
              selectedDecoration,
              position,
              this.currentTheme
            );
            
            // Add to segment if valid
            if (decoration && 
                !isNaN(decoration.position.x) && 
                !isNaN(decoration.position.y) && 
                !isNaN(decoration.position.z)) {
              segment.decorations.add(decoration);
              successfulPlacements++;
            }
          } catch (clusterElementError) {
            console.log(`Error creating cluster element: ${clusterElementError}`);
            continue; // Try next element
          }
        }
        
        // If we successfully placed at least 2 decorations, count it as a successful cluster
        if (successfulPlacements >= 2) {
          successfulClusters++;
        }
      }
    } catch (clusterError) {
      console.warn(`Error creating decoration clusters: ${clusterError}`);
    }
    
    return successfulClusters;
  }
  
  /**
   * Check if new segments need to be created ahead of the player
   * @param playerPosition Player's position
   */
  private checkSegmentCreation(playerPosition: THREE.Vector3): void {
    // Get the furthest segment
    let furthestZ = -Infinity;
    
    for (const segment of this.segments) {
      furthestZ = Math.max(furthestZ, segment.mesh.position.z);
    }
    
    // Check if player is close enough to the furthest segment
    const spawnDistance = this.segmentLength * 2;
    
    // Create new segments ahead as needed
    while (playerPosition.z - furthestZ < spawnDistance) {
      furthestZ += this.segmentLength;
      this.createSegment(new THREE.Vector3(0, 0, furthestZ));
    }
  }
  
  /**
   * Cull segments based on distance from player
   * @param playerPosition Player's position
   */
  private cullSegments(playerPosition: THREE.Vector3): void {
    // Toggle segment visibility based on distance and frustum
    for (const segment of this.segments) {
      const distanceZ = Math.abs(segment.mesh.position.z - playerPosition.z);
      
      // Check if segment is too far behind player
      if (segment.mesh.position.z - playerPosition.z < -this.segmentLength * 2) {
        // Too far behind, hide segment
        segment.isActive = false;
        segment.mesh.visible = false;
      } else if (distanceZ < this.segmentLength * 3) {
        // Close enough, check if in view frustum
        const isInFrustum = segment.isVisibleToCamera({ frustum: this.frustum } as any);
        segment.isActive = true;
        segment.mesh.visible = isInFrustum;
      } else {
        // Too far away, hide segment
        segment.isActive = false;
        segment.mesh.visible = false;
      }
    }
  }
  
  /**
   * Get the water effects for external reference
   * @returns Water effects instance
   */
  public getWaterEffects(): WaterEffects {
    return this.waterEffects;
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clean up segments
    for (const segment of this.segments) {
      segment.dispose();
    }
    this.segments = [];
    
    // Clean up water effects
    this.waterEffects.dispose();
    
    // Clean up ground system
    this.groundSystem.dispose();
    
    // Clean up skybox
    this.skyboxManager.dispose();
    
    // Clean up decoration factory
    this.decorationFactory.dispose();
    
    // Remove event listeners
    eventBus.off('player-position', this.checkEnvironmentTransition.bind(this));
  }
  
  /**
   * Set the detail level for environment rendering
   * @param level Detail level (1-3, where 1 is low, 2 is medium, 3 is high)
   */
  setDetailLevel(level: number): void {
    this.detailLevel = Math.max(1, Math.min(3, level));
    
    // Update decoration factory with new detail level
    if (this.decorationFactory) {
      this.decorationFactory.setDetailLevel(this.detailLevel);
    }
    
    console.log(`ProceduralEnvironment: Set detail level to ${this.detailLevel}`);
  }
  
  /**
   * Set the maximum number of decorations
   * @param count Maximum decoration count
   */
  setMaxDecorations(count: number): void {
    this.maxDecorations = Math.max(10, count);
    
    if (this.decorationFactory) {
      this.decorationFactory.setMaxDecorations(this.maxDecorations);
    }
    
    console.log(`ProceduralEnvironment: Set max decorations to ${this.maxDecorations}`);
  }
  
  /**
   * Configure the environment to use only procedural decorations,
   * ignoring asset loading completely
   * @param ignoreAssets Whether to ignore asset loading (true = use only procedural)
   */
  setIgnoreAssets(ignoreAssets: boolean = true): void {
    // Pass the configuration to the decoration factory
    if (this.decorationFactory) {
      this.decorationFactory.setIgnoreAssets(ignoreAssets);
      console.log(`ProceduralEnvironment: ${ignoreAssets ? 'Using only procedural generation' : 'Using mixed procedural and asset loading'}`);
    }
  }
}