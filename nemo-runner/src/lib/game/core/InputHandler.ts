import { PlayerController } from '../managers/PlayerController';

export class InputHandler {
  private playerController: PlayerController;
  private keysPressed: { [key: string]: boolean } = {};
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleKeyUp: (event: KeyboardEvent) => void;

  constructor(playerController: PlayerController) {
    this.playerController = playerController;
    // Bind methods to ensure 'this' context is correct in event handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
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

  public update(/* deltaTime: number */): void {
    // No continuous movement for lane system; handled on keydown only
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.keysPressed = {}; // Clear pressed keys
    console.log("InputHandler: Disposed and removed keyboard event listeners.");
  }
} 