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
