import * as THREE from 'three';

// Environment type
export type EnvironmentType = 'reef' | 'openOcean' | 'deepSea' | 'shipwreck' | 'kelpForest';

// Environment theme definition
export interface EnvironmentTheme {
  type: EnvironmentType;
  backgroundColor: number;
  fogColor: number;
  fogDensity: number;
  lightIntensity: number;
  floorColor: number;
  floorRoughness: number;
  floorMetalness: number;
  decorationDensity: number;
  particleDensity: number;
  transitionDuration: number;
  minDistance: number; // Minimum distance to travel before possible transition
  
  // Additional properties for skybox
  skyColorTop?: number;
  skyColorBottom?: number;
  
  // Additional properties for water
  waterColor?: number;
  waterOpacity?: number;
  
  // Additional properties for ground
  groundColor?: number;
  
  // Additional properties for decorations
  decorationColor?: number;
  decorationRoughness?: number;
  decorationMetalness?: number;
}

// Environment themes
export const ENVIRONMENT_THEMES: Record<EnvironmentType, EnvironmentTheme> = {
  reef: {
    type: 'reef',
    backgroundColor: 0x4ac7e9,
    fogColor: 0x4ac7e9,
    fogDensity: 0.01,
    lightIntensity: 1.0,
    floorColor: 0xd9c7ad,
    floorRoughness: 0.8,
    floorMetalness: 0.1,
    decorationDensity: 0.8,
    particleDensity: 0.4,
    transitionDuration: 5.0,
    minDistance: 500
  },
  openOcean: {
    type: 'openOcean',
    backgroundColor: 0x0c6b9c,
    fogColor: 0x0c6b9c,
    fogDensity: 0.005,
    lightIntensity: 0.8,
    floorColor: 0x1a3f54,
    floorRoughness: 0.7,
    floorMetalness: 0.2,
    decorationDensity: 0.2,
    particleDensity: 0.2,
    transitionDuration: 8.0,
    minDistance: 800
  },
  deepSea: {
    type: 'deepSea',
    backgroundColor: 0x05445E,
    fogColor: 0x05445E,
    fogDensity: 0.03,
    lightIntensity: 0.4,
    floorColor: 0x0a1c21,
    floorRoughness: 0.9,
    floorMetalness: 0.3,
    decorationDensity: 0.5,
    particleDensity: 0.1,
    transitionDuration: 6.0,
    minDistance: 1200
  },
  shipwreck: {
    type: 'shipwreck',
    backgroundColor: 0x2d4559,
    fogColor: 0x2d4559,
    fogDensity: 0.02,
    lightIntensity: 0.6,
    floorColor: 0x2a3c4a,
    floorRoughness: 0.8,
    floorMetalness: 0.2,
    decorationDensity: 0.9,
    particleDensity: 0.3,
    transitionDuration: 7.0,
    minDistance: 1000
  },
  kelpForest: {
    type: 'kelpForest',
    backgroundColor: 0x2a8e82,
    fogColor: 0x2a8e82,
    fogDensity: 0.015,
    lightIntensity: 0.7,
    floorColor: 0x1a5951,
    floorRoughness: 0.7,
    floorMetalness: 0.1,
    decorationDensity: 1.0,
    particleDensity: 0.5,
    transitionDuration: 6.0,
    minDistance: 700
  }
};

// Apply environment theme to scene
export function applyEnvironmentTheme(scene: THREE.Scene, renderer: THREE.WebGLRenderer, theme: EnvironmentTheme, transitionProgress: number = 1.0): void {
  // Apply background color
  scene.background = new THREE.Color(theme.backgroundColor);
  
  // Apply fog
  scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);
  
  // If there's a transition in progress, we would apply partial values here
  if (transitionProgress < 1.0) {
    // Transitioning logic would go here
    // This would interpolate between previous and current theme
  }
}

// Utility functions for theme transitions
export function lerpThemes(themeA: EnvironmentTheme, themeB: EnvironmentTheme, progress: number): EnvironmentTheme {
  // Create a new theme that interpolates between themeA and themeB
  const lerpedTheme: EnvironmentTheme = {
    type: progress < 0.5 ? themeA.type : themeB.type, // Can't interpolate enum, so we pick based on progress
    backgroundColor: lerpColor(themeA.backgroundColor, themeB.backgroundColor, progress),
    fogColor: lerpColor(themeA.fogColor, themeB.fogColor, progress),
    fogDensity: lerp(themeA.fogDensity, themeB.fogDensity, progress),
    lightIntensity: lerp(themeA.lightIntensity, themeB.lightIntensity, progress),
    floorColor: lerpColor(themeA.floorColor, themeB.floorColor, progress),
    floorRoughness: lerp(themeA.floorRoughness, themeB.floorRoughness, progress),
    floorMetalness: lerp(themeA.floorMetalness, themeB.floorMetalness, progress),
    decorationDensity: lerp(themeA.decorationDensity, themeB.decorationDensity, progress),
    particleDensity: lerp(themeA.particleDensity, themeB.particleDensity, progress),
    transitionDuration: themeB.transitionDuration, // Don't interpolate these
    minDistance: themeB.minDistance // Don't interpolate these
  };
  
  return lerpedTheme;
}

// Helper functions for interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(colorA: number, colorB: number, t: number): number {
  const a = new THREE.Color(colorA);
  const b = new THREE.Color(colorB);
  
  const r = lerp(a.r, b.r, t);
  const g = lerp(a.g, b.g, t);
  const b_ = lerp(a.b, b.b, t);
  
  return new THREE.Color(r, g, b_).getHex();
}