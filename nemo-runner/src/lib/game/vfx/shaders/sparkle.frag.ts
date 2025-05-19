export const fragmentShaderSource = `
  varying vec3 vColor;
  varying float vAlpha;
  // varying float vRotation; // Can be used if you have a non-circular sprite

  uniform sampler2D uTexture; // Optional sparkle texture
  uniform bool uUseTexture;   // To toggle texture usage

  void main() {
    vec2 uv = gl_PointCoord;
    float dist = length(uv - vec2(0.5));

    // Procedural sparkle: sharp center, quick falloff
    float intensity = 1.0 - smoothstep(0.0, 0.4, dist); // Sharp core
    intensity *= intensity; // Sharpen further
    float outerGlow = 1.0 - smoothstep(0.3, 0.5, dist); // Softer outer glow

    float mask = intensity * 0.7 + outerGlow * 0.3;

    if (uUseTexture) {
        // vec2 rotatedUv = rotateUV(uv, vRotation); // Implement rotateUV if needed
        mask *= texture2D(uTexture, uv).a;
    }

    if (mask * vAlpha < 0.01) discard;

    gl_FragColor = vec4(vColor, mask * vAlpha);
  }
`;

export const sparkleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  uniform vec3 uBaseColor;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv) * 2.0;
    float spike = max(1.0 - abs(uv.x * 2.0), 1.0 - abs(uv.y * 2.0));
    float mask = max(1.0 - dist, spike);
    if (mask < 0.01) discard;
    vec3 color = vColor * uBaseColor;
    gl_FragColor = vec4(color, mask * vAlpha);
  }
`;