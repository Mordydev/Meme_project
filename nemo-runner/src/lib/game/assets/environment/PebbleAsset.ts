import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { PebbleVisualConfig } from '../../config/gameConfig';

export class PebbleAsset {
  private group: THREE.Group;
  private readonly config: Readonly<PebbleVisualConfig>;

  constructor() {
    this.config = configSystem.get('visuals').pebbles;
    this.group = new THREE.Group();
    this.group.name = 'PebbleCluster';
    this.createPebbles();
  }

  private createPebbles(): void {
    const count = THREE.MathUtils.randInt(this.config.countMin, this.config.countMax);
    for (let i = 0; i < count; i++) {
      const radius = THREE.MathUtils.randFloat(this.config.sizeMin, this.config.sizeMax);
      const geometry = new THREE.SphereGeometry(radius, 4, 4); // Low poly sphere
      // Deform the sphere slightly for a more pebble-like shape
      const pos = geometry.attributes.position as THREE.BufferAttribute;
      const vert = new THREE.Vector3();
      const amp = radius * 0.3; // Max displacement amount
      for (let j = 0; j < pos.count; j++) {
        vert.fromBufferAttribute(pos, j);
        vert.x += (Math.random() - 0.5) * amp;
        vert.y += (Math.random() - 0.5) * amp * 0.5; // Less vertical displacement
        vert.z += (Math.random() - 0.5) * amp;
        pos.setXYZ(j, vert.x, vert.y, vert.z);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals(); // Recalculate normals after deformation

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.config.color),
        roughness: 0.9,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      // Distribute pebbles within a small area for a cluster effect
      mesh.position.set(
        THREE.MathUtils.randFloatSpread(this.config.sizeMax * count * 0.5), // Spread based on num pebbles and max size
        0, // Pebbles sit on the seafloor, y-offset applied by EnvironmentManager
        THREE.MathUtils.randFloatSpread(this.config.sizeMax * count * 0.5)
      );
      this.group.add(mesh);
    }
    this.group.userData = { type: 'environment', name: 'pebbleCluster', assetInstance: this };
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
    this.group.clear(); // Remove children from group
  }
} 