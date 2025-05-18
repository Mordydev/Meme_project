import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Simple closed clam decoration for the seafloor.
 */
export class ClamDecorAsset {
  private config: Readonly<DecorationItemConfig>;
  private group: THREE.Group;

  constructor() {
    this.config = configSystem.getDecorationsConfig().clam;
    this.group = new THREE.Group();
    this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config.colors;
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createShellGeometry(size: number, top: boolean): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(size, 8, 8, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
    if (top) geo.rotateX(Math.PI);
    return geo;
  }

  private createMesh(): void {
    const material = new THREE.MeshStandardMaterial({
      color: this.randomColor(),
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    const size = 0.5;
    const top = new THREE.Mesh(this.createShellGeometry(size, true), material);
    const bottom = new THREE.Mesh(this.createShellGeometry(size, false), material);

    top.position.y = size * 0.25;
    bottom.position.y = -size * 0.25;

    this.group.add(top, bottom);
    this.group.name = 'ClamDecor';

    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
    this.group.scale.setScalar(scale);
    this.group.rotation.y = Math.random() * Math.PI * 2;
  }

  public getMesh(): THREE.Group {
    return this.group;
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
  }
}