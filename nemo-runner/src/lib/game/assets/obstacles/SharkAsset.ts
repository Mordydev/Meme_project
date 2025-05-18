import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { SharkConfig } from '../../config/gameConfig';

export class SharkAsset {
  public config: Readonly<SharkConfig>;
  public mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  
  // Parts for animation
  private bodyMesh!: THREE.Mesh;
  private tailFin!: THREE.Mesh;
  private dorsalFin!: THREE.Mesh;
  private leftPectoralFin!: THREE.Mesh;
  private rightPectoralFin!: THREE.Mesh;
  private jawMesh!: THREE.Mesh;
  private teethMeshes: THREE.Mesh[] = [];
  private gillMeshes: THREE.Mesh[] = [];

  private animationTime: number = 0;
  public jawOpenAngle: number = 0;

  constructor() {
    this.config = configSystem.getObstaclesConfig().shark;
    this.createMesh();
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "SharkObstacle_Detailed";
    const visualConf = this.config.visuals;
    const scale = this.config.baseScale || 1.0;
    
    // --- Texture for Two-Tone Body and Bump ---
    const canvas = document.createElement('canvas');
    const canvasSize = 128; // Power of 2 for texture size
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    let bodyTexture = null;
    let bodyBumpMap = null;

    if (ctx) {
        // Gradient for two-tone (top dark, bottom light)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
        gradient.addColorStop(0, `#${new THREE.Color(visualConf.mainColor || 0x607D8B).getHexString()}`); // Top color
        gradient.addColorStop(0.45, `#${new THREE.Color(visualConf.mainColor || 0x607D8B).getHexString()}`);
        gradient.addColorStop(0.55, `#${new THREE.Color(visualConf.underbellyColor || 0xB0BEC5).getHexString()}`); // Bottom color
        gradient.addColorStop(1, `#${new THREE.Color(visualConf.underbellyColor || 0xB0BEC5).getHexString()}`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Noise for texture/bump map
        const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
        const data = imageData.data;
        const noiseIntensity = 30; // Adjust for subtle noise
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * noiseIntensity;
            data[i] += noise;     // Red
            data[i + 1] += noise; // Green
            data[i + 2] += noise; // Blue
        }
        ctx.putImageData(imageData, 0, 0);
        
        bodyTexture = new THREE.CanvasTexture(canvas);
        bodyTexture.wrapS = THREE.RepeatWrapping;
        bodyTexture.wrapT = THREE.RepeatWrapping;
        // For UV mapping to work correctly top-to-bottom on a capsule rotated on X,
        // we might need to adjust repeat or offset, or how UVs are generated.
        // Default UVs for CapsuleGeometry might go around the circumference.
        // If body texture looks sideways, may need to adjust UVs or texture mapping.

        // Create a separate canvas for bump map from noise for more control if needed
        // For now, let's assume the main texture can also serve as a basis for bump
        // or that the visual style doesn't need a strong separate bump from this noise.
        // If a dedicated bump is needed, draw greyscale noise here.
        bodyBumpMap = new THREE.CanvasTexture(canvas); // Re-using for simplicity, ideally a grayscale noise map
        bodyBumpMap.wrapS = THREE.RepeatWrapping;
        bodyBumpMap.wrapT = THREE.RepeatWrapping;
    }

    // --- Materials ---
    const bodyMaterial = new THREE.MeshStandardMaterial({
      // color: new THREE.Color(visualConf.mainColor || 0x556B82), // Color will come from texture map
      map: bodyTexture, // Apply the procedural texture
      bumpMap: bodyBumpMap, // Apply the bump map
      bumpScale: visualConf.texturePatternScale || 0.05, // Configurable bump intensity
      roughness: visualConf.roughness || 0.35,
      metalness: visualConf.metalness || 0.15,
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor).multiplyScalar(0.1),
      emissiveIntensity: visualConf.emissiveIntensity || 0.05,
    });
    
    const finMaterial = bodyMaterial.clone(); // Fins can use the same base material or a variant
    // If fins should not have the strong gradient, use a non-textured material or adjust UVs
    // For now, they will also get the gradient + noise.
    // finMaterial.color.offsetHSL(0,0,0.05); // This would tint the texture
    finMaterial.map = null; // Let's make fins a solid color for now, slightly lighter
    finMaterial.bumpMap = null;
    finMaterial.color = new THREE.Color(visualConf.mainColor || 0x607D8B).offsetHSL(0,0,0.05);

    
    const teethMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConf.teethColor || 0xFFFFFF),
        roughness: visualConf.teethRoughness || 0.6,
        metalness: visualConf.teethMetalness || 0.0,
    });
    
    // --- Body ---
    const bodyLength = 1.6 * scale;
    const bodyRadius = 0.3 * scale;
    const bodyGeom = new THREE.CapsuleGeometry(bodyRadius, bodyLength - 2 * bodyRadius, 16, 24);
    bodyGeom.rotateX(Math.PI / 2); 

    const positions = bodyGeom.attributes.position.array as Float32Array;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positions.length / 3; i++) {
        vertex.fromBufferAttribute(bodyGeom.attributes.position, i);
        const zNormalized = vertex.z / (bodyLength / 2); 
        
        let scaleFactor = 1.0;
        if (zNormalized > 0.2) {
            scaleFactor *= 1.0 - Math.pow((zNormalized - 0.2) / 0.8, 2.0) * 0.8; 
        }
        if (zNormalized < -0.6) {
            scaleFactor *= 1.0 - Math.pow((Math.abs(zNormalized) - 0.6) / 0.4, 1.5) * 0.2;
        }
        if (zNormalized > -0.4 && zNormalized < 0.1) {
            scaleFactor *= 1.0 + Math.sin((zNormalized + 0.4) / 0.5 * Math.PI) * 0.1;
        }
        vertex.x *= scaleFactor * 0.9; 
        vertex.y *= scaleFactor;
        bodyGeom.attributes.position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    bodyGeom.computeVertexNormals();
    
    this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
    this.bodyMesh.name = "SharkBody";
    this.mesh.add(this.bodyMesh);
    
    // --- Jaw ---
    const jawWidth = bodyRadius * 1.2 * 0.9;
    const jawHeight = bodyRadius * 0.3;
    const jawDepth = bodyLength * 0.25;
    const jawGeom = new THREE.BoxGeometry(jawWidth, jawHeight, jawDepth);
    jawGeom.translate(0, -jawHeight / 2, -jawDepth / 2); 

    this.jawMesh = new THREE.Mesh(jawGeom, bodyMaterial.clone());
    this.jawMesh.name = "SharkJaw";
    this.jawMesh.position.set(0, -bodyRadius * 0.25, -bodyLength/2 + jawDepth * 0.1);
    this.bodyMesh.add(this.jawMesh);

    // --- Teeth ---
    const numTeethUpper = visualConf.teethCountUpper || 8;
    const numTeethLower = visualConf.teethCountLower || 6;
    const toothSize = bodyRadius * 0.05 * scale;
    const toothGeom = new THREE.ConeGeometry(toothSize, toothSize * 2, 4);
    toothGeom.rotateX(Math.PI / 2);

    for (let i = 0; i < numTeethUpper; i++) {
        const tooth = new THREE.Mesh(toothGeom, teethMaterial);
        const percent = (i / (numTeethUpper -1)) - 0.5;
        tooth.position.set(
            percent * jawWidth * 0.8,
            -bodyRadius * 0.1,
            -bodyLength / 2 + Math.abs(percent*2) * jawDepth * 0.1 + jawDepth * 0.1
        );
        tooth.rotation.z = Math.PI;
        this.bodyMesh.add(tooth);
        this.teethMeshes.push(tooth);
    }

    for (let i = 0; i < numTeethLower; i++) {
        const tooth = new THREE.Mesh(toothGeom, teethMaterial);
        const percent = (i / (numTeethLower - 1)) - 0.5;
        tooth.position.set(
            percent * jawWidth * 0.75,
            jawHeight/2 - toothSize*0.5,
            -jawDepth * 0.1 - Math.abs(percent*2) * jawDepth * 0.2
        );
        this.jawMesh.add(tooth);
        this.teethMeshes.push(tooth);
    }

    // --- Fins ---
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0,0); dorsalShape.lineTo(-0.2*scale, 0); dorsalShape.lineTo(0, 0.6*scale); dorsalShape.lineTo(0.15*scale, 0);
    const dorsalExtrude = { depth: 0.06*scale, bevelEnabled:true, bevelThickness:0.01*scale, bevelSize:0.01*scale, bevelSegments:1 };
    const dorsalGeom = new THREE.ExtrudeGeometry(dorsalShape, dorsalExtrude);
    dorsalGeom.rotateY(Math.PI/2);
    this.dorsalFin = new THREE.Mesh(dorsalGeom, finMaterial);
    this.dorsalFin.position.set(0, bodyRadius * 0.8, -bodyLength * 0.05);
    this.mesh.add(this.dorsalFin);

    const pectoralShape = new THREE.Shape();
    pectoralShape.moveTo(0,0); pectoralShape.lineTo(0.5*scale, 0.1*scale); pectoralShape.lineTo(0.4*scale, -0.15*scale); pectoralShape.lineTo(0, -0.05*scale);
    const pectoralExtrude = { depth: 0.04*scale, bevelEnabled:true, bevelThickness:0.01*scale, bevelSize:0.01*scale, bevelSegments:1 };
    const pectoralGeom = new THREE.ExtrudeGeometry(pectoralShape, pectoralExtrude);
    
    this.leftPectoralFin = new THREE.Mesh(pectoralGeom, finMaterial.clone());
    this.leftPectoralFin.position.set(bodyRadius * 0.9, -bodyRadius * 0.3, -bodyLength * 0.2);
    this.leftPectoralFin.rotation.set(0, -Math.PI / 5, -Math.PI / 7);
    this.mesh.add(this.leftPectoralFin);

    this.rightPectoralFin = new THREE.Mesh(pectoralGeom.clone(), finMaterial.clone());
    this.rightPectoralFin.position.set(-bodyRadius * 0.9, -bodyRadius * 0.3, -bodyLength * 0.2);
    this.rightPectoralFin.rotation.set(0, Math.PI / 5, -Math.PI / 7);
    this.mesh.add(this.rightPectoralFin);

    // Tail Fin (Caudal) - Heterocercal
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0,0);
    tailShape.lineTo(0.1*scale, 0.7*scale);
    tailShape.lineTo(0.05*scale, 0.1*scale);
    tailShape.lineTo(0.15*scale, -0.4*scale);
    tailShape.lineTo(0,0);
    const tailExtrude = { depth: 0.05*scale, bevelEnabled:true, bevelThickness:0.01*scale, bevelSize:0.01*scale, bevelSegments:1 };
    const tailGeom = new THREE.ExtrudeGeometry(tailShape, tailExtrude);
    this.tailFin = new THREE.Mesh(tailGeom, finMaterial.clone());
    this.tailFin.position.set(0, 0, bodyLength/2 * 0.95);
    this.bodyMesh.add(this.tailFin);
    
    // Gill slits
    this.gillMeshes = [];
    for(let i=0; i<3; i++) { 
        const gillGeom = new THREE.BoxGeometry(0.01*scale, 0.15*scale, 0.03*scale);
        const gillMat = new THREE.MeshStandardMaterial({color: new THREE.Color(visualConf.mainColor || 0x556B82).multiplyScalar(0.7)}); 
        const gillL = new THREE.Mesh(gillGeom, gillMat);
        gillL.position.set(bodyRadius*0.75, 0, -bodyLength*0.3 + i*0.08*scale);
        gillL.rotation.y = Math.PI/8;
        this.mesh.add(gillL);
        this.gillMeshes.push(gillL);

        const gillR = gillL.clone();
        gillR.position.x *= -1;
        gillR.rotation.y *= -1;
        this.mesh.add(gillR);
        this.gillMeshes.push(gillR);
    }

    // Collision Shape 
    const collisionGeom = new THREE.CapsuleGeometry(bodyRadius * 1.05, bodyLength - 2 * bodyRadius * 1.05, 8, 12);
    collisionGeom.rotateX(Math.PI/2);
    this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({visible: false, wireframe: true}));
    this.collisionMesh.name = "SharkCollider";
    this.mesh.add(this.collisionMesh);

    this.mesh.userData = { type: 'obstacle', name: 'shark', assetInstance: this, isDangerous: true };
  }

  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const animSpeed = this.config.visuals?.animationSpeed || 3.0;
    const animAmp = this.config.visuals?.animationAmplitude || 0.2;
    const jawAnimSpeed = this.config.visuals?.jawAnimationSpeed || animSpeed * 0.7;
    const jawMaxAngle = THREE.MathUtils.degToRad(this.config.visuals?.jawMaxAngleDeg || 30);
    const gillAnimSpeed = this.config.visuals?.gillAnimationSpeed || 2.0;
    const gillAnimAmplitude = this.config.visuals?.gillAnimationAmplitude || 0.1;

    const jawCycleProgress = (Math.sin(this.animationTime * jawAnimSpeed) + 1) / 2;
    this.jawMesh.rotation.x = jawCycleProgress * jawMaxAngle;

    if (this.tailFin) {
      this.tailFin.rotation.y = Math.sin(this.animationTime * animSpeed) * animAmp;
      this.tailFin.rotation.z = Math.sin(this.animationTime * animSpeed * 1.5 + 0.5) * animAmp * 0.3;
    }

    if (this.bodyMesh) {
      this.bodyMesh.rotation.y = Math.sin(this.animationTime * animSpeed - 0.3) * animAmp * 0.15;
    }
    
    const pectoralBaseRotationZ = -Math.PI / 7;
    const pectoralAngle = Math.sin(this.animationTime * animSpeed * 0.5) * 0.05; 
    if(this.leftPectoralFin) {
        this.leftPectoralFin.rotation.z = pectoralBaseRotationZ + pectoralAngle;
    }
    if(this.rightPectoralFin) {
        this.rightPectoralFin.rotation.z = pectoralBaseRotationZ - pectoralAngle; 
    }

    if (this.dorsalFin && this.bodyMesh) {
         this.dorsalFin.rotation.y = -this.bodyMesh.rotation.y * 0.5; 
    }

    this.gillMeshes.forEach((gill, index) => {
        const gillPulse = Math.sin(this.animationTime * gillAnimSpeed + index * 0.5) * gillAnimAmplitude + 1.0;
        gill.scale.y = gillPulse;
    });
  }
  
  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean { return true; }

  public reset(): void { 
    this.animationTime = 0; 
    this.jawOpenAngle = 0;
    if (this.jawMesh) this.jawMesh.rotation.x = 0;
    if (this.tailFin) {
        this.tailFin.rotation.y = 0;
        this.tailFin.rotation.z = 0;
    }
    if (this.bodyMesh) this.bodyMesh.rotation.y = 0;
    if (this.dorsalFin) this.dorsalFin.rotation.y = 0;

    this.gillMeshes.forEach(gill => {
        if (gill) gill.scale.set(1,1,1);
    });
  }

  public dispose(): void {
    if (this.mesh) {
        this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
        }
      });
    }
    
    // Explicitly dispose of canvas textures if they are stored on the asset
    (this.bodyMesh?.material as THREE.MeshStandardMaterial)?.map?.dispose();
    (this.bodyMesh?.material as THREE.MeshStandardMaterial)?.bumpMap?.dispose();
    // If finMaterial or jawMaterial cloned the map, it needs to be handled too, or ensure single instance
    // The current implementation re-clones bodyMaterial for jaw, and fins use a map-less clone.
    // So, only the main bodyTexture and bodyBumpMap on bodyMesh's material need explicit disposal if not shared.
    // However, the traverse should catch materials on meshes. Storing textures separately and disposing is safer.
    // For now, assuming MeshStandardMaterial.dispose() handles its own maps if they are not shared by other alive materials.
    // To be super safe, store bodyTexture and bodyBumpMap on the class instance and dispose them here.

    this.teethMeshes = [];
    this.gillMeshes = [];

    // @ts-ignore
    this.mesh = null;
    // @ts-ignore
    this.bodyMesh = null;
    // @ts-ignore
    this.jawMesh = null;
    // @ts-ignore
    this.tailFin = null;
    // @ts-ignore
    this.dorsalFin = null;
    // @ts-ignore
    this.leftPectoralFin = null;
    // @ts-ignore
    this.rightPectoralFin = null;
    // @ts-ignore
    this.collisionMesh = null;
  }
}