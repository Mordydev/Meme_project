/**
 * Shader Library for reusable GLSL functions
 * 
 * This library provides common shader functions that can be imported and used
 * across different shaders in the game. This reduces code duplication and
 * ensures consistency in visual effects.
 */

// Main shader chunk manager that handles including functions
export class ShaderLibrary {
  private static chunks: Map<string, string> = new Map();

  /**
   * Register a shader function chunk by name
   * @param name Identifier for the chunk
   * @param code GLSL code for the chunk
   */
  static registerChunk(name: string, code: string): void {
    this.chunks.set(name, code);
  }

  /**
   * Get a shader chunk by name
   * @param name Identifier for the chunk
   * @returns The shader code or empty string if not found
   */
  static getChunk(name: string): string {
    return this.chunks.get(name) || '';
  }

  /**
   * Process a shader string and include referenced chunks
   * @param shaderSource Shader source code with #include directives
   * @returns Processed shader with included chunks
   */
  static processShader(shaderSource: string): string {
    // Process #include directives
    let processedShader = shaderSource;
    const includeRegex = /#include\s+<([^>]+)>/g;
    let match;
    
    while ((match = includeRegex.exec(shaderSource)) !== null) {
      const chunkName = match[1].trim();
      const chunkCode = this.getChunk(chunkName);
      
      if (chunkCode) {
        processedShader = processedShader.replace(match[0], chunkCode);
      } else {
        console.warn(`Shader chunk not found: ${chunkName}`);
        processedShader = processedShader.replace(match[0], '// Missing chunk: ' + chunkName);
      }
    }
    
    return processedShader;
  }
}

// Initialize common shader functions

// Fresnel effect calculation
ShaderLibrary.registerChunk('fresnel', `
// Calculates Fresnel effect (rim lighting)
// normal: Surface normal
// viewDir: Direction from vertex to camera
// power: Controls falloff sharpness (higher = sharper edge)
// Returns: Fresnel factor (0-1)
float calculateFresnel(vec3 normal, vec3 viewDir, float power) {
  float fresnel = 1.0 - max(0.0, dot(normalize(normal), normalize(viewDir)));
  return pow(fresnel, power);
}
`);

// Noise functions
ShaderLibrary.registerChunk('noise', `
// Simple hash function
float hash(vec2 p) { 
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); 
}

// Basic noise function (2D)
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f); // Hermite curve smoothstep
  float a = hash(i + vec2(0.0, 0.0)); 
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)); 
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion (FBM) - Layered noise for more detail
float fbm(vec2 p, int octaves, float persistence) {
  float total = 0.0;
  float frequency = 1.0;
  float amplitude = 1.0;
  float maxValue = 0.0; // Used for normalizing result to 0.0 - 1.0
  
  for(int i = 0; i < octaves; i++) {
    total += noise(p * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2.0;
  }
  
  return total / maxValue;
}
`);

// Lighting models
ShaderLibrary.registerChunk('lighting', `
// Basic Phong/Blinn-Phong lighting calculation
// normal: Surface normal
// viewDir: Direction from vertex to camera
// lightDir: Direction to light source
// lightColor: Color of the light
// diffuseMaterial: Base material color
// specularPower: Shininess (higher = smaller, sharper highlight)
// specularIntensity: Intensity of specular highlight
// Returns: Final lit color
vec3 calculateLighting(
  vec3 normal, 
  vec3 viewDir, 
  vec3 lightDir, 
  vec3 lightColor,
  vec3 diffuseMaterial,
  float specularPower,
  float specularIntensity
) {
  // Normalize inputs
  normal = normalize(normal);
  viewDir = normalize(viewDir);
  lightDir = normalize(lightDir);
  
  // Diffuse component (Lambert)
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * lightColor * diffuseMaterial;
  
  // Specular component (Blinn-Phong)
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfwayDir), 0.0), specularPower);
  vec3 specular = spec * lightColor * specularIntensity;
  
  return diffuse + specular;
}
`);

// Animation utilities
ShaderLibrary.registerChunk('animation', `
// Oscillation function for smooth animation
float oscillate(float time, float frequency, float amplitude, float offset) {
  return amplitude * sin(time * frequency + offset);
}

// Pulsate function for size/opacity effects
float pulsate(float time, float frequency, float min, float max) {
  return mix(min, max, (sin(time * frequency) + 1.0) * 0.5);
}

// Wave distortion for vertex displacement
vec3 waveDisplace(vec3 position, vec3 normal, float time, float frequency, float amplitude) {
  float wave = sin(position.x * frequency + time) * 
               sin(position.y * frequency + time) * 
               sin(position.z * frequency + time);
  return position + normal * wave * amplitude;
}
`);

// Water effects
ShaderLibrary.registerChunk('water', `
// Caustics calculation
float caustics(vec2 uv, float time, float scale) {
  vec2 p = uv * scale;
  float speed = time * 0.2;
  
  // Combine several moving noise layers
  float noise1 = noise(p + vec2(speed, speed * 0.8));
  float noise2 = noise(p * 1.5 + vec2(-speed * 0.8, speed * 0.3));
  float noise3 = noise(p * 2.1 + vec2(speed * 0.5, -speed * 0.9));
  
  // Create sharper caustic effect by taking the product of noise layers
  float caustic = smoothstep(0.3, 0.7, noise1 * noise2 * noise3 * 2.0);
  return caustic;
}

// Water surface normal calculation for refraction/reflection
vec3 waterNormal(vec2 uv, float time, float scale) {
  vec2 p = uv * scale;
  float speed = time * 0.1;
  
  // Calculate gradient of noise field for normal
  float eps = 0.01;
  float centerHeight = fbm(p, 4, 0.5);
  float rightHeight = fbm(p + vec2(eps, 0.0), 4, 0.5);
  float topHeight = fbm(p + vec2(0.0, eps), 4, 0.5);
  
  // Create normal from gradient
  vec3 normal = normalize(vec3(
    centerHeight - rightHeight,
    centerHeight - topHeight,
    eps
  ));
  
  return normal;
}
`);

// Color utilities
ShaderLibrary.registerChunk('color', `
// HSL to RGB conversion
vec3 hslToRgb(float h, float s, float l) {
  float r, g, b;
  
  if (s == 0.0) {
    r = g = b = l; // Achromatic
  } else {
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    r = hue2rgb(p, q, h + 1.0/3.0);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1.0/3.0);
  }
  
  return vec3(r, g, b);
}

// Helper for HSL conversion
float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

// Gradient between two colors
vec3 colorGradient(vec3 colorA, vec3 colorB, float t) {
  return mix(colorA, colorB, t);
}
`);

// Smoothstep and transition utilities
ShaderLibrary.registerChunk('transition', `
// Custom smoothstep with adjustable smoothness
float smootherstep(float edge0, float edge1, float x, float smoothness) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  // Adjust power based on smoothness (higher = smoother transition)
  float power = max(2.0, 2.0 / smoothness);
  return pow(t, power) * (1.0 - pow(1.0 - t, power));
}

// Create a smooth mask for transitions between areas
float transitionMask(float value, float start, float end, float smoothness) {
  return smootherstep(start, end, value, smoothness);
}
`);

// Post-processing effects
ShaderLibrary.registerChunk('postprocessing', `
// Vignette effect
float vignette(vec2 uv, float intensity, float smoothness) {
  float dist = length(uv - 0.5) * 2.0;
  return 1.0 - smootherstep(1.0 - intensity, 1.0, dist, smoothness);
}

// Chromatic aberration
vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
  float r = texture2D(tex, uv + vec2(amount, 0.0)).r;
  float g = texture2D(tex, uv).g;
  float b = texture2D(tex, uv - vec2(amount, 0.0)).b;
  return vec3(r, g, b);
}
`);

// Export a helper function to assemble shaders with library functions
export function createShaderWithLibrary(vertexShader: string, fragmentShader: string): { 
  vertexShader: string, 
  fragmentShader: string 
} {
  return {
    vertexShader: ShaderLibrary.processShader(vertexShader),
    fragmentShader: ShaderLibrary.processShader(fragmentShader)
  };
}