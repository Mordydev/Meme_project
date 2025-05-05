// Event system for game-wide communication

type GameEventListeners = {
  onScoreChange?: (score: number) => void;
  onDistanceChange?: (distance: number) => void;
  onGameStateChange?: (state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER') => void;
  onCollision?: (data: { type: string; position: [number, number, number] }) => void;
  onPowerupCollected?: (data: { type: string; duration: number }) => void;
};

// Global event bus
const eventBus = {
  listeners: {} as Record<string, Function[]>,
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  
  emit(event: string, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

// Public API for components to subscribe to game events
export function subscribeToGameEvents(listeners: GameEventListeners) {
  if (listeners.onScoreChange) {
    eventBus.on('score-change', listeners.onScoreChange);
  }
  
  if (listeners.onDistanceChange) {
    eventBus.on('distance-change', listeners.onDistanceChange);
  }
  
  if (listeners.onGameStateChange) {
    eventBus.on('game-state-change', listeners.onGameStateChange);
  }
  
  if (listeners.onCollision) {
    eventBus.on('collision', listeners.onCollision);
  }
  
  if (listeners.onPowerupCollected) {
    eventBus.on('powerup-collected', listeners.onPowerupCollected);
  }
  
  // Return cleanup function
  return () => {
    if (listeners.onScoreChange) {
      eventBus.off('score-change', listeners.onScoreChange);
    }
    
    if (listeners.onDistanceChange) {
      eventBus.off('distance-change', listeners.onDistanceChange);
    }
    
    if (listeners.onGameStateChange) {
      eventBus.off('game-state-change', listeners.onGameStateChange);
    }
    
    if (listeners.onCollision) {
      eventBus.off('collision', listeners.onCollision);
    }
    
    if (listeners.onPowerupCollected) {
      eventBus.off('powerup-collected', listeners.onPowerupCollected);
    }
  };
}

// Export event bus for internal game systems to use
export default eventBus;