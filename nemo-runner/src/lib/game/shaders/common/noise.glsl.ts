// src/lib/game/shaders/common/noise.glsl.ts

// Basic 2D random function
export const random2D = `
float random2D(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
`;

// Basic 2D noise function (value noise) - requires random2D to be defined
export const noise2D = `
// Value noise using the 2D random function defined elsewhere
float noise2D(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random2D(i);
    float b = random2D(i + vec2(1.0, 0.0));
    float c = random2D(i + vec2(0.0, 1.0));
    float d = random2D(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
}
`;

// Combine all exports from this file for easier import elsewhere if needed
const NoiseGLSL = {
  random2D,
  noise2D,
};
export default NoiseGLSL;