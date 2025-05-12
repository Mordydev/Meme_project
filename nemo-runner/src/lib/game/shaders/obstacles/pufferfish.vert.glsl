// src/lib/game/shaders/obstacles/pufferfish.vert.glsl
uniform float uInflation; // 0.0 (deflated) to 1.0 (inflated)
uniform float uTime; // For spike animation

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;

#include <common>
#include <logdepthbuf_pars_vertex>
#include <normal_pars_vertex>
#include <shadowmap_pars_vertex>

// Function to create spiky appearance
vec3 createSpikes(vec3 position, vec3 normal, float inflation) {
    // Calculate spike height based on inflation
    float spikeHeight = inflation * 0.2; // Maximum spike height
    
    // Add some variation to the spikes
    float variation = sin(position.x * 10.0 + position.y * 8.0 + position.z * 12.0) * 0.5 + 0.5;
    
    // Animate spikes slightly
    float animationFactor = sin(uTime * 2.0 + variation * 5.0) * 0.2 + 0.8;
    
    // Apply the spikes in the normal direction
    return position + normal * spikeHeight * variation * animationFactor;
}

void main() {
    vUv = uv;
    
    // Get the base position
    vec3 pos = position;
    
    // Apply inflation by morphing toward inflated state (simple sphere scaling)
    float baseScale = 1.0 + uInflation * 0.8; // Scale up to 1.8x when fully inflated
    pos *= baseScale;
    
    // If inflating or inflated, add spikes
    if (uInflation > 0.0) {
        pos = createSpikes(pos, normal, uInflation);
    }
    
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