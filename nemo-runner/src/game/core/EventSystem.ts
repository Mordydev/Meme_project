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
    
    // Add some debug logging for critical events
    const criticalEvents = ['game-start-movement', 'game-state-change'];
    if (criticalEvents.includes(event)) {
      console.log(`EventSystem: Registered listener for critical event: ${event}`);
    }
    
    this.listeners[event].push(callback);
  },
  
  // Add once method to listen for an event only once
  once(event: string, callback: Function) {
    const onceWrapper = (data?: any) => {
      // Remove this listener first, then call the callback
      this.off(event, onceWrapper);
      callback(data);
    };
    
    this.on(event, onceWrapper);
  },
  
  off(event: string, callback?: Function) {
    if (!this.listeners[event]) return;
    
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      // If no specific callback provided, clear all listeners for this event
      delete this.listeners[event];
    }
  },
  
  emit(event: string, data?: any) {
    if (!this.listeners[event]) {
      // Always create an empty array for future listeners
      this.listeners[event] = [];
      
      // Special handling for movement events that have no listeners
      if (event === 'game-start-movement') {
        console.warn('⚠️ WARNING: No listeners registered for game-start-movement! Character movement may not start.');
      }
      
      return;
    }
    
    // Add extra debug info for critical events
    const criticalEvents = ['game-start-movement', 'game-state-change'];
    if (criticalEvents.includes(event)) {
      console.log(`EventSystem: Emitting critical event: ${event}, Listeners count: ${this.listeners[event].length}`, data);
    }
    
    // Safe iteration with copy to prevent issues if listeners modify the array during iteration
    const currentListeners = [...this.listeners[event]];
    currentListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
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