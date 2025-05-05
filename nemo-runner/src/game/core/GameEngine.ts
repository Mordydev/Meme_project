import * as THREE from 'three';
import eventBus from './EventSystem';
import InputHandler from './InputHandler';
import { GameLoop } from './GameLoop';
import { AssetManager } from './AssetManager';
import { CollisionSystem } from './CollisionSystem';
import { Character } from '../entities/character/Character';
import { ObstacleManager } from '../entities/obstacles/ObstacleManager';
import { CollectibleManager } from '../entities/collectibles/CollectibleManager';
import { ProceduralEnvironment } from '../entities/environment/ProceduralEnvironment';
import { detectDeviceCapabilities, applyQualitySettings, configureGameSettings } from '../utils/DeviceUtils';

// Game state types
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

// Main game engine
export function initGame(canvas: HTMLCanvasElement) {
  // Game state
  let gameState: GameState = 'MENU';
  let score = 0;
  let distance = 0;
  const playerSpeed = 10;
  
  // Detect device capabilities and apply appropriate settings
  const deviceCapabilities = detectDeviceCapabilities();
  const gameSettings = configureGameSettings(deviceCapabilities);
  
  // Three.js setup
  const renderer = setupRenderer(canvas, deviceCapabilities);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x75c2f6); // Sky blue background
  const camera = setupCamera();
  
  // Initialize asset manager
  const assetManager = new AssetManager();
  
  // Initialize procedural environment
  const environment = new ProceduralEnvironment(scene);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Add directional light (sun rays through water)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = gameSettings.shadowQuality !== 'off';
  scene.add(directionalLight);
  
  // Initialize player character
  const player = new Character(scene, assetManager);
  
  // Initialize collision system
  const collisionSystem = new CollisionSystem(player);
  
  // Initialize obstacle manager
  const obstacleManager = new ObstacleManager(scene, assetManager, collisionSystem);
  
  // Initialize collectible manager
  const collectibleManager = new CollectibleManager(scene, assetManager);
  
  // Initialize input handler
  const inputHandler = new InputHandler();
  
  // Setup game loop
  const gameLoop = new GameLoop({
    updateFn: (deltaTime) => updateGame(deltaTime),
    fixedUpdateFn: (fixedTimeStep) => updatePhysics(fixedTimeStep),
    renderFn: (interpolation) => render(interpolation),
    fixedTimeStep: 1/60 // 60 fps physics
  });
  
  // Setup event listeners
  setupEventListeners();
  
  // Start in menu state
  setGameState('MENU');
  
  // Start the render loop (even when in menu)
  gameLoop.start();
  
  // Return cleanup function
  return function cleanup() {
    // Stop the game loop
    gameLoop.stop();
    
    // Clean up game entities
    player.dispose();
    obstacleManager.dispose();
    collectibleManager.dispose();
    environment.dispose();
    
    // Clean up ThreeJS resources
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        }
      }
    });
    
    renderer.dispose();
    
    // Clean up asset manager
    assetManager.dispose();
    
    // Remove event listeners
    window.removeEventListener('game-start', handleGameStart);
    window.removeEventListener('game-pause', handleGamePause);
    window.removeEventListener('game-resume', handleGameResume);
    window.removeEventListener('game-restart', handleGameRestart);
    window.removeEventListener('resize', handleResize);
    
    // Clean up input handler
    inputHandler.cleanup();
  };
  
  // Set the game state and emit event
  function setGameState(newState: GameState) {
    gameState = newState;
    eventBus.emit('game-state-change', gameState);
  }
  
  // Update physics with fixed timestep
  function updatePhysics(fixedTimeStep: number) {
    if (gameState !== 'PLAYING') return;
    
    // Update environment physics with player position
    environment.update(fixedTimeStep, player.mesh.position.z);
    
    // Emit game update event for bubble animations and other timed effects
    eventBus.emit('game-update', fixedTimeStep);
    
    // Update collision detection
    collisionSystem.update();
  }
  
  // Update game state
  function updateGame(deltaTime: number) {
    if (gameState !== 'PLAYING') return;
    
    // Handle input
    const input = inputHandler.getInput();
    
    // Update player character
    player.update(deltaTime, input);
    
    // Emit player position for obstacle triggers
    eventBus.emit('player-position', player.mesh.position);
    
    // Update obstacles
    obstacleManager.update(deltaTime, player.mesh.position.z, playerSpeed * deltaTime);
    
    // Update collectibles
    collectibleManager.update(deltaTime, player.mesh.position.z);
    
    // Update distance (scaled by player's forward speed)
    distance += playerSpeed * deltaTime;
    eventBus.emit('distance-change', Math.floor(distance));
    
    // Update score based on distance
    const newScore = Math.floor(distance * 2);
    if (newScore !== score) {
      score = newScore;
      eventBus.emit('score-change', score);
    }
    
    // Move the camera to follow the player
    updateCamera(deltaTime);
  }
  
  // Update camera position to follow player
  function updateCamera(deltaTime: number) {
    // Move camera forward
    camera.position.z -= playerSpeed * deltaTime;
    
    // Keep camera behind player
    const targetCameraZ = player.mesh.position.z + 5;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCameraZ, deltaTime * 2);
    
    // Adjust camera look target
    camera.lookAt(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z);
  }
  
  // Render the scene
  function render(interpolation: number) {
    // Render wobble effect for underwater feel
    const time = performance.now() * 0.001;
    camera.position.y = Math.sin(time * 0.5) * 0.05 + 2.0;
    camera.rotation.z = Math.sin(time * 0.2) * 0.01;
    
    // Render scene
    renderer.render(scene, camera);
  }
  
  // Event handlers
  function handleGameStart() {
    // Reset player position
    player.resetPosition();
    
    // Generate initial obstacles
    obstacleManager.update(0, 0, 0);
    
    // Set game state to playing
    setGameState('PLAYING');
  }
  
  function handleGamePause() {
    setGameState('PAUSED');
  }
  
  function handleGameResume() {
    setGameState('PLAYING');
  }
  
  function handleGameRestart() {
    // Reset game state
    score = 0;
    distance = 0;
    eventBus.emit('score-change', score);
    eventBus.emit('distance-change', distance);
    
    // Reset camera position
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);
    
    // Reset player
    player.resetPosition();
    
    // Clear obstacles and collectibles
    obstacleManager.clear();
    collectibleManager.clear();
    
    // Clear collision system
    collisionSystem.clear();
    
    // Start playing
    setGameState('PLAYING');
  }
  
  // Handle player hitting an obstacle
  function handlePlayerHit() {
    // If hit was severe enough, game over
    // For now, continue playing
    console.log('Player hit obstacle');
    
    // Subtract points for hitting obstacles
    score = Math.max(0, score - 50);
    eventBus.emit('score-change', score);
  }
  
  function handleResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Setup event listeners for game control
  function setupEventListeners() {
    window.addEventListener('game-start', handleGameStart);
    window.addEventListener('game-pause', handleGamePause);
    window.addEventListener('game-resume', handleGameResume);
    window.addEventListener('game-restart', handleGameRestart);
    window.addEventListener('resize', handleResize);
    
    // Keyboard event for pausing
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          handleGamePause();
        } else if (gameState === 'PAUSED') {
          handleGameResume();
        }
      }
    });
    
    // Game events
    eventBus.on('player-hit', handlePlayerHit);
    eventBus.on('collect', (data) => {
      // Increase score based on collectible type
      if (data.type === 'bubble') {
        score += 10;
        eventBus.emit('score-change', score);
      } else if (data.type.startsWith('powerup_')) {
        // Handle power-up collection
        console.log(`Power-up collected: ${data.type}`);
        // Score bonus for collecting power-ups
        score += 25;
        eventBus.emit('score-change', score);
      }
    });
    
    // Power-up event handlers
    eventBus.on('powerup-activated', (data) => {
      console.log(`Power-up activated: ${data.type} for ${data.duration} seconds`);
      // Handle specific power-up effects
      switch (data.type) {
        case 'powerup_shield':
          // Make player immune
          console.log('Shield activated - player immune to obstacles');
          break;
        case 'powerup_magnet':
          // Attract collectibles
          console.log('Magnet activated - attracting collectibles');
          break;
        case 'powerup_speed':
          // Increase speed
          console.log('Speed boost activated - increased movement speed');
          break;
        case 'powerup_score':
          // Double score
          console.log('Score multiplier activated - scores doubled');
          break;
        case 'powerup_time':
          // Slow down time (obstacles)
          console.log('Time slow activated - obstacles moving slower');
          break;
      }
    });
    
    eventBus.on('powerup-deactivated', (data) => {
      console.log(`Power-up deactivated: ${data.type}`);
      // Reset power-up effects
    });
    
    // Environment change events
    eventBus.on('environment-change', (data) => {
      console.log(`Environment changing from ${data.from} to ${data.to}`);
      // Future: Play transition sound effects or visual transitions
    });
    
    eventBus.on('environment-change-complete', (data) => {
      console.log(`Environment changed to ${data.type}`);
      // Future: Update background music or ambient effects based on environment
    });
  }
  
  // Renderer setup
  function setupRenderer(canvas: HTMLCanvasElement, capabilities: ReturnType<typeof detectDeviceCapabilities>) {
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: capabilities.highEnd || capabilities.midRange, 
      powerPreference: 'high-performance',
      alpha: false
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, capabilities.highEnd ? 2 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    
    // Apply quality settings based on device capabilities
    applyQualitySettings(renderer, capabilities);
    
    return renderer;
  }
  
  // Camera setup
  function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Position the camera
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);
    
    return camera;
  }
}