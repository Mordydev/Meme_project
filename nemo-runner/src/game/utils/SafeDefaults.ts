/**
 * Safe default values for game environment and rendering
 * Used when real data cannot be loaded or errors occur
 */

// Safe default environment data
export const safeEnvironmentData = {
  current: 'reef',
  transitionProgress: 0
};

// Safe default game state data
export const safeGameStateData = {
  score: 0,
  distance: 0,
  highScore: 0,
  lives: 3,
  powerups: {},
  environment: safeEnvironmentData,
  level: 1,
  difficulty: 1
};

// Safe renderer options
export const safeRendererOptions = {
  antialias: false,
  alpha: false,
  precision: 'lowp',
  powerPreference: 'default',
  depth: true,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false
};

// Create a dummy empty object with type safety
// This can be used when objects need to be instantiated but real values aren't available yet
export const createSafeEmptyObject = <T extends Record<string, any>>(defaults: T): T => {
  return { ...defaults };
};

// Safe render function that does nothing but doesn't throw errors
export const safeRenderFunction = () => {
  // No-op function to avoid errors
  return;
};

// Safe no-op function for event handlers
export const safeNoOp = () => {};

// Safe string formatting function that handles null/undefined
export const safeFormat = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  try {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value);
  } catch (error) {
    console.error('Error formatting value:', error);
    return '';
  }
};

/**
 * Safely access nested properties in an object without throwing
 * Example: safeGet(() => obj.deeply.nested.property, 'defaultValue')
 */
export function safeGet<T>(accessor: () => T, defaultValue: T): T {
  try {
    const value = accessor();
    return (value === undefined || value === null) ? defaultValue : value;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Create a safe wrapper around any function to prevent errors
 */
export function createSafeFunction<T extends (...args: any[]) => any>(
  fn: T, 
  defaultReturn?: ReturnType<T>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      console.warn('Error in safe function:', error);
      return defaultReturn as ReturnType<T>;
    }
  }) as T;
}