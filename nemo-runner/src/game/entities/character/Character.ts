import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';
import gameStateManager from '../../core/GameStateManager';
import { CharacterModel } from './CharacterModel';
import { CharacterAnimator } from './CharacterAnimator';
import { CharacterController, CharacterState, LaneType } from './CharacterController';
import { CharacterEffects } from './CharacterEffects';
import { DeviceCapabilities, getDeviceCapabilities } from '../../utils/DeviceUtils';

/**
 * Main character class that composes all character modules
 */
export class Character {
  // Core components
  private scene: THREE.Scene;
  private model: CharacterModel;
  private animator: CharacterAnimator;
  private controller: CharacterController;
  private effects: CharacterEffects;
  
  // Character mesh
  private _mesh: THREE.Group;
  
  /**
   * Get the character mesh
   */
  public get mesh(): THREE.Group {
    return this._mesh;
  }
  
  // Device capabilities for optimization
  private deviceCapabilities: DeviceCapabilities;
  
  // Character state tracking
  private health: number = 3;
  private coins: number = 0;
  private alive: boolean = true;
  
  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    
    // Get device capabilities for optimizations
    this.deviceCapabilities = getDeviceCapabilities();
    
    // Create character model
    this.model = new CharacterModel(assetManager, this.deviceCapabilities);
    this._mesh = this.model.createModel();
    
    // Add mesh to scene
    this.scene.add(this._mesh);
    
    // Set up animator
    this.animator = new CharacterAnimator(this._mesh, this.model);
    
    // Initialize effects system
    this.effects = new CharacterEffects(this._mesh, scene, this.deviceCapabilities);
    
    // Set up controller with all components
    this.controller = new CharacterController(this._mesh, this.animator, this.effects, scene);
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Character initialized with all modules');
  }
  
  /**
   * Set up character event listeners
   */
  private setupEventListeners(): void {
    // Listen for coin collection
    eventBus.on('coin-collected', this.onCoinCollected.bind(this));
    
    // Listen for power-up collection
    eventBus.on('powerup-collected', this.onPowerUpCollected.bind(this));
    
    // Listen for player hit
    eventBus.on('player-hit', this.onPlayerHit.bind(this));
    
    // Game state changes
    eventBus.on('game-state-change', this.onGameStateChange.bind(this));
    
    // Game reset
    eventBus.on('game-reset', this.onGameReset.bind(this));
  }
  
  /**
   * Handle coin collection
   */
  private onCoinCollected(data: any): void {
    // Increment coin count
    this.coins += data.value || 1;
    
    // Emit updated coin count
    eventBus.emit('update-coins', { coins: this.coins });
    
    // Play coin sound
    eventBus.emit('play-sound', { name: 'coin-collect', volume: 0.3 });
  }
  
  /**
   * Handle power-up collection
   */
  private onPowerUpCollected(data: any): void {
    const type = data.type || 'speed';
    const duration = data.duration || 5;
    
    console.log(`Power-up collected: ${type}, duration: ${duration}s`);
    
    // Apply power-up effect based on type
    switch (type) {
      case 'speed':
        this.controller.setSpeedMultiplier(1.5);
        break;
      case 'shield':
        // Immunity will be handled in controller
        break;
      case 'magnet':
        // Magnet effect for coin attraction
        break;
    }
    
    // Activate visual effects
    this.effects.createPowerUpEffect(type, duration);
    
    // Activate power-up in controller
    this.controller.activatePowerUp(type, duration);
    
    // Note: This setTimeout is related to powerups, not game start movement,
    // so it's appropriate to keep it here
    setTimeout(() => {
      if (type === 'speed') {
        this.controller.setSpeedMultiplier(1.0);
      }
      // Effects will auto-remove in their own timeout
    }, duration * 1000);
  }
  
  /**
   * Handle player being hit
   */
  private onPlayerHit(data: any): void {
    if (!this.alive) return;
    
    // Create hit effect
    this.effects.createHitEffect();
    
    // Reduce health
    this.health -= 1;
    
    // Emit health update
    eventBus.emit('update-health', { health: this.health });
    
    // Check if player is dead
    if (this.health <= 0) {
      this.alive = false;
      eventBus.emit('player-died', { position: this._mesh.position.toArray() });
    }
  }
  
  /**
   * Handle game state changes
   */
  private onGameStateChange(data: { from: string; to: string }): void {
    if (data.to === 'READY') {
      // Reset position for new game
      this.resetPosition();
    }
  }
  
  /**
   * Handle game reset
   */
  private onGameReset(): void {
    // Reset character state
    this.health = 3;
    this.coins = 0;
    this.alive = true;
    
    // Reset position
    this.resetPosition();
    
    // Emit updated values
    eventBus.emit('update-health', { health: this.health });
    eventBus.emit('update-coins', { coins: this.coins });
  }
  
  /**
   * Reset character position
   */
  public resetPosition(): void {
    this.controller.resetPosition();
    this.animator.play('idle');
  }
  
  /**
   * Update character
   */
  public update(deltaTime: number, input: any): void {
    // Skip update if not alive
    if (!this.alive) return;
    
    // Update controller
    this.controller.update(deltaTime, input);
    
    // Update effects
    this.effects.update(deltaTime);
  }
  
  /**
   * Get character state
   */
  public getState(): CharacterState {
    return this.controller.getState();
  }
  
  /**
   * Get character position
   */
  public getPosition(): THREE.Vector3 {
    const position = this.controller.getPosition();
    
    // Add debugging to verify position is returned correctly
    if (!position) {
      console.warn('Character.getPosition: Position is null or undefined');
    } else if (position.z > 0 && gameStateManager.state === 'PLAYING') {
      // Log when we're not moving in PLAYING state to help diagnose movement issues
      console.log(`Character position: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`);
    }
    
    return position;
  }
  
  /**
   * Get character collider for collision detection
   */
  public getCollider(): THREE.Sphere {
    return this.controller.getCollider();
  }
  
  /**
   * Get character lane
   */
  public getLane(): LaneType {
    return this.controller.getLane();
  }
  
  /**
   * Change character lane
   */
  public changeLane(newLane: LaneType): void {
    this.controller.changeLane(newLane);
  }
  
  /**
   * Make character jump
   */
  public jump(): void {
    this.controller.jump();
  }
  
  /**
   * Make character dive
   */
  public dive(): void {
    this.controller.dive();
  }
  
  /**
   * Handle character hit
   */
  public hit(): boolean {
    return this.controller.hit();
  }
  
  /**
   * Set speed multiplier for character
   * @param multiplier Speed multiplier
   */
  public setSpeedMultiplier(multiplier: number): void {
    this.controller.setSpeedMultiplier(multiplier);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove from scene
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    // Dispose all modules
    this.model.dispose();
    this.animator.dispose();
    this.controller.dispose();
    this.effects.dispose();
    
    // Clean up event listeners
    eventBus.off('coin-collected', this.onCoinCollected.bind(this));
    eventBus.off('powerup-collected', this.onPowerUpCollected.bind(this));
    eventBus.off('player-hit', this.onPlayerHit.bind(this));
    eventBus.off('game-state-change', this.onGameStateChange.bind(this));
    eventBus.off('game-reset', this.onGameReset.bind(this));
  }
}