import { PlayerController } from '../managers/PlayerController';
import { configSystem } from './ConfigurationSystem';

export class InputHandler {
  private playerController: PlayerController;
  private keysPressed: { [key: string]: boolean } = {};
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleKeyUp: (event: KeyboardEvent) => void;
  private touchConfig: {
    swipeMinDistance: number;
    swipeMaxDuration: number;
    swipeAngleThreshold: number;
  };

  constructor(playerController: PlayerController) {
    this.playerController = playerController;
    // Bind methods to ensure 'this' context is correct in event handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);

    const tc = (configSystem.get as any)(
      'touchControls' as any
    ) as Partial<{
      swipeMinDistance: number;
      swipeMaxDuration: number;
      swipeAngleThreshold: number;
    }>;
    this.touchConfig = {
      swipeMinDistance: tc?.swipeMinDistance ?? 40,
      swipeMaxDuration: tc?.swipeMaxDuration ?? 500,
      swipeAngleThreshold: tc?.swipeAngleThreshold ?? Math.PI / 5
    };
  }

  public initialize(): void {
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
    console.log("InputHandler: Initialized and listening for keyboard events.");
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.keysPressed[event.key]) { // Only trigger on initial press
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
          this.playerController.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
          this.playerController.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case ' ': // Space bar for jump
          event.preventDefault(); // Prevent page scroll if using space
          this.playerController.jump();
          break;
        case 'ArrowDown':
        case 's':
          event.preventDefault();
          this.playerController.dive();
          break;
      }
    }
    this.keysPressed[event.key] = true;
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed[event.key] = false;
  }

  public update(deltaTime: number): void {
    // No continuous movement for lane system; handled on keydown only
  }

  // Process a swipe gesture. Exposed for testing but used internally by touch handlers.
  private processSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    deltaTime: number
  ): void {
    if (deltaTime > this.touchConfig.swipeMaxDuration) {
      return;
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < this.touchConfig.swipeMinDistance) {
      return;
    }

    const angle = Math.atan2(deltaY, deltaX);

    if (absDeltaX > absDeltaY) {
      if (absDeltaX >= this.touchConfig.swipeMinDistance) {
        if (
          Math.abs(angle) < this.touchConfig.swipeAngleThreshold ||
          Math.abs(angle) > Math.PI - this.touchConfig.swipeAngleThreshold
        ) {
          if (deltaX > 0) {
            this.playerController.moveRight();
          } else {
            this.playerController.moveLeft();
          }
          return;
        }
      }
    } else {
      if (absDeltaY >= this.touchConfig.swipeMinDistance) {
        if (
          Math.abs(angle - Math.PI / 2) < this.touchConfig.swipeAngleThreshold ||
          Math.abs(angle + Math.PI / 2) < this.touchConfig.swipeAngleThreshold
        ) {
          if (deltaY > 0) {
            this.playerController.dive();
          } else {
            this.playerController.jump();
          }
          return;
        }
      }
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.keysPressed = {}; // Clear pressed keys
    console.log("InputHandler: Disposed and removed keyboard event listeners.");
  }
} 