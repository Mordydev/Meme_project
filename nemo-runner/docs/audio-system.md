# NEMO Runner - Audio System Documentation

## Overview

The audio system in NEMO Runner provides a rich auditory experience for the underwater runner game, enhancing immersion and providing important gameplay feedback to the player. It implements a centralized audio management approach with adaptive sound effects and background music that respond to game states and events.

## Architecture

The audio system follows a singleton pattern with a centralized `AudioManager` class that handles:

1. **Sound Effect Management**
   - Loading and caching game sound effects
   - Playing sounds in response to game events
   - Managing sound effect volume and activation

2. **Background Music**
   - Seamless background music playback
   - State-dependent music changes

3. **Audio Settings**
   - Master volume control
   - Separate music and sound effect volume controls
   - Enable/disable toggles for music and sound effects
   - Settings persistence through localStorage

4. **Integration with Game Systems**
   - Event-based communication with game components
   - Camera-attached spatial audio through Three.js
   - Asset loading coordination with the AssetManager

## Core Components

### AudioManager Class

The `AudioManager` class is the central component that uses the Three.js audio API to handle all game audio. It implements:

- A singleton pattern for global access
- THREE.AudioListener attachment to the game camera
- Sound effect and music playback methods
- Volume and settings management
- Local storage persistence for user preferences
- Event listeners for game state changes and events

```typescript
export class AudioManager {
  private static instance: AudioManager;
  
  // Audio settings with localStorage persistence
  private settings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
  };

  // Get the AudioManager instance (singleton)
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  // Core audio methods
  public async initialize(camera: THREE.Camera): Promise<void> {...}
  public async loadSoundEffects(): Promise<void> {...}
  public playBackgroundMusic(): Promise<void> {...}
  public stopBackgroundMusic(): void {...}
  public playSoundEffect(type: AudioEventType): void {...}
  
  // Settings management
  public updateSettings(newSettings: Partial<AudioSettings>): void {...}
  public getSettings(): AudioSettings {...}
  private loadSettings(): void {...}
  private saveSettings(): void {...}
}
```

### AudioControls Component

The `AudioControls` React component provides a user interface for controlling game audio:

```typescript
const AudioControls: React.FC = () => {
  // State for audio settings
  const [settings, setSettings] = useState<AudioSettings>({
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true
  });
  
  // State for UI display
  const [isExpanded, setIsExpanded] = useState(false);
  
  // UI handlers
  const handleToggleChange = (settingKey: 'musicEnabled' | 'sfxEnabled') => {...}
  const handleVolumeChange = (settingKey: 'masterVolume' | 'musicVolume' | 'sfxVolume', value: string) => {...}
  
  // Render audio controls UI
  return (
    <div className={styles.audioControls}>
      {/* Collapsible audio settings panel */}
      {/* Volume sliders and toggles */}
    </div>
  );
};
```

## Technical Implementation

### 1. Sound Integration

The AudioManager uses Three.js AudioListener and Audio objects for playing sounds:

```typescript
// Create audio listener and attach to camera
this.listener = new THREE.AudioListener();
camera.add(this.listener);

// Initialize background music
this.backgroundMusic = new THREE.Audio(this.listener);

// Create and load sound effects
private createSoundEffect(id: string, buffer: AudioBuffer): void {
  const sound = new THREE.Audio(this.listener);
  sound.setBuffer(buffer);
  sound.setVolume(this.settings.sfxEnabled ? this.settings.sfxVolume : 0);
  this.soundEffects.set(id, sound);
}
```

### 2. Event-Based Audio Triggers

Game events trigger appropriate audio responses:

```typescript
private setupEventListeners(): void {
  // Game state changes
  this.eventSystem.on('game-state-change', (data: any) => {
    const { to } = data;
    
    if (to === 'MENU') {
      this.stopBackgroundMusic();
      this.playBackgroundMusic();
    } else if (to === 'PLAYING') {
      this.playSoundEffect('game-start');
    } else if (to === 'GAME_OVER') {
      this.playSoundEffect('game-over');
    }
  });
  
  // Gameplay events
  this.eventSystem.on('collectible-collected', () => {
    this.playSoundEffect('collect');
  });
  
  this.eventSystem.on('player-collision', () => {
    this.playSoundEffect('collision');
  });
  
  this.eventSystem.on('powerup-activated', (data: any) => {
    this.playSoundEffect(`${data.type}-activate`);
  });
}
```

### 3. Settings Persistence

Audio settings are persisted using localStorage:

```typescript
private loadSettings(): void {
  const savedSettings = localStorage.getItem('nemo_audio_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      this.settings = {
        ...this.settings,  // Keep defaults for any missing properties
        ...parsed          // Override with saved values
      };
    } catch (error) {
      console.error('[AudioManager] Error loading audio settings:', error);
    }
  }
}

private saveSettings(): void {
  localStorage.setItem('nemo_audio_settings', JSON.stringify(this.settings));
}
```

### 4. Integration with GameEngine

The AudioManager is initialized during the GameEngine setup:

```typescript
// In GameEngine.ts constructor
this.audioManager = AudioManager.getInstance();

// In GameEngine.initialize() method
await this.audioManager.initialize(this.camera);
await this.audioManager.loadSoundEffects();
```

## Usage Examples

### 1. Playing a Sound Effect

```typescript
// Get AudioManager instance
const audioManager = AudioManager.getInstance();

// Play sound effect by type
audioManager.playSoundEffect('collect');
```

### 2. Updating Audio Settings

```typescript
// Get AudioManager instance
const audioManager = AudioManager.getInstance();

// Update specific settings
audioManager.updateSettings({
  masterVolume: 0.5,
  musicEnabled: false
});
```

### 3. Adding AudioControls to UI

```tsx
// In GameUI.tsx
return (
  <div className={styles.gameUI}>
    {/* Other UI components */}
    
    {/* Audio controls */}
    <AudioControls />
  </div>
);
```

## Asset Management

Audio assets are registered and loaded through the AssetManager:

```typescript
// In AssetManager.registerCoreAssets() method
this.registerAsset('audio_background', 'audio', '/assets/audio/underwater_ambient.mp3');
this.registerAsset('audio_collect', 'audio', '/assets/audio/collect.mp3');
this.registerAsset('audio_collision', 'audio', '/assets/audio/collision.mp3');
this.registerAsset('audio_powerup', 'audio', '/assets/audio/powerup.mp3');
```

## Event List

The AudioManager responds to these events:

| Event Name | Description | Audio Response |
|------------|-------------|----------------|
| game-state-change (to MENU) | Player enters main menu | Start background music |
| game-state-change (to PLAYING) | Game starts | Play game start sound |
| game-state-change (to GAME_OVER) | Player loses | Play game over sound |
| collectible-collected | Player collects a bubble or power-up | Play collection sound |
| player-collision | Player hits an obstacle | Play collision sound |
| powerup-activated | Player activates a power-up | Play power-up specific sound |

## UI Controls

The audio controls UI includes:

1. **Master Volume Slider**
   - Controls overall game volume

2. **Music Controls**
   - Volume slider for background music
   - Toggle button to enable/disable music

3. **Sound Effects Controls**
   - Volume slider for game sound effects
   - Toggle button to enable/disable sound effects

4. **Collapsible Panel**
   - Audio icon button to show/hide detailed controls
   - Visible in both gameplay and menu screens

## Future Enhancements

Potential improvements for the audio system:

1. **Environment-Based Audio**: Different ambient sounds based on the underwater environment
2. **Spatial Audio**: Enhanced 3D audio positioning for sound effects
3. **Audio Effects**: Reverb, filters, and other effects based on environment
4. **Adaptive Music**: Dynamic music that changes with gameplay intensity
5. **Additional Sound Effects**: More diverse sound library for various game events

## Conclusion

The audio system implementation enhances the NEMO Runner gameplay experience with immersive sound effects and background music. The architecture provides a solid foundation for future audio enhancements while maintaining good performance and user control.