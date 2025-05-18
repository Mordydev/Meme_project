import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Slightly larger decorative rock for the seafloor.
 */
export class SmallRockAsset {
  private config: Readonly<DecorationItemConfig>;
  private mesh: THREE.Mesh;

  constructor() {
    this.config = configSystem.getDecorationsConfig().smallRock;
    this.mesh = this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config.colors;
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.DodecahedronGeometry(0.6, 1);
    // Slightly roughen shape
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      vertex.addScaledVector(vertex.clone().normalize(), (Math.random() - 0.5) * 0.2);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: this.randomColor(),
      roughness: 0.85,
      metalness: 0.15,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'SmallRockDecor';

    const scale = THREE.MathUtils.randFloat(this.config.scaleMin, this.config.scaleMax);
    mesh.scale.setScalar(scale);
    mesh.rotation.y = Math.random() * Math.PI * 2;
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