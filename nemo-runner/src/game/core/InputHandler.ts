// Input handler for keyboard and touch controls

// Input state type
type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  action: boolean;
};

export default class InputHandler {
  // Input state
  private keys: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    action: false,
  };
  
  // Touch tracking variables
  private touchStartX = 0;
  private touchStartY = 0;
  private touchThreshold = 50; // Minimum swipe distance
  
  constructor() {
    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }
  
  // Get current input state
  getInput(): InputState {
    return { ...this.keys };
  }
  
  // Set up keyboard event listeners
  private setupKeyboardListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }
  
  // Set up touch event listeners
  private setupTouchListeners() {
    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchend', this.handleTouchEnd);
  }
  
  // Clean up event listeners
  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }
  
  // Keyboard event handlers
  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        this.keys.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
        this.keys.right = true;
        e.preventDefault();
        break;
      case 'ArrowUp':
        this.keys.up = true;
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.keys.down = true;
        e.preventDefault();
        break;
      case ' ': // Spacebar
        this.keys.action = true;
        e.preventDefault();
        break;
    }
  };
  
  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'ArrowDown':
        this.keys.down = false;
        break;
      case ' ': // Spacebar
        this.keys.action = false;
        break;
    }
  };
  
  // Touch event handlers
  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  };
  
  private handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      
      // Reset all keys first (we'll simulate a key press and immediate release)
      this.keys.left = false;
      this.keys.right = false;
      this.keys.up = false;
      this.keys.down = false;
      
      // Determine swipe direction based on greater movement
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > this.touchThreshold) {
          if (deltaX > 0) {
            // Simulate right key press
            this.simulateKeyPress('right');
          } else {
            // Simulate left key press
            this.simulateKeyPress('left');
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > this.touchThreshold) {
          if (deltaY > 0) {
            // Simulate down key press
            this.simulateKeyPress('down');
          } else {
            // Simulate up key press
            this.simulateKeyPress('up');
          }
        }
      }
      
      // Double tap detection for action
      // For simplicity, we'll just use any tap (not near the edges) as an action
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        this.simulateKeyPress('action');
      }
    }
  };
  
  // Simulate a key press and schedule its release
  private simulateKeyPress(key: 'left' | 'right' | 'up' | 'down' | 'action') {
    switch (key) {
      case 'left':
        this.keys.left = true;
        break;
      case 'right':
        this.keys.right = true;
        break;
      case 'up':
        this.keys.up = true;
        break;
      case 'down':
        this.keys.down = true;
        break;
      case 'action':
        this.keys.action = true;
        break;
    }
    
    // Schedule key release after a short delay
    setTimeout(() => {
      switch (key) {
        case 'left':
          this.keys.left = false;
          break;
        case 'right':
          this.keys.right = false;
          break;
        case 'up':
          this.keys.up = false;
          break;
        case 'down':
          this.keys.down = false;
          break;
        case 'action':
          this.keys.action = false;
          break;
      }
    }, 100);
  }
}