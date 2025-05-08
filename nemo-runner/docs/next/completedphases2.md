## High-Level Objective

To refactor the game initialization and start sequence to reliably transition from the main menu (`/game` page load) to the `MENU` state, then through a user-triggered `READY` state with a functional 3-2-1-GO countdown, and finally into the `PLAYING` state where the character correctly begins moving forward. This involves centralizing control logic, removing redundancies, and ensuring state transitions are robust and correctly communicated via the event bus. We will also ensure the procedural asset setup is correctly handled within this flow.

---

## Phase 1: Correct Initial State & Initialization Flow

**Task 1: Ensure Game Starts in MENU State**

*   **Objective:** Guarantee that loading the `/game` page always results in the game being in the `MENU` state initially, not `LOADING` or `READY`.
*   **Rationale:** The current flow seems to bypass the menu. We need `GameStartController` to manage the initialization sequence and explicitly set the initial state to `MENU` *after* all essential systems (rendering, assets, audio) are confirmed ready.
*   **Files to Review/Modify:**
    *   `src/components/game/GameCanvas.tsx`: The main entry point where initialization is triggered.
    *   `src/game/core/GameStartController.ts`: Needs to manage the overall initialization flow and set the final initial state.
    *   `src/game/core/GameStateManager.ts`: Ensure the default state is `MENU` and it's correctly set after initialization.
*   **Sub-tasks:**
    *   [ ] **1.1:** Modify `GameStartController.initialize()`: Ensure it awaits the completion of `initializeRenderingSystem`, `loadAssets`, and `initializeAudio` (or their readiness events). *Crucially*, after all promises resolve successfully (or gracefully handle failures), explicitly set the `GameStateManager` state to `MENU` by calling `gameStateManager.setState('MENU')`. Emit the `all-systems-ready` event *before* setting the state to MENU.
    *   [ ] **1.2:** Modify `GameCanvas.tsx`: Ensure the `initializeGame` function correctly awaits the completion of `gameStartController.initialize()`. The initial state rendered by `GameStateDisplay` should reflect `gameStateManager.state` (which will be `MENU` after init).
    *   [ ] **1.3:** Modify `LoadingScreen.tsx`: Ensure it correctly listens for the `asset-loading-complete` event (even though assets are procedural and load instantly) and hides itself. It should *not* trigger any state changes itself; it should only react to the `LOADING` state managed by `GameStateManager` (which `GameStartController` might briefly set during its init phase, though this might be unnecessary now). Remove the failsafe timeout that forces a transition to READY, as `GameStartController` now handles the final state setting.
*   **Potential Challenges:** Ensuring the asynchronous initialization steps complete in the correct order before setting the `MENU` state. Handling potential errors during initialization gracefully.
*   **Best Practices:** Use `async/await` for managing the initialization sequence. Centralize the final state setting after initialization in `GameStartController`.
*   **Definition of Done:** Navigating to `/game` consistently shows the `MENU` state UI after a brief loading period (if any). Console logs confirm the state transition flow (`LOADING`? -> `MENU`). `LoadingScreen` hides correctly.
*   **Self-Validation:**
    *   [ ] Does the game interface load showing the "Start Game" button?
    *   [ ] Does the console show `GameStateManager: Attempting state change ... -> MENU` as the *final* step of initialization?
    *   [ ] Does the `LoadingScreen` component unmount or become hidden?

---

## Phase 2: Refactor Countdown Logic

**Task 2: Centralize Countdown Timing in `GameStartController`**

*   **Objective:** Move the responsibility for managing the 3-2-1-GO countdown *timing* from the `GameStateDisplay` React component to the `GameStartController`.
*   **Rationale:** The controller should manage game flow logic, while the UI component should only display the current state/countdown value. This fixes the separation of concerns and makes the countdown more robust against React re-renders or performance hiccups affecting UI timers.
*   **Files to Modify:**
    *   `src/game/core/GameStartController.ts`: Implement the countdown timer logic.
    *   `src/components/game/GameStateDisplay.tsx`: Remove internal timer logic and listen for events instead.
    *   `src/game/core/GameStateManager.ts`: Ensure it transitions to `READY` when requested by `GameStartController`, and later to `PLAYING` when the countdown finishes.
*   **Sub-tasks:**
    *   [ ] **2.1:** In `GameStartController.ts`, add a private method `startCountdownSequence()`.
    *   [ ] **2.2:** Modify `requestStartGame()` in `GameStartController.ts`: Instead of directly setting state to PLAYING, it should:
        *   Check if the state is `MENU` or `GAME_OVER`.
        *   Set `GameStateManager` state to `READY`.
        *   Call `this.startCountdownSequence()`.
    *   [ ] **2.3:** Implement `startCountdownSequence()`:
        *   Use `setInterval` to manage the countdown steps (3, 2, 1, 0="GO!").
        *   In each interval step:
            *   Decrement an internal `countdownValue`.
            *   Emit `countdown-update` event via `eventBus` with the current value (`{ count: countdownValue }`).
            *   Emit a `play-sound` event for the countdown tick (if value > 0).
            *   When `countdownValue` reaches 0, display "GO!" (emit `countdown-update` with 0).
            *   After a short delay (e.g., 800ms) *after* emitting 0:
                *   Clear the interval (`clearInterval`).
                *   Set `GameStateManager` state to `PLAYING`.
        *   Ensure the interval is cleared if the game state changes away from `READY` during the countdown.
    *   [ ] **2.4:** In `GameStateDisplay.tsx`, *remove all `useEffect` hooks containing `setInterval` or chained `setTimeout` logic* for the countdown.
    *   [ ] **2.5:** In `GameStateDisplay.tsx`, add a `useEffect` hook that subscribes to the `countdown-update` event. Update the component's local `countdown` state based on the data received from the event.
    *   [ ] **2.6:** Ensure the rendering logic in `GameStateDisplay.tsx` correctly displays the `countdown` state variable when the `currentState` is `READY`.
*   **Potential Challenges:** Ensuring `setInterval` is correctly cleared in all scenarios (state change, component unmount). Synchronizing the final "GO!" display with the state transition to `PLAYING`.
*   **Best Practices:** Use a single `setInterval` managed within the controller. Rely on state changes and events for communication, not direct calls between unrelated components. Ensure proper cleanup of intervals.
*   **Definition of Done:** Clicking "Start Game" transitions state to `READY`. The countdown (3, 2, 1, GO!) displays correctly. After "GO!", the state transitions to `PLAYING`. Console logs show events being emitted and received correctly. No timers remain active after the sequence completes or is interrupted.
*   **Self-Validation:**
    *   [ ] Does the UI show 3, 2, 1, GO! in sequence?
    *   [ ] Does the console log show `GameStateManager: Attempting state change ... -> READY` followed by `countdown-update` events, and finally `GameStateManager: Attempting state change READY -> PLAYING`?
    *   [ ] Is the `setInterval` cleared correctly (check console logs in `GameStartController.dispose` or state change logic)?

---

## Phase 3: Fix Character Movement Initiation

**Task 3: Streamline Movement Trigger in `CharacterController`**

*   **Objective:** Ensure the character reliably starts moving *only* when the `game-start-movement` event is received while the game state is `PLAYING`. Remove all other redundant triggers and failsafes.
*   **Rationale:** The previous implementation had multiple conflicting triggers. We need to rely on the single, definitive event emitted by `GameStateManager` upon entering the `PLAYING` state.
*   **Files to Modify:**
    *   `src/game/entities/character/CharacterController.ts`: Simplify event listeners and update logic.
    *   `src/game/core/GameStateManager.ts`: Verify it emits `game-start-movement` *only* when transitioning to `PLAYING`.
*   **Sub-tasks:**
    *   [ ] **3.1:** In `CharacterController.ts`, remove *all* event listeners *except* the one for `game-start-movement`. This includes removing listeners for `game-start`, `verify-character-movement`, and any DOM event listeners (`nemo-game-start-playing`).
    *   [ ] **3.2:** In the `game-start-movement` event handler within `CharacterController.ts`:
        *   Add a check: `if (gameStateManager.state === 'PLAYING' && !this.isMoving)`.
        *   Inside the `if`, set `this.isMoving = true;`.
        *   Add a small initial `this.moveForward(0.05);` to prevent potential physics "sticking".
    *   [ ] **3.3:** In `CharacterController.update()`, remove any logic that *forces* `this.isMoving = true` just because the state is `PLAYING`. Rely *only* on the event handler to set this flag initially. Keep the simplified stuck detection (checking `lastPositionZ`).
    *   [ ] **3.4:** In `GameStateManager.ts`, double-check the `setState` or `handleStateSpecifics` method. Confirm that `eventBus.emit('game-start-movement', ...)` is called *only* when `newState` is `PLAYING` and potentially only if transitioning *from* `READY` or `PAUSED`.
*   **Potential Challenges:** Ensuring the `game-start-movement` event is reliably emitted *after* the `PLAYING` state is fully set and received by the `CharacterController` before its first `update` in the `PLAYING` state.
*   **Best Practices:** Single source of truth for events. Event listeners should be specific and handle only their intended event. State checks within handlers prevent acting on stale events.
*   **Definition of Done:** Character starts moving forward immediately and consistently after the "GO!" countdown finishes. No redundant movement triggers exist in the code. Console logs show a single `game-start-movement` event received by the controller when expected.
*   **Self-Validation:**
    *   [ ] Does the character start moving precisely after "GO!" disappears?
    *   [ ] Search the codebase: Are there any other listeners for `game-start`, `verify-character-movement`, or `nemo-game-start-playing`? (Should be none in `CharacterController`).
    *   [ ] Do console logs confirm `[CharacterController] Received game-start-movement event` and `[CharacterController] Initializing movement.` messages appear only once at the start of gameplay?

---

## Phase 4: UI Rendering and Cleanup

**Task 4: Ensure Correct UI Component Visibility**

*   **Objective:** Make sure the `GameStateDisplay` (Menu, Countdown, Pause, Game Over) and `GameUI` (HUD) components render only during their appropriate game states.
*   **Rationale:** `GameStateDisplay` should hide during `PLAYING`, and `GameUI` should only be visible during `PLAYING`. `LoadingScreen` handles `LOADING`.
*   **Files to Modify:**
    *   `src/components/game/GameCanvas.tsx`: Control conditional rendering of overlays.
    *   `src/components/game/GameStateDisplay.tsx`: Remove internal visibility logic, rely on parent.
    *   `src/components/game/GameUI.tsx`: Ensure it correctly renders based on the `PLAYING` state received via props or context/eventBus.
*   **Sub-tasks:**
    *   [ ] **4.1:** In `GameCanvas.tsx`, implement the `showStateOverlays` state logic as described in the proposed solution. Render `<GameStateDisplay />` conditionally: `{showStateOverlays && <GameStateDisplay />}`.
    *   [ ] **4.2:** In `GameCanvas.tsx`, ensure `<LoadingScreen />` is rendered (it handles its own visibility based on the `LOADING` state).
    *   [ ] **4.3:** In `GameCanvas.tsx`, ensure `<GameUI />` is always rendered (it will internally check the game state and render its elements only when `PLAYING`).
    *   [ ] **4.4:** In `GameStateDisplay.tsx`, remove any remaining internal logic that tries to hide the component when the state is `PLAYING` or `LOADING`. Its rendering is now controlled by the parent (`GameCanvas`).
    *   [ ] **4.5:** In `GameUI.tsx`, ensure the main wrapper `div` returns `null` or applies a 'hidden' style if `gameState` (obtained via its `useEffect` listener) is *not* `PLAYING`.
*   **Potential Challenges:** Ensuring smooth transitions between UI states without flickering. Correctly managing the `showStateOverlays` state in `GameCanvas`.
*   **Best Practices:** Separate container components (like `GameCanvas`) managing layout and visibility from presentational components (`GameStateDisplay`, `GameUI`). Use CSS for transitions where possible.
*   **Definition of Done:** The Menu UI shows initially. Countdown shows when state is `READY`. HUD (`GameUI`) shows *only* when state is `PLAYING`. Pause/Game Over overlays show when appropriate. No UI elements overlap incorrectly.
*   **Self-Validation:**
    *   [ ] Is the Menu visible on load?
    *   [ ] Does the Countdown appear and function correctly?
    *   [ ] Does the Countdown/Ready UI disappear when gameplay starts?
    *   [ ] Does the HUD (`GameUI`) appear *only* during gameplay?
    *   [ ] Do the Pause and Game Over screens appear correctly?

---

## Overall Self-Validation Checklist

1.  [ ] Game loads to the `MENU` state.
2.  [ ] Clicking "Start Game" transitions to `READY` state.
3.  [ ] Countdown 3, 2, 1, GO! displays correctly.
4.  [ ] State transitions to `PLAYING` immediately after the "GO!" display finishes (after the 800ms delay in `GameStartController`).
5.  [ ] Character starts moving forward automatically and reliably when the state becomes `PLAYING`.
6.  [ ] `GameStateDisplay` component is *not* rendered during the `PLAYING` state.
7.  [ ] `GameUI` component (HUD) *is* rendered during the `PLAYING` state.
8.  [ ] Console logs show a clean sequence: `MENU` -> `READY` -> `countdown-update` (3, 2, 1, 0) -> `PLAYING` -> `game-start-movement`.
9.  [ ] Code review confirms removal of redundant timers and event listeners in `GameStateDisplay` and `CharacterController`.
10. [ ] Game remains stable and performant during the start sequence (check for excessive "Severe performance issues" logs *during* the countdown/start).

---

This plan focuses on fixing the core start sequence logic by enforcing the intended streamlined flow and cleaning up conflicting implementations. Addressing the performance warnings is a separate, important task that should be tackled once the start sequence is reliable.