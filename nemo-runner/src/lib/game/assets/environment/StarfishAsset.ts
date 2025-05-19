import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Simple decorative starfish with five arms.
 */
export class StarfishAsset {
  private config: Readonly<DecorationItemConfig>;
  private mesh: THREE.Mesh;

  constructor() {
    this.config = (configSystem.getDecorationsConfig() as any).starfish;
    this.mesh = this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config?.colors || [0xffa07a];
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createGeometry(): THREE.BufferGeometry {
    const arms = 5;
    const outerRadius = 0.5;
    const innerRadius = outerRadius * 0.4;
    const shape = new THREE.Shape();
    for (let i = 0; i < arms; i++) {
      const angle = (i / arms) * Math.PI * 2;
      const outerX = Math.cos(angle) * outerRadius;
      const outerY = Math.sin(angle) * outerRadius;
      if (i === 0) {
        shape.moveTo(outerX, outerY);
      } else {
        shape.lineTo(outerX, outerY);
      }
      const innerAngle = angle + Math.PI / arms;
      const innerX = Math.cos(innerAngle) * innerRadius;
      const innerY = Math.sin(innerAngle) * innerRadius;
      shape.lineTo(innerX, innerY);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: false,
    });
    geometry.rotateX(Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  private createMesh(): THREE.Mesh {
    const geometry = this.createGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: this.randomColor(),
      roughness: 0.9,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'StarfishDecor';
    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
    mesh.scale.setScalar(scale);
    mesh.userData.decorationType = 'starfish';
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