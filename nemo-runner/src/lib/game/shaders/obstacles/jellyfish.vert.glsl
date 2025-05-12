// src/lib/game/shaders/obstacles/jellyfish.vert.glsl
uniform float uTime; // For animation
uniform float uPulseAmplitude; // Strength of pulse effect
uniform float uPulseSpeed; // Speed of pulsing

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;
varying float vDistToCenter; // For bell patterns

#include <common>
#include <logdepthbuf_pars_vertex>
#include <normal_pars_vertex>
#include <shadowmap_pars_vertex>

// Function to create bell pulsing motion
vec3 applyBellPulse(vec3 position, vec3 normal, float time, float amplitude, float speed) {
    // Calculate radial distance from center of the bell (assuming bell is centered at origin)
    float radialDist = length(position.xz);
    
    // Pulse is stronger at the edges
    float pulseFactor = smoothstep(0.0, 1.0, radialDist / 0.4) * amplitude;
    
    // Create a wave that travels from the center to the edge
    float wave = sin(time * speed - radialDist * 4.0) * 0.5 + 0.5;
    
    // Apply pulse movement
    return position + normal * wave * pulseFactor;
}

void main() {
    vUv = uv;
    
    // Calculate the distance from center in UV space
    vDistToCenter = length(uv - vec2(0.5, 0.5)) * 2.0; // Normalized 0-1 distance
    
    // Get the base position
    vec3 pos = position;
    
    // Apply bell pulsing animation
    pos = applyBellPulse(pos, normal, uTime, uPulseAmplitude, uPulseSpeed);
    
    // Standard vertex shader logic
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <normal_vertex>
    
    // Calculate worldPosition and viewPosition
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    
    // Save view position for fragment shader
    vViewPosition = -mvPosition.xyz;
    
    // Output final position
    gl_Position = projectionMatrix * mvPosition;
    
    #include <logdepthbuf_vertex>
    #include <shadowmap_vertex>
}