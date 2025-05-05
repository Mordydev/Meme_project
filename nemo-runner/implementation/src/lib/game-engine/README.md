# Audio System for NEMO Runner

This is an implementation of an underwater audio system for the NEMO Runner game. The system provides immersive audio experiences that change based on the player's environment zone, with special underwater audio effects.

## Key Components

### AudioManager.ts
Core class that handles audio playback, audio effects, and audio positioning. It manages:
- Audio sources (standard and positional)
- Volume controls for different audio categories
- Underwater filtering effects with biquad filters
- Zone-based audio management

### AudioContext.tsx
React context provider that:
- Maintains audio state using Zustand
- Provides methods for playing, stopping, and controlling audio
- Syncs with game state for pause/resume functionality
- Handles environment zone transitions

### AudioAssets.ts
Configuration file that defines all audio assets used in the game:
- Ambient audio for each zone (Coral Reef, Open Ocean, Deep Sea)
- Zone-specific sound effects
- Common gameplay sounds 
- Music tracks
- UI sound effects

## Audio Components

### AmbientAudioSystem.tsx
Manages continuous ambient audio backgrounds for each environment zone:
- Smooth transitions between zone ambient sounds
- Dynamic volume based on player's environment
- Adapts to game state changes (playing, paused, etc.)

### EnvironmentAudioEffects.tsx
Creates positional audio effects in the environment:
- Zone-specific sound events at random positions around the player
- Distance-based audio attenuation
- Algorithmic placement of sound sources

## Integration with Game Systems

The audio system integrates with:
- **Environment System**: Changes audio based on environmental zones
- **GameContext**: Exposes audio controls to the game UI
- **Player Systems**: Positioned audio follows the player

## Audio Assets Structure

```
public/
└── audio/
    ├── ambient/
    │   ├── coral_reef/
    │   ├── open_ocean/
    │   └── deep_sea/
    ├── sfx/
    │   ├── coral_reef/
    │   ├── open_ocean/
    │   ├── deep_sea/
    │   └── common/
    └── music/
        ├── coral_reef/
        ├── open_ocean/
        └── deep_sea/
```

## Usage Example

```tsx
// Playing a sound effect
const { playSound } = useAudio();
playSound('collect_coin');

// Playing positioned audio
const { playPositionalSound } = useAudio();
playPositionalSound('coral_reef_bubbles', objectPosition);

// Toggling audio settings
const { toggleMute, setGlobalVolume } = useGame();
toggleMute();
setGlobalVolume(0.8);
```

## Underwater Audio Effects

The system implements special audio processing for underwater simulation:
- Low-pass filtering (muffled high frequencies)
- Dynamic filter adjustment based on depth/zone
- Zone-specific reverb characteristics

## Performance Considerations

- Audio sources are pooled and recycled
- Inactive sources are cleaned up periodically
- Distance-based culling of audio sources
- Zone-restricted audio to limit concurrent sounds