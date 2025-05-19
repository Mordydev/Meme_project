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
