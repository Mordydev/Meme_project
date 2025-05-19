import { PlayerController } from '../managers/PlayerController';
import { configSystem } from './ConfigurationSystem';
import { TouchControlsConfig } from '../config/gameConfig';

export class InputHandler {
  private playerController: PlayerController;
  private keysPressed: { [key: string]: boolean } = {};

  // Touch state
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private activeTouchId: number | null = null;

  private touchConfig: Readonly<TouchControlsConfig>;
  private gameCanvasElement: HTMLElement | null = null;

  // Bound event handlers
  private boundHandleKeyDown: (event: KeyboardEvent) => void;
  private boundHandleKeyUp: (event: KeyboardEvent) => void;
  private boundHandleTouchStart: (event: TouchEvent) => void;
  private boundHandleTouchMove: (event: TouchEvent) => void;
  private boundHandleTouchEnd: (event: TouchEvent) => void;
  private boundHandleTouchCancel: (event: TouchEvent) => void;

  constructor(playerController: PlayerController, initialCanvasElement?: HTMLElement) {
    this.playerController = playerController;
    this.touchConfig = configSystem.get('touchControls') as TouchControlsConfig;
    this.gameCanvasElement = initialCanvasElement || null;

    // Bind methods to ensure 'this' context is correct
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleTouchCancel = this.handleTouchCancel.bind(this);
  }

  /**
   * Allows the GameEngine to provide or update the canvas element
   * used for touch input.
   */
  public setGameCanvasElement(element: HTMLElement): void {
    // Remove existing listeners before swapping elements
    this.removeTouchListeners();

    this.gameCanvasElement = element;
    this.addTouchListeners();
    console.log('InputHandler: Touch listeners re-initialized on provided canvas element.');
  }

  private addTouchListeners(): void {
    if (this.gameCanvasElement) {
      this.gameCanvasElement.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
      this.gameCanvasElement.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
      this.gameCanvasElement.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });
      this.gameCanvasElement.addEventListener('touchcancel', this.boundHandleTouchCancel, { passive: false });
    } else {
      console.warn('InputHandler: No game canvas element set; touch listeners not added.');
    }
  }

  private removeTouchListeners(): void {
    if (this.gameCanvasElement) {
      this.gameCanvasElement.removeEventListener('touchstart', this.boundHandleTouchStart);
      this.gameCanvasElement.removeEventListener('touchmove', this.boundHandleTouchMove);
      this.gameCanvasElement.removeEventListener('touchend', this.boundHandleTouchEnd);
      this.gameCanvasElement.removeEventListener('touchcancel', this.boundHandleTouchCancel);
    }
  }

  public initialize(): void {
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
    this.addTouchListeners();
    console.log('InputHandler: Initialized for keyboard and touch events.');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.keysPressed[event.key]) {
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
          event.preventDefault();
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

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (this.activeTouchId === null && event.touches.length > 0) {
      const touch = event.touches[0];
      this.activeTouchId = touch.identifier;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = event.timeStamp;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    // Nothing to do during move; swipe evaluated on end
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    const endedTouch = Array.from(event.changedTouches).find(
      (t) => t.identifier === this.activeTouchId
    );

    if (endedTouch) {
      const touchEndX = endedTouch.clientX;
      const touchEndY = endedTouch.clientY;
      const touchEndTime = event.timeStamp;
      const deltaTime = touchEndTime - this.touchStartTime;

      this.processSwipe(this.touchStartX, this.touchStartY, touchEndX, touchEndY, deltaTime);
      this.activeTouchId = null;
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    const cancelledTouch = Array.from(event.changedTouches).find(
      (t) => t.identifier === this.activeTouchId
    );
    if (cancelledTouch) {
      this.activeTouchId = null;
    }
  }

  private processSwipe(startX: number, startY: number, endX: number, endY: number, deltaTime: number): void {
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
            console.log('InputHandler: Swipe RIGHT detected.');
            this.playerController.moveRight();
          } else {
            console.log('InputHandler: Swipe LEFT detected.');
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
            console.log('InputHandler: Swipe DOWN detected.');
            this.playerController.dive();
          } else {
            console.log('InputHandler: Swipe UP detected.');
            this.playerController.jump();
          }
          return;
        }
      }
    }
  }

  public update(_deltaTime: number): void {
    // No continuous input processing required
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.removeTouchListeners();
    this.keysPressed = {};
    this.activeTouchId = null;
    console.log('InputHandler: Disposed keyboard and touch event listeners.');
  }
}

