export const underwaterPPFragmentShader = `
  uniform sampler2D tDiffuse; // Texture from previous pass (rendered scene)
  uniform vec2 uResolution;   // Screen resolution (width, height)
  uniform float uTime;        // Global time for animation

  // Vignette Uniforms
  uniform bool uVignetteEnabled;
  uniform float uVignetteIntensity; // 0.0 to 1.0+
  uniform float uVignetteSmoothness; // 0.0 to 1.0

  // Color Grading Uniforms
  uniform bool uColorGradingEnabled;
  uniform float uColorGradeIntensity; // 0.0 to 1.0
  uniform vec3 uColorGradeTargetColor; // Target color to shift towards

  // Distortion Uniforms
  uniform bool uDistortionEnabled;
  uniform float uDistortionIntensity; // Small value, e.g., 0.005
  uniform float uDistortionSpeed;

  varying vec2 vUv;

  // Basic noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep interpolation
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 currentUv = vUv;

    // 1. Distortion Effect (Subtle water surface simulation)
    if (uDistortionEnabled) {
      // Use time-varying noise to slightly offset texture coordinates
      float noiseVal1 = noise(vUv * 5.0 + uTime * uDistortionSpeed);
      float noiseVal2 = noise(vUv * 6.0 - uTime * uDistortionSpeed * 0.8 + 0.5); // Different scale/speed
      vec2 offset = vec2(noiseVal1 - 0.5, noiseVal2 - 0.5) * uDistortionIntensity;
      currentUv += offset;
      // Clamp UVs to avoid edge artifacts if distortion is strong
      currentUv = clamp(currentUv, 0.0, 1.0);
    }

    vec4 originalColor = texture2D(tDiffuse, currentUv);

    // 2. Color Grading
    if (uColorGradingEnabled) {
      // Simple linear interpolation towards target color
      originalColor.rgb = mix(originalColor.rgb, uColorGradeTargetColor, uColorGradeIntensity);
    }

    // 3. Vignette Effect
    if (uVignetteEnabled) {
      vec2 uvCenter = vUv - 0.5; // Center coordinates
      float dist = length(uvCenter);
      float vignette = smoothstep(0.5, 0.5 - uVignetteSmoothness * 0.5, dist); // Inner radius ~0.5
      vignette = pow(vignette, uVignetteIntensity * 2.0 + 1.0); // Intensity control
      originalColor.rgb *= vignette;
    }

    gl_FragColor = originalColor;
  }
`;