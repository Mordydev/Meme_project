import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Simple decorative pebble placed on the seafloor.
 */
export class PebbleAsset {
  private config: Readonly<DecorationItemConfig>;
  private mesh: THREE.Mesh;
  private bumpTexture: THREE.CanvasTexture | null = null;

  constructor() {
    this.config = configSystem.getDecorationsConfig().pebble;
    this.mesh = this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config.colors;
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createBumpTexture(): THREE.CanvasTexture {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const val = 128 + (Math.random() - 0.5) * 40;
      imageData.data[i] = val;
      imageData.data[i + 1] = val;
      imageData.data[i + 2] = val;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 12, 12);

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      normal.copy(vertex).normalize();
      vertex.addScaledVector(normal, (Math.random() - 0.5) * 0.08);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();

    this.bumpTexture = this.createBumpTexture();
    const material = new THREE.MeshStandardMaterial({
      color: this.randomColor(),
      roughness: 0.9,
      metalness: 0.1,
      bumpMap: this.bumpTexture,
      bumpScale: 0.02,
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
    if (this.bumpTexture) {
      this.bumpTexture.dispose();
      this.bumpTexture = null;
    }
  }
}