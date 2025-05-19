import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { DecorationItemConfig } from '../../config/gameConfig';

/**
 * Slightly larger decorative rock for the seafloor.
 */
export class SmallRockAsset {
  private config: Readonly<DecorationItemConfig>;
  private mesh: THREE.Mesh;
  private bumpMap?: THREE.CanvasTexture;

  constructor() {
    this.config = configSystem.getDecorationsConfig().smallRock;
    this.mesh = this.createMesh();
  }

  private randomColor(): THREE.Color {
    const colors = this.config.colors;
    const value = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(value as any);
  }

  private createBumpMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const val = Math.floor(Math.random() * 50) + 180;
        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createMesh(): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(0.6, 2);

    // Displace vertices for a more organic shape
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      normal.copy(vertex).normalize();
      const disp = (Math.random() - 0.5) * 0.3;
      vertex.addScaledVector(normal, disp);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    // Assign random vertex colors for mottling
    const colorAttr = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    const colors = this.config.colors;
    for (let i = 0; i < pos.count; i++) {
      color.set(colors[Math.floor(Math.random() * colors.length)] as any);
      colorAttr[i * 3] = color.r;
      colorAttr[i * 3 + 1] = color.g;
      colorAttr[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));

    geometry.computeVertexNormals();

    this.bumpMap = this.createBumpMap();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.15,
      bumpMap: this.bumpMap,
      bumpScale: 0.03,
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
      const mat = this.mesh.material as THREE.MeshStandardMaterial;
      if (mat.bumpMap) {
        mat.bumpMap.dispose();
      }
      mat.dispose();
    }
    if (this.bumpMap) {
      this.bumpMap.dispose();
    }
  }
}