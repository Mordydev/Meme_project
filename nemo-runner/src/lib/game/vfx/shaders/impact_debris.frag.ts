export const fragmentShaderSource = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRotation;

  uniform vec3 uBaseColor;
  uniform sampler2D uTexture;
  uniform bool uUseTexture;

  void main() {
    vec2 uv = gl_PointCoord;
    
    // Create angular debris shape
    vec2 centered = uv - vec2(0.5);
    float angle = atan(centered.y, centered.x) + vRotation;
    float dist = length(centered);
    
    // Create jagged edges using sine waves
    float edges = 4.0 + sin(angle * 8.0) * 0.2;
    float shape = 1.0 - smoothstep(0.3, 0.5, dist * edges);
    
    // Add some noise to the edges
    shape *= 1.0 - smoothstep(0.4, 0.5, dist);
    
    if (shape * vAlpha < 0.01) discard;
    
    vec3 color = vColor * uBaseColor;
    
    if (uUseTexture) {
      color *= texture2D(uTexture, uv).rgb;
    }
    
    gl_FragColor = vec4(color, shape * vAlpha);
  }
`;

// Alternative version for impact debris
export const impactDebrisFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  uniform vec3 uBaseColor;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord;
    vec2 centered = uv - vec2(0.5);
    float dist = length(centered);
    
    // Create rough rock-like shape
    float angle = atan(centered.y, centered.x);
    float roughness = sin(angle * 5.0) * 0.1 + cos(angle * 7.0) * 0.05;
    float shape = 1.0 - smoothstep(0.35 + roughness, 0.5, dist);
    
    if (shape * vAlpha < 0.01) discard;
    
    vec3 color = vColor * uBaseColor;
    
    // Add slight color variation based on position
    color *= 0.8 + 0.2 * sin(angle * 3.0 + uTime);
    
    gl_FragColor = vec4(color, shape * vAlpha);
  }
`;