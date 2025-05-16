import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { SchoolOfFishObstacleConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

interface FishInstanceData {
  matrix: THREE.Matrix4;
  baseOffset: THREE.Vector3; 
  animationOffset: number;  
  targetQuaternion: THREE.Quaternion; // For smoother orientation changes
  currentColor: THREE.Color; // For color variation
}

export class SchoolOfFishAsset {
  public config: Readonly<SchoolOfFishObstacleConfig>;
  public mesh!: THREE.Group;
  public instancedMesh!: THREE.InstancedMesh;
  private fishData: FishInstanceData[] = [];
  private individualFishGeometry!: THREE.BufferGeometry; // Store for disposal
  
  public collisionMesh!: THREE.Mesh;

  private animationTime: number = 0;

  constructor() { // Removed shaderManager
    this.config = this._fetchConfig();
    this.createMesh();
  }

  private _fetchConfig(): Readonly<SchoolOfFishObstacleConfig> {
    const defaultConfig: SchoolOfFishObstacleConfig = {
        individualFishScale: 0.25,
        fishCountMin: 30,
        fishCountMax: 50,
        schoolRadius: 1.5, 
        depthCoverage: 1.0, 
        formation: 'swarm', 
        baseSpeedFactor: 1.0, 
        visuals: {
            mainColor: 0xFF8C00,    // DarkOrange
            detailColor: 0xFFA500,  // Orange (for variation)
            emissiveColor: 0xFF7000, // Slightly darker, saturated orange emissive
            emissiveIntensity: 0.15, // Subtle emissive
            roughness: 0.4,          // Adjusted for potentially less metallic look
            metalness: 0.4,          // Adjusted for potentially less metallic look
            animationSpeed: 2.0,
            animationAmplitude: 0.1
        }
    };
    try {
        const specificConfig = configSystem.getObstaclesConfig().schoolOfFish;
        return { ...defaultConfig, ...specificConfig, visuals: { ...defaultConfig.visuals, ...specificConfig?.visuals } };
    } catch (error) {
        console.warn("SchoolOfFishAsset: Could not get config, using defaults", error);
        return defaultConfig;
    }
  }

  private createIndividualFishGeometry(): THREE.BufferGeometry {
    const scale = this.config.individualFishScale; // Base scale, primarily for width/details
    const lengthHeightIncreaseFactor = 1.25; // Make fish 25% longer and taller

    // Adjusted dimensions for bigger length/height, width remains proportional to original scale intent
    const bodyLength = 0.8 * scale * lengthHeightIncreaseFactor;
    const bodyHeight = 0.25 * scale * lengthHeightIncreaseFactor;
    const bodyWidth = 0.15 * scale; // Width is NOT scaled by lengthHeightIncreaseFactor

    const fishShape = new THREE.Shape();
    // Body silhouette (side view) - uses bodyLength and bodyHeight
    fishShape.moveTo(-bodyLength / 2, 0); 
    fishShape.quadraticCurveTo(-bodyLength * 0.4, bodyHeight * 0.3, -bodyLength * 0.2, bodyHeight * 0.45); 
    fishShape.quadraticCurveTo(0, bodyHeight * 0.55, bodyLength * 0.3, bodyHeight * 0.3); 
    fishShape.quadraticCurveTo(bodyLength / 2, 0, bodyLength * 0.3, -bodyHeight * 0.3); 
    fishShape.quadraticCurveTo(0, -bodyHeight * 0.55, -bodyLength * 0.2, -bodyHeight * 0.45); 
    fishShape.quadraticCurveTo(-bodyLength * 0.4, -bodyHeight * 0.3, -bodyLength / 2, 0); 
    fishShape.closePath();

    // Bevel and thickness also use the base 'scale' to keep details proportional to width
    const extrudeSettings = { 
        depth: bodyWidth, 
        bevelEnabled: true, 
        bevelThickness: 0.01 * scale,  // Bevel based on original detail scale
        bevelSize: 0.005 * scale,    // Bevel based on original detail scale
        bevelSegments: 1 
    };
    let geom = new THREE.ExtrudeGeometry(fishShape, extrudeSettings);
    geom.center(); 
    geom.rotateX(Math.PI / 2); 
    geom.rotateY(Math.PI /2); 

    // Fins will also scale with new bodyLength/bodyHeight if their dimensions are derived from them
    // Tail fin
    const tailFinShape = new THREE.Shape();
    const tailHeight = bodyHeight * 0.6; // Proportional to new bodyHeight
    const tailLength = bodyLength * 0.3; // Proportional to new bodyLength
    tailFinShape.moveTo(0,0);
    tailFinShape.lineTo(-tailLength, tailHeight/2);
    tailFinShape.lineTo(-tailLength * 0.8, 0);
    tailFinShape.lineTo(-tailLength, -tailHeight/2);
    tailFinShape.closePath();
    const tailFinGeom = new THREE.ShapeGeometry(tailFinShape);
    tailFinGeom.rotateY(-Math.PI/2); 
    tailFinGeom.translate(-bodyLength/2 - tailLength*0.1, 0, 0); 
    
    // Dorsal fin
    const dorsalFinShape = new THREE.Shape();
    const dorsalHeight = bodyHeight * 0.4; // Proportional to new bodyHeight
    const dorsalLength = bodyLength * 0.25; // Proportional to new bodyLength
    dorsalFinShape.moveTo(0,0);
    dorsalFinShape.lineTo(dorsalLength * 0.3, dorsalHeight);
    dorsalFinShape.lineTo(dorsalLength, 0);
    dorsalFinShape.closePath();
    const dorsalFinGeom = new THREE.ShapeGeometry(dorsalFinShape);
    dorsalFinGeom.rotateX(Math.PI/2); 
    dorsalFinGeom.translate(0, bodyHeight/2 - 0.01*scale, 0);

    // The comment about not merging fins is still relevant.
    // We are just adjusting the main body ExtrudeGeometry based on the Shape.
    
    this.individualFishGeometry = geom; // Store for disposal
    return geom;
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "SchoolOfFishObstacle_StdMat";
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

    const numFish = THREE.MathUtils.randInt(this.config.fishCountMin, this.config.fishCountMax);
    const baseFishGeom = this.createIndividualFishGeometry();
    
    const fishMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualConf.mainColor),
        roughness: visualConf.roughness,
        metalness: visualConf.metalness,
        emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor),
        emissiveIntensity: visualConf.emissiveIntensity,
        vertexColors: true, // Enable vertex colors for per-instance tinting
        side: THREE.DoubleSide // If fish are very thin or fins are planes
    });

    this.instancedMesh = new THREE.InstancedMesh(baseFishGeom, fishMaterial, numFish);
    this.instancedMesh.name = "FishInstances";
    // Add per-instance color attribute
    const colors = new Float32Array(numFish * 3);
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    this.mesh.add(this.instancedMesh);

    const schoolRadius = this.config.schoolRadius;
    const depthCoverage = this.config.depthCoverage;
    const baseColor = new THREE.Color(visualConf.mainColor);
    const detailColor = visualConf.detailColor ? new THREE.Color(visualConf.detailColor) : baseColor.clone().offsetHSL(0.1, 0.1, -0.1);

    for (let i = 0; i < numFish; i++) {
      const matrix = new THREE.Matrix4();
      let x, y, z;

      if (this.config.formation === 'wall') {
        x = (Math.random() - 0.5) * schoolRadius * 0.5; 
        y = (Math.random() - 0.5) * depthCoverage;    
        z = (Math.random() - 0.5) * schoolRadius * 0.3; 
      } else { // Swarm
        x = (Math.random() - 0.5) * schoolRadius * 2;
        y = (Math.random() - 0.5) * depthCoverage;
        z = (Math.random() - 0.5) * schoolRadius * 2;
      }
      
      const baseOffset = new THREE.Vector3(x, y, z);
      const initialRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, Math.random() * 0.2 - 0.1);
      matrix.compose(baseOffset, new THREE.Quaternion().setFromEuler(initialRotation), new THREE.Vector3(1,1,1));
      
      this.instancedMesh.setMatrixAt(i, matrix);
      
      // Set instance color (alternating or random between base and detail)
      const fishColor = Math.random() > 0.5 ? baseColor : detailColor;
      (this.instancedMesh.instanceColor as THREE.InstancedBufferAttribute).setXYZ(i, fishColor.r, fishColor.g, fishColor.b);

      this.fishData.push({ 
          matrix, 
          baseOffset, 
          animationOffset: Math.random() * Math.PI * 2, 
          targetQuaternion: new THREE.Quaternion().setFromEuler(initialRotation),
          currentColor: fishColor.clone()
      });
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

    const collisionHeight = depthCoverage * 1.2; // Slightly larger than visual spread
    const collisionWidth = (this.config.formation === 'wall') ? schoolRadius * 0.7 : schoolRadius * 2.2;
    const collisionDepth = (this.config.formation === 'wall') ? schoolRadius * 0.5 : schoolRadius * 2.2;
    
    const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
    this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
    this.collisionMesh.name = "SchoolOfFishCollisionBox";
    this.mesh.add(this.collisionMesh);

    this.mesh.userData = { type: 'obstacle', name: 'schoolOfFish', assetInstance: this, isDangerous: true };
  }
  
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
    const animSpeed = visualConf.animationSpeed || 1.0;
    const animAmplitude = visualConf.animationAmplitude || 0.1;

    // Collective movement (gentle sway of the whole school's base positions)
    const schoolSwayX = Math.sin(this.animationTime * 0.2 * animSpeed) * animAmplitude * 2;
    const schoolSwayY = Math.cos(this.animationTime * 0.15 * animSpeed) * animAmplitude * 1.5;

    for (let i = 0; i < this.fishData.length; i++) {
      const data = this.fishData[i];
      const currentMatrix = data.matrix; 

      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      currentMatrix.decompose(position, quaternion, scale);

      // Target position: base offset + school sway + individual flutter
      const targetPos = new THREE.Vector3();
      targetPos.x = data.baseOffset.x + schoolSwayX + Math.sin(this.animationTime * animSpeed * 2.5 + data.animationOffset) * animAmplitude;
      targetPos.y = data.baseOffset.y + schoolSwayY + Math.cos(this.animationTime * animSpeed * 2.0 + data.animationOffset) * animAmplitude * 0.7;
      targetPos.z = data.baseOffset.z + Math.sin(this.animationTime * animSpeed * 1.5 + data.animationOffset * 1.2) * animAmplitude * 0.5; // Depth flutter for swarm
      
      position.lerp(targetPos, 0.1); 

      // Individual fish flutter/wiggle (rotation)
      const wiggleSpeed = animSpeed * 5.0;
      const wiggleAmplitude = animAmplitude * 1.5;
      
      // Get current yaw from targetQuaternion for continuous wiggle
      const currentEuler = new THREE.Euler().setFromQuaternion(data.targetQuaternion, 'YXZ');

      const targetEuler = new THREE.Euler(
          Math.sin(this.animationTime * wiggleSpeed * 0.8 + data.animationOffset * 1.1) * wiggleAmplitude * 0.3, // Pitch
          currentEuler.y + Math.sin(this.animationTime * wiggleSpeed + data.animationOffset) * wiggleAmplitude, // Yaw (base + wiggle)
          Math.cos(this.animationTime * wiggleSpeed * 1.2 + data.animationOffset * 0.9) * wiggleAmplitude * 0.2,  // Roll
          'YXZ' // Specify order
      );
      data.targetQuaternion.setFromEuler(targetEuler);
      quaternion.slerp(data.targetQuaternion, 0.15);

      currentMatrix.compose(position, quaternion, scale);
      this.instancedMesh.setMatrixAt(i, currentMatrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean { return true; }

  public reset(): void {
    this.animationTime = 0;
    for (let i = 0; i < this.fishData.length; i++) {
        const data = this.fishData[i];
        const initialRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, Math.random() * 0.2 - 0.1);
        data.matrix.compose(data.baseOffset, new THREE.Quaternion().setFromEuler(initialRotation), new THREE.Vector3(1,1,1));
        this.instancedMesh.setMatrixAt(i, data.matrix);
        data.targetQuaternion.setFromEuler(initialRotation);
        // Reset color if it dynamically changes, here it's static per instance after creation
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.individualFishGeometry?.dispose(); // Dispose the stored original geometry
    if (this.instancedMesh) {
        this.instancedMesh.dispose(); // This should handle its own geometry and material if it's the owner
    }
    this.collisionMesh?.geometry?.dispose();
    if (this.collisionMesh?.material instanceof THREE.Material) {
        this.collisionMesh.material.dispose();
    }
    this.mesh?.clear(); 
    this.fishData = [];
  }
}