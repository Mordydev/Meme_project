import * as THREE from 'three';
import eventBus from './EventSystem';
import { AssetManager } from './AssetManager';

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

// Volume settings interface
export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
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
  
  // Audio settings
  private settings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
  };
  
  // Track initialization state
  private initialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize with empty map
    this.soundEffects = new Map<string, THREE.Audio>();
  }
  
  /**
   * Get the AudioManager instance (singleton)
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
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
    
    this.initialized = true;
    console.log('[AudioManager] Audio system initialized');
  }
  
  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): void {
    const savedSettings = localStorage.getItem('nemo_audio_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
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
      
      // Create dummy sound buffers for development
      const dummyBuffer = this.createDummyAudioBuffer();
      
      // Create audio objects for each sound effect using the dummy buffer
      this.createSoundEffect('collect', dummyBuffer);
      this.createSoundEffect('collision', dummyBuffer);
      this.createSoundEffect('powerup', dummyBuffer);
      this.createSoundEffect('game-start', dummyBuffer);
      this.createSoundEffect('game-over', dummyBuffer);
      this.createSoundEffect('shield-activate', dummyBuffer);
      this.createSoundEffect('speed-activate', dummyBuffer);
      
      console.log('[AudioManager] Created dummy sound effects');
      return;
    }
    
    // Load and create sound effects
    try {
      // Get audio buffers from AssetManager
      const collectBuffer = await this.assetManager.getAsset('audio_collect');
      const collisionBuffer = await this.assetManager.getAsset('audio_collision');
      const powerupBuffer = await this.assetManager.getAsset('audio_powerup');
      
      // Create audio objects for each sound effect
      this.createSoundEffect('collect', collectBuffer);
      this.createSoundEffect('collision', collisionBuffer);
      this.createSoundEffect('powerup', powerupBuffer);
      
      // Assign the same sounds to different game events for now
      // In the future, we can add more specific sounds
      this.createSoundEffect('game-start', powerupBuffer);
      this.createSoundEffect('game-over', collisionBuffer);
      this.createSoundEffect('shield-activate', powerupBuffer);
      this.createSoundEffect('speed-activate', powerupBuffer);
      
      console.log('[AudioManager] Sound effects loaded');
    } catch (error) {
      console.error('[AudioManager] Error loading sound effects:', error);
      
      // Create a fallback with dummy sounds
      const dummyBuffer = this.createDummyAudioBuffer();
      
      this.createSoundEffect('collect', dummyBuffer);
      this.createSoundEffect('collision', dummyBuffer);
      this.createSoundEffect('powerup', dummyBuffer);
      this.createSoundEffect('game-start', dummyBuffer);
      this.createSoundEffect('game-over', dummyBuffer);
      this.createSoundEffect('shield-activate', dummyBuffer);
      this.createSoundEffect('speed-activate', dummyBuffer);
    }
  }
  
  /**
   * Create a dummy audio buffer for development/fallback
   */
  private createDummyAudioBuffer(): AudioBuffer {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a short buffer with a simple tone
    const sampleRate = audioContext.sampleRate;
    const duration = 0.5; // half second
    const numFrames = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, numFrames, sampleRate);
    
    // Fill the buffer with a simple sine wave
    const channelData = buffer.getChannelData(0);
    const frequency = 440; // A4 note (440Hz)
    
    for (let i = 0; i < numFrames; i++) {
      // Simple sine wave
      channelData[i] = 0.2 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
      
      // Apply a simple fade out
      const fadeOutStart = numFrames * 0.7;
      if (i > fadeOutStart) {
        channelData[i] *= 1 - ((i - fadeOutStart) / (numFrames - fadeOutStart));
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
   */
  public async playBackgroundMusic(): Promise<void> {
    if (!this.listener || !this.backgroundMusic) return;
    
    try {
      // Stop any currently playing music
      if (this.backgroundMusic.isPlaying) {
        this.backgroundMusic.stop();
      }
      
      let musicBuffer;
      
      // Check if AssetManager is available
      if (!this.assetManager) {
        console.warn('[AudioManager] AssetManager not available, using dummy music');
        musicBuffer = this.createDummyAudioBuffer();
      } else {
        // Get background music buffer
        try {
          musicBuffer = await this.assetManager.getAsset('audio_background');
        } catch (error) {
          console.warn('[AudioManager] Could not load music asset, using dummy music');
          musicBuffer = this.createDummyAudioBuffer();
        }
      }
      
      // Set up background music
      this.backgroundMusic.setBuffer(musicBuffer);
      this.backgroundMusic.setLoop(true);
      this.backgroundMusic.setVolume(
        this.settings.musicEnabled ? this.settings.musicVolume : 0
      );
      
      // Play the music
      this.backgroundMusic.play();
      console.log('[AudioManager] Background music started');
    } catch (error) {
      console.error('[AudioManager] Error playing background music:', error);
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
   */
  public playSoundEffect(type: AudioEventType): void {
    if (!this.settings.sfxEnabled) return;
    
    const sound = this.soundEffects.get(type);
    if (sound) {
      // Clone the sound to allow overlapping playback
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
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
    eventBus.on('collectible-collected', () => {
      this.playSoundEffect('collect');
    });
    
    // Player collision
    eventBus.on('player-collision', () => {
      this.playSoundEffect('collision');
    });
    
    // Power-up activation
    eventBus.on('powerup-activated', (data: any) => {
      const { type } = data;
      if (type === 'shield') {
        this.playSoundEffect('shield-activate');
      } else if (type === 'speed') {
        this.playSoundEffect('speed-activate');
      } else {
        this.playSoundEffect('powerup');
      }
    });
    
    // Play sound effect for lane change
    eventBus.on('play-sound', (data: { name: string, volume?: number }) => {
      if (data.name === 'lane-change') {
        // If we don't have a specific lane-change sound yet, use collect sound
        // with adjusted volume
        const sound = this.soundEffects.get('lane-change') || this.soundEffects.get('collect');
        if (sound) {
          // Clone the sound to allow overlapping playback
          if (sound.isPlaying) {
            sound.stop();
          }
          // Adjust volume if specified
          const originalVolume = sound.getVolume();
          if (data.volume !== undefined) {
            sound.setVolume(data.volume * this.settings.sfxVolume);
          }
          sound.play();
          // Reset to original volume after a short delay
          if (data.volume !== undefined) {
            setTimeout(() => {
              sound.setVolume(originalVolume);
            }, 500);
          }
        }
      }
    });
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
    
    this.soundEffects.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.disconnect();
    });
    
    this.soundEffects.clear();
    
    // Save settings before disposing
    this.saveSettings();
    
    console.log('[AudioManager] Audio system disposed');
  }
}