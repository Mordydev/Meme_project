// src/lib/game/assets/character/ClownfishAsset.ts
import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { PlayerSettings } from '../../config/gameConfig';

// Part IDs for vertex shader animation
const BODY_ID = 0.0;
const TAIL_FIN_ID = 1.0;
const LEFT_PECTORAL_ID = 2.0;
const RIGHT_PECTORAL_ID = 3.0;
const DORSAL_FIN_ID = 4.0;
const LEFT_PELVIC_ID = 5.0;
const RIGHT_PELVIC_ID = 6.0;
const ANAL_FIN_ID = 7.0;

export class ClownfishAsset {
  public mesh!: THREE.Group;
  private playerConfig: Readonly<PlayerSettings>;
  private animationTime: number = 0;

  // Store references to animatable parts
  private bodyMesh?: THREE.Mesh;
  private tailFin?: THREE.Mesh;
  private leftPectoralFin?: THREE.Mesh;
  private rightPectoralFin?: THREE.Mesh;
  private dorsalFin?: THREE.Mesh;
  private leftPelvicFin?: THREE.Mesh;
  private rightPelvicFin?: THREE.Mesh;
  private analFin?: THREE.Mesh;
  private leftEye?: THREE.Group;
  private rightEye?: THREE.Group;
  
  // Material references for animation and effects
  private bodyMaterial?: THREE.MeshStandardMaterial;
  private finMaterial?: THREE.MeshStandardMaterial;
  private stripesTexture?: THREE.Texture;

  constructor(shaderManager: ShaderManager) {
    // We still need the ShaderManager parameter for backward compatibility
    // but we don't actually use it anymore
    this.playerConfig = configSystem.get('player');
    this.createClownfishMesh();
  }

  /**
   * Adds part index attribute to geometry for shader-based animations
   */
  private addPartIndexAttribute(geometry: THREE.BufferGeometry, partId: number): void {
    const vertexCount = geometry.attributes.position.count;
    const partIndices = new Float32Array(vertexCount);
    
    // Set the same part ID for all vertices in this geometry
    partIndices.fill(partId);
    
    // Add the attribute that will be accessible in the vertex shader
    geometry.setAttribute('aPartIndex', new THREE.BufferAttribute(partIndices, 1));
  }

  /**
   * Creates the complete clownfish with all parts using enhanced standard materials
   * This is a completely refactored version that uses clear orientation rules
   */
  private createClownfishMesh(): void {
    try {
      // Initialize the top-level group that contains all parts
      this.mesh = new THREE.Group();
      this.mesh.name = "ClownfishPlayer";
      
      // Create stripe texture for the body with error handling
      try {
        this.stripesTexture = this.createStripeTexture();
      } catch (error) {
        console.error("ClownfishAsset: Error creating stripe texture:", error);
        this.stripesTexture = this.createSimpleFallbackTexture();
      }
      
      // Get player configuration for colors
      const playerConfig = configSystem.get('player');
      
      // Create main body material with enhanced Pixar-style properties
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(playerConfig.clownFishBaseColor || 0xFC6000), // Vibrant orange as requested
        emissive: new THREE.Color(playerConfig.clownFishBaseColor || 0xFC6000).multiplyScalar(0.3),
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.1,
        side: THREE.DoubleSide,
        map: this.stripesTexture,
        envMapIntensity: 0.8,
      });
      
      // Create fin material with enhanced Pixar-style properties
      const finMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(playerConfig.clownFishBaseColor || 0xFC6000), // Vibrant orange as requested
        emissive: new THREE.Color(playerConfig.clownFishBaseColor || 0xFC6000).multiplyScalar(0.3),
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        envMapIntensity: 0.8
      });
      
      // Store references to materials for animation and updates
      this.bodyMaterial = bodyMaterial;
      this.finMaterial = finMaterial;
      
      // IMPORTANT: Our coordinate system follows this convention:
      // Forward = -Z (fish swims into the screen)
      // Up = +Y (top of the fish)
      // Right = +X (fish's right side)
      
      // IMPORTANT: The fish's "forward" direction should align with the -Z axis
      
      // Create the body (a modified ellipsoid)
      this.bodyMesh = this.createFishBody(bodyMaterial);
      this.mesh.add(this.bodyMesh);
      
      // Create tail fin (at the back of the fish, +Z)
      this.tailFin = this.createTailFin(finMaterial);
      this.bodyMesh.add(this.tailFin); // Attach to body for proper animations
      
      // Create dorsal fin (on top of the fish, +Y)
      this.dorsalFin = this.createDorsalFin(finMaterial);
      this.bodyMesh.add(this.dorsalFin);
      
      // Create anal fin (on bottom of the fish, -Y)
      this.analFin = this.createAnalFin(finMaterial);
      this.bodyMesh.add(this.analFin);
      
      // Create pectoral fins (on the sides, +/-X)
      this.leftPectoralFin = this.createPectoralFin(finMaterial, true);
      this.rightPectoralFin = this.createPectoralFin(finMaterial, false);
      this.bodyMesh.add(this.leftPectoralFin);
      this.bodyMesh.add(this.rightPectoralFin);
      
      // Create pelvic fins (on bottom sides)
      this.leftPelvicFin = this.createPelvicFin(finMaterial, true);
      this.rightPelvicFin = this.createPelvicFin(finMaterial, false);
      this.bodyMesh.add(this.leftPelvicFin);
      this.bodyMesh.add(this.rightPelvicFin);
      
      // Create eyes (on front sides)
      this.leftEye = this.createEye(true);
      this.rightEye = this.createEye(false);
      this.bodyMesh.add(this.leftEye);
      this.bodyMesh.add(this.rightEye);
      
      // Scale the fish to appropriate size
      this.mesh.scale.set(0.32, 0.32, 0.32); // Reduced to 0.32 scale as requested
      
      console.log("ClownfishAsset: Successfully created enhanced clownfish");
    } catch (error) {
      console.error("ClownfishAsset: Error creating mesh:", error);
      this.createMinimalFallback();
    }
  }
  
  /**
   * Creates the main fish body using a properly oriented ellipsoid
   */
  private createFishBody(material: THREE.MeshStandardMaterial): THREE.Mesh {
    // Create a sphere and deform it into a fish-like shape
    const bodyGeometry = new THREE.SphereGeometry(1, 32, 24);
    
    // Deform the sphere into an elongated fish body
    const positions = bodyGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      // Scale to create fish body proportions
      positions[i] *= 0.6;     // X - narrow the width
      positions[i+1] *= 0.8;   // Y - slightly flatten vertically
      positions[i+2] *= 1.5;   // Z - elongate the body
      
      // Get the normalized Z position to apply tapering
      const z = positions[i+2];
      const normalizedZ = z / 1.5;
      
      // Taper toward the tail (back) and slightly toward the head (front)
      let taper = 1.0;
      if (normalizedZ > 0.3) {
        // Tail tapering (gradually narrower toward the back/tail)
        taper = 1.0 - Math.pow((normalizedZ - 0.3) / 0.7, 2) * 0.7;
      } else if (normalizedZ < -0.5) {
        // Head tapering (slightly narrower at the front)
        taper = 1.0 - Math.pow((Math.abs(normalizedZ) - 0.5) / 0.5, 2) * 0.3;
      }
      
      // Apply tapering to X and Y dimensions
      positions[i] *= taper;
      positions[i+1] *= taper;
    }
    
    // Update geometry after modifications
    bodyGeometry.attributes.position.needsUpdate = true;
    bodyGeometry.computeVertexNormals();
    
    // Add part index for animations
    this.addPartIndexAttribute(bodyGeometry, BODY_ID);
    
    // Add UVs for stripe pattern
    this.addStripeUVs(bodyGeometry);
    
    // Create and return the mesh
    const bodyMesh = new THREE.Mesh(bodyGeometry, material);
    bodyMesh.name = "ClownfishBody";
    
    return bodyMesh;
  }
  
  /**
   * Add proper UV coordinates for stripe pattern
   */
  private addStripeUVs(geometry: THREE.BufferGeometry): void {
    const positions = geometry.attributes.position.array as Float32Array;
    const uvs: number[] = [];
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i+1];
      const z = positions[i+2];
      
      // Map from -1,1 range to 0,1 range
      const v = (y + 1) * 0.5;
      
      // Map the Z coordinate (fish length) to U
      // Adjust for the elongated body
      const u = (z / 3) + 0.5;
      
      uvs.push(u, v);
    }
    
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  
  /**
   * Creates the tail fin
   */
  private createTailFin(material: THREE.MeshStandardMaterial): THREE.Mesh {
    // Create a triangular tail fin shape
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(1.2, 1);    // Top point
    tailShape.lineTo(1.6, 0);    // Middle extension
    tailShape.lineTo(1.2, -1);   // Bottom point
    tailShape.lineTo(0, 0);      // Back to center
    
    // Extrude to create thickness
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    };
    
    const tailGeometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    
    // Center the geometry
    tailGeometry.center();
    
    // Rotate to proper orientation
    tailGeometry.rotateY(Math.PI/2);
    
    // Add part index
    this.addPartIndexAttribute(tailGeometry, TAIL_FIN_ID);
    
    // Create the mesh
    const tailMesh = new THREE.Mesh(tailGeometry, material);
    tailMesh.name = "TailFin";
    
    // Position at the back of the fish
    tailMesh.position.set(0, 0, 1.5);
    
    return tailMesh;
  }
  
  /**
   * Creates the dorsal fin (top fin)
   */
  private createDorsalFin(material: THREE.MeshStandardMaterial): THREE.Mesh {
    // Create a triangular dorsal fin shape
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(-0.5, 0);
    dorsalShape.lineTo(0, 0.8);    // Peak
    dorsalShape.lineTo(0.5, 0);    // Back to baseline
    
    // Extrude for thickness
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    };
    
    const dorsalGeometry = new THREE.ExtrudeGeometry(dorsalShape, extrudeSettings);
    
    // Center and rotate
    dorsalGeometry.center();
    dorsalGeometry.rotateX(Math.PI/2);
    
    // Add part index
    this.addPartIndexAttribute(dorsalGeometry, DORSAL_FIN_ID);
    
    // Create mesh
    const dorsalMesh = new THREE.Mesh(dorsalGeometry, material);
    dorsalMesh.name = "DorsalFin";
    
    // Position on top of the fish
    dorsalMesh.position.set(0, 0.8, 0.2);
    
    return dorsalMesh;
  }
  
  /**
   * Creates the anal fin (bottom back fin)
   */
  private createAnalFin(material: THREE.MeshStandardMaterial): THREE.Mesh {
    // Create anal fin shape (smaller than dorsal)
    const analShape = new THREE.Shape();
    analShape.moveTo(-0.3, 0);
    analShape.lineTo(0, -0.5);    // Peak (downward)
    analShape.lineTo(0.3, 0);     // Back to baseline
    
    // Extrude for thickness
    const extrudeSettings = {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2
    };
    
    const analGeometry = new THREE.ExtrudeGeometry(analShape, extrudeSettings);
    
    // Center and rotate
    analGeometry.center();
    analGeometry.rotateX(Math.PI/2);
    
    // Add part index
    this.addPartIndexAttribute(analGeometry, ANAL_FIN_ID);
    
    // Create mesh
    const analMesh = new THREE.Mesh(analGeometry, material);
    analMesh.name = "AnalFin";
    
    // Position on bottom back of fish
    analMesh.position.set(0, -0.7, 0.6);
    
    return analMesh;
  }
  
  /**
   * Creates a pectoral fin (side fin)
   */
  private createPectoralFin(material: THREE.MeshStandardMaterial, isLeft: boolean): THREE.Mesh {
    // Create wing-like pectoral fin
    const pectoralShape = new THREE.Shape();
    pectoralShape.moveTo(0, 0);
    pectoralShape.bezierCurveTo(
      0.2, 0.2,     // Control point 1
      0.6, 0.2,     // Control point 2
      0.8, 0        // End point - curved top
    );
    pectoralShape.bezierCurveTo(
      0.6, -0.3,    // Control point 1
      0.3, -0.3,    // Control point 2
      0, 0          // End point - curved bottom back to start
    );
    
    // Extrude for thickness
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    };
    
    const pectoralGeometry = new THREE.ExtrudeGeometry(pectoralShape, extrudeSettings);
    
    // Center and rotate to proper orientation
    pectoralGeometry.center();
    
    // Different rotation for left/right fins
    if (isLeft) {
      pectoralGeometry.rotateY(-Math.PI/2);
    } else {
      pectoralGeometry.rotateY(Math.PI/2);
    }
    
    // Add part index
    this.addPartIndexAttribute(pectoralGeometry, isLeft ? LEFT_PECTORAL_ID : RIGHT_PECTORAL_ID);
    
    // Create mesh
    const pectoralMesh = new THREE.Mesh(pectoralGeometry, material);
    pectoralMesh.name = isLeft ? "LeftPectoralFin" : "RightPectoralFin";
    
    // Position on side of fish toward the front
    const xPos = isLeft ? 0.6 : -0.6;
    pectoralMesh.position.set(xPos, -0.1, -0.2);
    
    // Add slight rotation to look more natural
    pectoralMesh.rotation.z = isLeft ? -Math.PI/10 : Math.PI/10;
    
    return pectoralMesh;
  }
  
  /**
   * Creates a pelvic fin (bottom side fin)
   */
  private createPelvicFin(material: THREE.MeshStandardMaterial, isLeft: boolean): THREE.Mesh {
    // Create small pelvic fin
    const pelvicShape = new THREE.Shape();
    pelvicShape.moveTo(0, 0);
    pelvicShape.bezierCurveTo(
      0.1, -0.1,    // Control point 1
      0.2, -0.2,    // Control point 2
      0.3, -0.1     // End point
    );
    pelvicShape.bezierCurveTo(
      0.25, 0,      // Control point 1
      0.15, 0,      // Control point 2
      0, 0          // Back to start
    );
    
    // Extrude for thickness
    const extrudeSettings = {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 1
    };
    
    const pelvicGeometry = new THREE.ExtrudeGeometry(pelvicShape, extrudeSettings);
    
    // Center and rotate
    pelvicGeometry.center();
    if (isLeft) {
      pelvicGeometry.rotateY(-Math.PI/2);
    } else {
      pelvicGeometry.rotateY(Math.PI/2);
    }
    
    // Add part index
    this.addPartIndexAttribute(pelvicGeometry, isLeft ? LEFT_PELVIC_ID : RIGHT_PELVIC_ID);
    
    // Create mesh
    const pelvicMesh = new THREE.Mesh(pelvicGeometry, material);
    pelvicMesh.name = isLeft ? "LeftPelvicFin" : "RightPelvicFin";
    
    // Position on bottom side
    const xPos = isLeft ? 0.4 : -0.4;
    pelvicMesh.position.set(xPos, -0.6, -0.4);
    
    return pelvicMesh;
  }
  
  /**
   * Creates an eye
   */
  private createEye(isLeft: boolean): THREE.Group {
    const eyeGroup = new THREE.Group();
    eyeGroup.name = isLeft ? "LeftEye" : "RightEye";
    
    // Create eyeball
    const eyeballGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    const eyeballMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1
    });
    
    const eyeball = new THREE.Mesh(eyeballGeometry, eyeballMaterial);
    eyeball.name = isLeft ? "LeftEyeball" : "RightEyeball";
    eyeGroup.add(eyeball);
    
    // Create iris
    const irisGeometry = new THREE.CircleGeometry(0.1, 16);
    const irisMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      roughness: 0.1,
      metalness: 0.1
    });
    
    const iris = new THREE.Mesh(irisGeometry, irisMaterial);
    iris.name = isLeft ? "LeftIris" : "RightIris";
    iris.position.set(0, 0, 0.13);
    eyeGroup.add(iris);
    
    // Create pupil
    const pupilGeometry = new THREE.CircleGeometry(0.05, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.1
    });
    
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.name = isLeft ? "LeftPupil" : "RightPupil";
    pupil.position.set(0, 0, 0.14);
    eyeGroup.add(pupil);
    
    // Create highlight
    const highlightGeometry = new THREE.CircleGeometry(0.02, 8);
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.name = isLeft ? "LeftHighlight" : "RightHighlight";
    highlight.position.set(0.03, 0.03, 0.15);
    eyeGroup.add(highlight);
    
    // Position the eye on the side of the head
    const xPos = isLeft ? 0.5 : -0.5;
    eyeGroup.position.set(xPos, 0.2, -0.9);
    
    // Rotate to face slightly outward
    eyeGroup.rotation.y = isLeft ? Math.PI/6 : -Math.PI/6;
    
    return eyeGroup;
  }
  
  /**
   * Create a simple stripe texture
   */
  private createSimpleFallbackTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();
    
    // Fill with vibrant orange color
    ctx.fillStyle = '#FC6000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add three white stripes
    ctx.fillStyle = '#FFFFFF';
    const stripeHeight = 80;
    ctx.fillRect(0, 100, canvas.width, stripeHeight);
    ctx.fillRect(0, 250, canvas.width, stripeHeight);
    ctx.fillRect(0, 400, canvas.width, stripeHeight);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  /**
   * Create more detailed stripe texture
   */
  private createStripeTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();
    
    // Get colors from config
    const playerConfig = configSystem.get('player');
    const baseColorHex = playerConfig.clownFishBaseColor || 0xFC6000; // Vibrant orange
    const stripeColorHex = playerConfig.clownFishStripeColor || 0xFFFFFF;
    
    // Convert to CSS colors
    const baseColor = '#' + baseColorHex.toString(16).padStart(6, '0');
    const stripeColor = '#' + stripeColorHex.toString(16).padStart(6, '0');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.5, shadeColor(baseColor, 20)); // Lighter middle
    gradient.addColorStop(1, baseColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw three stripes with soft edges
    const stripePositions = [0.25, 0.5, 0.75]; // Normalized positions
    const stripeHeight = 0.15; // 15% of height
    
    stripePositions.forEach((pos) => {
      const y = pos * canvas.height;
      const height = stripeHeight * canvas.height;
      
      // Create gradient for the stripe with soft edges
      const stripeGradient = ctx.createLinearGradient(0, y - height/2 - 20, 0, y + height/2 + 20);
      stripeGradient.addColorStop(0, baseColor); // Start with base color
      stripeGradient.addColorStop(0.2, stripeColor); // Transition to stripe color
      stripeGradient.addColorStop(0.8, stripeColor); // Hold stripe color
      stripeGradient.addColorStop(1, baseColor); // Back to base color
      
      ctx.fillStyle = stripeGradient;
      ctx.fillRect(0, y - height/2 - 20, canvas.width, height + 40);
    });
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  /**
   * Create a minimal fallback fish for emergency cases
   */
  private createMinimalFallback(): void {
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "ClownfishFallback";
    
    // Create simple body
    const bodyGeometry = new THREE.SphereGeometry(1, 16, 12);
    const positions = bodyGeometry.attributes.position.array as Float32Array;
    
    // Deform to fish shape
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] *= 0.6;   // X
      positions[i+1] *= 0.8; // Y
      positions[i+2] *= 1.5; // Z
    }
    
    bodyGeometry.attributes.position.needsUpdate = true;
    bodyGeometry.computeVertexNormals();
    
    // Create very bright material for visibility
    const material = new THREE.MeshBasicMaterial({
      color: 0xFC6000, // Vibrant orange as requested
      wireframe: false
    });
    
    // Create body
    this.bodyMesh = new THREE.Mesh(bodyGeometry, material);
    this.bodyMesh.name = "ClownfishBody";
    this.mesh.add(this.bodyMesh);
    
    // Add simple eyes for orientation
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.3, 0.2, -0.8);
    this.bodyMesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.3, 0.2, -0.8);
    this.bodyMesh.add(rightEye);
    
    // Add simple tail
    const tailGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
    const tail = new THREE.Mesh(tailGeometry, material);
    tail.position.set(0, 0, 1.4);
    this.bodyMesh.add(tail);
    
    // Scale the fish to match main implementation
    this.mesh.scale.set(0.32, 0.32, 0.32); // Reduced to 0.32 scale
  }
  
  /**
   * Returns the player mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  /**
   * Updates animation - called from PlayerController
   */
  public updateAnimation(deltaTime: number, playerSpeed: number, isTurning: boolean, turnDirection: number): void {
    this.animationTime += deltaTime;
    
    // Ensure visibility
    this.mesh.visible = true;
    
    // Skip animation if parts don't exist
    if (!this.bodyMesh) return;
    
    // Speed factor for animations
    const speedFactor = 1.0 + playerSpeed * 0.15;
    
    // Body animation (subtle sway)
    if (isTurning) {
      // When turning, lean into the turn
      this.bodyMesh.rotation.y = turnDirection * 0.2 * speedFactor;
      this.bodyMesh.rotation.z = -turnDirection * 0.1 * speedFactor;
    } else {
      // Gentle undulation
      this.bodyMesh.rotation.y = Math.sin(this.animationTime * 1.5) * 0.05;
      this.bodyMesh.rotation.z = Math.sin(this.animationTime * 0.7) * 0.02;
    }
    
    // Tail fin animation (side to side swishing)
    if (this.tailFin) {
      const tailFreq = this.playerConfig.tailFinFrequency || 5;
      const tailAmp = this.playerConfig.tailFinAmplitude || 0.3;
      
      // Main side-to-side motion
      this.tailFin.rotation.y = Math.sin(this.animationTime * tailFreq * speedFactor) * tailAmp * speedFactor;
      
      // Add extra motion when turning
      if (isTurning) {
        this.tailFin.rotation.y += turnDirection * 0.2;
      }
    }
    
    // Pectoral fin animation (gentle flapping)
    const finFreq = this.playerConfig.pectoralFinFrequency || 3;
    const finAmp = this.playerConfig.pectoralFinAmplitude || 0.2;
    
    if (this.leftPectoralFin) {
      // Asymmetric motion
      const leftFinPhase = this.animationTime * finFreq * speedFactor;
      this.leftPectoralFin.rotation.z = Math.sin(leftFinPhase) * finAmp - Math.PI/10;
    }
    
    if (this.rightPectoralFin) {
      // Slightly out of phase
      const rightFinPhase = this.animationTime * finFreq * speedFactor + 0.4;
      this.rightPectoralFin.rotation.z = -Math.sin(rightFinPhase) * finAmp + Math.PI/10;
    }
    
    // Eye animation (subtle looks)
    const eyePhase = this.animationTime * 0.2;
    
    if (this.leftEye && this.rightEye) {
      if (isTurning) {
        // Look in direction of turn
        this.leftEye.rotation.y = Math.PI/6 + turnDirection * 0.2;
        this.rightEye.rotation.y = -Math.PI/6 + turnDirection * 0.2;
      } else {
        // Random-looking movements
        this.leftEye.rotation.y = Math.PI/6 + Math.sin(eyePhase) * 0.1;
        this.rightEye.rotation.y = -Math.PI/6 + Math.sin(eyePhase + 0.1) * 0.1;
      }
    }
    
    // Other fin animations
    if (this.dorsalFin) {
      this.dorsalFin.rotation.x = Math.sin(this.animationTime * 1.2) * 0.1;
    }
    
    if (this.analFin) {
      this.analFin.rotation.x = Math.sin(this.animationTime * 1.1 + 0.3) * 0.08;
    }
    
    if (this.leftPelvicFin) {
      this.leftPelvicFin.rotation.z = Math.sin(this.animationTime * 0.9) * 0.1;
    }
    
    if (this.rightPelvicFin) {
      this.rightPelvicFin.rotation.z = -Math.sin(this.animationTime * 0.9 + 0.2) * 0.1;
    }
  }
  
  /**
   * Disposes of all geometries and materials
   */
  public dispose(): void {
    // Dispose all meshes and materials
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
    
    // Dispose textures
    if (this.stripesTexture) {
      this.stripesTexture.dispose();
    }
    
    // Clear references
    this.bodyMesh = undefined;
    this.tailFin = undefined;
    this.leftPectoralFin = undefined;
    this.rightPectoralFin = undefined;
    this.dorsalFin = undefined;
    this.leftPelvicFin = undefined;
    this.rightPelvicFin = undefined;
    this.analFin = undefined;
    this.leftEye = undefined;
    this.rightEye = undefined;
    this.bodyMaterial = undefined;
    this.finMaterial = undefined;
    this.stripesTexture = undefined;
  }
}

// Helper function to lighten/darken a color
function shadeColor(color: string, percent: number): string {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.min(255, Math.max(0, R + Math.floor(256 * percent / 100)));
  G = Math.min(255, Math.max(0, G + Math.floor(256 * percent / 100)));
  B = Math.min(255, Math.max(0, B + Math.floor(256 * percent / 100)));

  return "#" + 
    (R.toString(16).padStart(2, '0')) +
    (G.toString(16).padStart(2, '0')) +
    (B.toString(16).padStart(2, '0'));
}