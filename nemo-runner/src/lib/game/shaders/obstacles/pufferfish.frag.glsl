// src/lib/game/shaders/obstacles/pufferfish.frag.glsl
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
uniform float shininess;
uniform vec3 specular;
uniform float uInflation; // 0.0 (deflated) to 1.0 (inflated)
uniform float uTime; // For animated elements

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;

// Function to create procedural spots pattern
float spots(vec2 uv, float scale, float threshold) {
    float nx = sin(uv.x * scale) * sin(uv.y * scale * 0.5);
    float ny = sin(uv.y * scale * 1.5) * sin(uv.x * scale * 0.7);
    float nz = sin((uv.x + uv.y) * scale * 0.5);
    
    float noise = nx * ny * nz;
    return smoothstep(threshold - 0.1, threshold + 0.1, noise);
}

#include <common>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <logdepthbuf_pars_fragment>

void main() {
    // Base color - mustard yellow/orange for pufferfish
    vec3 baseColor = vec3(0.925, 0.639, 0.062); // #EC9F0F
    
    // Apply spots pattern that intensifies with inflation
    float spotIntensity = mix(0.3, 0.8, uInflation); // More visible when inflated
    float spotPattern = spots(vUv, 30.0, spotIntensity);
    
    // Darker spots on top of base color
    vec3 spotColor = vec3(0.733, 0.427, 0.016); // Darker orange-brown
    vec3 finalColor = mix(baseColor, spotColor, spotPattern * 0.6);
    
    // Enhanced coloration when inflated - more intense/saturated
    finalColor = mix(finalColor, finalColor * 1.2, uInflation * 0.5);
    
    // Add a pulsing effect when inflating
    float pulseEffect = 0.0;
    if (uInflation > 0.0 && uInflation < 1.0) {
        pulseEffect = sin(uTime * 5.0) * 0.1 * smoothstep(0.0, 0.3, uInflation) * smoothstep(1.0, 0.7, uInflation);
    }
    
    vec3 totalEmissive = emissive + finalColor * pulseEffect;
    
    // Include three.js lighting calculations
    #include <logdepthbuf_fragment>
    #include <normal_fragment_begin>
    #include <lights_phong_fragment>
    #include <lights_fragment_begin>
    #include <lights_fragment_maps>
    #include <lights_fragment_end>
    
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
                        reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissive;
    
    gl_FragColor = vec4(outgoingLight, opacity);
}