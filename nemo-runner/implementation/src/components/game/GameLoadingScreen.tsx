'use client';

import { useEffect } from 'react';
import useAssets from '@/lib/hooks/useAssets';
import { AssetType } from '@/lib/game-engine/AssetManager';

// Define game assets to preload
const gameAssets = [
  // In a real implementation, we'd have actual assets here
  // For now, we'll define placeholders
  /* 
  {
    key: 'fish_model',
    url: '/models/fish.glb',
    type: AssetType.MODEL,
    priority: 10,
  },
  {
    key: 'coral_texture',
    url: '/textures/coral.jpg',
    type: AssetType.TEXTURE,
    priority: 5,
  },
  {
    key: 'bubble_sound',
    url: '/audio/bubble.mp3',
    type: AssetType.AUDIO,
    priority: 3,
  },
  */
];

interface GameLoadingScreenProps {
  onLoadComplete: () => void;
}

export default function GameLoadingScreen({ onLoadComplete }: GameLoadingScreenProps) {
  const { loading, progress, error } = useAssets({
    assets: gameAssets,
    onComplete: onLoadComplete,
  });

  // Simulate loading for demo purposes
  useEffect(() => {
    if (gameAssets.length === 0) {
      const timer = setTimeout(() => {
        onLoadComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-400 to-blue-900 z-50">
      <div className="mb-8 text-4xl font-bold text-white">NEMO Runner</div>
      
      <div className="w-64 h-4 bg-blue-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>
      
      <div className="mt-4 text-blue-100">
        {loading ? (
          error ? 
            `Error loading assets: ${error.message}` : 
            `Loading... ${Math.round(progress * 100)}%`
        ) : (
          'Ready to swim!'
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-500/30 rounded text-white">
          Failed to load some assets. Please try refreshing the page.
        </div>
      )}
      
      <div className="mt-8 animate-pulse text-blue-200 text-sm">
        "Just keep swimming..."
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
    </div>
  );
}