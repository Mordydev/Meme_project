import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { PufferfishConfig } from '../../config/gameConfig';
import { IObstacleAsset } from '../IObstacleAsset';
import { AssetHelpers } from '../AssetHelpers';

// More formal state machine for better code readability
export enum PufferfishState {
  DEFLATED,
  INFLATING,
  INFLATED,
  DEFLATING
}

export class PufferfishAsset implements IObstacleAsset {
  public mesh!: THREE.Group;
  private collisionSphere!: THREE.Mesh;
  
  // Track inflation state using the state enum
  private currentState: PufferfishState = PufferfishState.DEFLATED;
  private inflationState: number = 0; // 0 to 1 (fully inflated)
  private inflationCooldownTimer: number = 0;

  // Store references to parts that need animation
  private body!: THREE.Mesh;
  private spikes!: THREE.Group;
  private leftEye!: THREE.Group;
  private rightEye!: THREE.Group;
  private mouth!: THREE.Mesh;
  private fins: THREE.Mesh[] = [];
  private tail!: THREE.Mesh;

  constructor(shaderManager?: ShaderManager) {
    // We accept shaderManager parameter for backward compatibility
    // but we don't use it in our implementation
  }

  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group
      this.mesh = new THREE.Group();
      this.mesh.name = "PufferfishObstacle_StdMat";

      // Get pufferfish config
      const config = this.config;
      const visualConf = config?.visuals || {};
      const spineVisualConf = config?.spineVisuals || visualConf;
      
      // Create the body with enhanced geometry and StandardMaterial
      this.createBody(config.baseRadius, visualConf);
      
      // Create spikes with enhanced geometry
      this.createSpikes(config.baseRadius, spineVisualConf);
      this.mesh.add(this.spikes);
      
      // Create eyes with StandardMaterial
      const eyeSize = config.baseRadius * 0.2;
      const eyePositionFactor = config.baseRadius * 0.7;
      
      // Left eye
      this.leftEye = this.createEye(eyeSize);
      this.leftEye.position.set(
        -eyePositionFactor * 0.7, 
        eyePositionFactor * 0.5, 
        -eyePositionFactor * 0.9
      );
      this.mesh.add(this.leftEye);
      
      // Right eye
      this.rightEye = this.createEye(eyeSize);
      this.rightEye.position.set(
        eyePositionFactor * 0.7, 
        eyePositionFactor * 0.5, 
        -eyePositionFactor * 0.9
      );
      this.mesh.add(this.rightEye);
      
      // Create a small mouth with enhanced geometry
      this.mouth = this.createMouth(config.baseRadius * 0.3);
      this.mouth.position.set(0, -eyePositionFactor * 0.3, -eyePositionFactor * 0.9);
      this.mouth.rotation.x = Math.PI / 6; // Slight downward angle
      this.mesh.add(this.mouth);

      // Create fins with StandardMaterial
      this.fins = [];
      
      // Top fin
      const topFin = this.createFin(config.baseRadius * 0.5, visualConf);
      topFin.position.set(0, config.baseRadius * 0.7, 0);
      topFin.rotation.z = Math.PI / 2;
      this.fins.push(topFin);
      this.mesh.add(topFin);

      // Left fin
      const leftFin = this.createFin(config.baseRadius * 0.4, visualConf);
      leftFin.position.set(-config.baseRadius * 0.8, 0, config.baseRadius * 0.2);
      leftFin.rotation.y = Math.PI / 4;
      this.fins.push(leftFin);
      this.mesh.add(leftFin);

      // Right fin
      const rightFin = this.createFin(config.baseRadius * 0.4, visualConf);
      rightFin.position.set(config.baseRadius * 0.8, 0, config.baseRadius * 0.2);
      rightFin.rotation.y = -Math.PI / 4;
      this.fins.push(rightFin);
      this.mesh.add(rightFin);

      // Create tail with StandardMaterial
      this.tail = this.createTail(config.baseRadius * 0.5, visualConf);
      this.tail.position.set(0, 0, config.baseRadius * 0.9);
      this.mesh.add(this.tail);

      // Create collision sphere
      this.createCollisionSphere(config.baseRadius);
      
      // Set userData for the mesh
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'pufferfish',
        assetInstance: this,
        isDangerous: this.isDangerous(),
        // Store state info in userData for easier access in update loops
        inflationState: this.inflationState,
        isInflated: this.getIsInflated(),
        detectionRadius: config.detectionRadius
      };
      
      return this.mesh;
    } catch (error) {
      console.error("PufferfishAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }
  
  /**
   * Creates the body with Pixar-style enhanced geometry and StandardMaterial
   */
  private createBody(radius: number, visualConf: any): void {
    // Create higher-detail sphere for the body with Pixar-style proportions
    const bodyGeometry = new THREE.SphereGeometry(
      radius,  // Base radius
      36,      // Width segments (increased for smoother appearance)
      28       // Height segments (increased for smoother appearance)
    );
    
    // Apply sophisticated noise to create a more organic, Pixar-style shape
    this.applyPixarStyleBodyDeformation(bodyGeometry, radius);
    
    // Create StandardMaterial with enhanced Pixar-style properties
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xFFA500),
      emissive: new THREE.Color(visualConf.emissiveColor || 0xCC8400),
      emissiveIntensity: visualConf.emissiveIntensity || 0.2,
      roughness: visualConf.roughness || 0.3,      // Lower for more polished fish scales
      metalness: visualConf.metalness || 0.6,      // Higher for better shimmer
      clearcoat: visualConf.clearcoat || 0.4,      // Add clearcoat for underwater sheen
      clearcoatRoughness: visualConf.clearcoatRoughness || 0.2  // Slightly rough clearcoat
    });
    
    // Create and add the body mesh
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.name = "PufferfishBody";
    
    // Slightly scale the body to achieve the characteristic Pixar "squash" shape
    // Slightly wider than tall for more appealing proportions
    this.body.scale.set(1.1, 0.95, 1.05);
    
    this.mesh.add(this.body);
  }
  
  /**
   * Applies sophisticated deformation to create a more organic Pixar-style pufferfish body
   * This creates a less perfectly spherical shape with subtle bulges and character
   */
  private applyPixarStyleBodyDeformation(geometry: THREE.BufferGeometry, radius: number): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position.array as Float32Array;
    const count = geometry.attributes.position.count;
    
    // Apply different deformation patterns for a more organic, characterful shape
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      // Calculate normalized position for directional effects
      const nx = x / radius;
      const ny = y / radius;
      const nz = z / radius;
      
      // Calculate distance from center (0-1)
      const distFromCenter = Math.sqrt(nx*nx + ny*ny + nz*nz);
      
      // Skip points too far from the surface for stability
      if (Math.abs(distFromCenter - 1.0) > 0.2) continue;
      
      // 1. Slight forward bulge (in -z direction) for Pixar-style "face forward" shape
      if (nz < -0.2) {
        // Forward area gets a slight extension
        const bulge = 0.05 * Math.max(0, -(nz + 0.2)) * radius;
        positions[idx + 2] -= bulge;
      }
      
      // 2. Subtle bulges for more organic look using noise functions
      // Use different frequencies for varied surface detail
      const noise1 = Math.sin(nx * 8 + ny * 7 + nz * 6) * 0.01;
      const noise2 = Math.cos(nx * 5 + ny * 9 + nz * 3) * 0.015;
      const noise3 = Math.sin(nx * 3 + ny * 4 + nz * 10) * 0.005;
      
      // Combine noise patterns with distance-based falloff
      const noiseFactor = (noise1 + noise2 + noise3) * radius;
      
      // Apply noise-based displacement
      positions[idx] += noiseFactor * nx;
      positions[idx + 1] += noiseFactor * ny;
      positions[idx + 2] += noiseFactor * nz;
      
      // 3. Add characteristic Pixar slightly bottom-heavy shape
      if (ny < 0 && distFromCenter > 0.8) {
        // Subtle expansion at bottom for stable/grounded appearance
        const bottomBulge = 0.04 * Math.max(0, -ny) * radius;
        positions[idx + 1] -= bottomBulge;
      }
      
      // 4. Add subtle asymmetry for more natural, less perfect look
      // Right side (positive x) slightly bigger than left
      if (nx > 0.4) {
        positions[idx] += 0.02 * radius;
      }
    }
    
    // Update geometry after modifications
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Ensure we have a valid bounding sphere
    AssetHelpers.computeCorrectBoundingSphere(geometry);
  }
  
  /**
   * Creates a collision sphere for the pufferfish with improved error handling
   * and NaN prevention
   */
  private createCollisionSphere(radius: number): void {
    try {
      // Create slightly larger collision sphere than visual size
      const collisionRadius = radius * 1.2;
      const collisionGeometry = new THREE.SphereGeometry(collisionRadius, 8, 8);
      
      // Initialize with wireframe for debugging visibility but toggle to false for production
      const debuggerActive = window.location.href.includes('debug=true');
      const collisionMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        wireframe: true,
        visible: debuggerActive // Visible only in debug mode
      });
      
      this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
      this.collisionSphere.name = "PufferfishCollisionSphere";
      
      // Use AssetHelpers to ensure a valid bounding sphere is computed
      // This handles NaN values correctly
      AssetHelpers.computeCorrectBoundingSphere(collisionGeometry);
      
      // Store the original radius in userData for scaling calculations
      this.collisionSphere.userData = {
        originalRadius: collisionRadius,
        isDangerous: false,
        purpose: 'collision'
      };
      
      // Add to mesh
      this.mesh.add(this.collisionSphere);
      
      // Set initial transform
      this.collisionSphere.updateMatrix();
      this.collisionSphere.updateMatrixWorld(true);
      
      console.log(`PufferfishAsset: Created collision sphere with radius ${collisionRadius}`);
    } catch (error) {
      console.error("Error creating collision sphere:", error);
      // Create a minimal emergency fallback collision sphere
      const emergencyGeometry = new THREE.SphereGeometry(radius, 4, 4);
      const emergencyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000, 
        visible: false 
      });
      
      this.collisionSphere = new THREE.Mesh(emergencyGeometry, emergencyMaterial);
      this.collisionSphere.name = "PufferfishEmergencyCollisionSphere";
      this.mesh.add(this.collisionSphere);
      
      // Ensure it has a valid bounding sphere
      emergencyGeometry.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(0, 0, 0),
        radius
      );
    }
  }
  
  /**
   * Creates a minimal fallback pufferfish in case of errors
   */
  private createMinimalFallback(): void {
    console.warn("PufferfishAsset: Creating minimal fallback model");
    
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "PufferfishFallback";
    
    // Create simple body
    const bodyGeometry = new THREE.SphereGeometry(0.35, 16, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFA500,           // Orange
      roughness: 0.3,            // Smoother for fish scales
      metalness: 0.6,            // Higher for better shimmer
      emissive: 0xCC8400,        // Emissive orange
      emissiveIntensity: 0.2,    // Moderate glow
      clearcoat: 0.4,            // Add clearcoat for underwater sheen
      clearcoatRoughness: 0.2    // Slightly rough clearcoat
    });
    
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(this.body);
    
    // Create simple spikes group (empty for now)
    this.spikes = new THREE.Group();
    this.mesh.add(this.spikes);
    
    // Create collision sphere
    const collisionGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionSphere = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.mesh.add(this.collisionSphere);
    
    // Set userData for identification
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'pufferfish',
      assetInstance: this,
      isDangerous: false
    };
  }
  
  /**
   * Applies noise to a geometry to make it less perfect and more organic
   */
  private applyNoiseToGeometry(geometry: THREE.BufferGeometry, amount: number): void {
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Apply random displacement to each vertex
      positions[i] += (Math.random() - 0.5) * amount;
      positions[i + 1] += (Math.random() - 0.5) * amount;
      positions[i + 2] += (Math.random() - 0.5) * amount;
    }
    
    // Update geometry
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private createEye(size: number): THREE.Group {
    const eyeGroup = new THREE.Group();
    eyeGroup.name = "PufferfishEye";
    
    // White part (sclera) with enhanced Pixar-style StandardMaterial
    const eyeWhiteGeometry = new THREE.SphereGeometry(size, 16, 12);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      roughness: 0.1,            // Very smooth for wet eye look
      metalness: 0.2,            // Slight metalness for shine
      clearcoat: 0.6,            // Strong clearcoat for eye moisture
      clearcoatRoughness: 0.1    // Smooth clearcoat
    });
    
    const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    eyeWhite.name = "EyeWhite";
    eyeGroup.add(eyeWhite);
    
    // Black part (pupil) with enhanced Pixar-style StandardMaterial
    const pupilGeometry = new THREE.SphereGeometry(size * 0.5, 12, 10);
    const pupilMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0.1,          // Very smooth surface
      metalness: 0.7,          // High metalness for reflective quality
      clearcoat: 0.8,          // Strong clearcoat for eye shine
      clearcoatRoughness: 0.1  // Smooth clearcoat
    });
    
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.name = "Pupil";
    pupil.position.z = -size * 0.6;
    eyeGroup.add(pupil);
    
    // Add highlight (small white dot) with enhanced Pixar-style StandardMaterial
    const highlightGeometry = new THREE.SphereGeometry(size * 0.15, 8, 6);
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.0,            // Perfectly smooth
      metalness: 0.9,            // Very high metalness for bright specular
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.7,    // Strong glow
      clearcoat: 1.0,            // Maximum clearcoat
      clearcoatRoughness: 0.0    // Perfectly smooth clearcoat
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.name = "EyeHighlight";
    highlight.position.set(size * 0.15, size * 0.15, -size * 0.3);
    eyeGroup.add(highlight);
    
    return eyeGroup;
  }

  private createMouth(size: number): THREE.Mesh {
    // Create a more expressive Pixar-style mouth with character
    // We'll use a custom shape with curves for more expressiveness
    const mouthShape = new THREE.Shape();
    
    // Create a more expressive, slightly asymmetric smile curve typical of Pixar characters
    // Start from a point on the right (from the fish's perspective)
    mouthShape.moveTo(size * 0.8, size * 0.1);
    
    // Right corner of mouth is slightly higher than left (subtle asymmetry)
    mouthShape.bezierCurveTo(
      size * 0.6, -size * 0.3,   // First control point - pull down and in 
      size * 0.3, -size * 0.5,   // Second control point - create bottom curve
      0, -size * 0.45            // Bottom center point - slightly asymmetric
    );
    
    // Continue curve to left side
    mouthShape.bezierCurveTo(
      -size * 0.3, -size * 0.5,  // First control point
      -size * 0.6, -size * 0.3,  // Second control point
      -size * 0.8, size * 0.05   // Left end point (slightly lower than right)
    );
    
    // Create thickness for the mouth with the back curve
    // Back curve (inner lip) - slightly smaller
    mouthShape.bezierCurveTo(
      -size * 0.6, -size * 0.05, // First control point
      -size * 0.3, -size * 0.15, // Second control point
      0, -size * 0.15           // Inner center point
    );
    
    // Complete the shape
    mouthShape.bezierCurveTo(
      size * 0.3, -size * 0.15,  // First control point
      size * 0.6, -size * 0.05,  // Second control point
      size * 0.8, size * 0.1     // Back to start
    );
    
    // Extrude the shape for depth - typical Pixar mouth has some 3D form
    const extrudeSettings = {
      depth: size * 0.3,
      bevelEnabled: true,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.05,
      bevelSegments: 4,
      curveSegments: 12
    };
    
    const mouthGeometry = new THREE.ExtrudeGeometry(mouthShape, extrudeSettings);
    
    // Create a gradient material effect by using vertex colors
    const colors = new Float32Array(mouthGeometry.attributes.position.count * 3);
    
    // Add vertex colors for depth effect - darker inside mouth
    const innerColor = new THREE.Color(0x1A0000);  // Very dark red-black
    const outerColor = new THREE.Color(0x333333);  // Dark gray
    
    // Apply colors to create a gradient effect
    for (let i = 0; i < mouthGeometry.attributes.position.count; i++) {
      const z = mouthGeometry.attributes.position.getZ(i);
      
      // Normalize depth position (0-1)
      const depthFactor = Math.max(0, Math.min(1, (z + size * 0.3) / (size * 0.3)));
      
      // Interpolate color
      const color = new THREE.Color().lerpColors(innerColor, outerColor, depthFactor);
      
      // Set color components
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    // Add color attribute to geometry
    mouthGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Use enhanced Pixar-style StandardMaterial for the mouth with vertex colors
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
      vertexColors: true,         // Use the color gradient we defined
      roughness: 0.9,             // Very rough interior
      metalness: 0.01,            // Almost no metalness for organic look
      emissive: 0x110000,         // Very subtle red glow 
      emissiveIntensity: 0.15,    // Low intensity
      clearcoat: 0.2,             // Slight clearcoat for wet appearance
      clearcoatRoughness: 0.8     // Very rough clearcoat for organic interior
    });
    
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.name = "PufferfishMouth";
    
    // Rotate slightly for better positioning
    mouth.rotation.x = -Math.PI / 6; // Angle the mouth to face slightly downward
    
    return mouth;
  }

  private createFin(size: number, visualConf: any): THREE.Mesh {
    // Create a more sophisticated Pixar-style fin shape with subtle flowing curves
    const finShape = new THREE.Shape();
    
    // Pixar-style fins have more exaggerated form and character
    // Start at the base of the fin
    finShape.moveTo(0, 0);
    
    // Curve from base to tip with more dynamic, flowing shape
    // First curve up and out
    finShape.bezierCurveTo(
      size * 0.4, size * 0.1,    // Control point 1
      size * 0.7, size * 0.3,    // Control point 2
      size * 0.9, size * 0.5     // End point - extended tip
    );
    
    // Create tip of fin with subtle point
    finShape.bezierCurveTo(
      size * 0.95, size * 0.6,   // Control point 1
      size * 0.9, size * 0.7,    // Control point 2
      size * 0.8, size * 0.8     // The tip of the fin
    );
    
    // Curve back down with flowing, organic shape
    finShape.bezierCurveTo(
      size * 0.7, size * 0.9,    // Control point 1
      size * 0.5, size * 0.8,    // Control point 2
      size * 0.3, size * 0.6     // End point
    );
    
    // Complete the curve back to the base
    finShape.bezierCurveTo(
      size * 0.2, size * 0.4,    // Control point 1
      size * 0.1, size * 0.2,    // Control point 2
      0, 0                       // Back to start
    );
    
    // Extrude with more pronounced thickness for Pixar-style dimension
    const extrudeSettings = {
      depth: size * 0.08,                // More substantial thickness
      bevelEnabled: true,
      bevelThickness: size * 0.03,       // More pronounced bevel
      bevelSize: size * 0.03,
      bevelSegments: 4,                  // Smoother bevel
      curveSegments: 12                  // Smoother curves
    };
    
    const finGeometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    
    // Apply subtle organic deformation for more natural fin flow
    this.applyFinDeformation(finGeometry, size);
    
    // Use enhanced Pixar-style StandardMaterial for fins
    const finMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(visualConf.mainColor || 0xFFA500).multiplyScalar(1.1), // Slightly lighter
      emissive: new THREE.Color(visualConf.emissiveColor || 0xCC8400).multiplyScalar(0.9),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.2) * 0.8,
      roughness: (visualConf.roughness || 0.3) * 1.2,         // Slightly rougher than body
      metalness: (visualConf.metalness || 0.6) * 0.7,         // Less metallic than body
      clearcoat: (visualConf.clearcoat || 0.4) * 0.75,        // Less clearcoat than body
      clearcoatRoughness: (visualConf.clearcoatRoughness || 0.2) * 1.5, // Rougher clearcoat for fins
      side: THREE.DoubleSide,                                 // Render both sides
      transparent: true,                                       // Enable transparency
      opacity: 0.95                                            // Subtle transparency at edges
    });
    
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.name = "PufferfishFin";
    
    return fin;
  }
  
  /**
   * Applies subtle deformation to the fin geometry for a more organic, flowing look
   */
  private applyFinDeformation(geometry: THREE.BufferGeometry, size: number): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position.array as Float32Array;
    const count = geometry.attributes.position.count;
    
    // Apply gentle warping for more organic fin shape
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      // Calculate distance from base (0,0,z)
      const distFromBase = Math.sqrt(x*x + y*y);
      const normalizedDist = distFromBase / size;
      
      // Apply subtle curl/bend to the fin - more pronounced toward the tip
      if (normalizedDist > 0.3) {
        // Slight bend along z-axis, increasing toward tip
        const bendFactor = Math.pow(normalizedDist, 2) * 0.03 * size;
        positions[idx + 2] += bendFactor;
        
        // Subtle wave pattern along the fin surface
        const waveFactor = Math.sin(y * 10 / size) * 0.01 * size * normalizedDist;
        positions[idx] += waveFactor;
      }
      
      // Thin out the edges slightly for more delicate appearance
      if (z > size * 0.04 || z < -size * 0.04) {
        const thinFactor = 0.95; // Subtle thinning
        positions[idx] *= thinFactor;
        positions[idx + 1] *= thinFactor;
      }
    }
    
    // Update geometry after modifications
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Ensure valid bounding sphere
    AssetHelpers.computeCorrectBoundingSphere(geometry);
  }

  private createTail(size: number, visualConf: any): THREE.Mesh {
    // Create a more sophisticated Pixar-style tail with exaggerated curves and character
    const tailShape = new THREE.Shape();
    
    // Pixar-style tails have more pronounced, expressive curves
    tailShape.moveTo(0, 0);
    
    // Top lobe of tail - more dramatic sweep with subtle point at end
    tailShape.bezierCurveTo(
      size * 0.3, size * 0.6,    // Control point 1 - higher curve
      size * 0.8, size * 0.8,    // Control point 2 - extended reach
      size * 1.2, size * 0.3     // End point - more extended with subtle point
    );
    
    // Central notch - more pronounced for Pixar-style definition
    tailShape.bezierCurveTo(
      size * 1.0, size * 0.1,    // Control point 1
      size * 1.0, -size * 0.1,   // Control point 2
      size * 1.2, -size * 0.3    // End point - matches top for symmetry
    );
    
    // Bottom lobe of tail - matching the top for balanced appearance
    tailShape.bezierCurveTo(
      size * 0.8, -size * 0.8,   // Control point 1
      size * 0.3, -size * 0.6,   // Control point 2
      0, 0                       // Back to start
    );
    
    // Extrude with enhanced settings for Pixar-style dimension
    const extrudeSettings = {
      depth: size * 0.08,                // Thicker for more substantial feel
      bevelEnabled: true,
      bevelThickness: size * 0.03,       // More pronounced bevel
      bevelSize: size * 0.03,            // Larger bevel
      bevelSegments: 4,                  // Smoother bevel
      curveSegments: 12                  // Smoother curves
    };
    
    const tailGeometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    
    // Apply Pixar-style organic deformation to tail
    this.applyTailDeformation(tailGeometry, size);
    
    // Use enhanced Pixar-style StandardMaterial for tail
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xFFA500).multiplyScalar(1.1), // Slightly lighter
      emissive: new THREE.Color(visualConf.emissiveColor || 0xCC8400).multiplyScalar(0.9),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.2) * 0.8,
      roughness: (visualConf.roughness || 0.3) * 1.2,         // Slightly rougher than body
      metalness: (visualConf.metalness || 0.6) * 0.7,         // Less metallic than body
      clearcoat: (visualConf.clearcoat || 0.4) * 0.75,        // Less clearcoat than body
      clearcoatRoughness: (visualConf.clearcoatRoughness || 0.2) * 1.5, // Rougher clearcoat
      side: THREE.DoubleSide,                                 // Render both sides
      transparent: true,                                       // Enable transparency
      opacity: 0.95                                            // Subtle transparency at edges
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.name = "PufferfishTail";
    
    return tail;
  }
  
  /**
   * Applies subtle deformation to the tail geometry for a more organic, Pixar-style look
   */
  private applyTailDeformation(geometry: THREE.BufferGeometry, size: number): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position.array as Float32Array;
    const count = geometry.attributes.position.count;
    
    // Apply gentle warping for more organic tail shape
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      // Calculate distance from base (0,0,z) and normalized tail length
      const distFromBase = Math.sqrt(x*x + y*y);
      const normalizedDist = distFromBase / (size * 1.2); // Account for our longer tail
      
      // Apply subtle thinning effect toward tips for more delicate tail ends
      if (normalizedDist > 0.7) {
        // Make ends thinner
        const thinningFactor = 1.0 - ((normalizedDist - 0.7) / 0.3) * 0.5; // Gradually thin to 50% at tips
        positions[idx + 2] *= thinningFactor;
      }
      
      // Add subtle curvature to the tail - more pronounced toward ends
      if (normalizedDist > 0.4) {
        // Slight bend in z direction for tail flutter effect
        const bendFactor = Math.pow(normalizedDist - 0.4, 2) * 0.04 * size;
        
        // Apply bend with a sine wave pattern based on y-position for natural shape
        const bendPattern = Math.sin(y * 5 / size);
        
        // Apply wave along the z axis with varying amplitude
        positions[idx + 2] += bendFactor * bendPattern;
      }
      
      // Create subtle rib-like texture on the tail for organic detail
      if (normalizedDist > 0.3) {
        const ribPattern = Math.sin(y * 20 / size) * 0.005 * size * normalizedDist;
        positions[idx] += ribPattern;
      }
    }
    
    // Update geometry after modifications
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Ensure valid bounding sphere
    AssetHelpers.computeCorrectBoundingSphere(geometry);
  }

  private createSpikes(radius: number, visualConf: any): void {
    // Create a group for spikes with Pixar-style distribution and variation
    this.spikes = new THREE.Group();
    this.spikes.name = "PufferfishSpikes";
    
    // The number of spikes will depend on the size - adjust for Pixar-style balance between detail and clarity
    // Pixar style often uses fewer, more distinct elements rather than too many small details
    const numSpikes = Math.floor(radius * 55); // Slightly reduced count for better visual clarity
    
    // Create enhanced Pixar-style StandardMaterial for spikes with danger signaling
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xD2691E),      // Chocolate brown
      emissive: new THREE.Color(visualConf.emissiveColor || 0xFF4500), // Orange-red for danger
      emissiveIntensity: visualConf.emissiveIntensity || 0.1,        // Low initial glow, will increase when dangerous
      roughness: visualConf.roughness || 0.4,                        // Medium-low roughness
      metalness: visualConf.metalness || 0.3,                        // Medium-low metalness
      clearcoat: visualConf.clearcoat || 0.6,                        // Strong clearcoat for sharpness
      clearcoatRoughness: visualConf.clearcoatRoughness || 0.1       // Smooth clearcoat for shine
    });
    
    // Create spikes distributed with Pixar-style variation and character
    for (let i = 0; i < numSpikes; i++) {
      // Use modified fibonacci sphere distribution for even base spacing
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numSpikes); // +0.5 offset for better distribution
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      // Convert to cartesian coordinates on the sphere
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Apply Pixar-style variation to spike positions - slight randomization
      // This creates a more natural, organic distribution characteristic of Pixar style
      const posVariation = radius * 0.05; // 5% of radius for subtle position variation
      const xOffset = (Math.random() - 0.5) * posVariation;
      const yOffset = (Math.random() - 0.5) * posVariation;
      const zOffset = (Math.random() - 0.5) * posVariation;
      
      // Create a spike with enhanced geometry and Pixar-style variation
      // Vary heights for more natural, characterful appearance
      const heightVariation = 0.8 + Math.random() * 0.4; // 80% to 120% variation
      const spikeHeight = radius * 0.35 * heightVariation;
      
      // Vary thickness for more organic look
      const thicknessVariation = 0.85 + Math.random() * 0.3; // 85% to 115% variation
      const spikeThickness = radius * 0.04 * thicknessVariation;
      
      // Use a cone with more segments for smoother appearance
      // Pixar style often uses cleaner, smoother forms with subtle details
      const spikeGeometry = new THREE.ConeGeometry(
        spikeThickness,  // Base radius with variation
        spikeHeight,     // Height with variation
        6,               // Radial segments - enough for smoothness without excess
        2                // Height segments
      );
      
      // Apply subtle curved bend to spikes for more organic Pixar-style look
      this.applySpikeDeformation(spikeGeometry, spikeHeight, radius);
      
      // Vary spike colors slightly for visual richness - typical Pixar technique
      const colorVariation = new THREE.Color().setHSL(
        Math.random() * 0.05 + 0.05,  // Slight hue variation (oranges/browns)
        0.5 + Math.random() * 0.2,    // Medium-high saturation
        0.35 + Math.random() * 0.15   // Controlled lightness variation
      );
      
      // Clone material and apply subtle color variation
      const spikeMat = spikeMaterial.clone();
      
      // Only apply color variation to specific property for more consistent look
      if (spikeMat instanceof THREE.MeshStandardMaterial) {
        // Mix base color with variation for subtle effect
        const baseColor = new THREE.Color(visualConf.mainColor || 0xD2691E);
        spikeMat.color.copy(baseColor).lerp(colorVariation, 0.3);
      }
      
      const spike = new THREE.Mesh(spikeGeometry, spikeMat);
      spike.name = `Spike_${i}`;
      
      // Position at the calculated point with variations
      spike.position.set(x + xOffset, y + yOffset, z + zOffset);
      
      // Orient spike to point outward from center
      const direction = new THREE.Vector3(x, y, z).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(normal, direction);
      spike.setRotationFromQuaternion(quaternion);
      
      // Apply slight additional random rotation for more natural look
      const randomRotation = new THREE.Euler(
        (Math.random() - 0.5) * 0.2, // Slight random tilt in each axis
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      
      const randomQuaternion = new THREE.Quaternion().setFromEuler(randomRotation);
      spike.quaternion.premultiply(randomQuaternion);
      
      // Initial scale to make spikes smaller when not inflated
      // Pixar style often uses zero to fully-grown animations for emphasis
      spike.scale.set(0.3, 0.3, 0.3);
      
      this.spikes.add(spike);
    }
  }
  
  /**
   * Applies subtle deformation to spike geometry for more organic, Pixar-style look
   */
  private applySpikeDeformation(geometry: THREE.BufferGeometry, height: number, radius: number): void {
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position.array as Float32Array;
    const count = geometry.attributes.position.count;
    
    // Apply gentle curved shape to spikes - Pixar style often uses subtle arcs rather than straight lines
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      // Only apply to non-center vertices (skip the cone tip and center of base)
      if ((x !== 0 || z !== 0) && y !== 0 && y !== height) {
        // Calculate height ratio (0 at base, 1 at tip)
        const heightRatio = y / height;
        
        // Apply subtle curvature - more pronounced in middle section
        // This creates the characteristic Pixar subtle arc for pointed elements
        const curveFactor = Math.sin(heightRatio * Math.PI) * radius * 0.02;
        
        // Apply curve in random but consistent direction for each spike
        const angle = Math.atan2(z, x);
        positions[idx] += Math.cos(angle) * curveFactor;
        positions[idx + 2] += Math.sin(angle) * curveFactor;
        
        // Add very subtle tapering toward tip for more elegant shape
        if (heightRatio > 0.7) {
          const taperFactor = 0.95 + 0.05 * (1.0 - heightRatio); // Subtle 5% tapering at tip
          positions[idx] *= taperFactor;
          positions[idx + 2] *= taperFactor;
        }
      }
    }
    
    // Update geometry after modifications
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Ensure valid bounding sphere
    AssetHelpers.computeCorrectBoundingSphere(geometry);
  }

  /**
   * Updates the pufferfish animation state based on player proximity
   * @param deltaTime Time in seconds since last update
   * @param playerPosition The player's current position (as THREE.Vector3)
   */
  public updateAnimation(deltaTime: number, playerPosition?: any): void {
    // Skip if mesh not initialized
    if (!this.mesh || !this.body || !this.spikes) return;

    const config = this.config;

    // Update cooldown timer if active
    if (this.inflationCooldownTimer > 0) {
      this.inflationCooldownTimer -= deltaTime;
    }

    // Check player proximity (if provided)
    let shouldInflate = false;
    
    if (playerPosition) {
      try {
        // Ensure playerPosition is a THREE.Vector3 for distanceTo to work
        let playerPos: THREE.Vector3;
        
        if (playerPosition instanceof THREE.Vector3) {
          playerPos = playerPosition;
        } else if (typeof playerPosition === 'object' && 
                  playerPosition !== null &&
                  typeof playerPosition.x === 'number' && !isNaN(playerPosition.x) &&
                  typeof playerPosition.y === 'number' && !isNaN(playerPosition.y) &&
                  typeof playerPosition.z === 'number' && !isNaN(playerPosition.z)) {
          // Create a Vector3 from a position-like object with valid number values
          playerPos = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
        } else {
          // Default position as fallback if invalid - don't log warning during normal gameplay
          playerPos = new THREE.Vector3(0, 0, this.mesh ? this.mesh.position.z - 5 : 0);
        }
        
        // Calculate distance
        const distanceToPlayer = playerPos.distanceTo(this.mesh.position);
        shouldInflate = distanceToPlayer < config.detectionRadius;
      } catch (error) {
        // Fail gracefully without crashing
        shouldInflate = false;
      }
    }

    // Determine inflation state using state machine
    if (shouldInflate && this.currentState === PufferfishState.DEFLATED && this.inflationCooldownTimer <= 0) {
      // Start inflating if deflated and no cooldown
      this.currentState = PufferfishState.INFLATING;
    }
    else if (shouldInflate && this.currentState === PufferfishState.DEFLATING) {
      // If deflating but player returns to proximity, go back to inflating
      this.currentState = PufferfishState.INFLATING;
    }
    else if (!shouldInflate && this.currentState === PufferfishState.INFLATED) {
      // Start deflating if player moves away and we're inflated
      this.currentState = PufferfishState.DEFLATING;
    }
    else if (!shouldInflate && this.currentState === PufferfishState.INFLATING) {
      // If still inflating but player moves away, start deflating
      this.currentState = PufferfishState.DEFLATING;
    }

    // Update inflation state based on current state
    if (this.currentState === PufferfishState.INFLATING) {
      this.inflationState += deltaTime / config.inflationDuration;

      if (this.inflationState >= 1) {
        this.inflationState = 1;
        this.currentState = PufferfishState.INFLATED;
      }
    }
    else if (this.currentState === PufferfishState.DEFLATING) {
      this.inflationState -= deltaTime / config.deflationDuration;

      if (this.inflationState <= 0) {
        this.inflationState = 0;
        this.currentState = PufferfishState.DEFLATED;
        this.inflationCooldownTimer = config.inflationCooldown;
      }
    }

    // Apply inflation effect
    this.applyInflation();

    // Store current state in userData for easy access from collision system
    this.mesh.userData.inflationState = this.inflationState;
    this.mesh.userData.currentState = this.currentState;
    this.mesh.userData.isDangerous = this.isDangerous();
  }

  /**
   * Applies the current inflation state to the pufferfish mesh
   * With improved collision detection synchronization
   */
  private applyInflation(): void {
    if (!this.body || !this.spikes || !this.collisionSphere) return;
    
    const config = this.config;
    
    // Calculate current radius based on inflation state
    const currentRadius = THREE.MathUtils.lerp(
      config.baseRadius,
      config.inflatedRadius,
      this.inflationState
    );
    
    // Scale body
    const bodyScaleFactor = currentRadius / config.baseRadius;
    this.body.scale.set(bodyScaleFactor, bodyScaleFactor, bodyScaleFactor);
    
    // Scale and show spikes
    const spikeScaleFactor = THREE.MathUtils.lerp(0.3, 1.0, this.inflationState);
    this.spikes.children.forEach(spike => {
      if (spike instanceof THREE.Mesh) {
        spike.scale.set(spikeScaleFactor, spikeScaleFactor, spikeScaleFactor);
      }
    });
    
    // Update collision sphere size based on inflation state
    // Use a modified scale factor based on our isDangerous() logic
    let collisionScaleFactor;
    
    // Make collision sphere match visual danger state by scaling it
    // appropriately based on our danger thresholds
    if (this.isDangerous()) {
      // When dangerous, have the collision sphere match the visual size
      collisionScaleFactor = currentRadius * 1.2 / (config.baseRadius * 1.2);
    } else {
      // When not dangerous, keep the collision sphere small regardless of visual size
      // Use a very small factor so player can pass through it
      collisionScaleFactor = 0.1; // Essentially non-collidable
    }
    
    // Set collision sphere scale and mark it for update
    this.collisionSphere.scale.set(collisionScaleFactor, collisionScaleFactor, collisionScaleFactor);
    this.collisionSphere.updateMatrix();
    this.collisionSphere.updateMatrixWorld(true);
    
    // Regenerate the bounding sphere to ensure it's up to date with the new scale
    const geometry = this.collisionSphere.geometry;
    if (geometry && !isNaN(collisionScaleFactor)) {
      try {
        // Force recomputation of bounding sphere to match the scaled sphere
        if (geometry.boundingSphere) {
          // Scale the existing bounding sphere if it exists
          const originalRadius = geometry.boundingSphere.radius;
          geometry.boundingSphere.radius = originalRadius * collisionScaleFactor;
          
          // Check if we created any NaN values and fix if needed
          if (isNaN(geometry.boundingSphere.radius) || 
              isNaN(geometry.boundingSphere.center.x) ||
              isNaN(geometry.boundingSphere.center.y) ||
              isNaN(geometry.boundingSphere.center.z)) {
            console.warn("PufferfishAsset: Detected NaN in boundingSphere after scaling, fixing...");
            AssetHelpers.computeCorrectBoundingSphere(geometry);
          }
        } else {
          // Create a new one if it doesn't exist, using our helper to avoid NaN issues
          AssetHelpers.computeCorrectBoundingSphere(geometry);
        }
      } catch (error) {
        console.error("Error updating collision sphere bounds:", error);
        // Create a fallback bounding sphere with a reasonable size
        geometry.boundingSphere = new THREE.Sphere(
          new THREE.Vector3(0, 0, 0),
          collisionScaleFactor * config.baseRadius * 1.2
        );
      }
    }
    
    // Log dangerous state changes for gameplay tuning
    const wasDangerous = this.mesh.userData?.isDangerous;
    const isDangerousNow = this.isDangerous();
    if (wasDangerous !== isDangerousNow) {
      console.log(`Pufferfish danger state changed to: ${isDangerousNow}, inflation: ${this.inflationState.toFixed(2)}, collision scale: ${collisionScaleFactor.toFixed(3)}`);
    }
    
    // Update user data to ensure danger state is accurately reflected for collision system
    if (this.mesh) {
      this.mesh.userData.isDangerous = isDangerousNow;
      this.mesh.userData.inflationState = this.inflationState;
      this.mesh.userData.currentState = this.currentState;
      this.mesh.userData.collisionScaleFactor = collisionScaleFactor;
      
      // Add extra visibility into collision state for debugging
      this.mesh.userData.collisionData = {
        radius: geometry?.boundingSphere?.radius || 0,
        scale: collisionScaleFactor,
        baseRadius: config.baseRadius,
        currentState: this.currentState,
        dangerThresholds: {
          inflating: 0.5,  // Dangerous when inflating past 50%
          deflating: 0.7   // Dangerous when deflating but still above 70%
        }
      };
    }
    
    // Add enhanced Pixar-style special effects when inflating/deflating
    if (this.body.material instanceof THREE.MeshStandardMaterial) {
      // Get visual config with better defaults for Pixar style
      const visualConfig = config.visuals || {};
      const baseEmissiveIntensity = visualConfig.emissiveIntensity || 0.2;
      const inflatedEmissiveIntensity = baseEmissiveIntensity * 2.5;
      
      // Enhance emissive intensity based on inflation state
      this.body.material.emissiveIntensity = THREE.MathUtils.lerp(
        baseEmissiveIntensity,
        inflatedEmissiveIntensity,
        this.inflationState
      );
      
      // Also adjust other material properties for more dynamic appearance
      // Decrease roughness as it inflates (smoother when inflated)
      const baseRoughness = visualConfig.roughness || 0.3;
      this.body.material.roughness = THREE.MathUtils.lerp(
        baseRoughness,
        baseRoughness * 0.7,  // 30% smoother when fully inflated
        this.inflationState
      );
      
      // Increase metalness as it inflates (more shiny when inflated)
      const baseMetalness = visualConfig.metalness || 0.6;
      this.body.material.metalness = THREE.MathUtils.lerp(
        baseMetalness,
        baseMetalness * 1.3,  // 30% more metallic when fully inflated
        this.inflationState
      );
      
      // Give the spikes a dramatically different appearance when dangerous
      // This provides a clear visual cue that matches the collision behavior
      if (this.spikes.children.length > 0) {
        this.spikes.children.forEach(spike => {
          if (spike instanceof THREE.Mesh && spike.material instanceof THREE.MeshStandardMaterial) {
            if (isDangerousNow) {
              // Dramatic effects when dangerous
              spike.material.emissiveIntensity = baseEmissiveIntensity * 5.0 * this.inflationState;
              spike.material.emissive.set(0xFF4500);  // Change to bright orange-red
              spike.material.clearcoat = 0.8;        // Increase clearcoat for wet, dangerous look
            } else {
              // Normal state when not dangerous
              spike.material.emissiveIntensity = baseEmissiveIntensity * this.inflationState;
              spike.material.emissive.set(visualConfig.emissiveColor || 0xD2691E);
              spike.material.clearcoat = 0.6;        // Normal clearcoat
            }
          }
        });
      }
    }
    
    // Adjust fin and tail animation based on inflation state
    const finWiggleFactor = THREE.MathUtils.lerp(1.0, 0.3, this.inflationState); // Less wiggle when inflated
    this.fins.forEach(fin => {
      fin.rotation.x = Math.sin(Date.now() * 0.005) * 0.1 * finWiggleFactor;
    });
    
    // Tail moves less when inflated
    if (this.tail) {
      this.tail.rotation.y = Math.sin(Date.now() * 0.003) * 0.15 * finWiggleFactor;
    }
  }

  /**
   * Returns the current inflation state (0-1)
   */
  public getInflationState(): number {
    return this.inflationState;
  }

  /**
   * Returns whether the pufferfish is currently inflated
   */
  public getIsInflated(): boolean {
    return this.currentState === PufferfishState.INFLATED ||
           this.currentState === PufferfishState.INFLATING;
  }

  /**
   * Determines if the pufferfish is dangerous based on inflation state
   * More nuanced than simply checking if inflated - considers partial inflation
   * with improved thresholds for better gameplay
   */
  public isDangerous(): boolean {
    // Calculate danger based on inflation thresholds:
    // 1. Always dangerous when fully inflated
    // 2. Dangerous when inflating and past 50% inflated
    // 3. Dangerous when deflating and still more than 70% inflated
    // 4. Not dangerous when deflated or early inflation stages
    
    try {
      // These thresholds determine when it becomes dangerous during inflation/deflation
      const INFLATION_DANGER_THRESHOLD = 0.5;  // 50% inflated
      const DEFLATION_SAFETY_THRESHOLD = 0.7;  // 70% inflated
      
      if (this.currentState === PufferfishState.INFLATED) {
        return true; // Always dangerous when fully inflated
      }
      else if (this.currentState === PufferfishState.INFLATING) {
        return this.inflationState > INFLATION_DANGER_THRESHOLD; // Dangerous when more than half inflated
      }
      else if (this.currentState === PufferfishState.DEFLATING) {
        return this.inflationState > DEFLATION_SAFETY_THRESHOLD; // Still dangerous during early deflation
      }
      else {
        return false; // DEFLATED state is never dangerous
      }
    } catch (error) {
      console.error("Error in isDangerous():", error);
      // Default to safe in case of any errors
      return false;
    }
  }

  /**
   * Return the current state of the pufferfish
   */
  public getCurrentState(): PufferfishState {
    return this.currentState;
  }

  /**
   * Returns the pufferfish mesh group
   * Creates the mesh if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }

  /**
   * Return the pufferfish configuration with defaults as fallback
   */
  public get config(): PufferfishConfig {
    // Provide default values in case config is not available
    const defaultConfig: PufferfishConfig = {
      baseRadius: 0.35,
      inflatedRadius: 0.85,
      inflationDuration: 0.5,
      deflationDuration: 0.8,
      detectionRadius: 5.0,
      inflationCooldown: 1.0,
      visuals: {
        mainColor: 0xFFA500,
        emissiveColor: 0xCC8400,
        emissiveIntensity: 0.1,
        roughness: 0.5,
        metalness: 0.1,
        animationSpeed: 1.2
      },
      spineVisuals: {
        mainColor: 0xD2691E,
        roughness: 0.6,
        metalness: 0.05
      }
    };

    try {
      return configSystem.getObstaclesConfig()?.pufferfish || defaultConfig;
    } catch (error) {
      console.warn("PufferfishAsset: Could not get pufferfish config, using defaults", error);
      return defaultConfig;
    }
  }

  /**
   * Resets the pufferfish to its initial state (deflated)
   */
  public reset(): void {
    this.currentState = PufferfishState.DEFLATED;
    this.inflationState = 0;
    this.inflationCooldownTimer = 0;
    
    // Ensure visuals match this state
    if (this.mesh) {
      this.applyInflation();
    }
  }

  /**
   * Disposes of all resources used by this asset
   */
  public dispose(): void {
    // Clean up geometries and materials
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      
      // Clear references
      this.spikes = new THREE.Group();
      this.fins = [];
    }
  }

  /**
   * Returns the collision object for this asset
   * with enhanced error handling and fallback mechanisms
   */
  public getCollisionObject(): THREE.Mesh {
    try {
      // First verify the collision sphere exists and is valid
      if (this.collisionSphere && this.collisionSphere.geometry) {
        // Make sure the collision sphere has a valid bounding sphere
        if (!this.collisionSphere.geometry.boundingSphere ||
            isNaN(this.collisionSphere.geometry.boundingSphere.radius) ||
            this.collisionSphere.geometry.boundingSphere.radius <= 0) {
          console.warn("PufferfishAsset: Collision sphere has invalid bounding sphere, recomputing");
          AssetHelpers.computeCorrectBoundingSphere(this.collisionSphere.geometry);
        }
        
        // Ensure visibility state matches danger state (for debug visualization)
        if (this.collisionSphere.material instanceof THREE.MeshBasicMaterial && 
            this.collisionSphere.material.wireframe) {
          // Only update if it's our debug wireframe material
          const debuggerActive = window.location.href.includes('debug=true');
          this.collisionSphere.visible = debuggerActive;
        }
        
        return this.collisionSphere;
      }
      
      // Fallback to body if collision sphere is missing
      if (this.body) {
        console.warn("PufferfishAsset: Using body for collision detection (collision sphere missing)");
        return this.body;
      }
      
      // Last resort: Create an emergency collision sphere
      console.error("PufferfishAsset: Creating emergency collision sphere");
      const emergencyGeometry = new THREE.SphereGeometry(this.config.baseRadius, 4, 4);
      const emergencyMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        wireframe: true,
        visible: window.location.href.includes('debug=true')
      });
      
      this.collisionSphere = new THREE.Mesh(emergencyGeometry, emergencyMaterial);
      this.collisionSphere.name = "PufferfishEmergencyCollisionSphere";
      
      // Ensure it has a valid bounding sphere
      emergencyGeometry.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(0, 0, 0),
        this.config.baseRadius
      );
      
      if (this.mesh) {
        this.mesh.add(this.collisionSphere);
      }
      
      return this.collisionSphere;
    } catch (error) {
      console.error("Critical error in getCollisionObject():", error);
      
      // Ultimate fallback: return anything that won't crash
      if (this.body) {
        return this.body;
      } else if (this.mesh instanceof THREE.Mesh) {
        return this.mesh;
      } else {
        // Create a last-resort emergency mesh
        const lastResortGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const lastResortMaterial = new THREE.MeshBasicMaterial({visible: false});
        return new THREE.Mesh(lastResortGeometry, lastResortMaterial);
      }
    }
  }
}