# $NEMO Runner Active Context

## Current Work Focus

We are currently in the initial planning and architecture phase of the NEMO Runner project. Our focus is on:

1. **Architecture Planning**: Establishing the core architecture and technology stack for the game.
2. **Component Analysis**: Analyzing example components to understand implementation approaches.
3. **Asset Strategy**: Planning how to create, optimize, and integrate game assets.
4. **Game Design Refinement**: Finalizing gameplay mechanics and progression systems.

The primary goal at this stage is to create a solid foundation for development that ensures:
- High-performance 3D rendering across device ranges
- Clean architecture that enables rapid iteration
- Scalable systems for future feature additions
- Immersive underwater aesthetic that captures the Finding Nemo theme

## Recent Changes

As this is the project initialization phase, there are no recent changes to note yet. This section will be updated as development proceeds.

## Active Decisions

### Technical Decisions

1. **Framework Selection**: 
   - **Decision**: Using Next.js 15.3.1+ with App Router and Three.js 0.176.0+
   - **Rationale**: Provides optimal combination of modern web app architecture with robust 3D rendering capabilities
   - **Status**: Confirmed

2. **Rendering Approach**:
   - **Decision**: Custom shader-based rendering for underwater effects
   - **Rationale**: Achieves highest visual quality while maintaining performance through targeted optimizations
   - **Status**: Confirmed, based on example implementations

3. **Game Component Architecture**:
   - **Decision**: Modular component system with clear separation between rendering, physics, and game logic
   - **Rationale**: Enables parallel development and easier maintenance
   - **Status**: Confirmed

4. **Asset Creation Strategy**:
   - **Decision**: Procedural generation for environment elements with hand-crafted character assets
   - **Rationale**: Balances quality, variety, and development efficiency
   - **Status**: Under discussion, testing procedural generation techniques

### Design Decisions

1. **Control Scheme**:
   - **Decision**: Three-lane movement system with jump/dive mechanics
   - **Rationale**: Intuitive controls that work well on both desktop and mobile
   - **Status**: Confirmed

2. **Difficulty Progression**:
   - **Decision**: Speed-based progression with increasing obstacle density and complexity
   - **Rationale**: Provides natural difficulty curve that rewards skill development
   - **Status**: Confirmed, pending balancing

3. **Visual Style**:
   - **Decision**: Vibrant, stylized underwater world with realistic lighting and caustic effects
   - **Rationale**: Creates immersive atmosphere while maintaining performance
   - **Status**: Confirmed, based on example implementations

4. **Reward Structure**:
   - **Decision**: Daily, weekly, and monthly leaderboards with SOL rewards for top performers
   - **Rationale**: Drives engagement through competition and tangible rewards
   - **Status**: Confirmed concept, implementation details being finalized

## Important Patterns

### Development Patterns

1. **Component-First Development**:
   - Develop and test individual game components before integration
   - Ensure each component works in isolation with mock dependencies
   - Document clear interfaces between components

2. **Performance-Conscious Implementation**:
   - Regular performance profiling during development
   - Optimization strategies identified early for high-risk areas
   - Progressive enhancement for different device capabilities

3. **Iterative Prototyping**:
   - Rapid prototyping of key gameplay mechanics
   - Early feedback integration
   - Refinement based on playtesting

### Technical Patterns

1. **Shader Organization**:
   - Centralized shader management
   - Shared uniforms for consistent effects
   - Performance variants for different device capabilities

2. **Asset Loading Strategy**:
   - Progressive loading based on gameplay needs
   - Preloading critical assets
   - Asset pooling for commonly used objects

3. **State Management**:
   - Clear state machines for game entities
   - Predictable transitions between states
   - State-based rendering and behavior

## Current Challenges

1. **Performance Optimization**:
   - **Challenge**: Maintaining 60fps on mid-range mobile devices with complex underwater effects
   - **Approach**: Implementing adaptive quality settings, efficient shaders, and geometry optimizations
   - **Status**: Investigating best practices from example implementations

2. **Smooth Animation Transitions**:
   - **Challenge**: Creating fluid transitions between different character states (swimming, jumping, diving)
   - **Approach**: Blending animations, physics-based movement calculations
   - **Status**: Analyzing example character controller implementation

3. **Engaging Level Generation**:
   - **Challenge**: Procedurally generating diverse, interesting levels that remain challenging but fair
   - **Approach**: Exploring pattern-based generation with difficulty scaling
   - **Status**: Researching procedural generation techniques

4. **Cross-Device Testing**:
   - **Challenge**: Ensuring consistent experience across wide range of devices
   - **Approach**: Establishing device testing matrix and performance benchmarks
   - **Status**: Setting up testing infrastructure

## Next Steps

1. **Initial Project Setup**:
   - Create Next.js project with Three.js integration
   - Set up development environment and build pipeline
   - Establish coding standards and documentation approach

2. **Core Game Engine**:
   - Implement basic Three.js rendering setup
   - Create character controller with movement mechanics
   - Develop camera system
   - Add collision detection framework

3. **Prototype Development**:
   - Create simplified character, obstacles, and environment
   - Implement core gameplay loop
   - Build basic UI elements
   - Test performance on target devices

4. **Asset Pipeline**:
   - Establish workflow for creating and integrating assets
   - Implement shader framework for underwater effects
   - Create initial set of game assets for testing

## Key Insights & Learnings

Based on the example implementations we've analyzed:

1. **Three.js Optimization Techniques**:
   - Object pooling is critical for performance with many game entities
   - Instanced meshes significantly improve performance for repeated elements
   - Level of detail (LOD) management helps maintain framerate
   - Shader complexity must be carefully balanced for mobile performance

2. **Animation Approaches**:
   - Vertex shader-based animations perform well for simple deformations
   - State-based animation systems provide clear structure
   - Blending between animations requires careful implementation
   - Physics-based secondary animations add significant visual appeal

3. **Game Design Insights**:
   - Clear visual feedback is essential for player responsiveness
   - Progressive difficulty maintains engagement
   - Variety in obstacles and environments prevents monotony
   - Power-ups add strategic depth to otherwise simple mechanics