// src/lib/game/shaders/obstacles/jellyfish.frag.glsl
uniform vec3 uBellColor; // Base color for jellyfish bell
uniform float uOpacity; // Overall opacity
uniform float uTime; // For animated effects
uniform float uGlowIntensity; // Controls the intensity of the inner glow

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;
varying float vDistToCenter; // Used for patterns on the bell

#include <common>
#include <bsdfs>
#include <lights_pars_begin>
#include <normalmap_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <logdepthbuf_pars_fragment>

// Function to create a soft circular pattern for the bell
float bellPattern(vec2 uv, float size, float softness) {
    float dist = length(uv - vec2(0.5));
    return 1.0 - smoothstep(size - softness, size, dist);
}

void main() {
    // Base color - translucent blue
    vec3 baseColor = uBellColor;
    
    // Calculate view angle for fresnel effect
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.0);
    
    // Inner glow pulsing effect
    float pulseSpeed = 1.5;  // Speed of pulse
    float pulseAmount = 0.2; // Amount of pulse variation
    float pulse = sin(uTime * pulseSpeed) * pulseAmount + 1.0 - pulseAmount;
    
    // Enhance glow at center of bell
    float centerGlow = smoothstep(0.8, 0.0, vDistToCenter) * pulse * uGlowIntensity;
    
    // Create subtle vein-like pattern
    float veinPattern = sin(vUv.x * 20.0) * sin(vUv.y * 20.0 + uTime * 0.5) * 0.5 + 0.5;
    veinPattern *= smoothstep(0.8, 0.0, vDistToCenter); // Only in center
    
    // Apply patterns to color
    vec3 finalColor = baseColor;
    
    // Add glow and fresnel effects
    finalColor = mix(finalColor, finalColor * 1.5, centerGlow); // Inner glow
    finalColor = mix(finalColor, vec3(0.8, 0.9, 1.0), fresnel * 0.6); // Edge highlight
    
    // Apply vein pattern
    finalColor = mix(finalColor, finalColor * 1.2, veinPattern * 0.3);
    
    // Calculate final opacity with edge fade
    float edgeFade = smoothstep(1.0, 0.7, vDistToCenter); // Fade at edges
    float finalOpacity = uOpacity * edgeFade * (0.6 + fresnel * 0.4); // More transparent in center
    
    // Apply lighting calculations
    #include <logdepthbuf_fragment>
    #include <normal_fragment_begin>
    
    // Physical material properties for light interaction
    float roughness = 0.2;
    float metalness = 0.0;
    float specularStrength = 0.7 + fresnel * 0.3; // More specular at edges
    
    #include <roughnessmap_fragment>
    #include <metalnessmap_fragment>
    #include <lights_physical_fragment>
    #include <lights_fragment_begin>
    #include <lights_fragment_maps>
    #include <lights_fragment_end>
    
    // Add emissive contribution from glow
    vec3 totalEmissive = centerGlow * baseColor * 0.5;
    
    // Final color calculation
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
                        reflectedLight.directSpecular * specularStrength + 
                        reflectedLight.indirectSpecular + totalEmissive;
    
    gl_FragColor = vec4(outgoingLight, finalOpacity);
    
    // Apply transmission effect for translucency
    #include <transmission_fragment>
}