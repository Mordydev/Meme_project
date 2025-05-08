**AI Prompt for Initial Game Development: Underwater Endless Runner ($NEMO)**

**Role:** You are an expert game developer AI specializing in Three.js and procedural generation. Your task is to generate the complete source code for the initial, playable version of a 3-lane endless runner game.

**Goal:** Create a functional prototype of a 3-lane endless runner game set in a vibrant, Pixar-style underwater environment, reminiscent of "Finding Nemo". The immediate goal is to have a playable experience focusing on core mechanics and procedural asset generation, without needing external files or backend systems.

**Core Requirements:**

1.  **Game Type:** 3-Lane Endless Runner (similar to Subway Surfers/Temple Run mechanics).
2.  **Engine:** Three.js (use a recent stable version).
3.  **Rendering:** 2.5D perspective (3D visuals on a fixed path with lane switching).
4.  **Procedural Assets:** **Crucially, ALL visual assets MUST be generated procedurally using Three.js code (geometries, shaders, materials). DO NOT load any external models, textures, images, or asset files.** Use the provided examples as strong inspiration and guidance.
5.  **Output:** A single, self-contained HTML file (`index.html`) including all necessary HTML structure, CSS (minimal, mainly for canvas styling and score display), and JavaScript/Three.js code. The game should run directly when this file is opened in a modern web browser.

**Visual Style & Procedural Asset Generation Guidelines:**

*   **Aesthetic:** Achieve a Pixar-like underwater style (Finding Nemo inspired). Focus on:
    *   **Vibrant Colors:** Use bright blues, coral oranges, yellows, greens, and other tropical colors (refer to the provided style guide color palette).
    *   **Soft, Rounded Shapes:** Emphasize smooth, appealing forms for the character, obstacles, and collectibles. Avoid sharp, photorealistic edges.
    *   **Lighting:** Simulate underwater lighting effects using shaders. Include effects like:
        *   **Caustics:** Fake caustics on the seafloor (use shader techniques, possibly with noise/scrolling textures generated procedurally or simulated via shader math).
        *   **Light Rays/God Rays:** Simulate light rays filtering down from the surface (use volumetric-like shader effects or textured planes).
        *   **Depth Gradient:** Implement subtle fog or color shifts to simulate water depth.
    *   **Materials:** Heavily utilize custom Three.js `ShaderMaterial` with vertex and fragment shaders. Avoid standard materials like `MeshStandardMaterial` where possible for unique looks, unless used for basic elements like eyes. Employ techniques like:
        *   **Noise Functions (Simplex/FBM):** Use noise (implement a simple hash/noise/fbm function within the shaders or use a small JS library included in the script if absolutely necessary) to add texture and variation to surfaces (character skin, rocks, seafloor) without external textures.
        *   **Fresnel Effect:** Use for rim lighting on characters and collectibles to give them a soft glow and separate them from the background.
        *   **Color Blending:** Use smooth gradients and color mixing in shaders for the Pixar look.
*   **Player Character (Procedural "Bubbles" Clownfish):**
    *   Create a 3D clownfish model procedurally using Three.js geometries (e.g., deformed spheres, extruded shapes).
    *   Refer *closely* to the provided `Refined Procedural Bubbles Character v2` example code for geometry construction and shader implementation (body stripes, fin gradients, eye setup).
    *   Implement basic swimming animation (tail sway, fin flutter) via vertex displacement or object rotation within the game loop.
*   **Obstacles (Procedural):**
    *   Generate various static and dynamic obstacles using code.
    *   **Coral Formations:** Create diverse shapes using combinations of deformed spheres, cylinders, or extruded shapes. Use shaders for vibrant colors and textures (refer to `Procedural Static Obstacles` example).
    *   **Rocks:** Generate varied rock shapes using deformed Icosahedrons or Dodecahedrons with noise displacement (refer to `Procedural Static Obstacles` example). Use a rock-like shader.
    *   **Opening/Closing Clams:** Implement clams that open and close periodically as hazards (refer to `Procedural Clam Obstacle` example for geometry and animation state).
    *   Obstacles should appear randomly in the lanes as the player progresses.
*   **Collectibles (Procedural):**
    *   Generate shimmering bubbles or similar simple collectibles (like pearls or gems).
    *   Refer to the `High Quality Collectible Bubbles` example for using InstancedMesh and shaders to create performant, good-looking bubbles with wobble/fresnel effects.
    *   Implement pickup logic (remove collectible on collision with player, increment score).
*   **Environment (Procedural):**
    *   **Seafloor:** Create a continuous, procedurally generated seafloor plane below the lanes with gentle undulations using noise displacement (refer to `High Quality Procedural Underwater Environment` example). Apply a sandy/rocky texture using shaders.
    *   **Background Elements:** Add simple procedural background elements like swaying seaweed strands (planes with vertex displacement), distant rock formations, or simple particle effects (bubbles rising) to enhance the underwater feel. Ensure these are performant.

**Gameplay Mechanics:**

1.  **Movement:**
    *   Character moves forward automatically along the Z-axis.
    *   Game speed gradually increases over time/distance.
2.  **Controls (Keyboard):**
    *   **Left Arrow:** Move character smoothly to the left lane.
    *   **Right Arrow:** Move character smoothly to the right lane.
    *   **Up Arrow:** Character performs a jump (moves up temporarily, follows a parabolic arc, lands back in lane). Refer to `Procedural Bubbles Character with Actions` example.
    *   **Down Arrow:** Character performs a dive (moves down temporarily, follows a curve, returns to lane level). Refer to `Procedural Bubbles Character with Actions` example.
    *   Ensure controls are responsive and feel fluid.
3.  **Collision Detection:**
    *   Implement simple bounding box or bounding sphere collision detection between the player character and obstacles.
    *   Implement collision detection between the player and collectibles.
4.  **Scoring:**
    *   Maintain a score variable.
    *   Increase score based on distance traveled.
    *   Increase score when a collectible is picked up.
    *   Display the current score using a simple HTML text overlay (e.g., a `<div>` positioned over the canvas).
5.  **Game Over:**
    *   When the player collides with an obstacle, the game should stop.
    *   Stop the game loop (or character movement/obstacle generation).
    *   Display "Game Over" and the final score (can be simple text overlay).
6.  **Endless Generation:**
    *   Continuously generate upcoming sections of the environment, obstacles, and collectibles ahead of the player.
    *   Remove sections, obstacles, and collectibles that are far behind the player to maintain performance. Use a simple pooling or reuse mechanism if feasible.

**Technical Specifications:**

*   **Framework:** None (Vanilla JavaScript and Three.js).
*   **Language:** JavaScript (ES6+).
*   **Styling:** Minimal CSS for the canvas and score display.
*   **File Structure:** Single `index.html` file.
*   **Performance:** Aim for reasonable performance. Implement basic optimizations:
    *   Use `InstancedMesh` for large numbers of identical objects (like collectibles).
    *   Keep geometry complexity reasonable.
    *   Optimize shaders (avoid unnecessary calculations).
    *   Dispose of unused Three.js objects properly when removing elements.

**Exclusions (Do NOT include):**

*   Backend functionality, databases (Drizzle, Neon), APIs.
*   User authentication (Clerk).
*   Complex UI elements (start menus, settings screens, leaderboards beyond the basic score display).
*   Loading of ANY external assets (no `.glb`, `.gltf`, `.png`, `.jpg`, etc.).
*   Advanced environment transitions (stick to one consistent theme for now).
*   Power-up *effects* (like shield visuals, speed boost particles from the examples) - focus only on the collectible pickup object itself for now.
*   Touch controls (implement keyboard controls first).

**Guidance & Best Practices:**

*   Structure the JavaScript code logically (e.g., setup, game objects, game loop, controls, collision).
*   Comment key sections of the code.
*   Ensure the game loop updates game logic and renders the scene.
*   Use `requestAnimationFrame` for the game loop.
*   Make the lane switching, jumping, and diving feel smooth and intuitive.

**Deliverable:** Provide the complete code within a single ```html ... ``` block, ready to be saved as an HTML file and run.