// src/lib/game/shaders/common/caustics.glsl.ts
// Contains functions to generate caustic light patterns for underwater scenes

/**
 * Caustic GLSL code for creating water caustic patterns
 */
export const getCausticColor = `
vec3 getCausticColor(vec3 worldPosition, float time, float scale, float intensity, vec3 causticBaseColor) {
    vec2 uv1 = worldPosition.xz / scale + time * 0.05;
    vec2 uv2 = worldPosition.xz / (scale * 0.6) + time * 0.08;
    vec2 uv3 = worldPosition.xz / (scale * 0.3) + time * 0.12;

    float pattern1 = FBM(uv1, 3, 0.5, 2.0);
    float pattern2 = FBM(uv2, 2, 0.5, 2.0);
    float pattern3 = FBM(uv3, 2, 0.4, 2.5);

    float combinedPattern = pattern1 * pattern2 * pattern3;
    combinedPattern = pow(combinedPattern, 3.0);
    combinedPattern = smoothstep(0.1, 0.6, combinedPattern);

    vec2 distortUv = worldPosition.xz / (scale * 2.0) + time * 0.03;
    float distortion = noise2D(distortUv) * 0.3 - 0.15;
    combinedPattern *= (1.0 + distortion);

    combinedPattern = clamp(combinedPattern, 0.0, 1.0);

    return causticBaseColor * combinedPattern * intensity;
}
`;

export const causticPattern = `
float FBM(vec2 p, int octaves, float persistence, float lacunarity) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;
    for(int i = 0; i < octaves; i++) {
        total += noise2D(p * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
}

${getCausticColor}
`;

const CausticsGLSL = {
  // Simplified caustic effect calculation function
  causticEffect: `
// Basic utility functions inlined for self-contained shader chunk
float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

// Random function inlined
float random2D_caustic(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Noise function inlined
float noise2D_caustic(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random2D_caustic(i);
    float b = random2D_caustic(i + vec2(1.0, 0.0));
    float c = random2D_caustic(i + vec2(0.0, 1.0));
    float d = random2D_caustic(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
}

// Calculates a simplified caustic effect pattern
// uv: Texture coordinates (often scaled for desired pattern size)
// time: Elapsed time for animation
// speed: Animation speed multiplier
// Returns a caustic intensity value between 0.0 and 1.0
float causticEffect(vec2 uv, float time, float speed) {
  // Create moving coordinates for the caustic effect
  vec2 pos1 = uv * 0.7 + vec2(sin(time * speed * 0.3) * 0.1, cos(time * speed * 0.2) * 0.1);
  vec2 pos2 = uv * 1.3 + vec2(cos(time * speed * 0.6) * 0.2, sin(time * speed * 0.4) * 0.2);

  // Get noise values at different moving positions
  float n1 = noise2D_caustic(pos1 * 3.0);
  float n2 = noise2D_caustic(pos2 * 2.0);

  // Combine the noise layers for interesting patterns
  float caustic = (n1 * 0.6 + n2 * 0.4);

  // Shape the caustic pattern for more contrast
  caustic = pow(caustic, 2.5) * 1.5;

  // Saturate to ensure values are in the 0-1 range
  return saturate(caustic);
}
`,

  // Enhanced caustic calculation for more complex patterns
  advancedCaustics: `
// Basic utility functions inlined for self-contained shader chunk
float saturate_adv(float x) {
    return clamp(x, 0.0, 1.0);
}

// Random function inlined
float random2D_adv(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Noise function inlined
float noise2D_adv(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random2D_adv(i);
    float b = random2D_adv(i + vec2(1.0, 0.0));
    float c = random2D_adv(i + vec2(0.0, 1.0));
    float d = random2D_adv(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
}

// Calculates a more complex, layered caustic effect
// uv: Texture coordinates
// time: Elapsed time for animation
// speed: Animation speed multiplier
// scale: Pattern scale factor
// Returns a caustic color and intensity as vec3
vec3 advancedCaustics(vec2 uv, float time, float speed, float scale) {
  // Create scaled coordinates
  vec2 causticUv = uv * scale;

  // Create three moving layers at different speeds and scales
  vec2 pos1 = causticUv + vec2(time * speed * 0.5, time * speed * 0.4);
  vec2 pos2 = causticUv * 0.8 - vec2(time * speed * 0.6, time * speed * 0.3);
  vec2 pos3 = causticUv * 1.2 + vec2(time * speed * 0.3, -time * speed * 0.7);

  // Get noise values
  float n1 = noise2D_adv(pos1);
  float n2 = noise2D_adv(pos2);
  float n3 = noise2D_adv(pos3);

  // Combine with different weights
  float caustic = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

  // Apply contrast curve and boost
  caustic = pow(caustic, 3.0) * 2.0;

  // Create a color gradient based on noise (subtle blue tint variation)
  vec3 color = mix(
    vec3(0.7, 0.9, 1.0),   // Light blue
    vec3(0.9, 0.95, 1.0),  // Almost white
    n2
  );

  // Apply intensity and return
  return color * saturate_adv(caustic);
}
`,

  // Function to blend caustics with base material
  blendCaustics: `
// Basic saturate function inlined
float saturate_blend(float x) {
    return clamp(x, 0.0, 1.0);
}

// Blends caustic effect with a base material color
// baseColor: The original material color
// causticColor: The color/tint of the caustics
// causticIntensity: How strong the effect should be
// causticValue: The calculated caustic pattern value (0-1)
// surfaceNormal: The surface normal (for light angle calculations)
// Returns the blended color
vec3 blendCaustics(
  vec3 baseColor,
  vec3 causticColor,
  float causticIntensity,
  float causticValue,
  vec3 surfaceNormal
) {
  // Modulate caustic by surface angle to light (approximate)
  // Caustics are stronger when light hits the surface more directly
  float normalFactor = max(0.2, dot(surfaceNormal, vec3(0.0, 1.0, 0.0)));
  float causticStrength = causticValue * causticIntensity * normalFactor;

  // Safety clamp
  causticStrength = saturate_blend(causticStrength);

  // Blend modes - choose one:

  // 1. Additive blending (good for light caustics)
  return baseColor + (causticColor * causticStrength);

  // 2. Screen blending (alternative)
  // return baseColor + (causticColor * causticStrength) - (baseColor * causticColor * causticStrength);
}
`,

  causticPattern,
  getCausticColor,
};

export default CausticsGLSL;