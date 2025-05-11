import * as THREE from 'three';
import { createCharacterMaterial } from '../shaders/characterShaders';

/**
 * Handles the creation of a procedural clownfish character
 */
export class ClownfishBuilder {
  private static simplex: SimplexNoise | null = null;

  /**
   * Creates and returns a complete clownfish character
   */
  public static createClownfish(): THREE.Group {
    // Initialize simplex noise if needed
    if (!this.simplex) {
      this.simplex = new SimplexNoise();
    }

    const group = new THREE.Group();

    // Create Materials (one base, one cloned for fins)
    const bodyMaterial = createCharacterMaterial(false);
    const finMaterial = createCharacterMaterial(true); // Use uIsFinOrTail = 1.0

    // Body
    const bodyGeometry = this.createBodyGeometry();
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Pectoral Fins (Side)
    const pectoralFinGeo = this.createPectoralFinGeometry();
    const leftFin = new THREE.Mesh(pectoralFinGeo, finMaterial.clone()); // Clone for safety
    leftFin.position.set(0.6, -0.05, 0.35); // Position relative to body center
    leftFin.rotation.y = Math.PI / 7; // Angle slightly outward
    leftFin.rotation.z = -Math.PI / 9; // Angle slightly downward
    group.add(leftFin);

    const rightFin = new THREE.Mesh(pectoralFinGeo, finMaterial.clone());
    rightFin.position.x = -leftFin.position.x; // Mirror position
    rightFin.rotation.y = -leftFin.rotation.y; // Mirror Y rotation
    rightFin.rotation.z = leftFin.rotation.z;  // Keep Z rotation (downward angle)
    group.add(rightFin);

    // Tail Fin (Caudal)
    const tailGeo = this.createTailGeometry();
    const tail = new THREE.Mesh(tailGeo, finMaterial.clone());
    tail.position.set(0, 0.1, -1.15); // Position at the back
    tail.rotation.x = Math.PI / 2; // Orient vertically
    group.add(tail);

    // Dorsal Fin (Top)
    const dorsalFinGeo = this.createDorsalFinGeometry();
    const dorsalFin = new THREE.Mesh(dorsalFinGeo, finMaterial.clone());
    dorsalFin.position.set(0, 0.55, -0.1); // Position on top, slightly back from center
    dorsalFin.rotation.y = Math.PI / 2; // Orient along the body axis
    group.add(dorsalFin);

    // Pelvic Fins (Bottom/Small)
    const pelvicFinGeo = this.createPelvicFinGeometry();
    const leftPelvicFin = new THREE.Mesh(pelvicFinGeo, finMaterial.clone());
    leftPelvicFin.position.set(0.25, -0.45, 0.1); // Position bottom-forward
    leftPelvicFin.rotation.y = -Math.PI / 12; // Slight angle outward
    leftPelvicFin.rotation.z = Math.PI / 10; // Slight angle downward/forward
    group.add(leftPelvicFin);

    const rightPelvicFin = new THREE.Mesh(pelvicFinGeo, finMaterial.clone());
    rightPelvicFin.position.x = -leftPelvicFin.position.x;
    rightPelvicFin.rotation.y = -leftPelvicFin.rotation.y;
    rightPelvicFin.rotation.z = leftPelvicFin.rotation.z;
    group.add(rightPelvicFin);

    // Eyes (Using simple MeshStandardMaterial for good reflections/look)
    const eyeGeometry = new THREE.SphereGeometry(0.16, 24, 18); // Slightly larger, smoother
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.1, metalness: 0.0
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.40, 0.18, 0.85); // Position forward on the body
    group.add(leftEye);

    const pupilGeometry = new THREE.SphereGeometry(0.075, 18, 14);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.14; // Position slightly forward on the eye surface
    leftEye.add(leftPupil); // Add pupil as child of eye

    const rightEye = leftEye.clone(); // Clone eye + pupil
    rightEye.position.x *= -1; // Mirror position
    group.add(rightEye);

    // Store references in userData for easy access during animation/game logic
    group.userData = {
      bodyMaterial: bodyMaterial,
      finMaterial: finMaterial, // Store base fin material if needed
      leftFin: leftFin,
      rightFin: rightFin,
      tail: tail,
      dorsalFin: dorsalFin,
      leftPelvicFin: leftPelvicFin,
      rightPelvicFin: rightPelvicFin,
      leftPupil: leftPupil,
      rightPupil: rightEye.children[0] // Access cloned pupil
    };

    // Enable shadows for all parts
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true; // Can receive shadows from environment
      }
    });

    // Rotate to face forward in game coordinates
    group.rotation.y = Math.PI;

    return group;
  }

  /**
   * Creates the main body geometry using a noise-deformed, scaled sphere
   */
  private static createBodyGeometry(): THREE.BufferGeometry {
    const baseGeometry = new THREE.SphereGeometry(1, 32, 24); // Radius 1, reasonable segments
    const positions = baseGeometry.attributes.position;
    const normals = baseGeometry.attributes.normal;
    const vertex = new THREE.Vector3();
    const normalVec = new THREE.Vector3();
    const noiseFrequency = 1.8; // How detailed the noise bumps are
    const noiseAmplitude = 0.03; // How high the bumps are

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      normalVec.fromBufferAttribute(normals, i);
      
      // Apply simplex noise displacement along the normal
      const noise = this.simplex?.noise3D(
        vertex.x * noiseFrequency, 
        vertex.y * noiseFrequency, 
        vertex.z * noiseFrequency
      ) || 0;
      
      vertex.addScaledVector(normalVec, noise * noiseAmplitude);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Scale into the fish shape (wider, shorter height, longer length)
    // Make the fish smaller overall by reducing the scale factors
    baseGeometry.scale(0.6, 0.5, 0.9); // Reduced from (0.8, 0.6, 1.2) for smaller character
    baseGeometry.computeVertexNormals(); // Recalculate normals after deformation
    baseGeometry.attributes.position.needsUpdate = true;
    
    return baseGeometry;
  }

  /**
   * Creates geometry for pectoral (side) fins using an extruded shape
   */
  private static createPectoralFinGeometry(): THREE.BufferGeometry {
    const finShape = new THREE.Shape();
    
    // Define the 2D profile of the fin
    finShape.moveTo(0, 0);
    finShape.quadraticCurveTo(0.4, 0.2, 0.5, 0.8); // Curve outward and up
    finShape.quadraticCurveTo(0.3, 0.9, 0.1, 1.0); // Tip
    finShape.quadraticCurveTo(-0.1, 0.8, 0, 0);    // Curve back to base
    
    // Extrude settings for thickness and soft edges
    const extrudeSettings = { 
      depth: 0.05, 
      bevelEnabled: true, 
      bevelThickness: 0.01, 
      bevelSize: 0.015, 
      bevelSegments: 2 
    };
    
    const geometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    geometry.center(); // Center geometry for easier rotation
    geometry.rotateX(Math.PI / 2); // Orient it flat initially
    geometry.scale(0.65, 0.65, 0.65); // Scale to desired size (reduced from 0.8 for smaller character)
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Creates geometry for the tail fin (caudal) using an extruded shape
   */
  private static createTailGeometry(): THREE.BufferGeometry {
    const tailShape = new THREE.Shape();
    
    // Define the 2D profile
    tailShape.moveTo(0, -0.2); // Center base
    tailShape.quadraticCurveTo(0.5, 0.0, 0.7, 0.8); // Right lobe curve
    tailShape.quadraticCurveTo(0.4, 0.7, 0, 0.5);   // Indent towards center
    tailShape.quadraticCurveTo(-0.4, 0.7, -0.7, 0.8); // Left lobe curve
    tailShape.quadraticCurveTo(-0.5, 0.0, 0, -0.2);   // Curve back to base
    
    // Extrude settings
    const extrudeSettings = { 
      depth: 0.06, 
      bevelEnabled: true, 
      bevelThickness: 0.01, 
      bevelSize: 0.02, 
      bevelSegments: 2 
    };
    
    const geometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    geometry.center();
    geometry.scale(0.9, 0.9, 0.9); // Scale (reduced from 1.1 for smaller character)
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Creates geometry for the dorsal (top) fin
   */
  private static createDorsalFinGeometry(): THREE.BufferGeometry {
    const dorsalFinShape = new THREE.Shape();
    
    // Define 2D profile
    dorsalFinShape.moveTo(-0.2, 0); // Base start
    dorsalFinShape.lineTo(-0.15, 0.6); // Straightish front edge
    dorsalFinShape.quadraticCurveTo(0.1, 0.75, 0.4, 0.5); // Curved top/back edge
    dorsalFinShape.lineTo(0.3, 0); // Base end
    dorsalFinShape.lineTo(-0.2, 0); // Close shape
    
    // Extrude settings
    const extrudeSettings = { 
      depth: 0.05, 
      bevelEnabled: true, 
      bevelThickness: 0.01, 
      bevelSize: 0.015, 
      bevelSegments: 2 
    };
    
    const geometry = new THREE.ExtrudeGeometry(dorsalFinShape, extrudeSettings);
    geometry.center();
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Creates geometry for the small pelvic (bottom) fins
   */
  private static createPelvicFinGeometry(): THREE.BufferGeometry {
    const finShape = new THREE.Shape();
    
    // Define simple 2D shape
    finShape.moveTo(0, 0);
    finShape.lineTo(0.1, 0.4);
    finShape.lineTo(0.0, 0.5); // Pointed tip
    finShape.lineTo(-0.1, 0.4);
    finShape.lineTo(0, 0);
    
    // Extrude settings (less bevel/depth)
    const extrudeSettings = { 
      depth: 0.03, 
      bevelEnabled: true, 
      bevelThickness: 0.005, 
      bevelSize: 0.01, 
      bevelSegments: 1 
    };
    
    const geometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    geometry.center();
    geometry.rotateX(Math.PI / 2); // Orient flat
    geometry.scale(0.6, 0.6, 0.6); // Make them small
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Animates the character with swimming motion
   */
  public static animateCharacter(character: THREE.Group, time: number): void {
    const userData = character.userData;

    // Update time uniform in materials that use it (body and base fin)
    if (userData.bodyMaterial?.uniforms?.uTime) {
      userData.bodyMaterial.uniforms.uTime.value = time;
    }
    
    // Update base fin material time
    if (userData.finMaterial?.uniforms?.uTime) {
      userData.finMaterial.uniforms.uTime.value = time;
    }

    // --- Procedural Animations ---
    const tailSwayFrequency = 2.8; 
    const tailSwayAmplitude = 0.75;
    const finFlutterFrequency = 6.5; 
    const finFlutterAmplitude = 0.55;
    const dorsalSwayFrequency = 1.2; 
    const dorsalSwayAmplitude = 0.06;
    const pelvicFlutterFrequency = 7.0; 
    const pelvicFlutterAmplitude = 0.2;

    // Tail Sway (Y-axis rotation)
    if (userData.tail) {
      userData.tail.rotation.y = Math.sin(time * tailSwayFrequency) * tailSwayAmplitude;
    }

    // Pectoral Fin Flutter (Y-axis rotation)
    if (userData.leftFin && userData.rightFin) {
      const finAngle = Math.sin(time * finFlutterFrequency + 0.2) * finFlutterAmplitude; // Added phase offset
      userData.leftFin.rotation.y = Math.PI / 7 + finAngle; // Base angle + flutter
      userData.rightFin.rotation.y = -Math.PI / 7 - finAngle; // Base angle + flutter (mirrored)
    }

    // Dorsal Fin Subtle Sway (Z-axis rotation - side to side)
    if (userData.dorsalFin) {
      userData.dorsalFin.rotation.z = Math.sin(time * dorsalSwayFrequency + 0.5) * dorsalSwayAmplitude;
    }

    // Pelvic Fin Subtle Flutter (Y-axis rotation)
    if (userData.leftPelvicFin && userData.rightPelvicFin) {
      const pelvicAngle = Math.sin(time * pelvicFlutterFrequency + 0.8) * pelvicFlutterAmplitude;
      userData.leftPelvicFin.rotation.y = -Math.PI / 12 + pelvicAngle;
      userData.rightPelvicFin.rotation.y = Math.PI / 12 - pelvicAngle; // Mirrored flutter
    }
  }
}

/**
 * SimplexNoise implementation (minimal version)
 */
class SimplexNoise {
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor() {
    // Initialize permutation arrays
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const temp = p[i];
      p[i] = p[r];
      p[r] = temp;
    }
    
    // Extend and create permMod12
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  /**
   * 3D Simplex noise function
   */
  public noise3D(xin: number, yin: number, zin: number): number {
    // Simple implementation that returns a value between -1 and 1
    // This is a simplified version - in production, use a proper implementation
    const s = (xin + yin + zin) * 0.333333333;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    
    // Hash coordinates of the 8 cube corners
    const h000 = this.hash(i, j, k) & 15;
    const h001 = this.hash(i, j, k + 1) & 15;
    const h010 = this.hash(i, j + 1, k) & 15;
    const h011 = this.hash(i, j + 1, k + 1) & 15;
    const h100 = this.hash(i + 1, j, k) & 15;
    const h101 = this.hash(i + 1, j, k + 1) & 15;
    const h110 = this.hash(i + 1, j + 1, k) & 15;
    const h111 = this.hash(i + 1, j + 1, k + 1) & 15;
    
    // Calculate noise contributions from each corner
    const nx = xin - i + s;
    const ny = yin - j + s;
    const nz = zin - k + s;
    
    // Mix the hashed values with coordinates
    let n = h000 * nx + h001 * ny + h010 * nz;
    n += h011 * nx * ny + h100 * ny * nz + h101 * nx * nz;
    n += h110 * nx * ny * nz + h111;
    
    // Normalize to [-1, 1]
    return (n / 127.5) - 1.0;
  }

  private hash(x: number, y: number, z: number): number {
    return this.perm[(this.perm[(this.perm[x & 255] + y) & 255] + z) & 255];
  }
}