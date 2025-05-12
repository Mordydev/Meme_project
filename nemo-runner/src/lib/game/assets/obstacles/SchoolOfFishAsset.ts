import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { SchoolOfFishObstacleConfig } from '../../config/gameConfig';

interface FishInstanceData {
  matrix: THREE.Matrix4;
  baseOffset: THREE.Vector3; // Relative to school center for formation
  animationOffset: number;   // For individual animation timing
}

export class SchoolOfFishAsset {
  private shaderManager: ShaderManager;
  public config: Readonly<SchoolOfFishObstacleConfig>;
  public mesh!: THREE.Group; // Main group, might hold an InstancedMesh
  public instancedMesh!: THREE.InstancedMesh;
  private fishData: FishInstanceData[] = [];
  
  public collisionMesh!: THREE.Mesh; // A single large collider for the whole school

  private animationTime: number = 0;

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.config = configSystem.getObstaclesConfig().schoolOfFish;
    this.createMesh();
  }

  private createIndividualFishGeometry(): THREE.BufferGeometry {
    // Very simple fish shape: elongated box, pointy at front
    const length = 0.3 * this.config.individualFishScale;
    const height = 0.1 * this.config.individualFishScale;
    const width = 0.08 * this.config.individualFishScale;
    
    const shape = new THREE.Shape();
    shape.moveTo(-length / 2, 0);
    shape.lineTo(length / 4, height / 2); // Pointy front top
    shape.lineTo(length / 2, 0);          // Nose
    shape.lineTo(length / 4, -height / 2); // Pointy front bottom
    shape.lineTo(-length / 2, 0);         // Back to tail start

    const extrudeSettings = { depth: width, bevelEnabled: false };
    let geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2); // Orient it to swim along Z
    geom.center(); // Center the geometry
    return geom;
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "SchoolOfFishObstacle";

    const numFish = THREE.MathUtils.randInt(this.config.fishCountMin, this.config.fishCountMax);
    const individualFishGeom = this.createIndividualFishGeometry();
    
    const fishMaterial = this.shaderManager.getMaterial('obstacle_schooloffish_fish') ||
      new THREE.MeshPhongMaterial({
        color: 0xB0C4DE, // LightSteelBlue (Silvery)
        shininess: 60,
      });

    // If using ShaderMaterial for fish (e.g., for vertex animation)
    // fishMaterial.onBeforeCompile = shader => {
    //   shader.uniforms.uTime = { value: 0 };
    //   // Add vertex shader logic for tail wiggle
    // };

    this.instancedMesh = new THREE.InstancedMesh(individualFishGeom, fishMaterial, numFish);
    this.instancedMesh.name = "FishInstances";
    this.mesh.add(this.instancedMesh);

    const schoolRadius = this.config.schoolRadius;
    const depthCoverage = this.config.depthCoverage; // Vertical spread

    for (let i = 0; i < numFish; i++) {
      const matrix = new THREE.Matrix4();
      let x, y, z;

      if (this.config.formation === 'wall') {
        // Dense vertical wall, spread primarily in Y and slightly in X/Z for depth
        x = (Math.random() - 0.5) * schoolRadius * 0.5; // Less X spread for a wall
        y = (Math.random() - 0.5) * depthCoverage;    // Spread across defined height
        z = (Math.random() - 0.5) * schoolRadius * 0.3; // Little Z depth for the wall
      } else { // Swarm
        x = (Math.random() - 0.5) * schoolRadius * 2;
        y = (Math.random() - 0.5) * depthCoverage;
        z = (Math.random() - 0.5) * schoolRadius * 2;
      }
      
      const baseOffset = new THREE.Vector3(x, y, z);
      matrix.setPosition(baseOffset);
      
      // Random initial orientation (can be refined for schooling behavior)
      const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 0.2 - Math.PI * 0.1, 0);
      matrix.multiply(new THREE.Matrix4().makeRotationFromEuler(randomRotation));

      this.instancedMesh.setMatrixAt(i, matrix);
      this.fishData.push({ matrix, baseOffset, animationOffset: Math.random() * Math.PI * 2 });
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Simplified Group-level Collision Mesh (a tall box encompassing the school)
    const collisionHeight = depthCoverage;
    // Width depends on formation, for 'wall' it's roughly schoolRadius
    const collisionWidth = (this.config.formation === 'wall') ? schoolRadius : schoolRadius * 2;
    const collisionDepth = (this.config.formation === 'wall') ? schoolRadius * 0.5 : schoolRadius * 2; // Wall is thinner
    
    const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
    const collisionMat = new THREE.MeshBasicMaterial({
        visible: false, // configSystem.get('debug').showCollisionBoxes || false,
        wireframe: true, color: 0x00ffff
    });
    this.collisionMesh = new THREE.Mesh(collisionGeom, collisionMat);
    this.collisionMesh.name = "SchoolOfFishCollisionBox";
    // Center the collision box (Y is already centered by depthCoverage)
    this.mesh.add(this.collisionMesh);

    this.mesh.userData = { type: 'obstacle', name: 'schoolOfFish', assetInstance: this };
  }
  
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;

    // Animate individual fish slightly (e.g., subtle hover or tail wiggle via shader)
    for (let i = 0; i < this.fishData.length; i++) {
      const data = this.fishData[i];
      const matrix = data.matrix; // Get a reference, not a copy

      // Decompose matrix to apply local animation
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      matrix.decompose(position, quaternion, scale);

      // Subtle hover/darting animation around their baseOffset
      const hoverSpeed = 1.5;
      const hoverAmplitude = 0.05 * this.config.individualFishScale;
      position.x = data.baseOffset.x + Math.sin(this.animationTime * hoverSpeed + data.animationOffset) * hoverAmplitude;
      position.y = data.baseOffset.y + Math.cos(this.animationTime * hoverSpeed * 0.7 + data.animationOffset) * hoverAmplitude;
      // Z can also be animated slightly if not a flat wall formation
      if (this.config.formation === 'swarm') {
        position.z = data.baseOffset.z + Math.sin(this.animationTime * hoverSpeed * 1.3 + data.animationOffset) * hoverAmplitude;
      }
      
      // Simple tail wiggle effect by slightly rotating around Y axis (if fish is oriented along Z)
      // Or use shader for this. For now, just position.
      // quaternion.setFromEuler(new THREE.Euler(0, Math.sin(this.animationTime * 10 + data.animationOffset) * 0.1, 0));

      matrix.compose(position, quaternion, scale);
      this.instancedMesh.setMatrixAt(i, matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    
    // If shader material is used and has uTime for individual fish animation
    // if (this.instancedMesh.material instanceof THREE.ShaderMaterial) {
    //   this.instancedMesh.material.uniforms.uTime.value = this.animationTime;
    // }
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getCollisionObject(): THREE.Mesh {
    return this.collisionMesh; // The encompassing box collider
  }

  public isDangerous(): boolean {
    return true; // School of fish is always a solid obstacle
  }

  public reset(): void {
    this.animationTime = 0;
    // Reset positions of instanced fish to their initial formation if they moved significantly
    for (let i = 0; i < this.fishData.length; i++) {
        const data = this.fishData[i];
        const matrix = new THREE.Matrix4(); // Create new matrix
        matrix.setPosition(data.baseOffset); // Reset to base offset
        // Apply initial random rotation if any
        const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 0.2 - Math.PI * 0.1, 0);
        matrix.multiply(new THREE.Matrix4().makeRotationFromEuler(randomRotation));

        this.instancedMesh.setMatrixAt(i, matrix);
        data.matrix = matrix; // Update the stored matrix
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    // console.log("SchoolOfFishAsset: Reset.");
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(m => m.dispose());
    } else {
        (this.instancedMesh.material as THREE.Material).dispose();
    }
    this.collisionMesh.geometry.dispose();
    if (Array.isArray(this.collisionMesh.material)) {
        this.collisionMesh.material.forEach(m => m.dispose());
    } else {
        (this.collisionMesh.material as THREE.Material).dispose();
    }
    // Group children are disposed when group is removed from scene by ObstacleManager
  }
}