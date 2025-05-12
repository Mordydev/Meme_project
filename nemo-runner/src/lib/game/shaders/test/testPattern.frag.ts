// src/lib/game/shaders/test/testPattern.frag.ts
export const fragmentShaderSource = `
  #include <common> // Three.js built-in chunks (optional here, but good practice)
  #include <noise2D> // Our custom chunk

  uniform vec3 uBaseColor;
  uniform float uTime; // From globalUniforms
  varying vec2 vUv;

  void main() {
    float noise = valueNoise2D(vUv * 5.0 + uTime * 0.5); // Use noise2D and uTime
    vec3 color = uBaseColor * (0.5 + 0.5 * noise);
    gl_FragColor = vec4(color, 1.0);
  }
`;