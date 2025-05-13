export const vertexShaderSource = `
  uniform float uTime;
  uniform float uPlayerSpeed; // Normalized speed factor
  uniform float uIsTurning;   // 0.0 or 1.0
  uniform float uTurnDirection; // -1.0 (left), 1.0 (right)

  // Animation parameters from config (passed as uniforms if varied per instance, or baked if const)
  uniform float uTailFinFrequency;
  uniform float uTailFinAmplitude;
  uniform float uPectoralFinFrequency;
  uniform float uPectoralFinAmplitude;
  // Could add more for dorsal, pelvic, anal fins

  // Attribute to identify parts (0: body, 1: tail, 2: L pectoral, 3: R pectoral, 4: dorsal, etc.)
  // This needs to be set when creating BufferGeometry for the fish parts
  attribute float aPartIndex; 

  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vDepthForStripes; // Object-space Z for stripe calculation

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vDepthForStripes = position.z; // Assuming Z is along the fish's length before world transform

    vec3 animatedPosition = position;
    vec3 animatedNormal = normal; // Normals also need to be transformed by animation

    float speedFactor = 1.0 + uPlayerSpeed * 2.0; // Make animations faster with speed

    // --- Procedural Animation ---
    // Caudal (Tail) Fin Animation (assuming aPartIndex == 1.0)
    if (aPartIndex == 1.0) { 
      float tailAngle = sin(uTime * uTailFinFrequency * speedFactor) * uTailFinAmplitude * speedFactor;
      // Bend based on horizontal position relative to fin's local Z axis (animatedPosition.x)
      // This assumes tail fin geometry is oriented along Z axis in local space
      // And its width is along X. We want to sway it side-to-side (around Y axis).
      // The amount of sway depends on how far along the tail the vertex is (animatedPosition.z)
      float zNormalized = clamp(animatedPosition.z / 0.3, 0.0, 1.0); // Assuming tail length ~0.3
      float currentTailAngle = tailAngle * zNormalized * zNormalized; // Stronger bend at tip

      // Apply rotation around Y axis for side-to-side sway
      mat2 rotY = mat2(cos(currentTailAngle), -sin(currentTailAngle), 
                       sin(currentTailAngle),  cos(currentTailAngle));
      animatedPosition.xz = rotY * animatedPosition.xz;
      // Also rotate normal (simplified for small angles)
      // For more accuracy, transform normal by the same rotation matrix
      // animatedNormal.xz = rotY * animatedNormal.xz; 
    }

    // Pectoral Fin Animation (Left: aPartIndex == 2.0, Right: aPartIndex == 3.0)
    // Similar logic: flapping around an axis (likely local X or Z depending on fin orientation)
    if (aPartIndex == 2.0 || aPartIndex == 3.0) { // Pectoral Fins
        float flapAngle = sin(uTime * uPectoralFinFrequency * speedFactor + (aPartIndex == 2.0 ? 0.0 : 0.2)) * uPectoralFinAmplitude; // Offset phase for right fin
        // Assuming pectoral fins are oriented to flap around their local X-axis
        // And extend along their local Z-axis
        float finZNormalized = clamp(abs(animatedPosition.z) / 0.15, 0.0, 1.0); // Assuming fin length ~0.15 from its pivot
        float currentFlapAngle = flapAngle * finZNormalized;

        mat2 rotX = mat2(cos(currentFlapAngle), -sin(currentFlapAngle),
                         sin(currentFlapAngle),  cos(currentFlapAngle));
        // If fin's length is along Z and it flaps up/down (around X), then YZ components rotate
        // This depends on how the fin geometry was initially created and oriented in ClownfishAsset.ts
        // Let's assume fins are created in XY plane, extending along Y, attached at Y=0, flapping around X
        // animatedPosition.yz = rotX * animatedPosition.yz; // Example
        // For side fins that flap:
        animatedPosition.xy = rotX * animatedPosition.xy; // If fin is in YZ plane, flaps around Z
    }
    
    // Body Bending/Turning Animation (aPartIndex == 0.0 for body)
    if (uIsTurning > 0.5 && aPartIndex == 0.0) {
        float turnInfluence = -position.z; // More bend towards the tail (positive Z in local space)
        turnInfluence = smoothstep(0.0, 0.5, turnInfluence); // Apply only to back half
        float bodyBendAngle = uTurnDirection * turnInfluence * 0.2; // Max bend angle

        mat2 bodyRotY = mat2(cos(bodyBendAngle), -sin(bodyBendAngle),
                             sin(bodyBendAngle), cos(bodyBendAngle));
        animatedPosition.xz = bodyRotY * animatedPosition.xz;
    }


    vec4 worldPos = modelMatrix * vec4(animatedPosition, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Recompute normal based on animated position if complex deformation
    // For simpler rotations, transform normal by rotation matrix
    // For now, we pass the original normal, but this might need refinement for lighting on animated parts
    // vNormal = normalize(normalMatrix * animatedNormal); // More accurate

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;