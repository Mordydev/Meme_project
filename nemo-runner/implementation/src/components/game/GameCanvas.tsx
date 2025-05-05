'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useState, useRef, useEffect } from 'react';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import UnderwaterScene from './UnderwaterScene';
import Player from './Player';
import GameHUD from './GameHUD';
import GameUI from '@/components/ui/GameUI';
import GameLoadingScreen from './GameLoadingScreen';
import GameOverScreen from './GameOverScreen';
import CollisionSystem from './CollisionSystem';
import CollectiblesSystem from './CollectiblesSystem';
import PowerUpSystem, { PowerUpSystemRef } from './PowerUpSystem';
import QualityAdapter from './QualityAdapter';
import TutorialSystem from './TutorialSystem';
import { GameProvider } from '@/lib/game-engine/GameContext';
import { useGame, GameState } from '@/lib/game-engine/GameContext';
import ObstacleManager from '@/lib/game-engine/ObstacleManager';
import LevelManager from '@/lib/game-engine/LevelManager';
import EnvironmentEffects from '@/lib/game-engine/EnvironmentEffects';
import { EnvironmentParticles, CameraParticles } from '@/lib/game-engine/EnvironmentParticles';
import { useEnvironmentStore } from '@/lib/game-engine/EnvironmentManager';
import { initializeQuality } from '@/lib/game-engine/QualityManager';
import AssetManager from '@/lib/game-engine/AssetManager';
import * as THREE from 'three';

interface GameContentProps {
  powerUpSystemRef?: React.RefObject<PowerUpSystemRef>;
}

function GameContent({ powerUpSystemRef }: GameContentProps = {}) {
  // Game state from context
  const { state, changeState, resetGame, difficultyLevel, distance } = useGame();
  const isPlaying = state === GameState.PLAYING;
  const isGameOver = state === GameState.GAME_OVER;
  
  // Environment state
  const zoneParams = useEnvironmentStore(state => state.getInterpolatedParameters());
  
  // Refs for game components
  const playerRef = useRef<THREE.Group>(null);
  const obstacleManagerRef = useRef<ObstacleManager | null>(null);
  const levelManagerRef = useRef<LevelManager | null>(null);
  const collectiblesSystemRef = useRef<any>(null);
  const localPowerUpSystemRef = useRef<PowerUpSystemRef>(null);
  const sceneRef = useRef<THREE.Group>(null);
  
  // Use the prop ref if provided, otherwise use local ref
  const actualPowerUpSystemRef = powerUpSystemRef || localPowerUpSystemRef;
  
  // Asset manager reference
  const assetManagerRef = useRef<AssetManager>(null);
  
  // Initialize the obstacle manager and level manager
  useEffect(() => {
    // Initialize quality settings
    initializeQuality();
    
    // Create asset manager
    assetManagerRef.current = new AssetManager();
    
    // Create obstacle manager
    obstacleManagerRef.current = new ObstacleManager();
    
    // Create level manager with the obstacle manager
    if (obstacleManagerRef.current) {
      levelManagerRef.current = new LevelManager(obstacleManagerRef.current);
    }
    
    // Clean up on unmount
    return () => {
      obstacleManagerRef.current = null;
      levelManagerRef.current = null;
    };
  }, []);
  
  // Set the scene reference when it's available
  useEffect(() => {
    if (sceneRef.current) {
      // Set the scene for the obstacle manager
      if (obstacleManagerRef.current) {
        obstacleManagerRef.current.setScene(sceneRef.current);
      }
      
      // Set the scene for the level manager
      if (levelManagerRef.current) {
        levelManagerRef.current.setScene(sceneRef.current);
      }
    }
  }, [sceneRef.current]);
  
  // Reset managers when game resets
  useEffect(() => {
    if (state === GameState.MENU || state === GameState.GAME_OVER) {
      if (obstacleManagerRef.current) {
        obstacleManagerRef.current.reset();
      }
      
      if (levelManagerRef.current) {
        levelManagerRef.current.reset();
      }
    }
  }, [state]);
  
  // Handle restart from game over
  const handleRestart = () => {
    resetGame();
    changeState(GameState.PLAYING);
  };
  
  // Handle exit to menu
  const handleExitToMenu = () => {
    resetGame();
    changeState(GameState.MENU);
  };

  // GameUpdater component to use useFrame hook inside Canvas
  function GameUpdater() {
    // Use useFrame to update managers - this must be inside the Canvas
    useFrame((_, delta) => {
      if (!isPlaying || !playerRef.current) return;
      
      // Get player position
      const playerPosition = new THREE.Vector3();
      playerRef.current.getWorldPosition(playerPosition);
      
      // Update level manager
      if (levelManagerRef.current) {
        levelManagerRef.current.update(delta, distance, playerPosition);
      }
    });
    
    return null;
  }
  
  return (
    <>
      <Canvas 
        shadows 
        className="w-full h-full"
        dpr={[1.5, 2]} // Increased minimum DPR for sharper rendering
        gl={{ 
          antialias: true, // Enable anti-aliasing
          alpha: false, // No need for alpha as we have a background
          powerPreference: 'high-performance',
          precision: 'highp', // Use high precision for better visual quality
          stencil: true, // Enable stencil buffer for better effects
          depth: true // Ensure depth buffer is enabled for proper 3D rendering
        }}
      >
        {/* Dynamic background color based on environment */}
        <color attach="background" args={[zoneParams.backgroundColor]} />
        
        {/* Dynamic fog based on environment - improved for clarity */}
        <fog 
          attach="fog" 
          args={[
            zoneParams.fogColor, 
            20, // Near - increased from 10 for better visibility
            150  // Far - increased from 80 for better depth
          ]} 
        />
        <fogExp2 
          attach="fog" 
          args={[
            zoneParams.fogColor, 
            zoneParams.fogDensity * 0.7 // Reduced by 30% for better visibility
          ]} 
        />
        
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={75} />
        
        {/* Add the frame updater component inside Canvas */}
        <GameUpdater />
        
        {/* Environment lighting is now handled by EnvironmentEffects */}
        <Suspense fallback={null}>
          {/* Group all scene elements */}
          <group ref={sceneRef}>
            {/* Environment effects (lighting, water effects) */}
            <EnvironmentEffects />
            
            {/* Environment particles */}
            <EnvironmentParticles />
            <CameraParticles />
            
            {/* Underwater scene with environment zones */}
            <UnderwaterScene />
            
            {/* Active game elements only when playing */}
            {isPlaying && (
              <>
                {/* Player */}
                <Player ref={playerRef} />
                
                {/* Game systems */}
                <CollectiblesSystem ref={collectiblesSystemRef} />
                <PowerUpSystem ref={actualPowerUpSystemRef} />
                
                {/* Collision handling */}
                <CollisionSystem 
                  playerRef={playerRef}
                  obstacleManagerRef={obstacleManagerRef}
                  collectiblesSystemRef={collectiblesSystemRef}
                  powerUpSystemRef={actualPowerUpSystemRef}
                  levelManagerRef={levelManagerRef}
                />
                
                {/* Quality adaptation system */}
                <QualityAdapter 
                  levelManager={levelManagerRef.current}
                  obstacleManager={obstacleManagerRef.current}
                  scene={sceneRef.current}
                  assetManager={assetManagerRef.current}
                />
              </>
            )}
            
            <Environment preset="sunset" />
          </group>
        </Suspense>
      </Canvas>
      
      {/* UI Layers */}
      {!isGameOver && (
        <GameUI 
          isPlaying={isPlaying} 
          onStartGame={() => changeState(GameState.PLAYING)} 
        />
      )}
      
      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen 
          onRestart={handleRestart} 
          onExit={handleExitToMenu} 
        />
      )}
    </>
  );
}

export default function GameCanvas() {
  const [isLoading, setIsLoading] = useState(true);
  // Create refs for game components - ALWAYS declare hooks at the top level, never conditionally
  const powerUpSystemRef = useRef<PowerUpSystemRef>(null);

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <GameLoadingScreen onLoadComplete={handleLoadComplete} />;
  }
  
  return (
    <GameProvider>
      <div className="w-full h-full relative">
        <GameContent powerUpSystemRef={powerUpSystemRef} />
        <>
          <GameHUD powerUpSystemRef={powerUpSystemRef} />
          <TutorialSystem />
        </>
      </div>
    </GameProvider>
  );
}