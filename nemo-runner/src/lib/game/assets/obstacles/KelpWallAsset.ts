import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { KelpWallObstacleConfig } from '../../config/gameConfig';

export class KelpWallAsset {
  private shaderManager: ShaderManager;
  public config: Readonly<KelpWallObstacleConfig>;
  public mesh!: THREE.Group; // Group to hold multiple kelp strands
  public collisionMeshes: THREE.Mesh[] = []; // Store individual strand colliders if needed

  private animationTime: number = 0;
  // Uniform for shader-based animation, shared by all strands in this instance
  private swayUniforms: { uTime: { value: number }, uSwayAmplitude: { value: number }, uSwaySpeed: { value: number }};

  constructor(shaderManager: ShaderManager) {
    this.shaderManager = shaderManager;
    this.config = configSystem.getObstaclesConfig().kelpWall;
    
    this.swayUniforms = {
        uTime: { value: 0.0 },
        uSwayAmplitude: { value: this.config.swayAmplitude },
        uSwaySpeed: { value: this.config.swaySpeed }
    };

    this.createMesh();
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "KelpWallObstacle";

    const strandHeight = this.config.baseScaleY;
    const strandWidth = 0.15; // Thin strands
    const numStrands = THREE.MathUtils.randInt(this.config.strandCountMin, this.config.strandCountMax);
    
    // Use a single material instance for all strands for performance
    const kelpMaterial = this.shaderManager.getMaterial('obstacle_kelpwall') ||
      new THREE.MeshPhongMaterial({
        color: 0x2E8B57, // SeaGreen
        side: THREE.DoubleSide, // Kelp is thin, visible from both sides
        transparent: true,
        opacity: 0.75,
      });

    // If using ShaderMaterial, update it with swayUniforms
    if (kelpMaterial instanceof THREE.ShaderMaterial) {
        kelpMaterial.uniforms.uTime = this.swayUniforms.uTime;
        kelpMaterial.uniforms.uSwayAmplitude = this.swayUniforms.uSwayAmplitude;
        kelpMaterial.uniforms.uSwaySpeed = this.swayUniforms.uSwaySpeed;
    }

    const totalWallWidth = (configSystem.get('player').laneWidth * this.config.segmentWidthCoverage);
    const spacing = numStrands > 1 ? totalWallWidth / (numStrands -1) : 0;

    for (let i = 0; i < numStrands; i++) {
      // More segments vertically for smoother sway if using vertex shader
      const strandGeometry = new THREE.PlaneGeometry(strandWidth, strandHeight, 1, 10); 
      
      // Offset UVs or add a vertex attribute for varied sway per strand in shader
      // For now, the uTime in shader will create some variation if not perfectly synced

      const strand = new THREE.Mesh(strandGeometry, kelpMaterial);
      strand.position.x = (i * spacing) - (totalWallWidth / 2) + (spacing / 2); // Distribute across wall width
      if (numStrands === 1) strand.position.x = 0; // Center if only one strand
      
      strand.position.y = strandHeight / 2; // Base of kelp at y=0 relative to group
      
      // Slight random Z offset and rotation for organic look
      strand.position.z = (Math.random() - 0.5) * 0.2;
      strand.rotation.y = (Math.random() - 0.5) * 0.3;

      this.mesh.add(strand);
      // For collision, each strand can be its own collider, or a larger box for the group
      // For Phase 1, a group-level collider is simpler if it's a dense wall.
      // If sparse with gaps, individual strand colliders are better.
      // this.collisionMeshes.push(strand); 
    }
    
    // Simplified Group-level Collision Mesh (a tall box)
    // Positioned at the group's origin, should be set when ObstacleManager places the group
    const collisionHeight = strandHeight;
    const collisionWidth = totalWallWidth + strandWidth; // Cover full width
    const collisionDepth = 0.2; // Kelp is thin
    const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
    const collisionMat = new THREE.MeshBasicMaterial({
        visible: false, // configSystem.get('debug').showCollisionBoxes || false,
        wireframe: true, color: 0x00ff00
    });
    const groupCollider = new THREE.Mesh(collisionGeom, collisionMat);
    groupCollider.name = "KelpWallCollisionBox";
    groupCollider.position.y = strandHeight / 2; // Align with kelp strands
    this.mesh.add(groupCollider); // Add collider to the group

    this.mesh.userData = { type: 'obstacle', name: 'kelpWall', assetInstance: this };
  }
  
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    this.swayUniforms.uTime.value = this.animationTime;

    // If not using shader for sway, implement programmatic sway here:
    if (!(this.shaderManager.getMaterial('obstacle_kelpwall') instanceof THREE.ShaderMaterial)) {
      this.mesh.children.forEach((strand) => {
        if (strand.name !== "KelpWallCollisionBox") { // Exclude collider
          // Simple sine wave sway
          const index = this.mesh.children.indexOf(strand);
          strand.rotation.z = Math.sin(this.animationTime * this.config.swaySpeed + index * 0.5) 
                            * this.config.swayAmplitude * 0.2;
        }
      });
    }
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  // For CollisionDetectionSystem to get the main collider for the wall
  public getCollisionObject(): THREE.Mesh {
    return this.mesh.getObjectByName("KelpWallCollisionBox") as THREE.Mesh;
  }

  public isDangerous(): boolean {
    return true; // Kelp wall is always a solid obstacle
  }

  public reset(): void {
    this.animationTime = 0;
    this.swayUniforms.uTime.value = 0;
    // Reset individual strand states if they become more complex
    // console.log("KelpWallAsset: Reset.");
  }

  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material && typeof (child.material as THREE.Material).dispose === 'function') {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                (child.material as THREE.Material).dispose();
            }
        }
      }
    });
  }
}