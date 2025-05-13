export const particleVertexShader = `
  attribute float aScale;       // Scale per particle
  attribute vec3 aColor;        // Color per particle (can be multiplied by uniform color)
  attribute float aAlpha;       // Alpha per particle
  attribute float aRotation;    // Rotation per particle (optional)

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRotation;      // Pass rotation to fragment if needed
  varying vec2 vUv;             // Standard UV

  uniform float uBaseSize;      // Global size multiplier from config
  uniform float uPixelRatio;    // For consistent sizing across devices
  uniform float uTime;          // For potential vertex animation

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vRotation = aRotation;
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Calculate point size based on perspective, base size, particle scale, and pixel ratio
    gl_PointSize = uBaseSize * aScale * (100.0 / -mvPosition.z) * uPixelRatio;

    gl_Position = projectionMatrix * mvPosition;
  }
`;