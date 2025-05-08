import * as THREE from 'three';
import { EnvironmentType } from './EnvironmentTypes';

// Decoration item definition
export interface DecorationDefinition {
  type: string;
  scale: THREE.Vector3 | number;
  yOffset: number;
  rotationVariance: number;
  scaleVariance: number;
  canFloatAboveGround: boolean;
  environmentTypes: EnvironmentType[];
  probability: number; // Relative probability of spawning
}

// Decoration categories for better organization
export enum DecorationCategory {
  CORAL = 'coral',
  VEGETATION = 'vegetation',
  ROCK = 'rock',
  SHIPWRECK = 'shipwreck',
  DEEP_SEA = 'deep_sea',
  FLOATING = 'floating'
}

// Decoration definitions
export const DECORATION_DEFINITIONS: DecorationDefinition[] = [
  // Coral and reef formations
  {
    type: 'coral1',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 1.0
  },
  {
    type: 'coral2',
    scale: 1.2,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.8
  },
  {
    type: 'branchingCoral',
    scale: 1.3,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.9
  },
  {
    type: 'tubeCoral',
    scale: 0.8,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.7
  },
  {
    type: 'coralCluster',
    scale: 1.5,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.8
  },
  
  // Vegetation
  {
    type: 'seaweed1',
    scale: 1.5,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'kelpForest'],
    probability: 1.0
  },
  {
    type: 'kelpStalk',
    scale: 2.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.7,
    canFloatAboveGround: false,
    environmentTypes: ['kelpForest'],
    probability: 1.5
  },
  {
    type: 'seaGrass',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.2,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'kelpForest'],
    probability: 1.2
  },
  {
    type: 'seaAnemone',
    scale: 0.7,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.6
  },
  {
    type: 'giantKelp',
    scale: 3.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['kelpForest'],
    probability: 1.8
  },
  
  // Rock formations
  {
    type: 'rock1',
    scale: 0.8,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'deepSea', 'shipwreck', 'kelpForest'],
    probability: 0.7
  },
  {
    type: 'rock2',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['reef', 'deepSea', 'shipwreck', 'kelpForest', 'openOcean'],
    probability: 0.6
  },
  {
    type: 'rockFormation',
    scale: 1.6,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea', 'reef', 'openOcean'],
    probability: 0.7
  },
  {
    type: 'coralRock',
    scale: 1.2,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['reef'],
    probability: 0.9
  },
  
  // Shipwreck elements
  {
    type: 'shipPart',
    scale: 1.5,
    yOffset: -1.0,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 1.2
  },
  {
    type: 'treasure',
    scale: 0.7,
    yOffset: -1.7,
    rotationVariance: Math.PI * 0.5,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.4
  },
  {
    type: 'anchor',
    scale: 1.3,
    yOffset: -1.6,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.5
  },
  {
    type: 'shipHull',
    scale: 2.5,
    yOffset: -1.0,
    rotationVariance: Math.PI * 0.5,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.8
  },
  {
    type: 'barrel',
    scale: 0.7,
    yOffset: -1.7,
    rotationVariance: Math.PI,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['shipwreck'],
    probability: 0.6
  },
  
  // Deep sea elements
  {
    type: 'deepsea_vent',
    scale: 1.0,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.2,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.5
  },
  {
    type: 'glowingPlant',
    scale: 0.8,
    yOffset: -1.6,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.8
  },
  {
    type: 'crystalFormation',
    scale: 1.1,
    yOffset: -1.8,
    rotationVariance: Math.PI * 0.3,
    scaleVariance: 0.4,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.7
  },
  {
    type: 'bioluminescentCoral',
    scale: 0.9,
    yOffset: -1.7,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.3,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.9
  },
  {
    type: 'abyssalRock',
    scale: 1.4,
    yOffset: -1.8,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: false,
    environmentTypes: ['deepSea'],
    probability: 0.6
  },
  
  // Floating elements
  {
    type: 'floatingPlankton',
    scale: 0.5,
    yOffset: 1.0,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: true,
    environmentTypes: ['openOcean', 'reef'],
    probability: 0.8
  },
  {
    type: 'schoolOfFish',
    scale: 1.0,
    yOffset: 0.5,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.5,
    canFloatAboveGround: true,
    environmentTypes: ['openOcean', 'reef', 'kelpForest'],
    probability: 0.7
  },
  {
    type: 'jellyfish',
    scale: 0.8,
    yOffset: 0.8,
    rotationVariance: Math.PI * 0.2,
    scaleVariance: 0.3,
    canFloatAboveGround: true,
    environmentTypes: ['openOcean', 'deepSea'],
    probability: 0.5
  },
  {
    type: 'bubbleStream',
    scale: 0.6,
    yOffset: -1.5,
    rotationVariance: Math.PI * 0.1,
    scaleVariance: 0.2,
    canFloatAboveGround: true,
    environmentTypes: ['reef', 'kelpForest', 'deepSea'],
    probability: 0.4
  },
  {
    type: 'floatingDebris',
    scale: 0.7,
    yOffset: 0.6,
    rotationVariance: Math.PI * 2,
    scaleVariance: 0.4,
    canFloatAboveGround: true,
    environmentTypes: ['shipwreck', 'openOcean'],
    probability: 0.4
  }
];

// Utility functions to work with decoration definitions

/**
 * Get decorations that are suitable for a specific environment type
 * @param environmentType The environment type to filter decorations for
 * @returns Array of decoration definitions filtered for the environment type
 */
export function getDecorationsForEnvironment(environmentType: EnvironmentType): DecorationDefinition[] {
  // First get all decorations for this environment type
  const allDecorations = DECORATION_DEFINITIONS.filter(def => 
    def.environmentTypes.includes(environmentType)
  );
  
  // For safety and to reduce errors, let's ensure we always include some rock
  // decorations that use simple geometry and don't require complex assets
  const hasRocks = allDecorations.some(def => def.type === 'rock1' || def.type === 'rock2');
  
  if (!hasRocks) {
    // Add some basic rock decorations
    const basicRocks = DECORATION_DEFINITIONS.filter(def => 
      (def.type === 'rock1' || def.type === 'rock2')
    );
    
    return [...allDecorations, ...basicRocks];
  }
  
  // Adjust probability for potentially complex/missing assets to reduce their frequency
  // or completely exclude them if they're problematic
  const safeDecorations = allDecorations.filter(def => {
    // All decorations have now been properly implemented
    // No exclusions needed anymore
    const excludedAssets: string[] = [];
    return !excludedAssets.includes(def.type);
  });
  
  // Further reduce probability of other complex assets
  return safeDecorations.map(def => {
    // If it's a potentially complex asset type, reduce its probability
    if (['glowingPlant', 'jellyfish', 'giantKelp'].includes(def.type)) {
      return {
        ...def,
        probability: def.probability * 0.3 // Reduce likelihood by 70%
      };
    }
    
    // Further reduce schoolOfFish probability specifically since it's causing the most issues
    if (def.type === 'schoolOfFish') {
      return {
        ...def,
        probability: def.probability * 0.1 // Reduce likelihood by 90%
      };
    }
    return def;
  });
}

/**
 * Get decorations by category
 * @param category The decoration category to filter by
 * @returns Array of decoration definitions in the specified category
 */
export function getDecorationsByCategory(category: DecorationCategory): DecorationDefinition[] {
  switch (category) {
    case DecorationCategory.CORAL:
      return DECORATION_DEFINITIONS.filter(def => 
        ['coral1', 'coral2', 'branchingCoral', 'tubeCoral', 'coralCluster', 'bioluminescentCoral'].includes(def.type)
      );
    case DecorationCategory.VEGETATION:
      return DECORATION_DEFINITIONS.filter(def => 
        ['seaweed1', 'kelpStalk', 'seaGrass', 'seaAnemone', 'giantKelp', 'glowingPlant'].includes(def.type)
      );
    case DecorationCategory.ROCK:
      return DECORATION_DEFINITIONS.filter(def => 
        ['rock1', 'rock2', 'rockFormation', 'coralRock', 'abyssalRock', 'crystalFormation'].includes(def.type)
      );
    case DecorationCategory.SHIPWRECK:
      return DECORATION_DEFINITIONS.filter(def => 
        ['shipPart', 'treasure', 'anchor', 'shipHull', 'barrel'].includes(def.type)
      );
    case DecorationCategory.DEEP_SEA:
      return DECORATION_DEFINITIONS.filter(def => 
        ['deepsea_vent', 'glowingPlant', 'crystalFormation', 'bioluminescentCoral', 'abyssalRock'].includes(def.type)
      );
    case DecorationCategory.FLOATING:
      return DECORATION_DEFINITIONS.filter(def => 
        ['floatingPlankton', 'schoolOfFish', 'jellyfish', 'bubbleStream', 'floatingDebris'].includes(def.type)
      );
    default:
      return [];
  }
}