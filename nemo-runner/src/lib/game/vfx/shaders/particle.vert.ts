export const particleVertexShader = `
  attribute float aScale;       // Scale per particle
  attribute vec3 aColor;        // Color per particle (can be multiplied by uniform color)
  attribute float aAlpha;       // Alpha per particle
  attribute float aRotation;    // Rotation per particle (optional)

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRotation;
  varying vec2 vUv;             // Standard UV

  uniform float uBaseSize;      // Global size multiplier from config
  uniform float uPixelRatio;    // For consistent sizing across devices
  uniform float uTime;          // For potential vertex animation

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vRotation = aRotation; // Pass rotation to fragment shader if needed for textured sprites
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Perspective-correct point size
    gl_PointSize = uBaseSize * aScale * (100.0 / -mvPosition.z) * uPixelRatio;
    // Ensure gl_PointSize is not NaN or Inf
    if (mvPosition.z == 0.0) gl_PointSize = 0.0; // Avoid division by zero if camera is inside point
    if (gl_PointSize < 0.0) gl_PointSize = 0.0; // Ensure positive size

    gl_Position = projectionMatrix * mvPosition;
  }
`;