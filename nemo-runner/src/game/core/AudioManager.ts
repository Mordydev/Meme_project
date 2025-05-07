import * as THREE from 'three';
import eventBus from './EventSystem';
import { AssetManager } from './AssetManager';
import { AudioUtils, AudioQualityLevel } from '../utils/AudioUtils';

// Audio event types
export type AudioEventType = 
  | 'collect' 
  | 'collision' 
  | 'powerup' 
  | 'game-start' 
  | 'game-over'
  | 'menu'
  | 'countdown'
  | 'shield-activate'
  | 'speed-activate'
  | 'lane-change';

// Priority levels for sound effects
export type AudioPriority = 'high' | 'medium' | 'low';

// Sound effect configuration
export interface SoundEffectConfig {
  id: AudioEventType;
  priority: AudioPriority;
  spatial?: boolean;
  loop?: boolean;
  volume?: number;
  refDistance?: number;
  maxDistance?: number;
}

// Volume settings interface
export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  audioQuality: AudioQualityLevel;
  spatialAudioEnabled: boolean; // Enable/disable spatial audio processing
}

/**
 * AudioManager handles all game audio including background music,
 * sound effects, and audio settings.
 */
export class AudioManager {
  private static instance: AudioManager;
  
  private assetManager!: AssetManager; // Will be initialized later
  
  // Three.js audio components
  private listener!: THREE.AudioListener; // Initialized in initialize()
  private backgroundMusic!: THREE.Audio;
  private soundEffects: Map<string, THREE.Audio>;
  private audioLoader!: THREE.AudioLoader; // Will be initialized in setAssetManager()
  
  // Audio settings
  private settings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
    audioQuality: AudioQualityLevel.MEDIUM,
    spatialAudioEnabled: true
  };
  
  // Audio utilities for performance management
  private audioUtils: AudioUtils;
  
  // Sound effect configurations with priorities
  private soundEffectConfigs: Map<AudioEventType, SoundEffectConfig> = new Map();
  
  // Positional audio sources for spatial audio
  private positionalSounds: Map<string, THREE.PositionalAudio> = new Map();
  
  // Active sound sources for tracking
  private activeSounds: Set<THREE.Audio | THREE.PositionalAudio> = new Set();
  
  // Track initialization state
  private initialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize with empty map
    this.soundEffects = new Map<string, THREE.Audio>();
    
    // Initialize AudioUtils
    this.audioUtils = AudioUtils.getInstance();
    
    // Set up default sound effect configurations with priorities
    this.setupSoundEffectConfigs();
  }
  
  /**
   * Configure default sound effect settings
   */
  private setupSoundEffectConfigs(): void {
    // Define configurations for each sound effect
    const configs: SoundEffectConfig[] = [
      // High priority sounds - critical gameplay elements
      { id: 'collision', priority: 'high', spatial: true, volume: 1.0, refDistance: 3 },
      { id: 'game-over', priority: 'high', spatial: false, volume: 1.0 },
      { id: 'game-start', priority: 'high', spatial: false, volume: 1.0 },
      
      // Medium priority sounds - important but not critical
      { id: 'powerup', priority: 'medium', spatial: true, volume: 0.9, refDistance: 5 },
      { id: 'shield-activate', priority: 'medium', spatial: true, volume: 0.9, refDistance: 4 },
      { id: 'speed-activate', priority: 'medium', spatial: true, volume: 0.8, refDistance: 4 },
      { id: 'collect', priority: 'medium', spatial: true, volume: 0.7, refDistance: 5 },
      
      // Low priority sounds - ambient and less important effects
      { id: 'lane-change', priority: 'low', spatial: true, volume: 0.5, refDistance: 3 },
      { id: 'menu', priority: 'low', spatial: false, volume: 0.6 },
      { id: 'countdown', priority: 'low', spatial: false, volume: 0.7 }
    ];
    
    // Store configurations in the map
    configs.forEach(config => {
      this.soundEffectConfigs.set(config.id, config);
    });
  }
  
  /**
   * Get the AudioManager instance (singleton)
   * @param forceNew Force creation of a new instance (for fallback)
   */
  public static getInstance(forceNew: boolean = false): AudioManager {
    if (!AudioManager.instance || forceNew) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Initialize the audio system
   * @param camera THREE.Camera to attach the audio listener to
   */
  public async initialize(camera: THREE.Camera): Promise<void> {
    if (this.initialized) return;
    
    console.log('[AudioManager] Initializing audio system');
    
    // Create audio listener and attach to camera
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    
    // Initialize background music
    this.backgroundMusic = new THREE.Audio(this.listener);
    
    // Load saved settings from localStorage if available
    this.loadSettings();
    
    // Apply current settings
    this.applySettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize audio utils with appropriate quality level
    this.audioUtils.setQualityLevel(this.settings.audioQuality);
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
    
    this.initialized = true;
    console.log('[AudioManager] Audio system initialized');
  }
  
  /**
   * Set up performance monitoring for audio system
   */
  private setupPerformanceMonitoring(): void {
    // Call updatePerformanceMetrics on each frame via the animation loop
    const updatePerformance = () => {
      this.audioUtils.updatePerformanceMetrics();
      
      // Schedule the next frame
      requestAnimationFrame(updatePerformance);
    };
    
    // Start the monitoring loop
    updatePerformance();
    
    // Set up periodic cleanup of audio pools
    setInterval(() => {
      this.audioUtils.cleanupAudioPools();
      this.cleanupActiveSounds();
    }, 30000); // Clean every 30 seconds
  }
  
  /**
   * Clean up audio sources that have finished playing
   */
  private cleanupActiveSounds(): void {
    let removedCount = 0;
    
    // For each active sound, check if it's still playing
    this.activeSounds.forEach(sound => {
      if (!sound.isPlaying) {
        this.activeSounds.delete(sound);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.log(`[AudioManager] Removed ${removedCount} finished sounds from active tracking`);
    }
  }
  
  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): void {
    const savedSettings = localStorage.getItem('nemo_audio_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        
        // Map numeric value to AudioQualityLevel enum if it exists
        if (typeof parsed.audioQuality === 'number') {
          parsed.audioQuality = Math.max(1, Math.min(3, parsed.audioQuality)) as AudioQualityLevel;
        }
        
        this.settings = {
          ...this.settings,  // Keep defaults for any missing properties
          ...parsed          // Override with saved values
        };
        
        console.log('[AudioManager] Loaded audio settings from localStorage');
      } catch (error) {
        console.error('[AudioManager] Error loading audio settings:', error);
      }
    }
  }
  
  /**
   * Save current audio settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('nemo_audio_settings', JSON.stringify(this.settings));
  }
  
  /**
   * Apply current audio settings to all audio objects
   */
  private applySettings(): void {
    if (!this.listener) return;
    
    // Apply master volume to listener
    this.listener.setMasterVolume(this.settings.masterVolume);
    
    // Apply music volume and enabled state
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(
        this.settings.musicEnabled ? this.settings.musicVolume : 0
      );
    }
    
    // Apply sfx volume and enabled state to all sound effects
    this.soundEffects.forEach(sound => {
      sound.setVolume(
        this.settings.sfxEnabled ? this.settings.sfxVolume : 0
      );
    });
    
    // Apply settings to spatial audio sources
    this.positionalSounds.forEach(sound => {
      sound.setVolume(
        this.settings.sfxEnabled ? this.settings.sfxVolume : 0
      );
      
      // If spatial audio is disabled, adjust settings accordingly
      if (!this.settings.spatialAudioEnabled) {
        // Reduce spatial effect by increasing reference distance
        sound.setRefDistance(50); // Very large distance = less spatial effect
      } else {
        // Restore proper spatial settings from config
        const configId = sound.userData.configId as AudioEventType;
        if (configId && this.soundEffectConfigs.has(configId)) {
          const config = this.soundEffectConfigs.get(configId)!;
          sound.setRefDistance(config.refDistance || 10);
        }
      }
    });
    
    // Apply audio quality setting
    if (this.audioUtils) {
      this.audioUtils.setQualityLevel(this.settings.audioQuality);
    }
  }
  
  /**
   * Update audio settings
   * @param newSettings Partial settings to update
   */
  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    this.applySettings();
    this.saveSettings();
    
    // Emit event for UI updates
    eventBus.emit('audio-settings-changed', this.settings);
  }
  
  /**
   * Get current audio settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings }; // Return copy to prevent direct modification
  }
  
  /**
   * Initialize asset manager
   * @param assetManager AssetManager instance
   */
  public setAssetManager(assetManager: AssetManager): void {
    this.assetManager = assetManager;
    
    // Initialize audioLoader if not already done
    if (!this.audioLoader) {
      this.audioLoader = new THREE.AudioLoader();
      this.audioLoader.setCrossOrigin('anonymous');
    }
  }
  
  /**
   * Simplified initialization for fallback mode
   * Used when regular initialization fails
   * @param camera Camera to attach listener to
   */
  public initializeFallback(camera: THREE.Camera): void {
    if (this.initialized) return;
    
    console.log('[AudioManager] Initializing in fallback mode');
    
    try {
      // Create audio listener and attach to camera
      this.listener = new THREE.AudioListener();
      camera.add(this.listener);
      
      // Initialize background music with minimal setup
      this.backgroundMusic = new THREE.Audio(this.listener);
      
      // Load settings
      this.loadSettings();
      
      // Apply settings
      this.applySettings();
      
      // Create basic dummy sound effects
      const dummyBuffer = this.createDummyAudioBuffer();
      
      // Create basic sound effects
      ['collect', 'collision', 'powerup', 'game-start', 'game-over', 'countdown'].forEach(effect => {
        this.createSoundEffect(effect, dummyBuffer);
      });
      
      this.initialized = true;
      console.log('[AudioManager] Fallback initialization complete');
      
      // Emit event for successful fallback initialization
      eventBus.emit('audio-ready', { 
        effectsCount: this.soundEffects.size,
        fallback: true
      });
    } catch (error) {
      console.error('[AudioManager] Fallback initialization failed:', error);
      // No further fallback available
    }
  }

  /**
   * Load and prepare sound effects
   */
  public async loadSoundEffects(): Promise<void> {
    if (!this.listener) {
      console.error('[AudioManager] Cannot load sounds: AudioListener not initialized');
      return;
    }
    
    if (!this.assetManager) {
      console.error('[AudioManager] Cannot load sounds: AssetManager not set');
      return;
    }
    
    // Define audio asset IDs
    const audioAssets = [
      { id: 'audio_collect', effect: 'collect' },
      { id: 'audio_collision', effect: 'collision' },
      { id: 'audio_powerup', effect: 'powerup' },
      { id: 'audio_game_start', effect: 'game-start' },
      { id: 'audio_game_over', effect: 'game-over' },
      { id: 'audio_shield', effect: 'shield-activate' },
      { id: 'audio_speed', effect: 'speed-activate' },
      { id: 'audio_lane_change', effect: 'lane-change' },
      { id: 'audio_countdown', effect: 'countdown' }
    ];
    
    console.log('[AudioManager] Creating sound effects with dummy buffers');
    
    // Make sure audioLoader is initialized
    if (!this.audioLoader) {
      this.audioLoader = new THREE.AudioLoader();
      this.audioLoader.setCrossOrigin('anonymous');
    }
    
    // For each audio asset, create a sound effect with a dummy buffer
    // This avoids 404 errors since we don't have the actual audio files yet
    for (const asset of audioAssets) {
      try {
        // Create a dummy buffer for the sound effect
        const buffer = this.createDummyAudioBuffer();
        
        // Create sound effect with the buffer
        this.createSoundEffect(asset.effect, buffer);
        console.log(`[AudioManager] Created sound effect: ${asset.effect}`);
      } catch (error) {
        console.error(`[AudioManager] Error creating sound effect ${asset.id}:`, error);
      }
    }
    
    console.log('[AudioManager] Sound effects loading complete');
    
    // Emit event to notify other systems that audio is ready
    eventBus.emit('audio-ready', { 
      effectsCount: this.soundEffects.size
    });
  }
  
  /**
   * Create a dummy audio buffer for development/fallback
   * @param isMusic If true, creates a longer, more complex buffer for background music
   * @returns AudioBuffer with generated audio data
   */
  private createDummyAudioBuffer(isMusic: boolean = false): AudioBuffer {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Set duration based on use case
    const sampleRate = audioContext.sampleRate;
    const duration = isMusic ? 5.0 : 0.5; // 5 seconds for music, 0.5 for sound effects
    const numFrames = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(2, numFrames, sampleRate); // Stereo buffer
    
    // Get channel data for left and right channels
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    if (isMusic) {
      // Generate more complex music-like pattern with multiple frequencies
      const baseFrequency = 220; // A3 note (220Hz)
      const notes = [1, 1.25, 1.5, 2]; // Simple chord pattern
      const patternLength = Math.floor(sampleRate * 0.5); // Pattern repeats every 0.5 seconds
      
      for (let i = 0; i < numFrames; i++) {
        // Reset accumulator for each sample
        let sample = 0;
        
        // Add multiple frequencies with varying amplitudes
        for (let j = 0; j < notes.length; j++) {
          const frequency = baseFrequency * notes[j];
          const amplitude = 0.1 - (j * 0.02); // Decreasing amplitude for higher notes
          sample += amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
          
          // Add slight frequency modulation for interest
          if (j % 2 === 0) {
            sample += amplitude * 0.3 * Math.sin(2 * Math.PI * (frequency * 1.01) * i / sampleRate);
          }
        }
        
        // Add pattern-based amplitude modulation
        const patternPosition = i % patternLength;
        const patternFactor = 0.7 + 0.3 * Math.sin(2 * Math.PI * patternPosition / patternLength);
        
        // Apply the pattern factor to modulate volume
        sample *= patternFactor;
        
        // Apply overall envelope
        const fadeInEnd = numFrames * 0.02;
        const fadeOutStart = numFrames * 0.85;
        
        if (i < fadeInEnd) {
          sample *= i / fadeInEnd; // Fade in
        } else if (i > fadeOutStart) {
          sample *= 1 - ((i - fadeOutStart) / (numFrames - fadeOutStart)); // Fade out
        }
        
        // Write to channels with slight stereo effect
        leftChannel[i] = sample * 0.9;
        rightChannel[i] = sample * 0.7; // Slightly quieter in right channel
      }
    } else {
      // Sound effect - simpler, shorter tone
      const frequency = 440; // A4 note (440Hz)
      
      for (let i = 0; i < numFrames; i++) {
        // Simple sine wave
        const baseSample = 0.2 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
        
        // Add a bit of noise for more interesting texture
        const noise = Math.random() * 0.05;
        const sample = baseSample + noise;
        
        // Apply a simple fade out
        const fadeOutStart = numFrames * 0.7;
        const amplitude = i > fadeOutStart 
          ? sample * (1 - ((i - fadeOutStart) / (numFrames - fadeOutStart)))
          : sample;
        
        // Write to both channels
        leftChannel[i] = amplitude;
        rightChannel[i] = amplitude;
      }
    }
    
    return buffer;
  }
  
  /**
   * Create a sound effect and add it to the collection
   * @param id Identifier for the sound effect
   * @param buffer AudioBuffer for the sound
   */
  private createSoundEffect(id: string, buffer: AudioBuffer): void {
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(buffer);
    sound.setVolume(this.settings.sfxEnabled ? this.settings.sfxVolume : 0);
    this.soundEffects.set(id, sound);
  }
  
  /**
   * Play background music
   * @param type Optional music type/theme (default, intense, underwater, etc.)
   */
  public async playBackgroundMusic(type: string = 'default'): Promise<void> {
    if (!this.listener || !this.backgroundMusic) {
      console.error('[AudioManager] Audio system not initialized properly');
      return;
    }
    
    try {
      // Stop any currently playing music
      if (this.backgroundMusic.isPlaying) {
        console.log('[AudioManager] Stopping current background music');
        this.backgroundMusic.stop();
      }
      
      // Make sure audioLoader is initialized
      if (!this.audioLoader) {
        this.audioLoader = new THREE.AudioLoader();
        this.audioLoader.setCrossOrigin('anonymous');
      }
      
      // Determine asset ID based on music type
      const assetId = type === 'default' ? 'audio_background' : `audio_background_${type}`;
      console.log(`[AudioManager] Creating dummy music for: ${assetId}`);
      
      // Since we don't have actual audio files yet, create a dummy buffer
      const musicBuffer = this.createDummyAudioBuffer(true); // Pass true for longer music buffer
      
      // Set up and play the background music
      this.backgroundMusic.setBuffer(musicBuffer);
      this.backgroundMusic.setLoop(true);
      this.backgroundMusic.setVolume(
        this.settings.musicEnabled ? this.settings.musicVolume : 0
      );
      
      // Play the music
      this.backgroundMusic.play();
      console.log(`[AudioManager] Background music (${type}) started`);
      
      // Emit event for other systems that might need to know about music changes
      eventBus.emit('music-started', { type });
    } catch (error) {
      console.error('[AudioManager] Error playing background music:', error);
      
      // Create and play fallback music as a last resort
      try {
        const fallbackBuffer = this.createDummyAudioBuffer(true);
        this.backgroundMusic.setBuffer(fallbackBuffer);
        this.backgroundMusic.setLoop(true);
        this.backgroundMusic.setVolume(
          this.settings.musicEnabled ? this.settings.musicVolume * 0.5 : 0
        );
        this.backgroundMusic.play();
        console.log('[AudioManager] Fallback background music started');
      } catch (fallbackError) {
        console.error('[AudioManager] Even fallback music failed:', fallbackError);
      }
    }
  }
  
  /**
   * Stop background music
   */
  public stopBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
      console.log('[AudioManager] Background music stopped');
    }
  }
  
  /**
   * Play a sound effect
   * @param type Type of sound effect to play
   * @param position Optional position for spatial audio (if not provided, non-spatial audio is used)
   * @param volumeMultiplier Optional volume multiplier (0.0 to 1.0)
   */
  public playSoundEffect(
    type: AudioEventType, 
    position?: THREE.Vector3,
    volumeMultiplier: number = 1.0
  ): void {
    if (!this.settings.sfxEnabled) return;
    
    // Get sound effect configuration
    const config = this.soundEffectConfigs.get(type);
    if (!config) {
      console.warn(`[AudioManager] No configuration found for sound effect: ${type}`);
      return;
    }
    
    // Check if we should play this sound based on priority
    if (!this.audioUtils.shouldPlaySound(config.priority)) {
      // Skip low priority sounds when system is under load
      return;
    }
    
    // Use spatial audio if position is provided and the sound effect supports it
    const useSpatialAudio = position && config.spatial && this.settings.spatialAudioEnabled;
    
    if (useSpatialAudio) {
      this.playSpatialSoundEffect(type, position, volumeMultiplier);
    } else {
      this.playNonSpatialSoundEffect(type, volumeMultiplier);
    }
    
    // Track that a sound was started
    this.audioUtils.trackSoundStarted(config.priority);
  }
  
  /**
   * Play a non-spatial sound effect
   * @param type Type of sound effect to play
   * @param volumeMultiplier Volume multiplier (0.0 to 1.0)
   */
  private playNonSpatialSoundEffect(type: AudioEventType, volumeMultiplier: number = 1.0): void {
    // Get or create a new audio from the pool
    const audio = this.audioUtils.getAudioFromPool(type, this.listener);
    
    // Get the buffer from the existing sound effect
    const existingSound = this.soundEffects.get(type);
    if (!existingSound || !existingSound.buffer) {
      console.warn(`[AudioManager] Sound effect not loaded: ${type}`);
      return;
    }
    
    // Get config for proper volume
    const config = this.soundEffectConfigs.get(type)!;
    const baseVolume = config.volume || 1.0;
    
    // Set up the audio
    audio.setBuffer(existingSound.buffer);
    audio.setVolume(this.settings.sfxVolume * baseVolume * volumeMultiplier);
    audio.setLoop(config.loop || false);
    
    // Store reference to config in userData for settings updates
    audio.userData = { configId: type };
    
    // Track this sound for cleanup
    this.activeSounds.add(audio);
    
    // Play the sound
    if (audio.isPlaying) audio.stop();
    audio.play();
    
    // Set up event tracking for when sound completes
    const priority = config.priority;
    const onEnded = () => {
      this.audioUtils.trackSoundEnded(priority);
      // Use as any to bypass type checking for the event listener
      (audio as any).removeEventListener('ended', onEnded);
    };
    // Use as any to bypass type checking for the event listener
    (audio as any).addEventListener('ended', onEnded);
  }
  
  /**
   * Play a spatial sound effect
   * @param type Type of sound effect to play
   * @param position Position in 3D space
   * @param volumeMultiplier Volume multiplier (0.0 to 1.0)
   */
  private playSpatialSoundEffect(
    type: AudioEventType, 
    position: THREE.Vector3,
    volumeMultiplier: number = 1.0
  ): void {
    // Get config for this sound type
    const config = this.soundEffectConfigs.get(type)!;
    
    // Get or create a positional audio from the pool
    const audio = this.audioUtils.getPositionalAudioFromPool(type, this.listener);
    
    // Get the buffer from the existing sound effect
    const existingSound = this.soundEffects.get(type);
    if (!existingSound || !existingSound.buffer) {
      console.warn(`[AudioManager] Sound effect not loaded: ${type}`);
      return;
    }
    
    const baseVolume = config.volume || 1.0;
    
    // Set up the positional audio
    audio.setBuffer(existingSound.buffer);
    audio.setVolume(this.settings.sfxVolume * baseVolume * volumeMultiplier);
    audio.setLoop(config.loop || false);
    audio.setRefDistance(config.refDistance || 5);
    audio.setMaxDistance(config.maxDistance || 100);
    
    // Set position
    audio.position.copy(position);
    
    // Store reference to config in userData for settings updates
    audio.userData = { configId: type };
    
    // Store in map for spatial sounds (for potential updates)
    const soundId = `${type}_${Date.now()}`;
    this.positionalSounds.set(soundId, audio);
    
    // Track this sound for cleanup
    this.activeSounds.add(audio);
    
    // Play the sound
    if (audio.isPlaying) audio.stop();
    audio.play();
    
    // Set up event tracking for when sound completes
    const priority = config.priority;
    const onEnded = () => {
      this.audioUtils.trackSoundEnded(priority);
      this.positionalSounds.delete(soundId);
      // Use as any to bypass type checking for the event listener
      (audio as any).removeEventListener('ended', onEnded);
    };
    // Use as any to bypass type checking for the event listener
    (audio as any).addEventListener('ended', onEnded);
    
    // Apply distance-based effects if at medium or high quality
    if (this.settings.audioQuality > AudioQualityLevel.LOW) {
      const distance = this.calculateDistanceToListener(position);
      this.audioUtils.applyDistanceEffects(audio, distance);
    }
  }
  
  /**
   * Calculate distance between a position and the audio listener
   * @param position Position to calculate distance from
   * @returns Distance to the listener
   */
  private calculateDistanceToListener(position: THREE.Vector3): number {
    if (!this.listener || !this.listener.parent) {
      return 10; // Default distance if listener not available
    }
    
    // Get the listener's world position (typically attached to camera)
    const listener = this.listener;
    const listenerPos = new THREE.Vector3();
    listener.getWorldPosition(listenerPos);
    
    // Calculate distance
    return position.distanceTo(listenerPos);
  }
  
  /**
   * Set up event listeners for game events
   */
  private setupEventListeners(): void {
    // Game state changes
    eventBus.on('game-state-change', (data: any) => {
      const { to } = data;
      
      if (to === 'MENU') {
        this.stopBackgroundMusic();
        this.playBackgroundMusic(); // Restart music for menu
        this.playSoundEffect('menu');
      } else if (to === 'PLAYING') {
        this.playSoundEffect('game-start');
      } else if (to === 'GAME_OVER') {
        this.playSoundEffect('game-over');
      }
    });
    
    // Collectible collection
    eventBus.on('collectible-collected', (data: any = {}) => {
      const position = data.position as THREE.Vector3 | undefined;
      this.playSoundEffect('collect', position);
    });
    
    // Player collision
    eventBus.on('player-collision', (data: any = {}) => {
      const position = data.position as THREE.Vector3 | undefined;
      // Collision sounds are high priority
      this.playSoundEffect('collision', position);
    });
    
    // Power-up activation
    eventBus.on('powerup-activated', (data: any) => {
      const { type, position } = data;
      const positionVec = position ? new THREE.Vector3(position.x, position.y, position.z) : undefined;
      
      if (type === 'shield') {
        this.playSoundEffect('shield-activate', positionVec);
      } else if (type === 'speed') {
        this.playSoundEffect('speed-activate', positionVec);
      } else {
        this.playSoundEffect('powerup', positionVec);
      }
    });
    
    // Play sound effect for lane change or other generic sounds
    eventBus.on('play-sound', (data: { name: string, position?: any, volume?: number }) => {
      if (data.name === 'lane-change') {
        const position = data.position ? 
          new THREE.Vector3(data.position.x, data.position.y, data.position.z) : 
          undefined;
        
        this.playSoundEffect('lane-change', position, data.volume);
      }
    });
    
    // Listen for performance alerts from other systems
    eventBus.on('performance-alert', (data: { status: 'ok' | 'warning' | 'critical' }) => {
      if (data.status === 'critical') {
        // Temporarily increase priority thresholds to reduce audio processing
        this.reduceAudioLoad();
      }
    });
  }
  
  /**
   * Temporarily reduce audio system load when performance issues are detected
   */
  private reduceAudioLoad(): void {
    console.log('[AudioManager] Reducing audio load due to performance issues');
    
    // Stop all low priority sounds
    this.activeSounds.forEach(sound => {
      // Check if this is a low priority sound by looking at its config ID
      const configId = sound.userData?.configId as AudioEventType | undefined;
      if (configId && this.soundEffectConfigs.has(configId)) {
        const config = this.soundEffectConfigs.get(configId)!;
        if (config.priority === 'low') {
          sound.stop();
          this.audioUtils.trackSoundEnded('low');
        }
      }
    });
    
    // If still at high quality, temporarily reduce to medium
    if (this.settings.audioQuality === AudioQualityLevel.HIGH) {
      // Store original quality to restore later
      const originalQuality = this.settings.audioQuality;
      this.audioUtils.setQualityLevel(AudioQualityLevel.MEDIUM);
      
      // After a few seconds, restore the original quality if performance improves
      setTimeout(() => {
        if (this.audioUtils.getQualityLevel() !== originalQuality) {
          console.log('[AudioManager] Restoring audio quality after performance alert');
          this.audioUtils.setQualityLevel(originalQuality);
        }
      }, 5000);
    }
  }
  
  /**
   * Play ambient environment sounds based on current environment type
   * @param environmentType The type of environment (e.g., 'coral', 'deepSea', 'shipwreck')
   * @param playerPosition Current player position for spatial positioning
   */
  public playAmbientSounds(environmentType: string, playerPosition: THREE.Vector3): void {
    // Skip ambient sounds if audio is disabled or at low quality
    if (!this.settings.sfxEnabled || this.settings.audioQuality === AudioQualityLevel.LOW) {
      return;
    }
    
    // Create random ambient positions around the player
    const createAmbientPosition = () => {
      // Create positions in a radius around the player, but not too close
      const radius = 15 + Math.random() * 20; // 15-35 units away
      const angle = Math.random() * Math.PI * 2; // Random angle
      const height = -5 + Math.random() * 10; // Random height variation
      
      return new THREE.Vector3(
        playerPosition.x + Math.cos(angle) * radius,
        playerPosition.y + height,
        playerPosition.z + Math.sin(angle) * radius
      );
    };
    
    // Play different ambient sounds based on environment type
    // These are low priority sounds that may be skipped under performance pressure
    if (environmentType === 'coral' || environmentType === 'reef') {
      // Play bubbling sounds occasionally
      if (Math.random() < 0.1 && this.audioUtils.shouldPlaySound('low')) {
        this.playSoundEffect('collect', createAmbientPosition(), 0.3);
      }
    } else if (environmentType === 'deepSea') {
      // Deep sea ambient sounds
      if (Math.random() < 0.05 && this.audioUtils.shouldPlaySound('low')) {
        // Use existing sounds with low volume for ambient effect
        this.playSoundEffect('menu', createAmbientPosition(), 0.2);
      }
    } else if (environmentType === 'shipwreck') {
      // Shipwreck ambient sounds
      if (Math.random() < 0.08 && this.audioUtils.shouldPlaySound('low')) {
        this.playSoundEffect('lane-change', createAmbientPosition(), 0.3);
      }
    }
  }
  
  /**
   * Create a new spatial sound source that follows an entity
   * @param type Sound effect type
   * @param entity Entity to attach the sound to (must have a position property)
   * @param loop Whether the sound should loop
   * @returns ID to reference this sound for updates/removal
   */
  public createEntitySound(
    type: AudioEventType, 
    entity: { position: THREE.Vector3 },
    loop: boolean = true
  ): string {
    // Skip if audio is disabled
    if (!this.settings.sfxEnabled) {
      return '';
    }
    
    // Get config for this sound
    const config = this.soundEffectConfigs.get(type);
    if (!config) {
      console.warn(`[AudioManager] No configuration found for sound: ${type}`);
      return '';
    }
    
    // Skip if we shouldn't play this sound based on priority
    if (!this.audioUtils.shouldPlaySound(config.priority)) {
      return '';
    }
    
    // Create positional audio
    const audio = this.audioUtils.getPositionalAudioFromPool(type, this.listener);
    
    // Get buffer from existing effect
    const existingSound = this.soundEffects.get(type);
    if (!existingSound || !existingSound.buffer) {
      console.warn(`[AudioManager] Sound effect not loaded: ${type}`);
      return '';
    }
    
    // Configure the audio
    audio.setBuffer(existingSound.buffer);
    audio.setLoop(loop);
    audio.setVolume(this.settings.sfxVolume * (config.volume || 0.7));
    audio.setRefDistance(config.refDistance || 5);
    audio.position.copy(entity.position);
    
    // Create a unique ID for this sound
    const soundId = `entity_${type}_${Date.now()}`;
    
    // Store in our maps
    this.positionalSounds.set(soundId, audio);
    this.activeSounds.add(audio);
    
    // Start playing
    audio.play();
    
    // Set up tracking for priority
    this.audioUtils.trackSoundStarted(config.priority);
    
    // Set up auto-cleanup if not looping
    if (!loop) {
      // Use as any to bypass type checking for the event listener
      (audio as any).addEventListener('ended', () => {
        this.audioUtils.trackSoundEnded(config.priority);
        this.positionalSounds.delete(soundId);
        this.activeSounds.delete(audio);
      });
    }
    
    return soundId;
  }
  
  /**
   * Update the position of an entity-attached sound
   * @param soundId ID of the sound to update
   * @param position New position for the sound
   */
  public updateEntitySoundPosition(soundId: string, position: THREE.Vector3): void {
    const sound = this.positionalSounds.get(soundId);
    if (sound) {
      sound.position.copy(position);
      
      // Update distance-based effects if quality allows
      if (this.settings.audioQuality > AudioQualityLevel.LOW) {
        const distance = this.calculateDistanceToListener(position);
        this.audioUtils.applyDistanceEffects(sound, distance);
      }
    }
  }
  
  /**
   * Stop and remove an entity sound
   * @param soundId ID of the sound to remove
   */
  public removeEntitySound(soundId: string): void {
    const sound = this.positionalSounds.get(soundId);
    if (sound) {
      // Get priority to track end
      const configId = sound.userData?.configId as AudioEventType | undefined;
      if (configId && this.soundEffectConfigs.has(configId)) {
        const config = this.soundEffectConfigs.get(configId)!;
        this.audioUtils.trackSoundEnded(config.priority);
      }
      
      // Stop and clean up
      if (sound.isPlaying) {
        sound.stop();
      }
      
      this.positionalSounds.delete(soundId);
      this.activeSounds.delete(sound);
    }
  }
  
  /**
   * Clean up audio resources
   */
  public dispose(): void {
    this.stopBackgroundMusic();
    
    // Disconnect and clean up all audio sources
    if (this.backgroundMusic) {
      this.backgroundMusic.disconnect();
    }
    
    // Clean up regular sound effects
    this.soundEffects.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.disconnect();
    });
    this.soundEffects.clear();
    
    // Clean up positional sounds
    this.positionalSounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.disconnect();
    });
    this.positionalSounds.clear();
    
    // Clear active sounds tracking
    this.activeSounds.clear();
    
    // Save settings before disposing
    this.saveSettings();
    
    console.log('[AudioManager] Audio system disposed');
  }
}