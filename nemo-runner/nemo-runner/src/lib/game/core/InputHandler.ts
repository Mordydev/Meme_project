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
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        this.playerController.moveLeft();
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        this.playerController.moveRight();
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

  public dispose(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.keysPressed = {}; // Clear pressed keys
    console.log("InputHandler: Disposed and removed keyboard event listeners.");
  }
} 