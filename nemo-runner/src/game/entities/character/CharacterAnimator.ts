import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';

// Animation state type
export type CharacterAnimationState = 'swim' | 'idle' | 'jump' | 'dive' | 'turn_left' | 'turn_right' | 'hit' | 'power_up';

/**
 * Handles character animations including setup, transitions, and procedural animations
 */
export class CharacterAnimator {
  // Animation system
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAnimation: THREE.AnimationAction | null = null;
  
  // References
  private model: THREE.Group;
  private characterModel: CharacterModel;
  
  constructor(model: THREE.Group, characterModel: CharacterModel) {
    this.model = model;
    this.characterModel = characterModel;
  }
  
  /**
   * Initialize the animation system with the given animation clips
   */
  public initialize(animationClips?: THREE.AnimationClip[]): void {
    // Create animation mixer
    this.mixer = new THREE.AnimationMixer(this.model);
    
    // Process animation clips if provided
    if (animationClips && animationClips.length > 0) {
      this.setupAnimations(animationClips);
    }
    
    // Create fallback animations if needed
    this.createFallbackAnimations();
    
    // Start the default animation
    this.play('swim');
  }
  
  /**
   * Update the animation mixer
   */
  public update(deltaTime: number): void {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    } else {
      // Legacy animation fallback
      this.updateLegacyAnimation(deltaTime);
    }
  }
  
  /**
   * Play a specific animation with crossfade
   */
  public play(animationName: CharacterAnimationState, fadeDuration: number = 0.3): void {
    // Get the target animation
    const targetAction = this.animations.get(animationName);
    
    // If the animation doesn't exist or it's already the current animation, do nothing
    if (!targetAction || targetAction === this.currentAnimation) return;
    
    // Fade out the current animation if there is one
    if (this.currentAnimation) {
      this.currentAnimation.fadeOut(fadeDuration);
    }
    
    // Play the new animation with fade in
    targetAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(fadeDuration)
      .play();
    
    // Update the current animation reference
    this.currentAnimation = targetAction;
  }
  
  /**
   * Set up animation clips
   */
  private setupAnimations(animationClips: THREE.AnimationClip[]): void {
    if (!this.mixer) return;
    
    // Process all animation clips
    for (const clip of animationClips) {
      // Create animation action
      const action = this.mixer.clipAction(clip);
      
      // Store animation by name
      this.animations.set(clip.name, action);
      
      // Configure action
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(1);
      action.setLoop(THREE.LoopRepeat, Infinity);
      
      console.log(`Added animation: ${clip.name}`);
    }
  }
  
  /**
   * Create fallback procedural animations if needed
   */
  private createFallbackAnimations(): void {
    // Required animation types
    const requiredAnimations: CharacterAnimationState[] = [
      'swim', 'idle', 'jump', 'dive', 'hit', 'turn_left', 'turn_right', 'power_up'
    ];
    
    // Check which animations are missing and create fallbacks
    for (const animName of requiredAnimations) {
      if (!this.animations.has(animName)) {
        // Create a procedural animation clip
        const clip = this.createProceduralAnimation(animName);
        
        if (clip && this.mixer) {
          // Add the procedural animation
          const action = this.mixer.clipAction(clip);
          this.animations.set(animName, action);
          console.log(`Created procedural animation: ${animName}`);
        }
      }
    }
  }
  
  /**
   * Create a procedural animation clip for the given type
   */
  private createProceduralAnimation(animationType: CharacterAnimationState): THREE.AnimationClip | null {
    // Find the key components we want to animate
    const body = this.characterModel.getModelPart('body');
    const tail = this.characterModel.getModelPart('tail');
    const leftFin = this.characterModel.getModelPart('leftFin');
    const rightFin = this.characterModel.getModelPart('rightFin');
    
    // Create tracks based on the animation type
    const tracks: THREE.KeyframeTrack[] = [];
    const duration = 1; // 1 second loop duration
    
    switch (animationType) {
      case 'swim':
      case 'idle':
        // Body gentle wobble
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Initial rotation (identity quaternion)
                0, 0.05, 0, 0.9987, // Slight right turn
                0, 0, 0, 1, // Back to center
                0, -0.05, 0, 0.9987, // Slight left turn
                0, 0, 0, 1, // Back to center
              ]
            )
          );
        }
        
        // Tail swishing
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.1, 0.995, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.1, 0.995, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.1, 0.995, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.1, 0.995, // Left
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        
        // Fin movements
        if (leftFin) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${leftFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                0.05, 0, 0, 0.9987, // Up
                0, 0, 0, 1, // Neutral
                -0.05, 0, 0, 0.9987, // Down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        if (rightFin) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${rightFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                -0.05, 0, 0, 0.9987, // Down
                0, 0, 0, 1, // Neutral
                0.05, 0, 0, 0.9987, // Up
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        break;
        
      case 'turn_left':
        // Body leans left
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.5, 1],
              [
                0, 0, 0, 1, // Start neutral
                0, 0, -0.2, 0.9798, // Lean left
                0, 0, 0, 1, // End neutral
              ]
            )
          );
        }
        
        // Tail swishes right
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.2, 0.9798, // Swish right
                0, 0, 0.15, 0.9887, // Hold
                0, 0, 0.05, 0.9987, // Return
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'turn_right':
        // Body leans right
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.5, 1],
              [
                0, 0, 0, 1, // Start neutral
                0, 0, 0.2, 0.9798, // Lean right
                0, 0, 0, 1, // End neutral
              ]
            )
          );
        }
        
        // Tail swishes left
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, -0.2, 0.9798, // Swish left
                0, 0, -0.15, 0.9887, // Hold
                0, 0, -0.05, 0.9987, // Return
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'jump':
        // Excited body motion
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                -0.1, 0, 0, 0.995, // Tilt up
                0, 0, 0, 1, // Neutral
                0.05, 0, 0, 0.9987, // Slight down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // More vigorous tail motion
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'dive':
        // Downward-facing body
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                0.1, 0, 0, 0.995, // Tilt down
                0.15, 0, 0, 0.9887, // More down
                0.1, 0, 0, 0.995, // Less down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // Strong tail motion
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.2, 0.9798, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.2, 0.9798, // Left
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        break;
        
      case 'hit':
        // Recoil and shake animation
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
              [
                0, 0, 0, 1, // Neutral
                0.1, 0.05, 0, 0.9937, // Recoil
                0.05, -0.05, 0, 0.9975, // Shake 1
                0.05, 0.05, 0, 0.9975, // Shake 2
                0.05, -0.03, 0, 0.9983, // Shake 3
                0.05, 0.03, 0, 0.9983, // Shake 4
                0.03, -0.02, 0, 0.9992, // Small shake 1
                0.03, 0.02, 0, 0.9992, // Small shake 2
                0.02, -0.01, 0, 0.9998, // Tiny shake
                0.01, 0, 0, 0.9999, // Almost normal
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // Tail reaction
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
              [
                0, 0, 0, 1, // Neutral
                0, 0, 0.2, 0.9798, // Quick right
                0, 0, -0.25, 0.9682, // Quick left
                0, 0, 0.15, 0.9887, // Smaller right
                0, 0, -0.1, 0.995, // Smaller left
                0, 0, 0.05, 0.9987, // Tiny right
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        break;
        
      case 'power_up':
        // Excited, energetic swimming
        if (body) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${body.name}.quaternion`,
              [0, 0.2, 0.4, 0.6, 0.8, 1],
              [
                0, 0, 0, 1, // Neutral
                0.03, 0.03, 0, 0.9991, // Slight tilt 1
                0, 0.04, 0, 0.9992, // Slight tilt 2
                -0.03, 0.03, 0, 0.9991, // Slight tilt 3
                0, -0.04, 0, 0.9992, // Slight tilt 4
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        
        // Very fast tail movement
        if (tail) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${tail.name}.quaternion`,
              [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
              [
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
                0, 0, -0.15, 0.9887, // Left
                0, 0, 0, 1, // Center
                0, 0, 0.15, 0.9887, // Right
                0, 0, 0, 1, // Center
              ]
            )
          );
        }
        
        // Vigorous fin movements
        if (leftFin && rightFin) {
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${leftFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                0.1, 0, 0, 0.995, // Up
                0, 0, 0, 1, // Neutral
                -0.1, 0, 0, 0.995, // Down
                0, 0, 0, 1, // Neutral
              ]
            )
          );
          
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${rightFin.name}.quaternion`,
              [0, 0.25, 0.5, 0.75, 1],
              [
                0, 0, 0, 1, // Neutral
                -0.1, 0, 0, 0.995, // Down
                0, 0, 0, 1, // Neutral
                0.1, 0, 0, 0.995, // Up
                0, 0, 0, 1, // Neutral
              ]
            )
          );
        }
        break;
        
      default:
        return null;
    }
    
    // Create and return the animation clip if we have tracks
    if (tracks.length > 0) {
      return new THREE.AnimationClip(animationType, duration, tracks);
    }
    
    return null;
  }
  
  /**
   * Legacy animation system for when no mixer is available
   */
  private updateLegacyAnimation(deltaTime: number): void {
    const time = performance.now() * 0.003;
    
    // Body wobble
    this.model.rotation.y = Math.sin(time * 3) * 0.1;
    
    // Identify key parts
    const tail = this.characterModel.getModelPart('tail');
    const leftFin = this.characterModel.getModelPart('leftFin');
    const rightFin = this.characterModel.getModelPart('rightFin');
    
    // Animate tail with slower, more natural movement
    if (tail) {
      tail.rotation.y = Math.sin(time * 3) * 0.25;
    }
    
    // Animate fins with more gentle movement
    if (leftFin) {
      leftFin.rotation.x = Math.sin(time * 4) * 0.18;
    }
    
    if (rightFin) {
      rightFin.rotation.x = Math.sin(time * 4 + Math.PI) * 0.18;
    }
    
    // Animate dorsal fin if present - slower for more natural look
    const dorsalFin = this.characterModel.getModelPart('dorsal_fin');
    if (dorsalFin) {
      dorsalFin.rotation.z = Math.sin(time * 2.5) * 0.08;
    }
    
    // Animate pelvic fin if present - also slower
    const pelvicFin = this.characterModel.getModelPart('pelvic_fin');
    if (pelvicFin) {
      pelvicFin.rotation.x = Math.sin(time * 3) * 0.12;
    }
  }
  
  /**
   * Clean up animation resources
   */
  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    this.animations.clear();
    this.currentAnimation = null;
    this.mixer = null;
  }
}