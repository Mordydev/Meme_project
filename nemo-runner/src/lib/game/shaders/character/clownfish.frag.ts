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
  #include <normalmap_pars_fragment> // For potential future normal maps

  // Uniforms from ClownfishAsset material setup
  uniform vec3 uBaseColor;          // e.g., Orange
  uniform vec3 uStripeColor;        // e.g., White
  uniform vec3 uStripeEdgeColor;    // e.g., Black/Dark Grey
  uniform vec3 uFinAccentColor;     // e.g., Light Blue/Teal
  uniform vec3 uEyePupilColor;
  uniform vec3 uEyeIrisColor;
  uniform vec3 uEyeHighlightColor;
  uniform float uTime;
  uniform float uEmissiveIntensity; // Control overall emissive strength

  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vObjectZDepth; // Object-space Z for stripe calculation
  varying float vPartId;       // Part ID from vertex shader

  // --- Noise for subtle surface texture ---
  float random(vec2 st) { 
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); 
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation (cubic Hermite)
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    // Mix 4 corners
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Improved lighting model for Pixar-like materials
  vec3 calculatePBRLighting(vec3 normal, vec3 viewDir, vec3 albedo, float roughness, float metalness) {
    // For Pixar-like materials, we want low roughness (0.2-0.4) and zero metalness
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    // Use the uniform to control emissive intensity (with default if uniform is missing)
    float emissiveStrength = uEmissiveIntensity > 0.01 ? uEmissiveIntensity : 0.3;
    vec3 totalEmissiveRadiance = albedo * emissiveStrength;
    
    // Set up the material properties
    PhysicalMaterial material;
    material.diffuseColor = albedo * (1.0 - metalness); // Base color after stripes
    material.roughness = roughness;
    material.specularColor = mix(vec3(0.04), albedo, metalness); // Low spec for soft look
    
    // Add contribution from scene lights
    #if NUM_DIR_LIGHTS > 0
      DirectionalLight directionalLight;
      for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
        directionalLight = directionalLights[i];
        getDirectionalLightInfo(directionalLight, geometry, directLight);
        
        // Custom diffuse for softer effect
        float NdotL = saturate(dot(normal, directionalLight.direction));
        float diffuseFactor = smoothstep(0.0, 0.3, NdotL); // Softer cutoff for Pixar look
        
        reflectedLight.directDiffuse += directionalLight.color * diffuseFactor * (1.0 - metalness) * albedo;
        
        // Simple but effective specular
        vec3 halfDir = normalize(directionalLight.direction + viewDir);
        float NdotH = saturate(dot(normal, halfDir));
        float specularIntensity = pow(NdotH, 1.0/roughness * 10.0) * roughness; // More controlled specular
        reflectedLight.directSpecular += directionalLight.color * specularIntensity * material.specularColor;
      }
    #endif
    
    // Ambient
    reflectedLight.indirectDiffuse += ambientLightColor * (albedo * (1.0 - metalness));
    
    // Final color
    return reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
           reflectedLight.directSpecular + reflectedLight.indirectSpecular + 
           totalEmissiveRadiance;
  }

  // Function for soft stripes with borders
  // value: current coordinate for stripe check (e.g., vObjectZDepth)
  // center: center of the stripe
  // stripeHalfWidth: half-width of the white part
  // borderHalfWidth: additional half-width for the dark border
  // softness: how soft the edges are
  vec3 applyStripe(vec3 currentColor, float value, float center, float stripeHalfWidth, float borderHalfWidth, float softness) {
    float distToCenter = abs(value - center);
    
    // Calculate white stripe mask (1 for stripe, 0 outside)
    float whiteMask = 1.0 - smoothstep(stripeHalfWidth - softness, stripeHalfWidth, distToCenter);
    
    // Calculate dark border mask (1 for border, 0 outside)
    float fullWidthWithBorder = stripeHalfWidth + borderHalfWidth;
    float borderOuterEdge = 1.0 - smoothstep(fullWidthWithBorder - softness, fullWidthWithBorder, distToCenter);
    float borderMask = borderOuterEdge - whiteMask; // Area that is border but not white stripe
    borderMask = clamp(borderMask, 0.0, 1.0);

    vec3 color = mix(currentColor, uStripeEdgeColor, borderMask);
    color = mix(color, uStripeColor, whiteMask);
    
    return color;
  }

  void main() {
    vec3 finalColor = uBaseColor;
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // --- Apply Subtle Surface Noise ---
    // Scale and offset noise based on world position to avoid obvious tiling
    float surfaceNoise = noise(vWorldPosition.xy * 20.0 + vWorldPosition.yz * 10.0 + uTime * 0.01);
    float surfaceVariation = mix(0.95, 1.05, surfaceNoise); // Subtle variation
    finalColor *= surfaceVariation;

    // --- Procedural Stripes (only on the body: partId == 0.0) ---
    if (abs(vPartId - 0.0) < 0.1) {
      // Normalize object Z depth to approximately -1 to 1 range based on body length
      float normZ = vObjectZDepth / 0.4; // Adjust based on actual model size
      
      // Apply a very subtle noise offset to make stripes less perfectly straight
      float stripeNoiseOffset = (noise(vWorldPosition.xy * 5.0) - 0.5) * 0.03;
      
      // Define stripe parameters - can be tweaked for best visual result
      float stripeWidth = 0.2; // Width of white stripe
      float borderWidth = 0.04; // Width of dark border
      float edgeSoftness = 0.02; // Softness of transitions
      
      // Apply three main stripes with precise positioning and border control
      // Head stripe
      finalColor = applyStripe(finalColor, normZ + stripeNoiseOffset, -0.6, stripeWidth * 0.8, borderWidth * 0.8, edgeSoftness);
      
      // Middle stripe
      finalColor = applyStripe(finalColor, normZ + stripeNoiseOffset, 0.05, stripeWidth, borderWidth, edgeSoftness);
      
      // Tail stripe (smaller)
      finalColor = applyStripe(finalColor, normZ + stripeNoiseOffset, 0.7, stripeWidth * 0.7, borderWidth * 0.7, edgeSoftness);
    }

    // --- Fin Coloring and Transparency Effects ---
    // All fins have partId > 0.0
    if (vPartId > 0.1) {
      // Base fin color - slightly different from body
      finalColor = mix(finalColor, uBaseColor * 1.1, 0.1); // Subtle brightening
      
      // Fin tip coloring based on local geometry position
      // For vertical fins like dorsal (4.0) and anal (7.0), use Y coords
      if (abs(vPartId - 4.0) < 0.1 || abs(vPartId - 7.0) < 0.1) {
        float finTipFactor = smoothstep(0.0, 0.8, abs(vUv.y));
        finalColor = mix(finalColor, uFinAccentColor, finTipFactor * 0.3);
      }
      // For side fins like pectorals (2.0, 3.0) and pelvics (5.0, 6.0)
      else if (abs(vPartId - 2.0) < 0.1 || abs(vPartId - 3.0) < 0.1 || 
               abs(vPartId - 5.0) < 0.1 || abs(vPartId - 6.0) < 0.1) {
        float finTipFactor = smoothstep(0.0, 0.8, length(vUv - vec2(0.5, 0.5)));
        finalColor = mix(finalColor, uFinAccentColor, finTipFactor * 0.3);
      }
      // For tail fin (1.0), use distance from center
      else if (abs(vPartId - 1.0) < 0.1) {
        float finTipFactor = smoothstep(0.0, 0.7, abs(vUv.x - 0.5) * 2.0);
        finalColor = mix(finalColor, uFinAccentColor, finTipFactor * 0.25);
      }
    }

    // --- Fresnel/Rim Effect for Soft Pixar-like Edge ---
    // Calculate Fresnel factor - stronger at glancing angles
    float fresnelPower = 3.0; // Higher = narrower rim
    float fresnelFactor = pow(1.0 - saturate(dot(normal, viewDir)), fresnelPower);
    
    // Add colored rim light - subtle blue tint
    vec3 rimColor = mix(vec3(0.2, 0.3, 0.6), uBaseColor * 1.2, 0.7);
    finalColor = mix(finalColor, rimColor, fresnelFactor * 0.25);

    // --- Enhanced Fin Translucency Effect ---
    // Apply translucency effect to fins only (all parts except body and eyes)
    if (vPartId > 0.1) {
      // Stronger translucency at edges and based on thickness
      float edgeTranslucency = pow(1.0 - abs(dot(normal, viewDir)), 8.0);
      
      // Fake light transmission through thin parts
      vec3 transmissionColor = uBaseColor * 1.5; // Brighter version of base for transmission
      
      // Mix in the translucent effect - stronger for thinner fins like pectorals
      float translucencyStrength = 0.3; // Base strength
      
      // Adjust strength based on fin type
      if (abs(vPartId - 2.0) < 0.1 || abs(vPartId - 3.0) < 0.1) { // Pectorals
        translucencyStrength = 0.4;
      } else if (abs(vPartId - 1.0) < 0.1) { // Tail
        translucencyStrength = 0.25;
      }
      
      finalColor = mix(finalColor, transmissionColor, edgeTranslucency * translucencyStrength);
    }

    // --- Apply PBR Lighting ---
    // Use different roughness/metalness values for different parts
    float roughness = 0.3; // Default roughness - not too glossy, not too rough
    float metalness = 0.0; // Non-metallic for organic material
    
    // Adjust material properties by part
    if (vPartId > 0.1) { // Fins
      roughness = 0.35; // Slightly rougher
    }
    
    // Calculate final lit color
    vec3 litColor = calculatePBRLighting(normal, viewDir, finalColor, roughness, metalness);
    
    // Add very subtle ambient occlusion in crevices and fin bases
    float ao = 1.0 - (noise(vWorldPosition.xy * 8.0) * 0.1);
    litColor *= ao;
    
    // Add subtle subsurface scattering (SSS) approximation
    vec3 sssColor = finalColor * vec3(1.0, 0.4, 0.2); // Reddish tint for SSS
    float sssAmount = 0.06 * (1.0 - roughness); // More SSS for smoother areas
    litColor = mix(litColor, sssColor, sssAmount);

    // Set final output color with full opacity - alpha of 1.0 is crucial for visibility!
    FRAG_COLOR = vec4(litColor, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment> // Apply fog if enabled in scene
  }
`;