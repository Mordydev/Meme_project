# VFX Testing Checklist

## Pre-Test Setup
- [ ] Build the project: `npm run build`
- [ ] Start the development server: `npm run dev`
- [ ] Open the game in browser
- [ ] Check browser console for any errors

## Bubble Trail Testing
- [ ] Start the game and move forward
- [ ] Observe: Bubbles should spawn from seafloor below player
- [ ] Check: Bubbles rise upward with slight wobble
- [ ] Verify: Bubbles fade out over time
- [ ] Test: Stop moving - bubble spawning should continue during regular updates

## Ambient Dust Testing
- [ ] Look around the environment
- [ ] Observe: Small dust particles floating in water
- [ ] Check: Particles drift slowly with wander behavior
- [ ] Verify: Creates ambient underwater atmosphere

## Collectible Pickup Effects
- [ ] Collect a bubble collectible
- [ ] Observe: Sparkle burst effect at pickup location
- [ ] Check: Sparkles use appropriate color for bubble type
- [ ] Collect a coin collectible
- [ ] Observe: Sparkle burst with different color/intensity
- [ ] Verify: Effect plays each time a collectible is picked up

## Obstacle Impact Effects
- [ ] Hit various obstacles (when dangerous):
  - [ ] Coral
  - [ ] Rock
  - [ ] Pufferfish (when inflated)
  - [ ] Shark
  - [ ] Sea Turtle
- [ ] Observe: Debris particles burst from impact point
- [ ] Check: Debris flies outward from collision
- [ ] Verify: Different obstacles may have different colored debris

## Power-Up Collection Effects
- [ ] Collect a power-up (shield, magnet, or speed boost)
- [ ] Observe: Special collection effect at power-up location
- [ ] Check: Effect is distinct from regular collectibles

## Configuration Testing
- [ ] Open browser console
- [ ] Run: `window.__gameEngine.getConfigSystem().get('visuals')`
- [ ] Try disabling particles: Set `enableParticles` to false
- [ ] Verify: All particle effects stop rendering
- [ ] Re-enable and test individual systems by toggling:
  - [ ] `playerTrailBubbles.enabled`
  - [ ] `environmentDust.enabled`
  - [ ] `collectibleSparks.enabled`
  - [ ] `obstacleDebris.enabled`

## Performance Testing
- [ ] Monitor FPS during gameplay
- [ ] If performance issues occur, try:
  - [ ] Reducing `poolSize` for each particle system
  - [ ] Lowering `emissionRate` values
  - [ ] Disabling less critical effects

## Debug Commands (Console)
```javascript
// Get VFX service
const vfx = window.__gameEngine.getVisualEffectsService();

// Get current config
const config = window.__gameEngine.getConfigSystem().get('visuals');

// Manually trigger effects (for testing)
vfx.triggerCollectiblePickup(new THREE.Vector3(0, 0, 0), 'bubble');
vfx.triggerObstacleImpact(new THREE.Vector3(0, 0, 0));
vfx.triggerHitEffect('minor');
vfx.triggerHitEffect('major');

// Check if particles are updating
console.log('Particles enabled:', config.enableParticles);
console.log('Bubble trail config:', config.playerTrailBubbles);
```

## Common Issues and Solutions

### No Particle Effects Visible
1. Check console for errors
2. Verify `enableParticles` is true
3. Check individual system `.enabled` flags
4. Ensure pool sizes are > 0
5. Verify shaders loaded correctly

### Poor Performance
1. Reduce pool sizes
2. Lower emission rates
3. Disable less important effects
4. Check for console warnings about WebGL

### Particles Not Spawning
1. Check emission rates (shouldn't be 0)
2. Verify update is being called with proper deltaTime
3. Check player position is valid
4. Ensure particle lifetime > 0

### Visual Glitches
1. Check for z-fighting issues
2. Verify blend modes are correct
3. Check depth testing settings
4. Look for shader compilation errors

## Final Verification
- [ ] All particle systems render correctly
- [ ] No console errors during gameplay
- [ ] Performance is acceptable (60 FPS target)
- [ ] Effects enhance gameplay without distraction
- [ ] Configuration changes work as expected