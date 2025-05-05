'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import GameLoader from '@/components/game/GameLoader';

// Dynamically load components with no SSR to avoid three.js server-side issues
const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), { ssr: false });
const MemoryMonitor = dynamic(() => import('@/components/ui/MemoryMonitor'), { ssr: false });

export default function GamePage() {
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client side to avoid Three.js errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <GameLoader />;
  }

  return (
    <div className="relative w-full h-screen">
      <Suspense fallback={<GameLoader />}>
        <GameCanvas />
        <MemoryMonitor />
      </Suspense>
    </div>
  );
}