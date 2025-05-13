export const fragmentShaderSource = `
  // Define GLSL version compatibility (WebGL 1.0/2.0)
  #ifdef GLSL3
    out vec4 outColor;
    #define FRAG_COLOR outColor
  #else
    #define FRAG_COLOR gl_FragColor
  #endif

  #include <common>
  #include <packing>
  #include <lights_pars_begin> // For Three.js built-in lighting
  #include <fog_pars_fragment>
  #include <bsdfs> // For some advanced lighting functions if needed

  // Uniforms from ClownfishAsset material setup
  uniform vec3 uBaseColor;          // e.g., Orange
  uniform vec3 uStripeColor;        // e.g., White
  uniform vec3 uStripeEdgeColor;    // e.g., Black/Dark Grey
  uniform vec3 uFinAccentColor;     // e.g., Light Blue/Teal
  uniform vec3 uEyePupilColor;
  uniform vec3 uEyeIrisColor;
  uniform vec3 uEyeHighlightColor;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec2 vUv; // Assuming UVs are set up for eyes/fins if needed
  varying vec3 vWorldPosition;
  varying float vDepthForStripes; // Object-space Z for stripes

  // Basic lighting model (can be expanded)
  vec3 calculateLighting(vec3 normal, vec3 viewDir, vec3 surfaceColor, vec3 lightDir, vec3 lightColor, vec3 ambientColor) {
      // Diffuse
      float NdotL = saturate(dot(normal, lightDir));
      vec3 diffuse = surfaceColor * lightColor * NdotL;

      // Specular (Simple Blinn-Phong)
      vec3 halfwayDir = normalize(lightDir + viewDir);
      float spec = pow(saturate(dot(normal, halfwayDir)), 32.0); // Shininess
      vec3 specular = lightColor * spec * 0.3; // Specular intensity

      return ambientColor * surfaceColor + diffuse + specular;
  }
  
  // Simple function to create soft stripe edges
  float smoothStripe(float value, float start, float end, float edgeWidth) {
      float halfWidth = (end - start) * 0.5;
      float center = start + halfWidth;
      float distToCenter = abs(value - center);
      return 1.0 - smoothstep(halfWidth - edgeWidth, halfWidth, distToCenter);
  }


  void main() {
    vec3 finalColor = uBaseColor;
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition); // For specular, etc.

    // --- Procedural Stripes ---
    // Define stripe regions based on vDepthForStripes (object-space Z)
    // Assuming fish body length is roughly -0.5 to 0.5 in local Z after scaling for this example
    // These values need careful tuning based on the actual model proportions.
    float stripeWidth = 0.1; // Width of white part
    float edgeWidth = 0.015; // Width of dark edge

    // Stripe 1 (near head)
    float stripe1_z_center = -0.25; 
    float stripe1_val = smoothStripe(vDepthForStripes, stripe1_z_center - stripeWidth/2.0, stripe1_z_center + stripeWidth/2.0, edgeWidth * 2.0); // Wider transition for dark edge
    float stripe1_dark_edge = smoothStripe(vDepthForStripes, stripe1_z_center - stripeWidth/2.0 - edgeWidth, stripe1_z_center + stripeWidth/2.0 + edgeWidth, edgeWidth);
    
    // Stripe 2 (middle)
    float stripe2_z_center = 0.05;
    float stripe2_val = smoothStripe(vDepthForStripes, stripe2_z_center - stripeWidth/2.0, stripe2_z_center + stripeWidth/2.0, edgeWidth * 2.0);
    float stripe2_dark_edge = smoothStripe(vDepthForStripes, stripe2_z_center - stripeWidth/2.0 - edgeWidth, stripe2_z_center + stripeWidth/2.0 + edgeWidth, edgeWidth);

    // Stripe 3 (near tail base)
    float stripe3_z_center = 0.3;
    float stripe3_val = smoothStripe(vDepthForStripes, stripe3_z_center - stripeWidth*0.7/2.0, stripe3_z_center + stripeWidth*0.7/2.0, edgeWidth * 2.0); // Thinner tail stripe
    float stripe3_dark_edge = smoothStripe(vDepthForStripes, stripe3_z_center - stripeWidth*0.7/2.0 - edgeWidth, stripe3_z_center + stripeWidth*0.7/2.0 + edgeWidth, edgeWidth);

    // Combine stripes:
    // Start with base color. Apply dark edge first, then white stripe on top.
    finalColor = mix(finalColor, uStripeEdgeColor, (1.0-stripe1_dark_edge) * 0.8); // 0.8 intensity for edge
    finalColor = mix(finalColor, uStripeColor, stripe1_val);

    finalColor = mix(finalColor, uStripeEdgeColor, (1.0-stripe2_dark_edge) * 0.8);
    finalColor = mix(finalColor, uStripeColor, stripe2_val);
    
    finalColor = mix(finalColor, uStripeEdgeColor, (1.0-stripe3_dark_edge) * 0.8);
    finalColor = mix(finalColor, uStripeColor, stripe3_val);


    // --- Eye Implementation (Simplified - assumes UVs map eye area to a quadrant, e.g., top-right) ---
    // A more robust way is to use a separate geometry for eyes or a dedicated texture map.
    // For procedural, we can use UVs or vertex attributes to identify eye regions.
    // Example: if UV.x > 0.8 and UV.y > 0.8 is the eye area on the texture map
    // This is highly dependent on how UVs are laid out for the fish model.
    // For this procedural example, let's assume a region based on vUv.
    // This part will need significant iteration with the actual model's UVs or vertex attributes.
    
    // Simplified eye logic (placeholder - this needs careful UV mapping or vertex attributes)
    // Let's assume body geometry has UVs where eyes could be:
    vec2 eyeCenterUV_L = vec2(0.25, 0.75); // Example UV center for left eye
    vec2 eyeCenterUV_R = vec2(0.75, 0.75); // Example UV center for right eye
    float eyeRadiusUV = 0.1;
    float pupilRadiusUV = 0.04;
    float irisRadiusUV = 0.08;

    float distToEyeL = distance(vUv, eyeCenterUV_L);
    float distToEyeR = distance(vUv, eyeCenterUV_R);

    bool isEye = false;
    vec2 currentEyeCenterUV = vec2(0.0);

    if (distToEyeL < eyeRadiusUV) {
        isEye = true;
        currentEyeCenterUV = eyeCenterUV_L;
    } else if (distToEyeR < eyeRadiusUV) {
        isEye = true;
        currentEyeCenterUV = eyeCenterUV_R;
    }

    if (isEye) {
        float distToCurrentEyeCenter = distance(vUv, currentEyeCenterUV);
        if (distToCurrentEyeCenter < pupilRadiusUV) {
            finalColor = uEyePupilColor;
        } else if (distToCurrentEyeCenter < irisRadiusUV) {
            // Simple iris color, can add gradient later
            finalColor = uEyeIrisColor; 
        } else {
            // Sclera (white part of eye) - can be mixed with uStripeColor for consistency
            finalColor = uStripeColor * 0.9; 
        }

        // Specular Highlight for eye (procedural dot)
        // Position highlight based on view direction and a fixed light source for eyes
        vec3 eyeSurfaceNormal = normal; // Use mesh normal for simplicity
        vec3 eyeLightDir = normalize(vec3(0.5, 0.5, 1.0)); // Fixed light for eye highlight
        vec3 eyeReflected = reflect(-eyeLightDir, eyeSurfaceNormal);
        float eyeSpec = pow(saturate(dot(eyeReflected, viewDir)), 100.0); // Sharp highlight
        
        // Alternative: Place highlight procedurally as a dot based on UVs relative to eye center
        vec2 highlightOffset = vec2(0.015, 0.015); // Offset from pupil center
        float distToHighlight = distance(vUv - currentEyeCenterUV, highlightOffset);
        float highlightSpot = 1.0 - smoothstep(0.0, pupilRadiusUV * 0.3, distToHighlight);
        finalColor = mix(finalColor, uEyeHighlightColor, highlightSpot * 0.8 + eyeSpec * 0.5);
    }

    // Apply subtle rim lighting for soft, Pixar-like shading
    float fresnelTerm = pow(1.0 - saturate(dot(viewDir, normal)), 3.0);
    finalColor += vec3(0.2, 0.2, 0.25) * fresnelTerm; // Slight blue-tinted rim light

    // Ensure fins have a slightly different color/translucent appearance near edges
    // This requires careful UV mapping or vertex attribute to identify fin regions
    float finEdgeFactor = pow(1.0 - abs(dot(viewDir, normal)), 5.0); // Stronger at edge
    finalColor = mix(finalColor, mix(finalColor, uFinAccentColor, 0.6), finEdgeFactor * 0.4);

    // Apply basic lighting
    vec3 ambientLight = vec3(0.4, 0.4, 0.45); // Slightly blue ambient
    vec3 directionalLight = vec3(0.8, 0.8, 0.75); // Slightly warm directional
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.7)); // Light from above-right
    
    vec3 litColor = calculateLighting(normal, viewDir, finalColor, lightDir, directionalLight, ambientLight);
    
    // Add slight self-illumination for Pixar-like vibrance
    litColor += finalColor * 0.1;

    FRAG_COLOR = vec4(litColor, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment> // Apply fog if enabled in scene
  }
`;