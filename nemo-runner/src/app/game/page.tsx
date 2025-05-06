'use client';

import { useEffect, useRef } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';
import styles from '@/styles/Game.module.css';

export default function GamePage() {
  return (
    <div className={styles.gameContainer}>
      <GameCanvas />
      {/* GameUI is already included in GameCanvas */}
    </div>
  );
}