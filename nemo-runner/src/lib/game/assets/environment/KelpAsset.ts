import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Decorative kelp cluster with gentle sway animation.
 * Derived from KelpWallAsset geometry but smaller and less dense.
 */
export class KelpAsset {
  private config: Readonly<DecorationItemConfig>;
  private group: THREE.Group;
  private kelpParts: { mesh: THREE.Mesh; original: THREE.BufferAttribute; type: 'stalk' | 'frond' }[] = [];
  private animationTime = 0;

  constructor() {
    this.config = (configSystem.getDecorationsConfig() as any).kelp;
    this.group = new THREE.Group();
    this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config?.colors || [0x2e8b57, 0x3a5f0b, 0x20603d];
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createMesh(): void {
    const material = new THREE.MeshPhysicalMaterial({
      color: this.randomColor(),
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      transmission: 0.2,
    });

    const strandHeight = THREE.MathUtils.randFloat(1.0, 1.6);
    const numStrands = THREE.MathUtils.randInt(1, 2);
    const spacing = 0.15;

    for (let i = 0; i < numStrands; i++) {
      const strandGroup = new THREE.Group();
      const stalkRadiusTop = 0.015 * THREE.MathUtils.randFloat(0.8, 1.2);
      const stalkRadiusBottom = 0.025 * THREE.MathUtils.randFloat(0.9, 1.1);
      const currentHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1);

      const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, currentHeight, 6, 8);
      stalkGeom.translate(0, currentHeight / 2, 0);
      stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();

      const stalk = new THREE.Mesh(stalkGeom, material);
      stalk.userData.baseY = 0;
      strandGroup.add(stalk);
      this.kelpParts.push({ mesh: stalk, original: stalkGeom.attributes.position.clone(), type: 'stalk' });

      const numFronds = 3;
      const frondMaterial = material.clone();

      for (let j = 0; j < numFronds; j++) {
        const frondLength = currentHeight * THREE.MathUtils.randFloat(0.3, 0.5);
        const frondWidth = frondLength * THREE.MathUtils.randFloat(0.2, 0.35);
        const frondShape = new THREE.Shape();
        frondShape.moveTo(0, 0);
        frondShape.quadraticCurveTo(frondWidth * 0.2, frondLength * 0.3, frondWidth * 0.1, frondLength * 0.7);
        frondShape.quadraticCurveTo(0, frondLength, -frondWidth * 0.1, frondLength * 0.7);
        frondShape.quadraticCurveTo(-frondWidth * 0.2, frondLength * 0.3, 0, 0);

        const frondGeom = new THREE.ShapeGeometry(frondShape, 3);
        frondGeom.rotateX(Math.PI / 2);
        frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();

        const frond = new THREE.Mesh(frondGeom, frondMaterial);
        const attachHeight = ((j + 1) / (numFronds + 1)) * currentHeight;
        frond.userData.baseY = attachHeight;
        frond.position.set((Math.random() < 0.5 ? 1 : -1) * stalkRadiusBottom * 0.5, attachHeight, 0);
        frond.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI * 0.5);
        frond.rotation.x = THREE.MathUtils.randFloatSpread(Math.PI / 4);
        stalk.add(frond);
        this.kelpParts.push({ mesh: frond, original: frondGeom.attributes.position.clone(), type: 'frond' });
      }

      strandGroup.position.x = (i - (numStrands - 1) / 2) * spacing;
      this.group.add(strandGroup);
    }

    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
    this.group.scale.setScalar(scale);
    this.group.name = 'KelpDecor';
    this.group.userData.decorationType = 'kelp';
  }

  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const swaySpeed = 0.6;
    const swayAmplitude = 0.1;

    this.kelpParts.forEach((item, index) => {
      const geom = item.mesh.geometry;
      const original = item.original as THREE.BufferAttribute;
      const current = geom.attributes.position as THREE.BufferAttribute;
      const worldPos = new THREE.Vector3();
      item.mesh.getWorldPosition(worldPos);
      const partHeight = item.type === 'stalk'
        ? (geom as THREE.CylinderGeometry).parameters.height
        : (geom as THREE.ShapeGeometry).parameters.shapes[0].getBoundingBox().getSize(new THREE.Vector3()).y;

      for (let i = 0; i < original.count; i++) {
        const ox = original.getX(i);
        const oy = original.getY(i);
        const oz = original.getZ(i);
        const normalized = Math.abs(oy / (partHeight || 0.1));
        const swayFactor = Math.pow(normalized, 1.5);
        const phase = (worldPos.x + worldPos.z) * 0.3 + index * 0.5;
        const waveX = Math.sin(this.animationTime * swaySpeed + oy * 0.5 + phase) * swayAmplitude * swayFactor;
        const waveZ = Math.cos(this.animationTime * swaySpeed * 0.7 + oy * 0.4 + phase * 1.1) * swayAmplitude * swayFactor * 0.5;
        current.setXYZ(i, ox + waveX, oy, oz + waveZ);
      }
      current.needsUpdate = true;
    });
    if (this.kelpParts.length > 0) {
      this.kelpParts[0].mesh.geometry.computeVertexNormals();
    }
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

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
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.group.clear();
    this.kelpParts = [];
  }
}