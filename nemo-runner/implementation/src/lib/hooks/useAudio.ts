'use client';

import { useEffect, useState, useRef } from 'react';
import { getAssetManager } from '@/lib/hooks/useAssets';
import { getAudioManager } from '@/lib/game-engine/AudioContext';
import { AudioCategory } from '@/lib/game-engine/AudioManager';
import { AssetType } from '@/lib/game-engine/AssetManager';

interface AudioAsset {
  key: string;
  url: string;
  category: AudioCategory;
}

interface UseAudioProps {
  audioAssets?: AudioAsset[];
  onComplete?: () => void;
}

export default function useAudio({ audioAssets = [], onComplete }: UseAudioProps = {}) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [assets, setAssets] = useState<Record<string, boolean>>({});
  
  const assetManager = useRef(getAssetManager());
  const audioManager = useRef(getAudioManager());

  // Register and preload audio assets
  useEffect(() => {
    if (audioAssets.length === 0) {
      setLoading(false);
      setProgress(1);
      if (onComplete) onComplete();
      return;
    }

    const manager = assetManager.current;
    
    // Keep track of registered assets
    const assetStatus: Record<string, boolean> = {};
    audioAssets.forEach(asset => {
      assetStatus[asset.key] = false;
    });
    
    setAssets(assetStatus);

    // Register progress callback
    const originalProgressCallback = manager.setProgressCallback;
    manager.setProgressCallback((progress) => {
      setProgress(progress);
    });

    // Register all audio assets
    audioAssets.forEach(asset => {
      manager.registerAsset(
        asset.key,
        asset.url,
        AssetType.AUDIO,
        1, // Priority
        (loadedAsset) => {
          // Mark this asset as loaded
          setAssets(prev => ({ ...prev, [asset.key]: true }));
        },
        (error) => {
          console.error(`Error loading audio asset: ${asset.key}`, error);
          setError(error);
        }
      );
    });

    // Preload assets
    manager.preloadAssets()
      .then(() => {
        setLoading(false);
        if (onComplete) onComplete();
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });

    // Clean up function
    return () => {
      // Restore original progress callback
      manager.setProgressCallback = originalProgressCallback;
    };
  }, [audioAssets, onComplete]);

  // Sound playback functions
  const playSound = (key: string, options: any = {}) => {
    const { 
      loop = false, 
      volume = 1, 
      category = AudioCategory.SFX,
      position = null,
      onEnd = null,
      playbackRate = 1,
    } = options;

    // Check if the asset is loaded
    if (!assets[key]) {
      console.warn(`Audio asset not loaded: ${key}`);
      return '';
    }

    let audioId = '';

    if (position) {
      // Play positional sound
      audioId = audioManager.current.createAudio(
        key,
        category,
        {
          loop,
          volume,
          playbackRate,
          positional: true,
          refDistance: options.refDistance || 1,
          rolloffFactor: options.rolloffFactor || 1,
          maxDistance: options.maxDistance || 10000
        }
      );

      if (audioId) {
        audioManager.current.setPosition(audioId, position);
        audioManager.current.play(audioId);
      }
    } else {
      // Play non-positional sound
      audioId = audioManager.current.createAudio(
        key,
        category,
        {
          loop,
          volume,
          playbackRate
        }
      );

      if (audioId) {
        audioManager.current.play(audioId);
      }
    }

    // Setup onEnd callback if provided
    if (onEnd && audioId) {
      // This would need to be implemented in the AudioManager
      // Currently AudioManager doesn't support custom callbacks on end
      // But this interface would be how we'd want to use it
    }

    return audioId;
  };

  const stopSound = (audioId: string) => {
    if (audioId) {
      audioManager.current.stop(audioId);
    }
  };

  const pauseSound = (audioId: string) => {
    if (audioId) {
      audioManager.current.pause(audioId);
    }
  };

  const resumeSound = (audioId: string) => {
    if (audioId) {
      audioManager.current.play(audioId);
    }
  };

  const setVolume = (category: AudioCategory, volume: number) => {
    audioManager.current.setCategoryVolume(category, volume);
  };

  const setMute = (muted: boolean) => {
    audioManager.current.setMute(muted);
  };

  return {
    loading,
    progress,
    error,
    isLoaded: !loading && !error,
    playSound,
    stopSound,
    pauseSound,
    resumeSound,
    setVolume,
    setMute
  };
}