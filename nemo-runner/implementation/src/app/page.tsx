'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white text-lg">Loading underwater world...</p>
        </div>
      ) : (
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white mb-6">NEMO Runner</h1>
          <p className="text-blue-100 mb-8">
            Dive into an underwater adventure! Navigate through coral reefs, avoid obstacles, and collect power-ups in this endless runner.
          </p>
          <div className="flex flex-col space-y-4">
            <Link 
              href="/game" 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300 text-lg font-medium"
            >
              Start Game
            </Link>
            <Link 
              href="/leaderboard" 
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors duration-300"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}