import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SharkConfig } from '../../config/gameConfig';

export class SharkAsset {
  public mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  
  // References for animations
  private body!: THREE.Mesh;
  private head!: THREE.Group;
  private tailFin!: THREE.Mesh;
  private dorsalFin!: THREE.Mesh;
  private pectoralFinL!: THREE.Mesh;
  private pectoralFinR!: THREE.Mesh;
  private jaw!: THREE.Mesh;
  private gills: THREE.Mesh[] = [];
  
  private animationTime: number = 0;
  private patrolDirection: number = 1; // 1 or -1
  private patrolTimer: number = 0;
  private isAttacking: boolean = false;
  private attackCooldown: number = 0;

  constructor(shaderManager?: ShaderManager) {
    // We still accept the ShaderManager parameter for backward compatibility
    // but we don't actually use it anymore since we're using StandardMaterial
  }

  /**
   * Creates an enhanced shark with detailed geometry and StandardMaterial
   */
  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group
      this.mesh = new THREE.Group();
      this.mesh.name = "SharkObstacle_StdMat";
      
      // Get shark config for visual properties
      const config = this.config;
      const visualConf = config?.visuals || {};
      const finVisualConf = config?.finVisuals || visualConf;
      
      // Create body segments for better shape control
      this.createBody(config.baseScale, visualConf);
      
      // Add head with jaw, eyes, and gills
      this.createHead(config.baseScale, visualConf);
      
      // Add detailed fins
      this.createFins(config.baseScale, finVisualConf);
      
      // Create collision mesh that encompasses the entire shark
      this.createCollisionMesh(config.baseScale);
      
      // Set userData for identification
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'shark', 
        assetInstance: this,
        isDangerous: true,
        patrolSpeed: config.patrolSpeed,
        patrolRangeX: config.patrolRangeX
      };
      
      return this.mesh;
    } catch (error) {
      console.error("SharkAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }
  
  /**
   * Creates the shark body with enhanced geometry for more realistic shape
   */
  private createBody(scale: number = 1.0, visualConf: any): void {
    // Body dimensions
    const bodyLength = 2.0 * scale;
    const bodyRadius = 0.4 * scale;
    
    // Create a more tapered shark body than simple capsule
    const points = [];
    const segments = 12;
    
    // Generate points for a lathe geometry to create a tapered body shape
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Create tapered profile (thicker in middle, thinner at ends)
      // Quadratic falloff for more natural shape
      let radius = bodyRadius * (1 - Math.pow(2 * t - 1, 2) * 0.7);
      
      // Additional tapering towards the tail
      if (t > 0.5) {
        radius *= 1.0 - 0.5 * Math.pow((t - 0.5) * 2, 2);
      }
      
      // Add point to profile
      points.push(new THREE.Vector2(0, radius));
    }
    
    // Create custom material for shark body
    const sharkMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x5A6A7A),
      emissive: new THREE.Color(visualConf.emissiveColor || 0x3A4A5A),
      emissiveIntensity: visualConf.emissiveIntensity || 0.1,
      roughness: visualConf.roughness || 0.3,
      metalness: visualConf.metalness || 0.2,
      clearcoat: visualConf.clearcoat || 0.4,
      clearcoatRoughness: visualConf.clearcoatRoughness || 0.1
    });
    
    // Create shark body
    const bodyGeometry = new THREE.LatheGeometry(points, 24);
    
    // Rotate and position the body
    bodyGeometry.rotateX(Math.PI / 2);
    bodyGeometry.rotateY(Math.PI); // Face forward
    
    // Apply some noise to make it less perfect
    this.applyNoiseToGeometry(bodyGeometry, bodyRadius * 0.02);
    
    // Create mesh
    this.body = new THREE.Mesh(bodyGeometry, sharkMaterial);
    this.body.name = "SharkBody";
    
    // Add color gradient for underbelly
    this.applyUnderbellyShadingToGeometry(bodyGeometry, sharkMaterial, visualConf);
    
    // Add to group
    this.mesh.add(this.body);
    
    // Add vertical ridges for more detailed appearance
    this.addBodyRidges(bodyLength, bodyRadius, scale, sharkMaterial);
  }
  
  /**
   * Add subtle vertical ridges along the shark's body for more realism
   */
  private addBodyRidges(bodyLength: number, bodyRadius: number, scale: number, material: THREE.Material): void {
    const numRidges = 8;
    const ridgeHeight = bodyRadius * 0.03;
    const ridgeWidth = bodyLength * 0.01;
    
    for (let i = 0; i < numRidges; i++) {
      // Position evenly along the center/back portion of the shark
      const t = 0.3 + (i / (numRidges - 1)) * 0.4; // From 30% to 70% of body length
      const z = (t - 0.5) * bodyLength; // Z position
      
      // Alternate small ridges on left and right sides of dorsal area
      const side = i % 2 === 0 ? 1 : -1;
      const x = side * bodyRadius * 0.3;
      
      // Create ridge geometry
      const ridgeGeometry = new THREE.BoxGeometry(ridgeWidth, ridgeHeight, bodyRadius * 0.4);
      const ridge = new THREE.Mesh(ridgeGeometry, material);
      
      // Position the ridge
      ridge.position.set(x, bodyRadius * 0.8, z);
      ridge.rotation.x = Math.PI * 0.1 * side; // Angle slightly outward
      
      // Add to body
      this.body.add(ridge);
    }
  }
  
  /**
   * Apply shading to the geometry to create underbelly coloring
   */
  private applyUnderbellyShadingToGeometry(geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, visualConf: any): void {
    // Use vertex colors to create a gradient from top to bottom
    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;
    
    // Create color attribute
    const colors = new Float32Array(vertexCount * 3);
    
    // Define colors
    const topColor = new THREE.Color(visualConf.mainColor || 0x5A6A7A); // Dark gray-blue for top
    const bottomColor = new THREE.Color(visualConf.patternColor || 0x8899AA); // Lighter for belly
    
    // Apply colors based on Y position (vertical)
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const y = positions[idx + 1]; // Y position
      
      // Normalize y to be between 0 and 1 (-1 to 1 becomes 0 to 1)
      // Bottom will be lighter, top will be darker
      const t = (y + 1) * 0.5;
      
      // Create a sharp gradient - top 70% is dark, bottom 30% transitions to light
      let blendFactor;
      if (t < 0.7) {
        blendFactor = 0.1; // Mostly top color
      } else {
        // Smooth transition in bottom 30%
        blendFactor = 0.1 + (t - 0.7) / 0.3 * 0.9;
      }
      
      // Blend colors
      const color = new THREE.Color().lerpColors(topColor, bottomColor, blendFactor);
      
      // Set color for this vertex
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }
    
    // Add colors to geometry
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Enable vertex colors in the material
    material.vertexColors = true;
  }
  
  /**
   * Creates the shark head with detailed mouth, eyes, and gills
   */
  private createHead(scale: number = 1.0, visualConf: any): void {
    // Create a group for the head
    this.head = new THREE.Group();
    this.head.name = "SharkHead";
    
    // Position parameters
    const bodyLength = 2.0 * scale;
    const bodyRadius = 0.4 * scale;
    
    // Position at front of body
    this.head.position.set(0, 0, -bodyLength * 0.45);
    
    // Create head shape
    this.createHeadShape(bodyRadius, visualConf);
    
    // Add snout
    this.createSnout(bodyRadius, visualConf);
    
    // Add jaw
    this.createJaw(bodyRadius, visualConf);
    
    // Add eyes
    this.createEyes(bodyRadius);
    
    // Add gills
    this.createGills(bodyRadius, visualConf);
    
    // Add to body
    this.mesh.add(this.head);
  }
  
  /**
   * Creates the main head shape
   */
  private createHeadShape(bodyRadius: number, visualConf: any): void {
    // Create a more pointed shape for the head
    const headMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x5A6A7A),
      emissive: new THREE.Color(visualConf.emissiveColor || 0x3A4A5A),
      emissiveIntensity: visualConf.emissiveIntensity || 0.1,
      roughness: visualConf.roughness || 0.3,
      metalness: visualConf.metalness || 0.2,
      clearcoat: visualConf.clearcoat || 0.4,
      clearcoatRoughness: visualConf.clearcoatRoughness || 0.1
    });
    
    // Use a cone for the head shape, but we'll deform it
    const headGeometry = new THREE.ConeGeometry(bodyRadius * 1.1, bodyRadius * 2, 20, 1, true);
    
    // Rotate to align with body
    headGeometry.rotateX(-Math.PI / 2);
    
    // Deform points to make it less symmetrical
    const positions = headGeometry.attributes.position.array;
    const vertexCount = positions.length / 3;
    
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      // Make bottom flatter than top
      if (y < 0) {
        positions[idx + 1] = y * 0.7;
      } else {
        // More point on top
        positions[idx + 1] = y * 1.1;
      }
      
      // Slightly narrow toward the front
      if (z < 0) {
        const factor = 1.0 + 0.2 * (z / (bodyRadius * 2));
        positions[idx] = x * factor;
      }
    }
    
    // Update geometry
    headGeometry.attributes.position.needsUpdate = true;
    headGeometry.computeVertexNormals();
    
    // Apply underbelly coloration
    this.applyUnderbellyShadingToGeometry(headGeometry, headMaterial, visualConf);
    
    // Create head mesh
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.name = "SharkHeadShape";
    
    // Add to head group
    this.head.add(headMesh);
  }
  
  /**
   * Creates the snout/nose of the shark
   */
  private createSnout(bodyRadius: number, visualConf: any): void {
    // Material for snout
    const snoutMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x5A6A7A),
      roughness: visualConf.roughness || 0.3,
      metalness: visualConf.metalness || 0.2
    });
    
    // Create snout geometry
    const snoutGeometry = new THREE.SphereGeometry(bodyRadius * 0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Deform to create a more pointed nose
    const positions = snoutGeometry.attributes.position.array;
    const vertexCount = positions.length / 3;
    
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const z = positions[idx + 2];
      
      // Stretch forward 
      positions[idx + 2] = z * 1.5;
    }
    
    // Update geometry
    snoutGeometry.attributes.position.needsUpdate = true;
    snoutGeometry.computeVertexNormals();
    
    // Create snout mesh
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.name = "SharkSnout";
    
    // Position and rotate
    snout.position.set(0, 0, -bodyRadius * 0.8);
    snout.rotation.x = Math.PI; // Flip so rounded part is forward
    
    // Add to head
    this.head.add(snout);
    
    // Add nostrils (small indentations)
    this.createNostrils(bodyRadius, snoutMaterial);
  }
  
  /**
   * Creates nostrils for the shark
   */
  private createNostrils(bodyRadius: number, material: THREE.Material): void {
    const nostrilRadius = bodyRadius * 0.05;
    const nostrilDepth = bodyRadius * 0.1;
    
    // Create nostril geometry (small cylinder)
    const nostrilGeometry = new THREE.CylinderGeometry(nostrilRadius, nostrilRadius, nostrilDepth, 8, 1);
    
    // Left nostril
    const leftNostril = new THREE.Mesh(nostrilGeometry, material);
    leftNostril.position.set(-bodyRadius * 0.15, -bodyRadius * 0.1, -bodyRadius * 1);
    leftNostril.rotation.x = Math.PI / 2;
    this.head.add(leftNostril);
    
    // Right nostril
    const rightNostril = leftNostril.clone();
    rightNostril.position.x *= -1;
    this.head.add(rightNostril);
  }
  
  /**
   * Creates the jaw/mouth of the shark
   */
  private createJaw(bodyRadius: number, visualConf: any): void {
    // Material for jaw - slightly lighter than body
    const jawMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.patternColor || 0x8899AA),
      roughness: (visualConf.roughness || 0.3) * 1.2,
      metalness: (visualConf.metalness || 0.2) * 0.5
    });
    
    // Create jaw geometry
    const jawWidth = bodyRadius * 0.8;
    const jawShape = new THREE.Shape();
    
    // Create a more realistic jaw shape with curve
    jawShape.moveTo(-jawWidth, 0);
    jawShape.quadraticCurveTo(0, -bodyRadius * 0.2, jawWidth, 0);
    
    // Extrude for thickness
    const jawExtrudeSettings = {
      steps: 1,
      depth: bodyRadius * 0.6,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.1,
      bevelSize: bodyRadius * 0.05,
      bevelSegments: 3
    };
    
    const jawGeometry = new THREE.ExtrudeGeometry(jawShape, jawExtrudeSettings);
    
    // Rotate to position
    jawGeometry.rotateX(Math.PI / 2);
    
    // Create jaw mesh
    this.jaw = new THREE.Mesh(jawGeometry, jawMaterial);
    this.jaw.name = "SharkJaw";
    
    // Position jaw
    this.jaw.position.set(0, -bodyRadius * 0.2, -bodyRadius * 0.6);
    
    // Add to head
    this.head.add(this.jaw);
    
    // Add teeth
    this.createTeeth(bodyRadius, jawWidth);
  }
  
  /**
   * Creates teeth for the shark's jaw
   */
  private createTeeth(bodyRadius: number, jawWidth: number): void {
    // Material for teeth
    const teethMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFF0, // Off-white
      roughness: 0.3,
      metalness: 0.1
    });
    
    // Create tooth geometry
    const toothHeight = bodyRadius * 0.08;
    const toothWidth = bodyRadius * 0.04;
    
    // Create a basic triangle shape for teeth
    const toothShape = new THREE.Shape();
    toothShape.moveTo(-toothWidth/2, 0);
    toothShape.lineTo(0, -toothHeight);
    toothShape.lineTo(toothWidth/2, 0);
    toothShape.lineTo(-toothWidth/2, 0);
    
    // Extrude for 3D tooth
    const toothExtrudeSettings = {
      depth: bodyRadius * 0.03,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.01,
      bevelSize: bodyRadius * 0.01,
      bevelSegments: 2
    };
    
    const toothGeometry = new THREE.ExtrudeGeometry(toothShape, toothExtrudeSettings);
    
    // Number of teeth
    const numTeeth = 12;
    
    // Create teeth and position them along the jaw
    for (let i = 0; i < numTeeth; i++) {
      const t = i / (numTeeth - 1);
      const x = (t * 2 - 1) * jawWidth * 0.8; // From -jawWidth to +jawWidth
      
      // Vary tooth size for realism
      const scale = 0.8 + Math.random() * 0.4;
      
      // Create tooth
      const tooth = new THREE.Mesh(toothGeometry, teethMaterial);
      tooth.name = `SharkTooth_${i}`;
      
      // Position on jaw
      tooth.position.set(x, -bodyRadius * 0.23, -bodyRadius * 0.6);
      tooth.rotation.x = Math.PI / 2;
      
      // Vary rotation slightly
      tooth.rotation.z = (Math.random() - 0.5) * 0.2;
      
      // Scale tooth
      tooth.scale.set(scale, scale, scale);
      
      // Add to jaw
      this.jaw.add(tooth);
    }
  }
  
  /**
   * Creates the eyes for the shark
   */
  private createEyes(bodyRadius: number): void {
    // Create eye group
    const createEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.name = isLeft ? "SharkLeftEye" : "SharkRightEye";
      
      // Eye size
      const eyeRadius = bodyRadius * 0.12;
      
      // Eye white
      const eyeWhiteGeometry = new THREE.SphereGeometry(eyeRadius, 16, 12);
      const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.1,
        metalness: 0.2
      });
      
      const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
      eyeWhite.name = isLeft ? "LeftEyeWhite" : "RightEyeWhite";
      eyeGroup.add(eyeWhite);
      
      // Pupil (black)
      const pupilGeometry = new THREE.SphereGeometry(eyeRadius * 0.7, 16, 12);
      const pupilMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.1,
        metalness: 0.0,
        emissive: 0x111111
      });
      
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.name = isLeft ? "LeftPupil" : "RightPupil";
      pupil.position.z = eyeRadius * 0.5;
      eyeGroup.add(pupil);
      
      // Add highlight (small white dot)
      const highlightGeometry = new THREE.SphereGeometry(eyeRadius * 0.2, 8, 6);
      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.1,
        metalness: 0.0,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.5
      });
      
      const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlight.name = isLeft ? "LeftHighlight" : "RightHighlight";
      highlight.position.set(eyeRadius * 0.2, eyeRadius * 0.2, eyeRadius * 0.85);
      eyeGroup.add(highlight);
      
      return eyeGroup;
    };
    
    // Create both eyes
    const leftEye = createEye(true);
    const rightEye = createEye(false);
    
    // Position eyes on head
    const eyePositionZ = -bodyRadius * 0.4;
    const eyePositionY = bodyRadius * 0.3;
    const eyePositionX = bodyRadius * 0.6;
    
    leftEye.position.set(-eyePositionX, eyePositionY, eyePositionZ);
    rightEye.position.set(eyePositionX, eyePositionY, eyePositionZ);
    
    // Rotate eyes slightly outward for better viewing angle
    leftEye.rotation.y = Math.PI / 8;
    rightEye.rotation.y = -Math.PI / 8;
    
    // Add to head
    this.head.add(leftEye);
    this.head.add(rightEye);
  }
  
  /**
   * Creates gills for the shark
   */
  private createGills(bodyRadius: number, visualConf: any): void {
    // Material for gills - darker than body
    const gillMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x5A6A7A).multiplyScalar(0.7),
      roughness: (visualConf.roughness || 0.3) * 1.3,
      metalness: (visualConf.metalness || 0.2) * 0.5
    });
    
    // Number of gill slits per side
    const numGills = 5;
    
    // Gill dimensions
    const gillLength = bodyRadius * 0.5;
    const gillWidth = bodyRadius * 0.05;
    const gillDepth = bodyRadius * 0.02;
    
    // Clear gills array
    this.gills = [];
    
    // Create gills on both sides
    for (let side = -1; side <= 1; side += 2) {
      if (side === 0) continue; // Skip center
      
      for (let i = 0; i < numGills; i++) {
        // Position gills from front to back
        const z = -bodyRadius * 0.2 + i * bodyRadius * 0.15;
        
        // Create gill shape
        const gillShape = new THREE.Shape();
        gillShape.moveTo(-gillWidth/2, -gillLength/2);
        gillShape.lineTo(gillWidth/2, -gillLength/2);
        gillShape.lineTo(gillWidth/2, gillLength/2);
        gillShape.lineTo(-gillWidth/2, gillLength/2);
        gillShape.lineTo(-gillWidth/2, -gillLength/2);
        
        // Extrude for 3D gill
        const gillExtrudeSettings = {
          depth: gillDepth,
          bevelEnabled: true,
          bevelThickness: gillWidth * 0.2,
          bevelSize: gillWidth * 0.2,
          bevelSegments: 2
        };
        
        const gillGeometry = new THREE.ExtrudeGeometry(gillShape, gillExtrudeSettings);
        
        // Create gill mesh
        const gill = new THREE.Mesh(gillGeometry, gillMaterial);
        gill.name = `SharkGill_${side > 0 ? 'Right' : 'Left'}_${i}`;
        
        // Position and rotate
        gill.position.set(side * bodyRadius * 0.7, 0, z);
        gill.rotation.y = side * Math.PI / 2; // Rotate to face outward
        gill.rotation.z = Math.PI / 12; // Angle slightly
        
        // Add to head
        this.head.add(gill);
        this.gills.push(gill);
      }
    }
  }
  
  /**
   * Creates all fins for the shark
   */
  private createFins(scale: number = 1.0, visualConf: any): void {
    const bodyLength = 2.0 * scale;
    const bodyRadius = 0.4 * scale;
    
    // Material for fins - slightly darker than body
    const finMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x5A6A7A).multiplyScalar(0.9),
      emissive: new THREE.Color(visualConf.emissiveColor || 0x3A4A5A).multiplyScalar(0.9),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.1) * 0.8,
      roughness: visualConf.roughness || 0.4, // Rougher than body
      metalness: (visualConf.metalness || 0.2) * 0.8, // Less metallic
      side: THREE.DoubleSide // Important for thin fins
    });
    
    // Create dorsal fin
    this.createDorsalFin(bodyLength, bodyRadius, finMaterial);
    
    // Create pectoral fins
    this.createPectoralFins(bodyLength, bodyRadius, finMaterial);
    
    // Create tail fin
    this.createTailFin(bodyLength, bodyRadius, finMaterial);
    
    // Create additional smaller fins
    this.createSecondaryFins(bodyLength, bodyRadius, finMaterial);
  }
  
  /**
   * Creates the dorsal fin
   */
  private createDorsalFin(bodyLength: number, bodyRadius: number, material: THREE.Material): void {
    // Dorsal fin dimensions
    const finHeight = bodyRadius * 1.5;
    const finBase = bodyRadius * 0.8;
    
    // Create dorsal fin shape with curve for more realism
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0); // Base center
    dorsalShape.lineTo(-finBase/2, 0); // Base left
    
    // Curved edge to peak
    dorsalShape.quadraticCurveTo(
      -finBase/4, finHeight * 0.7, // Control point
      0, finHeight // Peak
    );
    
    // Curved edge back to base
    dorsalShape.quadraticCurveTo(
      finBase/3, finHeight * 0.5, // Control point
      finBase/2, 0 // Base right
    );
    
    dorsalShape.lineTo(0, 0); // Close shape
    
    // Extrude for thickness
    const dorsalExtrudeSettings = {
      steps: 1,
      depth: bodyRadius * 0.15,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.05,
      bevelSize: bodyRadius * 0.05,
      bevelSegments: 3
    };
    
    const dorsalGeometry = new THREE.ExtrudeGeometry(dorsalShape, dorsalExtrudeSettings);
    
    // Apply slight noise to geometry
    this.applyNoiseToGeometry(dorsalGeometry, bodyRadius * 0.02);
    
    // Create dorsal fin mesh
    this.dorsalFin = new THREE.Mesh(dorsalGeometry, material);
    this.dorsalFin.name = "SharkDorsalFin";
    
    // Position and rotate
    this.dorsalFin.position.set(0, bodyRadius * 0.9, -bodyLength * 0.1);
    this.dorsalFin.rotation.y = Math.PI / 2; // Orient along body
    
    // Add to body
    this.mesh.add(this.dorsalFin);
  }
  
  /**
   * Creates the pectoral fins (side fins)
   */
  private createPectoralFins(bodyLength: number, bodyRadius: number, material: THREE.Material): void {
    // Pectoral fin dimensions
    const finLength = bodyRadius * 1.2;
    const finWidth = bodyRadius * 0.6;
    
    // Create pectoral fin shape with curve for more realism
    const pectoralShape = new THREE.Shape();
    pectoralShape.moveTo(0, 0); // Attachment point
    
    // Curved front edge
    pectoralShape.quadraticCurveTo(
      finLength * 0.5, finWidth * 0.3, // Control point
      finLength, finWidth * 0.3 // Front tip
    );
    
    // Curved back edge
    pectoralShape.quadraticCurveTo(
      finLength * 0.7, finWidth * 0.1, // Control point
      finLength * 0.7, -finWidth * 0.3 // Back point
    );
    
    // Curve back to attachment
    pectoralShape.quadraticCurveTo(
      finLength * 0.3, -finWidth * 0.2, // Control point
      0, 0 // Back to attachment
    );
    
    // Extrude for thickness
    const pectoralExtrudeSettings = {
      steps: 1,
      depth: bodyRadius * 0.08,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.02,
      bevelSize: bodyRadius * 0.02,
      bevelSegments: 2
    };
    
    const pectoralGeometry = new THREE.ExtrudeGeometry(pectoralShape, pectoralExtrudeSettings);
    
    // Apply slight noise to geometry
    this.applyNoiseToGeometry(pectoralGeometry, bodyRadius * 0.01);
    
    // Create left pectoral fin
    this.pectoralFinL = new THREE.Mesh(pectoralGeometry, material);
    this.pectoralFinL.name = "SharkLeftPectoralFin";
    
    // Position and rotate left fin
    this.pectoralFinL.position.set(-bodyRadius * 0.7, -bodyRadius * 0.2, -bodyLength * 0.2);
    this.pectoralFinL.rotation.z = -Math.PI / 6; // Angle downward
    this.pectoralFinL.rotation.y = -Math.PI / 5; // Angle outward
    this.pectoralFinL.rotation.x = Math.PI / 2; // Orient properly
    
    // Add to body
    this.mesh.add(this.pectoralFinL);
    
    // Create right pectoral fin (mirror of left)
    this.pectoralFinR = this.pectoralFinL.clone();
    this.pectoralFinR.name = "SharkRightPectoralFin";
    
    // Mirror position and rotation
    this.pectoralFinR.position.x *= -1;
    this.pectoralFinR.rotation.y *= -1;
    
    // Add to body
    this.mesh.add(this.pectoralFinR);
  }
  
  /**
   * Creates the tail fin
   */
  private createTailFin(bodyLength: number, bodyRadius: number, material: THREE.Material): void {
    // Tail fin dimensions
    const finHeight = bodyRadius * 1.6;
    const finWidth = bodyRadius * 0.8;
    
    // Create tail fin shape with realistic curve and notch
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0); // Attachment point
    
    // Upper lobe (longer than lower)
    tailShape.quadraticCurveTo(
      finWidth * 0.5, finHeight * 0.5, // Control point
      finWidth * 0.7, finHeight * 0.9 // Upper tip
    );
    
    // Curve back to notch
    tailShape.quadraticCurveTo(
      finWidth * 0.5, finHeight * 0.6, // Control point
      finWidth * 0.4, finHeight * 0.4 // Notch
    );
    
    // Lower lobe (shorter than upper)
    tailShape.quadraticCurveTo(
      finWidth * 0.5, finHeight * 0.2, // Control point
      finWidth * 0.6, -finHeight * 0.6 // Lower tip
    );
    
    // Curve back to attachment
    tailShape.quadraticCurveTo(
      finWidth * 0.3, -finHeight * 0.2, // Control point
      0, 0 // Back to attachment
    );
    
    // Extrude for thickness
    const tailExtrudeSettings = {
      steps: 1,
      depth: bodyRadius * 0.1,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.03,
      bevelSize: bodyRadius * 0.03,
      bevelSegments: 2
    };
    
    const tailGeometry = new THREE.ExtrudeGeometry(tailShape, tailExtrudeSettings);
    
    // Apply slight noise to geometry
    this.applyNoiseToGeometry(tailGeometry, bodyRadius * 0.01);
    
    // Create tail fin mesh
    this.tailFin = new THREE.Mesh(tailGeometry, material);
    this.tailFin.name = "SharkTailFin";
    
    // Position and rotate
    this.tailFin.position.set(0, 0, bodyLength * 0.48);
    this.tailFin.rotation.y = Math.PI / 2; // Orient along body
    
    // Add to body
    this.mesh.add(this.tailFin);
  }
  
  /**
   * Creates secondary fins (pelvic, anal, etc.)
   */
  private createSecondaryFins(bodyLength: number, bodyRadius: number, material: THREE.Material): void {
    // Create some smaller fins for more detail
    
    // Pelvic fins (smaller fins near bottom rear)
    const createPelvicFin = (isLeft: boolean) => {
      // Pelvic fin dimensions
      const finLength = bodyRadius * 0.6;
      const finWidth = bodyRadius * 0.3;
      
      // Create shape
      const pelvicShape = new THREE.Shape();
      pelvicShape.moveTo(0, 0);
      pelvicShape.quadraticCurveTo(
        finLength * 0.5, finWidth * 0.3,
        finLength, finWidth * 0.1
      );
      pelvicShape.quadraticCurveTo(
        finLength * 0.7, -finWidth * 0.3,
        0, 0
      );
      
      // Extrude for thickness
      const pelvicExtrudeSettings = {
        steps: 1,
        depth: bodyRadius * 0.05,
        bevelEnabled: true,
        bevelThickness: bodyRadius * 0.01,
        bevelSize: bodyRadius * 0.01,
        bevelSegments: 2
      };
      
      const pelvicGeometry = new THREE.ExtrudeGeometry(pelvicShape, pelvicExtrudeSettings);
      
      // Create mesh
      const pelvicFin = new THREE.Mesh(pelvicGeometry, material);
      pelvicFin.name = isLeft ? "SharkLeftPelvicFin" : "SharkRightPelvicFin";
      
      // Position and rotate
      const sideSign = isLeft ? -1 : 1;
      pelvicFin.position.set(sideSign * bodyRadius * 0.4, -bodyRadius * 0.5, bodyLength * 0.1);
      pelvicFin.rotation.z = -Math.PI / 8; // Slight downward angle
      pelvicFin.rotation.y = sideSign * Math.PI / 8; // Angle slightly outward
      pelvicFin.rotation.x = Math.PI / 2; // Orient properly
      
      // Add to body
      this.mesh.add(pelvicFin);
      
      return pelvicFin;
    };
    
    // Create pelvic fins
    const leftPelvicFin = createPelvicFin(true);
    const rightPelvicFin = createPelvicFin(false);
    
    // Create anal fin (single fin on bottom near tail)
    const analFinHeight = bodyRadius * 0.4;
    const analFinBase = bodyRadius * 0.5;
    
    const analShape = new THREE.Shape();
    analShape.moveTo(0, 0);
    analShape.lineTo(-analFinBase/2, 0);
    analShape.quadraticCurveTo(
      -analFinBase/4, -analFinHeight * 0.7,
      0, -analFinHeight
    );
    analShape.quadraticCurveTo(
      analFinBase/4, -analFinHeight * 0.7,
      analFinBase/2, 0
    );
    analShape.lineTo(0, 0);
    
    const analExtrudeSettings = {
      steps: 1,
      depth: bodyRadius * 0.08,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.02,
      bevelSize: bodyRadius * 0.02,
      bevelSegments: 2
    };
    
    const analGeometry = new THREE.ExtrudeGeometry(analShape, analExtrudeSettings);
    const analFin = new THREE.Mesh(analGeometry, material);
    analFin.name = "SharkAnalFin";
    
    // Position and rotate
    analFin.position.set(0, -bodyRadius * 0.6, bodyLength * 0.25);
    analFin.rotation.y = Math.PI / 2; // Orient along body
    
    // Add to body
    this.mesh.add(analFin);
    
    // Create second dorsal fin (smaller fin on top near tail)
    const dorsal2Height = bodyRadius * 0.4;
    const dorsal2Base = bodyRadius * 0.4;
    
    const dorsal2Shape = new THREE.Shape();
    dorsal2Shape.moveTo(0, 0);
    dorsal2Shape.lineTo(-dorsal2Base/2, 0);
    dorsal2Shape.quadraticCurveTo(
      -dorsal2Base/4, dorsal2Height * 0.7,
      0, dorsal2Height
    );
    dorsal2Shape.quadraticCurveTo(
      dorsal2Base/4, dorsal2Height * 0.7,
      dorsal2Base/2, 0
    );
    dorsal2Shape.lineTo(0, 0);
    
    const dorsal2ExtrudeSettings = {
      steps: 1,
      depth: bodyRadius * 0.08,
      bevelEnabled: true,
      bevelThickness: bodyRadius * 0.02,
      bevelSize: bodyRadius * 0.02,
      bevelSegments: 2
    };
    
    const dorsal2Geometry = new THREE.ExtrudeGeometry(dorsal2Shape, dorsal2ExtrudeSettings);
    const dorsal2Fin = new THREE.Mesh(dorsal2Geometry, material);
    dorsal2Fin.name = "SharkSecondDorsalFin";
    
    // Position and rotate
    dorsal2Fin.position.set(0, bodyRadius * 0.6, bodyLength * 0.25);
    dorsal2Fin.rotation.y = Math.PI / 2; // Orient along body
    
    // Add to body
    this.mesh.add(dorsal2Fin);
  }
  
  /**
   * Creates a collision mesh that encompasses the entire shark
   */
  private createCollisionMesh(scale: number = 1.0): void {
    const bodyLength = 2.0 * scale;
    const bodyRadius = 0.4 * scale;
    
    // Create capsule that covers the whole shark
    const collisionGeometry = new THREE.CapsuleGeometry(
      bodyRadius * 1.1,
      bodyLength * 1.1 - 2 * bodyRadius * 1.1,
      8, 4
    );
    
    // Rotate to align with shark body
    collisionGeometry.rotateX(Math.PI / 2);
    
    // Create invisible material
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: false
    });
    
    // Create collision mesh
    this.collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.collisionMesh.name = "SharkCollisionShape";
    
    // Add to mesh
    this.mesh.add(this.collisionMesh);
  }
  
  /**
   * Creates a minimal fallback shark in case of errors
   */
  private createMinimalFallback(): void {
    console.warn("SharkAsset: Creating minimal fallback model");
    
    // Initialize group
    this.mesh = new THREE.Group();
    this.mesh.name = "SharkFallback";
    
    // Basic body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.4, 8, 4);
    bodyGeometry.rotateX(Math.PI / 2);
    
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0x5A6A7A,
      wireframe: false
    });
    
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(this.body);
    
    // Basic head
    this.head = new THREE.Group();
    this.head.position.set(0, 0, -0.8);
    this.mesh.add(this.head);
    
    // Basic tail fin
    const tailGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    this.tailFin = new THREE.Mesh(tailGeometry, bodyMaterial.clone());
    this.tailFin.position.set(0, 0, 1.0);
    this.tailFin.rotation.y = Math.PI / 2;
    this.mesh.add(this.tailFin);
    
    // Basic collision mesh
    const collisionGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 4);
    collisionGeometry.rotateX(Math.PI / 2);
    
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      wireframe: false
    });
    
    this.collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    this.mesh.add(this.collisionMesh);
    
    // Set userData
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'shark', 
      assetInstance: this,
      isDangerous: true
    };
  }
  
  /**
   * Applies noise to geometry vertices for more organic shapes
   */
  private applyNoiseToGeometry(geometry: THREE.BufferGeometry, amount: number): void {
    if (!geometry.attributes.position) return;
    
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
  
  /**
   * Updates the shark animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number): void {
    if (!this.mesh || !this.tailFin) return;
    
    // Update animation time
    this.animationTime += deltaTime;
    
    // Get configuration
    const config = this.config;
    
    // Update patrol movement
    this.updatePatrolMovement(deltaTime, config);
    
    // Animate tail swishing
    this.animateTail(deltaTime, config);
    
    // Animate fins
    this.animateFins(deltaTime, config);
    
    // Animate head and jaw
    this.animateHead(deltaTime);
  }
  
  /**
   * Updates the shark's patrol movement pattern
   */
  private updatePatrolMovement(deltaTime: number, config: SharkConfig): void {
    // Patrol speed and range from config
    const patrolSpeed = config.patrolSpeed || 1.5;
    const patrolRangeX = config.patrolRangeX || 2.4;
    
    // Update patrol timer
    this.patrolTimer += deltaTime;
    
    // Calculate patrol movement using sine wave for smooth transitions
    const patrolProgress = Math.sin(this.patrolTimer * patrolSpeed * 0.5);
    
    // Apply horizontal patrol movement
    this.mesh.position.x = patrolProgress * patrolRangeX;
    
    // Add subtle vertical movement with different frequency
    this.mesh.position.y = Math.sin(this.patrolTimer * patrolSpeed * 0.2) * 0.2;
    
    // Adjust rotation to face direction of movement
    if (Math.abs(patrolProgress) > 0.95) {
      // Near the edge of patrol, prepare to turn
      this.patrolDirection = -Math.sign(patrolProgress);
    }
    
    // Calculate rotation based on movement direction
    const targetRotationY = Math.atan2(
      this.patrolDirection, // Simplified approximation of X velocity
      3 // Forward Z velocity always positive (constant forward motion)
    );
    
    // Smoothly interpolate current rotation to target rotation
    this.mesh.rotation.y = THREE.MathUtils.lerp(
      this.mesh.rotation.y,
      targetRotationY,
      deltaTime * 2 // Adjust turning speed
    );
  }
  
  /**
   * Animates the tail with swishing motion
   */
  private animateTail(deltaTime: number, config: SharkConfig): void {
    // Get configuration value or use default
    const tailWaveSpeed = config.tailWaveSpeed || 1.5;
    
    // Base animation for regular swimming
    let swingFrequency = tailWaveSpeed * 3; // Oscillations per second
    let swingAmplitude = 0.3; // Maximum swing angle in radians
    
    // Calculate tail swing based on animation time with the configured frequency
    const tailSwing = Math.sin(this.animationTime * swingFrequency) * swingAmplitude;
    
    // Apply rotation to tail fin
    this.tailFin.rotation.y = Math.PI / 2 + tailSwing;
    
    // Also add subtle whole-body undulation for more realistic swimming
    // We do this by rotating segments of the body slightly
    if (this.body) {
      // Subtle body twist following tail but with less amplitude
      this.body.rotation.y = tailSwing * 0.2;
    }
  }
  
  /**
   * Animates the fins with subtle movements
   */
  private animateFins(deltaTime: number, config: SharkConfig): void {
    // Get configuration value or use default
    const finWaveSpeed = config.finWaveSpeed || 0.8;
    
    if (this.pectoralFinL && this.pectoralFinR) {
      // Pectoral fins move up and down slightly out of phase with each other
      const leftPhase = this.animationTime * finWaveSpeed;
      const rightPhase = this.animationTime * finWaveSpeed + 0.7; // Offset phase
      
      // Apply subtle rotation
      this.pectoralFinL.rotation.z = -Math.PI / 6 + Math.sin(leftPhase) * 0.1;
      this.pectoralFinR.rotation.z = -Math.PI / 6 + Math.sin(rightPhase) * 0.1;
    }
    
    if (this.dorsalFin) {
      // Dorsal fin has very subtle movement
      this.dorsalFin.rotation.z = Math.sin(this.animationTime * finWaveSpeed * 0.5) * 0.03;
    }
  }
  
  /**
   * Animates the head and jaw with subtle movements
   */
  private animateHead(deltaTime: number): void {
    if (!this.head || !this.jaw) return;
    
    // Subtle head movement
    this.head.rotation.y = Math.sin(this.animationTime * 0.8) * 0.05;
    
    // Occasionally open/close jaw for a more menacing appearance
    const jawPhase = Math.sin(this.animationTime * 0.2);
    if (jawPhase > 0.7) {
      // Open jaw slightly, increasing opening as phase increases
      const jawOpening = (jawPhase - 0.7) / 0.3; // 0 to 1 mapped from 0.7 to 1.0
      this.jaw.rotation.x = jawOpening * 0.2; // Max 0.2 radians
    } else {
      // Keep jaw closed
      this.jaw.rotation.x = 0;
    }
  }

  /**
   * Returns the main shark mesh group
   * Creates it if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionMesh;
  }

  /**
   * Determines if the shark is dangerous (always true)
   */
  public isDangerous(): boolean {
    return true; // Shark is always dangerous
  }

  /**
   * Resets the shark to its initial state
   */
  public reset(): void {
    this.animationTime = 0;
    this.patrolDirection = 1;
    this.patrolTimer = 0;
    this.isAttacking = false;
    this.attackCooldown = 0;
    
    // Reset positions and rotations
    if (this.mesh) {
      this.mesh.position.set(0, 0, 0);
      this.mesh.rotation.set(0, 0, 0);
    }
    
    if (this.tailFin) {
      this.tailFin.rotation.y = Math.PI / 2; // Reset to neutral position
    }
    
    if (this.jaw) {
      this.jaw.rotation.x = 0; // Close jaw
    }
  }

  /**
   * Disposes of resources used by this asset
   */
  public dispose(): void {
    if (this.mesh) {
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
    }
    
    // Clear references
    this.gills = [];
  }
  
  /**
   * Returns configuration for the shark obstacle
   */
  public get config(): SharkConfig {
    // Provide default values in case config is not available
    const defaultConfig: SharkConfig = {
      patrolSpeed: 1.5,
      patrolRangeX: 2.4,
      baseScale: 1.0,
      finWaveSpeed: 0.8,
      tailWaveSpeed: 1.5,
      visuals: {
        mainColor: 0x5A6A7A, // Shark gray
        emissiveColor: 0x3A4A5A, // Darker emissive
        emissiveIntensity: 0.1, // Subtle glow
        roughness: 0.3, // Smooth skin
        metalness: 0.2, // Moderate sheen
        patternColor: 0x8899AA, // Lighter underbelly
        clearcoat: 0.4, // Wet look
        clearcoatRoughness: 0.1 // Smooth clearcoat
      },
      finVisuals: {
        mainColor: 0x4A5A6A, // Slightly darker fins
        roughness: 0.4, // Rougher than body
        metalness: 0.15 // Less sheen than body
      }
    };

    try {
      return configSystem.getObstaclesConfig()?.shark || defaultConfig;
    } catch (error) {
      console.warn("SharkAsset: Could not get shark config, using defaults", error);
      return defaultConfig;
    }
  }
}