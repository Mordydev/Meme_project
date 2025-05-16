import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { SharkConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

export class SharkAsset {
  private mesh: THREE.Group;
  private collisionShape: THREE.Mesh;
  private tailFin!: THREE.Mesh;
  private bodyMesh!: THREE.Mesh;
  private jawMesh!: THREE.Mesh;
  private rightFinMesh!: THREE.Mesh;
  private leftFinMesh!: THREE.Mesh;
  private leftEyeMesh!: THREE.Object3D;
  private rightEyeMesh!: THREE.Object3D;
  private teethMesh!: THREE.Group;
  private dorsalFinMesh!: THREE.Mesh;
  private gillMeshes: THREE.Mesh[] = [];
  
  // Animation properties
  private animationTime: number = 0;
  private swimCyclePhase: number = 0;
  private jawOpenState: number = 0;
  private jawDirection: number = 0;
  
  // Animation constants
  private readonly finBobFrequency: number = 2.5;
  private readonly finBobAmplitude: number = 0.1;
  private readonly tailSwayFrequency: number = 3.0;
  private readonly tailSwayAmplitude: number = 0.4;
  private readonly bodySwayFactor: number = 0.15;
  private readonly bodySwayOffsetFactor: number = 0.5;

  /**
   * Constructor - creates a new shark asset with enhanced Pixar-style visuals
   */
  constructor() {
    // Initialize mesh properties to satisfy TypeScript strictPropertyInitialization
    // These will be properly assigned in createMesh()
    this.mesh = new THREE.Group();
    this.bodyMesh = new THREE.Mesh();
    this.jawMesh = new THREE.Mesh();
    this.tailFin = new THREE.Mesh();
    this.dorsalFinMesh = new THREE.Mesh();
    this.leftFinMesh = new THREE.Mesh();
    this.rightFinMesh = new THREE.Mesh();
    this.teethMesh = new THREE.Group();
    this.leftEyeMesh = new THREE.Object3D();
    this.rightEyeMesh = new THREE.Object3D();
    this.collisionShape = new THREE.Mesh();
    
    this.createMesh();
  }

  public reset(): void {
    this.animationTime = 0;
    this.swimCyclePhase = 0;
    this.jawOpenState = 0;
    this.jawDirection = 0;

    // Call updateAnimation with deltaTime = 0 to reset poses based on initial animation logic
    this.updateAnimation(0);
    // Additional explicit resets if updateAnimation(0) isn't enough for some parts:
    // e.g., if this.bodyMesh.rotation isn't fully reset by updateAnimation(0)
    // if (this.bodyMesh) this.bodyMesh.rotation.set(0,0,0); 
    // if (this.jawMesh) this.jawMesh.rotation.set(0,0,0);
    // if (this.tailFin) this.tailFin.rotation.set(0, Math.PI / 2, 0); 
    // Ensure fins are reset to their neutral animation positions
    if (this.leftFinMesh) this.leftFinMesh.rotation.z = -Math.PI / 6; 
    if (this.rightFinMesh) this.rightFinMesh.rotation.z = Math.PI / 6;
  }

  /**
   * Returns configuration for the shark obstacle
   */
  public get config(): Readonly<SharkConfig> {
    // Provide default values in case config is not available
    const defaultConfig: SharkConfig = {
      patrolSpeed: 1.5,
      patrolRangeX: 2.4,
      baseScale: 1.0,
      visuals: {
        mainColor: 0x2C3E50, // Dark blue-gray
        detailColor: 0x34495E, // Slightly lighter blue-gray for details
        roughness: 0.7,
        metalness: 0.1,
        emissiveColor: 0x000000, // No emission
        emissiveIntensity: 0,
        interior: {
          mainColor: 0xffffff, // White teeth
          roughness: 0.2,
          metalness: 0.0
        }
      }
    };

    try {
      return configSystem.getObstaclesConfig().shark || defaultConfig;
    } catch (error) {
      console.warn("SharkAsset: Could not get shark config, using defaults", error);
      return defaultConfig;
    }
  }

  private createMesh(): void {
    // Get the scale from config
    const scale = this.config.baseScale || 1.0;
    
    if (isNaN(scale) || scale <= 0) {
      console.error("SharkAsset: Invalid scale detected in createMesh:", scale, "Falling back to 1.0");
      (scale as number) = 1.0; // Type assertion to reassign
    }

    const visualConf = this.config.visuals;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness || 0.7,
      metalness: visualConf.metalness || 0.1,
      emissive: new THREE.Color(visualConf.emissiveColor || 0x000000),
      emissiveIntensity: visualConf.emissiveIntensity || 0
    });
    
    const finMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.detailColor || visualConf.mainColor),
      roughness: (visualConf.roughness || 0.7) * 1.1, 
      metalness: (visualConf.metalness || 0.1) * 0.8
    });
    
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.2,
      metalness: 0.1,
    });
    
    const eyeHighlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, 
      roughness: 0.05,
      metalness: 0.0,
      emissive: 0xeeeeee,
      emissiveIntensity: 0.8
    });
    
    const teethMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.interior?.mainColor || 0xf0f0f0),
      roughness: visualConf.interior?.roughness || 0.5,
      metalness: visualConf.interior?.metalness || 0.0,
    });
    
    const jawMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor).offsetHSL(0, 0, -0.05),
      roughness: (visualConf.roughness || 0.7) * 0.9, 
      metalness: (visualConf.metalness || 0.1) * 1.2
    });
    
    // Body dimensions
    const bodyLength = 1.8 * scale;
    const bodyRadius = 0.35 * scale;
    const capsuleCylinderLength = bodyLength - 2 * bodyRadius;

    if (isNaN(bodyRadius) || bodyRadius <= 0) {
      console.error("SharkAsset: Invalid bodyRadius calculated:", bodyRadius, "Scale:", scale);
    }
    if (isNaN(capsuleCylinderLength) || capsuleCylinderLength < 0) { // Cylinder length can be 0 for a perfect sphere capsule
      console.error("SharkAsset: Invalid capsuleCylinderLength calculated:", capsuleCylinderLength, "BodyLength:", bodyLength, "BodyRadius:", bodyRadius);
    }
    
    // Create body with improved geometry and texture
    const bodyGeom = new THREE.CapsuleGeometry(bodyRadius, capsuleCylinderLength, 16, 32); // More segments for smoother look
    bodyGeom.rotateX(Math.PI / 2); // Orient horizontally
    
    // Create a procedural texture for the shark body using a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create enhanced body material
    let enhancedBodyMaterial: THREE.MeshStandardMaterial;
    
    if (ctx) {
      // Create gradient background for shark skin
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#303540'); // Darker on top
      gradient.addColorStop(0.5, '#505060'); // Medium in middle
      gradient.addColorStop(1, '#606575'); // Lighter on bottom
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // Add subtle pattern/texture for shark skin
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      
      // Add subtle spots and streaks
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = 2 + Math.random() * 10;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add some streaks for more realistic shark skin
      for (let i = 0; i < 30; i++) {
        const x1 = Math.random() * 512;
        const y1 = Math.random() * 512;
        const x2 = x1 + (Math.random() * 100 - 50);
        const y2 = y1 + (Math.random() * 100 - 50);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 1 + Math.random() * 3;
        ctx.stroke();
      }
      
      // Convert canvas to texture
      const bodyTexture = new THREE.CanvasTexture(canvas);
      
      // Create enhanced body material with the procedural texture
      enhancedBodyMaterial = new THREE.MeshStandardMaterial({
        map: bodyTexture,
        color: new THREE.Color(visualConf.mainColor),
        roughness: visualConf.roughness || 0.7,
        metalness: visualConf.metalness || 0.1,
        emissive: new THREE.Color(visualConf.emissiveColor || 0x000000),
        emissiveIntensity: visualConf.emissiveIntensity || 0,
        bumpMap: bodyTexture,
        bumpScale: 0.02
      });
    } else {
      // Fallback if canvas context is not available
      enhancedBodyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConf.mainColor),
        roughness: visualConf.roughness || 0.7,
        metalness: visualConf.metalness || 0.1,
        emissive: new THREE.Color(visualConf.emissiveColor || 0x000000),
        emissiveIntensity: visualConf.emissiveIntensity || 0
      });
    }
    
    this.bodyMesh = new THREE.Mesh(bodyGeom, enhancedBodyMaterial);
    this.bodyMesh.name = "SharkBody";
    this.mesh.add(this.bodyMesh);
    
    // Add gill slits on both sides of the shark
    const gillGroup = new THREE.Group();
    gillGroup.name = "SharkGills";
    const gillMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConf.detailColor || 0x502020),
        roughness: 0.6,
        metalness: 0.1,
        emissive: new THREE.Color(visualConf.emissiveColor || visualConf.detailColor || 0x301010).multiplyScalar(0.5),
        emissiveIntensity: (visualConf.emissiveIntensity || 0.2) * 0.5
    });
    
    // Create 5 gill slits on each side
    for (let i = 0; i < 5; i++) {
      // Position along the body near the head
      const zPos = bodyLength * 0.3 - (i * bodyRadius * 0.25);
      
      // Left gill slit
      const leftGillGeometry = new THREE.BoxGeometry(bodyRadius * 0.05, bodyRadius * 0.4, bodyRadius * 0.02); // Thinner gills
      leftGillGeometry.translate(bodyRadius * 0.92, 0, zPos); // Adjusted position slightly
      
      const leftGill = new THREE.Mesh(leftGillGeometry, gillMaterial);
      leftGill.name = `LeftGill${i}`;
      leftGill.userData = { originalPosition: leftGill.position.clone() };
      gillGroup.add(leftGill);
      this.gillMeshes.push(leftGill);
      
      // Right gill slit (mirror of left)
      const rightGillGeometry = new THREE.BoxGeometry(bodyRadius * 0.05, bodyRadius * 0.4, bodyRadius * 0.02); // Thinner gills
      rightGillGeometry.translate(-bodyRadius * 0.92, 0, zPos); // Adjusted position slightly
      
      const rightGill = new THREE.Mesh(rightGillGeometry, gillMaterial);
      rightGill.name = `RightGill${i}`;
      rightGill.userData = { originalPosition: rightGill.position.clone() };
      gillGroup.add(rightGill);
      this.gillMeshes.push(rightGill);
    }
    
    this.mesh.add(gillGroup);
    
    // Create jaw (separate mesh for animation) with more shark-like features
    const jawLength = bodyLength * 0.35; // Slightly longer jaw
    const jawRadius = bodyRadius * 0.8;
    
    // Create a more realistic shark jaw using a custom geometry
    const jawGeom = new THREE.BufferGeometry();
    
    // Create a more pointed shark jaw shape
    const jawPoints = [];
    const jawSegments = 12;
    const jawWidth = jawRadius * 1.2;
    const jawHeight = jawRadius * 0.7;
    
    // Create bottom half of jaw with a more pointed shape
    for (let i = 0; i <= jawSegments; i++) {
      const t = i / jawSegments;
      const angle = Math.PI * t;
      const x = jawLength * (1 - t); // Taper toward the front
      const y = -jawHeight * Math.sin(angle) * (1 - t * 0.5); // Flatten toward the front
      const z = jawWidth * Math.cos(angle) * (1 - t * 0.3); // Narrow toward the front
      jawPoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Create top half of jaw
    for (let i = jawSegments; i >= 0; i--) {
      const t = i / jawSegments;
      const angle = Math.PI * t;
      const x = jawLength * (1 - t); // Taper toward the front
      const y = jawHeight * 0.6 * Math.sin(angle) * (1 - t * 0.7); // Flatter top
      const z = jawWidth * Math.cos(angle) * (1 - t * 0.3); // Narrow toward the front
      jawPoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Create faces for the jaw
    const jawIndices: number[] = [];
    const jawVertices: number[] = [];
    const jawUVs: number[] = [];
    
    // Add vertices and UVs
    jawPoints.forEach((point, i) => {
      jawVertices.push(point.x, point.y, point.z);
      jawUVs.push(point.x / jawLength, point.z / jawWidth + 0.5);
    });
    
    // Create triangles
    for (let i = 0; i < jawSegments; i++) {
      // Bottom half
      jawIndices.push(i, i + 1, i + jawSegments + 1);
      jawIndices.push(i, i + jawSegments + 1, i + jawSegments);
      
      // Top half (connect to bottom)
      const topStart = jawSegments + 1;
      jawIndices.push(topStart + i, topStart + i + 1, i + 1);
      jawIndices.push(topStart + i, i + 1, i);
    }
    
    // Set attributes
    jawGeom.setAttribute('position', new THREE.Float32BufferAttribute(jawVertices, 3));
    jawGeom.setAttribute('uv', new THREE.Float32BufferAttribute(jawUVs, 2));
    jawGeom.setIndex(jawIndices);
    jawGeom.computeVertexNormals();
    
    // Create the jaw mesh
    this.jawMesh = new THREE.Mesh(jawGeom, jawMaterial);
    this.jawMesh.position.z = bodyLength / 2 - jawLength * 0.1; // Position at front of body
    this.jawMesh.rotation.x = 0.1; // Slightly open by default
    this.mesh.add(this.jawMesh);
    
    // Add more realistic shark teeth - triangular and menacing
    const upperTeethCount = 10;
    const lowerTeethCount = 8;
    
    // Create a group to hold all teeth
    const teethGroup = new THREE.Group();
    teethGroup.name = "SharkTeeth";
    
    // Create more realistic shark tooth geometry - triangular and flat
    const createToothGeometry = (size: number): THREE.BufferGeometry => {
      const toothGeom = new THREE.BufferGeometry();
      const halfWidth = size * 0.5;
      const height = size * 1.5;
      const thickness = size * 0.2;
      
      // Define vertices for a triangular tooth
      const vertices = [
        // Front face
        0, 0, thickness/2,            // tip
        -halfWidth, -height, thickness/2,  // bottom left
        halfWidth, -height, thickness/2,   // bottom right
        
        // Back face
        0, 0, -thickness/2,           // tip
        -halfWidth, -height, -thickness/2, // bottom left
        halfWidth, -height, -thickness/2,  // bottom right
      ];
      
      // Define faces (triangles)
      const indices = [
        0, 1, 2,      // front face
        3, 5, 4,      // back face (reversed)
        0, 3, 1,      // left side
        1, 3, 4,      // left side
        0, 2, 3,      // right side
        2, 5, 3,      // right side
        1, 4, 2,      // bottom
        2, 4, 5       // bottom
      ];
      
      toothGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      toothGeom.setIndex(indices);
      toothGeom.computeVertexNormals();
      
      return toothGeom;
    };
    
    // Create upper teeth (larger, more prominent)
    const upperToothSize = scale * 0.05;
    const upperToothGeom = createToothGeometry(upperToothSize);
    const upperTeethSpacing = jawWidth * 1.6 / upperTeethCount;
    
    for (let i = 0; i < upperTeethCount; i++) {
      const tooth = new THREE.Mesh(upperToothGeom, teethMaterial);
      // Position in an arc along the jaw
      const angle = Math.PI * (0.2 + 0.6 * (i / (upperTeethCount - 1)));
      const xPos = Math.cos(angle) * jawWidth * 0.8;
      const zPos = Math.sin(angle) * jawWidth * 0.8;
      tooth.position.set(jawLength * 0.1 - xPos * 0.2, -jawHeight * 0.5, zPos);
      tooth.rotation.x = Math.PI / 2; // Orient downward
      tooth.rotation.z = -angle + Math.PI / 2; // Point inward
      teethGroup.add(tooth);
    }
    
    // Create lower teeth (slightly smaller)
    const lowerToothSize = scale * 0.045;
    const lowerToothGeom = createToothGeometry(lowerToothSize);
    const lowerTeethSpacing = jawWidth * 1.5 / lowerTeethCount;
    
    for (let i = 0; i < lowerTeethCount; i++) {
      const tooth = new THREE.Mesh(lowerToothGeom, teethMaterial);
      // Position in an arc along the jaw
      const angle = Math.PI * (0.25 + 0.5 * (i / (lowerTeethCount - 1)));
      const xPos = Math.cos(angle) * jawWidth * 0.75;
      const zPos = Math.sin(angle) * jawWidth * 0.75;
      tooth.position.set(jawLength * 0.15 - xPos * 0.3, jawHeight * 0.4, zPos);
      tooth.rotation.x = -Math.PI / 2; // Orient upward
      tooth.rotation.z = angle - Math.PI / 2; // Point inward
      teethGroup.add(tooth);
    }
    
    // Store reference to the teeth group
    this.teethMesh = teethGroup;
    this.jawMesh.add(this.teethMesh);
    
    // Create dorsal fin with improved shape
    const dorsalShape = new THREE.Shape();
    const dorsalHeight = 0.5 * scale;
    const dorsalLength = 0.4 * scale;
    dorsalShape.moveTo(0, 0);
    dorsalShape.quadraticCurveTo(dorsalLength * 0.3, dorsalHeight * 0.8, dorsalLength * 0.6, dorsalHeight);
    dorsalShape.quadraticCurveTo(dorsalLength * 0.9, dorsalHeight * 0.5, dorsalLength, 0.1 * dorsalHeight);
    dorsalShape.lineTo(0,0); // Close the shape

    const extrudeSettings = { depth: 0.04 * scale, bevelEnabled: true, bevelThickness: 0.01 * scale, bevelSize: 0.01 * scale, bevelSegments: 2 };

    const dorsalGeom = new THREE.ExtrudeGeometry(dorsalShape, extrudeSettings);
    this.dorsalFinMesh = new THREE.Mesh(dorsalGeom, finMaterial);
    this.dorsalFinMesh.name = "DorsalFin";
    this.dorsalFinMesh.position.set(0, bodyRadius * 0.8, bodyLength * 0.05);
    this.dorsalFinMesh.rotation.y = Math.PI / 2; // Rotate to align with body
    this.bodyMesh.add(this.dorsalFinMesh); // Add to body for coordinated movement

    // Pectoral Fins (Left & Right)
    const pectoralShape = new THREE.Shape();
    const pectoralLength = 0.6 * scale;
    const pectoralWidth = 0.35 * scale;
    pectoralShape.moveTo(0, 0);
    pectoralShape.quadraticCurveTo(pectoralLength * 0.7, pectoralWidth * 0.2, pectoralLength, pectoralWidth * 0.3);
    pectoralShape.quadraticCurveTo(pectoralLength * 0.6, pectoralWidth * 0.8, pectoralLength * 0.2, pectoralWidth);
    pectoralShape.quadraticCurveTo(0, pectoralWidth * 0.5, 0, 0);

    const pectoralGeom = new THREE.ExtrudeGeometry(pectoralShape, { ...extrudeSettings, depth: 0.03 * scale });
    this.leftFinMesh = new THREE.Mesh(pectoralGeom, finMaterial.clone());
    this.leftFinMesh.name = "LeftPectoralFin";
    this.leftFinMesh.position.set(bodyRadius * 0.6, -bodyRadius * 0.3, bodyLength * 0.25);
    this.leftFinMesh.rotation.set(0, Math.PI / 2, -Math.PI / 6); // Angled slightly down and back
    this.bodyMesh.add(this.leftFinMesh);

    this.rightFinMesh = new THREE.Mesh(pectoralGeom.clone(), finMaterial.clone());
    this.rightFinMesh.name = "RightPectoralFin";
    this.rightFinMesh.position.set(-bodyRadius * 0.6, -bodyRadius * 0.3, bodyLength * 0.25);
    this.rightFinMesh.rotation.set(0, -Math.PI / 2, Math.PI / 6); // Angled slightly down and back (mirrored)
    this.bodyMesh.add(this.rightFinMesh);

    // Tail Fin (Caudal)
    const tailShape = new THREE.Shape();
    const tailUpperLobeLength = 0.7 * scale;
    const tailLowerLobeLength = 0.4 * scale;
    const tailBaseWidth = 0.15 * scale;

    tailShape.moveTo(0, tailBaseWidth / 2);
    tailShape.lineTo(tailUpperLobeLength * 0.3, tailBaseWidth * 0.7); // Start of upper curve
    tailShape.quadraticCurveTo(tailUpperLobeLength * 0.8, tailUpperLobeLength * 0.4, tailUpperLobeLength, tailUpperLobeLength * 0.2);
    tailShape.quadraticCurveTo(tailUpperLobeLength * 0.7, 0, 0, 0); // Curve back to center
    tailShape.quadraticCurveTo(tailLowerLobeLength * 0.7, -tailLowerLobeLength * 0.3, tailLowerLobeLength, -tailLowerLobeLength * 0.5);
    tailShape.lineTo(0, -tailBaseWidth / 2);
    tailShape.closePath();

    const tailGeom = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    this.tailFin = new THREE.Mesh(tailGeom, finMaterial.clone());
    this.tailFin.name = "TailFin";
    this.tailFin.position.set(0, 0, -bodyLength * 0.48); // Position at the end of the body
    this.tailFin.rotation.y = Math.PI / 2; // Align with body
    this.bodyMesh.add(this.tailFin); // Add to body for coordinated movement

    // Eyes
    this.leftEyeMesh = new THREE.Object3D();
    this.rightEyeMesh = new THREE.Object3D();
    this.mesh.add(this.leftEyeMesh);
    this.mesh.add(this.rightEyeMesh);

    // Create eye geometry
    const eyeRadius = 0.05 * scale;
    const eyeGeom = new THREE.SphereGeometry(eyeRadius, 16, 16);
    const eyeMaterialInstance = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeHighlightMaterialInstance = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMaterialInstance);
    leftEye.position.set(bodyRadius * 0.4, bodyRadius * 0.2, bodyLength * 0.1);
    this.leftEyeMesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMaterialInstance);
    rightEye.position.set(bodyRadius * 0.4, bodyRadius * 0.2, bodyLength * 0.1);
    this.rightEyeMesh.add(rightEye);

    // Create eye highlight geometry
    const highlightRadius = eyeRadius * 1.2;
    const highlightGeom = new THREE.SphereGeometry(highlightRadius, 16, 16);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftHighlight = new THREE.Mesh(highlightGeom, highlightMaterial);
    leftHighlight.position.set(bodyRadius * 0.4, bodyRadius * 0.2, bodyLength * 0.1);
    this.leftEyeMesh.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeom, highlightMaterial);
    rightHighlight.position.set(bodyRadius * 0.4, bodyRadius * 0.2, bodyLength * 0.1);
    this.rightEyeMesh.add(rightHighlight);

    // Create and add collision shape (ensure this is done AFTER bodyMesh is defined and positioned if relative)
    const collisionCapsuleRadius = bodyRadius * 1.1;
    const collisionCapsuleCylinderLength = capsuleCylinderLength; // Using the same checked length

    if (isNaN(collisionCapsuleRadius) || collisionCapsuleRadius <= 0) {
      console.error("SharkAsset: Invalid collisionCapsuleRadius calculated:", collisionCapsuleRadius, "BodyRadius:", bodyRadius);
    }
    // collisionCapsuleCylinderLength is already checked above

    const collisionGeom = new THREE.CapsuleGeometry(collisionCapsuleRadius, collisionCapsuleCylinderLength, 8, 16); // Slightly larger, fewer segments
    collisionGeom.rotateX(Math.PI / 2); // Orient horizontally, same as body
    const collisionMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true }); // Invisible
    // Re-assign this.collisionShape to a new Mesh with geometry and material
    this.collisionShape = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionShape.name = "SharkCollider";
    
    // Position the collision shape relative to the body or at the group's origin
    // If bodyMesh is at the group's origin, collisionShape can be too.
    // The existing line 579: this.collisionShape.position.y = this.bodyMesh.position.y + 0.05;
    // suggests bodyMesh might not be at (0,0,0) of the group, or a slight offset is desired.
    // For simplicity, let's assume bodyMesh is centered in the group, so collisionShape can be too.
    // If bodyMesh itself is added to this.mesh at some offset, this needs to match.
    // Given this.bodyMesh.position is used later for its y position, we assume it's added to this.mesh at (0,0,0)
    this.collisionShape.position.copy(this.bodyMesh.position); // Match bodyMesh's local position
    // The line 579 (this.collisionShape.position.y = this.bodyMesh.position.y + 0.05;) will further adjust this.

    this.mesh.add(this.collisionShape); // Add to the main group

    // Ensure the specific y-positioning for collision shape is applied
    // This line was found via grep at line 579, so we replicate its logic here or ensure it's covered.
    // If bodyMesh's y position is set before this, and collisionShape copies it, then adds offset:
    this.collisionShape.position.y += 0.05; // Apply the Y offset

    this.mesh.scale.set(scale, scale, scale); // Apply overall scale to the main group
  }

  /**
   * Returns the main mesh of this asset
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionShape;
  }

  /**
   * Determines if the shark is dangerous (always true)
   */
  public isDangerous(): boolean {
    return true; // Shark is always dangerous
  }

  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    this.swimCyclePhase = (this.animationTime * (this.config.visuals.animationSpeed || this.tailSwayFrequency)) % (Math.PI * 2);

    // Tail Animation (more S-curve like)
    const tailSway = Math.sin(this.swimCyclePhase) * (this.config.visuals.animationAmplitude || this.tailSwayAmplitude);
    this.tailFin.rotation.y = Math.PI / 2 + tailSway; // Base rotation + sway

    // Body Animation (follows tail for S-curve)
    // Apply to bodyMesh and jawMesh together if jaw is separate body part for rotation
    const bodySway = Math.sin(this.swimCyclePhase - (this.bodySwayOffsetFactor * Math.PI)) * tailSway * this.bodySwayFactor;
    this.bodyMesh.rotation.y = bodySway;
    // If jaw is a separate object that should also sway with the body:
    // this.jawMesh.rotation.y = bodySway; 

    // Pectoral Fin Animation (subtle bobbing for stability/steering)
    const finBobPhase = (this.animationTime * (this.config.visuals.animationSpeed ? this.config.visuals.animationSpeed * 0.8 : this.finBobFrequency)) % (Math.PI * 2);
    const finBob = Math.sin(finBobPhase) * (this.config.visuals.animationAmplitude ? this.config.visuals.animationAmplitude * 0.2 : this.finBobAmplitude);
    
    if (this.leftFinMesh) {
      this.leftFinMesh.rotation.z = -Math.PI / 6 + finBob; // Base angle + bob
    }
    if (this.rightFinMesh) {
      this.rightFinMesh.rotation.z = Math.PI / 6 - finBob; // Base angle + bob (mirrored)
    }

    // Dorsal Fin (subtle counter-sway or more rigid)
    if (this.dorsalFinMesh) {
        this.dorsalFinMesh.rotation.z = -bodySway * 0.5; // Slight counter-rotation to body sway
    }

    // Gill Animation (subtle pulsing)
    const gillPulse = Math.sin(this.animationTime * 3.0) * 0.005 * this.config.baseScale;
    this.gillMeshes.forEach((gill, index) => {
      const side = gill.name.includes("Left") ? 1 : -1;
      gill.position.x = gill.userData.originalPosition.x + side * gillPulse * (index % 2 === 0 ? 1 : 0.5); // Alternate pulse strength
    });

    // Update collision shape (if it needs to follow animations, e.g. jaw)
    if (isNaN(this.bodyMesh.position.y)) {
      console.error("SharkAsset: this.bodyMesh.position.y is NaN before updating collisionShape position!");
    }
    this.collisionShape.position.y = this.bodyMesh.position.y + 0.05; // Adjust collision shape position
  }

  public dispose(): void {
    // Dispose of geometries
    this.bodyMesh?.geometry?.dispose();
    this.jawMesh?.geometry?.dispose();
    this.tailFin?.geometry?.dispose();
    this.dorsalFinMesh?.geometry?.dispose();
    this.leftFinMesh?.geometry?.dispose();
    this.rightFinMesh?.geometry?.dispose();
    this.collisionShape?.geometry?.dispose();

    this.teethMesh?.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
      }
    });
    this.gillMeshes.forEach(gill => gill.geometry?.dispose());

    // Dispose of eye geometries (if they are actual meshes)
    [this.leftEyeMesh, this.rightEyeMesh].forEach(eyeObj => {
        eyeObj?.traverse(child => {
        if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
            }
        });
    });

    // Dispose of materials
    if (this.bodyMesh?.material instanceof THREE.Material) {
        const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
        mat.bumpMap?.dispose();
        mat.dispose();
    }
    if (this.jawMesh?.material instanceof THREE.Material) this.jawMesh.material.dispose();
    if (this.tailFin?.material instanceof THREE.Material) this.tailFin.material.dispose();
    if (this.dorsalFinMesh?.material instanceof THREE.Material) this.dorsalFinMesh.material.dispose();
    if (this.leftFinMesh?.material instanceof THREE.Material) this.leftFinMesh.material.dispose();
    if (this.rightFinMesh?.material instanceof THREE.Material) this.rightFinMesh.material.dispose();
    if (this.collisionShape?.material instanceof THREE.Material) this.collisionShape.material.dispose();

    this.teethMesh?.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
        child.material.dispose();
      }
    });
    this.gillMeshes.forEach(gill => {
        if (gill.material instanceof THREE.Material) gill.material.dispose();
    });

    [this.leftEyeMesh, this.rightEyeMesh].forEach(eyeObj => {
        eyeObj?.traverse(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
                child.material.dispose();
            }
        });
    });

    // Clear groups
    this.mesh?.clear();
    this.teethMesh?.clear();
    this.gillMeshes = [];
  }
}