# Game State & Character Movement Implementation Plan

## 1. Problem: "Stuck on GO!" Issue

Currently, there's an issue with the game state transition from "READY" to "PLAYING", causing the character to get stuck and not begin moving forward. This results in the player seeing the "GO!" message but nothing happens afterwards.

## 2. Files to Modify

1. `/src/components/game/GameStateDisplay.tsx` - Enhance state transition from READY to PLAYING
2. `/src/game/entities/character/Character.ts` - Improve movement initialization and stuck detection
3. `/src/game/core/GameStateManager.ts` - Ensure proper state transitions
4. `/src/game/core/EventSystem.ts` - Enable robust event communication

## 3. Detailed Implementation Plan

### 3.1 GameStateDisplay.tsx

The component already has a robust countdown system but needs a few enhancements:

```typescript
// Enhanced countdown timer for READY state with reliable transition
useEffect(() => {
  // Use an array of timeouts for better cleanup
  const timeouts: NodeJS.Timeout[] = [];
  
  // Define a more robust countdown sequence
  const startCountdown = () => {
    console.log('GameStateDisplay: Starting enhanced countdown from 3');
    setCountdown(3);
    
    // Comprehensive sequence with multiple movement triggers
    // Stage 1: Show "3"
    timeouts.push(setTimeout(() => {
      console.log('GameStateDisplay: Countdown: 3');
      setCountdown(3);
      
      // Stage 2: Show "2"
      timeouts.push(setTimeout(() => {
        console.log('GameStateDisplay: Countdown: 2');
        setCountdown(2);
        
        // Stage 3: Show "1"
        timeouts.push(setTimeout(() => {
          console.log('GameStateDisplay: Countdown: 1');
          setCountdown(1);
          
          // Stage 4: Show "GO!"
          timeouts.push(setTimeout(() => {
            console.log('GameStateDisplay: Countdown: GO!');
            setCountdown(0);
            
            // Add diagnostic event to check what's happening at this point
            console.log('GameStateDisplay: Emitting diagnostic event before GO state change');
            eventBus.emit('game-pre-playing-diagnostic', {
              timestamp: Date.now(),
              countdown: 0,
              currentState: currentState,
              gameManagerState: gameStateManager.state,
              component: 'GameStateDisplay'
            });
            
            // Stage 5: Explicit transition to PLAYING after showing GO
            timeouts.push(setTimeout(() => {
              console.log('GameStateDisplay: AUTO-STARTING GAME FROM TIMEOUT');
              
              // CRITICAL FIX 1: Add direct DOM event as one more channel for movement triggering
              try {
                const customEvent = new CustomEvent('nemo-game-start-playing', {
                  detail: { timestamp: Date.now() }
                });
                document.dispatchEvent(customEvent);
              } catch (e) {
                // Ignore errors in custom event dispatch
              }
              
              // CRITICAL FIX 2: First emit game-start-movement before state change
              console.log('GameStateDisplay: Emitting movement trigger BEFORE state change');
              eventBus.emit('game-start-movement', { 
                startTime: Date.now(),
                trigger: 'countdown-complete'
              });
              
              // CRITICAL FIX 3: Now set state to PLAYING - THIS IS THE CORE STEP!
              console.log('GameStateDisplay: Setting state to PLAYING');
              // Direct state manager call is the most reliable approach
              gameStateManager.setState('PLAYING');
              
              // CRITICAL FIX 4: Additional triggers AFTER state change with staggered timing
              timeouts.push(setTimeout(() => {
                eventBus.emit('game-start-movement', { 
                  startTime: Date.now(),
                  trigger: 'after-state-change-20ms'
                });
              }, 20));
              
              timeouts.push(setTimeout(() => {
                eventBus.emit('game-start-movement', { 
                  startTime: Date.now(),
                  trigger: 'after-state-change-100ms'
                });
              }, 100));
              
              // CRITICAL FIX 5: Final verification event after 500ms
              timeouts.push(setTimeout(() => {
                console.log('GameStateDisplay: Sending movement verification event');
                eventBus.emit('verify-character-movement', {
                  timestamp: Date.now(),
                  origin: 'gameStateDisplay-500ms'
                });
                
                // CRITICAL FIX 6: Check if we're still in PLAYING state but UI is stuck
                if (gameStateManager.state === 'PLAYING') {
                  console.log('GameStateDisplay: Game appears to be in PLAYING state after 500ms');
                  
                  // Force-hide this component via direct DOM method
                  const element = document.querySelector(`.${styles.gameStateDisplay}`);
                  if (element) {
                    console.log('GameStateDisplay: Force-hiding display via DOM manipulation');
                    (element as HTMLElement).style.display = 'none';
                  }
                }
              }, 500));
              
            }, 1000)); // Wait 1 second after showing GO
          }, 1000)); // 1 second for countdown 1
        }, 1000)); // 1 second for countdown 2
      }, 1000)); // 1 second for countdown 3
    }, 0)); // Start immediately
  };
  
  // Only start the countdown sequence when we first enter READY state
  if (currentState === 'READY' && countdown === 3) {
    console.log('GameStateDisplay: Detected READY state, starting enhanced countdown sequence');
    startCountdown();
  }
  
  // Clean up function - clear all timeouts
  return () => {
    console.log(`GameStateDisplay: Cleaning up ${timeouts.length} countdown timeouts`);
    timeouts.forEach(timeout => clearTimeout(timeout));
  };
}, [currentState, countdown]); // Add countdown to dependency array to ensure proper sequence
```

Also, enhance the component rendering logic:

```typescript
// Don't render in PLAYING state to avoid wasting resources
if (currentState === 'PLAYING') {
  console.log('GameStateDisplay - Not rendering due to PLAYING state');
  
  // CRITICAL FIX: Explicitly emit an event when component unmounts in PLAYING state
  useEffect(() => {
    if (currentState === 'PLAYING') {
      eventBus.emit('gamestate-display-unmounted', {
        timestamp: Date.now()
      });
    }
    
    return () => {
      if (currentState === 'PLAYING') {
        console.log('GameStateDisplay unmounted in PLAYING state');
      }
    };
  }, [currentState]);
  
  return null;
}
```

### 3.2 Character.ts

Improve the character movement initialization:

```typescript
// Enhanced event listeners with multiple redundant checks for movement initialization
constructor(
  scene: THREE.Scene, 
  assetManager: AssetManager,
  deviceCapabilities?: ReturnType<typeof detectDeviceCapabilities>
) {
  // ... existing initialization ...
  
  // CRITICAL FIX 1: Add direct DOM event listener
  try {
    document.addEventListener('nemo-game-start-playing', (event: any) => {
      console.log('Character received DOM event for game start!');
      this.isMoving = true;
      this.moveForward(0.5); // Significant initial movement
    });
  } catch (e) {
    // Ignore errors in DOM event handling
  }
  
  // CRITICAL FIX 2: Listen to state changes with higher priority
  eventBus.on('game-state-change', (data: { from: string; to: string; }) => {
    console.log(`Character received game state change: ${data.from} -> ${data.to}`);
    
    if (data.to === 'PLAYING') {
      console.log('Character movement enabled from state change to PLAYING!');
      this.isMoving = true;
      this.moveForward(0.5); // Significant initial movement
      
      // Set up staggered movement verification
      this.setupMovementVerification();
    }
  });
  
  // CRITICAL FIX 3: Add diagnostic event listener
  eventBus.on('game-pre-playing-diagnostic', (data: any) => {
    console.log('Character received diagnostic event:', data);
    console.log('Current character state:', {
      isMoving: this.isMoving,
      position: this.mesh ? this.mesh.position.toArray() : null,
      state: this.state
    });
  });
  
  // CRITICAL FIX 4: Multiple event listeners for movement
  const movementEventTypes = [
    'game-start-movement', 'game-start', 'verify-character-movement'
  ];
  
  movementEventTypes.forEach(eventType => {
    eventBus.on(eventType, (data: any) => {
      console.log(`Character received ${eventType} event:`, data);
      
      // Force movement with specific amount based on event type
      let forceAmount = 0.1;
      if (eventType === 'verify-character-movement') forceAmount = 0.5;
      
      if (!this.isMoving) {
        console.warn(`Character wasnt moving on ${eventType}! Enabling movement.`);
        this.isMoving = true;
      }
      
      this.moveForward(forceAmount);
    });
  });
  
  // CRITICAL FIX 5: Extra failsafes with staggered timing
  [200, 500, 1000, 2000, 5000].forEach(delay => {
    setTimeout(() => {
      // Only run if game is in PLAYING state
      if (gameStateManager.state === 'PLAYING') {
        // If not moving or stuck in place
        if (!this.isMoving || 
            (this.mesh && this.lastPosition === this.mesh.position.z)) {
          console.warn(`FAILSAFE (${delay}ms): Character not moving or stuck! Force-moving.`);
          this.isMoving = true;
          this.moveForward(delay / 1000); // Scale force with delay
        }
      }
    }, delay);
  });
}
```

Enhance the update method:

```typescript
update(deltaTime: number, input: any) {
  // Skip update if mesh doesn't exist
  if (!this.mesh) return;
  
  // CRITICAL FIX: Check game state at the beginning
  const gameState = gameStateManager.state;
  
  // If in PLAYING state but not moving, force movement
  if (gameState === 'PLAYING' && !this.isMoving) {
    console.warn('CRITICAL FIX: Character not moving in PLAYING state! Force-enabling movement.');
    this.isMoving = true;
    this.moveForward(0.5); // Significant initial movement
  }
  
  // Rest of update method...
  
  // CRITICAL FIX: Enhanced stuck detection
  if (this.isMoving && this.lastPosition === this.mesh.position.z) {
    this.stuckFrames = (this.stuckFrames || 0) + 1;
    
    if (this.stuckFrames >= 3) { // 3 consecutive frames stuck
      console.error(`STUCK DETECTION: Character stuck for ${this.stuckFrames} frames! Z=${this.mesh.position.z}`);
      this.moveForward(0.5 * this.stuckFrames); // Force stronger with each stuck frame
      
      // Emergency teleport if stuck for too long
      if (this.stuckFrames > 10) {
        console.error('EMERGENCY TELEPORT: Character severely stuck!');
        this.mesh.position.z -= 5.0; // Move forward significantly
        this.lastPosition = this.mesh.position.z;
        this.updateCollider();
      }
    }
  } else {
    this.stuckFrames = 0; // Reset when moving normally
  }
  
  // CRITICAL FIX: Diagnostic logging for serious issues
  if (deltaTime > 0.1) {
    console.warn(`Large delta time detected: ${deltaTime}s. Potential performance issue.`);
  }
  
  // Always store current position for next frame's stuck detection
  this.lastPosition = this.mesh.position.z;
}
```

### 3.3 GameStateManager.ts 

Enhance the setState method to ensure game state transitions are always reliable:

```typescript
setState(newState: GameState): void {
  // Log the previous value before any changes
  console.log(`GameStateManager: Changing state ${this._state} -> ${newState}`);
  
  if (newState === this._state) {
    console.log('GameStateManager: State already set to', newState);
    
    // CRITICAL FIX: If already in PLAYING state, re-emit movement events
    if (newState === 'PLAYING') {
      console.log('GameStateManager: Re-emitting start events for redundancy');
      eventBus.emit('game-start-movement', { 
        startTime: Date.now(),
        trigger: 'state-reaffirmation',
        force: 2
      });
    }
    
    return;
  }

  // Store previous state for potential returns
  this._previousState = this._state;
  
  // Execute 'before exit' callbacks for current state
  this.executeTransitionCallbacks(`${this._state}-exit`);
  
  // Change state
  this._state = newState;
  
  // Execute 'on enter' callbacks for new state
  this.executeTransitionCallbacks(`${newState}-enter`);
  
  // CRITICAL FIX: Add detailed metadata to the event
  const eventData = {
    from: this._previousState,
    to: newState,
    data: this._stateData,
    timestamp: Date.now(),
    prevState: this._previousState,
  };
  
  // Emit state change event
  console.log('GameStateManager: Emitting game-state-change event', eventData);
  eventBus.emit('game-state-change', eventData);

  // Special state handling
  this.handleStateSpecifics(newState);
}
```

Also enhance the handleStateSpecifics method:

```typescript
private handleStateSpecifics(state: GameState): void {
  switch (state) {
    case 'PLAYING':
      // CRITICAL FIX: Additional start movement trigger
      console.log('GameStateManager: Emitting game-start-movement from handleStateSpecifics');
      eventBus.emit('game-start-movement', { 
        startTime: Date.now(),
        source: 'gameStateManager.handleStateSpecifics',
        gameState: 'PLAYING'
      });
      
      // Maybe start game timer or gameplay music
      break;
      
    // Other cases unchanged
  }
}
```

## 4. Testing Strategy

1. **Clear Console Logging**:
   - Add strategic console.log statements at key points in the state transition flow
   - Include timestamps in logs to trace sequence of events
   - Use different console methods (log/warn/error) for different severity levels

2. **Event Verification**:
   - Verify all events are being emitted and received correctly
   - Add event listeners that simply log the receipt of each event type
   - Trace the complete chain of event propagation

3. **Failsafe Testing**:
   - Test the robustness of the system by intentionally breaking primary movement triggers
   - Verify that secondary and failsafe mechanisms still enable character movement
   - Ensure stuck detection correctly identifies and resolves frozen character

4. **Cross-Component Verification**:
   - Verify that GameStateDisplay properly hides when the game is in PLAYING state
   - Check that Character correctly starts moving when state changes to PLAYING
   - Ensure that game control UI properly appears when playing

## 5. Expected Outcome

1. The game should transition smoothly from the "3, 2, 1, GO!" countdown to gameplay
2. The character should begin moving forward immediately after "GO!" appears
3. If any component in the chain fails, the failsafes should enable movement
4. Console logging should show a clear, sequential flow of events during the transition
5. No more "stuck on GO!" issues with the player character starting to move properly