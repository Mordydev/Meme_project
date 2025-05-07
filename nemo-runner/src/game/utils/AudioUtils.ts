import * as THREE from 'three';
import { getDeviceCapabilities } from './DeviceUtils';

/**
 * Quality levels for audio processing
 */
export enum AudioQualityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

/**
 * AudioUtils provides optimization and quality management utilities for the audio system.
 * It handles performance-aware audio management, audio pooling, and quality scaling.
 */
export class AudioUtils {
  // Static instance for singleton pattern
  private static instance: AudioUtils;

  // Performance tracking
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private averageFrameTime: number = 0;
  private overloadCount: number = 0;
  
  // Audio pools for reusing audio objects
  private audioPool: Map<string, THREE.Audio[]> = new Map();
  private positionalAudioPool: Map<string, THREE.PositionalAudio[]> = new Map();
  
  // Maximum number of concurrent sounds to play in each priority level
  private readonly maxSimultaneousSounds = {
    high: 8,    // Critical gameplay sounds (collisions, power-ups)
    medium: 5,  // Secondary gameplay sounds (ambient, collection)
    low: 3      // Background/atmospheric sounds
  };

  // Currently active sounds count by priority
  private activeSoundCount = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  // Audio quality settings
  private qualityLevel: AudioQualityLevel;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Set initial quality level based on device capabilities
    this.qualityLevel = this.determineAudioQualityLevel();
    
    // Initialize performance monitoring
    this.lastFrameTime = performance.now();
  }

  /**
   * Get the AudioUtils instance (singleton)
   */
  public static getInstance(): AudioUtils {
    if (!AudioUtils.instance) {
      AudioUtils.instance = new AudioUtils();
    }
    return AudioUtils.instance;
  }
  
  /**
   * Determine appropriate audio quality level based on device capabilities
   */
  private determineAudioQualityLevel(): AudioQualityLevel {
    // Use device capabilities if available, otherwise default to medium quality
    try {
      const capabilities = getDeviceCapabilities();
      
      if (capabilities) {
        if (capabilities.highEnd) {
          return AudioQualityLevel.HIGH;
        } else if (capabilities.midRange) {
          return AudioQualityLevel.MEDIUM;
        } else {
          return AudioQualityLevel.LOW;
        }
      }
    } catch (error) {
      console.warn("Could not detect device capabilities, defaulting to medium quality");
    }
    
    // Default to medium quality when detection fails
    return AudioQualityLevel.MEDIUM;
  }
  
  /**
   * Update performance metrics based on frame time
   * Must be called each frame to track performance
   */
  public updatePerformanceMetrics(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const frameDelta = now - this.lastFrameTime;
      
      // Keep a rolling window of recent frame times
      this.frameTimes.push(frameDelta);
      if (this.frameTimes.length > 60) { // Monitor last ~1 second
        this.frameTimes.shift();
      }
      
      // Calculate average frame time
      const sum = this.frameTimes.reduce((a, b) => a + b, 0);
      this.averageFrameTime = sum / this.frameTimes.length;
      
      // Check for performance overload
      if (frameDelta > 33.33) { // Below 30fps
        this.overloadCount++;
        
        // If performance issues persist, adjust audio quality automatically
        if (this.overloadCount > 30 && this.qualityLevel > AudioQualityLevel.LOW) {
          this.qualityLevel = Math.max(
            AudioQualityLevel.LOW, 
            this.qualityLevel - 1 as AudioQualityLevel
          );
          console.log(`[AudioUtils] Reducing audio quality to level ${this.qualityLevel} due to performance issues`);
          this.overloadCount = 0;
        }
      } else {
        // Reset overload counter if performance is good
        this.overloadCount = Math.max(0, this.overloadCount - 1);
        
        // Consider increasing quality if performance is consistently good
        if (this.overloadCount === 0 && this.frameTimes.length >= 60 && 
            this.averageFrameTime < 16.7 && // Consistently above 60fps
            this.qualityLevel < AudioQualityLevel.HIGH) {
          this.qualityLevel = Math.min(
            AudioQualityLevel.HIGH,
            this.qualityLevel + 1 as AudioQualityLevel
          );
          console.log(`[AudioUtils] Increasing audio quality to level ${this.qualityLevel} due to good performance`);
        }
      }
    }
    this.lastFrameTime = now;
  }
  
  /**
   * Get current audio quality level
   */
  public getQualityLevel(): AudioQualityLevel {
    return this.qualityLevel;
  }
  
  /**
   * Manually set audio quality level
   * @param level The quality level to set
   */
  public setQualityLevel(level: AudioQualityLevel): void {
    this.qualityLevel = level;
  }
  
  /**
   * Check if a sound should be played based on priority and current load
   * @param priority Priority level of the sound ('high', 'medium', 'low')
   * @returns Whether the sound should be played
   */
  public shouldPlaySound(priority: 'high' | 'medium' | 'low'): boolean {
    // Always play high priority sounds if possible
    if (priority === 'high') {
      return this.activeSoundCount.high < this.maxSimultaneousSounds.high;
    }
    
    // For medium and low priority sounds, check current performance
    if (this.averageFrameTime > 25) { // Performance is struggling (< 40fps)
      // Only play high priority sounds
      return false;
    }
    
    // For medium priority sounds, check medium sound limit
    if (priority === 'medium') {
      return this.activeSoundCount.medium < this.maxSimultaneousSounds.medium;
    }
    
    // For low priority sounds
    // If quality level is low, skip most low priority sounds
    if (this.qualityLevel === AudioQualityLevel.LOW) {
      // Play only 1 in 3 low priority sounds when at low quality
      return Math.random() < 0.33 && this.activeSoundCount.low < this.maxSimultaneousSounds.low;
    }
    
    // Normal check for low priority sounds
    return this.activeSoundCount.low < this.maxSimultaneousSounds.low;
  }
  
  /**
   * Track when a sound starts playing
   * @param priority Priority level of the sound
   */
  public trackSoundStarted(priority: 'high' | 'medium' | 'low'): void {
    this.activeSoundCount[priority]++;
  }
  
  /**
   * Track when a sound stops playing
   * @param priority Priority level of the sound
   */
  public trackSoundEnded(priority: 'high' | 'medium' | 'low'): void {
    this.activeSoundCount[priority] = Math.max(0, this.activeSoundCount[priority] - 1);
  }
  
  /**
   * Get or create an audio object from the pool
   * @param type Pool identifier (sound type)
   * @param listener Audio listener to attach to
   * @returns A reused or new Audio object
   */
  public getAudioFromPool(type: string, listener: THREE.AudioListener): THREE.Audio {
    // Create pool if it doesn't exist
    if (!this.audioPool.has(type)) {
      this.audioPool.set(type, []);
    }
    
    const pool = this.audioPool.get(type)!;
    
    // Check for an available audio object in the pool
    for (let i = 0; i < pool.length; i++) {
      const audio = pool[i];
      if (!audio.isPlaying) {
        return audio;
      }
    }
    
    // If no available object, create new one and add to pool
    const audio = new THREE.Audio(listener);
    pool.push(audio);
    return audio;
  }
  
  /**
   * Get or create a positional audio object from the pool
   * @param type Pool identifier (sound type)
   * @param listener Audio listener to attach to
   * @returns A reused or new PositionalAudio object
   */
  public getPositionalAudioFromPool(type: string, listener: THREE.AudioListener): THREE.PositionalAudio {
    // Create pool if it doesn't exist
    if (!this.positionalAudioPool.has(type)) {
      this.positionalAudioPool.set(type, []);
    }
    
    const pool = this.positionalAudioPool.get(type)!;
    
    // Check for an available audio object in the pool
    for (let i = 0; i < pool.length; i++) {
      const audio = pool[i];
      if (!audio.isPlaying) {
        return audio;
      }
    }
    
    // If no available object, create new one and add to pool
    const audio = new THREE.PositionalAudio(listener);
    
    // Configure spatial audio properties based on quality level
    switch (this.qualityLevel) {
      case AudioQualityLevel.LOW:
        // Simplified spatial audio for low-end devices
        audio.setRefDistance(5);
        audio.setRolloffFactor(1.5);
        audio.setDistanceModel('linear');
        break;
      
      case AudioQualityLevel.MEDIUM:
        // Balanced spatial audio for mid-range devices
        audio.setRefDistance(3);
        audio.setRolloffFactor(2);
        audio.setDistanceModel('inverse');
        audio.setDirectionalCone(230, 290, 0.5); // Wider cone, less directionality
        break;
      
      case AudioQualityLevel.HIGH:
        // High-quality spatial audio for high-end devices
        audio.setRefDistance(2);
        audio.setRolloffFactor(2.5);
        audio.setDistanceModel('exponential');
        audio.setDirectionalCone(180, 270, 0.3); // More precise directionality
        break;
    }
    
    pool.push(audio);
    return audio;
  }
  
  /**
   * Apply audio quality settings to the given audio buffer
   * Simulates lower quality by simplifying the buffer data for low-end devices
   * @param buffer Original audio buffer
   * @returns Modified or original buffer based on quality settings
   */
  public applyQualityToBuffer(buffer: AudioBuffer): AudioBuffer {
    // If we're at high quality, return the original buffer
    if (this.qualityLevel === AudioQualityLevel.HIGH) {
      return buffer;
    }
    
    // Create an AudioContext to process the buffer
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // For low quality, downsample the buffer
    // For medium quality, reduce stereo separation
    const numChannels = buffer.numberOfChannels;
    const sampleRate = this.qualityLevel === AudioQualityLevel.LOW 
      ? buffer.sampleRate / 2  // Downsample for low quality
      : buffer.sampleRate;
    
    // Create a new buffer for the processed audio
    const newBuffer = audioContext.createBuffer(
      numChannels, 
      this.qualityLevel === AudioQualityLevel.LOW 
        ? Math.floor(buffer.length / 2)  // Reduce length for low quality
        : buffer.length,
      sampleRate
    );
    
    // Process each channel
    for (let channel = 0; channel < numChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      
      if (this.qualityLevel === AudioQualityLevel.LOW) {
        // Downsample: take every other sample
        for (let i = 0; i < newData.length; i++) {
          newData[i] = originalData[i * 2];
        }
      } else if (this.qualityLevel === AudioQualityLevel.MEDIUM && numChannels > 1) {
        // For stereo sources, reduce stereo separation by mixing channels slightly
        // Left and right channels will be slightly mixed towards center
        const mixFactor = 0.2; // 20% mix
        
        if (channel === 0 && numChannels > 1) {
          // Left channel: mix in some right channel
          const rightChannel = buffer.getChannelData(1);
          for (let i = 0; i < newData.length; i++) {
            newData[i] = originalData[i] * (1 - mixFactor) + rightChannel[i] * mixFactor;
          }
        } else if (channel === 1) {
          // Right channel: mix in some left channel
          const leftChannel = buffer.getChannelData(0);
          for (let i = 0; i < newData.length; i++) {
            newData[i] = originalData[i] * (1 - mixFactor) + leftChannel[i] * mixFactor;
          }
        } else {
          // For other channels or if not stereo, just copy
          for (let i = 0; i < newData.length; i++) {
            newData[i] = originalData[i];
          }
        }
      } else {
        // Copy the original data for other cases
        for (let i = 0; i < newData.length; i++) {
          newData[i] = originalData[i];
        }
      }
    }
    
    return newBuffer;
  }
  
  /**
   * Clean up memory by releasing excess pooled audio objects
   * Call periodically or when changing scenes to prevent memory leaks
   */
  public cleanupAudioPools(): void {
    // For each audio pool
    this.audioPool.forEach((pool, type) => {
      // Find non-playing audio objects
      const inactiveAudio = pool.filter(audio => !audio.isPlaying);
      
      // If we have more than 5 inactive objects, remove the excess
      if (inactiveAudio.length > 5) {
        // Sort by last played time (oldest first) if available, otherwise keep the first 5
        const toRemove = inactiveAudio.slice(5);
        
        // Remove from the pool
        this.audioPool.set(
          type, 
          pool.filter(audio => audio.isPlaying || !toRemove.includes(audio))
        );
        
        // Clean up resources
        toRemove.forEach(audio => {
          audio.disconnect();
        });
        
        console.log(`[AudioUtils] Cleaned up ${toRemove.length} excess audio objects from '${type}' pool`);
      }
    });
    
    // Similarly for positional audio pools
    this.positionalAudioPool.forEach((pool, type) => {
      const inactiveAudio = pool.filter(audio => !audio.isPlaying);
      if (inactiveAudio.length > 5) {
        const toRemove = inactiveAudio.slice(5);
        this.positionalAudioPool.set(
          type, 
          pool.filter(audio => audio.isPlaying || !toRemove.includes(audio))
        );
        toRemove.forEach(audio => {
          audio.disconnect();
        });
        console.log(`[AudioUtils] Cleaned up ${toRemove.length} excess positional audio objects from '${type}' pool`);
      }
    });
  }
  
  /**
   * Configure volume and effects based on distance for spatial audio
   * @param audio The positional audio object to configure
   * @param distance Distance to the sound source
   */
  public applyDistanceEffects(audio: THREE.PositionalAudio, distance: number): void {
    if (this.qualityLevel === AudioQualityLevel.LOW) {
      // For low quality, just use volume adjustments
      return;
    }
    
    // Advanced effects are only applied for medium and high quality
    if (audio.filters.length === 0 && this.qualityLevel >= AudioQualityLevel.MEDIUM) {
      // Create a low-pass filter for distance-based muffling
      const audioContext = audio.context;
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      audio.setFilter(filter);
      
      // Create a convolver/reverb effect for high quality
      if (this.qualityLevel === AudioQualityLevel.HIGH) {
        // Add underwater reverb simulation
        // (In a real implementation, you would load an actual impulse response)
        // For now we'll just adjust the existing filter
      }
    }
    
    // Apply distance-based effects
    if (audio.filters.length > 0 && audio.filters[0] instanceof BiquadFilterNode) {
      const filter = audio.filters[0] as BiquadFilterNode;
      
      // More distant sounds get more low-pass filtering
      if (distance > 10) {
        filter.frequency.value = 500; // Heavy filtering
      } else if (distance > 5) {
        filter.frequency.value = 1000; // Medium filtering
      } else {
        filter.frequency.value = 2000; // Light filtering
      }
    }
  }
}