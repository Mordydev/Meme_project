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
   * Update environment based on player position
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
    
    // Update theme transition if in progress
    if (this.themeTransitionProgress < 1.0 && this.previousTheme) {
      this.themeTransitionProgress = Math.min(1.0, this.themeTransitionProgress + deltaTime * 0.2);
      
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
    
    // Update water effects
    this.waterEffects.update(deltaTime, playerPosition);
    
    // Update ground system
    this.groundSystem.update(playerPosition);
    
    // Update skybox position
    this.skyboxManager.updatePosition(camera.position);
  }
  
  /**
   * Update theme transition effects
   * @param progress Transition progress (0-1)
   */
  private updateThemeTransition(progress: number): void {
    if (!this.previousTheme) return;
    
    // Update skybox colors
    this.skyboxManager.updateSkybox(this.currentTheme, progress, this.previousTheme);
    
    // Update ground colors
    this.groundSystem.updateTheme(this.currentTheme, progress, this.previousTheme);
    
    // Update water effects
    this.waterEffects.updateTheme(this.currentTheme, progress);
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
   * Create a new environment segment
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
    
    // Add decorations to the segment
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
    
    return segment;
  }
  
  /**
   * Add decorations to a segment
   * @param segment Segment to add decorations to
   */
  /**
   * Add decorations to a segment with comprehensive error handling
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
            this.deviceCapabilities.highEnd ? 30 : 
            this.deviceCapabilities.midRange ? 15 : 8
          );
          
          // Track successful decorations to limit retries
          let successfulDecorations = 0;
          const MAX_FAILURES_PER_SEGMENT = 5;
          let consecutiveFailures = 0;
          
          // Create decorations with retry limits
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
              
              // Generate random position within segment
              const x = (Math.random() - 0.5) * this.segmentWidth;
              const z = segment.mesh.position.z + Math.random() * this.segmentLength;
              
              // Use noise to add some clustering to decorations
              let noiseValue = 0;
              try {
                noiseValue = this.noiseGenerator.noise2D(x * 0.1, z * 0.1);
              } catch (noiseError) {
                // Default to a value that allows placement if noise fails
                noiseValue = 0;
              }
              
              // Only place if noise value is favorable
              if (noiseValue > -0.2) {
                try {
                  // Create decoration at position
                  const position = new THREE.Vector3(x, 0, z);
                  
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
}