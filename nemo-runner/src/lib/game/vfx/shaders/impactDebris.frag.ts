export const impactDebrisFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  uniform vec3 uBaseColor;

  void main() {
    vec2 uv = gl_PointCoord;
    float dist = length(uv - vec2(0.5));
    float mask = 1.0 - smoothstep(0.2, 0.5, dist);
    if (mask < 0.01) discard;
    vec3 color = vColor * uBaseColor;
    gl_FragColor = vec4(color, mask * vAlpha);
  }
`;
