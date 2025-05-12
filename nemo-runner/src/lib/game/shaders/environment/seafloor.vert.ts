// src/lib/game/shaders/environment/seafloor.vert.ts
export const vertexShaderSource = `
// Seafloor vertex shader with caustic effect support
uniform float uTime;

// Standard THREE.js shader inputs
// attribute vec3 position;
// attribute vec2 uv;
// attribute vec3 normal;

// Output variables to pass to fragment shader
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  // Pass through UV coordinates for use in fragment shader
  vUv = uv;
  
  // Transform the normal and pass to fragment shader
  vNormal = normalize(normalMatrix * normal);
  
  // Store the position for use in the fragment shader
  vPosition = position;
  
  // Calculate world position for depth effects
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  // Standard vertex transform
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;