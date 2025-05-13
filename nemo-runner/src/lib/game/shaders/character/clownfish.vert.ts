export const vertexShaderSource = `
  uniform float uTime;
  uniform float uPlayerSpeed;     // Normalized speed factor (e.g., 0 for idle, 1 for normal speed)
  uniform float uIsTurning;       // 0.0 (not turning) or 1.0 (turning)
  uniform float uTurnDirection;   // -1.0 (left turn), 1.0 (right turn)

  // Animation parameters from config (passed as uniforms)
  uniform float uTailFinFrequency;
  uniform float uTailFinAmplitude;
  uniform float uPectoralFinFrequency;
  uniform float uPectoralFinAmplitude;

  // Attribute to identify parts
  // 0.0: Body
  // 1.0: Tail Fin (Caudal)
  // 2.0: Left Pectoral Fin
  // 3.0: Right Pectoral Fin
  // 4.0: Dorsal Fin
  // 5.0: Left Pelvic Fin
  // 6.0: Right Pelvic Fin
  // 7.0: Anal Fin
  attribute float aPartIndex; 

  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vObjectZDepth; // Object-space Z for stripe calculation, relative to body center
  varying float vPartId;       // Pass part ID to fragment shader if needed for different effects

  // Simple rotation matrix around Y
  mat3 rotationY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
      c, 0, s,
      0, 1, 0,
      -s, 0, c
    );
  }
  
  // Simple rotation matrix around X
  mat3 rotationX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
      1, 0, 0,
      0, c, -s,
      0, s, c
    );
  }
  
  // Simple rotation matrix around Z
  mat3 rotationZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
      c, -s, 0,
      s, c, 0,
      0, 0, 1
    );
  }

  void main() {
    vUv = uv;
    vPartId = aPartIndex; // Pass part index to fragment
    
    vec3 pos = position; // Start with original position
    vec3 transformedNormal = normal; // Start with original normal

    float effectiveSpeedFactor = 0.5 + uPlayerSpeed * 1.5; // Animation is more pronounced with speed

    // --- Procedural Animation based on aPartIndex ---

    // Caudal (Tail) Fin Animation (ID: 1.0)
    if (abs(aPartIndex - 1.0) < 0.1) { 
      // Tail sways side-to-side (around local Y axis of the fin, assuming fin points along Z)
      // The amount of sway depends on how far along the tail the vertex is (local Z)
      // Assuming tail fin geometry's length is along its local Z, base at Z=0
      float zNormalized = clamp(pos.z / 0.4, 0.0, 1.0); // Approx tail length for normalization
      float tailAngle = sin(uTime * uTailFinFrequency * effectiveSpeedFactor) * uTailFinAmplitude * effectiveSpeedFactor;
      float currentSwayAngle = tailAngle * zNormalized * zNormalized; // More bend at the tip
      
      // Apply rotation to the position - for more complex matrix rotations we could use the rotation matrices
      // defined above, but this simplified approach works well for the tail fin
      float c = cos(currentSwayAngle);
      float s = sin(currentSwayAngle);
      pos.x = pos.x * c - pos.z * s; // Simplified Y-axis rotation for X component
      pos.z = pos.x * s + pos.z * c; // Simplified Y-axis rotation for Z component
      
      // Also rotate the normal for better lighting
      transformedNormal = rotationY(currentSwayAngle) * transformedNormal;
    }

    // Pectoral Fin Animation (Left: ID 2.0, Right: ID 3.0)
    // Assuming pectoral fins are created in XY plane, extending along Y, attached near Y=0, flapping around X.
    if (abs(aPartIndex - 2.0) < 0.1 || abs(aPartIndex - 3.0) < 0.1) {
      float flapPhaseOffset = (abs(aPartIndex - 2.0) < 0.1) ? 0.0 : 0.3; // Right fin slightly offset
      float flapAngle = sin(uTime * uPectoralFinFrequency * effectiveSpeedFactor + flapPhaseOffset) 
                        * uPectoralFinAmplitude * (1.0 + uPlayerSpeed * 0.2);
      
      // Assuming fin length is along its local Y, and it flaps around its local X axis
      float finYNormalized = clamp(abs(pos.y) / 0.3, 0.0, 1.0); // Approx fin length for normalization
      float currentFlapAngle = flapAngle * finYNormalized;
      
      // Rotate around X-axis (flapping up/down)
      vec3 originalPos = pos;
      pos = rotationX(currentFlapAngle) * pos;
      
      // Also rotate the normal
      transformedNormal = rotationX(currentFlapAngle) * transformedNormal;
      
      // Add slight outward splay when swimming fast
      float splayAngle = 0.1 * uPlayerSpeed * sin(uTime * 0.5);
      if (abs(aPartIndex - 2.0) < 0.1) { // Left fin
        pos = rotationZ(splayAngle) * pos;
        transformedNormal = rotationZ(splayAngle) * transformedNormal;
      } else { // Right fin
        pos = rotationZ(-splayAngle) * pos;
        transformedNormal = rotationZ(-splayAngle) * transformedNormal;
      }
    }

    // Dorsal Fin Subtle Sway (ID: 4.0)
    if (abs(aPartIndex - 4.0) < 0.1) {
      // Gentle swaying animation, stronger at the top portion
      float yNormalized = clamp(pos.y / 0.3, 0.0, 1.0); // Approx dorsal fin height
      float dorsalSwayAngle = sin(uTime * 1.5 * effectiveSpeedFactor + pos.z * 5.0) * 0.05 * yNormalized; // pos.z for wave effect
      
      // Apply subtle rotation around Z axis
      pos = rotationZ(dorsalSwayAngle) * pos;
      transformedNormal = rotationZ(dorsalSwayAngle) * transformedNormal;
    }

    // Pelvic Fins Subtle Animation (ID: 5.0 Left, 6.0 Right)
    if (abs(aPartIndex - 5.0) < 0.1 || abs(aPartIndex - 6.0) < 0.1) {
      float flutterPhaseOffset = (abs(aPartIndex - 5.0) < 0.1) ? 0.0 : 0.15;
      // Small, quick flutter, mostly around local X and Z
      float flutterAngle = sin(uTime * 7.0 * effectiveSpeedFactor + flutterPhaseOffset) * 0.15;
      float finYNormalized = clamp(abs(pos.y) / 0.2, 0.0, 1.0); // Approx pelvic fin length
      float currentFlutterAngle = flutterAngle * finYNormalized;

      // Apply rotation - combination of X and Z axis rotations
      pos = rotationX(currentFlutterAngle * 0.7) * rotationZ(currentFlutterAngle * 0.3) * pos;
      transformedNormal = rotationX(currentFlutterAngle * 0.7) * rotationZ(currentFlutterAngle * 0.3) * transformedNormal;
    }
    
    // Anal Fin (ID: 7.0) - similar to dorsal but less pronounced
    if (abs(aPartIndex - 7.0) < 0.1) {
      float yNormalized = clamp(abs(pos.y) / 0.2, 0.0, 1.0); // Approx anal fin height
      float analSwayAngle = sin(uTime * 1.8 * effectiveSpeedFactor + pos.z * 6.0) * 0.04 * yNormalized;
      
      // Apply subtle rotation
      pos = rotationZ(analSwayAngle) * pos;
      transformedNormal = rotationZ(analSwayAngle) * transformedNormal;
    }

    // Body Bending/Turning Animation (apply to BODY_ID == 0.0)
    if (abs(aPartIndex - 0.0) < 0.1 && uIsTurning > 0.5) {
      float turnInfluence = -position.z; // More bend towards the tail (original local Z)
      turnInfluence = smoothstep(0.0, 0.5, turnInfluence); // Apply mostly to back half
      float bodyBendAngle = uTurnDirection * turnInfluence * 0.25 * uIsTurning; // Max bend angle

      // Rotate around the body's local Y axis
      pos = rotationY(bodyBendAngle) * pos;
      transformedNormal = rotationY(bodyBendAngle) * transformedNormal;
    }

    // Add subtle organic motion to body vertices
    if (abs(aPartIndex - 0.0) < 0.1) {
      // Subtle breathing/pulsing effect
      float breatheFactor = sin(uTime * 0.8) * 0.01;
      pos.y *= (1.0 + breatheFactor);
      pos.x *= (1.0 - breatheFactor * 0.5);
      
      // Very subtle undulation along the body
      float undulatePhase = uTime * 2.0 * effectiveSpeedFactor;
      float undulateAmount = sin(undulatePhase + pos.z * 8.0) * 0.01;
      pos.y += undulateAmount * smoothstep(0.0, 0.7, abs(pos.z)); // Stronger toward tail
    }

    // Object-space Z for stripes (use original Z before animation if animation displaces Z significantly)
    vObjectZDepth = position.z;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Use the transformed normal for lighting
    vNormal = normalize(normalMatrix * transformedNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;