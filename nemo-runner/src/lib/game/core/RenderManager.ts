import * as THREE from 'three';

export class RenderManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private _errorHandlerCalled: boolean = false; // Track if we've already called error handler
  private _lastRenderSuccess: boolean = true;   // Track if last render was successful
  private _errorDebounceTimer: any = null;      // Debounce timer for error handling

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  /**
   * Updates the renderer reference after WebGL context loss/restoration
   * @param newRenderer The new WebGLRenderer instance
   */
  public updateRenderer(newRenderer: THREE.WebGLRenderer): void {
    if (!newRenderer) {
      console.error("RenderManager: Cannot update renderer - new renderer is undefined");
      return;
    }

    this.renderer = newRenderer;

    // Reset error tracking state when renderer is updated
    this._errorHandlerCalled = false;
    this._lastRenderSuccess = true;

    // Clear any pending error debounce timer
    if (this._errorDebounceTimer) {
      clearTimeout(this._errorDebounceTimer);
      this._errorDebounceTimer = null;
    }

    console.log("RenderManager: Renderer reference updated and error tracking reset");
  }

  private isContextLost(): boolean {
    // Check for explicit context loss
    if (!this.renderer) return true;

    try {
      const gl = this.renderer.getContext();
      if (!gl) return true;

      // Use isContextLost() method from WebGL API
      return gl.isContextLost();
    } catch (e) {
      // If we can't even access the context, it's definitely lost
      return true;
    }
  }

  private isWebGLStateValid(): boolean {
    if (!this.renderer) return false;

    // Basic DOM validity checks
    if (!this.renderer.domElement ||
        !this.renderer.domElement.isConnected ||
        this.renderer.domElement.parentElement === null) {
      return false;
    }

    // Check internal WebGLRenderer state
    if (!this.renderer.info ||
        !this.renderer.properties ||
        !this.renderer.info.programs ||
        !this.renderer.info.memory) {
      return false;
    }

    // Check WebGL context
    try {
      const gl = this.renderer.getContext();
      if (!gl) return false;

      // Try to access crucial WebGL state
      // If this fails, it often means the context is in an unusual state
      const parameter = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      return parameter !== null && parameter !== undefined;
    } catch (e) {
      return false;
    }
  }

  /**
   * Safely handles WebGL errors with debouncing to prevent error handler spam
   * @param errorMessage The error message to log
   * @param error The original error object
   */
  private handleWebGLError(errorMessage: string, error: any): void {
    // If we've already called the error handler recently, don't spam it
    if (this._errorHandlerCalled) {
      return;
    }

    // Set the flag to prevent multiple rapid calls
    this._errorHandlerCalled = true;

    // Log the error
    console.warn(`RenderManager: ${errorMessage}`, error);

    // Clear any existing debounce timer
    if (this._errorDebounceTimer) {
      clearTimeout(this._errorDebounceTimer);
    }

    // Set a new debounce timer to reset the flag after a delay
    this._errorDebounceTimer = setTimeout(() => {
      this._errorHandlerCalled = false;
      this._errorDebounceTimer = null;
    }, 2000); // 2 second debounce period

    // Signal to GameEngine that recovery is needed
    if (window.__gameEngine) {
      if (typeof (window.__gameEngine as any).resetRendererAndShaders === 'function') {
        console.log("RenderManager: Requesting renderer and shader reset");
        (window.__gameEngine as any).resetRendererAndShaders()
          .catch((e: any) => console.error("RenderManager: Reset request failed:", e));
      } else if (typeof (window.__gameEngine as any).handleShaderError === 'function') {
        console.log("RenderManager: Requesting shader error recovery");
        (window.__gameEngine as any).handleShaderError();
      }
    }
  }

  public render(): void {
    try {
      // Advanced context validation
      if (this.isContextLost()) {
        if (this._lastRenderSuccess) {
          // Only log when transitioning from success to failure
          console.warn("RenderManager: WebGL context is lost, skipping render");
          this._lastRenderSuccess = false;
        }
        return;
      }

      // Base object checks
      if (!this.renderer) {
        console.error("RenderManager: Renderer is undefined");
        this._lastRenderSuccess = false;
        return;
      }

      if (!this.scene) {
        console.error("RenderManager: Scene is undefined");
        this._lastRenderSuccess = false;
        return;
      }

      if (!this.camera) {
        console.error("RenderManager: Camera is undefined");
        this._lastRenderSuccess = false;
        return;
      }

      // Deep WebGL state validation
      if (!this.isWebGLStateValid()) {
        this.handleWebGLError("WebGL state is invalid", "State validation failed");
        this._lastRenderSuccess = false;
        return;
      }

      // Reset render state before rendering to prevent residual state issues
      try {
        this.renderer.state.reset();
      } catch (stateError) {
        this.handleWebGLError("Error resetting WebGL state", stateError);
        this._lastRenderSuccess = false;
        return;
      }

      // Attempt to render with protective try/catch
      try {
        this.renderer.render(this.scene, this.camera);

        // If we got here, render was successful
        this._lastRenderSuccess = true;
      } catch (renderError) {
        this._lastRenderSuccess = false;

        // Check for specific WebGL-related errors
        const errorString = String(renderError);

        // Expanded error detection for various THREE.js and WebGL errors
        if (errorString.includes("Cannot set properties of undefined") ||
            errorString.includes("Cannot read properties of null") ||
            errorString.includes("WebGL") ||
            errorString.includes("shader") ||
            errorString.includes("program") ||
            errorString.includes("context") ||
            errorString.includes("INVALID_OPERATION") ||
            errorString.includes("WebGLBuffer") ||
            errorString.includes("precision") ||
            errorString.includes("uniform") ||
            errorString.includes("attribute")) {

          this.handleWebGLError("WebGL/shader render error", renderError);
        } else {
          // Log other errors but don't spam recovery for non-WebGL issues
          console.error("RenderManager: Non-WebGL render error:", renderError);
        }
      }
    } catch (error) {
      this._lastRenderSuccess = false;
      console.error("RenderManager: Uncaught error during rendering", error);
    }
  }

  // Properly dispose resources and clear references
  public dispose(): void {
    // Clear debounce timer if active
    if (this._errorDebounceTimer) {
      clearTimeout(this._errorDebounceTimer);
      this._errorDebounceTimer = null;
    }

    // Reset tracking variables
    this._errorHandlerCalled = false;
    this._lastRenderSuccess = true;

    // Clear references to prevent memory leaks
    // and prevent errors after disposal
    this.scene = null as any;
    this.camera = null as any;
    this.renderer = null as any;
    console.log("RenderManager: Disposed and cleared references.");
  }
} 