'use client';

import { useState, useEffect, useRef } from 'react';
import AssetManager, { AssetType } from '@/lib/game-engine/AssetManager';

// Singleton AssetManager instance
let assetManagerInstance: AssetManager | null = null;

export const getAssetManager = (): AssetManager => {
  if (!assetManagerInstance) {
    assetManagerInstance = new AssetManager();
  }
  return assetManagerInstance;
};

interface UseAssetsProps {
  assets?: {
    key: string;
    url: string;
    type: AssetType;
    priority?: number;
  }[];
  onComplete?: () => void;
}

export default function useAssets({ assets = [], onComplete }: UseAssetsProps = {}) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const assetManager = useRef<AssetManager>(getAssetManager());

  useEffect(() => {
    if (assets.length === 0) {
      setLoading(false);
      setProgress(1);
      if (onComplete) onComplete();
      return;
    }

    const manager = assetManager.current;

    // Register progress callback
    manager.setProgressCallback(setProgress);

    // Register all assets
    assets.forEach(asset => {
      manager.registerAsset(
        asset.key,
        asset.url,
        asset.type,
        asset.priority || 1
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

  }, [assets, onComplete]);

  return {
    loading,
    progress,
    error,
    assetManager: assetManager.current,
    getAsset: (key: string) => assetManager.current.getAsset(key),
    getAssetClone: (key: string) => assetManager.current.getAssetClone(key)
  };
}