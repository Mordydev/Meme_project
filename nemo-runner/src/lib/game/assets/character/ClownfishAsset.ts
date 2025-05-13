// src/lib/game/assets/character/ClownfishAsset.ts
import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { PlayerSettings } from '../../config/gameConfig'; // For player visual settings

export class ClownfishAsset {
  private shaderManager: ShaderManager;
  public mesh!: THREE.Group; // Main group for all parts
  private playerConfig: Readonly<PlayerSettings>;
  private animationTime: number = 0;
  private bodyMaterial: THREE.Material | null = null;
  private finMaterial: THREE.Material | null = null;
  private stripeMaterial: THREE.Material | null = null;
  private eyeMaterial: THREE.Material | null = null;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.playerConfig = configSystem.get('player');
    this.createStandardMesh();
  }

  private createBodyGeometry(): THREE.BufferGeometry {
    // Start with a sphere and deform it for fish body shape
    const bodyRadius = 0.4; // Base radius
    const bodyLengthFactor = 1.8; // How elongated the body is
    const bodyHeightFactor = 1.1; // How tall vs wide
    const radialSegments = 24; // More segments for smoother curves
    const heightSegments = 16;

    const geometry = new THREE.SphereGeometry(bodyRadius, radialSegments, heightSegments);
    const positions = geometry.attributes.position.array as Float32Array;

    // Deform the sphere into an ovoid clownfish body shape
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      // Normalized position (from -1 to 1 in Z, assuming sphere radius 1 before scaling)
      const normalizedZ = z / bodyRadius; // z is along the length here

      // Tapering factor: stronger tapering at the tail (positive Z)
      let taper = 1.0 - Math.pow(Math.max(0, normalizedZ * 0.8 + 0.1), 2.5); // Stronger taper towards tail
      taper = Math.max(0.2, taper); // Prevent collapsing to a point

      // Bulge slightly in the middle
      const bulge = 1.0 + Math.sin(Math.PI * (1.0 - Math.abs(normalizedZ * 0.9))) * 0.15;
      
      positions[i] *= taper * bulge * 0.9; // Slightly slimmer X
      positions[i+1] *= taper * bulge * bodyHeightFactor; // Taller Y
      positions[i+2] *= bodyLengthFactor; // Elongate along Z
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); // Crucial for smooth shading
    return geometry;
  }

  private createFinGeometry(
    width: number, 
    height: number, 
    segmentsW: number = 3, 
    segmentsH: number = 4,
    shape: 'pectoral' | 'dorsal' | 'caudal' | 'pelvic' | 'anal' = 'pectoral'
  ): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(width, height, segmentsW, segmentsH);
    const positions = geometry.attributes.position.array as Float32Array;

    // Deform plane to a fin shape based on the specified type
    for (let i = 0; i < positions.length; i += 3) {
        // Y is 'height' of fin, X is 'width'
        const x = positions[i]; // -width/2 to width/2
        const y = positions[i+1]; // -height/2 to height/2

        // Normalized coordinates
        const nx = (x / width) + 0.5; // 0 to 1
        const ny = (y / height) + 0.5; // 0 to 1

        if (shape === 'pectoral' || shape === 'pelvic') {
            // Rounded fan shape for pectoral/pelvic
            let taper = Math.sin(ny * Math.PI); // Strongest taper at base/tip
            taper *= (1.0 - Math.pow(nx * 0.8, 2)); // Taper towards side edges
            positions[i] *= taper * Math.cos(ny * Math.PI * 0.1); // Slight curve
            if (ny < 0.2) positions[i] *= ny / 0.2; // Pinch the base
        } else if (shape === 'dorsal' || shape === 'anal') {
            // Taper height towards front and back, more towards front
            let taper = Math.sin(nx * Math.PI);
            if (nx < 0.3) taper *= (nx / 0.3); // Sharper front
            positions[i+1] *= taper * (1.0 - Math.pow(ny - 0.3, 2) * 0.5); // Curve the top edge
        } else if (shape === 'caudal') { // Tail fin
            let taperY = Math.sin(ny * Math.PI); // Taper top/bottom
            let taperX = 1.0 - Math.pow(Math.abs(nx - 0.2), 2.0); // Wider at base, tapers towards tip
            if (nx < 0.1) taperX = Math.max(0.3, nx / 0.1); // Ensure base is not zero
            positions[i] *= taperX * 1.2; // Make tail wider
            positions[i+1] *= taperY;
        }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  private createStandardMesh(): void {
    try {
      // Create materials with standard Three.js materials instead of shaders
      this.bodyMaterial = new THREE.MeshStandardMaterial({
        color: this.playerConfig.clownFishBaseColor,
        roughness: 0.3,
        metalness: 0.1, 
        emissive: 0xFF4400,
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide
      });
      
      this.finMaterial = new THREE.MeshStandardMaterial({
        color: 0xEE8822, // Slightly different orange for fins
        transparent: true,
        opacity: 0.9,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      this.stripeMaterial = new THREE.MeshStandardMaterial({
        color: this.playerConfig.clownFishStripeColor,
        roughness: 0.2,
        metalness: 0.0,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.1,
        side: THREE.DoubleSide
      });
      
      this.eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000, // Black pupil
        roughness: 0.0,
        metalness: 0.9,
        emissive: 0x000000,
        side: THREE.DoubleSide
      });

      // Create main group
      this.mesh = new THREE.Group();
      this.mesh.name = "ClownfishPlayer";

      // Create body
      const bodyGeom = this.createBodyGeometry();
      const body = new THREE.Mesh(bodyGeom, this.bodyMaterial);
      body.name = "ClownfishBody";
      this.mesh.add(body);

      // Add stripes using torus geometries
      this.addStripes();

      // Add fins
      this.addFins();

      // Add eyes
      this.addEyes();

      // Rotate the whole fish to swim along negative Z
      this.mesh.rotation.y = Math.PI;
      
      console.log("ClownfishAsset: Successfully created with standard materials");
    } catch (error) {
      console.error("ClownfishAsset: Error creating mesh:", error);
      // Create a minimal fallback if even the standard approach fails
      this.createMinimalFallback();
    }
  }

  private addStripes(): void {
    if (!this.mesh || !this.stripeMaterial) return;
    
    // Add three white stripes as torus segments
    // First stripe (near head)
    const stripe1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.1, 8, 24, Math.PI * 2),
      this.stripeMaterial
    );
    stripe1.name = "Stripe1";
    stripe1.position.set(0, 0, -0.25);
    stripe1.rotation.x = Math.PI / 2;
    stripe1.scale.set(1.2, 1, 0.7); // Flatten and widen
    this.mesh.add(stripe1);

    // Middle stripe
    const stripe2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.1, 8, 24, Math.PI * 2),
      this.stripeMaterial
    );
    stripe2.name = "Stripe2";
    stripe2.position.set(0, 0, 0.05);
    stripe2.rotation.x = Math.PI / 2;
    stripe2.scale.set(1.2, 1, 0.7);
    this.mesh.add(stripe2);
    
    // Rear stripe (near tail)
    const stripe3 = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.07, 8, 24, Math.PI * 2),
      this.stripeMaterial
    );
    stripe3.name = "Stripe3";
    stripe3.position.set(0, 0, 0.3);
    stripe3.rotation.x = Math.PI / 2;
    stripe3.scale.set(1.1, 1, 0.7);
    this.mesh.add(stripe3);
  }

  private addFins(): void {
    if (!this.mesh || !this.finMaterial) return;

    // Create all fins with the fin material
    const dorsalFinGeom = this.createFinGeometry(0.7, 0.35, 5, 3, 'dorsal');
    const dorsalFin = new THREE.Mesh(dorsalFinGeom, this.finMaterial);
    dorsalFin.name = "DorsalFin";
    dorsalFin.position.set(0, 0.3, -0.1); // On top, slightly back
    dorsalFin.rotation.x = Math.PI * 0.05; // Slight angle
    this.mesh.add(dorsalFin);

    const pectoralFinGeom = this.createFinGeometry(0.3, 0.25, 3, 3, 'pectoral');
    const leftPectoralFin = new THREE.Mesh(pectoralFinGeom, this.finMaterial);
    leftPectoralFin.name = "LeftPectoralFin";
    leftPectoralFin.position.set(-0.3, -0.05, -0.2); // Side, slightly forward and down
    leftPectoralFin.rotation.y = -Math.PI / 2; // Pointing outwards
    leftPectoralFin.rotation.z = -Math.PI / 6; // Angled slightly down
    this.mesh.add(leftPectoralFin);

    const rightPectoralFin = new THREE.Mesh(pectoralFinGeom.clone(), this.finMaterial);
    rightPectoralFin.name = "RightPectoralFin";
    rightPectoralFin.position.set(0.3, -0.05, -0.2);
    rightPectoralFin.rotation.y = Math.PI / 2;
    rightPectoralFin.rotation.z = -Math.PI / 6;
    this.mesh.add(rightPectoralFin);
    
    const tailFinGeom = this.createFinGeometry(0.3, 0.45, 4, 3, 'caudal');
    const tailFin = new THREE.Mesh(tailFinGeom, this.finMaterial);
    tailFin.name = "TailFin";
    tailFin.position.set(0, 0.05, 0.65); // At the back
    this.mesh.add(tailFin);

    // Add more fins for completeness
    const pelvicFinGeom = this.createFinGeometry(0.2, 0.15, 3, 2, 'pelvic');
    const leftPelvicFin = new THREE.Mesh(pelvicFinGeom, this.finMaterial);
    leftPelvicFin.name = "LeftPelvicFin";
    leftPelvicFin.position.set(-0.15, -0.3, -0.05);
    leftPelvicFin.rotation.y = -Math.PI / 2;
    leftPelvicFin.rotation.z = Math.PI / 8;
    this.mesh.add(leftPelvicFin);

    const rightPelvicFin = new THREE.Mesh(pelvicFinGeom.clone(), this.finMaterial);
    rightPelvicFin.name = "RightPelvicFin";
    rightPelvicFin.position.set(0.15, -0.3, -0.05);
    rightPelvicFin.rotation.y = Math.PI / 2;
    rightPelvicFin.rotation.z = Math.PI / 8;
    this.mesh.add(rightPelvicFin);

    const analFinGeom = this.createFinGeometry(0.4, 0.2, 4, 2, 'anal');
    const analFin = new THREE.Mesh(analFinGeom, this.finMaterial);
    analFin.name = "AnalFin";
    analFin.position.set(0, -0.3, 0.3);
    analFin.rotation.x = -Math.PI * 0.05;
    this.mesh.add(analFin);
  }

  private addEyes(): void {
    if (!this.mesh || !this.eyeMaterial) return;
    
    // Create eyes with black material
    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeometry, this.eyeMaterial);
    leftEye.name = "LeftEye";
    leftEye.position.set(-0.25, 0.08, -0.3);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry.clone(), this.eyeMaterial);
    rightEye.name = "RightEye";
    rightEye.position.set(0.25, 0.08, -0.3);
    this.mesh.add(rightEye);
    
    // Add eye highlights (small white spheres)
    const highlightGeometry = new THREE.SphereGeometry(0.02, 6, 6);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.name = "LeftEyeHighlight";
    leftHighlight.position.set(-0.22, 0.11, -0.28);
    this.mesh.add(leftHighlight);
    
    const rightHighlight = new THREE.Mesh(highlightGeometry.clone(), highlightMaterial);
    rightHighlight.name = "RightEyeHighlight";
    rightHighlight.position.set(0.22, 0.11, -0.28);
    this.mesh.add(rightHighlight);
  }

  private createMinimalFallback(): void {
    console.error("ClownfishAsset: Creating emergency minimal fallback");
    
    // Create a new group or clear existing one
    if (this.mesh) {
      while (this.mesh.children.length > 0) {
        const child = this.mesh.children[0];
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
        this.mesh.remove(child);
      }
    } else {
      this.mesh = new THREE.Group();
      this.mesh.name = "ClownfishPlayer";
    }

    // Use the most basic material possible
    const basicMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF8800,
      wireframe: false
    });

    // Create a very simple fish shape with a sphere
    const bodyGeom = new THREE.SphereGeometry(0.4, 16, 12);
    const body = new THREE.Mesh(bodyGeom, basicMaterial);
    body.name = "ClownfishBody";
    body.scale.set(1, 0.8, 1.8); // Flatten and elongate
    this.mesh.add(body);

    // Add a simple tail
    const tailGeom = new THREE.BoxGeometry(0.3, 0.4, 0.1);
    const tail = new THREE.Mesh(tailGeom, basicMaterial);
    tail.name = "TailFin";
    tail.position.set(0, 0, 0.65);
    this.mesh.add(tail);

    // Add simple eyes
    const eyeGeom = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.name = "LeftEye";
    leftEye.position.set(-0.25, 0.1, -0.3);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeom.clone(), eyeMat);
    rightEye.name = "RightEye";
    rightEye.position.set(0.25, 0.1, -0.3);
    this.mesh.add(rightEye);

    // Rotate to face -Z direction
    this.mesh.rotation.y = Math.PI;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  // Animation method called by PlayerController
  public updateAnimation(deltaTime: number, playerSpeed: number, isTurning: boolean, turnDirection: number): void {
    this.animationTime += deltaTime;
    const config = this.playerConfig;

    // Direct CPU-based animation for fins
    // Tail fin animation
    const tailFin = this.mesh.getObjectByName("TailFin") as THREE.Mesh;
    if (tailFin) {
      const frequency = config.tailFinFrequency; // Base frequency
      const amplitude = config.tailFinAmplitude; // Base amplitude
      const speedFactor = 1.0 + playerSpeed * 0.1;
      
      // Apply sine wave motion to tail with speed adjustment
      tailFin.rotation.y = Math.sin(this.animationTime * frequency * speedFactor) * amplitude * speedFactor;
      
      // If turning, add some bend to the tail
      if (isTurning) {
        tailFin.rotation.y += turnDirection * 0.2; // Add turning bias
      }
    }

    // Pectoral fins animation - flapping
    const leftPectoral = this.mesh.getObjectByName("LeftPectoralFin") as THREE.Mesh;
    if (leftPectoral) {
      leftPectoral.rotation.x = Math.sin(this.animationTime * config.pectoralFinFrequency * (1 + playerSpeed * 0.1)) 
                                 * config.pectoralFinAmplitude;
    }
    
    const rightPectoral = this.mesh.getObjectByName("RightPectoralFin") as THREE.Mesh;
    if (rightPectoral) {
      // Offset phase for right fin slightly for more natural look
      rightPectoral.rotation.x = Math.sin(this.animationTime * config.pectoralFinFrequency * (1 + playerSpeed * 0.1) + Math.PI * 0.1) 
                                  * config.pectoralFinAmplitude;
    }
    
    // Add subtle body rotation when turning
    if (isTurning && turnDirection !== 0) {
      const body = this.mesh.getObjectByName("ClownfishBody") as THREE.Mesh;
      if (body) {
        // Small rotation to emphasize turning
        body.rotation.y = turnDirection * 0.1;
      }
    }
  }

  public dispose(): void {
    // Properly dispose all geometries and materials
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
    
    // Dispose direct material references
    if (this.bodyMaterial) this.bodyMaterial.dispose();
    if (this.finMaterial) this.finMaterial.dispose();
    if (this.stripeMaterial) this.stripeMaterial.dispose();
    if (this.eyeMaterial) this.eyeMaterial.dispose();
    
    // Clear references
    this.bodyMaterial = null;
    this.finMaterial = null;
    this.stripeMaterial = null;
    this.eyeMaterial = null;
  }
}