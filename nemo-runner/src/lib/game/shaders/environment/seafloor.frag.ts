// src/lib/game/shaders/environment/seafloor.frag.ts
export const fragmentShaderSource = `
// Seafloor fragment shader with caustic effects
uniform float uTime;
uniform vec2 uResolution;

// Caustic effect parameters
uniform vec3 uCausticColor;
uniform float uCausticIntensity;
uniform float uCausticScale;
uniform float uCausticSpeed;

// Receives values from vertex shader
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// --- Utility functions ---

// Saturate - clamp value between 0 and 1
float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

// --- Noise functions ---

// Random 2D hash function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Basic 2D noise
float noise2D(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
}

// --- Caustic effect functions ---

// Basic caustic computation
vec3 computeCaustics(vec2 uv, float time, float speed, float scale) {
    // Create scaled coordinates
    vec2 causticUv = uv * scale;
    
    // Create three moving layers at different speeds and scales
    vec2 pos1 = causticUv + vec2(time * speed * 0.5, time * speed * 0.4);
    vec2 pos2 = causticUv * 0.8 - vec2(time * speed * 0.6, time * speed * 0.3);
    vec2 pos3 = causticUv * 1.2 + vec2(time * speed * 0.3, -time * speed * 0.7);
    
    // Get noise values
    float n1 = noise2D(pos1);
    float n2 = noise2D(pos2);
    float n3 = noise2D(pos3);
    
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
    return color * saturate(caustic);
}

// Blends caustic effect with base color
vec3 blendWithCaustics(
  vec3 baseColor,
  vec3 causticColor,
  float causticIntensity,
  vec3 caustics,
  vec3 surfaceNormal
) {
  // Modulate caustic by surface angle to light (approximate)
  // Caustics are stronger when light hits the surface more directly
  float normalFactor = max(0.2, dot(surfaceNormal, vec3(0.0, 1.0, 0.0)));
  float causticStrength = caustics.r * causticIntensity * normalFactor;
  
  // Additive blending for light caustics
  return baseColor + (causticColor * causticStrength);
}

void main() {
  // Calculate base seafloor color with sandy texture
  // Use noise to create a natural sandy pattern
  vec2 sandUv = vUv * 15.0; // Fine sand detail
  float sandNoise = noise2D(sandUv);
  
  // Darker in deeper areas (use world position Y)
  float depthFactor = smoothstep(-2.0, 0.0, vWorldPosition.y);
  
  // Create color variations based on noise
  vec3 sandColor1 = vec3(0.76, 0.70, 0.50); // Lighter sand
  vec3 sandColor2 = vec3(0.64, 0.58, 0.46); // Darker sand
  vec3 baseColor = mix(sandColor2, sandColor1, sandNoise);
  
  // Add some depth variation based on Y position
  baseColor = mix(baseColor * 0.8, baseColor, depthFactor);
  
  // Calculate basic lighting with provided normal data
  vec3 normal = normalize(vNormal);
  float lightIntensity = 0.3 + 0.7 * max(0.0, dot(normal, vec3(0.0, 1.0, 0.0)));
  baseColor *= lightIntensity;
  
  // Calculate caustic effect
  vec3 caustics = computeCaustics(vUv, uTime, uCausticSpeed, uCausticScale);
  
  // Use our blend function to combine base color and caustics
  vec3 finalColor = blendWithCaustics(
    baseColor,
    uCausticColor,
    uCausticIntensity,
    caustics,
    normal
  );
  
  // Output the final color
  gl_FragColor = vec4(finalColor, 1.0);
}
`;