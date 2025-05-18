import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Simple decorative pebble placed on the seafloor.
 */
export class PebbleAsset {
  private config: Readonly<DecorationItemConfig>;
  private mesh: THREE.Mesh;

  constructor() {
    this.config = configSystem.getDecorationsConfig().pebble;
    this.mesh = this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config.colors;
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 6, 6);
    const material = new THREE.MeshStandardMaterial({
      color: this.randomColor(),
      roughness: 0.9,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'PebbleDecor';

    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
    mesh.scale.setScalar(scale);
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    return mesh;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}