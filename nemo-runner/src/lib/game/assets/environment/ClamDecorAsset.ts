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
    const widthSegments = 24;
    const heightSegments = 16;

    const geo = new THREE.SphereGeometry(
      size,
      widthSegments,
      heightSegments,
      0,
      Math.PI * 2,
      top ? 0 : Math.PI / 2,
      Math.PI / 2
    );
    if (top) geo.rotateX(Math.PI);

    // Add subtle ridges/noise
    const positions = geo.attributes.position as THREE.BufferAttribute;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      const dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      const norm = dist / size;
      const angle = Math.atan2(vertex.z, vertex.x);
      const ridge = Math.sin(angle * 6) * size * 0.02 * norm;
      vertex.y += ridge * (top ? 1 : -1);

      vertex.x += (Math.random() - 0.5) * size * 0.005;
      vertex.y += (Math.random() - 0.5) * size * 0.005;
      vertex.z += (Math.random() - 0.5) * size * 0.005;

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }

  private createMesh(): void {
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: this.randomColor(),
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.FrontSide,
    });

    const interiorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0e8d8,
      roughness: 0.3,
      metalness: 0.1,
      sheen: 0.5,
      sheenColor: new THREE.Color(0xffffff),
      side: THREE.BackSide,
    });

    const size = 0.5;
    const topGeo = this.createShellGeometry(size, true);
    const bottomGeo = this.createShellGeometry(size, false);

    const top = new THREE.Group();
    const topOuter = new THREE.Mesh(topGeo, outerMaterial);
    const topInner = new THREE.Mesh(topGeo.clone(), interiorMaterial);
    topInner.scale.multiplyScalar(0.98);
    top.add(topOuter, topInner);

    const bottom = new THREE.Group();
    const bottomOuter = new THREE.Mesh(bottomGeo, outerMaterial);
    const bottomInner = new THREE.Mesh(bottomGeo.clone(), interiorMaterial);
    bottomInner.scale.multiplyScalar(0.98);
    bottom.add(bottomOuter, bottomInner);

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