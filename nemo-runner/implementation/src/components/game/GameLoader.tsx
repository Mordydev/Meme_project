'use client';

import { useState, useEffect } from 'react';

export default function GameLoader() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-400 to-blue-900">
      <div className="mb-8 text-4xl font-bold text-white">NEMO Runner</div>
      
      <div className="w-64 h-4 bg-blue-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="mt-4 text-blue-100">
        {progress < 100 ? 'Diving into the ocean...' : 'Ready to swim!'}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
    </div>
  );
}