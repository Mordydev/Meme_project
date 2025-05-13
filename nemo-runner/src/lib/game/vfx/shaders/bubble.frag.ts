export const bubbleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRotation;

  uniform vec3 uBaseColor;   // Tint color from config
  uniform sampler2D uTexture; // Optional bubble texture
  uniform bool uUseTexture;

  void main() {
    vec2 uv = gl_PointCoord; // UV coords within the point sprite (0,0 to 1,1)
    float dist = length(uv - vec2(0.5)); // Distance from center

    // Simple procedural bubble: bright center, soft edge, rim highlight
    float intensity = smoothstep(0.5, 0.4, dist); // Soft edge falloff
    float rim = smoothstep(0.45, 0.5, dist) * 0.5; // Subtle rim highlight
    float core = smoothstep(0.2, 0.0, dist) * 0.3; // Bright core

    float mask = intensity + rim + core;
    mask = clamp(mask, 0.0, 1.0);

    // Discard transparent pixels for better performance
    if (mask < 0.01) discard;

    vec3 finalColor = vColor * uBaseColor; // Mix particle color with base color

    if (uUseTexture) {
        // Sample texture if provided
        vec4 texColor = texture2D(uTexture, uv);
        // Combine texture with procedural mask/color
        finalColor *= texColor.rgb;
        mask *= texColor.a; // Use texture alpha
    }

    gl_FragColor = vec4(finalColor, mask * vAlpha);
  }
`;