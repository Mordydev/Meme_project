import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { KelpWallObstacleConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

export class KelpWallAsset {
  public config: Readonly<KelpWallObstacleConfig>;
  public mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  // Holds stalk and frond meshes with their original vertex positions
  private kelpParts: { mesh: THREE.Mesh; original: THREE.BufferAttribute; type: 'stalk' | 'frond' }[] = [];

  private animationTime: number = 0;

  constructor() {
    this.config = this._fetchConfig();
    this.createMesh();
  }

  private _fetchConfig(): Readonly<KelpWallObstacleConfig> {
    const defaultConfig: KelpWallObstacleConfig = {
        baseScaleY: 3.5, // Overall height of the kelp wall
        segmentWidthCoverage: 1.0, // How many lane widths the kelp wall segment covers
        strandCountMin: 5,
        strandCountMax: 8,
        swayAmplitude: 0.15,
        swaySpeed: 0.8,
        visuals: { // Default visuals for KelpWall
            mainColor: 0x2E8B57, // SeaGreen
            detailColor: 0x20603D, // Darker green for fronds or variation
            roughness: 0.8,
            metalness: 0.05,
            opacity: 0.85,
            transmission: 0.3, // For light passing through
            animationSpeed: 0.8, // Overrides general swaySpeed for vertex anim
            animationAmplitude: 0.15, // Overrides general swayAmplitude for vertex anim
        }
    };
    try {
        const specificConfig = configSystem.getObstaclesConfig().kelpWall;
        return { ...defaultConfig, ...specificConfig, visuals: { ...defaultConfig.visuals, ...specificConfig?.visuals } };
    } catch (error) {
        console.warn("KelpWallAsset: Could not get config, using defaults", error);
        return defaultConfig;
    }
  }

  
  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "KelpWallObstacle_StdMat_Enhanced";
    this.kelpParts = [];

    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

    const strandHeight = this.config.baseScaleY;
    const numStrands = THREE.MathUtils.randInt(this.config.strandCountMin, this.config.strandCountMax);
    const totalWallWidth = configSystem.get('player').laneWidth * this.config.segmentWidthCoverage;
    const spacing = numStrands > 1 ? totalWallWidth / (numStrands - 1) : 0;

    const kelpMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness,
      metalness: visualConf.metalness,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: visualConf.opacity,
      transmission: visualConf.transmission,
    });

    for (let i = 0; i < numStrands; i++) {
      const strandGroup = new THREE.Group();

      const stalkRadiusTop = (this.config.stalkRadius || 0.03) * THREE.MathUtils.randFloat(0.8, 1.2);
      const stalkRadiusBottom = (this.config.stalkRadius || 0.05) * THREE.MathUtils.randFloat(0.9, 1.1);
      const currentStalkHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1);
      const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, currentStalkHeight, 6, 10);
      stalkGeom.translate(0, currentStalkHeight / 2, 0);
      stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();

      const stalk = new THREE.Mesh(stalkGeom, kelpMaterial);
      stalk.userData.baseY = 0;
      strandGroup.add(stalk);
      this.kelpParts.push({ mesh: stalk, original: stalkGeom.attributes.position.clone(), type: 'stalk' });

      const numFronds = this.config.frondCount || 5;
      const frondMaterial = kelpMaterial.clone();
      if (visualConf.detailColor) {
        frondMaterial.color = new THREE.Color(visualConf.detailColor);
      }

      for (let j = 0; j < numFronds; j++) {
        const frondLength = currentStalkHeight * THREE.MathUtils.randFloat(0.3, 0.6);
        const frondWidth = frondLength * THREE.MathUtils.randFloat(0.2, 0.35);

        const frondShape = new THREE.Shape();
        frondShape.moveTo(0, 0);
        frondShape.quadraticCurveTo(frondWidth * 0.2, frondLength * 0.3, frondWidth * 0.1, frondLength * 0.7);
        frondShape.quadraticCurveTo(0, frondLength, -frondWidth * 0.1, frondLength * 0.7);
        frondShape.quadraticCurveTo(-frondWidth * 0.2, frondLength * 0.3, 0, 0);

        const frondGeom = new THREE.ShapeGeometry(frondShape, 3);
        frondGeom.translate(0, 0, 0);
        frondGeom.rotateX(Math.PI / 2);
        frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();

        const frond = new THREE.Mesh(frondGeom, frondMaterial);
        const attachHeightRatio = (j / (numFronds - 1 || 1)) * 0.7 + 0.2;
        const attachHeight = attachHeightRatio * currentStalkHeight;
        frond.userData.baseY = attachHeight;
        frond.position.set((Math.random() < 0.5 ? 1 : -1) * (stalkRadiusBottom * 0.5), attachHeight, 0);
        frond.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI * 0.5);
        frond.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI / 4);
        stalk.add(frond);
        this.kelpParts.push({ mesh: frond, original: frondGeom.attributes.position.clone(), type: 'frond' });
      }

      strandGroup.position.x = numStrands > 1 ? i * spacing - totalWallWidth / 2 + spacing / 2 : 0;
      strandGroup.position.z = (Math.random() - 0.5) * 0.3;
      strandGroup.rotation.y = (Math.random() - 0.5) * 0.2;
      this.mesh.add(strandGroup);
    }

    const collisionHeight = strandHeight;
    const collisionWidth = totalWallWidth + (this.config.stalkRadius || 0.05) * 2;
    const collisionDepth = Math.max(0.3, (this.config.stalkRadius || 0.05) * 2);
    const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
    this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
    this.collisionMesh.name = "KelpWallCollisionBox";
    this.collisionMesh.position.y = strandHeight / 2;
    this.mesh.add(this.collisionMesh);

    this.mesh.userData = { type: 'obstacle', name: 'kelpWall', assetInstance: this, isDangerous: true };
  }

  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
    const swaySpeed = visualConf.animationSpeed || this.config.swaySpeed;
    const swayAmplitude = visualConf.animationAmplitude || this.config.swayAmplitude;

    this.kelpParts.forEach((item, partIndex) => {
      const kelpPart = item.mesh;
      const geom = kelpPart.geometry;
      const originalAttr = item.original as THREE.BufferAttribute;
      const currentAttr = geom.attributes.position as THREE.BufferAttribute;
      if (!originalAttr) return;

      const worldPos = new THREE.Vector3();
      const parentObject = kelpPart.parent instanceof THREE.Group ? kelpPart.parent : kelpPart;
      parentObject.getWorldPosition(worldPos);

      const partHeight = item.type === 'stalk'
        ? (geom as THREE.CylinderGeometry).parameters.height
        : (geom as THREE.ShapeGeometry).parameters.shapes[0].getBoundingBox().getSize(new THREE.Vector3()).y;

      for (let i = 0; i < originalAttr.count; i++) {
        const ox = originalAttr.getX(i);
        const oy = originalAttr.getY(i);
        const oz = originalAttr.getZ(i);

        const normalized = Math.abs(oy / (partHeight || 0.1));
        const swayFactor = Math.pow(normalized, 1.5);

        const phaseOffset = (worldPos.x + worldPos.z) * 0.3 + partIndex * 0.3;

        const waveX = Math.sin(this.animationTime * swaySpeed + oy * 0.5 + phaseOffset) * swayAmplitude * swayFactor;
        const waveZ = Math.cos(this.animationTime * swaySpeed * 0.7 + oy * 0.4 + phaseOffset * 1.3) * swayAmplitude * swayFactor * 0.5;

        currentAttr.setXYZ(i, ox + waveX, oy, oz + waveZ);
      }
      currentAttr.needsUpdate = true;
    });
    if (this.kelpParts.length > 0) {
      this.kelpParts[0].mesh.geometry.computeVertexNormals();
    }
  }

  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean { return true; }

  public reset(): void {
    this.animationTime = 0;
    this.kelpParts.forEach(item => {
      const geom = item.mesh.geometry;
      const orig = item.original;
      const curr = geom.attributes.position as THREE.BufferAttribute;
      if (orig && curr) {
        curr.copy(orig);
        curr.needsUpdate = true;
        geom.computeVertexNormals();
      }
    });
  }

  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          const mat = child.material as THREE.MeshPhysicalMaterial;
          mat.map?.dispose();
          mat.normalMap?.dispose();
          mat.bumpMap?.dispose();
          (mat as any).transmissionMap?.dispose?.();
          mat.dispose();
        }
      }
    });
    this.mesh.clear();
    this.kelpParts = [];
  }
}