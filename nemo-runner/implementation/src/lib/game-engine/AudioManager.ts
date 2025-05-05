'use client';

import * as THREE from 'three';
import { getAssetManager } from '@/lib/hooks/useAssets';
import { EnvironmentZone } from './EnvironmentManager';

export enum AudioCategory {
  MUSIC = 'music',
  SFX = 'sfx',
  AMBIENT = 'ambient',
  UI = 'ui'
}

export interface AudioParameters {
  volume: number;
  playbackRate: number;
  loop: boolean;
  positional: boolean;
  refDistance?: number;
  rolloffFactor?: number;
  maxDistance?: number;
}

interface AudioSource {
  key: string;
  audio: THREE.Audio<GainNode> | THREE.PositionalAudio;
  category: AudioCategory;
  params: AudioParameters;
  playing: boolean;
  zoneRestriction?: EnvironmentZone | null;
}

export default class AudioManager {
  private listener: THREE.AudioListener;
  private audioSources: Map<string, AudioSource> = new Map();
  private volumeSettings: Record<AudioCategory, number> = {
    [AudioCategory.MUSIC]: 0.5,
    [AudioCategory.SFX]: 0.7,
    [AudioCategory.AMBIENT]: 0.6,
    [AudioCategory.UI]: 0.8
  };
  private muted: boolean = false;
  private globalVolume: number = 1.0;
  private underwaterFilter: AudioNode | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.listener = new THREE.AudioListener();
    this.setupAudioFilters();
  }

  private setupAudioFilters(): void {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = this.listener.context;

        // Create a lowpass filter for underwater effect
        if (this.audioContext) {
          const lowpassFilter = this.audioContext.createBiquadFilter();
          lowpassFilter.type = 'lowpass';
          lowpassFilter.frequency.value = 400;
          lowpassFilter.Q.value = 0.9;

          this.underwaterFilter = lowpassFilter;
        }
      } catch (error) {
        console.error('Could not set up audio filters:', error);
      }
    }
  }

  getListener(): THREE.AudioListener {
    return this.listener;
  }

  setUnderwaterEffectIntensity(intensity: number): void {
    if (this.underwaterFilter && this.underwaterFilter instanceof BiquadFilterNode) {
      // Map intensity (0-1) to frequency range (200-800)
      const frequency = 200 + (1 - intensity) * 600;
      this.underwaterFilter.frequency.value = frequency;
    }
  }

  createAudio(
    key: string,
    category: AudioCategory,
    params: Partial<AudioParameters> = {},
    zoneRestriction?: EnvironmentZone
  ): string {
    const audioId = `${key}_${Date.now()}`;
    const assetManager = getAssetManager();
    const audioBuffer = assetManager.getAsset(key) as ArrayBuffer;

    if (!audioBuffer) {
      console.warn(`Audio asset not found: ${key}`);
      return '';
    }

    const defaultParams: AudioParameters = {
      volume: 1.0,
      playbackRate: 1.0,
      loop: false,
      positional: false,
      refDistance: 1,
      rolloffFactor: 1,
      maxDistance: 10000
    };

    const mergedParams: AudioParameters = { ...defaultParams, ...params };
    
    let audio: THREE.Audio<GainNode> | THREE.PositionalAudio;
    
    if (mergedParams.positional) {
      const positionalAudio = new THREE.PositionalAudio(this.listener);
      positionalAudio.setRefDistance(mergedParams.refDistance || 1);
      positionalAudio.setRolloffFactor(mergedParams.rolloffFactor || 1);
      positionalAudio.setMaxDistance(mergedParams.maxDistance || 10000);
      audio = positionalAudio;
    } else {
      audio = new THREE.Audio<GainNode>(this.listener);
    }

    // Create an AudioBuffer from the ArrayBuffer
    if (audioBuffer) {
      const context = this.listener.context;
      context.decodeAudioData(audioBuffer, (buffer) => {
        audio.setBuffer(buffer);
      });
    }
    audio.setVolume(mergedParams.volume * this.volumeSettings[category] * this.globalVolume);
    audio.setPlaybackRate(mergedParams.playbackRate);
    audio.setLoop(mergedParams.loop);

    // Apply underwater filter if available
    if (this.underwaterFilter && this.audioContext) {
      const source = audio.getOutput();
      source.disconnect();
      source.connect(this.underwaterFilter);
      this.underwaterFilter.connect(this.audioContext.destination);
    }

    this.audioSources.set(audioId, {
      key,
      audio,
      category,
      params: mergedParams,
      playing: false,
      zoneRestriction
    });

    return audioId;
  }

  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setCategoryVolume(category: AudioCategory, volume: number): void {
    this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  private updateAllVolumes(): void {
    for (const [_, source] of this.audioSources) {
      const finalVolume = this.muted 
        ? 0 
        : source.params.volume * this.volumeSettings[source.category] * this.globalVolume;
      source.audio.setVolume(finalVolume);
    }
  }

  play(audioId: string): void {
    const source = this.audioSources.get(audioId);
    if (source && !source.playing) {
      source.audio.play();
      source.playing = true;
    }
  }

  playOneShot(
    key: string, 
    category: AudioCategory = AudioCategory.SFX, 
    params: Partial<AudioParameters> = {},
    zoneRestriction?: EnvironmentZone
  ): string {
    const audioId = this.createAudio(key, category, { ...params, loop: false }, zoneRestriction);
    if (audioId) {
      this.play(audioId);
      // Set up auto-cleanup for one-shot sounds
      const source = this.audioSources.get(audioId);
      if (source) {
        source.audio.onEnded = () => {
          this.removeAudio(audioId);
        };
      }
    }
    return audioId;
  }

  pause(audioId: string): void {
    const source = this.audioSources.get(audioId);
    if (source && source.playing) {
      source.audio.pause();
      source.playing = false;
    }
  }

  stop(audioId: string): void {
    const source = this.audioSources.get(audioId);
    if (source) {
      source.audio.stop();
      source.playing = false;
    }
  }

  setPosition(audioId: string, position: THREE.Vector3): void {
    const source = this.audioSources.get(audioId);
    if (source && source.params.positional && source.audio instanceof THREE.PositionalAudio) {
      source.audio.position.copy(position);
    }
  }

  removeAudio(audioId: string): void {
    const source = this.audioSources.get(audioId);
    if (source) {
      if (source.playing) {
        source.audio.stop();
      }
      source.audio.disconnect();
      this.audioSources.delete(audioId);
    }
  }

  setMute(muted: boolean): void {
    this.muted = muted;
    this.updateAllVolumes();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateAllVolumes();
    return this.muted;
  }

  pauseAll(): void {
    for (const [audioId, source] of this.audioSources) {
      if (source.playing) {
        source.audio.pause();
        source.playing = false;
      }
    }
  }

  resumeAll(): void {
    for (const [audioId, source] of this.audioSources) {
      if (!source.playing) {
        source.audio.play();
        source.playing = true;
      }
    }
  }

  // Filter playing sounds based on environment zone
  updateEnvironmentZone(currentZone: EnvironmentZone): void {
    for (const [_, source] of this.audioSources) {
      if (source.zoneRestriction && source.zoneRestriction !== currentZone) {
        if (source.playing) {
          source.audio.pause();
          source.playing = false;
        }
      } else if (source.zoneRestriction === currentZone && !source.playing) {
        source.audio.play();
        source.playing = true;
      }
    }
  }

  cleanupInactiveSources(): void {
    for (const [audioId, source] of this.audioSources) {
      if (!source.playing && !source.params.loop) {
        this.removeAudio(audioId);
      }
    }
  }

  dispose(): void {
    for (const [audioId, _] of this.audioSources) {
      this.removeAudio(audioId);
    }
    this.audioSources.clear();
    
    if (this.underwaterFilter && this.audioContext) {
      this.underwaterFilter.disconnect();
    }
  }
}