'use client';

import { useEffect, useRef, useState } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';
import DevDebugUI from '@/components/game/DevDebugUI';
import styles from '@/styles/Game.module.css';

export default function GamePage() {
  const [showDevTools, setShowDevTools] = useState(false);
  
  // Check for dev mode
  useEffect(() => {
    // Check URL parameters or localStorage setting
    const checkDevMode = () => {
      // Check URL parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const devMode = urlParams.get('dev') === 'true';
        
        // Check localStorage setting
        const localDevMode = localStorage.getItem('nemoDevMode') === 'true';
        
        setShowDevTools(devMode || localDevMode);
        
        // Support toggling via keyboard (Alt+D)
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.altKey && e.key === 'd') {
            const newDevMode = !showDevTools;
            setShowDevTools(newDevMode);
            localStorage.setItem('nemoDevMode', newDevMode ? 'true' : 'false');
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    checkDevMode();
  }, [showDevTools]);
  
  return (
    <div className={styles.gameContainer}>
      <GameCanvas />
      {/* GameUI is already included in GameCanvas */}
      {showDevTools && <DevDebugUI />}
    </div>
  );
}