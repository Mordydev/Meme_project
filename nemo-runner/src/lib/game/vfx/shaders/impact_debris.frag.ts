export const fragmentShaderSource = `
  varying vec3 vColor;
  varying float vAlpha;
  // varying float vRotation;

  // uniform sampler2D uTexture; // Could be a debris/grunge texture
  // uniform bool uUseTexture;

  void main() {
    vec2 uv = gl_PointCoord;
    float dist = length(uv - vec2(0.5));

    // Simple, slightly irregular dot for debris
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    float mask = 1.0 - smoothstep(0.4 - noise * 0.1, 0.5, dist); // Slightly irregular edge

    // if (uUseTexture) {
    //   mask *= texture2D(uTexture, uv).a;
    // }

    if (mask * vAlpha < 0.01) discard;

    gl_FragColor = vec4(vColor, mask * vAlpha);
  }
`;
