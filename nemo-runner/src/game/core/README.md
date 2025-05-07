# Game Core Systems

This directory contains the core systems for the Nemo game engine.

## New Modular Rendering System

We've refactored the game engine to separate rendering initialization and asset loading into dedicated modules:

1. `RenderingInitializer` - Handles WebGL renderer creation, asset loading, and audio initialization
2. `GameStartController` - Coordinates game startup sequence and countdown

### Integration Example

Here's how to integrate these modules in your game:

```typescript
import { GameEngine } from './GameEngine';
import gameStartController from './GameStartController';

// In your React component or initialization function:
async function initializeGame(canvas: HTMLCanvasElement) {
  try {
    // Step 1: Initialize rendering systems first
    await gameStartController.initializeRenderingSystems(canvas);
    
    // Step 2: Create the game engine, which now has fewer responsibilities
    const gameEngine = new GameEngine(canvas);
    
    // Step 3: Listen for all systems ready event to initialize game
    eventBus.on('all-systems-ready', () => {
      console.log('All game systems are ready!');
      // You can add additional initialization here
    });
    
    // Return cleanup function
    return () => {
      // Clean up resources when component unmounts
      gameEngine.dispose();
    };
  } catch (error) {
    console.error('Failed to initialize game:', error);
    // Handle error (show fallback UI, etc.)
  }
}
```

## Benefits of the New Architecture

1. **Improved Error Handling**:
   - Robust error recovery for WebGL renderer issues
   - Specific handling for audio initialization errors
   - Graceful fallbacks for asset loading failures

2. **Better Modularity**:
   - Clear separation of concerns
   - Components focused on specific responsibilities
   - Easier to maintain and extend

3. **Enhanced Initialization Sequence**:
   - Coordinated startup with dependency awareness
   - System-ready events for reliable state transitions
   - Better canvas handling to prevent WebGL context issues

## Using the RenderingInitializer Directly

For more advanced use cases, you can access the RenderingInitializer directly:

```typescript
import { getRenderingInitializer } from './RenderingInitializer';

// Get the singleton instance
const renderer = getRenderingInitializer();

// Access components
const assetManager = renderer.getAssetManager();
const audioManager = renderer.getAudioManager();

// Manual rendering (if needed)
renderer.render(webGLRenderer, scene, camera, gameStateManager.state);
```

## Error Recovery

The system includes sophisticated error recovery mechanisms:

1. WebGL renderer recovery after critical errors
2. Audio system fallbacks when initialization fails
3. Asset loading that continues with placeholders if needed
4. Automatic handling of incorrectly sized canvases