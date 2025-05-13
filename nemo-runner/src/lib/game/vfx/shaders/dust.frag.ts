export const dustFragmentShader = `
  varying vec3 vColor;  // Expecting greyish/brownish color from attribute
  varying float vAlpha;

  uniform vec3 uBaseColor;   // Likely a near-white or grey tint
  uniform float uOpacity;    // Global opacity multiplier

  void main() {
    vec2 uv = gl_PointCoord;
    float dist = length(uv - vec2(0.5));

    // Simple soft dot for dust motes
    float mask = 1.0 - smoothstep(0.3, 0.5, dist); // Soft falloff

    if (mask < 0.01) discard;

    vec3 finalColor = vColor * uBaseColor;

    gl_FragColor = vec4(finalColor, mask * vAlpha * uOpacity);
  }
`;