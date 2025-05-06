import eventBus from './EventSystem';
import { detectDeviceCapabilities } from '../utils/DeviceUtils';

// Input state interface for tracking active inputs
export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  action: boolean;
}

// Touch event constants
const SWIPE_THRESHOLD = 50;
const TAP_THRESHOLD = 200; // milliseconds
const DOUBLE_TAP_THRESHOLD = 300; // milliseconds

export default class InputHandler {
  // Current input state
  private currentInputState: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    action: false
  };
  
  // Touch handling properties
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;
  private isTouchDevice: boolean;
  
  // Key state tracking for better responsiveness
  private keyStates: { [key: string]: boolean } = {};
  
  constructor() {
    // Detect if we're on a touch device
    this.isTouchDevice = detectDeviceCapabilities().mobile;
    
    // Set up event listeners based on device
    this.setupEventListeners();
    
    // Emit initial input state
    eventBus.emit('input-update', this.currentInputState);
  }
  
  // Get the current input state
  public getInput(): InputState {
    return { ...this.currentInputState };
  }
  
  // Clean up event listeners when done
  public cleanup(): void {
    // Remove keyboard event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    // Remove touch event listeners if on a touch device
    if (this.isTouchDevice) {
      window.removeEventListener('touchstart', this.handleTouchStart);
      window.removeEventListener('touchmove', this.handleTouchMove);
      window.removeEventListener('touchend', this.handleTouchEnd);
    }
  }
  
  // Set up event listeners based on device capabilities
  private setupEventListeners(): void {
    // Set up keyboard controls
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Set up touch controls if on a touch device
    if (this.isTouchDevice) {
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchMove = this.handleTouchMove.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);
      
      window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd);
    }
  }
  
  // Keyboard event handlers
  private handleKeyDown(event: KeyboardEvent): void {
    // Avoid handling repeated keydown events (key held down)
    if (this.keyStates[event.code]) return;
    this.keyStates[event.code] = true;
    
    // Update input state based on the pressed key
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.currentInputState.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.currentInputState.right = true;
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.currentInputState.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.currentInputState.down = true;
        break;
      case 'Enter':
        this.currentInputState.action = true;
        break;
      case 'KeyP':
        // Toggle pause (handled through event)
        eventBus.emit('toggle-pause');
        break;
    }
    
    // Emit input update event
    eventBus.emit('input-update', this.getInput());
    
    // Prevent default for arrow keys and space to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    // Update key state
    this.keyStates[event.code] = false;
    
    // Update input state based on the released key
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.currentInputState.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.currentInputState.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.currentInputState.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.currentInputState.down = false;
        break;
      case 'Enter':
        this.currentInputState.action = false;
        break;
    }
    
    // Emit input update event
    eventBus.emit('input-update', this.getInput());
  }
  
  // Touch event handlers
  private handleTouchStart(event: TouchEvent): void {
    // Prevent default to avoid unwanted behaviors
    event.preventDefault();
    
    // Store the touch start position and time
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
    }
  }
  
  private handleTouchMove(event: TouchEvent): void {
    // Prevent default to avoid scrolling
    event.preventDefault();
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    // Calculate touch duration
    const touchEndTime = performance.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    
    // Get touch end position
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Check for swipe gestures
      if (Math.max(absX, absY) > SWIPE_THRESHOLD) {
        // Determine swipe direction
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            // Swipe right
            this.handleSwipe('right');
          } else {
            // Swipe left
            this.handleSwipe('left');
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            // Swipe down
            this.handleSwipe('down');
          } else {
            // Swipe up
            this.handleSwipe('up');
          }
        }
      } 
      // Check for taps (short touch with little movement)
      else if (touchDuration < TAP_THRESHOLD && Math.max(absX, absY) < SWIPE_THRESHOLD / 2) {
        // Check for double tap
        const timeSinceLastTap = touchEndTime - this.lastTapTime;
        if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
          this.handleDoubleTap(touch.clientX, touch.clientY);
        } else {
          this.handleTap(touch.clientX, touch.clientY);
        }
        this.lastTapTime = touchEndTime;
      }
    }
  }
  
  // Handle swipe gestures
  private handleSwipe(direction: 'left' | 'right' | 'up' | 'down'): void {
    // Reset all directional inputs
    this.resetDirectionalInputs();
    
    // Set the input state based on swipe direction
    switch (direction) {
      case 'left':
        this.currentInputState.left = true;
        // Reset after a short delay to simulate button press
        setTimeout(() => {
          this.currentInputState.left = false;
          eventBus.emit('input-update', this.getInput());
        }, 100);
        break;
      case 'right':
        this.currentInputState.right = true;
        // Reset after a short delay to simulate button press
        setTimeout(() => {
          this.currentInputState.right = false;
          eventBus.emit('input-update', this.getInput());
        }, 100);
        break;
      case 'up':
        this.currentInputState.up = true;
        // Reset after a short delay to simulate button press
        setTimeout(() => {
          this.currentInputState.up = false;
          eventBus.emit('input-update', this.getInput());
        }, 100);
        break;
      case 'down':
        this.currentInputState.down = true;
        // Reset after a short delay to simulate button press
        setTimeout(() => {
          this.currentInputState.down = false;
          eventBus.emit('input-update', this.getInput());
        }, 100);
        break;
    }
    
    // Emit input update event
    eventBus.emit('input-update', this.getInput());
  }
  
  // Handle single tap
  private handleTap(x: number, y: number): void {
    // Simple tap is used for action button
    this.currentInputState.action = true;
    
    // Reset after a short delay to simulate button press
    setTimeout(() => {
      this.currentInputState.action = false;
      eventBus.emit('input-update', this.getInput());
    }, 100);
    
    // Emit input update event
    eventBus.emit('input-update', this.getInput());
  }
  
  // Handle double tap (could be used for special action or pause)
  private handleDoubleTap(x: number, y: number): void {
    // Emit pause toggle event on double tap
    eventBus.emit('toggle-pause');
  }
  
  // Reset all directional inputs
  private resetDirectionalInputs(): void {
    this.currentInputState.left = false;
    this.currentInputState.right = false;
    this.currentInputState.up = false;
    this.currentInputState.down = false;
  }
}