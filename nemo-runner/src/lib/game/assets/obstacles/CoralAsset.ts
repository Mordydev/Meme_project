import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { CoralConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

export class CoralAsset {
  public config: Readonly<CoralConfig>;
  public mesh!: THREE.Group;
  private collisionShape!: THREE.Mesh;
  private branches: THREE.Mesh[] = [];
  private animationTime: number = 0;
  
  constructor() {
    this.config = this._fetchConfig();
    this.createMesh();
  }

  private _fetchConfig(): Readonly<CoralConfig> {
    const defaultConfig: CoralConfig = {
      baseScale: 1.0,
      branchCount: 5,
      branchLengthMin: 0.5,
      branchLengthMax: 1.2,
      visuals: {
        mainColor: 0xFF7F50,
        detailColor: 0xFF6347,
        emissiveColor: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.7,
        metalness: 0.1,
        animationSpeed: 0.2,
        animationAmplitude: 0.005,
      }
    };
    try {
      const specificConfig = configSystem.getObstaclesConfig().coral;
      return { 
        ...defaultConfig, 
        ...specificConfig, 
        visuals: { 
          ...defaultConfig.visuals, 
          ...(specificConfig?.visuals || {}),
        } 
      };
    } catch (error) {
      console.warn("CoralAsset: Could not get coral config, using defaults", error);
      return defaultConfig;
    }
  }

  public createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "CoralObstacle_StdMat";
    this.branches = [];
    this.animationTime = 0;
    
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
    const baseScale = this.config.baseScale;
    const branchCount = this.config.branchCount;
    
    const coralMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness,
      metalness: visualConf.metalness,
      emissive: new THREE.Color(visualConf.emissiveColor),
      emissiveIntensity: visualConf.emissiveIntensity,
      ...(visualConf.opacity && { opacity: visualConf.opacity }),
      ...(visualConf.transmission && { transmission: visualConf.transmission })
    });
    
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.detailColor || visualConf.mainColor),
      roughness: Math.max(0, (visualConf.roughness || 0.7) - 0.1),
      metalness: visualConf.metalness || 0.1,
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor),
      emissiveIntensity: (visualConf.emissiveIntensity || 0) * 1.2,
      ...(visualConf.opacity && { opacity: visualConf.opacity }),
      ...(visualConf.transmission && { transmission: visualConf.transmission })
    });
    
    for (let i = 0; i < branchCount; i++) {
      const branchHeight = THREE.MathUtils.lerp(
        this.config.branchLengthMin, 
        this.config.branchLengthMax, 
        Math.random()
      ) * baseScale;
      
      const branchThickness = (0.1 + Math.random() * 0.15) * baseScale;
      
      const branchGeom = this.createCoralBranch(branchHeight, branchThickness);
      const branchMesh = new THREE.Mesh(branchGeom, coralMaterial);
      
      const angle = (i / branchCount) * Math.PI * 2 + (Math.random() * 0.5);
      const distance = (0.2 + Math.random() * 0.3) * baseScale;
      branchMesh.position.set(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      
      branchMesh.rotation.x = (Math.random() - 0.5) * 0.3;
      branchMesh.rotation.z = (Math.random() - 0.5) * 0.3;
      
      const subBranchCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < subBranchCount; j++) {
        const subHeight = branchHeight * (0.3 + Math.random() * 0.4);
        const subThickness = branchThickness * (0.4 + Math.random() * 0.3);
        const subBranchGeom = this.createCoralBranch(subHeight, subThickness);
        const subBranch = new THREE.Mesh(subBranchGeom, tipMaterial);
        
        const heightPos = (0.3 + Math.random() * 0.6) * branchHeight;
        const subAngle = Math.random() * Math.PI * 2;
        
        subBranch.position.set(
          Math.cos(subAngle) * (branchThickness * 0.7),
          heightPos,
          Math.sin(subAngle) * (branchThickness * 0.7)
        );
        
        subBranch.rotation.x = (Math.random() - 0.5) * 1.0 + Math.PI * 0.15;
        subBranch.rotation.z = (Math.random() - 0.5) * 1.0 + Math.PI * 0.15;
        
        branchMesh.add(subBranch);
      }
      
      this.addCoralPolyps(branchMesh, branchHeight, branchThickness, tipMaterial);
      
      this.branches.push(branchMesh);
      this.mesh.add(branchMesh);
    }
    
    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    const collisionRadius = Math.max(size.x, size.y, size.z) * 0.5;
    const collisionGeom = new THREE.SphereGeometry(collisionRadius, 8, 8);
    this.collisionShape = new THREE.Mesh(
      collisionGeom,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.collisionShape.name = "CoralCollider";
    
    const center = new THREE.Vector3();
    box.getCenter(center);
    this.collisionShape.position.copy(center);
    
    this.mesh.add(this.collisionShape);
    
    this.mesh.userData = {
      type: 'obstacle',
      name: 'coral',
      assetInstance: this,
      isDangerous: true
    };
  }
  
  private createCoralBranch(height: number, radius: number): THREE.BufferGeometry {
    const segments = Math.max(6, Math.floor(height * 10));
    const radialSegments = 8;
    const geometry = new THREE.CylinderGeometry(
      radius * 0.6,
      radius,
      height,
      radialSegments,
      segments
    );
    
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      if (vertex.y > -height/2 + 0.05) {
        const heightFactor = (vertex.y + height/2) / height;
        const noise = (Math.random() - 0.5) * 0.15 * radius * heightFactor;
        
        const radialDir = new THREE.Vector3(vertex.x, 0, vertex.z).normalize();
        vertex.add(radialDir.multiplyScalar(noise));
        
        const bendFactor = Math.pow(heightFactor, 2) * (Math.random() * 0.2 + 0.1);
        vertex.x += bendFactor * height * 0.2;
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  private addCoralPolyps(branchMesh: THREE.Mesh, branchHeight: number, branchRadius: number, material: THREE.Material): void {
    const polypCount = Math.floor(branchHeight * 15);
    
    for (let i = 0; i < polypCount; i++) {
      const useSpherePoly = Math.random() > 0.5;
      
      let polypGeom;
      if (useSpherePoly) {
        polypGeom = new THREE.SphereGeometry(branchRadius * 0.15, 4, 4);
      } else {
        polypGeom = new THREE.ConeGeometry(branchRadius * 0.15, branchRadius * 0.25, 5, 1);
      }
      
      const polyp = new THREE.Mesh(polypGeom, material);
      
      const heightPos = Math.random() * branchHeight - branchHeight/2 + branchRadius;
      const angle = Math.random() * Math.PI * 2;
      
      polyp.position.set(
        Math.cos(angle) * branchRadius * 0.9,
        heightPos,
        Math.sin(angle) * branchRadius * 0.9
      );
      
      polyp.lookAt(polyp.position.clone().add(new THREE.Vector3(
        Math.cos(angle) * 10,
        0,
        Math.sin(angle) * 10
      )));
      
      polyp.rotation.z = Math.random() * Math.PI;
      polyp.scale.multiplyScalar(0.8 + Math.random() * 0.4);
      
      branchMesh.add(polyp);
    }
  }

  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;

    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
    const swayAmount = visualConf.animationAmplitude ?? 0.005;
    const swaySpeed = visualConf.animationSpeed ?? 0.2;

    if (this.branches.length > 0) {
      for (let i = 0; i < this.branches.length; i++) {
        const branch = this.branches[i];
        const uniquePhase = i * 0.7;
        
        branch.rotation.x = Math.sin(this.animationTime * swaySpeed + uniquePhase) * swayAmount;
        branch.rotation.z = Math.cos(this.animationTime * swaySpeed * 0.7 + uniquePhase) * swayAmount;
      }
    }
  }

  public reset(): void {
    this.animationTime = 0;
      for (const branch of this.branches) {
      branch.rotation.x = (Math.random() - 0.5) * 0.3;
      branch.rotation.z = (Math.random() - 0.5) * 0.3;
    }
  }

  public dispose(): void {
    this.mesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            if (material instanceof THREE.Material) {
              (material as THREE.MeshStandardMaterial).map?.dispose();
              (material as THREE.MeshStandardMaterial).normalMap?.dispose();
              (material as THREE.MeshStandardMaterial).bumpMap?.dispose();
              material.dispose();
            }
          });
        } else if (child.material instanceof THREE.Material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.map?.dispose();
          mat.normalMap?.dispose();
          mat.bumpMap?.dispose();
          mat.dispose();
    }
      }
    });
    this.mesh.clear();
    this.branches = [];
    if (this.collisionShape?.geometry) this.collisionShape.geometry.dispose();
    if (this.collisionShape?.material && this.collisionShape.material instanceof THREE.Material) {
        this.collisionShape.material.dispose();
    }
  }

  public getCollisionObject(): THREE.Mesh {
    if (this.collisionShape) {
      return this.collisionShape;
    }
    
    if (this.branches.length > 0) {
      return this.branches[0];
    }
    
    console.warn("CoralAsset: No collision shape available, creating fallback");
    const fallbackGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    fallbackMesh.name = "CoralFallbackCollider";
    
    if (this.mesh) {
      this.mesh.add(fallbackMesh);
      this.collisionShape = fallbackMesh;
    }
    
    return fallbackMesh;
  }
  
  public isDangerous(): boolean {
    return true;
  }
  
  public getMesh(): THREE.Group {
    return this.mesh;
  }
} 