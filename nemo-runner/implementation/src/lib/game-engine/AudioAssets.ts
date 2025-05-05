'use client';

import { AudioCategory } from './AudioManager';
import { AssetType } from './AssetManager';
import { EnvironmentZone } from './EnvironmentManager';

// Audio asset definition
export interface AudioAssetDefinition {
  key: string;
  url: string;
  category: AudioCategory;
  zone?: EnvironmentZone;
  description?: string;
}

// Zone-specific ambient audio assets
const ambientAudioAssets: AudioAssetDefinition[] = [
  {
    key: 'ambient_coral_reef',
    url: '/audio/ambient/coral_reef/ambient_loop.mp3',
    category: AudioCategory.AMBIENT,
    zone: EnvironmentZone.CORAL_REEF,
    description: 'Coral reef ambient loop with water movement and distant fish'
  },
  {
    key: 'ambient_open_ocean',
    url: '/audio/ambient/open_ocean/ambient_loop.mp3',
    category: AudioCategory.AMBIENT,
    zone: EnvironmentZone.OPEN_OCEAN,
    description: 'Open ocean ambient loop with deeper currents and distant sounds'
  },
  {
    key: 'ambient_deep_sea',
    url: '/audio/ambient/deep_sea/ambient_loop.mp3',
    category: AudioCategory.AMBIENT,
    zone: EnvironmentZone.DEEP_SEA,
    description: 'Deep sea ambient loop with pressure creaks and ominous tones'
  }
];

// Zone-specific sound effects
const coralReefSfxAssets: AudioAssetDefinition[] = [
  {
    key: 'coral_reef_fish',
    url: '/audio/sfx/coral_reef/fish.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.CORAL_REEF,
    description: 'Small fish swimming sound'
  },
  {
    key: 'coral_reef_bubbles',
    url: '/audio/sfx/coral_reef/bubbles.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.CORAL_REEF,
    description: 'Bubbles rising from coral'
  },
  {
    key: 'coral_reef_creak',
    url: '/audio/sfx/coral_reef/creak.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.CORAL_REEF,
    description: 'Coral structure movement'
  }
];

const openOceanSfxAssets: AudioAssetDefinition[] = [
  {
    key: 'open_ocean_whale',
    url: '/audio/sfx/open_ocean/whale.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.OPEN_OCEAN,
    description: 'Distant whale call'
  },
  {
    key: 'open_ocean_current',
    url: '/audio/sfx/open_ocean/current.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.OPEN_OCEAN,
    description: 'Water current movement'
  },
  {
    key: 'open_ocean_distant',
    url: '/audio/sfx/open_ocean/distant.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.OPEN_OCEAN,
    description: 'Distant underwater sound'
  }
];

const deepSeaSfxAssets: AudioAssetDefinition[] = [
  {
    key: 'deep_sea_creak',
    url: '/audio/sfx/deep_sea/creak.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.DEEP_SEA,
    description: 'Deep pressure creak'
  },
  {
    key: 'deep_sea_rumble',
    url: '/audio/sfx/deep_sea/rumble.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.DEEP_SEA,
    description: 'Deep underwater rumble'
  },
  {
    key: 'deep_sea_creature',
    url: '/audio/sfx/deep_sea/creature.mp3',
    category: AudioCategory.SFX,
    zone: EnvironmentZone.DEEP_SEA,
    description: 'Strange deep sea creature sound'
  }
];

// Common sound effects used across all zones
const commonSfxAssets: AudioAssetDefinition[] = [
  {
    key: 'player_swim',
    url: '/audio/sfx/player_swim.mp3',
    category: AudioCategory.SFX,
    description: 'Player swimming movement'
  },
  {
    key: 'player_boost',
    url: '/audio/sfx/player_boost.mp3',
    category: AudioCategory.SFX,
    description: 'Player boost activation'
  },
  {
    key: 'collect_coin',
    url: '/audio/sfx/collect_coin.mp3',
    category: AudioCategory.SFX,
    description: 'Collect coin sound'
  },
  {
    key: 'collect_powerup',
    url: '/audio/sfx/collect_powerup.mp3',
    category: AudioCategory.SFX,
    description: 'Collect power-up sound'
  },
  {
    key: 'collision',
    url: '/audio/sfx/collision.mp3',
    category: AudioCategory.SFX,
    description: 'Obstacle collision'
  },
  {
    key: 'surface_splash',
    url: '/audio/sfx/surface_splash.mp3',
    category: AudioCategory.SFX,
    description: 'Surface water splash'
  }
];

// Music tracks
const musicAssets: AudioAssetDefinition[] = [
  {
    key: 'music_main_theme',
    url: '/audio/music/main_theme.mp3',
    category: AudioCategory.MUSIC,
    description: 'Main game theme'
  },
  {
    key: 'music_coral_reef',
    url: '/audio/music/coral_reef/theme.mp3',
    category: AudioCategory.MUSIC,
    zone: EnvironmentZone.CORAL_REEF,
    description: 'Coral reef zone theme'
  },
  {
    key: 'music_open_ocean',
    url: '/audio/music/open_ocean/theme.mp3',
    category: AudioCategory.MUSIC,
    zone: EnvironmentZone.OPEN_OCEAN,
    description: 'Open ocean zone theme'
  },
  {
    key: 'music_deep_sea',
    url: '/audio/music/deep_sea/theme.mp3',
    category: AudioCategory.MUSIC,
    zone: EnvironmentZone.DEEP_SEA,
    description: 'Deep sea zone theme'
  }
];

// UI sound effects
const uiSfxAssets: AudioAssetDefinition[] = [
  {
    key: 'ui_click',
    url: '/audio/sfx/ui_click.mp3',
    category: AudioCategory.UI,
    description: 'UI button click'
  },
  {
    key: 'ui_hover',
    url: '/audio/sfx/ui_hover.mp3',
    category: AudioCategory.UI,
    description: 'UI element hover'
  },
  {
    key: 'ui_back',
    url: '/audio/sfx/ui_back.mp3',
    category: AudioCategory.UI,
    description: 'UI back/cancel action'
  },
  {
    key: 'game_start',
    url: '/audio/sfx/game_start.mp3',
    category: AudioCategory.UI,
    description: 'Game start sound'
  },
  {
    key: 'game_over',
    url: '/audio/sfx/game_over.mp3',
    category: AudioCategory.UI,
    description: 'Game over sound'
  }
];

// Combine all audio assets into one array
export const allAudioAssets: AudioAssetDefinition[] = [
  ...ambientAudioAssets,
  ...coralReefSfxAssets,
  ...openOceanSfxAssets,
  ...deepSeaSfxAssets,
  ...commonSfxAssets,
  ...musicAssets,
  ...uiSfxAssets
];

// Helper function to get assets by category
export const getAssetsByCategory = (category: AudioCategory): AudioAssetDefinition[] => {
  return allAudioAssets.filter(asset => asset.category === category);
};

// Helper function to get assets by zone
export const getAssetsByZone = (zone: EnvironmentZone): AudioAssetDefinition[] => {
  return allAudioAssets.filter(asset => asset.zone === zone);
};

// Helper function to get all asset URLs for preloading
export const getAudioAssetsForPreload = () => {
  return allAudioAssets.map(asset => ({
    key: asset.key,
    url: asset.url,
    type: AssetType.AUDIO
  }));
};